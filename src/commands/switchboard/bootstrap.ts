import { runSwitchboardBootstrap as defaultRunSwitchboardBootstrapRunner } from "../../switchboard-core/cli/src/index.js";
import { Command, Flags } from "@oclif/core";

type RunSwitchboardBootstrap = (argv?: readonly string[]) => Promise<void>;

export interface SwitchboardBootstrapOptions {
  runner?: RunSwitchboardBootstrap;
  loadRunner?: () => Promise<RunSwitchboardBootstrap | undefined>;
}

export default class SwitchboardBootstrap extends Command {
  static description = [
    "Manage Switchboard bootstrap infrastructure.",
    "This native proof entrypoint calls the existing switchboard bootstrap implementation."
  ].join("\n");
  static examples = [
    "<%= config.bin %> switchboard bootstrap host status",
    "<%= config.bin %> switchboard bootstrap acurast status",
    "<%= config.bin %> switchboard bootstrap acurast use --url https://relay.example"
  ];
  static flags = {
    help: Flags.help({
      char: "h"
    }),
    profile: Flags.string({
      description: "Switchboard ops profile."
    }),
    "relay-id": Flags.string({
      description: "Bootstrap relay id."
    }),
    url: Flags.string({
      description: "Bootstrap relay endpoint URL."
    }),
    "allow-insecure-bootstrap": Flags.boolean({
      description: "Allow insecure bootstrap endpoints for local testing."
    }),
    "catalog-file": Flags.string({
      description: "Path to a relay catalog file."
    }),
    "manifest-file": Flags.string({
      description: "Path to a network manifest file."
    }),
    "token-env": Flags.string({
      description: "Environment variable containing an API token."
    }),
    yes: Flags.boolean({
      description: "Confirm mutating actions."
    }),
    json: Flags.boolean({
      description: "Print machine-readable output when supported."
    }),
    "timeout-ms": Flags.integer({
      description: "Request timeout in milliseconds."
    }),
    context: Flags.string({
      description: "Switchboard context name for runtime defaults."
    }),
    "project-dir": Flags.string({
      description: "Switchboard project directory."
    })
  };
  static strict = false;
  static summary = "Manage bootstrap infrastructure.";

  async run(): Promise<void> {
    this.parsed = true;
    if (this.argv.includes("--help") || this.argv.includes("-h")) {
      printSwitchboardBootstrapHelp(this.config.bin);
      return;
    }
    const exitCode = await runSwitchboardBootstrapNative(this.argv);
    if (exitCode !== 0) {
      this.exit(exitCode);
    }
  }
}

export async function runSwitchboardBootstrapNative(
  argv: readonly string[],
  options: SwitchboardBootstrapOptions = {}
): Promise<number> {
  const loadRunner = options.loadRunner ?? loadSwitchboardBootstrapRunner;
  const runner = options.runner ?? await loadRunner();
  if (runner) {
    return runSwitchboardBootstrapInProcess(runner, argv);
  }
  console.error("[switchboard] Error: internal proof switchboard runner runSwitchboardBootstrap is unavailable.");
  return 1;
}

async function loadSwitchboardBootstrapRunner(): Promise<RunSwitchboardBootstrap | undefined> {
  return defaultRunSwitchboardBootstrapRunner;
}

async function runSwitchboardBootstrapInProcess(
  runner: RunSwitchboardBootstrap,
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

function printSwitchboardBootstrapHelp(bin: string): void {
  console.log(`Manage Switchboard bootstrap infrastructure.

USAGE
  $ ${bin} switchboard bootstrap <transport> <action> [options]

FLAGS
  --profile <name>              Switchboard ops profile.
  --relay-id <id>               Bootstrap relay id.
  --url <url>                   Bootstrap relay endpoint URL.
  --allow-insecure-bootstrap    Allow insecure bootstrap endpoints for local testing.
  --catalog-file <path>         Path to a relay catalog file.
  --manifest-file <path>        Path to a network manifest file.
  --token-env <name>            Environment variable containing an API token.
  --timeout-ms <ms>             Request timeout in milliseconds.
  --project-dir <path>          Switchboard project directory.
  --context <name>              Switchboard context name for runtime defaults.
  --yes                         Confirm mutating actions.
  --json                        Print machine-readable output when supported.

DESCRIPTION
  Dispatches to the Switchboard bootstrap transport helpers, including host
  bootstrap management and the existing Acurast bootstrap status/use tooling.

EXAMPLES
  $ ${bin} switchboard bootstrap host status
  $ ${bin} switchboard bootstrap acurast status
  $ ${bin} switchboard bootstrap acurast use --url https://relay.example`);
}
