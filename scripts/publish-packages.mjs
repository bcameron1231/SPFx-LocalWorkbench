import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');

const packageDirectories = [
  path.join(repoRoot, 'packages', 'shared'),
  path.join(repoRoot, 'packages', 'storybook-addon-spfx')
];

const extraArgs = process.argv.slice(2);

for (const packageDirectory of packageDirectories) {
  const result = spawnSync('npm', ['publish', '--access', 'public', ...extraArgs], {
    cwd: packageDirectory,
    stdio: 'inherit',
    shell: process.platform === 'win32'
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}