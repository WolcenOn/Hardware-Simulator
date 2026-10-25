import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const window={};
const ctx=vm.createContext({window,console,Math,Number,Object,RangeError,TypeError});
for(const path of ['js/mishapEngine.js','js/screwPrecision.js'])
  vm.runInContext(fs.readFileSync(new URL('../'+path,import.meta.url),'utf8'),ctx,{filename:path});
const SCREW=window.PC_SCREW_PRECISION;
test('atornillado reproducible y posicion inicial variable por cada tornillo',()=>{
  const a=SCREW.createEngine({seed:'aula'}),b=SCREW.createEngine({seed:'aula'});
  const first=Array.from({length:7},()=>a.begin('motherboard:b650').getState());
  const second=Array.from({length:7},()=>b.begin('motherboard:b650').getState());
  assert.deepEqual(first,second);
  assert(new Set(first.map(s=>s.x+':'+s.y)).size>1);
  assert(first.every(s=>s.depth===0&&s.stage==='active'));
});
test('con el tornillo desalineado la rueda no aumenta la profundidad',()=>{
  const s=SCREW.createEngine().begin('psu:psu450');
  s.move(95,95);
  const first=s.turn(1),second=s.turn(1);
  assert.equal(first.code,'not_engaged');
  assert.equal(first.depth,0);
  assert.equal(second.depth,0);
  assert.equal(s.getState().missed,2);
  assert.equal(first.penaltyMinutes,.2);
  assert.equal(s.getState().turns,2);
  assert.equal(s.getState().stage,'active');
});
test('la alineacion usa ambos ejes y la distancia radial',()=>{
  const s=SCREW.createEngine().begin('gpu:rx7600');
  s.move(56,53);assert.equal(s.getState().aligned,true);
  assert.equal(s.turn().depth,10);
  s.move(57,57);assert.equal(s.getState().aligned,false);
  assert.equal(s.turn().depth,10);
  s.move(50,50);assert.equal(s.turn().depth,20);
});
test('la rueda avanza la profundidad por pasos hasta fijar al 100%',()=>{
  const s=SCREW.createEngine().begin('storage:sataSSD');
  s.move(50,50);
  for(let i=1;i<10;i++){
    const turn=s.turn(1);
    assert.equal(turn.complete,false);
    assert.equal(turn.depth,i*10);
  }
  const final=s.turn(1);
  assert.equal(final.code,'seated');
  assert.equal(final.complete,true);
  assert.equal(s.getState().stage,'complete');
  assert.equal(s.turn(1),null);
  assert.equal(s.move(10,10),false);
});
test('se puede aflojar y recuperar profundidad solo si hay alineacion',()=>{
  const s=SCREW.createEngine().begin('motherboard:b650');
  s.move(50,50);s.turn(1);s.turn(1);
  assert.equal(s.turn(-1).depth,10);
  s.move(90,90);
  assert.equal(s.turn(-1).depth,10);
  assert.equal(s.getState().missed,1);
});
test('ningun giro invalido cambia la profundidad ni puede completarse sin pieza',()=>{
  assert.throws(()=>SCREW.createEngine().begin(''),/Pieza/);
  const s=SCREW.createEngine().begin('cooler:air');
  assert.throws(()=>s.turn(2),/Giro/);
  assert.equal(s.getState().turns,0);
  assert.equal(s.move(Number.NaN,50),false);
  assert.equal(s.getState().depth,0);
  const data=s.getState();data.history.push({code:'spoof'});
  assert.equal(s.getState().history.length,0);
});
