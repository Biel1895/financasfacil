import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const suites = [
  'startup',
  'core',
  'reports-installments',
  'management',
  'balances',
  'cloud',
  'pwa',
];
const selected = process.argv.slice(2);
const results = [];
if (selected.some((name) => !suites.includes(name))) {
  throw new Error(`Escolha uma destas suítes: ${suites.join(', ')}.`);
}
for (const name of selected.length ? selected : suites) {
  console.log(`\nExecutando: ${name}`);
  const started = Date.now();
  const result = spawnSync(process.execPath, [`tests/e2e/${name}.cjs`], {
    cwd: root,
    stdio: 'inherit',
    timeout: 180_000,
  });
  results.push({ suite: name, passed: result.status === 0, elapsedMs: Date.now() - started });
  mkdirSync(join(root, 'test-results'), { recursive: true });
  writeFileSync(join(root, 'test-results/e2e-summary.json'), JSON.stringify({ results }, null, 2));
  if (result.error) {
    throw result.error;
  }
  if (result.status !== 0) {
    process.exit(result.status || 1);
  }
}
