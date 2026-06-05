import { runSwitchboardRelayBackfillSpecs as defaultRunSwitchboardRelayBackfillSpecsRunner } from "../../../switchboard-core/cli/src/index.js";
import { Command, Flags } from "@oclif/core";

type RunSwitchboardRelayBackfillSpecs = (argv?: readonly string[]) => Promise<void>;

export interface SwitchboardRelayBackfillSpecsOptions {
  runner?: RunSwitchboardRelayBackfillSpecs;
  loadRunner?: () => Promise<RunSwitchboardRelayBackfillSpecs | undefined>;
}

export default class SwitchboardRelayBackfillSpecs extends Command {
  static description = [
    "Backfill local Switchboard relay specs from discovery.",
    "This native proof entrypoint calls the existing local switchboard relay backfill-specs implementation."
  ].join("\n");
  static examples = [
    "<%= config.bin %> switchboard relay backfill-specs --target bootstrap",
    "<%= config.bin %> switchboard relay backfill-specs --target acurast --dry-run",
    "<%= config.bin %> switchboard relay backfill-specs --manifest-url https://control.example/v1/network-manifest"
  ];
  static flags = {
    help: Flags.help({
      char: "h"
    }),
    "manifest-url": Flags.string({
      description: "Signed network manifest URL."
    }),
    "manifest-signer": Flags.string({
      description: "Expected signed network manifest signer."
    }),
    "allow-unpinned-signer": Flags.boolean({
      description: "Allow diagnostics against an unpinned manifest signer."
    }),
    target: Flags.string({
      description: "Relay spec target to author: bootstrap or acurast."
    }),
    force: Flags.boolean({
      description: "Overwrite existing relay spec files."
    }),
    "dry-run": Flags.boolean({
      description: "Print planned writes without writing files."
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
  static summary = "Backfill local relay specs.";

  async run(): Promise<void> {
    this.parsed = true;
    if (this.argv.includes("--help") || this.argv.includes("-h")) {
      printSwitchboardRelayBackfillSpecsHelp(this.config.bin);
      return;
    }
    const exitCode = await runSwitchboardRelayBackfillSpecsNative(this.argv);
    if (exitCode !== 0) {
      this.exit(exitCode);
    }
  }
}

export async function runSwitchboardRelayBackfillSpecsNative(
  argv: readonly string[],
  options: SwitchboardRelayBackfillSpecsOptions = {}
): Promise<number> {
  const loadRunner = options.loadRunner ?? loadSwitchboardRelayBackfillSpecsRunner;
  const runner = options.runner ?? await loadRunner();
  if (runner) {
    return runSwitchboardRelayBackfillSpecsInProcess(runner, argv);
  }
  console.error("[switchboard] Error: internal proof switchboard runner runSwitchboardRelayBackfillSpecs is unavailable.");
  return 1;
}

async function loadSwitchboardRelayBackfillSpecsRunner(): Promise<RunSwitchboardRelayBackfillSpecs | undefined> {
  return defaultRunSwitchboardRelayBackfillSpecsRunner;
}

async function runSwitchboardRelayBackfillSpecsInProcess(
  runner: RunSwitchboardRelayBackfillSpecs,
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

function printSwitchboardRelayBackfillSpecsHelp(bin: string): void {
  console.log(`Backfill local Switchboard relay specs from discovery.

USAGE
  $ ${bin} switchboard relay backfill-specs [options]

FLAGS
  --manifest-url <url>       Signed network manifest URL.
  --manifest-signer <signer> Expected signed network manifest signer.
  --allow-unpinned-signer    Allow diagnostics against an unpinned manifest signer.
  --target <target>          Relay spec target to author: bootstrap or acurast.
  --force                    Overwrite existing relay spec files.
  --dry-run                  Print planned writes without writing files.
  --ops-profile <name>       Switchboard ops profile for admin defaults.
  --profile <name>           Alias for --ops-profile.
  --project-dir <path>       Switchboard project directory.
  --context <name>           Switchboard context name for runtime defaults.

DESCRIPTION
  Reads signed discovery and creates missing local relay deployment specs.
  Existing files are preserved unless --force is supplied.

EXAMPLES
  $ ${bin} switchboard relay backfill-specs --target bootstrap
  $ ${bin} switchboard relay backfill-specs --target acurast --dry-run
  $ ${bin} switchboard relay backfill-specs --manifest-url https://control.example/v1/network-manifest`);
}
