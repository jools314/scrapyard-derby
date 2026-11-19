// Voice path: when a recorded clip exists, the line is heard as that clip, not as a computer voice; music plays; the play log says why when it doesn't.
// Real voices/manifest.json (every clip id the game knows), one short placeholder WAV served for every clip file, a fake speech engine with
// French, German and English voices that records what Web Speech was asked to say and in which voice.
//  1. audio context suspended (iPhone interruption, a tab coming back, a page that started without a tap): a recorded line asks the context to
//     resume and waits a moment for it, then plays as the clip - never as Web Speech, never both;
//  2. a context that will not resume: after the grace the line goes to Web Speech once, and the clip queue is not left stuck; a resume or fetch that
//     arrives after that hand-off never starts the clip; an error after the clip started never adds Web Speech; a context that stops mid-clip frees the queue;
//  3. sfx.init() also wakes an 'interrupted' context (WebKit), and a tap sets navigator.audioSession.type = 'playback' (iPhone silent switch);
//  4. the tap that takes over from autoplay also wakes the audio (autoplay made the context without a tap);
//  5. a long respawn session: composed lines (templates with recorded name-free versions, used-up pools) stay recorded clips, Kev and Lulu too,
//     and lines the talk governor drops are not used up;
//  6. the Web Speech fallback never reads English with a French/German/Cantonese voice; only a line that is itself German (the tourist) may;
//  7. the play-log match record has a voice block (clips, speech fallbacks by reason, audio context samples, music) and the bug report says it too;
//  8. music starts after a tap and is actually sounding (an analyser on the music bus), and comes back after the context was suspended.
const { chromium } = require('playwright'); const fs = require('fs'); const path = require('path'); const NM = path.join(__dirname, 'node_modules');
const FILE = process.env.GAME || path.join(__dirname, '..', 'index.html');
const MAN = fs.readFileSync(path.join(__dirname, '..', 'voices', 'manifest.json'));
function wav(freq, secs, sr = 8000) { const n = Math.round(secs * sr), b = Buffer.alloc(44 + n * 2); b.write('RIFF', 0); b.writeUInt32LE(36 + n * 2, 4); b.write('WAVEfmt ', 8); b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20); b.writeUInt16LE(1, 22); b.writeUInt32LE(sr, 24); b.writeUInt32LE(sr * 2, 28); b.writeUInt16LE(2, 32); b.writeUInt16LE(16, 34); b.write('data', 36); b.writeUInt32LE(n * 2, 40);
  for (let i = 0; i < n; i++) b.writeInt16LE(Math.round(Math.sin(2 * Math.PI * freq * i / sr) * 9000), 44 + i * 2); return b; }
