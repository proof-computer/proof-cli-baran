import { Command, Flags } from "@oclif/core";

import { runSwitchboardCompatibility } from "../../switchboard.js";

type RunSwitchboardContextCurrent = (argv?: readonly string[]) => Promise<void>;

export interface SwitchboardContextCurrentOptions {
  runner?: RunSwitchboardContextCurrent;
}

export default class SwitchboardContextCurrent extends Command {
  static description = [
    "Show the selected Switchboard context.",
    "This is a local read-only inspection command backed by the existing switchboard context current implementation."
  ].join("\n");
  static examples = [
    "<%= config.bin %> switchboard context current",
    "<%= config.bin %> switchboard context current --json",
    "<%= config.bin %> switchboard context current --context mainnet"
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
  static summary = "Show the current Switchboard context.";

  async run(): Promise<void> {
    this.parsed = true;
    if (this.argv.includes("--help") || this.argv.includes("-h")) {
      printSwitchboardContextCurrentHelp(this.config.bin);
      return;
    }
    const exitCode = await runSwitchboardContextCurrentNative(this.argv);
    if (exitCode !== 0) {
      this.exit(exitCode);
    }
  }
}

export async function runSwitchboardContextCurrentNative(
  argv: readonly string[],
  options: SwitchboardContextCurrentOptions = {}
): Promise<number> {
  const runner = options.runner ?? await loadSwitchboardContextCurrentRunner();
  if (runner) {
    return runSwitchboardContextCurrentInProcess(runner, argv);
  }
  return runSwitchboardCompatibility(["context", "current", ...argv]);
}

async function loadSwitchboardContextCurrentRunner(): Promise<RunSwitchboardContextCurrent | undefined> {
  try {
    const module = await import("@proof-computer/switchboard-cli");
    return typeof module.runSwitchboardContextCurrent === "function"
      ? module.runSwitchboardContextCurrent
      : undefined;
  } catch {
    return undefined;
  }
}

async function runSwitchboardContextCurrentInProcess(
  runner: RunSwitchboardContextCurrent,
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

function printSwitchboardContextCurrentHelp(bin: string): void {
  console.log(`Show the current Switchboard context.

USAGE
  $ ${bin} switchboard context current [--json]

FLAGS
  --project-dir <path> Switchboard project directory.
  --context <name>     Switchboard context name for runtime defaults.
  --no-project         Ignore switchboard.json and .switchboard state.
  --json               Print sanitized machine-readable output.

DESCRIPTION
  Read-only local context inspection. It prints the selected context name,
  whether it came from project or global selection, and sanitized context
  defaults. It does not add, select, or edit contexts.

EXAMPLES
  $ ${bin} switchboard context current
  $ ${bin} switchboard context current --json
  $ ${bin} switchboard context current --context mainnet`);
}
