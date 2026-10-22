// Zoom de cámara desacoplado de OrbitControls: rueda suave y precisa.
// 1 paso de rueda (100 px normalizados) cambia la distancia objetivo ~5,7%,
// y el movimiento se interpola en varios fotogramas para evitar saltos.
export function createSmoothZoom({camera,controls,element,minDistance=4.5,maxDistance=56}){
  const clamp=(v,lo,hi)=>Math.max(lo,Math.min(hi,v));
  let desired=clamp(camera.position.distanceTo(controls.target),minDistance,maxDistance);
  const pointers=new Set();

  function sync(){
    desired=clamp(camera.position.distanceTo(controls.target),minDistance,maxDistance);
  }
  function step(amount){
    if(!Number.isFinite(amount))return;
    desired=clamp(desired*Math.exp(clamp(amount,-5,5)*.065),minDistance,maxDistance);
  }
  function wheel(event){
    // Captura antes del listener de OrbitControls, cuyo dolly por defecto
    // es discreto. No afecta al scroll del documento fuera del canvas.
    if(event.cancelable)event.preventDefault();
    event.stopImmediatePropagation?.();
    const factor=event.deltaMode===1?16:
      event.deltaMode===2?Math.max(1,element.clientHeight||600):1;
    const pixels=clamp(event.deltaY*factor,-100,100);
    // 100 px de rueda => 5.65% de distancia; trackpad ~1 px => 0.055%.
    desired=clamp(desired*Math.exp(pixels*.00055),minDistance,maxDistance);
  }
  const down=e=>{pointers.add(e.pointerId);if(pointers.size>=2)sync();};
  const up=e=>{pointers.delete(e.pointerId);sync();};
  element.addEventListener('wheel',wheel,{capture:true,passive:false});
  element.addEventListener('pointerdown',down);
  for(const type of ['pointerup','pointercancel','lostpointercapture'])
    element.addEventListener(type,up);

  function update(dt){
    // Dejar el gesto multitáctil nativo a OrbitControls sin luchar por
    // la posición de la cámara. Al terminar se sincroniza el zoom deseado.
    if(pointers.size>=2){sync();return;}
    const from=camera.position.distanceTo(controls.target);
    if(!Number.isFinite(from)||from<=0)return;
    if(Math.abs(from-desired)<.001)return;
    const alpha=1-Math.exp(-11*clamp(dt,0,.05));
    const next=clamp(from+(desired-from)*alpha,minDistance,maxDistance);
    const ray=camera.position.clone().sub(controls.target).normalize();
    camera.position.copy(controls.target).addScaledVector(ray,next);
  }
  return {
    sync,step,update,
    get targetDistance(){return desired;},
    dispose(){
      element.removeEventListener('wheel',wheel,true);
      element.removeEventListener('pointerdown',down);
      for(const type of ['pointerup','pointercancel','lostpointercapture'])
        element.removeEventListener(type,up);
    }
  };
}