const WAV = wav(330, 0.4);
const INIT = () => {
  class U extends EventTarget { constructor(t) { super(); this.text = t; this.volume = 1; this.rate = 1; this.pitch = 1; this.voice = null; this.lang = ''; } }
  const V = [['Thomas', 'fr-FR'], ['Amelie', 'fr-CA'], ['Anna', 'de-DE'], ['Markus', 'de-DE'], ['Sin-ji', 'zh-HK'], ['Paulina', 'es-MX'], ['Ioana', 'ro-RO'], ['Nora', 'nb-NO'], ['Daniel', 'en-GB'], ['Samantha', 'en-US'], ['Karen', 'en-AU'], ['Moira', 'en-IE'], ['Rishi', 'en-IN'], ['Tessa', 'en-ZA']].map(([name, lang]) => ({ name, lang, localService: true, voiceURI: name, default: false }));
  const S = { spoken: [], speaking: false, pending: false, paused: false, getVoices: () => V, speak(u) { this.spoken.push({ text: u.text, voice: u.voice ? u.voice.name : '', lang: u.voice ? u.voice.lang : '' }); setTimeout(() => { u.onstart && u.onstart(new Event('start')); u.dispatchEvent(new Event('start')); setTimeout(() => { u.onend && u.onend(new Event('end')); u.dispatchEvent(new Event('end')); }, 200); }, 20); }, cancel() {}, resume() {}, pause() {}, addEventListener() {}, onvoiceschanged: null };
  Object.defineProperty(window, 'speechSynthesis', { value: S }); window.SpeechSynthesisUtterance = U;
  try { Object.defineProperty(navigator, 'audioSession', { value: { type: 'auto' }, configurable: true }); } catch (e) {}
  const tagged = new WeakSet(); window.__vc = { starts: [] }; // every decoded clip started through Web Audio, with the context's state at that moment
  const dec = BaseAudioContext.prototype.decodeAudioData;
  BaseAudioContext.prototype.decodeAudioData = function (ab, ok, err) { return dec.call(this, ab, (b) => { tagged.add(b); ok && ok(b); }, err); };
  const st = AudioBufferSourceNode.prototype.start;
  AudioBufferSourceNode.prototype.start = function (...a) { if (this.buffer && tagged.has(this.buffer)) window.__vc.starts.push({ state: this.context.state, t: performance.now() }); return st.apply(this, a); };
};
(async () => {
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'] });
  const fails = []; const ok = (name, pass, info) => { console.log(`${pass ? 'PASS' : 'FAIL'} ${name}${info !== undefined ? '  ' + (typeof info === 'string' ? info : JSON.stringify(info)) : ''}`); if (!pass) fails.push(name); };
  const page = await browser.newPage({ viewport: { width: 900, height: 560 } }); const errors = [];
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message)); page.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource|ERR_FAILED/.test(m.text())) errors.push('console: ' + m.text()); });
  await page.addInitScript(INIT);
  await page.route('**/*', async (route) => { const u = route.request().url();
    if (u.includes('three@0.160.0/build/three.module.js')) return route.fulfill({ contentType: 'application/javascript', body: fs.readFileSync(NM + '/three/build/three.module.js') });
    if (u.includes('three@0.160.0/examples/jsm/')) return route.fulfill({ contentType: 'application/javascript', body: fs.readFileSync(NM + '/three/examples/jsm/' + u.split('/examples/jsm/')[1]) });
    if (u.includes('cannon-es@0.20.0/dist/cannon-es.js')) return route.fulfill({ contentType: 'application/javascript', body: fs.readFileSync(NM + '/cannon-es/dist/cannon-es.js') });
    if (u.startsWith('http://game.local/voices/manifest.json')) return route.fulfill({ contentType: 'application/json', body: MAN });
    if (u.startsWith('http://game.local/voices/clips/')) return route.fulfill({ contentType: 'audio/wav', body: WAV });
    if (u.startsWith('http://game.local/')) return route.fulfill({ contentType: 'text/html', body: '<!doctype html><html><head><meta charset="utf-8"></head><body>' + fs.readFileSync(FILE, 'utf8') + '</body></html>' });
    return route.abort(); });
  try {
    await page.goto('http://game.local/'); await page.waitForFunction(() => window.__derby && window.__derby.VCLIP && window.__derby.VCLIP.clips, null, { timeout: 120000 });

    // ---- 4. autoplay made the audio context without a tap; the tap that takes the game back must wake it ----
    await page.evaluate(() => { window.__noRender = true; __derby.S.aiCount = 3; __derby.AUTO.start(); });
    await page.waitForFunction(() => __derby.AUTO.on && __derby.sfx.ctx, null, { timeout: 60000 });
    await page.waitForTimeout(1200); // (apStop ignores taps in autoplay's first 800 ms)
    await page.evaluate(() => __derby.sfx.ctx.suspend()); // (what Chrome does to a context made before any tap)
    await page.mouse.click(450, 280);
    await page.waitForTimeout(400);
    const ap = await page.evaluate(() => ({ on: __derby.AUTO.on, state: __derby.sfx.ctx.state, muted: __derby.sfx.muted }));
    ok('the tap that stops autoplay also wakes the audio (music and recorded voices are not left silent)', !ap.on && ap.state === 'running' && !ap.muted, ap);

    // ---- 3. audioSession + interrupted ----
    const sess = await page.evaluate(() => navigator.audioSession && navigator.audioSession.type);
    ok('a tap sets navigator.audioSession.type to playback (the iPhone silent switch no longer mutes the game but not the computer voices)', sess === 'playback', { type: sess });
    const intr = await page.evaluate(() => { const c = __derby.sfx.ctx; let called = 0; const r0 = c.resume; Object.defineProperty(c, 'state', { configurable: true, get: () => 'interrupted' }); c.resume = () => { called++; return Promise.resolve(); };
      try { __derby.sfx.init(); } catch (e) {} delete c.state; c.resume = r0; return { called }; });
    ok('sfx.init() resumes an interrupted context too (WebKit after a call, Siri or the app switcher)', intr.called >= 1, intr);

    // ---- match ----
    await page.evaluate(() => { __derby.S.aiCount = 3; document.getElementById('btnStart').click(); });
    await page.waitForFunction(() => __derby.game.state === 'playing' && __derby.game.countdown <= 0, null, { timeout: 120000 });
    await page.evaluate(() => { const D = __derby; window.__tony = D.PERSONAS.find((P) => P.nick === 'Tony Cement'); const T = D.TALK; T.gate = () => true; /* (pacing is talk.js's job) */ window.__ann = D.barks.announce; window.__say = D.barks.say; D.barks.say = () => {}; D.barks.announce = () => {}; });
    const tonyLine = await page.evaluate(() => { const D = __derby, P = __tony; for (const ev of Object.keys(P.lines)) for (const l of P.lines[ev]) if (!/\{/.test(l) && D.VCLIP.id(P, l)) return l; return null; });

    // ---- 8a. music after the tap ----
    const rms = (ms) => page.evaluate(async (ms) => { const s = __derby.sfx, a = s.ctx.createAnalyser(); a.fftSize = 2048; s.mbus.connect(a); const buf = new Float32Array(2048); let sum = 0, n = 0;
      for (let i = 0; i < ms / 100; i++) { await new Promise((r) => setTimeout(r, 100)); a.getFloatTimeDomainData(buf); for (const x of buf) { sum += x * x; n++; } } s.mbus.disconnect(a); return { rms: +Math.sqrt(sum / n).toFixed(4), state: s.ctx.state, playing: s.musicPlaying, on: s.musicOn }; }, ms);
    let mu = await rms(4000);
    ok('music is on and sounding after a tap (analyser on the music bus)', mu.on && mu.playing && mu.state === 'running' && mu.rms > 0.002, mu);

    // The AI keeps playing during these steps and the police cruiser's megaphone calls barks.speak itself (Build 116 flake: "two clip starts"
    // were Tony's line plus Sheriff Buck's "Stop resisting!"), so every clip start is tagged with its line and only Tony's line is counted.
    await page.evaluate(() => { const L = __derby.VCLIP.log, push = L.push; L.push = function (e) { const s = __vc.starts[__vc.starts.length - 1]; if (s && !s.line) { s.who = e.who; s.line = e.line; } return push.apply(this, arguments); }; });
    // Each step's fake resume() is dead once the step ends, so a slow promise from one step can't wake the context in the next one.
    const STEP = `const D = __derby, V = D.VCLIP, c = D.sfx.ctx, r0 = AudioContext.prototype.resume.bind(c); V.stopAll(); delete c.resume; await c.suspend();
      const s0 = speechSynthesis.spoken.length, v0 = __vc.starts.length, said = () => speechSynthesis.spoken.slice(s0).map((x) => x.text).filter((x) => x === line).length,
        clips = () => __vc.starts.slice(v0).filter((x) => x.line === line), mine = () => !!(V.cur && V.cur.line === line), wait = (ms) => new Promise((r) => setTimeout(r, ms));
      let live = true, asked = 0; const end = () => { live = false; delete c.resume; };`;
    const step = (body) => page.evaluate(new Function('line', `return (async () => { ${STEP} ${body} })();`), tonyLine);

    // ---- 1. suspended context that resumes within the grace ----
    const r1 = await step(`c.resume = () => { asked++; return new Promise((res) => setTimeout(() => { if (live) r0().then(res); else res(); }, 300)); }; /* the browser takes a moment */
      D.barks.speak(__tony, line, D.player.body.position); for (let i = 0; i < 60 && !clips().length; i++) await wait(100); await wait(1200); end();
      return { asked, state: c.state, said: said(), clips: clips(), busy: mine() };`);
    ok('suspended context: the recorded line asks it to resume, then plays as the clip once it runs (once)', r1.asked >= 1 && r1.clips.length === 1 && r1.clips[0].state === 'running', r1);
    ok('  ...and Web Speech was not asked to say it (never both), and the queue is free after the clip', r1.said === 0 && !r1.busy, r1);

    // ---- 2. a context that will not resume ----
    const r2 = await step(`c.resume = () => Promise.resolve(); /* stays suspended (no tap yet) */
      D.barks.speak(__tony, line, D.player.body.position); for (let i = 0; i < 80 && !said(); i++) await wait(100); const mid = { said: said(), clips: clips().length, busy: mine() };
      end(); await r0(); await wait(1500); return { ...mid, saidAfter: said(), clipsAfter: clips().length, busyAfter: mine() };`);
    ok('a context that stays suspended: after the grace the line is spoken by Web Speech, exactly once', r2.said === 1 && r2.saidAfter === 1, r2);
    ok('  ...its clip is never started into the silent context, nor later on top of the speech, and the clip queue is free again', r2.clips === 0 && r2.clipsAfter === 0 && !r2.busy && !r2.busyAfter, r2);

    // ---- 2b. the race: the resume (and the clip's fetch) only arrive after the line has gone to Web Speech ----
    // Ordered by events, not by timing: resume() holds until the line has been handed to speech, so the order is the same on a fast machine and a 20 fps Chromebook.
    const r2b = await step(`const g0 = V.get; V.get = (id) => new Promise((res, rej) => { const k = () => (said() ? g0.call(V, id).then(res, rej) : setTimeout(k, 20)); k(); });
      c.resume = () => { asked++; return new Promise((res) => { const k = () => (!live ? res() : said() ? r0().then(res) : setTimeout(k, 20)); k(); }); };
      D.barks.speak(__tony, line, D.player.body.position); for (let i = 0; i < 80 && !said(); i++) await wait(100); await wait(2500); V.get = g0; end();
      return { asked, state: c.state, said: said(), clips: clips().length, busy: mine() };`);
    ok('late resume and late fetch after the hand-off to Web Speech: the line is said once and its clip never starts', r2b.said === 1 && r2b.clips === 0 && !r2b.busy && r2b.state === 'running', r2b);

    // ---- 2c. an error after the clip has started must not send the line to Web Speech as well ----
    const r2c = await step(`await r0(); const d0 = V.duck; V.duck = () => { V.duck = d0; throw new Error('test: after start'); };
      D.barks.speak(__tony, line, D.player.body.position); for (let i = 0; i < 40 && !clips().length; i++) await wait(50); const busyNow = mine(); await wait(400); const saidNow = said();
      await wait(2200); V.duck = d0; end(); return { clips: clips().length, said: saidNow, busyWhilePlaying: busyNow, busyAfter: mine() };`);
    ok('an error after the clip started: the clip plays, Web Speech does not also say it, and the clip owns the queue until it ends', r2c.clips === 1 && r2c.said === 0 && r2c.busyWhilePlaying && !r2c.busyAfter, r2c);

    // ---- 2d. the context stops in the middle of a clip ('ended' never comes): the queue must still be freed ----
    const r2d = await step(`await r0(); c.resume = () => Promise.resolve(); D.barks.speak(__tony, line, D.player.body.position); for (let i = 0; i < 40 && !clips().length; i++) await wait(25);
      await c.suspend(); /* an iPhone call / the app switcher, mid-line */ await wait(2600); const busy = mine(); end(); await r0(); return { clips: clips().length, busy, cur: V.cur ? V.cur.who + ': ' + V.cur.line : null };`);
    ok('the context stops mid-clip: the clip queue is freed by itself (it used to wait for the next line to notice)', r2d.clips === 1 && !r2d.busy, r2d);

    // ---- 8b. music comes back after the context was suspended (tab switch / interruption) ----
    await page.evaluate(async () => { await __derby.sfx.ctx.suspend(); document.dispatchEvent(new Event('visibilitychange')); }); // back from another tab or app, no tap yet
    mu = await rms(3000);
    ok('after the context was suspended (tab or app switch), coming back brings the music back without waiting for Start', mu.state === 'running' && mu.rms > 0.002, mu);

    // ---- 5. long session: composed lines stay recorded ----
    // Drivers still waiting for the owner's voice pick (cast.json: no voice_id yet) speak with the browser voice until they are cast,
    // so they are left out of the 'recorded clips' share (Typhoon Tomoko, Build 131; same rule as voicelines.js).
    const UNCAST = Object.values(JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'voices', 'cast.json'), 'utf8')).characters || {}).filter((c) => c && !c.voice_id && c.speaker).map((c) => c.speaker);
    const r5 = await page.evaluate((UNCAST) => { const D = __derby, B = D.barks, V = D.VCLIP; const evs = ['taunt', 'gotHit', 'fire', 'hitYou', 'charge', 'wrecked', 'wheel', 'gloat', 'air', 'low', 'flee', 'rodeo', 'rival', 'respawn', 'onFire', 'kill', 'crash', 'burger'];
      const Ps = [...Object.values(D.CAR_CAST), D.COP].filter((P) => !UNCAST.includes(P.nick)), names = Ps.map((P) => P.nick); B.used.clear(); let clip = 0, n = 0, tplClip = 0, tplN = 0; const miss = {};
      for (let i = 0; i < 2000; i++) { const P = Ps[i % Ps.length], ev = evs[(Math.random() * evs.length) | 0], o = names[(Math.random() * names.length) | 0];
        const vars = Math.random() < 0.5 ? { target: 'you', car: 'Viper', v: 'you', vcar: 'Viper' } : { target: o, car: 'Dozer', v: o, vcar: 'Dozer' };
        const line = B.compose(P, ev, vars); if (!line) continue; const has = !!V.id(P, line); if (i >= 1000) { n++; if (has) clip++; else { const k = P.nick + ':' + ev; miss[k] = (miss[k] || 0) + 1; } } }
      let ann = 0, annN = 0; const A = ['bigHit', 'wreck', 'aiHit', 'youCrash', 'headOn', 'intoCrusher', 'carFire', 'air', 'wheel', 'burger'];
      const sp = B.speak, sh = B.show; B.speak = (P, l) => { annN++; if (V.id(P, l)) ann++; }; B.show = () => {}; B.used.clear();
      for (let i = 0; i < 600; i++) { B.lastT = -99; B.annT = -99; __ann.call(B, A[i % A.length], { a: 'Dom', v: 'Tony Cement', vcar: 'Mixer', kmh: 80 }, true); }
      B.speak = sp; B.show = sh;
      return { late: n ? Math.round(clip / n * 100) : 0, n, ann: annN ? Math.round(ann / annN * 100) : 0, annN, topMiss: Object.entries(miss).sort((a, b) => b[1] - a[1]).slice(0, 6), uncast: UNCAST }; }, UNCAST).catch((e) => ({ err: e.message }));
    ok('a long respawn session: at least 97% of the drivers\' composed lines (lines 1000-2000) are recorded clips', r5.late >= 97, r5);
    ok('  ...and at least 97% of Kev and Lulu\'s calls over 600 calls', r5.ann >= 97 && r5.annN >= 500, r5);

    // ---- 5b. lines the talk governor drops were never heard: they must not use up the recorded lines (Build 114: ~30 dropped per line heard) ----
    const r5b = await page.evaluate(() => { const D = __derby, B = D.barks, T = D.TALK, g = T.gate; B.used.clear(); T.gate = () => false; const c = D.cars.find((x) => !x.isPlayer && x.persona && !x.wrecked);
      for (let i = 0; i < 60; i++) { c.lastBark = -99; B.lastT = -99; __say.call(B, c, ['taunt', 'gotHit', 'hitYou'][i % 3], true, { target: 'you', car: 'Viper', v: 'you', vcar: 'Viper' }); }
      const n = B.used.size; T.gate = g; return { used: n, who: c.persona.nick }; });
    ok('lines the talk governor drops are not marked as said (they no longer burn through the recorded lines)', r5b.used === 0, r5b);

    // ---- 6. English voices only for English text ----
    const r6 = await page.evaluate(() => { const D = __derby, B = D.barks; B.voices = speechSynthesis.getVoices(); const bad = [], seen = {};
      const all = [...D.PERSONAS, D.COP, D.ANNOUNCER, D.SHAZZA, D.TOURIST].filter(Boolean); for (const P of [...all]) { if (P.duo) all.push({ ...P, ...P.duo }); if (P.trio) all.push({ ...P, ...P.trio }); }
      for (const P of all) { const v = B.pickVoice(P, 'Get out of my way, you big lump!'); seen[P.nick] = v ? v.lang : 'default'; if (!v || !/^en/i.test(v.lang)) bad.push(P.nick + ' -> ' + (v ? v.name + ' ' + v.lang : 'default')); }
      const de = D.TOURIST ? B.pickVoice(D.TOURIST, 'Achtung! Wir sind im Urlaub!') : null;
      const jac = D.PERSONAS.find((P) => P.nick === 'Papa Jacques'), s0 = speechSynthesis.spoken.length; D.VCLIP.stopAll(); B.holdUntil = 0; B.speak(jac, 'Zis line was never recorded, mon ami!', D.player.body.position);
      return { bad, de: de ? de.lang : null, jac: speechSynthesis.spoken.slice(s0), flavour: { kev: seen['Crash Cam Kev'], seamus: seen.Seamus, lulu: seen.Lulu, jacques: seen['Papa Jacques'], klaus: seen['Oberst Klaus'] } }; });
    ok('Web Speech fallback picks an English voice for every character speaking English (no French/German/Cantonese voice reading English)', r6.bad.length === 0, r6.bad.length ? r6.bad.slice(0, 6) : r6.flavour);
    ok('  ...keeping the accent through English locales (Kev en-AU, Seamus en-IE)', r6.flavour.kev === 'en-AU' && r6.flavour.seamus === 'en-IE', r6.flavour);
    ok('  ...a line that is itself German (the tourist in the RV) may use a German voice', /^de/i.test(r6.de || ''), { de: r6.de });
    ok('  ...and an unrecorded Papa Jacques line really goes out in an English voice', r6.jac.length === 1 && /^en/i.test(r6.jac[0].lang), r6.jac);

    // ---- 7. play log + bug report ----
    const r7 = await page.evaluate(() => { const D = __derby; const r = D.PLAYLOG.finish('test'); const txt = D.NETLOG.exportText(); return { vox: r && r.vox, line: (txt.split('\n').find((l) => /^Recorded voices:/.test(l)) || '') }; });
    const vx = r7.vox || {};
    ok('the play-log match record has a voice block: clips played and speech fallbacks by reason', !!r7.vox && vx.clips >= 1 && vx.speech && vx.speech.suspended >= 1 && vx.speech.noClip >= 1 && ['noCtx', 'suspended', 'muted', 'vol0', 'noClip', 'failed'].every((k) => typeof vx.speech[k] === 'number'), r7.vox);
    ok('  ...audio context state samples, music status and the audio session', !!r7.vox && vx.ctx && vx.ctx.running >= 1 && vx.music && typeof vx.music.on === 'boolean' && vx.music.ok >= 1 && vx.session === 'playback', r7.vox && { ctx: vx.ctx, music: vx.music, session: vx.session });
    ok('the bug report / network log has a "Recorded voices:" line with the same', /clips/.test(r7.line) && /suspended/.test(r7.line) && /music/i.test(r7.line), r7.line);
  } catch (e) { ok('test ran', false, e.stack || e.message); }
  ok('no page errors', errors.length === 0, errors.slice(0, 3));
  await browser.close();
  console.log(fails.length ? `VOICEPATH FAIL (${fails.length}): ${fails.join(' | ')}` : 'VOICEPATH PASS'); process.exit(fails.length ? 1 : 0);
})();
