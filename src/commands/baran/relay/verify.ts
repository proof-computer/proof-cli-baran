import { runSwitchboardRelayVerify as defaultRunSwitchboardRelayVerifyRunner } from "../../../switchboard-core/cli/src/index.js";
import { Command, Flags } from "@oclif/core";

type RunSwitchboardRelayVerify = (argv?: readonly string[]) => Promise<void>;

export interface SwitchboardRelayVerifyOptions {
  runner?: RunSwitchboardRelayVerify;
  loadRunner?: () => Promise<RunSwitchboardRelayVerify | undefined>;
}

export default class SwitchboardRelayVerify extends Command {
  static description = [
    "Verify a deployed Baran relay.",
    "This native proof entrypoint calls the existing read-only baran relay verify implementation."
  ].join("\n");
  static examples = [
    "<%= config.bin %> baran relay verify relay-d",
    "<%= config.bin %> baran relay verify relay-d --manifest-url https://control.switchboard.proof.computer/v1/network-manifest"
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
  console.error("[baran] Error: internal proof baran runner runSwitchboardRelayVerify is unavailable.");
  return 1;
}

async function loadSwitchboardRelayVerifyRunner(): Promise<RunSwitchboardRelayVerify | undefined> {
  return defaultRunSwitchboardRelayVerifyRunner;
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

function printSwitchboardRelayVerifyHelp(bin: string): void {
  console.log(`Verify a deployed Baran relay.

USAGE
  $ ${bin} baran relay verify <relay-id> [options]

FLAGS
  --manifest-url <url>    Signed network manifest URL for live relay discovery.
  --manifest-signer <id>  Expected network manifest signer for live relay discovery.
  --ops-profile <name>    Baran ops profile for admin defaults.
  --profile <name>        Alias for --ops-profile.
  --project-dir <path>    Baran project directory.
  --context <name>        Baran context name for runtime defaults.

DESCRIPTION
  Reads the local relay catalog, verifies the selected relay is present in the
  signed live relay catalog, probes /health, /v1/relay-status, and
  /v1/service-catalogs/relay, checks the reported relay id, and checks peer
  reachability for locally declared relay peers. The command performs local
  file reads and network reads only; it does not mutate local files, publish
  catalogs, deploy jobs, submit transactions, or change relay state.

EXAMPLES
  $ ${bin} baran relay verify relay-d
  $ ${bin} baran relay verify relay-d --manifest-url https://control.switchboard.proof.computer/v1/network-manifest`);
}
