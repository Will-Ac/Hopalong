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

  { id:"fractal_dream", name:"Fractal Dream", desc:"x' = sin(y·b) + c·sin(x·b), y' = sin(x·a) + d·sin(y·a)",
    step:(x,y,a,b,c,d)=>[ Math.sin(y*b) + c*Math.sin(x*b), Math.sin(x*a) + d*Math.sin(y*a) ] },

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

  { id:"popcorn", name:"Popcorn", desc:"x' = x − a·sin(y + tan(3y)) + c, y' = y − b·sin(x + tan(3x)) + d",
    step:(x,y,a,b,c,d)=>{ const safeTan=(v)=>{ const t=Math.tan(v); return Number.isFinite(t)?Math.max(-10,Math.min(10,t)):0; }; return [ x - a*Math.sin(y + safeTan(3*y)) + c, y - b*Math.sin(x + safeTan(3*x)) + d ]; } },

  { id:"bedhead", name:"Bedhead", desc:"x' = sin(xy/b)·y + cos(ax−y) + d, y' = x + sin(y)/c",
    step:(x,y,a,b,c,d)=>{ const safeB=Math.abs(b)<1e-9?(b<0?-1e-9:1e-9):b; const safeC=Math.abs(c)<1e-9?(c<0?-1e-9:1e-9):c; return [Math.sin((x*y)/safeB)*y + Math.cos(a*x-y) + d, x + Math.sin(y)/safeC]; } },

  { id:"jason_rampe_1", name:"Jason Rampe 1", desc:"x' = cos(y·b) + c·sin(x·b), y' = cos(x·a) + d·sin(y·a)",
    step:(x,y,a,b,c,d)=>[ Math.cos(y*b) + c*Math.sin(x*b), Math.cos(x*a) + d*Math.sin(y*a) ] },

  { id:"jason_rampe_2", name:"Jason Rampe 2", desc:"x' = cos(y·b) + c·cos(x·b), y' = cos(x·a) + d·cos(y·a)",
    step:(x,y,a,b,c,d)=>[ Math.cos(y*b) + c*Math.cos(x*b), Math.cos(x*a) + d*Math.cos(y*a) ] },

  { id:"jason_rampe_3", name:"Jason Rampe 3", desc:"x' = sin(y·b) + c·cos(x·b), y' = cos(x·a) + d·sin(y·a)",
    step:(x,y,a,b,c,d)=>[ Math.sin(y*b) + c*Math.cos(x*b), Math.cos(x*a) + d*Math.sin(y*a) ] },

  { id:"johnny_svensson", name:"Johnny Svensson", desc:"x' = d·sin(x·a) − sin(y·b), y' = c·cos(x·a) + cos(y·b)",
    step:(x,y,a,b,c,d)=>[ d*Math.sin(x*a) - Math.sin(y*b), c*Math.cos(x*a) + Math.cos(y*b) ] },

  { id:"gumowski_mira", name:"Gumowski–Mira", desc:"f(u)=c·u+2(1−c)u²/(1+u²); x'=y+a(1−by²)y+f(x), y'=-x+d·f(x')",
    step:(x,y,a,b,c,d)=>{ const f=(u)=>c*u + (2*(1-c)*u*u)/(1+u*u); const x1=y + a*(1-b*y*y)*y + f(x); return [x1, -x + d*f(x1)]; } },

  { id:"shifted_hopalong", name:"Shifted Hopalong", desc:"xShift=x+c; x' = y − sgn(xShift)·sqrt(|b·xShift−a|), y' = a − xShift + d",
    step:(x,y,a,b,c,d)=>{ const xShift=x+c; const sign=xShift>=0?1:-1; return [y - sign*Math.sqrt(Math.abs(b*xShift-a)), a-xShift+d]; } }
];

