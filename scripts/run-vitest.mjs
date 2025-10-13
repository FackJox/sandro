#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const cwd = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(cwd, '..');
const args = process.argv.slice(2);
const vitestCommands = new Set(['run', 'watch', 'dev', 'related', 'inspect', 'coverage', 'bench']);
const normalizedArgs = [];
const hasCommand = args.some((arg) => vitestCommands.has(arg));

if (!hasCommand) {
  normalizedArgs.push('run');
}

for (const arg of args) {
  if (arg === '--runInBand' || arg === '--runInBand=true') {
    normalizedArgs.push('--pool=threads', '--maxWorkers=1', '--minWorkers=1', '--no-file-parallelism');
    continue;
  }
  if (arg.startsWith('--runInBand=')) {
    normalizedArgs.push('--pool=threads', '--maxWorkers=1', '--minWorkers=1', '--no-file-parallelism');
    continue;
  }
  normalizedArgs.push(arg);
}

const result = spawnSync(
  'node',
  [resolve(projectRoot, 'node_modules/vitest/vitest.mjs'), ...normalizedArgs],
  {
    cwd: projectRoot,
    stdio: 'inherit'
  }
);

process.exit(result.status ?? 1);
