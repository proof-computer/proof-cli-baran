import { runSwitchboardRelayCatalogSetState as defaultRunSwitchboardRelayCatalogSetStateRunner } from "../../../../switchboard-core/cli/src/index.js";
import { Command, Flags } from "@oclif/core";

type RunSwitchboardRelayCatalogSetState = (argv?: readonly string[]) => Promise<void>;

export interface SwitchboardRelayCatalogSetStateOptions {
  runner?: RunSwitchboardRelayCatalogSetState;
  loadRunner?: () => Promise<RunSwitchboardRelayCatalogSetState | undefined>;
}

export default class SwitchboardRelayCatalogSetState extends Command {
  static aliases = [
    "baran relay catalog state"
  ];
  static description = [
    "Update local Baran relay catalog state.",
    "This native proof entrypoint calls the existing local baran relay catalog set-state implementation."
  ].join("\n");
  static examples = [
    "<%= config.bin %> baran relay catalog set-state relay-d active",
    "<%= config.bin %> baran relay catalog set-state relay-d draining --catalog-file relays/catalog.json --no-rebuild",
    "<%= config.bin %> baran relay catalog state relay-d disabled"
  ];
  static flags = {
    help: Flags.help({
      char: "h"
    }),
    "catalog-file": Flags.string({
      description: "Relay catalog state file to update."
    }),
    "no-rebuild": Flags.boolean({
      description: "Update the relay catalog file without rebuilding the signed catalog bundle."
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
  static summary = "Update relay catalog state.";

  async run(): Promise<void> {
    this.parsed = true;
    if (this.argv.includes("--help") || this.argv.includes("-h")) {
      printSwitchboardRelayCatalogSetStateHelp(this.config.bin);
      return;
    }
    const exitCode = await runSwitchboardRelayCatalogSetStateNative(this.argv);
    if (exitCode !== 0) {
      this.exit(exitCode);
    }
  }
}

export async function runSwitchboardRelayCatalogSetStateNative(
  argv: readonly string[],
  options: SwitchboardRelayCatalogSetStateOptions = {}
): Promise<number> {
  const loadRunner = options.loadRunner ?? loadSwitchboardRelayCatalogSetStateRunner;
  const runner = options.runner ?? await loadRunner();
  if (runner) {
    return runSwitchboardRelayCatalogSetStateInProcess(runner, argv);
  }
  console.error("[baran] Error: internal proof baran runner runSwitchboardRelayCatalogSetState is unavailable.");
  return 1;
}

async function loadSwitchboardRelayCatalogSetStateRunner(): Promise<RunSwitchboardRelayCatalogSetState | undefined> {
  return defaultRunSwitchboardRelayCatalogSetStateRunner;
}

async function runSwitchboardRelayCatalogSetStateInProcess(
  runner: RunSwitchboardRelayCatalogSetState,
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

function printSwitchboardRelayCatalogSetStateHelp(bin: string): void {
  console.log(`Update local Baran relay catalog state.

USAGE
  $ ${bin} baran relay catalog set-state <relay-id> <state> [options]
  $ ${bin} baran relay catalog state <relay-id> <state> [options]

FLAGS
  --catalog-file <path>  Relay catalog state file to update.
  --no-rebuild          Update only the relay catalog state file.
  --ops-profile <name>  Baran ops profile for admin defaults.
  --profile <name>      Alias for --ops-profile.
  --project-dir <path>  Baran project directory.
  --context <name>      Baran context name for runtime defaults.

DESCRIPTION
  Local relay catalog state mutation. It updates the selected relay entry in
  relays/catalog.json or --catalog-file to candidate, active, degraded,
  draining, or disabled, then rebuilds the signed relay catalog bundle unless
  --no-rebuild is passed. It does not publish catalogs to relays, mutate DNS,
  deploy jobs, submit transactions, or change local Baran project/context
  state.

EXAMPLES
  $ ${bin} baran relay catalog set-state relay-d active
  $ ${bin} baran relay catalog set-state relay-d draining --catalog-file relays/catalog.json --no-rebuild
  $ ${bin} baran relay catalog state relay-d disabled`);
}
