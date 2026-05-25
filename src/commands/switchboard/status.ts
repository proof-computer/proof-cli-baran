import { Command, Flags } from "@oclif/core";

import { runSwitchboardCompatibility } from "../switchboard.js";

type RunSwitchboardDeploymentStatus = (argv?: readonly string[]) => Promise<void>;

export interface SwitchboardStatusOptions {
  runner?: RunSwitchboardDeploymentStatus;
}

export default class SwitchboardStatus extends Command {
  static description = [
    "Diagnose a Switchboard deployment from its report or session ID.",
    "This is the native proof entrypoint for the existing top-level switchboard status command, not deploy status."
  ].join("\n");
  static examples = [
    "<%= config.bin %> switchboard status --report report.json",
    "<%= config.bin %> switchboard status --session-id 0x... --hostname app.example.com",
    "<%= config.bin %> switchboard status --report report.json --json"
  ];
  static flags = {
    help: Flags.help({
      char: "h"
    }),
    json: Flags.boolean({
      description: "Print a redacted JSON status report."
    }),
    report: Flags.string({
      description: "Deployment report JSON to diagnose."
    }),
    "session-id": Flags.string({
      description: "Hub session ID to inspect when no report is available."
    }),
    hostname: Flags.string({
      description: "Public hostname to check."
    }),
    "validation-hostname": Flags.string({
      description: "Validation hostname to check."
    }),
    "relay-url": Flags.string({
      description: "Relay/control-plane base URL."
    }),
    context: Flags.string({
      description: "Switchboard context name for runtime defaults."
    }),
    "project-dir": Flags.string({
      description: "Switchboard project directory."
    }),
    target: Flags.string({
      description: "Switchboard target, for example polkadot-hub."
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
    registry: Flags.string({
      description: "IngressRegistry contract address."
    }),
    "eth-rpc-url": Flags.string({
      description: "Hub Ethereum JSON-RPC URL."
    }),
    "substrate-ws-url": Flags.string({
      description: "Hub Substrate WebSocket URL."
    })
  };
  static strict = false;
  static summary = "Diagnose a Switchboard deployment.";

  async run(): Promise<void> {
    this.parsed = true;
    if (this.argv.includes("--help") || this.argv.includes("-h")) {
      printSwitchboardStatusHelp(this.config.bin);
      return;
    }
    const exitCode = await runSwitchboardDeploymentStatusNative(this.argv);
    if (exitCode !== 0) {
      this.exit(exitCode);
    }
  }
}

export async function runSwitchboardDeploymentStatusNative(
  argv: readonly string[],
  options: SwitchboardStatusOptions = {}
): Promise<number> {
  const runner = options.runner ?? await loadSwitchboardDeploymentStatusRunner();
  if (runner) {
    return runSwitchboardDeploymentStatusInProcess(runner, argv);
  }
  return runSwitchboardCompatibility(["status", ...argv]);
}

async function loadSwitchboardDeploymentStatusRunner(): Promise<RunSwitchboardDeploymentStatus | undefined> {
  try {
    const module = await import("@proof-computer/switchboard-cli");
    return typeof module.runSwitchboardDeploymentStatus === "function"
      ? module.runSwitchboardDeploymentStatus
      : undefined;
  } catch {
    return undefined;
  }
}

async function runSwitchboardDeploymentStatusInProcess(
  runner: RunSwitchboardDeploymentStatus,
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

function printSwitchboardStatusHelp(bin: string): void {
  console.log(`Diagnose a Switchboard deployment.

USAGE
  $ ${bin} switchboard status --report <path> [--json]
  $ ${bin} switchboard status --session-id <bytes32> --hostname <host> [--json]

FLAGS
  --report <path>              Deployment report JSON to diagnose.
  --session-id <bytes32>       Hub session ID to inspect when no report is available.
  --hostname <host>            Public hostname to check.
  --validation-hostname <host> Validation hostname to check.
  --relay-url <url>            Relay/control-plane base URL.
  --project-dir <path>         Switchboard project directory.
  --context <name>             Switchboard context name for runtime defaults.
  --target <name>              Switchboard target, for example polkadot-hub.
  --manifest-url <url>         Network manifest path or URL.
  --manifest-signer <signer>   Expected signed manifest signer.
  --allow-expired-manifest     Accept an expired manifest for diagnostics only.
  --registry <address>         IngressRegistry contract address.
  --eth-rpc-url <url>          Hub Ethereum JSON-RPC URL.
  --substrate-ws-url <url>     Hub Substrate WebSocket URL.
  --json                       Print a redacted JSON status report.

DESCRIPTION
  Native proof CLI entrypoint for the existing top-level switchboard status
  workflow. It reads deployment report, Hub, relay, DNS, and public route
  health state. It is not deploy status and does not resume workflows, spend,
  repair routes, mutate DNS, or submit validator/settlement writes.

EXAMPLES
  $ ${bin} switchboard status --report report.json
  $ ${bin} switchboard status --session-id 0x... --hostname app.example.com
  $ ${bin} switchboard status --report report.json --json`);
}
