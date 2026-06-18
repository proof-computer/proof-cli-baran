import { runSwitchboardRelayScaffold as defaultRunSwitchboardRelayScaffoldRunner } from "../../../switchboard-core/cli/src/index.js";
import { Command, Flags } from "@oclif/core";

type RunSwitchboardRelayScaffold = (argv?: readonly string[]) => Promise<void>;

export interface SwitchboardRelayScaffoldOptions {
  runner?: RunSwitchboardRelayScaffold;
  loadRunner?: () => Promise<RunSwitchboardRelayScaffold | undefined>;
}

export default class SwitchboardRelayScaffold extends Command {
  static description = [
    "Scaffold a local Baran relay spec.",
    "This native proof entrypoint calls the existing local baran relay scaffold implementation."
  ].join("\n");
  static examples = [
    "<%= config.bin %> baran relay scaffold relay-q --target bootstrap",
    "<%= config.bin %> baran relay scaffold relay-q --target acurast --manager-id 9470 --duration 7d",
    "<%= config.bin %> baran relay scaffold relay-q --target bootstrap --keygen"
  ];
  static flags = {
    help: Flags.help({
      char: "h"
    }),
    target: Flags.string({
      description: "Relay target type: acurast or bootstrap."
    }),
    "api-base-url": Flags.string({
      description: "Public relay API base URL."
    }),
    "catalog-state": Flags.string({
      description: "Initial local relay catalog state."
    }),
    "validation-report-url": Flags.string({
      description: "Validation report URL to place in the local spec."
    }),
    "control-plane-url": Flags.string({
      description: "Control-plane URL to place in the local spec."
    }),
    "relayer-private-key-env": Flags.string({
      description: "Environment variable name holding the relay private key."
    }),
    keygen: Flags.boolean({
      description: "Generate local relay key material and print the fish secrets line to stderr."
    }),
    force: Flags.boolean({
      description: "Overwrite an existing local relay spec."
    }),
    duration: Flags.string({
      description: "Acurast execution duration for --target acurast."
    }),
    "manager-id": Flags.string({
      description: "Acurast manager id for --target acurast."
    }),
    "acurast-deployer-seed-env": Flags.string({
      description: "Environment variable name containing the Acurast deployer seed."
    }),
    "acurast-network": Flags.string({
      description: "Acurast network for the generated spec."
    }),
    "acurast-project-name": Flags.string({
      description: "Acurast project name for the generated spec."
    }),
    "acurast-stage-dir": Flags.string({
      description: "Acurast staging directory for the generated spec."
    }),
    "acurast-max-cost-per-execution": Flags.string({
      description: "Acurast maxCostPerExecution for the generated spec."
    }),
    "compose-service": Flags.string({
      description: "Bootstrap Docker Compose service name."
    }),
    "compose-file": Flags.string({
      description: "Bootstrap Docker Compose file path."
    }),
    "env-file": Flags.string({
      description: "Bootstrap relay env-file path."
    }),
    "cname-target": Flags.string({
      description: "CNAME target to place in the local relay DNS block."
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
  static summary = "Scaffold a local relay spec.";

  async run(): Promise<void> {
    this.parsed = true;
    if (this.argv.includes("--help") || this.argv.includes("-h")) {
      printSwitchboardRelayScaffoldHelp(this.config.bin);
      return;
    }
    const exitCode = await runSwitchboardRelayScaffoldNative(this.argv);
    if (exitCode !== 0) {
      this.exit(exitCode);
    }
  }
}

export async function runSwitchboardRelayScaffoldNative(
  argv: readonly string[],
  options: SwitchboardRelayScaffoldOptions = {}
): Promise<number> {
  const loadRunner = options.loadRunner ?? loadSwitchboardRelayScaffoldRunner;
  const runner = options.runner ?? await loadRunner();
  if (runner) {
    return runSwitchboardRelayScaffoldInProcess(runner, argv);
  }
  console.error("[baran] Error: internal proof baran runner runSwitchboardRelayScaffold is unavailable.");
  return 1;
}

async function loadSwitchboardRelayScaffoldRunner(): Promise<RunSwitchboardRelayScaffold | undefined> {
  return defaultRunSwitchboardRelayScaffoldRunner;
}

async function runSwitchboardRelayScaffoldInProcess(
  runner: RunSwitchboardRelayScaffold,
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

function printSwitchboardRelayScaffoldHelp(bin: string): void {
  console.log(`Scaffold a local Baran relay spec.

USAGE
  $ ${bin} baran relay scaffold <relay-id> --target <acurast|bootstrap> [options]

FLAGS
  --target <target>                       Relay target type: acurast or bootstrap.
  --api-base-url <url>                    Public relay API base URL.
  --catalog-state <state>                 Initial local relay catalog state.
  --validation-report-url <url>           Validation report URL to place in the local spec.
  --control-plane-url <url>               Control-plane URL to place in the local spec.
  --relayer-private-key-env <name>        Environment variable name holding the relay private key.
  --keygen                                Generate local relay key material and print the fish secrets line to stderr.
  --force                                 Overwrite an existing local relay spec.
  --duration <duration>                   Acurast execution duration for --target acurast.
  --manager-id <id>                       Acurast manager id for --target acurast.
  --acurast-deployer-seed-env <name>      Environment variable name containing the Acurast deployer seed.
  --acurast-network <name>                Acurast network for the generated spec.
  --acurast-project-name <name>           Acurast project name for the generated spec.
  --acurast-stage-dir <path>              Acurast staging directory for the generated spec.
  --acurast-max-cost-per-execution <n>    Acurast maxCostPerExecution for the generated spec.
  --compose-service <name>                Bootstrap Docker Compose service name.
  --compose-file <path>                   Bootstrap Docker Compose file path.
  --env-file <path>                       Bootstrap relay env-file path.
  --cname-target <hostname>               CNAME target to place in the local relay DNS block.
  --ops-profile <name>                    Baran ops profile for admin defaults.
  --profile <name>                        Alias for --ops-profile.
  --project-dir <path>                    Baran project directory.
  --context <name>                        Baran context name for runtime defaults.

DESCRIPTION
  Generates relays/<relay-id>.json from local flags. With --keygen, the
  address and env name are printed to stdout while the fish-compatible private
  key line is printed to stderr. The command only writes the local relay spec;
  it does not deploy jobs, publish catalogs, mutate DNS, submit transactions,
  touch live relay state, or change local Baran project/context state.

EXAMPLES
  $ ${bin} baran relay scaffold relay-q --target bootstrap
  $ ${bin} baran relay scaffold relay-q --target acurast --manager-id 9470 --duration 7d
  $ ${bin} baran relay scaffold relay-q --target bootstrap --keygen`);
}
