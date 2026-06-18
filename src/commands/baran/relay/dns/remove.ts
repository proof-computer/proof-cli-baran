import { runSwitchboardRelayDnsRemove as defaultRunSwitchboardRelayDnsRemoveRunner } from "../../../../switchboard-core/cli/src/index.js";
import { Command, Flags } from "@oclif/core";

type RunSwitchboardRelayDnsRemove = (argv?: readonly string[]) => Promise<void>;

export interface SwitchboardRelayDnsRemoveOptions {
  runner?: RunSwitchboardRelayDnsRemove;
  loadRunner?: () => Promise<RunSwitchboardRelayDnsRemove | undefined>;
}

export default class SwitchboardRelayDnsRemove extends Command {
  static description = [
    "Remove Baran relay DNS records.",
    "This native proof entrypoint calls the existing baran relay dns remove implementation."
  ].join("\n");
  static examples = [
    "<%= config.bin %> baran relay dns remove relay-d",
    "<%= config.bin %> baran relay dns remove relay-d --spec relays/relay-d.json",
    "<%= config.bin %> baran relay dns remove relay-d --yes"
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
    yes: Flags.boolean({
      description: "Confirm DNS deletion."
    }),
    "dry-run": Flags.boolean({
      description: "Plan DNS deletion without applying it."
    }),
    "token-env": Flags.string({
      description: "Environment variable containing the Cloudflare API token."
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
  static summary = "Remove relay DNS records.";

  async run(): Promise<void> {
    this.parsed = true;
    if (this.argv.includes("--help") || this.argv.includes("-h")) {
      printSwitchboardRelayDnsRemoveHelp(this.config.bin);
      return;
    }
    const exitCode = await runSwitchboardRelayDnsRemoveNative(this.argv);
    if (exitCode !== 0) {
      this.exit(exitCode);
    }
  }
}

export async function runSwitchboardRelayDnsRemoveNative(
  argv: readonly string[],
  options: SwitchboardRelayDnsRemoveOptions = {}
): Promise<number> {
  const loadRunner = options.loadRunner ?? loadSwitchboardRelayDnsRemoveRunner;
  const runner = options.runner ?? await loadRunner();
  if (runner) {
    return runSwitchboardRelayDnsRemoveInProcess(runner, argv);
  }
  console.error("[baran] Error: internal proof baran runner runSwitchboardRelayDnsRemove is unavailable.");
  return 1;
}

async function loadSwitchboardRelayDnsRemoveRunner(): Promise<RunSwitchboardRelayDnsRemove | undefined> {
  return defaultRunSwitchboardRelayDnsRemoveRunner;
}

async function runSwitchboardRelayDnsRemoveInProcess(
  runner: RunSwitchboardRelayDnsRemove,
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

function printSwitchboardRelayDnsRemoveHelp(bin: string): void {
  console.log(`Remove Baran relay DNS records.

USAGE
  $ ${bin} baran relay dns remove <relay-id> [options]

FLAGS
  --spec <path>        Relay spec path.
  --spec-file <path>   Alias for --spec.
  --token-env <name>   Environment variable containing the Cloudflare API token.
  --ops-profile <name> Baran ops profile for admin defaults.
  --profile <name>     Alias for --ops-profile.
  --project-dir <path> Baran project directory.
  --context <name>     Baran context name for runtime defaults.
  --dry-run            Plan DNS deletion without applying it.
  --yes                Confirm DNS deletion.

DESCRIPTION
  Deletes the configured relay DNS CNAME record through the configured DNS
  provider credentials.

EXAMPLES
  $ ${bin} baran relay dns remove relay-d
  $ ${bin} baran relay dns remove relay-d --spec relays/relay-d.json
  $ ${bin} baran relay dns remove relay-d --yes`);
}
