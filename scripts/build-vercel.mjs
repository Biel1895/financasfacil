import { copyFile, mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { readSupabaseConfig } from '../src/js/services/cloud-config.js';

const config = readSupabaseConfig({
  url: process.env.FF_SUPABASE_URL,
  publishableKey: process.env.FF_SUPABASE_PUBLISHABLE_KEY,
});
config.authProviders = {
  google: process.env.FF_AUTH_GOOGLE === 'true',
  apple: process.env.FF_AUTH_APPLE === 'true',
};
const domain = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;
const address = process.env.FF_SITE_URL?.trim() || (domain && 'https://' + domain);
if (!address) {
  throw new Error('Informe FF_SITE_URL ou habilite as variáveis de sistema do Vercel.');
}
const siteUrl = new URL(address);
if (siteUrl.protocol !== 'https:' || siteUrl.href !== siteUrl.origin + '/') {
  throw new Error('FF_SITE_URL deve ser a URL HTTPS da página inicial, sem caminho ou parâmetros.');
}
const shareImage = new URL('assets/compartilhar.jpg', siteUrl).href;
const shareDescription = 'FinançasFácil com gráfico ilustrativo de entradas e saídas';
const shareTags = [
  `<link rel="canonical" href="${siteUrl.href}" />`,
  `<meta property="og:url" content="${siteUrl.href}" />`,
  `<meta property="og:image" content="${shareImage}" />`,
  '<meta property="og:image:type" content="image/jpeg" />',
  '<meta property="og:image:width" content="1200" />',
  '<meta property="og:image:height" content="630" />',
  `<meta property="og:image:alt" content="${shareDescription}" />`,
  `<meta name="twitter:image" content="${shareImage}" />`,
  `<meta name="twitter:image:alt" content="${shareDescription}" />`,
].join('\n    ');

const output = new URL('../dist/', import.meta.url);
const assetOutput = new URL('assets/', output);
const runtimeFiles = ['login.html', 'app.js', 'style.css', 'landing.css', 'landing.js'];
const siteFiles = ['index.html', 'config.js', ...runtimeFiles];
const assets = ['favicon.svg', 'apple-touch-icon.png', 'compartilhar.jpg'];
await mkdir(output, { recursive: true });
for (const entry of await readdir(output, { withFileTypes: true })) {
  if (entry.name === 'assets' && entry.isDirectory()) {
    continue;
  }
  if (!entry.isFile() || !siteFiles.includes(entry.name)) {
    throw new Error('A pasta dist deve conter apenas os arquivos e as imagens do site.');
  }
}
await mkdir(assetOutput, { recursive: true });
for (const entry of await readdir(assetOutput, { withFileTypes: true })) {
  if (!entry.isFile() || !assets.includes(entry.name)) {
    throw new Error('A pasta dist/assets contém um item que não deve ser publicado.');
  }
}

await import('./build.mjs');
for (const file of runtimeFiles) {
  await copyFile(new URL('../' + file, import.meta.url), new URL(file, output));
}
for (const asset of assets) {
  await copyFile(new URL('../assets/' + asset, import.meta.url), new URL(asset, assetOutput));
}
const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
const shareMarker = '<!-- @share-url -->';
if (!html.includes(shareMarker)) {
  throw new Error('O HTML precisa do marcador de compartilhamento no cabeçalho.');
}
await writeFile(
  new URL('index.html', output),
  html.replace(shareMarker, () => shareTags),
);
await writeFile(
  new URL('config.js', output),
  'window.FF_SUPABASE_CONFIG = ' + JSON.stringify(config) + ';\n',
);
console.log('Site para o Vercel gerado em dist/.');
