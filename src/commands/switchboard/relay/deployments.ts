import { Command, Flags } from "@oclif/core";

import { runSwitchboardCompatibility } from "../../switchboard.js";

type RunSwitchboardRelayDeployments = (argv?: readonly string[]) => Promise<void>;
type RunSwitchboardCompatibility = (argv: readonly string[]) => Promise<number>;

export interface SwitchboardRelayDeploymentsOptions {
  runner?: RunSwitchboardRelayDeployments;
  loadRunner?: () => Promise<RunSwitchboardRelayDeployments | undefined>;
  compatibilityRunner?: RunSwitchboardCompatibility;
}

export default class SwitchboardRelayDeployments extends Command {
  static description = [
    "Show Switchboard relay deployment history.",
    "This native proof entrypoint calls the existing local-history switchboard relay deployments implementation."
  ].join("\n");
  static examples = [
    "<%= config.bin %> switchboard relay deployments relay-d",
    "<%= config.bin %> switchboard relay deployments relay-d --json"
  ];
  static flags = {
    help: Flags.help({
      char: "h"
    }),
    json: Flags.boolean({
      description: "Print machine-readable relay deployment history."
    }),
    "ops-profile": Flags.string({
      description: "Switchboard ops profile for admin defaults."
    }),
    profile: Flags.string({
      description: "Alias for --ops-profile."
    }),
    context: Flags.string({
      description: "Switchboard context name for runtime defaults."
    }),
    "project-dir": Flags.string({
      description: "Switchboard project directory."
    })
  };
  static strict = false;
  static summary = "Show relay deployment history.";

  async run(): Promise<void> {
    this.parsed = true;
    if (this.argv.includes("--help") || this.argv.includes("-h")) {
      printSwitchboardRelayDeploymentsHelp(this.config.bin);
      return;
    }
    const exitCode = await runSwitchboardRelayDeploymentsNative(this.argv);
    if (exitCode !== 0) {
      this.exit(exitCode);
    }
  }
}

export async function runSwitchboardRelayDeploymentsNative(
  argv: readonly string[],
  options: SwitchboardRelayDeploymentsOptions = {}
): Promise<number> {
  const loadRunner = options.loadRunner ?? loadSwitchboardRelayDeploymentsRunner;
  const runner = options.runner ?? await loadRunner();
  if (runner) {
    return runSwitchboardRelayDeploymentsInProcess(runner, argv);
  }
  const compatibilityRunner = options.compatibilityRunner ?? runSwitchboardCompatibility;
  return compatibilityRunner(["relay", "deployments", ...argv]);
}

async function loadSwitchboardRelayDeploymentsRunner(): Promise<RunSwitchboardRelayDeployments | undefined> {
  try {
    const module = await import("@proof-computer/switchboard-cli");
    return typeof module.runSwitchboardRelayDeployments === "function"
      ? module.runSwitchboardRelayDeployments
      : undefined;
  } catch {
    return undefined;
  }
}

async function runSwitchboardRelayDeploymentsInProcess(
  runner: RunSwitchboardRelayDeployments,
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

function printSwitchboardRelayDeploymentsHelp(bin: string): void {
  console.log(`Show Switchboard relay deployment history.

USAGE
  $ ${bin} switchboard relay deployments <relay-id> [options]

FLAGS
  --json                  Print machine-readable relay deployment history.
  --ops-profile <name>    Switchboard ops profile for admin defaults.
  --profile <name>        Alias for --ops-profile.
  --project-dir <path>    Switchboard project directory.
  --context <name>        Switchboard context name for runtime defaults.

DESCRIPTION
  Reads .switchboard/relays/<relay-id>.history.json and prints the recorded
  local deployment attempts for that relay. The command performs local file
  reads only; it does not probe relays, publish catalogs, deploy jobs, submit
  transactions, or change relay state.

EXAMPLES
  $ ${bin} switchboard relay deployments relay-d
  $ ${bin} switchboard relay deployments relay-d --json`);
}
