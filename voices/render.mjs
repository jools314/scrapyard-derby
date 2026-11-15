#!/usr/bin/env node
// Scrapyard Derby: render every voice line once with ElevenLabs and write voices/clips/<character>/<id>.mp3 + voices/manifest.json.
// Node 18+ (global fetch), no packages. The key is read from the environment only: ELEVENLABS_API_KEY.
//
//   node voices/render.mjs --dry-run                 what would be rendered, characters billed, rough cost
//   node voices/render.mjs                           render everything missing (resumable: re-run after a stop or an error)
//   node voices/render.mjs --only big-hank,dom       just these characters (ids as in cast.json)
//   node voices/render.mjs --tier 2                  also the cab cameos and the 18 extra drivers (default: tier 1 = the 15 car characters + Kev)
//   node voices/render.mjs --max-chars 90000         stop once this many characters have been sent (stay inside a plan)
//   node voices/render.mjs --limit 20                render at most 20 clips (a test batch to listen to)
//   node voices/render.mjs --model eleven_v3         another model (eleven_v3 gets an [audio tag] from the style hint)
//   node voices/render.mjs --format mp3_22050_32     smaller files
//   node voices/render.mjs --concurrency 3           parallel requests (stay within your plan's concurrency limit)
//   node voices/render.mjs --force --only dom        re-render clips that already exist (after changing a voice)
//   node voices/render.mjs --use-fallbacks           use cast.json fallback_voice_id where voice_id is empty
//   node voices/render.mjs --suggest tony-cement     search the Voice Library for a character (prints voices to try)
//   node voices/render.mjs --add tony-cement <public_owner_id> <voice_id>   add a library voice to your account and to cast.json
//   node voices/render.mjs --design oberst-klaus     Voice Design: 3 preview voices from the description -> voices/design/<id>/
//   node voices/render.mjs --design-keep oberst-klaus <generated_voice_id>  save a preview voice and put it in cast.json
//   node voices/render.mjs --prune                   drop manifest entries (and files) for lines that are no longer in lines.json
//
// API used (https://elevenlabs.io/docs/api-reference):
//   POST https://api.elevenlabs.io/v1/text-to-speech/{voice_id}?output_format=mp3_44100_64
//        headers  xi-api-key: <key>, Content-Type: application/json, Accept: audio/mpeg
//        body     { text, model_id, voice_settings: { stability, similarity_boost, style, use_speaker_boost, speed }, seed,
//                 }   -> raw audio bytes
//   GET  /v1/shared-voices?search=&gender=&age=&accent=&language=en&page_size=   (Voice Library search)
//   POST /v1/voices/add/{public_owner_id}/{voice_id}  { new_name }               (add a library voice to My Voices)
//   POST /v1/text-to-voice/create-previews { voice_description, text }          (Voice Design previews)
//   POST /v1/text-to-voice/create-voice-from-preview { voice_name, voice_description, generated_voice_id }
// None of this could be tested against the real API from the build machine: see README "Unverified".
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const API = process.env.ELEVENLABS_API_BASE || 'https://api.elevenlabs.io'; // (override only for testing against a mock)
const argv = process.argv.slice(2);
const flag = (n) => argv.includes('--' + n);
const opt = (n, d) => { const i = argv.indexOf('--' + n); return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : d; };
const args = (n, k) => { const i = argv.indexOf('--' + n); return i >= 0 ? argv.slice(i + 1, i + 1 + k) : null; };
const readJSON = (f, d) => { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch (e) { if (d !== undefined) return d; throw e; } };

