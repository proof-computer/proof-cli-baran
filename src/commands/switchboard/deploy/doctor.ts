import { runSwitchboardDeployDoctor as defaultRunSwitchboardDeployDoctorRunner } from "../../../switchboard-core/cli/src/index.js";
import { Command, Flags } from "@oclif/core";

type RunSwitchboardDeployDoctor = (argv?: readonly string[]) => Promise<void>;

export interface SwitchboardDeployDoctorOptions {
  runner?: RunSwitchboardDeployDoctor;
}

export default class SwitchboardDeployDoctor extends Command {
  static description = [
    "Diagnose Switchboard deploy state without spending, deploying, mutating routes, changing DNS, or writing settlement state.",
    "By default this reads local workflow/report state plus relay and gateway readback surfaces. Pass --probe to also run a public TLS/SNI and SSH banner check."
  ].join("\n");
  static examples = [
    "<%= config.bin %> switchboard deploy doctor --run-dir .switchboard/runs/<id>",
    "<%= config.bin %> switchboard deploy doctor --intent-id di_... --relay-url https://control.switchboard.proof.computer --intent-token-env SWITCHBOARD_INTENT_TOKEN",
    "<%= config.bin %> switchboard deploy doctor --report report.json --probe --json"
  ];
  static flags = {
    help: Flags.help({
      char: "h"
    }),
    json: Flags.boolean({
      description: "Print a redacted JSON diagnostic report."
    }),
    report: Flags.string({
      description: "Read deploy state from a report.json file."
    }),
    "run-dir": Flags.string({
      description: "Read deploy state from a Switchboard deploy run directory."
    }),
    snapshot: Flags.string({
      description: "Read deploy state from a workflow snapshot file."
    }),
    "intent-id": Flags.string({
      description: "Read deploy state by deployment intent id."
    }),
    "relay-url": Flags.string({
      description: "Relay/control-plane base URL for intent and gateway readback."
    }),
    "intent-token-env": Flags.string({
      description: "Environment variable holding the deployment intent read token."
    }),
    "capability-read-token-env": Flags.string({
      description: "Environment variable holding the operator capability read token."
    }),
    "route-state-token-env": Flags.string({
      description: "Environment variable holding the gateway route-state read token."
    }),
    hostname: Flags.string({
      description: "Public hostname to diagnose when it cannot be inferred."
    }),
    "operator-id": Flags.string({
      description: "Operator id to diagnose when it cannot be inferred."
    }),
    "gateway-id": Flags.string({
      description: "Gateway id to diagnose when it cannot be inferred."
    }),
    "processor-id": Flags.string({
      description: "Processor id to diagnose when it cannot be inferred."
    }),
    probe: Flags.boolean({
      description: "Run public TLS/SNI and SSH banner checks."
    }),
    "tls-port": Flags.string({
      description: "Public TLS/SNI port used by --probe.",
      default: "443"
    }),
    "probe-timeout-ms": Flags.string({
      description: "Timeout in milliseconds for --probe.",
      default: "8000"
    }),
    "request-timeout-ms": Flags.string({
      description: "Timeout in milliseconds for relay/gateway readback requests.",
      default: "15000"
    }),
    manifest: Flags.string({
      description: "Network manifest path or URL used to resolve the default relay."
    }),
    context: Flags.string({
      description: "Switchboard context name for runtime defaults."
    }),
    "project-dir": Flags.string({
      description: "Switchboard project directory."
    })
  };
  static strict = false;
  static summary = "Diagnose Switchboard deploy state.";

  async run(): Promise<void> {
    this.parsed = true;
    if (this.argv.includes("--help") || this.argv.includes("-h")) {
      printSwitchboardDeployDoctorHelp(this.config.bin);
      return;
    }
    const exitCode = await runSwitchboardDeployDoctorNative(this.argv);
    if (exitCode !== 0) {
      this.exit(exitCode);
    }
  }
}

export async function runSwitchboardDeployDoctorNative(
  argv: readonly string[],
  options: SwitchboardDeployDoctorOptions = {}
): Promise<number> {
  const runner = options.runner ?? await loadSwitchboardDeployDoctorRunner();
  if (runner) {
    return runSwitchboardDeployDoctorInProcess(runner, argv);
  }
  console.error("[switchboard] Error: internal proof switchboard runner runSwitchboardDeployDoctor is unavailable.");
  return 1;
}

async function loadSwitchboardDeployDoctorRunner(): Promise<RunSwitchboardDeployDoctor | undefined> {
  return defaultRunSwitchboardDeployDoctorRunner;
}

async function runSwitchboardDeployDoctorInProcess(
  runner: RunSwitchboardDeployDoctor,
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

function printSwitchboardDeployDoctorHelp(bin: string): void {
  console.log(`Diagnose Switchboard deploy state.

USAGE
  $ ${bin} switchboard deploy doctor [--report <path> | --run-dir <path> | --snapshot <path> | --intent-id <id>] [--probe] [--json]

FLAGS
  --report <path>                     Read deploy state from a report.json file.
  --run-dir <path>                    Read deploy state from a Switchboard deploy run directory.
  --snapshot <path>                   Read deploy state from a workflow snapshot file.
  --intent-id <id>                    Read deploy state by deployment intent id.
  --relay-url <url>                   Relay/control-plane base URL for intent and gateway readback.
  --intent-token-env <env>            Environment variable holding the deployment intent read token.
  --capability-read-token-env <env>   Environment variable holding the operator capability read token.
  --route-state-token-env <env>       Environment variable holding the gateway route-state read token.
  --hostname <hostname>               Public hostname to diagnose when it cannot be inferred.
  --operator-id <id>                  Operator id to diagnose when it cannot be inferred.
  --gateway-id <id>                   Gateway id to diagnose when it cannot be inferred.
  --processor-id <id>                 Processor id to diagnose when it cannot be inferred.
  --probe                             Run public TLS/SNI and SSH banner checks.
  --tls-port <port>                   Public TLS/SNI port used by --probe. Default: 443.
  --probe-timeout-ms <ms>             Timeout in milliseconds for --probe. Default: 8000.
  --request-timeout-ms <ms>           Timeout in milliseconds for relay/gateway readback requests. Default: 15000.
  --manifest <path-or-url>            Network manifest path or URL used to resolve the default relay.
  --context <name>                    Switchboard context name for runtime defaults.
  --project-dir <path>                Switchboard project directory.
  --json                              Print a redacted JSON diagnostic report.

DESCRIPTION
  Read-only diagnostic. It does not spend, deploy, mutate routes, change DNS, or write settlement state.
  Pass --probe to also run public TLS/SNI and SSH banner checks.

EXAMPLES
  $ ${bin} switchboard deploy doctor --run-dir .switchboard/runs/<id>
  $ ${bin} switchboard deploy doctor --intent-id di_... --relay-url https://control.switchboard.proof.computer --intent-token-env SWITCHBOARD_INTENT_TOKEN
  $ ${bin} switchboard deploy doctor --report report.json --probe --json`);
}
