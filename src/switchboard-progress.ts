import { dim, sectionTitle, statusMarker } from "./switchboard-core/cli/src/output.js";

export type SwitchboardProgressStatus = "info" | "ok" | "wait" | "warn" | "error";
export type SwitchboardProgressSection =
  | "Switchboard Runner"
  | "Demo project"
  | "Switchboard demo"
  | "Switchboard deploy"
  | "Acurast deployer"
  | "Report";

export interface SwitchboardProgressEvent {
  type: string;
  section?: SwitchboardProgressSection;
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
  section?: SwitchboardProgressSection;
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
    currentSection: "Switchboard Runner" as SwitchboardProgressSection,
    lastWaitAt: new Map<string, number>(),
    preparedJobLines: new Set<string>(),
    acurastEnvironmentSet: false,
    acurastSchedule: undefined as Record<string, unknown> | undefined,
    pendingJobStartWait: undefined as SwitchboardProgressEvent | undefined
  };
  const env = input.env ?? process.env;
  const waitIntervalMs = positiveInteger(
    env.SWITCHBOARD_DEPLOY_WAIT_LOG_INTERVAL_MS,
    30_000
  );

  console.log("");
  console.log(sectionTitle("Deployment progress"));
  console.log(sectionTitle("Switchboard Runner"));
  printInitialContext(input.action, input.argv, env);

  return {
    progress(event) {
      if (event.type === "section" && event.section) {
        state.currentSection = event.section;
        return;
      }
      updateProgressState(event, state);
      if (isJobStartWait(event) && !state.acurastEnvironmentSet) {
        state.pendingJobStartWait = event;
        return;
      }
      logProgressEvent(event, state, waitIntervalMs);
      if (isAcurastEnvironmentSet(event) && state.pendingJobStartWait) {
        const pending = state.pendingJobStartWait;
        state.pendingJobStartWait = undefined;
        logProgressEvent(pending, state, waitIntervalMs);
      }
    },
    complete() {
      if (!state.completed) {
        state.completed = true;
        logProgressLine({ status: "ok", label: "Deployment workflow complete", section: "Switchboard Runner" }, state);
      }
    },
    failed(error) {
      const message = error instanceof Error ? error.message : String(error);
      logProgressLine({ status: "error", label: "Deployment workflow failed", detail: message, section: "Switchboard Runner" }, state);
    }
  };
}

function updateProgressState(
  event: SwitchboardProgressEvent,
  state: {
    acurastEnvironmentSet: boolean;
    acurastSchedule?: Record<string, unknown>;
  }
): void {
  if (isAcurastEnvironmentSet(event)) {
    state.acurastEnvironmentSet = true;
  }
  if (event.type === "acurast-sdk" && event.sdkStatus === "Prepared") {
    const schedule = acurastSdkSchedule(event.data);
    if (schedule) state.acurastSchedule = schedule;
  }
}

function logProgressEvent(
  event: SwitchboardProgressEvent,
  state: {
    completed: boolean;
    currentSection: SwitchboardProgressSection;
    lastWaitAt: Map<string, number>;
    preparedJobLines: Set<string>;
    acurastSchedule?: Record<string, unknown>;
  },
  waitIntervalMs: number
): void {
  const line = progressEventLine(withProgressState(event, state));
  if (!line) return;
  if (line.label === "Acurast SDK prepared job") {
    const key = `${line.label}:${line.detail ?? ""}`;
    if (state.preparedJobLines.has(key)) return;
    state.preparedJobLines.add(key);
  }
  if (line.status === "wait") {
    const key = waitThrottleKey(line);
    const now = Date.now();
    const last = state.lastWaitAt.get(key) ?? 0;
    if (last !== 0 && now - last < waitIntervalMs) return;
    state.lastWaitAt.set(key, now);
  }
  if (event.type === "workflow" && event.event === "final_report") {
    state.completed = true;
  }
  logProgressLine(line, state);
}

function withProgressState(
  event: SwitchboardProgressEvent,
  state: { acurastSchedule?: Record<string, unknown> }
): SwitchboardProgressEvent {
  if (!isJobStartWait(event) || event.schedule || !state.acurastSchedule) {
    return event;
  }
  return { ...event, schedule: state.acurastSchedule };
}

function isJobStartWait(event: SwitchboardProgressEvent): boolean {
  return event.type === "wait" && (event.step ?? event.event) === "deploy_submitted";
}

function isAcurastEnvironmentSet(event: SwitchboardProgressEvent): boolean {
  return event.type === "acurast-sdk" && event.sdkStatus === "EnvironmentVariablesSet";
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
  logProgressLine({ status: "info", label: "Run context", detail: context || undefined, section: "Switchboard Runner" });
}

