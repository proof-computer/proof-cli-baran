import { runSwitchboardRefund as defaultRunSwitchboardRefundRunner } from "../../switchboard-core/cli/src/index.js";
import { Command, Flags } from "@oclif/core";

type RunSwitchboardRefund = (argv?: readonly string[]) => Promise<void>;

export interface SwitchboardRefundOptions {
  runner?: RunSwitchboardRefund;
  loadRunner?: () => Promise<RunSwitchboardRefund | undefined>;
}

export default class SwitchboardRefund extends Command {
  static description = [
    "Refund an eligible Baran developer session.",
    "This native proof entrypoint calls the existing baran refund implementation."
  ].join("\n");
  static examples = [
    "<%= config.bin %> baran refund --session-id 0x...",
    "<%= config.bin %> baran refund --report report.json --developer-private-key-env DEVELOPER_PRIVATE_KEY --yes",
    "<%= config.bin %> baran refund --session-id 0x... --refund-reason unfulfilled --yes --json"
  ];
  static flags = refundFlags();
  static strict = false;
  static summary = "Refund a Baran session.";

  async run(): Promise<void> {
    this.parsed = true;
    if (this.argv.includes("--help") || this.argv.includes("-h")) {
      printSwitchboardRefundHelp(this.config.bin);
      return;
    }
    const exitCode = await runSwitchboardRefundNative(this.argv);
    if (exitCode !== 0) {
      this.exit(exitCode);
    }
  }
}

export async function runSwitchboardRefundNative(
  argv: readonly string[],
  options: SwitchboardRefundOptions = {}
): Promise<number> {
  const loadRunner = options.loadRunner ?? loadSwitchboardRefundRunner;
  const runner = options.runner ?? await loadRunner();
  if (runner) {
    return runSwitchboardRefundInProcess(runner, argv);
  }
  console.error("[baran] Error: internal proof baran runner runSwitchboardRefund is unavailable.");
  return 1;
}

async function loadSwitchboardRefundRunner(): Promise<RunSwitchboardRefund | undefined> {
  return defaultRunSwitchboardRefundRunner;
}

