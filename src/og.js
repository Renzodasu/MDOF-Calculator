/* Render og.png (1200x630 link preview) from src/og.html */
const {chromium}=require('C:/Users/Administrator/AppData/Local/npm-cache/_npx/13ab0715f9f30c2e/node_modules/playwright');
const path=require('path'),fs=require('fs');
(async()=>{
  const b=await chromium.launch({channel:'chrome'});
  const p=await b.newPage({viewport:{width:1200,height:630},deviceScaleFactor:1});
  await p.goto('file:///'+path.join(__dirname,'og.html').replace(/\\/g,'/'));
  await p.waitForTimeout(500);
  const out=path.join(__dirname,'..','og.png');
  await p.screenshot({path:out,clip:{x:0,y:0,width:1200,height:630}});
  console.log('og.png',fs.statSync(out).size,'bytes');
  await b.close();
})();