import { runSwitchboardPreflight as defaultRunSwitchboardPreflightRunner } from "../../switchboard-core/cli/src/index.js";
import { Command, Flags } from "@oclif/core";

type RunSwitchboardPreflight = (argv?: readonly string[]) => Promise<void>;

export interface SwitchboardPreflightOptions {
  runner?: RunSwitchboardPreflight;
}

export default class SwitchboardPreflight extends Command {
  static description = [
    "Check Baran project, manifest, RPC, credential, payment, DNS, and deploy readiness.",
    "This is a read-only inspection command backed by the existing baran preflight implementation."
  ].join("\n");
  static examples = [
    "<%= config.bin %> baran preflight",
    "<%= config.bin %> baran preflight --json",
    "<%= config.bin %> baran preflight --project-dir ./app --context mainnet"
  ];
  static flags = {
    help: Flags.help({
      char: "h"
    }),
    json: Flags.boolean({
      description: "Print machine-readable output."
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
    "relay-url": Flags.string({
      description: "Relay/control-plane base URL."
    }),
    "eth-rpc-url": Flags.string({
      description: "Hub Ethereum JSON-RPC URL."
    }),
    "substrate-ws-url": Flags.string({
      description: "Hub Substrate WebSocket URL."
    }),
    "payment-mode": Flags.string({
      description: "Payment mode to check."
    }),
    "polkadot-signer": Flags.string({
      description: "Payment signer mode: seed or ledger."
    }),
    ledger: Flags.boolean({
      description: "Alias for --polkadot-signer ledger."
    }),
    "polkadot-address": Flags.string({
      description: "Native account used for quote funding."
    })
  };
  static strict = false;
  static summary = "Check Baran deploy readiness.";

  async run(): Promise<void> {
    this.parsed = true;
    if (this.argv.includes("--help") || this.argv.includes("-h")) {
      printSwitchboardPreflightHelp(this.config.bin);
      return;
    }
    const exitCode = await runSwitchboardPreflightNative(this.argv);
    if (exitCode !== 0) {
      this.exit(exitCode);
    }
  }
}

export async function runSwitchboardPreflightNative(
  argv: readonly string[],
  options: SwitchboardPreflightOptions = {}
): Promise<number> {
  const runner = options.runner ?? await loadSwitchboardPreflightRunner();
  if (runner) {
    return runSwitchboardPreflightInProcess(runner, argv);
  }
  console.error("[baran] Error: internal proof baran runner runSwitchboardPreflight is unavailable.");
  return 1;
}

async function loadSwitchboardPreflightRunner(): Promise<RunSwitchboardPreflight | undefined> {
  return defaultRunSwitchboardPreflightRunner;
}

async function runSwitchboardPreflightInProcess(
  runner: RunSwitchboardPreflight,
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

function printSwitchboardPreflightHelp(bin: string): void {
  console.log(`Check Baran deploy readiness.

USAGE
  $ ${bin} baran preflight [--json]

FLAGS
  --project-dir <path>          Baran project directory.
  --context <name>              Baran context name for runtime defaults.
  --target <name>               Baran target, for example polkadot-hub.
  --manifest-url <url>          Network manifest path or URL.
  --manifest-signer <signer>    Expected signed manifest signer.
  --allow-expired-manifest      Accept an expired manifest for diagnostics only.
  --registry <address>          IngressRegistry contract address.
  --relay-url <url>             Relay/control-plane base URL.
  --eth-rpc-url <url>           Hub Ethereum JSON-RPC URL.
  --substrate-ws-url <url>      Hub Substrate WebSocket URL.
  --payment-mode <mode>         Payment mode to check.
  --polkadot-signer <mode>      Payment signer mode: seed or ledger.
  --ledger                      Alias for --polkadot-signer ledger.
  --polkadot-address <address>  Native account used for quote funding.
  --json                        Print machine-readable output.

DESCRIPTION
  Read-only readiness inspection for local Baran deploys. It may read
  manifests, RPCs, relay health, local project state, env-backed credentials,
  DNS settings, and local deploy-runner availability. It does not deploy,
  spend, mutate DNS/routes, or write settlement state.

EXAMPLES
  $ ${bin} baran preflight
  $ ${bin} baran preflight --json
  $ ${bin} baran preflight --project-dir ./app --context mainnet`);
}
