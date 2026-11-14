
/* ================= polynomial helpers (descending) ================= */
function ptrim(a){var b=a.slice();while(b.length>1&&Math.abs(b[0])<1e-300)b.shift();return b;}
function pnorm(a,b){var A=a.slice(),B=b.slice();while(A.length<B.length)A.unshift(0);while(B.length<A.length)B.unshift(0);return [A,B];}
function padd(a,b){var z=pnorm(a,b),o=[],i;for(i=0;i<z[0].length;i++)o.push(z[0][i]+z[1][i]);return ptrim(o);}
function psub(a,b){var z=pnorm(a,b),o=[],i;for(i=0;i<z[0].length;i++)o.push(z[0][i]-z[1][i]);return ptrim(o);}
function pmul(a,b){var o=[],i,j;for(i=0;i<a.length+b.length-1;i++)o.push(0);for(i=0;i<a.length;i++)for(j=0;j<b.length;j++)o[i+j]+=a[i]*b[j];return ptrim(o);}
function pnum(c,d){
  var s="",i;
  for(i=0;i<c.length;i++){
    var p=c.length-1-i, v=c[i];
    if(Math.abs(v)<1e-12)continue;
    var sign=v<0?" \u2212 ":" + ";
    var av=Math.abs(v), txt=(Math.abs(av-1)<1e-9&&p>0)?"":fmt(av,(av>=1e5?0:(av>=1000?2:3)));
    var pw=p===0?"":p===1?"B":("B"+sup(p));
    s+=(s?sign:(v<0?"\u2212":""))+txt+pw;
  }
  return s||"0";
}
function scaledMat(m){
  var Kp=[],Mp=[],i,j,n=m.N;
  for(i=0;i<n;i++){Kp.push([]);Mp.push([]);for(j=0;j<n;j++){Kp[i].push(m.K[i][j]/m.ms[0]);Mp[i].push(Mp[i][j]);}}
  var M2=[];for(i=0;i<n;i++){M2.push([]);for(j=0;j<n;j++)M2[i].push(i===j?m.ms[i]/m.ms[0]:0);}
  return {Kp:Kp,Mp:M2};
}
function detPolyN(Kp,Mp){
  var n=Kp.length;
  function a(i,j){return [-Mp[i][j],Kp[i][j]];}
  if(n===2)return psub(pmul(a(0,0),a(1,1)),pmul(a(0,1),a(1,0)));
  var t1=pmul(a(0,0),psub(pmul(a(1,1),a(2,2)),pmul(a(1,2),a(2,1))));
  var t2=pmul(a(0,1),psub(pmul(a(1,0),a(2,2)),pmul(a(1,2),a(2,0))));
  var t3=pmul(a(0,2),psub(pmul(a(1,0),a(2,1)),pmul(a(1,1),a(2,0))));
  return psub(padd(t1,t3),t2);
}
/* Newton on the polynomial exactly as it would be typed into a calculator */
function peval(c,x){var s=0,i;for(i=0;i<c.length;i++)s=s*x+c[i];return s;}
function pder(c){var o=[],i;for(i=0;i<c.length-1;i++)o.push(c[i]*(c.length-1-i));return o;}
function newtonRoot(c,x0){
  var d=pder(c),x=x0,it=0,dx,f,fp;
  for(;it<80;it++){
    f=peval(c,x);fp=peval(d,x);
    if(!fp||!isFinite(f))break;
    dx=f/fp;x-=dx;
    if(Math.abs(dx)<1e-11*Math.max(1,Math.abs(x))){it++;break;}
  }
  return {x:x,it:it};
}

/* ================= small figures ================= */
/* the column cross-section, drawn from the inputs (solid rectangle or hollow tube) */
function sectionSVG(m){
  var s=svgOpen(520,340), p=m.p, cx=200, cy=150, i;
  var eLine=m.mat==='conc'?'E = 4700\u221A f\u2032c':m.mat==='steel'?'E (steel, given)':'E (given)';
  var iLine=m.sec==='hss'?'I = [B\u2074 \u2212 (B \u2212 2t)\u2074] / 12':m.sec==='custom'?'I (given)':'I = b h\u00B3 / 12';
  if(m.sec==='custom'){
    s+=rect(cx-60,cy-60,120,120,14,{fill:'#f6f6fb',stroke:'#d7d7e2',sw:1.2,dash:'4 4'});
    s+=t(cx,cy-4,'any section',{fs:12,anchor:'middle',fill:MUTED,weight:600});
    s+=t(cx,cy+14,'I given directly',{fs:11,anchor:'middle',fill:FAINT});
  } else {
    var bw=(m.sec==='hss'?p.B:p.b), bh=(m.sec==='hss'?p.B:p.h), sc=124/Math.max(bw,bh);
    var w=bw*sc, h=bh*sc, x=cx-w/2, y=cy-h/2;
    if(m.sec==='hss'){
      var tw=Math.max(3,p.t*sc);
      s+=rect(x,y,w,h,5,{fill:m.mat==='steel'?'#dfe3ee':'#ececf4',stroke:INK,sw:2});
      s+=rect(x+tw,y+tw,w-2*tw,h-2*tw,2,{fill:'#fcfcfe',stroke:INK,sw:1.2});
      s+=line(x+w+14,y,x+w+14,y+tw,{stroke:MUTED,w:1});
      s+=t(x+w+20,y+tw/2+4,'t = '+fmt(p.t,0)+' mm',{fs:11,fill:MUTED});
    } else {
      s+=rect(x,y,w,h,4,{fill:m.mat==='steel'?'#dfe3ee':'#f4f4fa',stroke:INK,sw:2});
      for(i=1;i<4;i++){
        s+=line(x+i*w/4,y,x+i*w/4,y+h,{stroke:'#e2e2ee',w:1});
        s+=line(x,y+i*h/4,x+w,y+i*h/4,{stroke:'#e2e2ee',w:1});
      }
    }
    s+=line(x,y+h+18,x+w,y+h+18,{stroke:MUTED,w:1});
    s+=t(x+w/2,y+h+34,(m.sec==='hss'?'B':'b')+' = '+fmt(bw,0)+' mm',{fs:11,anchor:'middle',fill:MUTED});
    s+=line(x-18,y,x-18,y+h,{stroke:MUTED,w:1});
    s+=t(x-26,y+h/2+4,(m.sec==='hss'?'B':'h')+' = '+fmt(bh,0)+' mm',{fs:11,anchor:'end',fill:MUTED});
  }
  s+=t(352,104,eLine,{fs:13});
  s+=t(352,130,'= '+fmt(m.Ec,0)+' MPa',{fs:13,mono:1,fill:ACCENT,weight:600});
  s+=t(352,176,iLine,{fs:m.sec==='hss'?12:13});
  s+=t(352,202,'= '+sci(m.I,4)+' m\u2074',{fs:13,mono:1,fill:ACCENT,weight:600});
  s+=t(352,248,'EI = E \u00B7 I',{fs:13});
  s+=t(352,274,'= '+fmt(m.EI,0)+' kN\u00B7m\u00B2',{fs:13,mono:1,fill:ACCENT,weight:600});
  s+='</svg>';
  return s;
}
/* SHIFT+SOLVE starting guesses: round each root to a "typeable" number that still lands on it */
function solveGuesses(m,co){
  return m.lam.map(function(L){
    var d,g,r;
    for(d=1;d<=4;d++){
      var e=Math.pow(10,Math.floor(Math.log(Math.abs(L))/Math.LN10)-d+1);
      g=Math.round(L/e)*e;r=newtonRoot(co,g);
      if(Math.abs(r.x-L)<1e-6*Math.max(1,Math.abs(L)))return g;
    }
    return Math.round(L);
  });
}
/* static sketch of every mode, as it would be drawn on the exam paper:
   undeformed line, deflected shape, factor at each floor, nodes marked */
