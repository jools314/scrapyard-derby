#!/usr/bin/env python3
"""Scrapyard Derby play-log analyser.
Reads every play log / bug report pulled from the drop, de-duplicates records (uploads overlap: a match is checkpointed
every 3 min, the last checkpoint wins), and writes a report focused on things we can act on:
stuck hotspots (clustered positions + vehicles), physics safety-net catches per vehicle per hour, foreground fps and
what caused slow moments, errors, voice failures, balance (kills/deaths per vehicle), autoplay health, browser throttling.
Compares with the previous report so new or worse problems stand out."""
import glob, json, os, sys, re, collections, math, time
ARCH, OUT = sys.argv[1], sys.argv[2]
recs = []
for f in sorted(glob.glob(os.path.join(ARCH, '*playlog*.txt')) + glob.glob(os.path.join(ARCH, '*-msg.txt'))):
    for line in open(f, errors='replace'):
        line = line.strip()
        if line.startswith('{'):
            try: recs.append(json.loads(line))
            except Exception: pass
bugs = [b for b in sorted(glob.glob(os.path.join(ARCH, '*bug-*.txt'))) if 'game.local' not in open(b, errors='replace').read(400)] # (test runs serve the game from game.local)
sessions = {r['sid']: r for r in recs if r.get('kind') == 'session'}
matches = {}
for r in recs:
    if r.get('kind') in ('ck', 'match') and r.get('id'):
        if r.get('game', 0) >= matches.get(r['id'], {}).get('game', -1): matches[r['id']] = r
ms = sorted(matches.values(), key=lambda r: r.get('start', ''))
TEST_DEV = ('web',)  # headless test runs upload as device "web"
def dev_name(r):
    d = r.get('device', '') or ''
    return d.split('·')[0].strip() or 'web'
def is_test(r): # automated test runs: tagged by the game from build 67 (navigator.webdriver), or a software GPU on Linux
    d = r.get('device') or ''; return bool(r.get('test')) or 'SwiftShader' in d or ('Linux' in (r.get('ua') or '') and d.startswith('other'))
