// PROOF Ingress parachain command bodies.
//
// The Hub-era `claim`/`refund` commands and the new `lease`/`renew`/`retire`/
// `route` commands branch here when the resolved target is a parachain
// (`isParachainTarget`). This module is intentionally decoupled from the
// monolithic `index.ts` (no imports back into it) to avoid an import cycle;
// flag/output helpers are small and local.

import type { ApiPromise } from "@polkadot/api";
import { hexToU8a } from "@polkadot/util";

import type { SwitchboardTargetConfig } from "../../src/chains.js";
import { accountFromUri, signAndSend } from "../../src/polkadot.js";
import {
  activeGeneration,
  claimable,
  claimRouteCreditTx,
  connectParachain,
  createRouteLeaseTx,
  deriveRouteId,
  hostnameHash,
  refundRetiredRouteTx,
  refundUnactivatedRouteTx,
  renewRouteTx,
  requiredPayment,
  retireRouteTx,
  routeRecord,
  routeRefund,
  withdrawClaimableTx,
  type Hex,
  type RouteCreditLeaf
} from "../../src/proof-ingress/client.js";
import { promises as fs } from "node:fs";

type Flags = Map<string, string | boolean>;
type CommandOptions = { readOnly?: boolean };
type ManifestLike = { substrateWsUrl?: string };

const ZERO_32: Hex = `0x${"00".repeat(32)}`;

// --- local flag / output helpers --------------------------------------------

function strFlag(flags: Flags, name: string): string | undefined {
  const value = flags.get(name);
  return typeof value === "string" ? value : undefined;
}

function boolFlag(flags: Flags, name: string): boolean {
  return flags.get(name) === true;
}

function numFlag(flags: Flags, name: string): number | undefined {
  const value = strFlag(flags, name);
  if (value === undefined) return undefined;
  const parsed = Number(value);
  if (!Number.isInteger(parsed)) {
    throw new Error(`--${name} must be an integer, got "${value}"`);
  }
  return parsed;
}

function requireNum(flags: Flags, name: string): number {
  const value = numFlag(flags, name);
  if (value === undefined) {
    throw new Error(`--${name} is required`);
  }
  return value;
}

function requireStr(flags: Flags, name: string): string {
  const value = strFlag(flags, name);
  if (value === undefined) {
    throw new Error(`--${name} is required`);
  }
  return value;
}

function envVar(name: string): string | undefined {
  const value = process.env[name];
  return value && value.length > 0 ? value : undefined;
}

function shouldSubmit(flags: Flags, options: CommandOptions): boolean {
  return !options.readOnly && (boolFlag(flags, "yes") || envVar("SWITCHBOARD_ASSUME_YES") === "true");
}

function emit(flags: Flags, value: Record<string, unknown>): void {
  if (boolFlag(flags, "json")) {
    console.log(JSON.stringify(value, null, 2));
    return;
  }
  const lines: string[] = [];
  for (const [key, raw] of Object.entries(value)) {
    if (raw === undefined || raw === null) continue;
    if (typeof raw === "object" && raw !== null && "formatted" in (raw as Record<string, unknown>)) {
      lines.push(`${key}: ${(raw as { formatted: unknown }).formatted}`);
    } else if (typeof raw === "object") {
      lines.push(`${key}: ${JSON.stringify(raw)}`);
    } else {
      lines.push(`${key}: ${String(raw)}`);
    }
  }
  console.log(lines.join("\n"));
}

// --- amount formatting/parsing ----------------------------------------------

function formatNative(raw: bigint, target: SwitchboardTargetConfig): string {
  const decimals = target.nativeDecimals ?? 12;
  const base = 10n ** BigInt(decimals);
  const whole = raw / base;
  const frac = raw % base;
  const fracStr = frac.toString().padStart(decimals, "0").replace(/0+$/u, "");
  const amount = fracStr.length > 0 ? `${whole}.${fracStr}` : `${whole}`;
  return `${amount} ${target.nativeSymbol ?? "UNIT"}`;
}

