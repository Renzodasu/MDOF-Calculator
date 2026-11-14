
/* ---- MDOF shear-frame engine (pure, no DOM) ---- */
var UNS = "\u2212";

function zeros(n){var a=[],i,j;for(i=0;i<n;i++){a.push([]);for(j=0;j<n;j++)a[i].push(0);}return a;}

/* cyclic Jacobi for the symmetric N x N problem, A = M^-1/2 K M^-1/2 */
function eigSym(K,M){
  var n=K.length,i,j,k,p,q,A=zeros(n),V=zeros(n),s=[];
  for(i=0;i<n;i++)s[i]=1/Math.sqrt(M[i][i]);
  for(i=0;i<n;i++)for(j=0;j<n;j++)A[i][j]=K[i][j]*s[i]*s[j];
  for(i=0;i<n;i++)V[i][i]=1;
  for(var sweep=0;sweep<200;sweep++){
    var off=0,nn=0;
    for(i=0;i<n;i++){nn+=Math.abs(A[i][i]);for(j=i+1;j<n;j++)off+=Math.abs(A[i][j]);}
    if(off<1e-15*nn||off<1e-300)break;
    for(p=0;p<n-1;p++)for(q=p+1;q<n;q++){
      if(Math.abs(A[p][q])<1e-17*(Math.abs(A[p][p])+Math.abs(A[q][q])))continue;
      var th=(A[q][q]-A[p][p])/(2*A[p][q]);
      var tt=(th>=0?1:-1)/(Math.abs(th)+Math.sqrt(th*th+1));
      var c=1/Math.sqrt(tt*tt+1),ss=tt*c;
      for(k=0;k<n;k++){var akp=A[k][p],akq=A[k][q];A[k][p]=c*akp-ss*akq;A[k][q]=ss*akp+c*akq;}
      for(k=0;k<n;k++){var apk=A[p][k],aqk=A[q][k];A[p][k]=c*apk-ss*aqk;A[q][k]=ss*apk+c*aqk;}
      for(k=0;k<n;k++){var vkp=V[k][p],vkq=V[k][q];V[k][p]=c*vkp-ss*vkq;V[k][q]=ss*vkp+c*vkq;}
    }
  }
  var idx=[];for(i=0;i<n;i++)idx.push(i);
  idx.sort(function(a,b){return A[a][a]-A[b][b];});
  var vals=idx.map(function(z){return A[z][z];});
  var vecs=idx.map(function(z){var v=[];for(k=0;k<n;k++)v.push(V[k][z]);return v;});
  vecs.forEach(function(v){
    var mx=Math.abs(v[0]),c0=0,ii;
    for(ii=1;ii<v.length;ii++)if(Math.abs(v[ii])>mx){mx=Math.abs(v[ii]);c0=ii;}
    if(v[c0]<0)for(ii=0;ii<v.length;ii++)v[ii]=-v[ii];
  });
  return {vals:vals,vecs:vecs};
}

/* E of the column material, MPa.
     conc  : ACI 318, E = 4700 sqrt(f'c)
     steel : given modulus (structural steel, A36 included: 200 GPa)
     custom: any E the problem states                                  */
function matE(P){
  if(P.mat==='steel')return (P.Es||200)*1000;
  if(P.mat==='custom')return (P.Ex||25)*1000;
  return 4700*Math.sqrt(P.fc);
}
/* I of one column about the bending axis, m^4 (dimensions in mm).
     solid : rectangle b x h, I = b h^3 / 12
     hss   : square hollow tube B x B x t, I = [B^4 - (B-2t)^4] / 12
     custom: I given directly, in 10^6 mm^4                             */
