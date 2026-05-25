import { Command, Flags } from "@oclif/core";

import { runSwitchboardCompatibility } from "../../switchboard.js";

type RunSwitchboardGatewayUpgrade = (argv?: readonly string[]) => Promise<void>;
type RunSwitchboardCompatibility = (argv: readonly string[]) => Promise<number>;

export interface SwitchboardGatewayUpgradeOptions {
  runner?: RunSwitchboardGatewayUpgrade;
  loadRunner?: () => Promise<RunSwitchboardGatewayUpgrade | undefined>;
  compatibilityRunner?: RunSwitchboardCompatibility;
}

export default class SwitchboardGatewayUpgrade extends Command {
  static description = [
    "Upgrade the local Switchboard gateway stack.",
    "This native proof entrypoint calls the existing switchboard gateway upgrade implementation."
  ].join("\n");
  static examples = [
    "<%= config.bin %> switchboard gateway upgrade --yes",
    "<%= config.bin %> switchboard gateway upgrade --project-dir /srv/proof --dry-run"
  ];
  static flags = {
    help: Flags.help({ char: "h" }),
    json: Flags.boolean({ description: "Print machine-readable output when supported by the underlying command." }),
    yes: Flags.boolean({ description: "Accept upgrade prompts." }),
    "project-dir": Flags.string({ description: "Gateway project directory." }),
    "compose-file": Flags.string({ description: "Docker Compose file path." }),
    "env-file": Flags.string({ description: "Compose env file path." }),
    "image-registry": Flags.string({ description: "Gateway image registry namespace." }),
    "image-tag": Flags.string({ description: "Gateway image tag." }),
    "local-build": Flags.boolean({ description: "Build local repo images instead of pulling prebuilt images." }),
    "dry-run": Flags.boolean({ description: "Print docker compose commands only." }),
    "keep-image-override": Flags.boolean({ description: "Keep old/custom image env overrides." })
  };
  static strict = false;
  static summary = "Upgrade the gateway stack.";

  async run(): Promise<void> {
    this.parsed = true;
    if (this.argv.includes("--help") || this.argv.includes("-h")) {
      printSwitchboardGatewayUpgradeHelp(this.config.bin);
      return;
    }
    const exitCode = await runSwitchboardGatewayUpgradeNative(this.argv);
    if (exitCode !== 0) {
      this.exit(exitCode);
    }
  }
}

export async function runSwitchboardGatewayUpgradeNative(
  argv: readonly string[],
  options: SwitchboardGatewayUpgradeOptions = {}
): Promise<number> {
  const loadRunner = options.loadRunner ?? loadSwitchboardGatewayUpgradeRunner;
  const runner = options.runner ?? await loadRunner();
  if (runner) {
    return runSwitchboardGatewayUpgradeInProcess(runner, argv);
  }
  const compatibilityRunner = options.compatibilityRunner ?? runSwitchboardCompatibility;
  return compatibilityRunner(["gateway", "upgrade", ...argv]);
}

async function loadSwitchboardGatewayUpgradeRunner(): Promise<RunSwitchboardGatewayUpgrade | undefined> {
  try {
    const module = await import("@proof-computer/switchboard-cli");
    return typeof module.runSwitchboardGatewayUpgrade === "function"
      ? module.runSwitchboardGatewayUpgrade
      : undefined;
  } catch {
    return undefined;
  }
}

async function runSwitchboardGatewayUpgradeInProcess(
  runner: RunSwitchboardGatewayUpgrade,
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

function printSwitchboardGatewayUpgradeHelp(bin: string): void {
  console.log(`Upgrade the local Switchboard gateway stack.

USAGE
  $ ${bin} switchboard gateway upgrade --yes [options]

FLAGS
  --project-dir <path>       Gateway project directory.
  --compose-file <path>      Docker Compose file path.
  --env-file <path>          Compose env file path.
  --image-registry <ns>      Gateway image registry namespace.
  --image-tag <tag>          Gateway image tag.
  --local-build              Build local repo images.
  --dry-run                  Print docker compose commands only.
  --keep-image-override      Keep old/custom image env overrides.
  --yes                      Accept upgrade prompts.

DESCRIPTION
  Pulls current gateway images, migrates known old default gateway image refs
  unless told otherwise, and recreates the Docker Compose stack. It does not
  change relay admission policy or allocate processors.

EXAMPLES
  $ ${bin} switchboard gateway upgrade --yes
  $ ${bin} switchboard gateway upgrade --project-dir /srv/proof --dry-run`);
}
