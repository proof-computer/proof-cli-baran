# Agent Instructions

This public package owns the Switchboard plugin for the root `proof` CLI.

- Keep this package public-safe. Do not add private Blackbox, Lockbox, Slipway,
  relay-ops, or monorepo-only dependencies.
- This is the home for user-facing Switchboard CLI work. Add or change
  `proof switchboard ...` behavior here as native oclif commands.
- Do not restore the generic compatibility bridge to the standalone
  `switchboard` binary. Command wrappers may call temporary command-specific
  shared runners while code is migrated, but missing runner exports must fail
  closed instead of spawning legacy non-oclif CLI code.
- Keep public command names and flags stable unless a migration slice
  explicitly scopes the breaking change.
- Keep package verification focused on the npm tarball surface: `dist`,
  `oclif.manifest.json`, and `README.md`.

## CLI Development Guidance

When extracting native oclif commands or changing command behavior, review
Liran Tal's Node.js CLI Apps Best Practices and its agent-oriented skill:

- https://github.com/lirantal/nodejs-cli-apps-best-practices
- https://github.com/lirantal/nodejs-cli-apps-best-practices/tree/main/skills/nodejs-cli-best-practices

Use it as a checklist for POSIX-style flags, downstream help behavior,
structured output, configuration precedence, actionable errors, debug output,
exit codes, version output, package `files`, strict opt-in analytics, and
argument-injection safety. The oclif plugin is the command contract; legacy
standalone `switchboard` behavior is not a compatibility target to preserve
unless a migration slice explicitly says so.
