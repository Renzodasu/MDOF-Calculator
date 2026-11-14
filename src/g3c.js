
/* ================= 1. chapters + renderer ================= */
function maxAbs(v){var m=0,i;for(i=0;i<v.length;i++)m=Math.max(m,Math.abs(v[i]));return m||1;}
function gindex(ch,fr){var t=0,i;for(i=0;i<ch;i++)t+=CHAPTERS[i].frames.length;return t+fr;}
function gtotal(){var t=0,i;for(i=0;i<CHAPTERS.length;i++)t+=CHAPTERS[i].frames.length;return t;}

function renderChapters(){
  var h='',i;
  for(i=0;i<CHAPTERS.length;i++){
    h+='<button role="tab" data-ch="'+i+'" aria-selected="'+(i===FI.ch)+'" class="'+(i===FI.ch?'on':'')+'"><b>'+('0'+(i+1)).slice(-2)+'</b><span>'+escapeHTML(CHAPTERS[i].name)+'</span></button>';
  }
  $('#chapters').innerHTML=h;
  $$('#chapters button').forEach(function(b){
    b.addEventListener('click',function(){setPlay(false);show(+b.getAttribute('data-ch'),0);});
  });
  /* the five steps of the notes: each jumps to the first chapter it covers */
  var sh='';
  STEPS.forEach(function(st,ix){
    var first=-1;for(i=0;i<CHAPTERS.length;i++)if(CHAPTERS[i].step===ix){first=i;break;}
    if(first<0)return;
    sh+='<li data-step="'+ix+'"><button data-ch="'+first+'" aria-label="'+escapeHTML(st.n+': '+st.t)+'"><span class="sn">'+(ix===0?'k':ix)+'</span><span class="st"><b>'+escapeHTML(st.n)+'</b><span>'+escapeHTML(st.t)+'</span></span></button></li>';
  });
  $('#steps').innerHTML=sh;
  $$('#steps button').forEach(function(b){
    b.addEventListener('click',function(){setPlay(false);show(+b.getAttribute('data-ch'),0);});
  });
  var tot=gtotal();
  $('#frame-count').textContent='frame '+((gindex(FI.ch,FI.fr))+1)+' / '+tot;
  $('#prog').style.width=(((gindex(FI.ch,FI.fr))+1)/tot*100).toFixed(2)+'%';
  var W=['zero','one','two','three','four','five','six','seven','eight','nine','ten','eleven','twelve','thirteen','fourteen'];
  var cc=$('#chap-count'); if(cc)cc.textContent=W[CHAPTERS.length]||CHAPTERS.length;
  requestAnimationFrame(movePill);
  requestAnimationFrame(syncSegs);
}
function syncSteps(ch){
  var cur=CHAPTERS[ch].step;
  $$('#steps li').forEach(function(li){
    var k=+li.getAttribute('data-step');
    li.classList.toggle('on',k===cur);li.classList.toggle('done',k<cur);
    var b=li.querySelector('button');if(b){if(k===cur)b.setAttribute('aria-current','step');else b.removeAttribute('aria-current');}
  });
  /* on a phone the strip scrolls: keep the current step in view */
  var ol=$('#steps'),on=ol&&ol.querySelector('li.on');
  if(on&&ol.scrollWidth>ol.clientWidth){
    if(on.offsetLeft<ol.scrollLeft+8||on.offsetLeft+on.offsetWidth>ol.scrollLeft+ol.clientWidth-8)ol.scrollLeft=on.offsetLeft-14;
  }
}

/* sliding indicator behind the active tab — measured, not hard-coded */
function movePill(){
  var wrap=$('#chapters'); if(!wrap)return;
  var pill=wrap.querySelector('.pill');
  if(!pill){pill=document.createElement('span');pill.className='pill';wrap.insertBefore(pill,wrap.firstChild);}
  var on=wrap.querySelector('button.on');
  if(!on){pill.style.opacity=0;return;}
  pill.style.left=on.offsetLeft+'px';
  pill.style.top=on.offsetTop+'px';
  pill.style.width=on.offsetWidth+'px';
  pill.style.height=on.offsetHeight+'px';
  pill.style.opacity=1;
  var sl=wrap.scrollLeft,sr=sl+wrap.clientWidth;
  if(on.offsetLeft<sl+10)wrap.scrollLeft=on.offsetLeft-10;
  else if(on.offsetLeft+on.offsetWidth>sr-10)wrap.scrollLeft=on.offsetLeft+on.offsetWidth-wrap.clientWidth+10;
}

/* same idea for the small segmented controls */
function syncSeg(el){
  if(!el)return;
  var thumb=el.querySelector('.thumb');
  if(!thumb){thumb=document.createElement('span');thumb.className='thumb';el.insertBefore(thumb,el.firstChild);}
  var on=el.querySelector('button.on');
  if(!on){thumb.style.opacity=0;return;}
  thumb.style.left=on.offsetLeft+'px';
  thumb.style.width=on.offsetWidth+'px';
  thumb.style.opacity=1;
}
function syncSegs(){$$('.seg').forEach(syncSeg);}

/* sonner-style toast */
function toast(msg,ok){
  var w=$('#toasts');
  if(!w){w=document.createElement('div');w.id='toasts';w.className='toast-wrap';document.body.appendChild(w);}
  var t=document.createElement('div');t.className='toast'+(ok===false?' bad':'');
  t.innerHTML='<span class="tic">'+(ok===false?'!':'\u2713')+'</span><span></span>';
  t.lastChild.textContent=msg;
  w.appendChild(t);
  while(w.children.length>3)w.removeChild(w.firstChild);
  requestAnimationFrame(function(){t.classList.add('in');});
  setTimeout(function(){t.classList.remove('in');setTimeout(function(){if(t.parentNode)t.parentNode.removeChild(t);},300);},2500);
}

/* hero numbers tick to their new value instead of snapping */
function countTo(el,txt){
  if(!el)return;
  if(el.getAttribute('data-v')===txt)return;
  var from=parseFloat(String(el.textContent||'').replace(/,/g,''));
  el.setAttribute('data-v',txt);
  var target=parseFloat(String(txt).replace(/,/g,''));
  if(!isFinite(target)||!isFinite(from)||window.matchMedia('(prefers-reduced-motion: reduce)').matches){el.textContent=txt;return;}
  var dec=(String(txt).split('.')[1]||'').replace(/[^0-9]/g,'').length;
  var commas=String(txt).indexOf(',')>=0;
  var t0=performance.now(),dur=640;
  (function frame(now){
    var p=Math.min(1,(now-t0)/dur),e=1-Math.pow(1-p,3);
    var s=(from+(target-from)*e).toFixed(dec);
    if(commas)s=s.replace(/\B(?=(\d{3})+(?!\d))/g,',');
    el.textContent=s;
    if(p<1)requestAnimationFrame(frame);else el.textContent=txt;
  })(t0);
}

/* plain-text copy of the solved model, laid out like the answer sheet */
function reportText(){
  var m=model,n=m.N,i,L=[];
  L.push('MDOF Calculator \u2014 free vibration of a '+n+'-storey frame ('+modelTag(m)+')');
  L.push('');
  L.push('(1) Stiffness');
  if(m.p.geom){
    L.push('  E = '+fmt(m.Ec,1)+' MPa, I = '+sci(m.I,4)+' m4, EI = '+fmt(m.EI,1)+' kN.m2 per column');
    for(i=0;i<n;i++)L.push('  storey '+(i+1)+' (h = '+fmt(m.hs[i],2)+' m): k column = 12EI/h3 = '+fmt(m.kc[i],1)+' kN/m, k storey = '+m.cols+' x '+fmt(m.kc[i],1)+' = '+fmt(m.kf[i],1)+' kN/m');
  } else for(i=0;i<n;i++)L.push('  storey '+(i+1)+': k = '+fmt(m.k[i],1)+' kN/m (given)');
  L.push('(2) Natural frequencies and periods');
  for(i=0;i<n;i++)L.push('  mode '+(i+1)+': w = '+fmt(m.omega[i],4)+' rad/s, f = '+fmt(m.freq[i],4)+' Hz, T = '+fmt(m.per[i],5)+' s');
  L.push('(3) Mode-shape factors (floor 1, floor 2, ..., roof = 1.0000)');
  for(i=0;i<n;i++)L.push('  mode '+(i+1)+': '+m.phi[i].map(function(v){return fmt(v,4);}).join(', '));
  return L.join('\n');
}

