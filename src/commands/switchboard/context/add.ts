import { Command, Flags } from "@oclif/core";

import { runSwitchboardCompatibility } from "../../switchboard.js";

type RunSwitchboardContextAdd = (argv?: readonly string[]) => Promise<void>;
type RunSwitchboardCompatibility = (argv: readonly string[]) => Promise<number>;

export interface SwitchboardContextAddOptions {
  runner?: RunSwitchboardContextAdd;
  loadRunner?: () => Promise<RunSwitchboardContextAdd | undefined>;
  compatibilityRunner?: RunSwitchboardCompatibility;
}

export default class SwitchboardContextAdd extends Command {
  static description = [
    "Interactively create a Switchboard context.",
    "This is the native proof entrypoint for the existing interactive switchboard context add wizard."
  ].join("\n");
  static examples = [
    "<%= config.bin %> switchboard context add mainnet",
    "<%= config.bin %> switchboard context add --context mainnet --no-balance-check",
    "<%= config.bin %> switchboard context add mainnet --acurast-rpc wss://archive.mainnet.acurast.com"
  ];
  static flags = {
    help: Flags.help({
      char: "h"
    }),
    context: Flags.string({
      description: "Switchboard context name to create."
    }),
    "project-dir": Flags.string({
      description: "Switchboard project directory."
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
  static summary = "Interactively create a Switchboard context.";

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
  const compatibilityRunner = options.compatibilityRunner ?? runSwitchboardCompatibility;
  return compatibilityRunner(["context", "add", ...argv]);
}

async function loadSwitchboardContextAddRunner(): Promise<RunSwitchboardContextAdd | undefined> {
  try {
    const module = await import("@proof-computer/switchboard-cli");
    return typeof module.runSwitchboardContextAdd === "function"
      ? module.runSwitchboardContextAdd
      : undefined;
  } catch {
    return undefined;
  }
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

function printSwitchboardContextAddHelp(bin: string): void {
  console.log(`Interactively create a Switchboard context.

USAGE
  $ ${bin} switchboard context add [name]

FLAGS
  --context <name>       Switchboard context name to create.
  --project-dir <path>   Switchboard project directory.
  --no-project           Ignore switchboard.json and .switchboard state.
  --no-balance-check     Skip post-create balance checks.
  --acurast-rpc <url>    Acurast RPC URL for post-create balance checks.

DESCRIPTION
  Interactive context creation wizard. It prompts for deploy identity, payment
  signer defaults, and whether to select the new context.
  It requires a TTY and rejects --json; use context set for scripted updates.

EXAMPLES
  $ ${bin} switchboard context add mainnet
  $ ${bin} switchboard context add --context mainnet --no-balance-check
  $ ${bin} switchboard context add mainnet --acurast-rpc wss://archive.mainnet.acurast.com`);
}
