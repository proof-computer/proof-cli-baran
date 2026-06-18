import { runSwitchboardRelayDiff as defaultRunSwitchboardRelayDiffRunner } from "../../../switchboard-core/cli/src/index.js";
import { Command, Flags } from "@oclif/core";

type RunSwitchboardRelayDiff = (argv?: readonly string[]) => Promise<void>;

export interface SwitchboardRelayDiffOptions {
  runner?: RunSwitchboardRelayDiff;
  loadRunner?: () => Promise<RunSwitchboardRelayDiff | undefined>;
}

export default class SwitchboardRelayDiff extends Command {
  static description = [
    "Compare local Baran relay inventory with live discovery.",
    "This native proof entrypoint calls the existing read-only baran relay diff implementation."
  ].join("\n");
  static examples = [
    "<%= config.bin %> baran relay diff",
    "<%= config.bin %> baran relay diff --json",
    "<%= config.bin %> baran relay diff --manifest-url https://control.switchboard.proof.computer/v1/network-manifest"
  ];
  static flags = {
    help: Flags.help({
      char: "h"
    }),
    json: Flags.boolean({
      description: "Print machine-readable relay diff output."
    }),
    "manifest-url": Flags.string({
      description: "Signed network manifest URL for live relay discovery."
    }),
    "manifest-signer": Flags.string({
      description: "Expected network manifest signer for live relay discovery."
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
  static summary = "Compare local and live relay inventory.";

  async run(): Promise<void> {
    this.parsed = true;
    if (this.argv.includes("--help") || this.argv.includes("-h")) {
      printSwitchboardRelayDiffHelp(this.config.bin);
      return;
    }
    const exitCode = await runSwitchboardRelayDiffNative(this.argv);
    if (exitCode !== 0) {
      this.exit(exitCode);
    }
  }
}

export async function runSwitchboardRelayDiffNative(
  argv: readonly string[],
  options: SwitchboardRelayDiffOptions = {}
): Promise<number> {
  const loadRunner = options.loadRunner ?? loadSwitchboardRelayDiffRunner;
  const runner = options.runner ?? await loadRunner();
  if (runner) {
    return runSwitchboardRelayDiffInProcess(runner, argv);
  }
  console.error("[baran] Error: internal proof baran runner runSwitchboardRelayDiff is unavailable.");
  return 1;
}

async function loadSwitchboardRelayDiffRunner(): Promise<RunSwitchboardRelayDiff | undefined> {
  return defaultRunSwitchboardRelayDiffRunner;
}

async function runSwitchboardRelayDiffInProcess(
  runner: RunSwitchboardRelayDiff,
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

function printSwitchboardRelayDiffHelp(bin: string): void {
  console.log(`Compare local Baran relay inventory with live discovery.

USAGE
  $ ${bin} baran relay diff [options]

FLAGS
  --json                  Print machine-readable relay diff output.
  --manifest-url <url>    Signed network manifest URL for live relay discovery.
  --manifest-signer <id>  Expected network manifest signer for live relay discovery.
  --ops-profile <name>    Baran ops profile for admin defaults.
  --profile <name>        Alias for --ops-profile.
  --project-dir <path>    Baran project directory.
  --context <name>        Baran context name for runtime defaults.

DESCRIPTION
  Reads local relays/catalog.json, then reads the signed live network manifest
  and relay service catalog. It reports relays that would be added, removed, or
  changed if the local inventory were applied. The command performs local file
  reads and network reads only; it does not mutate local files, publish
  catalogs, deploy jobs, submit transactions, or change relay state.

EXAMPLES
  $ ${bin} baran relay diff
  $ ${bin} baran relay diff --json
  $ ${bin} baran relay diff --manifest-url https://control.switchboard.proof.computer/v1/network-manifest`);
}
