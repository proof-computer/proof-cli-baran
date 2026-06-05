import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { pathToFileURL } from "node:url";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

import { createDeployWorkflowReadbackRetryFetch } from "../src/switchboard-core/cli/src/index.js";
import { runSwitchboardCatalogBuildNative } from "../src/commands/switchboard/catalog/build.js";
import { runSwitchboardCatalogInspectNative } from "../src/commands/switchboard/catalog/inspect.js";
import { runSwitchboardCatalogSetStateNative } from "../src/commands/switchboard/catalog/set-state.js";
import { runSwitchboardCatalogVerifyNative } from "../src/commands/switchboard/catalog/verify.js";
import { runSwitchboardBootstrapNative } from "../src/commands/switchboard/bootstrap.js";
import { runSwitchboardClaimNative } from "../src/commands/switchboard/claim.js";
import { runSwitchboardClaimableNative } from "../src/commands/switchboard/claimable.js";
import { runSwitchboardContextAddNative } from "../src/commands/switchboard/context/add.js";
import { runSwitchboardContextCurrentNative } from "../src/commands/switchboard/context/current.js";
import { runSwitchboardContextDnsClearNative } from "../src/commands/switchboard/context/dns/clear.js";
import { runSwitchboardContextDnsSetNative } from "../src/commands/switchboard/context/dns/set.js";
import { runSwitchboardContextListNative } from "../src/commands/switchboard/context/list.js";
import { runSwitchboardContextSetNative } from "../src/commands/switchboard/context/set.js";
import { runSwitchboardContextUseNative } from "../src/commands/switchboard/context/use.js";
import { runSwitchboardDeployNative } from "../src/commands/switchboard/deploy.js";
import { runSwitchboardDeployDoctorNative } from "../src/commands/switchboard/deploy/doctor.js";
import { runSwitchboardDeployResumeNative } from "../src/commands/switchboard/deploy/resume.js";
import { runSwitchboardDeployStatusNative } from "../src/commands/switchboard/deploy/status.js";
import { runSwitchboardDeploymentStatusNative } from "../src/commands/switchboard/status.js";
import { runSwitchboardGatewayDiscoverNative } from "../src/commands/switchboard/gateway/discover.js";
import { runSwitchboardGatewaySetupNative } from "../src/commands/switchboard/gateway/setup.js";
import { runSwitchboardGatewayStatusNative } from "../src/commands/switchboard/gateway/status.js";
import { runSwitchboardGatewayUpgradeNative } from "../src/commands/switchboard/gateway/upgrade.js";
import { runSwitchboardHostnameAddNative } from "../src/commands/switchboard/hostname/add.js";
import { runSwitchboardHostnameRemoveNative } from "../src/commands/switchboard/hostname/remove.js";
import { runSwitchboardHostnameStatusNative } from "../src/commands/switchboard/hostname/status.js";
import { runSwitchboardInitNative } from "../src/commands/switchboard/init.js";
import { runSwitchboardLaunchDemoNative } from "../src/commands/switchboard/launch-demo.js";
import { runSwitchboardPreflightNative } from "../src/commands/switchboard/preflight.js";
import { runSwitchboardProjectInitNative } from "../src/commands/switchboard/project/init.js";
import { runSwitchboardProjectShowNative } from "../src/commands/switchboard/project/show.js";
import { runSwitchboardRefundNative } from "../src/commands/switchboard/refund.js";
import { runSwitchboardRefundableNative } from "../src/commands/switchboard/refundable.js";
import { runSwitchboardOpsNative } from "../src/commands/switchboard/ops.js";
import { runSwitchboardRelayBackfillSpecsNative } from "../src/commands/switchboard/relay/backfill-specs.js";
import { runSwitchboardRelayBudgetNative } from "../src/commands/switchboard/relay/budget.js";
import { runSwitchboardRelayCatalogBuildNative } from "../src/commands/switchboard/relay/catalog/build.js";
import SwitchboardRelayCatalogSetState, {
  runSwitchboardRelayCatalogSetStateNative
} from "../src/commands/switchboard/relay/catalog/set-state.js";
import { runSwitchboardRelayDnsApplyNative } from "../src/commands/switchboard/relay/dns/apply.js";
import { runSwitchboardRelayDnsPlanNative } from "../src/commands/switchboard/relay/dns/plan.js";
import { runSwitchboardRelayDnsRemoveNative } from "../src/commands/switchboard/relay/dns/remove.js";
import { runSwitchboardRelayDnsVerifyNative } from "../src/commands/switchboard/relay/dns/verify.js";
import { runSwitchboardRelayDiffNative } from "../src/commands/switchboard/relay/diff.js";
import { runSwitchboardRelayKeygenNative } from "../src/commands/switchboard/relay/keygen.js";
import { runSwitchboardRelayListNative } from "../src/commands/switchboard/relay/list.js";
import { runSwitchboardRelayLogsNative } from "../src/commands/switchboard/relay/logs.js";
import { runSwitchboardRelayPickProcessorNative } from "../src/commands/switchboard/relay/pick-processor.js";
import { runSwitchboardRelayScaffoldNative } from "../src/commands/switchboard/relay/scaffold.js";
import { runSwitchboardRelayStatusNative } from "../src/commands/switchboard/relay/status.js";
import { runSwitchboardRelaySyncNative } from "../src/commands/switchboard/relay/sync.js";
import { runSwitchboardRelayWatchNative } from "../src/commands/switchboard/relay/watch.js";
import { runSwitchboardRelayVerifyNative } from "../src/commands/switchboard/relay/verify.js";
import { runSwitchboardRelayWhoamiNative } from "../src/commands/switchboard/relay/whoami.js";
import { runSwitchboardSessionRegisterNative } from "../src/commands/switchboard/session/register.js";
import { runSwitchboardSessionRefundableNative } from "../src/commands/switchboard/session/refundable.js";
import { runSwitchboardSessionRefundNative } from "../src/commands/switchboard/session/refund.js";
import { runSwitchboardSessionStatusNative } from "../src/commands/switchboard/session/status.js";
import { runSwitchboardValidatorLaunchNative } from "../src/commands/switchboard/validator/launch.js";
import { runSwitchboardValidatorScriptNative } from "../src/commands/switchboard/validator/script.js";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const commandUrl = pathToFileURL(path.join(repoRoot, "src", "commands", "switchboard.ts")).href;
const catalogBuildCommandUrl = pathToFileURL(path.join(repoRoot, "src", "commands", "switchboard", "catalog", "build.ts")).href;
const catalogInspectCommandUrl = pathToFileURL(path.join(repoRoot, "src", "commands", "switchboard", "catalog", "inspect.ts")).href;
const catalogSetStateCommandUrl = pathToFileURL(path.join(repoRoot, "src", "commands", "switchboard", "catalog", "set-state.ts")).href;
const catalogVerifyCommandUrl = pathToFileURL(path.join(repoRoot, "src", "commands", "switchboard", "catalog", "verify.ts")).href;
const bootstrapCommandUrl = pathToFileURL(path.join(repoRoot, "src", "commands", "switchboard", "bootstrap.ts")).href;
const claimCommandUrl = pathToFileURL(path.join(repoRoot, "src", "commands", "switchboard", "claim.ts")).href;
const claimableCommandUrl = pathToFileURL(path.join(repoRoot, "src", "commands", "switchboard", "claimable.ts")).href;
const contextAddCommandUrl = pathToFileURL(path.join(repoRoot, "src", "commands", "switchboard", "context", "add.ts")).href;
const contextCurrentCommandUrl = pathToFileURL(path.join(repoRoot, "src", "commands", "switchboard", "context", "current.ts")).href;
const contextDnsClearCommandUrl = pathToFileURL(path.join(repoRoot, "src", "commands", "switchboard", "context", "dns", "clear.ts")).href;
const contextDnsSetCommandUrl = pathToFileURL(path.join(repoRoot, "src", "commands", "switchboard", "context", "dns", "set.ts")).href;
const contextListCommandUrl = pathToFileURL(path.join(repoRoot, "src", "commands", "switchboard", "context", "list.ts")).href;
const contextSetCommandUrl = pathToFileURL(path.join(repoRoot, "src", "commands", "switchboard", "context", "set.ts")).href;
const contextUseCommandUrl = pathToFileURL(path.join(repoRoot, "src", "commands", "switchboard", "context", "use.ts")).href;
const deployCommandUrl = pathToFileURL(path.join(repoRoot, "src", "commands", "switchboard", "deploy.ts")).href;
const doctorCommandUrl = pathToFileURL(path.join(repoRoot, "src", "commands", "switchboard", "deploy", "doctor.ts")).href;
const resumeCommandUrl = pathToFileURL(path.join(repoRoot, "src", "commands", "switchboard", "deploy", "resume.ts")).href;
const deployStatusCommandUrl = pathToFileURL(path.join(repoRoot, "src", "commands", "switchboard", "deploy", "status.ts")).href;
const gatewayDiscoverCommandUrl = pathToFileURL(path.join(repoRoot, "src", "commands", "switchboard", "gateway", "discover.ts")).href;
const gatewaySetupCommandUrl = pathToFileURL(path.join(repoRoot, "src", "commands", "switchboard", "gateway", "setup.ts")).href;
const gatewayStatusCommandUrl = pathToFileURL(path.join(repoRoot, "src", "commands", "switchboard", "gateway", "status.ts")).href;
const gatewayUpgradeCommandUrl = pathToFileURL(path.join(repoRoot, "src", "commands", "switchboard", "gateway", "upgrade.ts")).href;
const hostnameAddCommandUrl = pathToFileURL(path.join(repoRoot, "src", "commands", "switchboard", "hostname", "add.ts")).href;
const hostnameRemoveCommandUrl = pathToFileURL(path.join(repoRoot, "src", "commands", "switchboard", "hostname", "remove.ts")).href;
const launchDemoCommandUrl = pathToFileURL(path.join(repoRoot, "src", "commands", "switchboard", "launch-demo.ts")).href;
const hostnameStatusCommandUrl = pathToFileURL(path.join(repoRoot, "src", "commands", "switchboard", "hostname", "status.ts")).href;
const initCommandUrl = pathToFileURL(path.join(repoRoot, "src", "commands", "switchboard", "init.ts")).href;
const projectShowCommandUrl = pathToFileURL(path.join(repoRoot, "src", "commands", "switchboard", "project", "show.ts")).href;
const projectInitCommandUrl = pathToFileURL(path.join(repoRoot, "src", "commands", "switchboard", "project", "init.ts")).href;
const preflightCommandUrl = pathToFileURL(path.join(repoRoot, "src", "commands", "switchboard", "preflight.ts")).href;
const refundCommandUrl = pathToFileURL(path.join(repoRoot, "src", "commands", "switchboard", "refund.ts")).href;
const refundableCommandUrl = pathToFileURL(path.join(repoRoot, "src", "commands", "switchboard", "refundable.ts")).href;
const opsCommandUrl = pathToFileURL(path.join(repoRoot, "src", "commands", "switchboard", "ops.ts")).href;
const relayBackfillSpecsCommandUrl = pathToFileURL(path.join(repoRoot, "src", "commands", "switchboard", "relay", "backfill-specs.ts")).href;
const relayBudgetCommandUrl = pathToFileURL(path.join(repoRoot, "src", "commands", "switchboard", "relay", "budget.ts")).href;
const relayCatalogBuildCommandUrl = pathToFileURL(path.join(repoRoot, "src", "commands", "switchboard", "relay", "catalog", "build.ts")).href;
const relayCatalogSetStateCommandUrl = pathToFileURL(path.join(repoRoot, "src", "commands", "switchboard", "relay", "catalog", "set-state.ts")).href;
const relayDnsApplyCommandUrl = pathToFileURL(path.join(repoRoot, "src", "commands", "switchboard", "relay", "dns", "apply.ts")).href;
const relayDnsPlanCommandUrl = pathToFileURL(path.join(repoRoot, "src", "commands", "switchboard", "relay", "dns", "plan.ts")).href;
const relayDnsRemoveCommandUrl = pathToFileURL(path.join(repoRoot, "src", "commands", "switchboard", "relay", "dns", "remove.ts")).href;
const relayDnsVerifyCommandUrl = pathToFileURL(path.join(repoRoot, "src", "commands", "switchboard", "relay", "dns", "verify.ts")).href;
const relayDiffCommandUrl = pathToFileURL(path.join(repoRoot, "src", "commands", "switchboard", "relay", "diff.ts")).href;
const relayKeygenCommandUrl = pathToFileURL(path.join(repoRoot, "src", "commands", "switchboard", "relay", "keygen.ts")).href;
const relayListCommandUrl = pathToFileURL(path.join(repoRoot, "src", "commands", "switchboard", "relay", "list.ts")).href;
const relayLogsCommandUrl = pathToFileURL(path.join(repoRoot, "src", "commands", "switchboard", "relay", "logs.ts")).href;
const relayPickProcessorCommandUrl = pathToFileURL(path.join(repoRoot, "src", "commands", "switchboard", "relay", "pick-processor.ts")).href;
const relayScaffoldCommandUrl = pathToFileURL(path.join(repoRoot, "src", "commands", "switchboard", "relay", "scaffold.ts")).href;
const relayStatusCommandUrl = pathToFileURL(path.join(repoRoot, "src", "commands", "switchboard", "relay", "status.ts")).href;
const relaySyncCommandUrl = pathToFileURL(path.join(repoRoot, "src", "commands", "switchboard", "relay", "sync.ts")).href;
const relayWatchCommandUrl = pathToFileURL(path.join(repoRoot, "src", "commands", "switchboard", "relay", "watch.ts")).href;
const relayVerifyCommandUrl = pathToFileURL(path.join(repoRoot, "src", "commands", "switchboard", "relay", "verify.ts")).href;
const relayWhoamiCommandUrl = pathToFileURL(path.join(repoRoot, "src", "commands", "switchboard", "relay", "whoami.ts")).href;
const sessionRegisterCommandUrl = pathToFileURL(path.join(repoRoot, "src", "commands", "switchboard", "session", "register.ts")).href;
const sessionRefundableCommandUrl = pathToFileURL(path.join(repoRoot, "src", "commands", "switchboard", "session", "refundable.ts")).href;
const sessionRefundCommandUrl = pathToFileURL(path.join(repoRoot, "src", "commands", "switchboard", "session", "refund.ts")).href;
const sessionStatusCommandUrl = pathToFileURL(path.join(repoRoot, "src", "commands", "switchboard", "session", "status.ts")).href;
const validatorLaunchCommandUrl = pathToFileURL(path.join(repoRoot, "src", "commands", "switchboard", "validator", "launch.ts")).href;
const validatorScriptCommandUrl = pathToFileURL(path.join(repoRoot, "src", "commands", "switchboard", "validator", "script.ts")).href;
const deploymentStatusCommandUrl = pathToFileURL(path.join(repoRoot, "src", "commands", "switchboard", "status.ts")).href;

test("prints native switchboard root help through the oclif command", () => {
  const result = runPluginCommand(["--help"]);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Switchboard ingress commands/u);
  assert.match(result.stdout, /deploy doctor\|resume\|status/u);
  assert.match(result.stdout, /compatibility bridge has been removed/u);
  assert.doesNotMatch(result.stdout, /switchboard launch-demo --yes-spend/u);
});

