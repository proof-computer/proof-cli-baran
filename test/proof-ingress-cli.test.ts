import assert from "node:assert/strict";
import { test } from "node:test";

import {
  runSwitchboardClaim,
  runSwitchboardLease,
  runSwitchboardRefund,
  runSwitchboardRenew,
  runSwitchboardRetire
} from "../src/switchboard-core/cli/src/index.js";

const ROUTE_ID = `0x${"11".repeat(32)}`;

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
    runSwitchboardRefund(["--target", "proof-ingress-testnet", "--route-id", ROUTE_ID, "--json"]),
    /not configured/u
  );
});

test("lease routes to the parachain backend for a parachain target", async () => {
  await assert.rejects(
    runSwitchboardLease(["--target", "proof-ingress-testnet", "--json"]),
    /not configured/u
  );
});

test("renew routes to the parachain backend for a parachain target", async () => {
  await assert.rejects(
    runSwitchboardRenew(["--target", "proof-ingress-testnet", "--route-id", ROUTE_ID, "--json"]),
    /not configured/u
  );
});

test("retire routes to the parachain backend for a parachain target", async () => {
  await assert.rejects(
    runSwitchboardRetire(["--target", "proof-ingress-testnet", "--route-id", ROUTE_ID, "--json"]),
    /not configured/u
  );
});

test("lease/renew/retire reject a Hub target", async () => {
  await assert.rejects(runSwitchboardLease(["--target", "revive-local", "--json"]), /parachain command/u);
  await assert.rejects(runSwitchboardRenew(["--target", "revive-local", "--json"]), /parachain command/u);
  await assert.rejects(runSwitchboardRetire(["--target", "revive-local", "--json"]), /parachain command/u);
});
