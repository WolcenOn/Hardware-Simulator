import {createInternalHeader3d} from './connectors3d.js?v=8-4-9-routed-cables';
import {createRearReceptacle3d} from './rearPorts3d.js?v=8-4-6-port-geometry';
// Escenario 7.0: proporciones derivadas de tamaños físicos (1 unidad = 50 mm).
// Referencias: ATX 305x244; ASUS A520M-K 226x221; GPU ASUS Dual RX7600 245x134x49,
// ASUS Dual RTX4070 267.01x133.94x51.13; ventilador 120x120x25;
// torre NH-U12S redux 158 mm; PSU Corsair RM850e 150x140x86.
export const MM_PER_UNIT = 50;
const mm = value => value / MM_PER_UNIT;

// Montaje PCB: separador físico de 6,5 mm medido desde la bandeja.
export const MOTHERBOARD_MOUNT = Object.freeze({
  trayTopY: -.47 + .12/2,
  standoffHeight: mm(6.5),
  pcbCenterY: .29,
  pcbThickness: .13,
  offsetY: (-.47 + .12/2) + mm(6.5) - (.29 - .13/2)
});
// Los mismos cuatro centros de orificio se utilizan para PCB y separadores.
export const getMotherboardMountPoints = cfg => {
  const left=cfg.x-cfg.w/2, right=cfg.x+cfg.w/2;
  const top=cfg.z-cfg.d/2, bottom=cfg.z+cfg.d/2;
  return [[left+.24,top+.22],[left+.24,bottom-.25],
    [right-.24,top+.22],[right-.24,bottom-.25]];
};

// Cara modular +X de la PSU: todos los cables de ALIMENTACIÓN salen de aquí.
export const PSU_CABLE_PORTS = Object.freeze({
  atx24:[-.83,1.60,4.27],
  eps:[-.83,1.60,4.87],
  gpu:[-.83,.84,4.27],
  sataPower:[-.83,.84,4.87]
});

// Anclaje en la cara exterior de la abertura I/O, coincidente con la malla
// de USB de la chapa. El cable se recalcula cuando cambia el layout de placa.
export const REAR_USB_COUNT=5;
export function getRearUsbAnchor(cfg,index){
  if(!Number.isInteger(index)||index<0||index>=REAR_USB_COUNT)
    throw new RangeError('Puerto USB trasero fuera de rango');
  return [cfg.x-cfg.w/2-.20+.035,
    MOTHERBOARD_MOUNT.offsetY+.51,
    cfg.z-cfg.d/2+.55+index*.50];
}
export function getRearVideoAnchor(cfg,kind='hdmi'){
  if(kind!=='hdmi'&&kind!=='displayPort')
    throw new RangeError('Salida de vídeo desconocida');
  return [cfg.x-cfg.w/2-.20+.035,MOTHERBOARD_MOUNT.offsetY+.80,
    cfg.z-cfg.d/2+(kind==='hdmi'?.38:2.72)];
}
// Cuatro bocas físicas sobre el bracket de la GPU: DP, DP, DP y HDMI.
export const GPU_REAR_PORT_TYPES=Object.freeze(['displayPort','displayPort','displayPort','hdmi']);
export function getGpuVideoAnchor(cfg,index=0){
  if(!Number.isInteger(index)||index<0||index>=GPU_REAR_PORT_TYPES.length)
    throw new RangeError('Salida de GPU fuera de rango');
  return [-4.015,.46+MOTHERBOARD_MOUNT.offsetY+.64+index*.47,
    cfg.pcieZ+.11];
}

export const REAR_CASE_FAN_Y=2.23; // Evita la chapa rear I/O (50 mm/unidad).
export const FRONT_IO_LAYOUT=Object.freeze({
  power:[4.23,3.13,-3.52],
  usbA:[[4.23,2.22,-3.50],[4.23,1.64,-3.50]],
  usbC:[4.23,.98,-3.50],
  powerLead:[4.36,3.13,-3.12],
  usbALead:[4.36,1.94,-3.12],
  usbCLead:[4.36,.98,-3.12]
});
export const getFrontUsbHeaders=cfg=>({
  usb3:[cfg.x+cfg.w/2-.62,cfg.z+cfg.d/2-1.13],
  usbC:[cfg.x+cfg.w/2-.77,cfg.z+cfg.d/2-1.70]
});

// Orígenes de conexión a ras del labio de cada toma REAL, ya con offset
// de PCB. La malla del header y el extremo de la clavija usan este objeto.
export function getInternalHeaderAnchor(cfg,kind){
  const usb=getFrontUsbHeaders(cfg);
  const fp=[cfg.x+cfg.w/2-.42,cfg.z+cfg.d/2-.32];
  const yz=(x,y,z)=>[x,MOTHERBOARD_MOUNT.offsetY+y,z];
  // Cara inferior de las tomas situada en el mismo plano superior de PCB.
  // Un header que flota en Y se ve como una clavija conectada al aire.
  const top=cfg.z-cfg.d/2,bottom=cfg.z+cfg.d/2,
    left=cfg.x-cfg.w/2,right=cfg.x+cfg.w/2;
  const ports={
    atx24:yz(cfg.atxX,.355+.40,cfg.atxZ),
    eps:yz(cfg.epsX,.355+.34,cfg.epsZ),
    sataData:yz(cfg.sataX,.355+.21,cfg.sataZ),
    frontPanel:yz(fp[0],.355+.17,fp[1]),
    frontUsb3:yz(usb.usb3[0],.355+.27,usb.usb3[1]),
    frontUsbC:yz(usb.usbC[0],.355+.28,usb.usbC[1]),
    // CPU_FAN cerca del borde superior y a la derecha, fuera del disipador
    // y de la huella longitudinal de los módulos de memoria.
    fan:yz(right-.30,.355+.26,top+.13),
    caseFan0:yz(right-.90,.355+.26,bottom-.40),
    caseFan1:yz(right-.30,.355+.26,top+.62),
    caseFan2:yz(left+.28,.355+.26,top+2.55)
  };
  if(!ports[kind])throw new RangeError('Puerto interno desconocido: '+kind);
  return ports[kind];
}
export function getGpuPowerAnchor(cfg,choice='rx7600'){
  const len=(choice==='rtx4070'?267.01:245)/MM_PER_UNIT;
  const h=(choice==='rtx4070'?133.94:134)/MM_PER_UNIT;
  return [cfg.pcieX+len*.37,.46+h+.13+MOTHERBOARD_MOUNT.offsetY,
    cfg.pcieZ+.12];
}

