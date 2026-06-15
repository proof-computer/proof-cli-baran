// PROOF Ingress parachain client.
//
// A thin @polkadot/api wrapper over the `proof-ingress` pallet for the CLI's
// parachain backend. The hashing / route-id derivation is vendored from the
// reduced-relay harness chain adapter
// (priv_repos/switchboard-substrate/harness/relay/src/chain/adapter.ts) and
// MUST stay byte-for-byte compatible with the pallet's `derive_route_id`.
// Signing + submission reuse the CLI's own polkadot helpers.

import { ApiPromise, WsProvider } from "@polkadot/api";
import type { SubmittableExtrinsic } from "@polkadot/api/types";
import { blake2AsU8a, decodeAddress } from "@polkadot/util-crypto";
import { u8aConcat, u8aToHex, hexToU8a, stringToU8a, bnToU8a } from "@polkadot/util";

export type Hex = `0x${string}`;
export type ProofIngressTx = SubmittableExtrinsic<"promise">;

export async function connectParachain(wsUrl: string): Promise<ApiPromise> {
  if (!wsUrl) {
    throw new Error("PROOF Ingress parachain WebSocket url is not configured for this target");
  }
  const api = await ApiPromise.create({
    provider: new WsProvider(wsUrl),
    noInitWarn: true,
    throwOnConnect: true
  });
  await api.isReady;
  return api;
}

// --- Hashing / route-id (vendored from the harness adapter) -----------------

/** Mirrors the pallet's `proof_ingress_domain_hash`. */
export function domainHash(domain: string, parts: Uint8Array[]): Uint8Array {
  const segments: Uint8Array[] = [stringToU8a(domain)];
  for (const part of parts) {
    segments.push(bnToU8a(part.length, { bitLength: 32, isLe: true }));
    segments.push(part);
  }
  return blake2AsU8a(u8aConcat(...segments), 256);
}

/** blake2-256 of a hostname string, as the pallet expects for `hostname_hash`. */
export function hostnameHash(hostname: string): Hex {
  return u8aToHex(blake2AsU8a(stringToU8a(hostname), 256)) as Hex;
}

/** Raw 32-byte public key for an owner given as a KeyringPair-like or ss58/hex. */
export function ownerPublicKey(owner: { publicKey: Uint8Array } | string): Uint8Array {
  if (typeof owner === "string") {
    return decodeAddress(owner);
  }
  return owner.publicKey;
}

/**
 * Pure `derive_route_id` (proof-ingress/route-id/v1) given the chain separator
 * directly — testable without a live chain.
 */
export function deriveRouteIdFromSeparator(
  separator: Uint8Array,
  owner: { publicKey: Uint8Array } | string,
  hostnameHashBytes: Uint8Array,
  routeClassId: number,
  salt: Uint8Array
): Hex {
  const classEncoded = bnToU8a(routeClassId, { bitLength: 16, isLe: true });
  return u8aToHex(
    domainHash("proof-ingress/route-id/v1", [
      separator,
      ownerPublicKey(owner),
      hostnameHashBytes,
      classEncoded,
      salt
    ])
  ) as Hex;
}

/** Mirrors the pallet's `derive_route_id`, reading the separator from chain consts. */
export function deriveRouteId(
  api: ApiPromise,
  owner: { publicKey: Uint8Array } | string,
  hostnameHashBytes: Uint8Array,
  routeClassId: number,
  salt: Uint8Array
): Hex {
  const separator = hexToU8a(api.consts.proofIngress.routeChainSeparator.toHex());
  return deriveRouteIdFromSeparator(separator, owner, hostnameHashBytes, routeClassId, salt);
}

// --- Constants --------------------------------------------------------------

export function epochDurationMillis(api: ApiPromise): bigint {
  return BigInt(api.consts.proofIngress.epochDurationMillis.toString());
}

export async function currentEpoch(api: ApiPromise): Promise<number> {
  const now = BigInt((await api.query.timestamp.now()).toString());
  return Number(now / epochDurationMillis(api));
}

// --- Storage reads ----------------------------------------------------------

export async function claimable(api: ApiPromise, account: string): Promise<bigint> {
  const value = await api.query.proofIngress.claimableBalances(account);
  return BigInt(value.toString());
}

export async function freeBalance(api: ApiPromise, account: string): Promise<bigint> {
  const info = await api.query.system.account(account);
  return BigInt((info.toJSON() as { data: { free: string | number } }).data.free.toString());
}

export async function routeRecord(api: ApiPromise, routeId: Hex): Promise<Record<string, unknown> | null> {
  const value = await api.query.proofIngress.routes(routeId);
  return value.isEmpty ? null : (value.toJSON() as Record<string, unknown>);
}

export async function routeRefund(api: ApiPromise, routeId: Hex): Promise<Record<string, unknown> | null> {
  const value = await api.query.proofIngress.routeRefunds(routeId);
  return value.isEmpty ? null : (value.toJSON() as Record<string, unknown>);
}

