// Rejoin regression: a guest that reloads / closes and reopens the link / reloads twice / reloads while wrecked /
// reloads after a host migration must get its OWN car back and drive it; the host must show exactly one car for it.
const { rig, drives } = require('./mp1-common');
(async () => {
  const { browser, errs, mk } = await rig(); const R = {}; const N = 25000;
  const H = await mk('Dad'); await H.evaluate(() => { __derby.S.damage = 0; }); await H.click('#btnHost'); await H.waitForTimeout(1200);
  const link = await H.inputValue('#mpLink'), url = 'http://game.local/' + link.slice(link.indexOf('?'));
  const G1 = await mk('Kid1'), G2 = await mk('Kid2');
  for (const p of [G1, G2]) { await p.goto(url); await p.waitForFunction(() => window.__derby && __derby.MP.role === 'guest', null, { timeout: 40000 }); await p.fill('#mpNick', p.nick); await p.evaluate(() => { __derby.S.gfx = 0; __derby.MP.sendWant(); }); }
  await H.waitForTimeout(1500); await H.click('#btnStart'); await G1.waitForTimeout(5000);
  const did1 = await G1.evaluate(() => localStorage.getItem('derby-did')), type1 = await G1.evaluate(() => __derby.player.type);
  const stage = async (p, fn, to) => { const t0 = Date.now(); await p.waitForFunction(fn, null, { timeout: to }).catch(() => {}); return (Date.now() - t0) / 1000; };
  const hostView = (host, did) => host.evaluate((did) => { const mine = __derby.cars.filter((c) => c.did === did), gs = __derby.MP.players().filter((g) => g.presence.did === did);
    return { carsForPlayer: mine.length, ownedByNewest: mine.length === 1 && gs.length === 1 && mine[0].remote === gs[0].peer, total: __derby.cars.length, type: mine[0] && mine[0].type }; }, did);
  const back = async (name, p, host, fn, opts = {}) => { const t0 = Date.now(); await fn();
    const tLoad = await stage(p, () => !!window.__derby, 120000), tGuest = await stage(p, () => window.__derby && __derby.MP.role === 'guest', 60000);
    const trace = []; const tc0 = Date.now(); let tCar = null;
    while (Date.now() - tc0 < N) { const st = await p.evaluate(() => { const M = __derby.MP; return [M.role, !!(__derby.player && __derby.player.isPlayer), __derby.game.state, __derby.cars.length, !!M.builtRk, M.snaps.length > 0].join(','); }).catch(() => 'eval-failed');
      if (!trace.length || trace[trace.length - 1][1] !== st) trace.push([(Date.now() - tc0) / 1000, st]);
      if (st.startsWith('guest,true,playing')) { tCar = (Date.now() - tc0) / 1000; break; } await p.waitForTimeout(200); }
    const s = (Date.now() - t0) / 1000; if (opts.wrecked) await p.waitForFunction(() => __derby.player && __derby.player.isPlayer && !__derby.player.wrecked, null, { timeout: 20000 }).catch(() => {});
    await p.waitForTimeout(1500);
    const g = await p.evaluate(() => ({ isPlayer: !!(__derby.player && __derby.player.isPlayer), type: __derby.player && __derby.player.type, wrecked: __derby.player && __derby.player.wrecked, n: __derby.cars.length, sheet: !document.getElementById('rsheet').hidden }));
    const did = await p.evaluate(() => localStorage.getItem('derby-did'));
    const h = await hostView(host, did), d = g.isPlayer ? await drives(p, host, did) : { moved: 0 };
    R[name] = { backInS: s, stages: { pageLoad: tLoad, connected: tGuest, ownCar: tCar, trace }, guest: g, host: h, drove: d, ok: g.isPlayer && h.carsForPlayer === 1 && h.ownedByNewest && d.moved > 2 && d.hostThrottle > 0.5 && (opts.anyType || g.type === (opts.type || type1)) }; console.error('#', name, JSON.stringify(R[name])); };
  await back('reload', G1, H, () => G1.reload());
  await back('twoQuickReloads', G1, H, async () => { await G1.reload(); await G1.waitForTimeout(1500); await G1.reload(); });
  await back('closeAndReopenLink', G1, H, async () => { await G1.goto('about:blank'); await G1.waitForTimeout(3000); await G1.goto(url); });
  // wrecked, respawn sheet open, then reload
  await H.evaluate((did) => __derby.cars.find((c) => c.did === did).wreck(), did1); await G1.waitForFunction(() => __derby.player.wrecked, null, { timeout: 10000 }).catch(() => {}); await G1.waitForTimeout(600);
  R.sheetBeforeReload = await G1.evaluate(() => !document.getElementById('rsheet').hidden);
  await back('reloadWhileWrecked', G1, H, () => G1.reload(), { wrecked: true });
  // host migration, then the guest reloads on the new host
  await G1.waitForFunction(() => __derby.MP.room.peers().filter((x) => !x.sameTab).length >= 2, null, { timeout: 30000 }).catch(() => {});
  await G2.waitForFunction(() => __derby.MP.room.peers().filter((x) => !x.sameTab).length >= 2, null, { timeout: 30000 }).catch(() => {});
  await H.close();
  const who = await Promise.any([G1, G2].map((p, i) => p.waitForFunction(() => window.__derby && __derby.MP.role === 'host', null, { timeout: 40000 }).then(() => i)));
  R.newHost = who ? 'Kid2' : 'Kid1';
  const NH = who ? G2 : G1, OG = who ? G1 : G2;
  await OG.waitForFunction(() => __derby.MP.role === 'guest' && __derby.MP.snaps.length > 3 && __derby.player.isPlayer, null, { timeout: 30000 }).catch(() => {});
  if (OG === G1) await back('reloadAfterMigration', G1, NH, () => G1.reload());
  else { const t2 = await G2.evaluate(() => __derby.player.type); await back('reloadAfterMigration', G2, NH, () => G2.reload(), { type: t2 }); } // Kid1 is the host now: Kid2 reloads instead
  R.allOk = ['reload', 'twoQuickReloads', 'closeAndReopenLink', 'reloadWhileWrecked', 'reloadAfterMigration'].every((k) => R[k] && R[k].ok);
  R.errs = errs.filter((e) => !e.includes('eval at predicate')); R.pass = R.allOk && !R.errs.length; // (filtered: a test-side wait that ran while the page was reloading)
  console.log(JSON.stringify(R, null, 1)); await browser.close();
})();
