import { mkdir, open, readFile, rm, stat } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

/**
 * Advisory cross-process lock for an Acurast signing wallet.
 *
 * Two local CLI processes signing extrinsics from the same wallet within the
 * same pool-propagation window can race the account nonce: the second
 * transaction is usurped or evicted without ever reaching a block (observed
 * 2026-06-10 when a pitchdeck deploy and launch-demo submitted ~30s apart).
 * Serializing the submit window per wallet closes that race on a single
 * machine; it deliberately does not attempt cross-machine coordination.
 *
 * The lock is a `wx`-created file holding `{ pid, createdAt }`. A lock is
 * considered stale when its owner process is dead or its age exceeds
 * `staleMs` (default 10 minutes, chosen to outlive the deploy submit
 * timeout), and is then stolen.
 */

const DEFAULT_STALE_MS = 10 * 60 * 1000;
const DEFAULT_MAX_WAIT_MS = 90 * 1000;
const DEFAULT_POLL_MS = 500;

export interface WalletLockOptions {
  /** Directory holding lock files. Defaults to ~/.switchboard/locks. */
  lockDir?: string;
  /** Age after which a lock is stolen even if its owner pid is alive. */
  staleMs?: number;
  /** Max time to wait for the lock before failing the deploy. */
  maxWaitMs?: number;
  /** Poll interval while waiting. */
  pollMs?: number;
}

export type WalletLockRelease = () => Promise<void>;

export function defaultWalletLockDir(): string {
  return path.join(os.homedir(), ".switchboard", "locks");
}

export async function acquireWalletLock(
  walletAddress: string,
  options: WalletLockOptions = {}
): Promise<WalletLockRelease> {
  const lockDir = options.lockDir ?? defaultWalletLockDir();
  const staleMs = options.staleMs ?? DEFAULT_STALE_MS;
  const maxWaitMs = options.maxWaitMs ?? DEFAULT_MAX_WAIT_MS;
  const pollMs = options.pollMs ?? DEFAULT_POLL_MS;
  const lockPath = path.join(lockDir, `acurast-wallet-${sanitizeForFilename(walletAddress)}.lock`);

  await mkdir(lockDir, { recursive: true });
  const deadline = Date.now() + maxWaitMs;

  for (;;) {
    try {
      const handle = await open(lockPath, "wx");
      try {
        await handle.writeFile(JSON.stringify({ pid: process.pid, createdAt: new Date().toISOString() }));
      } finally {
        await handle.close();
      }
      let released = false;
      return async () => {
        if (released) return;
        released = true;
        await rm(lockPath, { force: true });
      };
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
    }

    if (await walletLockIsStale(lockPath, staleMs)) {
      // Steal the stale lock and retry the wx-create; if another waiter
      // steals concurrently, exactly one wins the recreate.
      await rm(lockPath, { force: true });
      continue;
    }

    if (Date.now() >= deadline) {
      throw new Error(
        `Timed out after ${Math.round(maxWaitMs / 1000)}s waiting for the Acurast wallet lock at ${lockPath}. ` +
          `Another deploy from this wallet appears to be in flight; retry once it completes ` +
          `(the job schedule window may need recomputing).`
      );
    }
    await sleep(pollMs);
  }
}

async function walletLockIsStale(lockPath: string, staleMs: number): Promise<boolean> {
  try {
    const info = await stat(lockPath);
    if (Date.now() - info.mtimeMs > staleMs) return true;
  } catch {
    // Disappeared between EEXIST and stat: not stale, just retry.
    return false;
  }
  try {
    const owner = JSON.parse(await readFile(lockPath, "utf8")) as { pid?: number };
    if (typeof owner.pid === "number" && !processIsAlive(owner.pid)) return true;
  } catch {
    // Unreadable/partial lock content: rely on the age check alone.
  }
  return false;
}

function processIsAlive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return (error as NodeJS.ErrnoException).code === "EPERM";
  }
}

function sanitizeForFilename(value: string): string {
  return value.replace(/[^A-Za-z0-9_-]/g, "_");
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