function show(ch,fr){
  ch=Math.max(0,Math.min(ch,CHAPTERS.length-1));
  fr=Math.max(0,Math.min(fr,CHAPTERS[ch].frames.length-1));
  stopLive();
  FI.ch=ch;FI.fr=fr;
  var f=CHAPTERS[ch].frames[fr];
  $('#stage-k').textContent=f.k;
  var st=STEPS[CHAPTERS[ch].step||0];
  $('#n-step').textContent=st.n;
  $('#n-kicker').textContent=CHAPTERS[ch].name+' \u00B7 frame '+(fr+1)+' of '+CHAPTERS[ch].frames.length;
  $('#n-title').textContent=f.t;
  var body=$('#n-body');
  body.innerHTML=f.b;
  body.classList.remove('fade');void body.offsetWidth;body.classList.add('fade');
  var fEl=$('#n-formula');
  if(f.fx){fEl.className='formula math';fEl.innerHTML=f.fx;fEl.hidden=false;}
  else if(f.f){fEl.className='formula';fEl.innerHTML=f.f.split('\n').map(function(s){return '<div>'+s+'</div>';}).join('');fEl.hidden=false;}
  else{fEl.hidden=true;fEl.innerHTML='';}
  var nEl=$('#n-note');
  if(f.n){$('#n-note-t').innerHTML=f.n;nEl.hidden=false;}else{$('#n-note-t').innerHTML='';nEl.hidden=true;}
  if(f.live){startLive(f);}else{$('#stage-svg').innerHTML=f.svg;}
  $('#stage-live').hidden=!f.live;
  v3Apply();
  var ts=$('#tspeed');
  ts.hidden=f.live!=='mode';
  if(!ts.hidden){
    ts.textContent=STrue?'True speed':'Slow \u00D7'+slowK(f.mode||0);
    ts.setAttribute('aria-pressed',STrue?'true':'false');
    ts.classList.toggle('on',STrue);
  }
  document.body.classList.toggle('truespeed',STrue);
  $$('#chapters button').forEach(function(b,ix){b.classList.toggle('on',ix===ch);b.setAttribute('aria-selected',ix===ch?'true':'false');});
  syncSteps(ch);
  movePill();
  var tot=gtotal();
  $('#frame-count').textContent='frame '+(gindex(ch,fr)+1)+' / '+tot;
  $('#prog').style.width=((gindex(ch,fr)+1)/tot*100).toFixed(2)+'%';
}

/* ---- playback ---- */
function holdMs(){var f=CHAPTERS[FI.ch].frames[FI.fr];return (f.hold||5200)/FI.speed;}
function setPlay(on){
  FI.playing=on;
  if(FI.timer){clearTimeout(FI.timer);FI.timer=null;}
  $('#play-ic').innerHTML=icon(on?'pause':'play');
  $('#play-tx').textContent=on?'Pause':'Play';
  $('#play').setAttribute('aria-label',on?'Pause':'Play');
  if(on)FI.timer=setTimeout(step,holdMs());
}
function step(){
  if(!FI.playing)return;
  var ch=CHAPTERS[FI.ch];
  if(FI.fr<ch.frames.length-1)show(FI.ch,FI.fr+1);
  else if(FI.ch<CHAPTERS.length-1)show(FI.ch+1,0);
  else{setPlay(false);return;}
  if(FI.playing)FI.timer=setTimeout(step,holdMs());
}

/* ================= 2. live animation ================= */
var LIVE=null,STrue=false;
function modeDur(r){var d=2600/(model.freq[r]/model.freq[0]);return Math.max(520,Math.min(3000,d));}
function slowK(r){return Math.max(1,Math.round(modeDur(r)/1000/model.per[r]));}

function liveSVG(disp,o){
  o=o||{};
  var n=model.N,W=520,H=o.strip?440:336,baseY=o.strip?300:H-42,topY=52;
  var stepY=(baseY-topY)/(n+0.25);
  var xl=200,xr=300;
  var s=svgOpen(W,H);
  s+='<defs><pattern id="lh" width="8" height="8" patternTransform="rotate(45)" patternUnits="userSpaceOnUse"><line x1="0" y1="0" x2="0" y2="8" stroke="#c9c9d4" stroke-width="1.4"/></pattern></defs>';
  s+=rect(84,baseY,352,11,0,{fill:'url(#lh)',op:.85});
  s+=line(80,baseY,440,baseY,{w:2});
  s+=line(250,baseY-6,250,topY-14,{stroke:'#dedee8',w:1,dash:'4 6'});
  if(o.cap)s+=t(30,26,o.cap,{fs:10.5,fill:MUTED,weight:600});
  if(o.warn)s+=t(30,42,o.warn,{fs:9.4,fill:AMBER,weight:700});
  if(o.roof!=null)s+=t(508,26,'roof '+fmt(o.roof,1)+' mm',{fs:10.5,fill:ACCENT,anchor:'end',weight:700});
  var i;
  for(i=0;i<n;i++){
    var y1=baseY-i*stepY,y2=baseY-(i+1)*stepY;
    var b1=(i===0?0:disp[i-1]),b2=disp[i];
    s+=line(xl+b1,y1,xl+b2,y2,{w:5,stroke:'#c7c7d4',cap:1});
    s+=line(xr+b1,y1,xr+b2,y2,{w:5,stroke:'#c7c7d4',cap:1});
  }
  for(i=0;i<=n;i++){
    var dy=baseY-i*stepY, dx=(i===0?0:disp[i-1]), roof=(i===n);
    s+=rect(xl+dx-16,dy-5,xr-xl+32,10,5,{fill:roof?INK:'#fff',stroke:INK,sw:roof?0:1.5});
    if(i>0)s+=t(xr+30+(dx>0?dx:0),dy+4,roof?'roof':'floor '+i,{fs:10,fill:FAINT});
    if(i>0){
      s+=t(xl-22+dx,dy-9,'m'+sub(i-1)+' \u00B7 '+fmt(model.ms[i-1],0)+' kg',{fs:9,fill:MC[(i-1)%MC.length],anchor:'end',weight:600});
    }
  }
  if(o.mm){
    /* the displacement drawn beside the frame: bars off a zero line, value at the end */
    var gx=430, gm=30, pk=o.mmPeak||1;
    s+=t(470,topY+9,'mm',{fs:8.6,fill:FAINT,weight:700});
    s+=line(gx,topY-8,gx,baseY,{stroke:'#e2e2ec',w:1,dash:'3 5'});
    for(i=0;i<n;i++){
      var yg=baseY-(i+1)*stepY, vv=o.mm[i]||0;
      var dp=Math.max(-gm,Math.min(gm,vv/pk*gm)), cg=MC[i%MC.length];
      s+=line(gx,yg,gx+dp,yg,{w:3,stroke:cg,cap:1,op:.85});
      s+=dot(gx+dp,yg,3,cg);
      s+=t(470,yg+3.2,Math.abs(vv)<0.05?'0.0':fmt(vv,1),{fs:8.6,mono:1,fill:INK,weight:600});
    }
  }
  if(o.strip){
    var st=o.strip, sx0=92,sx1=430, sy=398, amp=24;
    s+=rect(70,344,392,84,10,{fill:'#fff',stroke:'#ececf2'});
    s+=t(80,360,'roof displacement  x' + sub(n-1) + '(t)',{fs:9.5,fill:FAINT,weight:600});
    s+=line(sx0,sy,sx1,sy,{stroke:'#e4e4ee',w:1});
    var d='';
    for(i=0;i<st.hist.length;i++){
      var px=sx0+(sx1-sx0)*st.hist[i].t/st.tMax;
      var py=sy-amp*st.hist[i].x/st.peak;
      d+=(i?'L':'M')+px.toFixed(1)+' '+py.toFixed(1);
    }
    s+=path(d,{stroke:MC[0],w:1.8,op:.85});
    var mxp=sx0+(sx1-sx0)*st.tNow/st.tMax;
    var myp=sy-amp*(st.nowX/st.peak);
    s+=line(mxp,346,mxp,sy+6,{stroke:ACCENT,w:1,dash:'3 4',op:.45});
    s+=dot(mxp,myp,4.2,ACCENT);
    s+=t(sx0,sy+18,'0 s',{fs:9,fill:FAINT});
    s+=t(sx1,sy+18,fmt(st.tMax,2)+' s',{fs:9,fill:FAINT,anchor:'end'});
    s+=t(sx1,sy-amp-6,'peak \u00B1'+fmt(st.peak*1000,1)+' mm',{fs:9,fill:FAINT,anchor:'end'});
  }
  s+='</svg>';
  return s;
}