real = [m for m in ms if not is_test(m)]
oerr = [r for r in recs if r.get('kind') == 'errors' and not is_test(sessions.get(r.get('sid'), r))]
def mins(xs): return round(sum(m.get('game', 0) for m in xs) / 60, 1)
L = []; J = {}
now = time.strftime('%Y-%m-%d %H:%M UTC', time.gmtime())
L.append(f'# Scrapyard Derby play-log report · {now}\n')
L.append(f'{len(ms)} matches ({len(real)} from real devices, {mins(real)} game-minutes), {len(sessions)} page loads, {len(bugs)} bug reports.\n')
# --- devices / builds / roles
L.append('## Who and what\n')
dv = collections.Counter((dev_name(m), m.get('build'), m.get('role')) for m in real)
for (d, b, role), n in sorted(dv.items(), key=lambda x: (-int(x[0][1] or 0), x[0][0])): L.append(f'- {d} · build {b} · {role}: {n} matches')
latest = max([int(m.get('build') or 0) for m in real] or [0]); J['latestBuild'] = latest
L.append('')
# --- performance (foreground only from build 67: frames while throttled are already excluded by the game)
L.append('## Performance (foreground)\n')
for d in sorted({dev_name(m) for m in real}):
    xs = [m for m in real if dev_name(m) == d and (m.get('fps') or {}).get('frames', 0) > 300]
    if not xs: continue
    med = sorted(m['fps']['med'] for m in xs)[len(xs) // 2]; low = sorted(m['fps']['low1'] for m in xs)[len(xs) // 2]; worst = max(m['fps']['worstMs'] for m in xs)
    q = collections.Counter((m.get('q') or {}).get('end') for m in xs).most_common(1)[0][0]; res = collections.Counter((m.get('q') or {}).get('res') for m in xs).most_common(1)[0][0]
    env = [m.get('env') for m in xs if m.get('env')]
    thr = sum(e.get('throttledS', 0) + e.get('hiddenS', 0) for e in env)
    L.append(f'- **{d}**: fps median {med}, typical 1% low {low}, worst frame {worst} ms · quality {q}, res {res}% · {len(xs)} matches' + (f' · {thr} s throttled/hidden (excluded)' if env else ' · (pre-67: throttling not tracked)'))
    J.setdefault('perf', {})[d] = {'med': med, 'low1': low, 'worst': worst}
# release-to-release trend: the same numbers per build, per device (real, foreground play)
L.append('### Release to release\n')
L.append('| device | build | matches | game-min | fps med | p5 | 1% low | worst ms | res | slow s/h | stuck/h | phys catches/h | throttled s | inside/h |')
L.append('|---|---|---|---|---|---|---|---|---|---|---|---|---|---|')
J['trend'] = {}
TR = []
def inside_rate(xs): # cars inside objects per game-hour, over the matches that record it (the host/solo/autoplay side, from the build that added it); None = not recorded
    ys = [m for m in xs if isinstance(m.get('inside'), dict)]
    if not ys: return None
    return round(sum(m['inside'].get('n', 0) for m in ys) / max(0.01, sum(m.get('game', 0) for m in ys) / 60) * 60, 1)
for d in sorted({dev_name(m) for m in real}):
    for b in sorted({m.get('build') for m in real if dev_name(m) == d}, key=lambda x: int(x or 0)):
        xs = [m for m in real if dev_name(m) == d and m.get('build') == b and (m.get('fps') or {}).get('frames', 0) > 300]
        if not xs: continue
        mn = sum(m.get('game', 0) for m in xs) / 60 or 0.01; md = lambda k: sorted(m['fps'][k] for m in xs)[len(xs) // 2]
        slow = sum((m.get('slow') or {}).get('secs', 0) for m in xs); stk = sum((m.get('stuck') or {}).get('n', 0) for m in xs); ph = sum((m.get('phys') or {}).get('blowups', 0) for m in xs)
        res = collections.Counter((m.get('q') or {}).get('res') for m in xs).most_common(1)[0][0]
        thr = sum((m.get('env') or {}).get('throttledS', 0) + (m.get('env') or {}).get('hiddenS', 0) for m in xs) if any(m.get('env') for m in xs) else '–'
        ins = inside_rate(xs)
        L.append(f"| {d} | {b} | {len(xs)} | {round(mn)} | {md('med')} | {md('p5')} | {md('low1')} | {max(m['fps']['worstMs'] for m in xs)} | {res}% | {round(slow / mn * 60, 1)} | {round(stk / mn * 60)} | {round(ph / mn * 60)} | {thr} | {'–' if ins is None else ins} |")
        J['trend'][f'{d}/{b}'] = {'low1': md('low1'), 'med': md('med')}
        TR.append({'device': d, 'build': int(b or 0), 'matches': len(xs), 'gameMin': round(mn, 1), 'fpsMed': md('med'), 'fpsP5': md('p5'), 'fpsLow1': md('low1'),
                   'worstMs': max(m['fps']['worstMs'] for m in xs), 'resPct': res, 'slowSecPerHour': round(slow / mn * 60, 1), 'stuckPerHour': round(stk / mn * 60, 1),
                   'physPerHour': round(ph / mn * 60, 1), 'throttledSec': thr if thr != '–' else None, 'insidePerHour': ins})
L.append('')
# --- regression check (thresholds from QUALITY-GATES.md section 3): newest build vs the one before it, per device, once it has >= 30 game-minutes
L.append('### Regression check (newest build vs previous, per device)\n')
J['regressions'] = []; rc_lines = []
for d in sorted({r['device'] for r in TR}):
    rows = sorted([r for r in TR if r['device'] == d], key=lambda r: r['build'])
    if len(rows) < 2: continue
    a, b = rows[-1], rows[-2]
    if a['gameMin'] < 30: rc_lines.append(f"- {d}: build {a['build']} has only {a['gameMin']} game-min (need 30) — not judged yet"); continue
    bad = []
    if a['fpsLow1'] < b['fpsLow1'] - 5: bad.append(f"1% low fps {b['fpsLow1']} -> {a['fpsLow1']}")
    if a['fpsMed'] < b['fpsMed'] - 3: bad.append(f"median fps {b['fpsMed']} -> {a['fpsMed']}")
    if a['slowSecPerHour'] > b['slowSecPerHour'] * 1.5 + 2: bad.append(f"slow s/h {b['slowSecPerHour']} -> {a['slowSecPerHour']}")
    if a['stuckPerHour'] > b['stuckPerHour'] * 1.25 + 2: bad.append(f"stuck/h {b['stuckPerHour']} -> {a['stuckPerHour']}")
    if a['physPerHour'] > b['physPerHour'] * 1.25 + 5: bad.append(f"physics catches/h {b['physPerHour']} -> {a['physPerHour']}")
    if bad:
        rc_lines.append(f"- **REGRESSION** {d}: build {b['build']} -> {a['build']}: " + '; '.join(bad)); J['regressions'].append({'device': d, 'from': b['build'], 'to': a['build'], 'what': bad})
    else: rc_lines.append(f"- OK {d}: build {b['build']} -> {a['build']} (fps low {b['fpsLow1']}->{a['fpsLow1']}, stuck/h {b['stuckPerHour']}->{a['stuckPerHour']}, phys/h {b['physPerHour']}->{a['physPerHour']})")
L.extend(rc_lines or ['- not enough data yet'])
L.append('')
causes = collections.Counter()
for m in real:
    for k, v in ((m.get('slow') or {}).get('causes') or {}).items(): causes[k] += v
if causes: L.append('- slow moments by cause (seconds): ' + '; '.join(f'{k}: {round(v, 1)}' for k, v in causes.most_common()))
inc = [x for m in real for x in ((m.get('slow') or {}).get('list') or [])]
if inc:
    def phase(t): return '0-5 min' if (t or 0) < 300 else '5-15 min' if (t or 0) < 900 else '15+ min'
    bk = collections.Counter()
    for x in inc: bk[(x.get('why') or '?', x.get('q'), phase(x.get('t')))] += x.get('secs', 0)
    L.append('- slow incidents by cause × quality × match phase (seconds): ' + '; '.join(f'{w} · q{q} · {p}: {round(s, 1)}' for (w, q, p), s in bk.most_common()))
    top = sorted(inc, key=lambda x: -x.get('secs', 0))[:5]
    L.append('- worst slow incidents: ' + '; '.join(f"t{x.get('t')}s: {x.get('secs')}s at {x.get('fps')} fps (worst {x.get('worst')} ms) q{x.get('q')} · {x.get('particles', 0)} particles, {x.get('fires', 0)} fires, {x.get('booms', 0)} blasts · worst frame {x.get('worstF') or '?'}" for x in top))
    J['slowTop'] = [{'t': x.get('t'), 'secs': x.get('secs'), 'why': x.get('why'), 'q': x.get('q')} for x in top]
L.append('')
# --- stuck hotspots: cluster on a 12 m grid
boots = [r for r in recs if r.get('kind') == 'boot' and not is_test(r)]
if boots:
    L.append('## Startup (page open -> first frame drawn)\n')
    L.append('Portal players leave if the page sits frozen. scriptMs = building the yard, compileMs = shaders (parallel = compiled off the main thread), first frame = all of it. Since the fast boot the first frame is the sky behind the menu, and yard = page open to the whole yard drawn (its shaders compiled while the menu was up).\n')
    bb = collections.defaultdict(list)
    for r in boots: bb[(dev_name(r), str(r.get('build')))].append(r)
    def med(xs): xs = sorted(x for x in xs if isinstance(x, (int, float))); return xs[len(xs) // 2] if xs else '–'
    L.append('| device | build | loads | first frame ms (median) | worst | script ms | compile ms | yard ms | parallel |')
    L.append('|---|---|---|---|---|---|---|---|---|')
    for (d, b), xs in sorted(bb.items(), key=lambda kv: (kv[0][0], int(kv[0][1]) if kv[0][1].isdigit() else 0)):
        L.append(f"| {d} | {b} | {len(xs)} | {med([x.get('firstFrameMs') for x in xs])} | {max((x.get('firstFrameMs') or 0) for x in xs)} | {med([x.get('scriptMs') for x in xs])} | {med([x.get('compileMs') for x in xs])} | {med([x.get('yardMs') for x in xs])} | {sum(1 for x in xs if x.get('parallel'))}/{len(xs)} |")
    L.append('')
starts = [r for r in recs if r.get('kind') == 'start' and not is_test(r) and not r.get('auto')]
if starts:
    L.append('### Time to start (a person: page open -> driving in the first match)\n')
    L.append('load = page open to first frame, menu = time on the menu before Start, start = Start to the end of the countdown.\n')
    bs = collections.defaultdict(list)
    for r in starts: bs[(dev_name(r), str(r.get('build')))].append(r)
    def med2(xs): xs = sorted(x for x in xs if isinstance(x, (int, float))); return round(xs[len(xs) // 2] / 1000, 1) if xs else '–'
    L.append('| device | build | starts | page open -> driving s (median) | load s | menu s | start s |')
    L.append('|---|---|---|---|---|---|---|')
    for (d, b), xs in sorted(bs.items(), key=lambda kv: (kv[0][0], int(kv[0][1]) if kv[0][1].isdigit() else 0)):
        L.append(f"| {d} | {b} | {len(xs)} | {med2([x.get('driveMs') for x in xs])} | {med2([x.get('loadMs') for x in xs])} | {med2([x.get('menuMs') for x in xs])} | {med2([x.get('startMs') for x in xs])} |")
    L.append('')
# memory over a session: GPU geometries per match by device/build (a leak shows as a steady climb), plus the guard's leak reports
L.append('## Memory (GPU objects over a session)\n')
L.append('Build 102+ reloads an autoplaying page whose memory runs away and logs what was leaking first. A healthy session stays flat.\n')
bysid = collections.defaultdict(list)
for m in real:
    mm = m.get('mem') or {}
    if mm.get('geo') is not None: bysid[m.get('sid')].append(m)
grow = collections.defaultdict(list)
for sid, xs in bysid.items():
    xs.sort(key=lambda r: r.get('start', ''))
    if len(xs) >= 6:
        g0, g1 = xs[1]['mem']['geo'], xs[-1]['mem']['geo']
        grow[(dev_name(xs[-1]), str(xs[-1].get('build')))].append(round((g1 - g0) / (len(xs) - 2), 1))
if grow:
    L.append('| device | build | sessions (6+ matches) | geometries added per match (median) |')
    L.append('|---|---|---|---|')
    for (d, b), v in sorted(grow.items()):
        v = sorted(v); L.append(f'| {d} | {b} | {len(v)} | {v[len(v)//2]} |')
    L.append('')
leaks = [r for r in recs if r.get('kind') == 'leak' and not is_test(r)]
for r in leaks[-5:]:
    top = '; '.join(f'{k} ×{n}' for k, n in (r.get('top') or [])[:5])
    L.append(f"- **leak** {dev_name(r)} build {r.get('build')} after {r.get('matches')} matches ({'autoplay, reloaded' if r.get('auto') else 'person playing'}): geometries {(r.get('base') or {}).get('g')} -> {(r.get('now') or {}).get('g')}, textures {(r.get('base') or {}).get('t')} -> {(r.get('now') or {}).get('t')}; {r.get('orphans')} orphaned: {top}")
if not leaks: L.append('- no leak reports from the memory guard')
L.append('')
L.append('## Stuck hotspots\n')
st = [s for m in real for s in ((m.get('stuck') or {}).get('list') or [])]
cl = collections.defaultdict(list)
for s in st: cl[(round(s.get('x', 0) / 12), round(s.get('z', 0) / 12))].append(s)
hot = sorted(cl.items(), key=lambda kv: -sum(s.get('secs', 0) for s in kv[1]))
J['stuck'] = {}
for (gx, gz), xs in hot[:12]:
    cx = round(sum(s['x'] for s in xs) / len(xs)); cz = round(sum(s['z'] for s in xs) / len(xs)); secs = round(sum(s.get('secs', 0) for s in xs), 1)
    vc = collections.Counter(s.get('car') or s.get('who') or '?' for s in xs); why = collections.Counter(s.get('why') for s in xs if s.get('why'))
    L.append(f'- ({cx}, {cz}): {len(xs)}× · {secs} s · ' + ', '.join(f'{k} {n}' for k, n in vc.most_common(5)) + (f' · touching: {", ".join(k for k, _ in why.most_common(3))}' if why else ''))
    J['stuck'][f'{cx},{cz}'] = len(xs)
if not st: L.append('- none')
L.append(f'- total {len(st)} stuck events, {round(sum(s.get("secs", 0) for s in st), 1)} s, over {mins(real)} game-minutes ({round(len(st) / max(0.1, mins(real)) * 60, 1)} per hour)\n')
# --- cars inside objects (recorded from the build that added the detector: host/solo/autoplay records only)
L.append('## Cars inside objects\n')
IM = [m for m in real if isinstance(m.get('inside'), dict)]
J['inside'] = {}
if not IM: L.append('- not recorded yet (no records from a build with the inside-an-object detector)')
else:
    ins = [e for m in IM for e in (m['inside'].get('list') or [])]; nIn = sum(m['inside'].get('n', 0) for m in IM)
    L.append(f'- total {nIn} cars caught inside an object over {mins(IM)} game-minutes ({round(nIn / max(0.1, mins(IM)) * 60, 1)} per hour) · listed {len(ins)} (the game lists at most 12 per match)')
    for d in sorted({dev_name(m) for m in IM}):
        for b in sorted({m.get('build') for m in IM if dev_name(m) == d}, key=lambda x: int(x or 0)):
            xs = [m for m in IM if dev_name(m) == d and m.get('build') == b]; n = sum(m['inside'].get('n', 0) for m in xs)
            L.append(f"- {d} · build {b}: {n} over {mins(xs)} game-min ({inside_rate(xs)}/h, {sum(1 for m in xs if m['inside'].get('n'))} of {len(xs)} matches)")
    if ins:
        cl2 = collections.defaultdict(list)
        for e in ins: cl2[(round((e.get('x') or 0) / 12), round((e.get('z') or 0) / 12))].append(e)
        L.append('- hotspots (same 12 m grid as stuck): ' + '; '.join(f"({round(sum(e.get('x', 0) for e in xs) / len(xs))}, {round(sum(e.get('z', 0) for e in xs) / len(xs))}): {len(xs)}× · in " + ', '.join(f'{k} {n}' for k, n in collections.Counter(e.get('what') or '?' for e in xs).most_common(2)) + ' · ' + ', '.join(f'{k} {n}' for k, n in collections.Counter(e.get('who') or '?' for e in xs).most_common(3)) for _, xs in sorted(cl2.items(), key=lambda kv: -len(kv[1]))[:10]))
        L.append('- vehicles: ' + ', '.join(f'{k} {n}' for k, n in collections.Counter(e.get('who') or '?' for e in ins).most_common()))
        L.append('- inside what: ' + ', '.join(f'{k} {n}' for k, n in collections.Counter(e.get('what') or '?' for e in ins).most_common()))
        L.append('- which part (hull centre / nose / tail): ' + ', '.join(f'{k} {n}' for k, n in collections.Counter(e.get('part') or '?' for e in ins).most_common()) + f" · median depth {sorted(e.get('depth', 0) for e in ins)[len(ins) // 2]} m · longest {max(e.get('secs', 0) for e in ins)} s" + (f" · {sum(1 for e in ins if e.get('held'))} while towed/craned" if any(e.get('held') for e in ins) else ''))
        J['inside'] = {f"{round(sum(e.get('x', 0) for e in xs) / len(xs))},{round(sum(e.get('z', 0) for e in xs) / len(xs))}": len(xs) for _, xs in cl2.items()}
L.append('')
# --- physics safety nets per vehicle per hour of that vehicle's driving
L.append('## Physics safety-net catches\n')
ph = collections.Counter(); phk = collections.Counter(); phvk = collections.defaultdict(collections.Counter)
for m in real:
    for e in ((m.get('phys') or {}).get('list') or []): ph[e.get('who')] += 1; phk[e.get('kind')] += 1; phvk[e.get('who')][e.get('kind')] += 1
tot = {k: sum((m.get('phys') or {}).get(k, 0) or 0 for m in real) for k in ('blowups', 'fixes', 'clamps', 'undos', 'escapes', 'launches', 'rescues', 'below', 'nan')}
cen = collections.Counter()
for m in real: cen.update((m.get('phys') or {}).get('kinds') or {})
gm = max(0.1, mins(real)); perh = lambda v: round(v / gm * 60)
L.append('- totals (full census): ' + ', '.join(f'{k} {v}' for k, v in tot.items()) + f" · safety-net work: fixes {tot['fixes']} ({perh(tot['fixes'])}/h), clamps {tot['clamps']} ({perh(tot['clamps'])}/h)" + (' · kinds (census): ' + ', '.join(f'{k} {v}' for k, v in cen.most_common()) if cen else ''))
L.append('- by vehicle (listed catches only — the game lists at most 40 per match, so this is a capped sample): ' + ', '.join(f'{k} {v}' for k, v in ph.most_common(8)) + ' · listed kinds: ' + ', '.join(f'{k} {v}' for k, v in phk.most_common()) + '\n')
if phvk:
    L.append('- by vehicle × kind (listed catches only): ' + '; '.join(f'{who}: ' + ', '.join(f'{k} {n}' for k, n in kinds.most_common()) for who, kinds in sorted(phvk.items(), key=lambda kv: -sum(kv[1].values()))[:8]))
    J['physKinds'] = {who: dict(kinds) for who, kinds in phvk.items()}
J['phys'] = dict(ph); J['physCensus'] = dict(cen)
pc = collections.defaultdict(list)
for m in real:
    for e in ((m.get('phys') or {}).get('list') or []):
        if e.get('x') is not None and e.get('z') is not None: pc[(round(e['x'] / 12), round(e['z'] / 12))].append(e)
if pc:
    cells = sorted(pc.items(), key=lambda kv: -len(kv[1]))[:8]
    cent = lambda xs: (round(sum(s['x'] for s in xs) / len(xs)), round(sum(s['z'] for s in xs) / len(xs)))
    L.append('- catch locations (listed catches with a position, same 12 m grid as stuck — do the two maps agree?): ' + '; '.join(f"({cent(xs)[0]}, {cent(xs)[1]}): {len(xs)}× · " + ', '.join(f'{k} {n}' for k, n in collections.Counter(s.get('kind') for s in xs).most_common(2)) for (g, xs) in cells))
    J['physHot'] = {f'{cent(xs)[0]},{cent(xs)[1]}': len(xs) for (g, xs) in cells}
# --- balance
L.append('## Balance (all real matches)\n')
vb = collections.defaultdict(lambda: collections.Counter())
for m in real:
    for k, v in (m.get('veh') or {}).items(): vb[k].update({'lives': v.get('lives', 0), 'k': v.get('k', 0), 'd': v.get('d', 0), 'dmg': v.get('dmg', 0), 'taken': v.get('taken', 0), 'fires': v.get('fires', 0), 'lifew': (v.get('life', 0) or 0) * (v.get('lives', 0) or 0)})
rows = sorted(vb.items(), key=lambda kv: -(kv[1]['k'] / max(1, kv[1]['d'])))
L.append('| vehicle | lives | kills | deaths | K/D | dmg/life | taken/life | avg life s | fires |\n|---|---|---|---|---|---|---|---|---|')
for k, c in rows: L.append(f"| {k} | {c['lives']} | {c['k']} | {c['d']} | {round(c['k'] / max(1, c['d']), 2)} | {round(c['dmg'] / max(1, c['lives']))} | {round(c['taken'] / max(1, c['lives']))} | {round(c['lifew'] / max(1, c['lives']))} | {c['fires']} |")
J['kd'] = {k: round(c['k'] / max(1, c['d']), 2) for k, c in vb.items()}
L.append('')
# --- matchups (build 68+): who wrecks whom, how often by dragging into a hazard, damage dealt by pair
VS = collections.defaultdict(collections.Counter)
for m in real:
    b = int(m.get('build') or 0)
    for k, v in (m.get('vs') or {}).items(): VS[(b, k)].update({'k': v.get('k', 0), 'dragged': v.get('dragged', 0)})
    for k, v in (m.get('vsD') or {}).items(): VS[(b, k)].update({'dmg': v})
if VS:
    lb = max(b for b, _ in VS)
    L.append(f'## Matchups (build {lb}): who wrecks whom\n')
    top = sorted(((k, c) for (b, k), c in VS.items() if b == lb), key=lambda kc: -kc[1]['k'])[:15]
    for k, c in top: L.append(f"- {k.replace('>', ' wrecked ')}: {c['k']}×" + (f" ({c['dragged']} dragged into a hazard)" if c['dragged'] else '') + f" · {c['dmg']} damage")
    L.append('')
VSROWS = [{'build': b, 'killer': k.split('>')[0], 'victim': k.split('>')[1], 'kills': c['k'], 'dragged': c['dragged'], 'dmg': c['dmg']} for (b, k), c in sorted(VS.items())]
# --- voice variety (build 70+): how often each line is heard, repeats within a match and across a session
HV = [m for m in real if m.get('heard')]
if HV:
    lb = max(int(m.get('build') or 0) for m in HV); xs = [m for m in HV if int(m.get('build') or 0) == lb]
    n = sum(m['heard']['n'] for m in xs); rm = sum(m['heard']['repMatch'] for m in xs); rs = sum(m['heard'].get('repSession', 0) for m in xs)
    L.append(f'## Voice variety (build {lb}, {len(xs)} matches)\n')
    L.append(f'- {n} lines heard; {round(rm / max(1, n) * 100)}% were repeats within the same match, {round(rs / max(1, n) * 100)}% repeats of a line already heard this session')
    by = collections.defaultdict(lambda: [0, 0])
    for m in xs:
        for w, (said, uniq) in (m['heard'].get('by') or {}).items(): by[w][0] += said; by[w][1] += uniq
    L.append('- per character (lines heard / distinct): ' + ', '.join(f"{w} {a}/{b}" for w, (a, b) in sorted(by.items(), key=lambda kv: -kv[1][0])[:16]))
    top = collections.Counter()
    for m in xs:
        for k, c in (m['heard'].get('top') or []): top[k] += c
    if top: L.append('- most repeated lines: ' + '; '.join(f"{k.replace('|', ': ', 1)[:70]} ×{c}" for k, c in top.most_common(8)))
    J['voiceRepeatPct'] = round(rm / max(1, n) * 100)
    L.append('')
# --- voices, errors, network
L.append('## Voices, errors, network\n')
for d in sorted({dev_name(m) for m in real}):
    xs = [m for m in real if dev_name(m) == d]; vf = sum((m.get('voice') or {}).get('n', 0) for m in xs)
    ok = [m for m in xs if (m.get('voice') or {}).get('ok')]
    vs = sum((m.get('voice') or {}).get('sent', 0) or 0 for m in xs); vt = sum((m.get('voice') or {}).get('started', 0) or 0 for m in xs); ve = sum((m.get('voice') or {}).get('errors', 0) or 0 for m in xs)
    L.append(f'- {d}: voice failures {vf} over {len(xs)} matches · lines sent {vs}, started {vt}, errors {ve}' + (' (engine never started)' if vf and not ok else ''))
# recorded clips vs computer voice (build 115+: the match record's `vox` block): per device and build, what share of the lines were heard as the
# recorded clips, why the rest went to Web Speech (noClip = nothing recorded for that line; suspended / noCtx = the audio context wasn't running;
# failed = fetch/decode), lines with no sound at all (muted / vol0), how often the audio context was not running, and whether the music could play.
VX = collections.defaultdict(list)
for m in real:
    if isinstance(m.get('vox'), dict): VX[(dev_name(m), m.get('build'))].append(m['vox'])
if VX:
    L.append('### Recorded voices vs computer voice (per device and build)\n')
    L.append('| device | build | matches | lines | recorded clips | computer voice | no sound | top fallback reasons | audio not running | music | audio session |')
    L.append('|---|---|---|---|---|---|---|---|---|---|---|')
    J['vox'] = {}
    for (d, b), vs in sorted(VX.items(), key=lambda kv: (kv[0][0], -int(kv[0][1] or 0))):
        sp = collections.Counter(); ctx = collections.Counter(); mb = collections.Counter(); clips = mok = 0; sess = collections.Counter()
        for v in vs:
            clips += v.get('clips', 0) or 0
            for k, n in (v.get('speech') or {}).items(): sp[k] += n or 0
            for k, n in (v.get('ctx') or {}).items(): ctx[k] += n or 0
            mu = v.get('music') or {}; mok += mu.get('ok', 0) or 0
            for k, n in (mu.get('blocked') or {}).items(): mb[k] += n or 0
            if v.get('session'): sess[v['session']] += 1
        speech = sum(sp[k] for k in ('noClip', 'suspended', 'noCtx', 'failed')); silent = sp['muted'] + sp['vol0']; n = clips + speech + silent
        pct = lambda x: f'{round(x / n * 100)}%' if n else '–'
        top = ', '.join(f'{k} {c}' for k, c in sp.most_common() if c and k not in ('muted', 'vol0'))[:80] or '–'
        cs = sum(ctx.values()); notrun = cs - ctx['running']
        ms_ = mok + sum(mb.values()); music = (f'playing {round(mok / ms_ * 100)}%' + (f' · blocked: ' + ', '.join(f'{k} {c}' for k, c in mb.most_common(2)) if mb else '')) if ms_ else '–'
        L.append(f"| {d} | {b} | {len(vs)} | {n} | {pct(clips)} | {pct(speech)} | {pct(silent)} | {top} | {f'{round(notrun / cs * 100)}%' if cs else '–'} | {music} | {', '.join(sess) or '–'} |")
        J['vox'][f'{d} b{b}'] = {'lines': n, 'clipPct': round(clips / n * 100) if n else None, 'speechPct': round(speech / n * 100) if n else None, 'reasons': dict(sp), 'ctxNotRunningPct': round(notrun / cs * 100) if cs else None, 'musicOkPct': round(mok / ms_ * 100) if ms_ else None, 'musicBlocked': dict(mb)}
    L.append('')
else:
    L.append('- recorded clips vs computer voice: not recorded yet (the `vox` block arrives with the voice-path build)')
errs = collections.Counter()
for m in real:
    for e in (m.get('errs') or {}).get('list') or []: errs[re.sub(r'\d+', '#', str(e)[:140])] += 1
for r in oerr:
    for e in r.get('list') or []: errs[re.sub(r'\d+', '#', re.sub(r'^\d\d:\d\d:\d\d ', '', str(e)))[:110]] += 1
L.append('- errors & incidents (in and out of matches): ' + ('; '.join(f'{n}× {k}' for k, n in errs.most_common(8)) if errs else 'none'))
nets = sum((m.get('net') or {}).get('n', 0) for m in real); L.append(f'- network incidents: {nets}')
L.append('')
# --- autoplay health
ap = [m for m in real if m.get('role') == 'autoplay']
if ap:
    endc = collections.Counter(re.sub(r'\d+', '#', m.get('ended') or '?')[:40] for m in ap)
    L.append('## Autoplay\n')
    L.append(f'- {len(ap)} matches, {mins(ap)} game-minutes · endings: ' + ', '.join(f'{k} {n}' for k, n in endc.most_common()))
    hid = [m for m in ap if m.get('hidden', 0) > 5]
    if hid: L.append(f'- {len(hid)} autoplay matches spent time hidden (stats from those stretches are excluded from build 67)')
    L.append('')
# --- autoplay health: how each autoplay page ended (from the next load's 'lifeEnd' record, or its last-gasp beacon), wake-lock releases by cause, suspends
AH = collections.defaultdict(lambda: {'dev': None, 'end': None, 'gasp': [], 'heal': {}, 'n': collections.Counter()})
def ah_take(r):
    a = AH[r['sid']]
    if r.get('device') and not a['dev']: a['dev'] = dev_name(r)
    for k, v in ((r.get('n') if r.get('kind') in ('lifeEnd', 'gasp') else r.get('life')) or {}).items():
        if isinstance(v, (int, float)) and v > a['n'][k]: a['n'][k] = v  # (counters only grow within a page: the largest copy wins)
    return a
ap_sids = {m['sid'] for m in ap if m.get('sid')} | {r['sid'] for r in recs if r.get('kind') in ('lifeEnd', 'gasp', 'heal') and r.get('auto') and r.get('sid') and not is_test(r)}
ap_sids |= {s for s, r in sessions.items() if 'autoplay=1' in (r.get('url') or '') and not is_test(r)}
for r in recs:
    if r.get('sid') not in ap_sids or is_test(r): continue
    if r.get('kind') == 'lifeEnd':
        a = ah_take(r)
        if not a['end'] or (r.get('lastSeen') or '') >= (a['end'].get('lastSeen') or ''): a['end'] = r  # (a frozen tab declared ended can come back and end again: the latest word wins)
    elif r.get('kind') == 'gasp':
        a = ah_take(r)
        if all(g.get('at') != r.get('at') for g in a['gasp']): a['gasp'].append(r)
    elif r.get('kind') == 'heal':  # self-heal actions (Build 119): reloads by cause, rate-limited ones, and new game frames from the launcher (autoplay.html)
        a = ah_take(r); a['heal'][(r.get('at'), r.get('why'), r.get('action'))] = r  # (uploads overlap: one copy each)
    elif r.get('kind') in ('ck', 'match') and r.get('role') == 'autoplay': ah_take(r)
    elif r.get('kind') == 'session' and not AH[r['sid']]['dev'] and r.get('device'): AH[r['sid']]['dev'] = dev_name(r)
if AH:
    L.append('### Autoplay health\n')
    J['autoplayHealth'] = {}
    for d in sorted({a['dev'] or '?' for a in AH.values()}):
        xs = {s: a for s, a in AH.items() if (a['dev'] or '?') == d}
        if not any(a['end'] or a['gasp'] or a['n'] or a['heal'] for a in xs.values()):
            L.append(f'- **{d}** autoplay health: {len(xs)} sessions · page lifecycle not recorded yet (builds before the stop log)'); continue
        ends = collections.Counter(); n = collections.Counter(); last = None; hl = collections.Counter(); hiso = collections.Counter(); hlim = 0; hnew = collections.Counter(); hlast = None
        for s, a in xs.items():
            n.update(a['n'])
            for h in a['heal'].values():
                act = h.get('action')
                if act == 'reload': hl[h.get('why') or '?'] += 1
                elif act == 'rate-limited': hlim += 1
                elif act == 'new frame': hnew[h.get('why') or '?'] += 1
                elif act == 'isolation': hiso['own' if h.get('own') else 'shared'] += 1; continue  # (the launcher's check that the game frame has a process of its own)
                else: continue
                if not hlast or (h.get('at') or '') > (hlast.get('at') or ''): hlast = h
            if a['end']:
                ends[a['end'].get('how', '?')] += 1
                if not last or (a['end'].get('lastSeen') or '') > (last.get('lastSeen') or ''): last = a['end']
            elif a['gasp']: ends['not reloaded yet, last gasp ' + sorted(a['gasp'], key=lambda g: g.get('at') or '')[-1].get('why', '?')] += 1
            else: ends['no word yet (still running, or not reloaded since)'] += 1
        order = ['clean', 'suspended', 'vanished']
        endtxt = ', '.join([f'{k} {ends[k]}' for k in order if ends[k]] + [f'{k} {v}' for k, v in sorted(ends.items()) if k not in order])
        wl = f"wake lock: acquired {n['wlGot']}, denied {n['wlDenied']}, released by tab hidden {n['wlHidden']}, by the system {n['wlSystem']}, by us {n['wlUs']} (asked again {n['wlRe']})"
        horder = ['memory', 'refresh', 'gpu', 'stall']
        heal = (f"self-heal reloads {sum(hl.values())}" + (' (' + ', '.join([f'{k} {hl[k]}' for k in horder if hl[k]] + [f'{k} {v}' for k, v in sorted(hl.items()) if k not in horder]) + ')' if hl else '')
                + f", rate-limited {hlim}, new game frames from the launcher {sum(hnew.values())}" + (' (' + ', '.join(f'{k} {v}' for k, v in sorted(hnew.items())) + ')' if hnew else ''))
        if hiso: heal += f" · launcher frame in its own process {hiso['own']}×, shared {hiso['shared']}×" + (' (a crash takes the launcher too)' if hiso['shared'] else '')
        if hlast:
            m = hlast.get('mem') or {}
            heal += f" · last: {hlast.get('why')} {hlast.get('action')} after {round((hlast.get('upS') or 0) / 60)} min ({hlast.get('detail')}; geometries {m.get('g')}, heap {m.get('heapMB')} MB)"
        L.append(f"- **{d}** autoplay health: {len(xs)} sessions · ended: {endtxt} · {wl} · suspends {n['sus']} ({n['susS']} s asleep or frozen) · hidden {n['hid']}×, frozen {n['frz']}×, offline {n['off']}× · {heal}"
                 + (f" · last stop: {last.get('how')} ({last.get('reason')}), last seen {last.get('lastSeen')}" if last else ''))
        J['autoplayHealth'][d] = {'sessions': len(xs), 'ended': dict(ends), 'counters': dict(n), 'heal': {'reloads': dict(hl), 'rateLimited': hlim, 'newFrames': dict(hnew), 'isolation': dict(hiso)}}
    L.append('')
# --- bug reports
if bugs:
    L.append('## Bug reports\n')
    for b in bugs[-8:]:
        head = open(b, errors='replace').read(300).split('\n')[0]
        L.append(f'- {os.path.basename(b)[:60]} · {head[:120]}')
    L.append('')
# --- what changed since last time
prev = {}
pj = os.path.join(OUT, 'report-latest.json')
if os.path.exists(pj):
    try: prev = json.load(open(pj))
    except Exception: prev = {}
L.append('## Changes since the previous report\n')
ch = []
for k, n in (J.get('stuck') or {}).items():
    if k not in (prev.get('stuck') or {}): ch.append(f'new stuck hotspot at ({k}) ×{n}')
for k, n in (J.get('inside') or {}).items():
    if k not in (prev.get('inside') or {}): ch.append(f'new inside-an-object hotspot at ({k}) ×{n}')
for v, n in (J.get('phys') or {}).items():
    if n > (prev.get('phys') or {}).get(v, 0) + 5: ch.append(f'physics catches up for {v}: {(prev.get("phys") or {}).get(v, 0)} → {n}')
for d, p in (J.get('perf') or {}).items():
    q = (prev.get('perf') or {}).get(d)
    if q and p['low1'] < q['low1'] - 5: ch.append(f'{d}: 1% low fps dropped {q["low1"]} → {p["low1"]}')
    if q and p['low1'] > q['low1'] + 5: ch.append(f'{d}: 1% low fps improved {q["low1"]} → {p["low1"]}')
if J.get('latestBuild', 0) > prev.get('latestBuild', 0): ch.append(f"first data from build {J['latestBuild']}")
L.extend(f'- {c}' for c in ch) if ch else L.append('- nothing new')
open(os.path.join(OUT, 'report-latest.md'), 'w').write('\n'.join(L) + '\n')
stamp = time.strftime('%Y%m%d-%H%M', time.gmtime()); open(os.path.join(OUT, f'report-{stamp}.md'), 'w').write('\n'.join(L) + '\n')
json.dump(J, open(pj, 'w'))
# --- trend file for the Derby Health dashboard: per device/build perf rows, per build/vehicle balance rows
KB = collections.defaultdict(collections.Counter)
for m in real:
    for k, v in (m.get('veh') or {}).items(): KB[(int(m.get('build') or 0), k)].update({'lives': v.get('lives', 0), 'k': v.get('k', 0), 'd': v.get('d', 0)})
kdrows = [{'build': b, 'vehicle': v, 'lives': c['lives'], 'kills': c['k'], 'deaths': c['d'], 'kd': round(c['k'] / max(1, c['d']), 2)} for (b, v), c in sorted(KB.items())]
json.dump({'generated': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()), 'perf': TR, 'balance': kdrows, 'matchups': VSROWS}, open(os.path.join(OUT, 'trend.json'), 'w'))
