import { Command, Flags } from "@oclif/core";

import { runSwitchboardRenew as defaultRunSwitchboardRenewRunner } from "../../switchboard-core/cli/src/index.js";
import { runIngressNative, type IngressRunner } from "../../switchboard-core/cli/src/ingress-native.js";

export interface SwitchboardRenewOptions {
  runner?: IngressRunner;
}

export default class SwitchboardRenew extends Command {
  static summary = "Renew a PROOF Ingress route lease (parachain).";
  static description = [
    "Extend a route lease (renew_route) on the PROOF Ingress parachain.",
    "Without --yes this previews the payment and current paid-until epoch; pass --yes to submit."
  ].join("\n");
  static examples = [
    "<%= config.bin %> switchboard renew --target proof-ingress-local --route-id 0x... --additional-epochs 10 --polkadot-seed //Alice --yes --json"
  ];
  static strict = false;
  static flags = {
    help: Flags.help({ char: "h" }),
    json: Flags.boolean({ description: "Print machine-readable output." }),
    yes: Flags.boolean({ description: "Submit the renewal. Without --yes this is a dry-run preview." }),
    target: Flags.string({ description: "Switchboard target, e.g. proof-ingress-local." }),
    "parachain-ws-url": Flags.string({ description: "PROOF Ingress parachain WebSocket url." }),
    "substrate-ws-url": Flags.string({ description: "Alias for --parachain-ws-url." }),
    "route-id": Flags.string({ description: "Route id to renew (or derive via --hostname/--route-class-id/--salt/--owner)." }),
    hostname: Flags.string({ description: "Hostname to derive the route id." }),
    "route-class-id": Flags.string({ description: "Route class id to derive the route id." }),
    salt: Flags.string({ description: "32-byte hex salt to derive the route id." }),
    owner: Flags.string({ description: "Owner ss58 address to derive the route id (defaults to the signer)." }),
    "additional-epochs": Flags.string({ description: "Number of epochs to extend the lease by." }),
    payment: Flags.string({ description: "Payment amount. Default = required for the additional epochs." }),
    "polkadot-seed": Flags.string({ description: "sr25519 signer seed / //URI (or POLKADOT_SEED)." }),
    "polkadot-address": Flags.string({ description: "Expected signer ss58 address." }),
    "ss58-format": Flags.string({ description: "ss58 address format." })
  };

  async run(): Promise<void> {
    this.parsed = true;
    const exitCode = await runSwitchboardRenewNative(this.argv);
    if (exitCode !== 0) {
      this.exit(exitCode);
    }
  }
}

export async function runSwitchboardRenewNative(
  argv: readonly string[],
  options: SwitchboardRenewOptions = {}
): Promise<number> {
  return runIngressNative(options.runner ?? defaultRunSwitchboardRenewRunner, argv, "runSwitchboardRenew");
}
