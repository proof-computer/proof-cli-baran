import { Command, Flags } from "@oclif/core";

import { runSwitchboardRetire as defaultRunSwitchboardRetireRunner } from "../../switchboard-core/cli/src/index.js";
import { runIngressNative, type IngressRunner } from "../../switchboard-core/cli/src/ingress-native.js";

export interface SwitchboardRetireOptions {
  runner?: IngressRunner;
}

export default class SwitchboardRetire extends Command {
  static summary = "Retire a PROOF Ingress route (parachain).";
  static description = [
    "Retire a route (retire_route) on the PROOF Ingress parachain.",
    "Without --yes this previews the route status; pass --yes to submit."
  ].join("\n");
  static examples = [
    "<%= config.bin %> baran retire --target proof-ingress-local --route-id 0x... --polkadot-seed //Alice --yes --json"
  ];
  static strict = false;
  static flags = {
    help: Flags.help({ char: "h" }),
    json: Flags.boolean({ description: "Print machine-readable output." }),
    yes: Flags.boolean({ description: "Submit the retirement. Without --yes this is a dry-run preview." }),
    target: Flags.string({ description: "Baran target, e.g. proof-ingress-local." }),
    "parachain-ws-url": Flags.string({ description: "PROOF Ingress parachain WebSocket url." }),
    "substrate-ws-url": Flags.string({ description: "Alias for --parachain-ws-url." }),
    "route-id": Flags.string({ description: "Route id to retire (or derive via --hostname/--route-class-id/--salt/--owner)." }),
    hostname: Flags.string({ description: "Hostname to derive the route id." }),
    "route-class-id": Flags.string({ description: "Route class id to derive the route id." }),
    salt: Flags.string({ description: "32-byte hex salt to derive the route id." }),
    owner: Flags.string({ description: "Owner ss58 address to derive the route id (defaults to the signer)." }),
    "polkadot-seed": Flags.string({ description: "sr25519 signer seed / //URI (or POLKADOT_SEED)." }),
    "polkadot-address": Flags.string({ description: "Expected signer ss58 address." }),
    "ss58-format": Flags.string({ description: "ss58 address format." })
  };

  async run(): Promise<void> {
    this.parsed = true;
    const exitCode = await runSwitchboardRetireNative(this.argv);
    if (exitCode !== 0) {
      this.exit(exitCode);
    }
  }
}

export async function runSwitchboardRetireNative(
  argv: readonly string[],
  options: SwitchboardRetireOptions = {}
): Promise<number> {
  return runIngressNative(options.runner ?? defaultRunSwitchboardRetireRunner, argv, "runSwitchboardRetire");
}