test("does not depend on the abandoned switchboard-cli package", () => {
  const abandonedPackage = "@proof-computer/" + "switchboard-cli";
  const missingRunnerCode = "SB_RUNNER_" + "MISSING";
  const packageJson = JSON.parse(readFileSync(path.join(repoRoot, "package.json"), "utf8")) as {
    dependencies?: Record<string, string>;
  };

  assert.equal(packageJson.dependencies?.[abandonedPackage], undefined);

  for (const file of sourceGuardFiles([
    path.join(repoRoot, "README.md"),
    path.join(repoRoot, "package.json"),
    path.join(repoRoot, "pnpm-lock.yaml"),
    path.join(repoRoot, "src")
  ])) {
    const contents = readFileSync(file, "utf8");
    assert.equal(contents.includes(abandonedPackage), false, `${path.relative(repoRoot, file)} mentions ${abandonedPackage}`);
    assert.equal(contents.includes(missingRunnerCode), false, `${path.relative(repoRoot, file)} mentions ${missingRunnerCode}`);
  }
});

test("prints native deploy help through the oclif command", () => {
  const result = runDeployCommand(["--help"]);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Deploy a project workload through Switchboard/u);
  assert.match(result.stdout, /--entrypoint/u);
  assert.match(result.stdout, /--yes/u);
  assert.doesNotMatch(result.stdout, /Switchboard, a PROOF project/u);
});

test("prints native launch-demo help through the oclif command", () => {
  const result = runLaunchDemoCommand(["--help"]);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Launch the bundled Switchboard demo/u);
  assert.match(result.stdout, /--yes-spend/u);
  assert.match(result.stdout, /--ha/u);
  assert.doesNotMatch(result.stdout, /Switchboard, a PROOF project/u);
});

test("prints native bootstrap help through the oclif command", () => {
  const result = runBootstrapCommand(["--help"]);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Manage Switchboard bootstrap infrastructure/u);
  assert.match(result.stdout, /switchboard bootstrap host status/u);
  assert.match(result.stdout, /switchboard bootstrap acurast status/u);
  assert.doesNotMatch(result.stdout, /switchboard acurast/u);
  assert.doesNotMatch(result.stdout, /Switchboard, a PROOF project/u);
});

test("prints native ops help through the oclif command", () => {
  const result = runOpsCommand(["--help"]);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Manage Switchboard ops profiles/u);
  assert.match(result.stdout, /switchboard ops init/u);
  assert.match(result.stdout, /--bootstrap-host/u);
  assert.doesNotMatch(result.stdout, /switchboard acurast/u);
  assert.doesNotMatch(result.stdout, /Switchboard, a PROOF project/u);
});

test("prints native init help through the oclif command", () => {
  const result = runInitCommand(["--help"]);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Initialize a local Switchboard project/u);
  assert.match(result.stdout, /--template/u);
  assert.match(result.stdout, /--ssh-public-key-file/u);
  assert.doesNotMatch(result.stdout, /--endpoint/u);
  assert.doesNotMatch(result.stdout, /Switchboard, a PROOF project/u);
});

test("prints native project init help through the oclif command", () => {
  const result = runProjectInitCommand(["--help"]);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Initialize a local Switchboard project/u);
  assert.match(result.stdout, /switchboard project init/u);
  assert.match(result.stdout, /--force/u);
  assert.doesNotMatch(result.stdout, /--endpoint/u);
  assert.doesNotMatch(result.stdout, /Switchboard, a PROOF project/u);
});

test("prints native project show help through the oclif command", () => {
  const result = runProjectShowCommand(["--help"]);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Show local Switchboard project state/u);
  assert.match(result.stdout, /--project-dir/u);
  assert.doesNotMatch(result.stdout, /Switchboard, a PROOF project/u);
});

test("prints native preflight help through the oclif command", () => {
  const result = runPreflightCommand(["--help"]);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Check Switchboard deploy readiness/u);
  assert.match(result.stdout, /--manifest-url/u);
  assert.doesNotMatch(result.stdout, /Switchboard, a PROOF project/u);
});

test("prints native top-level status help through the oclif command", () => {
  const result = runDeploymentStatusCommand(["--help"]);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Diagnose a Switchboard deployment/u);
  assert.match(result.stdout, /--session-id/u);
  assert.doesNotMatch(result.stdout, /Switchboard, a PROOF project/u);
});

test("prints native session status help through the oclif command", () => {
  const result = runSessionStatusCommand(["--help"]);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Read raw Switchboard Hub session state/u);
  assert.match(result.stdout, /--session-id/u);
  assert.doesNotMatch(result.stdout, /Switchboard, a PROOF project/u);
});

test("prints native session register help through the oclif command", () => {
  const result = runSessionRegisterCommand(["--help"]);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Register a funded Switchboard session/u);
  assert.match(result.stdout, /--job-signer-private-key/u);
  assert.match(result.stdout, /--relay-url/u);
  assert.doesNotMatch(result.stdout, /Switchboard, a PROOF project/u);
});

test("prints native hostname status help through the oclif command", () => {
  const result = runHostnameStatusCommand(["--help"]);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Check Switchboard customer hostname status/u);
  assert.match(result.stdout, /--endpoint/u);
  assert.doesNotMatch(result.stdout, /Switchboard, a PROOF project/u);
});

test("prints native hostname add help through the oclif command", () => {
  const result = runHostnameAddCommand(["--help"]);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Attach a Switchboard customer hostname/u);
  assert.match(result.stdout, /--developer-private-key-env/u);
  assert.match(result.stdout, /--byo-tls/u);
  assert.doesNotMatch(result.stdout, /Switchboard, a PROOF project/u);
});

test("prints native hostname remove help through the oclif command", () => {
  const result = runHostnameRemoveCommand(["--help"]);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Remove a Switchboard customer hostname/u);
  assert.match(result.stdout, /--developer-private-key-env/u);
  assert.match(result.stdout, /--endpoint/u);
  assert.doesNotMatch(result.stdout, /Switchboard, a PROOF project/u);
});

test("prints native validator script help through the oclif command", () => {
  const result = runValidatorScriptCommand(["--help"]);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Look up the approved Switchboard validator script pin/u);
  assert.match(result.stdout, /--validator-script-manifest-url/u);
  assert.doesNotMatch(result.stdout, /Switchboard, a PROOF project/u);
});

test("prints native validator launch help through the oclif command", () => {
  const result = runValidatorLaunchCommand(["--help"]);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Launch Switchboard validators/u);
  assert.match(result.stdout, /switchboard validator launch/u);
  assert.match(result.stdout, /--processor/u);
  assert.match(result.stdout, /--yes/u);
  assert.doesNotMatch(result.stdout, /switchboard acurast/u);
  assert.doesNotMatch(result.stdout, /Switchboard, a PROOF project/u);
});

test("prints native catalog build help through the oclif command", () => {
  const result = runCatalogBuildCommand(["--help"]);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Build signed Switchboard service catalogs/u);
  assert.match(result.stdout, /--signing-key/u);
  assert.doesNotMatch(result.stdout, /Switchboard, a PROOF project/u);
});

test("prints native relay catalog build help through the oclif command", () => {
  const result = runRelayCatalogBuildCommand(["--help"]);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Build a signed Switchboard relay catalog bundle/u);
  assert.match(result.stdout, /--specs-dir/u);
  assert.match(result.stdout, /--signing-key/u);
  assert.doesNotMatch(result.stdout, /--json/u);
  assert.doesNotMatch(result.stdout, /--yes/u);
  assert.doesNotMatch(result.stdout, /Switchboard, a PROOF project/u);
});

test("prints native relay catalog set-state help through the oclif command", () => {
  const result = runRelayCatalogSetStateCommand(["--help"]);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Update local Switchboard relay catalog state/u);
  assert.match(result.stdout, /--catalog-file/u);
  assert.match(result.stdout, /--no-rebuild/u);
  assert.doesNotMatch(result.stdout, /--json/u);
  assert.doesNotMatch(result.stdout, /--yes/u);
  assert.doesNotMatch(result.stdout, /--signing-key/u);
  assert.doesNotMatch(result.stdout, /Switchboard, a PROOF project/u);
});

test("aliases relay catalog state to the native relay catalog set-state command", () => {
  assert.deepEqual(SwitchboardRelayCatalogSetState.aliases, ["switchboard relay catalog state"]);
});

test("prints native catalog set-state help through the oclif command", () => {
  const result = runCatalogSetStateCommand(["--help"]);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Update local Switchboard catalog service state/u);
  assert.match(result.stdout, /--no-rebuild/u);
  assert.doesNotMatch(result.stdout, /--json/u);
  assert.doesNotMatch(result.stdout, /Switchboard, a PROOF project/u);
});

test("prints native catalog inspect help through the oclif command", () => {
  const result = runCatalogInspectCommand(["--help"]);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Inspect signed Switchboard service catalogs/u);
  assert.match(result.stdout, /--allow-expired/u);
  assert.doesNotMatch(result.stdout, /Switchboard, a PROOF project/u);
});

test("prints native catalog verify help through the oclif command", () => {
  const result = runCatalogVerifyCommand(["--help"]);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Verify signed Switchboard service catalogs/u);
  assert.match(result.stdout, /--allow-unpinned-signer/u);
  assert.doesNotMatch(result.stdout, /Switchboard, a PROOF project/u);
});

test("prints native gateway setup help through the oclif command", () => {
  const result = runGatewaySetupCommand(["--help"]);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Prepare a Switchboard gateway host/u);
  assert.match(result.stdout, /--upstream-admission-url/u);
  assert.doesNotMatch(result.stdout, /Switchboard, a PROOF project/u);
});

test("prints native gateway discover help through the oclif command", () => {
  const result = runGatewayDiscoverCommand(["--help"]);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Check gateway-local Acurast processor readiness/u);
  assert.match(result.stdout, /--gateway-agent-url/u);
  assert.doesNotMatch(result.stdout, /Switchboard, a PROOF project/u);
});

test("prints native gateway status help through the oclif command", () => {
  const result = runGatewayStatusCommand(["--help"]);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Show local Switchboard gateway stack status/u);
  assert.match(result.stdout, /--capability-token-env/u);
  assert.doesNotMatch(result.stdout, /Switchboard, a PROOF project/u);
});

test("prints native relay list help through the oclif command", () => {
  const result = runRelayListCommand(["--help"]);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /List Switchboard relay inventory/u);
  assert.match(result.stdout, /--source <local\|live>/u);
  assert.match(result.stdout, /--json/u);
  assert.doesNotMatch(result.stdout, /Switchboard, a PROOF project/u);
});

test("prints native relay diff help through the oclif command", () => {
  const result = runRelayDiffCommand(["--help"]);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Compare local Switchboard relay inventory with live discovery/u);
  assert.match(result.stdout, /--manifest-url/u);
  assert.match(result.stdout, /--json/u);
  assert.doesNotMatch(result.stdout, /Switchboard, a PROOF project/u);
});

test("prints native relay sync help through the oclif command", () => {
  const result = runRelaySyncCommand(["--help"]);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Sync local Switchboard relay inventory from signed discovery/u);
  assert.match(result.stdout, /--manifest-url/u);
  assert.match(result.stdout, /--allow-unpinned-signer/u);
  assert.match(result.stdout, /--dry-run/u);
  assert.doesNotMatch(result.stdout, /--json/u);
  assert.doesNotMatch(result.stdout, /--yes/u);
  assert.doesNotMatch(result.stdout, /Switchboard, a PROOF project/u);
});

test("prints native relay backfill-specs help through the oclif command", () => {
  const result = runRelayBackfillSpecsCommand(["--help"]);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Backfill local Switchboard relay specs from discovery/u);
  assert.match(result.stdout, /--target/u);
  assert.match(result.stdout, /--dry-run/u);
  assert.doesNotMatch(result.stdout, /switchboard acurast/u);
  assert.doesNotMatch(result.stdout, /Switchboard, a PROOF project/u);
});

test("prints native relay pick-processor help through the oclif command", () => {
  const result = runRelayPickProcessorCommand(["--help"]);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Inspect Acurast processor availability for a Switchboard relay/u);
  assert.match(result.stdout, /<relay-id>/u);
  assert.match(result.stdout, /--manager-id/u);
  assert.match(result.stdout, /--pin/u);
  assert.match(result.stdout, /--json/u);
  assert.doesNotMatch(result.stdout, /--yes/u);
  assert.doesNotMatch(result.stdout, /Switchboard, a PROOF project/u);
});

test("prints native relay logs help through the oclif command", () => {
  const result = runRelayLogsCommand(["--help"]);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Read encrypted Switchboard relay log events/u);
  assert.match(result.stdout, /--read-url/u);
  assert.match(result.stdout, /--encryption-key-env/u);
  assert.match(result.stdout, /--json/u);
  assert.doesNotMatch(result.stdout, /Switchboard, a PROOF project/u);
});

test("prints native relay verify help through the oclif command", () => {
  const result = runRelayVerifyCommand(["--help"]);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Verify a deployed Switchboard relay/u);
  assert.match(result.stdout, /<relay-id>/u);
  assert.match(result.stdout, /--manifest-url/u);
  assert.doesNotMatch(result.stdout, /--json/u);
  assert.doesNotMatch(result.stdout, /Switchboard, a PROOF project/u);
});

test("prints native relay dns plan help through the oclif command", () => {
  const result = runRelayDnsPlanCommand(["--help"]);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Plan Switchboard relay DNS records/u);
  assert.match(result.stdout, /<relay-id>/u);
  assert.match(result.stdout, /--spec-file/u);
  assert.match(result.stdout, /--resolvers/u);
  assert.doesNotMatch(result.stdout, /--json/u);
  assert.doesNotMatch(result.stdout, /--yes/u);
  assert.doesNotMatch(result.stdout, /Cloudflare API token/u);
  assert.doesNotMatch(result.stdout, /Switchboard, a PROOF project/u);
});

test("prints native relay dns apply help through the oclif command", () => {
  const result = runRelayDnsApplyCommand(["--help"]);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Apply Switchboard relay DNS records/u);
  assert.match(result.stdout, /<relay-id>/u);
  assert.match(result.stdout, /--token-env/u);
  assert.match(result.stdout, /--yes/u);
  assert.doesNotMatch(result.stdout, /switchboard acurast/u);
  assert.doesNotMatch(result.stdout, /Switchboard, a PROOF project/u);
});

test("prints native relay dns verify help through the oclif command", () => {
  const result = runRelayDnsVerifyCommand(["--help"]);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Verify Switchboard relay DNS records/u);
  assert.match(result.stdout, /<relay-id>/u);
  assert.match(result.stdout, /--spec-file/u);
  assert.match(result.stdout, /--resolvers/u);
  assert.doesNotMatch(result.stdout, /--json/u);
  assert.doesNotMatch(result.stdout, /--yes/u);
  assert.doesNotMatch(result.stdout, /Cloudflare API token/u);
  assert.doesNotMatch(result.stdout, /Switchboard, a PROOF project/u);
});

test("prints native relay dns remove help through the oclif command", () => {
  const result = runRelayDnsRemoveCommand(["--help"]);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Remove Switchboard relay DNS records/u);
  assert.match(result.stdout, /<relay-id>/u);
  assert.match(result.stdout, /--token-env/u);
  assert.match(result.stdout, /--yes/u);
  assert.doesNotMatch(result.stdout, /switchboard acurast/u);
  assert.doesNotMatch(result.stdout, /Switchboard, a PROOF project/u);
});

test("prints native relay budget help through the oclif command", () => {
  const result = runRelayBudgetCommand(["--help"]);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Calculate a Switchboard relay execution budget/u);
  assert.match(result.stdout, /<duration>/u);
  assert.match(result.stdout, /--rate-per-ms/u);
  assert.match(result.stdout, /--margin-percent/u);
  assert.match(result.stdout, /--update/u);
  assert.match(result.stdout, /--json/u);
  assert.doesNotMatch(result.stdout, /Switchboard, a PROOF project/u);
});