function startLive(f){
  var n=model.N,i;
  var ic=initials();
  LIVE={kind:f.live,r:f.mode||0,t0:(performance.now?performance.now():Date.now()),raf:null,hist:null};
  if(f.live==='total'){
    var Tw=3.2*model.per[0], NS=260, hist=[], peak=0;
    for(i=0;i<=NS;i++){
      var tt=Tw*i/NS, xr=responseAt(model,ic.x0,ic.v0,ic.zeta,tt);
      var v=xr[n-1];
      hist.push({t:tt,x:v});
      peak=Math.max(peak,Math.abs(v));
    }
    LIVE.hist={hist:hist,peak:peak||1,tMax:Tw,dur:7600};
  } else {
    LIVE.dur=STrue?model.per[f.mode]*1000:modeDur(f.mode);
  }
  var rm=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(rm){LIVE.rm=1;drawLive(LIVE.kind==='total'?LIVE.hist.dur*0.55:LIVE.dur*0.25);return;}
  drawLive(0);
  LIVE.raf=requestAnimationFrame(liveTick);
}
function stopLive(){
  if(LIVE&&LIVE.raf)cancelAnimationFrame(LIVE.raf);
  LIVE=null;
}
function liveTick(ts){
  if(!LIVE||LIVE.rm)return;
  var el=ts-LIVE.t0;
  drawLive(el);
  LIVE.raf=requestAnimationFrame(liveTick);
}
function drawLive(el){
  if(!LIVE)return;
  var n=model.N,i,disp=[];
  if(LIVE.kind==='mode'){
    var r=LIVE.r, ph=model.phi[r], mx=maxAbs(ph);
    var w=2*Math.PI/LIVE.dur;          /* rad per ms */
    var sn=Math.sin(w*el);
    var mm=[];
    for(i=0;i<n;i++){disp.push(ph[i]/mx*46*sn);mm.push(ph[i]/mx*S.amp*sn);}
    var slow=Math.round(LIVE.dur/1000/model.per[r]);
    var cap=LIVE.rm?('mode '+(r+1)+' \u00B7 T = '+fmt(model.per[r],3)+' s \u00B7 held still')
                   :STrue?('mode '+(r+1)+' \u00B7 T = '+fmt(model.per[r],3)+' s \u00B7 true speed')
                   :('mode '+(r+1)+' \u00B7 T = '+fmt(model.per[r],3)+' s \u00B7 slow motion \u00D7'+slowK(r));
    var warn=(!LIVE.rm&&STrue&&model.freq[r]>=15)?(fmt(model.freq[r],1)+' Hz \u2014 a blur at true speed; the shape is what matters'):'';
    $('#stage-svg').innerHTML=liveSVG(disp,{cap:cap,warn:warn,mm:mm,mmPeak:S.amp});
  } else {
    var st=LIVE.hist;
    var tn=(el%st.dur)/st.dur;
    var tNow=tn*st.tMax;
    var ic=initials();
    var xr=responseAt(model,ic.x0,ic.v0,ic.zeta,tNow);
    var mm=[];
    for(i=0;i<n;i++){disp.push(xr[i]/st.peak*46);mm.push(xr[i]*1000);}
    $('#stage-svg').innerHTML=liveSVG(disp,{cap:'all modes superimposed \u00B7 t = '+fmt(tNow,3)+' s',roof:xr[n-1]*1000,mm:mm,mmPeak:st.peak*1000,strip:{hist:st.hist,tMax:st.tMax,peak:st.peak,tNow:tNow,nowX:xr[n-1]}});
  }
  LIVE.disp=disp.map(function(v){return v/46;});
}

/* ================= 3. hero ================= */
function renderPresets(sel){
  var cur=presetOf(S), h='', k;
  for(k in PRESETS)h+='<button type="button" class="pchip" data-preset="'+k+'" aria-pressed="'+(cur===k)+'"><span class="pl"><i class="pd"></i>'+escapeHTML(PRESETS[k].label)+'</span><span class="ps">'+escapeHTML(PRESETS[k].sub)+'</span></button>';
  h+='<a class="pchip custom" href="#build" aria-pressed="'+(cur===null)+'"><span class="pl"><i class="pd"></i>'+(cur===null?'Your own problem':'Your own')+'</span><span class="ps">'+(cur===null?escapeHTML(modelTag(model)):'edit any number')+'</span></a>';
  $$(sel).forEach(function(el){
    el.innerHTML=h;
    $$('button[data-preset]',el).forEach(function(b){
      b.addEventListener('click',function(){
        var k2=b.getAttribute('data-preset');
        S=freshState(k2);recompute();
        toast('Loaded '+PRESETS[k2].label+' \u2014 '+PRESETS[k2].sub);
      });
    });
  });
}
function renderHero(){
  var m=model,n=m.N;
  var W=['zero','one','two','three'];
  $('#hero-n').textContent=W[n]||n;
  $('#top-chip').innerHTML='<i></i><span>'+escapeHTML(modelTag(m))+'</span>';
  countTo($('#h-f1'),fmt(m.freq[0],3));
  countTo($('#h-t1'),fmt(m.per[0],4));
  countTo($('#h-k1'),fmt(m.k[0],0));
  $('#h-k1u').textContent=m.p.geom?'kN/m \u00B7 '+m.cols+' \u00D7 12EI/h\u2081\u00B3':'kN/m \u00B7 given';
  $('#h-w1').textContent=fmt(m.omega[0],2);
  $('#h-roof').textContent=fmt(m.phi[0][n-1]/m.phi[0][0],2);
  $('#hero-svg').innerHTML=buildingSVG(m,{modeShape:m.phi[0],modeScale:56,modeColor:MC[0],masses:true,topY:70});
  $('#tour-live-chip').textContent=n+' storeys \u00B7 '+modelTag(m);
  renderPresets('#hero-presets,#build-presets');
}

