import { BOARD_LAYOUTS, MOTHERBOARD_MOUNT, getMotherboardMountPoints, MM_PER_UNIT,
  REAR_CASE_FAN_Y, FRONT_IO_LAYOUT, getFrontUsbHeaders,
  REAR_USB_COUNT, getRearUsbAnchor, getRearVideoAnchor } from '../js/partsRealScale.js';
import {REAR_PORT_SPECS,portOutline} from '../js/portProfiles.js';
import {getPlugExitDistance,INTERNAL_HEADER_SPECS} from '../js/connectors3d.js';
import {planCableRoute,routeCollisions,cableObstacles}
  from '../js/cableRouting3d.js';
import {getInternalHeaderAnchor,getGpuPowerAnchor,
  HDD_BAY_LAYOUT,getHddBayPosition,
  SSD_BAY_LAYOUT,getSsdBayPosition} from '../js/partsRealScale.js';
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
 addEventListener(type,fn){this.events??={};this.events[type]=fn;},
 querySelector(){return null},querySelectorAll(){return []},
 getBoundingClientRect(){return {left:0,top:0,width:1200,height:600};}
});
const document={getElementById:get,querySelectorAll:()=>[],addEventListener(){},
 body:{classList:{add(){},remove(){}}}};
const window={PC3D:null,addEventListener(){},dispatchEvent(){}};
const ctx=vm.createContext({window,document,console:{log(){},error(...a){errors.push(String(a[0]));}},
 setTimeout:()=>0,Date,Math,Intl});
for(const path of ['js/workshopTools.js','js/classroom.js','js/osEmulation.js','js/timeEngine.js','js/mishapEngine.js','js/ramPrecision.js','js/screwPrecision.js','js/cpuPrecision.js','js/thermalPaste.js','js/pasteGameplay.js','js/operationEngine.js','js/hardwareExpansion.js','js/adventureMode.js','js/partInspector.js'])
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
buy('cpu','r7600');g.toggleCpuPrecision();fit('cpu:r7600');
buy('item','paste');g.select('item:paste');g.togglePastePractice();g.perform('apply');
buy('cooler','aio240');fit('cooler:aio240');
assert.equal(l.s.selected.cooler,'aio240','Disipador: '+JSON.stringify({installed:l.s.installed.cooler,selected:g.game.selected,feedback:g.game.lastFeedback,tools:g.getWorkshop(),paste:l.s.paste,cpu:l.s.installed.cpu}));
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
assert(read('js/procedural3d.js').includes('createCableHarness(THREE,root,assembly,tower)'));
assert(read('js/procedural3d.js').includes('angleDegrees:axis?axis.angleTo(expected)'));
// 8.4.9: las diez cabeceras existen en la PCB y llegan justo a su
// superficie. Los conectores SYS_FAN no terminan en la pista vacía.
for(const [id,cfg] of Object.entries(BOARD_LAYOUTS)){
  const kinds=['atx24','eps','frontPanel','frontUsb3','frontUsbC','sataData',
    'fan','caseFan0','caseFan1','caseFan2'];
  const points=kinds.map(kind=>{
    const xyz=getInternalHeaderAnchor(cfg,kind);
    const model=kind.startsWith('caseFan')?'fan':kind;
    assert(Math.abs(xyz[1]-MOTHERBOARD_MOUNT.offsetY-.355-
      INTERNAL_HEADER_SPECS[model].depth)<1e-7,id+' '+kind+' flota sobre PCB');
    return [kind,xyz];
  });
  assert.equal(new Set(points.map(([kind,p])=>p[0]+':'+p[2])).size,kinds.length,id);
  // El DIMM más cercano al borde no debe atravesar el ATX24.
  const ramMax=Math.max(...cfg.dimmXs);
  assert(ramMax+.09<cfg.atxX-INTERNAL_HEADER_SPECS.atx24.w/2,
    id+' RAM invadiendo header de 24p');
  const source=[.40,1.60,4.27];
  const atx=getInternalHeaderAnchor(cfg,'atx24');
  const routed=planCableRoute({id:'atx24',cfg,start:source,
    end:[atx[0],1.55,atx[2]],startRole:'psu',endRole:'board'});
  assert(routed.points.length>=5,id+' mazo ATX sin pasillo trasero');
  assert(routed.points.some(p=>p[1]<-.65),id+' ATX no pasa detrás de bandeja');
  assert.equal(routed.collisions.length,0,id+' ATX atraviesa objetos: '+JSON.stringify(routed.collisions));
  const eps=getInternalHeaderAnchor(cfg,'eps');
  const power=planCableRoute({id:'eps',cfg,start:[.40,1.60,4.87],
    end:[eps[0],1.55,eps[2]],startRole:'psu',endRole:'board'});
  assert.equal(power.collisions.length,0,id+' EPS atraviesa objetos: '+JSON.stringify(power.collisions));
}
assert(read('js/partsRealScale.js').includes('sataSsdPorts'));
assert(read('js/partsRealScale.js').includes('caseFanSourcePorts'));
assert(read('js/towerATX.js').includes('frontIOHeaders'));
assert(read('js/cablesProcedural.js').includes('planCableRoute({id,cfg:activeConfig'));
assert(read('js/cablesProcedural.js').includes('physicalHeader(id,side,boardId)'));
assert(read('js/procedural3d.js').includes('getCableRoutingReport'));
// 8.4.10: el HDD real, en ambas capacidades, ocupa una bahía de la jaula
// inferior; no debe quedar por debajo de las guías como ocurría con Y=.31.
const [hx,hy,hz]=getHddBayPosition('upper');
const [cw,ch,cd]=HDD_BAY_LAYOUT.driveSize;
assert.deepEqual([hx,hz],[HDD_BAY_LAYOUT.cageCenter[0],HDD_BAY_LAYOUT.cageCenter[2]]);
assert(hy>HDD_BAY_LAYOUT.shelfLevels[1],'HDD bajo la plataforma superior');
assert(hy+ch<HDD_BAY_LAYOUT.shelfLevels[2],'HDD atraviesa techo de bahía');
assert(hx-cw/2>HDD_BAY_LAYOUT.insideX[0]);
assert(hx+cw/2<HDD_BAY_LAYOUT.insideX[1]);
assert(cd/2<Math.abs(HDD_BAY_LAYOUT.sideWallZ[0]));
assert(getHddBayPosition('lower')[1]<HDD_BAY_LAYOUT.shelfLevels[1]);
assert.throws(()=>getHddBayPosition('lateral'),RangeError);
const model=read('js/partsRealScale.js');
assert(model.includes("hddDrive.position.set(...getHddBayPosition('upper'))"));
assert(model.includes('storageBays.visible=false'),'No deben renderizarse bahías falsas');
const towerSource=read('js/towerATX.js');
assert(towerSource.includes('HDD_BAY_LAYOUT.shelfLevels'));
assert(towerSource.includes('hddCage.position.set(...HDD_BAY_LAYOUT.cageCenter)'));
const routeSource=read('js/cableRouting3d.js');
assert(routeSource.includes('HDD_BAY_LAYOUT.driveBaseY'));
assert(routeSource.includes('HDD_BAY_LAYOUT.insideX[0]-.17'));
assert(read('js/procedural3d.js').includes('getHddBayAlignment'));
// 8.4.11: SATA SSD tampoco puede quedar detrás de la bandeja de placa.
const [sx,sy,sz]=getSsdBayPosition();
assert.equal(sx,HDD_BAY_LAYOUT.cageCenter[0]);
assert.equal(sz,HDD_BAY_LAYOUT.cageCenter[2]);
assert(sy>HDD_BAY_LAYOUT.shelfLevels[0]);
assert(sy+SSD_BAY_LAYOUT.driveSize[1]<HDD_BAY_LAYOUT.shelfLevels[1]);
assert(sx-SSD_BAY_LAYOUT.driveSize[0]/2>HDD_BAY_LAYOUT.insideX[0]);
assert(sx+SSD_BAY_LAYOUT.driveSize[0]/2<HDD_BAY_LAYOUT.insideX[1]);
assert(SSD_BAY_LAYOUT.adapterSize[0]>SSD_BAY_LAYOUT.driveSize[0]);
assert(SSD_BAY_LAYOUT.adapterSize[2]>SSD_BAY_LAYOUT.driveSize[2]);
assert(read('js/partsRealScale.js').includes('sataDrive.position.set(...getSsdBayPosition())'));
assert(read('js/towerATX.js').includes('rearSSD.visible=false'));
assert(read('js/towerATX.js').includes('shroudRoof.visible=!driveInspection'));
assert(read('js/towerATX.js').includes('ssdAdapter.visible=!!installed'));
assert(read('js/procedural3d.js').includes('viewDriveBays'));
assert(read('js/procedural3d.js').includes('getStorageBayAlignment'));
assert(html.includes('id="viewDriveBays"'));
// 8.5.0 — arranque únicamente desde USB instalador o disco con SO.
const os=window.PC_OS;
assert.equal(Object.keys(os.CATALOG).length,3);
assert.equal(os.storageCapacityGb('hdd','HDD SATA 2 TB'),2000);
const machine={power:true,bios:false,monitorCable:true,keyboardConnected:true,
 installed:{storage:true},
 selected:{storage:'sataSSD'},sataData:true,sataPower:true,
 usbConnected:false,usbImage:'none',installedOs:null,osInstalled:false,
 biosCfg:{boot:'ssd',bootOrder:['ssd','usb','pxe'],secure:'on',uefi:'on',sata:'AHCI'}};
