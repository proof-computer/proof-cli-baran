import { basename } from "node:path";

import "@polkadot/api-augment";
import { ApiPromise, WsProvider } from "@polkadot/api";
import type { SubmittableExtrinsic, VoidFn } from "@polkadot/api/types";
import type { KeyringPair } from "@polkadot/keyring/types";
import {
  AssignmentStrategyVariant,
  DeploymentError,
  DeploymentStatus,
  RestartPolicy,
  type AcurastProjectConfig,
  type EnvVar,
  type JobId,
  type JobRegistration
} from "@acurast/sdk/types";
import { buildMinMetricsForDeploy, setEnvVars, type KeyStore } from "@acurast/sdk/chain";
import { checkIsFolder, createManifest, NOOP_LOGGER, zipFolder, type Logger } from "@acurast/sdk/deploy";
import { uploadScript, type IpfsUploadOptions } from "@acurast/sdk/ipfs";

/**
 * Hardened Acurast deploy submission, vendored from @acurast/sdk@1.2.2
 * (`deploy/deploy-project.ts` + `chain/register-job.ts`).
 *
 * The upstream submit loop settles only on `dispatchError` or `isInBlock`;
 * a transaction evicted from the pool (`Usurped`, `Dropped`, `Invalid`,
 * `FinalityTimeout` — e.g. mortal-era expiry under congestion, or a nonce
 * consumed by a concurrent submitter) leaves the promise pending forever.
 * Observed live on 2026-06-10: a launch-demo hung silently after
 * "uploaded code" because its deploy extrinsic vanished without a trace.
 *
 * This module mirrors upstream behaviour and progress events exactly, with
 * three fixes the upstream loop lacks:
 *   1. terminal transaction statuses reject with typed `DeploymentError`s
 *      instead of hanging;
 *   2. a timeout backstop covers the cases where no status ever arrives
 *      (dead WebSocket, silent pool eviction);
 *   3. the nonce is resolved pool-aware at signing time (`nonce: -1`), and
 *      an optional cross-process submit lock serializes same-wallet deploys
 *      (see acurast-wallet-lock.ts).
 *
 * Drop this module when upstream ships equivalent handling.
 */

const BUNDLE_FOLDER = ".acurast/bundles";
const TWO_MINUTES = 2 * 60 * 1000;
/**
 * Default submit window. A mortal-era transaction expires after 64 blocks
 * (~5.5 minutes at the observed ~5s Acurast block time); 8 minutes leaves
 * margin for the eviction status to arrive before the backstop fires.
 */
export const DEFAULT_SUBMIT_TIMEOUT_MS = 8 * 60 * 1000;

interface TxStatusLike {
  isInBlock?: boolean;
  isFinalized?: boolean;
  isUsurped?: boolean;
  isDropped?: boolean;
  isInvalid?: boolean;
  isFinalityTimeout?: boolean;
}

interface SubmitEventLike {
  status: TxStatusLike;
  events: any[];
  txHash: { toHex(): string };
  dispatchError?: any;
}

export interface DeployProjectHardenedOptions {
  /** Wallet that signs the deploy extrinsic. */
  wallet: KeyringPair;
  /** WebSocket RPC endpoint for the target Acurast chain. */
  rpcEndpoint: string;
  /** IPFS pinning service configuration. */
  ipfs: IpfsUploadOptions;
  /** Environment variables to be encrypted + submitted after acknowledgement. */
  envVars?: EnvVar[];
  /** Per-stage progress callback. Receives the same events as upstream deployProject. */
  statusCallback: (status: DeploymentStatus, data?: any) => void;
  /** Persistent storage for ECDH keypairs used when encrypting env vars. */
  keyStore?: KeyStore;
  /** Optional debug logger. */
  logger?: Logger;
  /** Override for the temp-bundle directory. Defaults to `.acurast/bundles`. */
  bundleFolder?: string;
  /** Reject if the deploy extrinsic has not reached a block within this window. */
  submitTimeoutMs?: number;
  /**
   * Optional cross-process lock held from just before the nonce is resolved
   * until the deploy transaction is in a block (or terminally failed).
   */
  acquireSubmitLock?: () => Promise<() => Promise<void>>;
}

