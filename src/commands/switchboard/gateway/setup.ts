import { Command, Flags } from "@oclif/core";

import { runSwitchboardCompatibility } from "../../switchboard.js";

type RunSwitchboardGatewaySetup = (argv?: readonly string[]) => Promise<void>;
type RunSwitchboardCompatibility = (argv: readonly string[]) => Promise<number>;

export interface SwitchboardGatewaySetupOptions {
  runner?: RunSwitchboardGatewaySetup;
  loadRunner?: () => Promise<RunSwitchboardGatewaySetup | undefined>;
  compatibilityRunner?: RunSwitchboardCompatibility;
}

export default class SwitchboardGatewaySetup extends Command {
  static description = [
    "Prepare a Switchboard gateway host.",
    "This native proof entrypoint calls the existing switchboard gateway setup implementation."
  ].join("\n");
  static examples = [
    "<%= config.bin %> switchboard gateway setup",
    "<%= config.bin %> switchboard gateway setup --manager-address 5... --manager-id 9470 --generate-report-seed --prepare-admission",
    "<%= config.bin %> switchboard gateway setup --admission-file operator-admission.json --yes"
  ];
  static flags = {
    help: Flags.help({ char: "h" }),
    json: Flags.boolean({ description: "Print machine-readable output." }),
    yes: Flags.boolean({ description: "Accept install and launch prompts." }),
    "manager-address": Flags.string({ description: "Acurast manager account address to record." }),
    "management-address": Flags.string({ description: "Alias for --manager-address." }),
    "manager-id": Flags.string({ description: "Numeric Acurast manager ID or comma-separated IDs." }),
    "management-id": Flags.string({ description: "Alias for --manager-id." }),
    "operator-id": Flags.string({ description: "Hub operator ID for capability reports." }),
    "gateway-id": Flags.string({ description: "Gateway ID for this site." }),
    processor: Flags.string({ description: "Gateway-local Acurast processor include list." }),
    processors: Flags.string({ description: "Alias for --processor." }),
    "processor-file": Flags.string({ description: "Read processor includes from JSON, CSV, or newline text." }),
    "payout-address": Flags.string({ description: "Operator payout recipient to advertise." }),
    "operator-report-seed-env": Flags.string({ description: "Env var containing the gateway capability report seed." }),
    "generate-report-seed": Flags.boolean({ description: "Generate and store a new local report seed." }),
    "prepare-admission": Flags.boolean({ description: "Write a redacted admission request and skip live launch until admitted." }),
    "admission-request-file": Flags.string({ description: "Admission request output path." }),
    "admission-file": Flags.string({ description: "PROOF-issued admission bundle." }),
    "public-address": Flags.string({ description: "Gateway WAN/public address." }),
    "public-address-mode": Flags.string({ description: "Public address mode: auto or static." }),
    "public-port": Flags.string({ description: "Public HTTPS port." }),
    "gateway-agent-bind-address": Flags.string({ description: "Bind address for the gateway-agent API." }),
    "gateway-agent-port": Flags.string({ description: "Gateway-agent API port." }),
    "upstream-admission-url": Flags.string({ description: "URL relays should use for gateway upstream admission." }),
    "route-state-url": Flags.string({ description: "Gateway route-state polling URL." }),
    "route-state-token-env": Flags.string({ description: "Env var containing the route-state bearer token." }),
    "route-intent-token-env": Flags.string({ description: "Env var containing the gateway route-intent bearer token." }),
    "capability-url": Flags.string({ description: "Gateway capability report URL." }),
    "capability-token-env": Flags.string({ description: "Env var containing the capability bearer token." }),
    "project-dir": Flags.string({ description: "Gateway project directory." }),
    "compose-file": Flags.string({ description: "Docker Compose file path." }),
    "env-file": Flags.string({ description: "Compose env file path." }),
    "image-registry": Flags.string({ description: "Gateway image registry namespace." }),
    "image-tag": Flags.string({ description: "Gateway image tag." }),
    network: Flags.string({ description: "Acurast network, for example mainnet." }),
    "skip-install": Flags.boolean({ description: "Do not install Docker/Compose if missing." }),
    "skip-compose": Flags.boolean({ description: "Write config but do not launch compose." }),
    "local-build": Flags.boolean({ description: "Build local repo images instead of pulling prebuilt images." }),
    "local-only": Flags.boolean({ description: "Allow setup without relay admission/reporting material." }),
    "dry-run": Flags.boolean({ description: "Print checks and planned actions without changing the host." })
  };
  static strict = false;
  static summary = "Prepare a Switchboard gateway host.";

