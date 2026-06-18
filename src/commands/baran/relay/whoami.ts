import { runSwitchboardRelayWhoami as defaultRunSwitchboardRelayWhoamiRunner } from "../../../switchboard-core/cli/src/index.js";
import { Command, Flags } from "@oclif/core";

type RunSwitchboardRelayWhoami = (argv?: readonly string[]) => Promise<void>;

export interface SwitchboardRelayWhoamiOptions {
  runner?: RunSwitchboardRelayWhoami;
  loadRunner?: () => Promise<RunSwitchboardRelayWhoami | undefined>;
}

export default class SwitchboardRelayWhoami extends Command {
  static description = [
    "Show the Acurast deployer identity for a relay seed.",
    "This native proof entrypoint calls the existing local baran relay whoami implementation."
  ].join("\n");
  static examples = [
    "<%= config.bin %> baran relay whoami relay-d",
    "<%= config.bin %> baran relay whoami relay-d --json",
    "<%= config.bin %> baran relay whoami --seed-env ACURAST_MAINNET_SEED --network mainnet"
  ];
  static flags = {
    help: Flags.help({
      char: "h"
    }),
    json: Flags.boolean({
      description: "Print machine-readable relay identity output."
    }),
    network: Flags.string({
      description: "Acurast network: mainnet or canary."
    }),
    "seed-env": Flags.string({
      description: "Environment variable containing the Acurast signer mnemonic."
    }),
    spec: Flags.string({
      description: "Relay spec JSON file."
    }),
    "spec-file": Flags.string({
      description: "Alias for --spec."
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
  static summary = "Show relay Acurast identity.";

  async run(): Promise<void> {
    this.parsed = true;
    if (this.argv.includes("--help") || this.argv.includes("-h")) {
      printSwitchboardRelayWhoamiHelp(this.config.bin);
      return;
    }
    const exitCode = await runSwitchboardRelayWhoamiNative(this.argv);
    if (exitCode !== 0) {
      this.exit(exitCode);
    }
  }
}

export async function runSwitchboardRelayWhoamiNative(
  argv: readonly string[],
  options: SwitchboardRelayWhoamiOptions = {}
): Promise<number> {
  const loadRunner = options.loadRunner ?? loadSwitchboardRelayWhoamiRunner;
  const runner = options.runner ?? await loadRunner();
  if (runner) {
    return runSwitchboardRelayWhoamiInProcess(runner, argv);
  }
  console.error("[baran] Error: internal proof baran runner runSwitchboardRelayWhoami is unavailable.");
  return 1;
}

async function loadSwitchboardRelayWhoamiRunner(): Promise<RunSwitchboardRelayWhoami | undefined> {
  return defaultRunSwitchboardRelayWhoamiRunner;
}

async function runSwitchboardRelayWhoamiInProcess(
  runner: RunSwitchboardRelayWhoami,
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

function printSwitchboardRelayWhoamiHelp(bin: string): void {
  console.log(`Show the Acurast deployer identity for a relay seed.

USAGE
  $ ${bin} baran relay whoami [relay-id] [options]

FLAGS
  --json                  Print machine-readable relay identity output.
  --network <name>        Acurast network: mainnet or canary.
  --seed-env <name>       Environment variable containing the Acurast signer mnemonic.
  --spec <path>           Relay spec JSON file.
  --spec-file <path>      Alias for --spec.
  --ops-profile <name>    Baran ops profile for admin defaults.
  --profile <name>        Alias for --ops-profile.
  --project-dir <path>    Baran project directory.
  --context <name>        Baran context name for runtime defaults.

DESCRIPTION
  Resolves the Acurast signer seed from --seed-env, a relay spec,
  or the default Acurast seed env vars, then derives the generic and Polkadot
  ss58 addresses and compares them with any configured Acurast address env.
  The command reads local env/spec data only; it does not probe relays, deploy
  jobs, publish catalogs, submit transactions, or mutate files.

EXAMPLES
  $ ${bin} baran relay whoami relay-d
  $ ${bin} baran relay whoami relay-d --json
  $ ${bin} baran relay whoami --seed-env ACURAST_MAINNET_SEED --network mainnet`);
}
