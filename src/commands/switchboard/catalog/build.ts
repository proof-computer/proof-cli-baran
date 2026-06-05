import { runSwitchboardCatalogBuild as defaultRunSwitchboardCatalogBuildRunner } from "../../../switchboard-core/cli/src/index.js";
import { Command, Flags } from "@oclif/core";

type RunSwitchboardCatalogBuild = (argv?: readonly string[]) => Promise<void>;

export interface SwitchboardCatalogBuildOptions {
  runner?: RunSwitchboardCatalogBuild;
  loadRunner?: () => Promise<RunSwitchboardCatalogBuild | undefined>;
}

export default class SwitchboardCatalogBuild extends Command {
  static description = [
    "Build signed Switchboard service catalogs.",
    "This is the native proof entrypoint for the existing local switchboard catalog build command."
  ].join("\n");
  static examples = [
    "<%= config.bin %> switchboard catalog build --spec service-catalogs.json --output service-catalogs.signed.json",
    "<%= config.bin %> switchboard catalog build --spec service-catalogs.json --stdout",
    "<%= config.bin %> switchboard catalog build --output service-catalogs.signed.json"
  ];
  static flags = {
    help: Flags.help({
      char: "h"
    }),
    spec: Flags.string({
      description: "Path to a catalog build spec JSON file."
    }),
    "spec-file": Flags.string({
      description: "Alias for --spec."
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
  static summary = "Build signed service catalogs.";

  async run(): Promise<void> {
    this.parsed = true;
    if (this.argv.includes("--help") || this.argv.includes("-h")) {
      printSwitchboardCatalogBuildHelp(this.config.bin);
      return;
    }
    const exitCode = await runSwitchboardCatalogBuildNative(this.argv);
    if (exitCode !== 0) {
      this.exit(exitCode);
    }
  }
}

export async function runSwitchboardCatalogBuildNative(
  argv: readonly string[],
  options: SwitchboardCatalogBuildOptions = {}
): Promise<number> {
  const loadRunner = options.loadRunner ?? loadSwitchboardCatalogBuildRunner;
  const runner = options.runner ?? await loadRunner();
  if (runner) {
    return runSwitchboardCatalogBuildInProcess(runner, argv);
  }
  console.error("[switchboard] Error: internal proof switchboard runner runSwitchboardCatalogBuild is unavailable.");
  return 1;
}

async function loadSwitchboardCatalogBuildRunner(): Promise<RunSwitchboardCatalogBuild | undefined> {
  return defaultRunSwitchboardCatalogBuildRunner;
}

async function runSwitchboardCatalogBuildInProcess(
  runner: RunSwitchboardCatalogBuild,
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

function printSwitchboardCatalogBuildHelp(bin: string): void {
  console.log(`Build signed Switchboard service catalogs.

USAGE
  $ ${bin} switchboard catalog build --spec <path> --output <path>
  $ ${bin} switchboard catalog build --spec <path> --stdout
  $ ${bin} switchboard catalog build --output <path>

FLAGS
  --spec <path>             Path to a catalog build spec JSON file.
  --spec-file <path>        Alias for --spec.
  --output <path>           Path to write the signed catalog bundle.
  --output-file <path>      Alias for --output.
  --stdout                  Print the signed catalog bundle to stdout.
  --signing-key <key>       Service-catalog signing seed or private key.
  --signing-scheme <name>   Service-catalog signing scheme.
  --ops-profile <name>      Switchboard ops profile for admin defaults.
  --profile <name>          Alias for --ops-profile.
  --project-dir <path>      Switchboard project directory.
  --context <name>          Switchboard context name for runtime defaults.

DESCRIPTION
  Local service catalog artifact build. It loads the existing Switchboard
  catalog build spec or env-derived inputs, signs control-api and relay service
  catalogs with the configured service-catalog signing key, and writes or prints
  the signed catalog bundle. It does not change catalog state, publish to a
  relay, submit transactions, deploy jobs, or mutate local Switchboard context
  state.

EXAMPLES
  $ ${bin} switchboard catalog build --spec service-catalogs.json --output service-catalogs.signed.json
  $ ${bin} switchboard catalog build --spec service-catalogs.json --stdout
  $ ${bin} switchboard catalog build --output service-catalogs.signed.json`);
}
