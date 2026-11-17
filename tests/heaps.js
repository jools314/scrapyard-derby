// The scrap heaps beyond the fence stay beyond the fence. The yard is square: heaps were placed on a circle,
// so about 7% of them cut into the arena corners as big "mountains" you could drive into (owner report, Build 91).
// Checks every heap instance's world-space bounding box against the fence line (A = 150 m).
// Two loads: one ordinary, and one with Math.random seeded (seed 6), which on the old placement rule
// deterministically put a heap's box inside the fence (box centre (144, -204)): the centre sat far south,
// but the box still reached north past the fence line. That load is the regression case: the old rule
// guessed a heap's reach from its scale alone (2.35 x scale, along the centre's longest axis only) and
// never measured the heap's real rotated box, so roughly a quarter of loads let one heap in.
const { open } = require('./harness');
const SEED6 = `let a = 6; Math.random = () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };`;
const check = async (page) => page.evaluate(() => { const D = __derby, A = 150, bad = []; let n = 0; const box = new D.THREE.Box3(), m = new D.THREE.Matrix4();
  D.scene.traverse((o) => { if (!o.isInstancedMesh || !o.userData.heaps) return; if (!o.geometry.boundingBox) o.geometry.computeBoundingBox();
    for (let i = 0; i < o.count; i++) { o.getMatrixAt(i, m); box.copy(o.geometry.boundingBox).applyMatrix4(m); n++;
      // inside the fence means the heap's box overlaps the square |x| < A && |z| < A
      if (box.max.x > -A && box.min.x < A && box.max.z > -A && box.min.z < A) bad.push([+((box.min.x + box.max.x) / 2).toFixed(0), +((box.min.z + box.max.z) / 2).toFixed(0)]); } });
  return { n, bad }; });
(async () => {
  const fails = []; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails.push(m); };
  for (const [label, init] of [['random', null], ['seed 6', SEED6]]) {
    const { browser, page, errors } = await open({ viewport: { width: 400, height: 260 } }, init || undefined);
    const r = await check(page);
    ok(r.n >= 100, `${label}: found ${r.n} scrap heaps`);
    ok(r.bad.length === 0, `${label}: no heap reaches inside the fence (${r.bad.length} do${r.bad.length ? ': ' + JSON.stringify(r.bad.slice(0, 6)) : ''})`);
    const pe = errors.filter((e) => !e.includes('ERR_FAILED')); ok(pe.length === 0, `${label}: no page errors`);
    await browser.close();
  }
  console.log(fails.length ? 'HEAPS FAIL' : 'HEAPS PASS'); process.exit(fails.length ? 1 : 0);
})();
