// A respawn match never ends: after enough wrecks every line of an event has been said once. Does the cast (and the announcer) go quiet?
const fs = require('fs'); const FILE = process.argv[2] || (process.env.GAME || require('path').join(__dirname, '..', 'index.html'));
const MOCK = () => { class U extends EventTarget { constructor(t) { super(); this.text = t; } } const S = { speaking: false, pending: false, paused: false, getVoices: () => ['Samantha', 'Fred', 'Daniel', 'Karen', 'Moira', 'Anna'].map((n) => ({ name: n, lang: n === 'Anna' ? 'de-DE' : 'en-US', localService: true, voiceURI: n })), speak(u) { setTimeout(() => u.dispatchEvent(new Event('start')), 20); }, cancel() {}, resume() {}, pause() {}, addEventListener() {} };
  Object.defineProperty(window, 'speechSynthesis', { value: S }); window.SpeechSynthesisUtterance = U; };
(async () => {
  const { browser, page, errors } = await require('./voices-h2').openMock(FILE, MOCK); await page.waitForTimeout(800);
  await page.evaluate(() => { __derby.S.aiCount = 5; window.__noRender = true; }); await page.click('#btnStart'); await page.waitForTimeout(3000);
  const r = await page.evaluate(() => { const b = __derby.barks, P = __derby.PERSONAS[0]; let nul = 0, shown = 0; const show0 = b.show; b.show = function () { shown++; };
    const sp = b.speak; b.speak = () => {};
    for (let i = 0; i < 400; i++) if (!b.compose(P, 'kill', { v: 'Bob', vcar: 'car', target: 'you', car: 'car' })) nul++;
    for (let i = 0; i < 200; i++) { b.lastT = -99; b.annT = -99; b.announce('crusher', { v: 'Bob' }, true); }
    b.show = show0; b.speak = sp;
    // banned-list exhaustion: a long session of hiccups gets every voice banned one by one. Then 3 minutes pass.
    b.voices = speechSynthesis.getVoices(); const all = b.voices;
    for (const v of all) { if (b.ban) b.ban(v, 'hung (test)', true); else (b.badVoices = b.badVoices || new Set()).add(v.name); }
    const before = (b.pickVoice(__derby.PERSONAS[0]) || {}).name || 'default';
    const pn = performance.now.bind(performance), skew = 180000; performance.now = () => pn() + skew; if (b.doctor) b.doctor();
    const after = (b.pickVoice(__derby.PERSONAS[0]) || {}).name || 'default'; performance.now = pn;
    return { nul, shown, used: b.used.size, before, after }; });
  await browser.close(); const pe = errors.filter((e) => e.startsWith('pageerror'));
  const pass = r.nul < 20 && r.shown > 180 && !pe.length && r.after !== 'default'; console.log(`${pass ? 'PASS' : 'FAIL'} line pool: ${r.nul}/400 character lines came back empty, announcer spoke ${r.shown}/200, ${r.used} remembered; every voice banned -> ${r.before}, 3 min later -> ${r.after} ${pe.join(' | ')}`); process.exit(pass ? 0 : 1);
})();
