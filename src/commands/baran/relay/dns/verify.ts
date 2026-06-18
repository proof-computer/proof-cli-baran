import { runSwitchboardRelayDnsVerify as defaultRunSwitchboardRelayDnsVerifyRunner } from "../../../../switchboard-core/cli/src/index.js";
import { Command, Flags } from "@oclif/core";

type RunSwitchboardRelayDnsVerify = (argv?: readonly string[]) => Promise<void>;

export interface SwitchboardRelayDnsVerifyOptions {
  runner?: RunSwitchboardRelayDnsVerify;
  loadRunner?: () => Promise<RunSwitchboardRelayDnsVerify | undefined>;
}

export default class SwitchboardRelayDnsVerify extends Command {
  static description = [
    "Verify Baran relay DNS records.",
    "This native proof entrypoint calls the existing read-only baran relay dns verify implementation."
  ].join("\n");
  static examples = [
    "<%= config.bin %> baran relay dns verify relay-d",
    "<%= config.bin %> baran relay dns verify relay-d --spec relays/relay-d.json",
    "<%= config.bin %> baran relay dns verify relay-d --resolvers 1.1.1.1,8.8.8.8"
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
  static summary = "Verify relay DNS records.";

  async run(): Promise<void> {
    this.parsed = true;
    if (this.argv.includes("--help") || this.argv.includes("-h")) {
      printSwitchboardRelayDnsVerifyHelp(this.config.bin);
      return;
    }
    const exitCode = await runSwitchboardRelayDnsVerifyNative(this.argv);
    if (exitCode !== 0) {
      this.exit(exitCode);
    }
  }
}

export async function runSwitchboardRelayDnsVerifyNative(
  argv: readonly string[],
  options: SwitchboardRelayDnsVerifyOptions = {}
): Promise<number> {
  const loadRunner = options.loadRunner ?? loadSwitchboardRelayDnsVerifyRunner;
  const runner = options.runner ?? await loadRunner();
  if (runner) {
    return runSwitchboardRelayDnsVerifyInProcess(runner, argv);
  }
  console.error("[baran] Error: internal proof baran runner runSwitchboardRelayDnsVerify is unavailable.");
  return 1;
}

async function loadSwitchboardRelayDnsVerifyRunner(): Promise<RunSwitchboardRelayDnsVerify | undefined> {
  return defaultRunSwitchboardRelayDnsVerifyRunner;
}

async function runSwitchboardRelayDnsVerifyInProcess(
  runner: RunSwitchboardRelayDnsVerify,
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

function printSwitchboardRelayDnsVerifyHelp(bin: string): void {
  console.log(`Verify Baran relay DNS records.

USAGE
  $ ${bin} baran relay dns verify <relay-id> [options]

FLAGS
  --spec <path>           Relay spec path.
  --spec-file <path>      Alias for --spec.
  --resolvers <list>      Comma-separated DNS resolvers for public CNAME validation.
  --ops-profile <name>    Baran ops profile for admin defaults.
  --profile <name>        Alias for --ops-profile.
  --project-dir <path>    Baran project directory.
  --context <name>        Baran context name for runtime defaults.

DESCRIPTION
  Reads the selected relay spec and verifies public CNAME resolution against
  the configured dns.cnameTarget. This command does not require Cloudflare
  credentials and does not create, update, or remove DNS records. It exits
  nonzero when any selected resolver reports drift.

EXAMPLES
  $ ${bin} baran relay dns verify relay-d
  $ ${bin} baran relay dns verify relay-d --spec relays/relay-d.json
  $ ${bin} baran relay dns verify relay-d --resolvers 1.1.1.1,8.8.8.8`);
}
