// Yard pack (tools/yardpack.js): the static scenery's merged meshes come from a prebuilt binary in index.html instead of being merged
// at boot. This checks that the pack is not stale and changes nothing but the time it takes:
//  1. pack off (procedural, 4x CPU throttle): the merged scenery hashes to the pack's hash (else: run node tools/yardpack.js)
//  2. pack on (4x): the pack is used, the merged meshes are byte for byte the procedural ones, the static bodies and the props (ids,
//     masses, shapes, positions) are the same, and mergeStatic takes at most MERGE_MS (incboot: 90-280 ms here at 4x, no pack at all)
//  3. a scenery change the pack doesn't know about (unthrottled copy with one more hazard band): the pack is not used and
//     the yard is merged procedurally as before
const H = require('./harness'), fs = require('fs'), path = require('path'), os = require('os');
const YP = require('../tools/yardpack');
const THR = +(process.env.THR || 4), MERGE_MS = +(process.env.MERGE_MS || 60);
const GAME = process.env.GAME || path.join(__dirname, '..', 'index.html');
const throttle = async (page) => { const cdp = await page.context().newCDPSession(page); await cdp.send('Emulation.setCPUThrottlingRate', { rate: THR }); };
const look = () => { const D = __derby, R = (x) => Math.round(x * 100) / 100;
  const props = D.props.map((p) => [p.id, p.body.mass, p.body.shapes.map((s) => s.type).join('+'), Math.round(p.body.position.x), Math.round(p.body.position.z)].join(':')).join(' ');
  const stat = D.world.bodies.filter((b) => b.type === 2).map((b) => [b.what || '', R(b.position.x), R(b.position.y), R(b.position.z), R(b.quaternion.y), b.shapes.map((s) => s.type).join('+')].join(':')).join(' ');
  return { props, stat, nProps: D.props.length, nStat: D.world.bodies.filter((b) => b.type === 2).length, pack: D.MERGED.pack, ms: D.MERGED.ms, packMs: D.MERGED.packMs, wait: D.MERGED.wait, before: D.MERGED.before, after: D.MERGED.after }; };
(async () => {
  const fails = []; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails.push(m); };
  const pk = YP.readPack(fs.readFileSync(GAME, 'utf8'));
  ok(!!pk, `index.html carries a yard pack ${pk ? `(${pk.groups.filter(Boolean).length} meshes, raw ${pk.raw} B, deflated ${pk.deflated} B, base64 ${pk.b64} B)` : ''}`);
  const load = async (noPack, game, thr) => { const prev = process.env.GAME; if (game) process.env.GAME = game;
    const { browser, page, errors } = await H.open({ viewport: { width: 1000, height: 640 } }, noPack ? () => { window.__noYardPack = true; try { localStorage.setItem('derby-qlevel', '7'); } catch (e) {} } : () => { try { localStorage.setItem('derby-qlevel', '7'); } catch (e) {} }, thr ? throttle : null);
    if (game) { if (prev === undefined) delete process.env.GAME; else process.env.GAME = prev; }
    await page.waitForFunction(() => __derby.BOOT.built, null, { timeout: 300000, polling: 250 });
    const r = await page.evaluate(look), g = YP.digest(await page.evaluate(YP.grab));
    await browser.close(); return { r, g, errors: errors.filter((e) => e.startsWith('pageerror') || e.includes('frame error')) }; };
  // 1 + 2
  const A = await load(true, null, true), B = await load(false, null, true);
  const hA = A.g, hB = B.g;
  console.log(`  pack off: mergeStatic ${A.r.ms} ms (${A.r.before} -> ${A.r.after} meshes); pack on: mergeStatic ${B.r.ms} ms, pack ${JSON.stringify(B.r.packMs)} ms (decode and parse on the main thread, inflated by then), the script waited ${B.r.wait} ms for it, ${B.r.pack}`);
  ok(pk && hA.hash === pk.hash, `the pack is up to date with the procedural build (pack ${pk && pk.hash}, procedural ${hA.hash}; if not: node tools/yardpack.js)`);
  ok(B.r.pack === 'used' && hB.pack === 'used', `the pack is used (${B.r.pack})`);
  ok(hB.hash === hA.hash, `the merged scenery from the pack is byte for byte the procedural one (${hB.hash} / ${hA.hash})`);
  ok(A.r.before === B.r.before && A.r.after === B.r.after, `same scenery meshes merged (${B.r.before} -> ${B.r.after})`);
  ok(A.r.stat === B.r.stat && A.r.nStat > 50, `the same ${B.r.nStat} static bodies, in the same places, with or without the pack`);
  ok(A.r.props === B.r.props && B.r.nProps > 250, `the same ${B.r.nProps} props (ids, masses, shapes, positions) with or without the pack`);
  ok(B.r.ms <= MERGE_MS, `mergeStatic with the pack ${B.r.ms} ms at ${THR}x (budget ${MERGE_MS} ms; without it ${A.r.ms} ms)`);
  ok(B.r.wait <= 50, `the script did not wait for the pack to inflate (${B.r.wait} ms; a Blob stream inflated it ~3.7 s late at 4x)`);
  ok(!A.errors.length && !B.errors.length, `no page errors ${[...A.errors, ...B.errors].slice(0, 2).join(' | ')}`);
  // 3. stale pack: falls back
  const src = fs.readFileSync(GAME, 'utf8'), a = '\nconst MERGED = ';
  if (!src.includes(a)) ok(false, 'stale-pack check: mergeStatic is not where this test looks for it');
  else { const f = path.join(os.tmpdir(), 'derby-yardpack-stale.html'); // (one more hazard band under the ground: a group the pack knows gets a mesh more)
    fs.writeFileSync(f, src.replace(a, '\n{ const b = new THREE.Mesh(new THREE.BoxGeometry(1, 0.5, 1), HARD_BAND()); b.position.set(0, -5, 0); b.receiveShadow = true; scene.add(b); }' + a));
    const C = await load(false, f, false);
    ok(C.r.pack === 'stale' && C.r.after === A.r.after, `scenery the pack doesn't match: the pack is not used, the yard is merged as before (${C.r.pack}, ${C.r.before} -> ${C.r.after})`);
    ok(!C.errors.length, `stale pack: no page errors ${C.errors.slice(0, 2).join(' | ')}`); }
  console.log(fails.length ? 'YARDPACK FAIL' : 'YARDPACK PASS'); process.exit(fails.length ? 1 : 0);
})();
