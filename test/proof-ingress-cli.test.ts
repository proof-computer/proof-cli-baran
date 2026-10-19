import assert from "node:assert/strict";
import { once } from "node:events";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { createServer, type Server } from "node:http";
import { tmpdir } from "node:os";
import path from "node:path";
import { after, before, test } from "node:test";
import { Wallet } from "ethers";

import {
  runSwitchboardClaim,
  runSwitchboardLease,
  runSwitchboardRefund,
  runSwitchboardRenew,
  runSwitchboardRetire,
  runSwitchboardRoute
} from "../src/switchboard-core/cli/src/index.js";
import { signNetworkManifest } from "../src/switchboard-core/src/network-manifest.js";

const ROUTE_ID = `0x${"11".repeat(32)}`;
// Throwaway fixture key, never a deployed signer or a key from the environment.
const MANIFEST_KEY = `0x${"42".repeat(32)}`;
const MANIFEST_SIGNER = new Wallet(MANIFEST_KEY).address;
const previousHome = process.env.SWITCHBOARD_HOME;
let testHome: string;
let server: Server | undefined;
let manifestUrl: string;
let manifestFetches = 0;

before(async () => {
  testHome = mkdtempSync(path.join(tmpdir(), "proof-ingress-cli-"));
  process.env.SWITCHBOARD_HOME = testHome;
  const manifest = await signNetworkManifest({
    version: 1,
    sequence: 1,
    issuedAt: "2026-01-01T00:00:00.000Z",
    expiresAt: "2999-01-01T00:00:00.000Z",
    chain: { name: "proof-ingress-testnet", chainId: "1" },
    registries: { active: [], deprecated: [], retired: [] }
  }, MANIFEST_KEY);
  server = createServer((request, response) => {
    if (request.url !== "/v1/network-manifest") {
      response.writeHead(404).end();
      return;
    }
    manifestFetches += 1;
    response.setHeader("content-type", "application/json");
    response.end(JSON.stringify(manifest));
  });
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  assert.ok(address !== null && typeof address !== "string");
  manifestUrl = `http://127.0.0.1:${address.port}/v1/network-manifest`;
});

after(async () => {
  try {
    const fixtureServer = server;
    if (fixtureServer?.listening) {
      await new Promise<void>((resolve, reject) => {
        fixtureServer.close((error) => error ? reject(error) : resolve());
      });
    }
  } finally {
    if (previousHome === undefined) {
      delete process.env.SWITCHBOARD_HOME;
    } else {
      process.env.SWITCHBOARD_HOME = previousHome;
    }
    if (testHome !== undefined) rmSync(testHome, { recursive: true, force: true });
  }
});

async function assertRoutingError(
  command: (args: string[]) => Promise<unknown>,
  args: string[],
  expected: RegExp
): Promise<void> {
  const fetchesBefore = manifestFetches;
  await assert.rejects(command([
    ...args,
    "--manifest-url", manifestUrl,
    "--manifest-signer", MANIFEST_SIGNER
  ]), expected);
  assert.ok(manifestFetches > fetchesBefore, "command must fetch the local signed manifest");
}

// proof-ingress-testnet is a parachain target with an unconfigured WS url, so
// the parachain client throws "...not configured" before connecting. Reaching
// that error proves the command routed to the parachain backend (the Hub path
// would instead build an ethers provider).
test("claim routes to the parachain backend for a parachain target", async () => {
  await assertRoutingError(
    runSwitchboardClaim, ["--target", "proof-ingress-testnet", "--account", "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY", "--json"],
    /not configured/u
  );
});

test("refund routes to the parachain backend for a parachain target", async () => {
  await assertRoutingError(
    runSwitchboardRefund, ["--target", "proof-ingress-testnet", "--route-id", ROUTE_ID, "--json"],
    /not configured/u
  );
});

test("lease routes to the parachain backend for a parachain target", async () => {
  await assertRoutingError(
    runSwitchboardLease, ["--target", "proof-ingress-testnet", "--json"],
    /not configured/u
  );
});

test("renew routes to the parachain backend for a parachain target", async () => {
  await assertRoutingError(
    runSwitchboardRenew, ["--target", "proof-ingress-testnet", "--route-id", ROUTE_ID, "--json"],
    /not configured/u
  );
});

test("retire routes to the parachain backend for a parachain target", async () => {
  await assertRoutingError(
    runSwitchboardRetire, ["--target", "proof-ingress-testnet", "--route-id", ROUTE_ID, "--json"],
    /not configured/u
  );
});

test("lease/renew/retire reject a Hub target", async () => {
  await assertRoutingError(runSwitchboardLease, ["--target", "revive-local", "--json"], /parachain command/u);
  await assertRoutingError(runSwitchboardRenew, ["--target", "revive-local", "--json"], /parachain command/u);
  await assertRoutingError(runSwitchboardRetire, ["--target", "revive-local", "--json"], /parachain command/u);
});

test("route status routes to the parachain backend", async () => {
  await assertRoutingError(
    runSwitchboardRoute, ["--target", "proof-ingress-testnet", "--route-id", ROUTE_ID, "--json"],
    /not configured/u
  );
});

test("route status rejects a Hub target", async () => {
  await assertRoutingError(runSwitchboardRoute, ["--target", "revive-local", "--json"], /parachain command/u);
});

test("claim --mode route-credit reads the proof file and routes to the parachain backend", async () => {
  const proofFile = path.join(testHome, "proof.json");
  writeFileSync(
    proofFile,
    JSON.stringify({
      leaf: {
        routeId: ROUTE_ID,
        owner: "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY",
        brokerId: 0,
        routeClassId: 42,
        shard: 0,
        epoch: 1,
        creditAmount: "1000000000",
        reasonHash: `0x${"00".repeat(32)}`,
        evidenceLeafHash: `0x${"00".repeat(32)}`,
        expiryEpoch: 100
      },
      proof: []
    })
  );
  await assertRoutingError(
    runSwitchboardClaim, ["--target", "proof-ingress-testnet", "--mode", "route-credit", "--proof-file", proofFile, "--json"],
    /not configured/u
  );
});