const hardware={post:true,disk:{interface:'SATA',name:'SSD SATA 1 TB'},diskGb:1000,ramGb:16};
assert.equal(os.resolveBoot(machine,hardware).code,'NO_BOOTABLE_DEVICE');
machine.biosCfg.boot='usb';machine.biosCfg.bootOrder=['usb','ssd','pxe'];
assert.equal(os.resolveBoot(machine,hardware).code,'NO_BOOTABLE_DEVICE',
  'USB vacío no debe simular un instalador');
machine.usbConnected=true;machine.usbImage='novadesk';
machine.biosCfg.secure='off';
assert.equal(os.resolveBoot(machine,hardware).code,'SECURE_BOOT_REQUIRED');
assert.equal(os.canInstall(machine,hardware).code,'SECURE_BOOT_REQUIRED');
machine.biosCfg.secure='on';machine.biosCfg.uefi='off';
assert.equal(os.canInstall(machine,hardware).code,'UEFI_REQUIRED');
machine.biosCfg.uefi='on';
assert.equal(os.resolveBoot(machine,hardware).kind,'installer');
assert.equal(os.canInstall(machine,{...hardware,diskGb:40}).code,'DISK_TOO_SMALL');
machine.sataData=false;
assert.equal(os.canInstall(machine,hardware).code,'DISK_NOT_READY');
machine.sataData=true;
assert.equal(os.canInstall(machine,hardware).ok,true);
assert.equal(os.installRecord(machine,hardware).ok,true);
assert.equal(machine.installedOs.id,'novadesk');
assert.equal(machine.installedOs.storageId,'sataSSD');
machine.biosCfg.boot='ssd';machine.biosCfg.bootOrder=['ssd','usb','pxe'];
assert.equal(os.resolveBoot(machine,hardware).kind,'desktop');
machine.selected.storage='hdd';machine.usbConnected=false;
assert.equal(os.resolveBoot(machine,hardware).code,'NO_BOOTABLE_DEVICE',
  'Un disco sin el SO instalado no debe arrancar');
machine.usbConnected=true;machine.usbImage='libreforge';
machine.biosCfg.boot='usb';machine.biosCfg.bootOrder=['usb','ssd','pxe'];
machine.biosCfg.secure='off';machine.biosCfg.uefi='off';
assert.equal(os.canInstall(machine,hardware).ok,true,
  'La distribución abierta ficticia permite firmware sin Secure Boot');
const blank={...machine,installed:{storage:false},usbConnected:false};
assert.equal(os.resolveBoot(blank,hardware).code,'NO_BOOTABLE_DEVICE');
const htmlOS=read('index.html');
for(const id of ['osUsbImage','osUsbToggle','osInstallBtn','biosUefi'])
  assert(htmlOS.includes('id="'+id+'"'),'Falta control SO: '+id);
assert(read('js/workbench3d.js').includes('window.PC_OS?.paint'));
assert(read('js/procedural3d.js').includes('details.osVisual||null'));
// 8.5.1: comprar/preparar memorias con costes independientes, conectarlas,
// expulsarlas y no permitir que el USB vacío arranque.
g.start('office');
buy('item','osusb');
assert.equal(g.game.spent,12,'Coste de una memoria USB sin preparar');
assert.equal(g.connectInstallerUsb('item:osusb'),false);
assert.equal(g.hasInstallerUSB(),false);
assert.equal(g.prepareUsb('novadesk'),true);
assert.equal(g.game.spent,39,'USB 12 € + preparación NovaDesk 27 €');
assert.equal(g.game.stock['item:osusb'],0);
assert.equal(g.game.stock['item:usbNova'],1);
assert.equal(g.hasInstallerUSB(),true);
assert.equal(g.connectInstallerUsb('item:usbNova'),false,'Sin placa base no hay USB-A');
buy('case','tower');fit('case:tower');
buy('item','ioShield');fit('item:ioShield');
buy('motherboard','b650');fit('motherboard:b650');
assert.equal(g.connectInstallerUsb('item:usbNova'),true);
assert.equal(l.s.usbConnected,true);
assert.equal(l.s.usbImage,'novadesk');
assert.equal(l.s.usbMediaKey,'item:usbNova');
assert.equal(g.returnItem('item:usbNova'),false,'No devolver un USB conectado');
buy('item','usbLibre');
assert.equal(g.game.stock['item:usbLibre'],1);
assert.equal(g.connectInstallerUsb('item:usbLibre'),false,'Un solo puerto USB simulado');
assert.equal(g.disconnectInstallerUsb(),true);
assert.equal(g.connectInstallerUsb('item:usbLibre'),true);
assert.equal(l.s.usbImage,'libreforge');
assert.equal(g.disconnectInstallerUsb(),true);
assert.equal(l.s.usbImage,'none');
assert(!l.s.usbConnected);
assert(read('js/adventureMode.js').includes('data-prepare-usb'));
assert(read('js/adventureMode.js').includes('data-connect-usb'));
assert(read('js/workbench3d.js').includes('getInstallerUsbPose'));
assert(read('js/procedural3d.js').includes('getInstallerUsbPose:'));
// 8.6 — importación docente y exportación verificada sin ejecutar código ajeno.
const classroom=window.PC_CLASSROOM;
const draft={schema:classroom.CASE_SCHEMA,case:{title:'Aula multimedia',
 story:'Montar un equipo capaz de arrancar un sistema, con RAM suficiente.',
 client:'Profesorado',budget:780,requirements:{minRam:16,
 minStorage:'ssd',gpu:false,maxTemp:85}}};
