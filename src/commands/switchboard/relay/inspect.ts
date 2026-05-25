import { Command, Flags } from "@oclif/core";

import { runSwitchboardCompatibility } from "../../switchboard.js";

type RunSwitchboardRelayInspect = (argv?: readonly string[]) => Promise<void>;
type RunSwitchboardCompatibility = (argv: readonly string[]) => Promise<number>;

export interface SwitchboardRelayInspectOptions {
  runner?: RunSwitchboardRelayInspect;
  loadRunner?: () => Promise<RunSwitchboardRelayInspect | undefined>;
  compatibilityRunner?: RunSwitchboardCompatibility;
}

export default class SwitchboardRelayInspect extends Command {
  static description = [
    "Inspect Acurast deployment details for a Switchboard relay.",
    "This native proof entrypoint calls the existing read-only switchboard relay inspect implementation."
  ].join("\n");
  static examples = [
    "<%= config.bin %> switchboard relay inspect relay-d",
    "<%= config.bin %> switchboard relay inspect relay-d --deployment-id 51808",
    "<%= config.bin %> switchboard relay inspect relay-d --watch"
  ];
  static flags = {
    help: Flags.help({
      char: "h"
    }),
    "deployment-id": Flags.string({
      description: "Acurast job sequence to inspect instead of resolving the latest local deployment."
    }),
    spec: Flags.string({
      description: "Relay deployment spec path."
    }),
    "spec-file": Flags.string({
      description: "Alias for --spec."
    }),
    watch: Flags.boolean({
      description: "Pass --watch to the packaged Acurast inspect helper."
    }),
    events: Flags.boolean({
      description: "Pass --events to the packaged Acurast inspect helper."
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
  static summary = "Inspect relay Acurast deployment details.";

  async run(): Promise<void> {
    this.parsed = true;
    if (this.argv.includes("--help") || this.argv.includes("-h")) {
      printSwitchboardRelayInspectHelp(this.config.bin);
      return;
    }
    const exitCode = await runSwitchboardRelayInspectNative(this.argv);
    if (exitCode !== 0) {
      this.exit(exitCode);
    }
  }
}

export async function runSwitchboardRelayInspectNative(
  argv: readonly string[],
  options: SwitchboardRelayInspectOptions = {}
): Promise<number> {
  const loadRunner = options.loadRunner ?? loadSwitchboardRelayInspectRunner;
  const runner = options.runner ?? await loadRunner();
  if (runner) {
    return runSwitchboardRelayInspectInProcess(runner, argv);
  }
  const compatibilityRunner = options.compatibilityRunner ?? runSwitchboardCompatibility;
  return compatibilityRunner(["relay", "inspect", ...argv]);
}

async function loadSwitchboardRelayInspectRunner(): Promise<RunSwitchboardRelayInspect | undefined> {
  try {
    const module = await import("@proof-computer/switchboard-cli");
    return typeof module.runSwitchboardRelayInspect === "function"
      ? module.runSwitchboardRelayInspect
      : undefined;
  } catch {
    return undefined;
  }
}

async function runSwitchboardRelayInspectInProcess(
  runner: RunSwitchboardRelayInspect,
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

function printSwitchboardRelayInspectHelp(bin: string): void {
  console.log(`Inspect Acurast deployment details for a Switchboard relay.

USAGE
  $ ${bin} switchboard relay inspect <relay-id> [options]

FLAGS
  --deployment-id <n>     Acurast job sequence to inspect instead of resolving the latest local deployment.
  --spec <path>           Relay deployment spec path.
  --spec-file <path>      Alias for --spec.
  --watch                 Pass --watch to the packaged Acurast inspect helper.
  --events                Pass --events to the packaged Acurast inspect helper.
  --ops-profile <name>    Switchboard ops profile for admin defaults.
  --profile <name>        Alias for --ops-profile.
  --project-dir <path>    Switchboard project directory.
  --context <name>        Switchboard context name for runtime defaults.

DESCRIPTION
  Resolves the selected relay's Acurast deployment spec, picks the explicit
  deployment id or the latest local stage/history deployment id, and runs the
  packaged read-only Acurast inspect helper. It does not deploy jobs, publish
  catalogs, submit transactions, or mutate relay state.

EXAMPLES
  $ ${bin} switchboard relay inspect relay-d
  $ ${bin} switchboard relay inspect relay-d --deployment-id 51808
  $ ${bin} switchboard relay inspect relay-d --watch`);
}
