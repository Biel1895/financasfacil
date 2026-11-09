import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { assembleHTML } from '../../scripts/html.mjs';

async function fixture(t) {
  const dir = await mkdtemp(join(tmpdir(), 'financas-html-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  return dir;
}

test('composição preserva ordem, atributos e texto de fragmentos aninhados', async (t) => {
  const dir = await fixture(t);
  await writeFile(join(dir, 'index.html'), '<main><!-- @include screen.html --></main>');
  await writeFile(
    join(dir, 'screen.html'),
    '<section id="view">Saldo &amp; parcelas</section><!-- @include dialog.html -->',
  );
  await writeFile(
    join(dir, 'dialog.html'),
    '<dialog id="payment"><button type="submit">Pagar</button></dialog>',
  );
  assert.equal(
    await assembleHTML(dir),
    '<main><section id="view">Saldo &amp; parcelas</section><dialog id="payment"><button type="submit">Pagar</button></dialog></main>',
  );
});

test('inclusão de fragmento ausente falha durante a geração', async (t) => {
  const dir = await fixture(t);
  await writeFile(join(dir, 'index.html'), '<!-- @include missing.html -->');
  await assert.rejects(() => assembleHTML(dir), { code: 'ENOENT' });
});

test('inclusões circulares são rejeitadas com a origem do problema', async (t) => {
  const dir = await fixture(t);
  await writeFile(join(dir, 'index.html'), '<!-- @include a.html -->');
  await writeFile(join(dir, 'a.html'), '<!-- @include index.html -->');
  await assert.rejects(() => assembleHTML(dir), /circular/);
});

test('fragmentos fora da pasta HTML não podem ser incluídos', async (t) => {
  const dir = await fixture(t);
  await writeFile(join(dir, 'index.html'), '<!-- @include ../outside.html -->');
  await assert.rejects(() => assembleHTML(dir), /dentro de src\/html/);
});
