import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const window={};
const context=vm.createContext({window,console,Math,Number,Object,RangeError,TypeError});
for(const file of ['js/mishapEngine.js','js/ramPrecision.js'])
  vm.runInContext(fs.readFileSync(new URL('../'+file,import.meta.url),'utf8'),context,{filename:file});
const {PC_RAM_PRECISION:RAM}=window;
const aligned=session=>{
  if(session.getState().reversed)session.flip();
  session.setAlignment(0);session.setApproach(100);
  assert.equal(session.present().code,'aligned');
};
test('la RAM nace con orientación y desplazamiento aleatorios, reproducibles por semilla',()=>{
  const a=RAM.createEngine({seed:'clase-a'}),b=RAM.createEngine({seed:'clase-a'});
  const left=Array.from({length:6},()=>a.begin().getState());
  const right=Array.from({length:6},()=>b.begin().getState());
  assert.deepEqual(left,right);
  assert(left.every(s=>typeof s.reversed==='boolean'&&s.alignment>=-28&&s.alignment<=28));
  assert(new Set(left.map(s=>s.alignment+'-'+s.reversed)).size>1);
});
test('una muesca invertida impide acercar el módulo y añade tiempo de práctica',()=>{
  const s=RAM.createEngine({seed:'orientacion'}).begin();
  if(!s.getState().reversed)s.flip();
  s.setAlignment(0);s.setApproach(100);
  const wrong=s.present();
  assert.equal(wrong.code,'wrong_orientation');
  assert.equal(wrong.penaltyMinutes,.8);
  assert.equal(s.getState().stage,'align');
  s.flip();
  assert.equal(s.present().code,'aligned');
});
test('desviación y acercamiento insuficiente no permiten presionar',()=>{
  const s=RAM.createEngine({seed:'centrado'}).begin();
  if(s.getState().reversed)s.flip();
  s.setAlignment(20);s.setApproach(100);
  assert.equal(s.present().code,'misaligned');
  s.setAlignment(0);s.setApproach(40);
  assert.equal(s.present().code,'too_far');
  s.setApproach(95);
  assert.equal(s.present().code,'aligned');
  assert.equal(s.getState().stage,'pressure');
});
test('dos presiones correctas y equilibradas garantizan el encaje',()=>{
  const s=RAM.createEngine({seed:'perfecta'}).begin();
  aligned(s);
  s.setPressure('left',64);s.setPressure('right',69);
  const result=s.press();
  assert.equal(result.code,'perfect_seat');
  assert.equal(result.probability,1);
  assert.equal(result.penaltyMinutes,0);
  assert.equal(s.getState().stage,'complete');
  assert.equal(s.press(),null);
});
test('no se puede compensar presión excesiva ni un extremo descompensado',()=>{
  const s=RAM.createEngine({seed:'defectos'}).begin();
  aligned(s);
  s.setPressure('left',30);s.setPressure('right',70);
  assert.equal(s.press().code,'too_weak');
  s.setPressure('left',66);s.setPressure('right',95);
  assert.equal(s.press().code,'too_strong');
  s.setPressure('left',50);s.setPressure('right',74);
  assert.equal(s.press().code,'unbalanced');
  assert.equal(s.getState().stage,'pressure');
  assert.equal(s.getState().attempts.length,3);
});
test('la zona intermedia admite éxitos y fallos deterministas según semilla',()=>{
  const outcomes=[];
  for(let n=0;n<120;n++){
    const seed='zona-media-'+n,a=RAM.createEngine({seed}).begin(),
      b=RAM.createEngine({seed}).begin();
    for(const s of [a,b]){
      aligned(s);s.setPressure('left',52);s.setPressure('right',62);
    }
    const x=a.press(),y=b.press();
    assert.equal(x.code,y.code,'misma semilla + mismos controles');
    assert.equal(x.probability,y.probability);
    assert(x.probability>0&&x.probability<1);
    outcomes.push(x.ok);
  }
  assert(outcomes.some(Boolean),'Debe haber éxitos con presión intermedia');
  assert(outcomes.some(x=>!x),'Debe haber fallos con presión intermedia');
});
test('ningún control externo puede alterar posiciones o presión después del éxito',()=>{
  const s=RAM.createEngine({seed:'inmutable'}).begin();aligned(s);
  s.setPressure('left',66);s.setPressure('right',66);
  assert(s.press().ok);
  assert.equal(s.flip(),false);
  assert.equal(s.setAlignment(-5),false);
  assert.equal(s.setPressure('left',0),false);
  const snapshot=s.getState();
  snapshot.attempts[0].code='false';
  assert.notEqual(s.getState().attempts[0].code,'false');
});

test('el oscilador temporal va de rojo a verde y vuelve a rojo',()=>{
  const f=RAM.oscillatorValue;
  assert.equal(f(0,'left'),0);
  assert.equal(f(450,'left'),50);
  assert.equal(f(900,'left'),100);
  assert.equal(f(1350,'left'),50);
  assert.equal(f(1800,'left'),0);
  assert.equal(f(594,'left'),66);
  assert.equal(f(276,'right'),66);
  assert.equal(f(595,'right'),95);
  assert.equal(f(0,'right'),41,'el extremo derecho oscila con fase diferente');
  assert.equal(f(0,'left'),f(1800,'left'),'el movimiento es periódico');
  assert.throws(()=>f(0,'middle'),/Extremo DIMM/);
  assert.throws(()=>f(Number.NaN,'left'),/Tiempo de oscilación/);
});
test('el oscilador no consume sorteos del motor de incidencias ni del minijuego',()=>{
  const a=RAM.createEngine({seed:'oscillate'});
  const before=a.begin().getState();
  for(let t=0;t<5000;t+=17){
    RAM.oscillatorValue(t,'left');RAM.oscillatorValue(t,'right');
  }
  const after=a.begin().getState();
  const b=RAM.createEngine({seed:'oscillate'});
  b.begin();
  assert.deepEqual(after,b.begin().getState());
  assert.notEqual(before.id,after.id);
});
