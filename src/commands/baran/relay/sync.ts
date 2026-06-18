import { runSwitchboardRelaySync as defaultRunSwitchboardRelaySyncRunner } from "../../../switchboard-core/cli/src/index.js";
import { Command, Flags } from "@oclif/core";

type RunSwitchboardRelaySync = (argv?: readonly string[]) => Promise<void>;

export interface SwitchboardRelaySyncOptions {
  runner?: RunSwitchboardRelaySync;
  loadRunner?: () => Promise<RunSwitchboardRelaySync | undefined>;
}

export default class SwitchboardRelaySync extends Command {
  static description = [
    "Sync local Baran relay inventory from signed discovery.",
    "This native proof entrypoint calls the existing local baran relay sync implementation."
  ].join("\n");
  static examples = [
    "<%= config.bin %> baran relay sync",
    "<%= config.bin %> baran relay sync --manifest-url https://control.example/v1/network-manifest --manifest-signer 5...",
    "<%= config.bin %> baran relay sync --dry-run"
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
    "dry-run": Flags.boolean({
      description: "Print planned local inventory writes without writing files."
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
  static summary = "Sync local relay inventory.";

  async run(): Promise<void> {
    this.parsed = true;
    if (this.argv.includes("--help") || this.argv.includes("-h")) {
      printSwitchboardRelaySyncHelp(this.config.bin);
      return;
    }
    const exitCode = await runSwitchboardRelaySyncNative(this.argv);
    if (exitCode !== 0) {
      this.exit(exitCode);
    }
  }
}

export async function runSwitchboardRelaySyncNative(
  argv: readonly string[],
  options: SwitchboardRelaySyncOptions = {}
): Promise<number> {
  const loadRunner = options.loadRunner ?? loadSwitchboardRelaySyncRunner;
  const runner = options.runner ?? await loadRunner();
  if (runner) {
    return runSwitchboardRelaySyncInProcess(runner, argv);
  }
  console.error("[baran] Error: internal proof baran runner runSwitchboardRelaySync is unavailable.");
  return 1;
}

async function loadSwitchboardRelaySyncRunner(): Promise<RunSwitchboardRelaySync | undefined> {
  return defaultRunSwitchboardRelaySyncRunner;
}

async function runSwitchboardRelaySyncInProcess(
  runner: RunSwitchboardRelaySync,
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

function printSwitchboardRelaySyncHelp(bin: string): void {
  console.log(`Sync local Baran relay inventory from signed discovery.

USAGE
  $ ${bin} baran relay sync [options]

FLAGS
  --manifest-url <url>       Signed network manifest URL.
  --manifest-signer <signer> Expected signed network manifest signer.
  --allow-unpinned-signer    Allow diagnostics against an unpinned manifest signer.
  --dry-run                  Print planned local inventory writes without writing files.
  --ops-profile <name>       Baran ops profile for admin defaults.
  --profile <name>           Alias for --ops-profile.
  --project-dir <path>       Baran project directory.
  --context <name>           Baran context name for runtime defaults.

DESCRIPTION
  Reads the signed network manifest and relay catalog, writes local
  relays/catalog.json, and creates missing local relay stub specs. Existing
  relay spec files are preserved. It does not publish catalogs, deploy jobs,
  change DNS, submit transactions, or change local Baran context state.

EXAMPLES
  $ ${bin} baran relay sync
  $ ${bin} baran relay sync --manifest-url https://control.example/v1/network-manifest --manifest-signer 5...
  $ ${bin} baran relay sync --dry-run`);
}
