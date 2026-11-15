// End to end: a real match's play log and a bug report reach the ntfy.sh drop (the only test allowed onto the network, and only to ntfy.sh)
const { chromium } = require('playwright'); const { execFileSync } = require('child_process'); const fs = require('fs'); const path = require('path'); const NM = path.join(__dirname, 'node_modules');
(async () => {
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 800, height: 500 } }); const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.route('**/*', async (route) => { const u = route.request().url();
    if (u.includes('three@0.160.0/build/three.module.js')) return route.fulfill({ contentType: 'application/javascript', body: fs.readFileSync(NM + '/three/build/three.module.js') });
    if (u.includes('three@0.160.0/examples/jsm/')) return route.fulfill({ contentType: 'application/javascript', body: fs.readFileSync(NM + '/three/examples/jsm/' + u.split('/examples/jsm/')[1]) });
    if (u.includes('cannon-es@0.20.0/dist/cannon-es.js')) return route.fulfill({ contentType: 'application/javascript', body: fs.readFileSync(NM + '/cannon-es/dist/cannon-es.js') });
    if (u.startsWith('http://game.local/')) return route.fulfill({ contentType: 'text/html', body: '<!doctype html><html><head><meta charset="utf-8"></head><body>' + fs.readFileSync((process.env.GAME || require('path').join(__dirname, '..', 'index.html')), 'utf8') + '</body></html>' });
    if (u.startsWith('https://ntfy.sh/')) { // relay through curl (it uses this machine's proxy and CA bundle; the browser and Node fetch don't)
      const req = route.request(), tmp = path.join(__dirname, 'livedrop-body.bin'); fs.writeFileSync(tmp, req.postDataBuffer() || Buffer.alloc(0));
      const args = ['-sS', '-m', '30', '-X', req.method(), '--data-binary', '@' + tmp, '-w', '\n%{http_code}']; for (const [k, v] of Object.entries(req.headers())) if (/^(filename|title|tags|content-type)$/i.test(k)) args.push('-H', `${k}: ${v}`); args.push(u);
      let out = ''; try { out = execFileSync('curl', args, { encoding: 'utf8' }); } catch (e) { return route.fulfill({ status: 502, body: 'relay failed' }); }
      const i = out.lastIndexOf('\n'); return route.fulfill({ status: +out.slice(i + 1) || 502, body: out.slice(0, i), headers: { 'access-control-allow-origin': '*' } }); }
    return route.abort(); });
  await page.goto('http://game.local/', { timeout: 300000 }); await page.waitForFunction(() => window.__derby, null, { timeout: 300000 });
  const t0 = Math.floor(Date.now() / 1000);
  await page.evaluate(() => { __derby.PLAYLOG.MIN_GAP = 0; }); // (this tests the transport; the 10-minute batching has its own test)
  await page.evaluate(() => { window.__noRender = true; __derby.S.aiCount = 3; document.getElementById('btnStart').click(); });
  await page.waitForFunction(() => __derby.game.countdown <= 0, null, { timeout: 300000 }); await page.waitForTimeout(8000);
  const up = await page.evaluate(async () => { const r = await window.playLogUpload?.('test'); return { r, has: typeof window.dropUpload }; });
  const bug = await page.evaluate(() => { document.getElementById('btnBug').click(); return true; });
  await page.waitForTimeout(6000); await browser.close();
  const topic = (fs.readFileSync(path.join(__dirname, 'DROP.txt'), 'utf8').match(/scrapyard-derby-[0-9a-f]+/) || [])[0];
  const txt = execFileSync('curl', ['-sS', '-m', '30', `https://ntfy.sh/${topic}/json?poll=1&since=${t0 - 5}`], { encoding: 'utf8' }); const lines = txt.trim().split('\n').filter(Boolean).map((l) => JSON.parse(l));
  const kinds = lines.map((m) => (m.title || m.message || '').split(' ')[0]);
  const ok = kinds.includes('playlog') && kinds.includes('bug');
  console.log(JSON.stringify({ up, kinds, errors: errors.slice(0, 3) }), ok ? 'LIVEDROP PASS' : 'LIVEDROP FAIL');
  process.exit(ok ? 0 : 1);
})();
