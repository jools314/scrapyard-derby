#!/usr/bin/env python3
"""Fixture test for tools/logs/analyze.py.

Builds one synthetic play-log file whose records carry known values in every field the
analyser reads, runs the analyser on it, and checks the report says what the data says.
Each section (A1, A2, ...) guards one analyser improvement; a section fails on the
analyser version that predates its improvement.

Run: python3 tools/logs/test_analyze.py   (exit 0 = all pass)
"""
import json, os, subprocess, sys, tempfile

HERE = os.path.dirname(os.path.abspath(__file__))

MATCH = {
    'v': 2, 'kind': 'match', 'id': 'm1', 'sid': 's1', 'build': '67',
    'start': '2026-11-15T00:00:00.000Z', 'end': '2026-11-15T01:00:00.000Z', 'ended': 'autoplay round done',
    'role': 'solo', 'mode': 'respawn', 'device': 'MacBook · Apple M-series', 'ua': 'Mozilla/5.0 (Macintosh; Intel Mac OS X)',
    'game': 3600, 'cars': 9,
    'fps': {'frames': 20000, 'med': 60, 'p5': 56, 'low1': 54, 'avg': 59, 'worstMs': 900},
    'q': {'start': 1, 'end': 1, 'ch': [], 'res': 100},
    'env': {'throttledS': 0, 'hiddenS': 0},
    'slow': {'n': 2, 'secs': 6.0, 'worstMs': 900,
             'causes': {'waiting on the graphics chip (fewer pixels/effects would help)': 6.0},
             'list': [
                 {'t': 120, 'secs': 2.5, 'fps': 11, 'worst': 800, 'why': 'waiting on the graphics chip (fewer pixels/effects would help)',
                  'parts': 'render 5.0, physics 1.0', 'q': 1, 'cars': 9, 'particles': 40, 'fires': 2, 'booms': 1,
                  'mem': 'heap 100 MB', 'worstF': '800 ms: render', 'before': 'big explosion',
                  'calls': 500, 'tris': 900000, 'sim': 2.0, 'draw': 3.0, 'wait': 8.0, 'res': 100},
                 {'t': 1500, 'secs': 3.5, 'fps': 9, 'worst': 900, 'why': 'preparing the drawing (draw calls) is the slow part',
                  'parts': 'draw 6.0', 'q': 2, 'cars': 9, 'particles': 5, 'fires': 0, 'booms': 0,
                  'mem': '', 'worstF': '900 ms: draw', 'before': '',
                  'calls': 700, 'tris': 950000, 'sim': 1.0, 'draw': 6.0, 'wait': 2.0, 'res': 100}]},
    'phys': {'fixes': 120, 'clamps': 30, 'blowups': 100,
             'kinds': {'solver kick undone': 88, 'blow-up clamped': 12},
             'rescues': 0, 'undos': 88, 'escapes': 1, 'launches': 0, 'below': 0, 'nan': 0,
             'list': [{'t': 10.0, 'kind': 'solver kick undone', 'who': 'Outrider', 'speed': 40, 'was': 3, 'spin': 9, 'x': 36, 'y': 1.0, 'z': -107},
                      {'t': 20.0, 'kind': 'blow-up clamped', 'who': 'Viper', 'speed': 55, 'spin': 4}]},
    'stuck': {'n': 2, 'secs': 30.0, 'list': [{'car': 'mixer', 'secs': 20, 'x': 36, 'z': -107, 'why': 'wall'},
                                             {'car': 'dozer', 'secs': 10, 'x': 40, 'z': -100, 'why': 'mixer'}]},
    'veh': {'viper': {'lives': 10, 'k': 5, 'd': 4, 'dmg': 900, 'taken': 700, 'life': 33, 'fires': 120},
            'dozer': {'lives': 8, 'k': 9, 'd': 3, 'dmg': 1200, 'taken': 500, 'life': 41, 'fires': 0}},
    'vs': {}, 'vsD': {}, 'me': [], 'weap': {},
    'voice': {'n': 2, 'list': [], 'sent': 50, 'started': 44, 'errors': 3, 'resets': 1, 'ok': True},
    'net': {'n': 0, 'list': []}, 'errs': {'n': 0, 'list': []},
    'mem': {'geo': 100, 'tex': 50, 'heapMB': 200, 'objs': 300, 'debris': 10, 'props': 80, 'bodies': 120, 'calls': 480, 'tris': 800000},
    'ev': [],
}
SESSION = {'v': 2, 'kind': 'session', 'sid': 's1', 'build': '67', 'at': '2026-11-15T00:00:00.000Z',
           'device': 'MacBook · Apple M-series', 'ua': 'Mozilla/5.0 (Macintosh; Intel Mac OS X)'}

