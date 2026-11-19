// Iconic looks (owner: "make the RV look more like the one in Breaking Bad... the mining trucks yellow"). An iconic vehicle always
// wears its own paint, even when the AI drives it or it respawns (the AI used to give it a random colour); the RV has the brown and
// tan side bands and dark side windows; Big Bertha is mining-truck yellow with pink mudflaps. Fails on Build 106 (no `iconic`).
// The Buzzsaw Hover (Lucas's hovercraft) reads at a glance: teal deck, black rubber skirt, a ring of saw blades, a caged fan, a red paper lantern.
const { open } = require('./harness');
(async () => {
  const { browser, page, errors } = await open({ viewport: { width: 640, height: 400 } });
  const fails = []; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails.push(m); };
  await page.evaluate(() => { __derby.S.aiCount = 4; document.getElementById('btnStart').click(); });
  await page.waitForFunction(() => __derby.game.state === 'playing' && __derby.game.countdown <= 0, null, { timeout: 120000 });
  const r = await page.evaluate(async () => { const D = __derby, CT = D.CAR_TYPES, out = {};
    const icon = Object.keys(CT).filter((k) => CT[k].iconic); out.icon = icon;
    out.paint = {}; for (const t of icon) { const c = D.respawnCar(D.cars.filter((c) => !c.isPlayer)[0], t); out.paint[t] = c.baseColor.getHex() === CT[t].color; }
    const rv = D.respawnCar(D.cars.filter((c) => !c.isPlayer)[1], 'camper'); out.rvBands = !!(rv.looks && rv.looks.bands >= 8 && rv.looks.windows >= 6); out.rvCream = CT.camper.color === 0xefe7d4;
    const b = D.respawnCar(D.cars.filter((c) => !c.isPlayer)[2], 'bertha'); const pink = (b.looks && b.looks.pinkFlaps) || 0;
    out.berthaYellow = CT.bertha.color === 0xf2b400; out.pinkFlaps = pink;
    const tw = D.respawnCar(D.cars.filter((c) => !c.isPlayer)[0], 'towtruck'); out.oldTow = !!(tw.looks && tw.looks.oldTow) && CT.towtruck.color === 0x8a4a22;
    const mu = D.respawnCar(D.cars.filter((c) => !c.isPlayer)[1], 'outrider'); out.stripes = (mu.looks && mu.looks.stripes) || 0;
    const tg = D.respawnCar(D.cars.filter((c) => !c.isPlayer)[2], 'tiger'); out.camo = (tg.looks && tg.looks.camo) || 0;
    const hv = D.respawnCar(D.cars.filter((c) => !c.isPlayer)[0], 'hover'); out.hover = Object.assign({ teal: CT.hover.color === 0x17b3bd && hv.baseColor.getHex() === 0x17b3bd, saws: hv.sawIM ? hv.sawIM.count : 0 }, hv.looks || {}); return out; });
  console.log('  ' + JSON.stringify(r));
  ok(['camper', 'bertha', 'dozer', 'forklift', 'firetruck', 'cruiser', 'tiger', 'combine', 'tanker', 'towtruck', 'outrider', 'viper', 'mixer', 'sandflea'].every((t) => r.icon.includes(t)), 'the RV, Bertha, dozer, forklift, fire truck, cruiser, Tiger, combine and tanker are iconic');
  ok(Object.values(r.paint).every(Boolean), 'an AI-driven iconic vehicle wears its own paint, not a random colour ' + JSON.stringify(r.paint));
  ok(r.rvCream && r.rvBands, 'the RV is cream with brown and tan side bands and dark windows');
  ok(r.berthaYellow && r.pinkFlaps >= 2, `Big Bertha is mining yellow with pink mudflaps (${r.pinkFlaps})`);
  ok(r.oldTow, 'the tow truck is a rusty old wrecker');
  ok(r.stripes >= 6 && r.camo >= 10, `the Outrider has twin racing stripes (${r.stripes}) and the Tiger wears camouflage (${r.camo})`);
  ok(r.icon.includes('hover') && r.hover.teal && r.hover.saws >= 8 && r.hover.fan && r.hover.skirt && r.hover.lantern, `the Buzzsaw Hover is teal on a black skirt, with ${r.hover.saws} saw blades, a caged fan and a red lantern`);
  const pe = errors.filter((e) => e.startsWith('pageerror')); ok(!pe.length, 'no page errors ' + pe.slice(0, 2).join(' | '));
  console.log(fails.length ? 'LOOKS FAIL' : 'LOOKS PASS'); await browser.close(); process.exit(fails.length ? 1 : 0);
})();
