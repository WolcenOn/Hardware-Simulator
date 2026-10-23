// Torre ATX procedural basada en el reparto interno del Corsair 4000D Airflow.
// Sistema local de montaje: X=trasera→frontal, Z=superior→inferior, Y=fondo→cristal.
// Se transforma a vertical en procedural3d.js con rotation.x=Math.PI/2.
// La silueta y cotas son didácticas, no una réplica del diseño industrial de Corsair.
export const TOWER_CASE_MM={depth:453,width:230,height:466,maxGpu:360,maxCooler:170};
export function createATXTower(THREE,parent,materials){
  const tower=new THREE.Group();tower.name='Torre ATX 4000D - distribución';parent.add(tower);
  const steel=new THREE.MeshStandardMaterial({color:0x232d38,roughness:.52,metalness:.63});
  const panel=new THREE.MeshStandardMaterial({color:0x354450,roughness:.49,metalness:.6});
  const mesh=new THREE.MeshStandardMaterial({color:0x596d78,roughness:.60,metalness:.35});
  const cageMaterial=new THREE.MeshStandardMaterial({color:0x18222d,roughness:.6,metalness:.55});
  const glass=new THREE.MeshPhysicalMaterial({color:0xa4c4cb,transparent:true,opacity:.14,
    roughness:.17,metalness:0,depthWrite:false,side:THREE.DoubleSide});
  const add=(parent,size,position,mat=steel)=>{
    const item=new THREE.Mesh(new THREE.BoxGeometry(...size),mat);
    item.position.set(...position);item.castShadow=true;item.receiveShadow=true;
    parent.add(item);return item;
  };
  // Exterior aproximado: 453 profundidad, 230 anchura, 466 altura, 50mm/u.
  const rear=-4.0,front=5.06,back=-.72,side=3.88,top=-3.32,bottom=6.0;
  // Bastidor, suelo, techo y cuatro columnas.
  add(tower,[9.06,4.60,.11],[.53,1.58,bottom],steel);
  add(tower,[9.06,4.60,.10],[.53,1.58,top],steel);
  for(const x of [rear,front])for(const y of [back,side]){
    add(tower,[.14,.14,9.32],[x,y,1.34],steel);
    add(tower,[.16,4.60,.12],[x,1.58,top],panel);
    add(tower,[.16,4.60,.12],[x,1.58,bottom],panel);
  }
  // Bandeja que realmente sostiene la motherboard detrás del socket.
  add(tower,[5.75,.12,6.64],[-1.18,-.47,-.01],panel);
  for(let x of [-3.30,1.08])for(let z of [-2.66,2.69]){
    const fastener=new THREE.Mesh(new THREE.CylinderGeometry(.075,.075,.12,10),mesh);
    fastener.rotation.x=Math.PI/2;fastener.position.set(x,-.30,z);
    tower.add(fastener);
  }
  // Pasacables y canal posterior (la canaleta queda detrás de la placa).
  add(tower,[.24,.23,6.35],[1.63,-.48,.0],cageMaterial);
  for(const z of [-2.25,-.65,.85,2.2])
    add(tower,[.60,.06,.20],[1.64,-.30,z],mesh);
  // Separador de cámara PSU: shroud inferior cubre disco/fuente sin tapar
  // por completo la inspección. Material semitransparente en el lado acristalado.
  add(tower,[8.80,4.35,.14],[.52,1.57,3.40],steel);
  const shroudFront=new THREE.MeshStandardMaterial({
    color:0x101921,transparent:true,opacity:.69,roughness:.65,depthWrite:false});
  add(tower,[8.84,.10,2.46],[.53,3.34,4.68],shroudFront);
  // Fondo trasero y frente perforado. Evitar pared sólida sobre hardware.
  add(tower,[.12,4.60,2.45],[rear,1.58,4.70],panel);
  for(let i=0;i<18;i++){
    const z=-2.98+i*.47;
    add(tower,[.045,.038,.16],[front,1.64,z],mesh);
    for(const y of [.28,1.06,1.84,2.62,3.4])
      add(tower,[.042,.21,.028],[front,y,z],cageMaterial);
  }
  // Bastidor de ventiladores delante (+X) y trasero (-X).
  for(const z of [-2.05,.45,2.75]){
    add(tower,[.09,2.47,.11],[4.90,1.65,z-1.18],panel);
    add(tower,[.09,2.47,.11],[4.90,1.65,z+1.18],panel);
  }
  add(tower,[.09,2.49,2.49],[rear+.14,1.65,-1.25],cageMaterial);
  // SSD SATA 2.5" detrás de la bandeja de placa, no en la jaula HDD.
  const rearSSD=new THREE.Group();rearSSD.name='Soportes SSD traseros';
  rearSSD.position.set(-.30,-.67,.65);tower.add(rearSSD);
  for(const x of [-.84,.84])add(rearSSD,[.10,.15,1.55],[x,0,0],mesh);
  add(rearSSD,[1.82,.08,1.46],[0,-.04,0],cageMaterial);
  // Jaula HDD 3.5" bajo la cubierta, hacia el frontal y junto a la PSU.
  const hddCage=new THREE.Group();hddCage.name='Jaula HDD 3.5';tower.add(hddCage);
  hddCage.position.set(3.04,1.02,4.72);
  for(const x of [-1.64,1.64])add(hddCage,[.10,2.13,2.43],[x,0,0],panel);
  for(const z of [-1.00,.98])add(hddCage,[3.35,2.12,.08],[0,0,z],cageMaterial);
  for(const y of [-.68,.72])add(hddCage,[3.40,.08,2.32],[0,y,0],panel);
  // PSU inferior trasera, soporte para fijarla a la pared trasera.
  const psuSeat=new THREE.Group();psuSeat.name='Soporte PSU';tower.add(psuSeat);
  psuSeat.position.set(-2.45,1.24,4.73);
  add(psuSeat,[3.3,.12,2.12],[0,-1.12,0],steel);
  for(const y of [-.90,.92])add(psuSeat,[3.26,.11,2.12],[0,y,0],cageMaterial);

  // Cristal lateral: la bisagra es paralela a la altura vertical (eje Z local).
  const hinge=new THREE.Group();hinge.name='Puerta lateral de cristal';
  hinge.position.set(rear,side,top);tower.add(hinge);
  add(hinge,[8.93,.055,9.10],[4.48,.0,4.57],glass);
  for(const z of [.09,9.08])add(hinge,[8.94,.09,.11],[4.49,0,z],panel);
  for(const x of [.06,8.88])add(hinge,[.10,.10,9.12],[x,0,4.56],panel);
  const closed=0,open=1.25;
  const rgbMaterial=new THREE.MeshStandardMaterial({
    color:0x16d7fc,emissive:0x13baff,emissiveIntensity:1.55,
    roughness:.25,metalness:.18
  });
  const rgbGroup=new THREE.Group();rgbGroup.name='Tira LED ARGB';tower.add(rgbGroup);
  // Dos tiras fijadas al marco frontal, sin interferir con el panel.
  for(const y of [.13,4.45]){
    const bar=new THREE.Mesh(new THREE.BoxGeometry(.055,.045,8.72),rgbMaterial);
    bar.position.set(4.79,y,1.31);rgbGroup.add(bar);
  }
  const rgbLight=new THREE.PointLight(0x23baff,.9,8.5);
  rgbLight.position.set(3.75,1.9,.1);rgbGroup.add(rgbLight);
  function setFinish(variant){
    const palette={
      tower:[0x232d38,0x354450,0x596d78],
      towerWhite:[0xc0cbd5,0xe8eff5,0xb4c6d3],
      towerGraphite:[0x566570,0x74828c,0x8a9faa]
    };
    const colors=palette[variant]||palette.tower;
    steel.color.setHex(colors[0]);panel.color.setHex(colors[1]);mesh.color.setHex(colors[2]);
  }
  function sync(installed,closedState){
    tower.visible=!!installed;
    hinge.rotation.z=closedState?closed:open;
  }
  sync(false,false);
  function setRgb(enabled){rgbGroup.visible=!!enabled;}
  setRgb(false);
  return {root:tower,sync,setFinish,setRgb,hinge,rearSSD,hddCage,psuSeat,
    bounds:{rear,front,back,side,top,bottom},sizeMM:TOWER_CASE_MM};
}
