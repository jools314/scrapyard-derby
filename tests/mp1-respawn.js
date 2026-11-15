// End-to-end multiplayer: desktop host + emulated iPad guest, real WebRTC between them, relay handshake bridged
// through node, network chaos injected into every data-channel send, and a CPU-throttled guest.
const { chromium, devices } = require('playwright'); const fs = require('fs'), path = require('path'); const NM = path.join(__dirname, 'node_modules');
const INIT = () => {
  const L = {}; window.__ntfyDeliver = (t, b) => (L[t] || []).forEach((f) => f(b));
  const rf = window.fetch.bind(window);
  window.fetch = (u, o) => String(u).startsWith('https://ntfy.sh/') ? (window.__ntfyPost(String(u).slice(16), String(o.body)), Promise.resolve({ ok: true })) : rf(u, o);
  const RES = window.EventSource;
  window.EventSource = class { constructor(u) { if (!String(u).startsWith('https://ntfy.sh/')) return new RES(u); const t = String(u).slice(16).replace(/\/sse$/, ''); this.readyState = 1; (L[t] = L[t] || []).push((m) => this.onmessage && this.onmessage({ data: JSON.stringify({ event: 'message', message: m }) })); setTimeout(() => this.onopen && this.onopen(), 50); } close() { this.readyState = 2; } };
  // network chaos on every data-channel send: base latency + jitter, packet loss, occasional stalls
  const send = RTCDataChannel.prototype.send;
  RTCDataChannel.prototype.send = function (d) { const C = window.__chaos; if (!C) return send.call(this, d); if (Math.random() < C.drop) return;
    const now = performance.now(); if (Math.random() < C.stallP) window.__stallUntil = now + C.stall; const st = Math.max(0, (window.__stallUntil || 0) - now);
    setTimeout(() => { try { send.call(this, d); } catch (e) {} }, st + C.base + Math.random() * C.jit); };
};
(async () => {
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--disable-features=WebRtcHideLocalIpsWithMdns'] });
  const pages = []; const errs = [];
  const mk = async (opts, noRender) => { const ctx = await browser.newContext(opts);
    await ctx.exposeBinding('__ntfyPost', (src, t, b) => { for (const p of pages) p.evaluate(([t, b]) => window.__ntfyDeliver && window.__ntfyDeliver(t, b), [t, b]).catch(() => {}); });
    await ctx.addInitScript(INIT); await ctx.addInitScript((nr) => { window.__noRender = nr; }, noRender);
    await ctx.route('**/*', async (route) => { const u = route.request().url();
      if (u.includes('three@0.160.0/build/three.module.js')) return route.fulfill({ contentType: 'application/javascript', body: fs.readFileSync(NM + '/three/build/three.module.js') });
      if (u.includes('three@0.160.0/examples/jsm/')) return route.fulfill({ contentType: 'application/javascript', body: fs.readFileSync(NM + '/three/examples/jsm/' + u.split('/examples/jsm/')[1]) });
      if (u.includes('cannon-es@0.20.0/dist/cannon-es.js')) return route.fulfill({ contentType: 'application/javascript', body: fs.readFileSync(NM + '/cannon-es/dist/cannon-es.js') });
      if (u.includes('qrcode-generator@1.4.4/qrcode.js')) return route.fulfill({ contentType: 'application/javascript', body: fs.readFileSync(NM + '/qrcode-generator/qrcode.js') });
      if (u.startsWith('http://game.local/')) return route.fulfill({ contentType: 'text/html', body: '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body>' + fs.readFileSync(process.env.GAME || (process.env.GAME || require('path').join(__dirname, '..', 'index.html')), 'utf8') + '</body></html>' });
      return route.abort(); });
    const p = await ctx.newPage(); pages.push(p); p.setDefaultNavigationTimeout(180000); p.setDefaultTimeout(120000); p.on('pageerror', (e) => errs.push(e.message)); p.on('console', (m) => { if (m.type() === 'error' && !m.text().includes('ERR_FAILED')) errs.push(m.text().slice(0, 160)); }); return p; };
  const H = await mk({ viewport: { width: 1000, height: 640 } }, true);
  const ipad = devices['iPad Mini']; const G = await mk({ ...ipad, viewport: { width: ipad.viewport.height, height: ipad.viewport.width } }, true);
  await H.goto('http://game.local/'); await H.waitForFunction(() => window.__derby && __derby.MP.transport === 'peer');
  await H.evaluate(() => { __derby.S.gfx = 0; __derby.S.aiCount = 5; __derby.S.damage = 0; }); await H.click('#btnHost'); await H.waitForTimeout(1200);
  const link = await H.inputValue('#mpLink');
  await G.goto('http://game.local/' + link.slice(link.indexOf('?'))); await G.waitForFunction(() => window.__derby && __derby.MP.role === 'guest', null, { timeout: 40000 });
  const touchStart = await G.evaluate(() => ({ touch: document.body.classList.contains('touch'), level: __derby.QUALITY.level }));
  await H.click('#btnStart'); await G.waitForTimeout(5000);

  const R = {};
  R.setup = await G.evaluate(() => ({ mode: __derby.MP.role, myType: __derby.player.type, n: __derby.cars.length }));
  const myIdx = await G.evaluate(() => __derby.cars.indexOf(__derby.player));
  const otherObj = await G.evaluate(() => { window.__keep = __derby.cars.filter((c) => !c.isPlayer); return window.__keep.length; });
  // host wrecks the guest's car
  await H.evaluate((i) => { const c = __derby.cars[i]; c.wreck(); }, myIdx);
  await G.waitForFunction(() => __derby.player.wrecked, null, { timeout: 10000 });
  await G.waitForTimeout(500);
  R.guestSheet = await G.evaluate(() => ({ visible: !document.getElementById('rsheet').hidden, sub: document.getElementById('rsSub').textContent }));
  // guest picks the tiger
  await G.evaluate(() => [...document.querySelectorAll('#rsCars button')].find((b) => b.textContent.includes('Tiger')).click());
  await G.waitForFunction(() => __derby.player.type === 'tiger' && !__derby.player.wrecked, null, { timeout: 15000 }).catch(async () => {
    console.log('G', await G.evaluate(() => ({ t: __derby.player.type, w: __derby.player.wrecked, rv: __derby.MP.builtRv, rk: __derby.MP.builtRk, hpRv: __derby.MP.hostPresence().rv, hpRk: __derby.MP.hostPresence().rk, rsN: __derby.MP.rsN, me: __derby.MP.myPeer(), roster: __derby.MP.hostPresence().roster.map((e) => e[0] + '/' + e[1]).join(' ') })));
    console.log('H', await H.evaluate(() => ({ guests: __derby.MP.guests().map((g) => [g.peer, JSON.stringify(g.presence.rs)]), cars: __derby.cars.map((c) => c.type + '/' + (c.remote || '') + (c.wrecked ? '!' : '')).join(' '), rv: __derby.MP.rv, seen: [...__derby.MP.rsSeen] })));
    console.log(errs); process.exit(1); });
  R.after = await G.evaluate(() => ({ type: __derby.player.type, wrecked: __derby.player.wrecked, othersKept: __derby.cars.filter((c) => !c.isPlayer).every((c) => window.__keep.includes(c)), n: __derby.cars.length }));
  R.hostSees = await H.evaluate((i) => ({ type: __derby.cars[i].type, remote: !!__derby.cars[i].remote }), myIdx);
  await G.waitForTimeout(2000);
  R.ghostMoves = await G.evaluate(() => { const p = __derby.player.group.position; return [+p.x.toFixed(1), +p.z.toFixed(1)]; });
  // an AI respawn on the host shows up on the guest without rebuilding everyone
  const ai = await H.evaluate(() => __derby.cars.findIndex((c) => !c.isPlayer && !c.remote));
  await G.evaluate(() => { window.__keep2 = __derby.cars.slice(); });
  await H.evaluate((i) => __derby.cars[i].wreck(), ai);
  await H.waitForFunction((i) => !__derby.cars[i].wrecked, ai, { timeout: 30000 });
  await G.waitForTimeout(1500);
  R.aiRespawn = await G.evaluate((i) => ({ replaced: !window.__keep2.includes(__derby.cars[i]), restKept: __derby.cars.filter((c, k) => k !== i).every((c) => window.__keep2.includes(c)), wrecked: __derby.cars[i].wrecked }), ai);
  R.errs = errs;
  R.pass = R.setup.mode === 'guest' && R.guestSheet.visible && R.after.type === 'tiger' && !R.after.wrecked && R.after.othersKept && R.hostSees.type === 'tiger' && R.hostSees.remote && R.aiRespawn.replaced && R.aiRespawn.restKept && !R.aiRespawn.wrecked && !errs.length;
  console.log(JSON.stringify(R, null, 1)); await browser.close();
})();
