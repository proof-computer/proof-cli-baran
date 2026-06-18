import { runSwitchboardHostnameStatus as defaultRunSwitchboardHostnameStatusRunner } from "../../../switchboard-core/cli/src/index.js";
import { Command, Flags } from "@oclif/core";

type RunSwitchboardHostnameStatus = (argv?: readonly string[]) => Promise<void>;

export interface SwitchboardHostnameStatusOptions {
  runner?: RunSwitchboardHostnameStatus;
  loadRunner?: () => Promise<RunSwitchboardHostnameStatus | undefined>;
}

export default class SwitchboardHostnameStatus extends Command {
  static description = [
    "Check Baran customer hostname status.",
    "This is a read-only native proof entrypoint for the existing baran hostname status command."
  ].join("\n");
  static examples = [
    "<%= config.bin %> baran hostname status app.example.com --endpoint demo.ingress.example",
    "<%= config.bin %> baran hostname status app.example.com --endpoint-id demo.ingress.example --json",
    "<%= config.bin %> baran hostname status --customer-hostname app.example.com --endpoint demo.ingress.example --wait"
  ];
  static flags = {
    help: Flags.help({
      char: "h"
    }),
    json: Flags.boolean({
      description: "Print machine-readable output."
    }),
    report: Flags.string({
      description: "Deployment report JSON to read endpoint and relay defaults from."
    }),
    endpoint: Flags.string({
      description: "Canonical PROOF endpoint hostname."
    }),
    "endpoint-hostname": Flags.string({
      description: "Canonical PROOF endpoint hostname."
    }),
    "endpoint-id": Flags.string({
      description: "Stable endpoint ID, defaults to endpoint hostname."
    }),
    "customer-hostname": Flags.string({
      description: "Customer hostname, alternative to positional hostname."
    }),
    "relay-url": Flags.string({
      description: "Relay/control-plane base URL."
    }),
    wait: Flags.boolean({
      description: "Poll until DNS validates."
    }),
    "wait-seconds": Flags.string({
      description: "Explicit wait duration in seconds."
    }),
    "poll-seconds": Flags.string({
      description: "Polling interval in seconds."
    }),
    "skip-readiness-checks": Flags.boolean({
      description: "Only show relay DNS/certificate authorization state."
    }),
    "check-timeout-ms": Flags.string({
      description: "HTTPS readiness timeout in milliseconds."
    }),
    "route-intent-url": Flags.string({
      description: "Gateway route-intent API for customer SNI status."
    }),
    "operator-ssh-host": Flags.string({
      description: "SSH host when the route-intent API is on the operator."
    }),
    context: Flags.string({
      description: "Baran context name for runtime defaults."
    }),
    "project-dir": Flags.string({
      description: "Baran project directory."
    }),
    target: Flags.string({
      description: "Baran target, for example polkadot-hub."
    }),
    "manifest-url": Flags.string({
      description: "Network manifest path or URL."
    }),
    "manifest-signer": Flags.string({
      description: "Expected signed manifest signer."
    }),
    "allow-expired-manifest": Flags.boolean({
      description: "Accept an expired manifest for diagnostics only."
    })
  };
  static strict = false;
  static summary = "Check customer hostname status.";

  async run(): Promise<void> {
    this.parsed = true;
    if (this.argv.includes("--help") || this.argv.includes("-h")) {
      printSwitchboardHostnameStatusHelp(this.config.bin);
      return;
    }
    const exitCode = await runSwitchboardHostnameStatusNative(this.argv);
    if (exitCode !== 0) {
      this.exit(exitCode);
    }
  }
}

export async function runSwitchboardHostnameStatusNative(
  argv: readonly string[],
  options: SwitchboardHostnameStatusOptions = {}
): Promise<number> {
  const loadRunner = options.loadRunner ?? loadSwitchboardHostnameStatusRunner;
  const runner = options.runner ?? await loadRunner();
  if (runner) {
    return runSwitchboardHostnameStatusInProcess(runner, argv);
  }
  console.error("[baran] Error: internal proof baran runner runSwitchboardHostnameStatus is unavailable.");
  return 1;
}

async function loadSwitchboardHostnameStatusRunner(): Promise<RunSwitchboardHostnameStatus | undefined> {
  return defaultRunSwitchboardHostnameStatusRunner;
}

async function runSwitchboardHostnameStatusInProcess(
  runner: RunSwitchboardHostnameStatus,
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

function printSwitchboardHostnameStatusHelp(bin: string): void {
  console.log(`Check Baran customer hostname status.

USAGE
  $ ${bin} baran hostname status <hostname> --endpoint <endpoint> [--json]

FLAGS
  --endpoint <hostname>          Canonical PROOF endpoint hostname.
  --endpoint-hostname <hostname> Alias for --endpoint.
  --endpoint-id <id>             Stable endpoint ID, defaults to endpoint hostname.
  --customer-hostname <hostname> Alternative to positional hostname.
  --report <path>                Deployment report JSON to read endpoint and relay defaults from.
  --relay-url <url>              Relay/control-plane base URL.
  --wait                         Poll until DNS validates.
  --wait-seconds <n>             Explicit wait duration in seconds.
  --poll-seconds <n>             Polling interval in seconds.
  --skip-readiness-checks        Only show relay DNS/certificate authorization state.
  --check-timeout-ms <n>         HTTPS readiness timeout in milliseconds.
  --route-intent-url <url>       Gateway route-intent API for customer SNI status.
  --operator-ssh-host <host>     SSH host when the route-intent API is on the operator.
  --project-dir <path>           Baran project directory.
  --context <name>               Baran context name for runtime defaults.
  --target <name>                Baran target, for example polkadot-hub.
  --manifest-url <url>           Network manifest path or URL.
  --manifest-signer <signer>     Expected signed manifest signer.
  --allow-expired-manifest       Accept an expired manifest for diagnostics only.
  --json                         Print machine-readable output.

DESCRIPTION
  Read-only customer hostname diagnostics. It reads relay customer-hostname
  status and optional route/HTTPS readiness. It never signs, attaches,
  removes, mutates DNS or route state, submits transactions, or changes local
  Baran project/context state.

EXAMPLES
  $ ${bin} baran hostname status app.example.com --endpoint demo.ingress.example
  $ ${bin} baran hostname status app.example.com --endpoint-id demo.ingress.example --json
  $ ${bin} baran hostname status --customer-hostname app.example.com --endpoint demo.ingress.example --wait`);
}
