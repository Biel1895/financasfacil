import { spawnSync } from 'node:child_process';
import { watch } from 'node:fs';
import { fileURLToPath } from 'node:url';

const buildScript = fileURLToPath(new URL('./build.mjs', import.meta.url));
const sources = new URL('../src/', import.meta.url);

function rebuild() {
  const result = spawnSync(process.execPath, [buildScript], { stdio: 'inherit' });
  if (result.error) {
    console.error(result.error.message);
  }
}

let pendingBuild;
watch(sources, { recursive: true }, () => {
  clearTimeout(pendingBuild);
  pendingBuild = setTimeout(rebuild, 120);
});

console.log('Acompanhando alterações em src/. Pressione Ctrl+C para sair.');
rebuild();
