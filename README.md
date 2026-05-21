# PROOF CLI Switchboard Plugin

`@proof-computer/proof-cli-switchboard` adds Switchboard commands to the public
`proof` CLI.

This first slice is a compatibility plugin: `proof switchboard ...` forwards to
the existing `switchboard-cli` command implementation so the command names,
flags, prompts, environment handling, working directory behavior, and output
stay aligned while native oclif commands are extracted later.

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

The plugin first tries to call `runSwitchboardCli(argv)` from
`@proof-computer/switchboard-cli` in-process. If the installed Switchboard CLI
package does not export that runner yet, it falls back to spawning the
packaged `switchboard` binary. The
child-process fallback is transitional and should be removed after the public
Switchboard CLI release that exposes the shared runner is the minimum
supported dependency.
