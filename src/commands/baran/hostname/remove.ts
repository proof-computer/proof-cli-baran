import { runSwitchboardHostnameRemove as defaultRunSwitchboardHostnameRemoveRunner } from "../../../switchboard-core/cli/src/index.js";
import { Command, Flags } from "@oclif/core";

type RunSwitchboardHostnameRemove = (argv?: readonly string[]) => Promise<void>;

export interface SwitchboardHostnameRemoveOptions {
  runner?: RunSwitchboardHostnameRemove;
  loadRunner?: () => Promise<RunSwitchboardHostnameRemove | undefined>;
}

export default class SwitchboardHostnameRemove extends Command {
  static description = [
    "Remove a Baran customer hostname.",
    "This native proof entrypoint calls the existing signed baran hostname remove implementation."
  ].join("\n");
  static examples = [
    "<%= config.bin %> baran hostname remove app.example.com --report .switchboard/latest-report.json",
    "<%= config.bin %> baran hostname remove app.example.com --endpoint demo.ingress.example --session-id 0x... --developer-private-key-env DEVELOPER_PRIVATE_KEY",
    "<%= config.bin %> baran hostname remove --customer-hostname app.example.com --endpoint demo.ingress.example --json"
  ];
  static flags = hostnameMutationFlags();
  static strict = false;
  static summary = "Remove a customer hostname.";

  async run(): Promise<void> {
    this.parsed = true;
    if (this.argv.includes("--help") || this.argv.includes("-h")) {
      printSwitchboardHostnameRemoveHelp(this.config.bin);
      return;
    }
    const exitCode = await runSwitchboardHostnameRemoveNative(this.argv);
    if (exitCode !== 0) {
      this.exit(exitCode);
    }
  }
}

export async function runSwitchboardHostnameRemoveNative(
  argv: readonly string[],
  options: SwitchboardHostnameRemoveOptions = {}
): Promise<number> {
  const loadRunner = options.loadRunner ?? loadSwitchboardHostnameRemoveRunner;
  const runner = options.runner ?? await loadRunner();
  if (runner) {
    return runSwitchboardHostnameRemoveInProcess(runner, argv);
  }
  console.error("[baran] Error: internal proof baran runner runSwitchboardHostnameRemove is unavailable.");
  return 1;
}

async function loadSwitchboardHostnameRemoveRunner(): Promise<RunSwitchboardHostnameRemove | undefined> {
  return defaultRunSwitchboardHostnameRemoveRunner;
}

