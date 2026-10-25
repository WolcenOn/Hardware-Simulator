import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const window={};
const context=vm.createContext({window,console,Math,Number,Object,RangeError,TypeError});
for(const file of ['js/timeEngine.js','js/operationEngine.js']){
  vm.runInContext(fs.readFileSync(new URL('../'+file,import.meta.url),'utf8'),
    context,{filename:file});
}
const {PC_OPERATIONS,PC_TIME}=window;
test('una operación válida aplica cambios existentes y registra minutos',()=>{
  const clock=PC_TIME.createClock(),engine=PC_OPERATIONS.createEngine({clock});
  let installed=false;
  const entry=engine.attempt({kind:'fit',target:'gpu',execute:()=>{installed=true},
    wasSuccessful:()=>installed});
  assert.equal(entry.status,'success');
  assert.equal(entry.category,'necessary');
  assert.equal(entry.minutes,8.8);
  assert.equal(clock.getSummary().technical,8.8);
});
test('prerrequisito rechazado nunca consume minutos ni genera daños',()=>{
  const clock=PC_TIME.createClock(),engine=PC_OPERATIONS.createEngine({clock});
  let installed=false;
  const record=engine.attempt({kind:'screw',target:'board',
    execute:()=>{},wasSuccessful:()=>installed});
  assert.equal(record.status,'rejected');
  assert.equal(record.minutes,0);
  assert.equal(clock.getSummary().total,0);
  assert.equal(engine.getHistory()[0].category,'rejected');
});
test('inspecciones útiles y acciones válidas repetidas quedan separadas',()=>{
  const engine=PC_OPERATIONS.createEngine({clock:PC_TIME.createClock()});
  for(let i=0;i<2;i++)engine.attempt({kind:'inspect',target:'machine',
    execute:()=>{},wasSuccessful:()=>true});
  const summary=engine.getSummary();
  assert.equal(summary.counts.useful_inspection,1);
  assert.equal(summary.counts.repeated,1);
  assert.equal(summary.history.length,2);
});
test('el motor no modifica el historial al mutar una copia devuelta',()=>{
  const engine=PC_OPERATIONS.createEngine({clock:PC_TIME.createClock()});
  engine.attempt({kind:'connect',target:'usb',execute:()=>{},
    wasSuccessful:()=>true});
  engine.getHistory()[0].status='tampered';
  assert.equal(engine.getHistory()[0].status,'success');
});
test('el adaptador conserva errores explícitos de la lógica técnica',()=>{
  const engine=PC_OPERATIONS.createEngine({clock:PC_TIME.createClock()});
  assert.throws(()=>engine.attempt({kind:'fit',target:'cpu',
    execute:()=>{throw new Error('Socket incompatible')},
    wasSuccessful:()=>true}),/Socket incompatible/);
  assert.equal(engine.getSummary().counts.rejected,1);
});

test('un segundo intento sobre una conexión ya completada cuenta como repetido sin duplicar crédito',()=>{
  const clock=PC_TIME.createClock(),engine=PC_OPERATIONS.createEngine({clock});
  let connected=false;
  engine.attempt({kind:'connect',target:'atx24',execute:()=>{connected=true},
    wasSuccessful:()=>connected});
  const before=clock.getSummary().total;
  const result=engine.attempt({kind:'connect',target:'atx24',execute:()=>{},
    wasSuccessful:()=>false,getReason:()=> 'Ya estaba conectado.'});
  assert.equal(result.status,'rejected');
  assert.equal(result.category,'repeated');
  assert.equal(result.reason,'Ya estaba conectado.');
  assert.equal(clock.getSummary().total,before);
});

test('deshacer un montaje del mismo encargo se registra como retrabajo',()=>{
  const clock=PC_TIME.createClock(),engine=PC_OPERATIONS.createEngine({clock});
  let fitted=false;
  const fit=()=>engine.attempt({kind:'fit',target:'case:tower',
    execute:()=>{fitted=true},wasSuccessful:()=>fitted});
  const remove=()=>engine.attempt({kind:'remove',target:'case:tower',
    execute:()=>{fitted=false},wasSuccessful:()=>!fitted});
  assert.equal(fit().category,'necessary');
  assert.equal(remove().category,'rework');
  assert.equal(fit().category,'rework');
  assert.equal(engine.getSummary().counts.rework,2);
  assert.equal(engine.getSummary().counts.necessary,1);
  assert(engine.getSummary().technical>8.8);
});
test('desconexión de cable preexistente es necesaria; reconexión tras desmontaje es retrabajo',()=>{
  const clock=PC_TIME.createClock(),engine=PC_OPERATIONS.createEngine({clock});
  let connected=true;
  let r=engine.attempt({kind:'disconnect',target:'frontpanel',
    execute:()=>{connected=false},wasSuccessful:()=>!connected});
  assert.equal(r.category,'necessary','Desmontar equipo inicial puede ser un objetivo');
  r=engine.attempt({kind:'connect',target:'frontpanel',
    execute:()=>{connected=true},wasSuccessful:()=>connected});
  assert.equal(r.category,'necessary','Sin conexión previa registrada, no es retrabajo');
  r=engine.attempt({kind:'disconnect',target:'frontpanel',
    execute:()=>{connected=false},wasSuccessful:()=>!connected});
  assert.equal(r.category,'rework');
  r=engine.attempt({kind:'connect',target:'frontpanel',
    execute:()=>{connected=true},wasSuccessful:()=>connected});
  assert.equal(r.category,'rework');
  assert.equal(engine.getSummary().counts.rework,2);
});
test('fallos, trabajos repetidos y consumibles no alteran reglas técnicas',()=>{
  const clock=PC_TIME.createClock(),engine=PC_OPERATIONS.createEngine({clock});
  const defs=engine.getDefinitions();
  for(const kind of ['fit','screw','connect','inspect','remove','disconnect','apply','route'])
    assert(defs[kind]?.id===kind);
  let routed=false;
  const first=engine.attempt({kind:'route',target:'psu-cables',
    execute:()=>{routed=true},wasSuccessful:()=>routed});
  assert.equal(first.category,'necessary');
  const minutes=clock.getSummary().total;
  const again=engine.attempt({kind:'route',target:'psu-cables',
    execute:()=>{},wasSuccessful:()=>false,getReason:()=> 'Mazos ya asegurados.'});
  assert.equal(again.category,'repeated');
  assert.equal(again.minutes,0);
  assert.equal(clock.getSummary().total,minutes);
  const badApply=engine.attempt({kind:'apply',target:'item:paste',
    execute:()=>{},wasSuccessful:()=>false});
  assert.equal(badApply.category,'rejected');
  assert.equal(clock.getSummary().total,minutes);
});

test('conexión deshecha por incidencia se repara como retrabajo',()=>{
  const clock=PC_TIME.createClock();
  const engine=PC_OPERATIONS.createEngine({clock});
  let connected=false;
  const install=()=>engine.attempt({kind:'connect',target:'sataData',
    execute:()=>{connected=true},wasSuccessful:()=>connected});
  const first=install();
  assert.equal(first.category,'necessary');
  connected=false;
  assert.equal(engine.markUndone('connect','sataData'),true);
  assert.equal(engine.markUndone('connect','sataData'),false);
  const second=install();
  assert.equal(second.category,'rework');
  assert.equal(second.status,'success');
  assert.equal(engine.getSummary().counts.rework,1);
  assert.equal(engine.getSummary().counts.necessary,1);
  assert(clock.getSummary().technical>first.minutes);
});
