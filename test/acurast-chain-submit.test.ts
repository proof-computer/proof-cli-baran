import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtemp, readdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

import { submitDeployExtrinsicHardened } from "../src/switchboard-core/cli/src/acurast-chain-submit.js";
import { acquireWalletLock } from "../src/switchboard-core/cli/src/acurast-wallet-lock.js";

type SubmitCallback = (event: {
  status: Record<string, boolean>;
  events: unknown[];
  txHash: { toHex(): string };
  dispatchError?: unknown;
}) => void;

function fakeSubmitHarness(options?: { throwOnSubmit?: Error }) {
  let callback: SubmitCallback | undefined;
  let unsubscribed = 0;
  const tx = {
    signAndSend: async (_injector: unknown, signOptions: { nonce?: number }, cb: SubmitCallback) => {
      assert.equal(signOptions.nonce, -1, "submit must use pool-aware nonce resolution");
      if (options?.throwOnSubmit) throw options.throwOnSubmit;
      callback = cb;
      return () => {
        unsubscribed += 1;
      };
    }
  };
  const api = {
    query: { acurastMarketplace: { storedJobStatus: { multi: async () => () => undefined } } },
    registry: {
      createType: () => [],
      findMetaError: () => ({ docs: ["doc"], name: "Name", section: "section" })
    }
  };
  return {
    tx,
    api,
    emit: (status: Record<string, boolean>, extra?: { dispatchError?: unknown }) => {
      assert.ok(callback, "signAndSend callback not captured yet");
      callback!({ status, events: [], txHash: { toHex: () => "0xabc" }, ...extra });
    },
    unsubscribeCount: () => unsubscribed
  };
}

function submitWith(harness: ReturnType<typeof fakeSubmitHarness>, submitTimeoutMs = 5_000) {
  return submitDeployExtrinsicHardened(
    harness.api as never,
    harness.tx as never,
    {} as never,
    () => undefined,
    { submitTimeoutMs }
  );
}

async function tick() {
  await new Promise((resolve) => setImmediate(resolve));
}

test("hardened submit resolves with the tx hash at isInBlock", async () => {
  const harness = fakeSubmitHarness();
  const pending = submitWith(harness);
  await tick();
  harness.emit({ isInBlock: true });
  assert.equal(await pending, "0xabc");
  await tick();
  assert.equal(harness.unsubscribeCount(), 1);
});

for (const [statusFlag, expectedCode] of [
  ["isUsurped", "TxUsurped"],
  ["isDropped", "TxDropped"],
  ["isInvalid", "TxInvalid"],
  ["isFinalityTimeout", "TxFinalityTimeout"]
] as const) {
  test(`hardened submit rejects with ${expectedCode} on ${statusFlag} instead of hanging`, async () => {
    const harness = fakeSubmitHarness();
    const pending = submitWith(harness);
    await tick();
    harness.emit({ [statusFlag]: true });
    await assert.rejects(pending, (error: Error & { code?: string }) => {
      assert.equal(error.code, expectedCode);
      return true;
    });
    await tick();
    assert.equal(harness.unsubscribeCount(), 1, "tx watch must be torn down on terminal failure");
  });
}

test("hardened submit ignores non-terminal statuses and keeps waiting", async () => {
  const harness = fakeSubmitHarness();
  const pending = submitWith(harness);
  await tick();
  harness.emit({ isReady: true });
  harness.emit({ isBroadcast: true });
  harness.emit({ isRetracted: true });
  harness.emit({ isInBlock: true });
  assert.equal(await pending, "0xabc");
});

test("hardened submit rejects with SubmitTimeout when no status ever arrives", async () => {
  const harness = fakeSubmitHarness();
  const pending = submitWith(harness, 50);
  await assert.rejects(pending, (error: Error & { code?: string }) => {
    assert.equal(error.code, "SubmitTimeout");
    return true;
  });
});

test("hardened submit classifies pool nonce rejections at submission time", async () => {
  const harness = fakeSubmitHarness({
    throwOnSubmit: new Error("1014: Priority is too low: (1000 vs 1000)")
  });
  await assert.rejects(submitWith(harness), (error: Error & { code?: string }) => {
    assert.equal(error.code, "NonceConflict");
    return true;
  });
});

test("hardened submit rejects dispatch errors as before", async () => {
  const harness = fakeSubmitHarness();
  const pending = submitWith(harness);
  await tick();
  harness.emit(
    { isInBlock: true },
    { dispatchError: { isModule: false, toHuman: () => "Bad dispatch", toString: () => "Bad dispatch" } }
  );
  await assert.rejects(pending, (error: Error & { code?: string }) => {
    assert.equal(error.code, "TransactionError");
    return true;
  });
});

test("wallet lock serializes acquisition and releases cleanly", async () => {
  const lockDir = await mkdtemp(path.join(tmpdir(), "wallet-lock-test-"));
  const release = await acquireWalletLock("5TestWallet", { lockDir, maxWaitMs: 200, pollMs: 20 });

  await assert.rejects(
    acquireWalletLock("5TestWallet", { lockDir, maxWaitMs: 150, pollMs: 20 }),
    /Timed out .* waiting for the Acurast wallet lock/
  );

  // A different wallet is not blocked.
  const releaseOther = await acquireWalletLock("5OtherWallet", { lockDir, maxWaitMs: 150, pollMs: 20 });
  await releaseOther();

  await release();
  const releaseAgain = await acquireWalletLock("5TestWallet", { lockDir, maxWaitMs: 150, pollMs: 20 });
  await releaseAgain();
  assert.deepEqual(
    (await readdir(lockDir)).filter((name) => name.includes("5TestWallet")),
    [],
    "released locks must not leave files behind"
  );
});

test("wallet lock waiter proceeds once the holder releases", async () => {
  const lockDir = await mkdtemp(path.join(tmpdir(), "wallet-lock-test-"));
  const release = await acquireWalletLock("5TestWallet", { lockDir, maxWaitMs: 200, pollMs: 20 });
  const waiter = acquireWalletLock("5TestWallet", { lockDir, maxWaitMs: 2_000, pollMs: 20 });
  setTimeout(() => void release(), 60);
  const releaseSecond = await waiter;
  await releaseSecond();
});

test("wallet lock steals locks owned by dead processes", async () => {
  const lockDir = await mkdtemp(path.join(tmpdir(), "wallet-lock-test-"));
  const deadPid = spawnSync("true").pid!;
  const lockPath = path.join(lockDir, "acurast-wallet-5TestWallet.lock");
  await writeFile(lockPath, JSON.stringify({ pid: deadPid, createdAt: new Date().toISOString() }));

  const release = await acquireWalletLock("5TestWallet", { lockDir, maxWaitMs: 500, pollMs: 20 });
  await release();
});
