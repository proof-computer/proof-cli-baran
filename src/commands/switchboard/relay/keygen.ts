import { runSwitchboardRelayKeygen as defaultRunSwitchboardRelayKeygenRunner } from "../../../switchboard-core/cli/src/index.js";
import { Command, Flags } from "@oclif/core";

type RunSwitchboardRelayKeygen = (argv?: readonly string[]) => Promise<void>;

export interface SwitchboardRelayKeygenOptions {
  runner?: RunSwitchboardRelayKeygen;
  loadRunner?: () => Promise<RunSwitchboardRelayKeygen | undefined>;
}

export default class SwitchboardRelayKeygen extends Command {
  static description = [
    "Generate local Switchboard relay key material.",
    "This native proof entrypoint calls the existing local switchboard relay keygen implementation."
  ].join("\n");
  static examples = [
    "<%= config.bin %> switchboard relay keygen relay-d",
    "<%= config.bin %> switchboard relay keygen relay-d --env-name PROOF_MAINNET_RELAY_D_RECORDER_PRIVATE_KEY",
    "<%= config.bin %> switchboard relay keygen relay-d --unsafe-stdout"
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
  console.error("[switchboard] Error: internal proof switchboard runner runSwitchboardRelayKeygen is unavailable.");
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

function printSwitchboardRelayKeygenHelp(bin: string): void {
  console.log(`Generate local Switchboard relay key material.

USAGE
  $ ${bin} switchboard relay keygen <relay-id> [options]

FLAGS
  --env-name <name>      Environment variable name to print in the fish secrets line.
  --unsafe-stdout       Print the private key to stdout instead of only printing the fish secrets line to stderr.
  --ops-profile <name>  Switchboard ops profile for admin defaults.
  --profile <name>      Alias for --ops-profile.
  --project-dir <path>  Switchboard project directory.
  --context <name>      Switchboard context name for runtime defaults.

DESCRIPTION
  Generates a fresh secp256k1 keypair for a relay recorder identity. The relay
  address is printed to stdout. By default the private key is kept out of
  redirected stdout and appears only in the fish-compatible secrets line on
  stderr. Passing --unsafe-stdout prints the private key to stdout for explicit
  secret-manager pipelines. The command performs local key generation only; it
  does not write files, deploy jobs, publish catalogs, submit transactions,
  change DNS, or change relay state.

EXAMPLES
  $ ${bin} switchboard relay keygen relay-d
  $ ${bin} switchboard relay keygen relay-d --env-name PROOF_MAINNET_RELAY_D_RECORDER_PRIVATE_KEY
  $ ${bin} switchboard relay keygen relay-d --unsafe-stdout`);
}
