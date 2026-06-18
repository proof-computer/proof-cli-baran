import { Command, Flags } from "@oclif/core";

import { runSwitchboardLease as defaultRunSwitchboardLeaseRunner } from "../../switchboard-core/cli/src/index.js";
import { runIngressNative, type IngressRunner } from "../../switchboard-core/cli/src/ingress-native.js";

export interface SwitchboardLeaseOptions {
  runner?: IngressRunner;
}

export default class SwitchboardLease extends Command {
  static summary = "Lease a PROOF Ingress route (parachain).";
  static description = [
    "Create a route lease (create_route_lease) on the PROOF Ingress parachain.",
    "Without --yes this previews the precomputed route id and required payment; pass --yes to submit."
  ].join("\n");
  static examples = [
    "<%= config.bin %> baran lease --target proof-ingress-local --broker-id 0 --route-class-id 42 --hostname app.example.com --lease-epochs 10 --polkadot-seed //Alice --yes --json"
  ];
  static strict = false;
  static flags = {
    help: Flags.help({ char: "h" }),
    json: Flags.boolean({ description: "Print machine-readable output." }),
    yes: Flags.boolean({ description: "Submit the lease. Without --yes this is a dry-run preview." }),
    target: Flags.string({ description: "Baran target, e.g. proof-ingress-local." }),
    "parachain-ws-url": Flags.string({ description: "PROOF Ingress parachain WebSocket url." }),
    "substrate-ws-url": Flags.string({ description: "Alias for --parachain-ws-url." }),
    "broker-id": Flags.string({ description: "Broker id to lease from." }),
    "route-class-id": Flags.string({ description: "Route class id." }),
    hostname: Flags.string({ description: "Route hostname (hashed on chain)." }),
    "lease-epochs": Flags.string({ description: "Number of epochs to pre-pay." }),
    salt: Flags.string({ description: "32-byte hex salt for the route id (default zero)." }),
    "policy-hash": Flags.string({ description: "Off-chain policy document hash (default zero)." }),
    "cert-binding-hash": Flags.string({ description: "Off-chain cert binding hash (default zero)." }),
    payment: Flags.string({ description: "Payment amount. Default = required = max(price,floor)*units*epochs." }),
    "polkadot-seed": Flags.string({ description: "sr25519 signer seed / //URI (or POLKADOT_SEED)." }),
    "polkadot-address": Flags.string({ description: "Expected signer ss58 address." }),
    "ss58-format": Flags.string({ description: "ss58 address format." })
  };

  async run(): Promise<void> {
    this.parsed = true;
    const exitCode = await runSwitchboardLeaseNative(this.argv);
    if (exitCode !== 0) {
      this.exit(exitCode);
    }
  }
}

export async function runSwitchboardLeaseNative(
  argv: readonly string[],
  options: SwitchboardLeaseOptions = {}
): Promise<number> {
  return runIngressNative(options.runner ?? defaultRunSwitchboardLeaseRunner, argv, "runSwitchboardLease");
}
