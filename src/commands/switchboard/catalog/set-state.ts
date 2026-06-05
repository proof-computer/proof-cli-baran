import { runSwitchboardCatalogSetState as defaultRunSwitchboardCatalogSetStateRunner } from "../../../switchboard-core/cli/src/index.js";
import { Command, Flags } from "@oclif/core";

type RunSwitchboardCatalogSetState = (argv?: readonly string[]) => Promise<void>;

export interface SwitchboardCatalogSetStateOptions {
  runner?: RunSwitchboardCatalogSetState;
  loadRunner?: () => Promise<RunSwitchboardCatalogSetState | undefined>;
}

export default class SwitchboardCatalogSetState extends Command {
  static description = [
    "Update local Switchboard catalog service state.",
    "This is the native proof entrypoint for the existing local switchboard catalog set-state command."
  ].join("\n");
  static examples = [
    "<%= config.bin %> switchboard catalog set-state relay relay-d active --spec service-catalogs.json --output service-catalogs.signed.json",
    "<%= config.bin %> switchboard catalog set-state relay-d draining --spec service-catalogs.json --no-rebuild",
    "<%= config.bin %> switchboard catalog set-state control-api control-bootstrap disabled --spec service-catalogs.json --stdout"
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
    role: Flags.string({
      description: "Catalog role for the short form. Valid values: relay, control-api."
    }),
    "no-rebuild": Flags.boolean({
      description: "Update the spec file without rebuilding a signed catalog bundle."
    }),
    output: Flags.string({
      description: "Path to write the rebuilt signed catalog bundle."
    }),
    "output-file": Flags.string({
      description: "Alias for --output."
    }),
    stdout: Flags.boolean({
      description: "Print the rebuilt signed catalog bundle to stdout."
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
  static summary = "Update local service catalog state.";

  async run(): Promise<void> {
    this.parsed = true;
    if (this.argv.includes("--help") || this.argv.includes("-h")) {
      printSwitchboardCatalogSetStateHelp(this.config.bin);
      return;
    }
    const exitCode = await runSwitchboardCatalogSetStateNative(this.argv);
    if (exitCode !== 0) {
      this.exit(exitCode);
    }
  }
}

export async function runSwitchboardCatalogSetStateNative(
  argv: readonly string[],
  options: SwitchboardCatalogSetStateOptions = {}
): Promise<number> {
  const loadRunner = options.loadRunner ?? loadSwitchboardCatalogSetStateRunner;
  const runner = options.runner ?? await loadRunner();
  if (runner) {
    return runSwitchboardCatalogSetStateInProcess(runner, argv);
  }
  console.error("[switchboard] Error: internal proof switchboard runner runSwitchboardCatalogSetState is unavailable.");
  return 1;
}

async function loadSwitchboardCatalogSetStateRunner(): Promise<RunSwitchboardCatalogSetState | undefined> {
  return defaultRunSwitchboardCatalogSetStateRunner;
}

async function runSwitchboardCatalogSetStateInProcess(
  runner: RunSwitchboardCatalogSetState,
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

function printSwitchboardCatalogSetStateHelp(bin: string): void {
  console.log(`Update local Switchboard catalog service state.

USAGE
  $ ${bin} switchboard catalog set-state <role> <service-id> <state> --spec <path>
  $ ${bin} switchboard catalog set-state <service-id> <state> --spec <path> [--role relay]

FLAGS
  --spec <path>             Path to a catalog build spec JSON file.
  --spec-file <path>        Alias for --spec.
  --role <role>             Role for the short form: relay or control-api.
  --no-rebuild              Update only the spec file.
  --output <path>           Path to write the rebuilt signed catalog bundle.
  --output-file <path>      Alias for --output.
  --stdout                  Print the rebuilt signed catalog bundle to stdout.
  --signing-key <key>       Service-catalog signing seed or private key.
  --signing-scheme <name>   Service-catalog signing scheme.
  --ops-profile <name>      Switchboard ops profile for admin defaults.
  --profile <name>          Alias for --ops-profile.
  --project-dir <path>      Switchboard project directory.
  --context <name>          Switchboard context name for runtime defaults.

DESCRIPTION
  Local service catalog state mutation. It updates a catalog build spec entry
  to candidate, active, degraded, draining, or disabled, then rebuilds the
  signed catalog bundle unless --no-rebuild is passed. The short positional
  form assumes role=relay unless --role is provided. It does not publish to a
  relay, submit transactions, deploy jobs, mutate relay state, or change local
  Switchboard project/context state.

EXAMPLES
  $ ${bin} switchboard catalog set-state relay relay-d active --spec service-catalogs.json --output service-catalogs.signed.json
  $ ${bin} switchboard catalog set-state relay-d draining --spec service-catalogs.json --no-rebuild
  $ ${bin} switchboard catalog set-state control-api control-bootstrap disabled --spec service-catalogs.json --stdout`);
}