export const FORMULA_RANGES_RAW = {
  classic_sqrt: { a: [-10.0, 10.0], b: [-10.0, 10.0], c: [-10.0, 10.0], d: [-5.0, 5.0] },
  positive_hopalong: { a: [-76.57, 73.43], b: [-30.0, 28.86], c: [-29.32, 30.0], d: [0.0, 0.0] },
  sinusoidal_hopalong: { a: [-26.13, 56.28], b: [-29.48, 27.34], c: [-29.31, 30.0], d: [0.0, 0.0] },
  sqrt_plus_gamma_y: { a: [-80.0, 77.59], b: [-21.75, 30.0], c: [-28.94, 26.57], d: [-2.14, 2.89] },
  sqrt_plus_gamma_x: { a: [-78.55, 77.52], b: [-30.0, 24.37], c: [-29.13, 30.0], d: [-1.8, 2.73] },
  mix_inside: { a: [-80.0, 80.0], b: [-28.02, 30.0], c: [-25.91, 30.0], d: [-3.0, 2.92] },
  trig_kick_x: { a: [-75.2, 80.0], b: [-28.73, 30.0], c: [-30.0, 27.43], d: [-0.85, 2.95] },
  trig_kick_y: { a: [-79.84, 78.7], b: [-30.0, 28.62], c: [-30.0, 30.0], d: [-2.4, 2.75] },
  cos_xy_kick: { a: [-80.0, 78.57], b: [-30.0, 30.0], c: [-30.0, 30.0], d: [-1.18, 2.79] },
  inside_sin_y: { a: [-80.0, 78.64], b: [-28.68, 30.0], c: [-29.85, 30.0], d: [-2.84, 3.0] },
  inside_cos_x: { a: [-75.39, 78.33], b: [-27.62, 30.0], c: [-30.0, 29.85], d: [-2.34, 3.0] },
  softsign_kick: { a: [-76.43, 80.0], b: [-30.0, 29.48], c: [-22.17, 30.0], d: [-3.0, 2.88] },
  tanh_kick: { a: [-79.66, 76.93], b: [-30.0, 30.0], c: [-16.76, 30.0], d: [-2.8, 2.98] },
  sign_xy: { a: [-28.57, 75.71], b: [-26.8, 30.0], c: [-30.0, 30.0], d: [0.0, 0.0] },
  double_root: { a: [-60.0, 57.77], b: [-10.41, 12.0], c: [-30.0, 25.26], d: [-1.15, 2.5] },
  xy_coupling: { a: [-80.0, 78.78], b: [-28.77, 30.0], c: [-27.33, 30.0], d: [-0.46, 2.25] },
  damped: { a: [-56.36, 60.0], b: [-20.0, 19.92], c: [-30.0, 30.0], d: [-0.2, 0.84] },
  y_feedback: { a: [-60.0, 57.06], b: [-19.92, 20.0], c: [-30.0, 30.0], d: [-1.0, 0.64] },
  threeply: { a: [-11.16, 11.73], b: [-12.0, 12.0], c: [-30.0, 30.0], d: [-5.24, 10.94] },
  quadrup2: { a: [-80.0, 75.98], b: [-10.0, 10.0], c: [-28.89, 30.0], d: [0.0, 0.0] },
  chip: { a: [-80.0, 80.0], b: [-10.0, 9.88], c: [-30.0, 29.98], d: [0.0, 0.0] },
  pickover_clifford: { a: [-2.0, 2.0], b: [-2.0, 2.0], c: [-2.0, 2.0], d: [-2.0, 2.0] },
  peter_de_jong: { a: [-3.0, 3.0], b: [-3.0, 3.0], c: [-3.0, 3.0], d: [-3.0, 3.0] },
  clifford: { a: [-3.0, 3.0], b: [-3.0, 3.0], c: [-3.0, 3.0], d: [-3.0, 3.0] },
  fractal_dream: { a: [-3.0, 3.0], b: [-3.0, 3.0], c: [-0.5, 1.5], d: [-0.5, 1.5] },
  tinkerbell: { a: [-1.5, 1.5], b: [-1.5, 1.5], c: [-2.5, 2.5], d: [-1.5, 1.5] },
  henon: { a: [0.8, 1.6], b: [0.1, 0.4], c: [-1.0, 1.0], d: [-1.0, 1.0] },
  lozi: { a: [1.2, 2.0], b: [0.2, 0.7], c: [-1.0, 1.0], d: [-1.0, 1.0] },
  ikeda: { a: [0.0, 1.5], b: [0.5, 0.99], c: [-1.0, 1.0], d: [0.0, 10.0] },
  gingerbread: { a: [-2.0, 2.0], b: [0.4, 1.6], c: [0.8, 1.3], d: [-1.0, 1.0] },
  popcorn: { a: [0.001, 0.06], b: [0.001, 0.06], c: [-0.5, 0.5], d: [-0.5, 0.5] },
  bedhead: { a: [-1.2, 1.2], b: [0.2, 2.0], c: [0.2, 2.0], d: [-0.8, 0.8] },
  gumowski_mira: { a: [-0.05, 0.05], b: [-1.0, 1.0], c: [0.0, 1.0], d: [0.3, 1.0] },
  jason_rampe_1: { a: [-3.0, 3.0], b: [-3.0, 3.0], c: [-3.0, 3.0], d: [-3.0, 3.0] },
  jason_rampe_2: { a: [-3.0, 3.0], b: [-3.0, 3.0], c: [-3.0, 3.0], d: [-3.0, 3.0] },
  jason_rampe_3: { a: [-3.0, 3.0], b: [-3.0, 3.0], c: [-3.0, 3.0], d: [-3.0, 3.0] },
  johnny_svensson: { a: [-3.0, 3.0], b: [-3.0, 3.0], c: [-3.0, 3.0], d: [-3.0, 3.0] },
  shifted_hopalong: { a: [-2.0, 10.0], b: [-10.0, 10.0], c: [-4.0, 4.0], d: [-4.0, 4.0] },
  classic_plus_yy: { a: [-57.16, 60.0], b: [-20.0, 20.0], c: [-30.0, 30.0], d: [-0.03, 0.09] },
};


