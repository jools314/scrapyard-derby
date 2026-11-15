// Build 70 regressions (from a real bug report, build 68 on a Mac):
// 1) a car that loses all its wheels is wrecked (it was left stranded on its belly at 20 hp, forever)
// 2) a broken browser speech engine is given up on after 6 failed resets (it was reset 129 times in 20 min)
// 3) a refused upload (HTTP 429) is recorded and backed off, and play logs are batched at most every 10 minutes
// 4) the play log counts how often each voice line is heard (to find repeats)
const { open } = require('./harness');
(async () => { const fails = []; const ok = (m, c, d) => { console.log((c ? 'PASS ' : 'FAIL ') + m, d ? JSON.stringify(d) : ''); if (!c) fails.push(m); };
  const { browser, page, errors } = await open({ viewport: { width: 900, height: 560 } });
  await page.evaluate(() => { window.__noRender = true; __derby.S.aiCount = 3; document.getElementById('btnStart').click(); });
  await page.waitForFunction(() => __derby.game.state === 'playing' && __derby.game.countdown <= 0 && __derby.PLAYLOG.m, null, { timeout: 300000 });
  // 1
  const w = await page.evaluate(async () => { const D = __derby, c = D.cars.find((x) => !x.isPlayer && !x.wrecked && !x.T.noWheelLoss); const hp = c.health;
    for (let i = 0; i < c.nW; i++) c.loseWheel(i, D.player); await new Promise((r) => setTimeout(r, 2500)); return { type: c.type, nW: c.nW, hp, wrecked: !!c.wrecked }; });
  ok('a car with no wheels left is wrecked within seconds', w.wrecked, w);
  const w2 = await page.evaluate(async () => { const D = __derby, c = D.cars.find((x) => !x.isPlayer && !x.wrecked && !x.T.noWheelLoss && x.nW >= 4);
    c.loseWheel(0, null); await new Promise((r) => setTimeout(r, 2000)); return { wrecked: !!c.wrecked }; });
  ok('...but losing one wheel is not a wreck', !w2.wrecked, w2);
  // 2
  const sp = await page.evaluate(() => { const b = __derby.barks; b.speechDead = false; b.failedRecoveries = 5; b.lastSpeakT = -1e9; b.recover('test stuck'); const dead = b.speechDead;
    let called = 0; const ss = window.speechSynthesis, o = ss && ss.speak; if (ss) ss.speak = () => { called++; }; b.speak({ nick: 'Nobody' }, 'hello there', null); if (ss) ss.speak = o; return { dead, called }; });
  ok('after 6 failed resets the broken speech engine is left alone for the session', sp.dead && sp.called === 0, sp);
  // 3
  const up = await page.evaluate(async () => { const of = window.fetch; window.fetch = () => Promise.resolve({ ok: false, status: 429 }); window.__noDrop = false;
    const r = await window.dropUpload('playlog', 'x'); window.fetch = of; const D = __derby; return { r, blocked: window.DROP_BLOCK || null, until: (D.DROP || {}).blockUntil || null }; });
  ok('a refused upload (HTTP 429) is recorded and backs off for an hour', up.r === false && up.until > Date.now() + 50 * 60e3, up);
  const gap = await page.evaluate(async () => { const P = __derby.PLAYLOG, D = __derby.DROP; D.blockUntil = 0; let calls = 0; const o = window.dropUpload; window.dropUpload = () => { calls++; return Promise.resolve(true); };
    P.lastUpT = Date.now(); const r1 = await P.upload('checkpoint'); const r2 = await P.upload('updating to build 999'); window.dropUpload = o; return { r1, calls }; });
  ok('play logs are batched (no routine upload within 10 min of the last), urgent ones still go', gap.r1 === false, gap);
  // 4
  const h = await page.evaluate(async () => { const D = __derby; D.barks.heardLog('Kev', 'Crikey!'); D.barks.heardLog('Kev', 'Crikey!'); D.barks.heardLog('Shazza', 'Strewth'); const r = D.PLAYLOG.rec('ck', 'test'); return r.heard; });
  ok('the match record counts each heard line and the repeats', h && h.n >= 3 && h.repMatch >= 1 && h.top.some((e) => e[0] === 'Kev|Crikey!' && e[1] >= 2) && h.by.Kev, h && { n: h.n, repMatch: h.repMatch, top: h.top.slice(0, 2) });
  const pe = errors.filter((e) => !e.includes('ERR_FAILED')); ok('no page errors', pe.length === 0, pe.slice(0, 3));
  await browser.close(); console.log(fails.length ? 'B70 FAIL' : 'B70 PASS'); process.exit(fails.length ? 1 : 0); })();