function sketchSVG(m,o){
  o=o||{};
  var n=m.N, W=520, H=o.h||380, pw=W/n, top=70, base=H-62, i, r;
  var hs=m.hs, tot=hs.reduce(function(a,b){return a+b;},0), ys=[base], acc=0;
  for(i=0;i<n;i++){acc+=hs[i];ys.push(base-(base-top)*acc/tot);}
  var s=svgOpen(W,H,'aria-label="Sketch of the '+n+' mode shapes"');
  for(r=0;r<n;r++){
    var ph=m.phi[r], mx=maxAbs(ph), cx=pw*r+pw/2, amp=Math.min(pw*0.2,56), col=MC[r%MC.length], colT=MCT[r%MCT.length];
    var pts=[[cx,base]];for(i=0;i<n;i++)pts.push([cx+ph[i]/mx*amp,ys[i+1]]);
    s+=t(cx,24,'Mode '+(r+1),{fs:13,anchor:'middle',weight:700,fill:colT});
    s+=t(cx,42,'T = '+fmt(m.per[r],4)+' s',{fs:10.5,anchor:'middle',fill:MUTED,mono:1});
    s+=rect(cx-38,base,76,8,0,{fill:'url(#hatchS)'});
    s+=line(cx-40,base,cx+40,base,{w:2});
    s+=line(cx,base,cx,ys[n]-6,{stroke:'#c4c6d2',w:1.3,dash:'4 5'});
    for(i=1;i<=n;i++)s+=line(cx-5,ys[i],cx+5,ys[i],{stroke:'#c4c6d2',w:1.2});
    var d=pts.map(function(p,ix){return (ix?'L':'M')+p[0].toFixed(1)+' '+p[1].toFixed(1);}).join(' ');
    s+=path(d,{stroke:col,w:2.6,cap:1,draw:!o.still,delay:.15+.25*r});
    for(i=0;i<n;i++){
      /* node: the shape crosses the undeformed line between two levels */
      var a=(i===0?0:ph[i-1]), b=ph[i];
      if(i>0&&a*b<0){
        var f=a/(a-b), ny=ys[i]+(ys[i+1]-ys[i])*f;
        s+='<circle cx="'+cx+'" cy="'+ny.toFixed(1)+'" r="4.6" fill="#fff" stroke="'+INK+'" stroke-width="1.6"/>';
        s+=t(cx-8,ny+4,'node',{fs:9.5,anchor:'end',fill:MUTED,weight:600});
      }
    }
    for(i=0;i<n;i++){
      var px=pts[i+1][0], py=pts[i+1][1], right=ph[i]>=0;
      s+=dot(px,py,4.4,col);
      s+=t(px+(right?8:-8),py+4,fmt(ph[i],4),{fs:10,mono:1,anchor:right?'start':'end',fill:INK,weight:600,halo:1});
    }
  }
  s+='<defs><pattern id="hatchS" width="7" height="7" patternTransform="rotate(45)" patternUnits="userSpaceOnUse"><line x1="0" y1="0" x2="0" y2="7" stroke="#c9c9d4" stroke-width="1.3"/></pattern></defs>';
  s+=t(W/2,H-20,'roof factor = 1.0000 in every mode \u00B7 open circle = node (no movement)',{fs:10,anchor:'middle',fill:FAINT});
  s+='</svg>';
  return s;
}
function barsSVG(m){
  var W=520,H=380, x0=120, baseY=300, hMax=190, n=m.N, i;
  var kmax=Math.max.apply(null,m.k);
  var s=svgOpen(W,H);
  s+=line(60,baseY,470,baseY,{stroke:'#d5d5e0',w:1.4});
  var bw=52, gap=(m.N===2?110:64);
  for(i=0;i<n;i++){
    var h=hMax*m.k[i]/kmax, x=x0+i*(bw+gap);
    s+=rect(x,baseY-h,bw,h,9,{fill:MC[i%MC.length],op:.14,stroke:MC[i%MC.length],sw:1.6,anim:'pop',delay:(0.1*i).toFixed(2)});
    s+=t(x+bw/2,baseY-h-12,'k'+sub(i)+' = '+fmt(m.k[i],0),{fs:11,anchor:'middle',fill:MCT[i%MCT.length],weight:700});
    s+=t(x+bw/2,baseY+20,'storey '+(i+1),{fs:11,anchor:'middle',fill:MUTED});
    if(m.p.geom){
      s+=t(x+bw/2,baseY+36,'h = '+fmt(m.hs[i],2)+' m',{fs:10,anchor:'middle',fill:FAINT});
      s+=t(x+bw/2,baseY+52,'k_col = '+fmt(m.kc[i],0),{fs:10,anchor:'middle',fill:FAINT,mono:1});
    }
  }
  s+=t(60,44,m.p.geom?'storey stiffness k = '+m.cols+' \u00D7 12EI/h\u00B3  (kN/m)':'storey stiffness k, as given  (kN/m)',{fs:12,fill:MUTED});
  s+='</svg>';
  return s;
}
/* ---------- a curved arrow pairing two cells; its twin bows the other way ---------- */
function pairArrow(x1,y1,x2,y2,col,delay,bow,halo,ta,tb){
  var mx=(x1+x2)/2, my=(y1+y2)/2, dx=x2-x1, dy=y2-y1, L=Math.sqrt(dx*dx+dy*dy)||1;
  var bw=bow||Math.max(18,Math.min(0.2*L,44));
  var nx=-dy/L, ny=dx/L, qx=mx+nx*bw, qy=my+ny*bw;
  var P=function(s){var u=1-s;return [u*u*x1+2*s*u*qx+s*s*x2,u*u*y1+2*s*u*qy+s*s*y2];};
  var T=function(s){var u=1-s;return [2*u*(qx-x1)+2*s*(x2-qx),2*u*(qy-y1)+2*s*(y2-qy)];};
  var d0=ta?Math.min(ta*0.7,0.30*L):0.14*L, d1=tb?Math.min(tb+7,0.42*L):0.14*L;
  var s0=d0/L, s1=1-d1/L, d='', i, p;
  for(i=0;i<=12;i++){p=P(s0+(s1-s0)*i/12);d+=(i?'L':'M')+p[0].toFixed(1)+' '+p[1].toFixed(1);}
  var s=halo?path(d,{stroke:'#fff',w:7.5,cap:1,op:.98}):'';
  s+=path(d,{stroke:col,w:2.6,cap:1,draw:true,delay:delay});
  var e=P(s1), tv=T(s1), tl=Math.sqrt(tv[0]*tv[0]+tv[1]*tv[1])||1;
  var ux=tv[0]/tl, uy=tv[1]/tl, sx=-uy*5.6, sy=ux*5.6;
  var hx=e[0]+ux*3, hy=e[1]+uy*3;
  s+='<g class="pin" style="animation-delay:'+(delay+0.42).toFixed(2)+'s">'+
     path('M'+hx.toFixed(1)+' '+hy.toFixed(1)+
       'L'+(hx-ux*12.5+sx).toFixed(1)+' '+(hy-uy*12.5+sy).toFixed(1)+
       'L'+(hx-ux*12.5-sx).toFixed(1)+' '+(hy-uy*12.5-sy).toFixed(1)+'Z',{fill:col,stroke:col,w:1})+'</g>';
  return s;
}
function cellText(Kp,Mp,i,k){
  if(i!==k)return Kp[i][k]?fmt(Kp[i][k],0):'0';
  return fmt(Kp[i][k],0)+' \u2212 '+(Math.abs(Mp[i][i]-1)<1e-9?'B':fmt(Mp[i][i],2)+'B');
}
/* 1.1, 0.25, 1 — a ratio written the way you would write it by hand */
function ratioTxt(v){var s=fmt(v,4);if(s.indexOf('.')>=0)s=s.replace(/0+$/,'').replace(/\.$/,'');return s;}
/* ================= chapters ================= */
var CHAPTERS=[], FI={ch:0,fr:0,playing:false,timer:null,speed:1,liveT:0,raf:null};

function matRows(M,fn){
  var out=[],i,j,n=M.length;
  for(i=0;i<n;i++){out.push([]);for(j=0;j<n;j++)out[i].push(fn(M[i][j],i,j));}
  return out;
}

