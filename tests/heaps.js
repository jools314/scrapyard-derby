// The scrap heaps beyond the fence stay beyond the fence. The yard is square: heaps were placed on a circle,
// so about 7% of them cut into the arena corners as big "mountains" you could drive into (owner report, Build 91).
// Checks every heap instance's world-space bounding box against the fence line (A = 150 m).
const { open } = require('./harness');
(async () => {
  const { browser, page, errors } = await open({ viewport: { width: 400, height: 260 } });
  const fails = []; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails.push(m); };
  const r = await page.evaluate(() => { const D = __derby, A = 150, bad = []; let n = 0; const box = new D.THREE.Box3(), m = new D.THREE.Matrix4();
    D.scene.traverse((o) => { if (!o.isInstancedMesh || !o.userData.heaps) return; if (!o.geometry.boundingBox) o.geometry.computeBoundingBox();
      for (let i = 0; i < o.count; i++) { o.getMatrixAt(i, m); box.copy(o.geometry.boundingBox).applyMatrix4(m); n++;
        // inside the fence means the heap's box overlaps the square |x| < A && |z| < A
        if (box.max.x > -A && box.min.x < A && box.max.z > -A && box.min.z < A) bad.push([+((box.min.x + box.max.x) / 2).toFixed(0), +((box.min.z + box.max.z) / 2).toFixed(0)]); } });
    return { n, bad }; });
  ok(r.n >= 100, `found ${r.n} scrap heaps`);
  ok(r.bad.length === 0, `no heap reaches inside the fence (${r.bad.length} do${r.bad.length ? ': ' + JSON.stringify(r.bad.slice(0, 6)) : ''})`);
  const pe = errors.filter((e) => !e.includes('ERR_FAILED')); ok(pe.length === 0, 'no page errors');
  console.log(fails.length ? 'HEAPS FAIL' : 'HEAPS PASS'); await browser.close(); process.exit(fails.length ? 1 : 0);
})();