test("prints native relay whoami help through the oclif command", () => {
  const result = runRelayWhoamiCommand(["--help"]);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Show the Acurast deployer identity for a relay seed/u);
  assert.match(result.stdout, /--seed-env/u);
  assert.match(result.stdout, /--json/u);
  assert.doesNotMatch(result.stdout, /Switchboard, a PROOF project/u);
});

test("prints native relay keygen help through the oclif command", () => {
  const result = runRelayKeygenCommand(["--help"]);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Generate local Switchboard relay key material/u);
  assert.match(result.stdout, /<relay-id>/u);
  assert.match(result.stdout, /--env-name/u);
  assert.match(result.stdout, /--unsafe-stdout/u);
  assert.doesNotMatch(result.stdout, /--json/u);
  assert.doesNotMatch(result.stdout, /--yes/u);
  assert.doesNotMatch(result.stdout, /Switchboard, a PROOF project/u);
});

test("prints native relay scaffold help through the oclif command", () => {
  const result = runRelayScaffoldCommand(["--help"]);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Scaffold a local Switchboard relay spec/u);
  assert.match(result.stdout, /<relay-id>/u);
  assert.match(result.stdout, /--target/u);
  assert.match(result.stdout, /--manager-id/u);
  assert.match(result.stdout, /--keygen/u);
  assert.doesNotMatch(result.stdout, /--json/u);
  assert.doesNotMatch(result.stdout, /--yes/u);
  assert.doesNotMatch(result.stdout, /Switchboard, a PROOF project/u);
});

test("prints native relay status help through the oclif command", () => {
  const result = runRelayStatusCommand(["--help"]);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Probe Switchboard relay health and catalog status/u);
  assert.match(result.stdout, /--catalog-file/u);
  assert.doesNotMatch(result.stdout, /--json/u);
  assert.doesNotMatch(result.stdout, /Switchboard, a PROOF project/u);
});

test("prints native relay watch help through the oclif command", () => {
  const result = runRelayWatchCommand(["--help"]);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Watch Switchboard relay health transitions/u);
  assert.match(result.stdout, /\[relay-id\]/u);
  assert.match(result.stdout, /--interval-ms/u);
  assert.match(result.stdout, /--max-runs/u);
  assert.doesNotMatch(result.stdout, /--json/u);
  assert.doesNotMatch(result.stdout, /--yes/u);
  assert.doesNotMatch(result.stdout, /Switchboard, a PROOF project/u);
});

test("prints native gateway upgrade help through the oclif command", () => {
  const result = runGatewayUpgradeCommand(["--help"]);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Upgrade the local Switchboard gateway stack/u);
  assert.match(result.stdout, /--keep-image-override/u);
  assert.doesNotMatch(result.stdout, /Switchboard, a PROOF project/u);
});

test("prints native claimable help through the oclif command", () => {
  const result = runClaimableCommand(["--help"]);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Check Switchboard claimable rewards/u);
  assert.match(result.stdout, /--recipient/u);
  assert.doesNotMatch(result.stdout, /Switchboard, a PROOF project/u);
});

test("prints native claim help through the oclif command", () => {
  const result = runClaimCommand(["--help"]);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Claim Switchboard rewards/u);
  assert.match(result.stdout, /--claim-private-key-env/u);
  assert.match(result.stdout, /--yes/u);
  assert.doesNotMatch(result.stdout, /Switchboard, a PROOF project/u);
});

test("prints native refundable help through the oclif command", () => {
  const result = runRefundableCommand(["--help"]);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Check Switchboard refundable session state/u);
  assert.match(result.stdout, /--session-id/u);
  assert.doesNotMatch(result.stdout, /Switchboard, a PROOF project/u);
});

test("prints native session refundable help through the oclif command", () => {
  const result = runSessionRefundableCommand(["--help"]);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Check Switchboard refundable session state/u);
  assert.match(result.stdout, /switchboard session refundable/u);
  assert.match(result.stdout, /--session-id/u);
  assert.doesNotMatch(result.stdout, /Switchboard, a PROOF project/u);
});

test("prints native refund help through the oclif command", () => {
  const result = runRefundCommand(["--help"]);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Refund a Switchboard session/u);
  assert.match(result.stdout, /--developer-private-key-env/u);
  assert.match(result.stdout, /--yes/u);
  assert.doesNotMatch(result.stdout, /Switchboard, a PROOF project/u);
});

test("prints native session refund help through the oclif command", () => {
  const result = runSessionRefundCommand(["--help"]);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Refund a Switchboard session/u);
  assert.match(result.stdout, /switchboard session refund/u);
  assert.match(result.stdout, /--developer-private-key-env/u);
  assert.doesNotMatch(result.stdout, /Switchboard, a PROOF project/u);
});

test("prints native context list help through the oclif command", () => {
  const result = runContextListCommand(["--help"]);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /List Switchboard contexts/u);
  assert.match(result.stdout, /--project-dir/u);
  assert.doesNotMatch(result.stdout, /Switchboard, a PROOF project/u);
});

test("prints native context current help through the oclif command", () => {
  const result = runContextCurrentCommand(["--help"]);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Show the current Switchboard context/u);
  assert.match(result.stdout, /--context/u);
  assert.doesNotMatch(result.stdout, /Switchboard, a PROOF project/u);
});

test("prints native context use help through the oclif command", () => {
  const result = runContextUseCommand(["--help"]);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Select the current Switchboard context/u);
  assert.match(result.stdout, /--context/u);
  assert.doesNotMatch(result.stdout, /Switchboard, a PROOF project/u);
});

test("prints native context set help through the oclif command", () => {
  const result = runContextSetCommand(["--help"]);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Create or update a Switchboard context/u);
  assert.match(result.stdout, /--relay-url/u);
  assert.doesNotMatch(result.stdout, /Switchboard, a PROOF project/u);
});

test("prints native context add help through the oclif command", () => {
  const result = runContextAddCommand(["--help"]);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Interactively create a Switchboard context/u);
  assert.match(result.stdout, /--no-balance-check/u);
  assert.doesNotMatch(result.stdout, /Switchboard, a PROOF project/u);
});

test("prints native context dns set help through the oclif command", () => {
  const result = runContextDnsSetCommand(["--help"]);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Attach a DNS provider to a Switchboard context/u);
  assert.match(result.stdout, /--token-env/u);
  assert.doesNotMatch(result.stdout, /Switchboard, a PROOF project/u);
});

test("prints native context dns clear help through the oclif command", () => {
  const result = runContextDnsClearCommand(["--help"]);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Detach a DNS provider from a Switchboard context/u);
  assert.match(result.stdout, /context dns remove/u);
  assert.doesNotMatch(result.stdout, /Switchboard, a PROOF project/u);
});

test("prints native deploy doctor help through the oclif command", () => {
  const result = runDoctorCommand(["--help"]);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Diagnose Switchboard deploy state/u);
  assert.match(result.stdout, /--probe/u);
  assert.match(result.stdout, /--intent-id/u);
  assert.doesNotMatch(result.stdout, /Switchboard, a PROOF project/u);
});

test("prints native deploy status help through the oclif command", () => {
  const result = runStatusCommand(["--help"]);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Read local Switchboard deploy workflow state/u);
  assert.match(result.stdout, /--run-dir/u);
  assert.match(result.stdout, /--snapshot/u);
  assert.doesNotMatch(result.stdout, /Switchboard, a PROOF project/u);
});

test("prints native deploy resume help through the oclif command", () => {
  const result = runResumeCommand(["--help"]);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Resume a single-replica Switchboard deploy workflow/u);
  assert.match(result.stdout, /--allow-late-funding/u);
  assert.match(result.stdout, /--yes/u);
  assert.doesNotMatch(result.stdout, /Switchboard, a PROOF project/u);
});

test("forwards native deploy doctor args to the local Switchboard runner", async () => {
  let forwarded: readonly string[] | undefined;
  const exitCode = await runSwitchboardDeployDoctorNative(["--json", "--intent-id", "di_doctor"], {
    runner: async (argv) => {
      forwarded = [...(argv ?? [])];
    }
  });

  assert.equal(exitCode, 0);
  assert.deepEqual(forwarded, ["--json", "--intent-id", "di_doctor"]);
});

test("forwards native deploy status args to the local Switchboard runner", async () => {
  let forwarded: readonly string[] | undefined;
  const exitCode = await runSwitchboardDeployStatusNative(["--json", "--run-dir", ".switchboard/runs/test"], {
    runner: async (argv) => {
      forwarded = [...(argv ?? [])];
    }
  });

  assert.equal(exitCode, 0);
  assert.deepEqual(forwarded, ["--json", "--run-dir", ".switchboard/runs/test"]);
});

test("forwards native deploy resume args to the local Switchboard runner", async () => {
  let forwarded: readonly string[] | undefined;
  const exitCode = await runSwitchboardDeployResumeNative(["--yes", "--json", "--run-dir", ".switchboard/runs/test"], {
    runner: async (argv) => {
      forwarded = [...(argv ?? [])];
    }
  });

  assert.equal(exitCode, 0);
  assert.deepEqual(forwarded, ["--yes", "--json", "--run-dir", ".switchboard/runs/test"]);
});

test("forwards native init args to the local Switchboard runner", async () => {
  let forwarded: readonly string[] | undefined;
  const exitCode = await runSwitchboardInitNative(["--project", "demo", "--context", "mainnet", "--json"], {
    runner: async (argv) => {
      forwarded = [...(argv ?? [])];
    }
  });

  assert.equal(exitCode, 0);
  assert.deepEqual(forwarded, ["--project", "demo", "--context", "mainnet", "--json"]);
});

test("rejects endpoint flags before forwarding native init", async () => {
  let called = false;
  const exitCode = await withMutedConsoleError(() =>
    runSwitchboardInitNative(["--endpoint", "demo.ingress.example"], {
      runner: async () => {
        called = true;
      }
    })
  );

  assert.equal(exitCode, 1);
  assert.equal(called, false);
});

test("forwards native project init args to the local Switchboard runner", async () => {
  let forwarded: readonly string[] | undefined;
  const exitCode = await runSwitchboardProjectInitNative(["--template", "ssh", "--distro", "ubuntu", "--json"], {
    runner: async (argv) => {
      forwarded = [...(argv ?? [])];
    }
  });

  assert.equal(exitCode, 0);
  assert.deepEqual(forwarded, ["--template", "ssh", "--distro", "ubuntu", "--json"]);
});

test("rejects endpoint flags before forwarding native project init", async () => {
  let called = false;
  const exitCode = await withMutedConsoleError(() =>
    runSwitchboardProjectInitNative(["--hostname=demo.ingress.example"], {
      runner: async () => {
        called = true;
      }
    })
  );

  assert.equal(exitCode, 1);
  assert.equal(called, false);
});

test("forwards native project show args to the local Switchboard runner", async () => {
  let forwarded: readonly string[] | undefined;
  const exitCode = await runSwitchboardProjectShowNative(["--json", "--project-dir", "./app"], {
    runner: async (argv) => {
      forwarded = [...(argv ?? [])];
    }
  });

  assert.equal(exitCode, 0);
  assert.deepEqual(forwarded, ["--json", "--project-dir", "./app"]);
});

test("forwards native preflight args to the local Switchboard runner", async () => {
  let forwarded: readonly string[] | undefined;
  const exitCode = await runSwitchboardPreflightNative(["--json", "--manifest-url", "https://control.example/manifest"], {
    runner: async (argv) => {
      forwarded = [...(argv ?? [])];
    }
  });

  assert.equal(exitCode, 0);
  assert.deepEqual(forwarded, ["--json", "--manifest-url", "https://control.example/manifest"]);
});

test("forwards native top-level status args to the local Switchboard runner", async () => {
  let forwarded: readonly string[] | undefined;
  const exitCode = await runSwitchboardDeploymentStatusNative(["--json", "--report", "report.json"], {
    runner: async (argv) => {
      forwarded = [...(argv ?? [])];
    }
  });

  assert.equal(exitCode, 0);
  assert.deepEqual(forwarded, ["--json", "--report", "report.json"]);
});

test("forwards native session status args to the local Switchboard runner", async () => {
  let forwarded: readonly string[] | undefined;
  const exitCode = await runSwitchboardSessionStatusNative(["--json", "--session-id", `0x${"11".repeat(32)}`], {
    runner: async (argv) => {
      forwarded = [...(argv ?? [])];
    }
  });

  assert.equal(exitCode, 0);
  assert.deepEqual(forwarded, ["--json", "--session-id", `0x${"11".repeat(32)}`]);
});

test("forwards native session register args to the local Switchboard runner", async () => {
  let forwarded: readonly string[] | undefined;
  const exitCode = await runSwitchboardSessionRegisterNative(
    ["--yes", "--session-id", `0x${"11".repeat(32)}`, "--relay-url", "https://relay.example"],
    {
      runner: async (argv) => {
        forwarded = [...(argv ?? [])];
      }
    }
  );

  assert.equal(exitCode, 0);
  assert.deepEqual(forwarded, ["--yes", "--session-id", `0x${"11".repeat(32)}`, "--relay-url", "https://relay.example"]);
});

test("forwards native hostname status args to the local Switchboard runner", async () => {
  let forwarded: readonly string[] | undefined;
  const exitCode = await runSwitchboardHostnameStatusNative(["app.example.com", "--endpoint", "demo.ingress.example", "--json"], {
    runner: async (argv) => {
      forwarded = [...(argv ?? [])];
    }
  });

  assert.equal(exitCode, 0);
  assert.deepEqual(forwarded, ["app.example.com", "--endpoint", "demo.ingress.example", "--json"]);
});

test("forwards native hostname add args to the local Switchboard runner", async () => {
  let forwarded: readonly string[] | undefined;
  const exitCode = await runSwitchboardHostnameAddNative(
    ["app.example.com", "--endpoint", "demo.ingress.example", "--developer-private-key-env", "DEVELOPER_PRIVATE_KEY", "--json"],
    {
      runner: async (argv) => {
        forwarded = [...(argv ?? [])];
      }
    }
  );

  assert.equal(exitCode, 0);
  assert.deepEqual(forwarded, ["app.example.com", "--endpoint", "demo.ingress.example", "--developer-private-key-env", "DEVELOPER_PRIVATE_KEY", "--json"]);
});

test("forwards native hostname remove args to the local Switchboard runner", async () => {
  let forwarded: readonly string[] | undefined;
  const exitCode = await runSwitchboardHostnameRemoveNative(
    ["app.example.com", "--endpoint", "demo.ingress.example", "--developer-private-key-env", "DEVELOPER_PRIVATE_KEY", "--json"],
    {
      runner: async (argv) => {
        forwarded = [...(argv ?? [])];
      }
    }
  );

  assert.equal(exitCode, 0);
  assert.deepEqual(forwarded, ["app.example.com", "--endpoint", "demo.ingress.example", "--developer-private-key-env", "DEVELOPER_PRIVATE_KEY", "--json"]);
});

test("forwards native validator script args to the local Switchboard runner", async () => {
  let forwarded: readonly string[] | undefined;
  const exitCode = await runSwitchboardValidatorScriptNative(["--json", "--validator-script-manifest-url", "https://control.example/validator-script.json"], {
    runner: async (argv) => {
      forwarded = [...(argv ?? [])];
    }
  });

  assert.equal(exitCode, 0);
  assert.deepEqual(forwarded, ["--json", "--validator-script-manifest-url", "https://control.example/validator-script.json"]);
});

