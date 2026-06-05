import { runSwitchboardSessionStatus as defaultRunSwitchboardSessionStatusRunner } from "../../../switchboard-core/cli/src/index.js";
import { Command, Flags } from "@oclif/core";

type RunSwitchboardSessionStatus = (argv?: readonly string[]) => Promise<void>;

export interface SwitchboardSessionStatusOptions {
  runner?: RunSwitchboardSessionStatus;
  loadRunner?: () => Promise<RunSwitchboardSessionStatus | undefined>;
}

export default class SwitchboardSessionStatus extends Command {
  static description = [
    "Read raw Switchboard Hub session state.",
    "This is the native proof entrypoint for the existing read-only switchboard session status command."
  ].join("\n");
  static examples = [
    "<%= config.bin %> switchboard session status --session-id 0x...",
    "<%= config.bin %> switchboard session status --session-id 0x... --json",
    "<%= config.bin %> switchboard session status --session-id 0x... --target polkadot-hub"
  ];
  static flags = {
    help: Flags.help({
      char: "h"
    }),
    json: Flags.boolean({
      description: "Print machine-readable output."
    }),
    "session-id": Flags.string({
      description: "Hub session ID to inspect."
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
    })
  };
  static strict = false;
  static summary = "Read Switchboard session status.";

  async run(): Promise<void> {
    this.parsed = true;
    if (this.argv.includes("--help") || this.argv.includes("-h")) {
      printSwitchboardSessionStatusHelp(this.config.bin);
      return;
    }
    const exitCode = await runSwitchboardSessionStatusNative(this.argv);
    if (exitCode !== 0) {
      this.exit(exitCode);
    }
  }
}

export async function runSwitchboardSessionStatusNative(
  argv: readonly string[],
  options: SwitchboardSessionStatusOptions = {}
): Promise<number> {
  const loadRunner = options.loadRunner ?? loadSwitchboardSessionStatusRunner;
  const runner = options.runner ?? await loadRunner();
  if (runner) {
    return runSwitchboardSessionStatusInProcess(runner, argv);
  }
  console.error("[switchboard] Error: internal proof switchboard runner runSwitchboardSessionStatus is unavailable.");
  return 1;
}

async function loadSwitchboardSessionStatusRunner(): Promise<RunSwitchboardSessionStatus | undefined> {
  return defaultRunSwitchboardSessionStatusRunner;
}

async function runSwitchboardSessionStatusInProcess(
  runner: RunSwitchboardSessionStatus,
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

function printSwitchboardSessionStatusHelp(bin: string): void {
  console.log(`Read raw Switchboard Hub session state.

USAGE
  $ ${bin} switchboard session status --session-id <bytes32> [--json]

FLAGS
  --session-id <bytes32>       Hub session ID to inspect.
  --project-dir <path>         Switchboard project directory.
  --context <name>             Switchboard context name for runtime defaults.
  --target <name>              Switchboard target, for example polkadot-hub.
  --manifest-url <url>         Network manifest path or URL.
  --manifest-signer <signer>   Expected signed manifest signer.
  --allow-expired-manifest     Accept an expired manifest for diagnostics only.
  --registry <address>         IngressRegistry contract address.
  --eth-rpc-url <url>          Hub Ethereum JSON-RPC URL.
  --substrate-ws-url <url>     Hub Substrate WebSocket URL.
  --json                       Print machine-readable output.

DESCRIPTION
  Read-only Hub session inspection. It reads getSession for the supplied
  session ID and prints raw session state. It never signs, registers, claims,
  refunds, deploys, mutates DNS, or changes local Switchboard context state.

EXAMPLES
  $ ${bin} switchboard session status --session-id 0x...
  $ ${bin} switchboard session status --session-id 0x... --json
  $ ${bin} switchboard session status --session-id 0x... --target polkadot-hub`);
}
