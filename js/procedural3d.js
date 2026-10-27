// Hardware Simulator 7.0-alpha: modelos procedurales, sin archivos GLB.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { buildRealScale, MOTHERBOARD_MOUNT, MM_PER_UNIT, getMotherboardMountPoints,
  getRearVideoAnchor, getGpuVideoAnchor, HDD_BAY_LAYOUT,
  SSD_BAY_LAYOUT } from './partsRealScale.js?v=8-4-11-drive-bays';
import { createProceduralFan } from './fanProcedural.js';
import { createCableHarness } from './cablesProcedural.js?v=8-4-11-drive-bays';
import {createConnector3d,getCableExit} from './connectors3d.js?v=8-4-7-cable-exits';
import {alignRearPlug} from './portProfiles.js?v=8-4-7-cable-exits';
import { createWorkbench, WORKBENCH_LAYOUT } from './workbench3d.js?v=8-5-1-usb-market';
import { createATXTower } from './towerATX.js?v=8-4-11-drive-bays';
import { createSmoothZoom } from './smoothZoom.js?v=7-4-2-smooth-wheel';
import { createStagingTable } from './stagingTable3d.js?v=8-4-1-gameplay-e2e';
import {createToolRack} from './toolRack3d.js?v=8-14-0-tools';
import {createPinoutBoard} from './pinoutBoard3d.js?v=8-15-0-pinboard';

const view=document.getElementById('viewport'),stage=document.getElementById('viewportWrap');
const renderer=new THREE.WebGLRenderer({canvas:view,antialias:true});
renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.8));
renderer.shadowMap.enabled=true;
renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.25;
const scene=new THREE.Scene();scene.background=new THREE.Color(0x101923);
scene.fog=new THREE.Fog(0x101923,40,110);
const camera=new THREE.PerspectiveCamera(48,1,.1,140);
camera.position.set(4.5,22,58.5);
const controls=new OrbitControls(camera,view);
controls.enableDamping=true;controls.dampingFactor=.10;
controls.enablePan=false;controls.minDistance=4.5;controls.maxDistance=78;
controls.zoomSpeed=.45; // zoom multitáctil de OrbitControls; rueda gestionada aparte
const smoothZoom=createSmoothZoom({
  camera,controls,element:view,minDistance:controls.minDistance,maxDistance:controls.maxDistance
});
controls.maxPolarAngle=Math.PI/2.02;controls.target.set(4.15,4.25,.55);
const pmrem=new THREE.PMREMGenerator(renderer),env=pmrem.fromScene(new RoomEnvironment());
scene.environment=env.texture;pmrem.dispose();
scene.add(new THREE.HemisphereLight(0xcceaff,0x0b1724,1.6));
const mainLight=new THREE.DirectionalLight(0xf3f8ff,3.2);mainLight.position.set(3.5,8,5.2);
mainLight.castShadow=true;mainLight.shadow.mapSize.set(1024,1024);mainLight.shadow.camera.left=-21;mainLight.shadow.camera.right=21;mainLight.shadow.camera.top=21;mainLight.shadow.camera.bottom=-21;mainLight.shadow.normalBias=.02;scene.add(mainLight);
const rim=new THREE.DirectionalLight(0x63e9bf,1.35);rim.position.set(-5,4,-4);scene.add(rim);

const metal=(c,rough=.4,met=.8)=>new THREE.MeshStandardMaterial({color:c,metalness:met,roughness:rough});
const materials={pcb:metal(0x123c37,.78,.2),pcbdark:metal(0x142e30,.78,.2),case:metal(0x222c39,.5,.75),black:metal(0x18212a,.55,.3),black2:metal(0x0e151d,.68,.15),silver:metal(0xb7c5d2,.28,.85),aluminium:metal(0x7c929d,.34,.83),gold:metal(0xe1b55d,.3,.82),green:metal(0x58e7ac,.3,.38),blue:metal(0x66a3ff,.3,.45),warn:metal(0xffbf64,.35,.3)};
// El hardware ya no está tumbado: eje Z local del PCB pasa a Y vertical.
// El nuevo chasis mantiene el mundo del taller independiente de la rotación.
const root=new THREE.Group();
root.rotation.x=Math.PI/2;
root.position.set(1.0,6.0,1.0);
scene.add(root);
const partGroups={}; const partMeta=[
{id:'board',title:'Placa base B650',sub:'Socket · chipset · conectores',detail:'PCB con pistas y componentes, socket de CPU, ranuras DDR5, PCIe y conectores. Todo generado con geometría procedural.'},
{id:'ram',title:'RAM DDR5',sub:'2 módulos · disipador',detail:'Dos módulos con contactos dorados, disipadores, microchips y ranuras de inserción.'},
{id:'gpu',title:'Tarjeta gráfica',sub:'Doble ventilador',detail:'PCB, disipador, backplate, alimentación auxiliar y dos ventiladores animados.'},
{id:'cooler',title:'Disipador de CPU',sub:'Aletas · ventilador',detail:'Bloque de disipación, aletas de aluminio, heatpipes y ventilador giratorio.'},
{id:'psu',title:'Fuente de alimentación',sub:'ATX · conectores',detail:'Carcasa metálica, rejilla y ventilador; instalada junto a la placa.'}
];
function group(id){const g=new THREE.Group();g.userData.partId=id;root.add(g);partGroups[id]=g;return g}
function rounded(w,h,d,r,mat,parent,x,y,z){const mesh=new THREE.Mesh(new RoundedBoxGeometry(w,h,d,3,r),mat);mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh}
function box(w,h,d,mat,parent,x,y,z){const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh}
function cylinder(rad,hei,mat,parent,x,y,z,segments=28){let mesh=new THREE.Mesh(new THREE.CylinderGeometry(rad,rad,hei,segments),mat);mesh.position.set(x,y,z);mesh.castShadow=true;parent.add(mesh);return mesh}
function trace(x1,z1,x2,z2,y,mat,parent,r=.009){const a=new THREE.Vector3(x1,y,z1),b=new THREE.Vector3(x2,y,z2),dir=new THREE.Vector3().subVectors(b,a);const mesh=new THREE.Mesh(new THREE.CylinderGeometry(r,r,dir.length(),5),mat);mesh.position.copy(a).addScaledVector(dir,.5);mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),dir.normalize());parent.add(mesh);return mesh}
function label(text,w=.65,h=.19){const c=document.createElement('canvas');c.width=512;c.height=128;const ctx=c.getContext('2d');ctx.fillStyle='#151e28';ctx.fillRect(0,0,512,128);ctx.fillStyle='#dce8ed';ctx.font='bold 56px system-ui';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,256,68);const tx=new THREE.CanvasTexture(c);tx.colorSpace=THREE.SRGBColorSpace;let m=new THREE.MeshBasicMaterial({map:tx,transparent:true,depthWrite:false});const o=new THREE.Mesh(new THREE.PlaneGeometry(w,h),m);o.rotation.x=-Math.PI/2;return o}
const rotors=[];
function fan(parent,x,y,z,r=.27,options={}){
  const f=createProceduralFan(THREE,parent,materials,[x,y,z],r,options);
  rotors.push(f);
  return f.housing;
}

