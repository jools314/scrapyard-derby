// Yard pack generator: builds the yard procedurally in a headless browser (pack off), takes mergeStatic's merged scenery meshes
// (positions, normals, uvs, colours, indices as typed arrays), and writes them into index.html as YARDPACK_B64: one binary
// ('YPK1', a JSON header, the arrays 4-byte aligned), deflate-raw, base64. Run it after any change to the static scenery:
//   node tools/yardpack.js            (rewrites index.html)
//   node tools/yardpack.js --check    (exit 1 if the pack in index.html is not what the procedural build makes now)
// tests/yardpack.js runs the same check. Needs playwright (tests/node_modules or global) and the three/cannon copies in tests/node_modules.
const fs = require('fs'), path = require('path'), zlib = require('zlib'), crypto = require('crypto');
const ROOT = path.join(__dirname, '..');
const GAME = process.env.GAME || path.join(ROOT, 'index.html');
const RE = /const YARDPACK_B64 = '([A-Za-z0-9+/=]*)';/;
// in the page: mergeStatic's meshes -> { body (base64 of the aligned arrays), header groups, sig }
const grab = () => { const M = __derby.MERGED, parts = [], groups = []; let len = 0;
  const put = (a) => { const pad = (4 - (len & 3)) & 3; if (pad) { parts.push(new Uint8Array(pad)); len += pad; } const u = new Uint8Array(a.buffer, a.byteOffset, a.byteLength); parts.push(u); len += u.length; };
  for (const m of M.meshes) { if (!m) { groups.push(null); continue; } const g = m.geometry, at = [];
    for (const [k, a] of Object.entries(g.attributes)) { at.push([k, a.itemSize, a.normalized ? 1 : 0, a.array.constructor.name]); put(a.array); }
    const gd = { n: g.attributes.position.count, at }; if (g.index) { gd.it = g.index.array.constructor.name; gd.ic = g.index.count; put(g.index.array); } groups.push(gd); }
  const all = new Uint8Array(len); let o = 0; for (const p of parts) { all.set(p, o); o += p.length; }
  let s = ''; for (let i = 0; i < all.length; i += 0x8000) s += String.fromCharCode.apply(null, all.subarray(i, i + 0x8000));
  return { body: btoa(s), groups, sig: M.sig, pack: M.pack, before: M.before, after: M.after }; };
async function build(game, noPack) { // the yard as the page builds it: { body: Buffer, groups, sig, hash, pack }
  const H = require(path.join(ROOT, 'tests', 'harness'));
  const prev = process.env.GAME; process.env.GAME = game;
  const { browser, page, errors } = await H.open({ viewport: { width: 800, height: 600 } }, noPack ? () => { window.__noYardPack = true; } : null);
  if (prev === undefined) delete process.env.GAME; else process.env.GAME = prev;
  const r = digest(await page.evaluate(grab)); await browser.close(); r.errors = errors; return r;
}
function digest(r) { const body = Buffer.from(r.body, 'base64'); // (grab's result, hashed: what the pack must match)
  const hash = crypto.createHash('sha256').update(JSON.stringify(r.groups)).update(r.sig).update(body).digest('hex').slice(0, 16);
  return { body, groups: r.groups, sig: r.sig, hash, pack: r.pack, before: r.before, after: r.after }; }
function encode(b) { const hdr = Buffer.from(JSON.stringify({ v: 1, hash: b.hash, sig: b.sig, groups: b.groups }));
  const head = Buffer.alloc(8); head.writeUInt32LE(0x314b5059, 0); head.writeUInt32LE(hdr.length, 4);
  const pad = Buffer.alloc((4 - ((8 + hdr.length) & 3)) & 3); // (the page aligns from the header's end the same way)
  return Buffer.concat([head, hdr, pad, b.body]); }
function readPack(html) { const m = html.match(RE); if (!m || !m[1]) return null; const raw = zlib.inflateRawSync(Buffer.from(m[1], 'base64'));
  const hl = raw.readUInt32LE(4); return { b64: m[1].length, deflated: Buffer.from(m[1], 'base64').length, raw: raw.length, ...JSON.parse(raw.subarray(8, 8 + hl).toString()) }; }
module.exports = { build, grab, digest, encode, readPack, RE };
if (require.main === module) (async () => {
  const check = process.argv.includes('--check');
  const b = await build(GAME, true);
  const html = fs.readFileSync(GAME, 'utf8'), cur = readPack(html);
  if (check) { const ok = cur && cur.hash === b.hash; console.log(ok ? `YARDPACK OK (${b.hash})` : `YARDPACK STALE: index.html has ${cur ? cur.hash : 'no pack'}, the procedural build makes ${b.hash}: run node tools/yardpack.js`); process.exit(ok ? 0 : 1); }
  const raw = encode(b), z = zlib.deflateRawSync(raw, { level: 9 }), b64 = z.toString('base64');
  fs.writeFileSync(GAME, html.replace(RE, `const YARDPACK_B64 = '${b64}';`));
  console.log(`yard pack ${b.hash}: ${b.groups.filter(Boolean).length} merged meshes (${b.before} -> ${b.after}), raw ${raw.length} B, deflated ${z.length} B, base64 ${b64.length} B`);
})();
