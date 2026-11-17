// Phone HUD tidy-up (owner, 2026-11-17): "the buttons above the harpoon ... should be more aligned on the right side"; the score card
// "shouldn't show score and wrecked, but could have an arrow down ... to expand it"; "we don't need a special pause button, but if you
// open settings, it just pauses naturally". Checks, on a portrait iPhone and a landscape phone during a match: the small action buttons'
// right edges line up with the FIRE button's; the score card is short (score and wrecks folded away) and ▾ unfolds them; hull and
// weapon show a percent; no Pause button; the settings button is visible and not covered; opening settings pauses a solo match and
// closing resumes it. Fails on Build 111.
const { open } = require('./harness');
const { devices } = require('playwright');
const SHOTS = process.env.SHOTS;
(async () => {
  const fails = []; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails.push(m); };
  for (const [name, ctx] of [['iPhone 13', devices['iPhone 13']], ['iPhone 13 landscape', devices['iPhone 13 landscape']], ['small phone', { viewport: { width: 360, height: 640 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 }]]) {
    const { browser, page, errors } = await open(ctx);
    await page.evaluate(() => { __derby.S.aiCount = 3; document.getElementById('btnStart').click(); });
    await page.waitForFunction(() => __derby.game.state === 'playing' && __derby.game.countdown <= 0, null, { timeout: 120000 });
    await page.evaluate(() => __derby.respawnCar(__derby.player, 'outrider')); await page.waitForTimeout(700);
    const r = await page.evaluate(() => {
      const vis = (e) => { if (!e) return false; const cs = getComputedStyle(e); return !e.hidden && cs.display !== 'none' && cs.visibility !== 'hidden' && e.getClientRects().length > 0; };
      const bx = (e) => { const b = e.getBoundingClientRect(); return [Math.round(b.left), Math.round(b.top), Math.round(b.right), Math.round(b.bottom)]; };
      const fire = document.querySelector('#touch .tb.fire'), smalls = [...document.querySelectorAll('#touch .rightpad .small .tb:not(.fire)')].filter(vis);
      const st = document.querySelector('.stats'), g = document.getElementById('btnGear'), gb = bx(g), top = document.elementFromPoint((gb[0] + gb[2]) / 2, (gb[1] + gb[3]) / 2);
      return { fire: bx(fire), smallRights: smalls.map((e) => bx(e)[2]), column: getComputedStyle(document.querySelector('#touch .rightpad .small')).flexDirection,
        stats: bx(st), score: vis(document.getElementById('score')), hp: document.getElementById('hpText').textContent, gunPct: vis(document.getElementById('gunPct')) ? document.getElementById('gunPct').textContent : null,
        pause: vis(document.getElementById('btnPause')), gear: vis(g) && !!top && (top === g || g.contains(top)), gearBox: gb, more: vis(document.getElementById('statsMore')), h: innerHeight };
    });
    console.log(`  ${name}: ${JSON.stringify(r)}`);
    if (r.column === 'column') ok(r.smallRights.length >= 3 && r.smallRights.every((x) => Math.abs(x - r.fire[2]) <= 2), `${name}: small buttons line up on the right edge with FIRE (rights ${r.smallRights} vs FIRE ${r.fire[2]})`);
    ok(!r.score && r.more, `${name}: score and wrecks folded away, ▾ shown`);
    ok(r.stats[3] - r.stats[1] <= 56, `${name}: the score card is short (${r.stats[3] - r.stats[1]} px tall)`);
    ok(/%$/.test(r.hp) && /^\d+%$/.test(r.gunPct || ''), `${name}: hull and weapon as percents (${r.hp}, ${r.gunPct})`);
    ok(!r.pause, `${name}: no Pause button`);
    ok(r.gear, `${name}: the settings button is visible and nothing covers it (${r.gearBox})`);
    if (SHOTS) await page.screenshot({ path: `${SHOTS}/hud-${name.replace(/ /g, '_')}.png` }).catch(() => {}); /* (a picture for a person; under load it can time out) */
    await page.tap('#statsMore'); await page.waitForTimeout(200);
    const u = await page.evaluate(() => { const e = document.getElementById('score'); return getComputedStyle(e).display !== 'none' && e.getClientRects().length > 0; });
    ok(u, `${name}: ▾ unfolds the score and wrecks`);
    if (SHOTS) await page.screenshot({ path: `${SHOTS}/hud-${name.replace(/ /g, '_')}-open.png` }).catch(() => {}); /* (a picture for a person; under load it can time out) */
    await page.tap('#statsMore'); await page.waitForTimeout(200);
    await page.tap('#btnGear'); await page.waitForTimeout(300);
    const p1 = await page.evaluate(() => ({ menu: !document.getElementById('gearMenu').hidden, paused: __derby.game.paused }));
    ok(p1.menu && p1.paused, `${name}: opening settings pauses the match ${JSON.stringify(p1)}`);
    await page.tap('#btnGear'); await page.waitForTimeout(300);
    const p2 = await page.evaluate(() => ({ menu: !document.getElementById('gearMenu').hidden, paused: __derby.game.paused }));
    ok(!p2.menu && !p2.paused, `${name}: closing settings resumes ${JSON.stringify(p2)}`);
    const pe = errors.filter((e) => e.startsWith('pageerror')); ok(!pe.length, `${name}: no page errors ${pe.slice(0, 2).join(' | ')}`);
    await browser.close();
  }
  { const { browser, page } = await open({ viewport: { width: 1280, height: 720 } }); /* desktop: P still pauses, the full card still shows the score */
    await page.evaluate(() => { __derby.S.aiCount = 3; document.getElementById('btnStart').click(); });
    await page.waitForFunction(() => __derby.game.state === 'playing' && __derby.game.countdown <= 0, null, { timeout: 120000 });
    await page.keyboard.press('KeyP'); const d = await page.evaluate(() => ({ paused: __derby.game.paused, score: getComputedStyle(document.getElementById('score')).display !== 'none' }));
    ok(d.paused && d.score, `desktop: P pauses and the score card is unchanged ${JSON.stringify(d)}`); await browser.close(); }
  console.log(fails.length ? 'PHONEHUD FAIL' : 'PHONEHUD PASS'); process.exit(fails.length ? 1 : 0);
})();
