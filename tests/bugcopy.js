// One tap on the small bug icon puts the whole report on the clipboard (desktop and phone), no dialog
const { open } = require('./harness');
(async () => { let bad = 0;
  for (const [name, ctx] of [['desktop', { viewport: { width: 1280, height: 720 } }], ['phone', { viewport: { width: 402, height: 684 }, isMobile: true, hasTouch: true }]]) {
    const { browser, page, errors } = await open(ctx); await page.evaluate(() => { window.__copied = ''; document.addEventListener('copy', () => { const a = document.activeElement; window.__copied = a && a.value !== undefined ? a.value.slice(a.selectionStart, a.selectionEnd) : String(getSelection()); }, true); });
    await page.evaluate(() => { window.__noRender = false; __derby.S.aiCount = 2; document.getElementById('btnStart').click(); });
    await page.waitForFunction(() => __derby.game.countdown <= 0, null, { timeout: 300000 }); await page.waitForTimeout(1000);
    const box = await page.evaluate(() => { const r = document.getElementById('btnBug').getBoundingClientRect(); return [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)]; });
    if (name === 'phone') await page.tap('#btnBug'); else await page.click('#btnBug');
    await page.waitForTimeout(1500);
    const r = await page.evaluate(() => ({ clip: window.__copied.length, dialog: !document.getElementById('netlog').hidden, head: window.__copied.slice(0, 60) }));
    await page.screenshot({ path: `bugdot-${name}.png`, timeout: 150000 });
    const ok = r.clip > 2000 && !r.dialog; if (!ok) bad++;
    console.log(`${ok ? 'PASS' : 'FAIL'} ${name}: icon at ${box} · clipboard ${r.clip} chars · dialog ${r.dialog ? 'shown' : 'not shown'} · "${r.head.replace(/\n/g, ' ')}"`, JSON.stringify(errors.filter((e) => !e.includes('ERR_FAILED')).slice(0, 2)));
    await browser.close(); }
  console.log(bad ? 'BUGCOPY FAIL' : 'BUGCOPY PASS'); process.exit(bad ? 1 : 0); })();
