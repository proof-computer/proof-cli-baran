import { runSwitchboardContextList as defaultRunSwitchboardContextListRunner } from "../../../switchboard-core/cli/src/index.js";
import { Command, Flags } from "@oclif/core";

type RunSwitchboardContextList = (argv?: readonly string[]) => Promise<void>;

export interface SwitchboardContextListOptions {
  runner?: RunSwitchboardContextList;
}

export default class SwitchboardContextList extends Command {
  static description = [
    "List configured Switchboard contexts.",
    "This is a local read-only inspection command backed by the existing switchboard context list implementation."
  ].join("\n");
  static examples = [
    "<%= config.bin %> switchboard context list",
    "<%= config.bin %> switchboard context list --json",
    "<%= config.bin %> switchboard context list --project-dir ./app"
  ];
  static flags = {
    help: Flags.help({
      char: "h"
    }),
    json: Flags.boolean({
      description: "Print sanitized machine-readable output."
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
  static summary = "List Switchboard contexts.";

  async run(): Promise<void> {
    this.parsed = true;
    if (this.argv.includes("--help") || this.argv.includes("-h")) {
      printSwitchboardContextListHelp(this.config.bin);
      return;
    }
    const exitCode = await runSwitchboardContextListNative(this.argv);
    if (exitCode !== 0) {
      this.exit(exitCode);
    }
  }
}

export async function runSwitchboardContextListNative(
  argv: readonly string[],
  options: SwitchboardContextListOptions = {}
): Promise<number> {
  const runner = options.runner ?? await loadSwitchboardContextListRunner();
  if (runner) {
    return runSwitchboardContextListInProcess(runner, argv);
  }
  console.error("[switchboard] Error: internal proof switchboard runner runSwitchboardContextList is unavailable.");
  return 1;
}

async function loadSwitchboardContextListRunner(): Promise<RunSwitchboardContextList | undefined> {
  return defaultRunSwitchboardContextListRunner;
}

async function runSwitchboardContextListInProcess(
  runner: RunSwitchboardContextList,
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

function printSwitchboardContextListHelp(bin: string): void {
  console.log(`List Switchboard contexts.

USAGE
  $ ${bin} switchboard context list [--json]

FLAGS
  --project-dir <path> Switchboard project directory.
  --context <name>     Switchboard context name for runtime defaults.
  --no-project         Ignore switchboard.json and .switchboard state.
  --json               Print sanitized machine-readable output.

DESCRIPTION
  Read-only local context inspection. It lists configured builder contexts,
  marks the global current context and project-selected context, and sanitizes
  removed administrative fields from machine-readable output. It does not add,
  select, or edit contexts.

EXAMPLES
  $ ${bin} switchboard context list
  $ ${bin} switchboard context list --json
  $ ${bin} switchboard context list --project-dir ./app`);
}
