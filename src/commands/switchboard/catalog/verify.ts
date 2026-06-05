import { runSwitchboardCatalogVerify as defaultRunSwitchboardCatalogVerifyRunner } from "../../../switchboard-core/cli/src/index.js";
import { Command, Flags } from "@oclif/core";

type RunSwitchboardCatalogVerify = (argv?: readonly string[]) => Promise<void>;

export interface SwitchboardCatalogVerifyOptions {
  runner?: RunSwitchboardCatalogVerify;
  loadRunner?: () => Promise<RunSwitchboardCatalogVerify | undefined>;
}

export default class SwitchboardCatalogVerify extends Command {
  static description = [
    "Verify signed Switchboard service catalogs from a network manifest.",
    "This is the native proof entrypoint for the existing read-only switchboard catalog verify command."
  ].join("\n");
  static examples = [
    "<%= config.bin %> switchboard catalog verify --manifest-url https://control.example/v1/network-manifest --manifest-signer 5...",
    "<%= config.bin %> switchboard catalog verify --manifest-url https://control.example/v1/network-manifest --manifest-signer 5... --json",
    "<%= config.bin %> switchboard catalog verify --required relays,control-api"
  ];
  static flags = {
    help: Flags.help({
      char: "h"
    }),
    json: Flags.boolean({
      description: "Print machine-readable output."
    }),
    "manifest-url": Flags.string({
      description: "Network manifest path or URL."
    }),
    "manifest-signer": Flags.string({
      description: "Expected signed manifest signer."
    }),
    "allow-unpinned-signer": Flags.boolean({
      description: "Allow diagnostics without a pinned manifest signer."
    }),
    required: Flags.string({
      description: "Comma-separated required catalog keys or roles."
    }),
    "allow-expired": Flags.boolean({
      description: "Accept expired manifests and catalogs for diagnostics only."
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
  static summary = "Verify signed service catalogs.";

  async run(): Promise<void> {
    this.parsed = true;
    if (this.argv.includes("--help") || this.argv.includes("-h")) {
      printSwitchboardCatalogVerifyHelp(this.config.bin);
      return;
    }
    const exitCode = await runSwitchboardCatalogVerifyNative(this.argv);
    if (exitCode !== 0) {
      this.exit(exitCode);
    }
  }
}

export async function runSwitchboardCatalogVerifyNative(
  argv: readonly string[],
  options: SwitchboardCatalogVerifyOptions = {}
): Promise<number> {
  const loadRunner = options.loadRunner ?? loadSwitchboardCatalogVerifyRunner;
  const runner = options.runner ?? await loadRunner();
  if (runner) {
    return runSwitchboardCatalogVerifyInProcess(runner, argv);
  }
  console.error("[switchboard] Error: internal proof switchboard runner runSwitchboardCatalogVerify is unavailable.");
  return 1;
}

async function loadSwitchboardCatalogVerifyRunner(): Promise<RunSwitchboardCatalogVerify | undefined> {
  return defaultRunSwitchboardCatalogVerifyRunner;
}

async function runSwitchboardCatalogVerifyInProcess(
  runner: RunSwitchboardCatalogVerify,
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

function printSwitchboardCatalogVerifyHelp(bin: string): void {
  console.log(`Verify signed Switchboard service catalogs from a network manifest.

USAGE
  $ ${bin} switchboard catalog verify --manifest-url <url> --manifest-signer <signer> [--json]

FLAGS
  --manifest-url <url>        Network manifest path or URL.
  --manifest-signer <signer>  Expected signed manifest signer.
  --allow-unpinned-signer     Allow diagnostics without a pinned manifest signer.
  --required <csv>            Comma-separated required catalog keys or roles.
  --allow-expired             Accept expired manifests and catalogs for diagnostics only.
  --ops-profile <name>        Switchboard ops profile for admin defaults.
  --profile <name>            Alias for --ops-profile.
  --project-dir <path>        Switchboard project directory.
  --context <name>            Switchboard context name for runtime defaults.
  --json                      Print machine-readable output.

DESCRIPTION
  Read-only service catalog verification. It loads the signed network manifest,
  requires a pinned manifest signer unless --allow-unpinned-signer is explicit,
  fetches referenced service catalogs, verifies catalog signer/digest/freshness
  policy, and reports the resolved catalogs. It never builds catalogs, changes
  catalog state, signs payloads, submits transactions, deploys jobs, mutates
  relay state, or changes local Switchboard project/context state.

EXAMPLES
  $ ${bin} switchboard catalog verify --manifest-url https://control.example/v1/network-manifest --manifest-signer 5...
  $ ${bin} switchboard catalog verify --manifest-url https://control.example/v1/network-manifest --manifest-signer 5... --json
  $ ${bin} switchboard catalog verify --required relays,control-api`);
}
