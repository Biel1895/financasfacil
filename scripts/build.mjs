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
  entryPoints: ['src/js/main.js'],
  outfile: 'app.js',
  bundle: true,
  format: 'iife',
  platform: 'browser',
  target: ['chrome110', 'edge110', 'firefox115', 'safari16.4'],
  charset: 'utf8',
  minify: false,
  write: false,
  banner: { js: '// GERADO por npm run build. Fontes em src/js/.' },
});

// Classic script output preserves opening index.html directly through file://.
for (const output of result.outputFiles) {
  if (output.path.endsWith('.js')) {
    new Script(output.text, { filename: 'app.js' });
  }
}
const cssResult = await build({
  absWorkingDir: root,
  entryPoints: ['src/css/main.css'],
  bundle: true,
  write: false,
  minify: false,
  charset: 'utf8',
});
const css = await format(cssResult.outputFiles[0].text, {
  parser: 'css',
  printWidth: 100,
  endOfLine: 'lf',
});
const htmlSource = await assembleHTML(resolve(root, 'src/html'));
const html = await format(
  htmlSource.replace(
    /<!doctype html>/i,
    '<!doctype html>\n<!-- GERADO por npm run build. Edite src/html/, não este arquivo. -->',
  ),
  {
    parser: 'html',
    printWidth: 100,
    tabWidth: 2,
    endOfLine: 'lf',
  },
);
const files = [
  [resolve(root, 'index.html'), html],
  ...result.outputFiles.map((output) => [output.path, output.text]),
  [resolve(root, 'style.css'), `/* GERADO por npm run build. Fontes em src/css/. */\n${css}`],
];
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
