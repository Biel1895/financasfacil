const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const { once } = require('node:events');
const { readFile } = require('node:fs/promises');
const { createServer } = require('node:http');
const { extname, join } = require('node:path');
const { launchBrowser, projectRoot } = require('./support.cjs');

const contentTypes = {
  '.css': 'text/css',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webmanifest': 'application/manifest+json',
};
const server = createServer(async (request, response) => {
  const { pathname } = new URL(request.url, 'http://localhost');
  const file = pathname === '/' ? '/index.html' : pathname;
  try {
    const content = await readFile(join(projectRoot, 'dist', file));
    response.writeHead(200, { 'Content-Type': contentTypes[extname(file)] });
    response.end(content);
  } catch {
    response.writeHead(404).end();
  }
});

async function test() {
  execFileSync(process.execPath, ['scripts/build-vercel.mjs'], {
    cwd: projectRoot,
    env: {
      ...process.env,
      FF_SITE_URL: 'https://pwa.example.test/',
      FF_SUPABASE_URL: 'https://testefinancas.supabase.co',
      FF_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_teste',
    },
    stdio: 'inherit',
  });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const origin = 'http://127.0.0.1:' + server.address().port;
  const browser = await launchBrowser();
  try {
    const context = await browser.newContext();
    await context.route('https://fonts.googleapis.com/**', (route) => route.abort());
    await context.route('https://fonts.gstatic.com/**', (route) => route.abort());
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(origin);
    await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
    const devtools = await context.newCDPSession(page);
    const installability = await devtools.send('Page.getInstallabilityErrors');
    assert.deepEqual(installability.installabilityErrors, []);
    const manifest = await (await context.request.get(origin + '/manifest.webmanifest')).json();
    assert.equal(new URL(manifest.start_url, origin).pathname, '/login.html');
    assert.equal(manifest.display, 'standalone');

    const install = page.getByRole('button', { name: 'Instalar aplicativo' });
    await page.evaluate(() => {
      const event = new Event('beforeinstallprompt', { cancelable: true });
      event.prompt = async () => {
        window.installPromptOpened = true;
        return { outcome: 'accepted' };
      };
      window.dispatchEvent(event);
    });
    await install.click();
    assert.ok(await page.evaluate(() => window.installPromptOpened));
    await install.waitFor({ state: 'hidden' });

    await context.setOffline(true);
    const response = await page.goto(origin + '/?code=teste&sb_flow_id=teste');
    assert.ok(response.fromServiceWorker());
    await page.waitForURL('**/login.html?code=teste&sb_flow_id=teste');
    await page.locator('#authAlert').waitFor({ state: 'visible' });
    assert.match(await page.locator('#authAlert').textContent(), /conexão/);
    assert.equal(await page.locator('#appWrapper').isVisible(), false);
    const cached = await page.evaluate(async () => {
      const keys = await caches.keys();
      return (await (await caches.open(keys[0])).keys()).map((request) => request.url);
    });
    assert.ok(cached.includes(origin + '/login.html'));
    assert.ok(cached.every((url) => url.startsWith(origin + '/') && !new URL(url).search));
    assert.deepEqual(errors, []);
    console.log('OK Instalação, abertura offline e proteção dos parâmetros de autenticação.');
  } finally {
    await browser.close();
  }
}

test()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => server.close());