function buildTour(){
  var m=model, n=m.N, S2=scaledMat(m), Kp=S2.Kp, Mp=S2.Mp;
  var co=detPolyN(Kp,Mp), lead=co[0], mono=co.map(function(c){return c/lead;});
  var cls=[], i;

  var NW=['zero','one','two','three','four','five','six','seven','eight','nine','ten','eleven','twelve'];
  var hsTxt=m.hs.map(function(h,ix){return 'h'+sub(ix)+' = '+fmt(h,h%1?2:0)+' m';}).join(', ');
  var sameH=m.hs.every(function(h){return h===m.hs[0];});
  var sirH=n===3&&m.hs[0]===4&&m.hs[1]===3.2&&m.hs[2]===3;
  var frameNote=sirH?"Sample Problem 1 fixes the heights twice over: h\u2081 = 1.25h\u2082 = 1.3333h\u2083 = 4 m, which gives "+hsTxt+"."
    :sameH?"Every storey has the same height, h = "+fmt(m.hs[0],2)+" m, so every storey will get the same stiffness."
    :"Storey heights from the sketch: "+hsTxt+".";

  /* ---------- 1. the frame ---------- */
  cls.push({id:"frame",name:"The frame",step:0,frames:[
    {t:"A "+n+"-storey frame, "+(NW[m.cols]||m.cols)+" column"+(m.cols>1?"s":"")+" per floor",
     b:"Before any maths: each floor can move sideways, so the building has <b>"+n+" unknown displacements</b> \u2014 one per floor. That is what \u201c"+n+"-DOF\u201d means, and it is the only thing we carry into the calculation.",
     n:frameNote,
     svg:buildingSVG(m,{columns:true,masses:true})},
    {t:"Idealise it: masses on springs",
     b:"Beams are stiff compared with columns, so each floor stays flat and moves as a rigid slab. A column then behaves exactly like a spring between the floor above and the floor below. The whole building becomes <b>"+n+" masses on "+n+" springs</b> \u2014 the shear-frame model.",
     f:"x\u2081, x\u2082, x\u2083 = sideways displacement of each floor",
     svg:buildingSVG(m,{springs:true,masses:true,free:true,structColor:'#e5e5ee'})}
  ]});

  /* ---------- 2. stiffness ---------- */
  var p=m.p, mm=function(v){return fmt(v/1000,3);};
  var eRow, eBody, iRow;
  if(m.mat==='conc'){
    eBody="Concrete stiffness follows its strength, E = 4700\u221Af\u2032c (ACI 318).";
    eRow=function(){var b=0;return GL('E',b)+OP('=')+GL('4700',b+0.14)+SQ(GL('f\u2032'+SUB('c'),b+0.36))+OP('=')+GL('4700',b+0.58)+SQ(GL(fmt(p.fc,0),b+0.76))+OP('=')+PI(fmt(m.Ec,0)+' MPa',b+1.0,'res');};
  } else {
    eBody=m.mat==='steel'?"Steel is given: every structural steel, A36 included, has E = "+fmt(p.Es,0)+" GPa. There is nothing to compute.":"E is given in the problem, so it goes straight in.";
    eRow=function(){var b=0;return GL('E',b)+OP('=')+GL(fmt(m.mat==='steel'?p.Es:p.Ex,0)+' GPa',b+0.2)+OP('=')+PI(fmt(m.Ec,0)+' MPa',b+0.5,'res')+'<span class="hint-inline">'+(m.mat==='steel'?'A36 / structural steel':'as given')+'</span>';};
  }
  var iBody;
  if(m.sec==='hss'){
    iBody="A square hollow tube is the outer square minus the hole: I = [B\u2074 \u2212 (B \u2212 2t)\u2074]/12, with the hole B \u2212 2t = "+fmt(p.B-2*p.t,0)+" mm wide.";
    iRow=function(){var b=0.95;return GL('I',b)+OP('=')+F(GL(mm(p.B),b+0.16)+SUP('4')+OP('\u2212')+GL(mm(p.B-2*p.t),b+0.40)+SUP('4'),GL('12',b+0.62),{lg:1})+OP('=')+PI(sci(m.I,4)+' m'+SUP('4'),b+0.9,'res');};
  } else if(m.sec==='custom'){
    iBody="I is given for the section, so it goes straight in (10\u2076 mm\u2074 = 10\u207B\u2076 m\u2074).";
    iRow=function(){var b=0.95;return GL('I',b)+OP('=')+GL(fmt(p.Ix,2)+'\u00D710'+SUP('6')+' mm'+SUP('4'),b+0.2)+OP('=')+PI(sci(m.I,4)+' m'+SUP('4'),b+0.5,'res');};
  } else {
    iBody="A solid rectangular column has I = bh\u00B3/12, with h measured in the direction the floor sways.";
    iRow=function(){var b=0.95;return GL('I',b)+OP('=')+F(GL('b',b+0.16)+OP('\u00B7')+GL('h',b+0.34)+SUP('3'),GL('12',b+0.58),{lg:1})+OP('=')+F(GL(mm(p.b),b+0.70)+OP('\u00D7')+GL(mm(p.h),b+0.84)+SUP('3'),GL('12',b+1.02),{lg:1})+OP('=')+PI(sci(m.I,4)+' m'+SUP('4'),b+1.14,'res');};
  }
  if(!p.geom){
  cls.push({id:"stiff",name:"Stiffness",step:0,frames:[
    {t:"The storey stiffnesses are given",
     b:"In this problem each storey's stiffness k is typed in directly, so there is no column to size and no EI to find. The "+n+" numbers go straight into the stiffness matrix.",
     fx:EQ(m.k.map(function(v,ix){return function(){var b=ix*0.45;return GL('k'+SUB(ix+1),b)+OP('=')+PI(fmt(v,1)+' kN/m',b+0.2,'res');};})),
     n:"Switch the builder to \u201CFrom geometry\u201D to have k worked out from the material, the column section and the storey height.",
     svg:barsSVG(m)}
  ]});
  } else
  cls.push({id:"stiff",name:"Stiffness",step:0,frames:[
    {t:"One column is a spring: k = 12EI / h\u00B3",
     b:"Push the top of a column sideways and it pushes back. Both ends are held by beams, so the ends cannot rotate \u2014 that double fixity is where the <b>12</b> comes from. Watch the top of the fraction fill first, then the bottom.",
     fx:EQ([
       function(){var b=0;return GL('k'+SUB('col'),b)+OP('=')+F(GL('12',b+0.18)+OP('\u00B7')+GL('E',b+0.36)+OP('\u00B7')+GL('I',b+0.54),GL('h',b+0.78)+SUP('3'),{lg:1});},
       function(){var b=0.85;return GL('\u03B4',b)+OP('=')+F(GL('P',b+0.16)+OP('\u00B7')+GL('h',b+0.32)+SUP('3'),GL('12',b+0.60)+OP('\u00B7')+GL('E',b+0.76)+OP('\u00B7')+GL('I',b+0.92),{lg:1});}
     ]),
     n:"A taller column is much softer: halve the height and it gets eight times stiffer, because h is cubed.",
     svg:columnSVG(m,{})},
    {t:"Get E from the "+matName(m)+", I from the section",
     b:eBody+" "+iBody+" The numbers you multiply are highlighted in order.",
     fx:EQ([
       eRow,
       iRow,
       function(){var b=1.95;return GL('EI',b)+OP('=')+GL(fmt(m.Ec,0),b+0.14)+OP('\u00D7')+GL(sci(m.I,4),b+0.34)+' MPa\u00B7m'+SUP('4')+OP('=')+PI(fmt(m.EI,0)+' kN\u00B7m'+SUP('2'),b+0.58,'res');}
     ]),
     n:"Work in metres here: "+(m.sec==='hss'?fmt(p.B,0)+' mm = '+mm(p.B)+' m':m.sec==='solid'?fmt(p.b,0)+' mm = '+mm(p.b)+' m':'1 mm\u2074 = 10\u207B\u00B9\u00B2 m\u2074')+". MPa \u00D7 m\u2074 = MN\u00B7m\u00B2, so multiply by 1,000 for kN\u00B7m\u00B2.",
     svg:sectionSVG(m)},
    {t:"Put the numbers in \u2014 this is the multiplication",
     b:"Twelve times EI, divided by the cube of the height. Then "+(NW[m.cols]||m.cols)+" identical column"+(m.cols>1?"s":"")+" add up"+(sameH?" \u2014 and every storey is the same height, so every storey gets the same k.":", and each storey gets its own value because the heights differ."),
     fx:EQ((function(){
       var rows=[];
       rows.push(function(){var b=0;return GL('k'+SUB('col'),b)+OP('=')+F(GL('12',b+0.14)+OP('\u00B7')+GL(fmt(m.EI,1),b+0.32),GL(fmt(m.hs[0],3),b+0.54)+SUP('3'),{lg:1})+OP('=')+GL(fmt(Math.pow(m.hs[0],3),2),b+0.76)+OP('=')+PI(fmt(m.kc[0],1)+' kN/m',b+0.98,'res');});
       m.kf.forEach(function(v,ix){
         rows.push(function(){var b=0.75+ix*0.6;
           return GL('k'+SUB(ix+1),b)+OP('=')+GL(fmt(m.cols,0),b+0.12)+OP('\u00D7')+GL(fmt(m.kc[ix],1),b+0.26)+OP('=')+PI(fmt(v,1)+' kN/m',b+0.46,'res')+'<span class="hint-inline">h'+SUB(ix+1)+' = '+fmt(m.hs[ix],2)+' m</span>';
         });
       });
       return rows;
     })()),
     n:sameH?"One column: "+fmt(m.kc[0],1)+" kN/m. One storey ("+m.cols+" columns): "+fmt(m.kf[0],1)+" kN/m \u2014 the same for all "+n+" storeys."
       :"Bottom storey: "+fmt(m.kc[0],0)+" kN/m per column. Top storey: "+fmt(m.kc[n-1],0)+" kN/m \u2014 "+fmt(m.kc[n-1]/m.kc[0],2)+"\u00D7 "+(m.kc[n-1]>=m.kc[0]?"stiffer":"as stiff")+".",
     svg:barsSVG(m)}
  ]});

  /* ---------- 3. Step 1 of the notes: [K] and [M] ---------- */
  cls.push({id:"km",name:"K and M",step:1,frames:[
    {k:"03 \u00B7 matrices",t:"Each spring writes into two corners",
     b:"A spring between two floors puts <b>+k on both diagonal entries</b> and <b>\u2212k on the two off-diagonals joining them</b>. Read the diagonal: it collects every spring that touches that floor \u2014 exactly the k\u2081 + k\u2082, \u2212k\u2082 \u2026 pattern from the notes.",
     fx:EQ([
       function(){var b=0;return TAG('diagonal')+GL('K'+SUB(11),b)+OP('=')+GL('k'+SUB(1),b+0.16)+OP('+')+GL('k'+SUB(2),b+0.36)+OP('=')+GL(fmt(m.k[0],1),b+0.56)+OP('+')+GL(fmt(m.k[1],1),b+0.70)+OP('=')+PI(fmt(m.k[0]+m.k[1],1),b+0.94,'res');},
       function(){var b=0.95;return TAG('off-diagonal')+GL('K'+SUB(12),b)+OP('=')+OP('\u2212')+GL('k'+SUB(2),b+0.16)+OP('=')+PI(fmt(-m.k[1],1),b+0.40,'res');},
       function(){var b=1.9;return TAG('symmetry')+'every spring is shared by two floors, so '+GL('K = K'+SUP('T'),b+0.1);}
     ]),
     n:"Values in kN/m so the numbers stay readable; they become N/m inside the solver.",
     svg:matBlockSVG(matRows(m.K,function(v){return v?fmt(v/1000,1):'0';}),{stagger:0.05})},
    {k:"03 \u00B7 matrices",t:"The mass matrix is diagonal",
     b:"Masses sit at the floors, not between them, so nothing off the diagonal. Multiply by M and a vector just scales each floor by its own mass.",
     fx:EQ((function(){
       var rows=[];
       m.ms.forEach(function(v,ix){rows.push(function(){var b=ix*0.42;return GL('m'+SUB(ix+1),b)+OP('=')+GL(fmt(v,0),b+0.12)+' kg';});});
       rows.push(function(){var b=m.ms.length*0.42;return TAG('all other entries')+GL('0',b);});
       return rows;
     })()),
     svg:matBlockSVG(matRows(m.M,function(v){return v?fmt(v,0):'0';}),{stagger:0.05})},
  ]});

  /* ---------- 4. Step 2: [K \u2212 \u03C9\u00B2M] = 0, divide by m1, B = \u03C9\u00B2 ---------- */
  cls.push({id:"kwm",name:"K \u2212 \u03C9\u00B2M",step:2,frames:[
    {k:"03 \u00B7 matrices",t:"Equilibrium of the swinging building",
     b:"Newton for each floor: inertia minus the springs pulling back equals zero. That gives the matrix equation. The zero vector on the right is why this is an eigenvalue problem and not a linear system.",
     fx:EQ([
       function(){var b=0;return GL('K',b)+GL('\u03C6',b+0.10)+OP('=')+GL('\u03C9'+SUP('2'),b+0.30)+GL('M',b+0.44)+GL('\u03C6',b+0.54);},
       function(){var b=0.9;return OP('\u21D2')+GL('(K \u2212 \u03C9'+SUP('2')+'M)',b+0.10)+GL('\u03C6',b+0.36)+OP('=')+GL('0',b+0.46);},
       function(){var b=1.8;return TAG('note')+'a nonzero \u03C6 exists only when the bracket '+GL('cannot be inverted',b);}
     ]),
     svg:matBlockSVG(matRows(m.K,function(v){return fmt(v/1000,0);}),{stagger:0.05})},
    {k:"04 \u00B7 eigenvalue",t:"Guess a sway that repeats itself",
     b:"Try every floor moving together, sinusoidally: x = \u03C6 sin \u03C9t. Differentiate twice \u2014 the shape stays, a \u2212\u03C9\u00B2 appears. Substitute and the sine cancels, leaving a statement about shape and rate only.",
     fx:EQ([
       function(){var b=0;return GL('x(t)',b)+OP('=')+GL('\u03C6',b+0.16)+' sin '+GL('\u03C9t',b+0.34);},
       function(){var b=0.85;return GL('x\u0308(t)',b)+OP('=')+OP('\u2212')+GL('\u03C9'+SUP('2'),b+0.20)+GL('\u03C6',b+0.32)+' sin '+GL('\u03C9t',b+0.46);},
       function(){var b=1.7;return TAG('substitute')+GL('(K \u2212 \u03C9'+SUP('2')+'M)',b)+GL('\u03C6',b+0.30)+OP('=')+GL('0',b+0.42);}
     ]),
     n:"Only special \u03C9 make a nonzero \u03C6 possible \u2014 those are the building's natural frequencies.",
     svg:sineSVG(m)},
    {k:"03 \u00B7 matrices",t:"Divide everything by m\u2081",
     b:"The stiffnesses are in the tens of thousands and the masses in the thousands. Divide <b>every entry of both matrices</b> by the same number, m\u2081, and the mass matrix collapses to "+m.ms.map(function(v){return ratioTxt(v/m.ms[0]);}).join(", ")+" \u2014 something you can check at a glance. Nothing physical changes; the equations are only rescaled.",
     fx:EQ([
       function(){var b=0;return GL('K\u2032',b)+OP('=')+F(GL('K',b+0.16),GL('m'+SUB(1),b+0.34),{lg:1})+'\u2003\u2003'+GL('M\u2032',b+0.68)+OP('=')+F(GL('M',b+0.84),GL('m'+SUB(1),b+1.02),{lg:1});},
       function(){var b=0.95;return GL('M\u2032',b)+OP('=')+'diag('+m.ms.map(function(v){return ratioTxt(v/m.ms[0]);}).join(',\u2002')+')';},
       function(){var b=1.75;return TAG('why it works')+'every row is divided by the same number, so the roots do not move';}
     ]),
     n:"m\u2081 = "+fmt(m.ms[0],0)+" kg \u2014 the bottom floor. In the notes: \u201cdivide "+fmt(m.ms[0],0)+", \u03C9\u00B2 = B\u201d.",
     svg:divideSVG(m)},
    {k:"03 \u00B7 matrices",t:"Now put B = \u03C9\u00B2 on the diagonal",
     b:"B is the only unknown left. Because M\u2032 is diagonal, B lands on the diagonal and nowhere else: each diagonal cell becomes stiffness minus B times its mass ratio. The "+(n===3?"nine":"four")+" cells get letter names so the expansion can point at them.",
     fx:EQ([
       function(){var b=0;return GL('(K\u2032 \u2212 B M\u2032)',b)+GL('\u03C6',b+0.34)+OP('=')+GL('0',b+0.44);},
       function(){var b=0.9;return TAG('diagonal')+GL('a',b)+OP('=')+GL(fmt(Kp[0][0],2),b+0.14)+OP('\u2212')+GL('B',b+0.40);},
       function(){var b=1.8;return TAG('off-diagonal')+GL('b',b)+OP('=')+GL(fmt(Kp[0][1],2),b+0.14)+'\u2014 no B ever appears here';}
     ]),
     svg:cofactorSVG(m,0,-1)}
  ]});

  /* ---------- 5. Step 3: det[K \u2212 \u03C9\u00B2M] = 0 by cofactor expansion ---------- */
  var detFrames=[], i2;
  function tdata(j){
    var A=[],r,c2;
    for(r=0;r<n;r++){A.push([]);for(c2=0;c2<n;c2++)A[r].push([-Mp[r][c2],Kp[r][c2]]);}
    var cs=[];for(c2=0;c2<n;c2++)if(c2!==j)cs.push(c2);
    var p1=cs[0],p2=cs[1];
    var main=pmul(A[1][p1],A[2][p2]), cross=pmul(A[1][p2],A[2][p1]);
    var minor=psub(main,cross), term=pmul(A[0][j],minor);
    return {main:main,cross:cross,minor:minor,term:term,p1:p1,p2:p2,pivot:A[0][j],sign:(j===1?-1:1)};
  }
  if(n===3){
    var t1=tdata(0), t2=tdata(1);
    detFrames.push({k:"05 \u00B7 determinant",t:"A 3\u00D73 determinant is three smaller ones",
      b:"Expand along the top row: each of its three entries is a <b>pivot</b>, and each pivot multiplies the 2\u00D72 that is left once you delete its row and its column. The signs alternate + \u2212 +, and the diagonal pattern below is all you have to remember.",
      fx:EQ([
        function(){var b=0;return GL('det',b)+OP('=')+'<span class="c1">'+GL('a',b+0.10)+GL('(ei \u2212 fh)',b+0.26)+'</span>'+OP('\u2212')+'<span class="c2">'+GL('b',b+1.05)+GL('(di \u2212 fg)',b+1.21)+'</span>'+OP('+')+'<span class="c3">'+GL('c',b+2.0)+GL('(dh \u2212 eg)',b+2.16)+'</span>';},
        function(){var b=2.85;return TAG('read it as')+'pivot \u00D7 (main \u2218 cross of the 2\u00D72 left behind)';}
      ]),
      svg:cofactorSVG(m,0,-2)});
    detFrames.push({k:"05 \u00B7 determinant",t:"Term 1: delete row 1 and column 1",
      b:"Pivot <b>a</b> is the corner cell, so removing its row and column leaves e, f, h, i exactly where they were. Nothing is copied and nothing moves \u2014 the four surviving cells are already the 2\u00D72 you need.",
      fx:EQ([
        function(){var b=0;return TAG('pivot')+GL('a',b)+OP('=')+GL(pnum(t1.pivot,2),b+0.18);},
        function(){var b=0.85;return TAG('sign')+'+ keep this term as it comes';}
      ]),
      svg:cofactorSVG(m,0,0)});
    detFrames.push({k:"05 \u00B7 determinant",t:"Pair \u2198 e with i and multiply",
      b:"Inside the 2\u00D72, multiply the cells on the main diagonal: e with i. This is one of the only two multiplications term 1 needs.",
      fx:EQ([
        function(){var b=0;return GL('e \u00D7 i',b)+OP('=')+PI(pnum(t1.main,2),b+0.30,'flow res');},
        function(){var b=0.9;return TAG('why both')+'a 2\u00D72 determinant is always main diagonal minus the other one';}
      ]),
      svg:cofactorSVG(m,0,1)});
    detFrames.push({k:"05 \u00B7 determinant",t:"Pair \u2199 f with h and subtract",
      b:"The other diagonal gives the second product, and it is <b>subtracted</b>: minor = e\u00B7i \u2212 f\u00B7h. Multiply that by the pivot a and term 1 is done.",
      fx:EQ([
        function(){var b=0;return GL('f \u00D7 h',b)+OP('=')+PI(pnum(t1.cross,2),b+0.30,'flow res');},
        function(){var b=0.9;return TAG('minor')+GL('e\u00B7i \u2212 f\u00B7h',b)+OP('=')+PI(pnum(t1.minor,2),b+0.44,'flow res');},
        function(){var b=1.85;return TAG('term 1')+'T'+SUB(1)+OP('=')+PI(pnum(t1.term,2),b+0.30,'flow res');}
      ]),
      svg:cofactorSVG(m,0,2)});
    detFrames.push({k:"05 \u00B7 determinant",t:"Term 2: the middle pivot, with a minus sign",
      b:"Now the pivot is <b>b</b> \u2014 the cell joining floors 1 and 2, a stiffness with no B in it. Delete row 1 and column 2; the 2\u00D72 that survives is d, f, g, i, and the whole term carries a minus sign because of its position.",
      fx:EQ([
        function(){var b=0;return TAG('pivot')+GL('b',b)+OP('=')+GL(pnum(t2.pivot,2),b+0.18)+'<span class="hint-inline">no B \u2014 this term is a lower-degree polynomial</span>';}
      ]),
      svg:cofactorSVG(m,1,0)});
    detFrames.push({k:"05 \u00B7 determinant",t:"Pair \u2198 d\u00B7i and \u2199 f\u00B7g",
      b:"Same two products, different cells: main diagonal d with i, cross diagonal f with g. Subtract, multiply by b, and subtract the whole thing from term 1.",
      fx:EQ([
        function(){var b=0;return GL('d \u00D7 i',b)+OP('\u2212')+GL('f \u00D7 g',b+0.34)+OP('=')+PI(pnum(t2.minor,2),b+0.72,'flow res');},
        function(){var b=0.85;return TAG('term 2')+'\u2212 b \u00D7 minor'+OP('=')+PI(pnum(t2.term.map(function(v){return -v;}),2),b+0.30,'flow res');}
      ]),
      svg:cofactorSVG(m,1,2)});
    detFrames.push({k:"05 \u00B7 determinant",t:"Term 3 dies: its pivot is zero",
      b:"The corner cell <b>c</b> joins floor 1 to floor 3, and no spring does that \u2014 it is zero, and a zero pivot wipes out its whole term however large the minor is. That is why the determinant only has two live products.",
      fx:EQ([
        function(){var b=0;return TAG('pivot')+GL('c',b)+OP('=')+PI('0',b+0.16,'res')+OP('\u21D2')+'term 3 = 0';}
      ]),
      svg:cofactorSVG(m,2,2)});
    detFrames.push({k:"05 \u00B7 determinant",t:"Add the terms: the determinant",
      b:"With the alternating signs, det = T\u2081 \u2212 T\u2082 + T\u2083. Each T is a polynomial in B, so stacking them and adding collapses everything into one cubic \u2014 the characteristic polynomial.",
      fx:EQ([
        function(){var b=0;return GL('det(B)',b)+OP('=')+PI(pnum(co,2),b+0.26,'flow res');},
        function(){var b=0.95;return TAG('degree')+'three roots \u2014 three natural frequencies, no more';}
      ]),
      svg:sumSVG(m)});
  } else {
    detFrames.push({k:"05 \u00B7 determinant",t:"A 2\u00D72 determinant is one subtraction",
      b:"With two floors the determinant is just the main diagonal product minus the cross product: a\u00B7d \u2212 b\u00B7c. The two arrows below are exactly those products.",
      fx:EQ([
        function(){var b=0;return GL('det',b)+OP('=')+GL('a',b+0.10)+GL('d',b+0.20)+OP('\u2212')+GL('b',b+0.40)+GL('c',b+0.50);}
      ]),
      svg:cofactorSVG(m,0,0)});
    detFrames.push({k:"05 \u00B7 determinant",t:"Pair \u2198 a with d",
      b:"The main diagonal product stays positive.",
      fx:EQ([function(){var b=0;return GL('a \u00D7 d',b)+OP('=')+PI(pnum(pmul([-Mp[0][0],Kp[0][0]],[-Mp[1][1],Kp[1][1]]),2),b+0.30,'flow res');}]),
      svg:cofactorSVG(m,0,1)});
    detFrames.push({k:"05 \u00B7 determinant",t:"Pair \u2199 b with c and subtract",
      b:"The cross product is subtracted. What is left is the determinant, a quadratic in B.",
      fx:EQ([
        function(){var b=0;return GL('b \u00D7 c',b)+OP('=')+PI(pnum(pmul([-Mp[0][1],Kp[0][1]],[-Mp[1][0],Kp[1][0]]),2),b+0.30,'flow res');},
        function(){var b=0.9;return TAG('det')+PI(pnum(co,2),b,'flow res');}
      ]),
      svg:cofactorSVG(m,0,2)});
  }
  detFrames.push({k:"05 \u00B7 determinant",t:"The characteristic equation",
    b:"Set the determinant to zero: that equation is what selects the frequencies. Divide every term by the leading coefficient so the polynomial starts with 1B\u00B3 \u2014 same roots, tidier arithmetic.",
    fx:EQ([
      function(){var b=0;return GL('det(B)',b)+OP('=')+GL('0',b+0.4)+OP('\u21D2')+PI(pnum(co,2),b+0.6,'flow res')+OP('=')+GL('0',b+2.6);},
      function(){var b=1.0;return TAG('\u00F7 '+fmt(lead,3))+OP('\u21D2')+'&nbsp;'+GL(pnum(mono,4),b+0.2);}
    ]),
    n:"Degree "+n+" \u2014 exactly "+n+" roots, hence "+n+" natural frequencies.",
    svg:curveSVG(m,{roots:false})});
  cls.push({id:"det",name:"Determinant",step:3,frames:detFrames});

  /* ---------- 6. frequencies ---------- */
  var modeRows=[];
  for(i=0;i<n;i++)modeRows.push('f'+sub(i)+' = '+fmt(m.freq[i],3)+' Hz');
  cls.push({id:"roots",name:"Frequencies",step:3,frames:[
    {k:"06 \u00B7 roots",t:"Where the curve crosses zero",
     b:"The determinant is a polynomial, so its roots are where the curve meets the axis. All "+n+" roots come out positive \u2014 that is what turns them into frequencies instead of nonsense.",
     n:"Read them off: B\u2081, B\u2082, B\u2083 \u2014 each is \u03C9\u00B2 for one mode.",
     svg:curveSVG(m,{roots:true})},
    {k:"06 \u00B7 roots",t:"From B to hertz and seconds",
     b:"Square-root for rad/s, divide by 2\u03C0 for hertz, invert for the period. The first period is how long one full sway of the slow mode takes.",
     fx:EQ([
       function(){var b=0;return GL('\u03C9'+SUB(1),b)+OP('=')+SQ(GL(fmt(m.lam[0],1),b+0.2))+OP('=')+PI(fmt(m.omega[0],3)+' rad/s',b+0.55,'res');},
       function(){var b=0.9;return GL('f'+SUB(1),b)+OP('=')+F(GL('\u03C9'+SUB(1),b+0.16),GL('2\u03C0',b+0.34),{lg:1})+OP('=')+F(GL(fmt(m.omega[0],3),b+0.50),GL('6.2832',b+0.66),{lg:1})+OP('=')+PI(fmt(m.freq[0],3)+' Hz',b+0.92,'res');},
       function(){var b=1.85;return GL('T'+SUB(1),b)+OP('=')+F(GL('1',b+0.16),GL('f'+SUB(1),b+0.30),{lg:1})+OP('=')+F(GL('1',b+0.46),GL(fmt(m.freq[0],3),b+0.60),{lg:1})+OP('=')+PI(fmt(m.per[0],4)+' s',b+0.86,'res');},
       function(){var b=2.8;return TAG('all modes')+'<span class="hint-inline">'+modeRows.join(' \u00B7 ')+'</span>';}
     ]),
     n:"Check: the roots add to the trace of M\u207B\u00B9K, which is "+fmt(traceOf(m),1)+".",
     svg:freqSVG(m)},
    (function(){
      var S2=scaledMat(m), co2=detPolyN(S2.Kp,S2.Mp);
      var gs=[1000,10000,35000], res=[], i2;
      for(i2=0;i2<n;i2++)res.push(newtonRoot(co2,gs[i2]));
      var rows=[
        function(){var b=0;return TAG('as it is')+GL('det',b)+OP('=')+GL(pnum(co2,2).split('B').join('X'),b+0.25)+OP('=')+GL('0',b+2.2);}
      ];
      for(i2=0;i2<n;i2++)(function(k){
        rows.push(function(){
          var b=0.9+k*0.8;
          return TAG('guess '+fmt(gs[k],0))+'X\u2080 = '+fmt(gs[k],0)+OP('\u21D2')+
            PI('X = '+fmt(res[k].x,4),b,'flow res')+'<span class="hint-inline">'+res[k].it+' steps</span>';
        });
      })(i2);
      return {k:"06 \u00B7 roots",t:"Type it as it is, then SHIFT + SOLVE",
        b:"On the calculator the equation goes in exactly as written \u2014 nothing is shifted across, nothing is divided by the leading coefficient. SOLVE still needs a starting guess: from there the solver steps downhill until the answer stops moving, so the guess decides which of the "+n+" roots comes back.",
        fx:EQ(rows),
        n:"The same equation holds every root. A guess near a root lands on it in three or four steps; type a guess sitting on another root and SOLVE hands you that one instead \u2014 which is exactly why all "+n+" guesses are worth running.",
        svg:newtonSVG(m)};
    })()
  ]});

  /* ---------- 7. Step 4: [K \u2212 \u03C9\u00B2M]{\u03C6} = 0, one chapter per mode ---------- */
  var ROWCHECK=
    {k:"04 \u00B7 eigenvalue",t:"Check: read row 1 of K\u03C6 = \u03C9\u00B2M\u03C6",
     b:"Put \u03C6\u2081 back into the original equation. Row 1 says: every stiffness on that row times the shape value of its floor, added up, must equal \u03C9\u00B2 m\u2081 \u03C6\u2081. Three products on the left, one on the right \u2014 this is the arithmetic behind the eigenvalue.",
     fx:EQ([
       function(){var b=0;return '\u03A3'+SUB('j')+GL('K'+SUB('1j'),b+0.10)+GL('\u03C6'+SUB('j'),b+0.24)+OP('=')+GL('\u03C9'+SUP('2'),b+0.42)+GL('m'+SUB(1),b+0.54)+GL('\u03C6'+SUB(1),b+0.66);},
       function(){var b=0.85,s='',q,v,neg;
         for(q=0;q<n;q++){v=m.K[0][q]/1000;neg=v<0;
           s+=(q===0?(neg?OP('\u2212'):''):OP(neg?'\u2212':'+'))+GL(fmt(Math.abs(v),1),b+0.06+0.28*q)+OP('\u00D7')+GL(fmt(m.phi[0][q],4),b+0.14+0.28*q);}
         var sums=0;for(q=0;q<n;q++){sums+=(m.K[0][q]/1000)*m.phi[0][q];}
         return s+OP('=')+PI(fmt(sums,1)+' kN',b+0.10+0.28*n,'res');},
       function(){var b=2.15;return GL('\u03C9'+SUP('2'),b)+GL('m'+SUB(1),b+0.12)+GL('\u03C6'+SUB(1),b+0.24)+OP('=')+GL(fmt(m.lam[0],1),b+0.40)+OP('\u00D7')+GL(fmt(m.ms[0],0),b+0.52)+OP('\u00D7')+GL(fmt(m.phi[0][0],4),b+0.66)+OP('=')+PI(fmt(m.lam[0]*m.ms[0]*m.phi[0][0]/1000,1)+' kN',b+0.92,'res');}
     ]),
     n:"Units work because \u03C6 is read in metres (roof = 1.000 m), so K\u03C6 is a force in kN.",
     svg:dotWalkSVG(m)};
  for(i=0;i<n;i++){var mc=modeChapter(m,i);if(i===0)mc.frames.push(ROWCHECK);cls.push(mc);}

  /* ---------- 8. motion ---------- */
  var motion=[], mno=("0"+(7+n)).slice(-2);
  for(i=0;i<n;i++){
    var ph=m.phi[i], sgn=ph.map(function(v){return v<0?-1:1;}), opp=[], j2;
    for(j2=0;j2<n-1;j2++){if(sgn[j2]!==sgn[n-1])opp.push(j2+1);}
    var note=opp.length===0
      ? 'All '+n+' entries of \u03C6'+sub(i)+' carry the same sign, so the floors lean together and cross zero together \u2014 one rigid shape swinging, not a wave.'
      : 'Floor '+(opp.join(' and '))+(opp.length>1?' lean':' leans')+' opposite to the roof in \u03C6'+sub(i)+', so the building bends at '+(opp.length>1?'those levels':'that level')+' instead of leaning as a block.';
    var dur=2600/(m.freq[i]/m.freq[0]); if(dur<520)dur=520; if(dur>3000)dur=3000;
    var slow=Math.round(dur/1000/m.per[i]);
    motion.push({k:mno+" \u00B7 motion",t:"Mode "+(i+1)+" in motion",
      b:"Every floor reaches its extreme, and crosses rest, at the same instant \u2014 that is what makes it a mode rather than a wiggle. Its true period is T"+sub(i)+" = "+fmt(m.per[i],3)+" s; <span class=\"only-slow\">the animation runs "+slow+"\u00D7 slower so the eye can follow the shape.</span><span class=\"only-true\">at true speed it is a blur \u2014 the shape is what you can actually see.</span><span class=\"only-static\">your system asks for reduced motion, so the frame is held still at its extreme.</span>",
      f:"x(t) = A \u00B7 \u03C6"+sub(i)+" \u00B7 sin(\u03C9"+sub(i)+" t)\n\u03C9"+sub(i)+" = "+fmt(m.omega[i],3)+" rad/s   \u00B7   T"+sub(i)+" = "+fmt(m.per[i],3)+" s",
      n:note, hold:Math.max(5200,Math.round(dur*2.2)+900),
      live:"mode",mode:i,svg:""});
  }
  var ratios=m.freq.slice(1).map(function(v,k2){return 'mode '+(k2+2)+' is '+fmt(v/m.freq[0],2)+'\u00D7 faster';}).join(', ');
  motion.push({k:mno+" \u00B7 motion",t:"All modes at once: the real motion",
    b:"Release the building from your initial condition and every mode rings at once. A roof pull is the awkward case: the roof is the floor every mode moves the most, so the fast modes come in almost as strong as the slow one \u2014 which is why the trace is a fast ripple riding on a slow sway.",
    f:"x(t) = \u03A3 \u03C6\u0302\u1D63 q\u1D63(t)\nq\u1D63(t) = q\u1D63(0) cos(\u03C9\u1D63 t) + q\u0307\u1D63(0)/\u03C9\u1D63 \u00B7 sin(\u03C9\u1D63 t)",
    n:'The '+n+' modal periods are far apart \u2014 '+ratios+'. Start the building in its first-mode shape instead and the ripple vanishes: it would ring cleanly at T'+sub(0)+' = '+fmt(m.per[0],3)+' s.',
    hold:8200, live:"total",svg:""});
  cls.push({id:"sketch",name:"Sketch",step:5,frames:[
    {t:"Sketch the mode shapes",
     b:"This is the drawing the question asks for. For each mode, draw the undeformed building as a straight line, then mark every floor at its mode-shape factor \u2014 positive to one side, negative to the other \u2014 and join the points from the ground up. Where the line crosses the undeformed axis there is a <b>node</b>: a level that does not move in that mode.",
     fx:EQ(m.phi.map(function(ph,r){return function(){var b=r*0.5;return TAG('mode '+(r+1))+'{\u03C6'+SUB(r+1)+'}'+OP('=')+PI('{ '+ph.map(function(v){return fmt(v,4);}).join(',  ')+' }',b+0.2,'res')+'<span class="hint-inline">'+(r===0?'no node':r+' node'+(r>1?'s':''))+'</span>';};})),
     n:"Mode r has r \u2212 1 nodes: mode 1 leans one way, mode 2 bends once, mode 3 bends twice. If your sketch breaks that rule, recheck a sign.",
     hold:7200,svg:sketchSVG(m)}
  ]});
  cls.push({id:"motion",name:"In motion",step:5,frames:motion});

  cls.forEach(function(c,ci){
    var lab=('0'+(ci+1)).slice(-2)+' \u00B7 '+c.name;
    c.frames.forEach(function(f){f.k=lab;});
  });
  return cls;
}

