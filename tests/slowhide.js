// A slow moment that ends as the tab hides is the machine going to sleep, not the game (Build 111's Mac regression flag: one '8.1s at
// 10 fps' incident logged the instant the window lost focus and hid). But a window that is still visible and merely lost focus is not
// throttled by Chrome, so its slow moments are real (Build 114 dropped those too: the mostly-unfocused Chromebook logged 583 slow s/h on
// 114 against 3280 focused on 118, a false REGRESSION line). Checks:
//  - a slow moment followed within 2 s by the tab hiding is not logged in the play log (fails on Build 113: logged at once);
//  - a slow moment followed by focus loss with the tab still visible IS logged, marked focus: false (fails on Builds 114-122);
//  - losing focus alone doesn't start TABENV's 'suspect' grace window (fails on Builds 114-122);
//  - one with the tab staying in front is still logged.
const { open } = require('./harness');
(async () => {
  const fails = []; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails.push(m); };
  const { browser, page, errors } = await open({ viewport: { width: 800, height: 450 } }, () => { window.__focus = true; window.__hidden = false;
    Document.prototype.hasFocus = function () { return window.__focus; };
    Object.defineProperty(Document.prototype, 'hidden', { get: () => window.__hidden, configurable: true });
    Object.defineProperty(Document.prototype, 'visibilityState', { get: () => (window.__hidden ? 'hidden' : 'visible'), configurable: true }); });
  await page.evaluate(() => { __derby.S.aiCount = 2; document.getElementById('btnStart').click(); });
  await page.waitForFunction(() => __derby.game.state === 'playing' && __derby.game.countdown <= 0 && __derby.PLAYLOG.m, null, { timeout: 120000 });
  const fake = (tag) => ({ before: [tag], at: Date.now(), secs: 8.1, fps: 10, frame: 100, worst: 150, sim: 1, draw: 1, wait: 1, parts: 0, verdict: 'test', q: 0, res: '1', calls: 1 });
  const r = await page.evaluate(async (a) => { const D = __derby, wait = (ms) => new Promise((r) => setTimeout(r, ms)); /* (tagged by 'before', so a real slow moment on a slow test machine can't confuse the count) */
    const T = D.TABENV, get = (t) => D.PLAYLOG.m.inc.find((i) => i.before === t);
    // losing focus alone must not open the 'suspect' grace window (checked on the real getter, before it is pinned below)
    /* (graceUntil zeroed just before each synchronous dispatch: the headless machine's own throttle/frame-gap marks keep it set otherwise) */
    window.__focus = false; T.graceUntil = 0; window.dispatchEvent(new Event('blur')); const graceOnBlur = T.graceUntil > 0;
    window.__focus = true; T.graceUntil = 0; window.dispatchEvent(new Event('focus')); const graceOnFocus = T.graceUntil > 0;
    Object.defineProperty(T, 'suspect', { get: () => false, configurable: true }); /* (the headless test machine itself looks throttled: pin it to 'in front') */
    // 1. the machine dims to sleep: focus lost and the tab hides right after the slow moment
    D.PERFREP.incidents.push(a[0]); window.__focus = false; window.dispatchEvent(new Event('blur')); window.__hidden = true; document.dispatchEvent(new Event('visibilitychange'));
    await wait(2600); const sleep = get('sleep');
    window.__hidden = false; document.dispatchEvent(new Event('visibilitychange')); await wait(300);
    // 2. a visible window that is merely not focused (an autoplay machine with another window in front of the keyboard)
    D.PERFREP.incidents.push(a[1]); await wait(2600); const blurred = get('blurred');
    // 3. focused and in front
    window.__focus = true; window.dispatchEvent(new Event('focus')); await wait(300);
    D.PERFREP.incidents.push(a[2]); await wait(2600); const real = get('real');
    return { graceOnBlur, graceOnFocus, sleep: !!sleep, blurred: blurred ? { focus: blurred.focus } : false, real: real ? { focus: real.focus } : false, hasFocus: document.hasFocus(), hidden: document.hidden }; },
  [fake('sleep'), fake('blurred'), fake('real')]);
  console.log('  ' + JSON.stringify(r));
  ok(!r.sleep, `a slow moment followed by the tab hiding is not logged as a game problem (logged: ${r.sleep})`);
  ok(!!r.blurred, `a slow moment in a visible but unfocused window is still logged (logged: ${!!r.blurred})`);
  ok(r.blurred && r.blurred.focus === false, `  ... and marked focus: false for the analyser (got: ${JSON.stringify(r.blurred)})`);
  ok(!r.graceOnBlur && !r.graceOnFocus, `losing or regaining focus alone doesn't make the tab 'suspect' (grace on blur: ${r.graceOnBlur}, on focus: ${r.graceOnFocus})`);
  ok(!!r.real, `a slow moment with the tab in front is still logged (logged: ${!!r.real})`);
  ok(r.real && r.real.focus === undefined, `  ... with no focus field (got: ${JSON.stringify(r.real)})`);
  const pe = errors.filter((e) => e.startsWith('pageerror')); ok(!pe.length, 'no page errors ' + pe.slice(0, 2).join(' | '));
  console.log(fails.length ? 'SLOWHIDE FAIL' : 'SLOWHIDE PASS'); await browser.close(); process.exit(fails.length ? 1 : 0);
})();