fails = []
def ok(cond, msg):
    print(('PASS ' if cond else 'FAIL ') + msg)
    if not cond: fails.append(msg)

def main():
    arch = tempfile.mkdtemp(prefix='sd-arch-'); out = tempfile.mkdtemp(prefix='sd-out-')
    with open(os.path.join(arch, 'fixture-playlog.txt'), 'w') as f:
        f.write(json.dumps(SESSION) + '\n'); f.write(json.dumps(MATCH) + '\n')
    r = subprocess.run([sys.executable, os.path.join(HERE, 'analyze.py'), arch, out], capture_output=True, text=True)
    if r.returncode != 0:
        print('FAIL analyser crashed:\n' + r.stdout + r.stderr); return 1
    md = open(os.path.join(out, 'report-latest.md')).read()

    # A1: physics census — totals and kinds come from the uncapped census fields,
    # fixes/clamps get per-hour rates, and the per-vehicle list is labelled a capped sample.
    ok('full census' in md, 'A1 report labels the physics totals as the full census')
    ok('fixes 120 (120/h)' in md, 'A1 fixes total with per-hour rate (120 fixes in 60 game-min)')
    ok('clamps 30 (30/h)' in md, 'A1 clamps total with per-hour rate')
    ok('solver kick undone 88' in md, 'A1 kinds come from the census (88), not the listed sample (1)')
    ok('capped sample' in md and 'at most 40 per match' in md, 'A1 per-vehicle catch list labelled as the capped sample')

    # A2: slow-incident breakdown — the recorded per-incident list is bucketed by
    # cause x quality x match phase, and the worst incidents keep their detail.
    ok('waiting on the graphics chip (fewer pixels/effects would help) · q1 · 0-5 min: 2.5' in md, 'A2 GPU-wait incident bucketed q1 / first 5 min with its seconds')
    ok('preparing the drawing (draw calls) is the slow part · q2 · 15+ min: 3.5' in md, 'A2 draw-prep incident bucketed q2 / 15+ min')
    ok('worst slow incidents' in md and '800 ms: render' in md and '40 particles' in md, 'A2 worst incidents listed with worst-frame detail and particle load')

    # A3: balance table v2 — damage taken per life, average life seconds, weapon fires.
    ok('taken/life' in md and 'avg life s' in md, 'A3 balance table has taken/life and avg-life columns')
    vrow = next((l for l in md.split('\n') if l.startswith('| viper |')), '')
    ok('| 70 | 33 | 120 |' in vrow, 'A3 viper row: taken/life 70 (700/10), avg life 33 s, 120 fires — got: ' + vrow)

    # A4: physics-catch heatmap — listed catches that carry a position are clustered
    # on the same 12 m grid as the stuck hotspots (the position-less one is skipped).
    ok('catch locations' in md and '(36, -107): 1×' in md, 'A4 catch heatmap cell (36, -107) with the one positioned catch')

    print('FAILED ' + str(len(fails)) if fails else 'ALL PASS')
    return 1 if fails else 0

if __name__ == '__main__':
    sys.exit(main())