/* the five steps from the class notes; a chapter's .step points into this list */
var STEPS=[
  {n:'Given',t:'Column stiffness k = 12EI/h\u00B3'},
  {n:'Step 1',t:'[K] and [M]'},
  {n:'Step 2',t:'[K \u2212 \u03C9\u00B2M] = 0'},
  {n:'Step 3',t:'det[K \u2212 \u03C9\u00B2M] = 0'},
  {n:'Step 4',t:'[K \u2212 \u03C9\u00B2M]{\u03C6} = 0'},
  {n:'Step 5',t:'Sketch the mode shapes'}
];

function polyTerm(m,r){
  var S2=scaledMat(m),Kp=S2.Kp,Mp=S2.Mp;
  function a(i,j){return [-Mp[i][j],Kp[i][j]];}
  if(m.N===2)return r===0?pmul(a(0,0),a(1,1)):psub([0],[0,0]).concat([]);
  if(r===0)return pmul(a(0,0),psub(pmul(a(1,1),a(2,2)),pmul(a(1,2),a(2,1))));
  if(r===1)return pmul(a(0,1),psub(pmul(a(1,0),a(2,2)),pmul(a(1,2),a(2,0))));
  return pmul(a(0,2),psub(pmul(a(1,0),a(2,1)),pmul(a(1,1),a(2,0))));
}
function traceOf(m){
  var S2=scaledMat(m),s=0,i;
  for(i=0;i<m.N;i++)s+=S2.Kp[i][i]/S2.Mp[i][i];
  return s;
}

