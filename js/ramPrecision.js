// Prototipo optativo de precisión RAM. Presiones normalizadas 0..100,
// no equivalen a newtons ni indican fuerza física recomendada.
(function(root){
'use strict';
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const PENALTY_MINUTES=.8;
const OSCILLATORS=Object.freeze({
  left:Object.freeze({periodMs:1800,offsetMs:0}),
  right:Object.freeze({periodMs:2200,offsetMs:450})
});
// Triángulo temporal rojo → verde → rojo. Solo animación/entrada;
// el reloj de taller sigue siendo virtual y se contabiliza por intentos.
function oscillatorValue(elapsedMs,side){
  const cfg=OSCILLATORS[side];
  if(!cfg)throw new RangeError('Extremo DIMM desconocido.');
  if(!Number.isFinite(elapsedMs))throw new RangeError('Tiempo de oscilación no válido.');
  const period=cfg.periodMs;
  const phase=((elapsedMs+cfg.offsetMs)%period+period)%period/period;
  return Math.round((phase<=.5?phase*2:(1-phase)*2)*100);
}

const LIMITS=Object.freeze({alignment:8,approach:90,idealLow:58,
  idealHigh:74,idealBalance:8,mediumLow:45,mediumHigh:85,mediumBalance:22});
function createEngine({seed='ram-practice'}={}){
  if(!root.PC_MISHAPS?.createSeededRandom)
    throw new Error('Se requiere el generador de semillas del simulador.');
  // Flujo independiente de las incidencias generales: la práctica nunca
  // modifica el orden de los sorteos ESD/SATA del encargo.
  const random=root.PC_MISHAPS.createSeededRandom(String(seed)+'|ram-precision');
  let count=0;
  function begin(){
    const id=++count,initialReversed=random()<.5;
    let reversed=initialReversed,alignment=Math.round(random()*56)-28,
      approachDistance=0,stage='align',left=50,right=50;
    const attempts=[];
    const snapshot=()=>({id,stage,reversed,initialReversed,alignment,
      approach:approachDistance,left,right,
      attempts:attempts.map(x=>({...x}))});
    function record(step,code,message,probability=null,ok=false){
      const item={step,code,ok,alignment,reversed,approach:approachDistance,
        left,right,probability,penaltyMinutes:ok?0:PENALTY_MINUTES};
      attempts.push(item);
      return Object.freeze({...item,message});
    }
    return Object.freeze({
      getState:snapshot,
      flip(){if(stage!=='align')return false;reversed=!reversed;return true;},
      setAlignment(v){
        if(stage!=='align'||!Number.isFinite(Number(v)))return false;
        alignment=clamp(Math.round(Number(v)),-30,30);return true;
      },
      setApproach(v){
        if(stage!=='align'||!Number.isFinite(Number(v)))return false;
        approachDistance=clamp(Math.round(Number(v)),0,100);return true;
      },
      present(){
        if(stage!=='align')return null;
        if(reversed)return record('present','wrong_orientation',
          'La muesca está invertida. Gira la RAM antes de acercarla.');
        if(Math.abs(alignment)>LIMITS.alignment)return record('present','misaligned',
          'La RAM está desplazada: centra la muesca sobre la ranura.');
        if(approachDistance<LIMITS.approach)return record('present','too_far',
          'Acerca más la RAM a la ranura, sin aplicar fuerza todavía.');
        stage='pressure';
        return Object.freeze({ok:true,step:'present',code:'aligned',
          message:'Muesca alineada: reparte la presión en los dos extremos.',
          penaltyMinutes:0});
      },
      setPressure(side,value){
        if(stage!=='pressure'||!['left','right'].includes(side)||
          !Number.isFinite(Number(value)))return false;
        if(side==='left')left=clamp(Math.round(Number(value)),0,100);
        else right=clamp(Math.round(Number(value)),0,100);
        return true;
      },
      press(){
        if(stage!=='pressure')return null;
        const delta=Math.abs(left-right);
        if(left<LIMITS.mediumLow||right<LIMITS.mediumLow)
          return record('press','too_weak','Presión insuficiente: ambos cierres siguen sueltos.');
        if(left>LIMITS.mediumHigh||right>LIMITS.mediumHigh)
          return record('press','too_strong','Presión excesiva. Detente y ajusta antes de continuar.');
        if(delta>LIMITS.mediumBalance)
          return record('press','unbalanced','Los extremos están muy desequilibrados; iguala la presión.');
        const ideal=left>=LIMITS.idealLow&&left<=LIMITS.idealHigh&&
          right>=LIMITS.idealLow&&right<=LIMITS.idealHigh&&
          delta<=LIMITS.idealBalance;
        const deviation=(Math.abs(left-66)+Math.abs(right-66))/40+
          delta/28;
        const chance=ideal?1:Math.round(clamp(.75-deviation*.45,.2,.75)*100)/100;
        if(!ideal&&random()>=chance)return record('press','partial_seat',
          'Encaje incompleto: corrige la presión y vuelve a intentar.',chance);
        stage='complete';
        return record('press',ideal?'perfect_seat':'medium_seat',
          ideal?'Las dos pestañas DIMM han encajado de forma uniforme.':
            'Ambas pestañas han encajado; comprueba el asentamiento.',chance,true);
      }
    });
  }
  return Object.freeze({begin});
}
root.PC_RAM_PRECISION=Object.freeze({LIMITS,PENALTY_MINUTES,OSCILLATORS,oscillatorValue,createEngine});
})(typeof window!=='undefined'?window:globalThis);