function progressEventLine(event: SwitchboardProgressEvent): ProgressLine | undefined {
  if (event.type === "line" && event.label) {
    return {
      status: event.status ?? "info",
      label: event.label,
      detail: event.detail,
      section: event.section
    };
  }

  if (event.type === "run-context") {
    const detail = [
      event.workflowId ? `workflow=${event.workflowId}` : undefined,
      event.relayUrl ? `relay=${event.relayUrl}` : undefined
    ].filter(Boolean).join(" ");
    return { status: "info", label: "Run context", detail: detail || undefined, section: event.section ?? "Switchboard Runner" };
  }

  if (event.type === "selected-processor") {
    const detail = event.processor ? compactId(event.processor) : event.detail;
    if (!detail) return undefined;
    return { status: "ok", label: "Selected processor", detail, section: event.section ?? "Switchboard Runner" };
  }

  if (event.type === "selected-processors") {
    const processors = event.processors?.map((processor) => compactId(processor)).join(", ");
    const readiness = event.replicas ? `replicas=${event.replicas}${event.minReady ? ` min-ready=${event.minReady}` : ""}` : undefined;
    const detail = [processors, readiness].filter(Boolean).join(" ") || event.detail;
    if (!detail) return undefined;
    return {
      status: "ok",
      label: "Selected processors",
      detail,
      section: event.section ?? "Switchboard Runner"
    };
  }

  if (event.type === "deployment-intent") {
    const detail = event.intentId ?? event.detail;
    if (!detail) return undefined;
    return { status: "ok", label: "Deployment intent", detail, section: event.section ?? "Switchboard Runner" };
  }

  if (event.type === "deployment-intent-group") {
    const detail = [
      event.groupId,
      event.replicas ? `replicas=${event.replicas}` : undefined,
      event.minReady ? `min-ready=${event.minReady}` : undefined
    ].filter(Boolean).join(" ");
    const resolved = detail || event.detail;
    if (!resolved) return undefined;
    return { status: "ok", label: "Deployment intent group", detail: resolved, section: event.section ?? "Switchboard Runner" };
  }

  if (event.type === "acurast-sdk") {
    return withDefaultSection(
      acurastSdkProgressLine(event.sdkStatus ?? event.event ?? event.status ?? "status", event.data),
      event.section ?? "Acurast deployer"
    );
  }

  if (event.type === "workflow") {
    return workflowProgressLine(event.event, event.details, event.section);
  }

  if (event.type === "wait") {
    return waitProgressLine(event.step ?? event.event, event.detail, event.section, event.schedule);
  }

  if (event.type === "report") {
    return { status: "ok", label: "Wrote deployment report", detail: event.path ?? event.detail, section: event.section ?? "Report" };
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

function acurastSdkSchedule(data: unknown): Record<string, unknown> | undefined {
  const record = recordValue(data);
  const schedule = recordValue(record.schedule);
  if (Object.keys(schedule).length > 0) return schedule;
  const jobSchedule = recordValue(recordValue(record.job).schedule);
  return Object.keys(jobSchedule).length > 0 ? jobSchedule : undefined;
}

function workflowProgressLine(
  event: string | undefined,
  details: Record<string, unknown> | undefined,
  section?: SwitchboardProgressSection
): ProgressLine | undefined {
  const record = recordValue(details);
  switch (event) {
    case "capacity_selected": {
      const processors = arrayRecordField(record, "processors")
        .map((processor) => stringRecordField(recordValue(processor), "processor") ?? stringRecordField(recordValue(processor), "processorId"))
        .filter((processor): processor is string => Boolean(processor));
      const processor = stringRecordField(record, "processor") ?? stringRecordField(record, "processorId");
      if (processors.length > 1) {
        return {
          status: "ok",
          label: "Selected processors",
          detail: processors.map((value) => compactId(value)).join(", "),
          section: section ?? "Switchboard Runner"
        };
      }
      if (!processor) return undefined;
      return { status: "ok", label: "Selected processor", detail: compactId(processor), section: section ?? "Switchboard Runner" };
    }
    case "intent_created":
      return stringRecordField(record, "intentId")
        ? { status: "ok", label: "Deployment intent", detail: stringRecordField(record, "intentId"), section: section ?? "Switchboard Runner" }
        : undefined;
    case "intent_group_created":
      return stringRecordField(record, "groupId")
        ? {
            status: "ok",
            label: "Deployment intent group",
            detail: [
              stringRecordField(record, "groupId"),
              numberRecordField(record, "expectedReplicas") ? `replicas=${numberRecordField(record, "expectedReplicas")}` : undefined,
              numberRecordField(record, "minReady") ? `min-ready=${numberRecordField(record, "minReady")}` : undefined
            ].filter(Boolean).join(" "),
            section: section ?? "Switchboard Runner"
          }
        : undefined;
    case "deploy_action_submitted":
    case "group_deploy_submitted":
      return {
        status: "ok",
        label: "Submitted to Acurast",
        detail: [
          stringRecordField(record, "deploymentId") ? `deployment=${stringRecordField(record, "deploymentId")}` : undefined,
          stringRecordField(record, "adapter") ? `adapter=${stringRecordField(record, "adapter")}` : undefined
        ].filter(Boolean).join(" ") || undefined,
        section: section ?? "Acurast deployer"
      };
    case "runtime_claimed":
      return { status: "ok", label: "Job claimed runtime", detail: stringRecordField(record, "runtimeSigner") ? `signer=${compactId(stringRecordField(record, "runtimeSigner"))}` : undefined, section: section ?? "Switchboard Runner" };
    case "group_runtime_claimed":
      return { status: "ok", label: "Runtime claims reached min-ready", detail: memberCountDetail(record, "claimedMembers"), section: section ?? "Switchboard Runner" };
    case "quote_ready":
    case "group_quote_ready":
      return { status: "ok", label: "Quote ready", detail: quoteProgressDetail(record), section: section ?? "Switchboard Runner" };
    case "funding_action_required":
    case "group_member_funding_action_required":
      return { status: "wait", label: "Funding needed", detail: "workflow is blocked on a Hub funding receipt", section: section ?? "Switchboard Runner" };
    case "funding_submitted":
    case "group_funding_submitted":
    case "group_member_funding_submitted":
    case "group_member_funding_action_submitted":
      return { status: "ok", label: "Funded Hub session", detail: fundingProgressDetail(record), section: section ?? "Switchboard Runner" };
    case "dns_propagated":
    case "group_dns_propagated":
      return { status: "ok", label: "DNS propagated", detail: dnsProgressDetail(record), section: section ?? "Switchboard Runner" };
    case "admission_requested":
    case "gateway_upstream_admission_requested":
      return { status: "wait", label: "Gateway admission requested", detail: stringRecordField(record, "requestDigest") ? `request=${compactId(stringRecordField(record, "requestDigest"))}` : undefined, section: section ?? "Switchboard Runner" };
    case "gateway_probe_pending":
      return { status: "wait", label: "Gateway probe pending", detail: stringRecordField(record, "gatewayId"), section: section ?? "Switchboard Runner" };
    case "gateway_upstream_admitted":
      return { status: "ok", label: "Gateway upstream admitted", detail: stringRecordField(record, "admissionId") ? `admission=${compactId(stringRecordField(record, "admissionId"))}` : undefined, section: section ?? "Switchboard Runner" };
    case "route_active":
    case "group_route_active":
      return { status: "ok", label: "Activated route", detail: routeProgressDetail(record), section: section ?? "Switchboard Runner" };
    case "route_not_ready":
      return {
        status: "wait",
        label: "Waiting for route readiness",
        detail: [
          stringRecordField(record, "reason"),
          stringRecordField(record, "healthState") ? `health=${stringRecordField(record, "healthState")}` : undefined,
          stringRecordField(record, "healthStage") ? `stage=${stringRecordField(record, "healthStage")}` : undefined
        ].filter(Boolean).join(" ") || undefined,
        section: section ?? "Switchboard Runner"
      };
    case "activation_window_expiring":
    case "activation_window_expired":
      return {
        status: "error",
        label: "Activation window",
        detail: activationWindowProgressDetail(record),
        section: section ?? "Switchboard Runner"
      };
    case "registration_observed":
    case "group_registration_observed":
      return { status: "ok", label: "Registered on Hub", detail: registrationProgressDetail(record), section: section ?? "Switchboard Runner" };
    case "validation_observed":
    case "group_validation_observed":
      return { status: "ok", label: "Validation observed", detail: validationProgressDetail(record), section: section ?? "Switchboard Runner" };
    case "final_report":
      return { status: "ok", label: "Deployment workflow complete", section: section ?? "Switchboard Runner" };
    case "workflow_failed":
      return { status: "error", label: "Deployment workflow failed", detail: stringRecordField(record, "error"), section: section ?? "Switchboard Runner" };
    default:
      return undefined;
  }
}

function waitProgressLine(
  step: string | undefined,
  detail: string | undefined,
  section?: SwitchboardProgressSection,
  schedule?: Record<string, unknown>
): ProgressLine | undefined {
  switch (step) {
    case "capacity_selection":
      return undefined;
    case "deploy_submitted": {
      const jobStartDetail = jobStartWaitDetail(schedule);
      return jobStartDetail
        ? { status: "wait", label: "Job start", detail: jobStartDetail, section: section ?? "Switchboard Runner" }
        : undefined;
    }
    case "runtime_claimed":
      return { status: "wait", label: "Quote", detail: detail ?? "waiting for ingress quote", section: section ?? "Switchboard Runner" };
    case "quote_ready":
      return { status: "wait", label: "Funding", detail: detail ?? "waiting for Hub funding", section: section ?? "Switchboard Runner" };
    case "funding_submitted":
      return { status: "wait", label: "Funding and DNS", detail: detail ?? "waiting for funding readback and canonical DNS", section: section ?? "Switchboard Runner" };
    case "dns_propagated":
      return { status: "wait", label: "Route", detail: detail ?? "waiting for gateway route activation", section: section ?? "Switchboard Runner" };
    case "route_active":
      return { status: "wait", label: "Registration", detail: detail ?? "waiting for Hub registration readback", section: section ?? "Switchboard Runner" };
    case "registration_observed":
      return { status: "wait", label: "Validation", detail: detail ?? "waiting for validation report", section: section ?? "Switchboard Runner" };
    case "relay_readback":
      return { status: "wait", label: "Relay readback", detail, section: section ?? "Switchboard Runner" };
    default:
      return undefined;
  }
}

function jobStartWaitDetail(schedule: Record<string, unknown> | undefined): string | undefined {
  const summary = deployScheduleSummary(recordValue(schedule), {});
  const now = Date.now();
  if (summary?.startMs !== undefined && now < summary.startMs) {
    return undefined;
  }
  if (summary?.latestStartMs !== undefined && now > summary.latestStartMs) {
    return "past max-start; waiting for job to start";
  }
  if (summary?.latestStartMs !== undefined) {
    return `waiting for job to start; max-start in ${formatProgressDuration(summary.latestStartMs - now)}`;
  }
  return "waiting for job to start";
}

function waitThrottleKey(line: ProgressLine): string {
  if (line.label !== "Job start") {
    return `${line.label}:${line.detail ?? ""}`;
  }
  return `${line.label}:${jobStartWaitPhase(line.detail)}`;
}

function jobStartWaitPhase(detail: string | undefined): string {
  if (detail?.startsWith("waiting for job to start; max-start in ")) {
    return "after-start";
  }
  if (detail === "past max-start; waiting for job to start") {
    return "past-max-start";
  }
  return detail ?? "";
}

function logProgressLine(
  line: ProgressLine,
  state?: { currentSection: SwitchboardProgressSection }
): void {
  if (state && line.section && line.section !== state.currentSection) {
    console.log("");
    console.log(sectionTitle(line.section));
    state.currentSection = line.section;
  }
  console.log(`  ${progressStatusLine(line.status, line.label, line.detail)}`);
}

function progressStatusLine(status: SwitchboardProgressStatus, label: string, detail?: string): string {
  return `${statusMarker(status)} ${label}${detail ? `: ${dim(detail)}` : ""}`;
}

function withDefaultSection(line: ProgressLine, section: SwitchboardProgressSection): ProgressLine {
  return { ...line, section: line.section ?? section };
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

function activationWindowProgressDetail(details: Record<string, unknown>): string | undefined {
  const reason = stringRecordField(details, "reason");
  const deadline = stringRecordField(details, "activationDeadlineIso") ?? stringRecordField(details, "activationDeadline");
  const remainingMs = numberRecordField(details, "activationDeadlineRemainingMs");
  return [
    reason,
    deadline ? `deadline=${deadline}` : undefined,
    remainingMs !== undefined ? `remaining=${formatProgressDuration(remainingMs)}` : undefined
  ].filter(Boolean).join(" ") || undefined;
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
): { startMs?: number; endMs?: number; latestStartMs?: number; startIso?: string; endIso?: string; latestStartIso?: string } | undefined {
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
    startMs,
    endMs,
    latestStartMs,
    startIso: stringRecordField(schedule, "startIso") ?? (startMs !== undefined ? new Date(startMs).toISOString() : undefined),
    endIso: stringRecordField(schedule, "endIso") ?? (endMs !== undefined ? new Date(endMs).toISOString() : undefined),
    latestStartIso: stringRecordField(schedule, "latestStartIso") ?? (latestStartMs !== undefined ? new Date(latestStartMs).toISOString() : undefined)
  };
}

function formatProgressDuration(ms: number): string {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) {
    return `${hours}h${minutes > 0 ? ` ${minutes}m` : ""}${seconds > 0 ? ` ${seconds}s` : ""}`;
  }
  if (minutes > 0) {
    return `${minutes}m${seconds > 0 ? ` ${seconds}s` : ""}`;
  }
  return `${seconds}s`;
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

function arrayRecordField(record: Record<string, unknown>, field: string): unknown[] {
  const value = record[field];
  return Array.isArray(value) ? value : [];
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
