import { Command, Flags } from "@oclif/core";

import { runSwitchboardCompatibility } from "../../switchboard.js";

type RunSwitchboardRelayWhoami = (argv?: readonly string[]) => Promise<void>;
type RunSwitchboardCompatibility = (argv: readonly string[]) => Promise<number>;

export interface SwitchboardRelayWhoamiOptions {
  runner?: RunSwitchboardRelayWhoami;
  loadRunner?: () => Promise<RunSwitchboardRelayWhoami | undefined>;
  compatibilityRunner?: RunSwitchboardCompatibility;
}

export default class SwitchboardRelayWhoami extends Command {
  static description = [
    "Show the Acurast deployer identity for a relay seed.",
    "This native proof entrypoint calls the existing local switchboard relay whoami implementation."
  ].join("\n");
  static examples = [
    "<%= config.bin %> switchboard relay whoami relay-d",
    "<%= config.bin %> switchboard relay whoami relay-d --json",
    "<%= config.bin %> switchboard relay whoami --seed-env ACURAST_MAINNET_SEED --network mainnet"
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
  const compatibilityRunner = options.compatibilityRunner ?? runSwitchboardCompatibility;
  return compatibilityRunner(["relay", "whoami", ...argv]);
}

async function loadSwitchboardRelayWhoamiRunner(): Promise<RunSwitchboardRelayWhoami | undefined> {
  try {
    const module = await import("@proof-computer/switchboard-cli");
    return typeof module.runSwitchboardRelayWhoami === "function"
      ? module.runSwitchboardRelayWhoami
      : undefined;
  } catch {
    return undefined;
  }
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

function printSwitchboardRelayWhoamiHelp(bin: string): void {
  console.log(`Show the Acurast deployer identity for a relay seed.

USAGE
  $ ${bin} switchboard relay whoami [relay-id] [options]

FLAGS
  --json                  Print machine-readable relay identity output.
  --network <name>        Acurast network: mainnet or canary.
  --seed-env <name>       Environment variable containing the Acurast signer mnemonic.
  --spec <path>           Relay spec JSON file.
  --spec-file <path>      Alias for --spec.
  --ops-profile <name>    Switchboard ops profile for admin defaults.
  --profile <name>        Alias for --ops-profile.
  --project-dir <path>    Switchboard project directory.
  --context <name>        Switchboard context name for runtime defaults.

DESCRIPTION
  Resolves the Acurast signer seed from --seed-env, a relay spec,
  or the default Acurast seed env vars, then derives the generic and Polkadot
  ss58 addresses and compares them with any configured Acurast address env.
  The command reads local env/spec data only; it does not probe relays, deploy
  jobs, publish catalogs, submit transactions, or mutate files.

EXAMPLES
  $ ${bin} switchboard relay whoami relay-d
  $ ${bin} switchboard relay whoami relay-d --json
  $ ${bin} switchboard relay whoami --seed-env ACURAST_MAINNET_SEED --network mainnet`);
}
