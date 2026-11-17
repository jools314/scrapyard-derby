const { chromium } = require('playwright');
const fs = require('fs'); const path = require('path');
const NM = path.join(__dirname, 'node_modules');
async function open(ctxOpts, init, before) { // init: optional function run in the page before the game loads (page.addInitScript); before: optional async (page) => {} run just before the page opens (e.g. a CDP CPU throttle)
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage(ctxOpts || { viewport: { width: 1280, height: 760 } });
  const errors = [];
  if (init) await page.addInitScript(init);
  page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errors.push(m.type() + ': ' + m.text()); });
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  await page.route('**/*', async route => {
    const u = route.request().url();
    if (u.includes('three@0.160.0/build/three.module.js')) return route.fulfill({ contentType: 'application/javascript', body: fs.readFileSync(NM + '/three/build/three.module.js') });
    if (u.includes('three@0.160.0/examples/jsm/')) return route.fulfill({ contentType: 'application/javascript', body: fs.readFileSync(NM + '/three/examples/jsm/' + u.split('/examples/jsm/')[1]) });
    if (u.includes('cannon-es@0.20.0/dist/cannon-es.js')) return route.fulfill({ contentType: 'application/javascript', body: fs.readFileSync(NM + '/cannon-es/dist/cannon-es.js') });
    if (u.startsWith('http://game.local/')) return route.fulfill({ contentType: 'text/html', body: '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"></head><body>' + fs.readFileSync((process.env.GAME || require('path').join(__dirname, '..', 'index.html')), 'utf8') + '</body></html>' });
    return route.abort();
  });
  if (before) await before(page);
  await page.goto('http://game.local/');
  await page.waitForFunction(() => window.__derby, null, { timeout: 90000 });
  return { browser, page, errors };
}
module.exports = { open };
