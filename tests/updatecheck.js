// Autoplay takes a new build even when the check ran while the tab was hidden, a reload got lost, or the newer build
// was first seen while autoplay was off (owner's Mac stayed on Build 94 for hours while 95 and 96 were live).
const { open } = require('./harness');
(async () => {
  const { browser, page, errors } = await open({ viewport: { width: 320, height: 200 } });
  const fails = []; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails.push(m); };
  const r = await page.evaluate(async () => { window.__noRender = true; const D = __derby, U = D.UPDATE, sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    window.__updTest = true; const reloads = []; U.reload = (url) => reloads.push(url);
    const realFetch = window.fetch; let serve = 'same'; let fetches = 0;
    window.fetch = async (url, opt) => { if (typeof url === 'string' && /\?u=\d+/.test(url)) { fetches++; return new Response(serve === 'err' ? 'x' : `<script>const BUILD = '${serve === 'same' ? D.UPDATE_BUILD || 0 : 999}';</script>`, { status: serve === 'err' ? 503 : 200 }); } return realFetch(url, opt); };
    const out = {};
    // 1) an error is logged, not swallowed
    serve = 'err'; await U.check(); out.errLogged = (U.log || []).some((l) => /HTTP 503/.test(l));
    // 2) newer build found while autoplay is OFF -> banner; later autoplay turns on -> next check takes it
    serve = 'new'; D.AUTO.on = false; await U.check(); out.newerSeen = U.newer === '999'; out.notYet = !U.updating;
    D.AUTO.on = true; await U.check(); out.takenLater = !!U.updating;
    // 3) the reload got lost (tab slept): after 6 min the check retries the reload
    U.goNow && U.goNow(); await sleep(200); const n1 = reloads.length; U.upAt = Date.now() - 7 * 60000; U.going = true; await U.check(); await sleep(16000); out.retried = reloads.length > n1; out.reloadUrl = reloads[reloads.length - 1] || '';
    // 4) coming back from the background triggers a check
    const f0 = fetches; U.newer = null; U.updating = false; serve = 'same';
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => false }); document.dispatchEvent(new Event('visibilitychange')); await sleep(2500); out.visCheck = fetches > f0;
    out.log = U.log; return out; });
  console.log('  ' + JSON.stringify(r).slice(0, 400));
  ok(r.errLogged, 'a failed check is logged (HTTP 503)');
  ok(r.newerSeen && r.notYet, 'a newer build seen while autoplay is off is remembered (banner), not taken');
  ok(r.takenLater, 'once autoplay is on, the next check takes the remembered build');
  ok(r.retried && /autoplay=1/.test(r.reloadUrl) && /v=999/.test(r.reloadUrl), 'a lost reload is retried after 6 minutes, into autoplay on the new build');
  ok(r.visCheck, 'coming back from the background checks for a new build');
  const pe = errors.filter((e) => !e.includes('ERR_FAILED')); ok(pe.length === 0, 'no page errors');
  console.log(fails.length ? 'UPDATECHECK FAIL' : 'UPDATECHECK PASS'); await browser.close(); process.exit(fails.length ? 1 : 0);
})();
