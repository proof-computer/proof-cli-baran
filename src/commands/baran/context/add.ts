import { runSwitchboardContextAdd as defaultRunSwitchboardContextAddRunner } from "../../../switchboard-core/cli/src/index.js";
import { Command, Flags } from "@oclif/core";

type RunSwitchboardContextAdd = (argv?: readonly string[]) => Promise<void>;

export interface SwitchboardContextAddOptions {
  runner?: RunSwitchboardContextAdd;
  loadRunner?: () => Promise<RunSwitchboardContextAdd | undefined>;
}

export default class SwitchboardContextAdd extends Command {
  static description = [
    "Interactively create a Baran context.",
    "This is the native proof entrypoint for the existing interactive baran context add wizard."
  ].join("\n");
  static examples = [
    "<%= config.bin %> baran context add mainnet",
    "<%= config.bin %> baran context add --context mainnet --no-balance-check",
    "<%= config.bin %> baran context add mainnet --acurast-rpc wss://archive.mainnet.acurast.com"
  ];
  static flags = {
    help: Flags.help({
      char: "h"
    }),
    context: Flags.string({
      description: "Baran context name to create."
    }),
    "project-dir": Flags.string({
      description: "Baran project directory."
    }),
    "no-project": Flags.boolean({
      description: "Ignore switchboard.json and .switchboard state."
    }),
    "no-balance-check": Flags.boolean({
      description: "Skip post-create balance checks."
    }),
    "acurast-rpc": Flags.string({
      description: "Acurast RPC URL for post-create balance checks."
    }),
    json: Flags.boolean({
      description: "Rejected by the interactive wizard; use context set for scripted updates."
    })
  };
  static strict = false;
  static summary = "Interactively create a Baran context.";

  async run(): Promise<void> {
    this.parsed = true;
    if (this.argv.includes("--help") || this.argv.includes("-h")) {
      printSwitchboardContextAddHelp(this.config.bin);
      return;
    }
    const exitCode = await runSwitchboardContextAddNative(this.argv);
    if (exitCode !== 0) {
      this.exit(exitCode);
    }
  }
}

export async function runSwitchboardContextAddNative(
  argv: readonly string[],
  options: SwitchboardContextAddOptions = {}
): Promise<number> {
  const loadRunner = options.loadRunner ?? loadSwitchboardContextAddRunner;
  const runner = options.runner ?? await loadRunner();
  if (runner) {
    return runSwitchboardContextAddInProcess(runner, argv);
  }
  console.error("[baran] Error: internal proof baran runner runSwitchboardContextAdd is unavailable.");
  return 1;
}

async function loadSwitchboardContextAddRunner(): Promise<RunSwitchboardContextAdd | undefined> {
  return defaultRunSwitchboardContextAddRunner;
}

async function runSwitchboardContextAddInProcess(
  runner: RunSwitchboardContextAdd,
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

function printSwitchboardContextAddHelp(bin: string): void {
  console.log(`Interactively create a Baran context.

USAGE
  $ ${bin} baran context add [name]

FLAGS
  --context <name>       Baran context name to create.
  --project-dir <path>   Baran project directory.
  --no-project           Ignore switchboard.json and .switchboard state.
  --no-balance-check     Skip post-create balance checks.
  --acurast-rpc <url>    Acurast RPC URL for post-create balance checks.

DESCRIPTION
  Interactive context creation wizard. It prompts for deploy identity, payment
  signer defaults, and whether to select the new context.
  It requires a TTY and rejects --json; use context set for scripted updates.

EXAMPLES
  $ ${bin} baran context add mainnet
  $ ${bin} baran context add --context mainnet --no-balance-check
  $ ${bin} baran context add mainnet --acurast-rpc wss://archive.mainnet.acurast.com`);
}
