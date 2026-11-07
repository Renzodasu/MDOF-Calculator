/* Rebuild ../index.html from the parts.
     node src/build.js [https://your-project.vercel.app]
   Every absolute URL (canonical, og:*, twitter:*) is a __SITE__ token, filled in
   from site.json or the argument, so the page can move hosts without a search. */
const fs=require('fs'),path=require('path');
const root=path.join(__dirname,'..');
const r=f=>fs.readFileSync(path.join(__dirname,f),'utf8');
const cfg=JSON.parse(r('site.json'));

function build(arg){
  const site=((arg||cfg.url||'')).replace(/\/+$/,'');
  if(!site) throw new Error('no site url: set "url" in site.json or pass one');
  let out=r('g1.html')+r('g2.html')+'<script>\n'+r('engine.js')+r('math.js')+r('g3a.js')+r('g3b.js')+r('g3d.js')+r('g3c.js')+'\n</script>\n</body>\n</html>\n';
  out=out.split('__SITE__').join(site);
  if(out.indexOf('__SITE__')>=0) throw new Error('unfilled __SITE__ token');
  fs.writeFileSync(path.join(root,'index.html'),out);
  return {site,size:out.length};
}
if(require.main===module){
  const o=build(process.argv[2]);
  console.log('site url:',o.site);
  console.log('index.html',o.size,'chars');
}
module.exports={build,cfg};