const assembly=buildRealScale({THREE,scene:root,group,rounded,box,cylinder,trace,label,fan,materials});
const tower=createATXTower(THREE,root,materials);
const cables=createCableHarness(THREE,root,assembly,tower);
const workbench=createWorkbench(THREE,scene,materials);
const staging=createStagingTable(THREE,scene);
const toolRack=createToolRack(THREE,scene);
const pinBoard=createPinoutBoard(THREE,scene,window.PC_PINOUTS.CONNECTORS);

// Salida de vídeo calculada en cada cambio de placa/GPU. Ya no termina
// en una coordenada fija del taller; el conector metálico mira a rear I/O.
root.updateMatrixWorld(true);
const videoOutsideMaterial=new THREE.MeshStandardMaterial({color:0x252c36,roughness:.87});
const {monitor:monitorLocation}=WORKBENCH_LAYOUT;
const externalVideo=new THREE.Mesh(new THREE.BufferGeometry(),videoOutsideMaterial);
externalVideo.visible=false;scene.add(externalVideo);
const externalVideoPlugs={
  hdmi:createConnector3d(THREE,'hdmi'),
  displayPort:createConnector3d(THREE,'displayPort')
};
for(const plug of Object.values(externalVideoPlugs)){
  // El roll de 90° también alinea la sección (ancho Z / alto Y).
  alignRearPlug(THREE,plug,root);
  plug.visible=false;scene.add(plug);
}
let lastVideoRoute='',activeVideoType='hdmi';
function updateExternalVideo(state,cfg){
  const gpuSelected=!!state.installed?.gpu&&state.selected?.gpu!=='none';
  const gpuOutput=state.videoPort==='gpu'||
    (state.videoPort!=='motherboard'&&gpuSelected);
  const type=gpuOutput?'displayPort':'hdmi';
  activeVideoType=type;
  const local=gpuOutput?getGpuVideoAnchor(cfg,1):getRearVideoAnchor(cfg,'hdmi');
  const sig=[type,...local].join(':');
  if(sig!==lastVideoRoute){
    root.updateMatrixWorld(true);
    const end=root.localToWorld(new THREE.Vector3(...local));
    const plug=externalVideoPlugs[type];
    plug.position.copy(end);
    plug.updateMatrixWorld(true);
    const flex=getCableExit(THREE,plug);
    const axis=new THREE.Vector3(0,1,0).applyQuaternion(
      plug.getWorldQuaternion(new THREE.Quaternion()));
    // El cable arranca en el último milímetro del guardacable de HDMI/DP.
    const curve=new THREE.CatmullRomCurve3([
      flex.clone(),flex.clone().addScaledVector(axis,.27),
      flex.clone().addScaledVector(axis,.85).add(new THREE.Vector3(0,-.54,-.38)),
      new THREE.Vector3(-4.75,.28,-1.9),new THREE.Vector3(-5.65,.24,-5.38),
      new THREE.Vector3(monitorLocation.x+.4,.28,-5.55),
      new THREE.Vector3(monitorLocation.x+4.62,3.52,monitorLocation.z-.17)
    ],false,'centripetal',.40);
    externalVideo.geometry.dispose();
    externalVideo.geometry=new THREE.TubeGeometry(curve,64,.027,8,false);
    externalVideo.userData.flexTail=flex.clone();
    lastVideoRoute=sig;
  }
  const visible=!!state.installed?.case&&!!state.installed?.motherboard&&
    !!state.monitorCable&&(!gpuOutput||gpuSelected);
  externalVideo.visible=visible;
  for(const [kind,plug] of Object.entries(externalVideoPlugs))
    plug.visible=visible&&kind===type;
}
function getVideoReceptacleAlignment(){
  const type=activeVideoType,plug=externalVideoPlugs[type];
  const id=current?.selected?.motherboard||'b650';
  const port=type==='hdmi'?assembly.rearVideoSockets[id]?.hdmi:
    assembly.gpuBracketPorts[1];
  if(!port)return null;
  root.updateMatrixWorld(true);
  const portWorld=port.getWorldPosition(new THREE.Vector3());
  const plugWorld=plug.getWorldPosition(new THREE.Vector3());
  const socketAxis=new THREE.Vector3(0,0,1).applyQuaternion(
    port.getWorldQuaternion(new THREE.Quaternion()));
  const maleAxis=new THREE.Vector3(1,0,0).applyQuaternion(
    plug.getWorldQuaternion(new THREE.Quaternion()));
  const angleDegrees=Math.acos(Math.min(1,Math.abs(socketAxis.dot(maleAxis))))*180/Math.PI;
  return {type,portWorld:portWorld.toArray(),plugWorld:plugWorld.toArray(),
    gapMm:portWorld.distanceTo(plugWorld)*MM_PER_UNIT,angleDegrees,
    flexGapMm:getCableExit(THREE,plug).distanceTo(externalVideo.userData.flexTail||
      getCableExit(THREE,plug))*MM_PER_UNIT};
}

