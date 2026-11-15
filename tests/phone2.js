const { open } = require('./harness');
const W = +(process.env.W || 402), H = +(process.env.H || 684), P = process.env.P || 'p2';
(async () => { const { browser, page, errors } = await open({ viewport: { width: W, height: H }, deviceScaleFactor: 2, isMobile: true, hasTouch: true }); await page.waitForTimeout(1500);
  await page.screenshot({ path: `${P}-menu.png`, timeout: 150000 });
  await page.evaluate(() => { __derby.S.aiCount = 5; document.getElementById('btnStart').click(); });
  await page.waitForFunction(() => __derby.game.countdown <= 0, null, { timeout: 300000 }); await page.waitForTimeout(2500);
  await page.screenshot({ path: `${P}-play.png`, timeout: 150000 });
  // overlap check: no two visible controls may overlap
  const ov = await page.evaluate(() => { const els = [...document.querySelectorAll('.rail .ic, #touch .tb, .speedo, .stats, #pedal, #stick, .bugdot')].filter((e) => { const r = e.getBoundingClientRect(), cs = getComputedStyle(e); return r.width > 0 && cs.display !== 'none' && cs.visibility !== 'hidden'; });
    const out = []; for (let i = 0; i < els.length; i++) for (let j = i + 1; j < els.length; j++) { const a = els[i].getBoundingClientRect(), b = els[j].getBoundingClientRect(); if (els[i].contains(els[j]) || els[j].contains(els[i])) continue; const x = Math.min(a.right, b.right) - Math.max(a.left, b.left), y = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top); if (x > 2 && y > 2) out.push((els[i].id || els[i].className) + ' x ' + (els[j].id || els[j].className)); } return out; });
  // menu items work: open gear, tap Camera view
  const cam0 = await page.evaluate(() => __derby.S.cam ?? null);
  await page.tap('#btnGear'); await page.waitForTimeout(300); await page.screenshot({ path: `${P}-gear.png`, timeout: 150000 });
  await page.tap('#gmCam'); await page.waitForTimeout(300);
  const gearClosed = await page.evaluate(() => document.getElementById('gearMenu').hidden);
  await page.tap('.speedo'); await page.waitForTimeout(300);
  console.log(JSON.stringify({ overlaps: ov, gearClosed }), JSON.stringify(errors.filter((e) => !e.includes('ERR_FAILED')))); await browser.close(); })();
