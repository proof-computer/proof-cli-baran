import { Command, Flags } from "@oclif/core";

import { runSwitchboardCompatibility } from "../../../switchboard.js";

type RunSwitchboardRelayDnsVerify = (argv?: readonly string[]) => Promise<void>;
type RunSwitchboardCompatibility = (argv: readonly string[]) => Promise<number>;

export interface SwitchboardRelayDnsVerifyOptions {
  runner?: RunSwitchboardRelayDnsVerify;
  loadRunner?: () => Promise<RunSwitchboardRelayDnsVerify | undefined>;
  compatibilityRunner?: RunSwitchboardCompatibility;
}

export default class SwitchboardRelayDnsVerify extends Command {
  static description = [
    "Verify Switchboard relay DNS records.",
    "This native proof entrypoint calls the existing read-only switchboard relay dns verify implementation."
  ].join("\n");
  static examples = [
    "<%= config.bin %> switchboard relay dns verify relay-d",
    "<%= config.bin %> switchboard relay dns verify relay-d --spec relays/relay-d.json",
    "<%= config.bin %> switchboard relay dns verify relay-d --resolvers 1.1.1.1,8.8.8.8"
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
  const compatibilityRunner = options.compatibilityRunner ?? runSwitchboardCompatibility;
  return compatibilityRunner(["relay", "dns", "verify", ...argv]);
}

async function loadSwitchboardRelayDnsVerifyRunner(): Promise<RunSwitchboardRelayDnsVerify | undefined> {
  try {
    const module = await import("@proof-computer/switchboard-cli");
    return typeof module.runSwitchboardRelayDnsVerify === "function"
      ? module.runSwitchboardRelayDnsVerify
      : undefined;
  } catch {
    return undefined;
  }
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

function printSwitchboardRelayDnsVerifyHelp(bin: string): void {
  console.log(`Verify Switchboard relay DNS records.

USAGE
  $ ${bin} switchboard relay dns verify <relay-id> [options]

FLAGS
  --spec <path>           Relay spec path.
  --spec-file <path>      Alias for --spec.
  --resolvers <list>      Comma-separated DNS resolvers for public CNAME validation.
  --ops-profile <name>    Switchboard ops profile for admin defaults.
  --profile <name>        Alias for --ops-profile.
  --project-dir <path>    Switchboard project directory.
  --context <name>        Switchboard context name for runtime defaults.

DESCRIPTION
  Reads the selected relay spec and verifies public CNAME resolution against
  the configured dns.cnameTarget. This command does not require Cloudflare
  credentials and does not create, update, or remove DNS records. It exits
  nonzero when any selected resolver reports drift.

EXAMPLES
  $ ${bin} switchboard relay dns verify relay-d
  $ ${bin} switchboard relay dns verify relay-d --spec relays/relay-d.json
  $ ${bin} switchboard relay dns verify relay-d --resolvers 1.1.1.1,8.8.8.8`);
}
