# PROOF CLI Switchboard Plugin

`@proof-computer/proof-cli-switchboard` adds Switchboard commands to the public
`proof` CLI.

## PROOF Ingress parachain

Selecting a parachain `--target` (for example `proof-ingress-local`, ws
`ws://127.0.0.1:9944`) routes the accounting and route-lifecycle commands to the
`proof-ingress` Substrate pallet via `@polkadot/api` instead of the Hub EVM
relay. Signing uses an sr25519 seed (`--polkadot-seed` / `POLKADOT_SEED`); ss58
comes from the target. Every mutating command is a dry-run preview until `--yes`.

- `claim` — withdraw your claimable balance (`--mode route-credit --proof-file`
  for a Merkle route-credit claim); `claimable` reads it.
- `refund` / `refundable` — refund an unactivated or retired route by
  `--route-id` (or derive it from `--hostname`/`--route-class-id`/`--salt`).
- `lease` — `create_route_lease` (shows the precomputed route id and required
  payment); `renew`, `retire` — extend / retire a route.
- `route` — read a route's on-chain record (status, paid-until, escrow, active
  generation, refund state).

```
proof switchboard lease  --target proof-ingress-local --broker-id 0 --route-class-id 42 \
                         --hostname app.example.com --lease-epochs 10 --polkadot-seed //Alice --yes
proof switchboard route  --target proof-ingress-local --route-id 0x... --json
proof switchboard claim  --target proof-ingress-local --polkadot-seed //Alice --yes
```

The Hub EVM commands are unchanged. `test/proof-ingress-live.test.ts` is a gated
end-to-end shakeout (`PROOF_INGRESS_LIVE=1`) against a fast-epochs node.

The plugin exposes `proof switchboard ...` through native oclif commands backed
by runner implementations owned by this package. Project
initialization `init` and `project init`, fresh `deploy`,
`launch-demo`, read-only `project show`, `preflight`,
top-level `status`, context inspection `context list` and `context current`,
local context mutation `context use`, `context set`, `context add`, and
`context dns *`, accounting commands `claimable`, `claim`, `refundable`,
`refund`, `session refund`, and `session refundable`, read-only session
diagnostics `session status`, session recovery registration `session register`,
customer hostname commands `hostname status`, `hostname add`, and
`hostname remove`, validator script lookup `validator script`, validator launch
`validator launch`, read-only catalog inspection `catalog inspect` and
`catalog verify`, local catalog artifact build `catalog build`, local catalog
state mutation `catalog set-state`, gateway host commands `gateway setup`,
`gateway discover`, `gateway status`, and `gateway upgrade`, read-only relay
diagnostics `relay status`, read-only relay inventory `relay list`/`relay ls`,
read-only relay inventory comparison `relay diff`, local relay inventory sync
`relay sync`, local relay identity diagnostics `relay whoami`, encrypted relay
log inspection `relay logs`, live relay verification `relay verify`, local
relay budget calculation `relay budget`, local relay processor availability
and explicit spec pinning `relay pick-processor`,
relay DNS management `relay dns plan`, `relay dns apply`, `relay dns verify`,
and `relay dns remove`, local relay spec backfill `relay backfill-specs`,
relay health transition watching `relay watch`, local relay key generation
`relay keygen`, local relay spec generation `relay scaffold`, local relay
catalog artifact build `relay catalog build`, local relay catalog state
mutation `relay catalog set-state`, bootstrap helpers `bootstrap`, ops profile
helpers `ops`, and the deploy recovery/diagnostic
subcommands now have native oclif entrypoints that call local plugin runners.
The remaining relay commands are audited/provisional diagnostics or local
inventory tools. Relay lifecycle-management verbs are not being migrated:
`relay deploy`, `relay replace`, `relay rotate-key`, `relay drain`,
`relay promote`, `relay deployments`, `relay deployment-status`, and
`relay inspect` are dropped internal subcommands, not compatibility surfaces.
The standalone `switchboard` compatibility bridge has been removed from the
acceptance surface. Acurast remains an internal implementation detail of the
native Switchboard commands; the plugin does not expose a public
`proof switchboard acurast ...` command family.

## Install

```fish
npm install --global @proof-computer/proof-cli
proof plugins install @proof-computer/proof-cli-switchboard
proof switchboard --help
```

No standalone Switchboard CLI package is required for `proof switchboard`; new
Switchboard CLI work belongs in this oclif plugin.

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

## Local Runner Boundary

Native commands call command-specific local runners vendored under
`src/switchboard-core`. The oclif command files stay thin: they declare public
flags/help, preserve test injection hooks, and delegate to local runner
functions such as `runSwitchboardDeploy(argv, options)` and
`runSwitchboardLaunchDemo(argv, options)`.

Deploy and launch-demo progress is emitted through the proof plugin progress
reporter. Human progress is suppressed for `--json`, which remains reserved for
machine-readable output.
