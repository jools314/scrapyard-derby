// harness for the voice tests: one navigation (mock injected before the page runs), long timeouts for a busy machine
const { chromium } = require('playwright'); const fs = require('fs'); const path = require('path'); const NM = path.join(__dirname, 'node_modules');
async function openMock(file, mock, ctxOpts) {
  for (let k = 0; ; k++) {
    const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
    try {
      const page = await browser.newPage(ctxOpts || { viewport: { width: 900, height: 560 } }); const errors = [];
      page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errors.push(m.type() + ': ' + m.text()); });
      page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
      await page.route('**/*', async (route) => { const u = route.request().url();
        if (u.includes('three@0.160.0/build/three.module.js')) return route.fulfill({ contentType: 'application/javascript', body: fs.readFileSync(NM + '/three/build/three.module.js') });
        if (u.includes('three@0.160.0/examples/jsm/')) return route.fulfill({ contentType: 'application/javascript', body: fs.readFileSync(NM + '/three/examples/jsm/' + u.split('/examples/jsm/')[1]) });
        if (u.includes('cannon-es@0.20.0/dist/cannon-es.js')) return route.fulfill({ contentType: 'application/javascript', body: fs.readFileSync(NM + '/cannon-es/dist/cannon-es.js') });
        if (u.startsWith('http://game.local/')) return route.fulfill({ contentType: 'text/html', body: '<!doctype html><html><head><meta charset="utf-8"></head><body>' + fs.readFileSync(file, 'utf8') + '</body></html>' });
        return route.abort(); });
      if (mock) await page.addInitScript(mock);
      await page.goto('http://game.local/', { waitUntil: 'commit', timeout: 120000 });
      await page.waitForFunction(() => window.__derby, null, { timeout: 120000 });
      return { browser, page, errors };
    } catch (e) { console.error('setup retry', k, e.message.split('\n')[0]); await browser.close().catch(() => {}); if (k >= 2) throw e; }
  }
}
module.exports = { openMock };
