import { BOARD_LAYOUTS, MOTHERBOARD_MOUNT, getMotherboardMountPoints, MM_PER_UNIT,
  REAR_CASE_FAN_Y, FRONT_IO_LAYOUT, getFrontUsbHeaders,
  REAR_USB_COUNT, getRearUsbAnchor, getRearVideoAnchor } from '../js/partsRealScale.js';
import {REAR_PORT_SPECS,portOutline} from '../js/portProfiles.js';
import {getPlugExitDistance,INTERNAL_HEADER_SPECS} from '../js/connectors3d.js';
import {getInternalHeaderAnchor,getGpuPowerAnchor} from '../js/partsRealScale.js';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
const html=read('index.html');
const source=html.match(/<script>\s*const \$=id=>document\.getElementById\(id\);([\s\S]*?)<\/script>/)?.[0].replace(/<\/?script>/g,'');
assert(source,'Inline script missing');
const elements={};let errors=[];
const get=id=>elements[id]||(elements[id]={
 id,innerHTML:'',textContent:'',scrollTop:0,value:'ssd',hidden:true,dataset:{},
 style:{setProperty(){}},classList:{add(){},remove(){},toggle(){}},
 addEventListener(){},querySelector(){return null},querySelectorAll(){return []},
 getBoundingClientRect(){return {left:0,top:0,width:1200,height:600};}
});
const document={getElementById:get,querySelectorAll:()=>[],addEventListener(){},
 body:{classList:{add(){},remove(){}}}};
const window={PC3D:null,addEventListener(){},dispatchEvent(){}};
const ctx=vm.createContext({window,document,console:{log(){},error(...a){errors.push(String(a[0]));}},
 setTimeout:()=>0,Date,Math,Intl});
for(const path of ['js/hardwareExpansion.js','js/adventureMode.js','js/partInspector.js'])
 vm.runInContext(read(path),ctx,{filename:path});
vm.runInContext(source+';globalThis.lab={get s(){return state},get g(){return adventureGame},autoBuild,power,bios,calculateThermals};',
 ctx,{filename:'index.html'});
const l=ctx.lab,g=l.g;
assert(g.active);
l.autoBuild();assert(!g.active&&l.s.installed.motherboard);
l.power();assert(l.s.power);l.bios();assert(l.s.bios);
g.start('office');
const caseRenders=[];
const viewEvents=[];
window.PC3D={
  ready:true,
  update(state){if(state.installed.case)
    caseRenders.push(state.selected.caseVariant);},
  updateStaging(){},
  viewStaging(){viewEvents.push('staging')},
  viewAssemblyDesk(){viewEvents.push('assembly')}
};
const buy=(c,id)=>g.purchase(c,id);
const fit=k=>{g.select(k);g.perform('fit')};
buy('case','towerWhite');fit('case:towerWhite');
assert.equal(l.s.selected.caseVariant,'towerWhite');
assert.equal(caseRenders.at(-1),'towerWhite','3D debe dibujar el acabado antes del encaje');
assert(viewEvents.includes('assembly'),'Al montar caja enfoca la mesa principal');
buy('item','ioShield');fit('item:ioShield');
buy('psu','psu450');fit('psu:psu450');
buy('motherboard','b650');fit('motherboard:b650');
assert(!l.s.installed.motherboard);
g.perform('route');assert(l.s.psuAccessRouted);
fit('motherboard:b650');assert(l.s.installed.motherboard);
buy('item','keyboard');buy('item','mouse');
g.connect('keyboard');g.connect('mouse');
assert(l.s.keyboardConnected&&l.s.mouseConnected);
g.disconnect('keyboard');assert(!l.s.keyboardConnected);
g.connect('frontusb3');g.connect('frontusbc');
assert(l.s.frontUsb3&&l.s.frontUsbC,'Los cables de panel frontal deben ser conectables');
g.disconnect('frontusb3');
assert(!l.s.frontUsb3&&l.s.frontUsbC,'Cada cable USB tiene estado independiente');
buy('item','rgbStrip');g.select('item:rgbStrip');g.perform('apply');
assert(l.s.rgbInstalled);
buy('cpu','r7600');fit('cpu:r7600');
buy('item','paste');g.select('item:paste');g.perform('apply');
buy('cooler','aio240');fit('cooler:aio240');
assert.equal(l.s.selected.cooler,'aio240');
l.s.cpuFan=true;
const aio=l.calculateThermals([]);
l.s.selected.cooler='stock';
assert(aio<l.calculateThermals([]));
g.start('office');
buy('case','towerGraphite');fit('case:towerGraphite');
assert.equal(l.s.selected.caseVariant,'towerGraphite');
assert.equal(caseRenders.at(-1),'towerGraphite',
  'El material grafito debe llegar al render 3D en el mismo frame');