  async run(): Promise<void> {
    this.parsed = true;
    if (this.argv.includes("--help") || this.argv.includes("-h")) {
      printSwitchboardGatewaySetupHelp(this.config.bin);
      return;
    }
    const exitCode = await runSwitchboardGatewaySetupNative(this.argv);
    if (exitCode !== 0) {
      this.exit(exitCode);
    }
  }
}

export async function runSwitchboardGatewaySetupNative(
  argv: readonly string[],
  options: SwitchboardGatewaySetupOptions = {}
): Promise<number> {
  const loadRunner = options.loadRunner ?? loadSwitchboardGatewaySetupRunner;
  const runner = options.runner ?? await loadRunner();
  if (runner) {
    return runSwitchboardGatewaySetupInProcess(runner, argv);
  }
  const compatibilityRunner = options.compatibilityRunner ?? runSwitchboardCompatibility;
  return compatibilityRunner(["gateway", "setup", ...argv]);
}

async function loadSwitchboardGatewaySetupRunner(): Promise<RunSwitchboardGatewaySetup | undefined> {
  try {
    const module = await import("@proof-computer/switchboard-cli");
    return typeof module.runSwitchboardGatewaySetup === "function"
      ? module.runSwitchboardGatewaySetup
      : undefined;
  } catch {
    return undefined;
  }
}

async function runSwitchboardGatewaySetupInProcess(
  runner: RunSwitchboardGatewaySetup,
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

function printSwitchboardGatewaySetupHelp(bin: string): void {
  console.log(`Prepare a Switchboard gateway host.

USAGE
  $ ${bin} switchboard gateway setup [options]

FLAGS
  --manager-address <address>      Acurast manager account address to record.
  --manager-id <id[,id...]>        Numeric Acurast manager ID(s).
  --operator-id <bytes32>          Hub operator ID for capability reports.
  --gateway-id <id>                Gateway ID for this site.
  --processor <ref[,ref...]>       Gateway-local processor include list.
  --processor-file <path>          Read processor includes from a file.
  --generate-report-seed           Generate and store a local report seed.
  --prepare-admission              Write a redacted admission request and stop before launch.
  --admission-file <path>          Apply a PROOF-issued admission bundle.
  --gateway-agent-bind-address <addr>
                                  Bind address for the gateway-agent API.
  --gateway-agent-port <port>      Gateway-agent API port.
  --upstream-admission-url <url>   URL relays should use for gateway upstream admission.
  --route-state-url <url>          Gateway route-state polling URL.
  --route-state-token-env <env>    Env var containing the route-state bearer token.
  --route-intent-token-env <env>   Env var containing the route-intent bearer token.
  --capability-url <url>           Gateway capability report URL.
  --capability-token-env <env>     Env var containing the capability bearer token.
  --project-dir <path>             Gateway project directory.
  --env-file <path>                Compose env file path.
  --skip-install                   Do not install Docker/Compose if missing.
  --skip-compose                   Write config but do not launch compose.
  --local-build                    Build local repo images.
  --local-only                     Allow setup without relay admission material.
  --dry-run                        Print planned actions only.
  --yes                            Accept install and launch prompts.
  --json                           Print machine-readable output.

DESCRIPTION
  Prepares the host Docker/Compose config, gateway-agent, Envoy, hub-watcher,
  route-state polling, capability reporting, and gateway upstream-admission
  onboarding material. It stores secret values in the env file and redacts
  them from JSON reports.

EXAMPLES
  $ ${bin} switchboard gateway setup
  $ ${bin} switchboard gateway setup --manager-address 5... --manager-id 9470 --generate-report-seed --prepare-admission
  $ ${bin} switchboard gateway setup --admission-file operator-admission.json --yes`);
}
