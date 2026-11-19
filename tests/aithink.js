// AI think cost: a 12-opponent match (plus the autoplay driver), real time, ms of Car.think() per simulated frame (all cars together).
// A/B on a busy machine: GAMES=a.html,b.html ROUNDS=3 node tests/aithink.js alternates the builds and prints the median per build.
const { open } = require('./harness');
const GAMES = (process.env.GAMES || process.env.GAME || require('path').join(__dirname, '..', 'index.html')).split(','), ROUNDS = +(process.env.ROUNDS || 3), SECS = +(process.env.SECS || 25);
(async () => { const res = GAMES.map(() => []);
  for (let r = 0; r < ROUNDS; r++) for (let g = 0; g < GAMES.length; g++) { process.env.GAME = GAMES[g];
    const { browser, page } = await open({ viewport: { width: 320, height: 200 } }, () => { window.__noRender = true; });
    const ms = await page.evaluate(async (SECS) => { const D = __derby, sleep = (ms) => new Promise((r) => setTimeout(r, ms)); D.S.aiCount = 12;
      document.getElementById('btnAutoplay').click(); while (!(D.game.state === 'playing' && D.game.countdown <= 0)) await sleep(100); await sleep(3000);
      const P = Object.getPrototypeOf(D.cars[0]), o = P.think; let t = 0, n = 0, last = -1; P.think = function (dt) { const a = performance.now(); o.call(this, dt); t += performance.now() - a; if (D.simTime !== last) { last = D.simTime; n++; } };
      await sleep(SECS * 1000); P.think = o; return t / Math.max(1, n); }, SECS);
    await browser.close(); res[g].push(+ms.toFixed(3)); console.log(GAMES[g].split('/').pop(), 'round', r, ms.toFixed(3), 'ms/frame'); }
  const med = (a) => [...a].sort((x, y) => x - y)[a.length >> 1];
  GAMES.forEach((g, i) => console.log('AITHINK', g.split('/').pop(), 'median', med(res[i]), 'ms/frame', JSON.stringify(res[i])));
})();
