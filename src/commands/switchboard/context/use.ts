import { runSwitchboardContextUse as defaultRunSwitchboardContextUseRunner } from "../../../switchboard-core/cli/src/index.js";
import { Command, Flags } from "@oclif/core";

type RunSwitchboardContextUse = (argv?: readonly string[]) => Promise<void>;

export interface SwitchboardContextUseOptions {
  runner?: RunSwitchboardContextUse;
  loadRunner?: () => Promise<RunSwitchboardContextUse | undefined>;
}

export default class SwitchboardContextUse extends Command {
  static description = [
    "Select the current Switchboard context.",
    "This is a local context-store mutation backed by the existing switchboard context use implementation."
  ].join("\n");
  static examples = [
    "<%= config.bin %> switchboard context use mainnet",
    "<%= config.bin %> switchboard context use mainnet --json",
    "<%= config.bin %> switchboard context use --context mainnet"
  ];
  static flags = {
    help: Flags.help({
      char: "h"
    }),
    json: Flags.boolean({
      description: "Print machine-readable output."
    }),
    context: Flags.string({
      description: "Switchboard context name to select."
    }),
    "project-dir": Flags.string({
      description: "Switchboard project directory."
    }),
    "no-project": Flags.boolean({
      description: "Ignore switchboard.json and .switchboard state."
    })
  };
  static strict = false;
  static summary = "Select the current Switchboard context.";

  async run(): Promise<void> {
    this.parsed = true;
    if (this.argv.includes("--help") || this.argv.includes("-h")) {
      printSwitchboardContextUseHelp(this.config.bin);
      return;
    }
    const exitCode = await runSwitchboardContextUseNative(this.argv);
    if (exitCode !== 0) {
      this.exit(exitCode);
    }
  }
}

export async function runSwitchboardContextUseNative(
  argv: readonly string[],
  options: SwitchboardContextUseOptions = {}
): Promise<number> {
  const loadRunner = options.loadRunner ?? loadSwitchboardContextUseRunner;
  const runner = options.runner ?? await loadRunner();
  if (runner) {
    return runSwitchboardContextUseInProcess(runner, argv);
  }
  console.error("[switchboard] Error: internal proof switchboard runner runSwitchboardContextUse is unavailable.");
  return 1;
}

async function loadSwitchboardContextUseRunner(): Promise<RunSwitchboardContextUse | undefined> {
  return defaultRunSwitchboardContextUseRunner;
}

async function runSwitchboardContextUseInProcess(
  runner: RunSwitchboardContextUse,
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

function printSwitchboardContextUseHelp(bin: string): void {
  console.log(`Select the current Switchboard context.

USAGE
  $ ${bin} switchboard context use <name> [--json]

FLAGS
  --context <name>     Switchboard context name to select.
  --project-dir <path> Switchboard project directory.
  --no-project         Ignore switchboard.json and .switchboard state.
  --json               Print machine-readable output.

DESCRIPTION
  Local context-store mutation. It marks an existing builder context as the
  global current context. It does not create contexts, edit context defaults,
  configure DNS, or contact the network.

EXAMPLES
  $ ${bin} switchboard context use mainnet
  $ ${bin} switchboard context use mainnet --json
  $ ${bin} switchboard context use --context mainnet`);
}
