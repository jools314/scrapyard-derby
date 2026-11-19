// Where do the draw calls go? Counts every draw three.js issues for one frame of a running match (renderBufferDirect),
// grouped by what draws it (the object's nearest named ancestor / a car / prop kind / material), at a given quality.
// Usage: node tools/perf/drawcalls.js [CAM=0,40,-140,0,0,30] [Q=7] [OPP=6] [GAME=...] [W=1280 H=700] [WAIT=6000]
const path = require('path'); const H = require(path.join(__dirname, '..', '..', 'tests', 'harness'));
const Q = +(process.env.Q ?? 7), OPP = +(process.env.OPP || 6), W = +(process.env.W || 1280), HH = +(process.env.H || 700);
(async () => {
  const { browser, page, errors } = await H.open({ viewport: { width: W, height: HH } }, null, (p) => p.setDefaultTimeout(600000));
  await page.evaluate(({ Q, OPP, AG }) => { const D = __derby; D.S.aiCount = OPP; D.S.autoGfx = AG; D.applyQuality(Q); document.getElementById('btnStart').click(); }, { Q, OPP, AG: !process.env.FIXGFX }); // (autoGfx on, as on real devices: the quality step's graphics cap applies; at the lowest step the governor can only go up, which a weak machine never earns)
  await page.waitForFunction(() => __derby.game.state === 'playing' && __derby.game.countdown <= 0, null, { timeout: 300000, polling: 500 });
  await page.evaluate(({ Q, AUTO, CAM }) => { __derby.AUTO.on = AUTO; __derby.applyQuality(Q); if (CAM) window.__camOverride = { pos: CAM.slice(0, 3), look: CAM.slice(3) }; }, { Q, AUTO: !process.env.NOAUTO, CAM: process.env.CAM ? process.env.CAM.split(',').map(Number) : null }); // CAM=x,y,z,lx,ly,lz: a fixed camera, so two builds see the same thing
  await page.waitForTimeout(+(process.env.WAIT || 6000));
  const r = await page.evaluate(async (DETAIL) => {
    const D = __derby, R = D.renderer, cars = D.cars; const carOf = new Map(); for (const c of cars) if (c.group) c.group.traverse((o) => carOf.set(o, c));
    const label = (o) => { if (carOf.has(o)) return 'car:' + (carOf.get(o).T.name); let p = o, chain = []; while (p && p !== D.scene) { if (p.name) return 'named:' + p.name; chain.push(p.type); p = p.parent; }
      const m = Array.isArray(o.material) ? o.material[0] : o.material; if (DETAIL) { const gp = o.geometry && o.geometry.parameters; const wp = o.getWorldPosition(new o.position.constructor()); return (o.isInstancedMesh ? 'inst' + o.count + ':' : o.isSkinnedMesh ? 'skin:' : 'mesh:') + (o.geometry ? o.geometry.type : '?') + (gp ? JSON.stringify(gp).replace(/"/g, '').slice(0, 50) : '') + ' mat#' + (m ? m.id : '?') + (m && m.map ? ' map' + m.map.image?.width : '') + ' par:' + (o.parent ? o.parent.type + (o.parent.name || '') + o.parent.children.length : '') + ' @' + Math.round(wp.x) + ',' + Math.round(wp.y) + ',' + Math.round(wp.z); } return (o.isInstancedMesh ? 'inst:' : o.isSkinnedMesh ? 'skin:' : o.isSprite ? 'sprite:' : o.isPoints ? 'points:' : o.isLine ? 'line:' : 'mesh:') + (o.geometry ? o.geometry.type : '?') + '/' + (m ? m.type + (m.map ? '+map' : '') : '?') + ' depth' + chain.length; };
    const by = new Map(), objs = new Map(); let total = 0; const o = R.renderBufferDirect.bind(R); let on = false;
    R.renderBufferDirect = function (cam, scene, geo, mat, obj, grp) { if (on) { total++; let k; try { k = label(obj); } catch (e) { k = 'ERR ' + e.message; } by.set(k, (by.get(k) || 0) + 1); objs.set(obj, 1); } return o(cam, scene, geo, mat, obj, grp); };
    await new Promise((r) => requestAnimationFrame(r)); const NF = 30; on = true; const per = []; let last = 0; for (let i = 0; i < NF; i++) { await new Promise((r) => requestAnimationFrame(r)); per.push(total - last); last = total; } on = false; R.renderBufferDirect = o; total = Math.round(total / NF); for (const [k, v] of by) by.set(k, +(v / NF).toFixed(1));
    // also: props by kind
    const props = (D.props || []); const pk = {}; for (const p of props) { const k = (p.kind || p.type || '?'); const vis = p.mesh && p.mesh.visible; pk[k] = pk[k] || [0, 0]; pk[k][0]++; if (vis && objs.has(p.mesh)) pk[k][1]++; }
    return { per: per.join(' '), total, info: R.info.render.calls, by: [...by].sort((a, b) => b[1] - a[1]), props: pk, programs: R.info.programs.length };
  }, !!process.env.DETAIL);
  console.log('per frame', r.per); console.log('avg draws', r.total, 'programs', r.programs); for (const [k, n] of r.by) console.log(String(n).padStart(5), k);
  console.log('props (count, drawn individually):', JSON.stringify(r.props));
  await browser.close();
})();
