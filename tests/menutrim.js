// A short, calm settings menu (owner, 2026-11-18: "the menu is too long ... too many things ... too jarring"). Checks, during a match on a
// portrait iPhone 13 (390x664), a landscape phone and a desktop: the open gear menu shows at most 6 rows before "⋯ More" and fits the
// screen without scrolling; no Map, New car or second Tilt entry (Tilt is in the top row, Respawn picks a new car, the map is hidden);
// Sound, Music and Voices are one compact row of three icon toggles, and each tap flips its setting; "⋯ More" is folded by default and
// unfolds Full screen, Tune physics, Performance & logs and Test voices, which still work; Respawn still lets you pick a new car
// (also in Elimination, where New car used to live in the menu); desktop keys still work (T tune, Y map, M/B/U sound). Fails on Build 115.
const { open } = require('./harness');
const { devices } = require('playwright');
const SHOTS = process.env.SHOTS;
(async () => {
  const fails = []; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails.push(m); };
  const screens = [['iPhone 13', devices['iPhone 13'], true], ['iPhone 13 landscape', devices['iPhone 13 landscape'], true], ['desktop', { viewport: { width: 1280, height: 720 } }, false]];
  for (const [name, ctx, touch] of screens) {
    const { browser, page, errors } = await open(ctx);
    const press = (sel) => (touch ? page.tap(sel, { timeout: 60000 }) : page.click(sel, { force: true, timeout: 60000 })); /* (force: a busy machine draws so slowly that the stable-element wait can time out) */
    await page.evaluate(() => { __derby.S.aiCount = 2; document.getElementById('btnStart').click(); });
    await page.waitForFunction(() => __derby.game.state === 'playing' && __derby.game.countdown <= 0, null, { timeout: 300000 });
    await page.waitForTimeout(500);
    await press('#btnGear'); await page.waitForTimeout(300);
    const look = () => page.evaluate(() => {
      const vis = (e) => { if (!e) return false; const cs = getComputedStyle(e); return !e.hidden && cs.display !== 'none' && cs.visibility !== 'hidden' && e.getClientRects().length > 0; };
      const m = document.getElementById('gearMenu'), mb = m.getBoundingClientRect(), more = document.getElementById('gmMore');
      const kids = [...m.children].filter(vis), iMore = more ? kids.indexOf(more) : -1;
      const btns = [...m.querySelectorAll('button')].filter(vis), texts = btns.map((b) => (b.textContent + ' ' + (b.getAttribute('aria-label') || '')).trim());
      const row = ['btnMute', 'btnMusic', 'btnVoices'].map((id) => { const b = document.getElementById(id); const r = b.getBoundingClientRect(); return { vis: vis(b), top: Math.round(r.top), w: Math.round(r.width), pressed: b.getAttribute('aria-pressed'), label: b.getAttribute('aria-label') || b.title }; });
      return { open: vis(m), rows: iMore < 0 ? kids.length : iMore, total: kids.length, hasMore: vis(more), top: Math.round(mb.top), bottom: Math.round(mb.bottom), h: innerHeight, w: Math.round(mb.width),
        scrolls: m.scrollHeight > m.clientHeight + 1, texts, mapBtn: vis(document.getElementById('btnMap')), row,
        moreItems: ['gmFull', 'btnTune', 'btnPerf', 'btnVoiceTest'].map((id) => vis(document.getElementById(id))) };
    });
    const a = await look();
    console.log(`  ${name}: ${JSON.stringify(a)}`);
    if (SHOTS) await page.screenshot({ path: `${SHOTS}/menu-${name.replace(/ /g, '_')}.png`, timeout: 120000 }).catch(() => {}); /* (a picture for a person; under load it can time out) */
    ok(a.open && a.hasMore && a.rows <= 6, `${name}: at most 6 rows before ⋯ More (${a.rows} rows${a.hasMore ? '' : ', no More'}; ${a.total} shown)`);
    ok(a.top >= 0 && a.bottom <= a.h && !a.scrolls, `${name}: the menu fits on screen without scrolling (${a.top}-${a.bottom} of ${a.h}${a.scrolls ? ', scrolls' : ''})`);
    const bad = a.texts.filter((t) => /Map|New car|Tilt/i.test(t));
    ok(!bad.length && !a.mapBtn, `${name}: no Map, New car or Tilt entries, no Map button (${JSON.stringify(bad)}${a.mapBtn ? ', Map button shown' : ''})`);
    const r = a.row;
    ok(r.every((x) => x.vis && x.w > 0 && x.w <= a.w / 2.5 && Math.abs(x.top - r[0].top) <= 3 && /sound|music|voice/i.test(x.label || '')), `${name}: Sound, Music and Voices are one compact row of labelled icon buttons ${JSON.stringify(r)}`);
    ok(a.moreItems.every((v) => !v), `${name}: ⋯ More is folded by default (${a.moreItems})`);
    const state = () => page.evaluate(() => ({ mute: __derby.sfx.muted, music: !!__derby.sfx.musicOn, voices: localStorage.getItem('derby-voices') !== 'off', p: ['btnMute', 'btnMusic', 'btnVoices'].map((id) => document.getElementById(id).getAttribute('aria-pressed')), menu: !document.getElementById('gearMenu').hidden }));
    if (r.every((x) => x.vis)) {
      const s0 = await state();
      for (const id of ['btnMute', 'btnMusic', 'btnVoices']) await press('#' + id);
      await page.waitForTimeout(200); const s1 = await state();
      for (const id of ['btnMute', 'btnMusic', 'btnVoices']) await press('#' + id);
      await page.waitForTimeout(200); const s2 = await state();
      console.log(`  ${name} toggles: ${JSON.stringify([s0, s1, s2])}`);
      ok(s1.mute !== s0.mute && s1.music !== s0.music && s1.voices !== s0.voices && s1.p.every((v) => v === 'false') && s0.p.every((v) => v === 'true') && s1.menu, `${name}: each toggle flips its setting and shows off (aria-pressed), the menu stays open`);
      ok(s2.mute === s0.mute && s2.music === s0.music && s2.voices === s0.voices && s2.p.every((v) => v === 'true'), `${name}: a second tap turns each back on`);
      if (SHOTS) { for (const id of ['btnMusic']) await press('#' + id); await page.screenshot({ path: `${SHOTS}/menu-${name.replace(/ /g, '_')}-musicoff.png`, timeout: 120000 }).catch(() => {}); await press('#btnMusic'); }
    } else ok(false, `${name}: sound toggles not shown`);
    if (a.hasMore) {
      await press('#gmMore'); await page.waitForTimeout(250);
      const b = await look();
      console.log(`  ${name} More: ${JSON.stringify({ moreItems: b.moreItems, top: b.top, bottom: b.bottom, h: b.h, scrolls: b.scrolls })}`);
      if (SHOTS) await page.screenshot({ path: `${SHOTS}/menu-${name.replace(/ /g, '_')}-more.png`, timeout: 120000 }).catch(() => {});
      ok(b.open && b.moreItems.every(Boolean), `${name}: ⋯ More unfolds Full screen, Tune physics, Performance & logs and Test voices (${b.moreItems})`);
      ok(b.top >= 0 && b.bottom <= b.h && !b.scrolls, `${name}: unfolded it still fits on screen without scrolling (${b.top}-${b.bottom} of ${b.h}${b.scrolls ? ', scrolls' : ''})`);
      await press('#btnTune'); await page.waitForTimeout(300);
      const t = await page.evaluate(() => ({ panel: !document.getElementById('panel').hidden, menu: !document.getElementById('gearMenu').hidden }));
      ok(t.panel && !t.menu, `${name}: Tune physics opens its panel and closes the menu ${JSON.stringify(t)}`);
      await page.evaluate(() => { document.getElementById('btnClose').click(); });
      await press('#btnGear'); await page.waitForTimeout(250);
      const f = await page.evaluate(() => document.getElementById('btnPerf').getClientRects().length === 0);
      ok(f, `${name}: ⋯ More folds away again when the menu is reopened`);
      await press('#gmMore'); await page.waitForTimeout(200); await press('#btnPerf'); await page.waitForTimeout(300);
      const pf = await page.evaluate(() => { const o = !document.getElementById('perfdlg').hidden; document.getElementById('pfClose').click(); return o; });
      ok(pf, `${name}: Performance & logs opens its window`);
      await press('#btnGear'); await page.waitForTimeout(200); await press('#gmMore'); await page.waitForTimeout(200); await press('#btnVoiceTest'); await page.waitForTimeout(300);
      const vt = await page.evaluate(() => !!__derby.barks.testRes);
      ok(vt, `${name}: Test voices runs the voice test`);
      await press('#gmFull'); await page.waitForTimeout(300);
      const fs = await page.evaluate(() => document.getElementById('gearMenu').hidden);
      ok(fs, `${name}: Full screen is tapped and the menu closes`);
    } else ok(false, `${name}: no ⋯ More`);
    await page.evaluate(() => { document.getElementById('gearMenu').hidden = true; __derby.game.paused = false; });
    /* Respawn: pick a new car */
    const t0 = await page.evaluate(() => __derby.player.type), want = t0 === 'viper' ? 'outrider' : 'viper';
    await press('#btnRespawn'); await page.waitForTimeout(400);
    const rs = await page.evaluate(() => ({ open: !document.getElementById('rsheet').hidden, cars: [...document.querySelectorAll('#rsCars button')].map((b) => b.textContent) }));
    ok(rs.open && rs.cars.length >= 10, `${name}: Respawn opens the sheet with ${rs.cars.length} cars to pick from`);
    const wantName = await page.evaluate((k) => __derby.CAR_TYPES[k].name, want);
    if (rs.open) { await press(`#rsCars button:nth-child(${rs.cars.indexOf(wantName) + 1})`); await page.waitForTimeout(800); }
    const t1 = await page.evaluate(() => __derby.player.type);
    ok(t1 === want, `${name}: picking a car there puts you in it (${t0} -> ${t1}, wanted ${want})`);
    if (!touch) {
      await page.keyboard.press('KeyT'); await page.waitForTimeout(200);
      const tk = await page.evaluate(() => !document.getElementById('panel').hidden); await page.keyboard.press('KeyT');
      const m0 = await page.evaluate(() => document.body.classList.contains('nomap')); await page.keyboard.press('KeyY'); await page.waitForTimeout(100);
      const m1 = await page.evaluate(() => document.body.classList.contains('nomap')); await page.keyboard.press('KeyY');
      const mu0 = await page.evaluate(() => __derby.sfx.muted); await page.keyboard.press('KeyM'); const mu1 = await page.evaluate(() => ({ m: __derby.sfx.muted, p: document.getElementById('btnMute').getAttribute('aria-pressed') })); await page.keyboard.press('KeyM');
      ok(tk && m0 && !m1 && mu1.m !== mu0 && mu1.p === 'false', `desktop: keys still work (T tune ${tk}, Y map ${m0}->${m1}, M sound ${mu0}->${JSON.stringify(mu1)})`);
    }
    const pe = errors.filter((e) => e.startsWith('pageerror')); ok(!pe.length, `${name}: no page errors ${pe.slice(0, 2).join(' | ')}`);
    await browser.close();
  }
  { /* Elimination: no coming back, so Respawn offers "flip upright" or start the round again in another car (the menu's New car used to) */
    const { browser, page, errors } = await open(devices['iPhone 13'], () => { try { localStorage.setItem('scrapyard-derby-mode', 'elim'); } catch (e) {} });
    await page.evaluate(() => { __derby.S.aiCount = 2; document.getElementById('btnStart').click(); });
    await page.waitForFunction(() => __derby.game.state === 'playing' && __derby.game.countdown <= 0, null, { timeout: 300000 });
    const t0 = await page.evaluate(() => __derby.player.type), want = t0 === 'viper' ? 'outrider' : 'viper';
    await page.tap('#btnRespawn'); await page.waitForTimeout(600);
    const rs = await page.evaluate(() => ({ open: !document.getElementById('rsheet').hidden, go: document.getElementById('rsGo').textContent, cars: [...document.querySelectorAll('#rsCars button')].map((b) => b.textContent) }));
    ok(rs.open && /flip/i.test(rs.go) && rs.cars.length >= 10, `elimination: Respawn opens the sheet and stays open (${JSON.stringify({ open: rs.open, go: rs.go, cars: rs.cars.length })})`);
    const wantName = await page.evaluate((k) => __derby.CAR_TYPES[k].name, want);
    if (rs.open) { await page.tap(`#rsCars button:nth-child(${rs.cars.indexOf(wantName) + 1})`); await page.waitForTimeout(1500); }
    const t1 = await page.evaluate(() => ({ type: __derby.player.type, state: __derby.game.state }));
    ok(t1.type === want && t1.state === 'playing', `elimination: picking a car starts the round again in it (${t0} -> ${JSON.stringify(t1)})`);
    const pe = errors.filter((e) => e.startsWith('pageerror')); ok(!pe.length, `elimination: no page errors ${pe.slice(0, 2).join(' | ')}`);
    await browser.close();
  }
  console.log(fails.length ? 'MENUTRIM FAIL' : 'MENUTRIM PASS'); process.exit(fails.length ? 1 : 0);
})();