export const FORMULA_DEFAULT_PRESETS = {
  classic_sqrt: {a: 1.0,  b: 5.0,  c: 0.0,  d: 0.0},
  sqrt_plus_gamma_y: { a: -1.2050, b: 4.1250, c: -1.1850, d: 0.3750 },
  sqrt_plus_gamma_x: { a: -0.5150, b: -2.8150, c: 0.4350, d: 0.4650 },
  mix_inside: { a: 0.0000, b: 0.9900, c: 2.0450, d: -0.0400 },
  trig_kick_x: { a: 2.4000, b: 0.6350, c: -1.2850, d: 1.0500 },
  damped: { a: 1.8200, b: -0.0400, c: 0.0000, d: 0.3200 },
  y_feedback: { a: -1.4700, b: 0.0400, c: 0.0000, d: -0.1800 },
  trig_kick_y: { a: -0.5700, b: -0.6900, c: 0.0000, d: 0.1750 },
  classic_plus_yy: { a: 1.4200, b: 0.0000, c: 0.0000, d: 0.0300 },
  cos_xy_kick: { a: -0.7150, b: 0.0000, c: 0.0000, d: 0.8050 },
  inside_sin_y: { a: -0.6800, b: 0.6600, c: 0.0750, d: 0.0800 },
  inside_cos_x: { a: 1.4700, b: 1.1900, c: -0.0750, d: 0.3300 },
  softsign_kick: { a: 1.7850, b: -0.2600, c: 3.9150, d: -0.0600 },
  tanh_kick: { a: -1.3650, b: 0.0000, c: 6.6200, d: 0.0900 },
  sign_xy: { a: 23.5700, b: 1.6000, c: 0.0000, d: 0.0000 },
  double_root: { a: -1.1150, b: 0.7950, c: -2.3700, d: 0.6750 },
  xy_coupling: { a: -0.6100, b: 0.6150, c: 1.3350, d: 0.8950 },
  positive_hopalong: { a: -1.5700, b: -0.5700, c: 0.3400, d: 0.0000 },
  sinusoidal_hopalong: { a: 15.0750, b: -1.0700, c: 0.3450, d: 0.0000 },
  threeply: { a: 0.2850, b: 0.0000, c: 0.0000, d: 2.8500 },
  quadrup2: { a: -2.0100, b: 0.0000, c: 0.5550, d: 0.0000 },
  chip: { a: 0.0000, b: -0.0600, c: -0.0100, d: 0.0000 },
  pickover_clifford: { a: 0.0000, b: 0.0000, c: 0.0000, d: 0.0000 },
  peter_de_jong: {a: 1.4,  b: -2.3, c: 2.4,  d: -2.1},
  clifford: {a: -1.4, b: 1.6,  c: 1.0,  d: 0.7},
  fractal_dream: {a: -1.4, b: 1.6, c: 1.0, d: 0.7},
  tinkerbell: {a: 0.9,  b: -0.6013, c: 2.0,  d: 0.5},
  henon: {a: 1.4,  b: 0.3,  c: 0.0,  d: 0.0},
  lozi: {a: 1.7,  b: 0.5,  c: 0.0,  d: 0.0},
  ikeda: {a: 0.4,  b: 0.9,  c: 0.0,  d: 6.0},
  gingerbread: {a: 1.2,  b: 1.0,  c: 1.0,  d: 0.0},
  popcorn: {a: 0.03, b: 0.03, c: 0.0,  d: 0.0},
  bedhead: {a: 0.65, b: 0.73, c: 1.1,  d: 0.1},
  gumowski_mira: {a: 0.01, b: -0.7, c: 0.05, d: 0.7},
  jason_rampe_1: {a: -1.4, b: 1.6, c: 1.0, d: 0.7},
  jason_rampe_2: {a: -1.4, b: 1.6, c: 1.0, d: 0.7},
  jason_rampe_3: {a: -1.4, b: 1.6, c: 1.0, d: 0.7},
  johnny_svensson: {a: -1.4, b: 1.6, c: 1.0, d: 0.7},
  shifted_hopalong: {a: 7.0,  b: 8.0,  c: 2.5,  d: 1.0},
};



