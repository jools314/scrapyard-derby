// Play log upload: a recording dropUpload stub (flaky: the first calls fail), an error trigger, match end, a reload mid-match.
// Every record must arrive exactly once: none twice, none skipped.
const { open } = require('./harness');
(async () => {
  const { browser, page, errors } = await open({ viewport: { width: 800, height: 500 } });
  const fails = []; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails.push(m); };
  const W = (ms) => page.waitForTimeout(ms);
  // the stub lives in localStorage too, so the calls of both page loads are counted
  await page.addInitScript(() => {
    window.dropUpload = async (kind, text) => {
      const st = JSON.parse(localStorage.getItem('test-up') || '{"n":0,"calls":[]}'); st.n++;
      const fail = st.n <= +(localStorage.getItem('test-failfirst') || 0) || localStorage.getItem('test-offline') === '1';
      st.calls.push({ at: Date.now(), kind, ok: !fail, len: text.length, text: fail ? '' : text, head: text.split('\n')[0] });
      localStorage.setItem('test-up', JSON.stringify(st));
      await new Promise((r) => setTimeout(r, 150));
      return !fail;
    };
  });
  await page.evaluate(() => { for (const k of Object.keys(localStorage)) if (k.startsWith('derby-pl') || k.startsWith('test-')) localStorage.removeItem(k); localStorage.setItem('test-failfirst', '2'); });
  await page.reload({ timeout: 180000 }); await page.waitForFunction(() => window.__derby, null, { timeout: 180000 });
  await page.evaluate(() => { window.__noRender = true; __derby.S.aiCount = 5; document.getElementById('btnStart').click(); });
  await page.waitForFunction(() => __derby.PLAYLOG.m && __derby.game.countdown <= 0, null, { timeout: 60000 });
  await page.waitForFunction(() => __derby.game.time >= 5, null, { timeout: 120000, polling: 500 });
  // (the page-load upload at 8 s may already have gone: note how many calls there are, then throw)
  const n0 = await page.evaluate(() => JSON.parse(localStorage.getItem('test-up') || '{"n":0}').n);
  const tErr = await page.evaluate(() => { setTimeout(() => { throw new Error('upload-trigger-test'); }); return Date.now(); });
  const first = await page.waitForFunction((n0) => { const st = JSON.parse(localStorage.getItem('test-up') || '{"n":0,"calls":[]}'); return st.n > n0 && st.calls[n0].at; }, n0, { timeout: 30000, polling: 250 }).then((h) => h.jsonValue()).catch(() => null);
  ok(first && first - tErr < 13000, `an upload ${first ? Math.round((first - tErr) / 100) / 10 + ' s' : 'never'} after a script error`);
  // flaky: the first two calls fail; the retry (15 s, then 30 s) gets through
  await page.waitForFunction(() => JSON.parse(localStorage.getItem('test-up')).calls.some((c) => c.ok), null, { timeout: 90000, polling: 500 }).catch(() => {});
  const s1 = await page.evaluate(() => JSON.parse(localStorage.getItem('test-up')));
  ok(s1.calls.filter((c) => !c.ok).length >= 1 && s1.calls.some((c) => c.ok), `flaky uploader: ${s1.calls.map((c) => c.ok ? 'ok' : 'fail').join(',')}`);
  ok(s1.calls.some((c) => c.ok && /"kind":"ck"/.test(c.text) && c.text.includes('upload-trigger-test')), 'the uploaded checkpoint carries the error');
  // offline for a while: a match end queues, nothing is lost
  await page.evaluate(() => localStorage.setItem('test-offline', '1'));
  await page.evaluate(() => __derby.startMatch()); // match end -> upload (fails)
  await page.waitForFunction(() => __derby.PLAYLOG.m && __derby.game.countdown <= 0, null, { timeout: 60000 });
  await W(3000);
  const q1 = await page.evaluate(() => { const o = __derby.PLAYLOG.meta(); return o.idx.filter((e) => e[0] > o.up).length; });
  ok(q1 >= 1, `offline: ${q1} record(s) waiting`);
  await page.evaluate(() => { localStorage.setItem('test-offline', '0'); dispatchEvent(new Event('online')); });
  await page.waitForFunction(() => { const o = __derby.PLAYLOG.meta(); return o.idx.filter((e) => e[0] > o.up).length === 0; }, null, { timeout: 30000, polling: 500 }).catch(() => {});
  ok(await page.evaluate(() => { const o = __derby.PLAYLOG.meta(); return o.idx.filter((e) => e[0] > o.up).length === 0; }), 'back online: queue empty');
  // reload mid-match: the closed match is recovered on the next load and uploaded with the page-load upload
  await page.waitForFunction(() => __derby.game.time >= 5, null, { timeout: 120000, polling: 500 });
  const idLive = await page.evaluate(() => __derby.PLAYLOG.m.id);
  await page.reload({ timeout: 180000 }); await page.waitForFunction(() => window.__derby, null, { timeout: 180000 });
  await page.waitForFunction(() => { const o = __derby.PLAYLOG.meta(); return o.idx.length > 0 && o.idx.filter((e) => e[0] > o.up).length === 0; }, null, { timeout: 60000, polling: 1000 }).catch(() => {});
  await W(2000);
  const fin = await page.evaluate(() => { const P = __derby.PLAYLOG, o = P.meta(); return { up: o.up, seq: o.seq, stored: P.records().map((s) => JSON.parse(s)), st: JSON.parse(localStorage.getItem('test-up')), meter: P.meterText() }; });
  const sent = []; for (const c of fin.st.calls) if (c.ok) for (const l of c.text.split('\n').slice(1)) { const r = JSON.parse(l); sent.push(r); }
  const seqs = sent.map((r) => r.seq), dup = seqs.filter((x, i) => seqs.indexOf(x) !== i);
  console.log('calls:', fin.st.calls.map((c) => `${c.ok ? 'ok' : 'FAIL'} ${c.len}B ${c.head.replace(/^#derby-playlog v2 /, '').replace(/dev=\S+ sid=\S+ /, '')}`).join('\n  '));
  console.log('sent seqs', seqs.join(','), '· stored', fin.stored.map((r) => r.seq + ':' + r.kind).join(','));
  ok(dup.length === 0, 'no record sent twice ' + JSON.stringify(dup));
  const missing = fin.stored.filter((r) => !seqs.includes(r.seq));
  ok(missing.length === 0 && fin.up === fin.seq, `nothing skipped: every stored record was sent (cursor ${fin.up} of ${fin.seq}) ${JSON.stringify(missing.map((r) => r.seq))}`);
  ok(sent.some((r) => r.kind === 'match' && r.id === idLive && r.recovered), 'the match cut off by the reload was recovered and uploaded');
  ok(fin.st.calls.every((c) => c.kind === 'playlog' && c.len <= 200 * 1024), 'kind playlog, chunks ≤ 200 KB');
  console.log('meter:', fin.meter); ok(/uploaded up to .* · 0 waiting/.test(fin.meter), 'meter shows the upload');
  // a big backlog goes up in ≤ 200 KB chunks, none lost
  const big = await page.evaluate(async () => { const P = __derby.PLAYLOG; for (let i = 0; i < 30; i++) P.add({ kind: 'test', build: '64', i, pad: 'y'.repeat(20000) }); P.add({ kind: 'test', build: '64', huge: 'z'.repeat(450000) });
    const n0 = JSON.parse(localStorage.getItem('test-up')).calls.length; await P.upload('test backlog'); const st = JSON.parse(localStorage.getItem('test-up')), c = st.calls.slice(n0), o = P.meta();
    return { calls: c.length, max: Math.max(...c.map((x) => new Blob([x.text]).size)), parts: c.filter((x) => / part=/.test(x.head)).length, pend: o.idx.filter((e) => e[0] > o.up).length }; });
  ok(big.calls >= 4 && big.max <= 200 * 1024 && big.parts >= 3 && big.pend === 0, `backlog of ~1 MB: ${big.calls} uploads, biggest ${big.max} B, an oversize record in ${big.parts} parts, ${big.pend} left`);
  const errs = errors.filter((e) => !e.includes('ERR_FAILED') && !/^warning/.test(e) && !e.includes('upload-trigger-test'));
  ok(errs.length === 0, 'no other page errors ' + JSON.stringify(errs.slice(0, 5)));
  console.log(fails.length ? `FAILED ${fails.length}` : 'ALL PASS'); process.exitCode = fails.length ? 1 : 0;
  await browser.close();
})().catch((e) => { console.log('CRASH', e); process.exit(1); });