/* ================= 4. answers ================= */
function renderAnswers(){
  var m=model,n=m.N,i,r;
  var tag=$('#ans-tag');if(tag)tag.textContent=n+' storeys \u00B7 '+n+' modes \u00B7 '+modelTag(m);
  /* (1) stiffness */
  var kh='';
  if(m.p.geom){
    $('#ans-k-hint').textContent='Each column is fixed at both ends: k = 12EI/h\u00B3; a storey is '+m.cols+' columns side by side.';
    kh+='<div class="res-big"><div><div class="k">One column, storey 1</div><div class="v">'+fmt(m.kc[0],1)+'</div><div class="u">kN/m \u00B7 12EI/h\u2081\u00B3</div></div>'+
        '<div><div class="k">Storey 1 ('+m.cols+' cols)</div><div class="v">'+fmt(m.kf[0],1)+'</div><div class="u">kN/m \u00B7 equivalent stiffness</div></div></div>';
    kh+='<table class="t"><thead><tr><th>Storey</th><th>h (m)</th><th>k column</th><th>k storey</th></tr></thead><tbody>';
    for(i=0;i<n;i++)kh+='<tr><td>'+(i+1)+'</td><td>'+fmt(m.hs[i],2)+'</td><td>'+fmt(m.kc[i],1)+'</td><td><b>'+fmt(m.kf[i],1)+'</b></td></tr>';
    kh+='</tbody></table><div class="kv" style="margin-top:6px"><span class="k">E \u00B7 I \u00B7 EI</span><span class="v">'+fmt(m.Ec,0)+' MPa \u00B7 '+sci(m.I,4)+' m\u2074 \u00B7 '+fmt(m.EI,0)+' kN\u00B7m\u00B2</span></div>';
    kh+='<div class="kv"><span class="k">Units</span><span class="v">kN/m</span></div>';
  } else {
    $('#ans-k-hint').textContent='Storey stiffness typed directly in the builder.';
    kh+='<table class="t"><thead><tr><th>Storey</th><th>k storey (kN/m)</th></tr></thead><tbody>';
    for(i=0;i<n;i++)kh+='<tr><td>'+(i+1)+'</td><td><b>'+fmt(m.k[i],1)+'</b></td></tr>';
    kh+='</tbody></table>';
  }
  $('#ans-k').innerHTML=kh;

  /* (2) frequencies */
  var fh='<div class="tbl-wrap"><table class="t"><thead><tr><th>Mode</th><th>B = \u03C9\u00B2</th><th>\u03C9 (rad/s)</th><th>f (Hz)</th><th>T (s)</th></tr></thead><tbody>';
  for(i=0;i<n;i++){
    fh+='<tr><td><span class="dot" style="background:'+MC[i%MC.length]+'"></span>'+(i+1)+'</td><td>'+fmt(m.lam[i],2)+'</td><td>'+fmt(m.omega[i],3)+'</td><td><b>'+fmt(m.freq[i],3)+'</b></td><td><b>'+fmt(m.per[i],4)+'</b></td></tr>';
  }
  fh+='</tbody></table></div>';
  fh+='<div class="kv" style="margin-top:6px"><span class="k">Fundamental period T\u2081</span><span class="v">'+fmt(m.per[0],4)+' s</span></div>';
  fh+='<div class="kv"><span class="k">Frequency ratio f\u2082/f\u2081</span><span class="v">'+(n>1?fmt(m.freq[1]/m.freq[0],2):'\u2014')+'</span></div>';
  $('#ans-f').innerHTML=fh;

  /* (3) mode-shape factors: one column per mode, roof on top as on the sketch */
  var mh='<div class="tbl-wrap"><table class="t modes"><thead><tr><th>Floor</th>';
  for(r=0;r<n;r++)mh+='<th class="mh"><span class="dot" style="background:'+MC[r%MC.length]+'"></span>Mode '+(r+1)+'</th>';
  mh+='</tr></thead><tbody>';
  for(i=n-1;i>=0;i--){
    mh+='<tr'+(i===n-1?' class="roof"':'')+'><td>'+(i===n-1?'Roof (floor '+n+')':'Floor '+(i+1))+'</td>';
    for(r=0;r<n;r++)mh+='<td>'+fmt(m.phi[r][i],4)+'</td>';
    mh+='</tr>';
  }
  mh+='</tbody></table></div><div class="kv" style="margin-top:6px"><span class="k">Nodes (sign changes)</span><span class="v">'+m.phi.map(function(v,r2){return 'mode '+(r2+1)+': '+r2;}).join(' \u00B7 ')+'</span></div>';
  $('#ans-modes').innerHTML=mh;

  /* (4) sketch */
  $('#ans-sketch').innerHTML=sketchSVG(m,{h:340,still:true});

  var KA=[],MA=[],j;
  for(i=0;i<n;i++){
    KA.push([]);MA.push([]);
    for(j=0;j<n;j++){KA[i].push(fmt(m.K[i][j]/1000,1));MA[i].push(i===j?fmt(m.M[i][i],0):'0');}
  }
  var Kt=matText(KA),Mt=matText(MA);
  $('#ans-mat').innerHTML='<div class="hint">K, kN/m</div><pre class="mat">'+Kt+'</pre><div class="hint" style="margin-top:8px">M, kg</div><pre class="mat">'+Mt+'</pre>';

  /* checks */
  var ch='',ok;
  var res=0;
  for(r=0;r<n;r++){
    var Kv=[],ph=m.phi[r];
    for(i=0;i<n;i++){
      var sum=0;
      for(j=0;j<n;j++)sum+=(m.K[i][j]-m.lam[r]*(i===j?m.M[i][i]:0))*ph[j];
      sum=sum/Math.max(Math.abs(m.K[i][i]),1);
      res=Math.max(res,Math.abs(sum));
    }
  }
  ok=res<1e-9;
  ch+=checkRow('Eigen equation residual  max |(K\u2212\u03BBM)\u03C6| / k', sci(res,2), ok);

  var tr=0;for(i=0;i<n;i++)tr+=m.K[i][i]/m.M[i][i];
  var sl=m.lam.reduce(function(a,b){return a+b;},0);
  ok=Math.abs(tr-sl)/Math.max(Math.abs(tr),1)<1e-9;
  ch+=checkRow('\u03A3\u03BB = trace(M\u207B\u00B9K)', fmt(sl,2)+' vs '+fmt(tr,2), ok);

  var orth=0;
  for(r=0;r<n;r++)for(var q=r+1;q<n;q++){
    var s2=0;
    for(i=0;i<n;i++)s2+=m.M[i][i]*m.phi[r][i]*m.phi[q][i];
    orth=Math.max(orth,Math.abs(s2)/Math.sqrt(m.mu[r]*m.mu[q]));
  }
  ok=orth<1e-9;
  ch+=checkRow('M-orthogonality  max |\u03C6\u1D63\u1D40 M \u03C6\u209B|', sci(orth,2), ok);

  var comp=0;
  for(i=0;i<n;i++)for(j=0;j<n;j++){
    var s3=0;
    for(r=0;r<n;r++)s3+=m.phihat[r][i]*m.phihat[r][j];
    comp=Math.max(comp,Math.abs(s3*m.M[j][j]-(i===j?1:0)));
  }
  ok=comp<1e-9;
  ch+=checkRow('Completeness  ||\u03A6\u03A6\u1D40M \u2212 I||', sci(comp,2), ok);

  /* three checks a student can repeat by hand */
  var Kp=[],Mp=[];
  for(i=0;i<n;i++){Kp.push([]);Mp.push([]);for(j=0;j<n;j++){Kp[i].push(m.K[i][j]/m.M[0][0]);Mp[i].push(m.M[i][j]/m.M[0][0]);}}
  var detK=detN(Kp),detM=detN(Mp),prod=1;
  for(r=0;r<n;r++)prod*=m.lam[r];
  ok=Math.abs(prod-detK/detM)/Math.max(Math.abs(prod),1)<1e-9;
  ch+=checkRow('Product of the roots  \u220F\u03BB = det K\u2032 / det M\u2032', sci(prod,4)+' = '+sci(detK/detM,4), ok);

  var Fv=[],db,ss,RA,num=0,den=0,dmx=0;
  for(i=0;i<n;i++)Fv.push(m.M[i][i]*9.81);
  db=solveLin(m.K,Fv);
  for(i=0;i<n;i++)dmx=Math.max(dmx,Math.abs(db[i]));
  for(i=0;i<n;i++)db[i]/=dmx;
  for(i=0;i<n;i++){
    ss=0;for(j=0;j<n;j++)ss+=m.K[i][j]*db[j];
    num+=db[i]*ss;den+=m.M[i][i]*db[i]*db[i];
  }
  RA=num/den;
  ok=RA>=m.lam[0]*(1-1e-12);
  ch+=checkRow('Rayleigh, self-weight shape  R \u2265 \u03BB\u2081', fmt(RA,1)+' vs '+fmt(m.lam[0],1)+'  (+'+fmt(100*(RA/m.lam[0]-1),2)+'%)', ok);

  var sym=0,dk;
  for(i=0;i<n;i++)for(j=0;j<n;j++){
    dk=Math.max(Math.abs(m.K[i][j]),1);sym=Math.max(sym,Math.abs(m.K[i][j]-m.K[j][i])/dk);
    dk=Math.max(Math.abs(m.M[i][j]),1);sym=Math.max(sym,Math.abs(m.M[i][j]-m.M[j][i])/dk);
  }
  ok=sym<1e-14;
  ch+=checkRow('Symmetry  max |K\u1D62\u2C7C \u2212 K\u2C7C\u1D62| / K', sci(sym,2), ok);

  $('#ans-check').innerHTML=ch;
}
function pad(s,w){s=String(s);while(s.length<w)s=' '+s;return s;}
function matText(A){
  var i,j,w=[];
  for(j=0;j<A[0].length;j++){w[j]=0;for(i=0;i<A.length;i++)w[j]=Math.max(w[j],A[i][j].length);}
  var out=[];
  for(i=0;i<A.length;i++){
    var cells=[];
    for(j=0;j<A[i].length;j++)cells.push(pad(A[i][j],w[j]));
    out.push('[ '+cells.join('  ')+' ]');
  }
  return out.join('\n');
}
function padR(s,w){s=String(s);while(s.length<w)s+=' ';return s;}
function detN(A0){
  var n=A0.length,A=A0.map(function(r){return r.slice();}),det=1,i,j,k,p,t;
  for(k=0;k<n;k++){
    p=k;
    for(i=k+1;i<n;i++)if(Math.abs(A[i][k])>Math.abs(A[p][k]))p=i;
    if(Math.abs(A[p][k])<1e-300)return 0;
    if(p!==k){t=A[p];A[p]=A[k];A[k]=t;det=-det;}
    det*=A[k][k];
    for(i=k+1;i<n;i++){
      var f=A[i][k]/A[k][k];
      for(j=k;j<n;j++)A[i][j]-=f*A[k][j];
    }
  }
  return det;
}
function solveLin(A0,b){
  var n=A0.length,A=A0.map(function(r){return r.slice();}),v=b.slice(),i,j,k,p,t,x=new Array(n);
  for(k=0;k<n;k++){
    p=k;
    for(i=k+1;i<n;i++)if(Math.abs(A[i][k])>Math.abs(A[p][k]))p=i;
    if(p!==k){t=A[p];A[p]=A[k];A[k]=t;t=v[p];v[p]=v[k];v[k]=t;}
    for(i=k+1;i<n;i++){
      var f=A[i][k]/A[k][k];
      for(j=k;j<n;j++)A[i][j]-=f*A[k][j];
      v[i]-=f*v[k];
    }
  }
  for(i=n-1;i>=0;i--){
    var s=v[i];
    for(j=i+1;j<n;j++)s-=A[i][j]*x[j];
    x[i]=s/A[i][i];
  }
  return x;
}
function checkRow(label,val,ok){
  return '<div class="kv"><span class="k">'+label+'</span><span class="v" style="font-size:12px">'+val+'<span class="pass '+(ok?'ok':'no')+'">'+icon(ok?'check':'alert',12)+(ok?'pass':'check')+'</span></span></div>';
}
function shapeSVG(m,r){
  var n=m.N,i,ph=m.phi[r],mx=maxAbs(ph);
  var W=54,H=88,baseY=H-8,topY=8,stepY=(baseY-topY)/(n+0.2),cx=W/2;
  var s=svgOpen(W,H);
  s+=line(6,baseY,W-6,baseY,{stroke:'#d8d8e2',w:1.2});
  var d='M'+cx+' '+baseY;
  for(i=0;i<n;i++)d+='L'+(cx+ph[i]/mx*12)+' '+(baseY-(i+1)*stepY);
  s+=path(d,{stroke:MC[r%MC.length],w:2,cap:1});
  for(i=0;i<n;i++)s+=dot(cx+ph[i]/mx*12,baseY-(i+1)*stepY,2.6,MC[r%MC.length]);
  s+='</svg>';
  return s;
}

