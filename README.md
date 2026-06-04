# PROOF CLI Switchboard Plugin

`@proof-computer/proof-cli-switchboard` adds Switchboard commands to the public
`proof` CLI.

The plugin keeps `proof switchboard ...` compatible with the standalone
`switchboard` CLI while native oclif commands are extracted incrementally.
Project initialization `init` and `project init`, fresh `deploy`,
`launch-demo`, read-only `project show`, `preflight`,
top-level `status`, context inspection `context list` and `context current`,
local context mutation `context use`, `context set`, `context add`, and
`context dns *`, accounting commands `claimable`, `claim`, `refundable`,
`refund`, `session refund`, and `session refundable`, read-only session
diagnostics `session status`, session recovery registration `session register`,
customer hostname commands
`hostname status`, `hostname add`, and `hostname remove`, validator script
lookup `validator script`, read-only catalog inspection `catalog inspect` and
`catalog verify`, local catalog artifact build `catalog build`, local catalog
state mutation `catalog set-state`, gateway host commands `gateway setup`,
`gateway discover`, `gateway status`, and `gateway upgrade`, read-only relay
diagnostics `relay status`, read-only relay inventory `relay list`/`relay ls`,
read-only relay inventory comparison `relay diff`, local relay inventory sync
`relay sync`, local relay identity diagnostics `relay whoami`, encrypted relay log inspection
`relay logs`, live relay verification `relay verify`, local relay budget
calculation `relay budget`, local relay processor availability and explicit
spec pinning `relay pick-processor`,
read-only relay DNS diagnostics `relay dns plan` and `relay dns verify`,
relay health transition watching `relay watch`, local relay key generation
`relay keygen`, local relay spec generation `relay scaffold`, local relay
catalog artifact build `relay catalog build`, local relay catalog state
mutation `relay catalog set-state`, and the deploy recovery/diagnostic
subcommands now have native oclif entrypoints that call shared
`switchboard-cli` runners.
The remaining relay commands are audited/provisional diagnostics or local
inventory tools. Relay lifecycle-management verbs are not being migrated:
`relay deploy`, `relay replace`, `relay rotate-key`, `relay drain`,
`relay promote`, `relay deployments`, `relay deployment-status`, and
`relay inspect` are dropped internal subcommands, not compatibility surfaces.
Validator launch, `relay dns apply/remove`, `relay backfill-specs`, bootstrap,
ops, and commands that have
not been extracted yet still forward through the compatibility wrapper.

## Install

```fish
npm install --global @proof-computer/proof-cli
proof plugins install @proof-computer/proof-cli-switchboard
proof switchboard --help
```

The standalone `switchboard` binary remains supported by `switchboard-cli`
during the migration.

## Development

```fish
pnpm install
pnpm typecheck
pnpm test
pnpm build
node scripts/verify-package.mjs
pnpm pack:dry-run
```

Local root CLI smoke, from this checkout beside `../proof-cli`:

```fish
pnpm smoke:proof-plugin
```

## Compatibility Boundary

