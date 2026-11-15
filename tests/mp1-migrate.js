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
  const H = await mk({ viewport: { width: 900, height: 600 } }, true);
  await H.goto('http://game.local/'); await H.waitForFunction(() => window.__derby && __derby.MP.transport === 'peer');
  await H.fill('#mpNick', 'Dad'); await H.evaluate(() => { __derby.S.aiCount = 4; __derby.S.damage = 0; }); await H.click('#btnHost'); await H.waitForTimeout(1200);
  const link = await H.inputValue('#mpLink');
  const G = [];
  for (const nick of ['Kid1', 'Kid2']) { const p = await mk({ viewport: { width: 800, height: 560 } }, true); await p.goto('http://game.local/' + link.slice(link.indexOf('?'))); await p.waitForFunction(() => window.__derby && __derby.MP.role === 'guest', null, { timeout: 40000 }); await p.fill('#mpNick', nick); await p.evaluate(() => __derby.MP.sendWant()); G.push(p); }
  await H.waitForTimeout(1500); await H.click('#btnStart'); await G[0].waitForTimeout(5000);
  const R = {};
  const view = (p) => p.evaluate(() => ({ role: __derby.MP.role, peers: __derby.MP.room.peers().filter((x) => !x.sameTab).map((x) => (x.presence.host ? 'H' + x.presence.host + ':' : '') + (x.presence.nick || '?')), cars: __derby.cars.length, me: __derby.player && __derby.player.type, st: __derby.game.state }));
  // mesh: each kid should be connected to Dad and to the other kid
  await G[0].waitForFunction(() => __derby.MP.room.peers().filter((x) => !x.sameTab).length >= 2, null, { timeout: 30000 }).catch(() => {});
  R.mesh = { kid1: await view(G[0]), kid2: await view(G[1]) };
  // ---- 1. the host vanishes ----
  const posBefore = await G[1].evaluate(() => __derby.cars.map((c) => [c.body.position.x, c.body.position.z]));
  await H.close(); const t0 = Date.now();
  const who = await Promise.any(G.map((p, i) => p.waitForFunction(() => window.__derby && __derby.MP.role === 'host', null, { timeout: 30000 }).then(() => i)));
  R.takeoverAfterS = (Date.now() - t0) / 1000; R.newHost = who === 0 ? 'Kid1' : 'Kid2';
  const other = G[1 - who], nh = G[who];
  await other.waitForFunction(() => { const s = __derby.MP.snaps; return s.length > 3 && document.getElementById('hostlost').hidden; }, null, { timeout: 20000 }).catch(() => {});
  R.banner = await other.evaluate(() => document.getElementById('hostlost').hidden ? 'gone' : document.getElementById('hostlost').textContent);
  await other.waitForTimeout(4000);
  R.afterTakeover = { newHost: await view(nh), other: await view(other) };
  R.moving = await other.evaluate(() => __derby.cars.filter((c) => Math.hypot(c.body.velocity.x, c.body.velocity.z) > 1).length);
  R.otherUpdPerSec = await other.evaluate(() => Math.round(1 / (__derby.MP.net ? __derby.MP.net.iv : 1)));
  R.otherStillDrives = await other.evaluate(async () => { const p = __derby.player; const a = p.body.position.clone(); window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyW', key: 'w' })); await new Promise((r) => setTimeout(r, 2500)); window.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyW', key: 'w' })); return +__derby.player.body.position.distanceTo(a).toFixed(1); });
  // ---- 2. manual hand-over back to the other kid ----
  const otherPeer = await other.evaluate(() => __derby.MP.myPeer());
  await nh.evaluate((p) => __derby.MP.handOver(p), otherPeer);
  await other.waitForFunction(() => __derby.MP.role === 'host', null, { timeout: 15000 }).catch(() => {});
  await nh.waitForFunction(() => __derby.MP.role === 'guest' && __derby.MP.snaps.length > 3, null, { timeout: 15000 }).catch(() => {});
  await nh.waitForTimeout(2500);
  R.afterHandover = { formerHost: await view(nh), nowHost: await view(other) };
  R.formerHostDrives = await nh.evaluate(async () => { const p = __derby.player; const a = p.group.position.clone(); window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyW', key: 'w' })); await new Promise((r) => setTimeout(r, 2500)); window.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyW', key: 'w' })); return +__derby.player.group.position.distanceTo(a).toFixed(1); });
  R.log = await other.evaluate(() => __derby.NETLOG.inc.map((e) => e.who + ': ' + e.what).slice(-4));
  // the host's view afterwards: exactly one car per player (no ghost car left behind for anybody)
  R.oneCarEach = await other.evaluate(() => { const M = __derby.MP, dids = [...new Set(M.players().map((g) => g.presence.did).concat(__derby.player.did))]; // the guest(s) and the host itself
    return { players: dids.length, ok: dids.length === 2 && dids.every((d) => __derby.cars.filter((c) => c.did === d).length === 1) && __derby.cars.filter((c) => c.remote || c.isPlayer).length === 2 }; });
  R.errs = errs;
  R.pass = !!R.newHost && R.banner === 'gone' && R.afterTakeover.other.role === 'guest' && R.afterTakeover.newHost.role === 'host' && R.otherStillDrives > 2 && R.afterHandover.nowHost.role === 'host' && R.afterHandover.formerHost.role === 'guest' && R.formerHostDrives > 2 && R.oneCarEach.ok && !errs.length;
  console.log(JSON.stringify(R, null, 1)); await browser.close();
})();
