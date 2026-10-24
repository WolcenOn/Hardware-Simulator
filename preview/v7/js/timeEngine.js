// PC Lab — reloj de trabajo simulado. No depende de Date.now ni del frame rate.
// Valores de duración educativos/configurables; no representan estadísticas reales.
(function(root){
'use strict';
const SPEEDS=Object.freeze({
  careful:Object.freeze({label:'Cuidadosa',factor:1.4}),
  normal:Object.freeze({label:'Normal',factor:1}),
  fast:Object.freeze({label:'Rápida',factor:.7})
});
const round=n=>Math.round((n+Number.EPSILON)*10)/10;
function duration(base,speed='normal',difficulty=1,experience=0){
  if(!Number.isFinite(base)||base<0)throw new RangeError('Duración base inválida.');
  if(!SPEEDS[speed])throw new RangeError('Velocidad desconocida.');
  if(!Number.isFinite(difficulty)||difficulty<1||difficulty>5)
    throw new RangeError('Dificultad fuera de rango 1..5.');
  if(!Number.isFinite(experience)||experience<0||experience>100)
    throw new RangeError('Experiencia fuera de rango 0..100.');
  // Reducir como mucho 15 % con experiencia; no es un sistema de riesgos.
  return round(base*SPEEDS[speed].factor*(1+(difficulty-1)*.10)*
    (1-Math.min(15,experience*.15)/100));
}
function createClock(){
  const totals={technical:0,customer:0,waiting:0};
  let speed='normal';
  const entries=[];
  return Object.freeze({
    getSpeed:()=>speed,
    setSpeed(next){if(!SPEEDS[next])throw new RangeError('Velocidad inválida');
      speed=next;return speed;},
    add(category,minutes,ref=''){
      if(!Object.hasOwn(totals,category))throw new RangeError('Categoría temporal inválida');
      if(!Number.isFinite(minutes)||minutes<0)throw new RangeError('Tiempo negativo/incorrecto');
      const value=round(minutes);
      totals[category]=round(totals[category]+value);
      entries.push({category,minutes:value,ref:String(ref)});
      return value;
    },
    calculate:(base,difficulty=1,experience=0)=>duration(base,speed,difficulty,experience),
    getSummary:()=>({...totals,total:round(totals.technical+totals.customer+totals.waiting),
      speed,entries:entries.map(x=>({...x}))})
  });
}
root.PC_TIME=Object.freeze({SPEEDS,duration,createClock});
})(typeof window!=='undefined'?window:globalThis);