async function runSwitchboardRefundInProcess(
  runner: RunSwitchboardRefund,
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

function refundFlags() {
  return {
    help: Flags.help({
      char: "h"
    }),
    json: Flags.boolean({
      description: "Print machine-readable output."
    }),
    yes: Flags.boolean({
      description: "Submit the refund transaction. Without --yes, this is a dry-run preview."
    }),
    report: Flags.string({
      description: "Deployment report JSON containing the session ID."
    }),
    "session-id": Flags.string({
      description: "Hub session ID to inspect or refund."
    }),
    "refund-reason": Flags.string({
      description: "Refund path: activation-timeout or unfulfilled."
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
      description: "Signer mode: evm or polkadot."
    }),
    signer: Flags.string({
      description: "Alias for --hub-signer."
    }),
    "developer-private-key": Flags.string({
      description: "EVM developer key matching the funded session."
    }),
    "developer-private-key-env": Flags.string({
      description: "Env var containing the EVM developer key."
    }),
    "private-key": Flags.string({
      description: "Generic EVM key for claim/refund transactions."
    }),
    "private-key-env": Flags.string({
      description: "Env var containing a generic EVM key."
    }),
    "polkadot-signer": Flags.string({
      description: "Native signer mode: seed or ledger."
    }),
    ledger: Flags.boolean({
      description: "Alias for --polkadot-signer ledger."
    }),
    "polkadot-seed": Flags.string({
      description: "Native account seed used for mapped Hub signing."
    }),
    "polkadot-address": Flags.string({
      description: "Expected native signer address."
    }),
    "ss58-format": Flags.string({
      description: "Native address ss58 format."
    }),
    "ledger-mode": Flags.string({
      description: "Ledger mode: generic or legacy."
    }),
    "ledger-transport": Flags.string({
      description: "Ledger transport."
    }),
    "ledger-chain": Flags.string({
      description: "Ledger chain key."
    }),
    "ledger-slip44": Flags.string({
      description: "Generic Ledger slip44."
    }),
    "ledger-account": Flags.string({
      description: "Ledger account index."
    }),
    "ledger-address-index": Flags.string({
      description: "Ledger address index."
    }),
    "ledger-confirm-address": Flags.boolean({
      description: "Ask Ledger to confirm the selected native address."
    }),
    "ledger-metadata-chain-id": Flags.string({
      description: "Zondax metadata-service chain ID for generic signing."
    }),
    "ledger-metadata-url": Flags.string({
      description: "Generic app metadata service URL."
    }),
    confirmations: Flags.string({
      description: "EVM receipt confirmations to wait for."
    }),
    "request-timeout-ms": Flags.string({
      description: "Native signing request timeout in milliseconds."
    }),
    "storage-deposit-limit": Flags.string({
      description: "Native revive.call storage deposit limit."
    }),
    "ref-time": Flags.string({
      description: "Native revive.call refTime limit."
    }),
    "proof-size": Flags.string({
      description: "Native revive.call proofSize limit."
    }),
    "no-map-account": Flags.boolean({
      description: "Do not submit revive.mapAccount before native revive.call."
    })
  };
}

function printSwitchboardRefundHelp(bin: string): void {
  console.log(`Refund a Baran session.

USAGE
  $ ${bin} baran refund (--session-id <bytes32> | --report <path>) [--yes] [--json]

FLAGS
  --session-id <bytes32>           Hub session ID to inspect or refund.
  --report <path>                  Deployment report JSON containing the session ID.
  --refund-reason <reason>         Refund path: activation-timeout or unfulfilled.
  --reason <reason>                Alias for --refund-reason.
  --yes                            Submit the refund transaction. Without --yes, this is a dry-run preview.
  --project-dir <path>             Baran project directory.
  --context <name>                 Baran context name for runtime defaults.
  --target <name>                  Baran target, for example polkadot-hub.
  --manifest-url <url>             Network manifest path or URL.
  --manifest-signer <signer>       Expected signed manifest signer.
  --allow-expired-manifest         Accept an expired manifest for diagnostics only.
  --registry <address>             IngressRegistry contract address.
  --eth-rpc-url <url>              Hub Ethereum JSON-RPC URL.
  --substrate-ws-url <url>         Hub Substrate WebSocket URL.
  --hub-signer <mode>              Signer mode: evm or polkadot.
  --signer <mode>                  Alias for --hub-signer.
  --developer-private-key <key>    EVM developer key matching the funded session.
  --developer-private-key-env <env>
                                  Env var containing the EVM developer key.
  --private-key <key>              Generic EVM key for claim/refund transactions.
  --private-key-env <env>          Env var containing a generic EVM key.
  --polkadot-signer <mode>         Native signer mode: seed or ledger.
  --ledger                         Alias for --polkadot-signer ledger.
  --polkadot-seed <uri>            Native account seed used for mapped Hub signing.
  --polkadot-address <address>     Expected native signer address.
  --ss58-format <n>                Native address ss58 format.
  --ledger-mode <mode>             Ledger mode: generic or legacy.
  --ledger-transport <mode>        Ledger transport.
  --ledger-chain <chain>           Ledger chain key.
  --ledger-slip44 <n>              Generic Ledger slip44.
  --ledger-account <n>             Ledger account index.
  --ledger-address-index <n>       Ledger address index.
  --ledger-confirm-address         Ask Ledger to confirm the selected native address.
  --ledger-metadata-chain-id <id>  Zondax metadata-service chain ID for generic signing.
  --ledger-metadata-url <url>      Generic app metadata service URL.
  --confirmations <n>              EVM receipt confirmations to wait for.
  --request-timeout-ms <n>         Native signing request timeout in milliseconds.
  --storage-deposit-limit <n>      Native revive.call storage deposit limit.
  --ref-time <n>                   Native revive.call refTime limit.
  --proof-size <n>                 Native revive.call proofSize limit.
  --no-map-account                 Do not submit revive.mapAccount before native revive.call.
  --json                           Print machine-readable output.

DESCRIPTION
  Developer recovery command for eligible sessions. By default it inspects the
  session and prints the selected refund path without submitting. Pass --yes to
  submit refundAfterActivationTimeout or refundUnfulfilled with the session
  developer signer.

EXAMPLES
  $ ${bin} baran refund --session-id 0x...
  $ ${bin} baran refund --report report.json --developer-private-key-env DEVELOPER_PRIVATE_KEY --yes
  $ ${bin} baran refund --session-id 0x... --refund-reason unfulfilled --yes --json`);
}