const parsed=classroom.parseCases(JSON.stringify(draft));
assert.equal(parsed.length,1);
assert.equal(parsed[0].title,'Aula multimedia');
assert.equal(parsed[0].budget,780);
const imported=g.importCases(parsed);
assert.equal(imported.length,1);
g.start(imported[0]);
assert.equal(g.getCase().name,'Aula multimedia');
assert.equal(g.game.budget,780);
assert.equal(classroom.caseDocument(parsed[0]).schema,classroom.CASE_SCHEMA);
assert.throws(()=>classroom.parseCases(JSON.stringify({case:{title:'X',story:'Y',budget:20}})),
 /presupuesto/i);
assert.throws(()=>classroom.parseCases('not-json'),/JSON/);
const powerFixture={installed:{psu:true,case:true,motherboard:true,cpu:true,
 cooler:true,gpu:true,storage:true},fixings:{motherboard:true,psu:true,
 cooler:true,storage:true,gpu:true},paste:1,cpuFan:true};
assert.equal(classroom.diagnose(powerFixture,510,450).trip.code,'PSU_OVERLOAD');
assert.equal(classroom.diagnose(powerFixture,350,450).trip,null);
assert(classroom.diagnose(powerFixture,390,450).issues.some(i=>i.code==='PSU_LOW_MARGIN'));
powerFixture.paste=.1;
assert.equal(classroom.diagnose(powerFixture,310,650).trip.code,'THERMAL_PASTE');
powerFixture.paste=1;powerFixture.fixings.motherboard=false;
assert.equal(classroom.diagnose(powerFixture,310,650).mechanical.code,'LOOSE_MOTHERBOARD');
const report=classroom.buildDocument(l.s,{power:{peak:200,rated:450}});
assert.equal(report.schema,classroom.BUILD_SCHEMA);
assert(report.components.selected.motherboard);
assert('fixings' in report.components);
assert('bios' in report);
assert(read('index.html').includes('id="exportPcJson"'));
assert(html.includes('if(details.ramPrecision)data.ramPrecision=details.ramPrecision'),
 'La exportación docente conserva el historial opcional del minijuego RAM');
assert(read('index.html').includes('id="importCaseJson"'));
assert(read('index.html').includes('id="powerBreakdown"'));
assert(read('js/procedural3d.js').includes('mechanicalFault'));
// 8.7: motor de tiempo determinista, resultados y acoplamiento aventura.
const simulated=window.PC_TIME.createClock();
assert.equal(window.PC_TIME.duration(10,'careful',1,0),14);
assert.equal(window.PC_TIME.duration(10,'normal',1,0),10);
assert.equal(window.PC_TIME.duration(10,'fast',1,0),7);
simulated.setSpeed('fast');
assert.equal(simulated.calculate(10),7);
assert.equal(simulated.add('customer',2.2,'briefing'),2.2);
assert.equal(simulated.getSummary().total,2.2);
assert.throws(()=>simulated.setSpeed('turbo'),/Velocidad/);
const operationTest=window.PC_OPERATIONS.createEngine({clock:simulated});
let mounted=false;
let track=operationTest.attempt({kind:'fit',target:'motherboard:b650',
 execute:()=>{mounted=true},wasSuccessful:()=>mounted});
assert.equal(track.category,'necessary');
assert.equal(track.minutes,6.2); // 8 min, dificultad 2, velocidad rápida
track=operationTest.attempt({kind:'fit',target:'motherboard:b650',
 execute:()=>{},wasSuccessful:()=>mounted});
assert.equal(track.category,'repeated');
const minutesBeforeReject=simulated.getSummary().technical;
track=operationTest.attempt({kind:'screw',target:'gpu:rx7600',
 execute:()=>{},wasSuccessful:()=>false});
assert.equal(track.status,'rejected');
assert.equal(simulated.getSummary().technical,minutesBeforeReject);
track=operationTest.attempt({kind:'inspect',target:'machine',
 execute:()=>{},wasSuccessful:()=>true});
assert.equal(track.category,'useful_inspection');
assert.equal(operationTest.getSummary().counts.rejected,1);
assert.equal(operationTest.getSummary().counts.repeated,1);
assert.equal(operationTest.getHistory().length,4);
g.start('office');
assert.equal(g.operationSummary().total,0);
g.perform('fit'); // sin seleccionar: rechazo explícito, sin tiempo
assert.equal(g.operationSummary().counts.rejected,1);
assert.equal(g.operationSummary().total,0);
g.setSpeed('careful');
buy('case','tower');fit('case:tower');
assert.equal(g.operationSummary().counts.necessary,1);
assert(g.operationSummary().technical>=12);
g.perform('inspect');
assert.equal(g.operationSummary().counts.useful_inspection,1);
g.perform('inspect');
assert.equal(g.operationSummary().counts.repeated,1);
assert(g.getExport().operationHistory.length>=4);
assert.equal(g.getExport().simulatedTime.speed,'careful');
assert(html.includes('id="advWorkSpeed"')===false,
 'El selector se genera dinámicamente dentro de adventureMode.js');
assert(read('js/adventureMode.js').includes('id="advWorkSpeed"'));
assert(html.includes('timeEngine.js?v=8-7-1-operation-lifecycle'));
assert(html.includes('mishapEngine.js?v=8-8-2-latent-sata'));
assert(html.includes('operationEngine.js?v=8-8-2-latent-sata'));
// 8.7.1 — las cuatro operaciones adicionales conservan validaciones existentes.
g.start('office');
const failedRoute=g.perform('route');
assert.equal(failedRoute.status,'rejected');
assert.equal(g.operationSummary().technical,0);
buy('case','tower');fit('case:tower');
buy('item','screwdriver');
g.select('case:tower');
const dismantle=g.perform('remove');
assert.equal(dismantle.status,'success');
assert.equal(dismantle.category,'rework');
assert.equal(l.s.installed.case,false);
assert.equal(g.operationSummary().counts.rework,1);
g.select('case:tower');
const reinstall=g.perform('fit');
assert.equal(reinstall.category,'rework');
assert(l.s.installed.case);
g.start('office');
buy('case','tower');fit('case:tower');
buy('psu','psu450');fit('psu:psu450');
const routeResult=g.perform('route');
assert.equal(routeResult.status,'success');
assert(l.s.psuAccessRouted);
assert.equal(g.perform('route').category,'repeated');
buy('item','ioShield');fit('item:ioShield');
buy('motherboard','b650');fit('motherboard:b650');
const firstConnect=g.connect('frontpanel');
assert.equal(firstConnect.category,'necessary');
const disconnectRecord=g.disconnect('frontpanel');
assert.equal(disconnectRecord.category,'rework');
assert.equal(l.s.frontPanel,false);
assert.equal(g.connect('frontpanel').category,'rework');
buy('cpu','r7600');g.toggleCpuPrecision();fit('cpu:r7600');
buy('item','paste');g.select('item:paste');g.togglePastePractice();
const pasteRecord=g.perform('apply');
assert.equal(pasteRecord.category,'necessary');
assert.equal(l.s.paste,1);
assert.equal(g.perform('apply').category,'repeated');
assert(g.operationSummary().counts.rework>=2);
assert(g.operationSummary().counts.repeated>=2);
assert.equal(g.getExport().operationHistory.length,
  g.operationSummary().history.length);
