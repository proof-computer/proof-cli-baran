import { runSwitchboardGatewayDiscover as defaultRunSwitchboardGatewayDiscoverRunner } from "../../../switchboard-core/cli/src/index.js";
import { Command, Flags } from "@oclif/core";

type RunSwitchboardGatewayDiscover = (argv?: readonly string[]) => Promise<void>;

export interface SwitchboardGatewayDiscoverOptions {
  runner?: RunSwitchboardGatewayDiscover;
  loadRunner?: () => Promise<RunSwitchboardGatewayDiscover | undefined>;
}

export default class SwitchboardGatewayDiscover extends Command {
  static description = [
    "Check gateway-local Acurast processor readiness.",
    "This native proof entrypoint calls the existing switchboard gateway discover implementation."
  ].join("\n");
  static examples = [
    "<%= config.bin %> switchboard gateway discover --manager-id 9470 --public-address 203.0.113.10",
    "<%= config.bin %> switchboard gateway discover --manager-id 9470 --limit 3 --json"
  ];
  static flags = {
    help: Flags.help({ char: "h" }),
    json: Flags.boolean({ description: "Print machine-readable output." }),
    network: Flags.string({ description: "Acurast network, for example mainnet." }),
    "rpc-url": Flags.string({ description: "Override Acurast RPC URL." }),
    "gateway-agent-url": Flags.string({ description: "Gateway-agent URL." }),
    "manager-id": Flags.string({ description: "Numeric Acurast manager ID." }),
    "public-address": Flags.string({ description: "Gateway NAT/public address to test." }),
    "public-port": Flags.string({ description: "Public HTTPS port." }),
    available: Flags.boolean({ description: "Check schedule conflicts for the default window." }),
    "skip-availability": Flags.boolean({ description: "Skip Acurast existing-job/schedule conflict checks." }),
    "available-for-ms": Flags.string({ description: "Check schedule conflicts for a custom duration." }),
    limit: Flags.string({ description: "Test the next n processors not checked recently." }),
    "smoke-hostname": Flags.string({ description: "Temporarily route and TLS-probe this SNI name." }),
    "state-file": Flags.string({ description: "Gateway-local discovery state file." }),
    "ready-ttl-ms": Flags.string({ description: "Recent-ready TTL." }),
    "recent-check-ttl-ms": Flags.string({ description: "Recent-check TTL for --limit." }),
    "no-state": Flags.boolean({ description: "Do not read or write discovery state." }),
    "write-env": Flags.string({ description: "Write suggested gateway env values." })
  };
  static strict = false;
  static summary = "Check gateway processor readiness.";

  async run(): Promise<void> {
    this.parsed = true;
    if (this.argv.includes("--help") || this.argv.includes("-h")) {
      printSwitchboardGatewayDiscoverHelp(this.config.bin);
      return;
    }
    const exitCode = await runSwitchboardGatewayDiscoverNative(this.argv);
    if (exitCode !== 0) {
      this.exit(exitCode);
    }
  }
}

export async function runSwitchboardGatewayDiscoverNative(
  argv: readonly string[],
  options: SwitchboardGatewayDiscoverOptions = {}
): Promise<number> {
  const loadRunner = options.loadRunner ?? loadSwitchboardGatewayDiscoverRunner;
  const runner = options.runner ?? await loadRunner();
  if (runner) {
    return runSwitchboardGatewayDiscoverInProcess(runner, argv);
  }
  console.error("[switchboard] Error: internal proof switchboard runner runSwitchboardGatewayDiscover is unavailable.");
  return 1;
}

async function loadSwitchboardGatewayDiscoverRunner(): Promise<RunSwitchboardGatewayDiscover | undefined> {
  return defaultRunSwitchboardGatewayDiscoverRunner;
}

async function runSwitchboardGatewayDiscoverInProcess(
  runner: RunSwitchboardGatewayDiscover,
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

function printSwitchboardGatewayDiscoverHelp(bin: string): void {
  console.log(`Check gateway-local Acurast processor readiness.

USAGE
  $ ${bin} switchboard gateway discover --manager-id <id> --public-address <ip-or-host> [options]

FLAGS
  --manager-id <id>             Numeric Acurast manager ID.
  --gateway-agent-url <url>     Gateway-agent URL. Default: http://127.0.0.1:18080.
  --public-address <ip-or-host> Gateway NAT/public address to test.
  --public-port <port>          Public HTTPS port.
  --available                   Check schedule conflicts for the default window.
  --skip-availability           Skip existing-job/schedule conflict checks.
  --limit <n>                   Test the next n processors not checked recently.
  --smoke-hostname <hostname>   Temporarily route and TLS-probe this SNI name.
  --state-file <path>           Gateway-local discovery state file.
  --no-state                    Do not read or write discovery state.
  --write-env <path>            Write suggested gateway env values.
  --json                        Print machine-readable output.

DESCRIPTION
  Reads manager processors, filters gateway-local readiness, and records
  discovery state for gateway capability reporting. It does not deploy jobs,
  spend funds, or mutate relay admission policy.

EXAMPLES
  $ ${bin} switchboard gateway discover --manager-id 9470 --public-address 203.0.113.10
  $ ${bin} switchboard gateway discover --manager-id 9470 --limit 3 --json`);
}
