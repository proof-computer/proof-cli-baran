import { Command, Flags } from "@oclif/core";

import { runSwitchboardCompatibility } from "../../switchboard.js";

type RunSwitchboardRelayVerify = (argv?: readonly string[]) => Promise<void>;
type RunSwitchboardCompatibility = (argv: readonly string[]) => Promise<number>;

export interface SwitchboardRelayVerifyOptions {
  runner?: RunSwitchboardRelayVerify;
  loadRunner?: () => Promise<RunSwitchboardRelayVerify | undefined>;
  compatibilityRunner?: RunSwitchboardCompatibility;
}

export default class SwitchboardRelayVerify extends Command {
  static description = [
    "Verify a deployed Switchboard relay.",
    "This native proof entrypoint calls the existing read-only switchboard relay verify implementation."
  ].join("\n");
  static examples = [
    "<%= config.bin %> switchboard relay verify relay-d",
    "<%= config.bin %> switchboard relay verify relay-d --manifest-url https://control.switchboard.proof.computer/v1/network-manifest"
  ];
  static flags = {
    help: Flags.help({
      char: "h"
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
  static summary = "Verify relay readiness.";

  async run(): Promise<void> {
    this.parsed = true;
    if (this.argv.includes("--help") || this.argv.includes("-h")) {
      printSwitchboardRelayVerifyHelp(this.config.bin);
      return;
    }
    const exitCode = await runSwitchboardRelayVerifyNative(this.argv);
    if (exitCode !== 0) {
      this.exit(exitCode);
    }
  }
}

export async function runSwitchboardRelayVerifyNative(
  argv: readonly string[],
  options: SwitchboardRelayVerifyOptions = {}
): Promise<number> {
  const loadRunner = options.loadRunner ?? loadSwitchboardRelayVerifyRunner;
  const runner = options.runner ?? await loadRunner();
  if (runner) {
    return runSwitchboardRelayVerifyInProcess(runner, argv);
  }
  const compatibilityRunner = options.compatibilityRunner ?? runSwitchboardCompatibility;
  return compatibilityRunner(["relay", "verify", ...argv]);
}

async function loadSwitchboardRelayVerifyRunner(): Promise<RunSwitchboardRelayVerify | undefined> {
  try {
    const module = await import("@proof-computer/switchboard-cli");
    return typeof module.runSwitchboardRelayVerify === "function"
      ? module.runSwitchboardRelayVerify
      : undefined;
  } catch {
    return undefined;
  }
}

async function runSwitchboardRelayVerifyInProcess(
  runner: RunSwitchboardRelayVerify,
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

function printSwitchboardRelayVerifyHelp(bin: string): void {
  console.log(`Verify a deployed Switchboard relay.

USAGE
  $ ${bin} switchboard relay verify <relay-id> [options]

FLAGS
  --manifest-url <url>    Signed network manifest URL for live relay discovery.
  --manifest-signer <id>  Expected network manifest signer for live relay discovery.
  --ops-profile <name>    Switchboard ops profile for admin defaults.
  --profile <name>        Alias for --ops-profile.
  --project-dir <path>    Switchboard project directory.
  --context <name>        Switchboard context name for runtime defaults.

DESCRIPTION
  Reads the local relay catalog, verifies the selected relay is present in the
  signed live relay catalog, probes /health, /v1/relay-status, and
  /v1/service-catalogs/relay, checks the reported relay id, and checks peer
  reachability for locally declared relay peers. The command performs local
  file reads and network reads only; it does not mutate local files, publish
  catalogs, deploy jobs, submit transactions, or change relay state.

EXAMPLES
  $ ${bin} switchboard relay verify relay-d
  $ ${bin} switchboard relay verify relay-d --manifest-url https://control.switchboard.proof.computer/v1/network-manifest`);
}