/* ================= 5. builder ================= */
function renderStoreys(){
  var n=S.n,i,h='';
  h+='<div class="hd"><span>Floor</span><span>'+(S.geom?'Height h (m)':'k storey (kN/m)')+'</span><span>Mass (kg)</span><span>k storey</span></div>';
  for(i=0;i<n;i++){
    h+='<div class="sr"><span class="fl">'+(i+1)+(i===n-1?' <span class="muted" style="font-weight:500;font-size:11px">roof</span>':'')+'</span>';
    if(S.geom)h+='<input class="inp" data-h="'+i+'" type="number" inputmode="decimal" step="0.1" min="0.5" max="30" value="'+S.hs[i]+'" aria-label="Storey '+(i+1)+' height in metres">';
    else h+='<input class="inp" data-k="'+i+'" type="number" inputmode="decimal" step="100" min="1" value="'+S.ks[i]+'" aria-label="Storey '+(i+1)+' stiffness in kN per metre">';
    h+='<input class="inp" data-m="'+i+'" type="number" inputmode="decimal" step="100" min="1" value="'+S.ms[i]+'" aria-label="Floor '+(i+1)+' mass in kilograms">';
    h+='<span class="sk">'+fmt(model.k[i],0)+'</span></div>';
  }
  $('#storey-tbl').innerHTML=h;
  $$('#storey-tbl input').forEach(function(el){
    el.addEventListener('input',function(){
      var v=parseFloat(el.value);
      if(!isFinite(v)||v<=0){el.setAttribute('aria-invalid','true');return;}
      el.removeAttribute('aria-invalid');
      if(el.hasAttribute('data-h'))S.hs[+el.getAttribute('data-h')]=Math.max(0.3,v);
      else if(el.hasAttribute('data-k'))S.ks[+el.getAttribute('data-k')]=Math.max(1,v);
      else S.ms[+el.getAttribute('data-m')]=Math.max(1,v);
      recomputeKeepFocus(el);
    });
  });
  /* show only the inputs the chosen material and section need */
  $('#geom-block').hidden=!S.geom;
  $$('#geom-block [data-for]').forEach(function(el){
    var f=el.getAttribute('data-for');
    el.hidden=!(f===S.mat||(f==='solid'&&S.sec==='solid')||(f==='hss'&&S.sec==='hss')||(f==='custom-sec'&&S.sec==='custom'));
  });
  var m=model, d='';
  if(S.geom){
    d+='<div><div class="k">E</div><div class="v">'+fmt(m.Ec,0)+' MPa</div></div>';
    d+='<div><div class="k">I</div><div class="v">'+sci(m.I,4)+' m\u2074</div></div>';
    d+='<div><div class="k">EI</div><div class="v">'+fmt(m.EI,0)+' kN\u00B7m\u00B2</div></div>';
    d+='<div><div class="k">k column, storey 1</div><div class="v">'+fmt(m.kc[0],1)+' kN/m</div></div>';
  }
  $('#derived').innerHTML=d;
}
/* a typed value re-renders the table; keep the caret where the user is typing */
function recomputeKeepFocus(el){
  var sel=el.id?'#'+el.id:(el.hasAttribute('data-h')?'[data-h="'+el.getAttribute('data-h')+'"]':el.hasAttribute('data-k')?'[data-k="'+el.getAttribute('data-k')+'"]':'[data-m="'+el.getAttribute('data-m')+'"]');
  recompute();
  var again=$(sel);
  if(again&&again!==document.activeElement){again.focus();try{var L=again.value.length;again.setSelectionRange(L,L);}catch(e){}}
}
function syncInputs(){
  var map={'in-fc':'fc','in-es':'Es','in-ex':'Ex','in-cols':'cols','in-b':'b','in-h':'h','in-B':'B','in-t':'t','in-ix':'Ix','in-zeta':'zeta'};
  Object.keys(map).forEach(function(id){var el=$('#'+id);if(el&&document.activeElement!==el)el.value=S[map[id]];});
  $('#in-ic').value=S.ic;
  $('#in-amp').value=S.amp;
  $('#amp-val').textContent=S.amp+' mm';
  $('#amp-lab').textContent=S.amp+' mm';
  $$('#floors-seg button').forEach(function(b){b.classList.toggle('on',+b.getAttribute('data-n')===S.n);b.setAttribute('aria-pressed',+b.getAttribute('data-n')===S.n);});
  $$('#geom-seg button').forEach(function(b){var on=(+b.getAttribute('data-g')===1)===S.geom;b.classList.toggle('on',on);b.setAttribute('aria-pressed',on);});
  $$('#mat-seg button').forEach(function(b){var on=b.getAttribute('data-m')===S.mat;b.classList.toggle('on',on);b.setAttribute('aria-pressed',on);});
  $$('#sec-seg button').forEach(function(b){var on=b.getAttribute('data-s')===S.sec;b.classList.toggle('on',on);b.setAttribute('aria-pressed',on);});
  var bad=S.sec==='hss'&&!(S.t>0&&2*S.t<S.B), et=$('#err-t');
  et.hidden=!bad;et.textContent=bad?'The wall must be thinner than half of B ('+fmt(S.B/2,1)+' mm).':'';
  if(bad)$('#in-t').setAttribute('aria-invalid','true');else $('#in-t').removeAttribute('aria-invalid');
}
function renderPreview(){
  var m=model,n=m.N,i,h='';
  $('#build-tag').textContent=modelTag(m);
  $('#build-svg').innerHTML=buildingSVG(m,{modeShape:m.phi[0],modeScale:44,modeColor:MC[0],masses:true,topY:52});
  for(i=0;i<n;i++){
    h+='<div class="r"><span>mode '+(i+1)+'</span><b>'+fmt(m.freq[i],3)+' Hz \u00B7 T '+fmt(m.per[i],4)+' s</b></div>';
  }
  h+='<div class="r"><span>k storey 1 \u2026 '+n+'</span><b>'+m.k.map(function(v){return fmt(v,0);}).join(' \u00B7 ')+' kN/m</b></div>';
  $('#build-tbl').innerHTML=h;
}

