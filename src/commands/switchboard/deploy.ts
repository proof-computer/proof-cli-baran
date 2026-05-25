import { Command, Flags } from "@oclif/core";

import { runSwitchboardCompatibility } from "../switchboard.js";

type RunSwitchboardDeploy = (argv?: readonly string[]) => Promise<void>;

export interface SwitchboardDeployOptions {
  runner?: RunSwitchboardDeploy;
}

export default class SwitchboardDeploy extends Command {
  static description = [
    "Deploy a project workload through Switchboard.",
    "This is the native proof entrypoint for the existing switchboard deploy workflow. It can spend ACU and the configured Hub payment asset, so --yes is required unless --dry-run is used."
  ].join("\n");
  static examples = [
    "<%= config.bin %> switchboard deploy --entrypoint src/index.ts --yes",
    "<%= config.bin %> switchboard deploy --runtime script --ssh-public-key-file ~/.ssh/id_ed25519.pub --yes",
    "<%= config.bin %> switchboard deploy --dry-run --entrypoint src/index.ts --json"
  ];
  static flags = {
    help: Flags.help({
      char: "h"
    }),
    yes: Flags.boolean({
      description: "Confirm a deploy that can spend ACU and the configured Hub payment asset."
    }),
    "dry-run": Flags.boolean({
      description: "Print the deploy runner command without side effects."
    }),
    json: Flags.boolean({
      description: "Print machine-readable output."
    }),
    entrypoint: Flags.string({
      description: "Project entrypoint; required unless switchboard.json defines acurast.entrypoint."
    }),
    runtime: Flags.string({
      description: "Runtime kind: node or script."
    }),
    "script-image-url": Flags.string({
      description: "Script runtime image URL."
    }),
    "script-image-sha256": Flags.string({
      description: "Script runtime image sha256."
    }),
    "ssh-public-key-file": Flags.string({
      description: "Authorized SSH public key file for Script/Cargo SSH templates."
    }),
    "relay-url": Flags.string({
      description: "Relay/control-plane base URL."
    }),
    "operator-id": Flags.string({
      description: "Pin deploy capacity to one operator ID."
    }),
    "gateway-id": Flags.string({
      description: "Pin deploy capacity to one gateway ID."
    }),
    processor: Flags.string({
      description: "Pin deploy capacity to one Acurast processor."
    }),
    "duration-minutes": Flags.string({
      description: "Lease duration in minutes."
    }),
    "lease-minutes": Flags.string({
      description: "Alias for --duration-minutes."
    }),
    "schedule-buffer-minutes": Flags.string({
      description: "Extra runtime beyond the lease."
    }),
    quote: Flags.boolean({
      description: "Fund through a signed deployment-intent quote."
    }),
    "payment-mode": Flags.string({
      description: "Payment mode. The public deploy path currently supports quote."
    }),
    report: Flags.string({
      description: "Deployment report JSON to diagnose."
    }),
    "run-dir": Flags.string({
      description: "Deploy run directory for workflow snapshots."
    }),
    snapshot: Flags.string({
      description: "Deploy workflow snapshot for status/resume."
    }),
    "allow-late-funding": Flags.boolean({
      description: "Resume funding after an expired Acurast start/end window."
    }),
    manifest: Flags.string({
      description: "Network manifest path or URL."
    }),
    context: Flags.string({
      description: "Switchboard context name for runtime defaults."
    }),
    "project-dir": Flags.string({
      description: "Switchboard project directory."
    })
  };
  static strict = false;
  static summary = "Deploy a project workload through Switchboard.";

  async run(): Promise<void> {
    this.parsed = true;
    if (this.argv.includes("--help") || this.argv.includes("-h")) {
      printSwitchboardDeployHelp(this.config.bin);
      return;
    }
    const exitCode = await runSwitchboardDeployNative(this.argv);
    if (exitCode !== 0) {
      this.exit(exitCode);
    }
  }
}

export async function runSwitchboardDeployNative(
  argv: readonly string[],
  options: SwitchboardDeployOptions = {}
): Promise<number> {
  const runner = options.runner ?? await loadSwitchboardDeployRunner();
  if (runner) {
    return runSwitchboardDeployInProcess(runner, argv);
  }
  return runSwitchboardCompatibility(["deploy", ...argv]);
}

async function loadSwitchboardDeployRunner(): Promise<RunSwitchboardDeploy | undefined> {
  try {
    const module = await import("@proof-computer/switchboard-cli");
    return typeof module.runSwitchboardDeploy === "function"
      ? module.runSwitchboardDeploy
      : undefined;
  } catch {
    return undefined;
  }
}

async function runSwitchboardDeployInProcess(
  runner: RunSwitchboardDeploy,
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

function printSwitchboardDeployHelp(bin: string): void {
  console.log(`Deploy a project workload through Switchboard.

USAGE
  $ ${bin} switchboard deploy --entrypoint <path> --yes [--json]
  $ ${bin} switchboard deploy --dry-run --entrypoint <path> [--json]

FLAGS
  --yes                         Required unless --dry-run; confirms spend.
  --dry-run                     Print the deploy runner command without side effects.
  --entrypoint <path>           Required unless switchboard.json has acurast.entrypoint.
  --runtime <node|script>       Default node; script maps to Acurast Cargo Shell.
  --script-image-url <url>      Script runtime image URL.
  --script-image-sha256 <hash>  Script runtime image sha256.
  --ssh-public-key-file <path>  Authorized SSH public key file for Script/Cargo SSH templates.
  --relay-url <url>             Relay/control-plane base URL.
  --operator-id <id>            Pin deploy capacity to one operator ID.
  --gateway-id <id>             Pin deploy capacity to one gateway ID.
  --processor <account>         Pin deploy capacity to one Acurast processor.
  --duration-minutes <minutes>  Lease duration in minutes.
  --lease-minutes <minutes>     Alias for --duration-minutes.
  --schedule-buffer-minutes <n> Extra runtime beyond the lease.
  --quote                       Fund through a signed deployment-intent quote.
  --payment-mode <mode>         Payment mode. Public deploy currently supports quote.
  --report <path>               Deployment report JSON to diagnose.
  --run-dir <path>              Deploy run directory for workflow snapshots.
  --snapshot <path>             Deploy workflow snapshot for status/resume.
  --allow-late-funding          Resume funding after an expired Acurast start/end window.
  --manifest <path-or-url>      Network manifest path or URL.
  --context <name>              Switchboard context name for runtime defaults.
  --project-dir <path>          Switchboard project directory.
  --json                        Print machine-readable output.

DESCRIPTION
  Native proof CLI entrypoint for the existing switchboard deploy workflow.
  It preserves the current deploy behavior, including quote funding, route
  reconciliation, local workflow snapshots, and spend confirmation guardrails.

EXAMPLES
  $ ${bin} switchboard deploy --entrypoint src/index.ts --yes
  $ ${bin} switchboard deploy --runtime script --ssh-public-key-file ~/.ssh/id_ed25519.pub --yes
  $ ${bin} switchboard deploy --dry-run --entrypoint src/index.ts --json`);
}