assert(g.getExport().simulatedTime.technical>0);
// 8.8: incidencias educativas opcionales, pulsera ESD y exportación.
const risk=window.PC_MISHAPS;
assert(risk.createSeededRandom('aula')()===risk.createSeededRandom('aula')());
const noRisk=window.PC_OPERATIONS.createEngine({clock:window.PC_TIME.createClock()});
const refused=noRisk.attempt({kind:'screw',target:'gpu',execute:()=>{},
 wasSuccessful:()=>false});
assert.equal(refused.incident,null);
const forcedRisk=risk.createEngine({random:()=>0,seed:'test'});
const riskClock=window.PC_TIME.createClock();
const riskOps=window.PC_OPERATIONS.createEngine({clock:riskClock});
const incident=riskOps.attempt({kind:'fit',target:'case:tower',execute:()=>{},
 wasSuccessful:()=>true,incidentEvaluator:o=>forcedRisk.assess(o)});
assert.equal(incident.incident.category,'mechanical');
assert.equal(incident.incident.delayMinutes,1.5);
assert.equal(riskOps.getSummary().counts.incidents,1);
g.start('office');
assert.equal(g.game.riskEnabled,false);
assert.equal(g.toggleEsd(),false);
buy('item','esdStrap');
assert.equal(g.toggleEsd(),false,'Chasis obligatorio para conectar pulsera');
buy('case','tower');fit('case:tower');
assert.equal(g.toggleEsd(),true);
assert.equal(g.game.esdConnected,true);
assert.equal(g.returnItem('item:esdStrap'),false,
 'La pulsera conectada no debe devolverse');
assert.equal(g.setRiskSeed('semilla-uno'),true);
assert.equal(g.setRiskEnabled(true),true);
assert.equal(g.getExport().incidentSimulation.enabled,true);
assert.equal(g.getExport().incidentSimulation.seed,'semilla-uno');
assert.equal(g.toggleEsd(),true);
assert(!g.game.esdConnected);
console.log('Smoke OK: demo, BIOS, PSU, USB, RGB, AIO and 3D case finishes');

// 8.8.1: incidencia física de cable SATA, inspección, bloqueo y retrabajo.
g.start('office');
buy('case','tower');fit('case:tower');
buy('item','ioShield');fit('item:ioShield');
buy('motherboard','b650');fit('motherboard:b650');
buy('storage','sataSSD');fit('storage:sataSSD');
buy('item','sataCable');
const sataChances=risk.calculateRisks({kind:'connect',difficulty:2});
let sataSeed=null;
for(let i=0;i<20000&&!sataSeed;i++){
  const candidate='sata-regression-'+i,rng=risk.createSeededRandom(candidate);
  if(rng()>=sataChances.electrical&&rng()<sataChances.procedure&&rng()>=.94)
    sataSeed=candidate;
}
assert(sataSeed,'Debe existir una semilla que reproduzca el incidente SATA');
assert.equal(g.setRiskSeed(sataSeed),true);
assert.equal(g.setRiskEnabled(true),true);
const looseRecord=g.connect('sataData');
assert.equal(looseRecord.incident.outcome,'loose_sata');
assert.equal(looseRecord.status,'success');
assert.equal(l.s.sataData,false,'La incidencia debe soltar físicamente SATA');
assert.equal(g.game.pendingSataRepair,true);
assert.equal(g.getExport().incidentSimulation.pendingRepairs[0],'sataData');
g.checkDelivery();
assert.equal(g.game.report,null,'Entrega bloqueada mientras exista avería');
g.setRiskEnabled(false);
g.perform('inspect');
assert.match(g.game.inspection,/Cable SATA de datos suelto/i);
const reconnect=g.connect('sataData');
assert.equal(reconnect.status,'success');
assert.equal(reconnect.category,'rework');
assert.equal(reconnect.incident,null);
assert.equal(l.s.sataData,true);
assert.equal(g.game.pendingSataRepair,false);
assert.equal(g.getExport().incidentSimulation.incidents[0].resolved,true);
assert.equal(g.getExport().incidentSimulation.incidents[0].resolvedSequence,reconnect.seq);
assert.equal(g.getExport().incidentSimulation.pendingRepairs.length,0);
console.log('Fase 2b.1 OK: SATA reparable sin afectar la entrega estable');

// 8.8.2: el riesgo latente se decide al conectar; solo POWER válido lo revela.
g.start('office');
buy('case','tower');fit('case:tower');
buy('item','ioShield');fit('item:ioShield');
buy('motherboard','b650');fit('motherboard:b650');
buy('storage','sataSSD');fit('storage:sataSSD');
buy('item','sataCable');
const latentSeed='latent-test-1974';
assert.equal(g.setRiskSeed(latentSeed),true);
assert.equal(g.setRiskEnabled(true),true);
assert.equal(g.connect('sataData').incident.outcome,'latent_sata');
assert.equal(l.s.sataData,true);
assert.equal(g.game.pendingSataLatent,true);
assert.equal(g.getExport().incidentSimulation.pendingLatent[0],'sataData');
g.checkDelivery();
assert.equal(g.game.report,null);
l.power();
assert.equal(g.game.pendingSataLatent,true,'No revelar con POWER sin PSU');
l.s.installed.psu=true;l.s.frontPanel=true;l.s.atx24=true;
l.power();
assert.equal(g.game.pendingSataLatent,false);
assert.equal(g.game.pendingSataRepair,true);
assert.equal(l.s.sataData,false);
assert.equal(g.getExport().incidentSimulation.incidents[0].revealedBy,'power-on');
l.power();g.setRiskEnabled(false);
const fixedLatent=g.connect('sataData');
assert.equal(fixedLatent.category,'rework');
assert.equal(l.s.sataData,true);
assert.equal(g.getExport().incidentSimulation.incidents[0].resolvedBy,'sata_reconnect');
// Retirar el disco afectado debe permitir una solución alternativa.
g.start('office');
buy('case','tower');fit('case:tower');
buy('item','ioShield');fit('item:ioShield');
buy('motherboard','b650');fit('motherboard:b650');
buy('storage','sataSSD');fit('storage:sataSSD');
buy('item','sataCable');
g.setRiskSeed(latentSeed);g.setRiskEnabled(true);
assert.equal(g.connect('sataData').incident.outcome,'latent_sata');
g.setRiskEnabled(false);
buy('item','screwdriver');g.select('storage:sataSSD');
assert.equal(g.perform('remove').status,'success');
assert.equal(g.game.pendingSataLatent,false);
assert.equal(g.game.pendingSataRepair,false);
assert.equal(g.getExport().incidentSimulation.incidents[0].resolvedBy,'storage_removed');
console.log('Fase 2b.2 OK: fallo latente, POWER válido y reparación/sustitución');

// 8.9.1: el taller RAM se abre sobre el visor 3D, sin sliders de presión.
assert(html.includes('id="ramPrecisionPopup"'));
assert(html.includes('ramPrecision.js?v=8-9-1-ram-popup'));
assert(html.includes('adventureMode.js?v=8-14-0-workshop'));
g.start('office');
assert.equal(g.getExport().ramPrecision.enabled,true,
  'Todo encargo nuevo debe habilitar el minijuego RAM por defecto');
buy('case','tower');fit('case:tower');
buy('item','ioShield');fit('item:ioShield');
buy('motherboard','b650');fit('motherboard:b650');
buy('ram','ddr5_16');g.select('ram:ddr5_16');
const ramFit=g.perform('fit');
assert.equal(ramFit.status,'success');
assert.equal(l.s.installed.ram,true);assert.equal(l.s.ramSeated,false);
assert.equal(get('ramPrecisionPopup').hidden,false,'Popup 3D visible');
assert(!get('adventurePanel').innerHTML.includes('adv-ram-scene'),
 'La interfaz antigua no debe aparecer en la columna lateral');