/* ================= 6. method ================= */
function mtx(rows){
  var out=[],i,j;
  for(i=0;i<rows.length;i++){
    var line='[ ';
    for(j=0;j<rows[i].length;j++)line+=pad(rows[i][j],11)+(j<rows[i].length-1?'  ':'');
    out.push(line+' ]');
  }
  return out.join('\n');
}
function renderMethod(){
  var m=model,n=m.N,i,j,S2=scaledMat(m),co=detPolyN(S2.Kp,S2.Mp),mono=co.map(function(c){return c/co[0];});
  var Krows=[],Mrows=[],Kp=[];
  for(i=0;i<n;i++){Krows.push([]);Mrows.push([]);Kp.push([]);for(j=0;j<n;j++){Krows[i].push(fmt(m.K[i][j]/1000,1));Mrows[i].push(i===j?fmt(m.M[i][i],0):'0');Kp[i].push(fmt(m.K[i][j]/m.ms[0],1));}}
  var blocks=[];
  var eL=m.mat==='conc'?'E  = 4700\u221Af\u2032c = 4700\u221A'+fmt(m.p.fc,0)+' = '+fmt(m.Ec,1)+' MPa':'E  = '+fmt(m.Ec,0)+' MPa ('+(m.mat==='steel'?'steel, given':'given')+')';
  var iL=m.sec==='hss'?'I  = [B\u2074 \u2212 (B\u22122t)\u2074]/12 = ['+fmt(m.p.B/1000,3)+'\u2074 \u2212 '+fmt((m.p.B-2*m.p.t)/1000,3)+'\u2074]/12 = '+sci(m.I,4)+' m\u2074'
    :m.sec==='custom'?'I  = '+fmt(m.p.Ix,2)+'\u00D710\u2076 mm\u2074 = '+sci(m.I,4)+' m\u2074 (given)':'I  = bh\u00B3/12 = '+fmt(m.p.b/1000,3)+'\u00D7'+fmt(m.p.h/1000,3)+'\u00B3/12 = '+sci(m.I,4)+' m\u2074';
  blocks.push({t:'Model and assumptions',b:
    '<p>A '+n+'-storey shear frame: rigid floor slabs, axially rigid columns, all mass lumped at the floors. Each storey deforms only by shearing its columns, so one sideways displacement per floor \u2014 '+n+' degrees of freedom.</p>'+
    (m.p.geom?'<p>Columns are fixed against rotation at both ends (stiff beams), hence k = 12EI/h\u00B3 per column, and '+m.cols+' columns act in parallel.</p>'+
    '<pre class="mat">'+eL+'\n'+iL+'\nEI = '+fmt(m.EI,1)+' kN\u00B7m\u00B2\n'+m.hs.map(function(hh,ix){return 'k'+(ix+1)+' = '+m.cols+'\u00B712EI/'+fmt(hh,3)+'\u00B3 = '+m.cols+' \u00D7 '+fmt(m.kc[ix],1)+' = '+fmt(m.kf[ix],1)+' kN/m';}).join('\n')+'</pre>'
    :'<p>The storey stiffnesses are given directly:</p><pre class="mat">'+m.k.map(function(v,ix){return 'k'+(ix+1)+' = '+fmt(v,1)+' kN/m';}).join('\n')+'</pre>')});
  blocks.push({t:'Mass and stiffness matrices',b:
    '<p>Assembling each spring twice with opposite signs gives the tri-diagonal stiffness matrix; the masses sit only on the diagonal.</p>'+
    '<pre class="mat">K = '+mtx(Krows)+'   kN/m\n\nM = '+mtx(Mrows)+'   kg</pre>'+
    '<p>The equation of motion for free vibration is <b>M x\u0308 + K x = 0</b>.</p>'});
  blocks.push({t:'The eigenvalue problem',b:
    '<p>Substituting x = \u03C6 sin(\u03C9t) gives <b>(K \u2212 \u03C9\u00B2M)\u03C6 = 0</b>. A non-trivial shape needs a singular matrix, so</p>'+
    '<pre class="mat">det(K \u2212 \u03C9\u00B2M) = 0</pre>'+
    '<p>Dividing the whole equation by m\u2081 gives the scaled system used on screen, with B = \u03C9\u00B2:</p>'+
    '<pre class="mat">K\u2032 = K/m\u2081 =\n'+mtx(Kp)+'   1/s\u00B2\n\nM\u2032 = M/m\u2081 = diag('+m.ms.map(function(v){return fmt(v/m.ms[0],4);}).join(', ')+')</pre>'});
  blocks.push({t:'Characteristic polynomial',b:
    '<p>Expanding the determinant gives a polynomial of degree '+n+' in B. Its roots are the squared frequencies.</p>'+
    '<pre class="mat">'+pnum(co,4)+' = 0\n\nmonic form:\n'+pnum(mono,4)+' = 0</pre>'+
    '<p>Roots:</p><pre class="mat">'+m.lam.map(function(L,ix){return 'B'+(ix+1)+' = '+fmt(L,4)+'   \u2192  \u03C9 = '+fmt(m.omega[ix],4)+' rad/s  \u2192  f = '+fmt(m.freq[ix],4)+' Hz  \u2192  T = '+fmt(m.per[ix],5)+' s';}).join('\n')+'</pre>'});
  var bs='<p>With the roof fixed at 1.000, the shape follows from the rows of (K \u2212 \u03BBM) taken from the top down. For storey <i>f</i>:</p>'+
    '<pre class="mat">\u03C6(f\u22121) = [ (k_f + k_(f+1) \u2212 \u03BB m_f)\u00B7\u03C6(f) \u2212 k_(f+1)\u00B7\u03C6(f+1) ] / k_f</pre>'+
    '<p>with k_(n+1) = 0 at the roof. The bottom row is not used \u2014 it is the check.</p><pre class="mat">';
  for(i=0;i<n;i++)bs+='\u03C6'+(i+1)+' = [ '+m.phi[i].map(function(v){return fmt(v,4);}).join(',  ')+' ]\n';
  bs+='</pre>';
  blocks.push({t:'Mode shapes by back-substitution',b:bs});
  blocks.push({t:'Checks that were run',b:
    '<p>Every number on the page comes from these identities; they are recomputed live.</p>'+
    '<ul style="margin:8px 0 0 18px;padding:0">'+
    '<li><b>(K \u2212 \u03BB\u1D63M)\u03C6\u1D63 = 0</b> \u2014 the eigenvalue equation, residual near machine precision.</li>'+
    '<li><b>\u03A3\u03BB\u1D63 = trace(M\u207B\u00B9K)</b> \u2014 the sum of the roots equals the trace.</li>'+
    '<li><b>\u03C6\u1D63\u1D40M\u03C6\u209B = 0</b> for r \u2260 s \u2014 modes are orthogonal through the mass matrix.</li>'+
    '<li><b>\u03A6\u03A6\u1D40M = I</b> with mass-normalised shapes \u2014 the modal basis is complete.</li>'+
    '<li>The static shape under self weight gives a Rayleigh estimate of f\u2081 within a fraction of a percent.</li>'+
    '</ul>'});
  blocks.push({t:'How the motion is computed',b:
    '<p>With x\u2080 and v\u2080 the initial displacement and velocity, each modal coordinate follows</p>'+
    '<pre class="mat">q\u1D63(t) = q\u1D63(0)\u00B7cos(\u03C9\u1D63t) + q\u0307\u1D63(0)/\u03C9\u1D63\u00B7sin(\u03C9\u1D63t)\nx(t) = \u03A3 \u03C6\u0302\u1D63 q\u1D63(t)</pre>'+
    '<p>where \u03C6\u0302 are mass-normalised. Damping (if you set \u03B6 &gt; 0) multiplies each mode by e^(\u2212\u03B6\u03C9t) and shortens its period to \u03C9\u221A(1\u2212\u03B6\u00B2).</p>'+
    '<p>The animation slows the real motion down by roughly 13\u201315\u00D7 so the eye can follow it; the relative speeds of the modes are kept exact \u2014 a mode with twice the frequency really does vibrate twice as fast on screen.</p>'});
  var h='';
  for(i=0;i<blocks.length;i++)h+='<details class="mtd" '+(i===0?'open':'')+'><summary>'+blocks[i].t+'</summary><div class="mtd-body">'+blocks[i].b+'</div></details>';
  $('#method-list').innerHTML=h;
}

