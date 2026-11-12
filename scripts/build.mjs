import { build } from 'esbuild';
import { format } from 'prettier';
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { Script } from 'node:vm';
import { assembleHTML } from './html.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const checkOnly = process.argv.includes('--check');
const result = await build({
  absWorkingDir: root,
  entryPoints: { app: 'src/js/main.js', landing: 'src/js/landing.js' },
  outdir: '.',
  bundle: true,
  format: 'iife',
  platform: 'browser',
  target: ['chrome110', 'edge110', 'firefox115', 'safari16.4'],
  charset: 'utf8',
  minify: false,
  write: false,
  banner: { js: '// GERADO por npm run build. Fontes em src/js/.' },
});

// Scripts clássicos permitem abrir as páginas diretamente pelo sistema de arquivos.
for (const output of result.outputFiles) {
  new Script(output.text, { filename: output.path });
}
const cssResult = await build({
  absWorkingDir: root,
  entryPoints: { style: 'src/css/main.css', landing: 'src/css/landing.css' },
  outdir: '.',
  external: ['./assets/*'],
  bundle: true,
  write: false,
  minify: false,
  charset: 'utf8',
});
const files = result.outputFiles.map((output) => [output.path, output.text]);
for (const output of cssResult.outputFiles) {
  const css = await format(output.text, { parser: 'css', printWidth: 100, endOfLine: 'lf' });
  files.push([output.path, `/* GERADO por npm run build. Fontes em src/css/. */\n${css}`]);
}
for (const page of ['index.html', 'login.html']) {
  const source = await assembleHTML(resolve(root, 'src/html'), page);
  const html = await format(
    source.replace(
      /<!doctype html>/i,
      '<!doctype html>\n<!-- GERADO por npm run build. Edite src/html/, não este arquivo. -->',
    ),
    { parser: 'html', printWidth: 100, tabWidth: 2, endOfLine: 'lf' },
  );
  files.push([resolve(root, page), html]);
}
for (const [file, content] of files) {
  if (checkOnly) {
    const existing = await readFile(file, 'utf8').catch(() => '');
    if (existing !== content) {
      throw new Error(`${file} está desatualizado. Execute npm run build.`);
    }
  } else {
    await writeFile(file, content);
  }
}
console.log(checkOnly ? 'Arquivos gerados conferidos.' : 'Aplicação gerada com sucesso.');
