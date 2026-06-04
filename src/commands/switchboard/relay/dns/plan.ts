import { Command, Flags } from "@oclif/core";

import { runSwitchboardCompatibility } from "../../../switchboard.js";

type RunSwitchboardRelayDnsPlan = (argv?: readonly string[]) => Promise<void>;
type RunSwitchboardCompatibility = (argv: readonly string[]) => Promise<number>;

export interface SwitchboardRelayDnsPlanOptions {
  runner?: RunSwitchboardRelayDnsPlan;
  loadRunner?: () => Promise<RunSwitchboardRelayDnsPlan | undefined>;
  compatibilityRunner?: RunSwitchboardCompatibility;
}

export default class SwitchboardRelayDnsPlan extends Command {
  static description = [
    "Plan Switchboard relay DNS records.",
    "This native proof entrypoint calls the existing read-only switchboard relay dns plan implementation."
  ].join("\n");
  static examples = [
    "<%= config.bin %> switchboard relay dns plan relay-d",
    "<%= config.bin %> switchboard relay dns plan relay-d --spec relays/relay-d.json",
    "<%= config.bin %> switchboard relay dns plan relay-d --resolvers 1.1.1.1,8.8.8.8"
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
  const compatibilityRunner = options.compatibilityRunner ?? runSwitchboardCompatibility;
  return compatibilityRunner(["relay", "dns", "plan", ...argv]);
}

async function loadSwitchboardRelayDnsPlanRunner(): Promise<RunSwitchboardRelayDnsPlan | undefined> {
  try {
    const module = await import("@proof-computer/switchboard-cli");
    return typeof module.runSwitchboardRelayDnsPlan === "function"
      ? module.runSwitchboardRelayDnsPlan
      : undefined;
  } catch {
    return undefined;
  }
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

function printSwitchboardRelayDnsPlanHelp(bin: string): void {
  console.log(`Plan Switchboard relay DNS records.

USAGE
  $ ${bin} switchboard relay dns plan <relay-id> [options]

FLAGS
  --spec <path>           Relay spec path.
  --spec-file <path>      Alias for --spec.
  --resolvers <list>      Comma-separated DNS resolvers for public CNAME validation.
  --ops-profile <name>    Switchboard ops profile for admin defaults.
  --profile <name>        Alias for --ops-profile.
  --project-dir <path>    Switchboard project directory.
  --context <name>        Switchboard context name for runtime defaults.

DESCRIPTION
  Reads the selected relay spec, prints the configured DNS hostname, CNAME
  target, TTL, and current public CNAME state. Specs without a dns block are a
  no-op. This command does not require Cloudflare credentials and does not
  create, update, or remove DNS records.

EXAMPLES
  $ ${bin} switchboard relay dns plan relay-d
  $ ${bin} switchboard relay dns plan relay-d --spec relays/relay-d.json
  $ ${bin} switchboard relay dns plan relay-d --resolvers 1.1.1.1,8.8.8.8`);
}
