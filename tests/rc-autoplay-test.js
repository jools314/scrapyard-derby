// Autoplay mode: start from ?autoplay=1, run N short matches, check the play log, vehicle cycling, memory, errors, the report and the meter
const { open } = require('./harness');
const N = +(process.env.N || 4), LEN = +(process.env.LEN || 20), NORENDER = process.env.NORENDER !== '0';
(async () => {
  const { browser, page, errors } = await open({ viewport: { width: 760, height: 460 } });
  const fails = []; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails.push(m); };
  await page.evaluate(() => { for (const k of Object.keys(localStorage)) if (k.startsWith('derby-pl') || k.startsWith('derby-autoplay')) localStorage.removeItem(k); });
  await page.goto(`http://game.local/?autoplay=1&aplen=${LEN}`, { timeout: 180000 });
  await page.waitForFunction(() => window.__derby, null, { timeout: 180000 });
  if (NORENDER) await page.evaluate(() => { window.__noRender = true; });
  await page.waitForFunction(() => __derby.AUTO.on && __derby.game.state === 'playing', null, { timeout: 30000 });
  ok(true, 'started from ?autoplay=1');
  ok(await page.evaluate(() => __derby.sfx.muted), 'sound muted in autoplay');
  const mats = () => page.evaluate(() => __derby.PLAYLOG.matches().filter((s) => s.role === 'autoplay'));
  const t0 = Date.now(); let hidDone = false;
  while (true) {
    const st = await page.evaluate(() => ({ n: __derby.PLAYLOG.matches().filter((s) => s.role === 'autoplay').length, gt: Math.round(__derby.game.time), car: __derby.player.T.name, m: __derby.AUTO.seq, heap: performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1048576) : null }));
    console.log(`  ${Math.round((Date.now() - t0) / 1000)}s: logged ${st.n}, match ${st.m} t=${st.gt}s, you: ${st.car}, heap ${st.heap} MB`);
    if (st.n >= N) break;
    if (Date.now() - t0 > 30 * 60000) { ok(false, 'timed out waiting for matches'); break; }
    if (st.n === 1 && !hidDone) { hidDone = true; // tab hidden for a few seconds, then back
      await page.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => true }); document.dispatchEvent(new Event('visibilitychange')); });
      await page.waitForTimeout(3000);
      await page.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => false }); document.dispatchEvent(new Event('visibilitychange')); });
    }
    await page.waitForTimeout(5000);
  }
  const log = await mats();
  ok(log.length >= 3, `play log has ${log.length} autoplay matches`);
  const sane = log.every((s) => s.build && s.start && s.end && s.role === 'autoplay' && s.device && s.fps && s.fps.med > 0 && s.fps.low1 > 0 && s.game >= LEN && s.q && s.phys && s.stuck && s.veh && Object.keys(s.veh).length >= 5 && s.weap && s.errs && s.mem && s.me && s.me.length >= 1 && s.ev.length >= 3);
  ok(sane, 'every match has build/start/end/role/device/fps/q/phys/stuck/veh/weap/errs/mem/me/events');
  const mine = [...new Set(log.flatMap((s) => s.me.map((x) => x.car)))];
  ok(mine.length >= Math.min(N, 3), `your car cycled through ${mine.length} vehicles: ${mine.join(', ')}`);
  const kills = log.reduce((a, s) => a + Object.values(s.veh).reduce((b, v) => b + v.k, 0), 0), dmg = log.reduce((a, s) => a + Object.values(s.veh).reduce((b, v) => b + v.dmg, 0), 0), fires = log.reduce((a, s) => a + Object.values(s.weap).reduce((b, v) => b + v, 0), 0);
  ok(dmg > 0 && fires > 0, `combat recorded: ${kills} kills, ${dmg} damage dealt, ${fires} weapon uses`);
  console.log('per match:\n  ' + log.map((s) => `#${s.seq} ${s.ended} fps ${s.fps.med}/${s.fps.p5}/${s.fps.low1} q${s.q.start}->${s.q.end} slow ${s.slow.secs}s phys ${s.phys.fixes}/${s.phys.clamps}/${s.phys.undos}/${s.phys.rescues} launch ${s.phys.launches} stuck ${s.stuck.n} err ${s.errs.n} mem geo ${s.mem.geo} tex ${s.mem.tex} heap ${s.mem.heapMB} bodies ${s.mem.bodies} objs ${s.mem.objs} hidden ${s.hidden}s ev ${s.ev.length} me ${s.me.map((x) => x.car).join('+')}`).join('\n  '));
  const a = log[1], b = log[log.length - 1];
  ok(b.mem.geo <= a.mem.geo * 1.15 + 20, `geometries ${a.mem.geo} -> ${b.mem.geo}`);
  ok(b.mem.tex <= a.mem.tex * 1.15 + 5, `textures ${a.mem.tex} -> ${b.mem.tex}`);
  { const nb = (m) => m.bodies - (m.debris || 0); ok(nb(b.mem) <= nb(a.mem) * 1.15 + 10, `physics bodies excluding flying debris ${nb(a.mem)} -> ${nb(b.mem)} (debris ${a.mem.debris} -> ${b.mem.debris})`); } // (debris comes and goes with the action; the yard itself must not grow)
  ok(b.mem.objs <= a.mem.objs * 1.15 + 20, `scene objects ${a.mem.objs} -> ${b.mem.objs}`);
  if (a.mem.heapMB != null) ok(b.mem.heapMB <= a.mem.heapMB * 1.25 + 10, `JS heap ${a.mem.heapMB} -> ${b.mem.heapMB} MB`);
  const arr = await page.evaluate(() => ({ phys: __derby.PHYS.log.length, q: __derby.QUALITY.log.length, cars: __derby.cars.length, scene: __derby.scene.children.length, debris: __derby.debris.length, ev: __derby.PLAYLOG.m ? __derby.PLAYLOG.m.ev.length : 0 }));
  console.log('array sizes', JSON.stringify(arr));
  ok(arr.phys <= 200 && arr.q <= 60, 'rolling logs stay bounded');
  ok(log.some((s) => s.hidden >= 2 && s.ev.some((e) => e[1] === 'hidden')), 'hidden time counted after hide/show');
  await page.evaluate(() => { window.__noRender = false; });
  await page.keyboard.press('KeyQ'); await page.waitForTimeout(800);
  const back = await page.evaluate(() => ({ on: __derby.AUTO.on, st: __derby.game.state, menu: !document.getElementById('menu').hidden, last: __derby.PLAYLOG.matches().slice(-1)[0].ended }));
  ok(!back.on && back.st === 'menu' && back.menu, 'a key press returns to the menu ' + JSON.stringify(back));
  // the report
  await page.click('#btnApReport2'); await page.waitForTimeout(500);
  const rep = await page.evaluate(() => ({ vis: !document.getElementById('apReport').hidden, rows: document.querySelectorAll('#apBody tr').length, sum: document.getElementById('apSum').textContent }));
  ok(rep.vis && rep.rows > 5, `report renders (${rep.rows} rows): ${rep.sum}`);
  await page.click('#apClose', { timeout: 60000 });
  // the meter in the Performance panel
  await page.setViewportSize({ width: 1100, height: 760 }); await page.waitForTimeout(800);
  await page.evaluate(() => { document.getElementById('btnGear').click(); document.getElementById('btnPerf').click(); }); await page.waitForTimeout(2500);
  const meter = await page.evaluate(() => document.getElementById('plMeter').textContent); console.log('meter:', meter);
  ok(/^Play log: .* · \d+ match(es)? since .* · build/.test(meter), 'meter shows in the Performance panel');
  await page.evaluate(() => { window.__noRender = true; }); await page.waitForTimeout(300);
  await page.locator('#perfdlg').screenshot({ path: __dirname + '/playlog-meter.png', timeout: 180000 }).catch((e) => ok(false, 'screenshot ' + e.message.split('\n')[0]));
  await page.evaluate(() => { window.__noRender = false; document.getElementById('pfClose').click(); });
  // the menu button starts it, a tap stops it
  await page.click('#btnAutoplay'); await page.waitForTimeout(1500);
  const b2 = await page.evaluate(() => ({ on: __derby.AUTO.on, st: __derby.game.state }));
  ok(b2.on && b2.st === 'playing', 'menu button starts autoplay');
  await page.mouse.click(300, 300); await page.waitForTimeout(600);
  ok(await page.evaluate(() => !__derby.AUTO.on && __derby.game.state === 'menu'), 'a tap stops it');
  const errs = errors.filter((e) => !e.includes('ERR_FAILED') && !/^warning/.test(e));
  ok(errs.length === 0, 'no page errors ' + JSON.stringify(errs.slice(0, 5)));
  console.log(fails.length ? `FAILED ${fails.length}` : 'ALL PASS'); process.exitCode = fails.length ? 1 : 0;
  await browser.close();
})().catch((e) => { console.log('CRASH', e); process.exit(1); });
