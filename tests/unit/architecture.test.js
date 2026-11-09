import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join, relative, resolve } from 'node:path';

const sourceRoot = fileURLToPath(new URL('../../src/js/', import.meta.url));
async function sourceFiles(dir) {
  const files = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const file = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await sourceFiles(file)));
    } else if (file.endsWith('.js')) {
      files.push(file);
    }
  }
  return files;
}

test('regras financeiras não dependem da tela, da sessão ou do armazenamento', async () => {
  for (const file of await sourceFiles(join(sourceRoot, 'domain'))) {
    const source = await readFile(file, 'utf8');
    assert.doesNotMatch(source, /\b(?:window|document|indexedDB|localStorage)\b/, file);
    for (const [, specifier] of source.matchAll(/from\s+['"]([^'"]+)['"]/g)) {
      assert.ok(resolve(file, '..', specifier).startsWith(join(sourceRoot, 'domain')), file);
    }
  }
});

test('armazenamento não importa interface ou ações de usuário', async () => {
  for (const folder of ['infrastructure', 'data', 'state']) {
    for (const file of await sourceFiles(join(sourceRoot, folder))) {
      const source = await readFile(file, 'utf8');
      assert.doesNotMatch(source, /from\s+['"][^'"]*\/(?:ui|application|services)\//, file);
    }
  }
});

test('a aplicação não usa os globais reservados ao adaptador de testes', async () => {
  for (const file of await sourceFiles(sourceRoot)) {
    if (relative(sourceRoot, file).replaceAll('\\', '/').startsWith('testing/')) {
      continue;
    }
    assert.doesNotMatch(
      await readFile(file, 'utf8'),
      /\bFF_(?:STATE|LocalDB|Finance|NLP|Planning)\b/,
      file,
    );
  }
});
