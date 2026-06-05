import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const packagePath = path.join(repoRoot, "package.json");
const packageJson = JSON.parse(await readFile(packagePath, "utf8"));

const publishDependencies = {
  "@proof-computer/switchboard-runtime": {
    env: "SWITCHBOARD_RUNTIME_VERSION",
    sibling: "../switchboard-runtime-js/package.json"
  },
  "@proof-computer/switchboard-workflows": {
    env: "SWITCHBOARD_WORKFLOWS_VERSION",
    sibling: "../switchboard-workflows-js/package.json"
  }
};

const updates = [];

for (const [dependencyName, config] of Object.entries(publishDependencies)) {
  const current = packageJson.dependencies?.[dependencyName];
  if (!current) {
    throw new Error(`Missing dependency ${dependencyName}`);
  }

  const version = process.env[config.env] ?? await readSiblingVersion(config.sibling, dependencyName);
  packageJson.dependencies[dependencyName] = version;
  updates.push(`${dependencyName}@${version} (${current} -> ${version})`);
}

await writeFile(packagePath, `${JSON.stringify(packageJson, null, 2)}\n`);
console.log(`Prepared package.json for npm publish: ${updates.join(", ")}`);

async function readSiblingVersion(relativePackagePath, expectedName) {
  const siblingPackagePath = path.resolve(repoRoot, relativePackagePath);
  const siblingPackageJson = JSON.parse(await readFile(siblingPackagePath, "utf8"));
  if (siblingPackageJson.name !== expectedName) {
    throw new Error(`Expected ${siblingPackagePath} to describe ${expectedName}`);
  }
  if (!siblingPackageJson.version || typeof siblingPackageJson.version !== "string") {
    throw new Error(`Missing version in ${siblingPackagePath}`);
  }
  return siblingPackageJson.version;
}

