import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

import { runSwitchboardCatalogBuildNative } from "../src/commands/switchboard/catalog/build.js";
import { runSwitchboardCatalogInspectNative } from "../src/commands/switchboard/catalog/inspect.js";
import { runSwitchboardCatalogSetStateNative } from "../src/commands/switchboard/catalog/set-state.js";
import { runSwitchboardCatalogVerifyNative } from "../src/commands/switchboard/catalog/verify.js";
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
import { runSwitchboardCompatibility } from "../src/commands/switchboard.js";
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
import { runSwitchboardRelayBudgetNative } from "../src/commands/switchboard/relay/budget.js";
import { runSwitchboardRelayCatalogBuildNative } from "../src/commands/switchboard/relay/catalog/build.js";
import SwitchboardRelayCatalogSetState, {
  runSwitchboardRelayCatalogSetStateNative
} from "../src/commands/switchboard/relay/catalog/set-state.js";
import { runSwitchboardRelayDnsPlanNative } from "../src/commands/switchboard/relay/dns/plan.js";
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
import { runSwitchboardValidatorScriptNative } from "../src/commands/switchboard/validator/script.js";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const commandUrl = pathToFileURL(path.join(repoRoot, "src", "commands", "switchboard.ts")).href;
const catalogBuildCommandUrl = pathToFileURL(path.join(repoRoot, "src", "commands", "switchboard", "catalog", "build.ts")).href;
const catalogInspectCommandUrl = pathToFileURL(path.join(repoRoot, "src", "commands", "switchboard", "catalog", "inspect.ts")).href;
const catalogSetStateCommandUrl = pathToFileURL(path.join(repoRoot, "src", "commands", "switchboard", "catalog", "set-state.ts")).href;
const catalogVerifyCommandUrl = pathToFileURL(path.join(repoRoot, "src", "commands", "switchboard", "catalog", "verify.ts")).href;
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
const relayBudgetCommandUrl = pathToFileURL(path.join(repoRoot, "src", "commands", "switchboard", "relay", "budget.ts")).href;
const relayCatalogBuildCommandUrl = pathToFileURL(path.join(repoRoot, "src", "commands", "switchboard", "relay", "catalog", "build.ts")).href;
const relayCatalogSetStateCommandUrl = pathToFileURL(path.join(repoRoot, "src", "commands", "switchboard", "relay", "catalog", "set-state.ts")).href;
const relayDnsPlanCommandUrl = pathToFileURL(path.join(repoRoot, "src", "commands", "switchboard", "relay", "dns", "plan.ts")).href;
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
const validatorScriptCommandUrl = pathToFileURL(path.join(repoRoot, "src", "commands", "switchboard", "validator", "script.ts")).href;
const deploymentStatusCommandUrl = pathToFileURL(path.join(repoRoot, "src", "commands", "switchboard", "status.ts")).href;
const switchboardBin = path.join(repoRoot, "node_modules", ".bin", process.platform === "win32" ? "switchboard.cmd" : "switchboard");

test("forwards raw argv to the Switchboard runner", async () => {
  let forwarded: readonly string[] | undefined;
  const exitCode = await runSwitchboardCompatibility(["launch-demo", "--help"], {
    runner: async (argv) => {
      forwarded = [...argv];
    }
  });

  assert.equal(exitCode, 0);
  assert.deepEqual(forwarded, ["launch-demo", "--help"]);
});

test("prints Switchboard compatibility help through the oclif command", () => {
  const result = runPluginCommand(["--help"]);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Switchboard, a PROOF project/u);
  assert.match(result.stdout, /switchboard launch-demo --yes-spend/u);
});