assert(get('ramPrecisionPopup').innerHTML.includes('data-ram-flip'));
const beforeRamMistake=g.getExport().simulatedTime.technical;
const firstRamAttempt=g.ramPrecisionStep('present');
assert.equal(firstRamAttempt.ok,false);
assert.equal(g.getExport().simulatedTime.technical,beforeRamMistake+.8);
if(g.ramPrecisionState().reversed)g.ramPrecisionStep('flip');
const ramInput=(id,value)=>get('ramPrecisionPopup').events.input({
  target:{id,value:String(value)}});
ramInput('advRamAlign',0);ramInput('advRamApproach',100);
assert.equal(g.ramPrecisionStep('present').code,'aligned');
assert(get('ramPrecisionPopup').innerHTML.includes('data-ram-capture="left"'));
assert(get('ramPrecisionPopup').innerHTML.includes('data-ram-capture="right"'));
assert(!get('ramPrecisionPopup').innerHTML.includes('advRamLeft'),
 'Eliminar el slider antiguo de presión izquierda');
assert.equal(g.ramPrecisionCapture('left',594).value,66);
assert.equal(g.ramPrecisionCapture('right',595).code,'too_strong');
assert.equal(l.s.ramSeated,false,'Presión excesiva: no encaja');
assert.equal(g.ramPrecisionCapture('left',594).value,66);
assert.equal(g.ramPrecisionCapture('right',276).code,'perfect_seat');
assert.equal(l.s.ramSeated,true);
assert.equal(get('ramPrecisionPopup').hidden,true,'Cerrar popup al encajar');
assert.equal(g.getExport().ramPrecision.attempts.length,3);
assert.equal(g.getExport().ramPrecision.attempts.at(-1).code,'perfect_seat');
// Volver a instalar el módulo debe abrir OTRA sesión automáticamente.
g.select('ram:ddr5_16');
const removedRam=g.perform('remove');
assert.equal(removedRam.status,'success');
assert.equal(l.s.installed.ram,false);
assert.equal(get('ramPrecisionPopup').hidden,true);
const secondRamFit=g.perform('fit');
assert.equal(secondRamFit.status,'success');
assert(g.ramPrecisionState(),'Nueva instalación debe abrir un nuevo minijuego');
assert.equal(g.getExport().ramPrecision.active.attempts.length,0);
assert.equal(l.s.ramSeated,false);
assert.equal(get('ramPrecisionPopup').hidden,false);
g.ramPrecisionStep('cancel');
assert.equal(l.s.ramSeated,false,'Cancelar el minijuego no debe asentar la RAM');
// El montaje clásico sigue disponible mediante una desactivación explícita.
g.start('office');
assert.equal(g.getExport().ramPrecision.enabled,true,'Reiniciar restaura el valor predeterminado');
assert.equal(g.toggleRamPrecision(),false);
buy('case','tower');fit('case:tower');
buy('item','ioShield');fit('item:ioShield');
buy('motherboard','b650');fit('motherboard:b650');
buy('ram','ddr5_16');fit('ram:ddr5_16');
assert.equal(g.ramPrecisionState(),null);
assert.equal(l.s.ramSeated,false);
assert.equal(g.perform('fit').status,'success');
assert.equal(l.s.ramSeated,true);
console.log('8.9.1 RAM popup OK: osciladores, retrabajo, 3D y modo clásico');


// 8.10.1 — puntos de fijación individuales por componente.
assert(html.includes('id="screwPrecisionPopup"'));
assert(html.includes('screwPrecision.js?v=8-10-1-multi-screws'));
assert(html.includes('if(details.screwPractice)data.screwPractice=details.screwPractice'));
const layouts=window.PC_SCREW_PRECISION.layoutFor;
assert.equal(layouts('motherboard:b650').length,9);
assert.equal(layouts('motherboard:a520').length,6);
assert.equal(layouts('psu:psu450').length,4);
assert.equal(layouts('gpu:rx7600').length,1);
assert.equal(layouts('storage:nvmeSSD').length,1);
assert.equal(layouts('storage:sataSSD').length,4);
assert.equal(layouts('cooler:air').length,4);
g.start('office');
buy('case','tower');fit('case:tower');
buy('item','ioShield');fit('item:ioShield');
buy('motherboard','b650');fit('motherboard:b650');
g.select('motherboard:b650');
const noTool=g.perform('screw');
assert.equal(noTool.status,'rejected','Sin destornillador no puede comenzar');
buy('item','screwdriver');buy('item','screws');
g.select('motherboard:b650');
const availableScrews=g.game.stock['item:screws'];
const screwOpCount=g.operationSummary().history.length;
const screwTime=g.getExport().simulatedTime.technical;
assert.equal(g.perform('screw'),null);
assert.equal(get('screwPrecisionPopup').hidden,false);
assert.equal((get('screwPrecisionPopup').innerHTML.match(/data-screw-hole=/g)||[]).length,9);
assert.equal(g.game.stock['item:screws'],availableScrews);
g.screwMove(90,90);
assert.equal(g.screwTurn(1).code,'not_engaged');
assert.equal(g.screwPracticeState().depth,0);
assert(Math.abs(g.getExport().simulatedTime.technical-screwTime-.2)<1e-8);
for(let anchor=0;anchor<9;anchor++){
  g.screwMove(50,50);
  for(let turn=1;turn<=10;turn++){
    const recorded=g.screwTurn(1);
    assert.equal(recorded.depth,turn*10);
    if(turn<10)assert.equal(l.s.fixings.motherboard,false);
  }
  assert.equal(g.getExport().screwPractice.progress.motherboard.completed.length,anchor+1);
  assert.equal(g.game.stock['item:screws'],availableScrews-anchor-1);
  assert.equal(l.s.fixings.motherboard,anchor===8,
    'La fijación completa debe esperar hasta el último agujero');
}
assert.equal(get('screwPrecisionPopup').hidden,true);
assert.equal(g.operationSummary().history.length,screwOpCount+1);
assert.equal(g.getExport().screwPractice.attempts.length,91);
assert.equal(g.getExport().screwPractice.attempts.at(-1).anchor,'s9');
g.select('motherboard:b650');
assert.equal(g.perform('remove').status,'success');
assert.equal(g.game.stock['item:screws'],10,'Al desmontar se recuperan los tornillos');
assert.equal(g.getExport().screwPractice.progress.motherboard,undefined);
// Persistencia parcial tras cancelar, retomar y terminar en modo clásico.
g.start('office');
buy('case','tower');fit('case:tower');
buy('item','ioShield');fit('item:ioShield');
buy('motherboard','b650');fit('motherboard:b650');
buy('item','screwdriver');buy('item','screws');
g.select('motherboard:b650');assert.equal(g.perform('screw'),null);
g.screwMove(50,50);
for(let t=0;t<10;t++)g.screwTurn(1);
assert.equal(g.getExport().screwPractice.progress.motherboard.completed.length,1);
const midStock=g.game.stock['item:screws'];
get('screwPrecisionPopup').events.click({target:{closest:()=>({
  hasAttribute:key=>key==='data-screw-cancel',dataset:{}
})}});
assert.equal(get('screwPrecisionPopup').hidden,true);
assert.equal(g.game.stock['item:screws'],midStock,'Cancelar no devuelve el tornillo fijado');
assert.equal(l.s.fixings.motherboard,false);
assert.equal(g.perform('screw'),null,'Debe poder retomarse el montaje');
assert.equal(g.getExport().screwPractice.activeHole,1);
assert.equal(g.getExport().screwPractice.progress.motherboard.completed.length,1);
assert.equal(g.toggleScrewPractice(),false);
assert.equal(g.perform('screw').status,'success','Montaje clásico termina lo pendiente');
assert.equal(g.game.stock['item:screws'],1,
  'No deben regalarse los ocho tornillos pendientes');
