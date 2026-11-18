// Ground texture startup cost on a weak laptop (4x CPU throttle). The yard's dirt was 900 gradient pebbles plus 56,000 fillRects, each
// with its own rgba string, on a GPU-backed canvas: the raster was deferred to the texture's first upload and cost ~2.5-3 s here, and
// the first GPU canvas also paid the GPU canvas setup. Now the speckles and pebbles are painted into a byte array with one putImageData,
// on a CPU canvas (willReadFrequently), and the same goes for the wall, concrete and ramp-plate speckles.
// Measured the same way on every build: from the ground canvas's getContext to the next canvas being made (the wall's), with a
// 1-pixel readback there so a deferred raster is paid inside the window. Best of LOADS (default 2) page loads.
// Fails on Build 115: ground 2965-3625 ms on this setup (and no BOOT.groundMs); the fix: 117-129 ms.
// Also checks the look did not go flat: same 1024x1024 tile at 110 repeats, RepeatWrapping, used as its own bump map, with the same
// mean colour and speckle variance as before (Build 115: mean ~[95.6, 86.4, 75.1], median std per 128 px block ~2.45, 2.3, 2.2).
const H = require('./harness');
const LOADS = +(process.env.LOADS || 2), THR = +(process.env.THR || 4), BUDGET = +(process.env.BUDGET || 700);
const hook = () => { const W = window.__gt = { t0: 0, t1: 0, cv: null };
  const gc = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function (k, o) { if (!W.cv && k === '2d' && this.width === 1024 && this.height === 1024) { W.cv = this; W.t0 = performance.now(); } return gc.call(this, k, o); };
  const ce = Document.prototype.createElement;
  Document.prototype.createElement = function (n, o) { if (W.cv && !W.t1 && String(n).toLowerCase() === 'canvas') { try { gc.call(W.cv, '2d').getImageData(0, 0, 1, 1); } catch (e) {} W.t1 = performance.now(); } return ce.call(this, n, o); }; };
const throttle = async (page) => { const cdp = await page.context().newCDPSession(page); await cdp.send('Emulation.setCPUThrottlingRate', { rate: THR }); };
(async () => {
  const fails = []; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails.push(m); };
  const runs = [];
  for (let i = 0; i < LOADS; i++) {
    const { browser, page, errors } = await H.open({ viewport: { width: 800, height: 500 } }, hook, throttle);
    await page.waitForFunction(() => __derby.BOOT.ready, null, { timeout: 240000, polling: 250 });
    const r = await page.evaluate(() => { const W = window.__gt, D = __derby; let tex = null, mat = null;
      D.scene.traverse((o) => { const m = o.material; if (!tex && m && m.map && m.map.repeat && m.map.repeat.x === 110) { tex = m.map; mat = m; } });
      const out = { ms: W.t1 ? Math.round(W.t1 - W.t0) : -1, groundMs: D.BOOT.groundMs, script: Math.round(D.BOOT.ready - D.BOOT.t0), found: !!tex };
      if (!tex) return out; const cv = tex.image;
      Object.assign(out, { same: cv === W.cv, w: cv.width, h: cv.height, rep: [tex.repeat.x, tex.repeat.y], wrap: [tex.wrapS, tex.wrapT], bump: mat.bumpMap && mat.bumpMap.image === cv });
      const c2 = document.createElement('canvas'); c2.width = c2.height = 1024; const g2 = c2.getContext('2d'); g2.drawImage(cv, 0, 0);
      const d = g2.getImageData(0, 0, 1024, 1024).data, sum = [0, 0, 0], stds = [[], [], []];
      for (let by = 0; by < 1024; by += 128) for (let bx = 0; bx < 1024; bx += 128) { const s = [0, 0, 0], q = [0, 0, 0]; /* per 128 px block, so a crack or stain in one block does not move the median */
        for (let y = by; y < by + 128; y++) for (let x = bx; x < bx + 128; x++) { const k = (y * 1024 + x) * 4; for (let c = 0; c < 3; c++) { s[c] += d[k + c]; q[c] += d[k + c] * d[k + c]; } }
        for (let c = 0; c < 3; c++) { sum[c] += s[c]; stds[c].push(Math.sqrt(q[c] / 16384 - (s[c] / 16384) ** 2)); } }
      out.mean = sum.map((s) => +(s / 1048576).toFixed(1)); out.std = stds.map((a) => +a.sort((x, y) => x - y)[32].toFixed(2));
      return out; });
    r.pe = errors.filter((e) => e.startsWith('pageerror'));
    console.log(`  load ${i + 1}: ground texture ${r.ms} ms (draw + raster), BOOT.groundMs ${r.groundMs}, script ${r.script} ms; ${r.w}x${r.h}, repeat ${r.rep}, mean ${r.mean}, std ${r.std}`);
    runs.push(r); await browser.close();
  }
  const best = runs.reduce((a, b) => (b.ms >= 0 && (a.ms < 0 || b.ms < a.ms) ? b : a));
  ok(runs.every((r) => r.found && r.same), 'the hooked 1024x1024 canvas is the ground texture (map at 110 repeats)');
  ok(best.ms >= 0 && best.ms < BUDGET, `ground texture built in ${best.ms} ms at ${THR}x throttle, best of ${LOADS} (< ${BUDGET} ms; Build 115: 2965-3625 ms)`);
  ok(typeof best.groundMs === 'number' && best.groundMs < BUDGET, `BOOT.groundMs recorded: ${best.groundMs} ms`);
  const r = runs[runs.length - 1];
  ok(r.w === 1024 && r.h === 1024 && r.rep[0] === 110 && r.rep[1] === 110 && r.wrap[0] === 1000 && r.wrap[1] === 1000 && r.bump, `same tile class: ${r.w}x${r.h}, repeat ${r.rep}, wrap ${r.wrap}, own bump map ${r.bump}`);
  ok(r.mean && Math.abs(r.mean[0] - 95.6) < 4 && Math.abs(r.mean[1] - 86.4) < 4 && Math.abs(r.mean[2] - 75.1) < 4, `same dirt colour: mean ${r.mean} (Build 115: 95.6, 86.4, 75.1)`);
  ok(r.std && r.std.every((s) => s > 1.6 && s < 3.6), `still speckled, not flat or noisier: median block std ${r.std} (Build 115: ~2.45, 2.3, 2.2)`);
  ok(runs.every((x) => !x.pe.length), `no page errors ${runs.flatMap((x) => x.pe).slice(0, 2).join(' | ')}`);
  console.log(fails.length ? 'GROUNDTEX FAIL' : 'GROUNDTEX PASS'); process.exit(fails.length ? 1 : 0);
})();
