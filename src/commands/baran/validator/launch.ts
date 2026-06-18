import { runSwitchboardValidatorLaunch as defaultRunSwitchboardValidatorLaunchRunner } from "../../../switchboard-core/cli/src/index.js";
import { Command, Flags } from "@oclif/core";

type RunSwitchboardValidatorLaunch = (argv?: readonly string[]) => Promise<void>;

export interface SwitchboardValidatorLaunchOptions {
  runner?: RunSwitchboardValidatorLaunch;
  loadRunner?: () => Promise<RunSwitchboardValidatorLaunch | undefined>;
}

export default class SwitchboardValidatorLaunch extends Command {
  static description = [
    "Launch Baran validators.",
    "This native proof entrypoint calls the existing baran validator launch implementation."
  ].join("\n");
  static examples = [
    "<%= config.bin %> baran validator launch --processor 5CC2L... --yes",
    "<%= config.bin %> baran validator launch --processors 5CC2L...,5Fh... --json",
    "<%= config.bin %> baran validator launch --manager-id 9470 --count 2 --dry-run"
  ];
  static flags = {
    help: Flags.help({
      char: "h"
    }),
    json: Flags.boolean({
      description: "Print machine-readable output."
    }),
    yes: Flags.boolean({
      description: "Confirm spendful actions."
    }),
    "dry-run": Flags.boolean({
      description: "Plan the validator launch without submitting Acurast transactions."
    }),
    "relay-url": Flags.string({
      description: "Relay API URL validators should use."
    }),
    processor: Flags.string({
      description: "Acurast processor account id."
    }),
    processors: Flags.string({
      description: "Comma-separated Acurast processor account ids."
    }),
    count: Flags.integer({
      description: "Number of validators to launch."
    }),
    "manager-id": Flags.string({
      description: "Acurast manager id for processor discovery."
    }),
    "deployer-seed": Flags.string({
      description: "Acurast deployer seed phrase or URI."
    }),
    "deployer-seed-env": Flags.string({
      description: "Environment variable containing the Acurast deployer seed."
    }),
    "duration-minutes": Flags.integer({
      description: "Acurast job duration in minutes."
    }),
    "schedule-buffer-minutes": Flags.integer({
      description: "Additional schedule runway before the launch start."
    }),
    "execution-ms": Flags.integer({
      description: "Acurast job execution timeout in milliseconds."
    }),
    "start-delay-ms": Flags.integer({
      description: "Delay before the Acurast job can start."
    }),
    "network-requests": Flags.boolean({
      description: "Require Acurast network request support."
    }),
    "max-cost-per-execution": Flags.string({
      description: "Acurast maxCostPerExecution value."
    }),
    "acurast-network": Flags.string({
      description: "Acurast network name."
    }),
    "acurast-rpc": Flags.string({
      description: "Acurast RPC endpoint."
    }),
    "validator-registration-timeout-ms": Flags.integer({
      description: "Milliseconds to wait for validator registration."
    }),
    "manifest-url": Flags.string({
      description: "Network manifest path or URL."
    }),
    "manifest-signer": Flags.string({
      description: "Expected signed manifest signer."
    }),
    "validator-script-manifest-json": Flags.string({
      description: "Inline validator script manifest JSON."
    }),
    "validator-script-manifest-file": Flags.string({
      description: "Path to validator script manifest JSON."
    }),
    "validator-script-manifest-url": Flags.string({
      description: "Validator script manifest URL."
    }),
    context: Flags.string({
      description: "Baran context name for runtime defaults."
    }),
    "project-dir": Flags.string({
      description: "Baran project directory."
    })
  };
  static strict = false;
  static summary = "Launch Baran validators.";

  async run(): Promise<void> {
    this.parsed = true;
    if (this.argv.includes("--help") || this.argv.includes("-h")) {
      printSwitchboardValidatorLaunchHelp(this.config.bin);
      return;
    }
    const exitCode = await runSwitchboardValidatorLaunchNative(this.argv);
    if (exitCode !== 0) {
      this.exit(exitCode);
    }
  }
}

export async function runSwitchboardValidatorLaunchNative(
  argv: readonly string[],
  options: SwitchboardValidatorLaunchOptions = {}
): Promise<number> {
  const loadRunner = options.loadRunner ?? loadSwitchboardValidatorLaunchRunner;
  const runner = options.runner ?? await loadRunner();
  if (runner) {
    return runSwitchboardValidatorLaunchInProcess(runner, argv);
  }
  console.error("[baran] Error: internal proof baran runner runSwitchboardValidatorLaunch is unavailable.");
  return 1;
}

async function loadSwitchboardValidatorLaunchRunner(): Promise<RunSwitchboardValidatorLaunch | undefined> {
  return defaultRunSwitchboardValidatorLaunchRunner;
}

async function runSwitchboardValidatorLaunchInProcess(
  runner: RunSwitchboardValidatorLaunch,
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

function printSwitchboardValidatorLaunchHelp(bin: string): void {
  console.log(`Launch Baran validators.

USAGE
  $ ${bin} baran validator launch [options]

FLAGS
  --processor <id>                         Acurast processor account id.
  --processors <list>                      Comma-separated Acurast processor account ids.
  --count <n>                              Number of validators to launch.
  --manager-id <id>                        Acurast manager id for processor discovery.
  --deployer-seed <seed>                   Acurast deployer seed phrase or URI.
  --deployer-seed-env <name>               Environment variable containing the Acurast deployer seed.
  --duration-minutes <n>                   Acurast job duration in minutes.
  --schedule-buffer-minutes <n>            Additional schedule runway before the launch start.
  --execution-ms <ms>                      Acurast job execution timeout in milliseconds.
  --start-delay-ms <ms>                    Delay before the Acurast job can start.
  --network-requests                       Require Acurast network request support.
  --max-cost-per-execution <value>         Acurast maxCostPerExecution value.
  --acurast-network <name>                 Acurast network name.
  --acurast-rpc <url>                      Acurast RPC endpoint.
  --validator-registration-timeout-ms <ms> Milliseconds to wait for validator registration.
  --relay-url <url>                        Relay API URL validators should use.
  --manifest-url <url>                     Network manifest path or URL.
  --manifest-signer <signer>               Expected signed manifest signer.
  --validator-script-manifest-url <url>    Validator script manifest URL.
  --validator-script-manifest-file <path>  Path to validator script manifest JSON.
  --validator-script-manifest-json <json>  Inline validator script manifest JSON.
  --project-dir <path>                     Baran project directory.
  --context <name>                         Baran context name for runtime defaults.
  --dry-run                                Plan without submitting Acurast transactions.
  --yes                                    Confirm spendful actions.
  --json                                   Print machine-readable output.

DESCRIPTION
  Launches approved Baran validator runtime jobs on selected Acurast
  processors and waits for relay registration unless --dry-run is used.

EXAMPLES
  $ ${bin} baran validator launch --processor 5CC2L... --yes
  $ ${bin} baran validator launch --processors 5CC2L...,5Fh... --json
  $ ${bin} baran validator launch --manager-id 9470 --count 2 --dry-run`);
}
