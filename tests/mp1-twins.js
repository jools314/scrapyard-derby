// Family yard: two devices tap Play together at the same moment -> still one game. Then a third arrives.
const { rig } = require('./mp1-common');
(async () => {
  const { browser, errs, mk, view } = await rig(); const R = { runs: [] };
  for (let run = 0; run < (+process.env.RUNS || 3); run++) {
    const name = 'twins-' + run + '-' + Math.random().toString(36).slice(2, 6);
    const E = await mk('E' + run), F = await mk('F' + run);
    for (const p of [E, F]) await p.evaluate((n) => { localStorage.setItem('derby-famname', n); }, name);
    await Promise.all([E.click('#btnFamily'), F.click('#btnFamily')]);
    await E.waitForTimeout(16000);
    const v = { E: await view(E), F: await view(F) };
    const G = await mk('G' + run); await G.evaluate((n) => { localStorage.setItem('derby-famname', n); }, name); await G.click('#btnFamily');
    await G.waitForFunction(() => __derby.MP.role === 'guest', null, { timeout: 40000 }).catch(() => {}); await G.waitForTimeout(3000);
    v.G = await view(G); v.E2 = await view(E); v.F2 = await view(F);
    const roles = [v.E2.role, v.F2.role, v.G.role].sort().join(','), hosts = new Set([v.E2.host, v.F2.host, v.G.host]);
    R.runs.push({ ok: roles === 'guest,guest,host' && hosts.size === 1, roles, hosts: [...hosts], v });
    for (const p of [E, F, G]) await p.context().close();
  }
  R.errs = errs; R.pass = R.runs.every((r) => r.ok) && !errs.length; console.log(JSON.stringify(R, null, 1)); await browser.close();
})();
