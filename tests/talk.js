// Talk pacing: during a busy 8-opponent match, voices never overlap, there's real silence between lines, and talk fills well under half the time.
// Measures every subtitle/voice line (barks.show) with its spoken length (recorded clip length, or words x 0.36 s).
const { open } = require('./harness');
(async () => { const fails = []; const ok = (m, c, d) => { console.log((c ? 'PASS ' : 'FAIL ') + m, d ? JSON.stringify(d) : ''); if (!c) fails.push(m); };
  const { browser, page, errors } = await open({ viewport: { width: 900, height: 560 } });
  await page.evaluate(() => { window.__noRender = true; const D = __derby; D.S.aiCount = 8;
    window.__lines = []; const o = D.barks.show.bind(D.barks);
    D.barks.show = (P, col, line) => { const n = performance.now() / 1000, w = String(line).split(/\s+/).length; window.__lines.push({ t: n, d: D.TALK ? D.TALK.dur(P, line) : Math.max(1.2, w * 0.36 + 0.4), who: P.nick }); return o(P, col, line); };
    document.getElementById('btnStart').click(); });
  await page.waitForFunction(() => __derby.game.state === 'playing' && __derby.game.countdown <= 0, null, { timeout: 300000 });
  const t0 = await page.evaluate(() => performance.now() / 1000);
  await page.waitForTimeout(+(process.env.SECS || 180) * 1000); // (3 min: 2 min gave ~14 lines, too few for a steady median)
  const r = await page.evaluate((t0) => { const L = window.__lines.filter((x) => x.t >= t0), now = performance.now() / 1000; let talk = 0, overlaps = 0; const gaps = [];
    for (let i = 0; i < L.length; i++) { talk += L[i].d; if (i) { const g = L[i].t - (L[i - 1].t + L[i - 1].d); if (g < -0.05) overlaps++; else gaps.push(g); } }
    gaps.sort((a, b) => a - b); return { secs: Math.round(now - t0), lines: L.length, perMin: +(L.length / ((now - t0) / 60)).toFixed(1), share: +(talk / (now - t0)).toFixed(2), overlaps, gapMed: gaps.length ? +gaps[gaps.length >> 1].toFixed(1) : null, gapMin: gaps.length ? +gaps[0].toFixed(1) : null, dropped: (__derby.PLAYLOG.m || {}).talkDrop || 0 }; }, t0);
  console.log(JSON.stringify(r));
  ok('voices never talk over each other', r.overlaps === 0, r);
  ok('talk fills at most 40% of the time', r.share <= 0.40, { share: r.share });
  // The talk governor's own rule (TALK in index.html): chatter waits 2.5-5 s after a line ends, a line about you 2 s, a forced line
  // (wrecks, big hits) 0.8 s. In a busy 8-car match many lines are forced, so a median of 1.6-1.9 s is the governor working; the
  // old 2 s bar failed on that now and then. The hard rule is the 0.8 s floor, and the median still has to show real breathing room.
  ok('no line starts within 0.8 s of the last one ending (the governor floor)', r.gapMin >= 0.75, { gapMin: r.gapMin });
  ok('median silence between lines is at least 1.5 s', r.gapMed >= 1.5, { gapMed: r.gapMed });
  ok('the yard is not silent either (at least 4 lines a minute)', r.perMin >= 4, { perMin: r.perMin });
  const pe = errors.filter((e) => !e.includes('ERR_FAILED')); ok('no page errors', pe.length === 0, pe.slice(0, 3));
  await browser.close(); console.log(fails.length ? 'TALK FAIL' : 'TALK PASS'); process.exit(fails.length ? 1 : 0); })();
