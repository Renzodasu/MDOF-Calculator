const { chromium } = require('C:/Users/Administrator/AppData/Local/npm-cache/_npx/13ab0715f9f30c2e/node_modules/playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const root = path.resolve(__dirname, '..', process.argv[2] || 'vercel');
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png',
               '.py': 'text/plain', '.c': 'text/plain', '.md': 'text/plain', '.xml': 'application/xml',
               '.txt': 'text/plain', '.json': 'application/json', '.webmanifest': 'application/manifest+json' };
const srv = http.createServer((req, res) => {
  let u = decodeURIComponent(req.url.split('?')[0]);
  if (u === '/') u = '/index.html';
  fs.readFile(path.join(root, u), (e, d) => {
    if (e) {
      fs.readFile(path.join(root, '404.html'), (e2, d2) => {
        if (e2) { res.writeHead(404); res.end('no'); return; }
        res.writeHead(404, { 'content-type': 'text/html' }); res.end(d2);
      });
      return;
    }
    res.writeHead(200, { 'content-type': mime[path.extname(u)] || 'application/octet-stream' });
    res.end(d);
  });
});
srv.listen(5099, '127.0.0.1', async () => {
  const b = await chromium.launch({ channel: 'chrome' });
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  const errs = [], failed = [];
  p.on('requestfailed', r => failed.push(r.url()));
  p.on('pageerror', e => errs.push(e.message));
  p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await p.goto('http://127.0.0.1:5099/');
  await p.waitForTimeout(900);
  const info = await p.evaluate(() => {
    const meta = n => { const el = document.querySelector('meta[property="' + n + '"]') || document.querySelector('meta[name="' + n + '"]'); return el ? el.content : null; };
    const can = document.querySelector('link[rel=canonical]');
    return {
      title: document.title,
      tabs: document.querySelectorAll('#chapters button').length,
      frames: document.querySelector('#frame-count').textContent,
      canonical: can && can.href,
      og: { title: meta('og:title'), image: meta('og:image'), w: meta('og:image:width'), h: meta('og:image:height'), url: meta('og:url'), alt: meta('og:image:alt') },
      tw: { card: meta('twitter:card'), image: meta('twitter:image'), alt: meta('twitter:image:alt') },
      robots: meta('robots'),
      token: document.documentElement.outerHTML.indexOf('__SITE__'),
      docW: document.documentElement.scrollWidth
    };
  });
  const codes = {};
  for (const h of ['detailed.html', 'mdof_solver.py', 'mdof_eigen.c', 'og.png', 'icon-180.png', 'icon-192.png', 'icon-512.png', 'manifest.webmanifest', 'robots.txt', 'sitemap.xml', 'vercel.json', 'nope-page']) {
    const r = await p.request.get('http://127.0.0.1:5099/' + h);
    codes[h] = r.status() + ' ' + (r.headers()['content-type'] || '') + (h === 'mdof_solver.py' ? '' : '');
  }
  await p.setViewportSize({ width: 390, height: 844 });
  await p.waitForTimeout(400);
  const mob = await p.evaluate(() => document.documentElement.scrollWidth);
  console.log(JSON.stringify({ info, codes, failed, errs, mob }, null, 1));
  await b.close(); srv.close();
});