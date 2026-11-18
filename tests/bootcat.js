// Startup CPU by kind (a measuring tool, not a pass/fail test; not in run.sh): page open -> whole yard on screen at a CPU throttle (THR,
// default 4, the Chromebook stand-in of tests/fastboot.js), main-thread samples sorted into what could be precomputed (P: canvas textures,
// arena builders, mergeStatic, car models) and what can't (N: shader compile/link, texture upload, frames, physics, PMREM; 'native
// (program)' is parse, layout, paint and waits on the GPU process). With GAME=a copy that pushes window.__marks ([label, ms]) named
// env0/env1, arena0/arena1, merge0/merge1 around makeEnv, buildArena and mergeStatic, it also prints those windows (the profile clock is
// aligned to the script's start, give or take ~100 ms, so a window's split blurs at its edges). LEAF=<category> lists its leaf functions.
const H = require('./harness');
const THR = +(process.env.THR || 4);
const init = () => { const P = WebGL2RenderingContext.prototype, gE = P.getExtension, gP = P.getProgramParameter;
  P.getExtension = function (n) { return n === 'KHR_parallel_shader_compile' ? { COMPLETION_STATUS_KHR: 0x91B1 } : gE.call(this, n); };
  P.getProgramParameter = function (p, k) { return k === 0x91B1 ? true : gP.call(this, p, k); };
  try { localStorage.setItem('derby-qlevel', '7'); } catch (e) {} };
(async () => {
  let cdp;
  const before = async (page) => { cdp = await page.context().newCDPSession(page); await cdp.send('Emulation.setCPUThrottlingRate', { rate: THR });
    await cdp.send('Profiler.enable'); await cdp.send('Profiler.setSamplingInterval', { interval: 200 }); await cdp.send('Profiler.start'); };
  const { browser, page } = await H.open({ viewport: { width: 1280, height: 720 } }, init, before);
  await page.waitForFunction(() => __derby.BOOT.frame && __derby.BOOT.yard, null, { timeout: 300000, polling: 250 });
  const { profile } = await cdp.send('Profiler.stop');
  const r = await page.evaluate(() => { const B = __derby.BOOT; return { t0: B.t0, ready: B.ready, built: B.built, yard: B.yard, frame: B.frame, compiled: B.compiled, marks: window.__marks || [] }; });
  const nodes = new Map(); for (const n of profile.nodes) nodes.set(n.id, n);
  const parent = new Map(); for (const n of profile.nodes) for (const c of n.children || []) parent.set(c, n.id);
  const dts = profile.timeDeltas; let t = profile.startTime, off = null; const tt = [];
  for (let i = 0; i < profile.samples.length; i++) { t += dts[i]; tt.push(t / 1000); if (off == null) { let id = profile.samples[i];
    while (id != null) { const c = nodes.get(id).callFrame; if (c.url.includes('game.local') && c.functionName === '' && c.lineNumber > 700) { off = t / 1000 - r.t0; break; } id = parent.get(id); } } }
  const cat = (leafId) => { const leaf = nodes.get(leafId), lf = leaf.callFrame; const fnames = []; let id = leafId; while (id != null) { const f = nodes.get(id).callFrame; fnames.push((f.url.split('/').pop() || '') + ':' + f.functionName); id = parent.get(id); }
    const has = (re) => fnames.some((x) => re.test(x));
    if (lf.functionName === '(idle)') return null;
    if (lf.functionName === '(garbage collector)') return 'gc';
    if (lf.functionName === '(program)') return 'native (program)';
    if (has(/:canvasTex$|:pixTex$/)) return 'P canvas textures';
    if (lf.url.includes('cannon-es')) return 'N physics (cannon)';
    if (has(/:mergeStatic$/)) return 'P arena mergeStatic';
    if (has(/:mergeStaticParts$/)) return 'P car mergeStaticParts';
    if (has(/:buildModel$|:addDetails2?$/)) return 'P car buildModel/details';
    if (has(/game\.local:Car$/)) return 'P car other';
    if (has(/:buildArena$/)) return 'P arena builders';
    if (has(/:fromScene$|:PMREMGenerator$/)) return 'N pmrem env (GPU)';
    if (has(/:initTexture$|:uploadTexture$|texSubImage2D|texImage2D|getMaxAnisotropy|:setTexture2D$/)) return 'N texture upload';
    if (has(/:compileFor$|:compileAsync$|:getProgram$|WebGLShader|WebGLProgram|onFirstUse|getProgramParameter/)) return 'N shader compile/link';
    if (has(/:buildPropsGen$|:resetBulls$|:buildPickups$|:addProp$/)) return 'P? props/bulls/pickups (bodies+meshes)';
    if (has(/renderer\.render$|:render$|:drawBody$/)) return 'N frame render';
    if (has(/:simBody$|:frameBody$/)) return 'N frame sim';
    if (lf.url.includes('three.module') || lf.url.includes('BufferGeometryUtils')) return 'three other';
    return 'game js other'; };
  const win = (a, b) => { const m = new Map(); let n = 0; for (let i = 0; i < profile.samples.length; i++) { const tp = tt[i] - off; if (tp < a || tp >= b) continue; const c = cat(profile.samples[i]); if (!c) continue; const dt = (dts[i + 1] || 0) / 1000; n += dt; m.set(c, (m.get(c) || 0) + dt); }
    return `busy ${n.toFixed(0)} | ` + [...m].sort((x, y) => y[1] - x[1]).map(([k, v]) => `${k} ${v.toFixed(0)}`).join(', '); };
  const mk = Object.fromEntries(r.marks); const R = Math.round;
  console.log(`t0 ${R(r.t0)} ready ${R(r.ready)} built ${R(r.built)} frame ${R(r.frame)} compiled ${R(r.compiled)} yard ${R(r.yard)}`);
  const W = [['script start -> env', r.t0, mk.env0], ['makeEnv', mk.env0, mk.env1], ['env -> arena', mk.env1, mk.arena0], ['buildArena', mk.arena0, mk.arena1], ['arena life etc -> merge', mk.arena1, mk.merge0], ['mergeStatic', mk.merge0, mk.merge1], ['merge -> script done', mk.merge1, r.ready], ['script done -> built', r.ready, r.built], ['built -> compiled', r.built, r.compiled], ['compiled -> yard', r.compiled, r.yard]];
  console.log('ALL open->yard: ' + win(-r.t0, r.yard));
  if (process.env.LEAF) { const m = new Map(); for (let i = 0; i < profile.samples.length; i++) { const tp = tt[i] - off; if (tp > r.yard) continue; if (cat(profile.samples[i]) !== process.env.LEAF) continue; const f = nodes.get(profile.samples[i]).callFrame; const k = (f.url.split('/').pop() || '') + ':' + f.functionName; m.set(k, (m.get(k) || 0) + (dts[i + 1] || 0) / 1000); }
    console.log('  leaves: ' + [...m].sort((a, b) => b[1] - a[1]).slice(0, 15).map(([k, v]) => k + ' ' + v.toFixed(0)).join(', ')); }
  for (const [k, a, b] of W) if (a != null && b != null) console.log(`${k.padEnd(26)} ${String(R(b - a)).padStart(6)} ms wall: ${win(a, b)}`);
  await browser.close();
})();
