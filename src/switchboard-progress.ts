export type SwitchboardProgressStatus = "info" | "ok" | "wait" | "warn" | "error";

export interface SwitchboardProgressEvent {
  type: string;
  status?: SwitchboardProgressStatus;
  label?: string;
  detail?: string;
  workflowId?: string;
  relayUrl?: string;
  processor?: string;
  processors?: string[];
  intentId?: string;
  groupId?: string;
  replicas?: number;
  minReady?: number;
  path?: string;
  step?: string;
  event?: string;
  details?: Record<string, unknown>;
  schedule?: Record<string, unknown>;
  sdkStatus?: string;
  data?: unknown;
}

export interface SwitchboardRunnerOptions {
  progress?: (event: SwitchboardProgressEvent) => void;
}

export interface SwitchboardProgressReporter {
  progress(event: SwitchboardProgressEvent): void;
  complete(): void;
  failed(error: unknown): void;
}

interface ProgressLine {
  status: SwitchboardProgressStatus;
  label: string;
  detail?: string;
}

export function createSwitchboardDeployProgressReporter(input: {
  action: "deploy" | "launch-demo";
  argv: readonly string[];
  env?: NodeJS.ProcessEnv;
}): SwitchboardProgressReporter | undefined {
  if (hasFlag(input.argv, "--json") || hasFlag(input.argv, "--dry-run")) {
    return undefined;
  }

  const state = {
    completed: false,
    lastWaitAt: new Map<string, number>()
  };
  const env = input.env ?? process.env;
  const waitIntervalMs = positiveInteger(
    env.SWITCHBOARD_DEPLOY_WAIT_LOG_INTERVAL_MS,
    60_000
  );

  console.log("");
  console.log("Deployment progress");
  console.log("Switchboard runner");
  printInitialContext(input.action, input.argv, env);

  return {
    progress(event) {
      const line = progressEventLine(event);
      if (!line) return;
      if (line.status === "wait") {
        const key = `${line.label}:${line.detail ?? ""}`;
        const now = Date.now();
        const last = state.lastWaitAt.get(key) ?? 0;
        if (last !== 0 && now - last < waitIntervalMs) return;
        state.lastWaitAt.set(key, now);
      }
      if (event.type === "workflow" && event.event === "final_report") {
        state.completed = true;
      }
      logProgressLine(line);
    },
    complete() {
      if (!state.completed) {
        state.completed = true;
        logProgressLine({ status: "ok", label: "Deployment workflow complete" });
      }
    },
    failed(error) {
      const message = error instanceof Error ? error.message : String(error);
      logProgressLine({ status: "error", label: "Deployment workflow failed", detail: message });
    }
  };
}

function printInitialContext(
  action: "deploy" | "launch-demo",
  argv: readonly string[],
  env: NodeJS.ProcessEnv
): void {
  const relayUrl =
    argValue(argv, "--relay-url") ??
    env.SWITCHBOARD_RELAY_URL ??
    env.PROOF_CONTROL_PLANE_URL ??
    env.RELAY_URL;
  const context = [
    `action=${action}`,
    relayUrl ? `relay=${relayUrl}` : undefined
  ].filter(Boolean).join(" ");
  logProgressLine({ status: "info", label: "Run context", detail: context || undefined });

  if (action === "launch-demo" && hasFlag(argv, "--ha")) {
    const replicas = argValue(argv, "--processor-count") ?? "3";
    const minReady = argValue(argv, "--min-ready") ?? replicas;
    logProgressLine({ status: "info", label: "Selected processors", detail: `ha requested replicas=${replicas} min-ready=${minReady}` });
    logProgressLine({ status: "info", label: "Deployment intent group", detail: "pending relay allocation" });
    return;
  }

  const processor = argValue(argv, "--processor");
  if (processor) {
    logProgressLine({ status: "info", label: "Selected processor", detail: compactId(processor) });
  } else {
    logProgressLine({ status: "wait", label: "Selected processor", detail: "waiting for capacity selection" });
  }
  logProgressLine({ status: "info", label: "Deployment intent", detail: "pending relay allocation" });
}

