import { runSwitchboardSessionRegister as defaultRunSwitchboardSessionRegisterRunner } from "../../../switchboard-core/cli/src/index.js";
import { Command, Flags } from "@oclif/core";

type RunSwitchboardSessionRegister = (argv?: readonly string[]) => Promise<void>;

export interface SwitchboardSessionRegisterOptions {
  runner?: RunSwitchboardSessionRegister;
  loadRunner?: () => Promise<RunSwitchboardSessionRegister | undefined>;
}

export default class SwitchboardSessionRegister extends Command {
  static description = [
    "Register a funded Switchboard session through a relay.",
    "This native proof entrypoint calls the existing switchboard session register implementation."
  ].join("\n");
  static examples = [
    "<%= config.bin %> switchboard session register --session-id 0x... --relay-url https://control.switchboard.proof.computer --job-signer-private-key 0x... --yes",
    "<%= config.bin %> switchboard session register --session-id 0x... --relay-url https://control.switchboard.proof.computer --job-signer-private-key 0x... --yes --json"
  ];
  static flags = sessionRegisterFlags();
  static strict = false;
  static summary = "Register a funded Switchboard session.";

  async run(): Promise<void> {
    this.parsed = true;
    if (this.argv.includes("--help") || this.argv.includes("-h")) {
      printSwitchboardSessionRegisterHelp(this.config.bin);
      return;
    }
    const exitCode = await runSwitchboardSessionRegisterNative(this.argv);
    if (exitCode !== 0) {
      this.exit(exitCode);
    }
  }
}

export async function runSwitchboardSessionRegisterNative(
  argv: readonly string[],
  options: SwitchboardSessionRegisterOptions = {}
): Promise<number> {
  const loadRunner = options.loadRunner ?? loadSwitchboardSessionRegisterRunner;
  const runner = options.runner ?? await loadRunner();
  if (runner) {
    return runSwitchboardSessionRegisterInProcess(runner, argv);
  }
  console.error("[switchboard] Error: internal proof switchboard runner runSwitchboardSessionRegister is unavailable.");
  return 1;
}

async function loadSwitchboardSessionRegisterRunner(): Promise<RunSwitchboardSessionRegister | undefined> {
  return defaultRunSwitchboardSessionRegisterRunner;
}

async function runSwitchboardSessionRegisterInProcess(
  runner: RunSwitchboardSessionRegister,
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

function sessionRegisterFlags() {
  return {
    help: Flags.help({
      char: "h"
    }),
    json: Flags.boolean({
      description: "Print machine-readable output."
    }),
    yes: Flags.boolean({
      description: "Submit the relay registration. Required for this command."
    }),
    "session-id": Flags.string({
      description: "Funded Hub session ID to register."
    }),
    "job-signer-private-key": Flags.string({
      description: "Private key for the funded session's expected job signer."
    }),
    "relay-url": Flags.string({
      description: "Relay/control-plane base URL."
    }),
    deadline: Flags.string({
      description: "Registration signature deadline as a Unix timestamp."
    }),
    "request-timeout-ms": Flags.string({
      description: "Relay request timeout in milliseconds."
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
    registry: Flags.string({
      description: "IngressRegistry contract address."
    }),
    "eth-rpc-url": Flags.string({
      description: "Hub Ethereum JSON-RPC URL."
    })
  };
}

function printSwitchboardSessionRegisterHelp(bin: string): void {
  console.log(`Register a funded Switchboard session through a relay.

USAGE
  $ ${bin} switchboard session register --session-id <bytes32> --relay-url <url> --job-signer-private-key <key> --yes [--json]

FLAGS
  --session-id <bytes32>           Funded Hub session ID to register.
  --job-signer-private-key <key>   Private key for the funded session's expected job signer.
  --relay-url <url>                Relay/control-plane base URL. Can also come from RELAY_URL.
  --deadline <unix-seconds>        Registration signature deadline.
  --request-timeout-ms <n>         Relay request timeout in milliseconds.
  --yes                            Submit the relay registration. Required for this command.
  --project-dir <path>             Switchboard project directory.
  --context <name>                 Switchboard context name for runtime defaults.
  --target <name>                  Switchboard target, for example polkadot-hub.
  --registry <address>             IngressRegistry contract address.
  --eth-rpc-url <url>              Hub Ethereum JSON-RPC URL.
  --json                           Print machine-readable output.

DESCRIPTION
  Reads the funded Hub session, verifies the configured job signer matches the
  session, signs the canonical registration payload, posts it to the relay
  /v1/ingress-registrations endpoint, then verifies the session is registered
  on the contract. The public package does not include --local-relay; use
  --relay-url or RELAY_URL.

EXAMPLES
  $ ${bin} switchboard session register --session-id 0x... --relay-url https://control.switchboard.proof.computer --job-signer-private-key 0x... --yes
  $ ${bin} switchboard session register --session-id 0x... --relay-url https://control.switchboard.proof.computer --job-signer-private-key 0x... --yes --json`);
}
