// The game is one HTML file with one big <script type="module">: check that it parses.
const fs = require('fs'), path = require('path'), { execFileSync } = require('child_process'), os = require('os');
const game = process.env.GAME || path.join(__dirname, '..', 'index.html');
const s = fs.readFileSync(game, 'utf8'), m = [...s.matchAll(/<script type="module">([\s\S]*?)<\/script>/g)].map((x) => x[1]);
if (!m.length) { console.log('SYNTAX FAIL: no module script'); process.exit(1); }
const f = path.join(os.tmpdir(), 'derby-syntax-check.mjs'); fs.writeFileSync(f, m.sort((a, b) => b.length - a.length)[0]);
// the build number lives in three places that must agree: the script's BUILD, the <meta name=derby-build> the watchdog reads, and version.txt
const b1 = (s.match(/const BUILD = '(\d+)'/) || [])[1], b2 = (s.match(/<meta name="derby-build" content="(\d+)"/) || [])[1];
let b3 = null; try { b3 = fs.readFileSync(path.join(path.dirname(game), 'version.txt'), 'utf8').trim(); } catch (e) {}
if (!b1 || b1 !== b2 || (b3 !== null && b3 !== b1)) { console.log(`SYNTAX FAIL: build numbers disagree: BUILD ${b1}, meta ${b2}, version.txt ${b3}`); process.exit(1); }
try { execFileSync(process.execPath, ['--check', f], { stdio: 'inherit' }); console.log('SYNTAX OK'); } catch (e) { console.log('SYNTAX FAIL'); process.exit(1); }
