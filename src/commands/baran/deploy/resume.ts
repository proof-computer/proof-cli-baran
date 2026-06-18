import { runSwitchboardDeployResume as defaultRunSwitchboardDeployResumeRunner } from "../../../switchboard-core/cli/src/index.js";
import { Command, Flags } from "@oclif/core";

type RunSwitchboardDeployResume = (argv?: readonly string[]) => Promise<void>;

export interface SwitchboardDeployResumeOptions {
  runner?: RunSwitchboardDeployResume;
}

export default class SwitchboardDeployResume extends Command {
  static description = [
    "Resume a single-replica Baran deploy workflow from local private state.",
    "This can spend from an existing deployment intent quote, so --yes is required. Late funding still requires --allow-late-funding."
  ].join("\n");
  static examples = [
    "<%= config.bin %> baran deploy resume --run-dir .switchboard/runs/<id> --yes",
    "<%= config.bin %> baran deploy resume --snapshot .switchboard/runs/<id>/switchboard-deploy-workflow.private.json --yes --json",
    "<%= config.bin %> baran deploy resume --report report.json --yes --allow-late-funding"
  ];
  static flags = {
    help: Flags.help({
      char: "h"
    }),
    json: Flags.boolean({
      description: "Print a redacted JSON resume status report."
    }),
    report: Flags.string({
      description: "Resume from a report.json file with local private state."
    }),
    "run-dir": Flags.string({
      description: "Resume from a Baran deploy run directory."
    }),
    snapshot: Flags.string({
      description: "Resume from a deploy workflow snapshot file."
    }),
    yes: Flags.boolean({
      description: "Confirm resume actions that may continue funding/deploy recovery."
    }),
    "allow-late-funding": Flags.boolean({
      description: "Allow funding after the Acurast start window has expired."
    }),
    context: Flags.string({
      description: "Baran context name for runtime defaults."
    }),
    "project-dir": Flags.string({
      description: "Baran project directory."
    })
  };
  static strict = false;
  static summary = "Resume a single-replica Baran deploy workflow.";

  async run(): Promise<void> {
    this.parsed = true;
    if (this.argv.includes("--help") || this.argv.includes("-h")) {
      printSwitchboardDeployResumeHelp(this.config.bin);
      return;
    }
    const exitCode = await runSwitchboardDeployResumeNative(this.argv);
    if (exitCode !== 0) {
      this.exit(exitCode);
    }
  }
}

export async function runSwitchboardDeployResumeNative(
  argv: readonly string[],
  options: SwitchboardDeployResumeOptions = {}
): Promise<number> {
  const runner = options.runner ?? await loadSwitchboardDeployResumeRunner();
  if (runner) {
    return runSwitchboardDeployResumeInProcess(runner, argv);
  }
  console.error("[baran] Error: internal proof baran runner runSwitchboardDeployResume is unavailable.");
  return 1;
}

async function loadSwitchboardDeployResumeRunner(): Promise<RunSwitchboardDeployResume | undefined> {
  return defaultRunSwitchboardDeployResumeRunner;
}

async function runSwitchboardDeployResumeInProcess(
  runner: RunSwitchboardDeployResume,
  argv: readonly string[]
): Promise<number> {
  try {
    await runner(argv);
    return typeof process.exitCode === "number" ? process.exitCode : 0;
  } catch (error) {
    if (!switchboardOutputHandled(error)) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`[baran] ${message}`);
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

function printSwitchboardDeployResumeHelp(bin: string): void {
  console.log(`Resume a single-replica Baran deploy workflow.

USAGE
  $ ${bin} baran deploy resume [--report <path> | --run-dir <path> | --snapshot <path>] --yes [--allow-late-funding] [--json]

FLAGS
  --report <path>          Resume from a report.json file with local private state.
  --run-dir <path>         Resume from a Baran deploy run directory.
  --snapshot <path>        Resume from a deploy workflow snapshot file.
  --yes                    Confirm resume actions that may continue funding/deploy recovery.
  --allow-late-funding     Allow funding after the Acurast start window has expired.
  --context <name>         Baran context name for runtime defaults.
  --project-dir <path>     Baran project directory.
  --json                   Print a redacted JSON resume status report.

DESCRIPTION
  Recovery command for an existing single-replica deploy workflow. It does not
  create a new deployment intent. It reuses local private workflow state when
  available, refuses HA/group resume, requires --yes, and refuses late funding
  unless --allow-late-funding is explicit.

EXAMPLES
  $ ${bin} baran deploy resume --run-dir .switchboard/runs/<id> --yes
  $ ${bin} baran deploy resume --snapshot .switchboard/runs/<id>/switchboard-deploy-workflow.private.json --yes --json
  $ ${bin} baran deploy resume --report report.json --yes --allow-late-funding`);
}