/* matrix figure wrapper */
function matBlockSVG(rows,o){
  o=o||{};
  var W=520,H=340,n=rows.length,cw=Math.min(96,300/n),ch=Math.min(64,210/n);
  var x=(W-n*cw)/2, y=(H-n*ch)/2-6;
  var s=svgOpen(W,H);
  s+=matBlock(x,y,rows,{cw:cw,ch:ch,fs:n>2?11.5:15,stagger:o.stagger});
  if(o.heads){
    var j2;
    for(j2=0;j2<n;j2++)s+=t(x+(j2+0.5)*cw,y-13,o.heads[j2],{fs:12,anchor:'middle',fill:(o.headCols||[])[j2%4]||MUTED,weight:700});
  }
  s+='</svg>';
  return s;
}

/* ---------- a cofactor term, drawn straight onto the matrix ---------- */
function cofactorSVG(m,j,stage){
  var n=m.N,S2=scaledMat(m),Kp=S2.Kp,Mp=S2.Mp,i,k;
  var LET=[['a','b','c'],['d','e','f'],['g','h','i']];
  var L2=(n===3?LET:[['a','b'],['c','d']]);
  var cw=(n===3?112:142), ch=(n===3?56:76), mx=(520-n*cw)/2, my=(n===3?64:70);
  var H=(n===3?368:346);
  var cols=[];for(i=0;i<n;i++)if(i!==j)cols.push(i);
  var hot=function(r,c){return stage>=0&&r===0&&c===j;};
  var mino=function(r,c){return stage>=0&&r>0&&c!==j;};
  var dim=function(r,c){return (stage>=0&&!hot(r,c)&&(r===0||c===j))||(stage===-2&&r>0);};
  var cx=function(c){return mx+c*cw+cw/2;},cy=function(r){return my+r*ch+ch/2;};
  var s=svgOpen(520,H), bs=2.2;
  /* matrix brackets */
  s+=line(mx-14,my,mx-14,my+n*ch,{stroke:INK,w:bs});
  s+=line(mx-14,my,mx-7,my,{stroke:INK,w:bs});
  s+=line(mx-14,my+n*ch,mx-7,my+n*ch,{stroke:INK,w:bs});
  s+=line(mx+n*cw+14,my,mx+n*cw+14,my+n*ch,{stroke:INK,w:bs});
  s+=line(mx+n*cw+14,my,mx+n*cw+7,my,{stroke:INK,w:bs});
  s+=line(mx+n*cw+14,my+n*ch,mx+n*cw+7,my+n*ch,{stroke:INK,w:bs});
  /* the grid */
  for(i=0;i<n;i++)for(k=0;k<n;k++){
    var x=mx+k*cw,y=my+i*ch;
    var f=hot(i,k)?'#f4f5ff':(mino(i,k)?'#f4fdfa':'#fff');
    if(dim(i,k))f='#fcfcfd';
    s+=rect(x,y,cw,ch,0,{fill:f,stroke:'#ececf2',sw:1,op:dim(i,k)?0.6:1});
  }
  /* what survives, outlined */
  if(stage>=0){
    var out='';
    if(n===2){
      out='<rect x="'+(mx+cols[0]*cw-4)+'" y="'+(my+ch-4)+'" width="'+(cw+8)+'" height="'+(ch+8)+'" rx="13" fill="none" stroke="'+MINT+'" stroke-width="1.8" stroke-dasharray="7 5"/>';
    } else {
      var runs=[],st=cols[0],pr=cols[0];
      for(i=1;i<cols.length;i++){if(cols[i]===pr+1){pr=cols[i];}else{runs.push([st,pr]);st=cols[i];pr=cols[i];}}
      runs.push([st,pr]);
      for(i=0;i<runs.length;i++){
        var rx0=mx+runs[i][0]*cw-4,rw=(runs[i][1]-runs[i][0]+1)*cw+8;
        out+='<rect x="'+rx0.toFixed(1)+'" y="'+(my+ch-4)+'" width="'+rw.toFixed(1)+'" height="'+(2*ch+8)+'" rx="13" fill="none" stroke="'+MINT+'" stroke-width="1.8" stroke-dasharray="7 5"/>';
      }
    }
    s+='<g class="pin" style="animation-delay:0.12s">'+out+'</g>';
  }
  /* pivot ring */
  if(stage>=0){
    s+='<rect x="'+(mx+j*cw+1.8)+'" y="'+(my+1.8)+'" width="'+(cw-3.6)+'" height="'+(ch-3.6)+'" rx="10" fill="none" stroke="'+ACCENT+'" stroke-width="2.2"/>';
  }
  /* pairing arrows, under the numerals */
  var yNum=function(r){return cy(r)+11;};   /* the numerals sit below the cell centre */
  var m1x=n===3?cx(cols[0]):cx(0), m1y=yNum(n===3?1:0), m2x=n===3?cx(cols[1]):cx(1), m2y=yNum(n===3?2:1);
  var a1x=n===3?cx(cols[1]):cx(1), a1y=yNum(n===3?1:0), a2x=n===3?cx(cols[0]):cx(0), a2y=yNum(n===3?2:1);
  var hw=function(r,c){return cellText(Kp,Mp,r,c).length*(n===3?3.3:3.9);};
  var mr1=n===3?1:0, mr2=n===3?2:1;
  if(stage>=2)s+=pairArrow(a1x,a1y,a2x,a2y,AMBER,0.05,0,false,hw(mr1,cols[1]),hw(mr2,cols[0]));
  if(stage>=1)s+=pairArrow(m1x,m1y,m2x,m2y,MINT,0.05,0,stage>=2,hw(mr1,cols[0]),hw(mr2,cols[1]));
  /* letters, then the numbers */
  var lc=function(r,c){
    if(stage>=1&&r===1&&c===cols[0])return MINT;
    if(stage>=1&&r===2&&c===cols[1])return MINT;
    if(stage>=2&&r===1&&c===cols[1])return AMBER;
    if(stage>=2&&r===2&&c===cols[0])return AMBER;
    return hot(r,c)?ACCENT:(mino(r,c)&&stage>=0?MINT:'#b8b8c6');
  };
  for(i=0;i<n;i++)for(k=0;k<n;k++){
    s+=t(mx+k*cw+9,my+i*ch+16,L2[i][k],{fs:9.5,weight:700,mono:1,fill:lc(i,k),op:dim(i,k)?.5:1});
    s+=t(mx+k*cw+cw/2,my+i*ch+ch/2+15,cellText(Kp,Mp,i,k),
      {fs:n===3?10.5:12.5,anchor:'middle',mono:1,weight:hot(i,k)?700:500,fill:dim(i,k)?FAINT:INK,op:dim(i,k)?.55:1});
  }
  /* signs above row 1 */
  if(stage===-2){
    for(k=0;k<n;k++)s+='<g class="pin" style="animation-delay:'+(0.5+k*0.3).toFixed(2)+'s">'+
      t(cx(k),my-14,k===1?'\u2212':(k===2?'+':'\u002B'),{fs:16,anchor:'middle',weight:700,fill:k===1?AMBER:ACCENT})+'</g>';
    s+=t(14,my-14,'signs',{fs:10.5,fill:FAINT});
  }
  /* captions */
  var ty=my+n*ch+34;
  if(stage===-1){
    s+=t(14,ty,'row 1 holds the three pivots; a, e and i carry B \u2014 nothing else does',{fs:11.5,fill:MUTED});
  } else if(stage===-2){
    s+=t(14,ty,'each entry is K\u2032 \u2212 B M\u2032 \u2014 a diagonal cell, so it carries B',{fs:11.5,fill:MUTED});
  } else {
    var pv=n===3?[-Mp[0][j],Kp[0][j]]:[-Mp[0][j],Kp[0][j]];
    var lbl=n===3?('term '+(j+1)+'  \u00B7  pivot '+L2[0][j]):('det  \u00B7  pivot '+L2[0][0]);
    var eq=pnum(pv,2).replace(/ \u2212 /g,' \u2212 ').replace(/ \+ /g,' + ');
    s+='<g class="pin" style="animation-delay:0.05s">'+t(14,ty,lbl+' = '+eq,{fs:12.5,weight:700})+'</g>';
    if(stage===0){
      s+='<g class="pin" style="animation-delay:0.28s">'+t(14,ty+25,(n===3?('delete row 1 and column '+(j+1)+' \u2014 the faint cells are gone'):'every cell survives \u2014 a, b, c, d'),{fs:11.5,fill:MUTED})+'</g>';
      s+='<g class="pin" style="animation-delay:0.5s">'+t(14,ty+50,(n===3?'what survives is the 2\u00D72 outlined in green':'what survives is d \u2014 the cell in green'),{fs:11.5,fill:MINT,weight:600})+'</g>';
    }
    var m1l=n===3?LET[1][cols[0]]:'a', m2l=n===3?LET[2][cols[1]]:'d';
    var x1l=n===3?LET[1][cols[1]]:'b', x2l=n===3?LET[2][cols[0]]:'c';
    if(stage>=1){
      s+='<g class="pin" style="animation-delay:0.4s">'+t(14,ty+25,'main \u2198  '+m1l+' \u00D7 '+m2l,{fs:12.5,mono:1,fill:MINT,weight:700})+'</g>';
    }
    if(stage>=2){
      s+='<g class="pin" style="animation-delay:0.6s">'+t(14,ty+50,'cross \u2199  '+x1l+' \u00D7 '+x2l,{fs:12.5,mono:1,fill:AMBER,weight:700})+'</g>';
      s+='<g class="pin" style="animation-delay:0.8s">'+t(14,ty+75,'minor = main \u2212 cross',{fs:12.5,mono:1,fill:INK,weight:600})+'</g>';
      s+='<g class="pin" style="animation-delay:1.0s">'+t(14,ty+100,(n===3?('T'+sub(j)+' = '):'det = ')+(j===1?'\u2212':'\u002B')+' pivot \u00D7 minor',{fs:12.5,mono:1,fill:[ACCENT,MINT,AMBER][j],weight:700})+'</g>';
    }
  }
  s+='</svg>';
  return s;
}

