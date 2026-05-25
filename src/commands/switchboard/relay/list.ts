import { Command, Flags } from "@oclif/core";

import { runSwitchboardCompatibility } from "../../switchboard.js";

type RunSwitchboardRelayList = (argv?: readonly string[]) => Promise<void>;
type RunSwitchboardCompatibility = (argv: readonly string[]) => Promise<number>;

export interface SwitchboardRelayListOptions {
  runner?: RunSwitchboardRelayList;
  loadRunner?: () => Promise<RunSwitchboardRelayList | undefined>;
  compatibilityRunner?: RunSwitchboardCompatibility;
}

export default class SwitchboardRelayList extends Command {
  static aliases = [
    "switchboard relay ls"
  ];
  static description = [
    "List Switchboard relay inventory.",
    "This native proof entrypoint calls the existing read-only switchboard relay list implementation."
  ].join("\n");
  static examples = [
    "<%= config.bin %> switchboard relay list",
    "<%= config.bin %> switchboard relay list --json",
    "<%= config.bin %> switchboard relay list --source live --manifest-url https://control.switchboard.proof.computer/v1/network-manifest"
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
      description: "Switchboard ops profile for admin defaults."
    }),
    profile: Flags.string({
      description: "Alias for --ops-profile."
    }),
    context: Flags.string({
      description: "Switchboard context name for runtime defaults."
    }),
    "project-dir": Flags.string({
      description: "Switchboard project directory."
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
  const compatibilityRunner = options.compatibilityRunner ?? runSwitchboardCompatibility;
  return compatibilityRunner(["relay", "list", ...argv]);
}

async function loadSwitchboardRelayListRunner(): Promise<RunSwitchboardRelayList | undefined> {
  try {
    const module = await import("@proof-computer/switchboard-cli");
    return typeof module.runSwitchboardRelayList === "function"
      ? module.runSwitchboardRelayList
      : undefined;
  } catch {
    return undefined;
  }
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
      console.error(`[switchboard] ${message}`);
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
  console.log(`List Switchboard relay inventory.

USAGE
  $ ${bin} switchboard relay list [options]
  $ ${bin} switchboard relay ls [options]

FLAGS
  --source <local|live>    Inventory source. Defaults to local.
  --json                  Print machine-readable relay inventory.
  --manifest-url <url>    Signed network manifest URL for --source live.
  --manifest-signer <id>  Expected network manifest signer for --source live.
  --ops-profile <name>    Switchboard ops profile for admin defaults.
  --profile <name>        Alias for --ops-profile.
  --project-dir <path>    Switchboard project directory.
  --context <name>        Switchboard context name for runtime defaults.

DESCRIPTION
  Reads local relay catalog/spec files by default. With --source live, reads the
  signed network manifest and relay service catalog. The command performs local
  file reads and optional network reads only; it does not mutate local files,
  publish catalogs, deploy jobs, submit transactions, or change relay state.

EXAMPLES
  $ ${bin} switchboard relay list
  $ ${bin} switchboard relay list --json
  $ ${bin} switchboard relay list --source live --manifest-url https://control.switchboard.proof.computer/v1/network-manifest`);
}