export async function activeGeneration(api: ApiPromise, routeId: Hex): Promise<number | null> {
  const value = await api.query.proofIngress.activeGeneration(routeId);
  return value.isEmpty ? null : Number(value.toString());
}

export async function routeClass(api: ApiPromise, routeClassId: number): Promise<Record<string, unknown> | null> {
  const value = await api.query.proofIngress.routeClasses(routeClassId);
  return value.isEmpty ? null : (value.toJSON() as Record<string, unknown>);
}

export async function brokerProfile(api: ApiPromise, brokerId: number): Promise<Record<string, unknown> | null> {
  const value = await api.query.proofIngress.brokers(brokerId);
  return value.isEmpty ? null : (value.toJSON() as Record<string, unknown>);
}

/**
 * `required_payment = max(price_per_epoch, floor_price_per_epoch) *
 * service_units * lease_epochs` — mirrors the pallet's lease/renew pricing so
 * the CLI can precompute and dry-run the payment.
 */
export function computeRequiredPayment(
  pricePerEpoch: bigint,
  floorPricePerEpoch: bigint,
  serviceUnits: bigint,
  leaseEpochs: number
): bigint {
  const unit = pricePerEpoch > floorPricePerEpoch ? pricePerEpoch : floorPricePerEpoch;
  return unit * serviceUnits * BigInt(leaseEpochs);
}

export async function requiredPayment(
  api: ApiPromise,
  brokerId: number,
  routeClassId: number,
  leaseEpochs: number
): Promise<bigint> {
  const rc = await routeClass(api, routeClassId);
  if (!rc) {
    throw new Error(`unknown route class ${routeClassId}`);
  }
  const broker = await brokerProfile(api, brokerId);
  return computeRequiredPayment(
    BigInt(String(rc.pricePerEpoch)),
    broker ? BigInt(String(broker.floorPricePerEpoch)) : 0n,
    BigInt(String(rc.serviceUnits)),
    leaseEpochs
  );
}

// --- Extrinsic builders -----------------------------------------------------

export function withdrawClaimableTx(api: ApiPromise, amount: bigint): ProofIngressTx {
  return api.tx.proofIngress.withdrawClaimable(amount);
}

export interface CreateRouteLeaseArgs {
  brokerId: number;
  routeClassId: number;
  hostnameHash: Hex;
  policyHash: Hex;
  certBindingHash: Hex;
  salt: Hex;
  leaseEpochs: number;
  payment: bigint;
}

export function createRouteLeaseTx(api: ApiPromise, args: CreateRouteLeaseArgs): ProofIngressTx {
  return api.tx.proofIngress.createRouteLease(
    args.brokerId,
    args.routeClassId,
    args.hostnameHash,
    args.policyHash,
    args.certBindingHash,
    args.salt,
    args.leaseEpochs,
    args.payment
  );
}

export function renewRouteTx(api: ApiPromise, routeId: Hex, additionalEpochs: number, payment: bigint): ProofIngressTx {
  return api.tx.proofIngress.renewRoute(routeId, additionalEpochs, payment);
}

export function retireRouteTx(api: ApiPromise, routeId: Hex): ProofIngressTx {
  return api.tx.proofIngress.retireRoute(routeId);
}

export function refundUnactivatedRouteTx(api: ApiPromise, routeId: Hex): ProofIngressTx {
  return api.tx.proofIngress.refundUnactivatedRoute(routeId);
}

export function refundRetiredRouteTx(api: ApiPromise, routeId: Hex): ProofIngressTx {
  return api.tx.proofIngress.refundRetiredRoute(routeId);
}

export interface RouteCreditLeaf {
  routeId: Hex;
  owner: string;
  brokerId: number;
  routeClassId: number;
  shard: number;
  epoch: number;
  creditAmount: bigint;
  reasonHash: Hex;
  evidenceLeafHash: Hex;
  expiryEpoch: number;
}

function leafToCodec(leaf: RouteCreditLeaf) {
  return {
    routeId: leaf.routeId,
    owner: leaf.owner,
    brokerId: leaf.brokerId,
    routeClassId: leaf.routeClassId,
    shard: leaf.shard,
    epoch: leaf.epoch,
    creditAmount: leaf.creditAmount,
    reasonHash: leaf.reasonHash,
    evidenceLeafHash: leaf.evidenceLeafHash,
    expiryEpoch: leaf.expiryEpoch
  };
}

export function claimRouteCreditTx(api: ApiPromise, leaf: RouteCreditLeaf, proof: unknown[]): ProofIngressTx {
  return api.tx.proofIngress.claimRouteCredit(
    leaf.brokerId,
    leaf.routeClassId,
    leaf.shard,
    leaf.epoch,
    leafToCodec(leaf),
    proof
  );
}