/** Progress event emitted when the post-acknowledgement env-var stage fails. */
export const ENV_VARS_FAILED_STATUS = "EnvironmentVariablesFailed";

/**
 * Vendored verbatim from upstream `registerJob` (the extrinsic construction
 * half); upstream does not export it separately.
 */
export function buildDeployExtrinsic(
  api: ApiPromise,
  job: JobRegistration,
  projectConfig?: AcurastProjectConfig
): SubmittableExtrinsic<"promise", any> {
  const script = `0x${Buffer.from(new TextEncoder().encode(job.script)).toString("hex")}`;

  const jobRegistration = api.createType("AcurastCommonJobRegistration", {
    script: api.createType("Bytes", script),
    allowedSources: job.allowedSources
      ? api.createType("Option<Vec<AccountId>>", job.allowedSources)
      : api.createType("Option<Vec<AccountId>>", undefined),
    allowOnlyVerifiedSources: job.allowOnlyVerifiedSources,
    schedule: {
      duration: api.createType("u64", job.schedule.duration),
      startTime: api.createType("u64", job.schedule.startTime),
      endTime: api.createType("u64", job.schedule.endTime),
      interval: api.createType("u64", job.schedule.interval),
      maxStartDelay: api.createType("u64", job.schedule.maxStartDelay)
    },
    memory: api.createType("u32", job.memory),
    networkRequests: api.createType("u32", job.networkRequests),
    storage: api.createType("u32", job.storage),
    requiredModules: api.createType("Vec<AcurastCommonJobModule>", job.requiredModules ?? []),
    extra: api.createType("PalletAcurastMarketplaceRegistrationExtra", {
      requirements: api.createType("PalletAcurastMarketplaceJobRequirements", {
        assignmentStrategy:
          job.extra.requirements.assignmentStrategy.variant == AssignmentStrategyVariant.Single
            ? api.createType("PalletAcurastMarketplaceAssignmentStrategy", {
                single: job.extra.requirements.assignmentStrategy.instantMatch
                  ? api.createType(
                      "Option<Vec<PalletAcurastMarketplacePlannedExecution>>",
                      job.extra.requirements.assignmentStrategy.instantMatch.map((item) => ({
                        source: api.createType("AccountId", item.source),
                        startDelay: api.createType("u64", item.startDelay.toFixed())
                      }))
                    )
                  : api.createType("Option<bool>", undefined)
              })
            : api.createType("PalletAcurastMarketplaceAssignmentStrategy", {
                competing: ""
              }),
        slots: api.createType("u8", job.extra.requirements.slots),
        reward: api.createType("u128", job.extra.requirements.reward),
        minReputation: job.extra.requirements.minReputation
          ? api.createType("Option<u128>", job.extra.requirements.minReputation)
          : api.createType("Option<u128>", undefined),
        processorVersion: job.extra.requirements.processorVersion
          ? api.createType(
              "Option<PalletAcurastMarketplaceProcessorVersionRequirements>",
              job.extra.requirements.processorVersion
            )
          : api.createType("Option<PalletAcurastMarketplaceProcessorVersionRequirements>", undefined),
        instantMatch: job.extra.requirements.instantMatch
          ? api.createType(
              "Option<Vec<PalletAcurastMarketplacePlannedExecution>>",
              job.extra.requirements.instantMatch.map((item: any) => ({
                source: api.createType("AccountId", item.source),
                startDelay: api.createType("u64", item.startDelay)
              }))
            )
          : api.createType("Option<bool>", undefined),
        runtime: api.createType("PalletAcurastMarketplaceRuntime", job.extra.requirements.runtime)
      })
    })
  });

  const mutability = api.createType("AcurastCommonScriptMutability", job.mutability);
  const reuseKeysFrom = job.reuseKeysFrom
    ? api.createType("Option<(AcurastCommonMultiOrigin, u128)>", [
        api.createType("AcurastCommonMultiOrigin", {
          acurast: job.reuseKeysFrom[1]
        }),
        api.createType("u128", job.reuseKeysFrom[2])
      ])
    : api.createType("Option<(AcurastCommonMultiOrigin, u128)>", undefined);
  const minMetrics = projectConfig
    ? buildMinMetricsForDeploy(api, projectConfig)
    : api.createType("Option<Vec<(u8, u128, u128)>>", []);

  return api.tx["acurastMarketplace"]["deploy"](jobRegistration, mutability, reuseKeysFrom, minMetrics);
}