function nativeAmount(raw: bigint, target: SwitchboardTargetConfig): { raw: string; formatted: string } {
  return { raw: raw.toString(), formatted: formatNative(raw, target) };
}

function parseAmount(value: string, decimals: number): bigint {
  const trimmed = value.trim();
  if (trimmed.startsWith("0x")) {
    return BigInt(trimmed);
  }
  if (!trimmed.includes(".")) {
    return BigInt(trimmed);
  }
  const [whole, frac = ""] = trimmed.split(".");
  const fracPadded = (frac + "0".repeat(decimals)).slice(0, decimals);
  return BigInt(whole || "0") * 10n ** BigInt(decimals) + BigInt(fracPadded || "0");
}

// --- connection / signer ----------------------------------------------------

function parachainWsUrl(flags: Flags, target: SwitchboardTargetConfig): string {
  // Parachain ws comes from explicit flags or the target only — never the Hub
  // manifest's substrate url, which points at Asset Hub.
  return (
    strFlag(flags, "parachain-ws-url") ??
    strFlag(flags, "substrate-ws-url") ??
    target.defaultParachainWsUrl ??
    ""
  );
}

function ss58Format(flags: Flags, target: SwitchboardTargetConfig): number {
  return numFlag(flags, "ss58-format") ?? target.ss58Format ?? 42;
}

async function resolveParachainSigner(flags: Flags, target: SwitchboardTargetConfig) {
  const seed = strFlag(flags, "polkadot-seed") ?? envVar("POLKADOT_SEED");
  if (!seed) {
    throw new Error("Missing --polkadot-seed (or POLKADOT_SEED) for a signed parachain action.");
  }
  const account = await accountFromUri(seed, ss58Format(flags, target));
  const expected = strFlag(flags, "polkadot-address");
  if (expected && account.address !== expected) {
    throw new Error(`Derived address ${account.address} does not match --polkadot-address ${expected}.`);
  }
  return account;
}

async function openParachain(flags: Flags, target: SwitchboardTargetConfig): Promise<ApiPromise> {
  return connectParachain(parachainWsUrl(flags, target));
}

async function resolveRouteId(api: ApiPromise, flags: Flags, target: SwitchboardTargetConfig): Promise<Hex> {
  const explicit = strFlag(flags, "route-id");
  if (explicit) {
    return explicit as Hex;
  }
  const hostname = requireStr(flags, "hostname");
  const routeClassId = requireNum(flags, "route-class-id");
  const salt = (strFlag(flags, "salt") ?? ZERO_32) as Hex;
  const ownerAddress = strFlag(flags, "owner");
  const owner = ownerAddress ?? (await resolveParachainSigner(flags, target)).address;
  return deriveRouteId(api, owner, hexToU8a(hostnameHash(hostname)), routeClassId, hexToU8a(salt));
}

// --- commands ---------------------------------------------------------------

export async function claimCommandParachain(
  flags: Flags,
  options: CommandOptions,
  target: SwitchboardTargetConfig,
  manifestConfig: ManifestLike
): Promise<void> {
  if (strFlag(flags, "mode") === "route-credit") {
    return claimRouteCreditParachain(flags, options, target, manifestConfig);
  }
  const submit = shouldSubmit(flags, options);
  const wsUrl = parachainWsUrl(flags, target);
  const api = await openParachain(flags, target);
  try {
    const hasSeed = Boolean(strFlag(flags, "polkadot-seed") ?? envVar("POLKADOT_SEED"));
    const account = options.readOnly && !hasSeed ? undefined : await resolveParachainSigner(flags, target);
    const address = account?.address ?? strFlag(flags, "account") ?? strFlag(flags, "recipient");
    if (!address) {
      throw new Error("Provide a signer (--polkadot-seed) or --account to read claimable balance.");
    }
    const balance = await claimable(api, address);
    const amountFlag = strFlag(flags, "amount");
    const amount = amountFlag ? parseAmount(amountFlag, target.nativeDecimals ?? 12) : balance;

    const base: Record<string, unknown> = {
      ok: true,
      backend: "parachain",
      action: options.readOnly ? "claimable" : "claim",
      mode: "withdraw",
      dryRun: !submit,
      target: target.name,
      parachainWsUrl: wsUrl,
      account: address,
      claimable: nativeAmount(balance, target),
      amount: nativeAmount(amount, target)
    };

    if (options.readOnly || !submit || balance === 0n) {
      emit(flags, base);
      return;
    }
    if (!account) {
      throw new Error("Missing signer for claim submission.");
    }
    if (amount > balance) {
      throw new Error(`Requested amount ${formatNative(amount, target)} exceeds claimable ${formatNative(balance, target)}.`);
    }
    const receipt = await signAndSend(api, withdrawClaimableTx(api, amount), account);
    const after = await claimable(api, address);
    emit(flags, { ...base, dryRun: false, tx: receipt, claimableAfter: nativeAmount(after, target) });
  } finally {
    await api.disconnect();
  }
}

