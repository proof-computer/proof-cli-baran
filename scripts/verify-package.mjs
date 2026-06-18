import { access, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const packageJson = JSON.parse(await readFile(path.join(repoRoot, "package.json"), "utf8"));

const requiredArtifacts = [
  "dist/commands/baran.js",
  "oclif.manifest.json",
  "README.md"
];
const requiredFilesEntries = [
  "dist",
  "oclif.manifest.json",
  "README.md"
];
const forbiddenDependencies = [
  "@proof-computer/proof-cli-blackbox",
  "@proof-computer/proof-cli-lockbox",
  "@proof-computer/proof-cli-liskov",
  "@proof-computer/switchboard-cli",
  "@proof/blackbox-cli",
  "@proof/lockbox-cli",
  "@proof/slipway-cli"
];

const errors = [];

if (packageJson.name !== "@proof-computer/proof-cli-baran") {
  errors.push("package.json name must be @proof-computer/proof-cli-baran");
}

if (packageJson.bin) {
  errors.push("Baran proof plugin must not publish a standalone bin");
}

for (const artifact of requiredArtifacts) {
  try {
    await access(path.join(repoRoot, artifact));
  } catch {
    errors.push(`Missing package artifact: ${artifact}`);
  }
}

for (const entry of requiredFilesEntries) {
  if (!packageJson.files?.includes(entry)) {
    errors.push(`package.json files must include ${entry}`);
  }
}

if (packageJson.oclif?.commands !== "./dist/commands") {
  errors.push("package.json oclif.commands must point to ./dist/commands");
}

if (packageJson.oclif?.topicSeparator !== " ") {
  errors.push("package.json oclif.topicSeparator must be a single space");
}

if (!packageJson.oclif?.topics?.baran) {
  errors.push("package.json oclif.topics must declare baran");
}

const dependencyBlocks = [
  packageJson.dependencies ?? {},
  packageJson.devDependencies ?? {},
  packageJson.optionalDependencies ?? {},
  packageJson.peerDependencies ?? {}
];
for (const forbidden of forbiddenDependencies) {
  if (dependencyBlocks.some((block) => Object.hasOwn(block, forbidden))) {
    errors.push(`Baran plugin must not depend on private product package ${forbidden}`);
  }
}

if (errors.length > 0) {
  throw new Error(errors.join("\n"));
}

console.log("Package artifacts verified.");