/**
 * Upstream `registerJob` submit loop with terminal-status handling, a
 * timeout backstop, and pool-aware nonce resolution. Resolves with the tx
 * hash once the extrinsic is in a block. On success the storedJobStatus
 * subscription stays alive (it feeds Matched/Acknowledged to the env-var
 * stage and self-unsubscribes on assignment, as upstream does); on failure
 * every subscription is torn down.
 */
export function registerJobHardened(
  api: ApiPromise,
  injector: KeyringPair,
  job: JobRegistration,
  statusCallback: (status: DeploymentStatus, data?: any) => void,
  options?: { projectConfig?: AcurastProjectConfig; submitTimeoutMs?: number }
): Promise<string> {
  const tx = buildDeployExtrinsic(api, job, options?.projectConfig);
  return submitDeployExtrinsicHardened(api, tx, injector, statusCallback, options);
}

/** The hardened submit loop itself, separated from extrinsic construction for testability. */
export function submitDeployExtrinsicHardened(
  api: ApiPromise,
  tx: SubmittableExtrinsic<"promise", any>,
  injector: KeyringPair,
  statusCallback: (status: DeploymentStatus, data?: any) => void,
  options?: { submitTimeoutMs?: number }
): Promise<string> {
  const submitTimeoutMs = options?.submitTimeoutMs ?? DEFAULT_SUBMIT_TIMEOUT_MS;

  return new Promise<string>((resolve, reject) => {
    let settled = false;
    let failed = false;
    let unsubTx: VoidFn | undefined;
    let unsubJobStatus: VoidFn | undefined;
    let jobStatusSubscribed = false;

    const timer = setTimeout(() => {
      finish(
        new DeploymentError(
          `Timed out after ${Math.round(submitTimeoutMs / 1000)}s waiting for the deploy transaction to reach a block. ` +
            `The transaction may have been silently dropped (RPC outage, pool eviction, or a nonce conflict with a concurrent submitter).`,
          "SubmitTimeout"
        )
      );
    }, submitTimeoutMs);

    const finish = (error?: unknown, txHash?: string) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      unsubTx?.();
      unsubTx = undefined;
      if (error) {
        failed = true;
        unsubJobStatus?.();
        unsubJobStatus = undefined;
        reject(error);
      } else {
        resolve(txHash!);
      }
    };

    const handleEvent = async ({ status, events, txHash, dispatchError }: SubmitEventLike) => {
      const jobRegistrationEvents = events.filter((record) => {
        return record.event.section === "acurast" && record.event.method === "JobRegistrationStoredV2";
      });
      const jobIds = jobRegistrationEvents.map((record) => record.event.data[0]);

      if (jobIds.length > 0 && !jobStatusSubscribed) {
        jobStatusSubscribed = true;
        statusCallback(DeploymentStatus.WaitingForMatch, {
          jobIds: jobIds.map((jobId) => jobId.toJSON())
        });
        const unsubStored = await api.query.acurastMarketplace.storedJobStatus.multi(jobIds, (statuses) => {
          const stat = api.registry.createType("Vec<Option<PalletAcurastMarketplaceJobStatus>>", statuses as any);
          (stat as any).forEach((value: any, index: number) => {
            if (!value.isSome) return;
            const statusValue = value.unwrap();
            if (statusValue.isMatched) {
              statusCallback(DeploymentStatus.Matched, {
                jobIds: jobIds.map((id) => id.toJSON())
              });
            } else if (statusValue.isAssigned) {
              statusCallback(DeploymentStatus.Acknowledged, {
                acknowledged: statusValue.asAssigned.toNumber()
              });
              unsubStored();
            }
          });
        });
        if (failed) {
          // The submit failed while the subscription was being set up.
          unsubStored();
        } else {
          unsubJobStatus = unsubStored;
        }
      }

      if (dispatchError) {
        finish(deploymentErrorFromDispatch(api, dispatchError));
      } else if (status.isInBlock) {
        finish(undefined, txHash.toHex());
      } else if (status.isUsurped) {
        finish(
          new DeploymentError(
            "Deploy transaction was usurped: another transaction from this wallet replaced it at the same nonce. " +
              "A concurrent deploy from the same wallet is the usual cause; serialize submissions and retry.",
            "TxUsurped"
          )
        );
      } else if (status.isDropped) {
        finish(
          new DeploymentError("Deploy transaction was dropped from the transaction pool before reaching a block.", "TxDropped")
        );
      } else if (status.isInvalid) {
        finish(
          new DeploymentError(
            "Deploy transaction became invalid before inclusion — commonly mortal-era expiry under pool congestion, " +
              "or its nonce was consumed by another transaction from this wallet.",
            "TxInvalid"
          )
        );
      } else if (status.isFinalityTimeout) {
        finish(new DeploymentError("Chain finality timed out for the block containing the deploy transaction.", "TxFinalityTimeout"));
      } else if (status.isFinalized) {
        // Already resolved at isInBlock; nothing to do.
      }
      // Future/Ready/Broadcast/Retracted are non-terminal: keep waiting.
    };

    void (async () => {
      try {
        // nonce: -1 resolves the next nonce pool-aware at signing time.
        const next = await tx.signAndSend(injector, { nonce: -1 }, (event) => {
          void handleEvent(event as unknown as SubmitEventLike).catch(finish);
        });
        if (typeof next === "function") {
          if (settled) next();
          else unsubTx = next;
        }
      } catch (error) {
        finish(classifySubmissionError(error));
      }
    })();
  });
}

