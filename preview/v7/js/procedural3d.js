// Hardware Simulator 7.0-alpha: modelos procedurales, sin archivos GLB.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const view=document.getElementById('viewport'),stage=document.getElementById('viewportWrap');
const renderer=new THREE.WebGLRenderer({canvas:view,antialias:true});
renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.8));
renderer.shadowMap.enabled=true;
renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.25;
const scene=new THREE.Scene();scene.background=new THREE.Color(0x101923);
scene.fog=new THREE.Fog(0x101923,13,25);
const camera=new THREE.PerspectiveCamera(37,1,.1,60);
camera.position.set(5.9,6.0,7.8);
const controls=new OrbitControls(camera,view);
controls.enableDamping=true;controls.enablePan=false;controls.minDistance=3.5;controls.maxDistance=13;
controls.maxPolarAngle=Math.PI/2.07;controls.target.set(0,.55,0);
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
function fan(parent,x,y,z,r=.27){const housing=new THREE.Group();parent.add(housing);housing.position.set(x,y,z);
  cylinder(r,.07,materials.black2,housing,0,0,0);let ring=new THREE.Mesh(new THREE.TorusGeometry(r*.84,.027,7,42),materials.aluminium);ring.rotation.x=Math.PI/2;ring.position.y=.06;housing.add(ring);
  const rotor=new THREE.Group();rotor.position.y=.075;housing.add(rotor);cylinder(r*.17,.05,materials.silver,rotor,0,0,0);
  for(let i=0;i<7;i++){const a=i*Math.PI*2/7;const blade=rounded(r*.31,.026,r*.57,.035,materials.aluminium,rotor,Math.sin(a)*r*.40,0,Math.cos(a)*r*.40);blade.rotation.y=-a+.55}
  rotors.push(rotor);
  return housing;
}
const rotors=[];
const chassis=group('case');
// Bandeja de trabajo, tornillos y superficie de apoyo.
rounded(7.65,.17,5.6,.16,materials.case,chassis,.16,-.12,.13);
rounded(7.38,.08,5.34,.12,materials.black2,chassis,.16,.002,.13);
for(let x of [-3.22,3.4])for(let z of [-2.20,2.45])cylinder(.095,.03,materials.silver,chassis,x,.065,z,12);
// PLACA BASE: cuerpo, pistas, tornillos, slots y condensadores.
const board=group('board');
rounded(5.3,.11,3.55,.07,materials.pcb,board,-.30,.18,-.18);
for(let x of [-2.65,1.95])for(let z of [-1.60,1.22]){
  cylinder(.092,.014,materials.gold,board,x,.249,z,16);cylinder(.038,.018,materials.black2,board,x,.26,z,16);
}
// Pistas deterministas en torno a áreas funcionales.
for(let i=0;i<64;i++){
  let z=-1.49+(i%26)*.107, x=-2.65+(i%14)*.21;
  if((x>-.85&&x<.58&&z>-.98&&z<.38)||(x>.60&&x<1.75&&z<-1))continue;
  trace(x,z,x+.15+(i%3)*.07,z,(.244),i%5===0?materials.gold:materials.green,board,.005);
}
// Socket principal.
rounded(1.15,.08,1.15,.06,materials.silver,board,-.95,.30,-.54);
rounded(1.01,.04,1.01,.035,materials.black,board,-.95,.36,-.54);
const cpu=group('cpu');
rounded(.83,.045,.83,.025,materials.silver,cpu,-.95,.40,-.54);
let cpuText=label('CPU',.37,.14);cpuText.position.set(-.95,.429,-.54);cpu.add(cpuText);
// Ranuras y conectores RAM DDR5.
for(let i=0;i<4;i++){
  let x=.40+i*.34;rounded(.18,.10,2.04,.026,materials.black2,board,x,.31,-.55);
  for(let z of [-1.55,.45])box(.24,.10,.12,materials.silver,board,x,.34,z);
}
// PCIe y M2.
for(let z of [.67,1.13]){
  rounded(2.6,.10,.13,.015,materials.black2,board,-.75,.30,z);
  rounded(2.24,.015,.034,.003,materials.gold,board,-.75,.358,z);
}
for(let z of [.07,.37])rounded(1.5,.06,.12,.016,materials.black2,board,-1.4,.30,z);
// Puertos de borde, VRM, condensadores.
for(let i=0;i<9;i++) rounded(.18,.17,.17,.02,materials.black,board,-2.50+i*.24,.36,-1.37);
for(let i=0;i<18;i++) {
  const x=-2.58+(i%9)*.23,z=-1.03+Math.floor(i/9)*.27;
  if(x<-.85) cylinder(.045,.16,materials.aluminium,board,x,.38,z,12);
}
for(let i=0;i<5;i++)rounded(.16,.23,.25,.017,materials.aluminium,board,1.88,.38,-1.28+i*.48);
rounded(.68,.17,.65,.03,materials.aluminium,board,1.14,.37,.82);
rounded(.37,.22,.80,.04,materials.black2,board,2.22,.35,-.62);
rounded(.37,.20,.48,.03,materials.black2,board,-2.79,.35,-1.08);
for(let i=0;i<3;i++)rounded(.18,.21,.34,.01,materials.black2,board,-2.83,.35,.13+i*.39);
// RAM: dos módulos con chips y dientes metálicos.
const ram=group('ram');
for(let i=0;i<2;i++){
  const m=new THREE.Group();ram.add(m);m.position.set(.4+i*.67,.50,-.56);
  rounded(.105,.78,1.70,.025,materials.pcbdark,m,0,.30,0);
  for(let j=0;j<10;j++)box(.115,.075,.077,materials.gold,m,0,-.04,-.64+j*.142);
  for(let j=0;j<6;j++)rounded(.012,.26,.16,.006,materials.black2,m,.064,.33,-.6+j*.23);
  rounded(.14,.43,1.56,.055,materials.black,m,0,.39,0);
  const chip=label('DDR5',.62,.13);chip.position.set(.077,.44,0);chip.rotation.set(0,Math.PI/2,0);m.add(chip);
  rounded(.155,.035,1.42,.01,materials.silver,m,0,.626,0);
}
// Cooler: heatpipes, aletas y ventilador superior.
const cooler=group('cooler');cooler.position.set(-.95,.45,-.54);
for(let i=0;i<14;i++)rounded(1.07,.035,.94,.018,materials.aluminium,cooler,0,.21+i*.076,0);
for(let x of [-.34,.34])for(let z of [-.25,.25])cylinder(.038,1.18,materials.gold,cooler,x,.57,z,10);
fan(cooler,0,1.31,0,.40);
// GPU con dos ventiladores.
const gpu=group('gpu');gpu.position.set(-.75,.60,.95);
rounded(3.1,.11,.98,.07,materials.pcbdark,gpu,0,0,0);
rounded(2.98,.33,.98,.1,materials.black,gpu,0,.29,0);
rounded(2.92,.055,.88,.07,materials.aluminium,gpu,0,.49,0);
for(let i=0;i<17;i++)box(.055,.16,.66,materials.silver,gpu,-1.35+i*.17,.22,0);
for(let i=0;i<2;i++)fan(gpu,-.72+i*1.43,.56,0,.34);
rounded(.27,.18,.28,.025,materials.black2,gpu,1.22,.60,-.25);
for(let i=0;i<6;i++)box(.05,.025,.09,materials.gold,gpu,-1.3+i*.12,-.06,.35);
// PSU compacta.
const psu=group('psu');psu.position.set(2.80,.39,1.40);
rounded(1.33,.76,1.25,.075,materials.case,psu,0,0,0);
rounded(1.17,.07,1.09,.05,materials.black,psu,0,.40,0);
fan(psu,0,.45,0,.42);
for(let i=0;i<3;i++)rounded(.05,.22,.19,.02,materials.black2,psu,-.46+i*.17,.13,-.6);
// Toma de tierra, contactos y pequeños detalles del banco.
const grid=new THREE.GridHelper(18,36,0x304e5b,0x1b303e);grid.position.y=-.32;scene.add(grid);
const floor=new THREE.Mesh(new THREE.PlaneGeometry(200,200),metal(0x111c25,.92,.08));floor.rotation.x=-Math.PI/2;floor.position.y=-.35;floor.receiveShadow=true;scene.add(floor);

