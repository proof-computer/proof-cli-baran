import { runSwitchboardRelayStatus as defaultRunSwitchboardRelayStatusRunner } from "../../../switchboard-core/cli/src/index.js";
import { Command, Flags } from "@oclif/core";

type RunSwitchboardRelayStatus = (argv?: readonly string[]) => Promise<void>;

export interface SwitchboardRelayStatusOptions {
  runner?: RunSwitchboardRelayStatus;
  loadRunner?: () => Promise<RunSwitchboardRelayStatus | undefined>;
}

export default class SwitchboardRelayStatus extends Command {
  static description = [
    "Probe Baran relay health and catalog status.",
    "This native proof entrypoint calls the existing baran relay status implementation."
  ].join("\n");
  static examples = [
    "<%= config.bin %> baran relay status",
    "<%= config.bin %> baran relay status relay-d --catalog-file relays/catalog.json --timeout-ms 2500"
  ];
  static flags = {
    help: Flags.help({
      char: "h"
    }),
    "catalog-file": Flags.string({
      description: "Relay catalog JSON file to read."
    }),
    "timeout-ms": Flags.string({
      description: "Per-endpoint probe timeout in milliseconds."
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
  static summary = "Probe relay health and catalogs.";

  async run(): Promise<void> {
    this.parsed = true;
    if (this.argv.includes("--help") || this.argv.includes("-h")) {
      printSwitchboardRelayStatusHelp(this.config.bin);
      return;
    }
    const exitCode = await runSwitchboardRelayStatusNative(this.argv);
    if (exitCode !== 0) {
      this.exit(exitCode);
    }
  }
}

export async function runSwitchboardRelayStatusNative(
  argv: readonly string[],
  options: SwitchboardRelayStatusOptions = {}
): Promise<number> {
  const loadRunner = options.loadRunner ?? loadSwitchboardRelayStatusRunner;
  const runner = options.runner ?? await loadRunner();
  if (runner) {
    return runSwitchboardRelayStatusInProcess(runner, argv);
  }
  console.error("[baran] Error: internal proof baran runner runSwitchboardRelayStatus is unavailable.");
  return 1;
}

async function loadSwitchboardRelayStatusRunner(): Promise<RunSwitchboardRelayStatus | undefined> {
  return defaultRunSwitchboardRelayStatusRunner;
}

async function runSwitchboardRelayStatusInProcess(
  runner: RunSwitchboardRelayStatus,
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

function printSwitchboardRelayStatusHelp(bin: string): void {
  console.log(`Probe Baran relay health and catalog status.

USAGE
  $ ${bin} baran relay status [relay-id] [options]

FLAGS
  --catalog-file <path>  Relay catalog JSON file to read.
  --timeout-ms <ms>     Per-endpoint probe timeout in milliseconds.
  --ops-profile <name>  Baran ops profile for admin defaults.
  --profile <name>      Alias for --ops-profile.
  --project-dir <path>  Baran project directory.
  --context <name>      Baran context name for runtime defaults.

DESCRIPTION
  Reads the local relay catalog and probes each selected relay's /health,
  /v1/relay-status, and /v1/service-catalogs/relay endpoints. Passing a relay
  id limits the probes to that catalog member. The command performs network
  reads only; it does not mutate local files, publish catalogs, deploy jobs,
  submit transactions, or change relay state.

EXAMPLES
  $ ${bin} baran relay status
  $ ${bin} baran relay status relay-d --catalog-file relays/catalog.json --timeout-ms 2500`);
}
