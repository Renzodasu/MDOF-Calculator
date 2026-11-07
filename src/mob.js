const { chromium } = require('C:/Users/Administrator/AppData/Local/npm-cache/_npx/13ab0715f9f30c2e/node_modules/playwright');
const path = require('path');
const OUT = 'screenshots/';
(async () => {
  const b = await chromium.launch({ channel: 'chrome' });
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const p = await ctx.newPage();
  const errs = [];
  p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  p.on('pageerror', e => errs.push('PAGEERROR ' + e.message));
  await p.goto('file:///' + path.resolve(__dirname, '..', 'index.html').replace(/\\/g, '/'));
  await p.addStyleTag({ content: 'html{scroll-behavior:auto!important}' });
  await p.waitForTimeout(500);
  await p.evaluate(() => { document.querySelectorAll('.rv').forEach(e => e.classList.add('in')); });

  const report = await p.evaluate(() => {
    const vw = document.documentElement.clientWidth;
    const wide = [];
    document.querySelectorAll('body *').forEach(el => {
      const r = el.getBoundingClientRect();
      if (r.width > vw + 1 && r.height > 1 && getComputedStyle(el).position !== 'fixed') {
        wide.push({ tag: el.tagName.toLowerCase(), cls: (el.className || '').toString().slice(0, 40), w: Math.round(r.width), x: Math.round(r.x) });
      }
    });
    const pick = s => { const e = document.querySelector(s); if (!e) return null; const r = e.getBoundingClientRect(); const cs = getComputedStyle(e); return { w: Math.round(r.width), h: Math.round(r.height), x: Math.round(r.x), fs: cs.fontSize, ox: cs.overflowX }; };
    return {
      vw, scrollW: document.documentElement.scrollWidth,
      wide: wide.slice(0, 14),
      chapters: pick('#chapters'), prog: pick('#prog'), controls: pick('.controls'),
      stage: pick('.stage'), narr: pick('.narr'), seg: pick('.seg'),
      btn: pick('.btn'), inp: document.querySelector('.inp') ? getComputedStyle(document.querySelector('.inp')).fontSize : null,
      topsvg: pick('#stage-svg')
    };
  });
  console.log(JSON.stringify(report, null, 1));

  const shot = async (name, sel) => {
    if (sel) await p.evaluate(s => { const e = document.querySelector(s); window.scrollTo(0, e.getBoundingClientRect().top + window.scrollY - 54); }, sel);
    await p.waitForTimeout(700);
    await p.screenshot({ path: OUT + name + '.png' });
  };
  await p.waitForTimeout(600);
  await shot('m1-hero');
  await p.evaluate(() => { const t = document.querySelector('#tour'); window.scrollTo(0, t.getBoundingClientRect().top + window.scrollY - 54); });
  await p.waitForTimeout(400);
  await shot('m2-tour');
  await p.evaluate(() => document.querySelectorAll('#chapters button')[4].click());
  await p.waitForTimeout(900);
  await shot('m3-det');
  await p.evaluate(() => { const t = document.querySelector('#build'); window.scrollTo(0, t.getBoundingClientRect().top + window.scrollY - 54); });
  await p.waitForTimeout(400);
  await shot('m4-builder');
  await p.evaluate(() => { const t = document.querySelector('#answers'); window.scrollTo(0, t.getBoundingClientRect().top + window.scrollY - 54); });
  await p.waitForTimeout(400);
  await shot('m5-answers');
  console.log('errors', JSON.stringify(errs));
  await b.close();
})();
