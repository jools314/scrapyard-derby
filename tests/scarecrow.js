// SCARECROWS: straw rag dolls on posts (the kids' ask: "rag dolls that just stand around so you can ram into them... like scarecrows").
// Checks, with real numbers:
//  - 6-10 scarecrows stand in the yard, as props, drawn by a handful of shared instanced meshes;
//  - the yard keeps its breathing room: >= 75% of the floor has no prop within 6 m (QUALITY-GATES 3b), and no less than before them (87.12%);
//  - a car ramming one at speed flings it: it travels metres, the torso tumbles and the limbs flop (they move relative to the torso);
//    it settles (limb bodies gone), and a second ram sends it off again; zero solver-kick undos on the car that hit it;
//  - fire burns it down to a charred stick; a bull standing next to one ignores it;
//  - at most SCARE_CAP() rag dolls are active at once, however many are knocked over together;
//  - 3 match restarts in the middle of all that leave no orphaned limb bodies, joints or geometries;
//  - the tsunami (Build 133) knocks standing scarecrows off their posts, floats them (capable devices) and puts a burning one out.
// Fails on Build 123 (no scarecrows).
const { open } = require('./harness');
(async () => {
  const { browser, page, errors } = await open({ viewport: { width: 640, height: 400 } });
  const fails = []; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails.push(m); };
  const start = async () => { await page.evaluate(() => { __derby.S.aiCount = 0; window.__noRender = true; document.getElementById('btnStart').click(); });
    await page.waitForFunction(() => __derby.game.state === 'playing' && __derby.game.countdown <= 0, null, { timeout: 240000 }); };
  await start();
  const has = await page.evaluate(() => Array.isArray(__derby.SCARE) && __derby.SCARE.length > 0);
  ok(has, 'scarecrows exist');
  if (!has) { console.log('SCARECROW FAIL'); await browser.close(); process.exit(1); }
  const PRE = `const D = __derby, CA = D.CANNON, sleep = (ms) => new Promise((r) => setTimeout(r, ms)), p = D.player;
    const waitG = async (s, until) => { const t0 = D.game.time, w0 = performance.now(); while (D.game.time - t0 < s && performance.now() - w0 < s * 6000 + 3000) { await sleep(25); if (until && until()) return true; } return false; };
    const ang = (a, b) => { const d = Math.abs(a.x * b.x + a.y * b.y + a.z * b.z + a.w * b.w); return 2 * Math.acos(Math.min(1, d)); };
    const park = () => { for (const bl of D.BULLS) { bl.body.position.set(-130, 1.3, -130 + bl.id * 4); bl.body.velocity.set(0, 0, 0); } };`;

  // 1. what stands in the yard, and the open floor
  const yard = await page.evaluate(`(async () => { ${PRE}
    const sc = D.SCARE, I = D.SCIM, ims = ['torso', 'head', 'arm', 'leg', 'stick'].map((k) => I[k]);
    const open = (skip) => { const ps = D.props.filter((pr) => !skip || !pr.scare).map((pr) => [pr.body.position.x, pr.body.position.z]); let n = 0, o = 0;
      for (let x = -145; x <= 145; x += 1) for (let z = -145; z <= 145; z += 1) { n++; let free = true; for (const [a, b] of ps) if ((a - x) ** 2 + (b - z) ** 2 < 36) { free = false; break; } if (free) o++; } return o / n * 100; };
    return { n: sc.length, allProps: sc.every((s) => D.props.includes(s.pr) && s.up && !s.active), standing: sc.every((s) => s.pr.body.position.y > 1.7),
      instanced: ims.every((m) => m && m.isInstancedMesh), meshes: ims.length, open: +open(false).toFixed(2), openNoScare: +open(true).toFixed(2), props: D.props.length }; })()`);
  console.log('  yard: ' + JSON.stringify(yard));
  ok(yard.n >= 6 && yard.n <= 10 && yard.allProps && yard.standing, `6-10 scarecrows standing on their posts, as props (${yard.n})`);
  ok(yard.instanced, 'drawn by 5 shared InstancedMeshes (torso, head, arms, legs, burnt stick)');
  ok(yard.open >= 75, `open floor: ${yard.open}% of the yard has no prop within 6 m (want >= 75%)`);
  ok(yard.open >= 87.1, `no less open floor than before the scarecrows (Build 123: 87.12%; now ${yard.open}%): they replaced bins, tyres and boxes`);

  // 2. ram one at speed
  const ram = await page.evaluate(`(async () => { ${PRE} park();
    const sc = D.SCARE[0], b = sc.pr.body; D.scarePlace(sc, 0, 40, Math.PI); await waitG(0.3);
    p.body.position.set(0, 1.2, 70); p.body.quaternion.set(0, 0, 0, 1); p.body.angularVelocity.set(0, 0, 0); await waitG(0.3);
    const f = p.fwd; const tx = p.body.position.x + f.x * 22, tz = p.body.position.z + f.z * 22; D.scarePlace(sc, tx, tz, 0); await waitG(0.2);
    const kick0 = D.PHYS.log.filter((e) => e.kind === 'solver kick undone').length, x0 = b.position.x, z0 = b.position.z, q0 = { x: b.quaternion.x, y: b.quaternion.y, z: b.quaternion.z, w: b.quaternion.w };
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyW', key: 'w' }));
    let launched = false, maxRel = [0, 0, 0, 0, 0], maxRot = 0, maxD = 0, maxY = 0; const t0 = D.game.time;
    while (D.game.time - t0 < 5) { await sleep(25); if (D.game.time - t0 < 1.2) p.body.velocity.set(f.x * 20, p.body.velocity.y, f.z * 20); else window.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyW', key: 'w' }));
      if (sc.active) { launched = true; const bq = b.quaternion; for (let k = 0; k < 5; k++) { const pb = sc.pb[k]; if (!pb) continue; const rel = bq.conjugate().mult(pb.quaternion); const rest = new D.THREE.Quaternion().setFromRotationMatrix(sc.lm[k]); maxRel[k] = Math.max(maxRel[k], ang(rel, rest)); } }
      maxRot = Math.max(maxRot, ang(b.quaternion, q0)); maxD = Math.max(maxD, Math.hypot(b.position.x - x0, b.position.z - z0)); maxY = Math.max(maxY, b.position.y); }
    window.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyW', key: 'w' }));
    const kicks = D.PHYS.log.filter((e) => e.kind === 'solver kick undone').slice(kick0);
    const settled = await waitG(10, () => !sc.active);
    const limbsGone = sc.pb.length === 0 && !D.world.bodies.some((x) => x.prop === sc.pr && x !== b);
    // hit it again where it lies
    p.body.velocity.set(0, 0, 0); await waitG(0.3); const x1 = b.position.x, z1 = b.position.z, dx = x1 - p.body.position.x, dz = z1 - p.body.position.z, d = Math.hypot(dx, dz);
    p.body.position.set(x1 - dx / d * 9, 1.2, z1 - dz / d * 9); p.body.quaternion.setFromAxisAngle(new CA.Vec3(0, 1, 0), Math.atan2(-dz, dx)); p.body.angularVelocity.set(0, 0, 0); await waitG(0.1);
    let again = false, maxD2 = 0; const t1 = D.game.time; while (D.game.time - t1 < 3) { await sleep(25); if (D.game.time - t1 < 1) p.body.velocity.set(dx / d * 16, p.body.velocity.y, dz / d * 16); if (sc.active) again = true; maxD2 = Math.max(maxD2, Math.hypot(b.position.x - x1, b.position.z - z1)); }
    const kicks2 = D.PHYS.log.filter((e) => e.kind === 'solver kick undone').slice(kick0);
    return { launched, travel: +maxD.toFixed(1), maxY: +maxY.toFixed(1), torsoRot: +maxRot.toFixed(2), limbRel: maxRel.map((x) => +x.toFixed(2)), kicks: kicks.length, kickWho: kicks.map((k) => k.who), settled, limbsGone, again, travel2: +maxD2.toFixed(1), kicksTotal: kicks2.length, flew: sc.launches };
  })()`);
  console.log('  ram: ' + JSON.stringify(ram));
  ok(ram.launched && ram.travel >= 3, `a car ramming a scarecrow at 20 m/s flings it (${ram.travel} m, up to ${ram.maxY} m high)`);
  ok(ram.torsoRot > 0.8, `it tumbles (torso turned ${ram.torsoRot} rad)`);
  ok(ram.limbRel.filter((x) => x > 0.4).length >= 3, `its limbs flop on their own: >= 3 of 5 parts turn > 0.4 rad against the torso (${ram.limbRel})`);
  ok(ram.settled && ram.limbsGone, 'it settles: the limb bodies and joints go once it lies still');
  ok(ram.again && ram.travel2 >= 2, `hit again where it lies, it flies again (${ram.travel2} m)`);
  ok(ram.kicksTotal === 0, `zero solver-kick undos on the car that hit it (${ram.kicksTotal} ${ram.kickWho})`);

  // 3. fire: it burns to a charred stick; bulls ignore it
  const fire = await page.evaluate(`(async () => { ${PRE} park();
    const sc = D.SCARE[1], b = sc.pr.body; p.body.position.set(0, 1.2, 100); p.body.velocity.set(0, 0, 0); D.scarePlace(sc, 30, 60, 0); await waitG(0.3);
    const lit = D.igniteProp(sc.pr, 8), t0 = D.game.time; const charred = await waitG(12, () => sc.stick); const secs = D.game.time - t0;
    await waitG(0.3); const stickShown = D.SCIM.stick.visible, shapes = b.shapes.length;
    const s2 = D.SCARE[2], bl = D.BULLS[0]; D.scarePlace(s2, -30, 60, 0); bl.body.position.set(-28, 1.3, 60); bl.body.velocity.set(0, 0, 0); bl.state = 'graze'; bl.t = 20; bl.angry = null; bl.target = null;
    let bullTarget = false; const t1 = D.game.time; while (D.game.time - t1 < 3) { await sleep(50); if (bl.target && !bl.target.car && bl.target !== p && !D.cars.includes(bl.target)) bullTarget = true; if (bl.state === 'charge' || bl.state === 'paw') bullTarget = true; }
    return { lit, charred, secs: +secs.toFixed(1), stick: sc.stick, charredFlag: !!sc.pr.charred, stickShown, shapes, bullTarget, bullState: bl.state };
  })()`);
  console.log('  fire: ' + JSON.stringify(fire));
  ok(fire.lit && fire.charred && fire.charredFlag && fire.stickShown, `set alight, it burns down to a charred stick (${fire.secs} s)`);
  ok(!fire.bullTarget, `a bull grazing next to a scarecrow ignores it (${fire.bullState})`);

  // 4. the cap: knock every standing scarecrow over at once
  const cap = await page.evaluate(`(async () => { ${PRE} park();
    p.body.position.set(0, 1.2, 100); p.body.velocity.set(0, 0, 0);
    const live = D.SCARE.filter((s) => !s.stick && !s.gone); live.forEach((s, i) => { D.scarePlace(s, -40 + i * 12, -60, 0); }); await waitG(0.2);
    for (const s of live) { D.wakeProp(s.pr); s.pr.body.wakeUp(); s.pr.body.velocity.set(6, 4, 0); }
    let maxActive = 0, maxLimbs = 0; const t0 = D.game.time; while (D.game.time - t0 < 3) { await sleep(20); maxActive = Math.max(maxActive, D.SCARE.filter((s) => s.active).length); maxLimbs = Math.max(maxLimbs, D.world.bodies.filter((b) => b.prop && b.prop.scare && b !== b.prop.body).length); }
    return { knocked: live.length, launched: live.filter((s) => !s.up).length, maxActive, maxLimbs, cap: D.scareCap() }; })()`);
  console.log('  cap: ' + JSON.stringify(cap));
  ok(cap.launched === cap.knocked && cap.maxActive <= cap.cap && cap.maxActive >= 2, `${cap.knocked} knocked over at once: at most ${cap.cap} rag dolls active (${cap.maxActive}), ${cap.maxLimbs} limb bodies at most`);
  ok(cap.maxLimbs <= cap.cap * 5, `limb bodies never exceed ${cap.cap * 5} (${cap.maxLimbs})`);

  // 5. no leaks over 3 restarts with rag dolls in the air
  const leak = await page.evaluate(`(async () => { ${PRE} const T = D.THREE; window.__noRender = false;
    const live = new Set(); for (const C of [T.BufferGeometry, T.Texture]) { const P = C.prototype, a = P.addEventListener, rm = P.removeEventListener;
      P.addEventListener = function (t, f) { if (t === 'dispose') live.add(this); return a.call(this, t, f); }; P.removeEventListener = function (t, f) { if (t === 'dispose') live.delete(this); return rm.call(this, t, f); }; }
    const fr = async (k) => { for (let i = 0; i < k; i++) await sleep(30); };
    const inScene = () => { const s = new Set(); D.scene.traverse((o) => { if (o.geometry) s.add(o.geometry); }); return s; };
    const count = () => ({ bodies: D.world.bodies.filter((b) => !b.prop).length, cons: D.world.constraints.length, limbs: D.world.bodies.filter((b) => b.prop && b.prop.scare && b !== b.prop.body).length, stale: D.world.bodies.filter((b) => b.prop && !D.props.includes(b.prop)).length, active: D.SCARE.filter((s) => s.active).length, down: D.SCARE.filter((s) => !s.up).map((s) => (s.by ? s.by.name : 'no car') + ' ' + Math.round(Math.min(...D.BULLS.map((bl) => bl.body.position.distanceTo(s.pr.body.position)))) + ' m from a bull') });
    const flingAll = async () => { for (const s of D.SCARE) { D.wakeProp(s.pr); s.pr.body.wakeUp(); s.pr.body.velocity.set(5, 5, 2); } const w0 = performance.now(); while (!D.SCARE.some((s) => s.active) && performance.now() - w0 < 30000) await sleep(30); await waitG(0.1); }; // (the first frames after rendering is back on can be slow: shaders compile)
    const fresh = async () => { D.startMatch(); const w0 = performance.now(); while (!(D.game.countdown <= 0 && D.game.time > 1.5) && performance.now() - w0 < 120000) await sleep(50); };
    await fresh(); const base0 = count(); const base = new Set(live);
    const rows = []; for (let k = 0; k < 3; k++) { await flingAll(); const mid = count(); await fresh(); rows.push({ mid, after: count() }); }
    const sc = inScene(), orph = [...live].filter((x) => !base.has(x) && !sc.has(x) && !(x.userData && x.userData.shared)), orphans = orph.length, orphanGeo = orph.filter((x) => x.isBufferGeometry).length, what = orph.map((x) => x.type + ':' + (x.attributes && x.attributes.position ? x.attributes.position.count : '') + (x.attributes && x.attributes.color ? 'C' : ''));
    return { base0, rows, orphans, orphanGeo, what, scare: D.SCARE.length }; })()`);
  console.log('  leak: ' + JSON.stringify(leak));
  ok(leak.rows.every((r) => r.mid.limbs > 0), 'rag dolls were flying at each restart (' + leak.rows.map((r) => r.mid.limbs).join(', ') + ' limb bodies)');
  ok(leak.rows.every((r) => r.after.bodies === leak.base0.bodies && r.after.limbs === r.after.active * 5 && r.after.cons === r.after.limbs && r.after.stale === 0), `3 restarts: non-prop bodies ${leak.base0.bodies} -> ${leak.rows.map((r) => r.after.bodies)}, joints ${leak.rows.map((r) => r.after.cons)} = 5 per rag doll active in the fresh yard (${leak.rows.map((r) => r.after.active)}), no stale prop bodies`);
  ok(leak.orphanGeo === 0, `3 restarts leave no orphaned geometries (${leak.orphanGeo}; ${leak.orphans - leak.orphanGeo} textures from elsewhere, memleak.js budgets those)`);

  // 6. the tsunami (Build 133): the wave knocks standing scarecrows off their posts, they float on the flood, and a burning one is put out
  const flood = await page.evaluate(`(async () => { ${PRE} park(); const T = D.TSU; window.__noRender = true; const q0 = D.QUALITY.level; D.S.autoGfx = false; D.applyQuality(4); /* (a capable device: light junk floats; on lite quality it stays put) */
    p.body.position.set(0, 1.2, 100); p.body.velocity.set(0, 0, 0); T.FLOOD = 14; const L0 = T.LEVEL; T.LEVEL = 1.3; /* (the water stays below a standing scarecrow's straw: 1.24-1.36 m, the torso is at 1.9) */ D.startTsunami(true);
    const w0 = performance.now(); while (T.state !== 'flood' && performance.now() - w0 < 120000) await sleep(50);
    const live = D.SCARE.filter((s) => !s.gone && !s.stick), a = live[0], c = live[1]; p.body.position.set(0, 1.2, 50); p.body.velocity.set(0, 0, 0);
    D.scarePlace(a, -6, 62, 0); D.scarePlace(c, 6, 62, 0); D.wakeProp(a.pr); D.wakeProp(c.pr); await waitG(0.1); const lit = D.igniteProp(a.pr, 30), fire0 = +(a.pr.fireT || 0).toFixed(1);
    let out = null; const t0 = D.game.time; while (D.game.time - t0 < 6) { await sleep(25); if (out === null && !(a.pr.fireT > 0)) out = +(D.game.time - t0).toFixed(1); }
    const ys = [a, c].map((s) => +s.pr.body.position.y.toFixed(2)), lvl = +T.level.toFixed(2), st = T.state;
    T.FLOOD = 34; T.LEVEL = L0; const lite = D.QUALITY.lite; D.applyQuality(q0); return { lite, noFloat: !!T.noFloat, st, lvl, lit, fire0, out, stick: a.stick, knocked: [a, c].map((s) => !s.up), ys, active: D.SCARE.filter((s) => s.active).length }; })()`);
  console.log('  flood: ' + JSON.stringify(flood));
  ok(flood.lit && flood.out !== null && flood.out < 2 && !flood.stick, `the flood puts out a burning scarecrow standing in it (out after ${flood.out} s, not burnt to a stick)`);
  ok(flood.knocked.every(Boolean), `the flood knocks standing scarecrows off their posts (${flood.knocked})`);
  ok(!flood.lite && !flood.noFloat && flood.knocked.every(Boolean) && flood.ys.every((y) => y > flood.lvl - 0.7 && y < flood.lvl + 0.45), `they float on the flood: torsos at y ${flood.ys} with the water at ${flood.lvl} m (not lying on the floor at ~0.3)`);

  const pe = errors.filter((e) => e.startsWith('pageerror') || (e.startsWith('error') && !e.includes('ERR_FAILED')));
  ok(!pe.length, 'no page errors ' + pe.slice(0, 3).join(' | '));
  console.log(fails.length ? 'SCARECROW FAIL' : 'SCARECROW PASS'); await browser.close(); process.exit(fails.length ? 1 : 0);
})();