/* ================= 6b. calculator keys ================= */
function calcNum(v){return Math.abs(v-1)<1e-12?'1':String(Number(v.toPrecision(10))).replace('-','\u2212');}
function renderCalc(){
  var m=model,n=m.N,sm=scaledMat(m),P=detPolyN(sm.Kp,sm.Mp),lead=P[0],i,h='';
  function key(s){return '<kbd>'+s+'</kbd>';}
  h+='<div class="calc-grid"><div><div class="calc-h">fx-991ES PLUS</div><ol class="calc-steps">'+
     '<li>'+key('MODE')+' '+key('5')+' <span>EQN</span></li>'+
     '<li>'+key(n===3?'4':'3')+' <span>'+(n===3?'aX\u00B3+bX\u00B2+cX+d=0':'aX\u00B2+bX+c=0')+'</span></li></ol></div>'+
     '<div><div class="calc-h">fx-991EX ClassWiz</div><ol class="calc-steps">'+
     '<li>'+key('MENU')+' '+key('A')+' <span>Equation/Func</span></li>'+
     '<li>'+key('2')+' <span>Polynomial</span> '+key(String(n))+'</li></ol></div></div>';
  h+='<div class="hint" style="margin:12px 0 6px">Type each coefficient and press '+key('=')+'. A negative number starts with '+key('(\u2212)')+'. These are the determinant from the tour divided by its leading term, so a = 1.</div>';
  h+='<table class="t"><tbody>';
  for(i=0;i<=n;i++)h+='<tr><td>'+'abcd'.charAt(i)+'</td><td style="text-align:right;font-family:var(--mono)">'+calcNum(P[i]/lead)+'</td></tr>';
  h+='</tbody></table>';
  h+='<div class="hint" style="margin:12px 0 6px">Keep pressing '+key('=')+' to read the roots. Each one is B = \u03C9\u00B2 \u2014 sort them smallest first, then \u03C9 = \u221AB and f = \u03C9 \u00F7 2\u03C0:</div>';
  for(i=0;i<n;i++)h+='<div class="kv"><span class="k">B'+sub(i)+' = \u03C9'+sub(i)+'\u00B2 = '+fmt(m.lam[i],2)+'</span><span class="v">\u03C9 = '+fmt(m.omega[i],3)+' \u00B7 f = '+fmt(m.freq[i],3)+' Hz</span></div>';
  $('#ans-calc').innerHTML=h;
}

/* ================= 6c. shareable links ================= */
function stateQuery(){
  var q=['n='+S.n,'g='+(S.geom?1:0)];
  if(S.geom){
    q.push('mt='+S.mat);
    if(S.mat==='conc')q.push('fc='+S.fc);else if(S.mat==='steel')q.push('es='+S.Es);else q.push('ex='+S.Ex);
    q.push('sc='+S.sec);
    if(S.sec==='solid')q.push('b='+S.b,'d='+S.h);else if(S.sec==='hss')q.push('ob='+S.B,'t='+S.t);else q.push('ix='+S.Ix);
    q.push('c='+S.cols,'h='+S.hs.join(','));
  } else q.push('k='+S.ks.join(','));
  q.push('m='+S.ms.join(','),'z='+S.zeta,'a='+S.amp,'ic='+S.ic);
  return q.join('&');
}
function syncURL(){
  var keep=S;S=freshState();var def=stateQuery();S=keep;
  var q=stateQuery();q=(q===def?'':q);
  if(VIEW!==VDEF)q+=(q?'&':'')+'v='+VIEW;
  try{history.replaceState(null,'',location.pathname+(q?'?'+q:'')+location.hash);}catch(e){}
}
/* untrusted input: every value range-checked, anything odd falls back to the class example */
function readURL(){
  var p=new URLSearchParams(location.search),v;
  function num(k,lo,hi){var x=parseFloat(p.get(k));return isFinite(x)&&x>=lo&&x<=hi?x:null;}
  function arr(k,lo,hi){
    var s=p.get(k);if(!s)return null;
    var a=s.split(',').map(parseFloat),j;
    if(a.length<2||a.length>3)return null;
    for(j=0;j<a.length;j++)if(!(isFinite(a[j])&&a[j]>=lo&&a[j]<=hi))return null;
    while(a.length<3)a.push(a[a.length-1]);
    return a;
  }
  if(p.get('p')&&PRESETS[p.get('p')])S=freshState(p.get('p'));
  if((v=num('n',2,3))!==null)S.n=Math.round(v);
  if(p.get('g')==='0')S.geom=false;
  v=p.get('mt');if(v==='conc'||v==='steel'||v==='custom')S.mat=v;
  v=p.get('sc');if(v==='solid'||v==='hss'||v==='custom')S.sec=v;
  if((v=num('fc',10,120))!==null)S.fc=v;
  if((v=num('es',50,300))!==null)S.Es=v;
  if((v=num('ex',0.1,1000))!==null)S.Ex=v;
  if((v=num('b',50,3000))!==null){S.b=v;if(!p.get('d'))S.h=v;}   /* old links: square b = h */
  if((v=num('d',50,3000))!==null)S.h=v;
  if((v=num('ob',20,3000))!==null)S.B=v;
  if((v=num('t',1,500))!==null)S.t=v;
  if((v=num('ix',0.001,1e9))!==null)S.Ix=v;
  if((v=num('c',1,12))!==null)S.cols=Math.round(v);
  if((v=arr('k',1,1e7)))S.ks=v;
  if((v=arr('h',0.5,30)))S.hs=v;
  if((v=arr('m',1,1e8)))S.ms=v;
  if((v=num('z',0,20))!==null)S.zeta=v;
  if((v=num('a',5,120))!==null)S.amp=v;
  v=p.get('ic');if(v==='roof'||v==='uniform'||v==='mode1')S.ic=v;
  v=p.get('v');return (v==='2d'||v==='3d'||v==='both')?v:null;
}
function copyText(txt,msg){
  function fallback(){
    var ta=document.createElement('textarea');ta.value=txt;
    ta.style.cssText='position:fixed;top:-1000px;opacity:0';
    document.body.appendChild(ta);ta.select();
    try{document.execCommand('copy');toast(msg);}catch(err){toast('Copy was blocked by the browser',false);}
    document.body.removeChild(ta);
  }
  if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(txt).then(function(){toast(msg);},fallback);
  else fallback();
}

