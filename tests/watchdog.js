// The updater of last resort (Build 101): a small script outside the game that reloads into a newer build when the game's
// own updater can't (game crashed or never started, or the in-game check is broken: the owner's Mac sat on Build 94 for hours).
// Runs the watchdog alone in a blank page with fast timers (__wdFast) and a fake version.txt, plus a smoke check in the real game.
// Fails on Build 100: there is no watchdog.
const fs = require('fs'), path = require('path'), { chromium } = require('playwright'), H = require('./harness');
const GAME = process.env.GAME || path.join(__dirname, '..', 'index.html'), html = fs.readFileSync(GAME, 'utf8');
const m = html.match(/<meta name="derby-build"[^>]*>\s*(?:<!--.*?-->)?\s*<script>([\s\S]*?)<\/script>/);
(async () => {
  const fails = []; const ok = (c, msg) => { console.log((c ? 'PASS ' : 'FAIL ') + msg); if (!c) fails.push(msg); };
  ok(!!m, 'watchdog script sits next to the derby-build meta tag in <head>'); if (!m) { console.log('WATCHDOG FAIL'); process.exit(1); }
  const browser = await chromium.launch();
  // scenario runner: K = speed-up (1 game-minute of watchdog time = 60000/K ms), remote = what version.txt says, game = fake game state
  const run = async (name, { remote, game, auto, idle, ms }) => { const page = await browser.newPage();
    await page.route('**/*', (r) => r.fulfill({ contentType: 'text/html', body: '<!doctype html><html><head><meta name="derby-build" content="100"></head><body></body></html>' }));
    await page.addInitScript(({ remote, game, auto }) => { window.__updTest = true; window.__wdFast = 600; // 4 min -> 400 ms, 12 min -> 1.2 s
      window.__reloads = []; window.__wdReload = (u) => window.__reloads.push(u); window.__wdFetch = async () => new Response(String(remote), { status: 200 });
      if (game) window.__derby = { BOOT: { frame: 1 }, AUTO: { on: !!auto } }; }, { remote, game, auto });
    await page.goto('http://wd.local/' + (auto ? '?autoplay=1' : ''));
    await page.addScriptTag({ content: m[1] }); if (!idle) { for (let i = 0; i < ms / 300; i++) { await page.mouse.click(5, 5); await page.waitForTimeout(300); } } else await page.waitForTimeout(ms);
    const r = await page.evaluate(() => ({ reloads: window.__reloads, log: window.__wd && window.__wd.log, checks: window.__wd && window.__wd.checks })); await page.close(); return r; };
  let r = await run('crashed', { remote: 101, game: false, idle: true, ms: 1500 });
  ok(r.reloads.length >= 1 && /v=101/.test(r.reloads[0]), `game never started + newer build out -> reloads into it (${r.reloads[0]})`);
  r = await run('stuck autoplay', { remote: 101, game: true, auto: true, idle: true, ms: 2500 });
  ok(r.reloads.length >= 1 && /autoplay=1/.test(r.reloads[0]) && /v=101/.test(r.reloads[0]), `autoplay whose in-game update never happened -> reloads after 12 min into autoplay (${r.reloads[0]})`);
  r = await run('patient', { remote: 101, game: true, auto: true, idle: true, ms: 700 });
  ok(r.reloads.length === 0, 'gives the in-game updater its 12 minutes first');
  r = await run('someone playing', { remote: 101, game: true, auto: false, idle: false, ms: 2700 });
  ok(r.reloads.length === 0, 'never reloads under a person who is playing (input in the last 10 min)');
  r = await run('same build', { remote: 100, game: true, auto: true, idle: true, ms: 1500 });
  ok(r.reloads.length === 0 && r.checks >= 2, `same build -> no reload (${r.checks} checks)`);
  r = await run('never booted, no new build', { remote: 100, game: false, idle: true, ms: 3200 });
  ok(r.reloads.length >= 1 && /retry/.test((r.log || []).join()), `game never started in 5 min -> retries the page (${(r.log || []).join(' | ')})`);
  await browser.close();
  // smoke: in the real game the watchdog is armed with this build's number and does nothing when the build is current
  const { browser: b2, page, errors } = await H.open({ viewport: { width: 320, height: 200 } });
  const s = await page.evaluate(() => ({ meta: document.querySelector('meta[name=derby-build]').content, build: __derby.BUILD || null }));
  ok(!!s.meta, 'real game: derby-build meta present (' + s.meta + ')');
  const pe = errors.filter((e) => e.startsWith('pageerror')); ok(!pe.length, 'real game: no page errors ' + pe.slice(0, 2).join(' | '));
  await b2.close();
  console.log(fails.length ? 'WATCHDOG FAIL' : 'WATCHDOG PASS'); process.exit(fails.length ? 1 : 0);
})();
