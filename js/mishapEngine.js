// PC Lab — simulación educativa de incidencias, determinista e inyectable.
// Probabilidades ficticias, nunca estadísticas de fallos reales.
(function(root){
'use strict';
const CATEGORIES=Object.freeze(['mechanical','esd','electrical','procedure']);
const DEFAULT_RATES=Object.freeze({
  mechanical:0.022,esd:0.018,electrical:0.012,procedure:0.025
});
const OPERATION_RISKS=Object.freeze({
 fit:['mechanical','esd','procedure'],screw:['mechanical','esd','procedure'],
 connect:['electrical','procedure'],disconnect:['electrical','procedure'],
 remove:['mechanical','esd','procedure'],apply:['procedure'],
 route:['mechanical','procedure'],inspect:['procedure']
});
const SPEED_FACTOR=Object.freeze({careful:.60,normal:1,fast:1.8});
/* Tasas ficticias de un simulador, NO estadísticas del mundo real.
   Componentes más delicados = probabilidad inicial mayor.
   Con pulsera bien conectada la tasa se reduce exactamente diez veces. */
const COMPONENT_ESD=Object.freeze({ram:.20,cpu:.18,motherboard:.15,gpu:.12,storage:.10});
function componentEsdRisk(part,protectedByWristband=false){
  const type=String(part||'').split(':')[0];
  const base=COMPONENT_ESD[type]||0;
  return Math.round(base*(protectedByWristband?.1:1)*10000)/10000;
}

function createSeededRandom(seed){
  if(typeof seed!=='string'&&typeof seed!=='number')
    throw new TypeError('La semilla debe ser un texto o número.');
  const str=String(seed);
  if(!str||str.length>80)throw new RangeError('Semilla vacía o demasiado larga.');
  let hash=2166136261;
  for(let i=0;i<str.length;i++){
    hash=Math.imul(hash^str.charCodeAt(i),16777619);
  }
  let state=hash>>>0;
  return function(){
    state=(state+0x6D2B79F5)>>>0;
    let t=state;
    t=Math.imul(t^(t>>>15),t|1);
    t^=t+Math.imul(t^(t>>>7),t|61);
    return ((t^(t>>>14))>>>0)/4294967296;
  };
}
const rounded=n=>Math.round(n*100000)/100000;
function calculateRisks({kind,speed='normal',difficulty=1,experience=0,
 tools={},esd={},powered=false,environment={},rates=DEFAULT_RATES}={}){
  if(!OPERATION_RISKS[kind])throw new RangeError('Operación desconocida');
  if(!SPEED_FACTOR[speed])throw new RangeError('Velocidad desconocida');
  if(!Number.isFinite(difficulty)||difficulty<1||difficulty>5)
    throw new RangeError('Dificultad inválida');
  if(!Number.isFinite(experience)||experience<0||experience>100)
    throw new RangeError('Experiencia inválida');
  const values={};
  const speedFactor=SPEED_FACTOR[speed];
  const skillFactor=1-.55*(experience/100);
  const difficultyFactor=1+.18*(difficulty-1);
  for(const category of CATEGORIES){
    const base=Number(rates[category]??0);
    if(!Number.isFinite(base)||base<0||base>1)
      throw new RangeError('Probabilidad inválida: '+category);
    if(!OPERATION_RISKS[kind].includes(category)){values[category]=0;continue;}
    let factor=speedFactor*skillFactor*difficultyFactor;
    if(category==='esd'){
      // Pulsera solamente protege ESD, nunca impactos ni descuidos.
      factor*=esd.worn===true&&esd.grounded===true?.10:1;
      if(environment.dry===true)factor*=1.6;
    }
    if(category==='mechanical'){
      if(tools.adequate===false)factor*=1.45;
      if(environment.cramped===true)factor*=1.35;
    }
    if(category==='electrical'){
      if(powered===true)factor*=2.3;
      if(environment.wet===true)factor*=1.4;
    }
    if(category==='procedure'&&tools.adequate===false)factor*=1.25;
    values[category]=rounded(Math.min(.9,base*factor));
  }
  return Object.freeze(values);
}
function createEngine({seed='workshop-1',random=null,rates=DEFAULT_RATES}={}){
  const next=random||createSeededRandom(seed);
  if(typeof next!=='function')throw new TypeError('Generador aleatorio inválido.');
  // Validación anticipada: rechazar configuraciones de tasas negativas.
  for(const category of CATEGORIES){
    const v=Number(rates[category]??0);
    if(!Number.isFinite(v)||v<0||v>1)throw new RangeError('Tasa inválida');
  }
  let draws=0;
  const roll=()=>{
    const v=next();if(typeof v!=='number'||!Number.isFinite(v)||v<0||v>=1)
      throw new RangeError('El RNG debe devolver un número en [0, 1).');
    draws++;return v;
  };
  function assess(context){
    const chances=calculateRisks({...context,rates});
    // Una sola incidencia por operación. Primero se validan los resultados
    // técnicos fuera de este motor; ningún intento rechazado llega aquí.
    for(const category of CATEGORIES){
      if(chances[category]===0)continue;
      if(roll()>=chances[category])continue;
      const resultRoll=roll();
      // Solo la conexión SATA de datos admite este primer fallo físico
      // procedimental. Se conserva el comportamiento de las demás operaciones.
      const sataProcedure=category==='procedure'&&context.kind==='connect'&&
        context.target==='sataData';
      const looseSata=sataProcedure&&resultRoll>=.94;
      // El resultado latente se decide aquí: encender nunca consume RNG.
      const latentSata=sataProcedure&&resultRoll>=.90&&resultRoll<.94;
      const outcome=looseSata?'loose_sata':latentSata?'latent_sata':
        resultRoll<.78?'delay':'review';
      return Object.freeze({
        category,outcome,code:looseSata?'PROCEDURE_LOOSE_SATA':
          latentSata?'PROCEDURE_LATENT_SATA':
          category.toUpperCase()+'_'+outcome.toUpperCase(),
        delayMinutes:looseSata||latentSata?0:outcome==='delay'?1.5:3,
        description:looseSata?
          'El cable SATA de datos ha quedado suelto. Diagnostica y reconecta con el PC apagado.':
          latentSata?'Incidencia latente: verifica el arranque y diagnostica el almacenamiento.':
          outcome==='delay'?'Incidencia menor: retraso de trabajo simulado.':
          'Posible incidencia: requiere inspección de seguridad antes de entregar.',
        probability:chances[category],seed:String(seed)
      });
    }
    return null;
  }
  return Object.freeze({assess,getDrawCount:()=>draws,seed:String(seed)});
}
root.PC_MISHAPS=Object.freeze({CATEGORIES,OPERATION_RISKS,DEFAULT_RATES,
 SPEED_FACTOR,COMPONENT_ESD,componentEsdRisk,createSeededRandom,calculateRisks,createEngine});
})(typeof window!=='undefined'?window:globalThis);