/* ================= 7. wiring ================= */
function recompute(){
  compute();
  var keepCh=FI.ch,keepFr=FI.fr;
  CHAPTERS=buildTour();
  FI.ch=Math.min(keepCh,CHAPTERS.length-1);
  FI.fr=Math.min(keepFr,CHAPTERS[FI.ch].frames.length-1);
  renderChapters();
  renderHero();renderAnswers();renderCalc();renderStoreys();renderPreview();renderMethod();syncInputs();
  syncSegs();
  show(FI.ch,FI.fr);
  syncURL();
}
function boot(){
  document.head.insertAdjacentHTML('beforeend','<style>'
  +'pre.mat{background:#fbfbfd;border:1px solid var(--line);border-radius:12px;padding:12px 14px;overflow-x:auto;font:12px/1.7 var(--mono);color:#26272e;margin:8px 0}'
  +'.narr .body ul{margin:6px 0 0 18px;padding:0}.narr .body li{margin:3px 0}'
  +'.stage-cap .live[hidden],.note[hidden],.narr .formula[hidden]{display:none}'
  +'#answers,#build,#method,#tour,#hero{scroll-margin-top:86px}'
  +'section[id]{scroll-margin-top:74px}'
  +'.storeys .hd,.storeys .sr{grid-template-columns:52px 1fr 1fr 74px}'
  +'.storeys .sk{font-family:var(--mono);font-size:11px;color:var(--muted);text-align:right}'
  +'.chapters{overflow-x:auto;scrollbar-width:none}.chapters::-webkit-scrollbar{display:none}'
  +'html{overflow-anchor:none}@media (min-width:981px){.narr .controls{position:sticky;bottom:-26px;margin-bottom:-26px;padding:12px 0 26px;background:linear-gradient(transparent,#fff 14px)}.narr .kbdhint{display:none}}.tour-body{height:640px}.stage{min-height:0;overflow:hidden}.narr{min-height:0;overflow-y:auto}.tour-body.wide{grid-template-columns:1.55fr .8fr}'
  +'.stage-views{position:relative;flex:1 1 auto;min-height:0;display:grid;grid-template-columns:minmax(0,1fr);gap:12px}.stage-views.both{grid-template-columns:minmax(0,1fr) minmax(0,1fr)}'
  +'#stage-svg{min-height:0;display:flex;align-items:center;justify-content:center}#stage-svg svg{width:100%;height:100%;max-height:100%}#stage-svg[hidden],#stage-3d[hidden]{display:none}'
  +'#stage-3d{position:relative;min-height:0;border-radius:18px;overflow:hidden;background:radial-gradient(90% 80% at 50% 30%,#fff,#f1f1f7)}'
  +'#stage-3d canvas{position:absolute;inset:0;width:100%;height:100%;display:block;cursor:grab}#stage-3d canvas:active{cursor:grabbing}'
  +'#stage-3d .v3-hint{position:absolute;left:12px;bottom:10px;z-index:1;font-size:11px;color:var(--faint);pointer-events:none}'
  +'.stage-cap .v3n{text-transform:none;letter-spacing:0;font-weight:500}.stage-cap .v3n[hidden]{display:none}'
  +'#ans-calc kbd{display:inline-block;min-width:26px;padding:2px 7px;border:1px solid var(--line);border-bottom-width:2px;border-radius:7px;background:#fff;font:650 11.5px/1.4 var(--mono);text-align:center;color:var(--ink)}'
  +'.calc-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}.calc-h{font-size:12.5px;font-weight:700;margin-bottom:4px}'
  +'.calc-steps{margin:0;padding-left:18px;line-height:2.2;font-size:13px}.calc-steps span{color:var(--muted);font-size:12px}'
  +'@media (max-width:980px){.tour-body,.tour-body.wide{height:auto;grid-template-columns:1fr}.stage{height:380px}.narr{overflow:visible}.stage-views.both{gap:8px}}@media (max-width:560px){.stage{height:350px}}'
  +'@media (max-width:560px){.calc-grid{grid-template-columns:1fr}}'
  +'</style>');
  $$('.ico-slot[data-ic]').forEach(function(el){el.innerHTML=icon(el.getAttribute('data-ic'));});
  S=freshState();
  var qv=readURL();
  VDEF=(window.matchMedia&&window.matchMedia('(max-width:980px)').matches)?'3d':'both';
  VIEW=qv||VDEF;
  compute();
  CHAPTERS=buildTour();
  renderChapters();
  renderHero();renderAnswers();renderCalc();renderStoreys();renderPreview();renderMethod();syncInputs();
  show(0,0);
  setView(VIEW,true);
  $$('#view-seg button').forEach(function(b){b.addEventListener('click',function(){setView(b.getAttribute('data-v'));});});
  $('#share').addEventListener('click',function(){
    syncURL();var u=location.href.split('#')[0];
    if(navigator.share&&/^https?:/.test(u)){navigator.share({title:document.title,url:u}).catch(function(){});return;}
    copyText(u,'Link copied \u2014 it opens with these exact numbers');
  });
  if('serviceWorker' in navigator&&/^https?:/.test(location.protocol))navigator.serviceWorker.register('sw.js').catch(function(){});

  $('#prev').addEventListener('click',function(){
    setPlay(false);
    if(FI.fr>0)show(FI.ch,FI.fr-1);
    else if(FI.ch>0)show(FI.ch-1,CHAPTERS[FI.ch-1].frames.length-1);
  });
  $('#next').addEventListener('click',function(){
    setPlay(false);
    if(FI.fr<CHAPTERS[FI.ch].frames.length-1)show(FI.ch,FI.fr+1);
    else if(FI.ch<CHAPTERS.length-1)show(FI.ch+1,0);
  });
  $('#replay').addEventListener('click',function(){setPlay(false);show(FI.ch,FI.fr);});
  $('#tspeed').addEventListener('click',function(){STrue=!STrue;setPlay(false);show(FI.ch,FI.fr);});
  $('#play').addEventListener('click',function(){setPlay(!FI.playing);});
  $$('#speed button').forEach(function(b){
    b.addEventListener('click',function(){
      $$('#speed button').forEach(function(x){x.classList.remove('on');});
      b.classList.add('on');
      syncSeg($('#speed'));
      FI.speed=+b.getAttribute('data-s');
      if(FI.playing)setPlay(true);
    });
  });
  document.addEventListener('keydown',function(e){
    if(/input|select|textarea/i.test((e.target.tagName||'')))return;
    if(e.key===' '||e.code==='Space'){e.preventDefault();setPlay(!FI.playing);return;}
    if(e.key==='ArrowRight'){setPlay(false);$('#next').click();}
    if(e.key==='ArrowLeft'){setPlay(false);$('#prev').click();}
    if(e.key==='r'||e.key==='R'){setPlay(false);show(FI.ch,FI.fr);}
  });
  window.addEventListener('resize',function(){movePill();syncSegs();});

  /* spotlight follows the pointer across the hero stat cards */
  $$('.stat').forEach(function(el){
    el.addEventListener('pointermove',function(e){
      var r=el.getBoundingClientRect();
      el.style.setProperty('--mx',(e.clientX-r.left)+'px');
      el.style.setProperty('--my',(e.clientY-r.top)+'px');
    });
  });

  /* copy the solved numbers */
  $('#copy').addEventListener('click',function(){copyText(reportText(),'Copied \u2014 '+model.N+' storeys of results');});

  /* builder */
  $$('#floors-seg button').forEach(function(b){
    b.addEventListener('click',function(){S.n=+b.getAttribute('data-n');recompute();toast('Rebuilt for '+S.n+' storeys \u00B7 '+model.freq.length+' modes');});
  });
  $$('#geom-seg button').forEach(function(b){
    b.addEventListener('click',function(){S.geom=(+b.getAttribute('data-g')===1);recompute();toast(S.geom?'Stiffness rebuilt from geometry':'Stiffness now typed directly');});
  });
  /* number fields: ignore half-typed values, flag impossible ones beside the field */
  [['in-fc','fc',10,120],['in-es','Es',1,1000],['in-ex','Ex',0.01,5000],['in-cols','cols',1,12],
   ['in-b','b',10,5000],['in-h','h',10,5000],['in-B','B',10,5000],['in-t','t',0.5,1000],['in-ix','Ix',1e-6,1e9]].forEach(function(p){
    var el=$('#'+p[0]);
    el.addEventListener('input',function(){
      var v=parseFloat(this.value);
      if(!isFinite(v)||v<p[2]||v>p[3]){if(this.value!=='')el.setAttribute('aria-invalid','true');return;}
      el.removeAttribute('aria-invalid');
      S[p[1]]=(p[1]==='cols')?Math.round(v):v;
      recomputeKeepFocus(el);
    });
  });
  $$('#mat-seg button').forEach(function(b){
    b.addEventListener('click',function(){S.mat=b.getAttribute('data-m');recompute();});
  });
  $$('#sec-seg button').forEach(function(b){
    b.addEventListener('click',function(){S.sec=b.getAttribute('data-s');recompute();});
  });
  $('#print').addEventListener('click',function(){window.print();});
  $('#start-tour').addEventListener('click',function(){setTimeout(function(){var f=$('#chapters button.on');if(f)f.focus({preventScroll:true});},450);});
  $('#in-zeta').addEventListener('input',function(){var v=parseFloat(this.value);if(isFinite(v)){S.zeta=Math.max(0,Math.min(20,v));recompute();}});
  $('#in-ic').addEventListener('change',function(){S.ic=this.value;recompute();});
  $('#in-amp').addEventListener('input',function(){S.amp=+this.value;recompute();});
  $('#reset').addEventListener('click',function(){S=freshState('sir');recompute();toast('Back to the class example');});
  $('#rerun').addEventListener('click',function(){setPlay(false);show(0,0);$('#tour').scrollIntoView({behavior:'smooth',block:'start'});});

  /* reveal + nav */
  if('IntersectionObserver' in window){
    var io=new IntersectionObserver(function(es){
      es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target);}});
    },{rootMargin:'0px 0px -8% 0px',threshold:.06});
    $$('.rv').forEach(function(el){io.observe(el);});
    var secs=$$('section[id]'),nav=$$('.nav a');
    var io2=new IntersectionObserver(function(es){
      es.forEach(function(e){
        if(e.isIntersecting){
          nav.forEach(function(a){a.classList.toggle('on',a.getAttribute('href')==='#'+e.target.id);});
        }
      });
    },{rootMargin:'-45% 0px -50% 0px'});
    secs.forEach(function(s){io2.observe(s);});
  } else {
    $$('.rv').forEach(function(el){el.classList.add('in');});
  }
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);
else boot();
