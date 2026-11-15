// Dozer blade orientation test — Scrapyard Derby
//
// The dozer's mouldboard is a BoxGeometry plate whose vertices are bent along
// +x (the car's forward axis) by a displacement d(v), where v is the
// normalised height across the blade (-1 = bottom edge, +1 = top edge).
//
// A real dozer blade is CONCAVE toward the front: the middle of the face sits
// BACK and the top/bottom edges lead, so it scoops and rolls material.
// A convex blade (middle bulging forward) is the bug this test guards.
//
// Run: node tests/dozer-blade.test.mjs   (exit 0 = concave-forward, 1 = fail)

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const html = readFileSync(join(root, 'index.html'), 'utf8');

// Pull the bend expression out of the blade construction block.
const block = html.match(/const bladeGeo = new THREE\.BoxGeometry\(([^)]*)\)[\s\S]{0,600}?a\[i\] \+= ([^;]+);/);
if (!block) {
  console.error('FAIL: could not find the dozer blade bend (bladeGeo … a[i] += …) in index.html');
  process.exit(1);
}
const [, geoArgs, expr] = block;
const d = new Function('v', `return (${expr});`);

const segY = Number(geoArgs.split(',').map(s => s.trim())[4]);
const at = v => d(v);
const bottom = at(-1), mid = at(0), top = at(1);
const scoop = Math.min(top, bottom) - mid; // how far the face recedes at mid-height

console.log(`blade bend d(v) = ${expr}`);
console.log(`segments across height: ${segY}`);
console.log(`d(bottom edge, v=-1) = ${bottom.toFixed(3)}`);
console.log(`d(mid-height,  v= 0) = ${mid.toFixed(3)}`);
console.log(`d(top edge,    v=+1) = ${top.toFixed(3)}`);
console.log(`scoop depth (edges - mid) = ${scoop.toFixed(3)}`);

let fail = 0;
if (!(mid < top && mid < bottom)) {
  console.error('FAIL: mid-height is NOT behind both edges — blade is convex/flat toward the front, it cannot scoop.');
  fail = 1;
}
if (!(scoop > 0.15 && scoop < 0.30)) {
  console.error(`FAIL: scoop depth ${scoop.toFixed(3)} outside the expected 0.15–0.30 band (original curvature magnitude was 0.22).`);
  fail = 1;
}
if (!(segY >= 4)) {
  console.error('FAIL: blade geometry has too few height segments for the bend to read as a curve.');
  fail = 1;
}
if (!fail) console.log('PASS: dozer blade is concave toward the front (scoop orientation), curvature magnitude intact.');
process.exit(fail);
