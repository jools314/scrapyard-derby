#!/usr/bin/env node
// R2-78: browser smoke test — load the game headless, start autoplay via the
// window.__derby hooks, run it, and fail on any page exception or error.
//
//   node tests/smoke.mjs [--secs 25] [--url http://localhost:8000/]
//
// Without --url it serves the repo root itself on an ephemeral port.
// Exit codes: 0 = passed · 1 = failed · 3 = SKIPPED (no Chrome/Chromium found —
// set CHROME=/path/to/chrome). The sandbox this round was built in has no browser,
// so there it verifies the skip path only; on a dev machine or CI with Chrome it
// runs for real. It never pretends: a skip is printed as a skip.
import { spawn } from 'node:child_process';
import { existsSync, createReadStream } from 'node:fs';
import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';
import { dirname, join, extname } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const secs = Number((process.argv.find((a) => a.startsWith('--secs=')) || '--secs=25').split('=')[1]);
const urlArg = (process.argv.find((a) => a.startsWith('--url=')) || '').split('=')[1];
const CANDIDATES = [process.env.CHROME, 'google-chrome', 'google-chrome-stable', 'chromium', 'chromium-browser', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'].filter(Boolean);
import { execFileSync } from 'node:child_process';
function findChrome() { for (const c of CANDIDATES) { if (c.includes('/')) { if (existsSync(c)) return c; } else { try { return execFileSync('which', [c], { encoding: 'utf8' }).trim(); } catch { /* next */ } } } return null; }
const chrome = findChrome();
if (!chrome) { console.log('SKIPPED: no Chrome/Chromium found (set CHROME=/path/to/chrome) — smoke test not run'); process.exit(3); }

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.webmanifest': 'application/manifest+json' };
let server = null, base = urlArg;
if (!base) {
  server = createServer((req, res) => { const p = join(root, req.url === '/' ? 'index.html' : req.url.split('?')[0]); if (!p.startsWith(root) || !existsSync(p)) { res.writeHead(404); res.end(); return; } res.writeHead(200, { 'content-type': MIME[extname(p)] || 'application/octet-stream' }); createReadStream(p).pipe(res); });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  base = `http://127.0.0.1:${server.address().port}/`;
}
const port = 9300 + (process.pid % 400);
const proc = spawn(chrome, ['--headless=new', '--disable-gpu', '--no-sandbox', `--remote-debugging-port=${port}`, `--user-data-dir=/tmp/derby-smoke-${process.pid}`, 'about:blank'], { stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let ws, nextId = 1; const pending = new Map(); const exceptions = [];
function send(method, params = {}) { const id = nextId++; ws.send(JSON.stringify({ id, method, params })); return new Promise((res, rej) => pending.set(id, { res, rej })); }
async function evalJs(expression) { const r = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true }); if (r.exceptionDetails) throw new Error(r.exceptionDetails.text || 'eval failed'); return r.result && r.result.value; }
let failed = '';
try {
  let target = null;
  for (let i = 0; i < 50 && !target; i++) { try { const r = await fetch(`http://127.0.0.1:${port}/json/new?${encodeURIComponent(base + '?smoke=1')}`, { method: 'PUT' }); target = await r.json(); } catch { await sleep(200); } }
  if (!target) throw new Error('chrome debugging target never appeared');
  ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
  ws.onmessage = (ev) => { const m = JSON.parse(ev.data); if (m.id && pending.has(m.id)) { const p = pending.get(m.id); pending.delete(m.id); m.error ? p.rej(new Error(m.error.message)) : p.res(m.result); } if (m.method === 'Runtime.exceptionThrown') exceptions.push(m.params.exceptionDetails.text || 'exception'); };
  await send('Runtime.enable');
  let booted = false;
  for (let i = 0; i < 60 && !booted; i++) { try { booted = await evalJs('!!(window.__derby && window.__derby.AUTO)'); } catch { /* page still loading */ } if (!booted) await sleep(500); }
  if (!booted) throw new Error('window.__derby never appeared — the game did not boot');
  await evalJs('window.__derby.AUTO.start()');
  await sleep(1500);
  const on = await evalJs('window.__derby.AUTO.on');
  if (!on) throw new Error('autoplay did not start');
  console.log(`smoke: game booted, autoplay running — observing ${secs}s…`);
  await sleep(secs * 1000);
  const state = await evalJs('({ state: window.__derby.game.state, cars: window.__derby.cars.length, matches: window.__derby.PLAYLOG.matches().length })');
  if (exceptions.length) throw new Error(`${exceptions.length} page exception(s): ${exceptions[0]}`);
  if (!state || state.cars < 2) throw new Error('no cars in the yard: ' + JSON.stringify(state));
  console.log(`SMOKE PASS: state=${state.state} cars=${state.cars} logged matches=${state.matches}, zero page exceptions in ${secs}s of autoplay`);
} catch (e) { failed = e.message; console.log('SMOKE FAIL: ' + failed); }
try { ws && ws.close(); } catch { /* already closed */ }
proc.kill('SIGKILL'); if (server) server.close();
process.exit(failed ? 1 : 0);