const CAST_F = path.join(HERE, 'cast.json'), LINES_F = path.join(HERE, 'lines.json'), MAN_F = path.join(HERE, 'manifest.json');
const cast = readJSON(CAST_F), lines = readJSON(LINES_F);
const man = readJSON(MAN_F, { version: 1, clips: {} });
const MODEL = opt('model', cast.defaults.model_id), FORMAT = opt('format', cast.defaults.output_format);
const KEY = process.env.ELEVENLABS_API_KEY || '';
const DRY = flag('dry-run');
const needKey = () => { if (!KEY) { console.error('Set ELEVENLABS_API_KEY first (export ELEVENLABS_API_KEY=...). It is only read from the environment.'); process.exit(2); } };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function api(method, url, body, accept = 'application/json', tries = 6) {
  for (let i = 0; ; i++) {
    let res;
    try { res = await fetch(API + url, { method, headers: { 'xi-api-key': KEY, 'Content-Type': 'application/json', Accept: accept }, body: body ? JSON.stringify(body) : undefined }); }
    catch (e) { if (i >= tries) throw e; await sleep(1000 * 2 ** i); continue; } // network blip
    if (res.ok) return accept.startsWith('audio') ? Buffer.from(await res.arrayBuffer()) : res.json();
    const txt = await res.text().catch(() => ''); let detail = txt; try { detail = JSON.parse(txt).detail || txt; } catch (e) {}
    const status = typeof detail === 'object' ? detail.status || '' : '';
    if ((res.status === 429 || res.status >= 500) && i < tries && status !== 'quota_exceeded') { // too many requests / concurrency / server: back off
      const ra = Number(res.headers.get('retry-after')); const wait = (ra > 0 ? ra * 1000 : 1500 * 2 ** i) + Math.random() * 500;
      console.warn(`  ${res.status} ${status || ''}: waiting ${(wait / 1000).toFixed(1)} s`); await sleep(wait); continue;
    }
    const err = new Error(`${method} ${url} -> ${res.status} ${typeof detail === 'object' ? JSON.stringify(detail) : String(detail).slice(0, 300)}`); err.status = res.status; err.fatal = res.status === 401 || status === 'quota_exceeded'; throw err;
  }
}

// mp3 duration from the frame headers (CBR or VBR; skips an ID3v2 tag)
function mp3Duration(buf) {
  let i = 0, samples = 0, sr = 0;
  if (buf.length > 10 && buf.toString('latin1', 0, 3) === 'ID3') i = 10 + ((buf[6] & 0x7f) << 21 | (buf[7] & 0x7f) << 14 | (buf[8] & 0x7f) << 7 | (buf[9] & 0x7f));
  const BR = { 1: [0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320], 2: [0, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160] };
  const SR = { 3: [44100, 48000, 32000], 2: [22050, 24000, 16000], 0: [11025, 12000, 8000] };
  while (i + 4 <= buf.length) {
    if (buf[i] !== 0xff || (buf[i + 1] & 0xe0) !== 0xe0) { i++; continue; }
    const ver = (buf[i + 1] >> 3) & 3, layer = (buf[i + 1] >> 1) & 3, bri = buf[i + 2] >> 4, sri = (buf[i + 2] >> 2) & 3, pad = (buf[i + 2] >> 1) & 1;
    if (ver === 1 || layer !== 1 || bri === 0 || bri === 15 || sri === 3) { i++; continue; } // layer III only
    const kbps = BR[ver === 3 ? 1 : 2][bri]; sr = SR[ver][sri];
    const spf = ver === 3 ? 1152 : 576, len = Math.floor((spf / 8) * kbps * 1000 / sr) + pad;
    samples += spf; i += len;
  }
  return sr ? Math.round(samples / sr * 1000) / 1000 : 0;
}
const ext = FORMAT.startsWith('mp3') ? 'mp3' : FORMAT.startsWith('opus') ? 'opus' : FORMAT.startsWith('pcm') ? 'pcm' : 'bin';

const V3_TAG = { gotHit: 'angry', hitYou: 'laughs', wrecked: 'dramatic', low: 'worried', wheel: 'alarmed', air: 'excited', taunt: 'mischievously', gloat: 'smug', flee: 'panicked', fire: 'shouting', charge: 'shouting', start: 'confident', crash: 'surprised', rival: 'mischievously', respawn: 'confident', kill: 'triumphant', burger: 'delighted', onFire: 'panicked', rodeo: 'excited', horn: 'shouting', mega: 'shouting' };
function requestFor(l) {
  const c = cast.characters[l.character] || {}, s = { ...cast.defaults.settings, ...(c.settings || {}) };
  let text = l.say;
  if (MODEL.startsWith('eleven_v3')) text = `[${l.character === 'crash-cam-kev' ? 'excited' : V3_TAG[l.ev] || 'excited'}] ` + text; // v3 reads audio tags; v2 would say them out loud
  const body = { text, model_id: MODEL, voice_settings: { stability: s.stability, similarity_boost: s.similarity_boost, style: s.style, use_speaker_boost: s.use_speaker_boost, speed: s.speed }, seed: parseInt(l.id.slice(0, 6), 36) % 4294967295 };
  return { voice: c.voice_id || (flag('use-fallbacks') ? c.fallback_voice_id : null), body };
}

