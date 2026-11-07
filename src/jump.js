
const {chromium}=require('C:/Users/Administrator/AppData/Local/npm-cache/_npx/13ab0715f9f30c2e/node_modules/playwright');
const path=require('path');
(async()=>{const b=await chromium.launch({channel:'chrome',args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
for(const [w,h,mob] of [[1440,900,false],[390,844,true]]){
 const p=await b.newPage({viewport:{width:w,height:h},isMobile:mob,hasTouch:mob,deviceScaleFactor:1});
 const errs=[];p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});p.on('pageerror',e=>errs.push(e.message));
 await p.goto('file:///'+path.resolve(__dirname,'../index.html').replace(/\\/g,'/'));
 await p.evaluate(()=>document.querySelector('#next').scrollIntoView({block:'center'}));await p.waitForTimeout(600);
 const ys=new Set(),sc=new Set(),bh=new Set();
 for(let i=0;i<40;i++){const r=await p.evaluate(()=>({y:Math.round(document.querySelector('#next').getBoundingClientRect().top),s:Math.round(scrollY),h:Math.round(document.querySelector('.tour-body').getBoundingClientRect().height)}));ys.add(r.y);sc.add(r.s);bh.add(r.h);await p.click('#next');await p.waitForTimeout(250);}
 console.log(w,'nextY',[...ys],'scrollY',[...sc],'bodyH',[...bh],'errs',errs.length);
 await p.evaluate(()=>{show(CHAPTERS.length-1,CHAPTERS[CHAPTERS.length-1].frames.length-1)});await p.waitForTimeout(2500);
 await p.locator('.tour-shell').screenshot({path:path.resolve(__dirname,'../screenshots/'+(mob?'85-phone-motion.png':'84-both-motion.png'))});
 if(!mob){await p.evaluate(()=>{show(0,0)});await p.waitForTimeout(1800);await p.locator('.tour-shell').screenshot({path:path.resolve(__dirname,'../screenshots/86-both-frame.png')});}
}
await b.close();})();