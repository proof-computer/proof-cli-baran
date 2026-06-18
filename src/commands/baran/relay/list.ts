import { runSwitchboardRelayList as defaultRunSwitchboardRelayListRunner } from "../../../switchboard-core/cli/src/index.js";
import { Command, Flags } from "@oclif/core";

type RunSwitchboardRelayList = (argv?: readonly string[]) => Promise<void>;

export interface SwitchboardRelayListOptions {
  runner?: RunSwitchboardRelayList;
  loadRunner?: () => Promise<RunSwitchboardRelayList | undefined>;
}

export default class SwitchboardRelayList extends Command {
  static aliases = [
    "baran relay ls"
  ];
  static description = [
    "List Baran relay inventory.",
    "This native proof entrypoint calls the existing read-only baran relay list implementation."
  ].join("\n");
  static examples = [
    "<%= config.bin %> baran relay list",
    "<%= config.bin %> baran relay list --json",
    "<%= config.bin %> baran relay list --source live --manifest-url https://control.switchboard.proof.computer/v1/network-manifest"
  ];
  static flags = {
    help: Flags.help({
      char: "h"
    }),
    source: Flags.string({
      description: "Inventory source: local or live."
    }),
    json: Flags.boolean({
      description: "Print machine-readable relay inventory."
    }),
    "manifest-url": Flags.string({
      description: "Signed network manifest URL for --source live."
    }),
    "manifest-signer": Flags.string({
      description: "Expected network manifest signer for --source live."
    }),
    "ops-profile": Flags.string({
      description: "Baran ops profile for admin defaults."
    }),
    profile: Flags.string({
      description: "Alias for --ops-profile."
    }),
    context: Flags.string({
      description: "Baran context name for runtime defaults."
    }),
    "project-dir": Flags.string({
      description: "Baran project directory."
    })
  };
  static strict = false;
  static summary = "List relay inventory.";

  async run(): Promise<void> {
    this.parsed = true;
    if (this.argv.includes("--help") || this.argv.includes("-h")) {
      printSwitchboardRelayListHelp(this.config.bin);
      return;
    }
    const exitCode = await runSwitchboardRelayListNative(this.argv);
    if (exitCode !== 0) {
      this.exit(exitCode);
    }
  }
}

export async function runSwitchboardRelayListNative(
  argv: readonly string[],
  options: SwitchboardRelayListOptions = {}
): Promise<number> {
  const loadRunner = options.loadRunner ?? loadSwitchboardRelayListRunner;
  const runner = options.runner ?? await loadRunner();
  if (runner) {
    return runSwitchboardRelayListInProcess(runner, argv);
  }
  console.error("[baran] Error: internal proof baran runner runSwitchboardRelayList is unavailable.");
  return 1;
}

async function loadSwitchboardRelayListRunner(): Promise<RunSwitchboardRelayList | undefined> {
  return defaultRunSwitchboardRelayListRunner;
}

async function runSwitchboardRelayListInProcess(
  runner: RunSwitchboardRelayList,
  argv: readonly string[]
): Promise<number> {
  try {
    await runner(argv);
    return typeof process.exitCode === "number" ? process.exitCode : 0;
  } catch (error) {
    if (!switchboardOutputHandled(error)) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`[baran] ${message}`);
    }
    return 1;
  }
}

function switchboardOutputHandled(error: unknown): boolean {
  return Boolean(
    error &&
      typeof error === "object" &&
      (error as { switchboardOutputHandled?: boolean }).switchboardOutputHandled
  );
}

function printSwitchboardRelayListHelp(bin: string): void {
  console.log(`List Baran relay inventory.

USAGE
  $ ${bin} baran relay list [options]
  $ ${bin} baran relay ls [options]

FLAGS
  --source <local|live>    Inventory source. Defaults to local.
  --json                  Print machine-readable relay inventory.
  --manifest-url <url>    Signed network manifest URL for --source live.
  --manifest-signer <id>  Expected network manifest signer for --source live.
  --ops-profile <name>    Baran ops profile for admin defaults.
  --profile <name>        Alias for --ops-profile.
  --project-dir <path>    Baran project directory.
  --context <name>        Baran context name for runtime defaults.

DESCRIPTION
  Reads local relay catalog/spec files by default. With --source live, reads the
  signed network manifest and relay service catalog. The command performs local
  file reads and optional network reads only; it does not mutate local files,
  publish catalogs, deploy jobs, submit transactions, or change relay state.

EXAMPLES
  $ ${bin} baran relay list
  $ ${bin} baran relay list --json
  $ ${bin} baran relay list --source live --manifest-url https://control.switchboard.proof.computer/v1/network-manifest`);
}