// Anillos de incidencias: anclados a la posición del conector seleccionado.
const markerGroup=new THREE.Group();root.add(markerGroup);
const markerMaterial=new THREE.MeshBasicMaterial({
  color:0xffbb67,transparent:true,opacity:.95,depthTest:false
});
function marker(radius=.20){
  const obj=new THREE.Mesh(new THREE.TorusGeometry(radius,.030,8,32),markerMaterial);
  obj.rotation.x=Math.PI/2;obj.renderOrder=5;obj.visible=false;
  markerGroup.add(obj);return obj;
}
const markers={eps:marker(),ram:marker(.22),sata:marker(),gpu:marker(.24),fan:marker(.28),atx:marker(.22),frontPanel:marker(.17)};
const powerLight=new THREE.PointLight(0x55ecae,0,5);
powerLight.position.set(-3,.8,-2.7);scene.add(powerLight);

let current=null;
let activeSnapTargets={},draggedPart='';
const snapMaterial=new THREE.MeshBasicMaterial({
  color:0x75eec0,transparent:true,opacity:.95,depthTest:false
});
const snapRing=new THREE.Mesh(new THREE.TorusGeometry(.58,.042,8,48),snapMaterial);
snapRing.rotation.x=Math.PI/2;
snapRing.renderOrder=20;snapRing.visible=false;scene.add(snapRing);
function dragPart(id){
  draggedPart=id;
  const target=activeSnapTargets[id];
  snapRing.visible=!!target;
  if(target)snapRing.position.copy(target);
}
function cancelDrag(){draggedPart='';snapRing.visible=false}
function acceptDrop(e){
  e.preventDefault();e.stopPropagation();
  const id=e.dataTransfer?.getData('text/plain')||draggedPart;
  const goal=activeSnapTargets[id];
  if(!goal){cancelDrag();return}
  const rect=view.getBoundingClientRect();
  root.updateMatrixWorld(true);
  const projected=root.localToWorld(goal.clone()).project(camera);
  const px=(projected.x+1)*rect.width/2;
  const py=(1-projected.y)*rect.height/2;
  const distance=Math.hypot(e.clientX-rect.left-px,e.clientY-rect.top-py);
  const tolerance=Math.max(90,Math.min(165,Math.min(rect.width,rect.height)*.25));
  cancelDrag();
  if(distance>tolerance||projected.z>1){
    window.dispatchEvent(new CustomEvent('pc3d-snap-rejected',{
      detail:{reason:'No coincide con la ranura de encaje. Acerca la pieza al anillo verde.'}
    }));
    return;
  }
  window.dispatchEvent(new CustomEvent('pc3d-drop',{detail:{part:id}}));
}
view.addEventListener('dragover',e=>{
  if(draggedPart){e.preventDefault();e.dataTransfer.dropEffect='copy'}
});
view.addEventListener('drop',acceptDrop);
view.addEventListener('dragleave',e=>{if(!e.relatedTarget||!view.contains(e.relatedTarget))snapRing.visible=false});
const home=new Map(Object.entries(partGroups).map(([id,g])=>[id,g.position.clone()]));
const spreads={
  case:[0,0,0],board:[0,0,0],cpu:[-.20,.72,-.20],
  ram:[.50,.85,-.20],gpu:[.65,.55,.75],cooler:[-.45,.95,-.60],
  psu:[.30,.55,.55],storage:[.25,.35,-.25]
};
function sync(state,details={}){
  if(!state)return;
  current=state;
  const {anchors,needsSata,cfg,snapTargets}=assembly.configure(state);
  workbench.updateConnections(state,cfg,root);
  updateExternalVideo(state,cfg);
  workbench.updateScreen(details.consoleText??'',!!state.power,!!state.bios,
    !!details.videoSignal,details.osVisual||null);
  tower.sync(!!state.installed?.case,!!state.caseClosed);
  tower.setStorageSelection(state.selected?.storage,!!state.installed?.storage);
  tower.setMotherboardLayout(cfg);
  tower.setFinish?.(state.selected?.caseVariant||'tower');
  tower.setRgb?.(!!state.rgbInstalled&&!!state.power&&!!state.rgbOn);
  tower.setPower(!!state.power);
  assembly.fanMountGroup.visible=!!state.installed?.case;
  activeSnapTargets=snapTargets;
  if(draggedPart&&snapTargets[draggedPart]){
    snapRing.position.copy(snapTargets[draggedPart]);
    snapRing.visible=true;
  }
  cables.update(state,cfg,needsSata);
  // Se conserva la posición de instalación como origen de cada animación.
  // Solo las piezas con anclajes variables cambian su posición de origen.
  // Evita acumular desplazamientos en cada render durante la vista explosionada.
  for(const id of ['cpu','cooler','gpu']){
    home.set(id,partGroups[id].position.clone());
  }
  const installed=state.installed||{};
  const shown={
    case:!!installed.case,board:!!installed.motherboard,
    cpu:!!installed.cpu,ram:!!installed.ram,
    gpu:!!installed.gpu&&state.selected?.gpu!=='none',
    cooler:!!installed.cooler,psu:!!installed.psu,
    storage:!!installed.storage
  };
  for(const [id,part] of Object.entries(partGroups))part.visible=!!shown[id];
  // El bastidor ATX horizontal es legado y queda sustituido por la torre.
  partGroups.case.visible=false;
  markers.eps.visible=shown.board&&shown.psu&&!state.eps;
  markers.atx.visible=shown.board&&shown.psu&&!state.atx24;
  markers.frontPanel.visible=shown.board&&shown.case&&!state.frontPanel;
  markers.ram.visible=shown.ram&&!state.ramSeated;
  markers.sata.visible=shown.storage&&needsSata&&(!state.sataData||!state.sataPower);
  markers.gpu.visible=shown.gpu&&!state.gpuPower;
  markers.fan.visible=shown.cooler&&!state.cpuFan;
  for(const [id,mark] of Object.entries(markers)){
    mark.position.copy(anchors[id]);
  }
  powerLight.intensity=state.power?.85:0;
}

