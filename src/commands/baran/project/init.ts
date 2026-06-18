import { runSwitchboardProjectInit as defaultRunSwitchboardProjectInitRunner } from "../../../switchboard-core/cli/src/index.js";
import { Command } from "@oclif/core";

import {
  assertNoInitEndpointArgs,
  initFlags,
  printSwitchboardInitHelp
} from "../init.js";

type RunSwitchboardProjectInit = (argv?: readonly string[]) => Promise<void>;

export interface SwitchboardProjectInitOptions {
  runner?: RunSwitchboardProjectInit;
  loadRunner?: () => Promise<RunSwitchboardProjectInit | undefined>;
}

export default class SwitchboardProjectInit extends Command {
  static description = [
    "Initialize a local Baran project.",
    "This native proof entrypoint calls the existing baran project init implementation, including the SSH template scaffold."
  ].join("\n");
  static examples = [
    "<%= config.bin %> baran project init --project hello-api --context mainnet",
    "<%= config.bin %> baran project init --template ssh --distro ubuntu",
    "<%= config.bin %> baran project init --project-dir ./app --force --json"
  ];
  static flags = initFlags();
  static strict = false;
  static summary = "Initialize a local Baran project.";

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
    console.error(`[baran] ${message}`);
    return 1;
  }
  const loadRunner = options.loadRunner ?? loadSwitchboardProjectInitRunner;
  const runner = options.runner ?? await loadRunner();
  if (runner) {
    return runSwitchboardProjectInitInProcess(runner, argv);
  }
  console.error("[baran] Error: internal proof baran runner runSwitchboardProjectInit is unavailable.");
  return 1;
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
