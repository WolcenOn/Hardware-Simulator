// PC Lab 8.11 — CPU: orientación, encaje en zócalo y cierre de palanca.
// Los valores de fuerza son educativos, NO newtons ni pares reales.
(function(root){
'use strict';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const LIMITS=Object.freeze({center:6,lower:90,idealLow:58,idealHigh:74});
const PENALTY_MINUTES=.6;
function oscillatorValue(elapsedMs){
  if(!Number.isFinite(elapsedMs))throw new RangeError('Tiempo de oscilación inválido.');
  const period=2100,phase=((elapsedMs%period)+period)%period/period;
  return Math.round(100*(phase<=.5?phase*2:(1-phase)*2));
}
function createEngine({seed='taller'}={}){
  if(!root.PC_MISHAPS?.createSeededRandom)
    throw new Error('Generador de semilla requerido.');
  const random=root.PC_MISHAPS.createSeededRandom(String(seed)+'|cpu-precision');
  let serial=0;
  function begin({target,socket}={}){
    if(!String(target||'').startsWith('cpu:')||!String(socket||'').trim())
      throw new TypeError('CPU y zócalo compatibles obligatorios.');
    const id=++serial,initialRotation=Math.floor(random()*4)*90;
    const initialX=Math.round(random()*56)-28,initialY=Math.round(random()*56)-28;
    let rotation=initialRotation,x=initialX,y=initialY,lower=0,stage='align',force=null;
    const attempts=[];
    const getState=()=>({id,target,socket,stage,rotation,initialRotation,
      x,y,initialX,initialY,lower,force,
      attempts:attempts.map(a=>({...a}))});
    function record(step,code,message,ok=false,capturedForce=null){
      const item={step,code,ok,rotation,x,y,lower,force:capturedForce,
        penaltyMinutes:ok?0:PENALTY_MINUTES};
      attempts.push(item);
      return Object.freeze({...item,message});
    }
    return Object.freeze({
      getState,
      rotate(){if(stage!=='align')return false;rotation=(rotation+90)%360;return rotation;},
      move(nx,ny){
        if(stage!=='align'||!Number.isFinite(nx)||!Number.isFinite(ny))return false;
        x=clamp(Math.round(nx),-30,30);y=clamp(Math.round(ny),-30,30);return true;
      },
      setLower(value){
        if(stage!=='align'||!Number.isFinite(Number(value)))return false;
        lower=clamp(Math.round(Number(value)),0,100);return true;
      },
      present(){
        if(stage!=='align')return null;
        if(rotation!==0)return record('present','wrong_rotation',
          'La marca triangular no coincide. Gira el procesador 90°.');
        if(Math.hypot(x,y)>LIMITS.center)return record('present','misaligned',
          'El procesador no está centrado sobre el zócalo. Alinea ambos bordes.');
        if(lower<LIMITS.lower)return record('present','too_high',
          'Baja suavemente el procesador hasta apoyarlo, sin empujar los contactos.');
        stage='lever';
        return Object.freeze({step:'present',code:'presented',ok:true,
          penaltyMinutes:0,message:'CPU apoyada: cierra la palanca en la zona verde.'});
      },
      capture(value){
        if(stage!=='lever'||!Number.isFinite(value))return null;
        force=clamp(Math.round(value),0,100);
        if(force<LIMITS.idealLow)return record('lever','insufficient_force',
          'Falta completar el cierre de la palanca; vuelve a intentarlo.',false,force);
        if(force>LIMITS.idealHigh)return record('lever','excessive_force',
          'Demasiada fuerza simulada. Suelta y vuelve a intentarlo.',false,force);
        stage='complete';
        return record('lever','locked',
          'Palanca cerrada, CPU centrada y zócalo asegurado.',true,force);
      }
    });
  }
  return Object.freeze({begin});
}
root.PC_CPU_PRECISION=Object.freeze({LIMITS,PENALTY_MINUTES,oscillatorValue,createEngine});
})(typeof window!=='undefined'?window:globalThis);
