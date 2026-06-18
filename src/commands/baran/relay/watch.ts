import { runSwitchboardRelayWatch as defaultRunSwitchboardRelayWatchRunner } from "../../../switchboard-core/cli/src/index.js";
import { Command, Flags } from "@oclif/core";

type RunSwitchboardRelayWatch = (argv?: readonly string[]) => Promise<void>;

export interface SwitchboardRelayWatchOptions {
  runner?: RunSwitchboardRelayWatch;
  loadRunner?: () => Promise<RunSwitchboardRelayWatch | undefined>;
}

export default class SwitchboardRelayWatch extends Command {
  static description = [
    "Watch Baran relay health transitions.",
    "This native proof entrypoint calls the existing read-only baran relay watch implementation."
  ].join("\n");
  static examples = [
    "<%= config.bin %> baran relay watch",
    "<%= config.bin %> baran relay watch relay-d --max-runs 3 --interval-ms 5000",
    "<%= config.bin %> baran relay watch relay-d --max-runs 0"
  ];
  static flags = {
    help: Flags.help({
      char: "h"
    }),
    "interval-ms": Flags.string({
      description: "Delay between relay probe runs in milliseconds."
    }),
    "max-runs": Flags.string({
      description: "Maximum probe runs before exiting; 0 runs until interrupted."
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
  static summary = "Watch relay health transitions.";

  async run(): Promise<void> {
    this.parsed = true;
    if (this.argv.includes("--help") || this.argv.includes("-h")) {
      printSwitchboardRelayWatchHelp(this.config.bin);
      return;
    }
    const exitCode = await runSwitchboardRelayWatchNative(this.argv);
    if (exitCode !== 0) {
      this.exit(exitCode);
    }
  }
}

export async function runSwitchboardRelayWatchNative(
  argv: readonly string[],
  options: SwitchboardRelayWatchOptions = {}
): Promise<number> {
  const loadRunner = options.loadRunner ?? loadSwitchboardRelayWatchRunner;
  const runner = options.runner ?? await loadRunner();
  if (runner) {
    return runSwitchboardRelayWatchInProcess(runner, argv);
  }
  console.error("[baran] Error: internal proof baran runner runSwitchboardRelayWatch is unavailable.");
  return 1;
}

async function loadSwitchboardRelayWatchRunner(): Promise<RunSwitchboardRelayWatch | undefined> {
  return defaultRunSwitchboardRelayWatchRunner;
}

async function runSwitchboardRelayWatchInProcess(
  runner: RunSwitchboardRelayWatch,
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

function printSwitchboardRelayWatchHelp(bin: string): void {
  console.log(`Watch Baran relay health transitions.

USAGE
  $ ${bin} baran relay watch [relay-id] [options]

FLAGS
  --interval-ms <ms>    Delay between relay probe runs in milliseconds.
  --max-runs <n>        Maximum probe runs before exiting; 0 runs until interrupted.
  --ops-profile <name>  Baran ops profile for admin defaults.
  --profile <name>      Alias for --ops-profile.
  --project-dir <path>  Baran project directory.
  --context <name>      Baran context name for runtime defaults.

DESCRIPTION
  Reads the local relay catalog, probes each selected relay's /health,
  /v1/relay-status, and /v1/service-catalogs/relay endpoints, and prints a line
  whenever a relay changes between ok and fail. Passing a relay id limits the
  watch to that catalog member. The command performs network reads only; it
  does not mutate local files, publish catalogs, deploy jobs, submit
  transactions, change DNS, or change relay state.

EXAMPLES
  $ ${bin} baran relay watch
  $ ${bin} baran relay watch relay-d --max-runs 3 --interval-ms 5000
  $ ${bin} baran relay watch relay-d --max-runs 0`);
}
