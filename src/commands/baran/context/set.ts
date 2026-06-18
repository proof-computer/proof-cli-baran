import { runSwitchboardContextSet as defaultRunSwitchboardContextSetRunner } from "../../../switchboard-core/cli/src/index.js";
import { Command, Flags } from "@oclif/core";

type RunSwitchboardContextSet = (argv?: readonly string[]) => Promise<void>;

export interface SwitchboardContextSetOptions {
  runner?: RunSwitchboardContextSet;
  loadRunner?: () => Promise<RunSwitchboardContextSet | undefined>;
}

export default class SwitchboardContextSet extends Command {
  static description = [
    "Create or update a Baran context.",
    "This is a local context-store mutation backed by the existing baran context set implementation."
  ].join("\n");
  static examples = [
    "<%= config.bin %> baran context set mainnet --relay-url https://control.switchboard.proof.computer",
    "<%= config.bin %> baran context set mainnet --polkadot-address-env POLKADOT_ADDRESS --polkadot-seed-env POLKADOT_SEED",
    "<%= config.bin %> baran context set mainnet --use --json"
  ];
  static flags = {
    help: Flags.help({
      char: "h"
    }),
    json: Flags.boolean({
      description: "Print sanitized machine-readable output."
    }),
    context: Flags.string({
      description: "Baran context name to create or update."
    }),
    use: Flags.boolean({
      description: "Make the context current after saving it."
    }),
    "project-dir": Flags.string({
      description: "Baran project directory."
    }),
    "no-project": Flags.boolean({
      description: "Ignore switchboard.json and .switchboard state."
    }),
    "manifest-url": Flags.string({
      description: "Signed network manifest URL."
    }),
    "manifest-signer": Flags.string({
      description: "Expected network manifest signer."
    }),
    target: Flags.string({
      description: "Network target name."
    }),
    "operator-id": Flags.string({
      description: "Optional capacity pin for support or lab use."
    }),
    "relay-url": Flags.string({
      description: "Default Baran relay/control URL."
    }),
    "payment-mode": Flags.string({
      description: "Default payment mode."
    }),
    "acurast-network": Flags.string({
      description: "Default Acurast network."
    }),
    "acurast-seed-env": Flags.string({
      description: "Environment variable containing the Acurast seed."
    }),
    "acurast-address-env": Flags.string({
      description: "Environment variable containing the Acurast address."
    }),
    "polkadot-signer": Flags.string({
      description: "Payment signer mode."
    }),
    "polkadot-address": Flags.string({
      description: "Payment account address."
    }),
    "polkadot-seed-env": Flags.string({
      description: "Environment variable containing the payment seed."
    }),
    "polkadot-address-env": Flags.string({
      description: "Environment variable containing the payment address."
    }),
    "polkadot-ss58-format": Flags.string({
      description: "Payment account SS58 format."
    }),
    "ss58-format": Flags.string({
      description: "Alias for --polkadot-ss58-format."
    }),
    ledger: Flags.boolean({
      description: "Use ledger payment signing defaults."
    }),
    "ledger-mode": Flags.string({
      description: "Ledger signing mode."
    }),
    "ledger-transport": Flags.string({
      description: "Ledger transport."
    }),
    "ledger-chain": Flags.string({
      description: "Ledger chain name."
    }),
    "ledger-slip44": Flags.string({
      description: "Ledger SLIP-44 coin type."
    }),
    "ledger-account": Flags.string({
      description: "Ledger account index."
    }),
    "ledger-address-index": Flags.string({
      description: "Ledger address index."
    }),
    "ledger-metadata-chain-id": Flags.string({
      description: "Ledger metadata chain id."
    }),
    "ledger-metadata-url": Flags.string({
      description: "Ledger metadata URL."
    }),
    "developer-private-key-env": Flags.string({
      description: "Environment variable containing the developer private key."
    }),
    "cloudflare-api-token-env": Flags.string({
      description: "PROOF/internal DNS provider token env name."
    })
  };
  static strict = false;
  static summary = "Create or update a Baran context.";

  async run(): Promise<void> {
    this.parsed = true;
    if (this.argv.includes("--help") || this.argv.includes("-h")) {
      printSwitchboardContextSetHelp(this.config.bin);
      return;
    }
    const exitCode = await runSwitchboardContextSetNative(this.argv);
    if (exitCode !== 0) {
      this.exit(exitCode);
    }
  }
}

export async function runSwitchboardContextSetNative(
  argv: readonly string[],
  options: SwitchboardContextSetOptions = {}
): Promise<number> {
  const loadRunner = options.loadRunner ?? loadSwitchboardContextSetRunner;
  const runner = options.runner ?? await loadRunner();
  if (runner) {
    return runSwitchboardContextSetInProcess(runner, argv);
  }
  console.error("[baran] Error: internal proof baran runner runSwitchboardContextSet is unavailable.");
  return 1;
}

async function loadSwitchboardContextSetRunner(): Promise<RunSwitchboardContextSet | undefined> {
  return defaultRunSwitchboardContextSetRunner;
}

async function runSwitchboardContextSetInProcess(
  runner: RunSwitchboardContextSet,
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

function printSwitchboardContextSetHelp(bin: string): void {
  console.log(`Create or update a Baran context.

USAGE
  $ ${bin} baran context set <name> [--json] [--use]

FLAGS
  --context <name>                 Baran context name to create or update.
  --project-dir <path>             Baran project directory.
  --no-project                     Ignore switchboard.json and .switchboard state.
  --json                           Print sanitized machine-readable output.
  --use                            Make the context current after saving it.
  --manifest-url <url>             Signed network manifest URL.
  --manifest-signer <ss58>         Expected network manifest signer.
  --target <name>                  Network target name.
  --operator-id <id>               Optional capacity pin for support or lab use.
  --relay-url <url>                Default Baran relay/control URL.
  --payment-mode <mode>            Default payment mode.
  --acurast-network <name>         Default Acurast network.
  --acurast-seed-env <name>        Environment variable containing the Acurast seed.
  --acurast-address-env <name>     Environment variable containing the Acurast address.
  --polkadot-signer <mode>         Payment signer mode.
  --polkadot-address <address>     Payment account address.
  --polkadot-seed-env <name>       Environment variable containing the payment seed.
  --polkadot-address-env <name>    Environment variable containing the payment address.
  --polkadot-ss58-format <number>  Payment account SS58 format.
  --ss58-format <number>           Alias for --polkadot-ss58-format.
  --ledger                         Use ledger payment signing defaults.
  --ledger-mode <mode>             Ledger signing mode.
  --ledger-transport <name>        Ledger transport.
  --ledger-chain <name>            Ledger chain name.
  --ledger-slip44 <number>         Ledger SLIP-44 coin type.
  --ledger-account <number>        Ledger account index.
  --ledger-address-index <number>  Ledger address index.
  --ledger-metadata-chain-id <id>  Ledger metadata chain id.
  --ledger-metadata-url <url>      Ledger metadata URL.
  --developer-private-key-env <n>  Environment variable containing the developer private key.
  --cloudflare-api-token-env <n>   PROOF/internal DNS provider token env name.

DESCRIPTION
  Local context-store mutation. It creates or updates a builder context and
  sanitizes removed administrative fields from the saved context. It does not
  run interactive context creation, configure DNS, or contact the network.

EXAMPLES
  $ ${bin} baran context set mainnet --relay-url https://control.switchboard.proof.computer
  $ ${bin} baran context set mainnet --polkadot-address-env POLKADOT_ADDRESS --polkadot-seed-env POLKADOT_SEED
  $ ${bin} baran context set mainnet --use --json`);
}
