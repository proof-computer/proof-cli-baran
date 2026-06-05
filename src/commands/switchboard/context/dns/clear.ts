import { runSwitchboardContextDnsClear as defaultRunSwitchboardContextDnsClearRunner } from "../../../../switchboard-core/cli/src/index.js";
import { Command, Flags } from "@oclif/core";

type RunSwitchboardContextDnsClear = (argv?: readonly string[]) => Promise<void>;

export interface SwitchboardContextDnsClearOptions {
  runner?: RunSwitchboardContextDnsClear;
  loadRunner?: () => Promise<RunSwitchboardContextDnsClear | undefined>;
}

export default class SwitchboardContextDnsClear extends Command {
  static aliases = [
    "switchboard context dns remove",
    "switchboard context dns rm"
  ];
  static description = [
    "Detach a DNS provider from a Switchboard context.",
    "This is a PROOF support/admin context-store mutation, not normal builder setup."
  ].join("\n");
  static examples = [
    "<%= config.bin %> switchboard context dns clear",
    "<%= config.bin %> switchboard context dns clear cloudflare --context mainnet",
    "<%= config.bin %> switchboard context dns remove cloudflare --json"
  ];
  static flags = {
    help: Flags.help({
      char: "h"
    }),
    json: Flags.boolean({
      description: "Print sanitized machine-readable output."
    }),
    context: Flags.string({
      description: "Switchboard context name to update."
    }),
    "project-dir": Flags.string({
      description: "Switchboard project directory."
    }),
    "no-project": Flags.boolean({
      description: "Ignore switchboard.json and .switchboard state."
    })
  };
  static strict = false;
  static summary = "Detach a DNS provider from a Switchboard context.";

  async run(): Promise<void> {
    this.parsed = true;
    if (this.argv.includes("--help") || this.argv.includes("-h")) {
      printSwitchboardContextDnsClearHelp(this.config.bin);
      return;
    }
    const exitCode = await runSwitchboardContextDnsClearNative(this.argv);
    if (exitCode !== 0) {
      this.exit(exitCode);
    }
  }
}

export async function runSwitchboardContextDnsClearNative(
  argv: readonly string[],
  options: SwitchboardContextDnsClearOptions = {}
): Promise<number> {
  const loadRunner = options.loadRunner ?? loadSwitchboardContextDnsClearRunner;
  const runner = options.runner ?? await loadRunner();
  if (runner) {
    return runSwitchboardContextDnsClearInProcess(runner, argv);
  }
  console.error("[switchboard] Error: internal proof switchboard runner runSwitchboardContextDnsClear is unavailable.");
  return 1;
}

async function loadSwitchboardContextDnsClearRunner(): Promise<RunSwitchboardContextDnsClear | undefined> {
  return defaultRunSwitchboardContextDnsClearRunner;
}

async function runSwitchboardContextDnsClearInProcess(
  runner: RunSwitchboardContextDnsClear,
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

function printSwitchboardContextDnsClearHelp(bin: string): void {
  console.log(`Detach a DNS provider from a Switchboard context.

This is a PROOF support/admin command. Normal app deploys and customer-domain
setup do not require DNS provider tokens.

USAGE
  $ ${bin} switchboard context dns clear [provider]

ALIASES
  $ ${bin} switchboard context dns remove [provider]
  $ ${bin} switchboard context dns rm [provider]

FLAGS
  --context <name>     Switchboard context name to update.
  --project-dir <path> Switchboard project directory.
  --no-project         Ignore switchboard.json and .switchboard state.
  --json               Print sanitized machine-readable output.

DESCRIPTION
  Local context-store mutation. It removes the DNS provider token env var name
  from the selected context. The provider defaults to cloudflare for this
  support/admin path.

EXAMPLES
  $ ${bin} switchboard context dns clear
  $ ${bin} switchboard context dns clear cloudflare --context mainnet
  $ ${bin} switchboard context dns remove cloudflare --json`);
}
