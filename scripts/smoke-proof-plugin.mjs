import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const proofCliRoot = path.resolve(process.env.PROOF_CLI_ROOT ?? path.join(repoRoot, "..", "proof-cli"));
const proofDevBin = path.join(proofCliRoot, "bin", "dev.js");
const home = await mkdtemp(path.join(tmpdir(), "proof-cli-switchboard-smoke-"));

try {
  const env = {
    ...process.env,
    HOME: home,
    XDG_CACHE_HOME: path.join(home, ".cache"),
    XDG_CONFIG_HOME: path.join(home, ".config"),
    XDG_DATA_HOME: path.join(home, ".local", "share"),
    NODE_ENV: "test"
  };

  run(process.execPath, [proofDevBin, "plugins", "link", repoRoot], { cwd: proofCliRoot, env });

  const plugins = run(process.execPath, [proofDevBin, "plugins"], { cwd: proofCliRoot, env });
  assertIncludes(plugins.stdout, "@proof-computer/proof-cli-switchboard");

  const help = run(process.execPath, [proofDevBin, "switchboard", "--help"], { cwd: proofCliRoot, env });
  assertIncludes(help.stdout, "Switchboard ingress commands.");
  assertIncludes(help.stdout, "compatibility bridge has been removed");
  assertExcludes(help.stdout, "switchboard launch-demo --yes-spend");

  const deployHelp = run(process.execPath, [proofDevBin, "switchboard", "deploy", "--help"], { cwd: proofCliRoot, env });
  assertIncludes(deployHelp.stdout, "Deploy a project workload through Switchboard");
  assertIncludes(deployHelp.stdout, "--entrypoint");
  assertExcludes(deployHelp.stdout, "Switchboard, a PROOF project");

  const launchDemoHelp = run(process.execPath, [proofDevBin, "switchboard", "launch-demo", "--help"], { cwd: proofCliRoot, env });
  assertIncludes(launchDemoHelp.stdout, "Launch the bundled Switchboard demo");
  assertIncludes(launchDemoHelp.stdout, "--yes-spend");
  assertExcludes(launchDemoHelp.stdout, "Switchboard, a PROOF project");

  const initHelp = run(process.execPath, [proofDevBin, "switchboard", "init", "--help"], { cwd: proofCliRoot, env });
  assertIncludes(initHelp.stdout, "Initialize a local Switchboard project");
  assertIncludes(initHelp.stdout, "--template");
  assertExcludes(initHelp.stdout, "Switchboard, a PROOF project");

  const projectInitHelp = run(process.execPath, [proofDevBin, "switchboard", "project", "init", "--help"], { cwd: proofCliRoot, env });
  assertIncludes(projectInitHelp.stdout, "Initialize a local Switchboard project");
  assertIncludes(projectInitHelp.stdout, "switchboard project init");
  assertExcludes(projectInitHelp.stdout, "Switchboard, a PROOF project");

  const projectShowHelp = run(process.execPath, [proofDevBin, "switchboard", "project", "show", "--help"], { cwd: proofCliRoot, env });
  assertIncludes(projectShowHelp.stdout, "Show local Switchboard project state");
  assertIncludes(projectShowHelp.stdout, "--project-dir");
  assertExcludes(projectShowHelp.stdout, "Switchboard, a PROOF project");

  const preflightHelp = run(process.execPath, [proofDevBin, "switchboard", "preflight", "--help"], { cwd: proofCliRoot, env });
  assertIncludes(preflightHelp.stdout, "Check Switchboard deploy readiness");
  assertIncludes(preflightHelp.stdout, "--manifest-url");
  assertExcludes(preflightHelp.stdout, "Switchboard, a PROOF project");

  const statusHelp = run(process.execPath, [proofDevBin, "switchboard", "status", "--help"], { cwd: proofCliRoot, env });
  assertIncludes(statusHelp.stdout, "Diagnose a Switchboard deployment");
  assertIncludes(statusHelp.stdout, "--session-id");
  assertExcludes(statusHelp.stdout, "Switchboard, a PROOF project");

  const sessionStatusHelp = run(process.execPath, [proofDevBin, "switchboard", "session", "status", "--help"], { cwd: proofCliRoot, env });
  assertIncludes(sessionStatusHelp.stdout, "Read raw Switchboard Hub session state");
  assertIncludes(sessionStatusHelp.stdout, "--session-id");
  assertExcludes(sessionStatusHelp.stdout, "Switchboard, a PROOF project");

  const sessionRegisterHelp = run(process.execPath, [proofDevBin, "switchboard", "session", "register", "--help"], { cwd: proofCliRoot, env });
  assertIncludes(sessionRegisterHelp.stdout, "Register a funded Switchboard session");
  assertIncludes(sessionRegisterHelp.stdout, "--job-signer-private-key");
  assertExcludes(sessionRegisterHelp.stdout, "Switchboard, a PROOF project");

  const hostnameStatusHelp = run(process.execPath, [proofDevBin, "switchboard", "hostname", "status", "--help"], { cwd: proofCliRoot, env });
  assertIncludes(hostnameStatusHelp.stdout, "Check Switchboard customer hostname status");
  assertIncludes(hostnameStatusHelp.stdout, "--endpoint");
  assertExcludes(hostnameStatusHelp.stdout, "Switchboard, a PROOF project");

  const hostnameAddHelp = run(process.execPath, [proofDevBin, "switchboard", "hostname", "add", "--help"], { cwd: proofCliRoot, env });
  assertIncludes(hostnameAddHelp.stdout, "Attach a Switchboard customer hostname");
  assertIncludes(hostnameAddHelp.stdout, "--developer-private-key-env");
  assertExcludes(hostnameAddHelp.stdout, "Switchboard, a PROOF project");

  const hostnameRemoveHelp = run(process.execPath, [proofDevBin, "switchboard", "hostname", "remove", "--help"], { cwd: proofCliRoot, env });
  assertIncludes(hostnameRemoveHelp.stdout, "Remove a Switchboard customer hostname");
  assertIncludes(hostnameRemoveHelp.stdout, "--developer-private-key-env");
  assertExcludes(hostnameRemoveHelp.stdout, "Switchboard, a PROOF project");

  const validatorScriptHelp = run(process.execPath, [proofDevBin, "switchboard", "validator", "script", "--help"], { cwd: proofCliRoot, env });
  assertIncludes(validatorScriptHelp.stdout, "Look up the approved Switchboard validator script pin");
  assertIncludes(validatorScriptHelp.stdout, "--validator-script-manifest-url");
  assertExcludes(validatorScriptHelp.stdout, "Switchboard, a PROOF project");

  const catalogBuildHelp = run(process.execPath, [proofDevBin, "switchboard", "catalog", "build", "--help"], { cwd: proofCliRoot, env });
  assertIncludes(catalogBuildHelp.stdout, "Build signed Switchboard service catalogs");
  assertIncludes(catalogBuildHelp.stdout, "--signing-key");
  assertExcludes(catalogBuildHelp.stdout, "Switchboard, a PROOF project");

  const catalogSetStateHelp = run(process.execPath, [proofDevBin, "switchboard", "catalog", "set-state", "--help"], { cwd: proofCliRoot, env });
  assertIncludes(catalogSetStateHelp.stdout, "Update local Switchboard catalog service state");
  assertIncludes(catalogSetStateHelp.stdout, "--no-rebuild");
  assertExcludes(catalogSetStateHelp.stdout, "--json");
  assertExcludes(catalogSetStateHelp.stdout, "Switchboard, a PROOF project");

  const catalogInspectHelp = run(process.execPath, [proofDevBin, "switchboard", "catalog", "inspect", "--help"], { cwd: proofCliRoot, env });
  assertIncludes(catalogInspectHelp.stdout, "Inspect signed Switchboard service catalogs");
  assertIncludes(catalogInspectHelp.stdout, "--allow-expired");
  assertExcludes(catalogInspectHelp.stdout, "Switchboard, a PROOF project");

  const catalogVerifyHelp = run(process.execPath, [proofDevBin, "switchboard", "catalog", "verify", "--help"], { cwd: proofCliRoot, env });
  assertIncludes(catalogVerifyHelp.stdout, "Verify signed Switchboard service catalogs");
  assertIncludes(catalogVerifyHelp.stdout, "--allow-unpinned-signer");
  assertExcludes(catalogVerifyHelp.stdout, "Switchboard, a PROOF project");

  const gatewaySetupHelp = run(process.execPath, [proofDevBin, "switchboard", "gateway", "setup", "--help"], { cwd: proofCliRoot, env });
  assertIncludes(gatewaySetupHelp.stdout, "Prepare a Switchboard gateway host");
  assertIncludes(gatewaySetupHelp.stdout, "--upstream-admission-url");
  assertExcludes(gatewaySetupHelp.stdout, "Switchboard, a PROOF project");

  const gatewayDiscoverHelp = run(process.execPath, [proofDevBin, "switchboard", "gateway", "discover", "--help"], { cwd: proofCliRoot, env });
  assertIncludes(gatewayDiscoverHelp.stdout, "Check gateway-local Acurast processor readiness");
  assertIncludes(gatewayDiscoverHelp.stdout, "--gateway-agent-url");
  assertExcludes(gatewayDiscoverHelp.stdout, "Switchboard, a PROOF project");

  const gatewayStatusHelp = run(process.execPath, [proofDevBin, "switchboard", "gateway", "status", "--help"], { cwd: proofCliRoot, env });
  assertIncludes(gatewayStatusHelp.stdout, "Show local Switchboard gateway stack status");
  assertIncludes(gatewayStatusHelp.stdout, "--capability-token-env");
  assertExcludes(gatewayStatusHelp.stdout, "Switchboard, a PROOF project");

  const relayStatusHelp = run(process.execPath, [proofDevBin, "switchboard", "relay", "status", "--help"], { cwd: proofCliRoot, env });
  assertIncludes(relayStatusHelp.stdout, "Probe Switchboard relay health and catalog status");
  assertIncludes(relayStatusHelp.stdout, "--catalog-file");
  assertExcludes(relayStatusHelp.stdout, "--json");
  assertExcludes(relayStatusHelp.stdout, "Switchboard, a PROOF project");

  const relayListHelp = run(process.execPath, [proofDevBin, "switchboard", "relay", "list", "--help"], { cwd: proofCliRoot, env });
  assertIncludes(relayListHelp.stdout, "List Switchboard relay inventory");
  assertIncludes(relayListHelp.stdout, "--source");
  assertIncludes(relayListHelp.stdout, "--json");
  assertExcludes(relayListHelp.stdout, "Switchboard, a PROOF project");

  const relayDiffHelp = run(process.execPath, [proofDevBin, "switchboard", "relay", "diff", "--help"], { cwd: proofCliRoot, env });
  assertIncludes(relayDiffHelp.stdout, "Compare local Switchboard relay inventory with live discovery");
  assertIncludes(relayDiffHelp.stdout, "--manifest-url");
  assertIncludes(relayDiffHelp.stdout, "--json");
  assertExcludes(relayDiffHelp.stdout, "Switchboard, a PROOF project");

  const relaySyncHelp = run(process.execPath, [proofDevBin, "switchboard", "relay", "sync", "--help"], { cwd: proofCliRoot, env });
  assertIncludes(relaySyncHelp.stdout, "Sync local Switchboard relay inventory from signed discovery");
  assertIncludes(relaySyncHelp.stdout, "--manifest-url");
  assertIncludes(relaySyncHelp.stdout, "--allow-unpinned-signer");
  assertIncludes(relaySyncHelp.stdout, "--dry-run");
  assertExcludes(relaySyncHelp.stdout, "--json");
  assertExcludes(relaySyncHelp.stdout, "--yes");
  assertExcludes(relaySyncHelp.stdout, "Switchboard, a PROOF project");

  const relayPickProcessorHelp = run(process.execPath, [proofDevBin, "switchboard", "relay", "pick-processor", "--help"], { cwd: proofCliRoot, env });
  assertIncludes(relayPickProcessorHelp.stdout, "Inspect Acurast processor availability for a Switchboard relay");
  assertIncludes(relayPickProcessorHelp.stdout, "--manager-id");
  assertIncludes(relayPickProcessorHelp.stdout, "--pin");
  assertIncludes(relayPickProcessorHelp.stdout, "--json");
  assertExcludes(relayPickProcessorHelp.stdout, "Switchboard, a PROOF project");

  const relayLogsHelp = run(process.execPath, [proofDevBin, "switchboard", "relay", "logs", "--help"], { cwd: proofCliRoot, env });
  assertIncludes(relayLogsHelp.stdout, "Read encrypted Switchboard relay log events");
  assertIncludes(relayLogsHelp.stdout, "--read-url");
  assertIncludes(relayLogsHelp.stdout, "--encryption-key-env");
  assertIncludes(relayLogsHelp.stdout, "--json");
  assertExcludes(relayLogsHelp.stdout, "Switchboard, a PROOF project");

  const relayVerifyHelp = run(process.execPath, [proofDevBin, "switchboard", "relay", "verify", "--help"], { cwd: proofCliRoot, env });
  assertIncludes(relayVerifyHelp.stdout, "Verify a deployed Switchboard relay");
  assertIncludes(relayVerifyHelp.stdout, "--manifest-url");
  assertExcludes(relayVerifyHelp.stdout, "--json");
  assertExcludes(relayVerifyHelp.stdout, "Switchboard, a PROOF project");

  const relayDnsPlanHelp = run(process.execPath, [proofDevBin, "switchboard", "relay", "dns", "plan", "--help"], { cwd: proofCliRoot, env });
  assertIncludes(relayDnsPlanHelp.stdout, "Plan Switchboard relay DNS records");
  assertIncludes(relayDnsPlanHelp.stdout, "--spec-file");
  assertIncludes(relayDnsPlanHelp.stdout, "--resolvers");
  assertExcludes(relayDnsPlanHelp.stdout, "--json");
  assertExcludes(relayDnsPlanHelp.stdout, "Switchboard, a PROOF project");

  const relayDnsVerifyHelp = run(process.execPath, [proofDevBin, "switchboard", "relay", "dns", "verify", "--help"], { cwd: proofCliRoot, env });
  assertIncludes(relayDnsVerifyHelp.stdout, "Verify Switchboard relay DNS records");
  assertIncludes(relayDnsVerifyHelp.stdout, "--spec-file");
  assertIncludes(relayDnsVerifyHelp.stdout, "--resolvers");
  assertExcludes(relayDnsVerifyHelp.stdout, "--json");
  assertExcludes(relayDnsVerifyHelp.stdout, "Switchboard, a PROOF project");

  const relayBudgetHelp = run(process.execPath, [proofDevBin, "switchboard", "relay", "budget", "--help"], { cwd: proofCliRoot, env });
  assertIncludes(relayBudgetHelp.stdout, "Calculate a Switchboard relay execution budget");
  assertIncludes(relayBudgetHelp.stdout, "--rate-per-ms");
  assertIncludes(relayBudgetHelp.stdout, "--margin-percent");
  assertIncludes(relayBudgetHelp.stdout, "--update");
  assertIncludes(relayBudgetHelp.stdout, "--json");
  assertExcludes(relayBudgetHelp.stdout, "Switchboard, a PROOF project");

  const relayCatalogBuildHelp = run(process.execPath, [proofDevBin, "switchboard", "relay", "catalog", "build", "--help"], { cwd: proofCliRoot, env });
  assertIncludes(relayCatalogBuildHelp.stdout, "Build a signed Switchboard relay catalog bundle");
  assertIncludes(relayCatalogBuildHelp.stdout, "--specs-dir");
  assertIncludes(relayCatalogBuildHelp.stdout, "--signing-key");
  assertExcludes(relayCatalogBuildHelp.stdout, "--json");
  assertExcludes(relayCatalogBuildHelp.stdout, "--yes");
  assertExcludes(relayCatalogBuildHelp.stdout, "Switchboard, a PROOF project");

  const relayCatalogSetStateHelp = run(process.execPath, [proofDevBin, "switchboard", "relay", "catalog", "set-state", "--help"], { cwd: proofCliRoot, env });
  assertIncludes(relayCatalogSetStateHelp.stdout, "Update local Switchboard relay catalog state");
  assertIncludes(relayCatalogSetStateHelp.stdout, "--catalog-file");
  assertIncludes(relayCatalogSetStateHelp.stdout, "--no-rebuild");
  assertExcludes(relayCatalogSetStateHelp.stdout, "--json");
  assertExcludes(relayCatalogSetStateHelp.stdout, "--yes");
  assertExcludes(relayCatalogSetStateHelp.stdout, "--signing-key");
  assertExcludes(relayCatalogSetStateHelp.stdout, "Switchboard, a PROOF project");

  const relayWatchHelp = run(process.execPath, [proofDevBin, "switchboard", "relay", "watch", "--help"], { cwd: proofCliRoot, env });
  assertIncludes(relayWatchHelp.stdout, "Watch Switchboard relay health transitions");
  assertIncludes(relayWatchHelp.stdout, "--interval-ms");
  assertIncludes(relayWatchHelp.stdout, "--max-runs");
  assertExcludes(relayWatchHelp.stdout, "--json");
  assertExcludes(relayWatchHelp.stdout, "--yes");
  assertExcludes(relayWatchHelp.stdout, "Switchboard, a PROOF project");

  const relayWhoamiHelp = run(process.execPath, [proofDevBin, "switchboard", "relay", "whoami", "--help"], { cwd: proofCliRoot, env });
  assertIncludes(relayWhoamiHelp.stdout, "Show the Acurast deployer identity for a relay seed");
  assertIncludes(relayWhoamiHelp.stdout, "--seed-env");
  assertIncludes(relayWhoamiHelp.stdout, "--json");
  assertExcludes(relayWhoamiHelp.stdout, "Switchboard, a PROOF project");

  const relayKeygenHelp = run(process.execPath, [proofDevBin, "switchboard", "relay", "keygen", "--help"], { cwd: proofCliRoot, env });
  assertIncludes(relayKeygenHelp.stdout, "Generate local Switchboard relay key material");
  assertIncludes(relayKeygenHelp.stdout, "--env-name");
  assertIncludes(relayKeygenHelp.stdout, "--unsafe-stdout");
  assertExcludes(relayKeygenHelp.stdout, "--json");
  assertExcludes(relayKeygenHelp.stdout, "--yes");
  assertExcludes(relayKeygenHelp.stdout, "Switchboard, a PROOF project");

  const relayScaffoldHelp = run(process.execPath, [proofDevBin, "switchboard", "relay", "scaffold", "--help"], { cwd: proofCliRoot, env });
  assertIncludes(relayScaffoldHelp.stdout, "Scaffold a local Switchboard relay spec");
  assertIncludes(relayScaffoldHelp.stdout, "--target");
  assertIncludes(relayScaffoldHelp.stdout, "--manager-id");
  assertIncludes(relayScaffoldHelp.stdout, "--keygen");
  assertExcludes(relayScaffoldHelp.stdout, "--json");
  assertExcludes(relayScaffoldHelp.stdout, "--yes");
  assertExcludes(relayScaffoldHelp.stdout, "Switchboard, a PROOF project");

  const relayLsHelp = run(process.execPath, [proofDevBin, "switchboard", "relay", "ls", "--help"], { cwd: proofCliRoot, env });
  assertIncludes(relayLsHelp.stdout, "List Switchboard relay inventory");
  assertIncludes(relayLsHelp.stdout, "--source");
  assertExcludes(relayLsHelp.stdout, "Switchboard, a PROOF project");

  const gatewayUpgradeHelp = run(process.execPath, [proofDevBin, "switchboard", "gateway", "upgrade", "--help"], { cwd: proofCliRoot, env });
  assertIncludes(gatewayUpgradeHelp.stdout, "Upgrade the local Switchboard gateway stack");
  assertIncludes(gatewayUpgradeHelp.stdout, "--keep-image-override");
  assertExcludes(gatewayUpgradeHelp.stdout, "Switchboard, a PROOF project");

  const claimableHelp = run(process.execPath, [proofDevBin, "switchboard", "claimable", "--help"], { cwd: proofCliRoot, env });
  assertIncludes(claimableHelp.stdout, "Check Switchboard claimable rewards");
  assertIncludes(claimableHelp.stdout, "--recipient");
  assertExcludes(claimableHelp.stdout, "Switchboard, a PROOF project");

  const claimHelp = run(process.execPath, [proofDevBin, "switchboard", "claim", "--help"], { cwd: proofCliRoot, env });
  assertIncludes(claimHelp.stdout, "Claim Switchboard rewards");
  assertIncludes(claimHelp.stdout, "--claim-private-key-env");
  assertExcludes(claimHelp.stdout, "Switchboard, a PROOF project");

  const refundableHelp = run(process.execPath, [proofDevBin, "switchboard", "refundable", "--help"], { cwd: proofCliRoot, env });
  assertIncludes(refundableHelp.stdout, "Check Switchboard refundable session state");
  assertIncludes(refundableHelp.stdout, "--session-id");
  assertExcludes(refundableHelp.stdout, "Switchboard, a PROOF project");

  const sessionRefundableHelp = run(process.execPath, [proofDevBin, "switchboard", "session", "refundable", "--help"], { cwd: proofCliRoot, env });
  assertIncludes(sessionRefundableHelp.stdout, "Check Switchboard refundable session state");
  assertIncludes(sessionRefundableHelp.stdout, "switchboard session refundable");
  assertExcludes(sessionRefundableHelp.stdout, "Switchboard, a PROOF project");

  const refundHelp = run(process.execPath, [proofDevBin, "switchboard", "refund", "--help"], { cwd: proofCliRoot, env });
  assertIncludes(refundHelp.stdout, "Refund a Switchboard session");
  assertIncludes(refundHelp.stdout, "--developer-private-key-env");
  assertExcludes(refundHelp.stdout, "Switchboard, a PROOF project");

  const sessionRefundHelp = run(process.execPath, [proofDevBin, "switchboard", "session", "refund", "--help"], { cwd: proofCliRoot, env });
  assertIncludes(sessionRefundHelp.stdout, "Refund a Switchboard session");
  assertIncludes(sessionRefundHelp.stdout, "switchboard session refund");
  assertExcludes(sessionRefundHelp.stdout, "Switchboard, a PROOF project");

  const contextListHelp = run(process.execPath, [proofDevBin, "switchboard", "context", "list", "--help"], { cwd: proofCliRoot, env });
  assertIncludes(contextListHelp.stdout, "List Switchboard contexts");
  assertIncludes(contextListHelp.stdout, "--project-dir");
  assertExcludes(contextListHelp.stdout, "Switchboard, a PROOF project");

  const contextCurrentHelp = run(process.execPath, [proofDevBin, "switchboard", "context", "current", "--help"], { cwd: proofCliRoot, env });
  assertIncludes(contextCurrentHelp.stdout, "Show the current Switchboard context");
  assertIncludes(contextCurrentHelp.stdout, "--context");
  assertExcludes(contextCurrentHelp.stdout, "Switchboard, a PROOF project");

  const contextUseHelp = run(process.execPath, [proofDevBin, "switchboard", "context", "use", "--help"], { cwd: proofCliRoot, env });
  assertIncludes(contextUseHelp.stdout, "Select the current Switchboard context");
  assertIncludes(contextUseHelp.stdout, "--context");
  assertExcludes(contextUseHelp.stdout, "Switchboard, a PROOF project");

  const contextSetHelp = run(process.execPath, [proofDevBin, "switchboard", "context", "set", "--help"], { cwd: proofCliRoot, env });
  assertIncludes(contextSetHelp.stdout, "Create or update a Switchboard context");
  assertIncludes(contextSetHelp.stdout, "--relay-url");
  assertExcludes(contextSetHelp.stdout, "Switchboard, a PROOF project");

  const contextAddHelp = run(process.execPath, [proofDevBin, "switchboard", "context", "add", "--help"], { cwd: proofCliRoot, env });
  assertIncludes(contextAddHelp.stdout, "Interactively create a Switchboard context");
  assertIncludes(contextAddHelp.stdout, "--no-balance-check");
  assertExcludes(contextAddHelp.stdout, "Switchboard, a PROOF project");

  const contextDnsSetHelp = run(process.execPath, [proofDevBin, "switchboard", "context", "dns", "set", "--help"], { cwd: proofCliRoot, env });
  assertIncludes(contextDnsSetHelp.stdout, "Attach a DNS provider to a Switchboard context");
  assertIncludes(contextDnsSetHelp.stdout, "--token-env");
  assertExcludes(contextDnsSetHelp.stdout, "Switchboard, a PROOF project");

  const contextDnsClearHelp = run(process.execPath, [proofDevBin, "switchboard", "context", "dns", "clear", "--help"], { cwd: proofCliRoot, env });
  assertIncludes(contextDnsClearHelp.stdout, "Detach a DNS provider from a Switchboard context");
  assertIncludes(contextDnsClearHelp.stdout, "context dns remove");
  assertExcludes(contextDnsClearHelp.stdout, "Switchboard, a PROOF project");

  const contextDnsRemoveHelp = run(process.execPath, [proofDevBin, "switchboard", "context", "dns", "remove", "--help"], { cwd: proofCliRoot, env });
  assertIncludes(contextDnsRemoveHelp.stdout, "Detach a DNS provider from a Switchboard context");
  assertExcludes(contextDnsRemoveHelp.stdout, "Switchboard, a PROOF project");

  const contextDnsRmHelp = run(process.execPath, [proofDevBin, "switchboard", "context", "dns", "rm", "--help"], { cwd: proofCliRoot, env });
  assertIncludes(contextDnsRmHelp.stdout, "Detach a DNS provider from a Switchboard context");
  assertExcludes(contextDnsRmHelp.stdout, "Switchboard, a PROOF project");

  const deployDoctorHelp = run(process.execPath, [proofDevBin, "switchboard", "deploy", "doctor", "--help"], { cwd: proofCliRoot, env });
  assertIncludes(deployDoctorHelp.stdout, "Diagnose Switchboard deploy state");
  assertIncludes(deployDoctorHelp.stdout, "--probe");
  assertExcludes(deployDoctorHelp.stdout, "Switchboard, a PROOF project");

  const deployStatusHelp = run(process.execPath, [proofDevBin, "switchboard", "deploy", "status", "--help"], { cwd: proofCliRoot, env });
  assertIncludes(deployStatusHelp.stdout, "Read local Switchboard deploy workflow state");
  assertIncludes(deployStatusHelp.stdout, "--run-dir");
  assertExcludes(deployStatusHelp.stdout, "Switchboard, a PROOF project");

  const deployResumeHelp = run(process.execPath, [proofDevBin, "switchboard", "deploy", "resume", "--help"], { cwd: proofCliRoot, env });
  assertIncludes(deployResumeHelp.stdout, "Resume a single-replica Switchboard deploy workflow");
  assertIncludes(deployResumeHelp.stdout, "--allow-late-funding");
  assertExcludes(deployResumeHelp.stdout, "Switchboard, a PROOF project");

  console.log("Root proof plugin smoke passed.");
} finally {
  await rm(home, { recursive: true, force: true });
}

function run(command, args, options) {
  const result = spawnSync(command, args, {
    cwd: options.cwd,
    encoding: "utf8",
    env: options.env,
    shell: false
  });
  if (result.status !== 0) {
    throw new Error([
      `Command failed: ${command} ${args.join(" ")}`,
      `exit: ${result.status}`,
      result.stdout,
      result.stderr
    ].filter(Boolean).join("\n"));
  }
  return result;
}

function assertIncludes(value, expected) {
  if (!value.includes(expected)) {
    throw new Error(`Expected output to include ${JSON.stringify(expected)}.\nOutput:\n${value}`);
  }
}

function assertExcludes(value, expected) {
  if (value.includes(expected)) {
    throw new Error(`Expected output not to include ${JSON.stringify(expected)}.\nOutput:\n${value}`);
  }
}
