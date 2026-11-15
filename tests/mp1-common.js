// Shared rig for the family-yard tests: separate browser contexts (own localStorage each), real WebRTC between pages,
// ntfy.sh replaced by an in-process relay bridged through node (the sandbox can't reach ntfy.sh).
const { chromium } = require('playwright'); const fs = require('fs'), path = require('path'); const NM = path.join(__dirname, 'node_modules');
const FILE = process.env.GAME || (process.env.GAME || require('path').join(__dirname, '..', 'index.html'));
const INIT = () => {
  const L = {}; window.__ntfyDeliver = (t, b) => (L[t] || []).forEach((f) => f(b));
  const rf = window.fetch.bind(window);
  window.fetch = (u, o) => String(u).startsWith('https://ntfy.sh/') ? (window.__ntfyPost(String(u).slice(16), String(o.body)), Promise.resolve({ ok: true })) : rf(u, o);
  const RES = window.EventSource;
  window.EventSource = class { constructor(u) { if (!String(u).startsWith('https://ntfy.sh/')) return new RES(u); const t = String(u).slice(16).replace(/\/sse$/, ''); this.readyState = 1; const f = (m) => this.readyState === 1 && this.onmessage && this.onmessage({ data: JSON.stringify({ event: 'message', message: m }) }); (L[t] = L[t] || []).push(f); setTimeout(() => this.onopen && this.onopen(), 50); } close() { this.readyState = 2; } };
};
async function rig() {
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--disable-features=WebRtcHideLocalIpsWithMdns'] });
  const pages = [], errs = [];
  const mk = async (name) => { const ctx = await browser.newContext({ viewport: { width: 800, height: 560 } });
    await ctx.exposeBinding('__ntfyPost', (src, t, b) => { for (const p of pages) if (!p.isClosed()) p.evaluate(([t, b]) => window.__ntfyDeliver && window.__ntfyDeliver(t, b), [t, b]).catch(() => {}); });
    await ctx.addInitScript(INIT); await ctx.addInitScript(() => { window.__noRender = true; });
    await ctx.route('**/*', async (route) => { const u = route.request().url();
      if (u.includes('three@0.160.0/build/three.module.js')) return route.fulfill({ contentType: 'application/javascript', body: fs.readFileSync(NM + '/three/build/three.module.js') });
      if (u.includes('three@0.160.0/examples/jsm/')) return route.fulfill({ contentType: 'application/javascript', body: fs.readFileSync(NM + '/three/examples/jsm/' + u.split('/examples/jsm/')[1]) });
      if (u.includes('cannon-es@0.20.0/dist/cannon-es.js')) return route.fulfill({ contentType: 'application/javascript', body: fs.readFileSync(NM + '/cannon-es/dist/cannon-es.js') });
      if (u.includes('qrcode-generator@1.4.4/qrcode.js')) return route.fulfill({ contentType: 'application/javascript', body: fs.readFileSync(NM + '/qrcode-generator/qrcode.js') });
      if (u.startsWith('http://game.local/')) return route.fulfill({ contentType: 'text/html', body: '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body>' + fs.readFileSync(FILE, 'utf8') + '</body></html>' });
      return route.abort(); });
    const p = await ctx.newPage(); p.nick = name; pages.push(p); p.setDefaultNavigationTimeout(180000); p.setDefaultTimeout(120000); // (a loaded machine can take a minute or more to load the page)
    p.on('pageerror', (e) => errs.push(name + ': ' + e.message + ' @ ' + String(e.stack || '').split('\n').slice(1, 3).join(' | ').slice(0, 200))); p.on('console', (m) => { if (m.type() === 'error' && !m.text().includes('ERR_FAILED')) errs.push(name + ' console: ' + m.text().slice(0, 160)); });
    await p.goto('http://game.local/'); await p.waitForFunction(() => window.__derby && __derby.MP.transport === 'peer');
    await p.fill('#mpNick', name); await p.evaluate(() => { __derby.S.gfx = 0; __derby.S.aiCount = 3; __derby.MP.nick(); });
    return p; };
  const view = (p) => p.evaluate(() => { const M = __derby.MP, hp = M.role === 'guest' ? M.hostPresence() : null;
    return { role: M.role, fam: M.family, host: M.role === 'host' ? M.nick() : hp && hp.nick, code: M.code, peers: M.room ? M.room.peers().filter((x) => !x.sameTab).map((x) => x.presence.nick || '?').sort() : [], who: document.getElementById('famWho').textContent, me: __derby.player && __derby.player.isPlayer ? __derby.player.type : null, st: __derby.game.state }; });
  return { browser, pages, errs, mk, view };
}
  // drive: hold W (then S, in case the car sits nose against something) on the guest; measured on the HOST: the host must see this player's inputs move this player's car
const drives = async (p, host, did) => { let best = 0, thr = 0;
    for (const key of ['KeyW', 'KeyS']) {
      await host.evaluate((did) => { const c = __derby.cars.find((c) => c.did === did); if (c && !c.wrecked && c.up.y < 0.6) c.flipUpright(); }, did); // (a car left on its roof by the last drive can't move: that's not what is tested)
      await p.waitForTimeout(600);
      const a = await host.evaluate((did) => { const c = __derby.cars.find((c) => c.did === did); return c ? [c.body.position.x, c.body.position.z] : null; }, did);
      await p.evaluate((key) => window.dispatchEvent(new KeyboardEvent('keydown', { code: key, key: key.slice(3).toLowerCase() })), key);
      for (let k = 0; k < 5; k++) { await p.waitForTimeout(450); thr = Math.max(thr, Math.abs(await host.evaluate((did) => { const c = __derby.cars.find((c) => c.did === did); return c ? c.ctrl.throttle : 0; }, did))); } await p.evaluate((key) => window.dispatchEvent(new KeyboardEvent('keyup', { code: key, key: key.slice(3).toLowerCase() })), key);
      const b = await host.evaluate((did) => { const c = __derby.cars.find((c) => c.did === did); return c ? [c.body.position.x, c.body.position.z] : null; }, did);
      if (a && b) best = Math.max(best, +Math.hypot(b[0] - a[0], b[1] - a[1]).toFixed(1)); if (best > 2) break; await p.waitForTimeout(500); }
    return { moved: best, hostThrottle: thr }; };
module.exports = { rig, drives };
