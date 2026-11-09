import { readFile, realpath } from 'node:fs/promises';
import { extname, isAbsolute, relative, resolve } from 'node:path';

/** Composes trusted project fragments at build time, without browser fetches. */
export async function assembleHTML(templateRoot, entry = 'index.html') {
  const root = await realpath(templateRoot);

  function assertInsideRoot(file) {
    const localPath = relative(root, file);
    if (
      localPath === '..' ||
      localPath.startsWith('../') ||
      localPath.startsWith('..\\') ||
      isAbsolute(localPath) ||
      extname(file) !== '.html'
    ) {
      throw new Error(`O fragmento HTML precisa estar dentro de src/html: ${file}`);
    }
  }

  async function expand(name, parents = []) {
    const requested = resolve(root, name);
    assertInsideRoot(requested);
    const file = await realpath(requested);
    assertInsideRoot(file);
    if (parents.includes(file)) {
      throw new Error(`Inclusão circular de HTML: ${[...parents, file].join(' → ')}`);
    }
    const source = await readFile(file, 'utf8');
    const includes = [...source.matchAll(/<!--\s*@include\s+([^\s]+)\s*-->/g)];
    let result = '';
    let cursor = 0;
    for (const include of includes) {
      result += source.slice(cursor, include.index);
      result += await expand(include[1], [...parents, file]);
      cursor = include.index + include[0].length;
    }
    result += source.slice(cursor);
    if (/<!--\s*@include\b/.test(result)) {
      throw new Error(`Diretiva de inclusão HTML inválida em ${file}`);
    }
    return result;
  }
  return expand(entry);
}
