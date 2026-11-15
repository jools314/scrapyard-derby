// Multiplayer Steam Elephant: the host runs an elephant; the guest's copy (no physics, only snapshots) must walk its legs,
// show the boiler gauge at the host's pressure, see the steam and the stall when the boiler blows. Real WebRTC, mild network chaos.
// Prints MP-ELEPHANT PASS / MP-ELEPHANT FAIL.
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
      if (u.startsWith('http://game.local/')) return route.fulfill({ contentType: 'text/html', body: '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body>' + fs.readFileSync((process.env.GAME || require('path').join(__dirname, '..', 'index.html')), 'utf8') + '</body></html>' });
      return route.abort(); });
    const p = await ctx.newPage(); pages.push(p); p.on('pageerror', (e) => errs.push(e.message)); p.on('console', (m) => { if (m.type() === 'error' && !m.text().includes('ERR_FAILED')) errs.push(m.text().slice(0, 160)); }); return p; };
  const H = await mk({ viewport: { width: 1000, height: 640 } }, true);
  const ipad = devices['iPad Mini']; const G = await mk({ ...ipad, viewport: { width: ipad.viewport.height, height: ipad.viewport.width } }, true);
  await H.goto('http://game.local/'); await H.waitForFunction(() => window.__derby && __derby.MP.transport === 'peer');
  await H.evaluate(() => { __derby.S.gfx = 0; __derby.S.aiCount = 5; __derby.S.damage = 0; }); await H.click('#btnHost'); await H.waitForTimeout(1200);
  const link = await H.inputValue('#mpLink');
  await G.goto('http://game.local/' + link.slice(link.indexOf('?'))); await G.waitForFunction(() => window.__derby && __derby.MP.role === 'guest', null, { timeout: 40000 });
  const touchStart = await G.evaluate(() => ({ touch: document.body.classList.contains('touch'), level: __derby.QUALITY.level }));
  await H.click('#btnStart'); await G.waitForTimeout(5000);

  const fails = [], R = {};
  // the host turns one AI car into an elephant and walks it in a slow circle
  const ei = await H.evaluate(() => { const D = __derby, i = D.cars.findIndex((c) => !c.isPlayer && !c.remote); D.respawnCar(D.cars[i], 'elephant'); return i; });
  await H.waitForTimeout(500);
  await H.evaluate((i) => { const e = __derby.cars[i]; e.think = () => { e.ctrl.throttle = 0.8; e.ctrl.steer = 0.25; }; e.pressure = 0.6; window.__E = e; }, ei);
  await G.waitForFunction((i) => __derby.cars[i] && __derby.cars[i].type === 'elephant', ei, { timeout: 30000 });
  await G.waitForTimeout(1500);
  R.walk = await G.evaluate(async (i) => { const e = __derby.cars[i], mn = [9, 9, 9, 9], mx = [-9, -9, -9, -9], p0 = e.group.position.clone();
    for (let k = 0; k < 60; k++) { await new Promise((r) => setTimeout(r, 50)); e.legs.forEach((l, j) => { mn[j] = Math.min(mn[j], l.hip.rotation.z); mx[j] = Math.max(mx[j], l.hip.rotation.z); }); }
    return { ghost: !!e.ghost, moved: +e.group.position.distanceTo(p0).toFixed(1), swing: mx.map((x, j) => +(x - mn[j]).toFixed(2)), pressure: +(e.pressure || 0).toFixed(2), needle: +e.gaugeNeedle.rotation.z.toFixed(2) }; }, ei);
  if (R.walk.moved < 2) fails.push('remote elephant did not move'); if (R.walk.swing.some((x) => x < 0.2)) fails.push('remote legs do not animate');
  if (Math.abs(R.walk.pressure - 0.6) > 0.08) fails.push('pressure not in snapshot'); if (Math.abs(R.walk.needle - (2.356 - R.walk.pressure * 4.712)) > 0.12) fails.push('remote gauge needle wrong');
  // steam on the host shows on the guest
  await H.evaluate(() => { const e = window.__E; e.think = () => { e.ctrl.throttle = 0; e.ctrl.steer = 0; }; e.specialCd = 0; e.ctrl.fire = true; });
  R.steam = await G.evaluate(async (i) => { const e = __derby.cars[i]; let seen = false; for (let k = 0; k < 40 && !seen; k++) { await new Promise((r) => setTimeout(r, 50)); seen = !!e.steamFlag; } return seen; }, ei);
  if (!R.steam) fails.push('remote steam not seen');
  // the boiler blows on the host: the guest sees the stall (and plays the blow-off cloud)
  await H.waitForTimeout(2000); await H.evaluate(() => { window.__E.pressure = 0.95; });
  R.stall = await G.evaluate(async (i) => { const e = __derby.cars[i]; let t0 = -1, t1 = -1; const s = performance.now();
    while (performance.now() - s < 12000) { await new Promise((r) => setTimeout(r, 50)); const t = (performance.now() - s) / 1000; if (e.stallT > 0 && t0 < 0) t0 = t; if (t0 >= 0 && !(e.stallT > 0) && t1 < 0) { t1 = t; break; } }
    return { start: +t0.toFixed(1), len: +(t1 - t0).toFixed(1), lidPopped: e.lidPop !== undefined }; }, ei);
  if (R.stall.start < 0) fails.push('remote stall not seen'); else if (Math.abs(R.stall.len - 4) > 1) fails.push('remote stall length wrong');
  R.errs = errs; if (errs.length) fails.push('page errors');
  console.log(JSON.stringify(R, null, 1)); console.log(fails.length ? 'MP-ELEPHANT FAIL: ' + fails.join(', ') : 'MP-ELEPHANT PASS'); await browser.close(); process.exit(fails.length ? 1 : 0);
})();
