import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');

const rootPackagePath = path.join(repoRoot, 'package.json');
const sharedPackagePath = path.join(repoRoot, 'packages', 'shared', 'package.json');
const addonPackagePath = path.join(repoRoot, 'packages', 'storybook-addon-spfx', 'package.json');
const sharedPackageName = '@spfx-local-workbench/shared';

const checkOnly = process.argv.includes('--check');

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, 'utf8'));
}

function writeJson(filePath, value) {
  writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function replaceVersion(versionRange, version) {
  if (!versionRange) {
    return version;
  }

  const match = versionRange.match(/^([^0-9]*)(.+)$/);
  if (!match) {
    return version;
  }

  return `${match[1]}${version}`;
}

const rootPackage = readJson(rootPackagePath);
const sharedPackage = readJson(sharedPackagePath);
const addonPackage = readJson(addonPackagePath);

if (!rootPackage.version) {
  throw new Error('Root package.json does not define a version.');
}

const expectedVersion = rootPackage.version;
const currentSharedDependency = addonPackage.dependencies?.[sharedPackageName];
const expectedSharedDependency = replaceVersion(currentSharedDependency, expectedVersion);

const mismatches = [];

if (sharedPackage.version !== expectedVersion) {
  mismatches.push(`packages/shared version is ${sharedPackage.version}; expected ${expectedVersion}`);
}

if (addonPackage.version !== expectedVersion) {
  mismatches.push(`packages/storybook-addon-spfx version is ${addonPackage.version}; expected ${expectedVersion}`);
}

if (currentSharedDependency !== expectedSharedDependency) {
  mismatches.push(
    `packages/storybook-addon-spfx dependency on ${sharedPackageName} is ${currentSharedDependency}; expected ${expectedSharedDependency}`
  );
}

if (checkOnly) {
  if (mismatches.length > 0) {
    console.error('Package version sync check failed:');
    for (const mismatch of mismatches) {
      console.error(`- ${mismatch}`);
    }

    process.exitCode = 1;
  } else {
    console.log(`Package versions already match root version ${expectedVersion}.`);
  }

  process.exit();
}

sharedPackage.version = expectedVersion;
addonPackage.version = expectedVersion;

addonPackage.dependencies ??= {};
addonPackage.dependencies[sharedPackageName] = expectedSharedDependency;

writeJson(sharedPackagePath, sharedPackage);
writeJson(addonPackagePath, addonPackage);

if (mismatches.length > 0) {
  console.log(`Synchronized package versions to ${expectedVersion}.`);
  for (const mismatch of mismatches) {
    console.log(`- ${mismatch}`);
  }
} else {
  console.log(`Package versions already matched ${expectedVersion}. Rewrote manifests with normalized formatting.`);
}