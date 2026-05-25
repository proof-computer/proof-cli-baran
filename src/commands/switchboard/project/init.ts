import { Command } from "@oclif/core";

import { runSwitchboardCompatibility } from "../../switchboard.js";
import {
  assertNoInitEndpointArgs,
  initFlags,
  printSwitchboardInitHelp
} from "../init.js";

type RunSwitchboardProjectInit = (argv?: readonly string[]) => Promise<void>;
type RunSwitchboardCompatibility = (argv: readonly string[]) => Promise<number>;

export interface SwitchboardProjectInitOptions {
  runner?: RunSwitchboardProjectInit;
  loadRunner?: () => Promise<RunSwitchboardProjectInit | undefined>;
  compatibilityRunner?: RunSwitchboardCompatibility;
}

export default class SwitchboardProjectInit extends Command {
  static description = [
    "Initialize a local Switchboard project.",
    "This native proof entrypoint calls the existing switchboard project init implementation, including the SSH template scaffold."
  ].join("\n");
  static examples = [
    "<%= config.bin %> switchboard project init --project hello-api --context mainnet",
    "<%= config.bin %> switchboard project init --template ssh --distro ubuntu",
    "<%= config.bin %> switchboard project init --project-dir ./app --force --json"
  ];
  static flags = initFlags();
  static strict = false;
  static summary = "Initialize a local Switchboard project.";

  async run(): Promise<void> {
    this.parsed = true;
    if (this.argv.includes("--help") || this.argv.includes("-h")) {
      printSwitchboardInitHelp(this.config.bin, "project init");
      return;
    }
    const exitCode = await runSwitchboardProjectInitNative(this.argv);
    if (exitCode !== 0) {
      this.exit(exitCode);
    }
  }
}

export async function runSwitchboardProjectInitNative(
  argv: readonly string[],
  options: SwitchboardProjectInitOptions = {}
): Promise<number> {
  try {
    assertNoInitEndpointArgs(argv);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[switchboard] ${message}`);
    return 1;
  }
  const loadRunner = options.loadRunner ?? loadSwitchboardProjectInitRunner;
  const runner = options.runner ?? await loadRunner();
  if (runner) {
    return runSwitchboardProjectInitInProcess(runner, argv);
  }
  const compatibilityRunner = options.compatibilityRunner ?? runSwitchboardCompatibility;
  return compatibilityRunner(["project", "init", ...argv]);
}

async function loadSwitchboardProjectInitRunner(): Promise<RunSwitchboardProjectInit | undefined> {
  try {
    const module = await import("@proof-computer/switchboard-cli");
    return typeof module.runSwitchboardProjectInit === "function"
      ? module.runSwitchboardProjectInit
      : undefined;
  } catch {
    return undefined;
  }
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
