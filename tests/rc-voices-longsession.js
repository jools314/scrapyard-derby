// Long-session speech test: a fake Chrome/macOS speech engine that develops real-world faults part way through a match,
// then checks the game keeps talking (lines actually start) and logs what it did.
// usage: node voices-longsession.js [scenario|all] [htmlFile]
const { open } = require('./harness'); const fs = require('fs');
const FILE = process.argv[3] || (process.env.GAME || require('path').join(__dirname, '..', 'index.html'));
const FAULT_AT = 12000, TOTAL = +(process.env.TOTAL || 70000), WIN = 30000;
const MOCK = () => {
  class U extends EventTarget { constructor(t) { super(); this.text = t; this.volume = 1; this.rate = 1; this.pitch = 1; this.voice = null; this.lang = ''; } }
  const fire = (u, type, extra) => { if (!u) return; if (S.fault === 'noevents' && S.faultOn) return; const e = new Event(type); Object.assign(e, { elapsedTime: 700, error: extra }); if (u['on' + type]) u['on' + type](e); u.dispatchEvent(e); };
  const L = (n, lang) => ({ name: n, lang, localService: true, default: n === 'Samantha', voiceURI: n });
  const G = (n, lang) => ({ name: n, lang, localService: false, default: false, voiceURI: n });
  const VOICES = [L('Samantha', 'en-US'), L('Fred', 'en-US'), L('Ralph', 'en-US'), L('Daniel', 'en-GB'), L('Karen', 'en-AU'), L('Moira', 'en-IE'), L('Anna', 'de-DE'), L('Thomas', 'fr-FR'), L('Alice', 'it-IT'),
    G('Google US English', 'en-US'), G('Google UK English Male', 'en-GB'), G('Google Deutsch', 'de-DE'), G('Google español', 'es-ES'), G('Google 日本語', 'ja-JP'), G('Google русский', 'ru-RU'), G('Google svenska', 'sv-SE'), G('Google português do Brasil', 'pt-BR')];
  const S = window.__ss = { q: [], cur: null, wedged: false, lastCancel: -1e9, lastSpeak: -1e9, spoken: [], speaking: false, pending: false, paused: false, fault: '', faultOn: false, dead: false, reviveAt: 0, ghost: false, calls: { speak: 0, cancel: 0, resume: 0 },
    getVoices() { return VOICES; },
    speak(u) { this.calls.speak++; const now = performance.now();
      if (now - this.lastCancel < 100) this.wedged = true; // speak in the same instant as a cancel
      if (this.dead && this.reviveAt) { if (now >= this.reviveAt) { this.dead = false; this.reviveAt = 0; } else this.reviveAt = now + 1200; } // a dead engine needs a quiet spell after a cancel
      this.lastSpeak = now; this.q.push(this.weak ? new WeakRef(u) : u); this.upd(); this.pump(); },
    cancel() { this.calls.cancel++; const now = performance.now(); if (now - this.lastSpeak < 300 && (this.cur || this.q.length)) { this.wedgeNext = true; } // cancel right after a speak: leaves it 'speaking' forever
      this.lastCancel = now; const all = [...(this.cur ? [this.cur] : []), ...this.q].map((x) => x && x.deref ? x.deref() : x); this.q = []; this.cur = null; this.ghost = false; this.wedged = !!this.wedgeNext; this.wedgeNext = false;
      if (this.dead) this.reviveAt = now + 1200;
      for (const u of all) fire(u, 'error', 'canceled'); this.upd(); },
    resume() { this.calls.resume++; if (this.paused) { this.paused = false; this.upd(); this.pump(); } }, pause() { this.paused = true; this.upd(); },
    upd() { this.speaking = !!this.cur || this.wedged || this.ghost || (this.dead && this.q.length > 0); this.pending = this.q.length > 0 || this.wedged; },
    pump() { if (this.cur || this.wedged || this.ghost || this.paused || this.dead || !this.q.length) return; let u = this.q.shift(); if (u && u.deref) { u = u.deref(); if (!u) { this.ghost = true; this.upd(); return; } }
      this.cur = u; this.upd();
      if (u.voice && !u.voice.localService && this.fault === 'net' && this.faultOn) return;
      if (this.fault === 'ban' && this.faultOn) return; // spells where nothing starts (the whole engine, not any one voice): every voice tried then gets the blame. 'net': network voice gone: hangs forever, no events
      setTimeout(() => { if (this.cur !== u) return; fire(u, 'start'); this.spoken.push({ t: performance.now(), v: u.voice ? u.voice.name : 'default' }); setTimeout(() => { if (this.cur !== u) return; this.cur = null; fire(u, 'end'); this.upd(); this.pump(); }, 700); }, 40); },
    addEventListener() {}, removeEventListener() {}, onvoiceschanged: null };
  Object.defineProperty(window, 'speechSynthesis', { value: S }); window.SpeechSynthesisUtterance = U;
  let hid = false; Object.defineProperty(document, 'hidden', { get: () => hid, configurable: true }); Object.defineProperty(document, 'visibilityState', { get: () => hid ? 'hidden' : 'visible', configurable: true });
  window.__setHidden = (h) => { hid = h; if (h) { S.paused = true; if (S.cur) { S.cur = null; S.ghost = true; } S.upd(); } document.dispatchEvent(new Event('visibilitychange')); }; // Chrome pauses a hidden tab's speech and the line in flight never reports back
};
async function run(sc) {
  const o = await require('./voices-h2').openMock(FILE, MOCK);
  const { browser, page, errors } = o; await page.waitForTimeout(800);
  await page.evaluate(() => { __derby.S.aiCount = 5; window.__noRender = true; }); await page.click('#btnStart');
  await page.evaluate(([sc, FAULT_AT]) => { // a steady stream of lines from the whole cast (plus whatever the match says), the way a long session goes
    const P = __derby.PERSONAS, t0 = performance.now(); let n = 0; window.__t0 = t0;
    if (sc === 'gc') __ss.weak = true;
    const tick = () => { if (document.hidden) return setTimeout(tick, 400); const p = P[(Math.random() * P.length) | 0]; __derby.barks.speak(p, 'Line number ' + (++n) + ' from ' + p.nick, null); if (Math.random() < 0.25) setTimeout(() => __derby.barks.speak(P[(Math.random() * P.length) | 0], 'Burst ' + n, null), 250); setTimeout(tick, 1200 + Math.random() * 900); };
    tick();
    setTimeout(() => { __ss.fault = sc; __ss.faultOn = true; if (sc === 'dead') __ss.dead = true; if (sc === 'ban') { let k = 0; const flip = setInterval(() => { __ss.faultOn = !__ss.faultOn; if (++k >= 7) { clearInterval(flip); __ss.faultOn = false; } }, 6000); } if (sc === 'hidden') { __setHidden(true); setTimeout(() => __setHidden(false), 8000); } }, FAULT_AT);
  }, [sc, FAULT_AT]);
  const gcLoop = sc === 'gc' ? setInterval(() => page.requestGC().catch(() => {}), 700) : null;
  await page.waitForTimeout(TOTAL);
  if (gcLoop) clearInterval(gcLoop);
  const r = await page.evaluate((WIN) => { const now = performance.now(); return { total: __ss.spoken.length, beforeFault: __ss.spoken.filter((s) => s.t - window.__t0 < 12000).length, lastWin: __ss.spoken.filter((s) => now - s.t < WIN).length,
    voicesLastWin: [...new Set(__ss.spoken.filter((s) => now - s.t < WIN).map((s) => s.v))], calls: __ss.calls, state: { speaking: __ss.speaking, pending: __ss.pending, paused: __ss.paused, dead: __ss.dead, wedged: __ss.wedged, q: __ss.q.length },
    ok: __derby.barks.speechOK, banned: (() => { const b = __derby.barks.badVoices, t = performance.now(); if (!b) return []; if (b instanceof Map) return [...b].filter(([, v]) => v.until > t).map(([n]) => n); return [...b]; })(), stats: __derby.barks.stats, inc: __derby.NETLOG.inc.filter((x) => /voice/.test(x.what)).map((x) => x.what.slice(0, 150)), report: __derby.NETLOG.exportText().split('\n').filter((l) => /^Voices:|voices:/.test(l)).length }; }, WIN);
  await browser.close();
  // in the last 30 s the driver asks for ~20 lines (plus match chatter); most of them should be heard
  const net = sc === 'net'; const pass = r.lastWin >= 10 && r.ok !== false && !errors.some((e) => e.startsWith('pageerror')) && (sc === 'noevents' || sc === 'none' || sc === 'gc' || r.inc.length > 0) && (!net || r.voicesLastWin.every((v) => !v.startsWith('Google'))) && (sc !== 'ban' || r.banned.filter((n) => !n.startsWith('Google')).length <= 2);
  console.log(`${pass ? 'PASS' : 'FAIL'} ${sc}: heard ${r.lastWin} lines in the last ${WIN / 1000} s (total ${r.total}, ${r.beforeFault} before the fault) voices=${r.voicesLastWin.join('|')} engine=${JSON.stringify(r.state)} calls=${JSON.stringify(r.calls)} ok=${r.ok} banned=${r.banned.join('|')} stats=${JSON.stringify(r.stats)}`);
  for (const i of r.inc.slice(-8)) console.log('    incident: ' + i);
  if (errors.length) console.log('    errors: ' + errors.slice(0, 3).join(' | '));
  return pass;
}
(async () => {
  const which = process.argv[2] || 'all', list = which === 'all' ? ['none', 'net', 'dead', 'hidden', 'noevents', 'gc', 'ban'] : which.split(',');
  const res = []; const conc = +(process.env.CONC || 3); for (let i = 0; i < list.length; i += conc) res.push(...await Promise.all(list.slice(i, i + conc).map((s, k) => new Promise((ok) => setTimeout(ok, k * 6000)).then(() => run(s)))));
  console.log(res.every(Boolean) ? 'ALL PASS' : 'SOME FAILED'); process.exit(res.every(Boolean) ? 0 : 1);
})();
