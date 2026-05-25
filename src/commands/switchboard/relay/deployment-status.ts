import { Command, Flags } from "@oclif/core";

import { runSwitchboardCompatibility } from "../../switchboard.js";

type RunSwitchboardRelayDeploymentStatus = (argv?: readonly string[]) => Promise<void>;
type RunSwitchboardCompatibility = (argv: readonly string[]) => Promise<number>;

export interface SwitchboardRelayDeploymentStatusOptions {
  runner?: RunSwitchboardRelayDeploymentStatus;
  loadRunner?: () => Promise<RunSwitchboardRelayDeploymentStatus | undefined>;
  compatibilityRunner?: RunSwitchboardCompatibility;
}

export default class SwitchboardRelayDeploymentStatus extends Command {
  static description = [
    "Read Acurast deployment status for a Switchboard relay.",
    "This native proof entrypoint calls the existing read-only switchboard relay deployment-status implementation."
  ].join("\n");
  static examples = [
    "<%= config.bin %> switchboard relay deployment-status relay-d",
    "<%= config.bin %> switchboard relay deployment-status relay-d --deployment-id 51808",
    "<%= config.bin %> switchboard relay deployment-status relay-d --spec relays/relay-d.json"
  ];
  static flags = {
    help: Flags.help({
      char: "h"
    }),
    "deployment-id": Flags.string({
      description: "Acurast job sequence to inspect instead of resolving the latest local deployment."
    }),
    spec: Flags.string({
      description: "Relay deployment spec path."
    }),
    "spec-file": Flags.string({
      description: "Alias for --spec."
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
  static summary = "Read relay Acurast deployment status.";

  async run(): Promise<void> {
    this.parsed = true;
    if (this.argv.includes("--help") || this.argv.includes("-h")) {
      printSwitchboardRelayDeploymentStatusHelp(this.config.bin);
      return;
    }
    const exitCode = await runSwitchboardRelayDeploymentStatusNative(this.argv);
    if (exitCode !== 0) {
      this.exit(exitCode);
    }
  }
}

export async function runSwitchboardRelayDeploymentStatusNative(
  argv: readonly string[],
  options: SwitchboardRelayDeploymentStatusOptions = {}
): Promise<number> {
  const loadRunner = options.loadRunner ?? loadSwitchboardRelayDeploymentStatusRunner;
  const runner = options.runner ?? await loadRunner();
  if (runner) {
    return runSwitchboardRelayDeploymentStatusInProcess(runner, argv);
  }
  const compatibilityRunner = options.compatibilityRunner ?? runSwitchboardCompatibility;
  return compatibilityRunner(["relay", "deployment-status", ...argv]);
}

async function loadSwitchboardRelayDeploymentStatusRunner(): Promise<RunSwitchboardRelayDeploymentStatus | undefined> {
  try {
    const module = await import("@proof-computer/switchboard-cli");
    return typeof module.runSwitchboardRelayDeploymentStatus === "function"
      ? module.runSwitchboardRelayDeploymentStatus
      : undefined;
  } catch {
    return undefined;
  }
}

async function runSwitchboardRelayDeploymentStatusInProcess(
  runner: RunSwitchboardRelayDeploymentStatus,
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

function printSwitchboardRelayDeploymentStatusHelp(bin: string): void {
  console.log(`Read Acurast deployment status for a Switchboard relay.

USAGE
  $ ${bin} switchboard relay deployment-status <relay-id> [options]

FLAGS
  --deployment-id <n>     Acurast job sequence to inspect instead of resolving the latest local deployment.
  --spec <path>           Relay deployment spec path.
  --spec-file <path>      Alias for --spec.
  --ops-profile <name>    Switchboard ops profile for admin defaults.
  --profile <name>        Alias for --ops-profile.
  --project-dir <path>    Switchboard project directory.
  --context <name>        Switchboard context name for runtime defaults.

DESCRIPTION
  Resolves the selected relay's Acurast deployment spec, picks the explicit
  deployment id or the latest local stage/history deployment id, and runs the
  packaged read-only Acurast status helper. It does not deploy jobs, publish
  catalogs, submit transactions, or mutate relay state.

EXAMPLES
  $ ${bin} switchboard relay deployment-status relay-d
  $ ${bin} switchboard relay deployment-status relay-d --deployment-id 51808
  $ ${bin} switchboard relay deployment-status relay-d --spec relays/relay-d.json`);
}