/* ---------- K and M, each divided by m1 ---------- */
function divideSVG(m){
  var S2=scaledMat(m),Kp=S2.Kp,Mp=S2.Mp,n=m.N,i;
  var cw=(n===3?68:96), ch=(n===3?40:54), gap=86;
  var mw=n*cw, xL=(520-(2*mw+gap))/2, xR=xL+mw+gap;
  var H=(n===3?446:436);
  var s=svgOpen(520,H);
  var kRows=matRows(m.K,function(v){return fmt(v,0);});
  var kpRows=matRows(Kp,function(v){return Math.abs(v)<1e-9?'0':fmt(v,2);});
  var mRows=matRows(m.M,function(v){return v?fmt(v,0):'0';});
  var mpRows=matRows(Mp,function(v){return Math.abs(v)<1e-9?'0':fmt(v,2);});
  var fs=(n===3?9.2:11);
  s+=t(xL,40,'[K]   N/m',{fs:11,fill:MUTED,weight:700});
  s+=t(xR,40,'[K\u2032] = [K] \u00F7 m\u2081',{fs:11,fill:ACCENT,weight:700});
  s+=matBlock(xL,54,kRows,{cw:cw,ch:ch,fs:fs});
  s+=matBlock(xR,54,kpRows,{cw:cw,ch:ch,fs:fs,hot:function(r,c){return r===c;}});
  s+=t(xL+mw+gap/2,54+n*ch/2+6,'\u00F7 '+fmt(m.ms[0],0),{fs:12,anchor:'middle',weight:700,fill:ACCENT});
  var y2=54+n*ch+84;
  s+=t(xL,y2-14,'[M]   kg',{fs:11,fill:MUTED,weight:700});
  s+=t(xR,y2-14,'[M\u2032] = [M] \u00F7 m\u2081',{fs:11,fill:ACCENT,weight:700});
  s+=matBlock(xL,y2,mRows,{cw:cw,ch:ch,fs:fs});
  s+=matBlock(xR,y2,mpRows,{cw:cw,ch:ch,fs:fs,hot:function(r,c){return r===c;}});
  s+=t(xL+mw+gap/2,y2+n*ch/2+6,'\u00F7 '+fmt(m.ms[0],0),{fs:12,anchor:'middle',weight:700,fill:ACCENT});
  s+=t(14,y2+n*ch+34,'same number top and bottom \u2014 the equations are unchanged, only easier to read',{fs:11,fill:FAINT});
  s+='</svg>';
  return s;
}