assert(!errors.length,'Browser mock errors: '+errors.join(', '));
// Regresión: no dejar la motherboard suspendida sobre los separadores.
const mount=MOTHERBOARD_MOUNT;
const bottom=mount.pcbCenterY-mount.pcbThickness/2+mount.offsetY;
assert(Math.abs(bottom-(mount.trayTopY+mount.standoffHeight))*MM_PER_UNIT<.1);
assert.equal(mount.standoffHeight*MM_PER_UNIT,6.5);
for(const [id,cfg] of Object.entries(BOARD_LAYOUTS)){
  const holes=getMotherboardMountPoints(cfg);
  assert.equal(holes.length,4,id);
  assert.equal(new Set(holes.map(v=>v.join(':'))).size,4,id);
  assert(holes.every(([x,z])=>x>=-4.055&&x<=1.695&&z>=-3.33&&z<=3.31),id);
}
// Traslado del ventilador, por fuera de la chapa I/O y dentro de la caja.
const rearIOUpper=MOTHERBOARD_MOUNT.offsetY+1.04+.05;
assert(REAR_CASE_FAN_Y-1.13>rearIOUpper+.15,'Ventilador trasero invade la chapa I/O');
assert(REAR_CASE_FAN_Y+1.13<3.88,'Ventilador trasero atraviesa el lateral');
assert.equal(FRONT_IO_LAYOUT.usbA.length,2);
assert(FRONT_IO_LAYOUT.usbC[2]<-3.32,'USB-C debe sobresalir de la cubierta');
for(const cfg of Object.values(BOARD_LAYOUTS)){
  const headers=getFrontUsbHeaders(cfg);
  assert(headers.usb3[0]<cfg.x+cfg.w/2,'USB3 dentro de PCB');
  assert(headers.usbC[0]<cfg.x+cfg.w/2,'USB-C dentro de PCB');
}
assert(html.includes('pc3d-case-power'),'El botón 3D debe invocar la acción POWER');
// La hilera USB de la chapa I/O es la única referencia para los cables
// externos. Los índices cambian de altura pero no pierden la línea del I/O.
assert.equal(REAR_USB_COUNT,5);
for(const [id,cfg] of Object.entries(BOARD_LAYOUTS)){
  const sockets=Array.from({length:REAR_USB_COUNT},(_,i)=>getRearUsbAnchor(cfg,i));
  assert.equal(new Set(sockets.map(v=>v.join(','))).size,5,id);
  for(let i=0;i<REAR_USB_COUNT;i++){
    assert(Math.abs(sockets[i][1]-(MOTHERBOARD_MOUNT.offsetY+.51))<1e-10,id);
    const shieldPortZ=cfg.z-cfg.d/2+1.58-1.03+i*.50;
    assert(Math.abs(sockets[i][2]-shieldPortZ)<1e-10,id);
    assert(Math.abs(sockets[i][0]-(cfg.x-cfg.w/2-.165))<1e-10,id);
  }
  const video=getRearVideoAnchor(cfg);
  assert(Math.abs(video[2]-(cfg.z-cfg.d/2+.38))<1e-10,id);
}
assert.throws(()=>getRearUsbAnchor(BOARD_LAYOUTS.b650,5),RangeError);
const connectorSource=read('js/connectors3d.js');
for(const kind of ['atx24','eps','gpu','frontUsb3','frontUsbC','frontPanel',
  'sataData','sataPower','fan','usbA','usbC','hdmi'])
  assert(connectorSource.includes("'"+kind+"'"),'Conector no modelado: '+kind);