assert.equal(l.s.fixings.motherboard,true);
g.start('office');
assert.equal(g.getExport().screwPractice.enabled,true);
console.log('8.10.1: anclajes por componente, consumo real y progreso parcial OK');

// 8.11: CPU se inserta únicamente tras orientar, apoyar y cerrar la palanca.
assert(html.includes('id="cpuPrecisionPopup"'));
assert(html.includes('cpuPrecision.js?v=8-11-0-cpu-socket'));
assert(html.includes('adventureMode.js?v=8-14-0-workshop'));
assert(html.includes('if(details.cpuPrecision)data.cpuPrecision=details.cpuPrecision'));
g.start('office');
buy('case','tower');fit('case:tower');
buy('item','ioShield');fit('item:ioShield');
buy('motherboard','b650');fit('motherboard:b650');
buy('cpu','r7600');g.select('cpu:r7600');
assert.equal(g.getExport().cpuPrecision.enabled,true);
const cpuStock=g.game.stock['cpu:r7600'];
const cpuBefore=g.getExport().operationHistory.length;
assert.equal(g.perform('fit'),null,'Debe abrir popup y no instalar todavía');
assert.equal(get('cpuPrecisionPopup').hidden,false);
assert.equal(!!l.s.installed.cpu,false);
assert.equal(g.game.stock['cpu:r7600'],cpuStock);
const badCpuPosition=g.cpuPrecisionStep('present');
assert.equal(badCpuPosition.ok,false);
assert.equal(badCpuPosition.penaltyMinutes,.6);
while(g.cpuPrecisionState().rotation!==0)g.cpuPrecisionStep('rotate');
g.cpuPrecisionMove(0,0);
get('cpuPrecisionPopup').events.input({target:{id:'cpuLower',value:'100'}});
assert.equal(g.cpuPrecisionStep('present').code,'presented');
assert.equal(g.cpuPrecisionState().stage,'lever');
assert.equal(g.cpuPrecisionCapture(12).code,'insufficient_force');
assert.equal(!!l.s.installed.cpu,false);
assert.equal(g.cpuPrecisionCapture(96).code,'excessive_force');
assert.equal(!!l.s.installed.cpu,false);
assert.equal(g.cpuPrecisionCapture(66).code,'locked');
assert.equal(l.s.installed.cpu,true,'CPU debe instalarse solo con fuerza verde');
assert.equal(get('cpuPrecisionPopup').hidden,true);
assert.equal(g.game.stock['cpu:r7600'],cpuStock-1);
assert.equal(g.getExport().operationHistory.length,cpuBefore+1);
assert.equal(g.getExport().cpuPrecision.attempts.length,4);
// Sin CPU compatible: no se abre el popup ni se instala.
g.start('office');
buy('case','tower');fit('case:tower');
buy('item','ioShield');fit('item:ioShield');
buy('motherboard','b650');fit('motherboard:b650');
buy('cpu','r5600');g.select('cpu:r5600');
assert.equal(g.perform('fit'),null);
assert.equal(get('cpuPrecisionPopup').hidden,true);
assert.equal(!!l.s.installed.cpu,false);
assert.equal(g.game.stock['cpu:r5600'],1);
// Cancelar no pierde material; montaje clásico sigue disponible.
g.start('office');
buy('case','tower');fit('case:tower');
buy('item','ioShield');fit('item:ioShield');
buy('motherboard','b650');fit('motherboard:b650');
buy('cpu','r7600');g.select('cpu:r7600');
g.perform('fit');g.cpuPrecisionStep('cancel');
assert.equal(!!l.s.installed.cpu,false);
assert.equal(g.game.stock['cpu:r7600'],1);
assert.equal(g.toggleCpuPrecision(),false);
assert.equal(g.perform('fit').status,'success','Montaje clásico CPU sigue operativo');
assert.equal(l.s.installed.cpu,true);
g.start('office');
assert.equal(g.getExport().cpuPrecision.enabled,true);
// La alternativa clásica tampoco puede saltarse la incompatibilidad física.
buy('case','tower');fit('case:tower');
buy('item','ioShield');fit('item:ioShield');
buy('motherboard','b650');fit('motherboard:b650');
buy('cpu','r5600');g.select('cpu:r5600');
assert.equal(g.toggleCpuPrecision(),false);
assert.equal(g.perform('fit'),null);
assert.equal(l.s.installed.cpu,false,'CPU AM4 no puede entrar en placa AM5 ni en modo clásico');
console.log('8.11 CPU precisión OK: orientación, zócalo, palanca, fallo y compatibilidad');

// Regresión 8.11.1: bajar la CPU NO puede desplazarla verticalmente.
// 2px/unidad: antes restaba 24px al bajar al 100%, aparentando Y=12.
g.start('office');
buy('case','tower');fit('case:tower');
buy('item','ioShield');fit('item:ioShield');
buy('motherboard','b650');fit('motherboard:b650');
buy('cpu','r7600');g.select('cpu:r7600');
assert.equal(g.perform('fit'),null);
const cpuNode=get('cpuPrecisionPopup');
const queryBefore=cpuNode.querySelector;
const cpuVisual={style:{}};
cpuNode.querySelector=selector=>selector==='[data-cpu-piece]'?cpuVisual:null;
g.cpuPrecisionMove(0,0);
assert.equal(cpuVisual.style.left,'calc(50% + 0px)');
assert.equal(cpuVisual.style.top,'calc(50% + 0px)');
cpuNode.events.input({target:{id:'cpuLower',value:'100'}});
assert.equal(cpuVisual.style.top,'calc(50% + 0px)',
 'Bajar al 100% no debe desplazar visualmente la CPU');
g.cpuPrecisionMove(0,12);
assert.equal(cpuVisual.style.top,'calc(50% + 24px)',
 'Y=12 debe verse 24px desplazado, no centrado');
g.cpuPrecisionMove(0,0);
assert.equal(cpuVisual.style.top,'calc(50% + 0px)');
cpuNode.querySelector=queryBefore;
while(g.cpuPrecisionState().rotation!==0)g.cpuPrecisionStep('rotate');
assert.equal(g.cpuPrecisionStep('present').code,'presented',
 'Y=0, X=0 y CPU bajada deben aceptarse');
g.cpuPrecisionCapture(66);
assert.equal(l.s.installed.cpu,true);
console.log('8.11.1: Y=0 visual y lógico coinciden antes y después de bajar CPU');

