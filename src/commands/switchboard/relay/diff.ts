import { Command, Flags } from "@oclif/core";

import { runSwitchboardCompatibility } from "../../switchboard.js";

type RunSwitchboardRelayDiff = (argv?: readonly string[]) => Promise<void>;
type RunSwitchboardCompatibility = (argv: readonly string[]) => Promise<number>;

export interface SwitchboardRelayDiffOptions {
  runner?: RunSwitchboardRelayDiff;
  loadRunner?: () => Promise<RunSwitchboardRelayDiff | undefined>;
  compatibilityRunner?: RunSwitchboardCompatibility;
}

export default class SwitchboardRelayDiff extends Command {
  static description = [
    "Compare local Switchboard relay inventory with live discovery.",
    "This native proof entrypoint calls the existing read-only switchboard relay diff implementation."
  ].join("\n");
  static examples = [
    "<%= config.bin %> switchboard relay diff",
    "<%= config.bin %> switchboard relay diff --json",
    "<%= config.bin %> switchboard relay diff --manifest-url https://control.switchboard.proof.computer/v1/network-manifest"
  ];
  static flags = {
    help: Flags.help({
      char: "h"
    }),
    json: Flags.boolean({
      description: "Print machine-readable relay diff output."
    }),
    "manifest-url": Flags.string({
      description: "Signed network manifest URL for live relay discovery."
    }),
    "manifest-signer": Flags.string({
      description: "Expected network manifest signer for live relay discovery."
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
  static summary = "Compare local and live relay inventory.";

  async run(): Promise<void> {
    this.parsed = true;
    if (this.argv.includes("--help") || this.argv.includes("-h")) {
      printSwitchboardRelayDiffHelp(this.config.bin);
      return;
    }
    const exitCode = await runSwitchboardRelayDiffNative(this.argv);
    if (exitCode !== 0) {
      this.exit(exitCode);
    }
  }
}

export async function runSwitchboardRelayDiffNative(
  argv: readonly string[],
  options: SwitchboardRelayDiffOptions = {}
): Promise<number> {
  const loadRunner = options.loadRunner ?? loadSwitchboardRelayDiffRunner;
  const runner = options.runner ?? await loadRunner();
  if (runner) {
    return runSwitchboardRelayDiffInProcess(runner, argv);
  }
  const compatibilityRunner = options.compatibilityRunner ?? runSwitchboardCompatibility;
  return compatibilityRunner(["relay", "diff", ...argv]);
}

async function loadSwitchboardRelayDiffRunner(): Promise<RunSwitchboardRelayDiff | undefined> {
  try {
    const module = await import("@proof-computer/switchboard-cli");
    return typeof module.runSwitchboardRelayDiff === "function"
      ? module.runSwitchboardRelayDiff
      : undefined;
  } catch {
    return undefined;
  }
}

async function runSwitchboardRelayDiffInProcess(
  runner: RunSwitchboardRelayDiff,
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

function printSwitchboardRelayDiffHelp(bin: string): void {
  console.log(`Compare local Switchboard relay inventory with live discovery.

USAGE
  $ ${bin} switchboard relay diff [options]

FLAGS
  --json                  Print machine-readable relay diff output.
  --manifest-url <url>    Signed network manifest URL for live relay discovery.
  --manifest-signer <id>  Expected network manifest signer for live relay discovery.
  --ops-profile <name>    Switchboard ops profile for admin defaults.
  --profile <name>        Alias for --ops-profile.
  --project-dir <path>    Switchboard project directory.
  --context <name>        Switchboard context name for runtime defaults.

DESCRIPTION
  Reads local relays/catalog.json, then reads the signed live network manifest
  and relay service catalog. It reports relays that would be added, removed, or
  changed if the local inventory were applied. The command performs local file
  reads and network reads only; it does not mutate local files, publish
  catalogs, deploy jobs, submit transactions, or change relay state.

EXAMPLES
  $ ${bin} switchboard relay diff
  $ ${bin} switchboard relay diff --json
  $ ${bin} switchboard relay diff --manifest-url https://control.switchboard.proof.computer/v1/network-manifest`);
}