async function claimRouteCreditParachain(
  flags: Flags,
  options: CommandOptions,
  target: SwitchboardTargetConfig,
  manifestConfig: ManifestLike
): Promise<void> {
  const submit = shouldSubmit(flags, options);
  const proofPath = requireStr(flags, "proof-file");
  const parsed = JSON.parse(await fs.readFile(proofPath, "utf8")) as {
    leaf: RouteCreditLeaf & { creditAmount: string | number };
    proof: unknown[];
  };
  const leaf: RouteCreditLeaf = { ...parsed.leaf, creditAmount: BigInt(String(parsed.leaf.creditAmount)) };
  const api = await openParachain(flags, target);
  try {
    const base: Record<string, unknown> = {
      ok: true,
      backend: "parachain",
      action: "claim",
      mode: "route-credit",
      dryRun: !submit,
      target: target.name,
      routeId: leaf.routeId,
      epoch: leaf.epoch,
      creditAmount: nativeAmount(leaf.creditAmount, target)
    };
    if (!submit) {
      emit(flags, base);
      return;
    }
    const account = await resolveParachainSigner(flags, target);
    const receipt = await signAndSend(api, claimRouteCreditTx(api, leaf, parsed.proof), account);
    emit(flags, { ...base, dryRun: false, tx: receipt });
  } finally {
    await api.disconnect();
  }
}

export async function refundCommandParachain(
  flags: Flags,
  options: CommandOptions,
  target: SwitchboardTargetConfig,
  manifestConfig: ManifestLike
): Promise<void> {
  const submit = shouldSubmit(flags, options);
  const api = await openParachain(flags, target);
  try {
    const routeId = await resolveRouteId(api, flags, target);
    const record = await routeRecord(api, routeId);
    if (!record) {
      throw new Error(`Route ${routeId} not found.`);
    }
    const alreadyRefunded = (await routeRefund(api, routeId)) !== null;
    const hasActiveGeneration = (await activeGeneration(api, routeId)) !== null;
    const status = String(record.status);
    const requested = strFlag(flags, "mode");
    const { eligible, kind, reason } = refundEligibility(status, alreadyRefunded, hasActiveGeneration, requested);

    const base: Record<string, unknown> = {
      ok: true,
      backend: "parachain",
      action: options.readOnly ? "refundable" : "refund",
      dryRun: !submit,
      target: target.name,
      routeId,
      status,
      alreadyRefunded,
      eligible,
      refundKind: kind,
      reason
    };

    if (options.readOnly || !submit || !eligible || !kind) {
      emit(flags, base);
      return;
    }
    const account = await resolveParachainSigner(flags, target);
    const tx = kind === "retired" ? refundRetiredRouteTx(api, routeId) : refundUnactivatedRouteTx(api, routeId);
    const receipt = await signAndSend(api, tx, account);
    emit(flags, { ...base, dryRun: false, tx: receipt, refunded: (await routeRefund(api, routeId)) !== null });
  } finally {
    await api.disconnect();
  }
}