function saveManifest() { man.version = 1; man.model = MODEL; man.format = ext; man.updated = new Date().toISOString(); man.fx = Object.fromEntries(Object.entries(cast.characters).filter(([, c]) => c.fx).map(([k, c]) => [k, c.fx])); /* the game adds these filters */ const tmp = MAN_F + '.tmp'; fs.writeFileSync(tmp, JSON.stringify(man, null, 0).replace(/\],"/g, '],\n"') + '\n'); fs.renameSync(tmp, MAN_F); }

// ---------- voice picking helpers ----------
if (flag('suggest')) {
  needKey(); const id = opt('suggest'); const c = cast.characters[id]; if (!c) { console.error('No such character in cast.json: ' + id); process.exit(2); }
  const acc = String(c.accent || '').split(/[ (]/)[0];
  for (const q of [{ search: c.library_search, gender: c.gender, accent: acc }, { search: c.library_search }, { gender: c.gender, age: c.age, accent: acc }]) {
    const p = new URLSearchParams({ page_size: '8', language: 'en', ...Object.fromEntries(Object.entries(q).filter(([, v]) => v)) });
    const r = await api('GET', '/v1/shared-voices?' + p); console.log(`\n${c.speaker}: ${JSON.stringify(q)}`);
    for (const v of r.voices || []) console.log(`  ${v.name} [${[v.gender, v.age, v.accent, v.descriptive, v.use_case].filter(Boolean).join(', ')}]\n    preview ${v.preview_url}\n    add: node voices/render.mjs --add ${id} ${v.public_owner_id} ${v.voice_id}`);
  }
  process.exit(0);
}
if (flag('add')) {
  needKey(); const [id, owner, vid] = args('add', 3); const c = cast.characters[id]; if (!c || !owner || !vid) { console.error('usage: --add <character> <public_owner_id> <voice_id>'); process.exit(2); }
  const r = await api('POST', `/v1/voices/add/${owner}/${vid}`, { new_name: `Derby ${c.speaker}`.slice(0, 40) });
  c.voice_id = r.voice_id || vid; c.voice_name = `Derby ${c.speaker}`; fs.writeFileSync(CAST_F, JSON.stringify(cast, null, 2) + '\n'); console.log(`${c.speaker} -> ${c.voice_id} (saved in cast.json)`); process.exit(0);
}
if (flag('design')) {
  needKey(); const id = opt('design'); const c = cast.characters[id]; if (!c) { console.error('No such character: ' + id); process.exit(2); }
  let text = ''; for (const l of lines) if (l.character === id && text.length < 260) text += (text ? ' ' : '') + l.say; // a sample of their own lines (the API wants 100-1000 characters)
  const r = await api('POST', '/v1/text-to-voice/create-previews', { voice_description: c.description, text: text.padEnd(110, ' And that is that.') });
  const dir = path.join(HERE, 'design', id); fs.mkdirSync(dir, { recursive: true });
  for (const p of r.previews || []) { const f = path.join(dir, p.generated_voice_id + '.mp3'); fs.writeFileSync(f, Buffer.from(p.audio_base_64, 'base64')); console.log(`  listen: ${f}\n  keep:   node voices/render.mjs --design-keep ${id} ${p.generated_voice_id}`); }
  process.exit(0);
}
if (flag('design-keep')) {
  needKey(); const [id, gid] = args('design-keep', 2); const c = cast.characters[id];
  const r = await api('POST', '/v1/text-to-voice/create-voice-from-preview', { voice_name: `Derby ${c.speaker}`.slice(0, 40), voice_description: c.description, generated_voice_id: gid });
  c.voice_id = r.voice_id; c.voice_name = `Derby ${c.speaker} (designed)`; fs.writeFileSync(CAST_F, JSON.stringify(cast, null, 2) + '\n'); console.log(`${c.speaker} -> ${c.voice_id} (saved in cast.json)`); process.exit(0);
}
if (flag('prune')) {
  const keep = new Set(lines.map((l) => l.id)); let n = 0;
  for (const [id, [p]] of Object.entries(man.clips)) if (!keep.has(id)) { delete man.clips[id]; try { fs.unlinkSync(path.join(HERE, p)); } catch (e) {} n++; }
  saveManifest(); console.log(`pruned ${n} clips`); process.exit(0);
}

// ---------- render ----------
const only = opt('only') ? new Set(opt('only').split(',')) : null, tier = Number(opt('tier', only ? 9 : 1));
const maxChars = Number(opt('max-chars', Infinity)), limit = Number(opt('limit', Infinity)), conc = Math.max(1, Number(opt('concurrency', 2)));
const have = (l) => !flag('force') && man.clips[l.id] && fs.existsSync(path.join(HERE, man.clips[l.id][0]));
let todo = lines.filter((l) => (!only || only.has(l.character)) && (l.tier || 1) <= tier && !have(l)).sort((a, b) => a.tier - b.tier); // main cast first
const noVoice = new Set(todo.filter((l) => !requestFor(l).voice).map((l) => l.character));
let budget = 0; todo = todo.filter((l) => { if (budget + l.say.length > maxChars) return false; budget += l.say.length; return true; }).slice(0, limit);
const chars = todo.reduce((s, l) => s + l.say.length, 0) + (MODEL.startsWith('eleven_v3') ? todo.length * 10 : 0);
const credits = Math.round(chars * (/flash|turbo/.test(MODEL) ? 0.5 : 1));
const byChar = {}; for (const l of todo) byChar[l.character] = (byChar[l.character] || 0) + l.say.length;

console.log(`${todo.length} clips to render (${Object.keys(man.clips).length} already in manifest.json), ${chars.toLocaleString()} characters = ~${credits.toLocaleString()} credits on ${MODEL}.`);
if (DRY || flag('verbose')) for (const [c, n] of Object.entries(byChar).sort((a, b) => b[1] - a[1])) console.log(`  ${c.padEnd(28)} ${String(n).padStart(7)} chars${noVoice.has(c) ? '   (no voice_id in cast.json yet)' : ''}`);
if (DRY) {
  // Plan prices as published in 2025 (USD/month; check https://elevenlabs.io/pricing before buying): credits included, overage per 1k.
  const plans = [['Starter', 5, 30000, null], ['Creator', 22, 100000, 0.30], ['Pro', 99, 500000, 0.24], ['Scale', 330, 2000000, 0.18]];
  console.log('Rough cost for a one-off render (one month of a plan, cancel after):');
  for (const [n, usd, inc, over] of plans) { if (credits <= inc) { console.log(`  ${n}: $${usd} (fits in ${inc.toLocaleString()} credits)`); continue; } if (over) console.log(`  ${n}: $${usd} + ~$${Math.ceil((credits - inc) / 1000 * over)} overage = ~$${usd + Math.ceil((credits - inc) / 1000 * over)}`); }
  if (noVoice.size) console.log(`No voice_id yet for: ${[...noVoice].join(', ')}. Pick voices first (--suggest / --design, or edit cast.json), or pass --use-fallbacks.`);
  process.exit(0);
}
needKey();
if (noVoice.size) { console.warn(`Skipping (no voice_id in cast.json): ${[...noVoice].join(', ')}`); todo = todo.filter((l) => !noVoice.has(l.character)); }
let done = 0, sent = 0, failed = 0, stop = false, lastSave = Date.now();
process.on('SIGINT', () => { if (stop) process.exit(1); stop = true; console.log('\nstopping after the requests in flight (Ctrl-C again to quit now)'); });
async function worker() {
  while (!stop && todo.length) {
    const l = todo.shift(), { voice, body } = requestFor(l);
    try {
      const buf = await api('POST', `/v1/text-to-speech/${voice}?output_format=${FORMAT}`, body, ext === 'mp3' ? 'audio/mpeg' : '*/*');
      const rel = `clips/${l.character}/${l.id}.${ext}`, f = path.join(HERE, rel); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, buf);
      man.clips[l.id] = [rel, ext === 'mp3' ? mp3Duration(buf) : 0]; done++; sent += l.say.length;
      if (done % 25 === 0 || Date.now() - lastSave > 15000) { saveManifest(); lastSave = Date.now(); }
      if (done % 10 === 0 || flag('verbose')) console.log(`  ${done} done, ${todo.length} left, ${sent.toLocaleString()} chars sent  (${l.character}: ${l.say.slice(0, 50)})`);
    } catch (e) {
      failed++; console.error(`  FAILED ${l.id} (${l.character}: "${l.say.slice(0, 40)}"): ${e.message}`);
      if (e.fatal) { stop = true; console.error('Stopping: the key was refused or the quota is used up.'); }
      else if (e.status === 404) { stop = true; console.error(`Voice ${voice} not found: fix voice_id for ${l.character} in cast.json.`); }
      if (failed > 20 && failed > done) { stop = true; console.error('Too many failures, stopping.'); }
    }
  }
}
await Promise.all(Array.from({ length: conc }, worker));
saveManifest();
console.log(`Rendered ${done} clips (${sent.toLocaleString()} characters), ${failed} failed. manifest.json now has ${Object.keys(man.clips).length} clips.${todo.length ? ' Run again to continue.' : ''}`);
