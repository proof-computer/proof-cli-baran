import assert from "node:assert/strict";
import test from "node:test";

import {
  runSwitchboardClaim,
  runSwitchboardClaimable,
  runSwitchboardLease,
  runSwitchboardRefund,
  runSwitchboardRefundable,
  runSwitchboardRenew,
  runSwitchboardRetire,
  runSwitchboardRoute
} from "../src/switchboard-core/cli/src/index.js";

// Live end-to-end shakeout against a fast-epochs PROOF Ingress node, skipped
// unless PROOF_INGRESS_LIVE is set. Prerequisites: a node reachable at the
// proof-ingress-local target (ws://127.0.0.1:9944) with route class 42 and
// broker 0 already set up and //Lab//Customer funded — e.g. after running the
// broker-rs `happy_lifecycle` drill against that node.
const LIVE = Boolean(process.env.PROOF_INGRESS_LIVE);
const COMMON = ["--target", "proof-ingress-local"];
const SEED = ["--polkadot-seed", "//Lab//Customer"];

async function capture(fn: () => Promise<void>): Promise<any> {
  const original = console.log;
  let buf = "";
  console.log = (...args: unknown[]) => {
    buf += args.map((a) => (typeof a === "string" ? a : JSON.stringify(a))).join(" ") + "\n";
  };
  try {
    await fn();
  } finally {
    console.log = original;
  }
  return JSON.parse(buf.trim());
}

test("parachain customer lifecycle + claim land on chain", { skip: !LIVE }, async () => {
  // lease -> route -> renew -> retire
  const leaseA = await capture(() =>
    runSwitchboardLease([...COMMON, "--broker-id", "0", "--route-class-id", "42", "--hostname", "cli-a.lab.test", "--lease-epochs", "6", ...SEED, "--yes", "--json"])
  );
  assert.equal(leaseA.action, "lease");
  assert.equal(leaseA.dryRun, false);
  const routeIdA = leaseA.routeId as string;
  assert.match(routeIdA, /^0x[0-9a-f]{64}$/u);

  const statusA = await capture(() => runSwitchboardRoute([...COMMON, "--route-id", routeIdA, "--json"]));
  assert.equal(statusA.exists, true);
  assert.equal(statusA.record.status, "Created");

  const renewA = await capture(() => runSwitchboardRenew([...COMMON, "--route-id", routeIdA, "--additional-epochs", "3", ...SEED, "--yes", "--json"]));
  assert.ok(Number(renewA.newPaidUntilEpoch) > Number(renewA.oldPaidUntilEpoch));

  const retireA = await capture(() => runSwitchboardRetire([...COMMON, "--route-id", routeIdA, ...SEED, "--yes", "--json"]));
  assert.equal(retireA.statusAfter, "Retired");

  // lease -> refundable -> refund -> claimable -> claim (write path)
  const leaseB = await capture(() =>
    runSwitchboardLease([...COMMON, "--broker-id", "0", "--route-class-id", "42", "--hostname", "cli-b.lab.test", "--lease-epochs", "6", ...SEED, "--yes", "--json"])
  );
  const routeIdB = leaseB.routeId as string;

  const refundable = await capture(() => runSwitchboardRefundable([...COMMON, "--route-id", routeIdB, "--json"]));
  assert.equal(refundable.eligible, true);
  assert.equal(refundable.refundKind, "unactivated");

  const refund = await capture(() => runSwitchboardRefund([...COMMON, "--route-id", routeIdB, ...SEED, "--yes", "--json"]));
  assert.equal(refund.refunded, true);

  const claimable = await capture(() => runSwitchboardClaimable([...COMMON, ...SEED, "--json"]));
  assert.ok(BigInt(claimable.claimable.raw) > 0n);

  const claim = await capture(() => runSwitchboardClaim([...COMMON, ...SEED, "--yes", "--json"]));
  assert.equal(BigInt(claim.claimableAfter.raw), 0n);
});
