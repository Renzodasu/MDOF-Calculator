/* =========================================================================
   math.js — a very small "typeset maths" kit.
   Every helper returns an HTML string, so an equation can be set with real
   stacked fractions (never "a / b"), radicals with an over-bar, italic
   variables, and time-staggered highlights that show WHICH numbers are
   being multiplied, in the order they are multiplied.
   ========================================================================= */

function OP(s){return '<span class="op">'+s+'</span>';}
function I(s){return '<i>'+s+'</i>';}
function SUB(s){return '<sub>'+s+'</sub>';}
function SUP(s){return '<sup>'+s+'</sup>';}
function TAG(s){return '<span class="tag">'+s+'</span>';}

/* stacked fraction: numerator over denominator */
function F(a,b,o){
  o=o||{};
  return '<span class="fr'+(o.lg?' lg':'')+'"><span class="fn">'+a+'</span><span class="fd">'+b+'</span></span>';
}
/* radical with an over-bar: SQ("x") -> sqrt(x) */
function SQ(x){return '<span class="rt"><span class="rs">\u221A</span><span class="rb">'+x+'</span></span>';}
/* highlight one piece of a formula at t seconds (sweeps, then fades) */
function GL(h,d){return '<span class="gq" style="animation-delay:'+(d||0).toFixed(2)+'s">'+h+'</span>';}
/* make a result appear at t seconds and stay */
function PI(h,d,cls){return '<span class="pin'+(cls?' '+cls:'')+'" style="animation-delay:'+(d||0).toFixed(2)+'s">'+h+'</span>';}
/* a block of equation rows; each row is a string or fn(rowIndex) -> string */
function EQ(rows){
  return '<div class="eq">'+rows.map(function(fn,i){
    var h=(typeof fn==='function')?fn(i):fn;
    return '<div class="eq-row">'+h+'</div>';
  }).join('')+'</div>';
}
