import { runSwitchboardRelayLogs as defaultRunSwitchboardRelayLogsRunner } from "../../../switchboard-core/cli/src/index.js";
import { Command, Flags } from "@oclif/core";

type RunSwitchboardRelayLogs = (argv?: readonly string[]) => Promise<void>;

export interface SwitchboardRelayLogsOptions {
  runner?: RunSwitchboardRelayLogs;
  loadRunner?: () => Promise<RunSwitchboardRelayLogs | undefined>;
}

export default class SwitchboardRelayLogs extends Command {
  static description = [
    "Read encrypted Switchboard relay log events.",
    "This native proof entrypoint calls the existing switchboard relay logs implementation."
  ].join("\n");
  static examples = [
    "<%= config.bin %> switchboard relay logs relay-d",
    "<%= config.bin %> switchboard relay logs relay-d --json",
    "<%= config.bin %> switchboard relay logs --read-url https://relay.example/v1/log-sinks/sink/events --limit 20"
  ];
  static flags = {
    help: Flags.help({
      char: "h"
    }),
    json: Flags.boolean({
      description: "Print machine-readable decrypted log events."
    }),
    "read-url": Flags.string({
      description: "Encrypted log sink read URL."
    }),
    "read-token-env": Flags.string({
      description: "Environment variable containing the log sink read token."
    }),
    "encryption-key-env": Flags.string({
      description: "Environment variable containing the local AES-256-GCM log key."
    }),
    "timeout-ms": Flags.string({
      description: "Log read timeout in milliseconds."
    }),
    limit: Flags.string({
      description: "Maximum number of recent events to print."
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
  static summary = "Read relay log events.";

  async run(): Promise<void> {
    this.parsed = true;
    if (this.argv.includes("--help") || this.argv.includes("-h")) {
      printSwitchboardRelayLogsHelp(this.config.bin);
      return;
    }
    const exitCode = await runSwitchboardRelayLogsNative(this.argv);
    if (exitCode !== 0) {
      this.exit(exitCode);
    }
  }
}

export async function runSwitchboardRelayLogsNative(
  argv: readonly string[],
  options: SwitchboardRelayLogsOptions = {}
): Promise<number> {
  const loadRunner = options.loadRunner ?? loadSwitchboardRelayLogsRunner;
  const runner = options.runner ?? await loadRunner();
  if (runner) {
    return runSwitchboardRelayLogsInProcess(runner, argv);
  }
  console.error("[switchboard] Error: internal proof switchboard runner runSwitchboardRelayLogs is unavailable.");
  return 1;
}

async function loadSwitchboardRelayLogsRunner(): Promise<RunSwitchboardRelayLogs | undefined> {
  return defaultRunSwitchboardRelayLogsRunner;
}

async function runSwitchboardRelayLogsInProcess(
  runner: RunSwitchboardRelayLogs,
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

function printSwitchboardRelayLogsHelp(bin: string): void {
  console.log(`Read encrypted Switchboard relay log events.

USAGE
  $ ${bin} switchboard relay logs [relay-id] [options]

FLAGS
  --json                         Print machine-readable decrypted log events.
  --read-url <url>               Encrypted log sink read URL.
  --read-token-env <name>        Environment variable containing the log sink read token.
  --encryption-key-env <name>    Environment variable containing the local AES-256-GCM log key.
  --timeout-ms <ms>              Log read timeout in milliseconds.
  --limit <n>                    Maximum number of recent events to print.
  --ops-profile <name>           Switchboard ops profile for admin defaults.
  --profile <name>               Alias for --ops-profile.
  --project-dir <path>           Switchboard project directory.
  --context <name>               Switchboard context name for runtime defaults.

DESCRIPTION
  Reads encrypted relay log events from a configured log sink and decrypts
  them locally. With a relay id, the command can use saved read-side state
  from .switchboard/relays/<relay-id>.log-sink.json; explicit flags and env
  vars keep their existing precedence. The command performs read-only log
  inspection; it does not publish catalogs, deploy jobs, submit transactions,
  or mutate local relay state.

EXAMPLES
  $ ${bin} switchboard relay logs relay-d
  $ ${bin} switchboard relay logs relay-d --json
  $ ${bin} switchboard relay logs --read-url https://relay.example/v1/log-sinks/sink/events --limit 20`);
}
