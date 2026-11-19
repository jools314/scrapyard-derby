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


    # A7: physics catch kinds split per vehicle — the listed sample grouped by who x kind,
    # so a regression like Build 107's spider (77 of 96 listed catches 'solver kick undone')
    # reads straight off the report instead of a hand count of the archive.
    ok('by vehicle × kind' in md, 'A7 report has a by-vehicle x kind catch section')
    ok('Outrider: solver kick undone 1' in md, 'A7 Outrider kinds: its one listed catch is a solver kick')
    ok('Viper: blow-up clamped 1' in md, 'A7 Viper kinds: its one listed catch is a blow-up clamp')
    rj = json.load(open(os.path.join(out, 'report-latest.json'))) if r.returncode == 0 else {}
    ok(rj.get('physKinds') == {'Outrider': {'solver kick undone': 1}, 'Viper': {'blow-up clamped': 1}}, 'A7 report-latest.json carries physKinds per vehicle — got: ' + str(rj.get('physKinds')))

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

    # A5: voice counters — lines asked for vs actually started vs errors, per device.
    ok('lines sent 50, started 44, errors 3' in md, 'A5 voice line: sent 50, started 44, errors 3 (the asked-vs-started gap)')

    # A6: cars inside objects — a newer record carries `inside`, the older one doesn't: the old one still analyses
    # ('–' in its inside/h cell), the new one gets a per-hour rate, a hotspot on the 12 m grid, vehicles and what they were in.
    ok('## Cars inside objects' in md and 'not recorded yet' in md, 'A6 a record without the inside field: section says not recorded yet')
    m2 = dict(MATCH, id='m2', build='68', game=1800, start='2026-11-15T02:00:00.000Z',
              inside={'n': 3, 'secs': 9, 'list': [{'t': 30, 'who': 'mixer', 'x': 92, 'z': -110, 'y': 1.2, 'what': 'container', 'part': 'centre', 'depth': 0.9, 'secs': 4},
                                                  {'t': 90, 'who': 'dozer', 'x': 95, 'z': -108, 'y': 1.0, 'what': 'container', 'part': 'nose', 'depth': 0.5, 'secs': 3},
                                                  {'t': 400, 'who': 'mixer', 'x': -108, 'z': -92, 'y': 1.9, 'what': 'crusher post', 'part': 'centre', 'depth': 0.3, 'secs': 2}]})
    arch2 = tempfile.mkdtemp(prefix='sd-arch-'); out2 = tempfile.mkdtemp(prefix='sd-out-')
    with open(os.path.join(arch2, 'fixture-playlog.txt'), 'w') as f:
        f.write(json.dumps(SESSION) + '\n'); f.write(json.dumps(MATCH) + '\n'); f.write(json.dumps(m2) + '\n')
    r = subprocess.run([sys.executable, os.path.join(HERE, 'analyze.py'), arch2, out2], capture_output=True, text=True)
    md2 = open(os.path.join(out2, 'report-latest.md')).read() if r.returncode == 0 else ''
    ok(r.returncode == 0, 'A6 analyser runs on a mix of old and new records ' + r.stderr[-300:])
    ok('total 3 cars caught inside an object over 30.0 game-minutes (6.0 per hour)' in md2, 'A6 total and per-hour rate over the matches that record it')
    ok('(94, -109): 2× · in container 2 · mixer 1, dozer 1' in md2 and '(-108, -92): 1× · in crusher post 1' in md2, 'A6 hotspots on the 12 m grid with what and who')
    ok('vehicles: mixer 2, dozer 1' in md2 and 'inside what: container 2, crusher post 1' in md2, 'A6 vehicles and what they were inside')
    rows = [l for l in md2.split('\n') if l.startswith('| MacBook |')]
    ok(len(rows) == 2 and rows[0].endswith('| – |') and rows[1].endswith('| 6.0 |'), 'A6 release table: inside/h – for the old build, 6.0 for the new one — got: ' + ' / '.join(rows))
    tr = json.load(open(os.path.join(out2, 'trend.json')))['perf'] if r.returncode == 0 else []
    ok([x.get('insidePerHour') for x in tr] == [None, 6.0], 'A6 trend.json carries insidePerHour per build (None when not recorded)')

    # A8: recorded clips vs computer voice — the match record's `vox` block, per device and build: % of lines heard as the recorded clips,
    # % that went to Web Speech and why, how often the audio context wasn't running, and the music status. Old records without it still analyse.
    ok('not recorded yet (the `vox` block' in md, 'A8 records without the vox block: the section says not recorded yet')
    vox = {'clips': 30, 'waited': 2, 'busy': 1, 'speech': {'noCtx': 0, 'suspended': 6, 'muted': 0, 'vol0': 0, 'noClip': 4, 'failed': 0},
           'ctx': {'running': 80, 'suspended': 20, 'interrupted': 0, 'none': 0}, 'music': {'on': True, 'playing': True, 'ok': 80, 'blocked': {'audio suspended': 20}, 'now': 'playing'}, 'session': 'playback'}
    vox2 = dict(vox, clips=10, speech={'noCtx': 0, 'suspended': 0, 'muted': 0, 'vol0': 0, 'noClip': 0, 'failed': 0})
    m3 = dict(MATCH, id='m3', build='115', game=600, start='2026-11-18T02:00:00.000Z', device='iPhone · 4 cores', vox=vox)
    m4 = dict(MATCH, id='m4', build='115', game=600, start='2026-11-18T03:00:00.000Z', device='iPhone · 4 cores', vox=vox2)
    arch3 = tempfile.mkdtemp(prefix='sd-arch-'); out3 = tempfile.mkdtemp(prefix='sd-out-')
    with open(os.path.join(arch3, 'fixture-playlog.txt'), 'w') as f:
        for x in (SESSION, MATCH, m3, m4): f.write(json.dumps(x) + '\n')
    r = subprocess.run([sys.executable, os.path.join(HERE, 'analyze.py'), arch3, out3], capture_output=True, text=True)
    md3 = open(os.path.join(out3, 'report-latest.md')).read() if r.returncode == 0 else ''
    ok(r.returncode == 0 and '### Recorded voices vs computer voice' in md3, 'A8 the report has a recorded-vs-computer-voice table ' + r.stderr[-300:])
    sec = md3.split('### Recorded voices vs computer voice')[-1]
    row = next((l for l in sec.split('\n') if l.startswith('| iPhone | 115 |')), '')
    ok('| 2 | 50 | 80% | 20% | 0% | suspended 6, noClip 4 |' in row, 'A8 iPhone b115: 2 matches, 50 lines, 80% clips, 20% computer voice, reasons suspended 6, noClip 4 — got: ' + row)
    ok('| 20% | playing 80% · blocked: audio suspended 40 | playback |' in row, 'A8 audio not running 20% of samples, music playing 80% (blocked: audio suspended), session playback — got: ' + row)
    rj3 = json.load(open(os.path.join(out3, 'report-latest.json'))) if r.returncode == 0 else {}
    ok((rj3.get('vox') or {}).get('iPhone b115', {}).get('clipPct') == 80, 'A8 report-latest.json carries vox per device/build — got: ' + str(rj3.get('vox')))

    # A9: autoplay health — how each autoplay page ended (the next load's lifeEnd record, else its last-gasp beacon), wake-lock releases
    # by cause and suspends, per device. Built for the Chromebook that went silent mid-match with nothing in the log to say why.
    CB = 'Chromebook · 4 cores'
    n1 = {'wlGot': 3, 'wlDenied': 1, 'wlUs': 0, 'wlHidden': 1, 'wlSystem': 1, 'wlRe': 1, 'sus': 1, 'susS': 7300, 'frz': 0, 'hid': 1, 'off': 0}
    ah = [
        dict(MATCH, id='a1-1', sid='a1', build='118', role='autoplay', device=CB, game=180, life={'wlGot': 2, 'wlSystem': 1, 'wlRe': 1, 'sus': 0, 'susS': 0}),
        {'v': 2, 'kind': 'lifeEnd', 'sid': 'a1', 'build': '118', 'device': CB, 'how': 'vanished', 'reason': 'no lifecycle event: power loss, crash, or the browser/OS killed it',
         'lastSeen': '2026-11-18T06:27:10.000Z', 'agoS': 3600, 'auto': True, 'n': n1, 'line': 'previous session ended: vanished (...)'},
        {'v': 2, 'kind': 'lifeEnd', 'sid': 'a2', 'build': '118', 'device': CB, 'how': 'suspended', 'reason': 'page frozen by the browser, then nothing',
         'lastSeen': '2026-11-17T21:28:00.000Z', 'auto': True, 'n': {'wlGot': 1, 'wlHidden': 1, 'frz': 1, 'hid': 1}},
        {'v': 2, 'kind': 'gasp', 'sid': 'a3', 'build': '118', 'device': CB, 'why': 'hidden', 'at': '2026-11-18T07:00:00.000Z', 'auto': True, 'n': {'wlGot': 1, 'wlHidden': 1, 'hid': 1}},
        {'v': 2, 'kind': 'gasp', 'sid': 'a3', 'build': '118', 'device': CB, 'why': 'pagehide', 'at': '2026-11-18T07:00:01.000Z', 'auto': True, 'n': {'wlGot': 1, 'wlHidden': 1, 'hid': 1, 'wlUs': 1}},
        {'v': 2, 'kind': 'lifeEnd', 'sid': 't1', 'build': '118', 'device': CB, 'how': 'vanished', 'reason': 'x', 'auto': True, 'test': True, 'n': {'wlGot': 50}},  # a test run: left out
        dict(MATCH, id='old-1', sid='old', build='110', role='autoplay', device='MacBook · Apple M-series'),  # an old build: nothing recorded
    ]
    arch4 = tempfile.mkdtemp(prefix='sd-arch-'); out4 = tempfile.mkdtemp(prefix='sd-out-')
    with open(os.path.join(arch4, 'fixture-playlog.txt'), 'w') as f:
        for x in [SESSION] + ah: f.write(json.dumps(x) + '\n')
    r = subprocess.run([sys.executable, os.path.join(HERE, 'analyze.py'), arch4, out4], capture_output=True, text=True)
    md4 = open(os.path.join(out4, 'report-latest.md')).read() if r.returncode == 0 else ''
    ok(r.returncode == 0 and '### Autoplay health' in md4, 'A9 the report has an Autoplay health section ' + r.stderr[-300:])
    cb = next((l for l in md4.split('\n') if l.startswith('- **Chromebook** autoplay health')), '')
    print('     ' + cb)
    ok('3 sessions · ended: suspended 1, vanished 1, not reloaded yet, last gasp pagehide 1 ·' in cb, 'A9 Chromebook: 3 autoplay sessions, how each ended (test run left out) — got: ' + cb)
    ok('wake lock: acquired 5, denied 1, released by tab hidden 3, by the system 1, by us 1 (asked again 1)' in cb, 'A9 wake-lock releases by cause, summed over sessions (largest copy per session) — got: ' + cb)
    ok('suspends 1 (7300 s asleep or frozen) · hidden 3×, frozen 1×' in cb, 'A9 suspends and hidden/frozen counts — got: ' + cb)
    ok('last stop: vanished (no lifecycle event: power loss, crash, or the browser/OS killed it), last seen 2026-11-18T06:27:10.000Z' in cb, 'A9 the latest stop with its reason and last-seen time — got: ' + cb)
    ok('- **MacBook** autoplay health: 1 sessions · page lifecycle not recorded yet' in md4, 'A9 an old build without lifecycle data says so')
    rj4 = json.load(open(os.path.join(out4, 'report-latest.json'))) if r.returncode == 0 else {}
    ok((rj4.get('autoplayHealth') or {}).get('Chromebook', {}).get('ended', {}).get('vanished') == 1, 'A9 report-latest.json carries autoplayHealth per device — got: ' + str(rj4.get('autoplayHealth')))

    # A10: self-heal (Build 119) — every heal record counts in the Autoplay health line: reloads by cause (memory, planned refresh,
    # lost GPU context, stalled frames), rate-limited ones, and the new game frames the launcher (autoplay.html) started after a crash.
    MB = 'MacBook · Apple M-series'
    hr = lambda sid, at, why, action, **k: dict({'v': 2, 'kind': 'heal', 'sid': sid, 'build': '119', 'device': MB, 'at': at, 'why': why, 'action': action, 'auto': True, 'upS': 5400, 'detail': why + ' detail', 'mem': {'g': 640, 'heapMB': 210}}, **k)
    he = [
        dict(MATCH, id='h1-1', sid='h1', build='119', role='autoplay', device=MB, game=180),
        hr('h1', '2026-11-18T01:00:00.000Z', 'memory', 'rate-limited', waitS=600),
        hr('h1', '2026-11-18T01:10:00.000Z', 'memory', 'reload'),
        hr('h1', '2026-11-18T01:10:00.000Z', 'memory', 'reload'),  # the same record uploaded twice: counted once
        hr('h2', '2026-11-18T02:40:00.000Z', 'refresh', 'reload'),
        hr('h3', '2026-11-18T03:00:00.000Z', 'gpu', 'reload'),
        hr('h4', '2026-11-18T03:30:00.000Z', 'stall', 'reload'),
        hr('h5', '2026-11-18T04:00:00.000Z', 'frame dead', 'new frame', by='launcher', detail='no heartbeat from the game for 121 s', upS=10),
        hr('h5', '2026-11-18T03:59:30.000Z', 'launcher', 'isolation', own=True, by='launcher'),
        hr('h6', '2026-11-18T05:00:00.000Z', 'refresh', 'reload', test=True),  # a test run: left out
    ]
    arch5 = tempfile.mkdtemp(prefix='sd-arch-'); out5 = tempfile.mkdtemp(prefix='sd-out-')
    with open(os.path.join(arch5, 'fixture-playlog.txt'), 'w') as f:
        for x in [SESSION] + he: f.write(json.dumps(x) + '\n')
    r = subprocess.run([sys.executable, os.path.join(HERE, 'analyze.py'), arch5, out5], capture_output=True, text=True)
    md5 = open(os.path.join(out5, 'report-latest.md')).read() if r.returncode == 0 else ''
    mb = next((l for l in md5.split('\n') if l.startswith('- **MacBook** autoplay health')), '')
    print('     ' + mb)
    ok('self-heal reloads 4 (memory 1, refresh 1, gpu 1, stall 1), rate-limited 1, new game frames from the launcher 1 (frame dead 1)' in mb, 'A10 self-heal reloads by cause, rate-limited, launcher frames (duplicate upload and test run left out) — got: ' + mb + r.stderr[-300:])
    ok('· launcher frame in its own process 1×, shared 0×' in mb, 'A10 the launcher\'s process check — got: ' + mb)
    ok('· last: frame dead new frame after 0 min (no heartbeat from the game for 121 s; geometries 640, heap 210 MB)' in mb, 'A10 the latest self-heal action with why, uptime and memory — got: ' + mb)
    rj5 = json.load(open(os.path.join(out5, 'report-latest.json'))) if r.returncode == 0 else {}
    ok(((rj5.get('autoplayHealth') or {}).get('MacBook', {}).get('heal') or {}).get('reloads') == {'memory': 1, 'refresh': 1, 'gpu': 1, 'stall': 1}, 'A10 report-latest.json carries the heal counts — got: ' + str(rj5.get('autoplayHealth')))

    # A11: focus share in the Regression check — Builds 114-122 dropped the slow moments of a visible but unfocused window, so the Chromebook's
    # 114 -> 118 'slow s/h 583 -> 3280' compared a mostly unfocused build (16 of 54 matches ended focused) with a focused one (31 of 33).
    # The line must say the focus differs and slow s/h is not comparable; similar focus (and old records without focusedNow) add no note.
    CB = 'Chromebook · 4 cores'
    def fm(i, build, focused, slow, dev=CB):
        return dict(MATCH, id=f'f{build}-{i}-{dev[:3]}', sid='f1', build=build, device=dev, game=1200, start=f'2026-11-18T{10 + i:02d}:00:00.000Z',
                    fps=dict(MATCH['fps'], med=20, p5=15, low1=12), slow=dict(MATCH['slow'], secs=slow),
                    env={'throttledS': 0, 'hiddenS': 0, 'unfocusedS': 0 if focused else 1100, 'focusedNow': focused})
    fx = [fm(i, '114', i < 1, 194.4) for i in range(3)] + [fm(i, '118', True, 1093.4) for i in range(3)]  # 33% vs 100% focused: 583 -> 3280 slow s/h
    fx += [fm(i, '117', True, 100, MB) for i in range(3)] + [fm(i, '118', i < 2, 400, MB) for i in range(3)]  # 100% vs 67%: no note
    arch6 = tempfile.mkdtemp(prefix='sd-arch-'); out6 = tempfile.mkdtemp(prefix='sd-out-')
    with open(os.path.join(arch6, 'fixture-playlog.txt'), 'w') as f:
        for x in [SESSION] + fx: f.write(json.dumps(x) + '\n')
    r = subprocess.run([sys.executable, os.path.join(HERE, 'analyze.py'), arch6, out6], capture_output=True, text=True)
    md6 = open(os.path.join(out6, 'report-latest.md')).read() if r.returncode == 0 else ''
    rc = md6.split('### Regression check')[-1].split('\n\n')[1] if '### Regression check' in md6 else ''
    cbl = next((l for l in rc.split('\n') if 'Chromebook' in l), ''); mbl = next((l for l in rc.split('\n') if 'MacBook' in l), '')
    print('     ' + cbl); print('     ' + mbl)
    ok('slow s/h 583.2 -> 3280.2' in cbl and cbl.endswith('(focus differs: 33% vs 100% of matches ended focused — slow s/h not comparable)'), 'A11 Chromebook 114 -> 118: the REGRESSION line says the focused share differs — got: ' + cbl + r.stderr[-300:])
    ok('REGRESSION' in mbl and 'focus differs' not in mbl, 'A11 MacBook 117 -> 118 (100% vs 67% focused): no focus note — got: ' + mbl)
    ok('focus differs' not in md.split('### Regression check')[-1].split('###')[0], 'A11 records without focusedNow add no focus note')
    tr6 = json.load(open(os.path.join(out6, 'trend.json')))['perf'] if r.returncode == 0 else []
    ok(sorted((x['device'], x['build'], x.get('focusedPct')) for x in tr6) == [('Chromebook', 114, 33), ('Chromebook', 118, 100), ('MacBook', 117, 100), ('MacBook', 118, 67)], 'A11 trend.json carries focusedPct per device/build — got: ' + str([(x['device'], x['build'], x.get('focusedPct')) for x in tr6]))

    print('FAILED ' + str(len(fails)) if fails else 'ALL PASS')
    return 1 if fails else 0

if __name__ == '__main__':
    sys.exit(main())