function refundEligibility(
  status: string,
  alreadyRefunded: boolean,
  hasActiveGeneration: boolean,
  requested: string | undefined
): { eligible: boolean; kind: "unactivated" | "retired" | null; reason: string } {
  if (alreadyRefunded) {
    return { eligible: false, kind: null, reason: "route was already refunded" };
  }
  const canUnactivated = !hasActiveGeneration && (status === "Created" || status === "Retired");
  const canRetired = status === "Retired" && hasActiveGeneration;
  if (requested === "unactivated") {
    return canUnactivated
      ? { eligible: true, kind: "unactivated", reason: "unactivated refund" }
      : { eligible: false, kind: null, reason: "not eligible for an unactivated refund" };
  }
  if (requested === "retired") {
    return canRetired
      ? { eligible: true, kind: "retired", reason: "retired refund" }
      : { eligible: false, kind: null, reason: "not eligible for a retired refund" };
  }
  if (canUnactivated) {
    return { eligible: true, kind: "unactivated", reason: "auto: unactivated route" };
  }
  if (canRetired) {
    return { eligible: true, kind: "retired", reason: "auto: retired route with an active generation" };
  }
  return { eligible: false, kind: null, reason: `route status ${status} is not refundable` };
}

export async function leaseCommandParachain(
  flags: Flags,
  options: CommandOptions,
  target: SwitchboardTargetConfig,
  manifestConfig: ManifestLike
): Promise<void> {
  const submit = shouldSubmit(flags, options);
  const api = await openParachain(flags, target);
  try {
    const account = await resolveParachainSigner(flags, target);
    const brokerId = requireNum(flags, "broker-id");
    const routeClassId = requireNum(flags, "route-class-id");
    const hostname = requireStr(flags, "hostname");
    const leaseEpochs = requireNum(flags, "lease-epochs");
    const salt = (strFlag(flags, "salt") ?? ZERO_32) as Hex;
    const policyHash = (strFlag(flags, "policy-hash") ?? ZERO_32) as Hex;
    const certBindingHash = (strFlag(flags, "cert-binding-hash") ?? ZERO_32) as Hex;
    const hnHash = hostnameHash(hostname);
    const required = await requiredPayment(api, brokerId, routeClassId, leaseEpochs);
    const paymentFlag = strFlag(flags, "payment");
    const payment = paymentFlag ? parseAmount(paymentFlag, target.nativeDecimals ?? 12) : required;
    const routeId = deriveRouteId(api, account, hexToU8a(hnHash), routeClassId, hexToU8a(salt));

    const base: Record<string, unknown> = {
      ok: true,
      backend: "parachain",
      action: "lease",
      dryRun: !submit,
      target: target.name,
      routeId,
      owner: account.address,
      brokerId,
      routeClassId,
      hostname,
      hostnameHash: hnHash,
      salt,
      leaseEpochs,
      payment: { ...nativeAmount(payment, target), required: nativeAmount(required, target) }
    };

    if (!submit) {
      emit(flags, base);
      return;
    }
    const receipt = await signAndSend(
      api,
      createRouteLeaseTx(api, { brokerId, routeClassId, hostnameHash: hnHash, policyHash, certBindingHash, salt, leaseEpochs, payment }),
      account
    );
    const after = await routeRecord(api, routeId);
    emit(flags, { ...base, dryRun: false, tx: receipt, routeCreated: after !== null });
  } finally {
    await api.disconnect();
  }
}