test("removed operator topic fails through the compatibility bridge", () => {
  const result = runPluginBridge(["operator", "setup", "--help"]);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Unknown command: operator setup/u);
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

test("forwards native deploy doctor args to the shared Switchboard runner", async () => {
  let forwarded: readonly string[] | undefined;
  const exitCode = await runSwitchboardDeployDoctorNative(["--json", "--intent-id", "di_doctor"], {
    runner: async (argv) => {
      forwarded = [...(argv ?? [])];
    }
  });

  assert.equal(exitCode, 0);
  assert.deepEqual(forwarded, ["--json", "--intent-id", "di_doctor"]);
});

test("forwards native deploy status args to the shared Switchboard runner", async () => {
  let forwarded: readonly string[] | undefined;
  const exitCode = await runSwitchboardDeployStatusNative(["--json", "--run-dir", ".switchboard/runs/test"], {
    runner: async (argv) => {
      forwarded = [...(argv ?? [])];
    }
  });

  assert.equal(exitCode, 0);
  assert.deepEqual(forwarded, ["--json", "--run-dir", ".switchboard/runs/test"]);
});

test("forwards native deploy resume args to the shared Switchboard runner", async () => {
  let forwarded: readonly string[] | undefined;
  const exitCode = await runSwitchboardDeployResumeNative(["--yes", "--json", "--run-dir", ".switchboard/runs/test"], {
    runner: async (argv) => {
      forwarded = [...(argv ?? [])];
    }
  });

  assert.equal(exitCode, 0);
  assert.deepEqual(forwarded, ["--yes", "--json", "--run-dir", ".switchboard/runs/test"]);
});

test("forwards native init args to the shared Switchboard runner", async () => {
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

test("forwards native project init args to the shared Switchboard runner", async () => {
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

test("forwards native project show args to the shared Switchboard runner", async () => {
  let forwarded: readonly string[] | undefined;
  const exitCode = await runSwitchboardProjectShowNative(["--json", "--project-dir", "./app"], {
    runner: async (argv) => {
      forwarded = [...(argv ?? [])];
    }
  });

  assert.equal(exitCode, 0);
  assert.deepEqual(forwarded, ["--json", "--project-dir", "./app"]);
});

test("forwards native preflight args to the shared Switchboard runner", async () => {
  let forwarded: readonly string[] | undefined;
  const exitCode = await runSwitchboardPreflightNative(["--json", "--manifest-url", "https://control.example/manifest"], {
    runner: async (argv) => {
      forwarded = [...(argv ?? [])];
    }
  });

  assert.equal(exitCode, 0);
  assert.deepEqual(forwarded, ["--json", "--manifest-url", "https://control.example/manifest"]);
});

test("forwards native top-level status args to the shared Switchboard runner", async () => {
  let forwarded: readonly string[] | undefined;
  const exitCode = await runSwitchboardDeploymentStatusNative(["--json", "--report", "report.json"], {
    runner: async (argv) => {
      forwarded = [...(argv ?? [])];
    }
  });

  assert.equal(exitCode, 0);
  assert.deepEqual(forwarded, ["--json", "--report", "report.json"]);
});

test("forwards native session status args to the shared Switchboard runner", async () => {
  let forwarded: readonly string[] | undefined;
  const exitCode = await runSwitchboardSessionStatusNative(["--json", "--session-id", `0x${"11".repeat(32)}`], {
    runner: async (argv) => {
      forwarded = [...(argv ?? [])];
    }
  });

  assert.equal(exitCode, 0);
  assert.deepEqual(forwarded, ["--json", "--session-id", `0x${"11".repeat(32)}`]);
});

test("forwards native session register args to the shared Switchboard runner", async () => {
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

test("forwards native hostname status args to the shared Switchboard runner", async () => {
  let forwarded: readonly string[] | undefined;
  const exitCode = await runSwitchboardHostnameStatusNative(["app.example.com", "--endpoint", "demo.ingress.example", "--json"], {
    runner: async (argv) => {
      forwarded = [...(argv ?? [])];
    }
  });

  assert.equal(exitCode, 0);
  assert.deepEqual(forwarded, ["app.example.com", "--endpoint", "demo.ingress.example", "--json"]);
});

test("forwards native hostname add args to the shared Switchboard runner", async () => {
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

test("forwards native hostname remove args to the shared Switchboard runner", async () => {
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

test("forwards native validator script args to the shared Switchboard runner", async () => {
  let forwarded: readonly string[] | undefined;
  const exitCode = await runSwitchboardValidatorScriptNative(["--json", "--validator-script-manifest-url", "https://control.example/validator-script.json"], {
    runner: async (argv) => {
      forwarded = [...(argv ?? [])];
    }
  });

  assert.equal(exitCode, 0);
  assert.deepEqual(forwarded, ["--json", "--validator-script-manifest-url", "https://control.example/validator-script.json"]);
});

test("forwards native catalog build args to the shared Switchboard runner", async () => {
  let forwarded: readonly string[] | undefined;
  const exitCode = await runSwitchboardCatalogBuildNative(["--spec", "catalogs.json", "--output", "service-catalogs.signed.json", "--stdout"], {
    runner: async (argv) => {
      forwarded = [...(argv ?? [])];
    }
  });

  assert.equal(exitCode, 0);
  assert.deepEqual(forwarded, ["--spec", "catalogs.json", "--output", "service-catalogs.signed.json", "--stdout"]);
});

test("forwards native catalog set-state args to the shared Switchboard runner", async () => {
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

test("forwards native catalog inspect args to the shared Switchboard runner", async () => {
  let forwarded: readonly string[] | undefined;
  const exitCode = await runSwitchboardCatalogInspectNative(["--file", "catalogs.json", "--signer", "5...", "--json"], {
    runner: async (argv) => {
      forwarded = [...(argv ?? [])];
    }
  });

  assert.equal(exitCode, 0);
  assert.deepEqual(forwarded, ["--file", "catalogs.json", "--signer", "5...", "--json"]);
});

test("forwards native catalog verify args to the shared Switchboard runner", async () => {
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

test("forwards native gateway setup args to the shared Switchboard runner", async () => {
  let forwarded: readonly string[] | undefined;
  const exitCode = await runSwitchboardGatewaySetupNative(["--gateway-id", "switchboard-az-01", "--dry-run", "--json"], {
    runner: async (argv) => {
      forwarded = [...(argv ?? [])];
    }
  });

  assert.equal(exitCode, 0);
  assert.deepEqual(forwarded, ["--gateway-id", "switchboard-az-01", "--dry-run", "--json"]);
});

test("forwards native gateway discover args to the shared Switchboard runner", async () => {
  let forwarded: readonly string[] | undefined;
  const exitCode = await runSwitchboardGatewayDiscoverNative(["--manager-id", "9470", "--limit", "3", "--json"], {
    runner: async (argv) => {
      forwarded = [...(argv ?? [])];
    }
  });

  assert.equal(exitCode, 0);
  assert.deepEqual(forwarded, ["--manager-id", "9470", "--limit", "3", "--json"]);
});

test("forwards native gateway status args to the shared Switchboard runner", async () => {
  let forwarded: readonly string[] | undefined;
  const exitCode = await runSwitchboardGatewayStatusNative(["--project-dir", "/srv/proof", "--json"], {
    runner: async (argv) => {
      forwarded = [...(argv ?? [])];
    }
  });

  assert.equal(exitCode, 0);
  assert.deepEqual(forwarded, ["--project-dir", "/srv/proof", "--json"]);
});

test("forwards native relay list args to the shared Switchboard runner", async () => {
  let forwarded: readonly string[] | undefined;
  const exitCode = await runSwitchboardRelayListNative(["--source", "live", "--json"], {
    runner: async (argv) => {
      forwarded = [...(argv ?? [])];
    }
  });

  assert.equal(exitCode, 0);
  assert.deepEqual(forwarded, ["--source", "live", "--json"]);
});

test("forwards native relay diff args to the shared Switchboard runner", async () => {
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

test("forwards native relay pick-processor args to the shared Switchboard runner", async () => {
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

test("forwards native relay logs args to the shared Switchboard runner", async () => {
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

test("forwards native relay verify args to the shared Switchboard runner", async () => {
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

test("forwards native relay dns plan args to the shared Switchboard runner", async () => {
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

test("forwards native relay dns verify args to the shared Switchboard runner", async () => {
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

test("forwards native relay budget args to the shared Switchboard runner", async () => {
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

test("forwards native relay catalog build args to the shared Switchboard runner", async () => {
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

test("forwards native relay catalog set-state args to the shared Switchboard runner", async () => {
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

test("forwards native relay sync args to the shared Switchboard runner", async () => {
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

test("forwards native relay whoami args to the shared Switchboard runner", async () => {
  let forwarded: readonly string[] | undefined;
  const exitCode = await runSwitchboardRelayWhoamiNative(["relay-d", "--seed-env", "RELAY_D_SEED", "--json"], {
    runner: async (argv) => {
      forwarded = [...(argv ?? [])];
    }
  });

  assert.equal(exitCode, 0);
  assert.deepEqual(forwarded, ["relay-d", "--seed-env", "RELAY_D_SEED", "--json"]);
});

test("forwards native relay keygen args to the shared Switchboard runner", async () => {
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

test("forwards native relay scaffold args to the shared Switchboard runner", async () => {
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

test("forwards native relay status args to the shared Switchboard runner", async () => {
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

test("forwards native relay watch args to the shared Switchboard runner", async () => {
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

test("forwards native gateway upgrade args to the shared Switchboard runner", async () => {
  let forwarded: readonly string[] | undefined;
  const exitCode = await runSwitchboardGatewayUpgradeNative(["--yes", "--dry-run"], {
    runner: async (argv) => {
      forwarded = [...(argv ?? [])];
    }
  });

  assert.equal(exitCode, 0);
  assert.deepEqual(forwarded, ["--yes", "--dry-run"]);
});

test("forwards native claimable args to the shared Switchboard runner", async () => {
  let forwarded: readonly string[] | undefined;
  const exitCode = await runSwitchboardClaimableNative(["--json", "--recipient", "0x0000000000000000000000000000000000000001"], {
    runner: async (argv) => {
      forwarded = [...(argv ?? [])];
    }
  });

  assert.equal(exitCode, 0);
  assert.deepEqual(forwarded, ["--json", "--recipient", "0x0000000000000000000000000000000000000001"]);
});

test("forwards native claim args to the shared Switchboard runner", async () => {
  let forwarded: readonly string[] | undefined;
  const exitCode = await runSwitchboardClaimNative(["--yes", "--claim-private-key-env", "OPERATOR_CLAIM_PRIVATE_KEY"], {
    runner: async (argv) => {
      forwarded = [...(argv ?? [])];
    }
  });

  assert.equal(exitCode, 0);
  assert.deepEqual(forwarded, ["--yes", "--claim-private-key-env", "OPERATOR_CLAIM_PRIVATE_KEY"]);
});

test("forwards native refundable args to the shared Switchboard runner", async () => {
  let forwarded: readonly string[] | undefined;
  const exitCode = await runSwitchboardRefundableNative(["--json", "--session-id", `0x${"11".repeat(32)}`], {
    runner: async (argv) => {
      forwarded = [...(argv ?? [])];
    }
  });

  assert.equal(exitCode, 0);
  assert.deepEqual(forwarded, ["--json", "--session-id", `0x${"11".repeat(32)}`]);
});

test("forwards native session refundable args to the shared Switchboard runner", async () => {
  let forwarded: readonly string[] | undefined;
  const exitCode = await runSwitchboardSessionRefundableNative(["--json", "--session-id", `0x${"11".repeat(32)}`], {
    runner: async (argv) => {
      forwarded = [...(argv ?? [])];
    }
  });

  assert.equal(exitCode, 0);
  assert.deepEqual(forwarded, ["--json", "--session-id", `0x${"11".repeat(32)}`]);
});

test("forwards native refund args to the shared Switchboard runner", async () => {
  let forwarded: readonly string[] | undefined;
  const exitCode = await runSwitchboardRefundNative(["--yes", "--session-id", `0x${"11".repeat(32)}`], {
    runner: async (argv) => {
      forwarded = [...(argv ?? [])];
    }
  });

  assert.equal(exitCode, 0);
  assert.deepEqual(forwarded, ["--yes", "--session-id", `0x${"11".repeat(32)}`]);
});

test("forwards native session refund args to the shared Switchboard runner", async () => {
  let forwarded: readonly string[] | undefined;
  const exitCode = await runSwitchboardSessionRefundNative(["--yes", "--session-id", `0x${"11".repeat(32)}`], {
    runner: async (argv) => {
      forwarded = [...(argv ?? [])];
    }
  });

  assert.equal(exitCode, 0);
  assert.deepEqual(forwarded, ["--yes", "--session-id", `0x${"11".repeat(32)}`]);
});

test("forwards native context list args to the shared Switchboard runner", async () => {
  let forwarded: readonly string[] | undefined;
  const exitCode = await runSwitchboardContextListNative(["--json", "--project-dir", "./app"], {
    runner: async (argv) => {
      forwarded = [...(argv ?? [])];
    }
  });

  assert.equal(exitCode, 0);
  assert.deepEqual(forwarded, ["--json", "--project-dir", "./app"]);
});

test("forwards native context current args to the shared Switchboard runner", async () => {
  let forwarded: readonly string[] | undefined;
  const exitCode = await runSwitchboardContextCurrentNative(["--json", "--context", "mainnet"], {
    runner: async (argv) => {
      forwarded = [...(argv ?? [])];
    }
  });

  assert.equal(exitCode, 0);
  assert.deepEqual(forwarded, ["--json", "--context", "mainnet"]);
});

test("forwards native context use args to the shared Switchboard runner", async () => {
  let forwarded: readonly string[] | undefined;
  const exitCode = await runSwitchboardContextUseNative(["mainnet", "--json"], {
    runner: async (argv) => {
      forwarded = [...(argv ?? [])];
    }
  });

  assert.equal(exitCode, 0);
  assert.deepEqual(forwarded, ["mainnet", "--json"]);
});

test("forwards native context set args to the shared Switchboard runner", async () => {
  let forwarded: readonly string[] | undefined;
  const exitCode = await runSwitchboardContextSetNative(["mainnet", "--relay-url", "https://relay.example", "--json"], {
    runner: async (argv) => {
      forwarded = [...(argv ?? [])];
    }
  });

  assert.equal(exitCode, 0);
  assert.deepEqual(forwarded, ["mainnet", "--relay-url", "https://relay.example", "--json"]);
});

test("forwards native context add args to the shared Switchboard runner", async () => {
  let forwarded: readonly string[] | undefined;
  const exitCode = await runSwitchboardContextAddNative(["mainnet", "--no-balance-check"], {
    runner: async (argv) => {
      forwarded = [...(argv ?? [])];
    }
  });

  assert.equal(exitCode, 0);
  assert.deepEqual(forwarded, ["mainnet", "--no-balance-check"]);
});

test("forwards native context dns set args to the shared Switchboard runner", async () => {
  let forwarded: readonly string[] | undefined;
  const exitCode = await runSwitchboardContextDnsSetNative(["cloudflare", "--token-env", "CF_TOKEN_PROD", "--json"], {
    runner: async (argv) => {
      forwarded = [...(argv ?? [])];
    }
  });

  assert.equal(exitCode, 0);
  assert.deepEqual(forwarded, ["cloudflare", "--token-env", "CF_TOKEN_PROD", "--json"]);
});

test("forwards native context dns clear args to the shared Switchboard runner", async () => {
  let forwarded: readonly string[] | undefined;
  const exitCode = await runSwitchboardContextDnsClearNative(["cloudflare", "--context", "mainnet", "--json"], {
    runner: async (argv) => {
      forwarded = [...(argv ?? [])];
    }
  });

  assert.equal(exitCode, 0);
  assert.deepEqual(forwarded, ["cloudflare", "--context", "mainnet", "--json"]);
});

test("falls back to compatibility for context use when the shared runner is unavailable", async () => {
  let forwarded: readonly string[] | undefined;
  const exitCode = await runSwitchboardContextUseNative(["mainnet", "--json"], {
    loadRunner: async () => undefined,
    compatibilityRunner: async (argv) => {
      forwarded = [...argv];
      return 0;
    }
  });

  assert.equal(exitCode, 0);
  assert.deepEqual(forwarded, ["context", "use", "mainnet", "--json"]);
});

test("falls back to compatibility for context set when the shared runner is unavailable", async () => {
  let forwarded: readonly string[] | undefined;
  const exitCode = await runSwitchboardContextSetNative(["mainnet", "--relay-url", "https://relay.example"], {
    loadRunner: async () => undefined,
    compatibilityRunner: async (argv) => {
      forwarded = [...argv];
      return 0;
    }
  });

  assert.equal(exitCode, 0);
  assert.deepEqual(forwarded, ["context", "set", "mainnet", "--relay-url", "https://relay.example"]);
});

test("falls back to compatibility for context add when the shared runner is unavailable", async () => {
  let forwarded: readonly string[] | undefined;
  const exitCode = await runSwitchboardContextAddNative(["mainnet", "--no-balance-check"], {
    loadRunner: async () => undefined,
    compatibilityRunner: async (argv) => {
      forwarded = [...argv];
      return 0;
    }
  });

  assert.equal(exitCode, 0);
  assert.deepEqual(forwarded, ["context", "add", "mainnet", "--no-balance-check"]);
});

test("falls back to compatibility for context dns set when the shared runner is unavailable", async () => {
  let forwarded: readonly string[] | undefined;
  const exitCode = await runSwitchboardContextDnsSetNative(["cloudflare", "--token-env", "CF_TOKEN_PROD"], {
    loadRunner: async () => undefined,
    compatibilityRunner: async (argv) => {
      forwarded = [...argv];
      return 0;
    }
  });

  assert.equal(exitCode, 0);
  assert.deepEqual(forwarded, ["context", "dns", "set", "cloudflare", "--token-env", "CF_TOKEN_PROD"]);
});

test("falls back to compatibility for context dns clear when the shared runner is unavailable", async () => {
  let forwarded: readonly string[] | undefined;
  const exitCode = await runSwitchboardContextDnsClearNative(["cloudflare", "--context", "mainnet"], {
    loadRunner: async () => undefined,
    compatibilityRunner: async (argv) => {
      forwarded = [...argv];
      return 0;
    }
  });

  assert.equal(exitCode, 0);
  assert.deepEqual(forwarded, ["context", "dns", "clear", "cloudflare", "--context", "mainnet"]);
});

test("falls back to compatibility for hostname status when the shared runner is unavailable", async () => {
  let forwarded: readonly string[] | undefined;
  const exitCode = await runSwitchboardHostnameStatusNative(["app.example.com", "--endpoint", "demo.ingress.example"], {
    loadRunner: async () => undefined,
    compatibilityRunner: async (argv) => {
      forwarded = [...argv];
      return 0;
    }
  });

  assert.equal(exitCode, 0);
  assert.deepEqual(forwarded, ["hostname", "status", "app.example.com", "--endpoint", "demo.ingress.example"]);
});

test("falls back to compatibility for hostname add when the shared runner is unavailable", async () => {
  let forwarded: readonly string[] | undefined;
  const exitCode = await runSwitchboardHostnameAddNative(["app.example.com", "--endpoint", "demo.ingress.example"], {
    loadRunner: async () => undefined,
    compatibilityRunner: async (argv) => {
      forwarded = [...argv];
      return 0;
    }
  });

  assert.equal(exitCode, 0);
  assert.deepEqual(forwarded, ["hostname", "add", "app.example.com", "--endpoint", "demo.ingress.example"]);
});

test("falls back to compatibility for hostname remove when the shared runner is unavailable", async () => {
  let forwarded: readonly string[] | undefined;
  const exitCode = await runSwitchboardHostnameRemoveNative(["app.example.com", "--endpoint", "demo.ingress.example"], {
    loadRunner: async () => undefined,
    compatibilityRunner: async (argv) => {
      forwarded = [...argv];
      return 0;
    }
  });

  assert.equal(exitCode, 0);
  assert.deepEqual(forwarded, ["hostname", "remove", "app.example.com", "--endpoint", "demo.ingress.example"]);
});

test("falls back to compatibility for session status when the shared runner is unavailable", async () => {
  let forwarded: readonly string[] | undefined;
  const exitCode = await runSwitchboardSessionStatusNative(["--session-id", `0x${"11".repeat(32)}`, "--json"], {
    loadRunner: async () => undefined,
    compatibilityRunner: async (argv) => {
      forwarded = [...argv];
      return 0;
    }
  });

  assert.equal(exitCode, 0);
  assert.deepEqual(forwarded, ["session", "status", "--session-id", `0x${"11".repeat(32)}`, "--json"]);
});

test("falls back to compatibility for session register when the shared runner is unavailable", async () => {
  let forwarded: readonly string[] | undefined;
  const exitCode = await runSwitchboardSessionRegisterNative(["--session-id", `0x${"11".repeat(32)}`, "--yes"], {
    loadRunner: async () => undefined,
    compatibilityRunner: async (argv) => {
      forwarded = [...argv];
      return 0;
    }
  });

  assert.equal(exitCode, 0);
  assert.deepEqual(forwarded, ["session", "register", "--session-id", `0x${"11".repeat(32)}`, "--yes"]);
});

test("falls back to compatibility for session refundable when the shared runner is unavailable", async () => {
  let forwarded: readonly string[] | undefined;
  const exitCode = await runSwitchboardSessionRefundableNative(["--session-id", `0x${"11".repeat(32)}`], {
    loadRunner: async () => undefined,
    compatibilityRunner: async (argv) => {
      forwarded = [...argv];
      return 0;
    }
  });

  assert.equal(exitCode, 0);
  assert.deepEqual(forwarded, ["session", "refundable", "--session-id", `0x${"11".repeat(32)}`]);
});

test("falls back to compatibility for claim when the shared runner is unavailable", async () => {
  let forwarded: readonly string[] | undefined;
  const exitCode = await runSwitchboardClaimNative(["--recipient", "0x0000000000000000000000000000000000000001"], {
    loadRunner: async () => undefined,
    compatibilityRunner: async (argv) => {
      forwarded = [...argv];
      return 0;
    }
  });

  assert.equal(exitCode, 0);
  assert.deepEqual(forwarded, ["claim", "--recipient", "0x0000000000000000000000000000000000000001"]);
});

test("falls back to compatibility for refund when the shared runner is unavailable", async () => {
  let forwarded: readonly string[] | undefined;
  const exitCode = await runSwitchboardRefundNative(["--session-id", `0x${"11".repeat(32)}`], {
    loadRunner: async () => undefined,
    compatibilityRunner: async (argv) => {
      forwarded = [...argv];
      return 0;
    }
  });

  assert.equal(exitCode, 0);
  assert.deepEqual(forwarded, ["refund", "--session-id", `0x${"11".repeat(32)}`]);
});

test("falls back to compatibility for session refund when the shared runner is unavailable", async () => {
  let forwarded: readonly string[] | undefined;
  const exitCode = await runSwitchboardSessionRefundNative(["--session-id", `0x${"11".repeat(32)}`], {
    loadRunner: async () => undefined,
    compatibilityRunner: async (argv) => {
      forwarded = [...argv];
      return 0;
    }
  });

  assert.equal(exitCode, 0);
  assert.deepEqual(forwarded, ["session", "refund", "--session-id", `0x${"11".repeat(32)}`]);
});

test("falls back to compatibility for validator script when the shared runner is unavailable", async () => {
  let forwarded: readonly string[] | undefined;
  const exitCode = await runSwitchboardValidatorScriptNative(["--json"], {
    loadRunner: async () => undefined,
    compatibilityRunner: async (argv) => {
      forwarded = [...argv];
      return 0;
    }
  });

  assert.equal(exitCode, 0);
  assert.deepEqual(forwarded, ["validator", "script", "--json"]);
});

test("falls back to compatibility for catalog build when the shared runner is unavailable", async () => {
  let forwarded: readonly string[] | undefined;
  const exitCode = await runSwitchboardCatalogBuildNative(["--spec", "catalogs.json", "--stdout"], {
    loadRunner: async () => undefined,
    compatibilityRunner: async (argv) => {
      forwarded = [...argv];
      return 0;
    }
  });

  assert.equal(exitCode, 0);
  assert.deepEqual(forwarded, ["catalog", "build", "--spec", "catalogs.json", "--stdout"]);
});

test("falls back to compatibility for catalog set-state when the shared runner is unavailable", async () => {
  let forwarded: readonly string[] | undefined;
  const exitCode = await runSwitchboardCatalogSetStateNative(["relay-d", "draining", "--spec", "catalogs.json", "--no-rebuild"], {
    loadRunner: async () => undefined,
    compatibilityRunner: async (argv) => {
      forwarded = [...argv];
      return 0;
    }
  });

  assert.equal(exitCode, 0);
  assert.deepEqual(forwarded, ["catalog", "set-state", "relay-d", "draining", "--spec", "catalogs.json", "--no-rebuild"]);
});

test("falls back to compatibility for catalog inspect when the shared runner is unavailable", async () => {
  let forwarded: readonly string[] | undefined;
  const exitCode = await runSwitchboardCatalogInspectNative(["--file", "catalogs.json", "--json"], {
    loadRunner: async () => undefined,
    compatibilityRunner: async (argv) => {
      forwarded = [...argv];
      return 0;
    }
  });

  assert.equal(exitCode, 0);
  assert.deepEqual(forwarded, ["catalog", "inspect", "--file", "catalogs.json", "--json"]);
});

test("falls back to compatibility for catalog verify when the shared runner is unavailable", async () => {
  let forwarded: readonly string[] | undefined;
  const exitCode = await runSwitchboardCatalogVerifyNative(["--manifest-url", "https://control.example/v1/network-manifest"], {
    loadRunner: async () => undefined,
    compatibilityRunner: async (argv) => {
      forwarded = [...argv];
      return 0;
    }
  });

  assert.equal(exitCode, 0);
  assert.deepEqual(forwarded, ["catalog", "verify", "--manifest-url", "https://control.example/v1/network-manifest"]);
});

test("falls back to compatibility for gateway setup when the shared runner is unavailable", async () => {
  let forwarded: readonly string[] | undefined;
  const exitCode = await runSwitchboardGatewaySetupNative(["--dry-run"], {
    loadRunner: async () => undefined,
    compatibilityRunner: async (argv) => {
      forwarded = [...argv];
      return 0;
    }
  });

  assert.equal(exitCode, 0);
  assert.deepEqual(forwarded, ["gateway", "setup", "--dry-run"]);
});

test("falls back to compatibility for gateway discover when the shared runner is unavailable", async () => {
  let forwarded: readonly string[] | undefined;
  const exitCode = await runSwitchboardGatewayDiscoverNative(["--manager-id", "9470"], {
    loadRunner: async () => undefined,
    compatibilityRunner: async (argv) => {
      forwarded = [...argv];
      return 0;
    }
  });

  assert.equal(exitCode, 0);
  assert.deepEqual(forwarded, ["gateway", "discover", "--manager-id", "9470"]);
});

test("falls back to compatibility for gateway status when the shared runner is unavailable", async () => {
  let forwarded: readonly string[] | undefined;
  const exitCode = await runSwitchboardGatewayStatusNative(["--json"], {
    loadRunner: async () => undefined,
    compatibilityRunner: async (argv) => {
      forwarded = [...argv];
      return 0;
    }
  });

  assert.equal(exitCode, 0);
  assert.deepEqual(forwarded, ["gateway", "status", "--json"]);
});

test("falls back to compatibility for relay list when the shared runner is unavailable", async () => {
  let forwarded: readonly string[] | undefined;
  const exitCode = await runSwitchboardRelayListNative(["--source", "live", "--json"], {
    loadRunner: async () => undefined,
    compatibilityRunner: async (argv) => {
      forwarded = [...argv];
      return 0;
    }
  });

  assert.equal(exitCode, 0);
  assert.deepEqual(forwarded, ["relay", "list", "--source", "live", "--json"]);
});

test("falls back to compatibility for relay diff when the shared runner is unavailable", async () => {
  let forwarded: readonly string[] | undefined;
  const exitCode = await runSwitchboardRelayDiffNative(["--json"], {
    loadRunner: async () => undefined,
    compatibilityRunner: async (argv) => {
      forwarded = [...argv];
      return 0;
    }
  });

  assert.equal(exitCode, 0);
  assert.deepEqual(forwarded, ["relay", "diff", "--json"]);
});

test("falls back to compatibility for relay sync when the shared runner is unavailable", async () => {
  let forwarded: readonly string[] | undefined;
  const exitCode = await runSwitchboardRelaySyncNative(["--dry-run"], {
    loadRunner: async () => undefined,
    compatibilityRunner: async (argv) => {
      forwarded = [...argv];
      return 0;
    }
  });

  assert.equal(exitCode, 0);
  assert.deepEqual(forwarded, ["relay", "sync", "--dry-run"]);
});

test("falls back to compatibility for relay pick-processor when the shared runner is unavailable", async () => {
  let forwarded: readonly string[] | undefined;
  const exitCode = await runSwitchboardRelayPickProcessorNative(["relay-d", "--pin", "auto"], {
    loadRunner: async () => undefined,
    compatibilityRunner: async (argv) => {
      forwarded = [...argv];
      return 0;
    }
  });

  assert.equal(exitCode, 0);
  assert.deepEqual(forwarded, ["relay", "pick-processor", "relay-d", "--pin", "auto"]);
});

test("falls back to compatibility for relay logs when the shared runner is unavailable", async () => {
  let forwarded: readonly string[] | undefined;
  const exitCode = await runSwitchboardRelayLogsNative(["relay-d", "--limit", "20", "--json"], {
    loadRunner: async () => undefined,
    compatibilityRunner: async (argv) => {
      forwarded = [...argv];
      return 0;
    }
  });

  assert.equal(exitCode, 0);
  assert.deepEqual(forwarded, ["relay", "logs", "relay-d", "--limit", "20", "--json"]);
});

test("falls back to compatibility for relay verify when the shared runner is unavailable", async () => {
  let forwarded: readonly string[] | undefined;
  const exitCode = await runSwitchboardRelayVerifyNative(["relay-d", "--manifest-url", "https://control.example/v1/network-manifest"], {
    loadRunner: async () => undefined,
    compatibilityRunner: async (argv) => {
      forwarded = [...argv];
      return 0;
    }
  });

  assert.equal(exitCode, 0);
  assert.deepEqual(forwarded, ["relay", "verify", "relay-d", "--manifest-url", "https://control.example/v1/network-manifest"]);
});

test("falls back to compatibility for relay dns plan when the shared runner is unavailable", async () => {
  let forwarded: readonly string[] | undefined;
  const exitCode = await runSwitchboardRelayDnsPlanNative(["relay-d", "--spec", "relays/relay-d.json"], {
    loadRunner: async () => undefined,
    compatibilityRunner: async (argv) => {
      forwarded = [...argv];
      return 0;
    }
  });

  assert.equal(exitCode, 0);
  assert.deepEqual(forwarded, ["relay", "dns", "plan", "relay-d", "--spec", "relays/relay-d.json"]);
});

test("falls back to compatibility for relay dns verify when the shared runner is unavailable", async () => {
  let forwarded: readonly string[] | undefined;
  const exitCode = await runSwitchboardRelayDnsVerifyNative(["relay-d", "--resolvers", "1.1.1.1,8.8.8.8"], {
    loadRunner: async () => undefined,
    compatibilityRunner: async (argv) => {
      forwarded = [...argv];
      return 0;
    }
  });

  assert.equal(exitCode, 0);
  assert.deepEqual(forwarded, ["relay", "dns", "verify", "relay-d", "--resolvers", "1.1.1.1,8.8.8.8"]);
});

test("falls back to compatibility for relay budget when the shared runner is unavailable", async () => {
  let forwarded: readonly string[] | undefined;
  const exitCode = await runSwitchboardRelayBudgetNative(["7d", "--json"], {
    loadRunner: async () => undefined,
    compatibilityRunner: async (argv) => {
      forwarded = [...argv];
      return 0;
    }
  });

  assert.equal(exitCode, 0);
  assert.deepEqual(forwarded, ["relay", "budget", "7d", "--json"]);
});

test("falls back to compatibility for relay whoami when the shared runner is unavailable", async () => {
  let forwarded: readonly string[] | undefined;
  const exitCode = await runSwitchboardRelayWhoamiNative(["relay-d", "--json"], {
    loadRunner: async () => undefined,
    compatibilityRunner: async (argv) => {
      forwarded = [...argv];
      return 0;
    }
  });

  assert.equal(exitCode, 0);
  assert.deepEqual(forwarded, ["relay", "whoami", "relay-d", "--json"]);
});

test("falls back to compatibility for relay keygen when the shared runner is unavailable", async () => {
  let forwarded: readonly string[] | undefined;
  const exitCode = await runSwitchboardRelayKeygenNative(["relay-d", "--unsafe-stdout"], {
    loadRunner: async () => undefined,
    compatibilityRunner: async (argv) => {
      forwarded = [...argv];
      return 0;
    }
  });

  assert.equal(exitCode, 0);
  assert.deepEqual(forwarded, ["relay", "keygen", "relay-d", "--unsafe-stdout"]);
});

test("falls back to compatibility for relay scaffold when the shared runner is unavailable", async () => {
  let forwarded: readonly string[] | undefined;
  const exitCode = await runSwitchboardRelayScaffoldNative(["relay-d", "--target", "bootstrap", "--force"], {
    loadRunner: async () => undefined,
    compatibilityRunner: async (argv) => {
      forwarded = [...argv];
      return 0;
    }
  });

  assert.equal(exitCode, 0);
  assert.deepEqual(forwarded, ["relay", "scaffold", "relay-d", "--target", "bootstrap", "--force"]);
});

test("falls back to compatibility for relay catalog build when the shared runner is unavailable", async () => {
  let forwarded: readonly string[] | undefined;
  const exitCode = await runSwitchboardRelayCatalogBuildNative(["--specs-dir", "relays", "--stdout"], {
    loadRunner: async () => undefined,
    compatibilityRunner: async (argv) => {
      forwarded = [...argv];
      return 0;
    }
  });

  assert.equal(exitCode, 0);
  assert.deepEqual(forwarded, ["relay", "catalog", "build", "--specs-dir", "relays", "--stdout"]);
});

test("falls back to compatibility for relay catalog set-state when the shared runner is unavailable", async () => {
  let forwarded: readonly string[] | undefined;
  const exitCode = await runSwitchboardRelayCatalogSetStateNative(["relay-d", "draining", "--no-rebuild"], {
    loadRunner: async () => undefined,
    compatibilityRunner: async (argv) => {
      forwarded = [...argv];
      return 0;
    }
  });

  assert.equal(exitCode, 0);
  assert.deepEqual(forwarded, ["relay", "catalog", "set-state", "relay-d", "draining", "--no-rebuild"]);
});

test("falls back to compatibility for relay status when the shared runner is unavailable", async () => {
  let forwarded: readonly string[] | undefined;
  const exitCode = await runSwitchboardRelayStatusNative(["relay-a", "--timeout-ms", "250"], {
    loadRunner: async () => undefined,
    compatibilityRunner: async (argv) => {
      forwarded = [...argv];
      return 0;
    }
  });

  assert.equal(exitCode, 0);
  assert.deepEqual(forwarded, ["relay", "status", "relay-a", "--timeout-ms", "250"]);
});

test("falls back to compatibility for relay watch when the shared runner is unavailable", async () => {
  let forwarded: readonly string[] | undefined;
  const exitCode = await runSwitchboardRelayWatchNative(["relay-d", "--max-runs", "3"], {
    loadRunner: async () => undefined,
    compatibilityRunner: async (argv) => {
      forwarded = [...argv];
      return 0;
    }
  });

  assert.equal(exitCode, 0);
  assert.deepEqual(forwarded, ["relay", "watch", "relay-d", "--max-runs", "3"]);
});

test("falls back to compatibility for gateway upgrade when the shared runner is unavailable", async () => {
  let forwarded: readonly string[] | undefined;
  const exitCode = await runSwitchboardGatewayUpgradeNative(["--yes"], {
    loadRunner: async () => undefined,
    compatibilityRunner: async (argv) => {
      forwarded = [...argv];
      return 0;
    }
  });

  assert.equal(exitCode, 0);
  assert.deepEqual(forwarded, ["gateway", "upgrade", "--yes"]);
});

test("forwards native deploy args to the shared Switchboard runner", async () => {
  let forwarded: readonly string[] | undefined;
  const exitCode = await runSwitchboardDeployNative(["--entrypoint", "src/index.ts", "--dry-run", "--json"], {
    runner: async (argv) => {
      forwarded = [...(argv ?? [])];
    }
  });

  assert.equal(exitCode, 0);
  assert.deepEqual(forwarded, ["--entrypoint", "src/index.ts", "--dry-run", "--json"]);
});

test("forwards native launch-demo args to the shared Switchboard runner", async () => {
  let forwarded: readonly string[] | undefined;
  const exitCode = await runSwitchboardLaunchDemoNative(["--dry-run", "--json"], {
    runner: async (argv) => {
      forwarded = [...(argv ?? [])];
    }
  });

  assert.equal(exitCode, 0);
  assert.deepEqual(forwarded, ["--dry-run", "--json"]);
});

for (const args of [
  ["--help"]
] as const) {
  test(`matches switchboard ${args.join(" ")} output`, () => {
    const direct = spawnSync(switchboardBin, [...args], {
      cwd: repoRoot,
      encoding: "utf8",
      env: {
        ...process.env,
        NODE_ENV: "test"
      }
    });
    const plugin = runPluginBridge([...args]);

    assert.equal(plugin.status, direct.status);
    assert.equal(plugin.stdout, direct.stdout);
    assert.equal(stripPolkadotDuplicateWarnings(plugin.stderr), stripPolkadotDuplicateWarnings(direct.stderr));
  });
}

test("falls back to compatibility for init when the shared runner is unavailable", async () => {
  let forwarded: readonly string[] | undefined;
  const exitCode = await runSwitchboardInitNative(["--project", "demo"], {
    loadRunner: async () => undefined,
    compatibilityRunner: async (argv) => {
      forwarded = [...argv];
      return 0;
    }
  });

  assert.equal(exitCode, 0);
  assert.deepEqual(forwarded, ["init", "--project", "demo"]);
});

test("falls back to compatibility for project init when the shared runner is unavailable", async () => {
  let forwarded: readonly string[] | undefined;
  const exitCode = await runSwitchboardProjectInitNative(["--template", "ssh"], {
    loadRunner: async () => undefined,
    compatibilityRunner: async (argv) => {
      forwarded = [...argv];
      return 0;
    }
  });

  assert.equal(exitCode, 0);
  assert.deepEqual(forwarded, ["project", "init", "--template", "ssh"]);
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

function runPluginBridge(args: readonly string[]) {
  return spawnSync(
    process.execPath,
    [
      "--import",
      "tsx",
      "--eval",
      `const {runSwitchboardCompatibility} = await import(${JSON.stringify(commandUrl)}); process.exitCode = await runSwitchboardCompatibility(${JSON.stringify(args)});`
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

async function withMutedConsoleError<T>(fn: () => Promise<T>): Promise<T> {
  const original = console.error;
  console.error = () => {};
  try {
    return await fn();
  } finally {
    console.error = original;
  }
}

function stripPolkadotDuplicateWarnings(value: string): string {
  return value
    .split("\n")
    .filter((line) =>
      !line.startsWith("@polkadot/") &&
      !line.startsWith("Either remove and explicitly install matching versions") &&
      !line.startsWith("The following conflicting packages were found:") &&
      !line.startsWith("\tesm ")
    )
    .join("\n");
}