// 8.12: jeringuilla viscosa y cobertura asociada a los tornillos.
assert(html.includes('id="pastePrecisionPopup"'));
assert(html.includes('pasteGameplay.js?v=8-12-0-paste-pressure'));
assert(html.includes('if(details.thermalPaste)data.thermalPaste=details.thermalPaste'));
function prepareThermalTest(){
  g.start('office');
  buy('case','tower');fit('case:tower');
  buy('item','ioShield');fit('item:ioShield');
  buy('motherboard','b650');fit('motherboard:b650');
  buy('cpu','r7600');g.select('cpu:r7600');
  g.toggleCpuPrecision();assert.equal(g.perform('fit').status,'success');
  buy('item','paste');g.select('item:paste');
  assert.equal(g.perform('apply'),null);
  assert.equal(get('pastePrecisionPopup').hidden,false);
  assert.equal(l.s.paste,0);
  const beforeDose=g.game.stock['item:paste'];
  g.pasteUi.pointer(.5,.5);g.pasteUi.pump(true);
  for(let i=0;i<75;i++)g.pasteUi.tick(40);
  g.pasteUi.pump(false);for(let i=0;i<20;i++)g.pasteUi.tick(40);
  assert.equal(g.pasteUi.confirm(),true);
  assert.equal(g.game.stock['item:paste'],beforeDose-1);
  assert.equal(l.s.paste,1);
  assert.equal(g.game.shopCategory,'cooler',
    'Después de confirmar pasta sin disipador, abrir directamente la tienda del disipador');
  assert(g.game.openSections.includes('shop'),
    'La tienda debe quedar abierta al terminar la jeringuilla');
  assert(get('adventurePanel').innerHTML.includes('data-thermal-next'),
    'Debe verse la opción Continuar: colocar disipador');
  assert(get('adventurePanel').innerHTML.includes('Compra o selecciona el disipador'),
    'La misión debe orientar al siguiente paso');
  buy('cooler','air');
  assert.equal(g.game.selected,'cooler:air');
  assert(g.game.openSections.includes('actions'),
    'Comprar disipador tras la pasta debe mostrar Acciones');
  assert(get('adventurePanel').innerHTML.includes('data-suggest="fit"'),
    'El botón Encajar disipador debe aparecer al comprarlo');
  fit('cooler:air');
  buy('item','screwdriver');buy('item','screws');
  g.select('cooler:air');
  assert.equal(g.perform('screw'),null);
  const screwMarkup=get('screwPrecisionPopup').innerHTML;
  assert(screwMarkup.includes('thermalSpreadCells'));
  assert(screwMarkup.includes('Pasta térmica · EN DIRECTO'));
  assert(screwMarkup.indexOf('thermal-spread-panel')<screwMarkup.indexOf('screw-anchor-map'),
    'Mapa de pasta en la cabecera, antes del área de tornillos');
  assert(screwMarkup.includes('thermalCoverageBar'));
}
prepareThermalTest();
const clickHole=n=>get('screwPrecisionPopup').events.click({
  target:{closest:()=>({hasAttribute:()=>false,dataset:{screwHole:String(n)}})}
});
let beforeLive=g.getExport().thermalPaste.spread.coverage;
for(let depth=10;depth<=100;depth+=10){
  for(const corner of [0,3,1,2]){
    clickHole(corner);g.screwMove(50,50);
    assert.equal(g.screwTurn(1).depth,depth);
    if(depth===10&&corner===0){
      const during=g.getExport().thermalPaste.spread;
      assert(during.coverage>beforeLive,
        'La cobertura cambia tras el PRIMER giro, no al cerrar los cuatro');
      assert.equal(during.screws[0],10);
      assert.equal(l.s.fixings.cooler,false,'El cooler todavía no está fijado');
      assert.equal(g.getExport().thermalPaste.review,null,
        'El resultado final todavía no se ha calculado');
    }
  }
}
const balancedPaste=g.getExport().thermalPaste.review;
assert.equal(balancedPaste.quality,'good');
assert.equal(balancedPaste.peakImbalance,10);
assert.equal(l.s.fixings.cooler,false);
assert.equal(g.finishCoolerPractice(false),true);
assert.equal(l.s.fixings.cooler,true);
assert.equal(l.s.paste,1);
prepareThermalTest();
for(let hole=0;hole<4;hole++){
  g.screwMove(50,50);
  for(let turn=0;turn<10;turn++)g.screwTurn(1);
}
const unevenPaste=g.getExport().thermalPaste.review;
assert.equal(unevenPaste.peakImbalance,100);
assert.equal(unevenPaste.quality,'unbalanced');
assert.equal(g.finishCoolerPractice(true),true);
assert.equal(l.s.installed.cooler,false);
assert.equal(l.s.paste,0);
assert.equal(g.game.stock['item:screws'],10,'Limpiar recupera los tornillos montados');
assert.equal(g.game.stock['cooler:air'],1);
assert.equal(g.game.stock['item:paste'],0,'La pasta usada no se recupera');
console.log('8.12: jeringuilla, presión en cruz y limpieza verificadas');

// 8.12.1: si el disipador ya fue comprado antes de la jeringuilla,
// confirmar pasta debe seleccionarlo y dejar Encajar a la vista.
g.start('office');
buy('case','tower');fit('case:tower');
buy('item','ioShield');fit('item:ioShield');
buy('motherboard','b650');fit('motherboard:b650');
buy('cpu','r7600');g.select('cpu:r7600');
g.toggleCpuPrecision();assert.equal(g.perform('fit').status,'success');
buy('cooler','air');
buy('item','paste');g.select('item:paste');
assert.equal(g.perform('apply'),null);
g.pasteUi.pointer(.5,.5);g.pasteUi.pump(true);
for(let t=0;t<75;t++)g.pasteUi.tick(40);
g.pasteUi.pump(false);
for(let t=0;t<20;t++)g.pasteUi.tick(40);
assert.equal(g.pasteUi.confirm(),true);
assert.equal(g.game.selected,'cooler:air',
  'Una pasta confirmada debe seleccionar el disipador disponible');
assert.equal(g.game.verb,'fit');
assert(g.game.openSections.includes('actions'));
assert(get('adventurePanel').innerHTML.includes('data-suggest="fit"'));
assert.equal(g.perform('fit').status,'success');
assert.equal(l.s.installed.cooler,true);
console.log('8.12.1: continuidad de pasta a disipador en tienda e inventario OK');

// 8.12.2: encajar disipador inicia automáticamente la práctica cuando
// el destornillador y los tornillos están disponibles.
function stageCoolerTest(){
  g.start('office');
  buy('case','tower');fit('case:tower');
  buy('item','ioShield');fit('item:ioShield');
  buy('motherboard','b650');fit('motherboard:b650');
  buy('cpu','r7600');g.select('cpu:r7600');
  g.toggleCpuPrecision();assert.equal(g.perform('fit').status,'success');
  buy('item','paste');g.select('item:paste');
  assert.equal(g.perform('apply'),null);
  g.pasteUi.pointer(.5,.5);g.pasteUi.pump(true);
  for(let tick=0;tick<75;tick++)g.pasteUi.tick(40);
  g.pasteUi.pump(false);
  for(let tick=0;tick<20;tick++)g.pasteUi.tick(40);
  assert.equal(g.pasteUi.confirm(),true);
  buy('cooler','air');
}
stageCoolerTest();
buy('item','screwdriver');buy('item','screws');
g.select('cooler:air');
assert.equal(g.perform('fit').status,'success');
assert.equal(get('screwPrecisionPopup').hidden,false,
  'El minijuego debe abrirse al encajar el disipador con herramientas');
assert(get('screwPrecisionPopup').innerHTML.includes('thermalSpreadCells'),
  'El minijuego debe mostrar el mapa de pasta durante el apriete');
assert(get('adventurePanel').innerHTML.includes('Motor 8.14.0'),
  'La revisión activa debe quedar identificada visualmente');