The compatibility wrapper first tries to call `runSwitchboardCli(argv)` from
`@proof-computer/switchboard-cli` in-process. Native commands call their
command-specific shared runners, such as `runSwitchboardDeploy(argv)` or
`runSwitchboardLaunchDemo(argv)`. Project initialization uses
`runSwitchboardProjectInit(argv)`. Read-only inspection commands use
`runSwitchboardProjectShow(argv)`, `runSwitchboardPreflight(argv)`, and
`runSwitchboardDeploymentStatus(argv)`. Context inspection uses
`runSwitchboardContextList(argv)` and `runSwitchboardContextCurrent(argv)`;
local context mutation uses `runSwitchboardContextUse(argv)`,
`runSwitchboardContextSet(argv)`, `runSwitchboardContextAdd(argv)`,
`runSwitchboardContextDnsSet(argv)`, and
`runSwitchboardContextDnsClear(argv)`.
Accounting commands use `runSwitchboardClaimable(argv)`,
`runSwitchboardClaim(argv)`, `runSwitchboardRefundable(argv)`, and
`runSwitchboardRefund(argv)`, with `proof switchboard session refundable` and
`proof switchboard session refund` using the same refundable/refund runners
through advanced session aliases. Read-only session diagnostics use
`runSwitchboardSessionStatus(argv)`. Session registration uses
`runSwitchboardSessionRegister(argv)`. Customer hostname
commands use
`runSwitchboardHostnameStatus(argv)`, `runSwitchboardHostnameAdd(argv)`, and
`runSwitchboardHostnameRemove(argv)`. Read-only validator script lookup uses
`runSwitchboardValidatorScript(argv)`. Read-only catalog inspection uses
`runSwitchboardCatalogInspect(argv)` and `runSwitchboardCatalogVerify(argv)`;
catalog build uses `runSwitchboardCatalogBuild(argv)`, and catalog state
mutation uses `runSwitchboardCatalogSetState(argv)`.
Gateway host commands use
`runSwitchboardGatewaySetup(argv)`, `runSwitchboardGatewayDiscover(argv)`,
`runSwitchboardGatewayStatus(argv)`, and
`runSwitchboardGatewayUpgrade(argv)`. Read-only relay diagnostics use
`runSwitchboardRelayStatus(argv)` and read-only relay inventory uses
`runSwitchboardRelayList(argv)`. Read-only relay inventory comparison uses
`runSwitchboardRelayDiff(argv)`. Local relay inventory sync uses
`runSwitchboardRelaySync(argv)` while preserving signed discovery, local
`relays/catalog.json` writes, missing stub-spec generation, and existing-spec
preservation. Local relay identity diagnostics use
`runSwitchboardRelayWhoami(argv)`. Relay log inspection uses
`runSwitchboardRelayLogs(argv)` for encrypted read-only log sink reads. Live
relay verification uses `runSwitchboardRelayVerify(argv)` for read-only local
catalog checks, signed live catalog discovery, endpoint probes, and peer
reachability checks. Local relay budget calculation uses
`runSwitchboardRelayBudget(argv)` while preserving the existing text/JSON
output and explicit `--update <spec>` local Acurast spec update. Relay
processor availability uses `runSwitchboardRelayPickProcessor(argv)` while
preserving manager discovery, schedule conflict checks, text/JSON output, and
explicit `--pin` local Acurast spec updates. Read-only relay DNS diagnostics
use `runSwitchboardRelayDnsPlan(argv)` and
`runSwitchboardRelayDnsVerify(argv)` while preserving spec resolution, public
CNAME checks, resolver overrides, no-DNS no-op behavior, and no Cloudflare
credential requirement. Relay health transition watching uses
`runSwitchboardRelayWatch(argv)` while preserving local relay catalog reads,
endpoint probes, `--interval-ms`, `--max-runs`, and read-only transition
output. Relay key generation uses `runSwitchboardRelayKeygen(argv)` while
preserving relay-id validation, default env-name derivation, stdout/stderr
secret handling, and explicit `--unsafe-stdout`. Relay spec generation uses
`runSwitchboardRelayScaffold(argv)` while preserving local
`relays/<relay-id>.json` writes, bootstrap/Acurast defaults, optional keygen
stderr secret handling, overwrite refusal without `--force`, validation
errors, and no live relay, catalog, DNS, deploy, chain, or context mutation.
Relay catalog artifact builds use `runSwitchboardRelayCatalogBuild(argv)`
while preserving local relay spec discovery, local catalog-state overlay,
signing-key fallback, and output/stdout handling. Relay catalog state mutation
uses
`runSwitchboardRelayCatalogSetState(argv)` while preserving local catalog-file
updates, optional rebuild/signing, and no live publish/DNS/deploy/chain
behavior. If an installed Switchboard
CLI package does not export the expected runner yet, the plugin falls back to
spawning the packaged `switchboard` binary for that command. The child-process
fallback is transitional and should be removed after the public Switchboard CLI
release that exposes the shared runners is the minimum supported dependency.
Removed relay lifecycle-management commands are rejected before either
in-process loading or child-process fallback.
