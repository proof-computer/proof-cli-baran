import { Command } from "@oclif/core";
import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { readFile } from "node:fs/promises";
import path from "node:path";

type RunSwitchboardCli = (argv: readonly string[]) => Promise<void>;

export interface SwitchboardCompatibilityOptions {
  runner?: RunSwitchboardCli;
}

export default class Switchboard extends Command {
  static description = "Run Switchboard commands.";
  static strict = false;
  static summary = "Run Switchboard commands.";

  async run(): Promise<void> {
    this.parsed = true;
    const exitCode = await runSwitchboardCompatibility(this.argv);
    if (exitCode !== 0) {
      this.exit(exitCode);
    }
  }
}

export async function runSwitchboardCompatibility(
  argv: readonly string[],
  options: SwitchboardCompatibilityOptions = {}
): Promise<number> {
  const runner = options.runner ?? await loadSwitchboardRunner();
  if (runner) {
    return runSwitchboardInProcess(runner, argv);
  }
  return runSwitchboardChild(argv);
}

async function loadSwitchboardRunner(): Promise<RunSwitchboardCli | undefined> {
  try {
    const module = await import("@proof-computer/switchboard-cli");
    return typeof module.runSwitchboardCli === "function" ? module.runSwitchboardCli : undefined;
  } catch {
    return undefined;
  }
}

async function runSwitchboardInProcess(runner: RunSwitchboardCli, argv: readonly string[]): Promise<number> {
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

async function runSwitchboardChild(argv: readonly string[]): Promise<number> {
  const binPath = await resolveSwitchboardBinPath();

  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [binPath, ...argv], {
      cwd: process.cwd(),
      env: process.env,
      stdio: "inherit"
    });
    child.on("error", reject);
    child.on("exit", (code, signal) => {
      if (typeof code === "number") {
        resolve(code);
        return;
      }
      console.error(`[switchboard] switchboard-cli exited from signal ${signal ?? "unknown"}`);
      resolve(1);
    });
  });
}

async function resolveSwitchboardBinPath(): Promise<string> {
  const require = createRequire(import.meta.url);
  const packageJsonPath = require.resolve("@proof-computer/switchboard-cli/package.json");
  const packageRoot = path.dirname(packageJsonPath);
  const packageJson = JSON.parse(await readFile(packageJsonPath, "utf8")) as {
    bin?: {
      switchboard?: string;
    };
  };
  const bin = packageJson.bin?.switchboard ?? "dist/index.js";
  return path.resolve(packageRoot, bin);
}

function switchboardOutputHandled(error: unknown): boolean {
  return Boolean(
    error &&
      typeof error === "object" &&
      (error as { switchboardOutputHandled?: boolean }).switchboardOutputHandled
  );
}
