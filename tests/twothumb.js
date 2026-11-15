const { open } = require('./harness');
(async () => { const { browser, page, errors } = await open({ viewport: { width: 874, height: 402 }, isMobile: true, hasTouch: true }); await page.waitForTimeout(1500);
  await page.evaluate(() => { window.__noRender = true; __derby.S.aiCount = 0; document.getElementById('btnStart').click(); });
  await page.waitForFunction(() => __derby.game.countdown <= 0, null, { timeout: 90000 });
  const cdp = await page.context().newCDPSession(page);
  const pr = await page.evaluate(() => { const a = document.getElementById('pedal').getBoundingClientRect(), b = document.getElementById('stick').getBoundingClientRect(); return { px: a.x + a.width / 2, py: a.y + a.height / 2, sx: b.x + b.width / 2, sy: b.y + b.height / 2 }; });
  const tp = (pts) => pts.map(([x, y], i) => ({ x, y, id: i + 1 }));
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: tp([[pr.px, pr.py], [pr.sx, pr.sy]]) });
  for (let k = 1; k <= 8; k++) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: tp([[pr.px, pr.py - k * 8], [pr.sx - k * 7, pr.sy]]) }); await page.waitForTimeout(30); }
  await page.waitForTimeout(1500);
  const r = await page.evaluate(() => { const c = __derby.player.ctrl; return { throttle: +c.throttle.toFixed(2), steer: +c.steer.toFixed(2), speed: Math.round(__derby.player.speed) }; });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  console.log(JSON.stringify(r), r.throttle > 0.5 && r.steer > 0.5 ? 'TWO-THUMB PASS' : 'TWO-THUMB FAIL', JSON.stringify(errors.filter((e) => !e.includes('ERR_FAILED')))); await browser.close(); })();
