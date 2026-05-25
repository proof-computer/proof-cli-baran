import { Command, Flags } from "@oclif/core";

import { runSwitchboardCompatibility } from "../../../switchboard.js";

type RunSwitchboardContextDnsSet = (argv?: readonly string[]) => Promise<void>;
type RunSwitchboardCompatibility = (argv: readonly string[]) => Promise<number>;

export interface SwitchboardContextDnsSetOptions {
  runner?: RunSwitchboardContextDnsSet;
  loadRunner?: () => Promise<RunSwitchboardContextDnsSet | undefined>;
  compatibilityRunner?: RunSwitchboardCompatibility;
}

export default class SwitchboardContextDnsSet extends Command {
  static description = [
    "Attach a DNS provider to a Switchboard context.",
    "This is a PROOF support/admin context-store mutation, not normal builder setup."
  ].join("\n");
  static examples = [
    "<%= config.bin %> switchboard context dns set cloudflare --token-env CF_TOKEN_PROD --context mainnet",
    "<%= config.bin %> switchboard context dns set cloudflare --token-env CF_TOKEN_PROD --json"
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
    }),
    "token-env": Flags.string({
      description: "Environment variable containing the PROOF/internal provider API token."
    }),
    verbose: Flags.boolean({
      description: "Print the stored token env var name in human output."
    })
  };
  static strict = false;
  static summary = "Attach a DNS provider to a Switchboard context.";

  async run(): Promise<void> {
    this.parsed = true;
    if (this.argv.includes("--help") || this.argv.includes("-h")) {
      printSwitchboardContextDnsSetHelp(this.config.bin);
      return;
    }
    const exitCode = await runSwitchboardContextDnsSetNative(this.argv);
    if (exitCode !== 0) {
      this.exit(exitCode);
    }
  }
}

export async function runSwitchboardContextDnsSetNative(
  argv: readonly string[],
  options: SwitchboardContextDnsSetOptions = {}
): Promise<number> {
  const loadRunner = options.loadRunner ?? loadSwitchboardContextDnsSetRunner;
  const runner = options.runner ?? await loadRunner();
  if (runner) {
    return runSwitchboardContextDnsSetInProcess(runner, argv);
  }
  const compatibilityRunner = options.compatibilityRunner ?? runSwitchboardCompatibility;
  return compatibilityRunner(["context", "dns", "set", ...argv]);
}

async function loadSwitchboardContextDnsSetRunner(): Promise<RunSwitchboardContextDnsSet | undefined> {
  try {
    const module = await import("@proof-computer/switchboard-cli");
    return typeof module.runSwitchboardContextDnsSet === "function"
      ? module.runSwitchboardContextDnsSet
      : undefined;
  } catch {
    return undefined;
  }
}

async function runSwitchboardContextDnsSetInProcess(
  runner: RunSwitchboardContextDnsSet,
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

function printSwitchboardContextDnsSetHelp(bin: string): void {
  console.log(`Attach a DNS provider to a Switchboard context.

This is a PROOF support/admin command. Normal app deploys and customer-domain
setup do not require DNS provider tokens.

USAGE
  $ ${bin} switchboard context dns set cloudflare --token-env <NAME>

FLAGS
  --context <name>     Switchboard context name to update.
  --project-dir <path> Switchboard project directory.
  --no-project         Ignore switchboard.json and .switchboard state.
  --token-env <name>   Environment variable containing the PROOF/internal provider API token.
  --json               Print sanitized machine-readable output.
  --verbose            Print the stored token env var name in human output.

DESCRIPTION
  Local context-store mutation. It stores the DNS provider token env var name
  on the selected context. Cloudflare is the only supported provider for this
  support/admin path.

EXAMPLES
  $ ${bin} switchboard context dns set cloudflare --token-env CF_TOKEN_PROD --context mainnet
  $ ${bin} switchboard context dns set cloudflare --token-env CF_TOKEN_PROD --json`);
}
