const { open } = require('./harness');
(async () => { const { browser, page, errors } = await open({ viewport: { width: 402, height: 684 }, isMobile: true, hasTouch: true }); await page.waitForTimeout(1500);
  const r = await page.evaluate(() => { const mk = (n) => { const ts = []; for (let i = 0; i < n; i++) ts.push(new Touch({ identifier: i, target: document.body, clientX: 100 + i * 50, clientY: 300 })); return new TouchEvent('touchmove', { touches: ts, cancelable: true, bubbles: true }); };
    const two = mk(2), one = mk(1); document.body.dispatchEvent(two); document.body.dispatchEvent(one);
    const g = new Event('gesturestart', { cancelable: true, bubbles: true }); document.body.dispatchEvent(g);
    return { twoFingerBlocked: two.defaultPrevented, oneFingerAllowed: !one.defaultPrevented, gestureBlocked: g.defaultPrevented, fullBtnShown: !document.getElementById('btnFull').hidden && getComputedStyle(document.getElementById('btnFull')).display !== 'none' }; });
  console.log(JSON.stringify(r), JSON.stringify(errors.filter((e) => !e.includes('ERR_FAILED')))); await browser.close(); })();
