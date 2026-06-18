import { runSwitchboardRelayDnsApply as defaultRunSwitchboardRelayDnsApplyRunner } from "../../../../switchboard-core/cli/src/index.js";
import { Command, Flags } from "@oclif/core";

type RunSwitchboardRelayDnsApply = (argv?: readonly string[]) => Promise<void>;

export interface SwitchboardRelayDnsApplyOptions {
  runner?: RunSwitchboardRelayDnsApply;
  loadRunner?: () => Promise<RunSwitchboardRelayDnsApply | undefined>;
}

export default class SwitchboardRelayDnsApply extends Command {
  static description = [
    "Apply Baran relay DNS records.",
    "This native proof entrypoint calls the existing baran relay dns apply implementation."
  ].join("\n");
  static examples = [
    "<%= config.bin %> baran relay dns apply relay-d",
    "<%= config.bin %> baran relay dns apply relay-d --spec relays/relay-d.json",
    "<%= config.bin %> baran relay dns apply relay-d --yes"
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
      description: "Confirm DNS writes."
    }),
    "dry-run": Flags.boolean({
      description: "Plan DNS writes without applying them."
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
  static summary = "Apply relay DNS records.";

  async run(): Promise<void> {
    this.parsed = true;
    if (this.argv.includes("--help") || this.argv.includes("-h")) {
      printSwitchboardRelayDnsApplyHelp(this.config.bin);
      return;
    }
    const exitCode = await runSwitchboardRelayDnsApplyNative(this.argv);
    if (exitCode !== 0) {
      this.exit(exitCode);
    }
  }
}

export async function runSwitchboardRelayDnsApplyNative(
  argv: readonly string[],
  options: SwitchboardRelayDnsApplyOptions = {}
): Promise<number> {
  const loadRunner = options.loadRunner ?? loadSwitchboardRelayDnsApplyRunner;
  const runner = options.runner ?? await loadRunner();
  if (runner) {
    return runSwitchboardRelayDnsApplyInProcess(runner, argv);
  }
  console.error("[baran] Error: internal proof baran runner runSwitchboardRelayDnsApply is unavailable.");
  return 1;
}

async function loadSwitchboardRelayDnsApplyRunner(): Promise<RunSwitchboardRelayDnsApply | undefined> {
  return defaultRunSwitchboardRelayDnsApplyRunner;
}

async function runSwitchboardRelayDnsApplyInProcess(
  runner: RunSwitchboardRelayDnsApply,
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

function printSwitchboardRelayDnsApplyHelp(bin: string): void {
  console.log(`Apply Baran relay DNS records.

USAGE
  $ ${bin} baran relay dns apply <relay-id> [options]

FLAGS
  --spec <path>        Relay spec path.
  --spec-file <path>   Alias for --spec.
  --token-env <name>   Environment variable containing the Cloudflare API token.
  --ops-profile <name> Baran ops profile for admin defaults.
  --profile <name>     Alias for --ops-profile.
  --project-dir <path> Baran project directory.
  --context <name>     Baran context name for runtime defaults.
  --dry-run            Plan DNS writes without applying them.
  --yes                Confirm DNS writes.

DESCRIPTION
  Creates or updates the configured relay DNS CNAME record through the
  configured DNS provider credentials.

EXAMPLES
  $ ${bin} baran relay dns apply relay-d
  $ ${bin} baran relay dns apply relay-d --spec relays/relay-d.json
  $ ${bin} baran relay dns apply relay-d --yes`);
}
