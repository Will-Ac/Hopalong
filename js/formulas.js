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

    // --- Enabled (were previously disabled) ---

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

    { id:"inside_sin_y", name:"Inside sqrt: x+d·sin(y)", desc:"x' = y − sgn(x)·sqrt(|b(x+d·sin(y)) − c|), y' = a − x",
      step:(x,y,a,b,g,d)=>{ const s=x>0?1:(x<0?-1:0); const t=x + g*Math.sin(y); return [ y - s*Math.sqrt(Math.abs(b*t-d)), a - x ]; } },

    { id:"inside_cos_x", name:"Inside sqrt: x+d·cos(x)", desc:"x' = y − sgn(x)·sqrt(|b(x+d·cos(x)) − c|), y' = a − x",
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
      step:(x,y,a,b,g,d)=>{ const s=x>0?1:(x<0?-1:0); const k=(x*y)/50; return [ y - s*Math.sqrt(Math.abs(b*x-d)) + g*k, a - x ]; } }
  ,

    // -------- additional variants (public domain / fractal literature) --------
    { id:"positive_hopalong", name:"Positive Hopalong (+sqrt)", desc:"x' = y + sgn(x)·sqrt(|bx − c|), y' = a − x",
      step:(x,y,a,b,g,d)=>{ const s=x>0?1:(x<0?-1:0); return [ y + s*Math.sqrt(Math.abs(b*x-d)), a - x ]; } },

    { id:"sinusoidal_hopalong", name:"Sinusoidal Hopalong (sin)", desc:"x' = y + sin(bx − c), y' = a − x",
      step:(x,y,a,b,g,d)=>{ return [ y + Math.sin(b*x - d), a - x ]; } },

    { id:"threeply", name:"Threeply (Peters)", desc:"x' = y − sgn(x)·|sin(x)cos(b) + d − x·sin(a+b+d)|, y' = a − x",
      step:(x,y,a,b,g,d)=>{ const s=x>0?1:(x<0?-1:0); const t = Math.sin(x)*Math.cos(b) + g - x*Math.sin(a+b+g); return [ y - s*Math.abs(t), a - x ]; } },

    { id:"quadrup2", name:"Quadrup-2 (Peters)", desc:"x' = y − sgn(x)·sin(ln|bx−c|)·atan((ln|cx−b|)^2), y' = a − x",
      step:(x,y,a,b,g,d)=>{ const s=x>0?1:(x<0?-1:0); const ln1=Math.log(Math.abs(b*x-d)+1e-12); const ln2=Math.log(Math.abs(d*x-b)+1e-12); const k=Math.sin(ln1)*Math.atan((ln2*ln2)); return [ y - s*k, a - x ]; } },

    { id:"chip", name:"Chip (Peters)", desc:"x' = y − sgn(x)·cos((ln|bx−c|)^2)·atan((ln|bx−c|)^2), y' = a − x",
      step:(x,y,a,b,g,d)=>{ const s=x>0?1:(x<0?-1:0); const ln=Math.log(Math.abs(b*x-d)+1e-12); const t=ln*ln; const k=Math.cos(t)*Math.atan(t); return [ y - s*k, a - x ]; } },

    { id:"pickover_clifford", disabled:false, name:"Pickover/Clifford (sin)", desc:"x' = sin(by) + d·sin(bx), y' = sin(ax) + c·sin(ay) (scaled)",
      step:(x,y,a,b,g,d)=>{ const S=20; return [ S*(Math.sin(b*y) + g*Math.sin(b*x)), S*(Math.sin(a*x) + d*Math.sin(a*y)) ]; } }
];

export function getVariantById(id){
  return VARIANTS.find(v => v.id === id) || null;
}

export function listVariantIds(){
  return VARIANTS.map(v => v.id);
}
