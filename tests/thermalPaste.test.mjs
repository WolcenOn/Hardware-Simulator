import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const window={};
vm.runInContext(fs.readFileSync(new URL('../js/thermalPaste.js',import.meta.url),'utf8'),
  vm.createContext({window,Math,Number,Object,Float64Array,Array}),{filename:'thermalPaste.js'});
const PASTE=window.PC_THERMAL_PASTE;
const deposit=(ms=3000)=>{
  const s=PASTE.makeSyringe();s.pointer(.5,.5);s.pump(true);
  for(let i=0;i<ms/40;i++)s.advance(40);
  s.pump(false);for(let i=0;i<20;i++)s.advance(40);
  return s.confirm();
};
const finish=(d,order,byRounds=false)=>{
  const s=PASTE.createSpread(d.dots);
  if(byRounds){for(let z=10;z<=100;z+=10)for(const i of order)s.tighten(i,z);}
  else for(const i of order)for(let z=10;z<=100;z+=10)s.tighten(i,z);
  return s.getState();
};
test('la jeringuilla mueve la boquilla y mide la dosis consumida',()=>{
  const s=PASTE.makeSyringe();
  assert.equal(s.pointer(.3,.65),true);
  s.pump(true);for(let i=0;i<30;i++)s.advance(40);
  const st=s.getState();assert(st.used>.1);
  assert(st.remaining<3);
  assert(st.dots.some(d=>Math.abs(d.x-.3)<.001&&Math.abs(d.y-.65)<.001));
  assert(st.flow>0);
});
test('al soltar el émbolo sigue una pequeña salida viscosa',()=>{
  const s=PASTE.makeSyringe();s.pump(true);
  for(let i=0;i<25;i++)s.advance(40);
  s.pump(false);const before=s.getState().used;
  for(let i=0;i<7;i++)s.advance(40);
  const after=s.getState();
  assert(after.used>before);assert(after.flow<s.getState().capacity);
  assert(after.flow>0);
});
test('confirmar no consume más pasta, congelar la aplicación y recuperar depósitos',()=>{
  const s=PASTE.makeSyringe();s.pump(true);
  for(let i=0;i<45;i++)s.advance(40);
  const dep=s.confirm();
  assert(dep.volume>0);
  assert.equal(s.getState().stage,'ready');
  assert.equal(s.pointer(.1,.1),false);
  assert.equal(s.advance(40),null);
  assert.equal(s.confirm(),null);
});
test('el mapa se expande durante giros y no durante giros nulos',()=>{
  const d=deposit(),s=PASTE.createSpread(d.dots),a=s.getState();
  assert.equal(a.tightened,0);
  assert.equal(s.tighten(0,0).coverage,a.coverage);
  const b=s.tighten(0,10);
  assert.notEqual(b.cells.map(x=>x.mass).join(','),a.cells.map(x=>x.mass).join(','));
  assert.equal(b.screws[0],10);
  assert.equal(s.tighten(0,10).coverage,b.coverage);
});
test('atornillado gradual en cruz reduce desequilibrio máximo',()=>{
  const d=deposit(),a=finish(d,[0,3,1,2],true),b=finish(d,[0,1,2,3]);
  assert.equal(a.tightened,4);
  assert.equal(a.peakImbalance,10);
  assert.equal(b.peakImbalance,100);
  assert.equal(a.quality,'good');
  assert.equal(b.quality,'unbalanced');
  assert(a.coverage>=75&&a.overflow<8);
});
test('cantidad muy escasa produce mala cobertura aunque se apriete en cruz',()=>{
  const d=deposit(300),r=finish(d,[0,3,1,2],true);
  assert.equal(r.quality,'insufficient');
});
test('exceso de jeringuilla queda marcado por dosis o rebose',()=>{
  const d=deposit(6400),r=finish(d,[0,3,1,2],true);
  assert.equal(r.quality,'excessive');
});
test('la simulación es reproducible con los mismos depósitos y orden',()=>{
  const d=deposit(),a=finish(d,[0,3,1,2],true),b=finish(d,[0,3,1,2],true);
  assert.deepEqual(a,b);
  assert.equal(PASTE.createSpread(d.dots).tighten(7,100),false);
});