function progressEventLine(event: SwitchboardProgressEvent): ProgressLine | undefined {
  if (event.type === "line" && event.label) {
    return {
      status: event.status ?? "info",
      label: event.label,
      detail: event.detail
    };
  }

  if (event.type === "run-context") {
    const detail = [
      event.workflowId ? `workflow=${event.workflowId}` : undefined,
      event.relayUrl ? `relay=${event.relayUrl}` : undefined
    ].filter(Boolean).join(" ");
    return { status: "info", label: "Run context", detail: detail || undefined };
  }

  if (event.type === "selected-processor") {
    return { status: "info", label: "Selected processor", detail: event.processor ? compactId(event.processor) : event.detail };
  }

  if (event.type === "selected-processors") {
    const processors = event.processors?.map((processor) => compactId(processor)).join(", ");
    const readiness = event.replicas ? `replicas=${event.replicas}${event.minReady ? ` min-ready=${event.minReady}` : ""}` : undefined;
    return {
      status: "info",
      label: "Selected processors",
      detail: [processors, readiness].filter(Boolean).join(" ") || event.detail
    };
  }

  if (event.type === "deployment-intent") {
    return { status: "info", label: "Deployment intent", detail: event.intentId ?? event.detail };
  }

  if (event.type === "deployment-intent-group") {
    const detail = [
      event.groupId,
      event.replicas ? `replicas=${event.replicas}` : undefined,
      event.minReady ? `min-ready=${event.minReady}` : undefined
    ].filter(Boolean).join(" ");
    return { status: "info", label: "Deployment intent group", detail: detail || event.detail };
  }

  if (event.type === "acurast-sdk") {
    return acurastSdkProgressLine(event.sdkStatus ?? event.event ?? event.status ?? "status", event.data);
  }

  if (event.type === "workflow") {
    return workflowProgressLine(event.event, event.details);
  }

  if (event.type === "wait") {
    return waitProgressLine(event.step ?? event.event, event.detail);
  }

  if (event.type === "report") {
    return { status: "ok", label: "Wrote deployment report", detail: event.path ?? event.detail };
  }

  return undefined;
}

function acurastSdkProgressLine(status: string, data: unknown): ProgressLine {
  const record = recordValue(data);
  switch (status) {
    case "Uploaded":
      return { status: "ok", label: "Acurast SDK uploaded code", detail: stringRecordField(record, "ipfsHash") };
    case "Prepared": {
      const job = recordValue(record.job);
      const requirements = recordValue(recordValue(job.extra).requirements);
      const slots = numberRecordField(requirements, "slots");
      const schedule = deployScheduleSummary(recordValue(record.schedule), recordValue(job.schedule));
      const parts = [
        slots ? `replicas=${slots}` : undefined,
        schedule?.startIso ? `start=${schedule.startIso}` : undefined,
        schedule?.latestStartIso ? `max-start=${schedule.latestStartIso}` : undefined
      ];
      return { status: "info", label: "Acurast SDK prepared job", detail: parts.filter(Boolean).join(" ") || undefined };
    }
    case "WaitingForMatch": {
      const ids = Array.isArray(record.jobIds) ? record.jobIds : [];
      const deployments = ids
        .map((id) => Array.isArray(id) && id.length > 1 ? String(id[1]) : undefined)
        .filter((id): id is string => Boolean(id));
      return { status: "wait", label: "Acurast SDK waiting for match", detail: deployments.length > 0 ? `deployment=${deployments.join(",")}` : undefined };
    }
    case "Matched":
      return { status: "ok", label: "Acurast SDK matched processors" };
    case "Acknowledged":
      return { status: "ok", label: "Acurast SDK acknowledged processors", detail: record.acknowledged !== undefined ? `acknowledged=${String(record.acknowledged)}` : undefined };
    case "EnvironmentVariablesSet":
      return { status: "ok", label: "Acurast SDK set environment", detail: stringRecordField(record, "hash") ? `tx=${stringRecordField(record, "hash")}` : undefined };
    case "Submit":
      return { status: "ok", label: "Acurast SDK submitted extrinsic", detail: stringRecordField(record, "txHash") ? `tx=${stringRecordField(record, "txHash")}` : undefined };
    default:
      return { status: "info", label: `Acurast SDK ${status}` };
  }
}

