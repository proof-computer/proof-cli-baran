import { runSwitchboardRefundable as defaultRunSwitchboardRefundableRunner } from "../../../switchboard-core/cli/src/index.js";
import { Command, Flags } from "@oclif/core";

type RunSwitchboardRefundable = (argv?: readonly string[]) => Promise<void>;

export interface SwitchboardSessionRefundableOptions {
  runner?: RunSwitchboardRefundable;
  loadRunner?: () => Promise<RunSwitchboardRefundable | undefined>;
}

export default class SwitchboardSessionRefundable extends Command {
  static description = [
    "Check whether a Baran developer session has an available refund without submitting a transaction.",
    "This native proof entrypoint calls the existing advanced baran session refundable implementation."
  ].join("\n");
  static examples = [
    "<%= config.bin %> baran session refundable --session-id 0x...",
    "<%= config.bin %> baran session refundable --report report.json --json",
    "<%= config.bin %> baran session refundable --session-id 0x... --refund-reason activation-timeout"
  ];
  static flags = sessionRefundableFlags();
  static strict = false;
  static summary = "Check Baran refundable session state.";

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
  console.error("[baran] Error: internal proof baran runner runSwitchboardRefundable is unavailable.");
  return 1;
}

async function loadSwitchboardRefundableRunner(): Promise<RunSwitchboardRefundable | undefined> {
  return defaultRunSwitchboardRefundableRunner;
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
      description: "Baran context name for runtime defaults."
    }),
    "project-dir": Flags.string({
      description: "Baran project directory."
    }),
    target: Flags.string({
      description: "Baran target, for example polkadot-hub."
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
  console.log(`Check Baran refundable session state.

USAGE
  $ ${bin} baran session refundable --session-id <bytes32> [--json]
  $ ${bin} baran session refundable --report <path> [--json]

FLAGS
  --session-id <bytes32>       Hub session ID to inspect.
  --report <path>              Deployment report JSON containing the session ID.
  --refund-reason <reason>     Refund path to inspect: activation-timeout or unfulfilled.
  --reason <reason>            Alias for --refund-reason.
  --project-dir <path>         Baran project directory.
  --context <name>             Baran context name for runtime defaults.
  --target <name>              Baran target, for example polkadot-hub.
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
  $ ${bin} baran session refundable --session-id 0x...
  $ ${bin} baran session refundable --report report.json --json
  $ ${bin} baran session refundable --session-id 0x... --refund-reason activation-timeout`);
}
