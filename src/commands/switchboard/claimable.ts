import { runSwitchboardClaimable as defaultRunSwitchboardClaimableRunner } from "../../switchboard-core/cli/src/index.js";
import { Command, Flags } from "@oclif/core";

type RunSwitchboardClaimable = (argv?: readonly string[]) => Promise<void>;

export interface SwitchboardClaimableOptions {
  runner?: RunSwitchboardClaimable;
}

export default class SwitchboardClaimable extends Command {
  static description = [
    "Check released Switchboard rewards without submitting a claim transaction.",
    "This is the native proof entrypoint for the existing read-only switchboard claimable command."
  ].join("\n");
  static examples = [
    "<%= config.bin %> switchboard claimable --recipient 0x...",
    "<%= config.bin %> switchboard claimable --recipient 0x... --json",
    "<%= config.bin %> switchboard claimable --recipient 0x... --asset 0x..."
  ];
  static flags = {
    help: Flags.help({
      char: "h"
    }),
    json: Flags.boolean({
      description: "Print machine-readable output."
    }),
    recipient: Flags.string({
      description: "Reward recipient address to inspect without a signer."
    }),
    "claim-recipient": Flags.string({
      description: "Alias for --recipient."
    }),
    asset: Flags.string({
      description: "Payment asset address, default first manifest asset."
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
      description: "Optional signer mode when deriving the recipient."
    }),
    "polkadot-signer": Flags.string({
      description: "Native signer mode: seed or ledger."
    }),
    ledger: Flags.boolean({
      description: "Alias for --polkadot-signer ledger."
    }),
    "polkadot-address": Flags.string({
      description: "Native account used to derive the mapped reward address."
    }),
    "polkadot-seed": Flags.string({
      description: "Native account seed used to derive the mapped reward address."
    }),
    yes: Flags.boolean({
      description: "Accepted for compatibility; claimable is always read-only."
    })
  };
  static strict = false;
  static summary = "Check Switchboard claimable rewards.";

  async run(): Promise<void> {
    this.parsed = true;
    if (this.argv.includes("--help") || this.argv.includes("-h")) {
      printSwitchboardClaimableHelp(this.config.bin);
      return;
    }
    const exitCode = await runSwitchboardClaimableNative(this.argv);
    if (exitCode !== 0) {
      this.exit(exitCode);
    }
  }
}

export async function runSwitchboardClaimableNative(
  argv: readonly string[],
  options: SwitchboardClaimableOptions = {}
): Promise<number> {
  const runner = options.runner ?? await loadSwitchboardClaimableRunner();
  if (runner) {
    return runSwitchboardClaimableInProcess(runner, argv);
  }
  console.error("[switchboard] Error: internal proof switchboard runner runSwitchboardClaimable is unavailable.");
  return 1;
}

async function loadSwitchboardClaimableRunner(): Promise<RunSwitchboardClaimable | undefined> {
  return defaultRunSwitchboardClaimableRunner;
}

async function runSwitchboardClaimableInProcess(
  runner: RunSwitchboardClaimable,
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

function printSwitchboardClaimableHelp(bin: string): void {
  console.log(`Check Switchboard claimable rewards.

USAGE
  $ ${bin} switchboard claimable --recipient <address> [--json]

FLAGS
  --recipient <address>         Reward recipient address to inspect without a signer.
  --claim-recipient <address>   Alias for --recipient.
  --asset <address>             Payment asset address, default first manifest asset.
  --project-dir <path>          Switchboard project directory.
  --context <name>              Switchboard context name for runtime defaults.
  --target <name>               Switchboard target, for example polkadot-hub.
  --manifest-url <url>          Network manifest path or URL.
  --manifest-signer <signer>    Expected signed manifest signer.
  --allow-expired-manifest      Accept an expired manifest for diagnostics only.
  --registry <address>          IngressRegistry contract address.
  --eth-rpc-url <url>           Hub Ethereum JSON-RPC URL.
  --substrate-ws-url <url>      Hub Substrate WebSocket URL.
  --hub-signer <mode>           Optional signer mode when deriving the recipient.
  --polkadot-signer <mode>      Native signer mode: seed or ledger.
  --ledger                      Alias for --polkadot-signer ledger.
  --polkadot-address <address>  Native account used to derive the mapped reward address.
  --polkadot-seed <uri>         Native account seed used to derive the mapped reward address.
  --yes                         Accepted for compatibility; claimable is always read-only.
  --json                        Print machine-readable output.

DESCRIPTION
  Read-only reward accounting inspection. It checks claimableBalances for an
  operator, validator, or PROOF reward recipient. It never submits claim(...)
  or any other transaction, even if --yes is present.

EXAMPLES
  $ ${bin} switchboard claimable --recipient 0x...
  $ ${bin} switchboard claimable --recipient 0x... --json
  $ ${bin} switchboard claimable --recipient 0x... --asset 0x...`);
}