function workflowProgressLine(event: string | undefined, details: Record<string, unknown> | undefined): ProgressLine | undefined {
  const record = recordValue(details);
  switch (event) {
    case "deploy_action_submitted":
    case "group_deploy_submitted":
      return {
        status: "ok",
        label: "Submitted to Acurast",
        detail: [
          stringRecordField(record, "deploymentId") ? `deployment=${stringRecordField(record, "deploymentId")}` : undefined,
          stringRecordField(record, "adapter") ? `adapter=${stringRecordField(record, "adapter")}` : undefined
        ].filter(Boolean).join(" ") || undefined
      };
    case "runtime_claimed":
      return { status: "ok", label: "Job claimed runtime", detail: stringRecordField(record, "runtimeSigner") ? `signer=${compactId(stringRecordField(record, "runtimeSigner"))}` : undefined };
    case "group_runtime_claimed":
      return { status: "ok", label: "Runtime claims reached min-ready", detail: memberCountDetail(record, "claimedMembers") };
    case "quote_ready":
    case "group_quote_ready":
      return { status: "ok", label: "Quote ready", detail: quoteProgressDetail(record) };
    case "funding_action_required":
    case "group_member_funding_action_required":
      return { status: "wait", label: "Funding needed", detail: "workflow is blocked on a Hub funding receipt" };
    case "funding_submitted":
    case "group_funding_submitted":
    case "group_member_funding_submitted":
    case "group_member_funding_action_submitted":
      return { status: "ok", label: "Funded Hub session", detail: fundingProgressDetail(record) };
    case "dns_propagated":
    case "group_dns_propagated":
      return { status: "ok", label: "DNS propagated", detail: dnsProgressDetail(record) };
    case "route_active":
    case "group_route_active":
      return { status: "ok", label: "Activated route", detail: routeProgressDetail(record) };
    case "registration_observed":
    case "group_registration_observed":
      return { status: "ok", label: "Registered on Hub", detail: registrationProgressDetail(record) };
    case "validation_observed":
    case "group_validation_observed":
      return { status: "ok", label: "Validation observed", detail: validationProgressDetail(record) };
    case "final_report":
      return { status: "ok", label: "Deployment workflow complete" };
    case "workflow_failed":
      return { status: "error", label: "Deployment workflow failed", detail: stringRecordField(record, "error") };
    default:
      return undefined;
  }
}

function waitProgressLine(step: string | undefined, detail: string | undefined): ProgressLine | undefined {
  switch (step) {
    case "deploy_submitted":
      return { status: "wait", label: "Runtime claim", detail: detail ?? "waiting for job runtime to claim the deployment intent" };
    case "runtime_claimed":
      return { status: "wait", label: "Quote", detail: detail ?? "waiting for ingress quote" };
    case "quote_ready":
      return { status: "wait", label: "Funding", detail: detail ?? "waiting for Hub funding" };
    case "funding_submitted":
      return { status: "wait", label: "Funding and DNS", detail: detail ?? "waiting for funding readback and canonical DNS" };
    case "dns_propagated":
      return { status: "wait", label: "Route", detail: detail ?? "waiting for gateway route activation" };
    case "route_active":
      return { status: "wait", label: "Registration", detail: detail ?? "waiting for Hub registration readback" };
    case "registration_observed":
      return { status: "wait", label: "Validation", detail: detail ?? "waiting for validation report" };
    default:
      return undefined;
  }
}

function logProgressLine(line: ProgressLine): void {
  console.log(`  [${line.status}] ${line.detail ? `${line.label}: ${line.detail}` : line.label}`);
}

function memberCountDetail(details: Record<string, unknown>, field: string): string | undefined {
  const count = numberRecordField(details, field);
  const minReady = numberRecordField(details, "minReady");
  return count !== undefined && minReady !== undefined ? `${count}/${minReady}` : undefined;
}

function quoteProgressDetail(details: Record<string, unknown>): string | undefined {
  const sessionId = stringRecordField(details, "sessionId");
  const hostname = stringRecordField(details, "endpointHostname");
  const count = numberRecordField(details, "quotedMembers");
  const minReady = numberRecordField(details, "minReady");
  if (count !== undefined && minReady !== undefined) return `${count}/${minReady}`;
  return [sessionId ? `session=${compactId(sessionId)}` : undefined, hostname ? `host=${hostname}` : undefined].filter(Boolean).join(" ") || undefined;
}

function fundingProgressDetail(details: Record<string, unknown>): string | undefined {
  return stringRecordField(details, "txHash")
    ? `tx=${stringRecordField(details, "txHash")}`
    : memberCountDetail(details, "fundedMembers");
}

function dnsProgressDetail(details: Record<string, unknown>): string | undefined {
  return stringRecordField(details, "hostname")
    ? `host=${stringRecordField(details, "hostname")}`
    : memberCountDetail(details, "readyMembers") ?? stringRecordField(details, "status");
}

