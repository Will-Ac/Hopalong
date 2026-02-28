// Extracted from hopalongv124.html (Variants array)
// ES module version for ground-up rewrite (no DOM code here).

export const VARIANTS = [
  { id:"classic_sqrt", name:"Classic (sqrt)", desc:"Wolfram/Martin: x' = y − sgn(x)·sqrt(|bx − c|), y' = a − x",
    step:(x,y,a,b,g,d)=>{ const s=x>0?1:(x<0?-1:0); return [ y - s*Math.sqrt(Math.abs(b*x-d)), a - x ]; } },

  { id:"sqrt_plus_gamma_y", name:"Classic + dy", desc:"x' = y − sgn(x)·sqrt(|bx − c|) + dy, y' = a − x",
    step:(x,y,a,b,g,d)=>{ const s=x>0?1:(x<0?-1:0); return [ y - s*Math.sqrt(Math.abs(b*x-d)) + g*y, a - x ]; } },

  { id:"sqrt_plus_gamma_x", name:"Classic + dx", desc:"x' = y − sgn(x)·sqrt(|bx − c|) + dx, y' = a − x",
    step:(x,y,a,b,g,d)=>{ const s=x>0?1:(x<0?-1:0); return [ y - s*Math.sqrt(Math.abs(b*x-d)) + g*x, a - x ]; } },

  { id:"mix_inside", name:"sqrt(|b(x+dy)−c|)", desc:"Mix x,y inside sqrt: x' = y − sgn(x)·sqrt(|b(x+dy) − c|), y' = a − x",
    step:(x,y,a,b,g,d)=>{ const s=x>0?1:(x<0?-1:0); return [ y - s*Math.sqrt(Math.abs(b*(x+g*y)-d)), a - x ]; } },

  { id:"trig_kick_x", name:"Trig kick (sin x)", desc:"x' = y − sgn(x)·sqrt(|bx − c|) + d·sin(x), y' = a − x",
    step:(x,y,a,b,g,d)=>{ const s=x>0?1:(x<0?-1:0); return [ y - s*Math.sqrt(Math.abs(b*x-d)) + g*Math.sin(x), a - x ]; } },

  { id:"damped", name:"Damped (|d|)", desc:"x' = (y − sgn(x)·sqrt(|b x − c|))·(1−|d|), y' = a − x",
    step:(x,y,a,b,g,d)=>{ const s=x>0?1:(x<0?-1:0); const base=y - s*Math.sqrt(Math.abs(b*x-d)); const damp=1-Math.min(0.95,Math.abs(g)); return [ base*damp, a - x ]; } },

  { id:"y_feedback", name:"Y feedback (a−x+d·y)", desc:"Keep classic x', add feedback on y: y' = a − x + d·y",
    step:(x,y,a,b,g,d)=>{ const s=x>0?1:(x<0?-1:0); const xn=y - s*Math.sqrt(Math.abs(b*x-d)); const yn=a - x + g*y; return [xn, yn]; } },

  { id:"trig_kick_y", name:"Trig kick (sin y)", desc:"x' = y − sgn(x)·sqrt(|b x − c|) + d·sin(y), y' = a − x",
    step:(x,y,a,b,g,d)=>{ const s=x>0?1:(x<0?-1:0); return [ y - s*Math.sqrt(Math.abs(b*x-d)) + g*Math.sin(y), a - x ]; } },

  { id:"classic_plus_yy", name:"Classic + d·y²", desc:"x' = y − sgn(x)·sqrt(|b x − c|) + d·y², y' = a − x",
    step:(x,y,a,b,g,d)=>{ const s=x>0?1:(x<0?-1:0); return [ y - s*Math.sqrt(Math.abs(b*x-d)) + g*(y*y), a - x ]; } },

  { id:"cos_xy_kick", name:"Trig kick (cos(x+y))", desc:"x' = y − sgn(x)·sqrt(|bx − c|) + d·cos(x+y), y' = a − x",
    step:(x,y,a,b,g,d)=>{ const s=x>0?1:(x<0?-1:0); return [ y - s*Math.sqrt(Math.abs(b*x-d)) + g*Math.cos(x+y), a - x ]; } },

  { id:"inside_sin_y", name:"Inside sqrt sin(y)", desc:"x' = y − sgn(x)·sqrt(|b(x+d·sin(y)) − c|), y' = a − x",
    step:(x,y,a,b,g,d)=>{ const s=x>0?1:(x<0?-1:0); const t=x + g*Math.sin(y); return [ y - s*Math.sqrt(Math.abs(b*t-d)), a - x ]; } },

  { id:"inside_cos_x", name:"Inside sqrt cos(x)", desc:"x' = y − sgn(x)·sqrt(|b(x+d·cos(x)) − c|), y' = a − x",
    step:(x,y,a,b,g,d)=>{ const s=x>0?1:(x<0?-1:0); const t=x + g*Math.cos(x); return [ y - s*Math.sqrt(Math.abs(b*t-d)), a - x ]; } },

  { id:"softsign_kick", name:"Softsign kick", desc:"x' = y − sgn(x)·sqrt(|bx − c|) + d·(x/(1+|x|)), y' = a − x",
    step:(x,y,a,b,g,d)=>{ const s=x>0?1:(x<0?-1:0); const k = x/(1+Math.abs(x)); return [ y - s*Math.sqrt(Math.abs(b*x-d)) + g*k, a - x ]; } },

  { id:"tanh_kick", name:"Tanh kick", desc:"x' = y − sgn(x)·sqrt(|bx − c|) + d·tanh(x), y' = a − x",
    step:(x,y,a,b,g,d)=>{ const s=x>0?1:(x<0?-1:0); const k = Math.tanh(x); return [ y - s*Math.sqrt(Math.abs(b*x-d)) + g*k, a - x ]; } },

  { id:"sign_xy", name:"Sign of (x·y)", desc:"Use sign(x·y): x' = y − sgn(xy)·sqrt(|bx − c|), y' = a − x",
    step:(x,y,a,b,g,d)=>{ const p=x*y; const s=p>0?1:(p<0?-1:0); return [ y - s*Math.sqrt(Math.abs(b*x-d)), a - x ]; } },

  { id:"double_root", name:"Double-root kick", desc:"x' = y − sgn(x)·(sqrt(|bx−c|)+d·sqrt(|by−c|)), y' = a − x",
    step:(x,y,a,b,g,d)=>{ const s=x>0?1:(x<0?-1:0); const r1=Math.sqrt(Math.abs(b*x-d)); const r2=Math.sqrt(Math.abs(b*y-d)); return [ y - s*(r1 + g*r2), a - x ]; } },

  { id:"xy_coupling", name:"XY coupling", desc:"x' = y − sgn(x)·sqrt(|bx − c|) + d·(x·y/50), y' = a − x",
    step:(x,y,a,b,g,d)=>{ const s=x>0?1:(x<0?-1:0); const k=(x*y)/50; return [ y - s*Math.sqrt(Math.abs(b*x-d)) + g*k, a - x ]; } },

  { id:"positive_hopalong", name:"Positive Hopalong", desc:"x' = y + sgn(x)·sqrt(|bx − c|), y' = a − x",
    step:(x,y,a,b,g,d)=>{ const s=x>0?1:(x<0?-1:0); return [ y + s*Math.sqrt(Math.abs(b*x-d)), a - x ]; } },

  { id:"sinusoidal_hopalong", name:"Sinusoidal Hopalong", desc:"x' = y + sin(bx − c), y' = a − x",
    step:(x,y,a,b,g,d)=>{ return [ y + Math.sin(b*x - d), a - x ]; } },

  { id:"threeply", name:"Threeply (Peters)", desc:"x' = y − sgn(x)·|sin(x)cos(b) + d − x·sin(a+b+d)|, y' = a − x",
    step:(x,y,a,b,g,d)=>{ const s=x>0?1:(x<0?-1:0); const t = Math.sin(x)*Math.cos(b) + g - x*Math.sin(a+b+g); return [ y - s*Math.abs(t), a - x ]; } },

  { id:"quadrup2", name:"Quadrup-2 (Peters)", desc:"x' = y − sgn(x)·sin(ln|bx−c|)·atan((ln|cx−b|)^2), y' = a − x",
    step:(x,y,a,b,g,d)=>{ const s=x>0?1:(x<0?-1:0); const ln1=Math.log(Math.abs(b*x-d)+1e-12); const ln2=Math.log(Math.abs(d*x-b)+1e-12); const k=Math.sin(ln1)*Math.atan((ln2*ln2)); return [ y - s*k, a - x ]; } },

  { id:"chip", name:"Chip (Peters)", desc:"x' = y − sgn(x)·cos((ln|bx−c|)^2)·atan((ln|bx−c|)^2), y' = a − x",
    step:(x,y,a,b,g,d)=>{ const s=x>0?1:(x<0?-1:0); const ln=Math.log(Math.abs(b*x-d)+1e-12); const t=ln*ln; const k=Math.cos(t)*Math.atan(t); return [ y - s*k, a - x ]; } },

  { id:"pickover_clifford", disabled:false, name:"Pickover/Clifford", desc:"x' = sin(by) + d·sin(bx), y' = sin(ax) + c·sin(ay) (scaled)",
    step:(x,y,a,b,g,d)=>{ const S=20; return [ S*(Math.sin(b*y) + g*Math.sin(b*x)), S*(Math.sin(a*x) + d*Math.sin(a*y)) ]; } },

  { id:"peter_de_jong", name:"Peter de Jong", desc:"x' = sin(a·y) − cos(b·x), y' = sin(c·x) − cos(d·y)",
    step:(x,y,a,b,c,d)=>[ Math.sin(a*y)-Math.cos(b*x), Math.sin(c*x)-Math.cos(d*y) ] },

  { id:"clifford", name:"Clifford (Pickover)", desc:"x' = sin(a·y) + c·cos(a·x), y' = sin(b·x) + d·cos(b·y)",
    step:(x,y,a,b,c,d)=>[ Math.sin(a*y)+c*Math.cos(a*x), Math.sin(b*x)+d*Math.cos(b*y) ] },

  { id:"tinkerbell", name:"Tinkerbell map", desc:"x' = x² − y² + a·x + b·y, y' = 2xy + c·x + d·y",
    step:(x,y,a,b,c,d)=>[ x*x-y*y+a*x+b*y, 2*x*y+c*x+d*y ] },

  { id:"henon", name:"Hénon (with offsets)", desc:"x' = 1 − a·x² + y + c, y' = b·x + d",
    step:(x,y,a,b,c,d)=>[ 1-a*x*x+y+c, b*x+d ] },

  { id:"lozi", name:"Lozi (with offsets)", desc:"x' = 1 − a·|x| + y + c, y' = b·x + d",
    step:(x,y,a,b,c,d)=>[ 1-a*Math.abs(x)+y+c, b*x+d ] },

  { id:"ikeda", name:"Ikeda (4-param)", desc:"t = c − d/(1 + x² + y²); x' = a + b(x cos t − y sin t); y' = b(x sin t + y cos t)",
    step:(x,y,a,b,c,d)=>{ const r2=x*x+y*y; const t=c-d/(1+r2); const ct=Math.cos(t); const st=Math.sin(t); return [a+b*(x*ct-y*st), b*(x*st+y*ct)]; } },

  { id:"gingerbread", name:"Gingerbreadman (generalized)", desc:"x' = a − y + b|x|, y' = c·x + d",
    step:(x,y,a,b,c,d)=>[ a - y + b*Math.abs(x), c*x + d ] },

  { id:"zaslavsky_web", name:"Zaslavsky Web", desc:"t = y + d·sin(x+c); x' = wrapPI(x + a·sin(t)); y' = wrapPI(t + b)",
    step:(x,y,a,b,c,d)=>{
      const wrapPI = (v) => {
        const twoPi = 2 * Math.PI;
        v = (v + Math.PI) % twoPi;
        if (v < 0) v += twoPi;
        return v - Math.PI;
      };

      const t = y + d * Math.sin(x + c);
      const x1 = wrapPI(x + a * Math.sin(t));
      const y1 = wrapPI(t + b);

      return [x1, y1];
    } },

  { id:"popcorn", name:"Popcorn", desc:"x' = x − a·sin(y + tan(3y)) + c, y' = y − b·sin(x + tan(3x)) + d",
    step:(x,y,a,b,c,d)=>{ const safeTan=(v)=>{ const t=Math.tan(v); return Number.isFinite(t)?Math.max(-10,Math.min(10,t)):0; }; return [ x - a*Math.sin(y + safeTan(3*y)) + c, y - b*Math.sin(x + safeTan(3*x)) + d ]; } },

  { id:"bedhead", name:"Bedhead", desc:"x' = sin(xy/b)·y + cos(ax−y) + d, y' = x + sin(y)/c",
    step:(x,y,a,b,c,d)=>{ const safeB=Math.abs(b)<1e-9?(b<0?-1e-9:1e-9):b; const safeC=Math.abs(c)<1e-9?(c<0?-1e-9:1e-9):c; return [Math.sin((x*y)/safeB)*y + Math.cos(a*x-y) + d, x + Math.sin(y)/safeC]; } },

  { id:"gumowski_mira", name:"Gumowski–Mira", desc:"f(u)=c·u+2(1−c)u²/(1+u²); x'=y+a(1−by²)y+f(x), y'=-x+d·f(x')",
    step:(x,y,a,b,c,d)=>{ const f=(u)=>c*u + (2*(1-c)*u*u)/(1+u*u); const x1=y + a*(1-b*y*y)*y + f(x); return [x1, -x + d*f(x1)]; } },

  { id:"shifted_hopalong", name:"Shifted Hopalong", desc:"xShift=x+c; x' = y − sgn(xShift)·sqrt(|b·xShift−a|), y' = a − xShift + d",
    step:(x,y,a,b,c,d)=>{ const xShift=x+c; const sign=xShift>=0?1:-1; return [y - sign*Math.sqrt(Math.abs(b*xShift-a)), a-xShift+d]; } }
];

