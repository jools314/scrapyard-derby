// Why did autoplay stop? The play log must say. Stubbed screen wake lock (acquired, released by the system and asked again,
// released on tab hidden, denied), page lifecycle events (hidden, freeze, resume, pagehide), a wall-clock jump (a suspend),
// a last-gasp beacon to the drop, and on the next load the record of how each earlier page ended: clean, suspended or vanished.
const { open } = require('./harness');
const init = () => {
  const S = window.__wl = { n: 0, deny: 0, cur: null };
  class Sentinel extends EventTarget { constructor() { super(); this.released = false; this.type = 'screen'; }
    release() { if (!this.released) { this.released = true; this.dispatchEvent(new Event('release')); } return Promise.resolve(); } }
  Object.defineProperty(navigator, 'wakeLock', { configurable: true, value: { request: async () => { S.n++; if (S.deny > 0) { S.deny--; throw new DOMException('denied by test', 'NotAllowedError'); } return (S.cur = new Sentinel()); } } });
  let hid = false; Object.defineProperty(document, 'hidden', { configurable: true, get: () => hid }); Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => (hid ? 'hidden' : 'visible') });
  window.__setHidden = (h) => { hid = h; if (h && S.cur && !S.cur.released) S.cur.release(); document.dispatchEvent(new Event('visibilitychange')); }; // (the browser takes the wake lock back when the tab hides)
  const rd = () => { try { return JSON.parse(localStorage.getItem('__beacons') || '[]'); } catch (e) { return []; } };
  navigator.sendBeacon = (url, data) => { const L = rd(), i = L.length; L.push({ url }); localStorage.setItem('__beacons', JSON.stringify(L)); new Response(data).text().then((t) => { const L2 = rd(); if (L2[i]) { L2[i].body = t; localStorage.setItem('__beacons', JSON.stringify(L2)); } }); return true; };
  window.__ups = []; window.dropUpload = (kind, text) => { window.__ups.push(text); return Promise.resolve(true); };
};
(async () => {
  const fails = []; const ok = (m, c, d) => { console.log((c ? 'PASS ' : 'FAIL ') + m, d !== undefined ? JSON.stringify(d).slice(0, 400) : ''); if (!c) fails.push(m); };
  const { browser, page, errors } = await open({ viewport: { width: 900, height: 560 } }, init);
  const W = (ms) => page.waitForTimeout(ms);
  await page.evaluate(() => { for (const k of Object.keys(localStorage)) if (k.startsWith('derby-pl') || k === '__beacons') localStorage.removeItem(k); });
  await page.reload({ timeout: 180000 }); await page.waitForFunction(() => window.__derby, null, { timeout: 180000 });
  await page.evaluate(() => { localStorage.removeItem('__beacons'); for (const k of Object.keys(localStorage)) if (k.startsWith('derby-pl-life-') && k !== 'derby-pl-life-' + __derby.PLAYLOG.sid) localStorage.removeItem(k); });
  ok('LIFE (page lifecycle note) exists', await page.evaluate(() => !!(window.__derby.LIFE && __derby.LIFE.n)));
  await page.evaluate(() => { if (!__derby.LIFE) __derby.LIFE = { n: {}, evs: [], state: () => ({}) }; }); // (an older build: an empty stand-in, so every check below runs and says what is missing)
  const sid1 = await page.evaluate(() => __derby.PLAYLOG.sid);
  // 1. autoplay takes the wake lock
  await page.evaluate(() => { window.__noRender = true; __derby.S.aiCount = 3; __derby.AUTO.start(); });
  await page.waitForFunction(() => __derby.PLAYLOG.m && __derby.game.countdown <= 0, null, { timeout: 90000 });
  let L = await page.evaluate(() => ({ n: { ...__derby.LIFE.n }, ev: __derby.LIFE.evs.map((e) => e[1] + ': ' + e[2]) }));
  ok('wake lock acquired and logged', L.n.wlGot === 1 && L.ev.some((e) => /wakelock: screen wake lock acquired/.test(e)), L);
  // 2. the system takes it back while visible: logged as the system, asked again
  await page.evaluate(() => window.__wl.cur.release()); await W(4500);
  L = await page.evaluate(() => ({ n: { ...__derby.LIFE.n }, ev: __derby.LIFE.evs.map((e) => e[1] + ': ' + e[2]), mev: __derby.PLAYLOG.m.ev.filter((e) => e[1] === 'wakelock').map((e) => e[2]) }));
  ok('a system release is logged as the system and re-requested', L.n.wlSystem === 1 && L.n.wlRe === 1 && L.n.wlGot === 2 && L.ev.some((e) => /released by the system/.test(e)), L);
  ok('wake lock events are in the match timeline', L.mev.some((e) => /released by the system/.test(e)) && L.mev.some((e) => /acquired/.test(e)), L.mev);
  // 3. tab hidden: the browser releases it; a last-gasp beacon goes to the drop; then a freeze, a resume, and back
  await page.evaluate(() => window.__setHidden(true)); await W(300);
  await page.evaluate(() => document.dispatchEvent(new Event('freeze'))); await W(300);
  const susNote = await page.evaluate(() => localStorage.getItem('derby-pl-life-' + __derby.PLAYLOG.sid));
  await page.evaluate(() => document.dispatchEvent(new Event('resume'))); await page.evaluate(() => window.__setHidden(false)); await W(1000);
  L = await page.evaluate(() => ({ n: { ...__derby.LIFE.n }, ev: __derby.LIFE.evs.map((e) => e[1] + ': ' + e[2]), b: JSON.parse(localStorage.getItem('__beacons') || '[]') }));
  ok('hidden release logged as the tab hiding, and the lock taken again when visible', L.n.wlHidden === 1 && L.n.wlGot === 3 && L.ev.some((e) => /released by the browser \(tab hidden\)/.test(e)), L.n);
  ok('freeze and resume in the lifecycle note', L.n.frz === 1 && L.ev.some((e) => /^freeze:/.test(e)) && L.ev.some((e) => /^resume:/.test(e)), L.ev);
  const g = L.b[0] || {};
  ok('a last-gasp beacon went to the drop on hide (ntfy topic, title/tags as query)', L.b.length === 1 && /^https:\/\/ntfy\.sh\/scrapyard-derby-f74277e052a2\?title=gasp/.test(g.url) && /tags=playlog/.test(g.url), L.b.map((x) => x.url));
  const gl = String(g.body || '').split('\n'); let gr = null; try { gr = JSON.parse(gl[1]); } catch (e) {}
  ok('the beacon is a play-log line: header why=last_gasp_hidden + a small gasp record', /^#derby-playlog v2 dev=\S+ sid=\S+ build=\d+ .*why=last_gasp_hidden/.test(gl[0]) && gr && gr.kind === 'gasp' && gr.why === 'hidden' && gr.auto === true && g.body.length < 4000, g.body);
  // 4. a refused wake lock
  await page.evaluate(() => { window.__wl.deny = 1; window.__setHidden(true); window.__setHidden(false); }); await W(800);
  L = await page.evaluate(() => ({ n: { ...__derby.LIFE.n }, ev: __derby.LIFE.evs.map((e) => e[1] + ': ' + e[2]), b: JSON.parse(localStorage.getItem('__beacons') || '[]').length }));
  ok('a denied wake lock is logged with the error name', L.n.wlDenied === 1 && L.ev.some((e) => /denied: NotAllowedError/.test(e)), L);
  ok('hidden beacons are rate-limited (still one)', L.b === 1, L.b);
  // 5. the wall clock jumps 2 minutes between heartbeats: a suspend
  await page.evaluate(() => { const real = Date.now.bind(Date); window.__realNow = real; Date.now = () => real() + 120000; }); await W(2500);
  L = await page.evaluate(() => ({ n: { ...__derby.LIFE.n }, mev: __derby.PLAYLOG.m.ev.filter((e) => e[1] === 'woke').map((e) => e[2]) }));
  await page.evaluate(() => { Date.now = window.__realNow; }); await W(1500);
  ok('a wall-clock jump logs "woke after N s" in the match timeline', L.n.sus === 1 && L.n.susS >= 119 && L.mev.some((e) => /^woke after 1[12]\d s \(page clock ran \d s: the machine was asleep\)/.test(e)), L);
  // 6. notes left by two earlier pages that never came back: one frozen (suspended), one with no lifecycle event at all (vanished)
  await page.evaluate((sn) => { const s = JSON.parse(sn) || {}; s.sid = 'susTEST'; s.seen = Date.now() - 600000; localStorage.setItem('derby-pl-life-susTEST', JSON.stringify(s));
    const v = __derby.LIFE.state(); Object.assign(v, { sid: 'vanTEST', seen: Date.now() - 7200000, t0: Date.now() - 9000000, hidden: undefined, frozen: undefined, ended: undefined, last: 'wakelock' }); localStorage.setItem('derby-pl-life-vanTEST', JSON.stringify(v)); }, susNote);
  // 7. reload: this page ends with a pagehide (clean); the next load uploads how all three ended
  await page.reload({ timeout: 180000 }); await page.waitForFunction(() => window.__derby, null, { timeout: 180000 });
  const ph = await page.evaluate(() => JSON.parse(localStorage.getItem('__beacons') || '[]'));
  ok('pagehide sent a second beacon', ph.length === 2 && /ntfy\.sh/.test(ph[1].url), ph.map((x) => x.url));
  await page.waitForFunction(() => window.__ups.some((t) => /previous session ended/.test(t)), null, { timeout: 30000 }).catch(() => {});
  const up = await page.evaluate(() => window.__ups.join('\n'));
  const recs = up.split('\n').filter((l) => l.startsWith('{')).map((l) => JSON.parse(l)), ends = recs.filter((r) => r.kind === 'lifeEnd');
  const by = (sid) => ends.find((r) => r.sid === sid) || {};
  console.log('uploaded lifeEnd lines:\n  ' + ends.map((r) => r.sid + ': ' + r.line).join('\n  '));
  ok('page-load upload header names how the previous session ended', /why=page_load_\(previous_session_clean\)/.test(up), up.split('\n').filter((l) => l.startsWith('#')));
  const c = by(sid1);
  ok('the reloaded page ended clean (pagehide), with its counters', c.how === 'clean' && /pagehide/.test(c.reason) && /^previous session ended: clean \(page closed \(pagehide\)\), last seen 20\d\d-.*Z \(\d+ s ago\)$/.test(c.line) && c.n && c.n.wlSystem === 1 && c.n.wlHidden >= 2 && c.n.wlDenied === 1 && c.n.sus === 1 && c.auto === true, c);
  const s = by('susTEST');
  ok('a page that froze and never came back: suspended, 10 min ago', s.how === 'suspended' && /frozen/.test(s.reason) && /\(10 min ago\)$/.test(s.line), s.line);
  const v = by('vanTEST');
  ok('a page with no lifecycle event: vanished, 2 h ago', v.how === 'vanished' && /no lifecycle event/.test(v.reason) && /\(2\.0 h ago\)$/.test(v.line) && v.upS === 1800, v.line);
  const ses = recs.find((r) => r.kind === 'session' && r.sid !== sid1 && r.prevEnd);
  ok('the new session record says how the page before it ended', ses && /^previous session ended: clean/.test(ses.prevEnd), ses && ses.prevEnd);
  ok('notes are removed once recovered', await page.evaluate(() => Object.keys(localStorage).filter((k) => k.startsWith('derby-pl-life-')).length === 1));
  const pe = errors.filter((e) => !e.includes('ERR_FAILED')); ok('no page errors', pe.length === 0, pe.slice(0, 3));
  await browser.close(); console.log(fails.length ? 'STOPLOG FAIL' : 'STOPLOG PASS'); process.exit(fails.length ? 1 : 0);
})();
