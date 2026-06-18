import { runSwitchboardOps as defaultRunSwitchboardOpsRunner } from "../../switchboard-core/cli/src/index.js";
import { Command, Flags } from "@oclif/core";

type RunSwitchboardOps = (argv?: readonly string[]) => Promise<void>;

export interface SwitchboardOpsOptions {
  runner?: RunSwitchboardOps;
  loadRunner?: () => Promise<RunSwitchboardOps | undefined>;
}

export default class SwitchboardOps extends Command {
  static description = [
    "Manage Baran ops profiles.",
    "This native proof entrypoint calls the existing baran ops implementation."
  ].join("\n");
  static examples = [
    "<%= config.bin %> baran ops show",
    "<%= config.bin %> baran ops paths",
    "<%= config.bin %> baran ops init --profile mainnet"
  ];
  static flags = {
    help: Flags.help({
      char: "h"
    }),
    profile: Flags.string({
      description: "Baran ops profile."
    }),
    domain: Flags.string({
      description: "Service domain for the ops profile."
    }),
    "bootstrap-host": Flags.string({
      description: "Bootstrap relay host."
    }),
    target: Flags.string({
      description: "Ops target name."
    }),
    force: Flags.boolean({
      description: "Overwrite existing local ops files."
    }),
    overwrite: Flags.boolean({
      description: "Alias for --force where supported."
    }),
    context: Flags.string({
      description: "Baran context name for runtime defaults."
    }),
    "project-dir": Flags.string({
      description: "Baran project directory."
    })
  };
  static strict = false;
  static summary = "Manage ops profiles.";

  async run(): Promise<void> {
    this.parsed = true;
    if (this.argv.includes("--help") || this.argv.includes("-h")) {
      printSwitchboardOpsHelp(this.config.bin);
      return;
    }
    const exitCode = await runSwitchboardOpsNative(this.argv);
    if (exitCode !== 0) {
      this.exit(exitCode);
    }
  }
}

export async function runSwitchboardOpsNative(
  argv: readonly string[],
  options: SwitchboardOpsOptions = {}
): Promise<number> {
  const loadRunner = options.loadRunner ?? loadSwitchboardOpsRunner;
  const runner = options.runner ?? await loadRunner();
  if (runner) {
    return runSwitchboardOpsInProcess(runner, argv);
  }
  console.error("[baran] Error: internal proof baran runner runSwitchboardOps is unavailable.");
  return 1;
}

async function loadSwitchboardOpsRunner(): Promise<RunSwitchboardOps | undefined> {
  return defaultRunSwitchboardOpsRunner;
}

async function runSwitchboardOpsInProcess(runner: RunSwitchboardOps, argv: readonly string[]): Promise<number> {
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

function printSwitchboardOpsHelp(bin: string): void {
  console.log(`Manage Baran ops profiles.

USAGE
  $ ${bin} baran ops <action> [options]

FLAGS
  --profile <name>        Baran ops profile.
  --domain <domain>       Service domain for the ops profile.
  --bootstrap-host <host> Bootstrap relay host.
  --target <target>       Ops target name.
  --project-dir <path>    Baran project directory.
  --context <name>        Baran context name for runtime defaults.
  --force                 Overwrite existing local ops files.
  --overwrite             Alias for --force where supported.

DESCRIPTION
  Shows, initializes, and resolves local Baran ops profile configuration.

EXAMPLES
  $ ${bin} baran ops show
  $ ${bin} baran ops paths
  $ ${bin} baran ops init --profile mainnet`);
}
