import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const window={};
const context=vm.createContext({window,console,Math,Number,Object,RangeError,TypeError});
for(const file of ['js/timeEngine.js','js/mishapEngine.js','js/operationEngine.js'])
  vm.runInContext(fs.readFileSync(new URL('../'+file,import.meta.url),'utf8'),context,{filename:file});
const {PC_TIME,PC_MISHAPS,PC_OPERATIONS}=window;
test('la semilla genera exactamente la misma secuencia y cambia con otra semilla',()=>{
 const a=PC_MISHAPS.createSeededRandom('aula-2026'),
   b=PC_MISHAPS.createSeededRandom('aula-2026'),
   c=PC_MISHAPS.createSeededRandom('aula-otra');
 const left=Array.from({length:16},()=>a());
 assert.deepEqual(left,Array.from({length:16},()=>b()));
 assert.notDeepEqual(left,Array.from({length:16},()=>c()));
 for(const n of left)assert(n>=0&&n<1);
});
test('una pulsera a masa reduce solo ESD, no riesgo mecánico ni eléctrico',()=>{
 const common={kind:'fit',speed:'fast',difficulty:3,
   experience:0,tools:{adequate:true}};
 const bare=PC_MISHAPS.calculateRisks(common);
 const strap=PC_MISHAPS.calculateRisks({...common,
   esd:{worn:true,grounded:true}});
 assert(strap.esd<bare.esd&&strap.esd>0);
 assert.equal(strap.mechanical,bare.mechanical);
 assert.equal(strap.procedure,bare.procedure);
 const unplugged=PC_MISHAPS.calculateRisks({...common,
   esd:{worn:true,grounded:false}});
 assert.equal(unplugged.esd,bare.esd);
});
test('velocidad, herramientas, experiencia y electricidad afectan solo riesgos pertinentes',()=>{
 const base={kind:'connect',speed:'normal',difficulty:2,experience:0};
 const careful=PC_MISHAPS.calculateRisks({...base,speed:'careful'});
 const fast=PC_MISHAPS.calculateRisks({...base,speed:'fast'});
 assert(careful.electrical<fast.electrical);
 assert(careful.procedure<fast.procedure);
 const on=PC_MISHAPS.calculateRisks({...base,powered:true});
 assert(on.electrical>PC_MISHAPS.calculateRisks(base).electrical);
 assert.equal(on.procedure,PC_MISHAPS.calculateRisks(base).procedure);
 const expert=PC_MISHAPS.calculateRisks({...base,experience:90});
 assert(expert.procedure<PC_MISHAPS.calculateRisks(base).procedure);
 const poor=PC_MISHAPS.calculateRisks({...base,tools:{adequate:false}});
 assert.equal(poor.electrical,PC_MISHAPS.calculateRisks(base).electrical);
 assert(poor.procedure>PC_MISHAPS.calculateRisks(base).procedure);
});
test('un intento técnicamente rechazado no consume RNG ni genera incidencia',()=>{
 const mishaps=PC_MISHAPS.createEngine({seed:'unit-1',random:()=>0});
 const clock=PC_TIME.createClock();
 const operations=PC_OPERATIONS.createEngine({clock});
 const fail=operations.attempt({kind:'fit',target:'cpu:incompatible',
    execute:()=>{},wasSuccessful:()=>false,
    incidentEvaluator:o=>mishaps.assess(o)});
 assert.equal(fail.status,'rejected');
 assert.equal(fail.incident,null);
 assert.equal(mishaps.getDrawCount(),0);
 assert.equal(clock.getSummary().total,0);
});
test('incidencia forzada tras operación válida suma demora y se exporta',()=>{
 const mishaps=PC_MISHAPS.createEngine({seed:'simulada',random:()=>0});
 const clock=PC_TIME.createClock();
 const operations=PC_OPERATIONS.createEngine({clock});
 const record=operations.attempt({kind:'fit',target:'case:tower',
  execute:()=>{},wasSuccessful:()=>true,
  incidentEvaluator:o=>mishaps.assess(o)});
 assert.equal(record.status,'success');
 assert.equal(record.incident.category,'mechanical');
 assert.equal(record.incident.outcome,'delay');
 assert.equal(record.incident.delayMinutes,1.5);
 assert.equal(record.minutes,record.baseMinutes+1.5);
 assert.equal(clock.getSummary().total,10.3);
 assert.equal(operations.getSummary().counts.incidents,1);
 operations.getHistory()[0].incident.outcome='modified';
 assert.equal(operations.getHistory()[0].incident.outcome,'delay');
});
test('un resultado con revisión solicita diagnóstico sin inventar daño en el hardware',()=>{
 let index=0;
 const rng=()=>[0,.99][index++%2]; // incidente, después resultado review
 const mishaps=PC_MISHAPS.createEngine({seed:'review',random:rng});
 const result=mishaps.assess({kind:'screw',speed:'fast'});
 assert.equal(result.outcome,'review');
 assert.equal(result.delayMinutes,3);
 assert.match(result.description,/inspección/i);
 assert.equal(mishaps.getDrawCount(),2);
});
test('rutas que no tienen riesgo de ESD nunca aplican su probabilidad',()=>{
 const values=PC_MISHAPS.calculateRisks({kind:'connect',speed:'fast',
  rates:{mechanical:0,esd:1,electrical:0,procedure:0}});
 assert.equal(values.esd,0);
 assert.equal(values.mechanical,0);
});
test('se rechazan RNG, tasas y semilla inválidos',()=>{
 assert.throws(()=>PC_MISHAPS.createSeededRandom(''),/Semilla/);
 assert.throws(()=>PC_MISHAPS.calculateRisks({kind:'fit',rates:{mechanical:-1}}),/Probabilidad/);
 assert.throws(()=>PC_MISHAPS.createEngine({random:()=>1}).assess({kind:'fit'}),/RNG/);
});

test('SATA: solo un riesgo procedimental puede soltar el cable de datos',()=>{
  const rates={mechanical:0,esd:0,electrical:0,procedure:1};
  const choose=()=>{let i=0;return ()=>[0,.99][i++%2];};
  const failure=PC_MISHAPS.createEngine({seed:'sata-test',rates,random:choose()})
    .assess({kind:'connect',target:'sataData'});
  assert.equal(failure.outcome,'loose_sata');
  assert.equal(failure.code,'PROCEDURE_LOOSE_SATA');
  assert.equal(failure.category,'procedure');
  assert.equal(failure.delayMinutes,0);
  assert.match(failure.description,/reconecta/i);
  const other=PC_MISHAPS.createEngine({rates,random:choose()})
    .assess({kind:'connect',target:'eps'});
  assert.equal(other.outcome,'review');
  const sataPower=PC_MISHAPS.createEngine({rates,random:choose()})
    .assess({kind:'connect',target:'sataPower'});
  assert.equal(sataPower.outcome,'review');
});

test('SATA latente: resultado reproducible limitado al conector de datos',()=>{
  const rates={mechanical:0,esd:0,electrical:0,procedure:1};
  const rng=()=>{let i=0;return ()=>[0,.92][i++];};
  const m=PC_MISHAPS.createEngine({rates,random:rng()});
  const fault=m.assess({kind:'connect',target:'sataData'});
  assert.equal(fault.outcome,'latent_sata');
  assert.equal(fault.code,'PROCEDURE_LATENT_SATA');
  assert.equal(m.getDrawCount(),2);
  assert.equal(fault.delayMinutes,0);
  assert.equal(PC_MISHAPS.createEngine({rates,random:rng()})
    .assess({kind:'connect',target:'sataPower'}).outcome,'review');
});
