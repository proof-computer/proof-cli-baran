import { runSwitchboardClaim as defaultRunSwitchboardClaimRunner } from "../../switchboard-core/cli/src/index.js";
import { Command, Flags } from "@oclif/core";

type RunSwitchboardClaim = (argv?: readonly string[]) => Promise<void>;

export interface SwitchboardClaimOptions {
  runner?: RunSwitchboardClaim;
  loadRunner?: () => Promise<RunSwitchboardClaim | undefined>;
}

export default class SwitchboardClaim extends Command {
  static description = [
    "Inspect and withdraw released Baran rewards.",
    "This native proof entrypoint calls the existing baran claim implementation."
  ].join("\n");
  static examples = [
    "<%= config.bin %> baran claim --recipient 0x...",
    "<%= config.bin %> baran claim --claim-private-key-env OPERATOR_CLAIM_PRIVATE_KEY --yes",
    "<%= config.bin %> baran claim --hub-signer polkadot --polkadot-address 5... --yes --json"
  ];
  static flags = claimFlags();
  static strict = false;
  static summary = "Claim Baran rewards.";

  async run(): Promise<void> {
    this.parsed = true;
    if (this.argv.includes("--help") || this.argv.includes("-h")) {
      printSwitchboardClaimHelp(this.config.bin);
      return;
    }
    const exitCode = await runSwitchboardClaimNative(this.argv);
    if (exitCode !== 0) {
      this.exit(exitCode);
    }
  }
}

export async function runSwitchboardClaimNative(
  argv: readonly string[],
  options: SwitchboardClaimOptions = {}
): Promise<number> {
  const loadRunner = options.loadRunner ?? loadSwitchboardClaimRunner;
  const runner = options.runner ?? await loadRunner();
  if (runner) {
    return runSwitchboardClaimInProcess(runner, argv);
  }
  console.error("[baran] Error: internal proof baran runner runSwitchboardClaim is unavailable.");
  return 1;
}

async function loadSwitchboardClaimRunner(): Promise<RunSwitchboardClaim | undefined> {
  return defaultRunSwitchboardClaimRunner;
}

async function runSwitchboardClaimInProcess(
  runner: RunSwitchboardClaim,
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

function claimFlags() {
  return {
    help: Flags.help({
      char: "h"
    }),
    json: Flags.boolean({
      description: "Print machine-readable output."
    }),
    yes: Flags.boolean({
      description: "Submit the claim transaction. Without --yes, this is a dry-run preview."
    }),
    mode: Flags.string({
      description: "Parachain claim mode: withdraw (default) or route-credit."
    }),
    "proof-file": Flags.string({
      description: "Parachain route-credit mode: JSON file with { leaf, proof } for claim_route_credit."
    }),
    amount: Flags.string({
      description: "Parachain withdraw amount (default = full claimable balance)."
    }),
    account: Flags.string({
      description: "Parachain read-only: account whose claimable balance to inspect."
    }),
    "parachain-ws-url": Flags.string({
      description: "PROOF Ingress parachain WebSocket url (parachain targets)."
    }),
    recipient: Flags.string({
      description: "Reward recipient address to inspect. With --yes, the signer must match this address."
    }),
    "claim-recipient": Flags.string({
      description: "Alias for --recipient."
    }),
    asset: Flags.string({
      description: "Payment asset address, default first manifest asset."
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
    "claim-private-key": Flags.string({
      description: "EVM reward-recipient private key."
    }),
    "claim-private-key-env": Flags.string({
      description: "Env var containing the EVM reward key."
    }),
    "developer-private-key": Flags.string({
      description: "EVM developer key, accepted for compatibility with shared signing flags."
    }),
    "developer-private-key-env": Flags.string({
      description: "Env var containing an EVM developer key."
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

function printSwitchboardClaimHelp(bin: string): void {
  console.log(`Claim Baran rewards.

USAGE
  $ ${bin} baran claim [--recipient <address>] [--yes] [--json]

FLAGS
  --recipient <address>            Reward recipient address to inspect. With --yes, the signer must match this address.
  --claim-recipient <address>      Alias for --recipient.
  --asset <address>                Payment asset address, default first manifest asset.
  --yes                            Submit the claim transaction. Without --yes, this is a dry-run preview.
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
  --claim-private-key <key>        EVM reward-recipient private key.
  --claim-private-key-env <env>    Env var containing the EVM reward key.
  --developer-private-key <key>    EVM developer key, accepted for compatibility with shared signing flags.
  --developer-private-key-env <env>
                                  Env var containing an EVM developer key.
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
  Reward accounting command for operator, validator, and PROOF recipients. By
  default it previews the claimable balance and estimated gas without
  submitting. Pass --yes to submit claim(asset) with the configured signer.

EXAMPLES
  $ ${bin} baran claim --recipient 0x...
  $ ${bin} baran claim --claim-private-key-env OPERATOR_CLAIM_PRIVATE_KEY --yes
  $ ${bin} baran claim --hub-signer polkadot --polkadot-address 5... --yes --json`);
}
