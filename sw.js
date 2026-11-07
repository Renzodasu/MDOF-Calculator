/* Offline copy of the calculator. Bump C when three.min.js or icons change. */
const C='mdof-v1';
const CORE=['./','index.html','three.min.js','manifest.webmanifest','icon-180.png','icon-192.png','icon-512.png'];
self.addEventListener('install',e=>e.waitUntil(caches.open(C).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys()
  .then(ks=>Promise.all(ks.filter(k=>k!==C).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{
  const r=e.request,u=new URL(r.url);
  if(r.method!=='GET'||u.origin!==location.origin)return;
  if(r.mode==='navigate'){            // network first, so a redeploy shows up at once
    u.search='';
    e.respondWith(fetch(r).then(res=>{const cp=res.clone();caches.open(C).then(c=>c.put(u.href,cp));return res;})
      .catch(()=>caches.match(u.href).then(h=>h||caches.match('index.html'))));
    return;
  }
  e.respondWith(caches.match(r).then(h=>h||fetch(r).then(res=>{
    if(res.ok){const cp=res.clone();caches.open(C).then(c=>c.put(r,cp));}return res;})));
});