/**
 * Upstream `deployProject` orchestration (bundle → IPFS → registration →
 * env vars) on top of the hardened submit loop. Emits the exact upstream
 * DeploymentStatus sequence so progress rendering is unchanged.
 *
 * Mirrors upstream lifecycle deliberately: the ApiPromise connection, the
 * storedJobStatus subscription, and the env-var timer outlive this call —
 * the CLI flow keeps the process alive until the env-var stage completes.
 */
export async function deployProjectHardened(
  config: AcurastProjectConfig,
  job: JobRegistration,
  options: DeployProjectHardenedOptions
): Promise<JobRegistration> {
  const logger = options.logger ?? NOOP_LOGGER;
  const bundleFolder = options.bundleFolder ?? BUNDLE_FOLDER;

  const wsProvider = new WsProvider(options.rpcEndpoint);
  const api = await ApiPromise.create({
    provider: wsProvider,
    noInitWarn: true
  });

  let ipfsHash: string;
  if (config.fileUrl.startsWith("ipfs://")) {
    ipfsHash = config.fileUrl;
    logger.debug(`config.fileUrl is an IPFS hash, so we use this: ${ipfsHash}`);
  } else {
    const isFolder = await checkIsFolder(config.fileUrl);
    if (isFolder && !config.entrypoint) {
      throw new Error("entrypoint is required for folders");
    }
    const entrypoint = config.entrypoint ?? basename(config.fileUrl);
    const { zipPath } = await zipFolder(
      config.fileUrl,
      bundleFolder,
      createManifest(config.projectName, entrypoint, config.restartPolicy ?? RestartPolicy.OnFailure, config.image),
      config.projectName,
      logger
    );
    ipfsHash = await uploadScript({ file: zipPath }, options.ipfs);
    logger.debug(`ipfsHash: ${ipfsHash}`);
  }

  options.statusCallback(DeploymentStatus.Uploaded, { ipfsHash });
  config.fileUrl = ipfsHash;
  job.script = ipfsHash;

  options.statusCallback(DeploymentStatus.Prepared, { job });

  let envHasBeenSet = false;
  let envTimer: NodeJS.Timeout | undefined;
  let jobId: JobId | undefined;

  const handleEnvFailure = (error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    logger.error(`Setting Environment Variables: failed: ${message}`);
    options.statusCallback(ENV_VARS_FAILED_STATUS as DeploymentStatus, { error: message });
  };

  const setEnv = async () => {
    envHasBeenSet = true;
    if (envTimer) clearTimeout(envTimer);
    envTimer = undefined;
    if (!jobId) {
      throw new DeploymentError("DeploymentId not set before env-var submission", "EnvVarsNoJobId");
    }

    // The pubkey wait inside setEnvVars is bounded by abortIfPastStartMs, but
    // its inner extrinsic submission has the same unbounded-hang gap as the
    // deploy path. Bound the whole stage: past start+maxStartDelay the env
    // vars can no longer reach the processor in time anyway.
    const deadlineMs = Math.max(30_000, job.schedule.startTime + job.schedule.maxStartDelay - Date.now());
    const envs = await withDeadline(
      setEnvVars(
        { id: jobId, registration: job, envVars: options.envVars },
        {
          wallet: options.wallet,
          rpcEndpoint: options.rpcEndpoint,
          keyStore: options.keyStore,
          abortIfPastStartMs: job.schedule.startTime - 60_000,
          logger
        }
      ),
      deadlineMs,
      new DeploymentError(
        `Timed out after ${Math.round(deadlineMs / 1000)}s waiting for the environment-variable transaction to land.`,
        "EnvVarsTimeout"
      )
    );
    options.statusCallback(DeploymentStatus.EnvironmentVariablesSet, envs);
  };

  const statusCallbackWrapper = (status: DeploymentStatus, data?: any) => {
    if (status === DeploymentStatus.WaitingForMatch) {
      jobId = data.jobIds[0];
    }
    if (status === DeploymentStatus.Acknowledged && !envHasBeenSet) {
      const timeToJobStart = job.schedule.startTime - Date.now();
      if (data.acknowledged >= config.numberOfReplicas) {
        logger.debug("Setting Environment Variables: Have all acknowledgements, so we can set the env vars now.");
        void setEnv().catch(handleEnvFailure);
      } else if (timeToJobStart <= TWO_MINUTES) {
        logger.debug("Setting Environment Variables: Start is scheduled within 2 minutes, so we do it now.");
        void setEnv().catch(handleEnvFailure);
      } else if (!envTimer) {
        logger.debug(
          `Setting Environment Variables: Start is in the future, timeout will trigger in ${timeToJobStart - TWO_MINUTES}ms, 2 minutes before start time.`
        );
        envTimer = setTimeout(() => {
          void setEnv().catch(handleEnvFailure);
        }, timeToJobStart - TWO_MINUTES);
      }
    }
    options.statusCallback(status, data);
  };

  const releaseSubmitLock = options.acquireSubmitLock ? await options.acquireSubmitLock() : undefined;
  let txHash: string;
  try {
    txHash = await registerJobHardened(api, options.wallet, job, statusCallbackWrapper, {
      projectConfig: config,
      submitTimeoutMs: options.submitTimeoutMs
    });
  } finally {
    await releaseSubmitLock?.();
  }

  options.statusCallback(DeploymentStatus.Submit, { txHash });
  return job;
}