g.screwMove(50,50);
assert.equal(g.screwTurn(1).depth,10);
const beforeCancel=get('screwPrecisionPopup');
beforeCancel.events.click({target:{closest:()=>({
  hasAttribute:key=>key==='data-screw-cancel',dataset:{}
})}});
assert.equal(get('screwPrecisionPopup').hidden,true);
assert(get('adventurePanel').innerHTML.includes('data-cooler-start'),
  'La continuación debe estar visible aunque se haya cerrado la práctica');
assert.equal(g.continueCoolerMount(),true);
assert.equal(g.screwPracticeState().depth,10,
  'Reabrir conserva el roscado parcial');
stageCoolerTest();
assert.equal(g.perform('fit').status,'success');
assert.equal(get('screwPrecisionPopup').hidden,true,
  'Sin herramientas debe mostrarse la guía, no gastar tornillos');
assert.equal(g.game.awaitingCoolerTools,true);
assert.equal(g.game.shopCategory,'item');
assert(get('adventurePanel').innerHTML.includes('data-cooler-start'));
buy('item','screwdriver');
assert.equal(get('screwPrecisionPopup').hidden,true);
buy('item','screws');
assert.equal(get('screwPrecisionPopup').hidden,false,
  'La compra del último material debe iniciar la práctica pendiente');
assert.equal(g.game.selected,'cooler:air',
  'El disipador instalado se recupera sin requerir stock en inventario');
assert.equal(g.game.awaitingCoolerTools,false);
assert.equal(g.getExport().thermalPaste.application.status,'ready');
// 8.12.4: distribución compacta visible sin superponer el mapa de pasta
// a la alineación del tornillo. La geometría real se prueba en Playwright.
const compactScrew=get('screwPrecisionPopup').innerHTML;
assert(compactScrew.includes('cooler-screw-layout'),
  'El disipador tiene una única cuadrícula compacta');
assert(compactScrew.includes('cooler-pressure-column'));
assert(compactScrew.includes('cooler-tool-column'));
assert(compactScrew.indexOf('cooler-pressure-column')<
  compactScrew.indexOf('screw-anchor-map'));
assert(compactScrew.indexOf('screw-anchor-map')<
  compactScrew.indexOf('cooler-tool-column'));
assert(compactScrew.includes('Pasta térmica · EN DIRECTO'));
assert(html.includes('.screw-precision-dialog.has-thermal-spread{'));
assert(html.includes('grid-template-rows:auto minmax(0,1fr) auto'));
assert(html.includes('height:min(600px,100%)'));
assert(html.includes('position:static;top:auto;z-index:auto'),
  'El monitor ya no es sticky y no tapa la alineación');
console.log('8.12.4: ficha compacta dividida en dos columnas sin sticky');
console.log('8.12.2: el minijuego se abre al encajar y se reanuda tras adquirir material');


// 8.13.0: tienda independiente con compras compartidas con el taller.
g.start('office');
assert.equal(g.openStore(),true);
const storeHTML=get('adventureStorePage').innerHTML;
assert(storeHTML.includes('Tienda de componentes'));
assert(storeHTML.includes('data-store-category="motherboard"'));
assert(storeHTML.includes('data-store-category="cpu"'));
assert(storeHTML.includes('data-store-category="item"'));
assert(storeHTML.includes('data-store-info="case:tower"'));
assert(storeHTML.includes('data-store-buy="case:tower"'));
assert(storeHTML.includes('Álex · Vendedor de la tienda'));
assert(storeHTML.includes('¿Me falta material?'));
assert(!storeHTML.includes('Este procesador es incompatible'));
assert(!get('adventurePanel').innerHTML.includes('data-buy="case:tower"'),
  'No se debe comprar en el panel lateral');
assert(get('adventurePanel').innerHTML.includes('data-open-store'));
const facts=g.storeFacts('cpu','r7600');
assert(facts.some(([key,value])=>key==='Zócalo'&&value==='AM5'),
  'Ficha de procesador accesible ANTES de comprarlo');
const boardFacts=g.storeFacts('motherboard','b650');
assert(boardFacts.some(([key,value])=>key==='Memoria compatible declarada'&&value==='DDR5'));
const coolerFacts=g.storeFacts('cooler','aio240');
assert(coolerFacts.some(([key,value])=>key==='Dimensiones'&&value.includes('240')),
  'La ficha previa del disipador debe indicar sus dimensiones declaradas');
const hints=g.sellerMessages().map(row=>row.join(' ').toLowerCase());
assert(hints.some(h=>h.includes('tornillos')),'El vendedor recuerda tornillos');
assert(hints.some(h=>h.includes('destornillador')),'El vendedor recuerda herramientas');
assert(!hints.some(h=>h.includes('am5')||h.includes('ddr5')||h.includes('incompatible')),
  'El vendedor no resuelve compatibilidades a los alumnos');
const beforePurchase=g.game.spent;
const storeClick=get('adventureStorePage').events.click;
storeClick({target:{closest:()=>({
  dataset:{storeInfo:'cpu:r7600'},hasAttribute:()=>false
})}});
assert(get('adventureStorePage').innerHTML.includes('Zócalo'));
assert(get('adventureStorePage').innerHTML.includes('Comprueba tú mismo'));
storeClick({target:{closest:()=>({
  dataset:{storeBuy:'case:tower'},hasAttribute:()=>false
})}});
assert.equal(g.game.stock['case:tower'],1);
assert(g.game.spent>beforePurchase);
assert(get('adventureStorePage').innerHTML.includes('En inventario: 1'));
assert.equal(g.closeStore(),true);
assert.equal(g.game.stock['case:tower'],1,'La compra continúa disponible tras salir de la tienda');
g.select('case:tower');
assert.equal(g.perform('fit').status,'success');
assert.equal(l.s.installed.case,true);
g.openStore('item');
assert.equal(g.game.shopCategory,'item');
assert(get('adventureStorePage').innerHTML.includes('data-store-buy="item:paste"'));
g.setStoreCategory('cpu');
assert(get('adventureStorePage').innerHTML.includes('data-store-buy="cpu:r7600"'));
console.log('8.13: tienda independiente, fichas previas, vendedor y presupuesto verificados');


// 8.14: patrimonio persistente dentro de la sesión y consumibles independientes.
g.start('office');
assert.equal(g.getWorkshop().cash,300);
assert.equal(g.getWorkshop().tools.screwdriver,true);
const money=g.game.spent;
g.purchase('item','screwdriver');
assert.equal(g.game.spent,money,'El destornillador permanente no se cobra');
assert.equal(g.buyTool('multimeter'),true);
assert.equal(g.getWorkshop().cash,252);
assert.equal(g.openMeter(),true);
assert.equal(g.probeMeter().value,'0.0 V⎓');
g.closeMeter();
g.start('gaming');
assert.equal(g.getWorkshop().tools.multimeter,true,'Multímetro permanente tras cambiar de cliente');
assert.equal(g.buyTool('alcohol'),true);
assert.equal(g.getWorkshop().supplies.alcohol,4);
assert.equal(g.useTool('alcohol'),true);
assert.equal(g.getWorkshop().supplies.alcohol,3);
assert.equal(g.buyTool('gpuTest'),true);
assert.equal(g.useTool('gpuTest'),true);
assert.equal(g.game.benchTests.length,1);
assert(get('adventurePanel').innerHTML.includes('data-tool-use="multimeter"'));
assert(get('adventurePanel').innerHTML.includes('Fondo propio del taller'));
assert.equal(g.getExport().workshop.tools.gpuTest,true);
console.log('8.14: patrimonio de taller, compras, inventario y multímetro verificados');