test("forwards native validator launch args to the local Switchboard runner", async () => {
  let forwarded: readonly string[] | undefined;
  const exitCode = await runSwitchboardValidatorLaunchNative(["--processor", "5CC2L...", "--yes", "--json"], {
    runner: async (argv) => {
      forwarded = [...(argv ?? [])];
    }
  });

  assert.equal(exitCode, 0);
  assert.deepEqual(forwarded, ["--processor", "5CC2L...", "--yes", "--json"]);
});

test("forwards native catalog build args to the local Switchboard runner", async () => {
  let forwarded: readonly string[] | undefined;
  const exitCode = await runSwitchboardCatalogBuildNative(["--spec", "catalogs.json", "--output", "service-catalogs.signed.json", "--stdout"], {
    runner: async (argv) => {
      forwarded = [...(argv ?? [])];
    }
  });

  assert.equal(exitCode, 0);
  assert.deepEqual(forwarded, ["--spec", "catalogs.json", "--output", "service-catalogs.signed.json", "--stdout"]);
});

test("forwards native catalog set-state args to the local Switchboard runner", async () => {
  let forwarded: readonly string[] | undefined;
  const exitCode = await runSwitchboardCatalogSetStateNative(
    ["relay", "relay-d", "active", "--spec", "catalogs.json", "--output", "service-catalogs.signed.json", "--stdout"],
    {
      runner: async (argv) => {
        forwarded = [...(argv ?? [])];
      }
    }
  );

  assert.equal(exitCode, 0);
  assert.deepEqual(forwarded, ["relay", "relay-d", "active", "--spec", "catalogs.json", "--output", "service-catalogs.signed.json", "--stdout"]);
});

test("forwards native catalog inspect args to the local Switchboard runner", async () => {
  let forwarded: readonly string[] | undefined;
  const exitCode = await runSwitchboardCatalogInspectNative(["--file", "catalogs.json", "--signer", "5...", "--json"], {
    runner: async (argv) => {
      forwarded = [...(argv ?? [])];
    }
  });

  assert.equal(exitCode, 0);
  assert.deepEqual(forwarded, ["--file", "catalogs.json", "--signer", "5...", "--json"]);
});

test("forwards native catalog verify args to the local Switchboard runner", async () => {
  let forwarded: readonly string[] | undefined;
  const exitCode = await runSwitchboardCatalogVerifyNative(
    ["--manifest-url", "https://control.example/v1/network-manifest", "--manifest-signer", "5...", "--json"],
    {
      runner: async (argv) => {
        forwarded = [...(argv ?? [])];
      }
    }
  );

  assert.equal(exitCode, 0);
  assert.deepEqual(forwarded, ["--manifest-url", "https://control.example/v1/network-manifest", "--manifest-signer", "5...", "--json"]);
});

test("forwards native gateway setup args to the local Switchboard runner", async () => {
  let forwarded: readonly string[] | undefined;
  const exitCode = await runSwitchboardGatewaySetupNative(["--gateway-id", "switchboard-az-01", "--dry-run", "--json"], {
    runner: async (argv) => {
      forwarded = [...(argv ?? [])];
    }
  });

  assert.equal(exitCode, 0);
  assert.deepEqual(forwarded, ["--gateway-id", "switchboard-az-01", "--dry-run", "--json"]);
});

test("forwards native gateway discover args to the local Switchboard runner", async () => {
  let forwarded: readonly string[] | undefined;
  const exitCode = await runSwitchboardGatewayDiscoverNative(["--manager-id", "9470", "--limit", "3", "--json"], {
    runner: async (argv) => {
      forwarded = [...(argv ?? [])];
    }
  });

  assert.equal(exitCode, 0);
  assert.deepEqual(forwarded, ["--manager-id", "9470", "--limit", "3", "--json"]);
});

test("forwards native gateway status args to the local Switchboard runner", async () => {
  let forwarded: readonly string[] | undefined;
  const exitCode = await runSwitchboardGatewayStatusNative(["--project-dir", "/srv/proof", "--json"], {
    runner: async (argv) => {
      forwarded = [...(argv ?? [])];
    }
  });

  assert.equal(exitCode, 0);
  assert.deepEqual(forwarded, ["--project-dir", "/srv/proof", "--json"]);
});

test("forwards native relay list args to the local Switchboard runner", async () => {
  let forwarded: readonly string[] | undefined;
  const exitCode = await runSwitchboardRelayListNative(["--source", "live", "--json"], {
    runner: async (argv) => {
      forwarded = [...(argv ?? [])];
    }
  });

  assert.equal(exitCode, 0);
  assert.deepEqual(forwarded, ["--source", "live", "--json"]);
});

test("forwards native relay diff args to the local Switchboard runner", async () => {
  let forwarded: readonly string[] | undefined;
  const exitCode = await runSwitchboardRelayDiffNative(
    ["--manifest-url", "https://control.example/v1/network-manifest", "--manifest-signer", "5Signer", "--json"],
    {
      runner: async (argv) => {
        forwarded = [...(argv ?? [])];
      }
    }
  );

  assert.equal(exitCode, 0);
  assert.deepEqual(forwarded, [
    "--manifest-url",
    "https://control.example/v1/network-manifest",
    "--manifest-signer",
    "5Signer",
    "--json"
  ]);
});

test("forwards native relay backfill-specs args to the local Switchboard runner", async () => {
  let forwarded: readonly string[] | undefined;
  const exitCode = await runSwitchboardRelayBackfillSpecsNative(
    ["--target", "acurast", "--manifest-url", "https://control.example/v1/network-manifest", "--dry-run"],
    {
      runner: async (argv) => {
        forwarded = [...(argv ?? [])];
      }
    }
  );

  assert.equal(exitCode, 0);
  assert.deepEqual(forwarded, ["--target", "acurast", "--manifest-url", "https://control.example/v1/network-manifest", "--dry-run"]);
});

test("forwards native relay pick-processor args to the local Switchboard runner", async () => {
  let forwarded: readonly string[] | undefined;
  const exitCode = await runSwitchboardRelayPickProcessorNative(
    ["relay-d", "--pin", "auto", "--exclude", "5FHneW46xGXgs5mUiveU4sbTyGBzmst6m6p4Yc4AG4LQbQ9", "--json"],
    {
      runner: async (argv) => {
        forwarded = [...(argv ?? [])];
      }
    }
  );

  assert.equal(exitCode, 0);
  assert.deepEqual(forwarded, [
    "relay-d",
    "--pin",
    "auto",
    "--exclude",
    "5FHneW46xGXgs5mUiveU4sbTyGBzmst6m6p4Yc4AG4LQbQ9",
    "--json"
  ]);
});

test("forwards native relay logs args to the local Switchboard runner", async () => {
  let forwarded: readonly string[] | undefined;
  const exitCode = await runSwitchboardRelayLogsNative(
    ["relay-d", "--read-url", "https://control.example/v1/log-sinks/sink/events", "--limit", "20", "--json"],
    {
      runner: async (argv) => {
        forwarded = [...(argv ?? [])];
      }
    }
  );

  assert.equal(exitCode, 0);
  assert.deepEqual(forwarded, [
    "relay-d",
    "--read-url",
    "https://control.example/v1/log-sinks/sink/events",
    "--limit",
    "20",
    "--json"
  ]);
});

test("forwards native relay verify args to the local Switchboard runner", async () => {
  let forwarded: readonly string[] | undefined;
  const exitCode = await runSwitchboardRelayVerifyNative(
    ["relay-d", "--manifest-url", "https://control.example/v1/network-manifest", "--manifest-signer", "5Signer"],
    {
      runner: async (argv) => {
        forwarded = [...(argv ?? [])];
      }
    }
  );

  assert.equal(exitCode, 0);
  assert.deepEqual(forwarded, [
    "relay-d",
    "--manifest-url",
    "https://control.example/v1/network-manifest",
    "--manifest-signer",
    "5Signer"
  ]);
});

test("forwards native relay dns plan args to the local Switchboard runner", async () => {
  let forwarded: readonly string[] | undefined;
  const exitCode = await runSwitchboardRelayDnsPlanNative(
    ["relay-d", "--spec", "relays/relay-d.json", "--resolvers", "1.1.1.1,8.8.8.8"],
    {
      runner: async (argv) => {
        forwarded = [...(argv ?? [])];
      }
    }
  );

  assert.equal(exitCode, 0);
  assert.deepEqual(forwarded, ["relay-d", "--spec", "relays/relay-d.json", "--resolvers", "1.1.1.1,8.8.8.8"]);
});

test("forwards native relay dns apply args to the local Switchboard runner", async () => {
  let forwarded: readonly string[] | undefined;
  const exitCode = await runSwitchboardRelayDnsApplyNative(["relay-d", "--spec", "relays/relay-d.json", "--yes"], {
    runner: async (argv) => {
      forwarded = [...(argv ?? [])];
    }
  });

  assert.equal(exitCode, 0);
  assert.deepEqual(forwarded, ["relay-d", "--spec", "relays/relay-d.json", "--yes"]);
});

test("forwards native relay dns verify args to the local Switchboard runner", async () => {
  let forwarded: readonly string[] | undefined;
  const exitCode = await runSwitchboardRelayDnsVerifyNative(
    ["relay-d", "--spec-file", "relays/relay-d.json", "--resolvers", "1.1.1.1,8.8.8.8"],
    {
      runner: async (argv) => {
        forwarded = [...(argv ?? [])];
      }
    }
  );

  assert.equal(exitCode, 0);
  assert.deepEqual(forwarded, ["relay-d", "--spec-file", "relays/relay-d.json", "--resolvers", "1.1.1.1,8.8.8.8"]);
});

test("forwards native relay dns remove args to the local Switchboard runner", async () => {
  let forwarded: readonly string[] | undefined;
  const exitCode = await runSwitchboardRelayDnsRemoveNative(["relay-d", "--spec-file", "relays/relay-d.json", "--yes"], {
    runner: async (argv) => {
      forwarded = [...(argv ?? [])];
    }
  });

  assert.equal(exitCode, 0);
  assert.deepEqual(forwarded, ["relay-d", "--spec-file", "relays/relay-d.json", "--yes"]);
});

test("forwards native relay budget args to the local Switchboard runner", async () => {
  let forwarded: readonly string[] | undefined;
  const exitCode = await runSwitchboardRelayBudgetNative(
    ["7d", "--rate-per-ms", "20000", "--margin-percent", "10", "--update", "relays/relay-d.json", "--json"],
    {
      runner: async (argv) => {
        forwarded = [...(argv ?? [])];
      }
    }
  );

  assert.equal(exitCode, 0);
  assert.deepEqual(forwarded, [
    "7d",
    "--rate-per-ms",
    "20000",
    "--margin-percent",
    "10",
    "--update",
    "relays/relay-d.json",
    "--json"
  ]);
});

test("forwards native relay catalog build args to the local Switchboard runner", async () => {
  let forwarded: readonly string[] | undefined;
  const exitCode = await runSwitchboardRelayCatalogBuildNative(
    ["--specs-dir", "relays", "--output", "service-catalogs.signed.json", "--stdout"],
    {
      runner: async (argv) => {
        forwarded = [...(argv ?? [])];
      }
    }
  );

  assert.equal(exitCode, 0);
  assert.deepEqual(forwarded, ["--specs-dir", "relays", "--output", "service-catalogs.signed.json", "--stdout"]);
});

test("forwards native relay catalog set-state args to the local Switchboard runner", async () => {
  let forwarded: readonly string[] | undefined;
  const exitCode = await runSwitchboardRelayCatalogSetStateNative(
    ["relay-d", "draining", "--catalog-file", "relays/catalog.json", "--no-rebuild"],
    {
      runner: async (argv) => {
        forwarded = [...(argv ?? [])];
      }
    }
  );

  assert.equal(exitCode, 0);
  assert.deepEqual(forwarded, ["relay-d", "draining", "--catalog-file", "relays/catalog.json", "--no-rebuild"]);
});

test("forwards native relay sync args to the local Switchboard runner", async () => {
  let forwarded: readonly string[] | undefined;
  const exitCode = await runSwitchboardRelaySyncNative(
    ["--manifest-url", "https://control.example/v1/network-manifest", "--dry-run"],
    {
      runner: async (argv) => {
        forwarded = [...(argv ?? [])];
      }
    }
  );

  assert.equal(exitCode, 0);
  assert.deepEqual(forwarded, ["--manifest-url", "https://control.example/v1/network-manifest", "--dry-run"]);
});

test("returns nonzero when native relay verify reports failed checks", async () => {
  const exitCode = await withMutedConsoleError(() =>
    runSwitchboardRelayVerifyNative(["relay-d"], {
      runner: async () => {
        throw new Error("relay verify relay-d: 1 check(s) failed");
      }
    })
  );

  assert.equal(exitCode, 1);
});

test("forwards native relay whoami args to the local Switchboard runner", async () => {
  let forwarded: readonly string[] | undefined;
  const exitCode = await runSwitchboardRelayWhoamiNative(["relay-d", "--seed-env", "RELAY_D_SEED", "--json"], {
    runner: async (argv) => {
      forwarded = [...(argv ?? [])];
    }
  });

  assert.equal(exitCode, 0);
  assert.deepEqual(forwarded, ["relay-d", "--seed-env", "RELAY_D_SEED", "--json"]);
});

test("forwards native relay keygen args to the local Switchboard runner", async () => {
  let forwarded: readonly string[] | undefined;
  const exitCode = await runSwitchboardRelayKeygenNative(
    ["relay-d", "--env-name", "CUSTOM_RELAY_KEY", "--unsafe-stdout"],
    {
      runner: async (argv) => {
        forwarded = [...(argv ?? [])];
      }
    }
  );

  assert.equal(exitCode, 0);
  assert.deepEqual(forwarded, ["relay-d", "--env-name", "CUSTOM_RELAY_KEY", "--unsafe-stdout"]);
});

test("forwards native relay scaffold args to the local Switchboard runner", async () => {
  let forwarded: readonly string[] | undefined;
  const exitCode = await runSwitchboardRelayScaffoldNative(
    [
      "relay-d",
      "--target",
      "acurast",
      "--manager-id",
      "9470",
      "--duration",
      "7d",
      "--keygen"
    ],
    {
      runner: async (argv) => {
        forwarded = [...(argv ?? [])];
      }
    }
  );

  assert.equal(exitCode, 0);
  assert.deepEqual(forwarded, ["relay-d", "--target", "acurast", "--manager-id", "9470", "--duration", "7d", "--keygen"]);
});

test("forwards native relay status args to the local Switchboard runner", async () => {
  let forwarded: readonly string[] | undefined;
  const exitCode = await runSwitchboardRelayStatusNative(
    ["relay-a", "--catalog-file", "relays/catalog.json", "--timeout-ms", "250"],
    {
      runner: async (argv) => {
        forwarded = [...(argv ?? [])];
      }
    }
  );

  assert.equal(exitCode, 0);
  assert.deepEqual(forwarded, ["relay-a", "--catalog-file", "relays/catalog.json", "--timeout-ms", "250"]);
});

test("forwards native relay watch args to the local Switchboard runner", async () => {
  let forwarded: readonly string[] | undefined;
  const exitCode = await runSwitchboardRelayWatchNative(
    ["relay-d", "--max-runs", "3", "--interval-ms", "5000"],
    {
      runner: async (argv) => {
        forwarded = [...(argv ?? [])];
      }
    }
  );

  assert.equal(exitCode, 0);
  assert.deepEqual(forwarded, ["relay-d", "--max-runs", "3", "--interval-ms", "5000"]);
});

