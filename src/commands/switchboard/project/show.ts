import { runSwitchboardProjectShow as defaultRunSwitchboardProjectShowRunner } from "../../../switchboard-core/cli/src/index.js";
import { Command, Flags } from "@oclif/core";

type RunSwitchboardProjectShow = (argv?: readonly string[]) => Promise<void>;

export interface SwitchboardProjectShowOptions {
  runner?: RunSwitchboardProjectShow;
}

export default class SwitchboardProjectShow extends Command {
  static description = [
    "Show local Switchboard project config, latest deployment state, and selected context.",
    "This is a local read-only inspection command backed by the existing switchboard project show implementation."
  ].join("\n");
  static examples = [
    "<%= config.bin %> switchboard project show",
    "<%= config.bin %> switchboard project show --json",
    "<%= config.bin %> switchboard project show --project-dir ./app"
  ];
  static flags = {
    help: Flags.help({
      char: "h"
    }),
    json: Flags.boolean({
      description: "Print redacted machine-readable output."
    }),
    context: Flags.string({
      description: "Switchboard context name for runtime defaults."
    }),
    "project-dir": Flags.string({
      description: "Switchboard project directory."
    }),
    "no-project": Flags.boolean({
      description: "Ignore switchboard.json and .switchboard state."
    })
  };
  static strict = false;
  static summary = "Show local Switchboard project state.";

  async run(): Promise<void> {
    this.parsed = true;
    if (this.argv.includes("--help") || this.argv.includes("-h")) {
      printSwitchboardProjectShowHelp(this.config.bin);
      return;
    }
    const exitCode = await runSwitchboardProjectShowNative(this.argv);
    if (exitCode !== 0) {
      this.exit(exitCode);
    }
  }
}

export async function runSwitchboardProjectShowNative(
  argv: readonly string[],
  options: SwitchboardProjectShowOptions = {}
): Promise<number> {
  const runner = options.runner ?? await loadSwitchboardProjectShowRunner();
  if (runner) {
    return runSwitchboardProjectShowInProcess(runner, argv);
  }
  console.error("[switchboard] Error: internal proof switchboard runner runSwitchboardProjectShow is unavailable.");
  return 1;
}

async function loadSwitchboardProjectShowRunner(): Promise<RunSwitchboardProjectShow | undefined> {
  return defaultRunSwitchboardProjectShowRunner;
}

async function runSwitchboardProjectShowInProcess(
  runner: RunSwitchboardProjectShow,
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

function printSwitchboardProjectShowHelp(bin: string): void {
  console.log(`Show local Switchboard project state.

USAGE
  $ ${bin} switchboard project show [--json]

FLAGS
  --project-dir <path> Switchboard project directory.
  --context <name>     Switchboard context name for runtime defaults.
  --no-project         Ignore switchboard.json and .switchboard state.
  --json               Print redacted machine-readable output.

DESCRIPTION
  Read-only local project inspection. It prints the current switchboard.json,
  latest .switchboard deployment state, and selected context without deploying,
  spending, or mutating local state.

EXAMPLES
  $ ${bin} switchboard project show
  $ ${bin} switchboard project show --json
  $ ${bin} switchboard project show --project-dir ./app`);
}
