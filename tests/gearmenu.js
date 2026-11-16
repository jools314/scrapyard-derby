// The gear menu is shorter (owner: "some of the menu items can be combined, like bug and perf and net log"): Bug report, Network log
// and Play report were three more items next to Performance. Now one item, 🩺 Performance & logs (I), opens one window with all of
// them: copy a bug report, the network log (when there is one), the play report, the play log meter. Fails on Build 103.
const { open } = require('./harness');
(async () => {
  const fails = []; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails.push(m); };
  for (const touch of [false, true]) {
    const { browser, page, errors } = await open({ viewport: { width: 900, height: 700 }, hasTouch: touch, isMobile: touch });
    await page.evaluate((t) => { if (t) document.body.classList.add('touch'); window.__noRender = true; __derby.S.aiCount = 2; document.getElementById('btnStart').click(); }, touch);
    await page.waitForFunction(() => __derby.game.state === 'playing' && __derby.game.countdown <= 0, null, { timeout: 90000 });
    const who = touch ? 'touch' : 'desktop';
    const menu = await page.evaluate(() => { document.getElementById('btnGear').click(); return [...document.querySelectorAll('#gearMenu button')].filter((b) => b.offsetParent).map((b) => b.id); });
    ok(!menu.includes('gmBug') && !menu.includes('btnNetLog') && !menu.includes('btnApReport') && menu.includes('btnPerf'), `${who}: gear menu has one Performance & logs item, no separate bug / network log / play report (${menu.length} items: ${menu.join(' ')})`);
    const dlg = await page.evaluate(() => { document.getElementById('btnPerf').click(); const d = document.getElementById('perfdlg'); return { open: !d.hidden, ids: [...d.querySelectorAll('button')].map((b) => b.id), title: d.querySelector('.rs-title').textContent }; });
    ok(dlg.open && dlg.ids.includes('gmBug') && dlg.ids.includes('btnNetLog') && dlg.ids.includes('plRep') && /logs/.test(dlg.title), `${who}: the window holds bug report, network log and play report ("${dlg.title}")`);
    const bug = await page.evaluate(async () => { const n0 = document.querySelectorAll('#toasts > *').length; document.getElementById('gmBug').click(); await new Promise((r) => setTimeout(r, 400)); return { toast: [...document.querySelectorAll('#toasts > *')].map((t) => t.textContent).join(' | '), dlg: !document.getElementById('netlog').hidden }; });
    ok(/BUG REPORT/.test(bug.toast) || bug.dlg, `${who}: Copy bug report works (${bug.toast.slice(0, 60) || 'report window opened'})`);
    const rep = await page.evaluate(async () => { const n = document.getElementById('netlog'); n.hidden = true; document.getElementById('btnPerf').click(); document.getElementById('plRep').click(); await new Promise((r) => setTimeout(r, 300)); return { perfClosed: document.getElementById('perfdlg').hidden, anyOpen: [...document.querySelectorAll('[role=dialog]')].some((d) => !d.hidden) }; });
    ok(rep.perfClosed && rep.anyOpen, `${who}: Play report opens its own window and closes the Performance & logs window`);
    const pe = errors.filter((e) => e.startsWith('pageerror')); ok(!pe.length, `${who}: no page errors ${pe.slice(0, 2).join(' | ')}`);
    await browser.close();
  }
  console.log(fails.length ? 'GEARMENU FAIL' : 'GEARMENU PASS'); process.exit(fails.length ? 1 : 0);
})();
