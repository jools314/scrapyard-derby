// The broadphase must not miss pairs. Each step, compare the game's fast pair walk with a brute-force check of every pair
// (same filters, same exact intersection test). Before Build 94 the list was sorted by stale static AABBs (many statics keep the
// box from before they were placed, which sorts them near x=0), so the walk stopped early near the middle of the yard:
// cars could pass straight through each other there, and cars ended up inside things.
const { open } = require('./harness');
(async () => {
  const { browser, page, errors } = await open({ viewport: { width: 320, height: 200 } });
  const fails = []; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails.push(m); };
  const r = await page.evaluate(async () => { window.__noRender = true; const D = __derby, W = D.world, bp = W.broadphase, sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    D.S.aiCount = 7; document.getElementById('btnStart').click();
    while (!(D.game.state === 'playing' && D.game.countdown <= 0)) await sleep(100);
    // two cars driving head-on through the middle of the yard (x near 0), plus the rest of the match going on
    const [a, b] = D.cars.filter((c) => !c.isPlayer); for (const c of [a, b]) { c.think = () => {}; Object.assign(c.ctrl, { throttle: 0, steer: 0, fire: false, jump: false, nitro: false }); } // (c.ai is not a flag the game reads: stub the brain so the two test cars only go where this test throws them)
    a.body.position.set(-8, 3.6, 0); b.body.position.set(8, 3.6, 0); // on the central mesa
    a.body.velocity.set(10, 0, 0); b.body.velocity.set(-10, 0, 0); a.body.quaternion.set(0, 0, 0, 1); b.body.quaternion.setFromAxisAngle(new D.CANNON.Vec3(0, 1, 0), Math.PI);
    const orig = bp.collisionPairs; let steps = 0, missed = 0, total = 0; const ex = [];
    bp.collisionPairs = function (wo, p1, p2) { orig.call(this, wo, p1, p2); steps++;
      const got = new Set(); for (let i = 0; i < p1.length; i++) { const x = p1[i].id, y = p2[i].id; got.add(x < y ? x + ',' + y : y + ',' + x); }
      const B = wo.bodies, q1 = [], q2 = [];
      for (let i = 0; i < B.length; i++) for (let j = i + 1; j < B.length; j++) { if (!this.needBroadphaseCollision(B[i], B[j])) continue; this.intersectionTest(B[i], B[j], q1, q2); }
      total += q1.length; for (let k = 0; k < q1.length; k++) { const x = q1[k].id, y = q2[k].id; if (!got.has(x < y ? x + ',' + y : y + ',' + x)) { missed++; if (ex.length < 6) ex.push([q1[k].position.x.toFixed(0), q2[k].position.x.toFixed(0)]); } } };
    const t0 = D.simTime; let minGap = 99;
    while (D.simTime - t0 < 4) { await sleep(30); minGap = Math.min(minGap, a.body.position.distanceTo(b.body.position)); if (D.simTime - t0 < 1.2) { a.body.velocity.x = 10; b.body.velocity.x = -10; } }
    bp.collisionPairs = orig;
    return { steps, missed, total, ex, minGap: +minGap.toFixed(2) };
  });
  console.log('  ' + JSON.stringify(r));
  ok(r.steps > 50, `checked ${r.steps} physics steps (${r.total} touching pairs)`);
  ok(r.missed === 0, `the broadphase missed ${r.missed} pairs that were touching` + (r.ex.length ? ' e.g. at x ' + JSON.stringify(r.ex) : ''));
  console.log(`  (info) two cars driven head-on at x~0: closest centres ${r.minGap} m apart in 3D (not asserted: it varies with car type and load; the pair check above is what fails on the old broadphase)`);
  const pe = errors.filter((e) => !e.includes('ERR_FAILED')); ok(pe.length === 0, 'no page errors');
  console.log(fails.length ? 'BROADPHASE FAIL' : 'BROADPHASE PASS'); await browser.close(); process.exit(fails.length ? 1 : 0);
})();
