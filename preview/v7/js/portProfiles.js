// Perfiles normalizados de USB-A, HDMI y DisplayPort (1 unidad = 50 mm).
// Un único contorno se extruye como clavija macho o como hembra hueca.
export const REAR_PORT_SPECS=Object.freeze({
  usbA:{width:.240,height:.092,depth:.25},
  hdmi:{width:.280,height:.094,depth:.24},
  displayPort:{width:.316,height:.096,depth:.24}
});
export function portOutline(kind,scale=1){
  const p=REAR_PORT_SPECS[kind];
  if(!p)throw new RangeError('Tipo de puerto desconocido: '+kind);
  const x=p.width/2*scale,y=p.height/2*scale;
  if(kind==='hdmi')return [[-x*.81,-y],[-x,y*.65],[-x*.82,y],[x*.82,y],[x,y*.65],[x*.81,-y]];
  if(kind==='displayPort')return [[-x,-y],[-x,y*.20],[-x*.68,y],[x,y],[x,-y]];
  return [[-x,-y],[-x,y],[x,y],[x,-y]];
}
export function portShape(THREE,kind){
  const pts=portOutline(kind);
  const s=new THREE.Shape();
  pts.forEach(([x,y],i)=>i?s.lineTo(x,y):s.moveTo(x,y));
  s.closePath();return s;
}
export function portBezelGeometry(THREE,kind,depth=.08){
  const s=portShape(THREE,kind);
  const inner=portOutline(kind,.80).reverse();
  const hole=new THREE.Path();
  inner.forEach(([x,y],i)=>i?hole.lineTo(x,y):hole.moveTo(x,y));
  hole.closePath();s.holes.push(hole);
  return new THREE.ExtrudeGeometry(s,{depth,bevelEnabled:false,curveSegments:12});
}
// Los conectores del taller se dibujan en WORLD pero los receptáculos
// viven en la raíz de la torre, girada 90° sobre X. Corregimos ambos ejes
// (inserción y 'roll'): la cara ancha del macho debe casar con la hembra.
export function alignRearPlug(THREE,plug,towerRoot){
  towerRoot.updateMatrixWorld(true);
  const insert=new THREE.Quaternion().setFromUnitVectors(
    new THREE.Vector3(0,1,0),new THREE.Vector3(-1,0,0));
  const roll=new THREE.Quaternion().setFromAxisAngle(
    new THREE.Vector3(0,1,0),Math.PI/2);
  plug.quaternion.copy(towerRoot.getWorldQuaternion(new THREE.Quaternion()))
    .multiply(insert).multiply(roll);
}