assert(read('js/workbench3d.js').includes('getRearUsbAnchor'));
// Misma geometría de perfil en la boca hembra y punta macho.
assert.equal(portOutline('usbA').length,4);
assert.equal(portOutline('hdmi').length,6,'HDMI debe ser trapezoidal');
assert.equal(portOutline('displayPort').length,5,'DP requiere esquina biselada');
assert(REAR_PORT_SPECS.displayPort.width>REAR_PORT_SPECS.usbA.width);
const ports=read('js/rearPorts3d.js'),board=read('js/partsRealScale.js');
assert(ports.includes('portBezelGeometry'));
assert(board.includes("createRearReceptacle3d(THREE,'usbA')"));
assert(board.includes('gpuBracketPorts'));
assert(board.includes('rearUsbSockets[id].push(socket)'));
assert(read('js/workbench3d.js').includes('const real=receptacles[row.portIndex]'));
assert(read('js/procedural3d.js').includes('getRearVideoAlignment:getVideoReceptacleAlignment'));
assert(read('js/workbench3d.js').includes('alignRearPlug(THREE,plug,assemblyRoot)'));
assert(read('js/procedural3d.js').includes('alignRearPlug(THREE,plug,root)'));
assert(read('js/portProfiles.js').includes('getWorldQuaternion'));
assert(read('js/cablesProcedural.js').includes('wires.video.visible=false'));
// Regresión 8.4.7: NUNCA termina el flexible dentro del sobremolde.
const rigidKinds=['usbA','usbC','hdmi','displayPort','atx24','eps','gpu',
  'sataData','sataPower','frontPanel','frontUsb3','frontUsbC','fan'];
for(const kind of rigidKinds){
  const mm=getPlugExitDistance(kind)*MM_PER_UNIT;
  assert(mm>25&&mm<65,'Salida flexible fuera del guardacable: '+kind);
}
for(const type of ['atx24','eps','gpu','frontUsb3','frontUsbC',
  'frontPanel','fan','sataData','sataPower']){
  const spec=INTERNAL_HEADER_SPECS[type];
  assert(spec&&spec.depth>.12&&spec.w>.18&&spec.d>.16,type);
}
for(const [id,cfg] of Object.entries(BOARD_LAYOUTS)){
  for(const kind of ['atx24','eps','frontPanel','frontUsb3','frontUsbC','fan','sataData']){
    const a=getInternalHeaderAnchor(cfg,kind);
    assert(a.every(Number.isFinite),id+' '+kind);
    assert(a[0]>cfg.x-cfg.w/2-.1&&a[0]<cfg.x+cfg.w/2+.1,id+' '+kind);
  }
  for(const gpu of ['rx7600','rtx4070'])
    assert(getGpuPowerAnchor(cfg,gpu).every(Number.isFinite));
}
const cableSource=read('js/cablesProcedural.js');
const workbenchSource=read('js/workbench3d.js');
const proceduralSource=read('js/procedural3d.js');
assert(cableSource.includes('const exits=plugs.map(plug=>getCableExit'));
assert(workbenchSource.includes('const tail=getCableExit(THREE,plug)'));
assert(proceduralSource.includes('const flex=getCableExit(THREE,plug)'));
assert(cableSource.includes("getInternalHeaderAnchor(cfg,'frontPanel')"));
assert(read('js/partsRealScale.js').includes('psuCableSockets'));
// Regresión 8.4.8: el eje de la clavija lo determina el puerto, NO la curva.
const harness=read('js/cablesProcedural.js');
assert(harness.includes('const port=physicalHeader(id,side,boardId)'));
assert(harness.includes('port.localToWorld(up.clone())'));
assert(harness.includes('scene.worldToLocal(outward).sub(p).normalize()'));
assert(harness.includes('plug.quaternion.setFromUnitVectors(up,pose.normal)'));
assert(!harness.includes('next.sub(plug.position)'),
  'Los waypoints no deben orientar el enchufe');
assert(harness.includes('getCableExit(THREE,plug,root)'));
assert(harness.includes('const straightLength='));
assert(harness.includes('tube(g,[exits[side].toArray(),knees[side].toArray()]'));
assert(harness.includes('straightMm'));
assert(read('js/procedural3d.js').includes('createCableHarness(THREE,root,assembly)'));
assert(read('js/procedural3d.js').includes('angleDegrees:axis?axis.angleTo(expected)'));
console.log('Smoke OK: demo, BIOS, PSU, USB, RGB, AIO and 3D case finishes');