export async function renewCommandParachain(
  flags: Flags,
  options: CommandOptions,
  target: SwitchboardTargetConfig,
  manifestConfig: ManifestLike
): Promise<void> {
  const submit = shouldSubmit(flags, options);
  const api = await openParachain(flags, target);
  try {
    const routeId = await resolveRouteId(api, flags, target);
    const additionalEpochs = requireNum(flags, "additional-epochs");
    const record = await routeRecord(api, routeId);
    if (!record) {
      throw new Error(`Route ${routeId} not found.`);
    }
    const brokerId = Number(record.brokerId);
    const routeClassId = Number(record.routeClassId);
    const required = await requiredPayment(api, brokerId, routeClassId, additionalEpochs);
    const paymentFlag = strFlag(flags, "payment");
    const payment = paymentFlag ? parseAmount(paymentFlag, target.nativeDecimals ?? 12) : required;

    const base: Record<string, unknown> = {
      ok: true,
      backend: "parachain",
      action: "renew",
      dryRun: !submit,
      target: target.name,
      routeId,
      additionalEpochs,
      oldPaidUntilEpoch: Number(record.paidUntilEpoch),
      payment: { ...nativeAmount(payment, target), required: nativeAmount(required, target) }
    };

    if (!submit) {
      emit(flags, base);
      return;
    }
    const account = await resolveParachainSigner(flags, target);
    const receipt = await signAndSend(api, renewRouteTx(api, routeId, additionalEpochs, payment), account);
    const after = await routeRecord(api, routeId);
    emit(flags, { ...base, dryRun: false, tx: receipt, newPaidUntilEpoch: after ? Number(after.paidUntilEpoch) : undefined });
  } finally {
    await api.disconnect();
  }
}

export async function retireCommandParachain(
  flags: Flags,
  options: CommandOptions,
  target: SwitchboardTargetConfig,
  manifestConfig: ManifestLike
): Promise<void> {
  const submit = shouldSubmit(flags, options);
  const api = await openParachain(flags, target);
  try {
    const routeId = await resolveRouteId(api, flags, target);
    const record = await routeRecord(api, routeId);
    if (!record) {
      throw new Error(`Route ${routeId} not found.`);
    }
    const base: Record<string, unknown> = {
      ok: true,
      backend: "parachain",
      action: "retire",
      dryRun: !submit,
      target: target.name,
      routeId,
      statusBefore: String(record.status)
    };
    if (!submit) {
      emit(flags, base);
      return;
    }
    const account = await resolveParachainSigner(flags, target);
    const receipt = await signAndSend(api, retireRouteTx(api, routeId), account);
    const after = await routeRecord(api, routeId);
    emit(flags, { ...base, dryRun: false, tx: receipt, statusAfter: after ? String(after.status) : undefined });
  } finally {
    await api.disconnect();
  }
}

export async function routeStatusCommandParachain(
  flags: Flags,
  _options: CommandOptions,
  target: SwitchboardTargetConfig,
  manifestConfig: ManifestLike
): Promise<void> {
  const api = await openParachain(flags, target);
  try {
    const routeId = await resolveRouteId(api, flags, target);
    const record = await routeRecord(api, routeId);
    const refunded = (await routeRefund(api, routeId)) !== null;
    const generation = await activeGeneration(api, routeId);
    const epochNow = await currentEpochSafe(api);

    const output: Record<string, unknown> = {
      ok: true,
      backend: "parachain",
      action: "route-status",
      target: target.name,
      routeId,
      exists: record !== null,
      refunded,
      activeGeneration: generation,
      currentEpoch: epochNow,
      record: record
        ? {
            owner: record.owner,
            brokerId: Number(record.brokerId),
            routeClassId: Number(record.routeClassId),
            shard: Number(record.shard),
            createdEpoch: Number(record.createdEpoch),
            paidUntilEpoch: Number(record.paidUntilEpoch),
            status: String(record.status),
            retiredAtEpoch: record.retiredAtEpoch ?? null,
            escrowed: nativeAmount(BigInt(String(record.escrowed ?? 0)), target)
          }
        : null
    };
    emit(flags, output);
  } finally {
    await api.disconnect();
  }
}

async function currentEpochSafe(api: ApiPromise): Promise<number | null> {
  try {
    const now = BigInt((await api.query.timestamp.now()).toString());
    const duration = BigInt(api.consts.proofIngress.epochDurationMillis.toString());
    return duration > 0n ? Number(now / duration) : null;
  } catch {
    return null;
  }
}