function secI(P){
  if(P.sec==='hss'){var B=P.B/1000,bi=Math.max(0,(P.B-2*P.t))/1000;return (Math.pow(B,4)-Math.pow(bi,4))/12;}
  if(P.sec==='custom')return (P.Ix||0)*1e-6;
  var b=P.b/1000,h=P.h/1000;return b*h*h*h/12;
}
function buildModel(P){
  var n=P.n, i, hs=P.hs.slice(0,n), ms=P.ms.slice(0,n), cols=P.cols||4;
  var Ec=matE(P);
  var I=secI(P), EI=Ec*1000*I;
  var kc=[],kf=[];
  for(i=0;i<n;i++){kc[i]=12*EI/(hs[i]*hs[i]*hs[i]);kf[i]=kc[i]*cols;}
  var k = P.geom ? kf.slice() : P.ks.slice(0,n).map(function(x){return x;});
  var authK = P.geom ? kf.slice() : P.ks.slice(0,n);
  var K=zeros(n), M=zeros(n);
  for(i=0;i<n;i++){
    M[i][i]=ms[i];
    K[i][i]=1000*((i<n-1?k[i+1]:0)+k[i]);
    if(i<n-1){K[i][i+1]=-1000*k[i+1];K[i+1][i]=-1000*k[i+1];}
  }
  var e=eigSym(K,M), lam=e.vals;
  var phi=[];
  for(var r=0;r<n;r++){
    var v=[];
    for(i=0;i<n;i++)v.push(e.vecs[r][i]/Math.sqrt(M[i][i]));
    var roof=v[n-1]||1;
    if(Math.abs(roof)<1e-12)roof=1;
    phi.push(v.map(function(x){return x/roof;}));
  }
  var mu=phi.map(function(v){var s=0;for(i=0;i<n;i++)s+=M[i][i]*v[i]*v[i];return s;});
  var phihat=phi.map(function(v,r){var q=1/Math.sqrt(mu[r]);return v.map(function(x){return x*q;});});
  var omega=lam.map(function(L){return Math.sqrt(Math.max(L,0));});
  var freq=omega.map(function(w){return w/(2*Math.PI);});
  var per=freq.map(function(f){return f>0?1/f:Infinity;});
  return {N:n,p:P,mat:P.mat||'conc',sec:P.sec||'solid',Ec:Ec,I:I,EI:EI,hs:hs,ms:ms,cols:cols,kc:kc,kf:kf,k:k,K:K,M:M,
          lam:lam,omega:omega,freq:freq,per:per,phi:phi,mu:mu,phihat:phihat};
}

/* det of K - lam*M, generic (Gaussian elimination with partial pivoting) */
function detOf(K,M,lam){
  var n=K.length,A=zeros(n),i,j,k,d=1;
  for(i=0;i<n;i++)for(j=0;j<n;j++)A[i][j]=K[i][j]-(i===j?lam*M[i][i]:0);
  for(i=0;i<n;i++){
    var piv=i;
    for(k=i+1;k<n;k++)if(Math.abs(A[k][i])>Math.abs(A[piv][i]))piv=k;
    if(Math.abs(A[piv][i])<1e-300)return 0;
    if(piv!==i){var t=A[i];A[i]=A[piv];A[piv]=t;d=-d;}
    d*=A[i][i];
    for(k=i+1;k<n;k++){var f=A[k][i]/A[i][i];for(j=i;j<n;j++)A[k][j]-=f*A[i][j];}
  }
  return d;
}

/* monic characteristic polynomial from the roots, descending */
function polyFromRoots(roots){
  var p=[1],i,j;
  for(i=0;i<roots.length;i++){
    var q=[];
    for(j=0;j<p.length+1;j++)q.push(0);
    for(j=0;j<p.length;j++){q[j]+=p[j];q[j+1]-=roots[i]*p[j];}
    p=q;
  }
  return p;
}

/* modal initial-condition solve, optional damping ratio zeta (per mode) */
function modalState(m,x0,v0){
  var out=[],r,i,n=m.N;
  for(r=0;r<n;r++){
    var ph=m.phihat[r],q0=0,qd0=0;
    for(i=0;i<n;i++){q0+=ph[i]*m.M[i][i]*x0[i];qd0+=ph[i]*m.M[i][i]*v0[i];}
    out.push({q0:q0,qd0:qd0});
  }
  return out;
}
function responseAt(m,x0,v0,zeta,t){
  var st=modalState(m,x0,v0),out=[],r,i,n=m.N;
  for(i=0;i<n;i++)out.push(0);
  for(r=0;r<n;r++){
    var w=m.omega[r], z=(zeta&&zeta[r])||0, q;
    if(z>0){
      var wd=w*Math.sqrt(Math.max(1-z*z,1e-12)), A=st[r].q0, B=(st[r].qd0+z*w*A)/wd;
      q=Math.exp(-z*w*t)*(A*Math.cos(wd*t)+B*Math.sin(wd*t));
    } else {
      q=st[r].q0*Math.cos(w*t)+(w>1e-12?st[r].qd0/w*Math.sin(w*t):st[r].qd0*t);
    }
    for(i=0;i<n;i++)out[i]+=m.phihat[r][i]*q;
  }
  return out;
}