export const FORMULA_DEFAULT_SEEDS = {
  classic_sqrt: { x: 0.0, y: 0.0 },
  sqrt_plus_gamma_y: { x: 0.0, y: 0.0 },
  sqrt_plus_gamma_x: { x: 0.0, y: 0.0 },
  mix_inside: { x: 0.0, y: 0.0 },
  trig_kick_x: { x: 0.0, y: 0.0 },
  damped: { x: 0.0, y: 0.0 },
  y_feedback: { x: 0.0, y: 0.0 },
  trig_kick_y: { x: 0.0, y: 0.0 },
  classic_plus_yy: { x: 0.0, y: 0.0 },
  cos_xy_kick: { x: 0.0, y: 0.0 },
  inside_sin_y: { x: 0.0, y: 0.0 },
  inside_cos_x: { x: 0.0, y: 0.0 },
  softsign_kick: { x: 0.0, y: 0.0 },
  tanh_kick: { x: 0.0, y: 0.0 },
  sign_xy: { x: 0.0, y: 0.0 },
  double_root: { x: 0.0, y: 0.0 },
  xy_coupling: { x: 0.0, y: 0.0 },
  positive_hopalong: { x: 0.0, y: 0.0 },
  sinusoidal_hopalong: { x: 0.0, y: 0.0 },
  threeply: { x: 0.0, y: 0.0 },
  quadrup2: { x: 0.0, y: 0.0 },
  chip: { x: 0.0, y: 0.0 },
  pickover_clifford: { x: 0.0, y: 0.0 },
  peter_de_jong: {x: 0.1, y: 0.1},
  clifford: {x: 0.1, y: 0.1},
  fractal_dream: {x: 0.1, y: 0.1},
  tinkerbell: {x: 0.0, y: 0.0},
  henon: {x: 0.1, y: 0.0},
  lozi: {x: 0.1, y: 0.0},
  ikeda: {x: 0.0, y: 0.0},
  gingerbread: {x: 0.1, y: 0.1},
  popcorn: {x: 0.1, y: 0.1},
  bedhead: {x: 1.0, y: 1.0},
  gumowski_mira: {x: 0.0, y: 0.5},
  jason_rampe_1: {x: 0.1, y: 0.1},
  jason_rampe_2: {x: 0.1, y: 0.1},
  jason_rampe_3: {x: 0.1, y: 0.1},
  johnny_svensson: {x: 0.1, y: 0.1},
  shifted_hopalong: {x: 0.0, y: 0.0},
};

export const FORMULA_METADATA = VARIANTS.map(({ id, name, desc }) => ({ id, name, desc }));

export function getVariantById(id){
  return VARIANTS.find(v => v.id === id) || null;
}

export function listVariantIds(){
  return VARIANTS.map(v => v.id);
}
