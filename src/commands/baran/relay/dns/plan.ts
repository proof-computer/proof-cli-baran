import { runSwitchboardRelayDnsPlan as defaultRunSwitchboardRelayDnsPlanRunner } from "../../../../switchboard-core/cli/src/index.js";
import { Command, Flags } from "@oclif/core";

type RunSwitchboardRelayDnsPlan = (argv?: readonly string[]) => Promise<void>;

export interface SwitchboardRelayDnsPlanOptions {
  runner?: RunSwitchboardRelayDnsPlan;
  loadRunner?: () => Promise<RunSwitchboardRelayDnsPlan | undefined>;
}

export default class SwitchboardRelayDnsPlan extends Command {
  static description = [
    "Plan Baran relay DNS records.",
    "This native proof entrypoint calls the existing read-only baran relay dns plan implementation."
  ].join("\n");
  static examples = [
    "<%= config.bin %> baran relay dns plan relay-d",
    "<%= config.bin %> baran relay dns plan relay-d --spec relays/relay-d.json",
    "<%= config.bin %> baran relay dns plan relay-d --resolvers 1.1.1.1,8.8.8.8"
  ];
  static flags = {
    help: Flags.help({
      char: "h"
    }),
    spec: Flags.string({
      description: "Relay spec path."
    }),
    "spec-file": Flags.string({
      description: "Alias for --spec."
    }),
    resolvers: Flags.string({
      description: "Comma-separated DNS resolvers for public CNAME validation."
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
  static summary = "Plan relay DNS records.";

  async run(): Promise<void> {
    this.parsed = true;
    if (this.argv.includes("--help") || this.argv.includes("-h")) {
      printSwitchboardRelayDnsPlanHelp(this.config.bin);
      return;
    }
    const exitCode = await runSwitchboardRelayDnsPlanNative(this.argv);
    if (exitCode !== 0) {
      this.exit(exitCode);
    }
  }
}

export async function runSwitchboardRelayDnsPlanNative(
  argv: readonly string[],
  options: SwitchboardRelayDnsPlanOptions = {}
): Promise<number> {
  const loadRunner = options.loadRunner ?? loadSwitchboardRelayDnsPlanRunner;
  const runner = options.runner ?? await loadRunner();
  if (runner) {
    return runSwitchboardRelayDnsPlanInProcess(runner, argv);
  }
  console.error("[baran] Error: internal proof baran runner runSwitchboardRelayDnsPlan is unavailable.");
  return 1;
}

async function loadSwitchboardRelayDnsPlanRunner(): Promise<RunSwitchboardRelayDnsPlan | undefined> {
  return defaultRunSwitchboardRelayDnsPlanRunner;
}

async function runSwitchboardRelayDnsPlanInProcess(
  runner: RunSwitchboardRelayDnsPlan,
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

function printSwitchboardRelayDnsPlanHelp(bin: string): void {
  console.log(`Plan Baran relay DNS records.

USAGE
  $ ${bin} baran relay dns plan <relay-id> [options]

FLAGS
  --spec <path>           Relay spec path.
  --spec-file <path>      Alias for --spec.
  --resolvers <list>      Comma-separated DNS resolvers for public CNAME validation.
  --ops-profile <name>    Baran ops profile for admin defaults.
  --profile <name>        Alias for --ops-profile.
  --project-dir <path>    Baran project directory.
  --context <name>        Baran context name for runtime defaults.

DESCRIPTION
  Reads the selected relay spec, prints the configured DNS hostname, CNAME
  target, TTL, and current public CNAME state. Specs without a dns block are a
  no-op. This command does not require Cloudflare credentials and does not
  create, update, or remove DNS records.

EXAMPLES
  $ ${bin} baran relay dns plan relay-d
  $ ${bin} baran relay dns plan relay-d --spec relays/relay-d.json
  $ ${bin} baran relay dns plan relay-d --resolvers 1.1.1.1,8.8.8.8`);
}
