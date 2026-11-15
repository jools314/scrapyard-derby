import json,sys
for f in sys.argv[1:]:
    d=json.loads(open(f).readline()); print('==',f,'gameS',d['gameS'],'phys',d['physTotal'],'stuck>=4s entries',d['stuck']['n'],d['stuck']['secs'],'s')
    print(f"{'veh':10} {'k':>3} {'d':>3} {'K/D':>5} {'k/min':>6} {'life':>5} {'wreck%':>6} {'stuck':>5} {'dmg':>5} {'taken':>5} {'fires':>5} phys")
    for k,v in d['veh'].items():
        if 'k' not in v: print(k, v['phys']); continue
        print(f"{k:10} {v['k']:3} {v['d']:3} {v.get('kd',0):5} {v.get('kPerMin',0):6} {v.get('avgLifeS',0):5} {v.get('wreckedPct',0):6} {v.get('stuckS',0):5} {v.get('dmg','-'):>5} {v.get('taken','-'):>5} {v.get('fires','-'):>5} {sum(v['phys'].values())}")