// La posición del HDD y las guías de la jaula deben venir de la MISMA
// referencia geométrica. Dos bahías de 3,5" en cámara inferior del chasis.
// Y local apunta desde bandeja de placa hacia el cristal lateral.
export const HDD_BAY_LAYOUT=Object.freeze({
  cageCenter:[3.04,1.02,4.72],
  driveCenterX:3.04,driveCenterZ:4.72,
  // Bahía superior elegida: base > bandeja central, tapa < guía superior.
  driveBaseY:1.13,
  shelfLevels:[.34,1.06,1.76],
  sideWallZ:[-1.22,1.22],
  insideX:[1.39,4.69],
  driveSize:[mm(147),mm(26.1),mm(101.6)],
  clearance:.06
});
export const SSD_BAY_LAYOUT=Object.freeze({
  // Adaptador de 2,5" en la bandeja INFERIOR de la misma jaula, no detrás del PCB.
  driveBaseY:.48,
  driveSize:[mm(100),mm(7),mm(69.85)],
  adapterSize:[mm(126),.06,mm(94)]
});
export function getSsdBayPosition(){
  return [HDD_BAY_LAYOUT.driveCenterX,SSD_BAY_LAYOUT.driveBaseY,
    HDD_BAY_LAYOUT.driveCenterZ];
}
export function getHddBayPosition(slot='upper'){
  if(slot!=='upper'&&slot!=='lower')throw new RangeError('Bahía de disco incorrecta');
  return [HDD_BAY_LAYOUT.driveCenterX,
    slot==='upper'?HDD_BAY_LAYOUT.driveBaseY:.41,
    HDD_BAY_LAYOUT.driveCenterZ];
}

export const BOARD_LAYOUTS = {
  b650: {name:'B650 ATX',w:mm(244),d:mm(305),x:-1.20,z:0,dimms:4,slots:2,m2:2,
    cpuX:-1.55,cpuZ:-1.48,epsX:-3.31,epsZ:-2.73,atxX:1.11,atxZ:-1.25,
    pcieX:-1.22,pcieZ:.65,dimmXs:[-.15,.14,.43,.72],sataX:1.05,sataZ:2.02,colors:'silver'},
  a520: {name:'A520 mATX',w:mm(221),d:mm(226),x:-1.43,z:-.79,dimms:2,slots:2,m2:1,
    cpuX:-1.62,cpuZ:-1.64,epsX:-3.39,epsZ:-2.82,atxX:.65,atxZ:-1.28,
    pcieX:-1.55,pcieZ:.13,dimmXs:[.05,.30],sataX:.54,sataZ:1.07,colors:'white'},
  z790: {name:'Z790 ATX',w:mm(244),d:mm(305),x:-1.20,z:0,dimms:4,slots:3,m2:4,
    cpuX:-1.55,cpuZ:-1.50,epsX:-3.24,epsZ:-2.74,atxX:1.11,atxZ:-1.26,
    pcieX:-1.22,pcieZ:.60,dimmXs:[-.15,.14,.43,.72],sataX:1.02,sataZ:2.10,colors:'black'}
};

