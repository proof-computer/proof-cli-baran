import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { hexToU8a } from "@polkadot/util";

import {
  computeRequiredPayment,
  deriveRouteIdFromSeparator,
  hostnameHash
} from "../src/switchboard-core/src/proof-ingress/client.js";

// Fixture vector from priv_repos/switchboard-broker-rs/fixtures/route-id-v0.json
// (source: the harness deriveRouteId, which mirrors the pallet derive_route_id).
const FIXTURE = {
  ownerPublicKey: "0x9247498270200ad70bc38c37712bc7efbd3dc72d5fdb25c8f7175281ce01ec5b",
  chainSeparator: "0xca95a92bb1553858bb9c4e0724f0031aa87c0186c490e5e931c7e67e1bec565e",
  hostname: "happy.lab.proof.computer",
  hostnameHash: "0xd9e5885dfff20bd658b5a9a51e8cbe9340aac1a42fe1ef1f07126cab9944cb11",
  routeClassId: 42,
  salt: "0x0101010101010101010101010101010101010101010101010101010101010101",
  expectedRouteId: "0x8fa812e22ad0fa5811efe11c62002be6ae4a5098e0d90006d75877587daaf7be"
};

describe("proof-ingress client", () => {
  it("hostnameHash matches the pallet hostname hash", () => {
    assert.equal(hostnameHash(FIXTURE.hostname), FIXTURE.hostnameHash);
  });

  it("deriveRouteId matches the pallet/harness fixture vector", () => {
    const routeId = deriveRouteIdFromSeparator(
      hexToU8a(FIXTURE.chainSeparator),
      { publicKey: hexToU8a(FIXTURE.ownerPublicKey) },
      hexToU8a(FIXTURE.hostnameHash),
      FIXTURE.routeClassId,
      hexToU8a(FIXTURE.salt)
    );
    assert.equal(routeId, FIXTURE.expectedRouteId);
  });

  it("computeRequiredPayment uses max(price, floor) * units * epochs", () => {
    assert.equal(computeRequiredPayment(1_000_000_000n, 0n, 3n, 4), 12_000_000_000n);
    assert.equal(computeRequiredPayment(1_000_000_000n, 2_000_000_000n, 3n, 4), 24_000_000_000n);
  });
});
