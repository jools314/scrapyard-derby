// End-to-end test of the recorded-voice layer (VCLIP): placeholder WAV clips for Kev, Tony Cement and the Sheriff's megaphone lines,
// served from a temp voices/ folder; Dom has no clips. Fake speech engine records what Web Speech was asked to say.
// node voiceclips-test.js [path/to/index.html]
const { chromium } = require('playwright'); const fs = require('fs'); const path = require('path'); const NM = path.join(__dirname, 'node_modules');
const FILE = process.argv[2] || require('path').join(__dirname, '..', 'index.html');
const VOICES_SRC = path.join(path.dirname(FILE), 'voices');
const TMP = path.join(__dirname, 'vc_tmp', 'voices');

// ---- placeholder clips: a short tone per line (WAV), a manifest, one entry pointing at a missing file ----
function wav(freq, secs, sr = 8000) { const n = Math.round(secs * sr), b = Buffer.alloc(44 + n * 2); b.write('RIFF', 0); b.writeUInt32LE(36 + n * 2, 4); b.write('WAVEfmt ', 8); b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20); b.writeUInt16LE(1, 22); b.writeUInt32LE(sr, 24); b.writeUInt32LE(sr * 2, 28); b.writeUInt16LE(2, 32); b.writeUInt16LE(16, 34); b.write('data', 36); b.writeUInt32LE(n * 2, 40); for (let i = 0; i < n; i++) b.writeInt16LE(Math.round(Math.sin(2 * Math.PI * freq * i / sr) * 8000 * Math.min(1, i / 200, (n - i) / 200)), 44 + i * 2); return b; }
const lines = JSON.parse(fs.readFileSync(path.join(VOICES_SRC, 'lines.json'), 'utf8'));
fs.rmSync(path.dirname(TMP), { recursive: true, force: true });
const WITH = { 'crash-cam-kev': 330, lulu: 520, 'tony-cement': 220, 'sheriff-buck': 440 };
const man = { version: 1, format: 'wav', clips: {} }; let missingLine = null;
for (const l of lines) {
  const f = WITH[l.character]; if (!f) continue;
  if (l.character === 'sheriff-buck' && l.ev !== 'mega') continue; // the sheriff only has his megaphone lines
  const rel = `clips/${l.character}/${l.id}.wav`;
  if (!missingLine && l.character === 'tony-cement' && l.ev === 'horn') { missingLine = l; man.clips[l.id] = [`clips/tony-cement/missing-${l.id}.wav`, 1]; continue; } // a clip whose file is gone
  fs.mkdirSync(path.join(TMP, path.dirname(rel)), { recursive: true }); fs.writeFileSync(path.join(TMP, rel), wav(f, 0.35)); man.clips[l.id] = [rel, 0.35];
}
fs.writeFileSync(path.join(TMP, 'manifest.json'), JSON.stringify(man));
const noClipTexts = new Set(lines.filter((l) => !man.clips[l.id]).map((l) => l.text)); // (shared template lines are said by clip-less drivers too)
const genericOf = new Map(lines.filter((l) => man.clips[l.id] && l.tpl).map((l) => [l.character + '|' + l.text, l.tpl])); // recorded name-free versions of templates
const MEGA_TEXTS = new Set(lines.filter((l) => l.ev === 'mega').map((l) => l.text));
const clipTexts = new Set(lines.filter((l) => man.clips[l.id] && l !== missingLine && !noClipTexts.has(l.text)).map((l) => l.text));
console.log(`placeholders: ${Object.keys(man.clips).length} clips (${fs.readdirSync(path.join(TMP, 'clips')).join(', ')}); missing-file line: "${missingLine.text}"`);

const INIT = () => {
  class U extends EventTarget { constructor(t) { super(); this.text = t; this.volume = 1; } }
  const S = { spoken: [], speaking: false, pending: false, paused: false, getVoices: () => [], speak(u) { this.spoken.push(u.text); setTimeout(() => { u.onstart && u.onstart(new Event('start')); u.dispatchEvent(new Event('start')); setTimeout(() => { u.onend && u.onend(new Event('end')); u.dispatchEvent(new Event('end')); }, 300); }, 20); }, cancel() {}, resume() {}, pause() {}, addEventListener() {} };
  Object.defineProperty(window, 'speechSynthesis', { value: S }); window.SpeechSynthesisUtterance = U;
  const tagged = new WeakSet(); window.__vc = { starts: 0, durs: [] }; // count every decoded clip that is started through Web Audio
  const dec = BaseAudioContext.prototype.decodeAudioData;
  BaseAudioContext.prototype.decodeAudioData = function (ab, ok, err) { return dec.call(this, ab, (b) => { tagged.add(b); ok && ok(b); }, err); };
  const st = AudioBufferSourceNode.prototype.start;
  AudioBufferSourceNode.prototype.start = function (...a) { if (this.buffer && tagged.has(this.buffer)) { window.__vc.starts++; window.__vc.durs.push(+this.buffer.duration.toFixed(2)); } return st.apply(this, a); };
};

