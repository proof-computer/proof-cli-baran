import { Command, Flags } from "@oclif/core";

import { runSwitchboardCompatibility } from "../../switchboard.js";

type RunSwitchboardRefundable = (argv?: readonly string[]) => Promise<void>;
type RunSwitchboardCompatibility = (argv: readonly string[]) => Promise<number>;

export interface SwitchboardSessionRefundableOptions {
  runner?: RunSwitchboardRefundable;
  loadRunner?: () => Promise<RunSwitchboardRefundable | undefined>;
  compatibilityRunner?: RunSwitchboardCompatibility;
}

export default class SwitchboardSessionRefundable extends Command {
  static description = [
    "Check whether a Switchboard developer session has an available refund without submitting a transaction.",
    "This native proof entrypoint calls the existing advanced switchboard session refundable implementation."
  ].join("\n");
  static examples = [
    "<%= config.bin %> switchboard session refundable --session-id 0x...",
    "<%= config.bin %> switchboard session refundable --report report.json --json",
    "<%= config.bin %> switchboard session refundable --session-id 0x... --refund-reason activation-timeout"
  ];
  static flags = sessionRefundableFlags();
  static strict = false;
  static summary = "Check Switchboard refundable session state.";

  async run(): Promise<void> {
    this.parsed = true;
    if (this.argv.includes("--help") || this.argv.includes("-h")) {
      printSwitchboardSessionRefundableHelp(this.config.bin);
      return;
    }
    const exitCode = await runSwitchboardSessionRefundableNative(this.argv);
    if (exitCode !== 0) {
      this.exit(exitCode);
    }
  }
}

export async function runSwitchboardSessionRefundableNative(
  argv: readonly string[],
  options: SwitchboardSessionRefundableOptions = {}
): Promise<number> {
  const loadRunner = options.loadRunner ?? loadSwitchboardRefundableRunner;
  const runner = options.runner ?? await loadRunner();
  if (runner) {
    return runSwitchboardSessionRefundableInProcess(runner, argv);
  }
  const compatibilityRunner = options.compatibilityRunner ?? runSwitchboardCompatibility;
  return compatibilityRunner(["session", "refundable", ...argv]);
}

async function loadSwitchboardRefundableRunner(): Promise<RunSwitchboardRefundable | undefined> {
  try {
    const module = await import("@proof-computer/switchboard-cli");
    return typeof module.runSwitchboardRefundable === "function"
      ? module.runSwitchboardRefundable
      : undefined;
  } catch {
    return undefined;
  }
}

async function runSwitchboardSessionRefundableInProcess(
  runner: RunSwitchboardRefundable,
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

function sessionRefundableFlags() {
  return {
    help: Flags.help({
      char: "h"
    }),
    json: Flags.boolean({
      description: "Print machine-readable output."
    }),
    report: Flags.string({
      description: "Deployment report JSON containing the session ID."
    }),
    "session-id": Flags.string({
      description: "Hub session ID to inspect."
    }),
    "refund-reason": Flags.string({
      description: "Refund path to inspect: activation-timeout or unfulfilled."
    }),
    reason: Flags.string({
      description: "Alias for --refund-reason."
    }),
    context: Flags.string({
      description: "Switchboard context name for runtime defaults."
    }),
    "project-dir": Flags.string({
      description: "Switchboard project directory."
    }),
    target: Flags.string({
      description: "Switchboard target, for example polkadot-hub."
    }),
    "manifest-url": Flags.string({
      description: "Network manifest path or URL."
    }),
    "manifest-signer": Flags.string({
      description: "Expected signed manifest signer."
    }),
    "allow-expired-manifest": Flags.boolean({
      description: "Accept an expired manifest for diagnostics only."
    }),
    registry: Flags.string({
      description: "IngressRegistry contract address."
    }),
    "eth-rpc-url": Flags.string({
      description: "Hub Ethereum JSON-RPC URL."
    }),
    "substrate-ws-url": Flags.string({
      description: "Hub Substrate WebSocket URL."
    }),
    "hub-signer": Flags.string({
      description: "Optional signer mode for gas estimation only."
    }),
    "developer-private-key-env": Flags.string({
      description: "Env var containing the EVM developer key for gas estimation only."
    }),
    "polkadot-signer": Flags.string({
      description: "Native signer mode: seed or ledger."
    }),
    ledger: Flags.boolean({
      description: "Alias for --polkadot-signer ledger."
    }),
    yes: Flags.boolean({
      description: "Accepted for compatibility; refundable is always read-only."
    })
  };
}

function printSwitchboardSessionRefundableHelp(bin: string): void {
  console.log(`Check Switchboard refundable session state.

USAGE
  $ ${bin} switchboard session refundable --session-id <bytes32> [--json]
  $ ${bin} switchboard session refundable --report <path> [--json]

FLAGS
  --session-id <bytes32>       Hub session ID to inspect.
  --report <path>              Deployment report JSON containing the session ID.
  --refund-reason <reason>     Refund path to inspect: activation-timeout or unfulfilled.
  --reason <reason>            Alias for --refund-reason.
  --project-dir <path>         Switchboard project directory.
  --context <name>             Switchboard context name for runtime defaults.
  --target <name>              Switchboard target, for example polkadot-hub.
  --manifest-url <url>         Network manifest path or URL.
  --manifest-signer <signer>   Expected signed manifest signer.
  --allow-expired-manifest     Accept an expired manifest for diagnostics only.
  --registry <address>         IngressRegistry contract address.
  --eth-rpc-url <url>          Hub Ethereum JSON-RPC URL.
  --substrate-ws-url <url>     Hub Substrate WebSocket URL.
  --hub-signer <mode>          Optional signer mode for gas estimation only.
  --developer-private-key-env <env>
                              Env var containing the EVM developer key for gas estimation only.
  --polkadot-signer <mode>     Native signer mode: seed or ledger.
  --ledger                     Alias for --polkadot-signer ledger.
  --yes                        Accepted for compatibility; refundable is always read-only.
  --json                       Print machine-readable output.

DESCRIPTION
  Read-only refund accounting inspection. It checks whether a developer session
  can be refunded through refundAfterActivationTimeout or refundUnfulfilled.
  It never submits either refund transaction, even if --yes is present.

EXAMPLES
  $ ${bin} switchboard session refundable --session-id 0x...
  $ ${bin} switchboard session refundable --report report.json --json
  $ ${bin} switchboard session refundable --session-id 0x... --refund-reason activation-timeout`);
}