test("forwards native gateway upgrade args to the local Switchboard runner", async () => {
  let forwarded: readonly string[] | undefined;
  const exitCode = await runSwitchboardGatewayUpgradeNative(["--yes", "--dry-run"], {
    runner: async (argv) => {
      forwarded = [...(argv ?? [])];
    }
  });

  assert.equal(exitCode, 0);
  assert.deepEqual(forwarded, ["--yes", "--dry-run"]);
});

test("forwards native claimable args to the local Switchboard runner", async () => {
  let forwarded: readonly string[] | undefined;
  const exitCode = await runSwitchboardClaimableNative(["--json", "--recipient", "0x0000000000000000000000000000000000000001"], {
    runner: async (argv) => {
      forwarded = [...(argv ?? [])];
    }
  });

  assert.equal(exitCode, 0);
  assert.deepEqual(forwarded, ["--json", "--recipient", "0x0000000000000000000000000000000000000001"]);
});

test("forwards native claim args to the local Switchboard runner", async () => {
  let forwarded: readonly string[] | undefined;
  const exitCode = await runSwitchboardClaimNative(["--yes", "--claim-private-key-env", "OPERATOR_CLAIM_PRIVATE_KEY"], {
    runner: async (argv) => {
      forwarded = [...(argv ?? [])];
    }
  });

  assert.equal(exitCode, 0);
  assert.deepEqual(forwarded, ["--yes", "--claim-private-key-env", "OPERATOR_CLAIM_PRIVATE_KEY"]);
});

test("forwards native refundable args to the local Switchboard runner", async () => {
  let forwarded: readonly string[] | undefined;
  const exitCode = await runSwitchboardRefundableNative(["--json", "--session-id", `0x${"11".repeat(32)}`], {
    runner: async (argv) => {
      forwarded = [...(argv ?? [])];
    }
  });

  assert.equal(exitCode, 0);
  assert.deepEqual(forwarded, ["--json", "--session-id", `0x${"11".repeat(32)}`]);
});

test("forwards native session refundable args to the local Switchboard runner", async () => {
  let forwarded: readonly string[] | undefined;
  const exitCode = await runSwitchboardSessionRefundableNative(["--json", "--session-id", `0x${"11".repeat(32)}`], {
    runner: async (argv) => {
      forwarded = [...(argv ?? [])];
    }
  });

  assert.equal(exitCode, 0);
  assert.deepEqual(forwarded, ["--json", "--session-id", `0x${"11".repeat(32)}`]);
});

test("forwards native refund args to the local Switchboard runner", async () => {
  let forwarded: readonly string[] | undefined;
  const exitCode = await runSwitchboardRefundNative(["--yes", "--session-id", `0x${"11".repeat(32)}`], {
    runner: async (argv) => {
      forwarded = [...(argv ?? [])];
    }
  });

  assert.equal(exitCode, 0);
  assert.deepEqual(forwarded, ["--yes", "--session-id", `0x${"11".repeat(32)}`]);
});

test("forwards native session refund args to the local Switchboard runner", async () => {
  let forwarded: readonly string[] | undefined;
  const exitCode = await runSwitchboardSessionRefundNative(["--yes", "--session-id", `0x${"11".repeat(32)}`], {
    runner: async (argv) => {
      forwarded = [...(argv ?? [])];
    }
  });

  assert.equal(exitCode, 0);
  assert.deepEqual(forwarded, ["--yes", "--session-id", `0x${"11".repeat(32)}`]);
});

test("forwards native context list args to the local Switchboard runner", async () => {
  let forwarded: readonly string[] | undefined;
  const exitCode = await runSwitchboardContextListNative(["--json", "--project-dir", "./app"], {
    runner: async (argv) => {
      forwarded = [...(argv ?? [])];
    }
  });

  assert.equal(exitCode, 0);
  assert.deepEqual(forwarded, ["--json", "--project-dir", "./app"]);
});

test("forwards native context current args to the local Switchboard runner", async () => {
  let forwarded: readonly string[] | undefined;
  const exitCode = await runSwitchboardContextCurrentNative(["--json", "--context", "mainnet"], {
    runner: async (argv) => {
      forwarded = [...(argv ?? [])];
    }
  });

  assert.equal(exitCode, 0);
  assert.deepEqual(forwarded, ["--json", "--context", "mainnet"]);
});

test("forwards native context use args to the local Switchboard runner", async () => {
  let forwarded: readonly string[] | undefined;
  const exitCode = await runSwitchboardContextUseNative(["mainnet", "--json"], {
    runner: async (argv) => {
      forwarded = [...(argv ?? [])];
    }
  });

  assert.equal(exitCode, 0);
  assert.deepEqual(forwarded, ["mainnet", "--json"]);
});

test("forwards native context set args to the local Switchboard runner", async () => {
  let forwarded: readonly string[] | undefined;
  const exitCode = await runSwitchboardContextSetNative(["mainnet", "--relay-url", "https://relay.example", "--json"], {
    runner: async (argv) => {
      forwarded = [...(argv ?? [])];
    }
  });

  assert.equal(exitCode, 0);
  assert.deepEqual(forwarded, ["mainnet", "--relay-url", "https://relay.example", "--json"]);
});

test("forwards native context add args to the local Switchboard runner", async () => {
  let forwarded: readonly string[] | undefined;
  const exitCode = await runSwitchboardContextAddNative(["mainnet", "--no-balance-check"], {
    runner: async (argv) => {
      forwarded = [...(argv ?? [])];
    }
  });

  assert.equal(exitCode, 0);
  assert.deepEqual(forwarded, ["mainnet", "--no-balance-check"]);
});

test("forwards native context dns set args to the local Switchboard runner", async () => {
  let forwarded: readonly string[] | undefined;
  const exitCode = await runSwitchboardContextDnsSetNative(["cloudflare", "--token-env", "CF_TOKEN_PROD", "--json"], {
    runner: async (argv) => {
      forwarded = [...(argv ?? [])];
    }
  });

  assert.equal(exitCode, 0);
  assert.deepEqual(forwarded, ["cloudflare", "--token-env", "CF_TOKEN_PROD", "--json"]);
});

test("forwards native context dns clear args to the local Switchboard runner", async () => {
  let forwarded: readonly string[] | undefined;
  const exitCode = await runSwitchboardContextDnsClearNative(["cloudflare", "--context", "mainnet", "--json"], {
    runner: async (argv) => {
      forwarded = [...(argv ?? [])];
    }
  });

  assert.equal(exitCode, 0);
  assert.deepEqual(forwarded, ["cloudflare", "--context", "mainnet", "--json"]);
});

test("forwards native deploy args to the local Switchboard runner", async () => {
  let forwarded: readonly string[] | undefined;
  const exitCode = await runSwitchboardDeployNative(["--entrypoint", "src/index.ts", "--dry-run", "--json"], {
    runner: async (argv) => {
      forwarded = [...(argv ?? [])];
    }
  });

  assert.equal(exitCode, 0);
  assert.deepEqual(forwarded, ["--entrypoint", "src/index.ts", "--dry-run", "--json"]);
});

test("emits native deploy progress from proof runner events", async () => {
  const captured = await captureConsole(async () => runSwitchboardDeployNative([
    "--entrypoint",
    "src/index.ts",
    "--processor",
    "5GrwvaEF5zXb26Fz9rcQpDWSXg7yFRqXBnhJUjqbkNbA",
    "--relay-url",
    "https://relay.example.test",
    "--yes"
  ], {
    runner: async (_argv, options) => {
      options?.progress?.({ type: "run-context", workflowId: "wf_deploy", relayUrl: "https://relay.example.test" });
      options?.progress?.({ type: "wait", step: "capacity_selection", detail: "checking operator capacity" });
      options?.progress?.({ type: "workflow", event: "capacity_selected", details: { processor: "5GrwvaEF5zXb26Fz9rcQpDWSXg7yFRqXBnhJUjqbkNbA" } });
      options?.progress?.({ type: "workflow", event: "intent_created", details: { intentId: "di_deploy" } });
      options?.progress?.({ type: "acurast-sdk", sdkStatus: "Uploaded", data: { ipfsHash: "bafydeploy" } });
      options?.progress?.({
        type: "acurast-sdk",
        sdkStatus: "Prepared",
        data: {
          job: {
            extra: { requirements: { slots: 1 } },
            schedule: {
              startTime: 1_779_019_200_000,
              maxStartDelay: 300_000
            }
          }
        }
      });
      options?.progress?.({
        type: "acurast-sdk",
        sdkStatus: "Prepared",
        data: {
          job: {
            extra: { requirements: { slots: 1 } },
            schedule: {
              startTime: 1_779_019_200_000,
              maxStartDelay: 300_000
            }
          }
        }
      });
      options?.progress?.({ type: "acurast-sdk", sdkStatus: "Submit", data: { txHash: "0xdeploy" } });
      options?.progress?.({ type: "workflow", event: "deploy_action_submitted", details: { deploymentId: "59420" } });
      options?.progress?.({ type: "wait", step: "relay_readback", detail: "GET /v1/deployment-intents/:id returned 502; retrying 2/4" });
      options?.progress?.({ type: "workflow", event: "runtime_claimed", details: { runtimeSigner: `0x${"11".repeat(32)}` } });
      options?.progress?.({ type: "workflow", event: "quote_ready", details: { sessionId: `0x${"22".repeat(32)}` } });
      options?.progress?.({ type: "workflow", event: "funding_submitted", details: { txHash: "0xfund" } });
      options?.progress?.({ type: "workflow", event: "dns_propagated", details: { hostname: "e-deploy.example.test" } });
      options?.progress?.({ type: "workflow", event: "route_active", details: { hostname: "e-deploy.example.test" } });
      options?.progress?.({ type: "workflow", event: "registration_observed", details: { sessionId: `0x${"22".repeat(32)}` } });
      options?.progress?.({ type: "workflow", event: "validation_observed", details: { reports: [{ ok: true }] } });
      options?.progress?.({ type: "report", path: "/tmp/switchboard-deploy-report.json" });
    }
  }));

  assert.equal(captured.result, 0);
  assert.match(captured.stdout, /Deployment progress/);
  assert.match(captured.stdout, /Switchboard Runner/);
  assert.match(captured.stdout, /Run context/);
  assert.match(captured.stdout, /\[\.\.\] Capacity selection: checking operator capacity/);
  assert.match(captured.stdout, /Selected processor/);
  assert.match(captured.stdout, /\[ok\] Selected processor: 5GrwvaEF\.\.\.qbkNbA/);
  assert.match(captured.stdout, /\[ok\] Deployment intent: di_deploy/);
  assert.match(captured.stdout, /Acurast SDK uploaded code/);
  assert.match(captured.stdout, /Acurast SDK prepared job/);
  assert.match(captured.stdout, /start=2026-05-17T12:00:00\.000Z/);
  assert.match(captured.stdout, /max-start=2026-05-17T12:05:00\.000Z/);
  assert.match(captured.stdout, /Acurast SDK submitted extrinsic/);
  assert.match(captured.stdout, /Submitted to Acurast/);
  assert.match(captured.stdout, /Relay readback/);
  assert.match(captured.stdout, /Job claimed runtime/);
  assert.match(captured.stdout, /Quote ready/);
  assert.match(captured.stdout, /Funded Hub session/);
  assert.match(captured.stdout, /DNS propagated/);
  assert.match(captured.stdout, /Activated route/);
  assert.match(captured.stdout, /Registered on Hub/);
  assert.match(captured.stdout, /Validation observed/);
  assert.match(captured.stdout, /Wrote deployment report/);
  assert.doesNotMatch(captured.stdout, /waiting for capacity selection/);
  assert.doesNotMatch(captured.stdout, /pending relay allocation/);
  assert.doesNotMatch(captured.stdout, /\[info\] Deployment intent(?:\n|$)/);
  assert.equal(matchCount(captured.stdout, /Acurast SDK prepared job/g), 1);
  assertTextOrder(captured.stdout, "Capacity selection", "Selected processor");
  assertTextOrder(captured.stdout, "Selected processor", "Deployment intent: di_deploy");
  assertTextOrder(captured.stdout, "Deployment intent: di_deploy", "Acurast SDK uploaded code");
  assert.match(captured.stdout, /\n\nAcurast deployer\n  \[ok\] Acurast SDK uploaded code:/);
  assert.match(captured.stdout, /\n\nSwitchboard Runner\n  \[\.\.\] Relay readback:/);
  assert.match(captured.stdout, /\n\nReport\n  \[ok\] Wrote deployment report:/);
});

