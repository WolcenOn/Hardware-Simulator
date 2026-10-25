import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const window={};
const context=vm.createContext({window,console,Math,Number,Object,RangeError,TypeError});
for(const file of ['js/mishapEngine.js','js/cpuPrecision.js'])
  vm.runInContext(fs.readFileSync(new URL('../'+file,import.meta.url),'utf8'),
    context,{filename:file});
const CPU=window.PC_CPU_PRECISION;
const seated=s=>{
  let guard=0;
  while(s.getState().rotation!==0&&guard++<4)s.rotate();
  s.move(0,0);s.setLower(100);
  assert.equal(s.present().code,'presented');
};
test('CPU aleatoria repetible y RNG independiente por semilla',()=>{
  const a=CPU.createEngine({seed:'aula'}),b=CPU.createEngine({seed:'aula'});
  const list=Array.from({length:8},()=>a.begin({target:'cpu:r7600',socket:'AM5'}).getState());
  assert.deepEqual(list,Array.from({length:8},()=>b.begin({target:'cpu:r7600',socket:'AM5'}).getState()));
  assert(list.every(s=>[0,90,180,270].includes(s.rotation)));
  assert(list.some(s=>s.x!==0||s.y!==0));
});
test('CPU exige girar hasta alinear la marca del zócalo',()=>{
  const s=CPU.createEngine({seed:'orientation'}).begin({target:'cpu:r7600',socket:'AM5'});
  s.move(0,0);s.setLower(100);
  if(s.getState().rotation===0)s.rotate();
  const wrong=s.present();
  assert.equal(wrong.code,'wrong_rotation');
  assert.equal(s.getState().stage,'align');
  while(s.getState().rotation!==0)s.rotate();
  assert.equal(s.present().code,'presented');
});
test('CPU desplazada no entra aunque esté correctamente orientada',()=>{
  const s=CPU.createEngine().begin({target:'cpu:r5600',socket:'AM4'});
  while(s.getState().rotation!==0)s.rotate();
  s.move(20,-12);s.setLower(100);
  assert.equal(s.present().code,'misaligned');
  s.move(4,4);assert.equal(s.present().code,'presented');
});
test('CPU debe acercarse hasta apoyar antes de cerrar la palanca',()=>{
  const s=CPU.createEngine().begin({target:'cpu:r7600',socket:'AM5'});
  while(s.getState().rotation!==0)s.rotate();
  s.move(0,0);s.setLower(85);
  assert.equal(s.present().code,'too_high');
  s.setLower(95);
  assert.equal(s.present().code,'presented');
});
test('palanca exige fuerza didáctica verde, sin daños ni consumos',()=>{
  const s=CPU.createEngine().begin({target:'cpu:r7600',socket:'AM5'});
  seated(s);
  assert.equal(s.capture(10).code,'insufficient_force');
  assert.equal(s.getState().stage,'lever');
  assert.equal(s.capture(99).code,'excessive_force');
  assert.equal(s.capture(66).code,'locked');
  assert.equal(s.getState().stage,'complete');
  assert.equal(s.capture(66),null);
  assert.equal(s.move(0,0),false);
});
test('el oscilador es periódico y de 0 a 100, verde en el ciclo',()=>{
  assert.equal(CPU.oscillatorValue(0),0);
  assert.equal(CPU.oscillatorValue(525),50);
  assert.equal(CPU.oscillatorValue(1050),100);
  assert.equal(CPU.oscillatorValue(1575),50);
  assert.equal(CPU.oscillatorValue(2100),0);
  assert.throws(()=>CPU.oscillatorValue(Number.NaN),/Tiempo/);
});
test('el motor rechaza IDs incorrectas, valores de posición inválidos y copias alteradas',()=>{
  const e=CPU.createEngine();
  assert.throws(()=>e.begin({target:'ram:ddr5_16',socket:'AM5'}),/CPU/);
  const s=e.begin({target:'cpu:i513600k',socket:'LGA1700'});
  assert.equal(s.move(Number.NaN,0),false);
  assert.equal(s.setLower('bad'),false);
  const data=s.getState();data.attempts.push({code:'inject'});
  assert.equal(s.getState().attempts.length,0);
});
