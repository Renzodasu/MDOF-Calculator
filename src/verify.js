/* Headless smoke test: node src/verify.js   (needs playwright + chrome)
   Walks every frame of both floor counts and fails on any console/page error or
   any "undefined"/"NaN" leaking into the rendered narration. */
const path = require('path');
const { chromium } = require('C:/Users/Administrator/AppData/Local/npm-cache/_npx/13ab0715f9f30c2e/node_modules/playwright');
const url = 'file:///' + path.resolve(__dirname, '..', 'index.html').replace(/\\/g, '/');
(async () => {
  const b = await chromium.launch({ channel: 'chrome' });
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  const errs = [];
  p.on('pageerror', e => errs.push('pageerror: ' + e.message));
  p.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
  await p.goto(url);
  await p.waitForTimeout(700);
  let bad = 0;
  for (const floors of [3, 2]) {
    await p.evaluate(n => document.querySelector('#floors-seg').querySelectorAll('button')[n === 3 ? 1 : 0].click(), floors);
    await p.waitForTimeout(500);
    const info = await p.evaluate(() => ({ names: CHAPTERS.map(c => c.name), frames: CHAPTERS.map(c => c.frames.length) }));
    let fx = 0, fr = 0, gq = 0, frames = 0;
    for (let c = 0; c < info.frames.length; c++) for (let f = 0; f < info.frames[c]; f++) {
      await p.evaluate(([c, f]) => show(c, f), [c, f]);
      await p.waitForTimeout(45);
      frames++;
      const r = await p.evaluate(() => {
        const t = document.querySelector('#n-formula');
        return { math: t.classList.contains('math'), fr: t.querySelectorAll('.fr').length, gq: t.querySelectorAll('.gq').length,
          bad: /undefined|NaN/.test(t.textContent + (document.querySelector('#stage-svg') || {}).textContent) };
      });
      if (r.math) fx++;
      fr += r.fr; gq += r.gq;
      if (r.bad) { bad++; console.log('  BAD TEXT at', c, f); }
    }
    const chip = await p.evaluate(() => document.querySelector('#top-chip').textContent.replace(/\s+/g, ' ').trim());
    console.log(floors + 'S  tabs=' + info.frames.length + '  frames=' + frames + '  chapters=[' + info.names.join(', ') + ']');
    console.log('    typeset frames=' + fx + '  fractions=' + fr + '  glow spans=' + gq + '  chip="' + chip + '"');
  }
  await p.setViewportSize({ width: 390, height: 844 });
  await p.waitForTimeout(400);
  const m = await p.evaluate(() => ({ doc: document.documentElement.scrollWidth, win: window.innerWidth }));
  console.log('mobile  scrollWidth=' + m.doc + ' viewport=' + m.win + (m.doc > m.win ? '  OVERFLOW' : '  ok'));
  console.log(errs.length ? 'ERRORS\n' + errs.slice(0, 8).join('\n') : 'no console errors');
  await b.close();
  process.exit(errs.length || bad || m.doc > m.win ? 1 : 0);
})();