(async () => {
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'] });
  const results = []; const ok = (name, pass, info) => { results.push(pass); console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${info ? '  ' + info : ''}`); };
  async function run(withManifest) {
    const page = await browser.newPage({ viewport: { width: 900, height: 560 } }); const errors = [], reqs = [];
    page.on('pageerror', (e) => errors.push('pageerror: ' + e.message)); page.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource|ERR_FAILED/.test(m.text())) errors.push('console: ' + m.text()); });
    await page.addInitScript(INIT);
    await page.route('**/*', async (route) => { const u = route.request().url();
      if (u.includes('three@0.160.0/build/three.module.js')) return route.fulfill({ contentType: 'application/javascript', body: fs.readFileSync(NM + '/three/build/three.module.js') });
      if (u.includes('three@0.160.0/examples/jsm/')) return route.fulfill({ contentType: 'application/javascript', body: fs.readFileSync(NM + '/three/examples/jsm/' + u.split('/examples/jsm/')[1]) });
      if (u.includes('cannon-es@0.20.0/dist/cannon-es.js')) return route.fulfill({ contentType: 'application/javascript', body: fs.readFileSync(NM + '/cannon-es/dist/cannon-es.js') });
      if (u.startsWith('http://game.local/voices/')) { reqs.push(u); const f = path.join(TMP, decodeURIComponent(new URL(u).pathname.slice('/voices/'.length))); if (!withManifest || !fs.existsSync(f)) return route.fulfill({ status: 404, body: 'not found' }); return route.fulfill({ contentType: f.endsWith('.json') ? 'application/json' : 'audio/wav', body: fs.readFileSync(f) }); }
      if (u.startsWith('http://game.local/')) return route.fulfill({ contentType: 'text/html', body: '<!doctype html><html><head><meta charset="utf-8"></head><body>' + fs.readFileSync(FILE, 'utf8') + '</body></html>' });
      return route.abort(); });
    await page.goto('http://game.local/'); await page.waitForFunction(() => window.__derby && window.__derby.VCLIP, null, { timeout: 120000 });
    if (withManifest) await page.waitForFunction(() => __derby.VCLIP.clips, null, { timeout: 30000 }); else await page.waitForTimeout(2000);
    await page.evaluate(() => { __derby.S.aiCount = 3; window.__noRender = true; document.getElementById('btnStart').click(); });
    await page.waitForFunction(() => __derby.game.state === 'playing' && __derby.game.countdown <= 0, null, { timeout: 120000 });
    await page.evaluate(() => { const D = __derby, ai = D.cars.filter((c) => !c.isPlayer); const find = (n) => D.PERSONAS.find((P) => P.nick === n);
      ai[0].persona = find('Tony Cement'); ai[1].persona = find('Dom'); ai[2].persona = D.COP; ai[0].name = 'Tony Cement'; ai[1].name = 'Dom'; window.__t = { tony: ai[0], dom: ai[1], cop: ai[2] }; });
    const snap = () => page.evaluate(() => ({ starts: __vc.starts, spoken: speechSynthesis.spoken.length, stats: { ...__derby.VCLIP.stats }, subs: document.getElementById('subs').textContent }));
    const act = async (fn, arg) => { const a = await snap(); const L0 = await page.evaluate(() => __derby.VCLIP.stats.clips); const line = await page.evaluate(fn, arg); await page.waitForTimeout(3000); const b = await snap();
      const newSpoken = await page.evaluate((n) => speechSynthesis.spoken.slice(n), a.spoken);
      const played = await page.evaluate((n) => __derby.VCLIP.log.slice(-(__derby.VCLIP.stats.clips - n)), L0); // the clips that started during this step
      return { a, b, line, newSpoken, played: b.stats.clips > L0 ? played : [] }; };
    if (withManifest) {
      let r = await act(() => { __derby.barks.say(__t.tony, 'gotHit', true); return [...document.querySelectorAll('#subs .sub')].map((d) => d.textContent).join(' | '); });
      const tonyLine = r.played.find((x) => x.who === 'Tony Cement');
      ok('Tony Cement bark plays a recorded clip through Web Audio', r.b.starts > r.a.starts && !!tonyLine, JSON.stringify(r.played));
      ok('  ...its caption is shown', !!tonyLine && r.line.includes(tonyLine.line), r.line);
      ok('  ...and Web Speech was not asked to say it', !!tonyLine && !r.newSpoken.includes(tonyLine.line), JSON.stringify(r.newSpoken));
      r = await act(() => { __derby.barks.say(__t.tony, 'rival', true, { v: 'Dom', vcar: 'Viper', target: 'you', car: 'Viper' }); return [...document.querySelectorAll('#subs .sub')].map((d) => d.textContent).join(' | '); });
      let g = r.played.find((x) => x.who === 'Tony Cement'); const tonyRoasts = await page.evaluate(() => __derby.ROAST_BY.get(__t.tony.persona).get('Dom'));
      ok('A rivalry line naming Dom is either the recorded name-free version or Tony\'s recorded roast of Dom, captioned as said', !!g && ((genericOf.has('tony-cement|' + g.line) && !/Dom|Viper/.test(g.line)) || tonyRoasts.includes(g.line)) && r.line.includes(g.line), JSON.stringify(g) + ' captions: ' + r.line);
      r = await act(() => { __derby.barks.lastT = -99; __derby.barks.announce('youWrecked', {}, true); });
      ok('Announcer line (Kev or Lulu) plays a recorded clip (PA effect)', r.played.some((x) => /Crash Cam Kev|Lulu/.test(x.who) && x.fx === 'pa'), JSON.stringify(r.played));
      r = await act(() => { __derby.barks.lastT = -99; __derby.barks.announce('intoCrusher', { a: 'Tony Cement', v: 'Dom' }, true); return [...document.querySelectorAll('#subs .sub')].map((d) => d.textContent).join(' | '); });
      g = r.played.find((x) => /Crash Cam Kev|Lulu/.test(x.who));
      ok('An announcer naming two drivers says the generic recorded call instead', !!g && genericOf.has((g.who === 'Lulu' ? 'lulu|' : 'crash-cam-kev|') + g.line) && !/Dom|Tony/.test(g.line) && r.line.includes(g.line), JSON.stringify(g || r.played));
      r = await act(() => { const seen = []; for (let i = 0; i < 4; i++) { __derby.barks.lastT = -99; __derby.barks.announce(['bigHit', 'wreck', 'youCrash', 'headOn'][i], { a: 'You', v: 'Dom', vcar: 'Viper', kmh: 80 }, true); seen.push(document.querySelector('#subs .sub:last-child b').textContent); } return seen.join(','); });
      ok('Kev and Lulu take turns on the calls', /Crash Cam Kev/.test(r.line) && /Lulu/.test(r.line), r.line);
      await page.evaluate(() => { window.__seen = []; new MutationObserver((ms) => { for (const m of ms) for (const n of m.addedNodes) window.__seen.push(n.textContent); }).observe(document.getElementById('subs'), { childList: true }); });
      const setup = () => page.evaluate(() => { const { tony, dom } = __t, p = __derby.player.body.position; for (const c of __derby.cars) if (c !== tony && c !== dom && !c.isPlayer) c.body.position.set(p.x - 60, c.body.position.y, p.z - 60);
        tony.body.position.set(p.x + 6, p.y + 0.5, p.z + 6); dom.body.position.set(p.x + 18, p.y + 0.5, p.z + 6); tony.body.velocity.set(11, 0, 0); dom.body.velocity.set(-11, 0, 0); __derby.barks.lastT = -99; tony.lastBark = -99; dom.lastBark = -99; window.__seen.length = 0; });
      const roastsTD = await page.evaluate(() => [...__derby.ROAST_BY.get(__t.tony.persona).get('Dom'), ...__derby.ROAST_BY.get(__t.dom.persona).get('Tony Cement')]);
      const isRoast = (t) => roastsTD.some((x) => t.endsWith(x.replace(/^B\|/, '')));
      let seen = [], allSeen = [];
      for (let tries = 0; tries < 4 && !seen.some(isRoast); tries++) { await setup(); await page.waitForTimeout(2500); seen = await page.evaluate(() => window.__seen.slice()); allSeen.push(...seen); } // (another driver's bark can take the slot first: try a few passes)
      ok('Close pass: a roast naming the other driver plays and is captioned', seen.some(isRoast), JSON.stringify(allSeen));
      const pairT = await page.evaluate(() => Object.fromEntries(__derby.ROAST_PAIR));
      await setup(); await page.waitForTimeout(2500);
      seen = await page.evaluate(() => window.__seen.slice()); const pairT2 = await page.evaluate(() => Object.fromEntries(__derby.ROAST_PAIR));
      ok('  ...and the same pair does not roast again within the cooldown', !seen.some(isRoast) && ['Tony Cement|Dom', 'Dom|Tony Cement'].every((k) => pairT[k] === pairT2[k]), JSON.stringify({ seen, pairT, pairT2 }));
      r = await act(() => { __derby.barks.lastT = -99; __derby.megaphone(__t.cop, 'backup'); });
      const mg = r.played.filter((x) => x.who === 'Sheriff Buck');
      ok('Sheriff megaphone line plays its clip with the megaphone filter', mg.length === 1 && mg[0].fx === 'megaphone' && MEGA_TEXTS.has(mg[0].line), JSON.stringify(r.played));
      r = await act(() => { __derby.barks.say(__t.dom, 'gotHit', true); return document.getElementById('subs').textContent; });
      const domSpoken = r.newSpoken.filter((x) => !/Welcome|Here we go/.test(x));
      ok('Dom (no clips) uses Web Speech', domSpoken.length >= 1 && r.b.stats.speech > r.a.stats.speech && !r.played.some((x) => x.who === 'Dom'), JSON.stringify(domSpoken));
      r = await act((t) => { const P = __derby.PERSONAS.find((P) => P.nick === 'Tony Cement'); __derby.barks.show(P, __t.tony.baseColor, t); __derby.barks.speak(P, t, __t.tony.body.position); }, missingLine.text);
      ok('A clip that fails to load falls back to Web Speech for that line', r.newSpoken.includes(missingLine.text) && r.b.stats.failed > r.a.stats.failed, JSON.stringify(r.newSpoken));
      await page.evaluate(() => document.getElementById('btnVoices').click());
      r = await act(() => { __derby.barks.say(__t.tony, 'taunt', true); __derby.barks.say(__t.dom, 'taunt', true); return 0; });
      ok('Voices off: no clip and no speech, captions still shown', r.b.starts === r.a.starts && r.newSpoken.length === 0 && r.b.subs.length > 0, `starts ${r.a.starts}->${r.b.starts}, spoken ${JSON.stringify(r.newSpoken)}, subs "${r.b.subs.slice(0, 60)}"`);
      await page.evaluate(() => document.getElementById('btnVoices').click());
      await page.waitForTimeout(12000); // let the match run: AI chatter on its own
      const all = await page.evaluate(() => ({ spoken: speechSynthesis.spoken, stats: __derby.VCLIP.stats, bytes: __derby.VCLIP.bytes, preloaded: __derby.VCLIP.stats.fetched }));
      const wrong = all.spoken.filter((x) => clipTexts.has(x));
      ok('Web Speech never used for a line that has a clip (whole match)', wrong.length === 0, `spoken ${all.spoken.length}, wrongly spoken: ${JSON.stringify(wrong.slice(0, 3))}; stats ${JSON.stringify(all.stats)}`);
      ok('Clips were preloaded for the drivers on track', all.preloaded > 5, `fetched ${all.preloaded}, decoded cache ${(all.bytes / 1e6).toFixed(2)} MB`);
    } else {
      const r = await act(() => { __derby.barks.say(__t.tony, 'gotHit', true); __derby.barks.say(__t.dom, 'gotHit', true); return [...document.querySelectorAll('#subs .sub')].map((d) => d.textContent).join(' | '); });
      const sp = r.newSpoken.filter((x) => !/Welcome|Here we go/.test(x));
      ok('No manifest: VCLIP stays off and the lines go to Web Speech as before', (await page.evaluate(() => __derby.VCLIP.clips)) === null && sp.length >= 2 && r.b.starts === r.a.starts && /Tony Cement.*Dom/.test(r.line) && sp.some((x) => r.line.includes(x)), JSON.stringify(sp) + ' captions: ' + r.line);
      ok('No manifest: only the manifest was requested', reqs.length === 1 && reqs[0].endsWith('/voices/manifest.json'), JSON.stringify(reqs));
    }
    ok(`no page errors (${withManifest ? 'with clips' : 'no manifest'})`, errors.length === 0, JSON.stringify(errors.slice(0, 3)));
    await page.close();
  }
  try { await run(true); await run(false); } catch (e) { console.log('ERROR', e.message); results.push(false); }
  await browser.close();
  console.log(results.every(Boolean) ? `ALL ${results.length} PASSED` : `${results.filter((x) => !x).length} FAILED of ${results.length}`);
})();