/* ---------- T1 / T2 / T3 ladder, then the det they add up to ---------- */
function sumSVG(m){
  var n=m.N,S2=scaledMat(m),Kp=S2.Kp,Mp=S2.Mp,i,j;
  function a(i,j){return [-Mp[i][j],Kp[i][j]];}
  var TC=[ACCENT,MINT,AMBER], terms=[];
  if(n===2){
    terms.push([1,pmul(a(0,0),a(1,1))]);
    terms.push([-1,pmul(a(0,1),a(1,0))]);
  } else {
    for(j=0;j<n;j++){
      var cs=[];for(i=0;i<n;i++)if(i!==j)cs.push(i);
      terms.push([(j%2?-1:1),pmul(a(0,j),psub(pmul(a(1,cs[0]),a(2,cs[1])),pmul(a(1,cs[1]),a(2,cs[0]))))]);
    }
  }
  var det=detPolyN(Kp,Mp), lead=det[0]||1, mon=det.map(function(v){return v/lead;});
  var y0=56, dy=34, H=(n===2?248:284);
  var s=svgOpen(520,H);
  function pfs(str){return Math.max(8,Math.min(10.6,452/(0.605*Math.max(1,str.length))));}
  s+=t(28,26,'each pivot times the 2\u00D72 it leaves behind',{fs:10.5,fill:FAINT,weight:700});
  var yb=y0, i2;
  for(i2=0;i2<terms.length;i2++){
    var poly=pnum(terms[i2][1],2), col=TC[i2%3];
    s+=t(34,yb,'T'+sub(i2),{fs:12,weight:700,fill:col});
    s+=t(64,yb,poly,{fs:pfs(poly),mono:1,fill:poly==='0'?FAINT:INK});
    if(poly==='0')s+=t(84,yb,'\u2014 pivot is zero, so the term vanishes',{fs:9.5,fill:FAINT});
    yb+=dy;
  }
  var ry=yb-16;
  s+=line(30,ry,492,ry,{stroke:'#dcdce6',w:1.2});
  var comb='det = ';
  for(i2=0;i2<terms.length;i2++)comb+=(i2===0?'':(terms[i2][0]<0?' \u2212 ':' + '))+'T'+sub(i2);
  var yc=ry+30;
  s+=t(30,yc,comb,{fs:12.5,fill:MUTED,weight:600});
  var yr=yc+30;
  s+=t(30,yr,'=',{fs:14,fill:MUTED});
  s+=t(64,yr,pnum(det,2),{fs:pfs(pnum(det,2)),mono:1,fill:ACCENT,weight:650});
  var ym=yr+32;
  s+=t(30,ym,'\u00F7 '+fmt(lead,3),{fs:9.5,fill:FAINT});
  s+=t(98,ym,pnum(mon,4),{fs:pfs(pnum(mon,4)),mono:1,fill:INK,weight:600});
  s+='</svg>';
  return s;
}

/* ---------- row of K times the shape: exactly which numbers multiply ---------- */
function dotWalkSVG(m,o){
  o=o||{};
  var n=m.N, W=540, H=404, i, j;
  var ph=m.phi[0], lam=m.lam[0], m0=m.ms[0];
  var row=[], prod=[], sum=0;
  for(j=0;j<n;j++){row.push(m.K[0][j]/1000);prod.push(row[j]*ph[j]);sum+=prod[j];}
  var rhs=lam*m0*ph[0]/1000;
  var cw=Math.min(146,(W-84)/n), gap=11;
  var x0=(W-(n*cw+(n-1)*gap))/2;
  var yK=80, hK=44, yP=178, hP=40;
  var s=svgOpen(W,H);
  s+=t(28,26,'row 1 of K  \u00D7  shape \u03C6'+sub(0),{fs:10.5,fill:FAINT,weight:700});
  s+=t(28,43,'the roof is scaled to 1.000 m, so every product is a force in kN',{fs:10,fill:FAINT});
  for(j=0;j<n;j++){
    var x=x0+j*(cw+gap), cx=x+cw/2, col=MC[j%MC.length], d=0.16+0.5*j;
    s+=t(cx,yK-9,'K'+sub(0)+'j',{fs:9.5,anchor:'middle',fill:FAINT,weight:600});
    s+='<g class="gl" style="animation-delay:'+d.toFixed(2)+'s">'+rect(x,yK,cw,hK,10,{fill:'#fff',stroke:col,sw:1.7})+'</g>';
    s+=t(cx,yK+hK/2+5.5,fmt(row[j],1),{fs:13.5,anchor:'middle',mono:1,weight:700});
    var my=(yK+hK+yP)/2;
    s+=line(cx,yK+hK+4,cx,yP-4,{stroke:'#dcdce6',w:1.2,dash:'3 4'});
    s+='<g class="pin" style="animation-delay:'+d.toFixed(2)+'s"><circle cx="'+cx+'" cy="'+my+'" r="9" fill="#fff" stroke="'+col+'" stroke-width="1.2"/></g>';
    s+=t(cx,my+3.8,'\u00D7',{fs:10.5,anchor:'middle',fill:col,weight:700});
    s+='<g class="gl" style="animation-delay:'+(d+0.12).toFixed(2)+'s">'+rect(x,yP,cw,hP,10,{fill:'#fff',stroke:col,sw:1.7})+'</g>';
    s+=t(cx,yP+hP/2+5,fmt(ph[j],4),{fs:12.5,anchor:'middle',mono:1,weight:650});
    s+=t(cx,yP+hP+15,'\u03C6'+sub(j),{fs:9.5,anchor:'middle',fill:FAINT,weight:600});
    s+='<g class="pin" style="animation-delay:'+(d+0.26).toFixed(2)+'s">'+t(cx,yP+hP+38,'=',{fs:13,anchor:'middle',fill:MUTED})+'</g>';
    s+='<g class="pin" style="animation-delay:'+(d+0.3).toFixed(2)+'s">'+t(cx,yP+hP+64,(prod[j]<0?'\u2212':'')+fmt(Math.abs(prod[j]),1),{fs:13,anchor:'middle',mono:1,weight:700,fill:col})+'</g>';
  }
  var expr='';
  for(j=0;j<n;j++){var v=prod[j];expr+=(j===0?(v<0?'\u2212':''):(v<0?' \u2212 ':' + '))+fmt(Math.abs(v),1);}
  s+='<g class="pin" style="animation-delay:1.85s">';
  s+=t(28,334,'\u03A3 = '+expr+' = '+fmt(sum,1)+' kN',{fs:12.5,mono:1,weight:600});
  s+=t(28,356,'\u03C9'+sub(0)+'\u00B2 m'+sub(0)+' \u03C6'+sub(0)+' = '+fmt(lam,1)+' \u00D7 '+fmt(m0,0)+' \u00D7 '+fmt(ph[0],4)+' = '+fmt(rhs,1)+' kN',{fs:12,mono:1,fill:ACCENT,weight:600});
  s+='</g>';
  s+='<g class="pin" style="animation-delay:2.3s">'+t(28,384,'both sides agree to within rounding \u2014 the row is satisfied',{fs:10.5,fill:FAINT})+'</g>';
  s+='</svg>';
  return s;
}

/* sine figure */
function sineSVG(m){
  var W=520,H=320,x0=70,x1=470,y0=160,A=70;
  var s=svgOpen(W,H);
  s+=line(x0,y0,x1+10,y0,{stroke:'#d5d5e0',w:1.4});
  var d='',i;
  for(i=0;i<=160;i++){
    var xx=i/160, ang=xx*Math.PI*2*2;
    var px=x0+(x1-x0)*xx, py=y0-A*Math.sin(ang);
    d+=(i?'L':'M')+px.toFixed(1)+' '+py.toFixed(1);
  }
  s+=path(d,{stroke:ACCENT,w:2.6,draw:true});
  s+=line(x0,y0-A,x0,y0+A,{stroke:'#e2e2ec',w:1,dash:'4 4'});
  s+=t(x0,y0-A-10,'\u03C6',{fs:12,fill:ACCENT,weight:700});
  s+=t(x1+4,y0-9,'t',{fs:12,fill:MUTED});
  var bx=x0, be=x0+(x1-x0)/2, by=y0+A+16;
  s+=line(bx,by,be,by,{stroke:MUTED,w:1});
  s+=line(bx,by-5,bx,by+5,{stroke:MUTED,w:1});
  s+=line(be,by-5,be,by+5,{stroke:MUTED,w:1});
  s+=t((bx+be)/2,by+20,'one period  T = 2\u03C0/\u03C9 = '+fmt(m.per[0],3)+' s',{fs:11,anchor:'middle',fill:MUTED});
  s+='</svg>';
  return s;
}
function freqSVG(m){
  var W=520,H=300,i,n=m.N;
  var s=svgOpen(W,H);
  var rowH=(H-70)/n, top=56, x0=104, trackW=250, fmax=m.freq[n-1];
  s+=t(36,34,'frequency',{fs:10,fill:FAINT,weight:700});
  s+=t(36+trackW+70,34,'\u03C9  rad/s',{fs:10,fill:FAINT,weight:700,anchor:'end'});
  for(i=0;i<n;i++){
    var y=top+i*rowH, col=MC[i%MC.length];
    var w=Math.max(7,trackW*m.freq[i]/fmax);
    s+=t(36,y+16,'mode '+(i+1),{fs:11,fill:MUTED,weight:700});
    s+=rect(x0,y+7,trackW,12,6,{fill:'#f2f2f7'});
    s+=rect(x0,y+7,w,12,6,{fill:col,op:.9,anim:'pop',delay:(0.1*i).toFixed(2)});
    s+=t(x0,y+40,'f'+sub(i)+' = '+fmt(m.freq[i],3)+' Hz',{fs:11.5,mono:1,fill:INK,weight:600});
    s+=t(x0+124,y+40,'T'+sub(i)+' = '+fmt(m.per[i],4)+' s',{fs:11,mono:1,fill:MUTED});
    s+=t(508,y+40,'ω '+fmt(m.omega[i],2),{fs:10.5,mono:1,fill:FAINT,anchor:'end'});
  }
  s+='</svg>';
  return s;
}

