/* Assemble the Vercel bundle and zip it.
     node src/pack.js [https://your-project.vercel.app]
   Output: ../vercel/ (upload this folder) and ../mdof-vercel.zip */
const fs=require('fs'),path=require('path'),{execFileSync}=require('child_process');
const root=path.join(__dirname,'..');
const {build}=require('./build.js');

const site=((process.argv[2]||'')).replace(/\/+$/,'');
const {site:url}=build(site||undefined);
const out=path.join(root,'vercel');
fs.rmSync(out,{recursive:true,force:true});
fs.mkdirSync(out);

const files=['index.html','detailed.html','README.md','mdof_solver.py','mdof_eigen.c',
  'manifest.webmanifest','og.png','three.min.js','sw.js','icon-180.png','icon-192.png','icon-512.png'];
for(const f of files){
  const p=path.join(root,f);
  if(!fs.existsSync(p)) throw new Error('missing '+f);
  fs.copyFileSync(p,path.join(out,f));
}

fs.writeFileSync(path.join(out,'robots.txt'),
  'User-agent: *\nAllow: /\n\nSitemap: '+url+'/sitemap.xml\n');

fs.writeFileSync(path.join(out,'sitemap.xml'),
  '<?xml version="1.0" encoding="UTF-8"?>\n'+
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'+
  '  <url><loc>'+url+'/</loc><changefreq>monthly</changefreq><priority>1.0</priority></url>\n'+
  '  <url><loc>'+url+'/detailed.html</loc><changefreq>monthly</changefreq><priority>0.6</priority></url>\n'+
  '</urlset>\n');

fs.writeFileSync(path.join(out,'vercel.json'),JSON.stringify({
  headers:[
    {source:'/(og|icon-180|icon-192|icon-512)\\.png',headers:[{key:'Cache-Control',value:'public,max-age=604800'}]},
    {source:'/(mdof_solver\\.py|mdof_eigen\\.c)',headers:[
      {key:'Content-Type',value:'text/plain; charset=utf-8'},
      {key:'Content-Disposition',value:'inline'}]},
    {source:'/sw.js',headers:[{key:'Cache-Control',value:'no-cache'}]},
    {source:'/three.min.js',headers:[{key:'Cache-Control',value:'public,max-age=2592000'}]},
    {source:'/(.*)',headers:[
      {key:'X-Content-Type-Options',value:'nosniff'},
      {key:'Referrer-Policy',value:'strict-origin-when-cross-origin'}]}
  ]
},null,2)+'\n');

fs.writeFileSync(path.join(out,'404.html'),`<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Page not found — MDOF Calculator</title>
<meta name="robots" content="noindex">
<style>
 :root{--ink:#0d0f14;--muted:#6b7280;--accent:#4f46e5;--line:#e9e9ee}
 *{box-sizing:border-box}
 body{margin:0;min-height:100vh;display:grid;place-items:center;background:#fafafb;
   font-family:"Segoe UI Variable Text","Segoe UI",system-ui,-apple-system,Arial,sans-serif;color:var(--ink)}
 .box{max-width:520px;padding:40px;text-align:center}
 .k{font:600 11px/1 ui-monospace,Consolas,monospace;letter-spacing:.14em;text-transform:uppercase;color:var(--muted)}
 h1{margin:14px 0 10px;font-size:34px;letter-spacing:-.03em}
 p{margin:0 0 26px;color:var(--muted);line-height:1.6}
 a{display:inline-block;background:var(--accent);color:#fff;text-decoration:none;font-weight:650;
   padding:13px 22px;border-radius:12px;box-shadow:0 10px 24px -14px rgba(79,70,229,.8)}
 a:focus-visible{outline:3px solid #c7c9ff;outline-offset:3px}
</style></head>
<body><div class="box">
 <div class="k">404 · no such page</div>
 <h1>That page is not part of the lesson</h1>
 <p>The calculator lives on the home page: storey stiffness, the eigenvalue problem,
    the mode shapes and the motion, all animated step by step.</p>
 <a href="/">Back to the MDOF Calculator</a>
</div></body></html>
`);

const zipPath=path.join(root,'mdof-vercel.zip');
fs.rmSync(zipPath,{force:true});
try{
  execFileSync('powershell',['-NoProfile','-Command',
    "Compress-Archive -Path '"+out.replace(/\\/g,'\\\\')+"\\*' -DestinationPath '"+zipPath.replace(/\\/g,'\\\\')+"' -Force"],{stdio:'pipe'});
}catch(e){
  console.log('powershell zip failed:',e.message);
}
const list=fs.readdirSync(out).sort();
console.log('site url:',url);
console.log('vercel/ :',list.join(', '));
console.log('zip     :',fs.existsSync(zipPath)?(fs.statSync(zipPath).size+' bytes'):'not created');
