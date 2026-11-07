/* node src/check3d.js — 3D view, share link round-trip, calculator card, offline worker */
const path=require('path'),http=require('http'),fs=require('fs');
const {chromium}=require('C:/Users/Administrator/AppData/Local/npm-cache/_npx/13ab0715f9f30c2e/node_modules/playwright');
const dir=path.join(__dirname,'..'),T={'.html':'text/html','.js':'text/javascript','.png':'image/png','.webmanifest':'application/manifest+json'};
const srv=http.createServer((q,r)=>{let f=decodeURIComponent(q.url.split('?')[0]);if(f==='/')f='/index.html';
  fs.readFile(path.join(dir,f),(e,d)=>{if(e){r.writeHead(404);r.end();return;}r.writeHead(200,{'Content-Type':T[path.extname(f)]||'text/plain'});r.end(d);});}).listen(5098);
(async()=>{
  const b=await chromium.launch({channel:'chrome',args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  const ctx=await b.newContext({viewport:{width:1440,height:900}});
  const p=await ctx.newPage(),errs=[];
  p.on('pageerror',e=>errs.push('pageerror: '+e.message));
  p.on('console',m=>{if(m.type()==='error')errs.push('console: '+m.text());});
  await p.goto('http://127.0.0.1:5098/');await p.waitForTimeout(1500);
  const s0=await p.evaluate(()=>({view:VIEW,canvas:!!document.querySelector('#stage-3d canvas'),vis:!document.querySelector('#stage-3d').hidden,
    svg:!document.querySelector('#stage-svg').hidden,firstSec:document.querySelector('main section.sec').id,sw:'serviceWorker' in navigator}));
  console.log('frame chapter, default view:',JSON.stringify(s0));
  await p.locator('#tour').scrollIntoViewIfNeeded();await p.waitForTimeout(600);
  await p.screenshot({path:path.join(dir,'screenshots/80-3d-both.png'),clip:await p.locator('.tour-shell').boundingBox()});
  await p.evaluate(()=>show(2,0));await p.waitForTimeout(400);
  console.log('matrices chapter:',JSON.stringify(await p.evaluate(()=>({d3:!document.querySelector('#stage-3d').hidden,note:!document.querySelector('#v3-note').hidden}))));
  const mc=await p.evaluate(()=>{for(let i=0;i<CHAPTERS.length;i++)if(CHAPTERS[i].id==='motion')return i;});
  await p.evaluate(c=>show(c,0),mc);await p.click('#view-seg button[data-v="3d"]');await p.waitForTimeout(1200);
  console.log('motion mode 1, 3D only:',JSON.stringify(await p.evaluate(()=>({d3:!document.querySelector('#stage-3d').hidden,svg:!document.querySelector('#stage-svg').hidden,disp:LIVE&&LIVE.disp&&LIVE.disp.map(v=>+v.toFixed(3)),url:location.search}))));
  await p.screenshot({path:path.join(dir,'screenshots/81-3d-motion.png'),clip:await p.locator('.tour-shell').boundingBox()});
  // share round trip
  await p.click('#floors-seg button[data-n="2"]');await p.fill('#in-fc','28');await p.waitForTimeout(400);
  const url=await p.evaluate(()=>location.href);
  const p2=await ctx.newPage();p2.on('pageerror',e=>errs.push('p2 pageerror: '+e.message));
  await p2.goto(url);await p2.waitForTimeout(900);
  console.log('shared url:',url.replace('http://127.0.0.1:5098',''));
  console.log('reopened:',JSON.stringify(await p2.evaluate(()=>({n:S.n,fc:S.fc,view:VIEW,f1:model.freq[0].toFixed(4),inFc:document.querySelector('#in-fc').value}))));
  console.log('evil url:',JSON.stringify(await (async()=>{await p2.goto('http://127.0.0.1:5098/?n=9&fc=-5&h=1,%3Cb%3E&ic=x&v=zz');await p2.waitForTimeout(700);
    return p2.evaluate(()=>({n:S.n,fc:S.fc,hs:S.hs,ic:S.ic,view:VIEW}));})()));
  await p2.goto('http://127.0.0.1:5098/');await p2.waitForTimeout(800);
  console.log('calc card:',(await p2.locator('#ans-calc').innerText()).replace(/\s+/g,' ').slice(0,420));
  await p2.locator('#ans-calc').scrollIntoViewIfNeeded();
  await p2.screenshot({path:path.join(dir,'screenshots/82-calc.png'),clip:await p2.locator('#ans-calc').locator('..').boundingBox()});
  // offline
  await p2.waitForTimeout(1500);
  const ready=await p2.evaluate(async()=>{const r=await navigator.serviceWorker.ready;return !!r.active;});
  await ctx.setOffline(true);await p2.reload();await p2.waitForTimeout(1200);
  console.log('offline reload:',JSON.stringify({swActive:ready,title:await p2.title(),f1:await p2.evaluate(()=>document.querySelector('#h-f1').textContent)}));
  await ctx.setOffline(false);
  // phone
  const m=await b.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2});
  m.on('pageerror',e=>errs.push('mobile pageerror: '+e.message));
  await m.goto('http://127.0.0.1:5098/');await m.waitForTimeout(1500);
  await m.locator('#tour').scrollIntoViewIfNeeded();await m.waitForTimeout(500);
  console.log('mobile:',JSON.stringify(await m.evaluate(()=>({view:VIEW,docW:document.documentElement.scrollWidth,h3d:document.querySelector('#stage-3d').clientHeight}))));
  await m.screenshot({path:path.join(dir,'screenshots/83-phone-3d.png')});
  console.log(errs.length?'ERRORS\n'+errs.join('\n'):'no console errors');
  await b.close();srv.close();process.exit(errs.length?1:0);
})();
