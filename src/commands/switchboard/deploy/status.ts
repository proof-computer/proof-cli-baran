import { runSwitchboardDeployStatus as defaultRunSwitchboardDeployStatusRunner } from "../../../switchboard-core/cli/src/index.js";
import { Command, Flags } from "@oclif/core";

type RunSwitchboardDeployStatus = (argv?: readonly string[]) => Promise<void>;

export interface SwitchboardDeployStatusOptions {
  runner?: RunSwitchboardDeployStatus;
}

export default class SwitchboardDeployStatus extends Command {
  static description = [
    "Read local Switchboard deploy workflow state without resuming, spending, deploying, or mutating routes.",
    "Use this when a deploy timed out locally and you need the next recovery action from a run directory, report, or workflow snapshot."
  ].join("\n");
  static examples = [
    "<%= config.bin %> switchboard deploy status --run-dir .switchboard/runs/<id>",
    "<%= config.bin %> switchboard deploy status --report report.json --json",
    "<%= config.bin %> switchboard deploy status --snapshot .switchboard/runs/<id>/switchboard-deploy-workflow.snapshot.json"
  ];
  static flags = {
    help: Flags.help({
      char: "h"
    }),
    json: Flags.boolean({
      description: "Print a redacted JSON status report."
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
    context: Flags.string({
      description: "Switchboard context name for runtime defaults."
    }),
    "project-dir": Flags.string({
      description: "Switchboard project directory."
    })
  };
  static strict = false;
  static summary = "Read local Switchboard deploy workflow state.";

  async run(): Promise<void> {
    this.parsed = true;
    if (this.argv.includes("--help") || this.argv.includes("-h")) {
      printSwitchboardDeployStatusHelp(this.config.bin);
      return;
    }
    const exitCode = await runSwitchboardDeployStatusNative(this.argv);
    if (exitCode !== 0) {
      this.exit(exitCode);
    }
  }
}

export async function runSwitchboardDeployStatusNative(
  argv: readonly string[],
  options: SwitchboardDeployStatusOptions = {}
): Promise<number> {
  const runner = options.runner ?? await loadSwitchboardDeployStatusRunner();
  if (runner) {
    return runSwitchboardDeployStatusInProcess(runner, argv);
  }
  console.error("[switchboard] Error: internal proof switchboard runner runSwitchboardDeployStatus is unavailable.");
  return 1;
}

async function loadSwitchboardDeployStatusRunner(): Promise<RunSwitchboardDeployStatus | undefined> {
  return defaultRunSwitchboardDeployStatusRunner;
}

async function runSwitchboardDeployStatusInProcess(
  runner: RunSwitchboardDeployStatus,
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

function printSwitchboardDeployStatusHelp(bin: string): void {
  console.log(`Read local Switchboard deploy workflow state.

USAGE
  $ ${bin} switchboard deploy status [--report <path> | --run-dir <path> | --snapshot <path>] [--json]

FLAGS
  --report <path>      Read deploy state from a report.json file.
  --run-dir <path>     Read deploy state from a Switchboard deploy run directory.
  --snapshot <path>    Read deploy state from a workflow snapshot file.
  --context <name>     Switchboard context name for runtime defaults.
  --project-dir <path> Switchboard project directory.
  --json               Print a redacted JSON status report.

DESCRIPTION
  Read-only local deploy workflow status. It reports the normalized phase,
  schedule expiry warnings, relay readbacks when the local intent token is
  available, and the next recovery action.

EXAMPLES
  $ ${bin} switchboard deploy status --run-dir .switchboard/runs/<id>
  $ ${bin} switchboard deploy status --report report.json --json
  $ ${bin} switchboard deploy status --snapshot .switchboard/runs/<id>/switchboard-deploy-workflow.snapshot.json`);
}