async function runSwitchboardHostnameRemoveInProcess(
  runner: RunSwitchboardHostnameRemove,
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

function hostnameMutationFlags() {
  return {
    help: Flags.help({
      char: "h"
    }),
    json: Flags.boolean({
      description: "Print machine-readable output."
    }),
    report: Flags.string({
      description: "Deployment report JSON to read endpoint, session, and relay defaults from."
    }),
    endpoint: Flags.string({
      description: "Canonical PROOF endpoint hostname."
    }),
    "endpoint-hostname": Flags.string({
      description: "Canonical PROOF endpoint hostname."
    }),
    "endpoint-id": Flags.string({
      description: "Stable endpoint ID, defaults to endpoint hostname."
    }),
    "customer-hostname": Flags.string({
      description: "Customer hostname, alternative to positional hostname."
    }),
    "relay-url": Flags.string({
      description: "Relay/control-plane base URL."
    }),
    "tls-mode": Flags.string({
      description: "proof-acme or byo-certificate."
    }),
    "byo-tls": Flags.boolean({
      description: "Alias for --tls-mode byo-certificate."
    }),
    "byo-certificate": Flags.boolean({
      description: "Alias for --tls-mode byo-certificate."
    }),
    "manual-dns01": Flags.boolean({
      description: "Use manual ACME DNS-01 TXT validation."
    }),
    "manual-txt": Flags.boolean({
      description: "Use manual ACME DNS-01 TXT validation."
    }),
    "certificate-validation-mode": Flags.string({
      description: "dns01-cname-delegation or dns01-manual."
    }),
    "dns01-mode": Flags.string({
      description: "Alias for --certificate-validation-mode."
    }),
    "developer-private-key": Flags.string({
      description: "EVM developer key matching the funded session."
    }),
    "developer-private-key-env": Flags.string({
      description: "Environment variable containing the EVM developer key."
    }),
    "private-key": Flags.string({
      description: "Generic EVM private key."
    }),
    "private-key-env": Flags.string({
      description: "Environment variable containing a generic EVM private key."
    }),
    "hub-signer": Flags.string({
      description: "evm or polkadot."
    }),
    signer: Flags.string({
      description: "Alias for --hub-signer."
    }),
    "polkadot-seed": Flags.string({
      description: "Native signer seed for mapped Polkadot sessions."
    }),
    "polkadot-address": Flags.string({
      description: "Expected native signer address."
    }),
    "substrate-ws-url": Flags.string({
      description: "Hub Substrate WebSocket URL."
    }),
    "ss58-format": Flags.string({
      description: "Native address ss58 format."
    }),
    "chain-id": Flags.string({
      description: "EIP-712 chain ID."
    }),
    registry: Flags.string({
      description: "IngressRegistry contract address."
    }),
    wait: Flags.boolean({
      description: "Accepted for compatibility; remove does not poll."
    }),
    "wait-seconds": Flags.string({
      description: "Accepted for compatibility; remove does not poll."
    }),
    "poll-seconds": Flags.string({
      description: "Accepted for compatibility; remove does not poll."
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
    context: Flags.string({
      description: "Baran context name for runtime defaults."
    }),
    "project-dir": Flags.string({
      description: "Baran project directory."
    })
  };
}

function printSwitchboardHostnameRemoveHelp(bin: string): void {
  console.log(`Remove a Baran customer hostname.

USAGE
  $ ${bin} baran hostname remove <hostname> [--report <path>] [--json]

FLAGS
  --endpoint <hostname>             Canonical PROOF endpoint hostname.
  --endpoint-hostname <hostname>    Alias for --endpoint.
  --endpoint-id <id>                Stable endpoint ID, defaults to endpoint hostname.
  --customer-hostname <hostname>    Alternative to positional hostname.
  --report <path>                   Deployment report JSON to read endpoint/session defaults from.
  --relay-url <url>                 Relay/control-plane base URL.
  --developer-private-key <key>     EVM developer key matching the funded session.
  --developer-private-key-env <env> Environment variable containing the EVM developer key.
  --private-key <key>               Generic EVM private key.
  --private-key-env <env>           Environment variable containing a generic EVM private key.
  --hub-signer <mode>               evm or polkadot.
  --signer <mode>                   Alias for --hub-signer.
  --polkadot-seed <uri>             Native signer seed for mapped Polkadot sessions.
  --polkadot-address <address>      Expected native signer address.
  --substrate-ws-url <url>          Hub Substrate WebSocket URL.
  --ss58-format <n>                 Native address ss58 format.
  --chain-id <id>                   EIP-712 chain ID.
  --registry <address>              IngressRegistry contract address.
  --target <name>                   Baran target, for example polkadot-hub.
  --manifest-url <url>              Network manifest path or URL.
  --manifest-signer <signer>        Expected signed manifest signer.
  --allow-expired-manifest          Accept an expired manifest for diagnostics only.
  --project-dir <path>              Baran project directory.
  --context <name>                  Baran context name for runtime defaults.
  --json                            Print machine-readable output.

DESCRIPTION
  Signs a customer-hostname removal request with the session developer key and
  submits it to the relay. It does not spend, deploy, mutate local
  project/context files, or change DNS provider records.

EXAMPLES
  $ ${bin} baran hostname remove app.example.com --report .switchboard/latest-report.json
  $ ${bin} baran hostname remove app.example.com --endpoint demo.ingress.example --session-id 0x... --developer-private-key-env DEVELOPER_PRIVATE_KEY
  $ ${bin} baran hostname remove --customer-hostname app.example.com --endpoint demo.ingress.example --json`);
}
