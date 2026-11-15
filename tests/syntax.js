// The game is one HTML file with one big <script type="module">: check that it parses.
const fs = require('fs'), path = require('path'), { execFileSync } = require('child_process'), os = require('os');
const game = process.env.GAME || path.join(__dirname, '..', 'index.html');
const s = fs.readFileSync(game, 'utf8'), m = [...s.matchAll(/<script type="module">([\s\S]*?)<\/script>/g)].map((x) => x[1]);
if (!m.length) { console.log('SYNTAX FAIL: no module script'); process.exit(1); }
const f = path.join(os.tmpdir(), 'derby-syntax-check.mjs'); fs.writeFileSync(f, m.sort((a, b) => b.length - a.length)[0]);
try { execFileSync(process.execPath, ['--check', f], { stdio: 'inherit' }); console.log('SYNTAX OK'); } catch (e) { console.log('SYNTAX FAIL'); process.exit(1); }
