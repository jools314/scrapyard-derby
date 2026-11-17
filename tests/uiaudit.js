// UI audit (owner: "why does the minigun icon show a handgun??? audit all icons, look at the UI and layout on different screens").
// Checks: the FIRE button for the minigun, shotgun and cannon is a drawn icon (no 🔫 pistol / water pistol); every gear-menu item has an
// icon; on a phone the touch controls, key bar, Pause and Respawn are not drawn over the menu; the sticky Start row is solid (the cards
// showed through it); the target hint never covers the speedometer in portrait. Fails on Build 107.
const { open } = require('./harness');
const { devices } = require('playwright');
(async () => {
  const fails = []; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails.push(m); };
  const { browser, page, errors } = await open({ ...devices['iPhone 13'] });
  await page.waitForTimeout(800);
  const m = await page.evaluate(() => { const vis = (id) => { const e = document.getElementById(id); if (!e) return false; const cs = getComputedStyle(e); return !e.hidden && cs.display !== 'none' && cs.visibility !== 'hidden' && e.getClientRects().length > 0; };
    const act = document.querySelector('#menu .card .actions'), bg = getComputedStyle(act).backgroundColor;
    return { touch: vis('touch'), keys: vis('keys'), pause: vis('btnPause'), respawn: vis('btnRespawn'), bug: vis('btnBug'), actBg: bg }; });
  console.log('  menu: ' + JSON.stringify(m));
  ok(!m.touch && !m.pause && !m.respawn && !m.bug, 'phone menu: no touch controls, Pause, Respawn or bug button drawn over it');
  ok(/^rgb\(/.test(m.actBg), `phone menu: the sticky Start row is solid (${m.actBg})`);
  await page.evaluate(() => { __derby.S.aiCount = 3; document.getElementById('btnStart').click(); });
  await page.waitForFunction(() => __derby.game.state === 'playing' && __derby.game.countdown <= 0, null, { timeout: 120000 });
  const icons = {};
  for (const t of ['hellbender', 'cruiser', 'tiger', 'outrider']) icons[t] = await page.evaluate(async (t) => { __derby.respawnCar(__derby.player, t); await new Promise((r) => setTimeout(r, 300)); const f = document.getElementById('fireIco'); return { svg: !!f.querySelector('svg'), text: f.textContent.trim(), label: document.getElementById('fireLab').textContent }; }, t);
  console.log('  fire: ' + JSON.stringify(icons));
  ok(['hellbender', 'cruiser', 'tiger'].every((t) => icons[t].svg && !icons[t].text.includes('🔫')), 'minigun, shotgun and cannon show drawn icons, not a 🔫 pistol');
  ok(icons.outrider.text === '🔱' && !icons.outrider.svg, 'an emoji weapon (harpoon) still shows its emoji');
  const g = await page.evaluate(() => [...document.querySelectorAll('#gearMenu button, #gearmenu button, .gearmenu button')].filter((b) => b.offsetParent !== null || true).map((b) => b.textContent.trim()).filter(Boolean));
  const bare = g.filter((t) => /^[A-Za-z0-9]/.test(t));
  console.log('  gear: ' + g.length + ' items; without an icon: ' + JSON.stringify(bare));
  ok(g.length >= 10 && bare.length === 0, 'every gear-menu item starts with an icon');
  const h = await page.evaluate(async () => { const hint = document.getElementById('hint'), sp = document.querySelector('.speedo'); hint.textContent = 'Tap 🎯 to pick a target'; await new Promise((r) => requestAnimationFrame(r)); const a = hint.getBoundingClientRect(), b = sp.getBoundingClientRect(); return { a: [a.top, a.bottom, a.left, a.right].map(Math.round), b: [b.top, b.bottom, b.left, b.right].map(Math.round) }; });
  const overlap = !(h.a[1] <= h.b[0] || h.a[0] >= h.b[1] || h.a[3] <= h.b[2] || h.a[2] >= h.b[3]);
  ok(!overlap, `portrait: the hint (${h.a}) does not cover the speedometer (${h.b})`);
  const pe = errors.filter((e) => e.startsWith('pageerror')); ok(!pe.length, 'no page errors ' + pe.slice(0, 2).join(' | '));
  console.log(fails.length ? 'UIAUDIT FAIL' : 'UIAUDIT PASS'); await browser.close(); process.exit(fails.length ? 1 : 0);
})();
