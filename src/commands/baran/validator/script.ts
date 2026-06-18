import { runSwitchboardValidatorScript as defaultRunSwitchboardValidatorScriptRunner } from "../../../switchboard-core/cli/src/index.js";
import { Command, Flags } from "@oclif/core";

type RunSwitchboardValidatorScript = (argv?: readonly string[]) => Promise<void>;

export interface SwitchboardValidatorScriptOptions {
  runner?: RunSwitchboardValidatorScript;
  loadRunner?: () => Promise<RunSwitchboardValidatorScript | undefined>;
}

export default class SwitchboardValidatorScript extends Command {
  static description = [
    "Look up the approved Baran validator script pin.",
    "This is a read-only native proof entrypoint for the existing baran validator script command."
  ].join("\n");
  static examples = [
    "<%= config.bin %> baran validator script",
    "<%= config.bin %> baran validator script --json",
    "<%= config.bin %> baran validator script --validator-script-manifest-url https://example.com/validator-script-manifest.json"
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
      description: "Baran context name for runtime defaults."
    }),
    "project-dir": Flags.string({
      description: "Baran project directory."
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
  console.error("[baran] Error: internal proof baran runner runSwitchboardValidatorScript is unavailable.");
  return 1;
}

async function loadSwitchboardValidatorScriptRunner(): Promise<RunSwitchboardValidatorScript | undefined> {
  return defaultRunSwitchboardValidatorScriptRunner;
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

function printSwitchboardValidatorScriptHelp(bin: string): void {
  console.log(`Look up the approved Baran validator script pin.

USAGE
  $ ${bin} baran validator script [--json]

FLAGS
  --validator-script-manifest-json <json> Inline validator script manifest JSON.
  --validator-script-manifest-file <path> Path to validator script manifest JSON.
  --validator-script-manifest-url <url>  Validator script manifest URL.
  --project-dir <path>                   Baran project directory.
  --context <name>                       Baran context name for runtime defaults.
  --manifest-url <url>                   Network manifest path or URL.
  --manifest-signer <signer>             Expected signed manifest signer.
  --allow-expired-manifest               Accept an expired manifest for diagnostics only.
  --json                                 Print machine-readable output.

DESCRIPTION
  Read-only validator script inspection. It looks up validators.launch.scriptIpfs
  from the signed network manifest, then falls back to a validator script
  manifest supplied by JSON, file, or URL. It never launches validators, signs,
  submits transactions, deploys jobs, mutates relay or catalog state, or
  changes local Baran project/context state.

EXAMPLES
  $ ${bin} baran validator script
  $ ${bin} baran validator script --json
  $ ${bin} baran validator script --validator-script-manifest-url https://example.com/validator-script-manifest.json`);
}