const raycaster=new THREE.Raycaster();
const pointer=new THREE.Vector2();
let press=null,highlight=null,selected='';
function select3D(id,clientX=null,clientY=null){
  selected=id;
  if(highlight){
    scene.remove(highlight);
    highlight.geometry.dispose();
    highlight.material.dispose();
    highlight=null;
  }
  const obj=partGroups[id];
  if(obj?.visible){
    highlight=new THREE.BoxHelper(obj,0x68e5c0);
    scene.add(highlight);
  }
  window.dispatchEvent(new CustomEvent('pc3d-select',{
    detail:{part:id,clientX,clientY}
  }));
}
// Detección hover con raycasting liviano (18–22 Hz). No interfiere con
// OrbitControls ni abre fichas hasta que se hace clic en un objeto.
let lastHover=0;
function hoverPart(e){
  const bounds=view.getBoundingClientRect();
  if(!bounds.width||!bounds.height)return null;
  pointer.set(2*(e.clientX-bounds.left)/bounds.width-1,
    1-2*(e.clientY-bounds.top)/bounds.height);
  raycaster.setFromCamera(pointer,camera);
  const contactHits=raycaster.intersectObject(pinBoard.root,true);
  for(const hit of contactHits){
    const pin=pinBoard.identify(hit.object);
    if(pin)return {key:pin.connector+':P'+pin.pin,source:'pinboard'};
  }
  const rackHits=raycaster.intersectObject(toolRack.root,true);
  for(const hit of rackHits){const id=toolRack.identify(hit.object);
    if(id)return {key:id,source:'rack'};
  }
  const prepared=raycaster.intersectObject(staging.root,true);
  for(const hit of prepared){
    const key=staging.identify(hit.object);
    if(key)return {key,source:'table'};
  }
  if(current?.installed?.case&&raycaster.intersectObject(tower.powerControl,true).length)
    return {key:'casePower',source:'front'};
  if(current?.installed?.case){
    for(const port of tower.frontUsbPorts){
      if(raycaster.intersectObject(port.object,true).length)
        return {key:port.id,source:'front'};
    }
  }
  if(current?.ioShield&&assembly.ioShield.visible&&
    raycaster.intersectObject(assembly.ioShield,true).length)
    return {key:'ioShield',source:'tower'};
  for(let i=0;i<assembly.caseFanMounts.length;i++){
    const mount=assembly.caseFanMounts[i];
    if(mount.visible&&raycaster.intersectObject(mount,true).length)
      return {key:'fan'+i,source:'tower'};
  }
  const installed=raycaster.intersectObjects(
    Object.values(partGroups).filter(g=>g.visible),true);
  for(const hit of installed){
    let node=hit.object;
    while(node&&!node.userData?.partId)node=node.parent;
    if(node?.userData?.partId)return {key:node.userData.partId,source:'tower'};
  }
  for(const [node,key] of [
    [workbench.keyboard,'keyboard'],[workbench.mouseGroup,'mouse'],
    [workbench.screen,'monitor']]){
    if(node&&raycaster.intersectObject(node,true).length)
      return {key,source:'tower'};
  }
  if(current?.installed?.case&&raycaster.intersectObject(tower.root,true).length)
    return {key:'case',source:'tower'};
  return null;
}
view.addEventListener('pointermove',e=>{
  if(e.pointerType==='touch'||(press&&Math.hypot(e.clientX-press.x,e.clientY-press.y)>8)){
    view.style.cursor='grab';
    window.dispatchEvent(new CustomEvent('pc3d-hover',{detail:{key:null}}));
    return;
  }
  const now=performance.now();
  if(now-lastHover<45)return;
  lastHover=now;
  const result=hoverPart(e);
  view.style.cursor=result?'pointer':'grab';
  window.dispatchEvent(new CustomEvent('pc3d-hover',{
    detail:{...(result||{key:null}),clientX:e.clientX,clientY:e.clientY}
  }));
});
view.addEventListener('pointerleave',()=>{
  press=null;view.style.cursor='grab';
  window.dispatchEvent(new CustomEvent('pc3d-hover',{detail:{key:null}}));
});
view.addEventListener('dblclick',e=>{
  // Doble clic sobre una mesa o un periférico: centrar ese puesto.
  // Un solo clic sigue abriendo la ficha de la pieza.
  const rect=view.getBoundingClientRect();
  if(!rect.width||!rect.height)return;
  pointer.set(2*(e.clientX-rect.left)/rect.width-1,
    1-2*(e.clientY-rect.top)/rect.height);
  raycaster.setFromCamera(pointer,camera);
  if(raycaster.intersectObject(staging.root,true).length){
    viewStaging();return;
  }
  if(raycaster.intersectObject(workbench.screen,true).length||
     raycaster.intersectObject(workbench.keyboard,true).length||
     raycaster.intersectObject(workbench.mouseGroup,true).length){
    viewPeripherals();return;
  }
  // El doble clic sobre POWER no debe cambiar de vista ni pulsar dos veces.
  if(current?.installed?.case&&raycaster.intersectObject(tower.powerControl,true).length)return;
  if(current?.installed?.case&&raycaster.intersectObject(tower.root,true).length){
    viewHardware();return;
  }
  if(raycaster.intersectObject(workbench.root,true).length)viewAssemblyDesk();
});
let lastPowerPress=-Infinity;
view.addEventListener('pointerdown',e=>{
  press={x:e.clientX,y:e.clientY};
});
view.addEventListener('pointerup',e=>{
  if(!press)return;
  const origin=press;press=null;
  if(Math.hypot(e.clientX-origin.x,e.clientY-origin.y)>7)return;
  const bounds=view.getBoundingClientRect();
  pointer.set(2*(e.clientX-bounds.left)/bounds.width-1,
     1-2*(e.clientY-bounds.top)/bounds.height);
  raycaster.setFromCamera(pointer,camera);
  const hits=raycaster.intersectObjects(
    Object.values(partGroups).filter(g=>g.visible),true);
  // En UEFI, un clic sobre la pantalla virtual selecciona la entrada
  // del orden de arranque y la desplaza una posición hacia arriba.
  if(current?.power&&current?.bios&&current?.mouseConnected){
    const monitorHits=raycaster.intersectObject(workbench.display,false);
    if(monitorHits.length){
      const row=workbench.hitBootOption(monitorHits[0].uv);
      if(row>=0)window.dispatchEvent(
        new CustomEvent('pc3d-boot-move',{detail:{index:row}}));
      return;
    }
  }
  // El pendrive montado sobre USB-A trasero es interactivo y se puede
  // expulsar con un clic, no sólo mediante el panel de tienda.
  if(workbench.installerUsb.visible&&
     raycaster.intersectObject(workbench.installerUsb,true).length){
    window.dispatchEvent(new CustomEvent('pc3d-usb-eject'));
    return;
  }
  const point=raycaster.intersectObject(pinBoard.root,true)
    .map(h=>pinBoard.identify(h.object)).find(Boolean);
  if(point){window.dispatchEvent(new CustomEvent('pc3d-pin-select',
    {detail:{...point,clientX:e.clientX,clientY:e.clientY}}));return;}
  const rackKey=raycaster.intersectObject(toolRack.root,true)
    .map(h=>toolRack.identify(h.object)).find(Boolean);
  if(rackKey){window.dispatchEvent(new CustomEvent('pc3d-tool-select',
    {detail:{id:rackKey,clientX:e.clientX,clientY:e.clientY}}));return;}
  const stageHits=raycaster.intersectObject(staging.root,true);
  const stageKey=stageHits.map(h=>staging.identify(h.object)).find(Boolean);
  if(stageKey){
    window.dispatchEvent(new CustomEvent('pc3d-stage-select',{
      detail:{key:stageKey,clientX:e.clientX,clientY:e.clientY}
    }));
    return;
  }
  // Pulsador de la caja: lanzar la MISMA acción que el botón HTML.
  if(current?.installed?.case&&raycaster.intersectObject(tower.powerControl,true).length){
    const now=performance.now();
    if(now-lastPowerPress>350){
      lastPowerPress=now;
      tower.pressPowerButton();
      window.dispatchEvent(new CustomEvent('pc3d-case-power'));
    }
    return;
  }
  if(current?.installed?.case){
    for(const port of tower.frontUsbPorts){
      if(raycaster.intersectObject(port.object,true).length){
        select3D(port.id,e.clientX,e.clientY);return;
      }
    }
  }
  // El chasis transparente no debe impedir seleccionar conectores y piezas
  // visibles en su interior. Los ventiladores tienen puntos propios.
  // La chapa se puede seleccionar desde la cara trasera,
  // incluso antes de haber instalado la placa base.
  if(current?.ioShield&&assembly.ioShield.visible&&
    raycaster.intersectObject(assembly.ioShield,true).length){
    select3D('ioShield',e.clientX,e.clientY);
    return;
  }
  const fanHits=raycaster.intersectObjects(
    assembly.caseFanMounts.filter(x=>x.visible),true);
  if(fanHits.length){
    let obj=fanHits[0].object;
    while(obj&&!Number.isInteger(obj.userData?.caseFanSlot)&&obj.parent)obj=obj.parent;
    if(Number.isInteger(obj.userData?.caseFanSlot)){
      select3D('fan'+obj.userData.caseFanSlot,e.clientX,e.clientY);
      return;
    }
  }
  if(hits.length){
    let obj=hits[0].object;
    while(obj&&!obj.userData.partId)obj=obj.parent;
    if(obj?.userData.partId){
      select3D(obj.userData.partId,e.clientX,e.clientY);
      return;
    }
  }
  const peripherals=[
    [workbench.keyboard,'keyboard'],[workbench.mouseGroup,'mouse'],
    [workbench.screen,'monitor']];
  for(const [obj,id] of peripherals){
    if(raycaster.intersectObject(obj,true).length){
      select3D(id,e.clientX,e.clientY);return;
    }
  }
  if(current?.installed?.case&&raycaster.intersectObject(tower.root,true).length){
    select3D('case',e.clientX,e.clientY);return;
  }
});
function resize(){
  const width=Math.max(1,stage.clientWidth),height=Math.max(1,stage.clientHeight);
  renderer.setSize(width,height,false);
  camera.aspect=width/height;
  camera.updateProjectionMatrix();
}
// Puntos de interés independientes: no se trata de un zoom global
// fijo, cada vista cambia tanto la posición como el objetivo orbital.
// Conserva la cámara elegida al conectar, comprar o renderizar piezas.
let cameraPreset='general';
function focusCamera(id,position,target){
  camera.position.set(...position);
  controls.target.set(...target);
  controls.update();
  smoothZoom.sync();
  cameraPreset=id;
  // La vista de bahías es un corte visual reversible: al salir vuelve
  // la cubierta PSU; no se cambia el montaje de ningún componente.
  tower.setDriveInspection(id==='drives');
  view.dataset.viewPreset=id;
  stage.dataset.viewPreset=id;
  window.dispatchEvent(new CustomEvent('pc3d-view-change',{detail:{view:id}}));
}
function resetView(){
  focusCamera('general',[4.5,22,58.5],[4.15,4.25,.55]);
}
function viewAssemblyDesk(){
  // Banco principal de 1350 × 850 mm: PC, herramientas y periferia.
  focusCamera('assembly',[-3.0,17.7,27.6],[-4.3,2.9,.35]);
}
function viewStaging(){
  // La mesa auxiliar vive en X=18.5; debe ocupar la mayor parte del canvas.
  focusCamera('staging',[18.5,13.9,19.3],[18.5,.35,.35]);
}
function viewPinouts(){
  focusCamera('pinouts',[11.2,17.3,5.2],[11.2,12.3,-8.4]);
}
function viewTools(){
  focusCamera('tools',[11.7,12.5,6.3],[11.2,4.5,-8.4]);
}
function viewPeripherals(){
  // Puesto del usuario: pantalla, teclado y ratón, a la izquierda de la torre.
  focusCamera('peripherals',[-9.05,11.5,17.8],[-9.05,2.4,1.05]);
}
function viewHardware(){
  focusCamera('tower',[11.0,10.3,15.8],[1.10,5.75,1.15]);
}
function viewRearCables(){
  focusCamera('rear',[9.0,10.2,-14.0],[1.0,5.0,.85]);
}
function viewDriveBays(){
  root.updateMatrixWorld(true);
  const center=root.localToWorld(new THREE.Vector3(...HDD_BAY_LAYOUT.cageCenter));
  focusCamera('drives',
    [center.x+4.5,center.y+3.4,center.z+8.5],center.toArray());
}
function viewScreen(){
  focusCamera('monitor',
    [monitorLocation.x,6.20,monitorLocation.z+10.9],
    [monitorLocation.x,monitorLocation.screenY,monitorLocation.z]);
}
function viewSide(){
  focusCamera('side',[5.2,9.4,19.5],[1.2,5.30,.80]);
}
if(typeof ResizeObserver!=='undefined')new ResizeObserver(resize).observe(stage);
window.addEventListener('resize',resize);resize();
const desired=new THREE.Vector3();
let previous=performance.now();
function animate(now){
  requestAnimationFrame(animate);
  if(document.hidden){previous=now;return;}
  const dt=Math.max(0,Math.min(.05,(now-previous)/1000));previous=now;
  for(const [id,part] of Object.entries(partGroups)){
    const base=home.get(id);
    const delta=spreads[id];
    const expanded=current?.explode?1:0;
    const loose=(id==='ram'&&current?.installed?.ram&&!current?.ramSeated)? .18:0;
    // Fallo mecánico educativo: la pieza sin fijar cede y se inclina,
    // sin cambiar físicamente su anclaje ni las colisiones del cableado.
    const actualPart=id==='board'?'motherboard':id;
    const failing=current?.mechanicalFault===actualPart;
    const sag=failing?.85:0;
    const wiggle=failing?.10*Math.sin(now*.015):0;
    desired.set(base.x+delta[0]*expanded+wiggle,
      base.y+delta[1]*expanded+loose-sag,base.z+delta[2]*expanded);
    part.rotation.z+=( (failing?-.24:0)-part.rotation.z)*Math.min(1,dt*5);
    part.position.lerp(desired,Math.min(1,dt*7));
  }
  // En rotación, los ventiladores de tarjeta y disipador miran de frente,
  // mientras que el de PSU apunta hacia arriba.
  const fast=!!current?.power&&!!current?.stress;
  for(const f of rotors){
    const slot=f.housing?.userData?.caseFanSlot;
    const spin=!!current?.power&&(slot===undefined||
      !!current?.caseFans?.[slot]?.connected);
    f.rotor.visible=!fast;
    f.blur.visible=fast&&spin;
    if(spin)f.rotor.rotation.y+=dt*(fast?16:5.4);
  }
  if(highlight){highlight.visible=!!partGroups[selected]?.visible;highlight.update();}
  tower.updateFrontIO(dt);
  smoothZoom.update(dt);
  controls.update();renderer.render(scene,camera);
}
// Diagnóstico para Playwright: distancia entre las mallas reales.
function getMountAlignment(){
  const id=current?.selected?.motherboard||'b650';
  const pcb=assembly.motherboardModels[id]?.children[0];
  const post=tower.mountPosts[0];
  if(!pcb||!post)return null;
  root.updateMatrixWorld(true);
  const pcbBottom=root.worldToLocal(pcb.localToWorld(
    new THREE.Vector3(0,-MOTHERBOARD_MOUNT.pcbThickness/2,0)));
  const postTop=root.worldToLocal(post.localToWorld(
    new THREE.Vector3(0,MOTHERBOARD_MOUNT.standoffHeight/2,0)));
  const cfg=assembly.configure(current||{selected:{motherboard:id}}).cfg;
  return {
    board:id,boardBottomY:pcbBottom.y,standoffTopY:postTop.y,
    gapMm:Math.abs(pcbBottom.y-postTop.y)*MM_PER_UNIT,
    holes:getMotherboardMountPoints(cfg),
    posts:tower.mountPosts.map(item=>[item.position.x,item.position.z])
  };
}
function getCasePowerScreenPoint(){
  root.updateMatrixWorld(true);
  const rect=view.getBoundingClientRect();
  const projected=tower.powerControl.getWorldPosition(new THREE.Vector3()).project(camera);
  return {x:(projected.x+1)*rect.width/2,y:(1-projected.y)*rect.height/2,
    inside:projected.z>=-1&&projected.z<=1};
}
window.PC3D={
  ready:true,
  update:sync,
  updateTools:keys=>toolRack.update(keys),
  getToolRack:()=>toolRack.visible(),
  getPinBoardContacts:()=>pinBoard.contacts(),
  selectPinout:(connector,red,black)=>pinBoard.highlight(connector,red,black),
  viewPinouts,
  viewTools,
  updateStaging:(items,selected)=>{
    staging.update(items,selected);
    window.dispatchEvent(new CustomEvent('pc3d-stage-page',{detail:staging.getPageInfo()}));
  },
  turnStagingPage:delta=>{
    staging.turnPage(delta);
    const detail=staging.getPageInfo();
    window.dispatchEvent(new CustomEvent('pc3d-stage-page',{detail}));
  },
  dragPart,cancelDrag,viewIso:viewHardware,
  viewWorkbench:resetView,
  viewAssemblyDesk,
  viewStaging,
  viewPeripherals,
  viewRearCables,
  viewDriveBays,
  viewScreen,
  viewTop:viewSide,
  // Útil para comprobar encuadres desde pruebas E2E reales.
  getViewState:()=>({
    view:cameraPreset,
    position:camera.position.toArray(),
    target:controls.target.toArray()
  }),
  getCaseFinish:()=>tower.getFinish(),
  getOSMonitorKind:()=>workbench.getOSMonitorKind(),
  getMechanicalFault:()=>current?.mechanicalFault||null,
  getInstallerUsbPose:()=>workbench.getInstallerUsbPose(root,
    assembly.rearUsbSockets[current?.selected?.motherboard||'b650']),
  getHddBayAlignment:()=>{
    root.updateMatrixWorld(true);
    const disk=root.worldToLocal(assembly.hddDrive.getWorldPosition(new THREE.Vector3()));
    const cage=root.worldToLocal(tower.hddCage.getWorldPosition(new THREE.Vector3()));
    const [length,height,width]=HDD_BAY_LAYOUT.driveSize;
    const [low,mid,high]=HDD_BAY_LAYOUT.shelfLevels;
    const limits=HDD_BAY_LAYOUT.insideX;
    const minX=disk.x-length/2,maxX=disk.x+length/2;
    const minZ=disk.z-width/2,maxZ=disk.z+width/2;
    const cageMinZ=cage.z+Math.min(...HDD_BAY_LAYOUT.sideWallZ);
    const cageMaxZ=cage.z+Math.max(...HDD_BAY_LAYOUT.sideWallZ);
    return {
      slot:'upper',center:[disk.x,disk.y+height/2,disk.z],
      cageCenter:cage.toArray(),
      positionErrorMm:Math.hypot(disk.x-cage.x,disk.z-cage.z,
        disk.y-HDD_BAY_LAYOUT.driveBaseY)*50,
      shelfGapMm:(disk.y-mid)*50,
      roofGapMm:(high-(disk.y+height))*50,
      sideGapMm:Math.min(minX-limits[0],limits[1]-maxX,
        minZ-cageMinZ,cageMaxZ-maxZ)*50,
      fitted:disk.y>mid&&disk.y+height<high&&minX>limits[0]&&maxX<limits[1]
        &&minZ>cageMinZ&&maxZ<cageMaxZ,
      visible:!!assembly.hddDrive.visible,
      selected:current?.selected?.storage||'none'
    };
  },
  getStorageBayAlignment:()=>{
    root.updateMatrixWorld(true);
    const selected=current?.selected?.storage||'none';
    const hdd=['hdd','hdd4'].includes(selected);
    const sataSSD=['sataSSD','sataSSD2'].includes(selected);
    const disk=hdd?assembly.hddDrive:sataSSD?assembly.sataDrive:null;
    const size=hdd?HDD_BAY_LAYOUT.driveSize:SSD_BAY_LAYOUT.driveSize;
    const shelf=HDD_BAY_LAYOUT.shelfLevels;
    const center=root.worldToLocal(tower.hddCage.getWorldPosition(new THREE.Vector3()));
    const position=disk?root.worldToLocal(disk.getWorldPosition(new THREE.Vector3())):null;
    const expectedY=hdd?HDD_BAY_LAYOUT.driveBaseY:SSD_BAY_LAYOUT.driveBaseY;
    const low=hdd?shelf[1]:shelf[0];
    const high=hdd?shelf[2]:shelf[1];
    const bounds=HDD_BAY_LAYOUT.insideX;
    const result=position?{
      fitted:position.y>=low&&position.y+size[1]<high&&
        position.x-size[0]/2>bounds[0]&&position.x+size[0]/2<bounds[1]&&
        Math.abs(position.z-center.z)+size[2]/2<Math.abs(HDD_BAY_LAYOUT.sideWallZ[1]),
      alignmentErrorMm:Math.hypot(position.x-center.x,
        position.y-expectedY,position.z-center.z)*MM_PER_UNIT,
      bottomClearanceMm:(position.y-low)*MM_PER_UNIT,
      topClearanceMm:(high-position.y-size[1])*MM_PER_UNIT,
      position:position.toArray()
    }:{fitted:false,alignmentErrorMm:null,
      bottomClearanceMm:null,topClearanceMm:null,position:null};
    return {...result,selected,slot:hdd?'upper':sataSSD?'lower':'none',
      visible:!!disk?.visible&&!!current?.installed?.storage,
      rearSSDVisible:tower.rearSSD.visible,
      ssdAdapterVisible:tower.ssdAdapter.visible,
      inspectionVisible:tower.getDriveInspection(),
      cagePosition:center.toArray()};
  },
  getRearUsbAlignment:()=>workbench.getRearUsbAlignment(root,
    assembly.rearUsbSockets[current?.selected?.motherboard||'b650']),
  getRearVideoAlignment:getVideoReceptacleAlignment,
  getCableExitAlignment:()=>cables.getFlexAlignment(),
  getCableRoutingReport:()=>cables.getRoutingReport(),
  getCableSocketAlignment:()=>cables.getSocketAlignment(),
  getInternalPlugAlignment:()=>{
    const id=current?.selected?.motherboard||'b650';
    const boardHeaders=assembly.internalHeaderModels[id]||{};
    const refs={...boardHeaders,gpu:assembly.gpuPowerHeader};
    root.updateMatrixWorld(true);
    return Object.entries(refs).map(([kind,header])=>{
      const side=['fan','sataData'].includes(kind)?0:1;
      const plugMesh=cables.getPlugMesh(kind,side);
      const plug=plugMesh?.getWorldPosition(new THREE.Vector3());
      const port=header?.getWorldPosition(new THREE.Vector3());
      const portNormal=header&&port?header.localToWorld(new THREE.Vector3(0,1,0))
        .sub(port).normalize():null;
      const plugNormal=plugMesh&&plug?plugMesh.localToWorld(new THREE.Vector3(0,1,0))
        .sub(plug).normalize():null;
      const angleDegrees=portNormal&&plugNormal?
        portNormal.angleTo(plugNormal)*180/Math.PI:null;
      return {kind,gapMm:port&&plug?port.distanceTo(plug)*MM_PER_UNIT:null,
        angleDegrees};
    });
  },
  getPsuPlugAlignment:()=>{
    root.updateMatrixWorld(true);
    return Object.entries(assembly.psuCableSockets).map(([kind,header])=>{
      const plugMesh=cables.getPlugMesh(kind,0);
      const plug=plugMesh?.getWorldPosition(new THREE.Vector3());
      const port=header.getWorldPosition(new THREE.Vector3());
      const expected=header.localToWorld(new THREE.Vector3(0,1,0))
        .sub(port).normalize();
      const axis=plugMesh&&plug?plugMesh.localToWorld(new THREE.Vector3(0,1,0))
        .sub(plug).normalize():null;
      return {kind,gapMm:plug?plug.distanceTo(port)*MM_PER_UNIT:null,
        angleDegrees:axis?axis.angleTo(expected)*180/Math.PI:null};
    });
  },
  getRearPortCounts:()=>({
    usb:assembly.rearUsbSockets[current?.selected?.motherboard||'b650']?.length||0,
    gpu:assembly.gpuBracketPorts.length}),
  getConnectorModels:()=>Object.fromEntries(['atx24','eps','gpu','sataData',
    'sataPower','frontPanel','frontUsb3','frontUsbC','fan','video']
    .map(id=>[id,cables.connectorTypes(id)])),
  getVideoPlugPosition:()=>externalVideoPlugs[activeVideoType].position.toArray(),
  getCasePowerScreenPoint,
  getFrontIOState:()=>({mounted:tower.root.visible,
    ledOn:tower.powerLed.material.emissiveIntensity>1,
    usbA:tower.frontUsbPorts.filter(p=>p.id==='frontUsb3').length,
    usbC:tower.frontUsbPorts.filter(p=>p.id==='frontUsbC').length,
    frontUsb3:!!current?.frontUsb3,frontUsbC:!!current?.frontUsbC,
    usb3CableVisible:cables.isVisible('frontUsb3'),
    usbCCableVisible:cables.isVisible('frontUsbC') }),
  getMountAlignment,
  // Zoom por botón con la misma interpolación que la rueda.
  zoom:amount=>smoothZoom.step(amount),
  focus:select3D
};
requestAnimationFrame(animate);
window.dispatchEvent(new Event('pc3d-ready'));
