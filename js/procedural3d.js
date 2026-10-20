// Hardware Simulator 7.0-alpha: modelos procedurales, sin archivos GLB.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { buildRealScale } from './partsRealScale.js';
import { createProceduralFan } from './fanProcedural.js';

const view=document.getElementById('viewport'),stage=document.getElementById('viewportWrap');
const renderer=new THREE.WebGLRenderer({canvas:view,antialias:true});
renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.8));
renderer.shadowMap.enabled=true;
renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.25;
const scene=new THREE.Scene();scene.background=new THREE.Color(0x101923);
scene.fog=new THREE.Fog(0x101923,20,44);
const camera=new THREE.PerspectiveCamera(41,1,.1,90);
camera.position.set(9.5,10.0,13.6);
const controls=new OrbitControls(camera,view);
controls.enableDamping=true;controls.enablePan=false;controls.minDistance=4.8;controls.maxDistance=24;
controls.maxPolarAngle=Math.PI/2.07;controls.target.set(.30,.72,0);
const pmrem=new THREE.PMREMGenerator(renderer),env=pmrem.fromScene(new RoomEnvironment());
scene.environment=env.texture;pmrem.dispose();
scene.add(new THREE.HemisphereLight(0xcceaff,0x0b1724,1.6));
const mainLight=new THREE.DirectionalLight(0xf3f8ff,3.2);mainLight.position.set(3.5,8,5.2);
mainLight.castShadow=true;mainLight.shadow.mapSize.set(1024,1024);mainLight.shadow.camera.left=-8;mainLight.shadow.camera.right=8;mainLight.shadow.camera.top=8;mainLight.shadow.camera.bottom=-8;mainLight.shadow.normalBias=.02;scene.add(mainLight);
const rim=new THREE.DirectionalLight(0x63e9bf,1.35);rim.position.set(-5,4,-4);scene.add(rim);

const metal=(c,rough=.4,met=.8)=>new THREE.MeshStandardMaterial({color:c,metalness:met,roughness:rough});
const materials={pcb:metal(0x123c37,.78,.2),pcbdark:metal(0x142e30,.78,.2),case:metal(0x222c39,.5,.75),black:metal(0x18212a,.55,.3),black2:metal(0x0e151d,.68,.15),silver:metal(0xb7c5d2,.28,.85),aluminium:metal(0x7c929d,.34,.83),gold:metal(0xe1b55d,.3,.82),green:metal(0x58e7ac,.3,.38),blue:metal(0x66a3ff,.3,.45),warn:metal(0xffbf64,.35,.3)};
const root=new THREE.Group();scene.add(root);
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

const assembly=buildRealScale({THREE,scene,group,rounded,box,cylinder,trace,label,fan,materials});

// Anillos de incidencias: anclados a la posición del conector seleccionado.
const markerGroup=new THREE.Group();scene.add(markerGroup);
const markerMaterial=new THREE.MeshBasicMaterial({
  color:0xffbb67,transparent:true,opacity:.95,depthTest:false
});
function marker(radius=.20){
  const obj=new THREE.Mesh(new THREE.TorusGeometry(radius,.030,8,32),markerMaterial);
  obj.rotation.x=Math.PI/2;obj.renderOrder=5;obj.visible=false;
  markerGroup.add(obj);return obj;
}
const markers={eps:marker(),ram:marker(.22),sata:marker(),gpu:marker(.24),fan:marker(.28)};
const powerLight=new THREE.PointLight(0x55ecae,0,5);
powerLight.position.set(-3,.8,-2.7);scene.add(powerLight);

let current=null;
const home=new Map(Object.entries(partGroups).map(([id,g])=>[id,g.position.clone()]));
const spreads={
  case:[0,0,0],board:[0,0,0],cpu:[-.20,.72,-.20],
  ram:[.50,.85,-.20],gpu:[.65,.55,.75],cooler:[-.45,.95,-.60],
  psu:[.30,.55,.55],storage:[.25,.35,-.25]
};
function sync(state){
  if(!state)return;
  current=state;
  const {anchors,needsSata}=assembly.configure(state);
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
  markers.eps.visible=shown.board&&shown.psu&&!state.eps;
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
function select3D(id){
  selected=id;
  if(highlight){
    scene.remove(highlight);
    highlight.geometry.dispose();
    highlight.material.dispose();
    highlight=null;
  }
  const obj=partGroups[id];
  if(!obj?.visible)return;
  highlight=new THREE.BoxHelper(obj,0x68e5c0);
  scene.add(highlight);
  window.dispatchEvent(new CustomEvent('pc3d-select',{detail:{part:id}}));
}
view.addEventListener('pointerdown',e=>{
  press={x:e.clientX,y:e.clientY};
});
view.addEventListener('pointerup',e=>{
  if(!press || Math.hypot(e.clientX-press.x,e.clientY-press.y)>7)return;
  const bounds=view.getBoundingClientRect();
  pointer.set(2*(e.clientX-bounds.left)/bounds.width-1,
     1-2*(e.clientY-bounds.top)/bounds.height);
  raycaster.setFromCamera(pointer,camera);
  const hits=raycaster.intersectObjects(
    Object.values(partGroups).filter(g=>g.visible),true);
  if(hits.length){
    let obj=hits[0].object;
    while(obj&&!obj.userData.partId)obj=obj.parent;
    if(obj?.userData.partId)select3D(obj.userData.partId);
  }
});
function resize(){
  const width=Math.max(1,stage.clientWidth),height=Math.max(1,stage.clientHeight);
  renderer.setSize(width,height,false);
  camera.aspect=width/height;
  camera.updateProjectionMatrix();
}
function resetView(){
  camera.position.set(9.5,10.0,13.6);
  controls.target.set(.30,.72,0);controls.update();
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
    desired.set(base.x+delta[0]*expanded,
      base.y+delta[1]*expanded+loose,base.z+delta[2]*expanded);
    part.position.lerp(desired,Math.min(1,dt*7));
  }
  // En rotación, los ventiladores de tarjeta y disipador miran de frente,
  // mientras que el de PSU apunta hacia arriba.
  const fast=!!current?.power&&!!current?.stress;
  for(const f of rotors){
    f.rotor.visible=!fast;
    f.blur.visible=fast;
    if(current?.power)f.rotor.rotation.y+=dt*(fast?16:5.4);
  }
  if(highlight){highlight.visible=!!partGroups[selected]?.visible;highlight.update();}
  controls.update();renderer.render(scene,camera);
}
window.PC3D={
  ready:true,
  update:sync,viewIso:resetView,
  viewTop:()=>{
    camera.position.set(.30,18,.001);controls.target.set(.30,.72,0);controls.update();
  },
  zoom:amount=>{
    const axis=camera.position.clone().sub(controls.target);
    const next=Math.max(4.8,Math.min(24,axis.length()+amount));
    camera.position.copy(controls.target).add(axis.normalize().multiplyScalar(next));
    controls.update();
  },
  focus:select3D
};
requestAnimationFrame(animate);
window.dispatchEvent(new Event('pc3d-ready'));
