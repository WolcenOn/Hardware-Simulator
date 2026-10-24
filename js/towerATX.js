import {createInternalHeader3d} from './connectors3d.js?v=8-4-9-routed-cables';
// Torre ATX procedural basada en el reparto interno del Corsair 4000D Airflow.
// Sistema local de montaje: X=trasera→frontal, Z=superior→inferior, Y=fondo→cristal.
// Se transforma a vertical en procedural3d.js con rotation.x=Math.PI/2.
// La silueta y cotas son didácticas, no una réplica del diseño industrial de Corsair.
import { BOARD_LAYOUTS, MOTHERBOARD_MOUNT, getMotherboardMountPoints, REAR_CASE_FAN_Y, FRONT_IO_LAYOUT,
  HDD_BAY_LAYOUT,getHddBayPosition } from './partsRealScale.js?v=8-4-10-hdd-bay';
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
  // Separadores hexagonales M3 perpendiculares a la placa y apoyados
  // sobre la bandeja, adaptados al formato de motherboard seleccionada.
  const standoffGroup=new THREE.Group();standoffGroup.name='Separadores motherboard';
  tower.add(standoffGroup);
  const brass=new THREE.MeshStandardMaterial({color:0xb9a06b,roughness:.36,metalness:.72});
  const mountPosts=[];
  for(let i=0;i<4;i++){
    const post=new THREE.Mesh(new THREE.CylinderGeometry(.11,.11,
      MOTHERBOARD_MOUNT.standoffHeight,6),brass);
    post.name='Separador M3 '+(i+1);
    post.position.y=MOTHERBOARD_MOUNT.trayTopY+MOTHERBOARD_MOUNT.standoffHeight/2;
    standoffGroup.add(post);
    mountPosts.push(post);
  }
  function setMotherboardLayout(cfg){
    getMotherboardMountPoints(cfg).forEach(([x,z],i)=>{
      mountPosts[i].position.x=x;
      mountPosts[i].position.z=z;
    });
  }
  setMotherboardLayout(BOARD_LAYOUTS.b650);
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
  add(tower,[.09,2.49,2.49],[rear+.14,REAR_CASE_FAN_Y,-1.25],cageMaterial);
  // Panel superior-frontal integrado: un pulsador momentáneo, LED y tres USB.
  const frontIO=new THREE.Group();frontIO.name='Panel superior frontal POWER / USB';
  tower.add(frontIO);
  const portDark=new THREE.MeshStandardMaterial({color:0x111923,metalness:.30,roughness:.59});
  const portMetal=new THREE.MeshStandardMaterial({color:0x98afc2,metalness:.82,roughness:.23});
  const portBlue=new THREE.MeshStandardMaterial({color:0x358dd6,metalness:.22,roughness:.45});
  add(frontIO,[1.32,3.38,.115],[4.25,2.10,-3.41],panel);
  const powerControl=new THREE.Group();powerControl.name='Botón POWER del chasis';
  powerControl.position.set(...FRONT_IO_LAYOUT.power);frontIO.add(powerControl);
  const buttonRing=new THREE.Mesh(new THREE.TorusGeometry(.255,.039,9,36),portMetal);
  buttonRing.position.z=.024;powerControl.add(buttonRing);
  const powerButton=new THREE.Mesh(new THREE.CylinderGeometry(.205,.205,.13,32),portDark);
  powerButton.rotation.x=Math.PI/2;powerButton.userData.partId='casePower';
  powerButton.name='Pulsador físico de encendido';powerControl.add(powerButton);
  const powerLedMaterial=new THREE.MeshStandardMaterial({color:0x6de8e6,
    emissive:0x23f5c9,emissiveIntensity:.04,roughness:.25});
  const powerLed=new THREE.Mesh(new THREE.SphereGeometry(.066,16,12),powerLedMaterial);
  powerLed.position.set(3.83,3.13,-3.51);frontIO.add(powerLed);
  function usbPort(position,kind){
    const g=new THREE.Group();g.position.set(...position);
    g.name=kind==='frontUsbC'?'Puerto frontal USB-C':'Puerto frontal USB-A';
    g.userData.partId=kind;frontIO.add(g);
    const isC=kind==='frontUsbC';
    add(g,isC?[.40,.25,.10]:[.48,.33,.10],[0,0,0],portMetal);
    add(g,isC?[.32,.15,.014]:[.38,.23,.014],[0,0,-.061],portDark);
    add(g,isC?[.23,.07,.012]:[.27,.070,.012],[0,0,-.074],isC?portMetal:portBlue);
    return g;
  }
  const frontUsbPorts=[
    ...FRONT_IO_LAYOUT.usbA.map(pos=>({id:'frontUsb3',object:usbPort(pos,'frontUsb3')})),
    {id:'frontUsbC',object:usbPort(FRONT_IO_LAYOUT.usbC,'frontUsbC')}
  ];
  // Cabeceras REALES del panel frontal. El origen de cada manguera es
  // la toma posterior del módulo POWER / USB, nunca un punto flotante.
  const frontIOHeaders={};
  for(const [kind,xyz] of [
    ['frontPanel',FRONT_IO_LAYOUT.powerLead],
    ['frontUsb3',FRONT_IO_LAYOUT.usbALead],
    ['frontUsbC',FRONT_IO_LAYOUT.usbCLead]
  ]){
    const socket=createInternalHeader3d(THREE,kind);
    socket.name='Panel frontal '+kind+' · toma trasera';
    socket.position.set(...xyz);
    socket.rotation.x=Math.PI/2; // Y local sale hacia +Z dentro de la caja
    frontIO.add(socket);
    frontIOHeaders[kind]=socket;
  }
  let powerStroke=0;
  function pressPowerButton(){powerStroke=.16;}
  function updateFrontIO(dt){
    powerStroke=Math.max(0,powerStroke-dt);
    powerButton.position.z=powerStroke>0?.052:0;
  }
  function setPower(powered){powerLedMaterial.emissiveIntensity=powered?2.1:.04;}
  setPower(false);
  // SSD SATA 2.5" detrás de la bandeja de placa, no en la jaula HDD.
  const rearSSD=new THREE.Group();rearSSD.name='Soportes SSD traseros';
  rearSSD.position.set(-.30,-.67,.65);tower.add(rearSSD);
  for(const x of [-.84,.84])add(rearSSD,[.10,.15,1.55],[x,0,0],mesh);
  add(rearSSD,[1.82,.08,1.46],[0,-.04,0],cageMaterial);
  // Jaula de DOS bahías de 3,5" en la cámara inferior, delante de PSU.
  // Disco y jaula consultan HDD_BAY_LAYOUT: ni desplazamiento lateral,
  // ni disco atravesando el estante como ocurría con Y=.31.
  const hddCage=new THREE.Group();hddCage.name='Jaula HDD 3.5 · dos bahías';tower.add(hddCage);
  hddCage.position.set(...HDD_BAY_LAYOUT.cageCenter);
  const baySteel=new THREE.MeshStandardMaterial({color:0x3f4b57,metalness:.57,roughness:.43});
  const trayMat=new THREE.MeshStandardMaterial({color:0x27313b,metalness:.42,roughness:.63});
  // Costillas trasera y delantera; permiten extraer las bandejas.
  for(const x of [-1.64,1.64]){
    for(const z of [-1.18,1.18])
      add(hddCage,[.12,1.50,.13],[x,.02,z],baySteel);
  }
  // Tres plataformas delimitan dos ranuras de 3.5" superpuestas.
  for(const level of HDD_BAY_LAYOUT.shelfLevels){
    const y=level-HDD_BAY_LAYOUT.cageCenter[1];
    add(hddCage,[3.37,.075,2.49],[0,y,0],trayMat);
    for(const z of [-1.11,1.11])
      add(hddCage,[3.32,.11,.09],[0,y+.085,z],baySteel);
  }
  for(const z of HDD_BAY_LAYOUT.sideWallZ)
    add(hddCage,[3.36,1.46,.09],[0,.02,z],cageMaterial);
  // Carriles ajustados a la longitud de 147 mm y anchura de 101,6 mm.
  for(const z of [-1.085,1.085]){
    add(hddCage,[3.00,.10,.08],[0,.055,z],baySteel);
    add(hddCage,[3.00,.10,.08],[0,-.665,z],baySteel);
  }
  // Extracción frontal: un tirador al borde +X de la bandeja superior.
  add(hddCage,[.09,.23,1.10],[1.68,.31,0],baySteel);
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
  let currentFinish='tower';
  function setFinish(variant){
    const palette={
      tower:[0x232d38,0x354450,0x596d78],
      towerWhite:[0xc0cbd5,0xe8eff5,0xb4c6d3],
      towerGraphite:[0x566570,0x74828c,0x8a9faa]
    };
    currentFinish=Object.hasOwn(palette,variant)?variant:'tower';
    const colors=palette[currentFinish];
    // Aplicar el acabado a todo el bastidor, la bandeja y el panel, no
    // sólo al frontal. Evita un chasis negro con una pequeña franja blanca.
    steel.color.setHex(colors[0]);
    panel.color.setHex(colors[1]);
    mesh.color.setHex(colors[2]);
    cageMaterial.color.setHex(currentFinish==='towerWhite'?0x617584:
      currentFinish==='towerGraphite'?0x374b59:0x18222d);
    shroudFront.color.setHex(currentFinish==='towerWhite'?0x91a8b7:
      currentFinish==='towerGraphite'?0x415360:0x101921);
    shroudFront.opacity=currentFinish==='towerWhite'?.52:.69;
  }
  function getFinish(){
    return {variant:currentFinish,frame:steel.color.getHex(),
      panel:panel.color.getHex()};
  }
  function sync(installed,closedState){
    tower.visible=!!installed;
    hinge.rotation.z=closedState?closed:open;
  }
  sync(false,false);
  function setRgb(enabled){rgbGroup.visible=!!enabled;}
  setRgb(false);
  return {root:tower,sync,setFinish,getFinish,setRgb,setPower,pressPowerButton,updateFrontIO,
    powerControl,powerButton,powerLed,frontUsbPorts,frontIO,frontIOHeaders,
    setMotherboardLayout,mountPosts,
    hinge,rearSSD,hddCage,psuSeat,
    bounds:{rear,front,back,side,top,bottom},sizeMM:TOWER_CASE_MM};
}