function deploymentErrorFromDispatch(api: ApiPromise, dispatchError: any): DeploymentError {
  if (dispatchError.isModule) {
    const decoded = api.registry.findMetaError(dispatchError.asModule);
    const { docs, name, section } = decoded;
    return new DeploymentError(`${docs.join(" ")}`, `${section}.${name}`, { section, name, docs });
  }
  const error = dispatchError.toHuman?.() || dispatchError.toString();
  return new DeploymentError(error, "TransactionError", { originalError: error });
}

function classifySubmissionError(error: unknown): DeploymentError {
  if (error instanceof DeploymentError) return error;
  const message = error instanceof Error ? error.message : String(error);
  // RPC pool rejections at submission time: 1014 "Priority is too low"
  // (same-nonce replacement without a fee bump) and 1010 "Invalid
  // Transaction" (stale/outdated nonce) both indicate a nonce conflict
  // with another transaction from this wallet.
  if (/priority is too low|invalid transaction|transaction is outdated|stale/i.test(message)) {
    return new DeploymentError(message, "NonceConflict", { originalError: error });
  }
  return new DeploymentError(message, "DeploymentError", { originalError: error });
}

async function withDeadline<T>(promise: Promise<T>, ms: number, timeoutError: Error): Promise<T> {
  let timer: NodeJS.Timeout | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(timeoutError), ms);
      })
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}
