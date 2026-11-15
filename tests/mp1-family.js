// Family yard: 3 arrive in sequence -> one game; round runs; a guest reloads -> back in its car; the host closes ->
// a guest takes over, the other follows; a newcomer after the take-over finds the new host.
const { rig, drives } = require('./mp1-common');
(async () => {
  const { browser, errs, mk, view } = await rig(); const R = {}; const T0 = Date.now(); const t = () => ((Date.now() - T0) / 1000).toFixed(1);
  const A = await mk('Dad'), B = await mk('Kid1'), C = await mk('Kid2');
  await A.click('#btnFamily'); await A.waitForFunction(() => __derby.MP.role === 'host', null, { timeout: 20000 }); R.aHostAt = t();
  await B.click('#btnFamily'); await B.waitForFunction(() => __derby.MP.role === 'guest', null, { timeout: 40000 }); R.bGuestAt = t();
  await C.click('#btnFamily'); await C.waitForFunction(() => __derby.MP.role === 'guest', null, { timeout: 40000 }); R.cGuestAt = t();
  await C.waitForFunction(() => __derby.MP.room.peers().filter((x) => !x.sameTab).length >= 2, null, { timeout: 30000 }).catch(() => {});
  R.lobby = { A: await view(A), B: await view(B), C: await view(C) };
  await A.click('#btnStart'); await B.waitForTimeout(5000);
  R.playing = { B: await view(B), C: await view(C) };
  const cType = await C.evaluate(() => __derby.player.type);
  // ---- a guest reloads mid-round: lands back in, in its own car ----
  await C.reload(); await C.waitForFunction(() => window.__derby && __derby.MP.transport === 'peer');
  await C.waitForFunction(() => __derby.MP.role === 'guest' && __derby.player && __derby.player.isPlayer && __derby.game.state === 'playing', null, { timeout: 45000 }).catch(() => {});
  R.afterReload = { C: await view(C), sameCar: (await C.evaluate(() => __derby.player && __derby.player.type)) === cType, carsOnHost: await A.evaluate(() => __derby.cars.length), at: t() };
  R.reloadDrives = (await drives(C, A, await C.evaluate(() => localStorage.getItem('derby-did')))).moved; // measured on the host: Kid2's inputs move Kid2's car there
  await C.waitForFunction(() => __derby.MP.room.peers().filter((x) => !x.sameTab).length >= 2, null, { timeout: 30000 }).catch(() => {});
  // ---- the host closes ----
  await A.close(); const t1 = Date.now();
  const who = await Promise.any([B, C].map((p, i) => p.waitForFunction(() => window.__derby && __derby.MP.role === 'host', null, { timeout: 40000 }).then(() => i)));
  const nh = [B, C][who], other = [B, C][1 - who]; R.takeoverS = (Date.now() - t1) / 1000; R.newHost = nh.nick;
  await other.waitForFunction((n) => __derby.MP.role === 'guest' && (__derby.MP.hostPresence() || {}).nick === n && __derby.MP.snaps.length > 3, nh.nick, { timeout: 30000 }).catch(() => {});
  await other.waitForTimeout(2000);
  R.afterTakeover = { newHost: await view(nh), other: await view(other) };
  // ---- a newcomer after the take-over finds the new host ----
  const D = await mk('Mum'); await D.click('#btnFamily');
  await D.waitForFunction(() => __derby.MP.role !== 'solo', null, { timeout: 40000 }).catch(() => {});
  await D.waitForFunction(() => __derby.player && __derby.player.isPlayer && __derby.game.state === 'playing', null, { timeout: 30000 }).catch(() => {});
  await D.waitForTimeout(2000);
  // (on a slow box the stand-in host can itself be judged too slow and hand on again: what counts is that all three end up in ONE game)
  const fin = [nh, other, D], fv = []; for (const p of fin) fv.push(await view(p));
  R.final = Object.fromEntries(fin.map((p, i) => [p.nick, fv[i]])); R.newcomer = fv[2];
  const hosts = fv.filter((v) => v.role === 'host'), curHost = hosts.length === 1 ? fin[fv.indexOf(hosts[0])] : nh; R.finalHost = curHost.nick;
  R.oneGame = hosts.length === 1 && fv.every((v) => v.fam && v.host === curHost.nick);
  R.oneCarEach = await curHost.evaluate(() => { const M = __derby.MP, dids = [...new Set(M.players().map((g) => g.presence.did))];
    return { players: dids.length, perPlayer: dids.map((d) => __derby.cars.filter((c) => c.did === d).length), humanCars: __derby.cars.filter((c) => c.remote || c.isPlayer).length }; });
  R.logs = {}; for (const p of [nh, other, D]) R.logs[p.nick] = await p.evaluate(() => __derby.NETLOG.inc.map((e) => ((e.t || 0) / 1000).toFixed(0) + ' ' + e.who + ': ' + e.what).slice(-14)).catch(() => []);
  R.errs = errs;
  const L = R.lobby, one = (v, host) => v.fam && v.host === host;
  R.checks = {
    threeInOneGame: L.A.role === 'host' && L.B.role === 'guest' && L.C.role === 'guest' && one(L.B, 'Dad') && one(L.C, 'Dad') && L.A.peers.length === 2,
    whoShown: /Kid1/.test(L.A.who) && /Kid2/.test(L.A.who) && /Dad/.test(L.C.who),
    reloadBackInOwnCar: R.afterReload.C.role === 'guest' && !!R.afterReload.C.me && R.afterReload.sameCar && R.reloadDrives > 2,
    takeoverOthersFollow: R.afterTakeover.newHost.role === 'host' && R.afterTakeover.other.role === 'guest' && R.afterTakeover.other.host === R.newHost,
    newcomerJoinsTheOneGame: R.oneGame && R.newcomer.role === 'guest' && !!R.newcomer.me,
    hostOneCarPerPlayer: R.oneCarEach.players === 2 && R.oneCarEach.perPlayer.every((n) => n === 1) && R.oneCarEach.humanCars === 3,
    noErrors: !errs.length };
  R.pass = Object.values(R.checks).every(Boolean);
  console.log(JSON.stringify(R, null, 1)); await browser.close();
})();
