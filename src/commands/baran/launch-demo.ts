import { runSwitchboardLaunchDemo as defaultRunSwitchboardLaunchDemoRunner } from "../../switchboard-core/cli/src/index.js";
import { Command, Flags } from "@oclif/core";
import {
  createSwitchboardDeployProgressReporter,
  type SwitchboardRunnerOptions
} from "../../switchboard-progress.js";

type RunSwitchboardLaunchDemo = (argv?: readonly string[], options?: SwitchboardRunnerOptions) => Promise<void>;

export interface SwitchboardLaunchDemoOptions {
  runner?: RunSwitchboardLaunchDemo;
}

export default class SwitchboardLaunchDemo extends Command {
  static description = [
    "Launch the bundled Baran demo on current live operator capacity.",
    "This is the native proof entrypoint for the existing baran launch-demo workflow. It can spend ACU and the configured Hub payment asset, so --yes-spend is required unless --dry-run is used."
  ].join("\n");
  static examples = [
    "<%= config.bin %> baran launch-demo --yes-spend",
    "<%= config.bin %> baran launch-demo --dry-run --json",
    "<%= config.bin %> baran launch-demo --ha --yes-spend"
  ];
  static flags = {
    help: Flags.help({
      char: "h"
    }),
    "yes-spend": Flags.boolean({
      description: "Confirm launch-demo spend."
    }),
    "dry-run": Flags.boolean({
      description: "Print selected capacity and planned config without side effects."
    }),
    json: Flags.boolean({
      description: "Print machine-readable output."
    }),
    ha: Flags.boolean({
      description: "Request a 3-processor HA endpoint group."
    }),
    "processor-count": Flags.string({
      description: "Number of processors to launch for HA."
    }),
    "min-ready": Flags.string({
      description: "Minimum successful replicas required."
    }),
    "demo-package": Flags.string({
      description: "Demo package spec."
    }),
    "relay-url": Flags.string({
      description: "Relay/control-plane base URL."
    }),
    "operator-id": Flags.string({
      description: "Pin launch-demo capacity to one operator ID."
    }),
    "gateway-id": Flags.string({
      description: "Pin launch-demo capacity to one gateway ID."
    }),
    processor: Flags.string({
      description: "Pin launch-demo capacity to one Acurast processor."
    }),
    "duration-minutes": Flags.string({
      description: "Lease duration in minutes."
    }),
    "max-cost-per-execution": Flags.string({
      description: "Maximum Acurast cost per execution."
    }),
    "quote-preview-timeout-ms": Flags.string({
      description: "Ingress quote preview timeout in milliseconds."
    }),
    "quote-preview-retries": Flags.string({
      description: "Ingress quote preview retry count."
    }),
    "public-probe-timeout-ms": Flags.string({
      description: "Final public URL readiness probe timeout in milliseconds."
    }),
    "public-readiness-wait-seconds": Flags.string({
      description: "Total time to wait for the public URL to become ready before failing."
    }),
    "public-readiness-poll-seconds": Flags.string({
      description: "Interval between public URL readiness probes while waiting."
    }),
    manifest: Flags.string({
      description: "Network manifest path or URL."
    }),
    context: Flags.string({
      description: "Baran context name for runtime defaults."
    }),
    "project-dir": Flags.string({
      description: "Baran project directory."
    })
  };
  static strict = false;
  static summary = "Launch the bundled Baran demo.";

  async run(): Promise<void> {
    this.parsed = true;
    if (this.argv.includes("--help") || this.argv.includes("-h")) {
      printSwitchboardLaunchDemoHelp(this.config.bin);
      return;
    }
    const exitCode = await runSwitchboardLaunchDemoNative(this.argv);
    if (exitCode !== 0) {
      this.exit(exitCode);
    }
  }
}

export async function runSwitchboardLaunchDemoNative(
  argv: readonly string[],
  options: SwitchboardLaunchDemoOptions = {}
): Promise<number> {
  const runner = options.runner ?? await loadSwitchboardLaunchDemoRunner();
  if (runner) {
    return runSwitchboardLaunchDemoInProcess(runner, argv);
  }
  console.error("[baran] Error: internal proof baran runner runSwitchboardLaunchDemo is unavailable.");
  return 1;
}

async function loadSwitchboardLaunchDemoRunner(): Promise<RunSwitchboardLaunchDemo | undefined> {
  return defaultRunSwitchboardLaunchDemoRunner;
}

async function runSwitchboardLaunchDemoInProcess(
  runner: RunSwitchboardLaunchDemo,
  argv: readonly string[]
): Promise<number> {
  const progress = createSwitchboardDeployProgressReporter({
    action: "launch-demo",
    argv
  });
  try {
    await runner(argv, progress ? { progress: progress.progress } : undefined);
    progress?.complete();
    return typeof process.exitCode === "number" ? process.exitCode : 0;
  } catch (error) {
    progress?.failed(error);
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

function printSwitchboardLaunchDemoHelp(bin: string): void {
  console.log(`Launch the bundled Baran demo.

USAGE
  $ ${bin} baran launch-demo --yes-spend [--json]
  $ ${bin} baran launch-demo --dry-run [--json]

FLAGS
  --yes-spend                     Required unless --dry-run; confirms spend.
  --dry-run                       Print selected capacity and planned config without side effects.
  --ha                            Request a 3-processor HA endpoint group.
  --processor-count <n>           Number of processors to launch for HA.
  --min-ready <n>                 Minimum successful replicas required.
  --demo-package <spec>           Demo package spec.
  --relay-url <url>               Relay/control-plane base URL.
  --operator-id <id>              Pin launch-demo capacity to one operator ID.
  --gateway-id <id>               Pin launch-demo capacity to one gateway ID.
  --processor <account>           Pin launch-demo capacity to one Acurast processor.
  --duration-minutes <minutes>    Lease duration in minutes.
  --max-cost-per-execution <n>    Maximum Acurast cost per execution.
  --quote-preview-timeout-ms <ms> Ingress quote preview timeout in milliseconds.
  --quote-preview-retries <n>     Ingress quote preview retry count.
  --public-probe-timeout-ms <ms>  Final public URL readiness probe timeout in milliseconds.
  --public-readiness-wait-seconds <s>  Total time to wait for the public URL to become ready.
  --public-readiness-poll-seconds <s>  Interval between public URL readiness probes.
  --manifest <path-or-url>        Network manifest path or URL.
  --context <name>                Baran context name for runtime defaults.
  --project-dir <path>            Baran project directory.
  --json                          Print machine-readable output.

DESCRIPTION
  Native proof CLI entrypoint for the existing baran launch-demo workflow.
  It preserves the current beginner path, capacity selection, fixed 3 minute
  Acurast start delay, IPFS upload preflight, and HA behavior.

EXAMPLES
  $ ${bin} baran launch-demo --yes-spend
  $ ${bin} baran launch-demo --dry-run --json
  $ ${bin} baran launch-demo --ha --yes-spend`);
}
