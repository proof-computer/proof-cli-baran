import { runSwitchboardRelayKeygen as defaultRunSwitchboardRelayKeygenRunner } from "../../../switchboard-core/cli/src/index.js";
import { Command, Flags } from "@oclif/core";

type RunSwitchboardRelayKeygen = (argv?: readonly string[]) => Promise<void>;

export interface SwitchboardRelayKeygenOptions {
  runner?: RunSwitchboardRelayKeygen;
  loadRunner?: () => Promise<RunSwitchboardRelayKeygen | undefined>;
}

export default class SwitchboardRelayKeygen extends Command {
  static description = [
    "Generate local Baran relay key material.",
    "This native proof entrypoint calls the existing local baran relay keygen implementation."
  ].join("\n");
  static examples = [
    "<%= config.bin %> baran relay keygen relay-d",
    "<%= config.bin %> baran relay keygen relay-d --env-name PROOF_MAINNET_RELAY_D_RECORDER_PRIVATE_KEY",
    "<%= config.bin %> baran relay keygen relay-d --unsafe-stdout"
  ];
  static flags = {
    help: Flags.help({
      char: "h"
    }),
    "env-name": Flags.string({
      description: "Environment variable name to print in the fish secrets line."
    }),
    "unsafe-stdout": Flags.boolean({
      description: "Print the private key to stdout instead of only printing the fish secrets line to stderr."
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
  static summary = "Generate relay key material.";

  async run(): Promise<void> {
    this.parsed = true;
    if (this.argv.includes("--help") || this.argv.includes("-h")) {
      printSwitchboardRelayKeygenHelp(this.config.bin);
      return;
    }
    const exitCode = await runSwitchboardRelayKeygenNative(this.argv);
    if (exitCode !== 0) {
      this.exit(exitCode);
    }
  }
}

export async function runSwitchboardRelayKeygenNative(
  argv: readonly string[],
  options: SwitchboardRelayKeygenOptions = {}
): Promise<number> {
  const loadRunner = options.loadRunner ?? loadSwitchboardRelayKeygenRunner;
  const runner = options.runner ?? await loadRunner();
  if (runner) {
    return runSwitchboardRelayKeygenInProcess(runner, argv);
  }
  console.error("[baran] Error: internal proof baran runner runSwitchboardRelayKeygen is unavailable.");
  return 1;
}

async function loadSwitchboardRelayKeygenRunner(): Promise<RunSwitchboardRelayKeygen | undefined> {
  return defaultRunSwitchboardRelayKeygenRunner;
}

async function runSwitchboardRelayKeygenInProcess(
  runner: RunSwitchboardRelayKeygen,
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

function printSwitchboardRelayKeygenHelp(bin: string): void {
  console.log(`Generate local Baran relay key material.

USAGE
  $ ${bin} baran relay keygen <relay-id> [options]

FLAGS
  --env-name <name>      Environment variable name to print in the fish secrets line.
  --unsafe-stdout       Print the private key to stdout instead of only printing the fish secrets line to stderr.
  --ops-profile <name>  Baran ops profile for admin defaults.
  --profile <name>      Alias for --ops-profile.
  --project-dir <path>  Baran project directory.
  --context <name>      Baran context name for runtime defaults.

DESCRIPTION
  Generates a fresh secp256k1 keypair for a relay recorder identity. The relay
  address is printed to stdout. By default the private key is kept out of
  redirected stdout and appears only in the fish-compatible secrets line on
  stderr. Passing --unsafe-stdout prints the private key to stdout for explicit
  secret-manager pipelines. The command performs local key generation only; it
  does not write files, deploy jobs, publish catalogs, submit transactions,
  change DNS, or change relay state.

EXAMPLES
  $ ${bin} baran relay keygen relay-d
  $ ${bin} baran relay keygen relay-d --env-name PROOF_MAINNET_RELAY_D_RECORDER_PRIVATE_KEY
  $ ${bin} baran relay keygen relay-d --unsafe-stdout`);
}
