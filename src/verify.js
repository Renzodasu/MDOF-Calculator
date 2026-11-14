/* Headless check of the built page:  node src/verify.js
   For each worked problem: loads it, walks every tour frame of every chapter, and
   fails on a console/page error, on "undefined"/"NaN" leaking into the narration,
   on answers that drift from the reference values below, or on sideways scroll on
   a phone. Needs Playwright with Chromium (npm i -g playwright). */
const path = require('path');
const { chromium } = require('playwright');
const url = 'file://' + path.resolve(__dirname, '..', 'index.html').replace(/\\/g, '/');

/* reference values: independent NumPy solution (scipy-free, eig of M^-1 K) */
const REF = {
  sir:   { k1: 10903.666, f: [5.314945, 15.782566, 29.785571], phi1: [0.756750, 0.946064, 1] },
  quiz1: { k1: 46395.7728, f: [6.822997, 19.117614, 27.625752], phi1: [0.445042, 0.801938, 1],
           phi2: [-1.246980, -0.554958, 1], phi3: [1.801938, -2.246980, 1], kcol: 11598.9432 }
};
const close = (a, b, tol) => Math.abs(a - b) <= tol * Math.max(1, Math.abs(b));

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  const errs = [];
  p.on('pageerror', e => errs.push('pageerror: ' + e.message));
  p.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
  let fail = 0;
  for (const key of ['sir', 'quiz1']) {
    await p.goto(url + '?p=' + key);
    await p.waitForTimeout(600);
    for (const floors of key === 'sir' ? [3, 2] : [3]) {
      await p.evaluate(n => { S.n = n; recompute(); }, floors);
      await p.waitForTimeout(250);
      const info = await p.evaluate(() => ({ names: CHAPTERS.map(c => c.name), frames: CHAPTERS.map(c => c.frames.length), steps: CHAPTERS.map(c => c.step) }));
      let frames = 0, bad = 0;
      for (let c = 0; c < info.frames.length; c++) for (let f = 0; f < info.frames[c]; f++) {
        await p.evaluate(([c, f]) => show(c, f), [c, f]);
        frames++;
        const r = await p.evaluate(() => /undefined|NaN|Infinity/.test(
          document.querySelector('.narr').textContent + (document.querySelector('#stage-svg') || {}).textContent));
        if (r) { bad++; console.log('  BAD TEXT', key, floors + 'S', 'chapter', c, 'frame', f); }
      }
      fail += bad;
      console.log(key.padEnd(6), floors + 'S', 'chapters=' + info.frames.length, 'frames=' + frames,
        'steps=[' + info.steps.join('') + ']', bad ? 'BAD=' + bad : 'text ok');
      console.log('        ' + info.names.join(' | '));
    }
    await p.evaluate(() => { S.n = 3; recompute(); });
    const m = await p.evaluate(() => ({ k1: model.k[0], kc: model.kc[0], f: model.freq, phi: model.phi,
      ans: document.querySelector('#ans-modes').textContent, sk: document.querySelectorAll('#ans-sketch circle').length,
      tag: (document.querySelector('#prob-seg button.on')||{textContent:'(own problem)'}).textContent, preset: presetOf(S),
      f4: document.querySelector('#ans-f').textContent }));
    const R = REF[key];
    const checks = [['k storey 1', m.k1, R.k1, 1e-4], ...R.f.map((v, i) => ['f' + (i + 1), m.f[i], v, 1e-4]),
      ...R.phi1.map((v, i) => ['phi1[' + i + ']', m.phi[0][i], v, 1e-4])];
    if (R.phi2) checks.push(...R.phi2.map((v, i) => ['phi2[' + i + ']', m.phi[1][i], v, 1e-4]), ...R.phi3.map((v, i) => ['phi3[' + i + ']', m.phi[2][i], v, 1e-4]), ['k column', m.kc, R.kcol, 1e-4]);
    const off = checks.filter(c => !close(c[1], c[2], c[3]));
    off.forEach(c => console.log('  MISMATCH', key, c[0], c[1], 'expected', c[2]));
    fail += off.length;
    if (!/\d\.\d{4}\b/.test(m.f4) || /\d\.\d{1,3}(?!\d)/.test(m.f4)) { console.log('  PRECISION: frequency table is not 4 dp'); fail++; }
    console.log('        numbers', off.length ? 'MISMATCH' : 'match reference (' + checks.length + ' values)', '· switch "' + m.tag.trim() + '" · preset=' + m.preset);
  }
  for (const w of [390, 768]) {
    await p.setViewportSize({ width: w, height: 844 });
    await p.goto(url + '?p=quiz1'); await p.waitForTimeout(500);
    const o = await p.evaluate(() => ({ doc: document.documentElement.scrollWidth, win: window.innerWidth }));
    console.log('width ' + w + '  scrollWidth=' + o.doc + (o.doc > o.win ? '  OVERFLOW' : '  ok'));
    if (o.doc > o.win) fail++;
  }
  console.log(errs.length ? 'ERRORS\n' + errs.slice(0, 8).join('\n') : 'no console errors');
  await b.close();
  process.exit(errs.length || fail ? 1 : 0);
})();
