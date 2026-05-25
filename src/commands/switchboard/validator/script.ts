import { Command, Flags } from "@oclif/core";

import { runSwitchboardCompatibility } from "../../switchboard.js";

type RunSwitchboardValidatorScript = (argv?: readonly string[]) => Promise<void>;
type RunSwitchboardCompatibility = (argv: readonly string[]) => Promise<number>;

export interface SwitchboardValidatorScriptOptions {
  runner?: RunSwitchboardValidatorScript;
  loadRunner?: () => Promise<RunSwitchboardValidatorScript | undefined>;
  compatibilityRunner?: RunSwitchboardCompatibility;
}

export default class SwitchboardValidatorScript extends Command {
  static description = [
    "Look up the approved Switchboard validator script pin.",
    "This is a read-only native proof entrypoint for the existing switchboard validator script command."
  ].join("\n");
  static examples = [
    "<%= config.bin %> switchboard validator script",
    "<%= config.bin %> switchboard validator script --json",
    "<%= config.bin %> switchboard validator script --validator-script-manifest-url https://example.com/validator-script-manifest.json"
  ];
  static flags = {
    help: Flags.help({
      char: "h"
    }),
    json: Flags.boolean({
      description: "Print machine-readable output."
    }),
    "validator-script-manifest-json": Flags.string({
      description: "Inline validator script manifest JSON."
    }),
    "validator-script-manifest-file": Flags.string({
      description: "Path to validator script manifest JSON."
    }),
    "validator-script-manifest-url": Flags.string({
      description: "Validator script manifest URL."
    }),
    "manifest-url": Flags.string({
      description: "Network manifest path or URL."
    }),
    "manifest-signer": Flags.string({
      description: "Expected signed manifest signer."
    }),
    "allow-expired-manifest": Flags.boolean({
      description: "Accept an expired manifest for diagnostics only."
    }),
    context: Flags.string({
      description: "Switchboard context name for runtime defaults."
    }),
    "project-dir": Flags.string({
      description: "Switchboard project directory."
    })
  };
  static strict = false;
  static summary = "Look up the approved validator script pin.";

  async run(): Promise<void> {
    this.parsed = true;
    if (this.argv.includes("--help") || this.argv.includes("-h")) {
      printSwitchboardValidatorScriptHelp(this.config.bin);
      return;
    }
    const exitCode = await runSwitchboardValidatorScriptNative(this.argv);
    if (exitCode !== 0) {
      this.exit(exitCode);
    }
  }
}

export async function runSwitchboardValidatorScriptNative(
  argv: readonly string[],
  options: SwitchboardValidatorScriptOptions = {}
): Promise<number> {
  const loadRunner = options.loadRunner ?? loadSwitchboardValidatorScriptRunner;
  const runner = options.runner ?? await loadRunner();
  if (runner) {
    return runSwitchboardValidatorScriptInProcess(runner, argv);
  }
  const compatibilityRunner = options.compatibilityRunner ?? runSwitchboardCompatibility;
  return compatibilityRunner(["validator", "script", ...argv]);
}

async function loadSwitchboardValidatorScriptRunner(): Promise<RunSwitchboardValidatorScript | undefined> {
  try {
    const module = await import("@proof-computer/switchboard-cli");
    return typeof module.runSwitchboardValidatorScript === "function"
      ? module.runSwitchboardValidatorScript
      : undefined;
  } catch {
    return undefined;
  }
}

async function runSwitchboardValidatorScriptInProcess(
  runner: RunSwitchboardValidatorScript,
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

function printSwitchboardValidatorScriptHelp(bin: string): void {
  console.log(`Look up the approved Switchboard validator script pin.

USAGE
  $ ${bin} switchboard validator script [--json]

FLAGS
  --validator-script-manifest-json <json> Inline validator script manifest JSON.
  --validator-script-manifest-file <path> Path to validator script manifest JSON.
  --validator-script-manifest-url <url>  Validator script manifest URL.
  --project-dir <path>                   Switchboard project directory.
  --context <name>                       Switchboard context name for runtime defaults.
  --manifest-url <url>                   Network manifest path or URL.
  --manifest-signer <signer>             Expected signed manifest signer.
  --allow-expired-manifest               Accept an expired manifest for diagnostics only.
  --json                                 Print machine-readable output.

DESCRIPTION
  Read-only validator script inspection. It looks up validators.launch.scriptIpfs
  from the signed network manifest, then falls back to a validator script
  manifest supplied by JSON, file, or URL. It never launches validators, signs,
  submits transactions, deploys jobs, mutates relay or catalog state, or
  changes local Switchboard project/context state.

EXAMPLES
  $ ${bin} switchboard validator script
  $ ${bin} switchboard validator script --json
  $ ${bin} switchboard validator script --validator-script-manifest-url https://example.com/validator-script-manifest.json`);
}
