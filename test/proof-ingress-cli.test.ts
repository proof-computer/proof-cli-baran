import assert from "node:assert/strict";
import { test } from "node:test";

import { runSwitchboardClaim, runSwitchboardRefund } from "../src/switchboard-core/cli/src/index.js";

// proof-ingress-testnet is a parachain target with an unconfigured WS url, so
// the parachain client throws "...not configured" before connecting. Reaching
// that error proves the command routed to the parachain backend (the Hub path
// would instead build an ethers provider).
test("claim routes to the parachain backend for a parachain target", async () => {
  await assert.rejects(
    runSwitchboardClaim(["--target", "proof-ingress-testnet", "--account", "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY", "--json"]),
    /not configured/u
  );
});

test("refund routes to the parachain backend for a parachain target", async () => {
  await assert.rejects(
    runSwitchboardRefund([
      "--target",
      "proof-ingress-testnet",
      "--route-id",
      `0x${"11".repeat(32)}`,
      "--json"
    ]),
    /not configured/u
  );
});
