import { Command, Flags } from "@oclif/core";

import { runSwitchboardCompatibility } from "../../switchboard.js";

type RunSwitchboardGatewayStatus = (argv?: readonly string[]) => Promise<void>;
type RunSwitchboardCompatibility = (argv: readonly string[]) => Promise<number>;

export interface SwitchboardGatewayStatusOptions {
  runner?: RunSwitchboardGatewayStatus;
  loadRunner?: () => Promise<RunSwitchboardGatewayStatus | undefined>;
  compatibilityRunner?: RunSwitchboardCompatibility;
}

export default class SwitchboardGatewayStatus extends Command {
  static description = [
    "Show local Switchboard gateway stack status.",
    "This native proof entrypoint calls the existing switchboard gateway status implementation."
  ].join("\n");
  static examples = [
    "<%= config.bin %> switchboard gateway status",
    "<%= config.bin %> switchboard gateway status --project-dir /srv/proof --json"
  ];
  static flags = {
    help: Flags.help({ char: "h" }),
    json: Flags.boolean({ description: "Print machine-readable output." }),
    "project-dir": Flags.string({ description: "Gateway project directory." }),
    "compose-file": Flags.string({ description: "Docker Compose file path." }),
    "env-file": Flags.string({ description: "Compose env file path." }),
    "gateway-agent-url": Flags.string({ description: "Gateway-agent status check URL." }),
    "capability-url": Flags.string({ description: "Relay capability lookup URL." }),
    "capability-token-env": Flags.string({ description: "Env var containing the relay capability token." }),
    "operator-id": Flags.string({ description: "Hub operator ID to check." }),
    "gateway-id": Flags.string({ description: "Gateway ID to check." }),
    "timeout-ms": Flags.string({ description: "Gateway-agent and relay request timeout." })
  };
  static strict = false;
  static summary = "Show gateway stack status.";

  async run(): Promise<void> {
    this.parsed = true;
    if (this.argv.includes("--help") || this.argv.includes("-h")) {
      printSwitchboardGatewayStatusHelp(this.config.bin);
      return;
    }
    const exitCode = await runSwitchboardGatewayStatusNative(this.argv);
    if (exitCode !== 0) {
      this.exit(exitCode);
    }
  }
}

export async function runSwitchboardGatewayStatusNative(
  argv: readonly string[],
  options: SwitchboardGatewayStatusOptions = {}
): Promise<number> {
  const loadRunner = options.loadRunner ?? loadSwitchboardGatewayStatusRunner;
  const runner = options.runner ?? await loadRunner();
  if (runner) {
    return runSwitchboardGatewayStatusInProcess(runner, argv);
  }
  const compatibilityRunner = options.compatibilityRunner ?? runSwitchboardCompatibility;
  return compatibilityRunner(["gateway", "status", ...argv]);
}

async function loadSwitchboardGatewayStatusRunner(): Promise<RunSwitchboardGatewayStatus | undefined> {
  try {
    const module = await import("@proof-computer/switchboard-cli");
    return typeof module.runSwitchboardGatewayStatus === "function"
      ? module.runSwitchboardGatewayStatus
      : undefined;
  } catch {
    return undefined;
  }
}

async function runSwitchboardGatewayStatusInProcess(
  runner: RunSwitchboardGatewayStatus,
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

function printSwitchboardGatewayStatusHelp(bin: string): void {
  console.log(`Show local Switchboard gateway stack status.

USAGE
  $ ${bin} switchboard gateway status [options]

FLAGS
  --project-dir <path>          Gateway project directory.
  --compose-file <path>         Docker Compose file path.
  --env-file <path>             Compose env file path.
  --gateway-agent-url <url>     Gateway-agent status check URL.
  --capability-url <url>        Relay capability lookup URL.
  --capability-token-env <env>  Env var containing the relay capability token.
  --operator-id <bytes32>       Hub operator ID to check.
  --gateway-id <id>             Gateway ID to check.
  --timeout-ms <ms>             Gateway-agent and relay request timeout.
  --json                        Print machine-readable output.

DESCRIPTION
  Checks Docker/Compose state, gateway-agent health, local capability reports,
  and relay capability registration for the configured operatorId + gatewayId.
  It does not mutate host files, relay state, DNS, routes, or jobs.

EXAMPLES
  $ ${bin} switchboard gateway status
  $ ${bin} switchboard gateway status --project-dir /srv/proof --json`);
}
