// The WATCH / multiplayer snapshot packs each car's state into one flags number (B[11]). Every branch that adds a car state takes bits, and
// two branches can take the same ones: the Buzzsaw Hover was built on Build 124 with 4096 (off its cushion) and 8192 (skirt down), and the
// spider's Builds 127-128 took 4096 (the big downward laser) and bits 13-14 (how much of a web's hold is left). This reads the host's packing
// expression and the guest's unpacking lines straight out of index.html, packs every state alone and some together, unpacks them, and
// checks each one comes back as itself and nothing else (a webbed-down car must not look like a hovercraft with its skirt down, a big beam
// must not lift a hovercraft off its cushion on the guests' screens). No browser needed. Prints HOVERNET PASS / HOVERNET FAIL.
// Fails on the plain rebase of the hovercraft branch onto Build 129 (hover flags on 4096/8192). Run: node tests/hovernet.js (GAME= overrides the file).
const fs = require('fs'), path = require('path');
const src = fs.readFileSync(process.env.GAME || path.join(__dirname, '..', 'index.html'), 'utf8');
const fails = []; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails.push(m); };
// the host: the flags element of each car's row in MP.hostFrame
const pk = src.match(/\n\s*(\(c\.wrecked \? 1 : 0\) \| \(c\.boosting \? 2 : 0\)[^\n]*?),\s*(?:\/\/[^\n]*)?\n/);
ok(!!pk, 'found the host\'s flag packing');
// the guest: every line that reads a flag out of B[11]
const un = src.split('\n').filter((l) => /^\s*c\.net\w+ = /.test(l) && l.includes('B[11]')).map((l) => l.replace(/\/\/.*$/, ''));
ok(un.length >= 3, `found the guest's flag unpacking (${un.length} lines)`);
if (pk && un.length) {
  const webLeft = (t) => (t.webbedT > 0 ? Math.max(0, Math.min(1, t.webbedT / (t.webHold0 || t.webbedT))) : 0);
  const pack = new Function('c', 'webLeft', 'return ' + pk[1]);
  const unpack = new Function('B', 'const c = {};\n' + un.join('\n') + '\nreturn c;');
  const base = { wrecked: false, boosting: false, braking: false, sirenOn: false, turretGone: false, burnT: 0, webbedT: 0, latch: null, laserT: 0, laserPin: false, hovAir: false, hovUp: false, skirtDown: false };
  // each state, and what the guest must see for it (net* fields; everything else must stay off)
  const S = {
    webbed: [{ webbedT: 3, webHold0: 3 }, { netWebbed: true, netWebQ: 3 }],
    webbedLast: [{ webbedT: 0.5, webHold0: 3 }, { netWebbed: true, netWebQ: 1 }],
    latched: [{ latch: {} }, { netLatched: true }],
    laser: [{ laserT: 1 }, { netLaser: true }],
    bigBeam: [{ laserT: 1, laserPin: true }, { netLaser: true, netLaserPin: true }],
    hoverAir: [{ hovAir: true }, { netAir: true }],
    hoverUp: [{ hovUp: true }, { netAir: true }],
    skirt: [{ skirtDown: true }, { netSkirt: true }],
  };
  const flags = ['netWebbed', 'netLatched', 'netLaser', 'netLaserPin', 'netAir', 'netSkirt'], q = (c) => c.netWebQ || 0;
  const check = (name, ...ks) => { const st = Object.assign({}, base, ...ks.map((k) => S[k][0])), want = Object.assign({}, ...ks.map((k) => S[k][1]));
    const g = unpack([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 100, pack(st, webLeft)]), bad = flags.filter((f) => !!g[f] !== !!want[f]);
    if (q(g) !== (want.netWebQ || 0)) bad.push(`netWebQ ${q(g)} (want ${want.netWebQ || 0})`);
    ok(!bad.length, `${name}: the guest sees ${flags.filter((f) => g[f]).concat(q(g) ? ['netWebQ ' + q(g)] : []).join(', ') || 'nothing'}${bad.length ? ' — wrong: ' + bad.join(', ') : ''}`); };
  for (const k of Object.keys(S)) check(k, k);
  check('a hovercraft webbed down (full hold)', 'webbed', 'hoverAir');
  check('a hovercraft webbed down, skirt dropped', 'webbedLast', 'skirt');
  check('a spider riding a boosted hovercraft, big beam on', 'bigBeam', 'hoverUp', 'webbed');
  // and no two packed constants share a bit (the web hold's two bits included)
  const consts = [...pk[1].matchAll(/\? (\d+) : 0\)/g)].map((m) => +m[1]), shifts = [...pk[1].matchAll(/\) << (\d+) : 0\)/g)].map((m) => 3 << +m[1]);
  const all = consts.concat(shifts); let clash = []; for (let i = 0; i < all.length; i++) for (let j = i + 1; j < all.length; j++) if (all[i] & all[j]) clash.push(`${all[i]} & ${all[j]}`);
  ok(!clash.length, `no two flags share a bit (${all.join(', ')})${clash.length ? ' — clash: ' + clash.join(', ') : ''}`);
}
console.log(fails.length ? 'HOVERNET FAIL' : 'HOVERNET PASS'); process.exit(fails.length ? 1 : 0);