function routeProgressDetail(details: Record<string, unknown>): string | undefined {
  return stringRecordField(details, "hostname")
    ? `host=${stringRecordField(details, "hostname")}`
    : memberCountDetail(details, "activeMembers") ?? stringRecordField(details, "status");
}

function registrationProgressDetail(details: Record<string, unknown>): string | undefined {
  return stringRecordField(details, "sessionId")
    ? `session=${compactId(stringRecordField(details, "sessionId"))}`
    : memberCountDetail(details, "registeredMembers") ?? stringRecordField(details, "status");
}

function validationProgressDetail(details: Record<string, unknown>): string | undefined {
  return memberCountDetail(details, "validatedMembers") ?? (Array.isArray(details.reports) ? `reports=${details.reports.length}` : undefined);
}

function deployScheduleSummary(
  explicitSchedule: Record<string, unknown>,
  jobSchedule: Record<string, unknown>
): { startIso?: string; endIso?: string; latestStartIso?: string } | undefined {
  const schedule = Object.keys(explicitSchedule).length > 0 ? explicitSchedule : jobSchedule;
  if (Object.keys(schedule).length === 0) return undefined;
  const startUnixSeconds = unixSecondsField(schedule, "startUnixSeconds");
  const endUnixSeconds = unixSecondsField(schedule, "endUnixSeconds");
  const startMs =
    normalizeScheduleTimestampMs(schedule.startTime) ??
    normalizeScheduleTimestampMs(schedule.startIso) ??
    (startUnixSeconds !== undefined ? startUnixSeconds * 1000 : undefined);
  const endMs =
    normalizeScheduleTimestampMs(schedule.endTime) ??
    normalizeScheduleTimestampMs(schedule.endIso) ??
    (endUnixSeconds !== undefined ? endUnixSeconds * 1000 : undefined);
  const maxStartDelayMs = normalizeDurationMs(schedule.maxStartDelay);
  const latestStartMs = startMs !== undefined && maxStartDelayMs !== undefined
    ? startMs + maxStartDelayMs
    : undefined;
  return {
    startIso: stringRecordField(schedule, "startIso") ?? (startMs !== undefined ? new Date(startMs).toISOString() : undefined),
    endIso: stringRecordField(schedule, "endIso") ?? (endMs !== undefined ? new Date(endMs).toISOString() : undefined),
    latestStartIso: stringRecordField(schedule, "latestStartIso") ?? (latestStartMs !== undefined ? new Date(latestStartMs).toISOString() : undefined)
  };
}

function normalizeScheduleTimestampMs(value: unknown): number | undefined {
  if (typeof value === "string" && !/^[0-9]+$/.test(value)) {
    const parsed = Date.parse(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  const numeric = typeof value === "number" ? value : typeof value === "string" ? Number(value) : undefined;
  if (!numeric || !Number.isFinite(numeric)) return undefined;
  return numeric > 1_000_000_000_000 ? numeric : numeric * 1000;
}

function normalizeDurationMs(value: unknown): number | undefined {
  const numeric = typeof value === "number" ? value : typeof value === "string" && /^[0-9]+$/.test(value) ? Number(value) : undefined;
  if (numeric === undefined || !Number.isFinite(numeric)) return undefined;
  return numeric;
}

function unixSecondsField(record: Record<string, unknown>, field: string): number | undefined {
  const value = record[field];
  const numeric = typeof value === "number" ? value : typeof value === "string" && /^[0-9]+$/.test(value) ? Number(value) : undefined;
  return numeric !== undefined && Number.isSafeInteger(numeric) && numeric > 0 ? numeric : undefined;
}

function argValue(argv: readonly string[], flag: string): string | undefined {
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === flag) {
      const next = argv[index + 1];
      return next && !next.startsWith("--") ? next : undefined;
    }
    if (value.startsWith(`${flag}=`)) {
      return value.slice(flag.length + 1);
    }
  }
  return undefined;
}

function hasFlag(argv: readonly string[], flag: string): boolean {
  return argv.some((value) => value === flag || value.startsWith(`${flag}=`));
}

function recordValue(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function stringRecordField(record: Record<string, unknown>, field: string): string | undefined {
  const value = record[field];
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function numberRecordField(record: Record<string, unknown>, field: string): number | undefined {
  const value = record[field];
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function positiveInteger(value: string | undefined, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function compactId(value: string | undefined): string | undefined {
  if (!value) return undefined;
  return value.length > 16 ? `${value.slice(0, 8)}...${value.slice(-6)}` : value;
}
