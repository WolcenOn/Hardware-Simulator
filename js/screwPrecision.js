// PC Lab 8.10-alpha — minijuego determinista de roscado de una fijación.
(function(root){
'use strict';
const clamp=(v,lo,hi)=>Math.max(lo,Math.min(hi,v));
const TOLERANCE=7; // Distancia 2D didáctica; no es una tolerancia física en mm.
const DEPTH_STEP=10; // Profundidad simulada por muesca de rueda.
const MISSED_TURN_MINUTES=.2;
function createEngine({seed='taller'}={}){
  if(!root.PC_MISHAPS?.createSeededRandom)
    throw new Error('Generador de semilla requerido.');
  const random=root.PC_MISHAPS.createSeededRandom(String(seed)+'|screw-precision');
  let serial=0;
  function begin(target){
    if(!target||typeof target!=='string')throw new TypeError('Pieza a fijar obligatoria.');
    const id=++serial;
    // Iniciar fuera del agujero, alternando posiciones reproducibles.
    let startX=Math.round(12+random()*76);
    const startY=Math.round(12+random()*76);
    if(Math.hypot(startX-50,startY-50)<=TOLERANCE)
      startX=startX<50?20:80;
    let x=startX,y=startY,depth=0,turns=0,missed=0,stage='active';
    const history=[];
    const aligned=()=>Math.hypot(x-50,y-50)<=TOLERANCE;
    const snapshot=()=>({id,target,stage,x,y,startX,startY,depth,
      turns,missed,aligned:aligned(),tolerance:TOLERANCE,
      history:history.map(a=>({...a}))});
    return Object.freeze({
      getState:snapshot,
      move(xNext,yNext){
        if(stage!=='active'||!Number.isFinite(xNext)||!Number.isFinite(yNext))
          return false;
        x=clamp(Math.round(xNext),0,100);y=clamp(Math.round(yNext),0,100);
        return true;
      },
      turn(direction=1){
        if(stage!=='active')return null;
        if(direction!==1&&direction!==-1)throw new RangeError('Giro desconocido.');
        const engaged=aligned();
        const before=depth;
        let code,penaltyMinutes=0;
        if(!engaged){
          missed++;code='not_engaged';penaltyMinutes=MISSED_TURN_MINUTES;
        }else if(direction===-1){
          depth=clamp(depth-DEPTH_STEP,0,100);code='unscrewing';
        }else{
          depth=clamp(depth+DEPTH_STEP,0,100);code='threading';
        }
        turns++;
        if(depth===100){code='seated';stage='complete';}
        const result=Object.freeze({step:'screw',target,code,aligned:engaged,
          direction,depthBefore:before,depth,complete:stage==='complete',
          penaltyMinutes,turn:turns});
        history.push(result);
        return result;
      }
    });
  }
  return Object.freeze({begin});
}
root.PC_SCREW_PRECISION=Object.freeze({
  TOLERANCE,DEPTH_STEP,MISSED_TURN_MINUTES,createEngine
});
})(typeof window!=='undefined'?window:globalThis);
