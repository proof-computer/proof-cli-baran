import { Command, Flags } from "@oclif/core";

import { runSwitchboardRoute as defaultRunSwitchboardRouteRunner } from "../../switchboard-core/cli/src/index.js";
import { runIngressNative, type IngressRunner } from "../../switchboard-core/cli/src/ingress-native.js";

export interface SwitchboardRouteOptions {
  runner?: IngressRunner;
}

export default class SwitchboardRoute extends Command {
  static summary = "Show a PROOF Ingress route's on-chain status (parachain).";
  static description = [
    "Read a route record from the PROOF Ingress parachain: owner, broker, class,",
    "shard, paid-until epoch, status, escrow, active generation, and refund state.",
    "Read-only — no signer required."
  ].join("\n");
  static examples = [
    "<%= config.bin %> switchboard route --target proof-ingress-local --route-id 0x... --json",
    "<%= config.bin %> switchboard route --target proof-ingress-local --hostname app.example.com --route-class-id 42 --owner 5... --json"
  ];
  static strict = false;
  static flags = {
    help: Flags.help({ char: "h" }),
    json: Flags.boolean({ description: "Print machine-readable output." }),
    target: Flags.string({ description: "Switchboard target, e.g. proof-ingress-local." }),
    "parachain-ws-url": Flags.string({ description: "PROOF Ingress parachain WebSocket url." }),
    "substrate-ws-url": Flags.string({ description: "Alias for --parachain-ws-url." }),
    "route-id": Flags.string({ description: "Route id (or derive via --hostname/--route-class-id/--salt/--owner)." }),
    hostname: Flags.string({ description: "Hostname to derive the route id." }),
    "route-class-id": Flags.string({ description: "Route class id to derive the route id." }),
    salt: Flags.string({ description: "32-byte hex salt to derive the route id." }),
    owner: Flags.string({ description: "Owner ss58 address to derive the route id." }),
    "ss58-format": Flags.string({ description: "ss58 address format." })
  };

  async run(): Promise<void> {
    this.parsed = true;
    const exitCode = await runSwitchboardRouteNative(this.argv);
    if (exitCode !== 0) {
      this.exit(exitCode);
    }
  }
}

export async function runSwitchboardRouteNative(
  argv: readonly string[],
  options: SwitchboardRouteOptions = {}
): Promise<number> {
  return runIngressNative(options.runner ?? defaultRunSwitchboardRouteRunner, argv, "runSwitchboardRoute");
}
