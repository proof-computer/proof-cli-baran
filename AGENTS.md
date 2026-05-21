# Agent Instructions

This public package owns the Switchboard plugin for the root `proof` CLI.

- Keep this package public-safe. Do not add private Blackbox, Lockbox, Slipway,
  relay-ops, or monorepo-only dependencies.
- The first command surface is compatibility forwarding to `switchboard-cli`.
  Do not rename Switchboard commands or flags in this package until the native
  oclif migration is explicitly scoped.
- Keep package verification focused on the npm tarball surface: `dist`,
  `oclif.manifest.json`, and `README.md`.

## CLI Development Guidance

When extracting native oclif commands or changing compatibility behavior,
review Liran Tal's Node.js CLI Apps Best Practices and its agent-oriented
skill:

- https://github.com/lirantal/nodejs-cli-apps-best-practices
- https://github.com/lirantal/nodejs-cli-apps-best-practices/tree/main/skills/nodejs-cli-best-practices

Use it as a checklist for POSIX-style flags, downstream help behavior,
structured output, configuration precedence, actionable errors, debug output,
exit codes, version output, package `files`, strict opt-in analytics, and
argument-injection safety. The compatibility wrapper must still preserve the
standalone `switchboard` semantics unless a migration slice explicitly changes
that contract.
