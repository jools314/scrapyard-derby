// 1) frames while the tab is hidden/throttled don't count in the play log, and the log records the environment
// 2) autoplay: a newer build found mid-autoplay -> uploads, reloads at the match boundary into ?autoplay=1, autoplay carries on
const { open } = require('./harness');
(async () => { const fails = []; const ok = (m, c, d) => { console.log((c ? 'PASS ' : 'FAIL ') + m, d ? JSON.stringify(d) : ''); if (!c) fails.push(m); };
  const { browser, page, errors } = await open({ viewport: { width: 900, height: 560 } });
  await page.evaluate(() => { window.__noRender = true; __derby.S.aiCount = 3; document.getElementById('btnStart').click(); });
  await page.waitForFunction(() => __derby.game.countdown <= 0 && __derby.PLAYLOG.m, null, { timeout: 300000 }); await page.waitForTimeout(3000);
  const f0 = await page.evaluate(() => __derby.PLAYLOG.m.frames);
  await page.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => true }); Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' }); document.dispatchEvent(new Event('visibilitychange')); });
  await page.waitForTimeout(3000); const f1 = await page.evaluate(() => __derby.PLAYLOG.m.frames);
  ok('no frames counted while the tab is hidden', f1 - f0 < 5 + 0 * f0, { f0, f1 });
  await page.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => false }); Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'visible' }); document.dispatchEvent(new Event('visibilitychange')); });
  await page.waitForTimeout(1000); const f2 = await page.evaluate(() => __derby.PLAYLOG.m.frames);
  ok('...and not in the 2.5 s grace after it comes back', f2 - f1 < 5, { f1, f2 });
  await page.waitForTimeout(4000); const f3 = await page.evaluate(() => __derby.PLAYLOG.m.frames);
  ok('counted again once it settles', f3 - f2 > 20, { f2, f3 });
  await page.evaluate(() => window.dispatchEvent(new Event('blur'))); await page.waitForTimeout(1500);
  const env = await page.evaluate(() => { __derby.PLAYLOG.ck('test'); const all = Object.keys(localStorage).filter((x) => x.startsWith('derby-pl')).map((x) => localStorage.getItem(x)).join('\n'); return { inLog: /"env":\{"hiddenS"/.test(all), sum: __derby.TABENV.summary() }; });
  ok('play log records the environment (hidden / unfocused / throttled seconds, gaps, battery)', env.inLog && env.sum.hiddenS >= 2 && env.sum.unfocusedS >= 1, env);
  const slow = await page.evaluate(() => { let sent = 0; const P = __derby.PLAYLOG, o = P.slow; P.slow = () => sent++; Object.defineProperty(document, 'hidden', { configurable: true, get: () => true }); document.dispatchEvent(new Event('visibilitychange'));
    __derby.PERFREP.incidents.push({ secs: 2, fps: 10, test: 1 }); const tagged = __derby.PERFREP.incidents[__derby.PERFREP.incidents.length - 1].env; P.slow = o; return { sent, tagged }; });
  ok('a slow moment while throttled is labelled and not logged as a game problem', slow.sent === 0 && /throttl/.test(slow.tagged), slow);
  await browser.close();
  // ---- auto-update during autoplay
  const t = await open({ viewport: { width: 900, height: 560 } }); const p2 = t.page; const navs = [];
  p2.on('framenavigated', (fr) => { if (fr === p2.mainFrame()) navs.push(fr.url()); });
  await p2.evaluate(() => { window.__noRender = true; document.getElementById('btnAutoplay').click(); });
  await p2.waitForFunction(() => __derby.AUTO.on && __derby.game.state === 'playing', null, { timeout: 300000 });
  await p2.evaluate(() => { const U = __derby.UPDATE || window.UPDATE; window.__U = U; });
  const hasU = await p2.evaluate(() => !!window.__U);
  if (!hasU) { ok('UPDATE reachable from the test hook', false); } else {
    await p2.evaluate(() => { __U.newer = '999'; __U.autoUpdate(); }); await p2.waitForTimeout(500);
    await p2.evaluate(() => { __derby.AUTO.pending = true; }); // end of match
    await p2.waitForFunction(() => location.search.includes('autoplay=1') && location.search.includes('v=999'), null, { timeout: 120000 }).catch(() => {});
    await p2.waitForFunction(() => window.__derby && __derby.AUTO && __derby.AUTO.on, null, { timeout: 300000 }).catch(() => {});
    const r = await p2.evaluate(() => ({ url: location.search, auto: !!(window.__derby && __derby.AUTO.on) }));
    ok('autoplay reloads into the new build at the match boundary and carries on', /autoplay=1/.test(r.url) && /v=999/.test(r.url) && r.auto, { ...r, navs: navs.slice(-2) });
  }
  ok('no page errors', [...errors, ...t.errors].filter((e) => !e.includes('ERR_FAILED')).length === 0, [...errors, ...t.errors].filter((e) => !e.includes('ERR_FAILED')).slice(0, 3));
  await t.browser.close(); console.log(fails.length ? 'ENVUPDATE FAIL' : 'ENVUPDATE PASS'); process.exit(fails.length ? 1 : 0); })();
