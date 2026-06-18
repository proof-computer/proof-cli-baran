import { runSwitchboardCatalogInspect as defaultRunSwitchboardCatalogInspectRunner } from "../../../switchboard-core/cli/src/index.js";
import { Command, Flags } from "@oclif/core";

type RunSwitchboardCatalogInspect = (argv?: readonly string[]) => Promise<void>;

export interface SwitchboardCatalogInspectOptions {
  runner?: RunSwitchboardCatalogInspect;
  loadRunner?: () => Promise<RunSwitchboardCatalogInspect | undefined>;
}

export default class SwitchboardCatalogInspect extends Command {
  static description = [
    "Inspect signed Baran service catalogs.",
    "This is the native proof entrypoint for the existing read-only baran catalog inspect command."
  ].join("\n");
  static examples = [
    "<%= config.bin %> baran catalog inspect --file service-catalogs.signed.json",
    "<%= config.bin %> baran catalog inspect --url https://control.example/v1/service-catalogs/relay --json",
    "<%= config.bin %> baran catalog inspect --file service-catalogs.signed.json --signer 5..."
  ];
  static flags = {
    help: Flags.help({
      char: "h"
    }),
    json: Flags.boolean({
      description: "Print machine-readable output."
    }),
    file: Flags.string({
      description: "Path to a signed catalog or signed catalog bundle."
    }),
    url: Flags.string({
      description: "URL of a signed catalog or signed catalog bundle."
    }),
    signer: Flags.string({
      description: "Expected service-catalog signer."
    }),
    "allow-expired": Flags.boolean({
      description: "Accept expired catalogs for diagnostics only."
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
  static summary = "Inspect signed service catalogs.";

  async run(): Promise<void> {
    this.parsed = true;
    if (this.argv.includes("--help") || this.argv.includes("-h")) {
      printSwitchboardCatalogInspectHelp(this.config.bin);
      return;
    }
    const exitCode = await runSwitchboardCatalogInspectNative(this.argv);
    if (exitCode !== 0) {
      this.exit(exitCode);
    }
  }
}

export async function runSwitchboardCatalogInspectNative(
  argv: readonly string[],
  options: SwitchboardCatalogInspectOptions = {}
): Promise<number> {
  const loadRunner = options.loadRunner ?? loadSwitchboardCatalogInspectRunner;
  const runner = options.runner ?? await loadRunner();
  if (runner) {
    return runSwitchboardCatalogInspectInProcess(runner, argv);
  }
  console.error("[baran] Error: internal proof baran runner runSwitchboardCatalogInspect is unavailable.");
  return 1;
}

async function loadSwitchboardCatalogInspectRunner(): Promise<RunSwitchboardCatalogInspect | undefined> {
  return defaultRunSwitchboardCatalogInspectRunner;
}

async function runSwitchboardCatalogInspectInProcess(
  runner: RunSwitchboardCatalogInspect,
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

function printSwitchboardCatalogInspectHelp(bin: string): void {
  console.log(`Inspect signed Baran service catalogs.

USAGE
  $ ${bin} baran catalog inspect --file <path> [--json]
  $ ${bin} baran catalog inspect --url <url> [--json]

FLAGS
  --file <path>          Path to a signed catalog or signed catalog bundle.
  --url <url>            URL of a signed catalog or signed catalog bundle.
  --signer <signer>      Expected service-catalog signer.
  --allow-expired        Accept expired catalogs for diagnostics only.
  --ops-profile <name>   Baran ops profile for admin defaults.
  --profile <name>       Alias for --ops-profile.
  --project-dir <path>   Baran project directory.
  --context <name>       Baran context name for runtime defaults.
  --json                 Print machine-readable output.

DESCRIPTION
  Read-only service catalog inspection. It verifies signed catalog files or
  URLs with the existing Baran catalog verifier and prints the catalog
  signer, expiry state, role, sequence, and members. It never builds catalogs,
  changes catalog state, signs payloads, submits transactions, deploys jobs,
  mutates relay state, or changes local Baran project/context state.

EXAMPLES
  $ ${bin} baran catalog inspect --file service-catalogs.signed.json
  $ ${bin} baran catalog inspect --url https://control.example/v1/service-catalogs/relay --json
  $ ${bin} baran catalog inspect --file service-catalogs.signed.json --signer 5...`);
}