// Disco SATA y módulo NVMe (geometría procedural).
const storage=group('storage');
const sataDrive=new THREE.Group();storage.add(sataDrive);
rounded(1.02,.18,.68,.045,materials.black,sataDrive,1.35,.40,.34);
rounded(.80,.012,.44,.01,materials.aluminium,sataDrive,1.35,.50,.34);
const ssdLabel=label('SSD',.43,.15);ssdLabel.position.set(1.35,.51,.34);sataDrive.add(ssdLabel);
const m2Drive=new THREE.Group();storage.add(m2Drive);
rounded(1.18,.045,.24,.015,materials.pcbdark,m2Drive,-1.45,.35,.24);
for(let i=0;i<5;i++) rounded(.12,.025,.14,.01,materials.black2,m2Drive,-1.85+i*.18,.387,.24);
box(.13,.014,.21,materials.gold,m2Drive,-.88,.36,.24);

// Marcadores de conectores y pasos pendientes: solo son indicadores visuales.
// El estado real continúa dependiendo del simulador de montaje y POST.
const markerGroup=new THREE.Group();scene.add(markerGroup);
const markerMaterial=new THREE.MeshBasicMaterial({
  color:0xffb85b,transparent:true,opacity:.95,depthTest:false
});
function makeMarker(x,y,z,r=.19) {
  const marker=new THREE.Mesh(new THREE.TorusGeometry(r,.025,7,32),markerMaterial);
  marker.rotation.x=Math.PI/2;
  marker.position.set(x,y,z);
  marker.visible=false;
  marker.renderOrder=5;
  markerGroup.add(marker);
  return marker;
}
const markers={
  eps:makeMarker(-2.79,.59,-1.07),
  ram:makeMarker(.40,1.13,-.56,.23),
  sata:makeMarker(2.22,.59,.10),
  gpu:makeMarker(.47,1.33,.70),
  fan:makeMarker(-.95,1.97,-.54,.27)
};
const led=new THREE.PointLight(0x54edbd,0,3);
led.position.set(-2.4,.72,-1.48);
scene.add(led);

