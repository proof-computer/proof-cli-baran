import { runSwitchboardRelayBudget as defaultRunSwitchboardRelayBudgetRunner } from "../../../switchboard-core/cli/src/index.js";
import { Command, Flags } from "@oclif/core";

type RunSwitchboardRelayBudget = (argv?: readonly string[]) => Promise<void>;

export interface SwitchboardRelayBudgetOptions {
  runner?: RunSwitchboardRelayBudget;
  loadRunner?: () => Promise<RunSwitchboardRelayBudget | undefined>;
}

export default class SwitchboardRelayBudget extends Command {
  static description = [
    "Calculate a Switchboard relay execution budget.",
    "This native proof entrypoint calls the existing local switchboard relay budget implementation."
  ].join("\n");
  static examples = [
    "<%= config.bin %> switchboard relay budget 7d",
    "<%= config.bin %> switchboard relay budget 24h --margin-percent 20",
    "<%= config.bin %> switchboard relay budget 7d --update relays/relay-d.json"
  ];
  static flags = {
    help: Flags.help({
      char: "h"
    }),
    json: Flags.boolean({
      description: "Print machine-readable budget output."
    }),
    "rate-per-ms": Flags.string({
      description: "Cost rate in units per execution millisecond."
    }),
    "margin-percent": Flags.string({
      description: "Safety margin percentage to add to the base cost."
    }),
    update: Flags.string({
      description: "Update an Acurast relay spec file with the computed budget."
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
  static summary = "Calculate a relay execution budget.";

  async run(): Promise<void> {
    this.parsed = true;
    if (this.argv.includes("--help") || this.argv.includes("-h")) {
      printSwitchboardRelayBudgetHelp(this.config.bin);
      return;
    }
    const exitCode = await runSwitchboardRelayBudgetNative(this.argv);
    if (exitCode !== 0) {
      this.exit(exitCode);
    }
  }
}

export async function runSwitchboardRelayBudgetNative(
  argv: readonly string[],
  options: SwitchboardRelayBudgetOptions = {}
): Promise<number> {
  const loadRunner = options.loadRunner ?? loadSwitchboardRelayBudgetRunner;
  const runner = options.runner ?? await loadRunner();
  if (runner) {
    return runSwitchboardRelayBudgetInProcess(runner, argv);
  }
  console.error("[switchboard] Error: internal proof switchboard runner runSwitchboardRelayBudget is unavailable.");
  return 1;
}

async function loadSwitchboardRelayBudgetRunner(): Promise<RunSwitchboardRelayBudget | undefined> {
  return defaultRunSwitchboardRelayBudgetRunner;
}

async function runSwitchboardRelayBudgetInProcess(
  runner: RunSwitchboardRelayBudget,
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

function printSwitchboardRelayBudgetHelp(bin: string): void {
  console.log(`Calculate a Switchboard relay execution budget.

USAGE
  $ ${bin} switchboard relay budget <duration> [options]

FLAGS
  --json                  Print machine-readable budget output.
  --rate-per-ms <n>       Cost rate in units per execution millisecond.
  --margin-percent <n>    Safety margin percentage to add to the base cost.
  --update <path>         Update an Acurast relay spec file with the computed budget.
  --ops-profile <name>    Switchboard ops profile for admin defaults.
  --profile <name>        Alias for --ops-profile.
  --project-dir <path>    Switchboard project directory.
  --context <name>        Switchboard context name for runtime defaults.

DESCRIPTION
  Computes the recommended maxCostPerExecution for a relay execution duration.
  With --update, the command updates the selected local Acurast relay spec with
  executionMs and maxCostPerExecution. It does not probe relays, publish
  catalogs, deploy jobs, submit transactions, or mutate live relay state.

EXAMPLES
  $ ${bin} switchboard relay budget 7d
  $ ${bin} switchboard relay budget 24h --margin-percent 20
  $ ${bin} switchboard relay budget 7d --update relays/relay-d.json`);
}
