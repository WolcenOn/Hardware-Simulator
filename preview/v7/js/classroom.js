// Casos docentes y diagnósticos eléctricos — datos 100 % locales.
// Formato versionado, con validación estricta; nunca se evalúa código de JSON.
(function(root){
'use strict';
const CASE_SCHEMA='pc-lab.teacher-case.v1';
const BUILD_SCHEMA='pc-lab.build.v1';
const isObj=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
const text=(x,max=400)=>typeof x==='string'?x.trim().slice(0,max):'';
function normalizeCase(raw){
  const c=isObj(raw)&&isObj(raw.case)?raw.case:raw;
  if(!isObj(c)||typeof c.title!=='string'||typeof c.story!=='string')
    throw new Error('El caso necesita título y enunciado en texto.');
  const title=text(c.title,100),story=text(c.story,1600),
    client=text(c.client||'Profesorado',100);
  if(!title||!story)throw new Error('Título y enunciado no pueden estar vacíos.');
  const budget=Number(c.budget);
  if(!Number.isInteger(budget)||budget<100||budget>10000)
    throw new Error('Presupuesto obligatorio entre 100 y 10.000 €.');
  const req=isObj(c.requirements)?c.requirements:{};
  const minRam=Number(req.minRam??c.minRam??16);
  if(![8,16,32,64].includes(minRam))throw new Error('RAM mínima: 8, 16, 32 o 64 GB.');
  const minStorage=String(req.minStorage??c.minStorage??'ssd');
  if(!['ssd','nvme','any'].includes(minStorage))
    throw new Error('Almacenamiento: ssd, nvme o any.');
  const gpu=req.gpu===true||c.gpu===true;
  const maxTemp=Number(req.maxTemp??c.maxTemp??90);
  if(!Number.isInteger(maxTemp)||maxTemp<60||maxTemp>100)
    throw new Error('Temperatura máxima entre 60 y 100 °C.');
  return {title,client,story,budget,minRam,minStorage,gpu,maxTemp,
    goals:['Entrega con sistema operativo','Presupuesto '+budget+' €',
      minRam+' GB de RAM mínimo',
      minStorage==='nvme'?'SSD NVMe obligatorio':minStorage==='ssd'?'Unidad SSD obligatoria':'Disco instalado',
      gpu?'GPU dedicada requerida':'Gráfica integrada o dedicada']};
}
function parseCases(input){
  if(typeof input!=='string'||input.length>250000)
    throw new Error('El JSON del caso es demasiado grande o no es texto.');
  let value;try{value=JSON.parse(input)}catch{throw new Error('JSON mal formado.');}
  if(!isObj(value))throw new Error('Se esperaba un objeto JSON.');
  if(value.schema&&value.schema!==CASE_SCHEMA)
    throw new Error('Esquema de caso desconocido: '+text(value.schema));
  const list=Array.isArray(value.cases)?value.cases:
    (value.case?[value.case]:[value]);
  if(!list.length||list.length>20)throw new Error('Importa entre 1 y 20 casos.');
  return list.map(normalizeCase);
}
function caseDocument(c){
  const normalized=normalizeCase(c);
  return {schema:CASE_SCHEMA,version:1,case:{
    title:normalized.title,client:normalized.client,story:normalized.story,
    budget:normalized.budget,requirements:{minRam:normalized.minRam,
      minStorage:normalized.minStorage,gpu:normalized.gpu,
      maxTemp:normalized.maxTemp}}};
}
function buildDocument(state,config={}){
  const installed=Object.fromEntries(Object.entries(state.installed||{})
    .filter(([,v])=>typeof v==='boolean').map(([k,v])=>[k,v]));
  const selected={};for(const key of ['motherboard','cpu','ram','storage','gpu',
    'psu','cooler','caseVariant'])selected[key]=String(state.selected?.[key]||'');
  const flags={};for(const key of ['ramSeated','eps','atx24','frontPanel','frontUsb3',
    'frontUsbC','sataData','sataPower','cpuFan','gpuPower','monitorCable',
    'keyboardConnected','mouseConnected','caseClosed'])flags[key]=!!state[key];
  flags.paste=Number(state.paste)||0;
  return {schema:BUILD_SCHEMA,version:1,createdAt:new Date().toISOString(),
    description:'Montaje educativo exportado; no modifica hardware real.',
    case:config.case||null,components:{selected,installed,fixings:{...(state.fixings||{})},
      names:config.names||{}},connections:flags,bios:{...(state.biosCfg||{})},
    operatingSystem:state.installedOs?{...state.installedOs}:null,
    power:{...(config.power||{})},spent:config.spent??null,
    caseReport:config.caseReport||null};
}
function diagnose(state,watts,maxWatts){
  const rated=Number(maxWatts)||0,peak=Math.round(Number(watts)||0);
  const recommended=Math.ceil(peak*1.25),margin=rated-peak;
  const issues=[];
  if(!state.installed?.psu||!rated)issues.push({code:'NO_PSU',severity:'fatal',
    text:'No hay fuente de alimentación instalada.'});
  else if(peak>rated)issues.push({code:'PSU_OVERLOAD',severity:'trip',
    text:'Sobrecarga: '+peak+' W previstos superan los '+rated+' W de la fuente.'});
  else if(recommended>rated)issues.push({code:'PSU_LOW_MARGIN',severity:'warning',
    text:'Margen reducido: '+peak+' W de pico, recomendado '+recommended+' W; fuente '+rated+' W.'});
  if(state.installed?.cpu&&state.installed?.cooler&&Number(state.paste)<.7)
    issues.push({code:'THERMAL_PASTE',severity:'trip',
      text:'Falta pasta térmica: el procesador alcanza una temperatura crítica.'});
  if(state.installed?.cpu&&(!state.installed?.cooler||!state.cpuFan))
    issues.push({code:'CPU_COOLING',severity:'trip',
      text:'Disipación de CPU insuficiente o CPU_FAN desconectado.'});
  for(const key of ['motherboard','gpu','cooler','storage','psu']){
    if(state.installed?.[key]&&!state.fixings?.[key])
      issues.push({code:'LOOSE_'+key.toUpperCase(),severity:'mechanical',
        component:key,text:'La pieza '+key+' está colocada pero sin tornillos.'});
  }
  return {peak,rated,recommended,margin,ratio:rated?Math.round(peak/rated*100):0,
    issues,trip:issues.find(x=>x.severity==='trip'||x.severity==='fatal')||null,
    mechanical:issues.find(x=>x.severity==='mechanical')||null};
}
root.PC_CLASSROOM=Object.freeze({CASE_SCHEMA,BUILD_SCHEMA,
  normalizeCase,parseCases,caseDocument,buildDocument,diagnose});
})(typeof window!=='undefined'?window:globalThis);