test("restores colored native deploy progress headers and markers", async () => {
  const captured = await withProcessEnv({
    FORCE_COLOR: undefined,
    NO_COLOR: undefined,
    SWITCHBOARD_COLOR: "1",
    SWITCHBOARD_DEPLOY_COLOR: undefined,
    TERM: "xterm-256color"
  }, () => captureConsole(async () => runSwitchboardDeployNative([
    "--entrypoint",
    "src/index.ts",
    "--processor",
    "5GrwvaEF5zXb26Fz9rcQpDWSXg7yFRqXBnhJUjqbkNbA",
    "--yes"
  ], {
    runner: async (_argv, options) => {
      options?.progress?.({ type: "report", path: "/tmp/switchboard-deploy-report.json" });
    }
  })));

  assert.equal(captured.result, 0);
  assert.match(captured.stdout, /\u001b\[38;2;255;106;44m/);
  assert.match(captured.stdout, /Switchboard Runner/);
  assert.match(captured.stdout, /\u001b\[32m\[ok\]\u001b\[0m/);
});

test("keeps native deploy json output free of progress text", async () => {
  const captured = await captureConsole(async () => runSwitchboardDeployNative(["--entrypoint", "src/index.ts", "--yes", "--json"], {
    runner: async (_argv, options) => {
      options?.progress?.({ type: "line", label: "Deployment progress" });
      options?.progress?.({ type: "line", section: "Acurast deployer", label: "Acurast SDK uploaded code", detail: "bafy" });
      options?.progress?.({ type: "wait", step: "relay_readback", detail: "GET /v1/deployment-intents/:id returned 502; retrying 2/4" });
      console.log(JSON.stringify({ ok: true, action: "deploy" }));
    }
  }));

  assert.equal(captured.result, 0);
  assert.doesNotMatch(captured.stdout, /Deployment progress/);
  assert.doesNotMatch(captured.stdout, /Acurast deployer/);
  assert.doesNotMatch(captured.stdout, /Relay readback/);
  assert.deepEqual(JSON.parse(captured.stdout), { ok: true, action: "deploy" });
});

test("retries transient deployment intent readback responses", async () => {
  const statuses = [502, 502, 200];
  const progressDetails: string[] = [];
  let calls = 0;
  const retryFetch = createDeployWorkflowReadbackRetryFetch({
    fetchImpl: async () => {
      const status = statuses[calls] ?? 200;
      calls += 1;
      return new Response(status === 200 ? JSON.stringify({ ok: true }) : "", { status });
    },
    progress: (event) => {
      if (event.type === "wait" && event.step === "relay_readback" && event.detail) {
        progressDetails.push(event.detail);
      }
    },
    sleep: async () => {}
  });

  const response = await retryFetch(new URL("https://relay.example.test/v1/deployment-intents/di_test"), { method: "GET" });

  assert.equal(response.status, 200);
  assert.equal(calls, 3);
  assert.deepEqual(progressDetails, [
    "GET /v1/deployment-intents/:id returned 502; retrying 2/4",
    "GET /v1/deployment-intents/:id returned 502; retrying 3/4"
  ]);
});

test("retries transient deployment intent group readback responses", async () => {
  let calls = 0;
  const retryFetch = createDeployWorkflowReadbackRetryFetch({
    fetchImpl: async () => {
      calls += 1;
      return new Response(JSON.stringify({ ok: true }), { status: calls === 1 ? 503 : 200 });
    },
    sleep: async () => {}
  });

  const response = await retryFetch(new URL("https://relay.example.test/v1/deployment-intent-groups/dig_test"), { method: "GET" });

  assert.equal(response.status, 200);
  assert.equal(calls, 2);
});

test("does not retry deployment workflow write requests", async () => {
  let calls = 0;
  const retryFetch = createDeployWorkflowReadbackRetryFetch({
    fetchImpl: async () => {
      calls += 1;
      return new Response("", { status: 502 });
    },
    sleep: async () => {}
  });

  const response = await retryFetch(new URL("https://relay.example.test/v1/deployment-intents/di_test/quote"), { method: "POST" });

  assert.equal(response.status, 502);
  assert.equal(calls, 1);
});

test("fails deployment intent readback after bounded retries", async () => {
  let calls = 0;
  const retryFetch = createDeployWorkflowReadbackRetryFetch({
    fetchImpl: async () => {
      calls += 1;
      return new Response("", { status: 502 });
    },
    sleep: async () => {}
  });

  await assert.rejects(
    () => retryFetch(new URL("https://relay.example.test/v1/deployment-intents/di_test"), { method: "GET" }),
    /Relay readback failed after 4 attempts: GET \/v1\/deployment-intents\/:id returned 502/
  );
  assert.equal(calls, 4);
});

test("forwards native launch-demo args to the local Switchboard runner", async () => {
  let forwarded: readonly string[] | undefined;
  const exitCode = await runSwitchboardLaunchDemoNative(["--dry-run", "--json"], {
    runner: async (argv) => {
      forwarded = [...(argv ?? [])];
    }
  });

  assert.equal(exitCode, 0);
  assert.deepEqual(forwarded, ["--dry-run", "--json"]);
});

test("keeps native launch-demo json output free of progress text", async () => {
  const captured = await captureConsole(async () => runSwitchboardLaunchDemoNative(["--yes-spend", "--json"], {
    runner: async (_argv, options) => {
      options?.progress?.({ type: "line", label: "Deployment progress" });
      options?.progress?.({ type: "line", section: "Demo project", status: "warn", label: "npm", detail: "deprecated package" });
      options?.progress?.({ type: "wait", step: "relay_readback", detail: "GET /v1/deployment-intents/:id returned 503; retrying 2/4" });
      console.log(JSON.stringify({ ok: true, action: "launch-demo" }));
    }
  }));

  assert.equal(captured.result, 0);
  assert.doesNotMatch(captured.stdout, /Deployment progress/);
  assert.doesNotMatch(captured.stdout, /Demo project/);
  assert.doesNotMatch(captured.stdout, /npm/);
  assert.doesNotMatch(captured.stdout, /Relay readback/);
  assert.deepEqual(JSON.parse(captured.stdout), { ok: true, action: "launch-demo" });
});

test("emits native launch-demo progress from proof runner events", async () => {
  const captured = await captureConsole(async () => runSwitchboardLaunchDemoNative([
    "--processor",
    "5GrwvaEF5zXb26Fz9rcQpDWSXg7yFRqXBnhJUjqbkNbA",
    "--yes-spend"
  ], {
    runner: async (_argv, options) => {
      options?.progress?.({ type: "line", section: "Demo project", status: "wait", label: "Dependencies", detail: "installing demo package" });
      options?.progress?.({ type: "line", section: "Demo project", status: "warn", label: "npm", detail: "deprecated package" });
      options?.progress?.({ type: "line", section: "Demo project", status: "ok", label: "Dependencies", detail: "installed added 24 packages in 2s" });
      options?.progress?.({ type: "line", section: "Switchboard demo", label: "Demo package", detail: "github:proof-computer/switchboard-express-demo#v0.2.0" });
      options?.progress?.({ type: "wait", step: "capacity_selection", detail: "checking operator capacity" });
      options?.progress?.({ type: "workflow", event: "capacity_selected", details: { processor: "5GrwvaEF5zXb26Fz9rcQpDWSXg7yFRqXBnhJUjqbkNbA" } });
      options?.progress?.({ type: "workflow", event: "intent_created", details: { intentId: "di_demo" } });
      options?.progress?.({ type: "acurast-sdk", sdkStatus: "Uploaded", data: { ipfsHash: "bafydemo" } });
      options?.progress?.({ type: "workflow", event: "deploy_action_submitted", details: { deploymentId: "59421" } });
      options?.progress?.({ type: "workflow", event: "runtime_claimed", details: { runtimeSigner: `0x${"33".repeat(32)}` } });
      options?.progress?.({ type: "workflow", event: "quote_ready", details: { endpointHostname: "e-demo.example.test" } });
      options?.progress?.({ type: "workflow", event: "funding_submitted", details: { txHash: "0xfund" } });
      options?.progress?.({ type: "workflow", event: "dns_propagated", details: { hostname: "e-demo.example.test" } });
      options?.progress?.({ type: "workflow", event: "route_active", details: { hostname: "e-demo.example.test" } });
      options?.progress?.({ type: "workflow", event: "registration_observed", details: { sessionId: `0x${"44".repeat(32)}` } });
      options?.progress?.({ type: "workflow", event: "validation_observed", details: { reports: [{ ok: true }] } });
      options?.progress?.({ type: "report", path: "/tmp/switchboard-launch-demo-report.json" });
    }
  }));

  assert.equal(captured.result, 0);
  assert.match(captured.stdout, /Deployment progress/);
  assert.match(captured.stdout, /\n\nDemo project\n  \[\.\.\] Dependencies: installing demo package/);
  assert.match(captured.stdout, /\[warn\] npm: deprecated package/);
  assert.match(captured.stdout, /\n\nSwitchboard demo\n  \[info\] Demo package:/);
  assert.match(captured.stdout, /\[\.\.\] Capacity selection: checking operator capacity/);
  assert.match(captured.stdout, /\[ok\] Selected processor: 5GrwvaEF\.\.\.qbkNbA/);
  assert.match(captured.stdout, /\[ok\] Deployment intent: di_demo/);
  assert.match(captured.stdout, /Acurast SDK uploaded code/);
  assert.match(captured.stdout, /Submitted to Acurast/);
  assert.match(captured.stdout, /Job claimed runtime/);
  assert.match(captured.stdout, /Quote ready/);
  assert.match(captured.stdout, /Funded Hub session/);
  assert.match(captured.stdout, /DNS propagated/);
  assert.match(captured.stdout, /Activated route/);
  assert.match(captured.stdout, /Registered on Hub/);
  assert.match(captured.stdout, /Validation observed/);
  assert.match(captured.stdout, /Wrote deployment report/);
  assert.doesNotMatch(captured.stdout, /waiting for capacity selection/);
  assert.doesNotMatch(captured.stdout, /pending relay allocation/);
  assertTextOrder(captured.stdout, "Capacity selection", "Selected processor");
  assertTextOrder(captured.stdout, "Selected processor", "Deployment intent: di_demo");
});

test("emits HA launch-demo group progress and reports acurast-sdk submit", async () => {
  const captured = await captureConsole(async () => runSwitchboardLaunchDemoNative([
    "--ha",
    "--processor-count",
    "2",
    "--min-ready",
    "2",
    "--yes-spend"
  ], {
    runner: async (_argv, options) => {
      options?.progress?.({ type: "wait", step: "capacity_selection", detail: "checking operator capacity" });
      options?.progress?.({
        type: "selected-processors",
        processors: [
          "5GrwvaEF5zXb26Fz9rcQpDWSXg7yFRqXBnhJUjqbkNbA",
          "5FHneW46xGXgs5mUiveU4sbTyGBzmstjXEuFfU1R6spqsGJp"
        ],
        replicas: 2,
        minReady: 2
      });
      options?.progress?.({ type: "workflow", event: "intent_group_created", details: { groupId: "dig_demo_ha", expectedReplicas: 2, minReady: 2 } });
      options?.progress?.({
        type: "acurast-sdk",
        sdkStatus: "Prepared",
        data: {
          job: {
            extra: { requirements: { slots: 2 } },
            schedule: {
              startTime: 1_779_019_200_000,
              maxStartDelay: 300_000
            }
          }
        }
      });
      options?.progress?.({
        type: "acurast-sdk",
        sdkStatus: "Prepared",
        data: {
          job: {
            extra: { requirements: { slots: 2 } },
            schedule: {
              startTime: 1_779_019_200_000,
              maxStartDelay: 300_000
            }
          }
        }
      });
      options?.progress?.({ type: "workflow", event: "group_deploy_submitted", details: { deploymentId: "59422", adapter: "acurast-sdk" } });
      options?.progress?.({ type: "workflow", event: "group_runtime_claimed", details: { claimedMembers: 2, minReady: 2 } });
      options?.progress?.({ type: "workflow", event: "group_quote_ready", details: { quotedMembers: 2, minReady: 2 } });
      options?.progress?.({ type: "workflow", event: "group_funding_submitted", details: { fundedMembers: 2, minReady: 2 } });
      options?.progress?.({ type: "workflow", event: "group_dns_propagated", details: { readyMembers: 2, minReady: 2 } });
      options?.progress?.({ type: "workflow", event: "group_route_active", details: { activeMembers: 2, minReady: 2 } });
      options?.progress?.({ type: "workflow", event: "group_registration_observed", details: { registeredMembers: 2, minReady: 2 } });
      options?.progress?.({ type: "workflow", event: "group_validation_observed", details: { validatedMembers: 2, minReady: 2 } });
      options?.progress?.({ type: "report", path: "/tmp/switchboard-launch-demo-ha-report.json" });
    }
  }));

  assert.equal(captured.result, 0);
  assert.match(captured.stdout, /Deployment progress/);
  assert.match(captured.stdout, /\[\.\.\] Capacity selection: checking operator capacity/);
  assert.match(captured.stdout, /\[ok\] Selected processors:/);
  assert.match(captured.stdout, /\[ok\] Deployment intent group: dig_demo_ha replicas=2 min-ready=2/);
  assert.match(captured.stdout, /Acurast SDK prepared job/);
  assert.match(captured.stdout, /replicas=2/);
  assert.match(captured.stdout, /start=2026-05-17T12:00:00\.000Z/);
  assert.match(captured.stdout, /max-start=2026-05-17T12:05:00\.000Z/);
  assert.match(captured.stdout, /Submitted to Acurast/);
  assert.match(captured.stdout, /adapter=acurast-sdk/);
  assert.match(captured.stdout, /Runtime claims reached min-ready/);
  assert.match(captured.stdout, /Quote ready/);
  assert.match(captured.stdout, /Funded Hub session/);
  assert.match(captured.stdout, /DNS propagated/);
  assert.match(captured.stdout, /Activated route/);
  assert.match(captured.stdout, /Registered on Hub/);
  assert.match(captured.stdout, /Validation observed/);
  assert.match(captured.stdout, /Wrote deployment report/);
  assert.doesNotMatch(captured.stdout, /pending relay allocation/);
  assert.equal(matchCount(captured.stdout, /Acurast SDK prepared job/g), 1);
  assertTextOrder(captured.stdout, "Capacity selection", "Selected processors");
  assertTextOrder(captured.stdout, "Selected processors", "Deployment intent group: dig_demo_ha");
});

test("keeps HA launch-demo json output free of progress text", async () => {
  const captured = await captureConsole(async () => runSwitchboardLaunchDemoNative(["--ha", "--yes-spend", "--json"], {
    runner: async (_argv, options) => {
      options?.progress?.({ type: "line", section: "Demo project", status: "warn", label: "npm", detail: "deprecated package" });
      options?.progress?.({ type: "workflow", event: "intent_group_created", details: { groupId: "dig_json", expectedReplicas: 2, minReady: 2 } });
      options?.progress?.({ type: "wait", step: "relay_readback", detail: "GET /v1/deployment-intent-groups/:id returned 504; retrying 2/4" });
      console.log(JSON.stringify({ ok: true, action: "launch-demo-ha" }));
    }
  }));

  assert.equal(captured.result, 0);
  assert.doesNotMatch(captured.stdout, /Deployment progress/);
  assert.doesNotMatch(captured.stdout, /Demo project/);
  assert.doesNotMatch(captured.stdout, /Deployment intent group/);
  assert.doesNotMatch(captured.stdout, /Relay readback/);
  assert.deepEqual(JSON.parse(captured.stdout), { ok: true, action: "launch-demo-ha" });
});

test("forwards native bootstrap args to the local Switchboard runner", async () => {
  let forwarded: readonly string[] | undefined;
  const exitCode = await runSwitchboardBootstrapNative(["host", "status", "--profile", "mainnet"], {
    runner: async (argv) => {
      forwarded = [...(argv ?? [])];
    }
  });

  assert.equal(exitCode, 0);
  assert.deepEqual(forwarded, ["host", "status", "--profile", "mainnet"]);
});

test("forwards native ops args to the local Switchboard runner", async () => {
  let forwarded: readonly string[] | undefined;
  const exitCode = await runSwitchboardOpsNative(["init", "--profile", "mainnet", "--force"], {
    runner: async (argv) => {
      forwarded = [...(argv ?? [])];
    }
  });

  assert.equal(exitCode, 0);
  assert.deepEqual(forwarded, ["init", "--profile", "mainnet", "--force"]);
});

function runPluginCommand(args: readonly string[]) {
  return spawnSync(
    process.execPath,
    [
      "--import",
      "tsx",
      "--eval",
      `const {default: Switchboard} = await import(${JSON.stringify(commandUrl)}); await Switchboard.run(${JSON.stringify(args)});`
    ],
    {
      cwd: repoRoot,
      encoding: "utf8",
      env: {
        ...process.env,
        NODE_ENV: "test"
      }
    }
  );
}

function sourceGuardFiles(paths: readonly string[]): string[] {
  const files: string[] = [];
  for (const candidate of paths) {
    if (!existsSync(candidate)) continue;
    const info = statSync(candidate);
    if (info.isDirectory()) {
      for (const entry of readdirSync(candidate)) {
        files.push(...sourceGuardFiles([path.join(candidate, entry)]));
      }
    } else if (info.isFile() && /\.(?:ts|json|md|ya?ml)$/.test(candidate)) {
      files.push(candidate);
    }
  }
  return files;
}

function runCatalogBuildCommand(args: readonly string[]) {
  return spawnSync(
    process.execPath,
    [
      "--import",
      "tsx",
      "--eval",
      `const {default: SwitchboardCatalogBuild} = await import(${JSON.stringify(catalogBuildCommandUrl)}); await SwitchboardCatalogBuild.run(${JSON.stringify(args)});`
    ],
    {
      cwd: repoRoot,
      encoding: "utf8",
      env: {
        ...process.env,
        NODE_ENV: "test"
      }
    }
  );
}

function runCatalogSetStateCommand(args: readonly string[]) {
  return spawnSync(
    process.execPath,
    [
      "--import",
      "tsx",
      "--eval",
      `const {default: SwitchboardCatalogSetState} = await import(${JSON.stringify(catalogSetStateCommandUrl)}); await SwitchboardCatalogSetState.run(${JSON.stringify(args)});`
    ],
    {
      cwd: repoRoot,
      encoding: "utf8",
      env: {
        ...process.env,
        NODE_ENV: "test"
      }
    }
  );
}

function runCatalogInspectCommand(args: readonly string[]) {
  return spawnSync(
    process.execPath,
    [
      "--import",
      "tsx",
      "--eval",
      `const {default: SwitchboardCatalogInspect} = await import(${JSON.stringify(catalogInspectCommandUrl)}); await SwitchboardCatalogInspect.run(${JSON.stringify(args)});`
    ],
    {
      cwd: repoRoot,
      encoding: "utf8",
      env: {
        ...process.env,
        NODE_ENV: "test"
      }
    }
  );
}

function runCatalogVerifyCommand(args: readonly string[]) {
  return spawnSync(
    process.execPath,
    [
      "--import",
      "tsx",
      "--eval",
      `const {default: SwitchboardCatalogVerify} = await import(${JSON.stringify(catalogVerifyCommandUrl)}); await SwitchboardCatalogVerify.run(${JSON.stringify(args)});`
    ],
    {
      cwd: repoRoot,
      encoding: "utf8",
      env: {
        ...process.env,
        NODE_ENV: "test"
      }
    }
  );
}

function runBootstrapCommand(args: readonly string[]) {
  return spawnSync(
    process.execPath,
    [
      "--import",
      "tsx",
      "--eval",
      `const {default: SwitchboardBootstrap} = await import(${JSON.stringify(bootstrapCommandUrl)}); await SwitchboardBootstrap.run(${JSON.stringify(args)});`
    ],
    {
      cwd: repoRoot,
      encoding: "utf8",
      env: {
        ...process.env,
        NODE_ENV: "test"
      }
    }
  );
}

function runDeployCommand(args: readonly string[]) {
  return spawnSync(
    process.execPath,
    [
      "--import",
      "tsx",
      "--eval",
      `const {default: SwitchboardDeploy} = await import(${JSON.stringify(deployCommandUrl)}); await SwitchboardDeploy.run(${JSON.stringify(args)});`
    ],
    {
      cwd: repoRoot,
      encoding: "utf8",
      env: {
        ...process.env,
        NODE_ENV: "test"
      }
    }
  );
}

function runOpsCommand(args: readonly string[]) {
  return spawnSync(
    process.execPath,
    [
      "--import",
      "tsx",
      "--eval",
      `const {default: SwitchboardOps} = await import(${JSON.stringify(opsCommandUrl)}); await SwitchboardOps.run(${JSON.stringify(args)});`
    ],
    {
      cwd: repoRoot,
      encoding: "utf8",
      env: {
        ...process.env,
        NODE_ENV: "test"
      }
    }
  );
}

function runClaimableCommand(args: readonly string[]) {
  return spawnSync(
    process.execPath,
    [
      "--import",
      "tsx",
      "--eval",
      `const {default: SwitchboardClaimable} = await import(${JSON.stringify(claimableCommandUrl)}); await SwitchboardClaimable.run(${JSON.stringify(args)});`
    ],
    {
      cwd: repoRoot,
      encoding: "utf8",
      env: {
        ...process.env,
        NODE_ENV: "test"
      }
    }
  );
}

function runClaimCommand(args: readonly string[]) {
  return spawnSync(
    process.execPath,
    [
      "--import",
      "tsx",
      "--eval",
      `const {default: SwitchboardClaim} = await import(${JSON.stringify(claimCommandUrl)}); await SwitchboardClaim.run(${JSON.stringify(args)});`
    ],
    {
      cwd: repoRoot,
      encoding: "utf8",
      env: {
        ...process.env,
        NODE_ENV: "test"
      }
    }
  );
}

function runRefundableCommand(args: readonly string[]) {
  return spawnSync(
    process.execPath,
    [
      "--import",
      "tsx",
      "--eval",
      `const {default: SwitchboardRefundable} = await import(${JSON.stringify(refundableCommandUrl)}); await SwitchboardRefundable.run(${JSON.stringify(args)});`
    ],
    {
      cwd: repoRoot,
      encoding: "utf8",
      env: {
        ...process.env,
        NODE_ENV: "test"
      }
    }
  );
}

function runSessionRefundableCommand(args: readonly string[]) {
  return spawnSync(
    process.execPath,
    [
      "--import",
      "tsx",
      "--eval",
      `const {default: SwitchboardSessionRefundable} = await import(${JSON.stringify(sessionRefundableCommandUrl)}); await SwitchboardSessionRefundable.run(${JSON.stringify(args)});`
    ],
    {
      cwd: repoRoot,
      encoding: "utf8",
      env: {
        ...process.env,
        NODE_ENV: "test"
      }
    }
  );
}

function runRefundCommand(args: readonly string[]) {
  return spawnSync(
    process.execPath,
    [
      "--import",
      "tsx",
      "--eval",
      `const {default: SwitchboardRefund} = await import(${JSON.stringify(refundCommandUrl)}); await SwitchboardRefund.run(${JSON.stringify(args)});`
    ],
    {
      cwd: repoRoot,
      encoding: "utf8",
      env: {
        ...process.env,
        NODE_ENV: "test"
      }
    }
  );
}

function runSessionRegisterCommand(args: readonly string[]) {
  return spawnSync(
    process.execPath,
    [
      "--import",
      "tsx",
      "--eval",
      `const {default: SwitchboardSessionRegister} = await import(${JSON.stringify(sessionRegisterCommandUrl)}); await SwitchboardSessionRegister.run(${JSON.stringify(args)});`
    ],
    {
      cwd: repoRoot,
      encoding: "utf8",
      env: {
        ...process.env,
        NODE_ENV: "test"
      }
    }
  );
}

function runSessionRefundCommand(args: readonly string[]) {
  return spawnSync(
    process.execPath,
    [
      "--import",
      "tsx",
      "--eval",
      `const {default: SwitchboardSessionRefund} = await import(${JSON.stringify(sessionRefundCommandUrl)}); await SwitchboardSessionRefund.run(${JSON.stringify(args)});`
    ],
    {
      cwd: repoRoot,
      encoding: "utf8",
      env: {
        ...process.env,
        NODE_ENV: "test"
      }
    }
  );
}

function runContextListCommand(args: readonly string[]) {
  return spawnSync(
    process.execPath,
    [
      "--import",
      "tsx",
      "--eval",
      `const {default: SwitchboardContextList} = await import(${JSON.stringify(contextListCommandUrl)}); await SwitchboardContextList.run(${JSON.stringify(args)});`
    ],
    {
      cwd: repoRoot,
      encoding: "utf8",
      env: {
        ...process.env,
        NODE_ENV: "test"
      }
    }
  );
}

function runContextCurrentCommand(args: readonly string[]) {
  return spawnSync(
    process.execPath,
    [
      "--import",
      "tsx",
      "--eval",
      `const {default: SwitchboardContextCurrent} = await import(${JSON.stringify(contextCurrentCommandUrl)}); await SwitchboardContextCurrent.run(${JSON.stringify(args)});`
    ],
    {
      cwd: repoRoot,
      encoding: "utf8",
      env: {
        ...process.env,
        NODE_ENV: "test"
      }
    }
  );
}

function runContextUseCommand(args: readonly string[]) {
  return spawnSync(
    process.execPath,
    [
      "--import",
      "tsx",
      "--eval",
      `const {default: SwitchboardContextUse} = await import(${JSON.stringify(contextUseCommandUrl)}); await SwitchboardContextUse.run(${JSON.stringify(args)});`
    ],
    {
      cwd: repoRoot,
      encoding: "utf8",
      env: {
        ...process.env,
        NODE_ENV: "test"
      }
    }
  );
}

function runContextSetCommand(args: readonly string[]) {
  return spawnSync(
    process.execPath,
    [
      "--import",
      "tsx",
      "--eval",
      `const {default: SwitchboardContextSet} = await import(${JSON.stringify(contextSetCommandUrl)}); await SwitchboardContextSet.run(${JSON.stringify(args)});`
    ],
    {
      cwd: repoRoot,
      encoding: "utf8",
      env: {
        ...process.env,
        NODE_ENV: "test"
      }
    }
  );
}

function runContextAddCommand(args: readonly string[]) {
  return spawnSync(
    process.execPath,
    [
      "--import",
      "tsx",
      "--eval",
      `const {default: SwitchboardContextAdd} = await import(${JSON.stringify(contextAddCommandUrl)}); await SwitchboardContextAdd.run(${JSON.stringify(args)});`
    ],
    {
      cwd: repoRoot,
      encoding: "utf8",
      env: {
        ...process.env,
        NODE_ENV: "test"
      }
    }
  );
}

function runContextDnsSetCommand(args: readonly string[]) {
  return spawnSync(
    process.execPath,
    [
      "--import",
      "tsx",
      "--eval",
      `const {default: SwitchboardContextDnsSet} = await import(${JSON.stringify(contextDnsSetCommandUrl)}); await SwitchboardContextDnsSet.run(${JSON.stringify(args)});`
    ],
    {
      cwd: repoRoot,
      encoding: "utf8",
      env: {
        ...process.env,
        NODE_ENV: "test"
      }
    }
  );
}

function runContextDnsClearCommand(args: readonly string[]) {
  return spawnSync(
    process.execPath,
    [
      "--import",
      "tsx",
      "--eval",
      `const {default: SwitchboardContextDnsClear} = await import(${JSON.stringify(contextDnsClearCommandUrl)}); await SwitchboardContextDnsClear.run(${JSON.stringify(args)});`
    ],
    {
      cwd: repoRoot,
      encoding: "utf8",
      env: {
        ...process.env,
        NODE_ENV: "test"
      }
    }
  );
}

function runDoctorCommand(args: readonly string[]) {
  return spawnSync(
    process.execPath,
    [
      "--import",
      "tsx",
      "--eval",
      `const {default: SwitchboardDeployDoctor} = await import(${JSON.stringify(doctorCommandUrl)}); await SwitchboardDeployDoctor.run(${JSON.stringify(args)});`
    ],
    {
      cwd: repoRoot,
      encoding: "utf8",
      env: {
        ...process.env,
        NODE_ENV: "test"
      }
    }
  );
}

function runStatusCommand(args: readonly string[]) {
  return spawnSync(
    process.execPath,
    [
      "--import",
      "tsx",
      "--eval",
      `const {default: SwitchboardDeployStatus} = await import(${JSON.stringify(deployStatusCommandUrl)}); await SwitchboardDeployStatus.run(${JSON.stringify(args)});`
    ],
    {
      cwd: repoRoot,
      encoding: "utf8",
      env: {
        ...process.env,
        NODE_ENV: "test"
      }
    }
  );
}

function runResumeCommand(args: readonly string[]) {
  return spawnSync(
    process.execPath,
    [
      "--import",
      "tsx",
      "--eval",
      `const {default: SwitchboardDeployResume} = await import(${JSON.stringify(resumeCommandUrl)}); await SwitchboardDeployResume.run(${JSON.stringify(args)});`
    ],
    {
      cwd: repoRoot,
      encoding: "utf8",
      env: {
        ...process.env,
        NODE_ENV: "test"
      }
    }
  );
}

function runInitCommand(args: readonly string[]) {
  return spawnSync(
    process.execPath,
    [
      "--import",
      "tsx",
      "--eval",
      `const {default: SwitchboardInit} = await import(${JSON.stringify(initCommandUrl)}); await SwitchboardInit.run(${JSON.stringify(args)});`
    ],
    {
      cwd: repoRoot,
      encoding: "utf8",
      env: {
        ...process.env,
        NODE_ENV: "test"
      }
    }
  );
}

function runProjectInitCommand(args: readonly string[]) {
  return spawnSync(
    process.execPath,
    [
      "--import",
      "tsx",
      "--eval",
      `const {default: SwitchboardProjectInit} = await import(${JSON.stringify(projectInitCommandUrl)}); await SwitchboardProjectInit.run(${JSON.stringify(args)});`
    ],
    {
      cwd: repoRoot,
      encoding: "utf8",
      env: {
        ...process.env,
        NODE_ENV: "test"
      }
    }
  );
}

function runProjectShowCommand(args: readonly string[]) {
  return spawnSync(
    process.execPath,
    [
      "--import",
      "tsx",
      "--eval",
      `const {default: SwitchboardProjectShow} = await import(${JSON.stringify(projectShowCommandUrl)}); await SwitchboardProjectShow.run(${JSON.stringify(args)});`
    ],
    {
      cwd: repoRoot,
      encoding: "utf8",
      env: {
        ...process.env,
        NODE_ENV: "test"
      }
    }
  );
}

function runPreflightCommand(args: readonly string[]) {
  return spawnSync(
    process.execPath,
    [
      "--import",
      "tsx",
      "--eval",
      `const {default: SwitchboardPreflight} = await import(${JSON.stringify(preflightCommandUrl)}); await SwitchboardPreflight.run(${JSON.stringify(args)});`
    ],
    {
      cwd: repoRoot,
      encoding: "utf8",
      env: {
        ...process.env,
        NODE_ENV: "test"
      }
    }
  );
}

function runDeploymentStatusCommand(args: readonly string[]) {
  return spawnSync(
    process.execPath,
    [
      "--import",
      "tsx",
      "--eval",
      `const {default: SwitchboardStatus} = await import(${JSON.stringify(deploymentStatusCommandUrl)}); await SwitchboardStatus.run(${JSON.stringify(args)});`
    ],
    {
      cwd: repoRoot,
      encoding: "utf8",
      env: {
        ...process.env,
        NODE_ENV: "test"
      }
    }
  );
}

function runSessionStatusCommand(args: readonly string[]) {
  return spawnSync(
    process.execPath,
    [
      "--import",
      "tsx",
      "--eval",
      `const {default: SwitchboardSessionStatus} = await import(${JSON.stringify(sessionStatusCommandUrl)}); await SwitchboardSessionStatus.run(${JSON.stringify(args)});`
    ],
    {
      cwd: repoRoot,
      encoding: "utf8",
      env: {
        ...process.env,
        NODE_ENV: "test"
      }
    }
  );
}

function runHostnameStatusCommand(args: readonly string[]) {
  return spawnSync(
    process.execPath,
    [
      "--import",
      "tsx",
      "--eval",
      `const {default: SwitchboardHostnameStatus} = await import(${JSON.stringify(hostnameStatusCommandUrl)}); await SwitchboardHostnameStatus.run(${JSON.stringify(args)});`
    ],
    {
      cwd: repoRoot,
      encoding: "utf8",
      env: {
        ...process.env,
        NODE_ENV: "test"
      }
    }
  );
}

function runHostnameAddCommand(args: readonly string[]) {
  return spawnSync(
    process.execPath,
    [
      "--import",
      "tsx",
      "--eval",
      `const {default: SwitchboardHostnameAdd} = await import(${JSON.stringify(hostnameAddCommandUrl)}); await SwitchboardHostnameAdd.run(${JSON.stringify(args)});`
    ],
    {
      cwd: repoRoot,
      encoding: "utf8",
      env: {
        ...process.env,
        NODE_ENV: "test"
      }
    }
  );
}

function runHostnameRemoveCommand(args: readonly string[]) {
  return spawnSync(
    process.execPath,
    [
      "--import",
      "tsx",
      "--eval",
      `const {default: SwitchboardHostnameRemove} = await import(${JSON.stringify(hostnameRemoveCommandUrl)}); await SwitchboardHostnameRemove.run(${JSON.stringify(args)});`
    ],
    {
      cwd: repoRoot,
      encoding: "utf8",
      env: {
        ...process.env,
        NODE_ENV: "test"
      }
    }
  );
}

function runValidatorScriptCommand(args: readonly string[]) {
  return spawnSync(
    process.execPath,
    [
      "--import",
      "tsx",
      "--eval",
      `const {default: SwitchboardValidatorScript} = await import(${JSON.stringify(validatorScriptCommandUrl)}); await SwitchboardValidatorScript.run(${JSON.stringify(args)});`
    ],
    {
      cwd: repoRoot,
      encoding: "utf8",
      env: {
        ...process.env,
        NODE_ENV: "test"
      }
    }
  );
}

function runValidatorLaunchCommand(args: readonly string[]) {
  return spawnSync(
    process.execPath,
    [
      "--import",
      "tsx",
      "--eval",
      `const {default: SwitchboardValidatorLaunch} = await import(${JSON.stringify(validatorLaunchCommandUrl)}); await SwitchboardValidatorLaunch.run(${JSON.stringify(args)});`
    ],
    {
      cwd: repoRoot,
      encoding: "utf8",
      env: {
        ...process.env,
        NODE_ENV: "test"
      }
    }
  );
}

function runGatewaySetupCommand(args: readonly string[]) {
  return spawnSync(
    process.execPath,
    [
      "--import",
      "tsx",
      "--eval",
      `const {default: SwitchboardGatewaySetup} = await import(${JSON.stringify(gatewaySetupCommandUrl)}); await SwitchboardGatewaySetup.run(${JSON.stringify(args)});`
    ],
    {
      cwd: repoRoot,
      encoding: "utf8",
      env: {
        ...process.env,
        NODE_ENV: "test"
      }
    }
  );
}

function runGatewayDiscoverCommand(args: readonly string[]) {
  return spawnSync(
    process.execPath,
    [
      "--import",
      "tsx",
      "--eval",
      `const {default: SwitchboardGatewayDiscover} = await import(${JSON.stringify(gatewayDiscoverCommandUrl)}); await SwitchboardGatewayDiscover.run(${JSON.stringify(args)});`
    ],
    {
      cwd: repoRoot,
      encoding: "utf8",
      env: {
        ...process.env,
        NODE_ENV: "test"
      }
    }
  );
}

function runGatewayStatusCommand(args: readonly string[]) {
  return spawnSync(
    process.execPath,
    [
      "--import",
      "tsx",
      "--eval",
      `const {default: SwitchboardGatewayStatus} = await import(${JSON.stringify(gatewayStatusCommandUrl)}); await SwitchboardGatewayStatus.run(${JSON.stringify(args)});`
    ],
    {
      cwd: repoRoot,
      encoding: "utf8",
      env: {
        ...process.env,
        NODE_ENV: "test"
      }
    }
  );
}

function runRelayListCommand(args: readonly string[]) {
  return spawnSync(
    process.execPath,
    [
      "--import",
      "tsx",
      "--eval",
      `const {default: SwitchboardRelayList} = await import(${JSON.stringify(relayListCommandUrl)}); await SwitchboardRelayList.run(${JSON.stringify(args)});`
    ],
    {
      cwd: repoRoot,
      encoding: "utf8",
      env: {
        ...process.env,
        NODE_ENV: "test"
      }
    }
  );
}

function runRelayDiffCommand(args: readonly string[]) {
  return spawnSync(
    process.execPath,
    [
      "--import",
      "tsx",
      "--eval",
      `const {default: SwitchboardRelayDiff} = await import(${JSON.stringify(relayDiffCommandUrl)}); await SwitchboardRelayDiff.run(${JSON.stringify(args)});`
    ],
    {
      cwd: repoRoot,
      encoding: "utf8",
      env: {
        ...process.env,
        NODE_ENV: "test"
      }
    }
  );
}

function runRelaySyncCommand(args: readonly string[]) {
  return spawnSync(
    process.execPath,
    [
      "--import",
      "tsx",
      "--eval",
      `const {default: SwitchboardRelaySync} = await import(${JSON.stringify(relaySyncCommandUrl)}); await SwitchboardRelaySync.run(${JSON.stringify(args)});`
    ],
    {
      cwd: repoRoot,
      encoding: "utf8",
      env: {
        ...process.env,
        NODE_ENV: "test"
      }
    }
  );
}

function runRelayBackfillSpecsCommand(args: readonly string[]) {
  return spawnSync(
    process.execPath,
    [
      "--import",
      "tsx",
      "--eval",
      `const {default: SwitchboardRelayBackfillSpecs} = await import(${JSON.stringify(relayBackfillSpecsCommandUrl)}); await SwitchboardRelayBackfillSpecs.run(${JSON.stringify(args)});`
    ],
    {
      cwd: repoRoot,
      encoding: "utf8",
      env: {
        ...process.env,
        NODE_ENV: "test"
      }
    }
  );
}

function runRelayPickProcessorCommand(args: readonly string[]) {
  return spawnSync(
    process.execPath,
    [
      "--import",
      "tsx",
      "--eval",
      `const {default: SwitchboardRelayPickProcessor} = await import(${JSON.stringify(relayPickProcessorCommandUrl)}); await SwitchboardRelayPickProcessor.run(${JSON.stringify(args)});`
    ],
    {
      cwd: repoRoot,
      encoding: "utf8",
      env: {
        ...process.env,
        NODE_ENV: "test"
      }
    }
  );
}

function runRelayLogsCommand(args: readonly string[]) {
  return spawnSync(
    process.execPath,
    [
      "--import",
      "tsx",
      "--eval",
      `const {default: SwitchboardRelayLogs} = await import(${JSON.stringify(relayLogsCommandUrl)}); await SwitchboardRelayLogs.run(${JSON.stringify(args)});`
    ],
    {
      cwd: repoRoot,
      encoding: "utf8",
      env: {
        ...process.env,
        NODE_ENV: "test"
      }
    }
  );
}

function runRelayVerifyCommand(args: readonly string[]) {
  return spawnSync(
    process.execPath,
    [
      "--import",
      "tsx",
      "--eval",
      `const {default: SwitchboardRelayVerify} = await import(${JSON.stringify(relayVerifyCommandUrl)}); await SwitchboardRelayVerify.run(${JSON.stringify(args)});`
    ],
    {
      cwd: repoRoot,
      encoding: "utf8",
      env: {
        ...process.env,
        NODE_ENV: "test"
      }
    }
  );
}

function runRelayDnsPlanCommand(args: readonly string[]) {
  return spawnSync(
    process.execPath,
    [
      "--import",
      "tsx",
      "--eval",
      `const {default: SwitchboardRelayDnsPlan} = await import(${JSON.stringify(relayDnsPlanCommandUrl)}); await SwitchboardRelayDnsPlan.run(${JSON.stringify(args)});`
    ],
    {
      cwd: repoRoot,
      encoding: "utf8",
      env: {
        ...process.env,
        NODE_ENV: "test"
      }
    }
  );
}

function runRelayDnsApplyCommand(args: readonly string[]) {
  return spawnSync(
    process.execPath,
    [
      "--import",
      "tsx",
      "--eval",
      `const {default: SwitchboardRelayDnsApply} = await import(${JSON.stringify(relayDnsApplyCommandUrl)}); await SwitchboardRelayDnsApply.run(${JSON.stringify(args)});`
    ],
    {
      cwd: repoRoot,
      encoding: "utf8",
      env: {
        ...process.env,
        NODE_ENV: "test"
      }
    }
  );
}

function runRelayDnsVerifyCommand(args: readonly string[]) {
  return spawnSync(
    process.execPath,
    [
      "--import",
      "tsx",
      "--eval",
      `const {default: SwitchboardRelayDnsVerify} = await import(${JSON.stringify(relayDnsVerifyCommandUrl)}); await SwitchboardRelayDnsVerify.run(${JSON.stringify(args)});`
    ],
    {
      cwd: repoRoot,
      encoding: "utf8",
      env: {
        ...process.env,
        NODE_ENV: "test"
      }
    }
  );
}

function runRelayDnsRemoveCommand(args: readonly string[]) {
  return spawnSync(
    process.execPath,
    [
      "--import",
      "tsx",
      "--eval",
      `const {default: SwitchboardRelayDnsRemove} = await import(${JSON.stringify(relayDnsRemoveCommandUrl)}); await SwitchboardRelayDnsRemove.run(${JSON.stringify(args)});`
    ],
    {
      cwd: repoRoot,
      encoding: "utf8",
      env: {
        ...process.env,
        NODE_ENV: "test"
      }
    }
  );
}

function runRelayBudgetCommand(args: readonly string[]) {
  return spawnSync(
    process.execPath,
    [
      "--import",
      "tsx",
      "--eval",
      `const {default: SwitchboardRelayBudget} = await import(${JSON.stringify(relayBudgetCommandUrl)}); await SwitchboardRelayBudget.run(${JSON.stringify(args)});`
    ],
    {
      cwd: repoRoot,
      encoding: "utf8",
      env: {
        ...process.env,
        NODE_ENV: "test"
      }
    }
  );
}

function runRelayCatalogBuildCommand(args: readonly string[]) {
  return spawnSync(
    process.execPath,
    [
      "--import",
      "tsx",
      "--eval",
      `const {default: SwitchboardRelayCatalogBuild} = await import(${JSON.stringify(relayCatalogBuildCommandUrl)}); await SwitchboardRelayCatalogBuild.run(${JSON.stringify(args)});`
    ],
    {
      cwd: repoRoot,
      encoding: "utf8",
      env: {
        ...process.env,
        NODE_ENV: "test"
      }
    }
  );
}

function runRelayCatalogSetStateCommand(args: readonly string[]) {
  return spawnSync(
    process.execPath,
    [
      "--import",
      "tsx",
      "--eval",
      `const {default: SwitchboardRelayCatalogSetState} = await import(${JSON.stringify(relayCatalogSetStateCommandUrl)}); await SwitchboardRelayCatalogSetState.run(${JSON.stringify(args)});`
    ],
    {
      cwd: repoRoot,
      encoding: "utf8",
      env: {
        ...process.env,
        NODE_ENV: "test"
      }
    }
  );
}

function runRelayWhoamiCommand(args: readonly string[]) {
  return spawnSync(
    process.execPath,
    [
      "--import",
      "tsx",
      "--eval",
      `const {default: SwitchboardRelayWhoami} = await import(${JSON.stringify(relayWhoamiCommandUrl)}); await SwitchboardRelayWhoami.run(${JSON.stringify(args)});`
    ],
    {
      cwd: repoRoot,
      encoding: "utf8",
      env: {
        ...process.env,
        NODE_ENV: "test"
      }
    }
  );
}

function runRelayKeygenCommand(args: readonly string[]) {
  return spawnSync(
    process.execPath,
    [
      "--import",
      "tsx",
      "--eval",
      `const {default: SwitchboardRelayKeygen} = await import(${JSON.stringify(relayKeygenCommandUrl)}); await SwitchboardRelayKeygen.run(${JSON.stringify(args)});`
    ],
    {
      cwd: repoRoot,
      encoding: "utf8",
      env: {
        ...process.env,
        NODE_ENV: "test"
      }
    }
  );
}

function runRelayScaffoldCommand(args: readonly string[]) {
  return spawnSync(
    process.execPath,
    [
      "--import",
      "tsx",
      "--eval",
      `const {default: SwitchboardRelayScaffold} = await import(${JSON.stringify(relayScaffoldCommandUrl)}); await SwitchboardRelayScaffold.run(${JSON.stringify(args)});`
    ],
    {
      cwd: repoRoot,
      encoding: "utf8",
      env: {
        ...process.env,
        NODE_ENV: "test"
      }
    }
  );
}

function runRelayStatusCommand(args: readonly string[]) {
  return spawnSync(
    process.execPath,
    [
      "--import",
      "tsx",
      "--eval",
      `const {default: SwitchboardRelayStatus} = await import(${JSON.stringify(relayStatusCommandUrl)}); await SwitchboardRelayStatus.run(${JSON.stringify(args)});`
    ],
    {
      cwd: repoRoot,
      encoding: "utf8",
      env: {
        ...process.env,
        NODE_ENV: "test"
      }
    }
  );
}

function runRelayWatchCommand(args: readonly string[]) {
  return spawnSync(
    process.execPath,
    [
      "--import",
      "tsx",
      "--eval",
      `const {default: SwitchboardRelayWatch} = await import(${JSON.stringify(relayWatchCommandUrl)}); await SwitchboardRelayWatch.run(${JSON.stringify(args)});`
    ],
    {
      cwd: repoRoot,
      encoding: "utf8",
      env: {
        ...process.env,
        NODE_ENV: "test"
      }
    }
  );
}

function runGatewayUpgradeCommand(args: readonly string[]) {
  return spawnSync(
    process.execPath,
    [
      "--import",
      "tsx",
      "--eval",
      `const {default: SwitchboardGatewayUpgrade} = await import(${JSON.stringify(gatewayUpgradeCommandUrl)}); await SwitchboardGatewayUpgrade.run(${JSON.stringify(args)});`
    ],
    {
      cwd: repoRoot,
      encoding: "utf8",
      env: {
        ...process.env,
        NODE_ENV: "test"
      }
    }
  );
}

function runLaunchDemoCommand(args: readonly string[]) {
  return spawnSync(
    process.execPath,
    [
      "--import",
      "tsx",
      "--eval",
      `const {default: SwitchboardLaunchDemo} = await import(${JSON.stringify(launchDemoCommandUrl)}); await SwitchboardLaunchDemo.run(${JSON.stringify(args)});`
    ],
    {
      cwd: repoRoot,
      encoding: "utf8",
      env: {
        ...process.env,
        NODE_ENV: "test"
      }
    }
  );
}

async function captureConsole<T>(fn: () => Promise<T>): Promise<{ result: T; stdout: string; stderr: string }> {
  const stdout: string[] = [];
  const stderr: string[] = [];
  const originalLog = console.log;
  const originalError = console.error;
  console.log = (...values: unknown[]) => {
    stdout.push(values.map((value) => String(value)).join(" "));
  };
  console.error = (...values: unknown[]) => {
    stderr.push(values.map((value) => String(value)).join(" "));
  };
  try {
    const result = await fn();
    return {
      result,
      stdout: stdout.length > 0 ? `${stdout.join("\n")}\n` : "",
      stderr: stderr.length > 0 ? `${stderr.join("\n")}\n` : ""
    };
  } finally {
    console.log = originalLog;
    console.error = originalError;
  }
}

async function withProcessEnv<T>(updates: Record<string, string | undefined>, fn: () => Promise<T>): Promise<T> {
  const previous = new Map<string, string | undefined>();
  for (const key of Object.keys(updates)) {
    previous.set(key, process.env[key]);
    const value = updates[key];
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
  try {
    return await fn();
  } finally {
    for (const [key, value] of previous.entries()) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  }
}

function assertTextOrder(text: string, first: string, second: string): void {
  const firstIndex = text.indexOf(first);
  const secondIndex = text.indexOf(second);
  assert.notEqual(firstIndex, -1, `missing first text: ${first}`);
  assert.notEqual(secondIndex, -1, `missing second text: ${second}`);
  assert.ok(firstIndex < secondIndex, `expected ${first} before ${second}`);
}

function matchCount(text: string, pattern: RegExp): number {
  return Array.from(text.matchAll(pattern)).length;
}

async function withMutedConsoleError<T>(fn: () => Promise<T>): Promise<T> {
  const original = console.error;
  console.error = () => {};
  try {
    return await fn();
  } finally {
    console.error = original;
  }
}