export const EXTRA_FORMULA_RANGES_RAW = {
  peter_de_jong:     { a: [-3, 3],   b: [-3, 3],   c: [-3, 3],   d: [-3, 3] },
  clifford:          { a: [-3, 3],   b: [-3, 3],   c: [-3, 3],   d: [-3, 3] },
  tinkerbell:        { a: [-1.5, 1.5], b: [-1.5, 1.5], c: [-1.0, 3.0], d: [-1.5, 1.5] },
  henon:             { a: [0.0, 2.0],  b: [-1.0, 1.0],  c: [-0.5, 0.5], d: [-0.5, 0.5] },
  lozi:              { a: [0.0, 2.0],  b: [-1.0, 1.0],  c: [-0.5, 0.5], d: [-0.5, 0.5] },
  ikeda:             { a: [0.0, 1.5],  b: [0.5, 0.99],  c: [-1.0, 1.0], d: [0.0, 10.0] },
  gingerbread:       { a: [-2.0, 2.0], b: [0.0, 2.0],   c: [0.7, 1.3],  d: [-2.0, 2.0] },
  zaslavsky_web:     { a: [0.0, 2.0],  b: [0.0, 2.0],   c: [0.0, 6.28318], d: [0.0, 2.0] },
  popcorn:           { a: [0.0, 0.08], b: [0.0, 0.08],  c: [-2.0, 2.0], d: [-2.0, 2.0] },
  bedhead:           { a: [-2.0, 2.0], b: [-2.0, 2.0],  c: [-2.0, 2.0], d: [-2.0, 2.0] },
  gumowski_mira:     { a: [-1.0, 1.0], b: [-1.0, 1.0],  c: [0.0, 1.0],  d: [0.0, 1.0] },
  shifted_hopalong:  { a: [-5.0, 8.0], b: [-5.0, 8.0],  c: [-5.0, 5.0], d: [-5.0, 5.0] },
};

export const FORMULA_DEFAULT_PRESETS = {
  gingerbread: { a: 1, b: 1, c: 1, d: 0 },
  popcorn: { a: 0.03, b: 0.03, c: 0, d: 0 },
  bedhead: { a: 0.65, b: 0.73 },
  gumowski_mira: { a: 0.008, b: -0.7, c: 0.05 },
  zaslavsky_web: { a: 0.2, b: 0.3, c: 3.0 },
  shifted_hopalong: { a: 7, b: 8, c: 2.5, d: 1 },
};

export function getVariantById(id){
  return VARIANTS.find(v => v.id === id) || null;
}

export function listVariantIds(){
  return VARIANTS.map(v => v.id);
}