/* ---------- Newton: three guesses, three roots ---------- */
function newtonSVG(m){
  var W=520,H=360,n=m.N,S2=scaledMat(m);
  var co=detPolyN(S2.Kp,S2.Mp), gs=solveGuesses(m,co);
  var s=svgOpen(W,H),i;
  s+=t(W/2,28,'one equation  \u00B7  '+(n===3?'three':'two')+' starting guesses',{fs:11,fill:MUTED,anchor:'middle',weight:600});
  for(i=0;i<n;i++){
    var y=86+i*86, r=newtonRoot(co,gs[i]), col=MC[i%MC.length];
    var xa=166, xb=352;
    s+=rect(44,y-19,106,38,11,{fill:'#f4f4fa',stroke:LINE});
    s+=t(97,y+4,'X\u2080 = '+fmt(gs[i],0),{fs:11,anchor:'middle',mono:1,weight:600});
    s+=line(xa,y,xb-11,y,{stroke:FAINT,w:1.5,dash:'4 5'});
    s+=path('M'+(xb-15)+' '+(y-4.5)+'L'+xb+' '+y+'L'+(xb-15)+' '+(y+4.5),{stroke:FAINT,w:1.6,cap:1});
    s+=t((xa+xb)/2,y-9,r.it+' steps',{fs:9,fill:FAINT,anchor:'middle'});
    s+=rect(360,y-19,132,38,11,{fill:col,op:.1});
    s+=rect(360,y-19,132,38,11,{stroke:col,sw:1.1,op:.55});
    s+=t(426,y+4,'X = '+fmt(r.x,4),{fs:11,anchor:'middle',mono:1,fill:MCT[i%MCT.length],weight:700});
  }
  s+=t(W/2,H-16,'X = B = \u03C9\u00B2   \u00B7   the solver stops when the answer stops moving',{fs:9.5,fill:FAINT,anchor:'middle'});
  s+='</svg>';
  return s;
}

/* ---------- one chapter per mode ---------- */
function modeChapter(m,r){
  var n=m.N, S2=scaledMat(m), Kp=S2.Kp, Mp=S2.Mp, lam=m.lam[r];
  var A=[],i,j;
  for(i=0;i<n;i++){A.push([]);for(j=0;j<n;j++)A[i].push(Kp[i][j]-(i===j?lam*Mp[i][i]:0));}
  var rows=A.map(function(row){return row.map(function(v){return fmt(v,2);});});
  var steps=[], x=[], kk=m.k.map(function(v){return v*1000;});
  x[n-1]=1;
  for(var f=n-1;f>=1;f--){
    var below=kk[f], above=(f<n-1)?kk[f+1]:0;
    var val=((below+above-lam*m.M[f][f])*x[f]-above*(f+1<n?x[f+1]:0))/below;
    x[f-1]=val;
    steps.push({f:f,val:val,below:below,above:above});
  }
  var resid=(kk[0]+(n>1?kk[1]:0)-lam*m.M[0][0])*x[0]-(n>1?kk[1]*x[1]:0);
  var mno=("0"+(7+r)).slice(-2);
  var Br=I('B')+SUB(r+1);
  function phq(s){return I('\u03C6')+SUB(s);}
  function kq(s){return I('k')+SUB(s);}
  function mq(s){return I('m')+SUB(s);}
  function blk(R){                      /* ( k_R + k_R+1 - B m_R ) */
    var s='('+kq(R);
    if(R<n)s+=OP('+')+kq(R+1);
    return s+OP('\u2212')+Br+mq(R)+')';
  }
  function nw(h){                       /* keep a term glued to its "= 0" when the row wraps */
    return '<span style="white-space:nowrap;display:inline-flex;align-items:center;gap:.14em">'+h+'</span>';
  }
  var tags=[],phTags=[];
  for(i=0;i<n;i++){tags.push(m.phi[r][i]);}

  /* --- frame 2: every row of the matrix, typed as it stands = 0 --- */
  var COL=[ACCENT,MINT,AMBER,MC[3]];
  function phc(j){return '<span style="color:'+COL[j%4]+'">'+I('\u03C6')+SUB(j+1)+'</span>';}
  function cw(j,s){return '<span style="color:'+COL[j%4]+'">'+s+'</span>';}
  var sym=[],Rn;
  for(Rn=n;Rn>=1;Rn--)(function(R){
    var b=0.28+(n-R)*0.85;
    sym.push(function(){
      var h=TAG('row '+R),hint;
      if(R>1)h+=OP('\u2212')+kq(R)+phc(R-2);
      h+=(R>1?OP('+'):'')+blk(R)+phc(R-1);
      if(R<n)h+=OP('\u2212')+kq(R+1)+phc(R);
      h+=nw(OP('=')+PI('0',b+0.34,'res'));
      hint=(R>1)?('the only unknown in this row is '+phc(R-2)):'the row that never gets used';
      return h+'<span class="hint-inline">'+hint+'</span>';
    });
  })(Rn);

  /* --- frame 3: the same rows with the numbers in, then SHIFT + SOLVE --- */
  var nums=[],Rk;
  for(Rk=n;Rk>=2;Rk--)(function(R){
    var f=R-1,u=f-1,b=0.30+(n-R)*1.32;
    nums.push(function(){
      var h=TAG('row '+R),j,v,sg;
      sg=A[f][u]<0?OP('\u2212'):'';
      h+=sg+cw(u,fmt(Math.abs(A[f][u]),2))+OP('\u00D7')+cw(u,'X');
      for(j=f;j<n;j++){
        if(Math.abs(A[f][j])<1e-9)continue;
        v=(j===n-1)?1:x[j];
        sg=A[f][j]<0?OP('\u2212'):OP('+');
        h+=sg+cw(j,fmt(Math.abs(A[f][j]),2))+OP('\u00D7')+cw(j,v<0?'('+fmt(v,6)+')':fmt(v,(j===n-1?4:6)));
      }
      h+=nw(OP('=')+PI('0',b+0.34,'res'));
      return h+'<span class="hint-inline">X is '+phc(u)+' \u2014 everything else is a number</span>';
    });
    nums.push(function(){
      return TAG('solve')+'X'+OP('=')+PI(fmt(x[u],4),b+0.52,'flow res')+
        '<span class="hint-inline">so '+phc(u)+' = '+fmt(x[u],4)+'</span>';
    });
  })(Rk);
  nums.push(function(){
    var h=TAG('check'),j2,v,sg,sum=0,first=1,b=0.36;
    for(j2=0;j2<n;j2++){
      if(Math.abs(A[0][j2])<1e-9)continue;
      v=(j2===n-1)?1:parseFloat(x[j2].toFixed(6));
      sum+=A[0][j2]*v;
      sg=A[0][j2]<0?OP('\u2212'):(first?'':OP('+'));
      h+=sg+cw(j2,fmt(Math.abs(A[0][j2]),2))+OP('\u00D7')+cw(j2,v<0?'('+fmt(v,6)+')':fmt(v,(j2===n-1?4:6)));
      first=0;
    }
    h+=nw(OP('=')+PI(sci(sum,1),b+0.30,'res'));
    return h+'<span class="hint-inline">\u2248 0 \u2014 what is left is the rounding in the \u03C6 values above</span>';
  });
  nums.push(function(){
    return TAG('shape')+phq(r+1)+nw(OP('=')+PI('[ '+m.phi[r].map(function(v){return fmt(v,4);}).join(',   ')+' ]',1.15,'res'));
  });

  var heads1=[];
  for(i=0;i<n;i++)heads1.push('\u03C6'+SUB(i+1));
  return {id:"mode"+r,name:"Mode "+(r+1),step:4,frames:[
    {k:mno+" \u00B7 mode "+(r+1),t:"Substitute B"+sub(r)+" = "+fmt(lam,2)+" into the matrix",
     b:"Put the root back in [K\u2032 \u2212 B M\u2032]. The matrix is now singular, which is the whole point: one row is redundant, so we are free to set the roof to 1.0000.",
     fx:EQ([
       function(){var b=0;return GL('K\u2032',b)+OP('\u2212')+GL('B'+SUB(r+1),b+0.12)+GL('M\u2032',b+0.26)+OP('=')+PI('singular',b+0.4,'res')+'<span class="hint-inline">B'+SUB(r+1)+' = '+fmt(lam,2)+',  \u03C9'+SUB(r+1)+' = '+fmt(m.omega[r],3)+' rad/s</span>';},
       function(){var b=0.8;return TAG('why')+'a nonzero \u03C6 can survive only if the determinant '+GL('vanishes',b);}
     ]),
     n:"Every mode is scaled with the roof at 1.000 \u2014 the conventional choice. Each column keeps its colour in the rows below, so one \u03C6 can be followed through all the arithmetic.",
     svg:matBlockSVG(rows,{stagger:0.05,heads:heads1,headCols:COL})},
    {k:mno+" \u00B7 mode "+(r+1),t:"Read every row as it stands \u2014 one unknown each",
     b:"Read a row of [K\u2032 \u2212 B M\u2032]\u03C6 = 0 straight off the matrix above. With the roof at 1.0000 and the rows taken from the top down, each row holds exactly one unknown \u2014 the floor below it. Nothing is moved across and nothing is divided: the row goes down as the matrix reads it, and it ends in = 0.",
     fx:EQ(sym),
     n:"Top row first. The bottom row is never used to solve anything \u2014 that is the row that checks the answer.",
     svg:modeSVG(m,r,{amp:78,tags:tags})},
    {k:mno+" \u00B7 mode "+(r+1),t:"Type the row in, press SHIFT + SOLVE",
     b:"A calculator solves an equation exactly as it stands: type the row with X where the unknown sits, finish it with = 0, and ask it for X. The solver searches for the value that makes the row vanish, so no division and no rearranging is done by hand. Then repeat on the row above, using the answer you just got.",
     fx:EQ(nums),
     n:"The unused row is the check: it must come out \u2248 0. If it does not, one of the numbers went in wrong.",
     svg:modeSVG(m,r,{amp:78,tags:tags})}
  ]};
}
