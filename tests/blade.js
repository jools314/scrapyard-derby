// Dozer blade orientation: regression test for the convex mouldboard bug.
// The blade is a BoxGeometry plate bent vertex-by-vertex along +x (forward):
// displacement d(v), v = normalised height (-1 bottom edge, +1 top edge).
// Bug (to build 68): d(0)=+0.17, d(±1)=-0.05 — the face bulged CONVEX toward
// travel, a plough. A real blade is CONCAVE toward the front: edges lead
// (+0.12), the face recedes at mid-height (-0.10), scoop depth 0.22, so it
// scoops and rolls what it pushes. This test reads the built geometry off
// the live dozer and asserts those numbers; it fails on the unfixed code.
const { open } = require(process.env.H || './harness');
(async () => {
  const { browser, page, errors } = await open({ viewport: { width: 640, height: 400 } });
  await page.waitForTimeout(1200);
  await page.evaluate(() => { window.__noRender = true; __derby.S.aiCount = 0; document.getElementById('btnStart').click(); });
  await page.waitForFunction(() => __derby.game.countdown <= 0, null, { timeout: 90000 });
  const res = await page.evaluate(async () => {
    const D = __derby, sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    D.respawnCar(D.player, 'dozer');
    const t0 = D.game.time; while (D.game.time - t0 < 0.5) await sleep(20);
    const car = D.player;
    const entry = (car.deform || []).find((e) => { const p = e.mesh && e.mesh.geometry && e.mesh.geometry.parameters; return p && p.width === 0.2 && p.height === 1.35 && p.heightSegments === 8; });
    if (!entry) return { found: false };
    const a = entry.orig || entry.mesh.geometry.attributes.position.array;
    const rows = {};
    for (let i = 0; i < a.length; i += 3) {
      const v = Math.round((a[i + 1] / 0.675) * 4) / 4; // rows at v = -1, -0.75, ..., 1
      (rows[v] = rows[v] || []).push(a[i]);
    }
    const mean = (v) => { const r = rows[v]; return r ? r.reduce((s, x) => s + x, 0) / r.length : NaN; };
    const bottom = mean(-1), mid = mean(0), top = mean(1);
    return { found: true, bottom, mid, top, scoop: Math.min(top, bottom) - mid };
  });
  const f = [];
  if (!res.found) f.push('blade geometry not found on the dozer (deform entry width 0.2 / height 1.35 / 8 height segments)');
  else {
    if (!(res.mid < res.top && res.mid < res.bottom)) f.push(`mid-height x=${res.mid.toFixed(3)} is not behind both edges (top ${res.top.toFixed(3)}, bottom ${res.bottom.toFixed(3)}) — blade is convex/flat, cannot scoop`);
    if (!(res.scoop > 0.15 && res.scoop < 0.30)) f.push(`scoop depth ${res.scoop.toFixed(3)} outside 0.15–0.30 (expected 0.22)`);
    if (!(res.mid > -0.14 && res.mid < -0.06)) f.push(`mid-height x=${res.mid.toFixed(3)} outside -0.14..-0.06 (expected -0.10)`);
    if (!(res.top > 0.08 && res.top < 0.16 && res.bottom > 0.08 && res.bottom < 0.16)) f.push(`edges top ${res.top.toFixed(3)} / bottom ${res.bottom.toFixed(3)} outside +0.08..+0.16 (expected +0.12)`);
  }
  const pageErrs = errors.filter((e) => e.startsWith('pageerror:'));
  if (pageErrs.length) f.push('page errors: ' + pageErrs.slice(0, 3).join(' | '));
  console.log(res.found ? `blade geometry: d(bottom)=${res.bottom.toFixed(3)} d(mid)=${res.mid.toFixed(3)} d(top)=${res.top.toFixed(3)} scoop=${res.scoop.toFixed(3)}` : 'blade geometry: NOT FOUND');
  console.log(f.length ? 'BLADE FAIL <- ' + f.join('; ') : 'BLADE PASS');
  await browser.close(); process.exit(f.length ? 1 : 0);
})();
