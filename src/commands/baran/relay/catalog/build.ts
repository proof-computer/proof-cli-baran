import { runSwitchboardRelayCatalogBuild as defaultRunSwitchboardRelayCatalogBuildRunner } from "../../../../switchboard-core/cli/src/index.js";
import { Command, Flags } from "@oclif/core";

type RunSwitchboardRelayCatalogBuild = (argv?: readonly string[]) => Promise<void>;

export interface SwitchboardRelayCatalogBuildOptions {
  runner?: RunSwitchboardRelayCatalogBuild;
  loadRunner?: () => Promise<RunSwitchboardRelayCatalogBuild | undefined>;
}

export default class SwitchboardRelayCatalogBuild extends Command {
  static description = [
    "Build a signed Baran relay catalog bundle.",
    "This native proof entrypoint calls the existing local baran relay catalog build implementation."
  ].join("\n");
  static examples = [
    "<%= config.bin %> baran relay catalog build --output service-catalogs.signed.json",
    "<%= config.bin %> baran relay catalog build --specs-dir relays --stdout"
  ];
  static flags = {
    help: Flags.help({
      char: "h"
    }),
    "specs-dir": Flags.string({
      description: "Directory containing relays/<relay-id>.json specs."
    }),
    output: Flags.string({
      description: "Path to write the signed catalog bundle."
    }),
    "output-file": Flags.string({
      description: "Alias for --output."
    }),
    stdout: Flags.boolean({
      description: "Print the signed catalog bundle to stdout."
    }),
    "signing-key": Flags.string({
      description: "Service-catalog signing seed or private key."
    }),
    "signing-scheme": Flags.string({
      description: "Service-catalog signing scheme."
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
  static summary = "Build signed relay service catalogs.";

  async run(): Promise<void> {
    this.parsed = true;
    if (this.argv.includes("--help") || this.argv.includes("-h")) {
      printSwitchboardRelayCatalogBuildHelp(this.config.bin);
      return;
    }
    const exitCode = await runSwitchboardRelayCatalogBuildNative(this.argv);
    if (exitCode !== 0) {
      this.exit(exitCode);
    }
  }
}

export async function runSwitchboardRelayCatalogBuildNative(
  argv: readonly string[],
  options: SwitchboardRelayCatalogBuildOptions = {}
): Promise<number> {
  const loadRunner = options.loadRunner ?? loadSwitchboardRelayCatalogBuildRunner;
  const runner = options.runner ?? await loadRunner();
  if (runner) {
    return runSwitchboardRelayCatalogBuildInProcess(runner, argv);
  }
  console.error("[baran] Error: internal proof baran runner runSwitchboardRelayCatalogBuild is unavailable.");
  return 1;
}

async function loadSwitchboardRelayCatalogBuildRunner(): Promise<RunSwitchboardRelayCatalogBuild | undefined> {
  return defaultRunSwitchboardRelayCatalogBuildRunner;
}

async function runSwitchboardRelayCatalogBuildInProcess(
  runner: RunSwitchboardRelayCatalogBuild,
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

function printSwitchboardRelayCatalogBuildHelp(bin: string): void {
  console.log(`Build a signed Baran relay catalog bundle.

USAGE
  $ ${bin} baran relay catalog build --output <path>
  $ ${bin} baran relay catalog build --specs-dir <dir> --stdout

FLAGS
  --specs-dir <dir>       Directory containing relays/<relay-id>.json specs.
  --output <path>         Path to write the signed catalog bundle.
  --output-file <path>    Alias for --output.
  --stdout                Print the signed catalog bundle to stdout.
  --signing-key <key>     Service-catalog signing seed or private key.
  --signing-scheme <name> Service-catalog signing scheme.
  --ops-profile <name>    Baran ops profile for admin defaults.
  --profile <name>        Alias for --ops-profile.
  --project-dir <path>    Baran project directory.
  --context <name>        Baran context name for runtime defaults.

DESCRIPTION
  Local relay catalog artifact build. It reads local relay specs, overlays
  local relays/catalog.json state when present, signs service catalogs with the
  configured signing key, and writes or prints the signed bundle. It does not
  change catalog state, publish to relays, mutate DNS, deploy jobs, submit
  transactions, or change local Baran context state.

EXAMPLES
  $ ${bin} baran relay catalog build --output service-catalogs.signed.json
  $ ${bin} baran relay catalog build --specs-dir relays --stdout`);
}
