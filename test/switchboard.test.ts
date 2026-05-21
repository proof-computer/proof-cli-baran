import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

import { runSwitchboardCompatibility } from "../src/commands/switchboard.js";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const commandUrl = pathToFileURL(path.join(repoRoot, "src", "commands", "switchboard.ts")).href;
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

for (const args of [
  ["--help"],
  ["launch-demo", "--help"],
  ["deploy", "--help"],
  ["status", "--help"]
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
