// The Golden Cone: exactly one cone per match is gold underneath the orange, chosen at
// random when the yard is built; it looks orange until goldConeReveal (the knock-over
// trigger in propCollide) shows the gold, unbatching its mesh so it can shine on its own.
// The reveal is one-shot. Fails on the pre-change tree: no cone is golden and
// goldConeReveal does not exist.
const { open } = require('./harness');
(async () => {
  const { browser, page, errors } = await open({ viewport: { width: 900, height: 560 } });
  const fails = []; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails.push(m); };
  await page.evaluate(() => { window.__noRender = true; __derby.S.aiCount = 0; document.getElementById('btnStart').click(); });
  await page.waitForFunction(() => __derby.game.state === 'playing' && __derby.game.countdown <= 0, null, { timeout: 60000 });
  const r1 = await page.evaluate(() => { const D = __derby;
    const cones = D.props.filter((pr) => pr.body.mass === 3 && pr.kind === 'plastic');
    const gold = cones.filter((pr) => pr.golden);
    const g = gold[0];
    return { nCones: cones.length, nGold: gold.length, hexBefore: g ? g.mesh.material.color.getHex() : null, revealedBefore: g ? !!g.goldRevealed : null };
  });
  ok(r1.nCones >= 20, `the yard has its cone rows (${r1.nCones} cones)`);
  ok(r1.nGold === 1, `exactly one golden cone per match (found ${r1.nGold})`);
  ok(r1.hexBefore !== 0xd8a920 && r1.revealedBefore === false, 'before the knock it is orange and unrevealed — the gold is a secret');
  const r2 = await page.evaluate(() => { const D = __derby, g = D.props.find((pr) => pr.golden);
    const first = D.goldConeReveal(g), second = D.goldConeReveal(g);
    return { first, second, revealed: !!g.goldRevealed, hex: g.mesh.material.color.getHex(), unbatched: !!g.mesh.userData.unbatched, layer: g.mesh.layers.mask,
      nRevealed: D.props.filter((pr) => pr.goldRevealed).length };
  });
  ok(r2.first === true && r2.second === false, 'the reveal fires once and only once');
  ok(r2.revealed && r2.hex === 0xd8a920, `after the knock the cone is gold (colour #${r2.hex.toString(16)})`);
  ok(r2.unbatched && r2.layer === 1, 'the golden cone leaves the instanced prop batch so its gold actually draws');
  ok(r2.nRevealed === 1, 'still exactly one revealed cone in the yard');
  const errs = errors.filter((e) => e.startsWith('pageerror:'));
  ok(errs.length === 0, 'no page errors ' + JSON.stringify(errs.slice(0, 3)));
  console.log(fails.length ? `FAILED ${fails.length}` : 'GOLDCONE PASS'); process.exitCode = fails.length ? 1 : 0;
  await browser.close();
})().catch((e) => { console.log('CRASH', e); process.exit(1); });
