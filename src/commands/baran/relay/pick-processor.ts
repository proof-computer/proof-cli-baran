import { runSwitchboardRelayPickProcessor as defaultRunSwitchboardRelayPickProcessorRunner } from "../../../switchboard-core/cli/src/index.js";
import { Command, Flags } from "@oclif/core";

type RunSwitchboardRelayPickProcessor = (argv?: readonly string[]) => Promise<void>;

export interface SwitchboardRelayPickProcessorOptions {
  runner?: RunSwitchboardRelayPickProcessor;
  loadRunner?: () => Promise<RunSwitchboardRelayPickProcessor | undefined>;
}

export default class SwitchboardRelayPickProcessor extends Command {
  static description = [
    "Inspect Acurast processor availability for a Baran relay.",
    "This native proof entrypoint calls the existing baran relay pick-processor implementation."
  ].join("\n");
  static examples = [
    "<%= config.bin %> baran relay pick-processor relay-d",
    "<%= config.bin %> baran relay pick-processor relay-d --json",
    "<%= config.bin %> baran relay pick-processor relay-d --pin auto"
  ];
  static flags = {
    help: Flags.help({
      char: "h"
    }),
    "manager-id": Flags.string({
      description: "Acurast manager id to inspect instead of the relay spec manager."
    }),
    rpc: Flags.string({
      description: "Acurast RPC URL."
    }),
    "start-delay-ms": Flags.string({
      description: "Delay before the proposed relay schedule window."
    }),
    "duration-ms": Flags.string({
      description: "Relay execution duration for the availability window."
    }),
    "max-age-seconds": Flags.string({
      description: "Maximum processor heartbeat age to treat as fresh."
    }),
    limit: Flags.string({
      description: "Maximum available processor rows to print."
    }),
    exclude: Flags.string({
      description: "Comma-separated processor addresses to exclude."
    }),
    "include-conflicting": Flags.boolean({
      description: "Include processors with schedule conflicts in output."
    }),
    pin: Flags.string({
      description: 'Update the local relay spec with "auto" or a processor address.'
    }),
    force: Flags.boolean({
      description: "Allow pinning a processor with schedule conflicts."
    }),
    json: Flags.boolean({
      description: "Print machine-readable processor availability output."
    }),
    "ops-profile": Flags.string({
      description: "Baran ops profile for admin defaults."
    }),
    profile: Flags.string({
      description: "Alias for --ops-profile."
    }),
    context: Flags.string({
      description: "Baran context name for runtime defaults."
    }),
    "project-dir": Flags.string({
      description: "Baran project directory."
    })
  };
  static strict = false;
  static summary = "Inspect and optionally pin a relay processor.";

  async run(): Promise<void> {
    this.parsed = true;
    if (this.argv.includes("--help") || this.argv.includes("-h")) {
      printSwitchboardRelayPickProcessorHelp(this.config.bin);
      return;
    }
    const exitCode = await runSwitchboardRelayPickProcessorNative(this.argv);
    if (exitCode !== 0) {
      this.exit(exitCode);
    }
  }
}

export async function runSwitchboardRelayPickProcessorNative(
  argv: readonly string[],
  options: SwitchboardRelayPickProcessorOptions = {}
): Promise<number> {
  const loadRunner = options.loadRunner ?? loadSwitchboardRelayPickProcessorRunner;
  const runner = options.runner ?? await loadRunner();
  if (runner) {
    return runSwitchboardRelayPickProcessorInProcess(runner, argv);
  }
  console.error("[baran] Error: internal proof baran runner runSwitchboardRelayPickProcessor is unavailable.");
  return 1;
}

async function loadSwitchboardRelayPickProcessorRunner(): Promise<RunSwitchboardRelayPickProcessor | undefined> {
  return defaultRunSwitchboardRelayPickProcessorRunner;
}

async function runSwitchboardRelayPickProcessorInProcess(
  runner: RunSwitchboardRelayPickProcessor,
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

function printSwitchboardRelayPickProcessorHelp(bin: string): void {
  console.log(`Inspect Acurast processor availability for a Baran relay.

USAGE
  $ ${bin} baran relay pick-processor <relay-id> [options]

FLAGS
  --manager-id <id>          Acurast manager id to inspect instead of the relay spec manager.
  --rpc <url>                Acurast RPC URL.
  --start-delay-ms <n>       Delay before the proposed relay schedule window.
  --duration-ms <n>          Relay execution duration for the availability window.
  --max-age-seconds <n>      Maximum processor heartbeat age to treat as fresh.
  --limit <n>                Maximum available processor rows to print.
  --exclude <addresses>      Comma-separated processor addresses to exclude.
  --include-conflicting      Include processors with schedule conflicts in output.
  --pin <auto|address>       Update the local relay spec with "auto" or a processor address.
  --force                    Allow pinning a processor with schedule conflicts.
  --json                     Print machine-readable processor availability output.
  --ops-profile <name>       Baran ops profile for admin defaults.
  --profile <name>           Alias for --ops-profile.
  --project-dir <path>       Baran project directory.
  --context <name>           Baran context name for runtime defaults.

DESCRIPTION
  Reads the relay spec, checks Acurast manager processor freshness
  and schedule availability, and prints candidates. With --pin, it updates only
  the local relay spec's acurast.instantMatchProcessors list. It does not
  deploy jobs, publish catalogs, submit transactions, or mutate live relay
  state.

EXAMPLES
  $ ${bin} baran relay pick-processor relay-d
  $ ${bin} baran relay pick-processor relay-d --json
  $ ${bin} baran relay pick-processor relay-d --pin auto`);
}
