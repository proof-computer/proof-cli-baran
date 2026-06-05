import { runSwitchboardProjectInit as defaultRunSwitchboardProjectInitRunner } from "../../switchboard-core/cli/src/index.js";
import { Command, Flags } from "@oclif/core";

type RunSwitchboardProjectInit = (argv?: readonly string[]) => Promise<void>;

export interface SwitchboardInitOptions {
  runner?: RunSwitchboardProjectInit;
  loadRunner?: () => Promise<RunSwitchboardProjectInit | undefined>;
}

export default class SwitchboardInit extends Command {
  static description = [
    "Initialize a local Switchboard project.",
    "This native proof entrypoint calls the existing switchboard init implementation, including the SSH template scaffold."
  ].join("\n");
  static examples = [
    "<%= config.bin %> switchboard init --project hello-api --context mainnet",
    "<%= config.bin %> switchboard init --template ssh --distro ubuntu",
    "<%= config.bin %> switchboard init --project-dir ./app --force --json"
  ];
  static flags = initFlags();
  static strict = false;
  static summary = "Initialize a local Switchboard project.";

  async run(): Promise<void> {
    this.parsed = true;
    if (this.argv.includes("--help") || this.argv.includes("-h")) {
      printSwitchboardInitHelp(this.config.bin, "init");
      return;
    }
    const exitCode = await runSwitchboardInitNative(this.argv);
    if (exitCode !== 0) {
      this.exit(exitCode);
    }
  }
}

export async function runSwitchboardInitNative(
  argv: readonly string[],
  options: SwitchboardInitOptions = {}
): Promise<number> {
  const removedEndpointError = removedInitEndpointArgsMessage(argv);
  if (removedEndpointError) {
    console.error(`[switchboard] ${removedEndpointError}`);
    return 1;
  }
  const loadRunner = options.loadRunner ?? loadSwitchboardProjectInitRunner;
  const runner = options.runner ?? await loadRunner();
  if (runner) {
    return runSwitchboardProjectInitInProcess(runner, argv);
  }
  console.error("[switchboard] Error: internal proof switchboard runner runSwitchboardProjectInit is unavailable.");
  return 1;
}

const REMOVED_INIT_ENDPOINT_FLAGS = new Set(["--endpoint", "--hostname", "--endpoint-id"]);

export function assertNoInitEndpointArgs(argv: readonly string[]): void {
  const message = removedInitEndpointArgsMessage(argv);
  if (message) {
    throw new Error(message);
  }
}

function removedInitEndpointArgsMessage(argv: readonly string[]): string | undefined {
  const present: string[] = [];
  for (const arg of argv) {
    if (arg === "--") {
      break;
    }
    const flagName = arg.includes("=") ? arg.slice(0, arg.indexOf("=")) : arg;
    if (REMOVED_INIT_ENDPOINT_FLAGS.has(flagName) && !present.includes(flagName)) {
      present.push(flagName);
    }
  }
  if (present.length === 0) {
    return undefined;
  }
  return (
    `Removed init option(s): ${present.join(", ")}. ` +
    "Canonical PROOF endpoints are allocated during deploy; attach customer domains after deploy with `proof switchboard hostname add`."
  );
}

async function loadSwitchboardProjectInitRunner(): Promise<RunSwitchboardProjectInit | undefined> {
  return defaultRunSwitchboardProjectInitRunner;
}

async function runSwitchboardProjectInitInProcess(
  runner: RunSwitchboardProjectInit,
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

export function initFlags() {
  return {
    help: Flags.help({ char: "h" }),
    json: Flags.boolean({ description: "Print machine-readable output." }),
    force: Flags.boolean({ description: "Overwrite existing scaffold files." }),
    "project-dir": Flags.string({ description: "Project directory to initialize." }),
    "no-project": Flags.boolean({ description: "Ignore existing switchboard.json discovery while loading defaults." }),
    project: Flags.string({ description: "Switchboard project name." }),
    name: Flags.string({ description: "Alias for --project." }),
    context: Flags.string({ description: "Switchboard context name to store in switchboard.json." }),
    "acurast-project": Flags.string({ description: "Acurast project name." }),
    "acurast-network": Flags.string({ description: "Acurast network name." }),
    "acurast-stage-dir": Flags.string({ description: "Acurast staging directory." }),
    entrypoint: Flags.string({ description: "Project entrypoint to store in switchboard.json." }),
    "duration-minutes": Flags.string({ description: "Default deploy lease duration in minutes." }),
    "schedule-buffer-minutes": Flags.string({ description: "Default deploy schedule buffer in minutes." }),
    "operator-id": Flags.string({ description: "Default operator ID for deploy capacity." }),
    processor: Flags.string({ description: "Default Acurast processor for deploy capacity." }),
    "payment-mode": Flags.string({ description: "Default deploy payment mode." }),
    quote: Flags.boolean({ description: "Store quote funding as the default deploy payment mode." }),
    template: Flags.string({ description: "Project template. Supported: ssh." }),
    distro: Flags.string({ description: "Template distro. Supported for ssh: ubuntu." }),
    "ssh-public-key-file": Flags.string({ description: "Authorized SSH public key file for the ssh template." })
  };
}

export function printSwitchboardInitHelp(bin: string, command: "init" | "project init"): void {
  console.log(`Initialize a local Switchboard project.

USAGE
  $ ${bin} switchboard ${command} [options]

FLAGS
  --project <name>                Switchboard project name.
  --name <name>                   Alias for --project.
  --context <name>                Switchboard context name.
  --project-dir <path>            Project directory to initialize.
  --force                         Overwrite existing scaffold files.
  --entrypoint <path>             Project entrypoint to store.
  --acurast-project <name>        Acurast project name.
  --acurast-network <name>        Acurast network name.
  --acurast-stage-dir <path>      Acurast staging directory.
  --duration-minutes <minutes>    Default deploy lease duration.
  --schedule-buffer-minutes <min> Default deploy schedule buffer.
  --operator-id <id>              Default operator ID for deploy capacity.
  --processor <ref>               Default Acurast processor for deploy capacity.
  --payment-mode <mode>           Default deploy payment mode.
  --quote                         Store quote funding as the default payment mode.
  --template <name>               Project template. Supported: ssh.
  --distro <name>                 Template distro. Supported for ssh: ubuntu.
  --ssh-public-key-file <path>    Authorized SSH public key file for the ssh template.
  --json                          Print machine-readable output.

DESCRIPTION
  Initializes switchboard.json and the local .switchboard state directory. With
  --template ssh it scaffolds the Script/Cargo SSH project files. It does not
  deploy, spend, sign transactions, mutate contexts, or touch relay/admin state.

EXAMPLES
  $ ${bin} switchboard ${command} --project hello-api --context mainnet
  $ ${bin} switchboard ${command} --template ssh --distro ubuntu
  $ ${bin} switchboard ${command} --project-dir ./app --force --json`);
}
