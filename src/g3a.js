
/* ================= helpers ================= */
var UNS="\u2212";
function $(s,r){return (r||document).querySelector(s);}
function $$(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s));}
function fmt(x,d){
  if(x==null||!isFinite(x))return "\u2014";
  d=(d==null)?2:d;
  var s=Math.abs(x).toFixed(d),p=s.split("."),ip=p[0],o="",c=0,i;
  for(i=ip.length-1;i>=0;i--){o=ip.charAt(i)+o;c++;if(c%3===0&&i>0)o=","+o;}
  if(p.length>1)o+="."+p[1];
  if(x<0&&parseFloat(s)!==0)o=UNS+o;
  return o;
}
var SUPMAP={"-":"\u207B","0":"\u2070","1":"\u00B9","2":"\u00B2","3":"\u00B3","4":"\u2074","5":"\u2075","6":"\u2076","7":"\u2077","8":"\u2078","9":"\u2079"};
function sup(n){var s=String(n),o="",i;for(i=0;i<s.length;i++)o+=SUPMAP[s.charAt(i)]||s.charAt(i);return o;}
function sci(x,d){
  if(!isFinite(x))return "\u2014";
  if(x===0)return "0";
  d=(d==null)?2:d;
  var a=Math.abs(x),e=Math.floor(Math.log(a)/Math.LN10),m=x/Math.pow(10,e);
  if(Math.abs(m)>=9.995){m/=10;e+=1;}
  return fmt(m,d)+"\u00D710"+sup(e);
}
function sub(i){return "\u2081\u2082\u2083\u2084\u2085".charAt(i)||("_"+i);}
function escapeHTML(s){return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");}

/* ================= palette ================= */
var INK="#0d0f14", MUTED="#6b7280", FAINT="#9aa1ab", LINE="#e6e6ec", ACCENT="#4f46e5", MINT="#0d9488", AMBER="#d97706";
var MC=["#4f46e5","#0d9488","#d97706","#7c3aed"];

/* ================= state ================= */
var DEFAULTS={n:3,geom:true,fc:21,b:300,cols:4,hs:[4,3.2,3],ms:[5000,2500,1250],ks:[10903.7,21296.2,25845.7],zeta:0,amp:50,ic:"roof"};
var S=null, model=null, live=null;

function freshState(){
  return {n:3,geom:true,fc:21,b:300,cols:4,hs:[4,3.2,3],ms:[5000,2500,1250],
          ks:[10903.7,21296.2,25845.7],zeta:0,amp:50,ic:"roof"};
}
function compute(){
  model=buildModel({n:S.n,geom:S.geom,fc:S.fc,b:S.b,h:S.b,cols:S.cols,hs:S.hs.slice(0,S.n),ms:S.ms.slice(0,S.n),ks:S.ks.slice(0,S.n)});
  return model;
}
function initials(){
  var n=model.N,i,x0=[],v0=[];
  for(i=0;i<n;i++){x0.push(0);v0.push(0);}
  var a=S.amp/1000;
  if(S.ic==="roof"){x0[n-1]=a;}
  else if(S.ic==="uniform"){for(i=0;i<n;i++)x0[i]=a;}
  else {var mx=Math.abs(model.phi[0][n-1])||1;for(i=0;i<n;i++)x0[i]=a*model.phi[0][i]/mx;}
  var z=[];for(i=0;i<n;i++)z.push(S.zeta/100);
  return {x0:x0,v0:v0,zeta:z};
}

/* ================= svg primitives ================= */
function svgOpen(w,h,extra){return '<svg viewBox="0 0 '+w+' '+h+'" role="img" '+(extra||'')+'>';}
function t(x,y,s,o){
  o=o||{};
  return '<text x="'+x+'" y="'+y+'" font-size="'+(o.fs||12)+'" fill="'+(o.fill||INK)+'"'+
    (o.anchor?' text-anchor="'+o.anchor+'"':'')+
    (o.weight?' font-weight="'+o.weight+'"':'')+
    (o.mono?' font-family="ui-monospace,Consolas,monospace"':'')+
    (o.op?' opacity="'+o.op+'"':'')+
    (o.halo?' paint-order="stroke" stroke="#fbfbfd" stroke-width="3.4" stroke-linejoin="round"':'')+'>'+s+'</text>';
}
function dot(x,y,r,fill,op){return '<circle cx="'+x+'" cy="'+y+'" r="'+r+'" fill="'+fill+'"'+(op?' opacity="'+op+'"':'')+'/>';}
function line(x1,y1,x2,y2,o){
  o=o||{};
  return '<line x1="'+x1+'" y1="'+y1+'" x2="'+x2+'" y2="'+y2+'" stroke="'+(o.stroke||INK)+'" stroke-width="'+(o.w||1.4)+'"'+
    (o.dash?' stroke-dasharray="'+o.dash+'"':'')+(o.cap?' stroke-linecap="'+o.cap+'"':'')+(o.op?' opacity="'+o.op+'"':'')+'/>';
}
function rect(x,y,w,h,r,o){
  o=o||{};
  return '<rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" rx="'+r+'" fill="'+(o.fill||'none')+'"'+
    (o.stroke?' stroke="'+o.stroke+'" stroke-width="'+(o.sw||1.2)+'"':'')+(o.op?' opacity="'+o.op+'"':'')+
    (o.anim?' class="'+o.anim+'"'+(o.delay?' style="animation-delay:'+o.delay+'s"':''):'')+'/>';
}
function path(d,o){
  o=o||{};
  return '<path d="'+d+'" fill="'+(o.fill||'none')+'" stroke="'+(o.stroke||INK)+'" stroke-width="'+(o.w||1.6)+'"'+
    (o.dash?' stroke-dasharray="'+o.dash+'"':'')+(o.cap?' stroke-linecap="round" stroke-linejoin="round"':'')+
    (o.op?' opacity="'+o.op+'"':'')+
    (o.draw?' pathLength="1" class="draw" style="animation-delay:'+(o.delay||0)+'s"':'')+'/>';
}
function badge(x,y,s,o){
  o=o||{};
  var w=o.w||(String(s).length*6.6+18);
  return rect(x-w/2,y-11,w,22,11,{fill:o.fill||'#fff',stroke:o.stroke||LINE,sw:1,anim:'pop',delay:o.delay})+t(x,y+4,s,{fs:o.fs||11,anchor:'middle',fill:o.color||INK,weight:600});
}

/* ---- a building, optionally displaced: disp = per-floor displacement in px ---- */
function buildingSVG(m,o){
  o=o||{};
  var n=m.N, W=520, H=400, baseY=348, topY=o.topY||86;
  var step=(baseY-topY)/(n+0.18);
  var xl=196, xr=322;
  var disp=o.disp||[];
  var s='<defs><pattern id="hatch" width="8" height="8" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">'+
        '<line x1="0" y1="0" x2="0" y2="8" stroke="#c9c9d4" stroke-width="1.4"/></pattern></defs>';
  s+=svgOpen(W,H);
  /* ground */
  s+=rect(96,baseY,330,12,0,{fill:'url(#hatch)',op:.9});
  s+=line(92,baseY,428,baseY,{w:2.2});
  var ys=[],i;
  for(i=0;i<=n;i++)ys.push(baseY-i*step);
  var d=[];for(i=0;i<n;i++)d.push(disp[i]||0);
  /* columns */
  for(i=0;i<n;i++){
    var y1=baseY-i*step, y2=baseY-(i+1)*step;
    var b1=(i===0?0:d[i-1]), b2=d[i];
    var cx1=xl+b1, cx2=xl+b2, cx3=xr+b1, cx4=xr+b2;
    var mid=(b1+b2)/2;
    var col=o.highlight===i?'#c7c2ff':(o.structColor||'#c9c9d6');
    var wdt=o.highlight===i?5.5:4.4;
    s+=line(cx1,y1,cx2,y2,{w:wdt,stroke:col,cap:1});
    s+=line(cx3,y1,cx4,y2,{w:wdt,stroke:col,cap:1});
  }
  /* slabs */
  for(i=0;i<=n;i++){
    var dy=ys[i], dx=i===0?0:d[i-1];
    var isRoof=i===n;
    s+=rect(xl+dx-14,dy-5,xr-xl+28,10,5,{fill:isRoof?'#0d0f14':'#ffffff',stroke:INK,sw:isRoof?0:1.6,anim:'pop',delay:(0.06*i).toFixed(2)});
    if(!isRoof){
      for(var k=1;k<=3;k++)s+=line(xl+dx-14+k*8,dy-5,xl+dx-14+k*8,dy+5,{w:.7,stroke:'#cfcfda',op:.8});
    }
  }
  /* floor labels + mass labels */
  for(i=0;i<=n;i++){
    var yy=ys[i]+(i===0?16:4)*0+4;
    var lbl=i===n?'R':('F'+i);
    var lx=o.tags?96:Math.min(xr+26+Math.max(0,dx),402);
    if(i>0)s+=t(lx,ys[i]+4,i===n?'roof':'floor '+i,{fs:10.5,fill:FAINT,weight:600,halo:!!o.tags});
  }
  if(o.masses!==false){
    for(i=0;i<n;i++){
      var mx=xl+(xr-xl)/2+(i===0?0:d[i-1]);
      var my=(ys[i]+ys[i+1])/2;
      s+=t(xl-18,my+2,'m'+sub(i),{fs:11,fill:MC[i%MC.length],anchor:'end',weight:700});
      s+=t(xl-18,my+15,fmt(m.ms[i],0)+' kg',{fs:9.5,fill:FAINT,anchor:'end'});
    }
  }
  if(o.columns){
    s+=t(xr+26,ys[n]+22,'4 columns / floor',{fs:10,fill:FAINT});
    s+=t(xr+26,ys[n]+36,'300 mm square',{fs:10,fill:FAINT});
  }
  if(o.modeShape){
    var sc=o.modeScale||58;
    var pts=[[xl+(xr-xl)/2,baseY]];
    for(i=0;i<n;i++)pts.push([xl+(xr-xl)/2+o.modeShape[i]*sc, ys[i+1]]);
    var dd=pts.map(function(p,ix){return (ix?'L':'M')+p[0].toFixed(1)+' '+p[1].toFixed(1);}).join(' ');
    s+=path(dd,{stroke:o.modeColor||ACCENT,w:2.4,dash:'7 6',op:.95,draw:true,delay:.25});
    for(i=0;i<n;i++){
      var px=xl+(xr-xl)/2+o.modeShape[i]*sc;
      s+=dot(px,ys[i+1],4.5,o.modeColor||ACCENT);
    }
  }
  if(o.tags){
    /* the displacement drawn beside the frame: one bar per floor, value at the end */
    var gx=418, gm=20, mv=1, i2;
    for(i2=0;i2<n;i2++)mv=Math.max(mv,Math.abs(o.tags[i2]));
    s+=t(gx,ys[n]-22,'\u03C6 (roof = 1)',{fs:8.6,fill:FAINT,weight:700});
    s+=line(gx,ys[n]-8,gx,ys[0],{stroke:'#e2e2ec',w:1,dash:'3 5'});
    for(i2=0;i2<n;i2++){
      var yg=ys[i2+1], vg=o.tags[i2]||0, dg=vg/mv*gm, cg=o.modeColor||ACCENT;
      s+=line(gx,yg,gx+dg,yg,{w:2.8,stroke:cg,cap:1,op:.9});
      s+=dot(gx+dg,yg,3,cg);
      s+=t(gx+gm+12,yg+3.4,fmt(vg,4),{fs:8.6,mono:1,fill:MUTED,weight:600});
    }
  }
  if(o.springs){
    for(i=0;i<n;i++){
      var ys1=ys[i], ys2=ys[i+1], sx=xl+(xr-xl)/2;
      s+=springPath(sx,ys1-6,ys2+6,MC[i%MC.length]);
    }
  }
  if(o.free){
    for(i=0;i<n;i++){
      var fx=xl+(xr-xl)/2+(d[i]||0);
      s+=dot(fx,ys[i+1],6.5,'#fff');
      s+=dot(fx,ys[i+1],4.5,INK);
    }
  }
  s+='</svg>';
  return s;
}
function springPath(x,y1,y2,col){
  var h=y2-y1, segs=6, amp=9, d='M'+x+' '+y1, i;
  for(i=0;i<segs;i++){
    var yy=y1+h*(i+0.5)/segs;
    d+=' L'+(x+(i%2?-amp:amp))+' '+yy.toFixed(1);
  }
  d+=' L'+x+' '+y2;
  return path(d,{stroke:col,w:2.2,cap:1,draw:true,delay:.1});
}

/* ---- a single column bending under a top force ---- */
function columnSVG(m,o){
  o=o||{};
  var W=520,H=380, bx=200, by=330, hpx=200, defl=o.defl||-58;
  var s=svgOpen(W,H);
  s+=rect(120,by,200,10,0,{fill:'url(#hatch2)'});
  s+='<defs><pattern id="hatch2" width="8" height="8" patternTransform="rotate(45)" patternUnits="userSpaceOnUse"><line x1="0" y1="0" x2="0" y2="8" stroke="#c9c9d4" stroke-width="1.4"/></pattern></defs>';
  s+=line(110,by,330,by,{w:2.2});
  s+=path('M'+bx+' '+by+' C'+bx+' '+(by-hpx*0.45)+' '+(bx+defl*0.15)+' '+(by-hpx*0.7)+' '+(bx+defl)+' '+(by-hpx),{stroke:'#c9c9d6',w:6,cap:1});
  s+=path('M'+bx+' '+by+' L'+bx+' '+(by-hpx),{stroke:'#d7d7e2',w:1.4,dash:'5 5'});
  /* force */
  s+=path('M'+(bx+defl+96)+' '+(by-hpx)+' L'+(bx+defl+18)+' '+(by-hpx),{stroke:ACCENT,w:2.6,cap:1,draw:true});
  s+=path('M'+(bx+defl+18)+' '+(by-hpx)+' l10 -5 l0 10 z',{fill:ACCENT,stroke:ACCENT});
  s+=t(bx+defl+104,by-hpx+4,'P',{fs:12,fill:ACCENT,weight:700});
  /* dimension */
  s+=line(bx+defl-18,by,bx+defl-18,by-hpx,{stroke:FAINT,w:1,dash:'3 4'});
  s+=t(bx+defl-30,by-hpx/2,'h',{fs:12,fill:MUTED,anchor:'end',weight:600});
  s+=t(30,46,'δ = P h³ / (12 EI)',{fs:12,fill:MUTED});
  s+=t(30,66,'both ends fixed — no rotation',{fs:11,fill:FAINT});
  s+='</svg>';
  return s;
}

/* ---- matrix block ---- */
function matBlock(x,y,rows,o){
  o=o||{};
  var n=rows.length, cw=o.cw||64, ch=o.ch||38, i, j, s='';
  var W=n*cw, H=n*ch;
  for(i=0;i<n;i++)for(j=0;j<n;j++){
    var cell=rows[i][j];
    var hot=o.hot&&o.hot(i,j);
    var dim=o.dim&&o.dim(i,j);
    var fill=hot?(o.hotFill||'#eef0ff'):'#fff';
    var stroke=hot?(o.hotStroke||ACCENT):'#ececf2';
    var delay=(o.stagger?(i*n+j)*o.stagger:0);
    var open=o.stagger?'<g class="pop" style="animation-delay:'+delay.toFixed(3)+'s">':'';
    var close=o.stagger?'</g>':'';
    var gd=(o.glow?o.glow(i,j):null);
    var gopen=(gd!=null)?'<g class="gl" style="animation-delay:'+gd.toFixed(2)+'s">':'';
    var gclose=(gd!=null)?'</g>':'';
    s+=gopen+open+rect(x+j*cw+2,y+i*ch+2,cw-4,ch-4,7,{fill:fill,stroke:stroke,sw:hot?1.8:1,op:dim?.32:1});
    s+=t(x+j*cw+cw/2,y+i*ch+ch/2+4.5,cell,{fs:o.fs||12,anchor:'middle',fill:dim?FAINT:INK,mono:true,weight:hot?700:500,op:dim?.55:1})+close+gclose;
  }
  s+=path('M'+(x-9)+' '+y+' v'+H,{stroke:INK,w:2});
  s+=path('M'+(x-9)+' '+y+' h6',{stroke:INK,w:2});
  s+=path('M'+(x-9)+' '+(y+H)+' h6',{stroke:INK,w:2});
  s+=path('M'+(x+W+9)+' '+y+' v'+H,{stroke:INK,w:2});
  s+=path('M'+(x+W+9)+' '+y+' h-6',{stroke:INK,w:2});
  s+=path('M'+(x+W+9)+' '+(y+H)+' h-6',{stroke:INK,w:2});
  return s;
}

/* ---- curve of det(K - B M) against B ---- */
function curveSVG(m,o){
  o=o||{};
  var W=520,H=340,x0=62,x1=464,yt=52,yb=258,yM=(yt+yb)/2;
  var lmax=m.lam[m.N-1]*1.16, N=240, pts=[], i;
  var vmax=0;
  for(i=0;i<=N;i++){
    var B=lmax*i/N, v=detOf(m.K,m.M,B);
    pts.push([B,v]); vmax=Math.max(vmax,Math.abs(v));
  }
  var X=function(B){return x0+(x1-x0)*B/lmax;};
  var Y=function(v){return yM-(v/vmax)*(yb-yt)/2*0.9;};
  var d=pts.map(function(p,ix){return (ix?'L':'M')+X(p[0]).toFixed(1)+' '+Y(p[1]).toFixed(1);}).join(' ');
  var s=svgOpen(W,H);
  s+=line(x0,yM,x1,yM,{stroke:'#c8c8d6',w:1.6});
  s+=t(x1,yM-9,'det = 0',{fs:9.5,fill:FAINT,anchor:'end'});
  s+=t(x0,yM+16,'0',{fs:9.5,fill:FAINT});
  s+=t(x1+4,yM+4,'B',{fs:10.5,fill:MUTED});
  if(o.roots!==false){
    for(i=0;i<m.N;i++){
      var rx=X(m.lam[i]);
      s+=line(rx,yt+10,rx,yb,{stroke:MC[i%3],w:1,dash:'3 4',op:.32});
      s+=t(rx,yt+2,'\u03BB'+sub(i),{fs:9.5,fill:MC[i%3],anchor:'middle',weight:700});
    }
  }
  s+=path(d,{stroke:ACCENT,w:2.6,draw:true,delay:.1});
  if(o.roots!==false){
    var lx=x0+2, ly=yb+30;
    for(i=0;i<m.N;i++){
      s+=dot(X(m.lam[i]),yM,5.5,MC[i%3]);
      var txt='B'+sub(i)+' = '+fmt(m.lam[i],1), wid=txt.length*6.5+16;
      s+=rect(lx,ly-12,wid,20,10,{fill:MC[i%3],op:.1});
      s+=t(lx+8,ly+2,txt,{fs:10.5,fill:MC[i%3],weight:600,mono:1});
      lx+=wid+8;
    }
  } else {
    s+=t(x0,yb+26,'det(K \u2212 B M) is a cubic in B \u2014 the roots are the three mode frequencies squared',{fs:10,fill:FAINT});
  }
  s+='</svg>';
  return s;
}

/* ---- deflection of a mode, scaled ---- */
function modeSVG(m,r,o){
  o=o||{};
  var amp=o.amp||46;
  var ph=m.phi[r], mx=Math.abs(ph[0]),i;
  for(i=1;i<ph.length;i++)mx=Math.max(mx,Math.abs(ph[i]));
  var disp=ph.map(function(v){return v/mx*amp;});
  return buildingSVG(m,{disp:disp,masses:o.masses!==false,free:true,structColor:'#d5d5e0',modeShape:ph,modeScale:amp,modeColor:MC[r%MC.length],topY:o.topY,tags:o.tags});
}