// Variantes 8.1 reutilizan posiciones de tornillos, DIMM y PCIe de
// una placa del mismo formato. Esta geometría es representativa, no CAD exacto.
for(const [key,base] of Object.entries({
  b650m:'b650',b550:'b650',h610:'a520',b760:'z790',x670e:'b650',b760m:'h610',x570:'b650'
})){
  BOARD_LAYOUTS[key]={...BOARD_LAYOUTS[base],name:key.toUpperCase()};
}
// Anchuras y alturas mATX orientativas; los puertos/chipset son representativos.
Object.assign(BOARD_LAYOUTS.b650m,{
  w:mm(244),d:mm(244),z:-.60,slots:2,dimms:4,m2:2,
  sataZ:1.10,atxZ:-1.23
});
Object.assign(BOARD_LAYOUTS.h610,{
  w:mm(220),d:mm(244),z:-.60,slots:2,dimms:2,m2:1,
  sataZ:1.12,atxZ:-1.27
});
export function buildRealScale(p) {
  const {THREE, scene, group, rounded, box, cylinder, trace, label, fan, materials} = p;
  const board=group('board'),cpu=group('cpu'),ram=group('ram');
  const gpu=group('gpu'),cooler=group('cooler'),psu=group('psu');
  const storage=group('storage'),chassis=group('case');
  const pcbTop=.40;
  board.position.y=MOTHERBOARD_MOUNT.offsetY;
  ram.position.y=MOTHERBOARD_MOUNT.offsetY;
  const silver=materials.silver, alu=materials.aluminium,black=materials.black;
  const dark=materials.black2,gold=materials.gold,metal=materials.case;
  const white=new THREE.MeshStandardMaterial({color:0xcbd5df,roughness:.46,metalness:.55});
  const copper=new THREE.MeshStandardMaterial({color:0xa87747,roughness:.32,metalness:.85});

  // Bancada abierta, no es una caja cerrada: permite estudiar conectores y PCIe.
  rounded(10.45,.22,8.15,.15,metal,chassis,.65,-.14,0);
  rounded(10.14,.065,7.85,.13,dark,chassis,.65,-.015,0);
  for(let x of [-3.85,5.02])for(let z of [-3.43,3.42]){
    cylinder(.09,.025,alu,chassis,x,.035,z,12);
  }
  // Separación visual de la zona PSU/SATA, a la derecha de la bandeja.
  box(.03,.07,7.4,alu,chassis,1.48,.08,0);

  // Chasis ATX horizontal de sobremesa: motherboard + GPU, bahía PSU y
  // almacenamiento están dentro del mismo volumen, no sobre un tablero suelto.
  // Se abre por una tapa superior abatible para enseñar las conexiones.
  const caseFrame=new THREE.Group();chassis.add(caseFrame);
  const caseW=10.72, caseD=8.30, caseH=4.30;
  for(const x of [-4.08,5.40])for(const z of [-3.83,3.82])
    rounded(.16,caseH,.16,.025,metal,caseFrame,x,caseH/2-.09,z);
  for(const z of [-3.84,3.84]){
    rounded(caseW,.17,.18,.025,metal,caseFrame,.66,.10,z);
    rounded(caseW,.15,.18,.025,alu,caseFrame,.66,caseH-.10,z);
  }
  for(const x of [-4.08,5.40]){
    rounded(.18,.17,caseD,.025,metal,caseFrame,x,.10,0);
    rounded(.18,.16,caseD,.025,alu,caseFrame,x,caseH-.10,0);
  }
  // Pared lateral fija y trasera perforada; frontis bajo para acceder al PCB.
  rounded(.11,2.40,caseD-.28,.035,metal,caseFrame,5.38,1.25,0);
  rounded(caseW-.35,1.05,.12,.030,metal,caseFrame,.66,.55,-3.80);
  rounded(caseW-.35,.60,.11,.030,metal,caseFrame,.66,.34,3.80);
  // Rejillas traseras y pasacables hacia I/O y panel GPU.
  for(let i=0;i<12;i++){
    rounded(.29,.025,.10,.008,dark,caseFrame,-3.67+i*.47,1.18,-3.73);
  }
  for(let i=0;i<5;i++){
    rounded(1.18,.035,.12,.008,dark,caseFrame,-3.45,1.52+i*.42,-3.74);
  }
  // Cámara/caja lateral PSU y disco; guías y separador, no una segunda mesa.
  rounded(.14,1.10,7.62,.025,metal,caseFrame,1.54,.58,0);
  for(const z of [-3.25,3.23])
    rounded(3.67,.13,.13,.020,alu,caseFrame,3.45,.30,z);
  // Tapa de vidrio sintético transparente sobre marco articulado.
  // Abierta por defecto; cerrarla impide instalar componentes.
  const doorHinge=new THREE.Group();
  doorHinge.position.set(-4.02,caseH-.11,-3.77);
  caseFrame.add(doorHinge);
  const lidMaterial=new THREE.MeshPhysicalMaterial({
    color:0x8cbfc4,transparent:true,opacity:.13,roughness:.17,
    metalness:.06,depthWrite:false,side:THREE.DoubleSide
  });
  rounded(caseW-.32,.065,caseD-.30,.027,lidMaterial,doorHinge,(caseW-.32)/2,0,(caseD-.30)/2);
  rounded(caseW-.30,.07,.11,.02,metal,doorHinge,(caseW-.30)/2,.015,.06);
  rounded(.10,.07,caseD-.30,.018,metal,doorHinge,.03,.015,(caseD-.30)/2);
  rounded(.10,.07,caseD-.30,.018,metal,doorHinge,caseW-.32,.015,(caseD-.30)/2);
  // Tornillos, anclajes y gomas antideslizantes.
  for(const x of [-3.78,5.08])for(const z of [-3.54,3.53])
    rounded(.36,.24,.36,.03,dark,chassis,x,-.34,z);
  const CASE_CLOSE_ANGLE=0,CASE_OPEN_ANGLE=1.32;
  doorHinge.rotation.z=CASE_OPEN_ANGLE;

  // La chapa I/O tiene que coincidir con el REAR I/O de la motherboard:
  // la abertura trasera del chasis está en -X y los cinco puertos se
  // distribuyen sobre Z, no a lo ancho de la bandeja.
  // Bastidor abierto: el hueco central deja visibles USB, HDMI y DP.
  const ioShield=new THREE.Group();ioShield.name='Chapa I/O ATX trasera';
  ioShield.userData.partId='ioShield';
  scene.add(ioShield);
  const portsPanel=new THREE.MeshStandardMaterial({
    color:0x9bb3bf,roughness:.36,metalness:.84,side:THREE.DoubleSide
  });
  // Marco en plano YZ: espesor X 0.09, alto Y 0.98 y largo Z 2.90.
  for(const y of [.10,1.04])
    rounded(.09,.10,2.90,.025,portsPanel,ioShield,0,y,0);
  for(const z of [-1.40,1.40])
    rounded(.09,.96,.12,.024,portsPanel,ioShield,0,.57,z);
  // Travesaños de chapa entre grupos de puertos, sin tapar sus contactos.
  for(const z of [-.70,.71])
    rounded(.10,.055,.11,.015,portsPanel,ioShield,0,.59,z);
  // Los marcos metálicos visibles los crea la propia placa y atraviesan
  // este bastidor. Evitamos tapar la boca con los antiguos bloques macizos.
  // Dos bahías separadas para HDD 3.5" y SSD 2.5", frontales en el chasis.
  // Las antiguas bandejas pedagógicas al costado no deben competir con
  // la jaula REAL que construye towerATX. Conservamos el grupo por API.
  const storageBays=new THREE.Group();chassis.add(storageBays);
  storageBays.visible=false;
  for(const z of [1.64,2.85]){
    for(const x of [1.65,5.15])
      rounded(.11,.60,1.09,.025,alu,storageBays,x,.43,z);
    rounded(3.70,.065,1.12,.026,dark,storageBays,3.40,.17,z);
  }
  // Ventiladores de caja reales: dos entradas delante y una salida detrás.
  const fanMountGroup=new THREE.Group();
  fanMountGroup.name='Bastidores ventiladores torre';
  scene.add(fanMountGroup);
  const caseFanMounts=[];
  const caseFanSourcePorts=[];
  // X positivo = frontal de la torre, X negativo = salida trasera.
  for(const [index,pos,rot] of [
    [0,[4.78,1.61,-2.00],-Math.PI/2],
    [1,[4.78,1.61,.47],-Math.PI/2],
    [2,[-3.89,REAR_CASE_FAN_Y,-1.25],Math.PI/2]
  ]){
    const holder=new THREE.Group();holder.position.set(...pos);
    holder.rotation.z=rot;fanMountGroup.add(holder);
    const axial=fan(holder,0,0,0,1.13,{kind:'case',square:true});
    axial.userData.caseFanSlot=index;
    const fLabels=label(index===2?'OUT':'IN',.37,.13);
    fLabels.position.set(0,.12,1.08);holder.add(fLabels);
    // Conector PWM en el propio bastidor: el mazo nace de la toma física.
    const pwm=createInternalHeader3d(THREE,'fan');
    pwm.name='PWM ventilador de caja '+index;
    pwm.position.set(.18,-.18,.79);
    pwm.rotation.z=index===2?-Math.PI:Math.PI;
    holder.add(pwm);
    caseFanMounts.push(holder);caseFanSourcePorts.push(pwm);
  }
  // Placas base con cuerpo físico diferente y distribución de cada familia.
  const motherboardModels={};
  const internalHeaderModels={};
  const rearUsbSockets={};
  const rearVideoSockets={};
  function createBoard(id,cfg){
    const b=new THREE.Group();b.name='PCB_'+id;board.add(b);
    const left=cfg.x-cfg.w/2, right=cfg.x+cfg.w/2;
    const top=cfg.z-cfg.d/2, bottom=cfg.z+cfg.d/2;
    rounded(cfg.w,.13,cfg.d,.035,materials.pcb,b,cfg.x,.29,cfg.z);
    // Anclajes se sitúan siempre dentro del contorno de la placa.
    for(const [x,z] of getMotherboardMountPoints(cfg)){
      cylinder(.085,.018,gold,b,x,.37,z,12);
      cylinder(.040,.020,dark,b,x,.389,z,12);
    }
    // Pistas de PCB finas, sin invadir el contorno.
    for(let i=0;i<76;i++){
      const x=left+.17+((i*17)%67)/67*(cfg.w-.37);
      const z=top+.18+((i*13)%71)/71*(cfg.d-.4);
      const end=Math.min(right-.16,x+.08+(i%4)*.06);
      trace(x,z,end,z,.364,i%7===0?gold:materials.green,b,.004);
    }
    // Puerto y clavija comparten exactamente el MISMO origen. Las
    // tomas tienen un marco hueco, lengüeta, aislante y contactos visibles.
    rearUsbSockets[id]=[];
    for(let i=0;i<REAR_USB_COUNT;i++){
      const socket=createRearReceptacle3d(THREE,'usbA');
      const xyz=getRearUsbAnchor(cfg,i);
      socket.position.set(xyz[0],xyz[1]-MOTHERBOARD_MOUNT.offsetY,xyz[2]);
      socket.name='USB-A trasero '+(i+1);b.add(socket);
      rearUsbSockets[id].push(socket);
    }
    rearVideoSockets[id]={};
    for(const type of ['hdmi','displayPort']){
      const socket=createRearReceptacle3d(THREE,type);
      const xyz=getRearVideoAnchor(cfg,type);
      socket.position.set(xyz[0],xyz[1]-MOTHERBOARD_MOUNT.offsetY,xyz[2]);
      socket.name='Vídeo de placa '+type;b.add(socket);
      rearVideoSockets[id][type]=socket;
    }
    // Socket real, CPU retirada en pieza independiente.
    rounded(1.13,.085,1.13,.065,silver,b,cfg.cpuX,.43,cfg.cpuZ);
    rounded(.94,.04,.94,.04,dark,b,cfg.cpuX,.50,cfg.cpuZ);
    for(let i=0;i<6;i++){
      rounded(.11,.18,.16,.017,dark,b,cfg.cpuX-.79+i*.20,.52,cfg.cpuZ-.78);
    }
    // Disipadores VRM, más grandes en Z790.
    const tall=id==='z790'?.48:(id==='b650'?.37:.15);
    rounded(.46,tall,1.90,.05,id==='a520'?dark:alu,b,left+.48,.40+tall/2,top+1.65);
    rounded(1.68,tall,.35,.04,id==='a520'?dark:alu,b,cfg.cpuX,.40+tall/2,top+.26);
    if(id==='z790')for(let i=0;i<7;i++){
      box(.018,.015,1.74,dark,b,left+.29+i*.06,.40+tall,top+1.65);
    }
    // DIMM: cada ranura es el largo de un módulo de 133 mm.
    for(let i=0;i<cfg.dimms;i++){
      const x=cfg.dimmXs[i],z=cfg.cpuZ+.05;
      rounded(.16,.12,mm(135),.02,dark,b,x,.45,z);
      for(let sign of [-1,1]){
        box(.21,.14,.10,white,b,x,.49,z+sign*mm(66));
      }
    }
    // Receptáculos internos diferenciados, huecos y con pines reales:
    // ATX24, EPS8, USB 19-pin, USB-C Type-E, F_PANEL, SATA y PWM.
    internalHeaderModels[id]={};
    for(const kind of ['atx24','eps','frontUsb3','frontUsbC',
      'frontPanel','sataData','fan','caseFan0','caseFan1','caseFan2']){
      const header=createInternalHeader3d(THREE,
        kind.startsWith('caseFan')?'fan':kind);
      const [x,y,z]=getInternalHeaderAnchor(cfg,kind);
      header.position.set(x,y-MOTHERBOARD_MOUNT.offsetY,z);
      b.add(header);
      internalHeaderModels[id][kind]=header;
    }
    // PCIe principal más ranuras de expansión inferiores.
    for(let i=0;i<cfg.slots;i++){
      const z=cfg.pcieZ+i*.80;
      rounded(i===0?mm(89):mm(68),.11,.16,.015,i===0?silver:dark,b,cfg.pcieX,.45,z);
      box(i===0?1.55:1.16,.014,.042,gold,b,cfg.pcieX,.515,z);
    }
    // M.2: una o varias posiciones entre socket y zona de expansión.
    for(let i=0;i<cfg.m2;i++){
      let xx=cfg.x-.80+(i%2)*1.50;
      let zz=cfg.z+.08+Math.floor(i/2)*1.30;
      rounded(mm(80),.055,mm(22),.01,dark,b,xx,.46,zz);
      if(id!=='a520')rounded(mm(74),.07,.36,.018,alu,b,xx,.51,zz);
    }
    // Condensadores, VRM y chipset con proporciones plausibles.
    for(let i=0;i<20;i++){
      let x=cfg.cpuX-.72+(i%5)*.25;
      let z=cfg.cpuZ+.77+Math.floor(i/5)*.18;
      cylinder(.042,.16,alu,b,x,.50,z,10);
    }
    rounded(.83,.18,.85,.04,id==='a520'?silver:alu,b,right-.64,.49,bottom-.94);
    // El header SATA de datos usa la ranura en L del grupo anterior.
    // Conectores secundarios SATA se dejan sin cable en esta configuración.
    // Serigrafía técnica, etiqueta discreta y batería CMOS.
    const tag=label(id.toUpperCase(),.64,.18);
    tag.position.set(left+1.2,.369,bottom-.45);b.add(tag);
    cylinder(.15,.024,silver,b,left+1.04,.40,bottom-1.28,24);
    motherboardModels[id]=b;
  }
  for(const [id,cfg] of Object.entries(BOARD_LAYOUTS))createBoard(id,cfg);

  // CPU: encapsulado y superficie metálica 40x40 mm aproximadamente.
  rounded(.80,.10,.80,.02,silver,cpu,0,.13,0);
  const cpuLabel=label('CPU',.42,.15);cpuLabel.position.set(0,.191,0);cpu.add(cpuLabel);
  for(let i=0;i<10;i++)for(let j=0;j<3;j++){
    box(.035,.012,.017,gold,cpu,-.30+i*.065,.074,-.29+j*.29);
  }

  // RAM: PCB vertical con longitud física de 133 mm y altura aprox. 35 mm.
  const modules=[];
  for(let k=0;k<2;k++){
    const stick=new THREE.Group();ram.add(stick);modules.push(stick);
    rounded(.11,.69,mm(133),.025,materials.pcbdark,stick,0,.30,0);
    rounded(.14,.50,mm(119),.036,k?dark:black,stick,0,.39,0);
    for(let j=0;j<12;j++){
      const z=-1.17+j*.205;
      box(.13,.07,.095,gold,stick,0,-.055,z);
    }
    for(let j=0;j<8;j++){
      box(.015,.22,.20,dark,stick,.081,.39,-1.01+j*.285);
    }
    rounded(.15,.055,mm(114),.012,silver,stick,0,.695,0);
  }

  // Disipador de torre: aletas superpuestas y ventilador cuadrado LATERAL.
  cooler.position.y=.5;
  rounded(.88,.12,.85,.04,copper,cooler,0,.11,0);
  for(let i=0;i<40;i++){
    rounded(mm(125),.025,.82,.012,alu,cooler,0,.35+i*.068,0);
  }
  for(let x of [-.68,-.25,.25,.68])cylinder(.055,2.85,copper,cooler,x,1.69,-.20,12);
  // La geometría del fan se crea horizontal y se gira para mirar hacia +Z.
  function frontFan(parent,x,y,z,r,options={}){
    const wrapper=new THREE.Group();
    wrapper.position.set(x,y,z);
    wrapper.rotation.x=Math.PI/2;
    parent.add(wrapper);
    fan(wrapper,0,0,0,r,options);
  }
  frontFan(cooler,0,1.63,.57,mm(120)/2,{kind:'cooler',square:true});
  // Cada refrigerador comparte el mismo anclaje de CPU, pero utiliza
  // una silueta diferente. Se mantiene el modelo clásico para air.
  const coolerAir=new THREE.Group();
  for(const child of [...cooler.children])coolerAir.add(child);
  cooler.add(coolerAir);
  const coolerStock=new THREE.Group();cooler.add(coolerStock);
  rounded(1.50,.28,1.50,.09,metal,coolerStock,0,.26,0);
  for(let i=0;i<9;i++)rounded(1.45,.045,1.22,.014,alu,coolerStock,0,.42+i*.085,0);
  frontFan(coolerStock,0,1.16,0,mm(87)/2,{kind:'cooler',square:true});
  const coolerTwin=new THREE.Group();cooler.add(coolerTwin);
  for(const x of [-.65,.65]){
    rounded(.89,.16,1.65,.06,copper,coolerTwin,x,.22,0);
    for(let i=0;i<22;i++)
      rounded(1.12,.045,1.69,.012,alu,coolerTwin,x,.48+i*.12,0);
    for(const z of [-.44,.44])cylinder(.047,3.07,copper,coolerTwin,x,1.54,z,12);
  }
  frontFan(coolerTwin,0,1.61,.75,1.09,{kind:'cooler',square:true});
  function buildAIO(count){
    const aio=new THREE.Group();cooler.add(aio);
    rounded(1.05,.49,1.05,.09,black,aio,0,.56,0);
    rounded(.71,.065,.71,.03,materials.blue,aio,0,.85,0);
    // Radiador plano y ventiladores por encima del bloque de CPU.
    const length=count===3?6.95:4.73;
    rounded(length,.35,1.89,.08,metal,aio,1.12,3.18,-1.26);
    for(let i=0;i<count;i++){
      const x=1.12+(i-(count-1)/2)*2.29;
      frontFan(aio,x,3.42,-1.26,.99,{kind:'case',square:true});
    }
    for(const z of [-.25,.23]){
      // Tubos flexibles de bomba hacia radiador.
      const path=new THREE.CatmullRomCurve3([
        new THREE.Vector3(z,.94,-.18),
        new THREE.Vector3(-1.30,1.57,z-.50),
        new THREE.Vector3(-1.0,3.04,-1.0+z),
        new THREE.Vector3(-.45,3.19,-1.29+z)
      ]);
      aio.add(new THREE.Mesh(new THREE.TubeGeometry(path,22,.055,8,false),black));
    }
    return aio;
  }
  const coolerFanPort=createInternalHeader3d(THREE,'fan');
  coolerFanPort.name='Toma PWM del disipador';
  coolerFanPort.position.set(.47,1.63,.63);
  cooler.add(coolerFanPort);
  const coolerAIO240=buildAIO(2),coolerAIO360=buildAIO(3);
  const coolerVariants={air:coolerAir,stock:coolerStock,twinTower:coolerTwin,
    aio240:coolerAIO240,aio360:coolerAIO360};

  // Bracket trasero PCIe: tres DisplayPort y un HDMI, con orificios
  // geométricos independientes. Sigue al modelo de GPU al cambiar de placa.
  const gpuBracketPorts=GPU_REAR_PORT_TYPES.map((type,index)=>{
    const socket=createRearReceptacle3d(THREE,type);
    socket.name='GPU '+(index<3?'DisplayPort '+(index+1):'HDMI');
    gpu.add(socket);
    return socket;
  });
  const gpuPowerHeader=createInternalHeader3d(THREE,'gpu');
  gpu.add(gpuPowerHeader);
  const gpuBracket=new THREE.Group();gpu.add(gpuBracket);
  rounded(.075,2.05,.48,.028,alu,gpuBracket,0,0,0);

  // GPU perpendicular a placa base, con ventiladores visibles empotrados
  // en la cubierta y chapa PCIe diferenciada.
  const videoCards={};
  function makeCard(id,dimensions,color){
    const g=new THREE.Group();gpu.add(g);videoCards[id]=g;
    const [len,hgt,thick]=dimensions.map(mm);
    rounded(len,hgt,thick,.10,color,g,0,hgt/2,0);
    rounded(len-.14,hgt-.17,.07,.065,black,g,0,hgt/2,thick/2+.015);
    // Aro/carcasa de GPU y borde para evitar apariencia de placa lisa.
    for(const x of [-len/2+.10,len/2-.10])
      rounded(.14,hgt-.15,thick+.05,.04,dark,g,x,hgt/2,0);
    rounded(len-.25,.13,thick+.07,.03,dark,g,0,hgt-.07,0);
    rounded(len-.30,.06,thick-.10,.014,alu,g,0,hgt+.03,0);
    rounded(len-.06,.035,thick-.10,.013,materials.pcbdark,g,0,.06,0);
    for(let j=0;j<25;j++)
      box(.048,.38,thick*.68,alu,g,-len/2+.20+j*(len-.4)/24,hgt/2,0);
    const radius=Math.min(hgt*.40,len*.215);
    for(let i=0;i<2;i++)
      frontFan(g,(i?1:-1)*len*.245,hgt*.53,thick/2+.07,radius,{kind:'gpu'});
    rounded(.09,hgt+.20,thick+.10,.02,silver,g,-len/2-.04,hgt/2,0);
    for(let i=0;i<4;i++)
      box(.015,.11,.13,dark,g,-len/2-.10,.45+i*.25,.12);
    rounded(mm(86),.11,.08,.01,gold,g,-len*.16,.025,0);
    // El hueco 6+2 PCIe pertenece a gpuPowerHeader, compartido
    // por cada variante, y se mueve con el ensamblaje.
  }
  makeCard('rx7600',[245,134,49],metal);
  makeCard('rtx4070',[267.01,133.94,51.13],materials.blue);

  // Fuente ATX abierta sólo en la superficie de ventilación; el rotor
  // queda hundido y una rejilla estacionaria protege su cara superior.
  // PSU inferior trasera, en shroud. Dimensiones finales aprox. 150x86x140 mm:
  // escala local X (fondo), Y (ancho) y Z (altura) tras girar la torre.
  psu.position.set(-2.50,.31,4.58);
  psu.rotation.y=0;
  psu.scale.set(1,1.67,.62);
  const pw=mm(150),pd=mm(140),ph=mm(86),wall=.10;
  rounded(pw,.12,pd,.07,metal,psu,0,.06,0);
  for(const x of [-pw/2+wall/2,pw/2-wall/2])
    box(wall,ph-.12,pd,metal,psu,x,ph/2+.06,0);
  for(const z of [-pd/2+wall/2,pd/2-wall/2])
    box(pw-.15,ph-.12,wall,metal,psu,0,ph/2+.06,z);
  for(const x of [-pw/2+.10,pw/2-.10])
    box(.20,.06,pd-.08,metal,psu,x,ph+.018,0);
  for(const z of [-pd/2+.10,pd/2-.10])
    box(pw-.08,.06,.20,metal,psu,0,ph+.018,z);
  fan(psu,0,ph-.20,0,mm(120)/2,{kind:'psu',grille:true});
  // Panel modular orientado hacia +X, consistente con todos los mazos PSU.
  rounded(.11,1.36,1.90,.035,dark,psu,pw/2+.018,.95,0);
  // Panel modular PSU: cuatro receptáculos reales orientados hacia +X.
  // La PSU se escala no uniformemente, de modo que compensamos el tamaño
  // de los headers para evitar ensanchamientos y solapes entre clavijas.
  const psuCableSockets={};
  for(const [kind,p] of Object.entries(PSU_CABLE_PORTS)){
    const receptacle=createInternalHeader3d(THREE,kind);
    receptacle.name='Puerto modular PSU '+kind;
    receptacle.position.set((p[0]-psu.position.x)/psu.scale.x,
      (p[1]-psu.position.y)/psu.scale.y,(p[2]-psu.position.z)/psu.scale.z);
    receptacle.rotation.z=-Math.PI/2;
    receptacle.scale.set(.55/psu.scale.y,.55,.55/psu.scale.z);
    psu.add(receptacle);
    psuCableSockets[kind]=receptacle;
  }
  // Toma IEC AC trasera, diferente de los cuatro conectores modulares.
  rounded(.57,.34,.075,.02,dark,psu,-.92,.57,-pd/2-.018);
  const psuLabel=label('ATX PSU',.85,.18);
  psuLabel.position.set(0,ph+.055,1.25);psu.add(psuLabel);

  // Soporte de unidades de la bancada: físicamente separado del PCB,
  // con raíles para SSD de 2.5 y HDD de 3.5.
  const tray=new THREE.Group();storage.add(tray);
  tray.position.set(3.03,-.22,4.71);
  rounded(3.36,.065,2.48,.05,dark,tray,0,.095,0);
  for(const x of [-1.60,1.60]){
    rounded(.09,.20,2.36,.02,alu,tray,x,.19,0);
    for(const z of [-.91,.91])cylinder(.045,.02,silver,tray,x,.295,z,12);
  }
  for(const z of [-1.16,1.16])
    rounded(3.18,.09,.07,.01,metal,tray,0,.16,z);

  // SSD SATA 2.5": 100x69.85x7 mm, sobre el soporte, no en un slot M.2.
  const sataDrive=new THREE.Group();storage.add(sataDrive);
  // El SSD SATA ocupa un adaptador 2,5" -> 3,5" de la bahía inferior.
  // Compartir la jaula con el HDD no implica que ambos estén instalados.
  sataDrive.position.set(...getSsdBayPosition());
  rounded(mm(100),mm(7),mm(69.85),.035,black,sataDrive,0,mm(7)/2,0);
  rounded(1.83,.013,1.20,.02,alu,sataDrive,0,mm(7)+.01,0);
  // Conectores en el borde físico de la unidad. Su normal apunta hacia
  // -X, perpendicular al extremo SATA de 2.5 pulgadas.
  const sataSsdPorts={};
  for(const [kind,z] of [['sataData',-.23],['sataPower',.30]]){
    const port=createInternalHeader3d(THREE,kind);
    port.rotation.z=Math.PI/2;
    port.position.set(-1.035,.13,z);
    sataDrive.add(port);sataSsdPorts[kind]=port;
  }
  const ssdText=label('SATA SSD',.75,.15);
  ssdText.position.set(0,mm(7)+.037,0);sataDrive.add(ssdText);

  // HDD SATA 3.5": 147x101.6x26.1 mm, más grande y grueso.
  const hddDrive=new THREE.Group();storage.add(hddDrive);
  // HDD de 3,5": dentro de la bandeja deslizante SUPERIOR de la jaula,
  // bajo el shroud de la fuente. Montaje ligado al mismo layout del chasis.
  hddDrive.position.set(...getHddBayPosition('upper'));
  rounded(mm(147),mm(26.1),mm(101.6),.055,metal,hddDrive,0,mm(26.1)/2,0);
  rounded(2.65,.012,1.67,.02,alu,hddDrive,0,mm(26.1)+.012,0);
  const sataHddPorts={};
  for(const [kind,z] of [['sataData',-.29],['sataPower',.29]]){
    const port=createInternalHeader3d(THREE,kind);
    port.rotation.z=Math.PI/2;
    port.position.set(-1.50,.23,z);
    hddDrive.add(port);sataHddPorts[kind]=port;
  }
  const hddText=label('HDD 3.5',.79,.17);
  hddText.position.set(0,mm(26.1)+.025,0);hddDrive.add(hddText);

  // Bahía inferior independiente: geometría HDD 3,5" y puertos propios.
  // La segunda unidad no sustituye el disco de la bahía superior.
  const hddDrive2=hddDrive.clone(true);
  hddDrive2.name='HDD SATA 2 · bahía inferior';
  hddDrive2.userData.partId='storage2';
  hddDrive2.position.set(...getHddBayPosition('lower'));
  hddDrive2.visible=false;
  storage.add(hddDrive2);

  // Un segundo SSD SATA de 2,5" es una instancia distinta del disco
  // principal. El adaptador lo sitúa en la bahía disponible de la jaula.
  const sataDrive2=sataDrive.clone(true);
  sataDrive2.name='SSD SATA 2 · bandeja libre';
  sataDrive2.userData.partId='storage2';
  sataDrive2.visible=false;
  storage.add(sataDrive2);

  // M.2 2280 sobre su conector PCIe/M.2 propio de la placa.
  const m2Drive=new THREE.Group();storage.add(m2Drive);
  rounded(mm(80),.046,mm(22),.01,materials.pcbdark,m2Drive,0,0,0);
  for(let i=0;i<4;i++)rounded(.22,.024,.21,.006,dark,m2Drive,-.50+i*.29,.035,0);
  box(.14,.016,.36,gold,m2Drive,.71,.01,0);

  // Marcadores calculados de los conectores de cada placa.
  const anchors={eps:new THREE.Vector3(),ram:new THREE.Vector3(),
    sata:new THREE.Vector3(),gpu:new THREE.Vector3(),fan:new THREE.Vector3(),
    atx:new THREE.Vector3(),frontPanel:new THREE.Vector3()};
  let currentLayout=BOARD_LAYOUTS.b650;
  function configure(s){
    doorHinge.rotation.z=s?.caseClosed?CASE_CLOSE_ANGLE:CASE_OPEN_ANGLE;
    const id=s?.selected?.motherboard in BOARD_LAYOUTS?s.selected.motherboard:'b650';
    const cfg=BOARD_LAYOUTS[id];currentLayout=cfg;
    for(const [key,obj] of Object.entries(motherboardModels))obj.visible=key===id;
    cpu.position.set(cfg.cpuX,.40+MOTHERBOARD_MOUNT.offsetY,cfg.cpuZ);
    cooler.position.set(cfg.cpuX,.43+MOTHERBOARD_MOUNT.offsetY,cfg.cpuZ);
    for(const [id,obj] of Object.entries(coolerVariants))
      obj.visible=id===(s?.selected?.cooler||'air');
    const chosen=s?.selected?.ram;
    const twoSticks=['ddr5_32','ddr4_32','ddr5_64'].includes(chosen);
    modules[0].position.set(cfg.dimmXs[Math.max(0,cfg.dimms===2?0:1)],.50,cfg.cpuZ+.05);
    modules[1].position.set(cfg.dimmXs[cfg.dimms-1],.50,cfg.cpuZ+.05);
    modules[1].visible=twoSticks;
    const card=s?.selected?.gpu==='rtx4070'?'rtx4070':'rx7600'; // fallback mesh para variantes GPU 8.1
    for(const [key,obj] of Object.entries(videoCards))obj.visible=key===card;
    gpu.position.set(cfg.pcieX,.46+MOTHERBOARD_MOUNT.offsetY,cfg.pcieZ+.01);
    const gpuFeed=getGpuPowerAnchor(cfg,card);
    gpuPowerHeader.position.set(gpuFeed[0]-gpu.position.x,
      gpuFeed[1]-gpu.position.y,gpuFeed[2]-gpu.position.z);
    gpuBracketPorts.forEach((socket,i)=>{
      const a=getGpuVideoAnchor(cfg,i);
      socket.position.set(a[0]-gpu.position.x,a[1]-gpu.position.y,a[2]-gpu.position.z);
    });
    const a=getGpuVideoAnchor(cfg,1);
    gpuBracket.position.set(a[0]-gpu.position.x+.22,
      a[1]-gpu.position.y+.24,a[2]-gpu.position.z);
    m2Drive.position.set(cfg.x-.80,.49+MOTHERBOARD_MOUNT.offsetY,cfg.z+.08);
    sataDrive.visible=['sataSSD','sataSSD2'].includes(s?.selected?.storage);
    hddDrive.visible=['hdd','hdd4'].includes(s?.selected?.storage);
    // HDD y SSD SATA pueden convivir, incluidos dos SSD idénticos:
    // cada ejemplar mantiene su mesh y posición propios.
    const secondaryId=s?.secondaryStorage?.id;
    const secondaryHdd=['hdd','hdd4'].includes(secondaryId);
    const secondarySsd=['sataSSD','sataSSD2'].includes(secondaryId);
    const secondaryBay=s?.secondaryStorage?.bay||
      (['hdd','hdd4'].includes(s?.selected?.storage)?'lower':
        ['sataSSD','sataSSD2'].includes(s?.selected?.storage)||secondaryHdd?'upper':'lower');
    hddDrive2.position.set(...getHddBayPosition(secondaryBay));
    sataDrive2.position.set(...(secondaryBay==='upper'?
      getHddBayPosition('upper'):getSsdBayPosition()));
    hddDrive2.visible=!!s?.secondaryStorage?.installed&&secondaryHdd;
    sataDrive2.visible=!!s?.secondaryStorage?.installed&&secondarySsd;
    m2Drive.visible=['nvmeSSD','nvme2'].includes(s?.selected?.storage);
    const needsSata=sataDrive.visible||hddDrive.visible;
    tray.visible=false; // las bandejas correctas las crea towerATX.js
    // Mismo borde izquierdo y misma cota Z que la hilera I/O de
    // la PCB elegida. La placa se inserta en este marco por detrás.
    const rearX=cfg.x-cfg.w/2-.20;
    const ioZ=cfg.z-cfg.d/2+1.58;
    ioShield.position.set(rearX,MOTHERBOARD_MOUNT.offsetY,ioZ);
    ioShield.visible=!!s?.installed?.case&&!!s?.ioShield;
    caseFanMounts.forEach((mount,i)=>{
      mount.visible=!!s?.caseFans?.[i]?.installed;
    });
    anchors.eps.set(cfg.epsX,.94+MOTHERBOARD_MOUNT.offsetY,cfg.epsZ);
    anchors.atx.set(cfg.atxX,.82+MOTHERBOARD_MOUNT.offsetY,cfg.atxZ);
    anchors.frontPanel.set(cfg.x+cfg.w/2-.42,.59+MOTHERBOARD_MOUNT.offsetY,cfg.z+cfg.d/2-.32);
    anchors.ram.set(modules[0].position.x,1.50+MOTHERBOARD_MOUNT.offsetY,cfg.cpuZ+.05);
    // Diagnóstico SATA fijado al conector real de la unidad instalada.
    const chosenSata=hddDrive.visible?sataHddPorts.sataData:sataSsdPorts.sataData;
    chosenSata.getWorldPosition(anchors.sata);
    anchors.gpu.set(cfg.pcieX+1.08,3.36+MOTHERBOARD_MOUNT.offsetY,cfg.pcieZ+.35);
    anchors.fan.set(cfg.cpuX,3.45+MOTHERBOARD_MOUNT.offsetY,cfg.cpuZ+.60);
    // Objetivos físicos en el espacio del chasis para el encaje asistido.
    const snapTargets={
      case:new THREE.Vector3(.65,.20,.15),
      motherboard:new THREE.Vector3(cfg.x,.38+MOTHERBOARD_MOUNT.offsetY,cfg.z),
      cpu:new THREE.Vector3(cfg.cpuX,.64+MOTHERBOARD_MOUNT.offsetY,cfg.cpuZ),
      cooler:new THREE.Vector3(cfg.cpuX,2.08+MOTHERBOARD_MOUNT.offsetY,cfg.cpuZ),
      ram:new THREE.Vector3(cfg.dimmXs[cfg.dimms-1],.97+MOTHERBOARD_MOUNT.offsetY,cfg.cpuZ+.05),
      gpu:new THREE.Vector3(cfg.pcieX,1.45+MOTHERBOARD_MOUNT.offsetY,cfg.pcieZ),
      psu:new THREE.Vector3(-2.50,1.55,4.58),
      storage:new THREE.Vector3(
        ['nvmeSSD','nvme2'].includes(s?.selected?.storage)?cfg.x-.80:
          (['hdd','hdd4'].includes(s?.selected?.storage)?getHddBayPosition()[0]:-.30),
        ['nvmeSSD','nvme2'].includes(s?.selected?.storage)?.54+MOTHERBOARD_MOUNT.offsetY:
          (['hdd','hdd4'].includes(s?.selected?.storage)?getHddBayPosition()[1]+mm(26.1)/2:-.45),
        ['nvmeSSD','nvme2'].includes(s?.selected?.storage)?cfg.z+.08:
          (['hdd','hdd4'].includes(s?.selected?.storage)?getHddBayPosition()[2]:.65)
      )
    };
    return {cfg,anchors,snapTargets,sataDrive,hddDrive,m2Drive,tray,needsSata};
  }
  return {chassis,board,cpu,ram,cooler,gpu,psu,storage,doorHinge,caseFrame,
    configure,anchors,motherboardModels,internalHeaderModels,gpuPowerHeader,
    rearUsbSockets,rearVideoSockets,
    gpuBracketPorts,psuCableSockets,videoCards,sataDrive,hddDrive,m2Drive,
    sataSsdPorts,sataHddPorts,coolerFanPort,caseFanSourcePorts,
    tray,ioShield,storageBays,hddDrive2,sataDrive2,caseFanMounts,fanMountGroup};
}