let current=null;
const home=new Map(Object.entries(partGroups).map(([k,v])=>[k,v.position.clone()]));
const spreads={
  case:[0,0,0],board:[0,0,0],cpu:[-.3,.8,-.3],ram:[.25,1.25,-.3],
  gpu:[-.3,1.15,.65],cooler:[-.55,1.55,-.3],psu:[.5,.85,.55],
  storage:[.2,.7,.45]
};
function sync(s) {
  if(!s)return;
  current=s;
  const installed=s.installed||{};
  const visible={
    case:!!installed.case,
    board:!!installed.motherboard,
    cpu:!!installed.cpu,
    ram:!!installed.ram,
    gpu:!!installed.gpu && s.selected?.gpu!=='none',
    cooler:!!installed.cooler,
    psu:!!installed.psu,
    storage:!!installed.storage
  };
  for(const [key,group] of Object.entries(partGroups))group.visible=!!visible[key];
  const isSata=s.selected?.storage==='sataSSD'||s.selected?.storage==='hdd';
  sataDrive.visible=isSata;
  m2Drive.visible=!isSata;
  markers.eps.visible=visible.board&&visible.psu&&!s.eps;
  markers.ram.visible=visible.ram&&!s.ramSeated;
  markers.sata.visible=visible.storage&&isSata&&(!s.sataData||!s.sataPower);
  markers.gpu.visible=visible.gpu&&!s.gpuPower;
  markers.fan.visible=visible.cooler&&!s.cpuFan;
  led.intensity=s.power?0.7:0;
}
const raycaster=new THREE.Raycaster();
const pointer=new THREE.Vector2();
let down=null, selectionHelper=null,selected='';
function select3D(id) {
  selected=id;
  if(selectionHelper){
    scene.remove(selectionHelper);
    selectionHelper.geometry.dispose();
    selectionHelper.material.dispose();
    selectionHelper=null;
  }
  const group=partGroups[id];
  if(!group||!group.visible)return;
  selectionHelper=new THREE.BoxHelper(group,0x56eac0);
  scene.add(selectionHelper);
  window.dispatchEvent(new CustomEvent('pc3d-select',{detail:{part:id}}));
}
view.addEventListener('pointerdown',e=>{
  down={x:e.clientX,y:e.clientY};
});
view.addEventListener('pointerup',e=>{
  if(!down||Math.hypot(e.clientX-down.x,e.clientY-down.y)>7)return;
  const b=view.getBoundingClientRect();
  pointer.set(((e.clientX-b.left)/b.width)*2-1, -((e.clientY-b.top)/b.height)*2+1);
  raycaster.setFromCamera(pointer,camera);
  const hits=raycaster.intersectObjects(Object.values(partGroups).filter(g=>g.visible),true);
  if(hits.length){
    let obj=hits[0].object;
    while(obj&&!obj.userData.partId)obj=obj.parent;
    if(obj?.userData.partId)select3D(obj.userData.partId);
  }
});
function resize(){
  const w=Math.max(1,stage.clientWidth),h=Math.max(1,stage.clientHeight);
  renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();
}
function resetView(){
  camera.position.set(5.9,6,7.8);
  controls.target.set(0,.55,0);controls.update();
}
if(typeof ResizeObserver!=='undefined')new ResizeObserver(resize).observe(stage);
window.addEventListener('resize',resize);
resize();
const tmp=new THREE.Vector3();
let previous=performance.now();
function tick(time){
  requestAnimationFrame(tick);
  if(document.hidden){previous=time;return;}
  const dt=Math.min(.05,Math.max(0,(time-previous)/1000));previous=time;
  for(const [id,g] of Object.entries(partGroups)){
    const base=home.get(id),offset=spreads[id],e=current?.explode?1:0;
    const loose=id==='ram'&&current?.installed?.ram&&!current?.ramSeated? .22:0;
    tmp.set(base.x+offset[0]*e,base.y+offset[1]*e+loose,base.z+offset[2]*e);
    g.position.lerp(tmp,Math.min(1,dt*7));
  }
  if(current?.power)for(const rotor of rotors)rotor.rotation.y+=dt*4.5;
  if(selectionHelper){selectionHelper.visible=!!partGroups[selected]?.visible;selectionHelper.update();}
  controls.update();
  renderer.render(scene,camera);
}
window.PC3D={
  ready:true,
  update:sync,
  viewIso:resetView,
  viewTop:()=>{
    camera.position.set(0,9,.001);controls.target.set(0,.55,0);controls.update();
  },
  zoom:d=>{
    const dir=camera.position.clone().sub(controls.target);
    const next=Math.max(3.5,Math.min(13,dir.length()+d));
    camera.position.copy(controls.target).add(dir.normalize().multiplyScalar(next));
    controls.update();
  },
  focus:id=>select3D(id)
};
requestAnimationFrame(tick);
window.dispatchEvent(new Event('pc3d-ready'));
