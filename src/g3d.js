
/* ================= 3D view (three.js r159, fetched on first use) ================= */
var VIEW='2d', VDEF='2d', V3=null, V3wait=null, V3fail=false;
function reduced(){return !!(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches);}
/* 3D only where the building is the subject; matrices and determinants stay flat */
function v3Eligible(ch,fr){
  var c=CHAPTERS[ch];
  return c.id==='frame'||!!c.frames[fr].live||(/^mode\d/.test(c.id)&&fr===c.frames.length-1);
}
function loadThree(cb){
  if(window.THREE)return cb(true);
  if(V3wait){V3wait.push(cb);return;}
  V3wait=[cb];
  var s=document.createElement('script');s.src='three.min.js';
  function done(ok){var l=V3wait;V3wait=null;l.forEach(function(f){f(ok&&!!window.THREE);});}
  s.onload=function(){done(true);};s.onerror=function(){done(false);};
  document.head.appendChild(s);
}
function setView(v,quiet){
  if(V3fail&&v!=='2d'){toast('3D needs WebGL, which this browser does not offer',false);v='2d';}
  VIEW=v;
  $$('#view-seg button').forEach(function(b){b.classList.toggle('on',b.getAttribute('data-v')===v);});
  syncSeg($('#view-seg'));
  if(!quiet)syncURL();
  v3Apply();
}
function v3Apply(){
  var el=$('#stage-3d'),sv=$('#stage-svg'),want=VIEW!=='2d'&&v3Eligible(FI.ch,FI.fr);
  $('#v3-note').hidden=!(VIEW!=='2d'&&!want);
  $('#stage-views').classList.toggle('both',want&&VIEW==='both');
  $('.tour-body').classList.toggle('wide',want&&VIEW==='both');
  if(!want){el.hidden=true;sv.hidden=false;v3Stop();return;}
  sv.hidden=VIEW==='3d';
  el.hidden=false;
  loadThree(function(ok){
    if(!ok||!v3Init()){V3fail=true;setView('2d');return;}
    if(el.hidden)return;
    v3Build();v3Start();
  });
}
function v3Init(){
  if(V3)return true;
  try{
    var T=THREE,el=$('#stage-3d');
    var r=new T.WebGLRenderer({antialias:true,alpha:true});
    r.setPixelRatio(Math.min(window.devicePixelRatio||1,2));
    el.insertBefore(r.domElement,el.firstChild);
    var sc=new T.Scene();
    sc.add(new T.HemisphereLight(0xffffff,0xd8dae6,1.15));
    var dl=new T.DirectionalLight(0xffffff,1.7);dl.position.set(9,16,12);sc.add(dl);
    V3={r:r,sc:sc,cam:new T.PerspectiveCamera(32,1,0.1,800),az:0.7,el:0.3,spin:true,raf:null,t0:0,key:'',w:0,h:0,p:null};
    var cv=r.domElement,drag=null;
    cv.style.touchAction='pan-y';      /* vertical swipes still scroll the page on phones */
    cv.addEventListener('pointerdown',function(e){
      drag={x:e.clientX,y:e.clientY,az:V3.az,el:V3.el,m:e.pointerType==='mouse'};V3.spin=false;
      try{cv.setPointerCapture(e.pointerId);}catch(_){}
    });
    cv.addEventListener('pointermove',function(e){
      if(!drag)return;
      V3.az=drag.az-(e.clientX-drag.x)*0.008;
      if(drag.m)V3.el=Math.max(0.04,Math.min(1.25,drag.el+(e.clientY-drag.y)*0.006));
    });
    ['pointerup','pointercancel'].forEach(function(n){cv.addEventListener(n,function(){drag=null;});});
    return true;
  }catch(e){return false;}
}
function v3Build(){
  var m=model,n=m.N,key=JSON.stringify([m.hs,m.cols,S.b,S.h,S.B,S.sec,S.mat,S.geom,n]);
  if(V3.key===key)return;
  V3.key=key;
  var T=THREE,i,j;
  if(V3.p){V3.sc.remove(V3.p.root);V3.p.root.traverse(function(o){if(o.geometry)o.geometry.dispose();if(o.material)o.material.dispose();});}
  var root=new T.Group(),cols=m.cols||4,gx=Math.ceil(Math.sqrt(cols)),gz=Math.ceil(cols/gx);
  var L=6,W=gz>1?5:0,cw=(S.geom?Math.max(0.2,(S.sec==='hss'?S.B:S.sec==='solid'?Math.max(S.b,S.h):300)/1000):0.3)*1.3;   /* columns drawn 30% fat so they read */
  var xs=[];
  for(i=0;i<cols;i++){var a=i%gx,c=Math.floor(i/gx);xs.push([gx>1?-L/2+L*a/(gx-1):0,gz>1?-W/2+W*c/(gz-1):0]);}
  var ys=[0];for(i=0;i<n;i++)ys.push(ys[i]+m.hs[i]);
  var H=ys[n];
  var ground=new T.Mesh(new T.BoxGeometry(L+5,0.3,W+5),new T.MeshStandardMaterial({color:0xececf2,roughness:1}));
  ground.position.y=-0.15;root.add(ground);
  var colMat=new T.MeshStandardMaterial({color:(S.geom&&S.mat==='steel')?0x5b6476:0x8b90a0,roughness:(S.geom&&S.mat==='steel')?.45:.7,metalness:(S.geom&&S.mat==='steel')?.35:0});
  var ghost=new T.LineBasicMaterial({color:0x9aa1ab,transparent:true,opacity:.55});
  var columns=[],slabs=[];
  for(i=0;i<n;i++){
    for(j=0;j<xs.length;j++){
      var g=new T.BoxGeometry(cw,m.hs[i],cw,1,14,1);g.translate(0,m.hs[i]/2,0);
      var mesh=new T.Mesh(g,colMat);mesh.position.set(xs[j][0],ys[i],xs[j][1]);root.add(mesh);
      columns.push({g:g,mesh:mesh,x0:Float32Array.from(g.attributes.position.array),h:m.hs[i],f:i,bx:xs[j][0]});
    }
    var slab=new T.Mesh(new T.BoxGeometry(L+1.4,0.32,W+1.4),
      new T.MeshStandardMaterial({color:new T.Color(MC[i%MC.length]),roughness:.5,transparent:true,opacity:.92}));
    slab.position.set(0,ys[i+1]+0.16,0);root.add(slab);slabs.push(slab);
    slab.add(new T.LineSegments(new T.EdgesGeometry(slab.geometry),new T.LineBasicMaterial({color:new T.Color(MC[i%MC.length]).multiplyScalar(.6)})));
    var rest=new T.LineSegments(new T.EdgesGeometry(slab.geometry),ghost);rest.position.copy(slab.position);root.add(rest);   /* where the floor sits at rest */
  }
  V3.sc.add(root);
  V3.p={root:root,columns:columns,slabs:slabs,ys:ys,H:H,R:0.5*Math.sqrt(Math.pow(L+5,2)+H*H+Math.pow(W+5,2))};
}
function v3Disp(now){
  var n=model.N,d=[],i,c=CHAPTERS[FI.ch];
  if(LIVE&&LIVE.disp&&LIVE.disp.length===n)return LIVE.disp;
  if(/^mode\d/.test(c.id)){
    var r=+c.id.slice(4),ph=model.phi[r],mx=maxAbs(ph),sn=reduced()?0.8:Math.sin(2*Math.PI*now/modeDur(r));
    for(i=0;i<n;i++)d.push(ph[i]/mx*sn);
    return d;
  }
  for(i=0;i<n;i++)d.push(0);
  return d;
}
function v3Start(){if(!V3.raf){V3.t0=performance.now();V3.raf=requestAnimationFrame(v3Tick);}}
function v3Stop(){if(V3&&V3.raf){cancelAnimationFrame(V3.raf);V3.raf=null;}}
function v3Tick(now){
  V3.raf=requestAnimationFrame(v3Tick);
  var el=$('#stage-3d'),w=el.clientWidth,h=el.clientHeight,P=V3.p;
  if(!w||!h||!P)return;
  if(V3.w!==w||V3.h!==h){V3.r.setSize(w,h,false);V3.cam.aspect=w/h;V3.cam.updateProjectionMatrix();V3.w=w;V3.h=h;}
  /* fit the whole frame in the canvas whatever its shape */
  var hv=V3.cam.fov*Math.PI/360,hh=Math.atan(Math.tan(hv)*V3.cam.aspect),dist=P.R/Math.sin(Math.min(hv,hh))*0.68;
  if(V3.spin&&!reduced())V3.az+=0.0022;
  var d=v3Disp(now-V3.t0),A=0.05*P.H,n=P.slabs.length,i;   /* sway exaggerated to 5% of the height */
  P.columns.forEach(function(c){
    var db=c.f?d[c.f-1]*A:0,dt=d[c.f]*A,pos=c.g.attributes.position.array,k,s;
    c.mesh.position.x=c.bx+db;
    for(k=0;k<pos.length;k+=3){s=c.x0[k+1]/c.h;pos[k]=c.x0[k]+(dt-db)*(3*s*s-2*s*s*s);}   /* fixed-fixed column curve */
    c.g.attributes.position.needsUpdate=true;
  });
  for(i=0;i<n;i++)P.slabs[i].position.x=d[i]*A;
  var R=dist,cam=V3.cam;
  cam.position.set(R*Math.cos(V3.el)*Math.sin(V3.az),P.H*0.5+R*Math.sin(V3.el),R*Math.cos(V3.el)*Math.cos(V3.az));
  cam.lookAt(0,P.H*0.5,0);
  V3.r.render(V3.sc,cam);
}
