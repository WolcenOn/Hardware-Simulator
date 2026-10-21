// Escenario 7.0: proporciones derivadas de tamaños físicos (1 unidad = 50 mm).
// Referencias: ATX 305x244; ASUS A520M-K 226x221; GPU ASUS Dual RX7600 245x134x49,
// ASUS Dual RTX4070 267.01x133.94x51.13; ventilador 120x120x25;
// torre NH-U12S redux 158 mm; PSU Corsair RM850e 150x140x86.
export const MM_PER_UNIT = 50;
const mm = value => value / MM_PER_UNIT;

// Cara modular +X de la PSU: todos los cables de ALIMENTACIÓN salen de aquí.
export const PSU_CABLE_PORTS = Object.freeze({
  atx24:[4.80,1.26,1.82],
  eps:[4.80,1.26,.88],
  gpu:[4.80,.74,.88],
  sataPower:[4.80,.74,1.82]
});

export const BOARD_LAYOUTS = {
  b650: {name:'B650 ATX',w:mm(244),d:mm(305),x:-1.20,z:0,dimms:4,slots:2,m2:2,
    cpuX:-1.55,cpuZ:-1.48,epsX:-3.31,epsZ:-2.73,atxX:1.11,atxZ:-1.25,
    pcieX:-1.22,pcieZ:.65,dimmXs:[.14,.43,.72,1.01],sataX:1.05,sataZ:2.02,colors:'silver'},
  a520: {name:'A520 mATX',w:mm(221),d:mm(226),x:-1.43,z:-.79,dimms:2,slots:2,m2:1,
    cpuX:-1.62,cpuZ:-1.64,epsX:-3.39,epsZ:-2.82,atxX:.65,atxZ:-1.28,
    pcieX:-1.55,pcieZ:.13,dimmXs:[.26,.57],sataX:.54,sataZ:1.07,colors:'white'},
  z790: {name:'Z790 ATX',w:mm(244),d:mm(305),x:-1.20,z:0,dimms:4,slots:3,m2:4,
    cpuX:-1.55,cpuZ:-1.50,epsX:-3.24,epsZ:-2.74,atxX:1.11,atxZ:-1.26,
    pcieX:-1.22,pcieZ:.60,dimmXs:[.14,.43,.72,1.01],sataX:1.02,sataZ:2.10,colors:'black'}
};

export function buildRealScale(p) {
  const {THREE, scene, group, rounded, box, cylinder, trace, label, fan, materials} = p;
  const board=group('board'),cpu=group('cpu'),ram=group('ram');
  const gpu=group('gpu'),cooler=group('cooler'),psu=group('psu');
  const storage=group('storage'),chassis=group('case');
  const pcbTop=.40;
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

  // Placas base con cuerpo físico diferente y distribución de cada familia.
  const motherboardModels={};
  function createBoard(id,cfg){
    const b=new THREE.Group();b.name='PCB_'+id;board.add(b);
    const left=cfg.x-cfg.w/2, right=cfg.x+cfg.w/2;
    const top=cfg.z-cfg.d/2, bottom=cfg.z+cfg.d/2;
    rounded(cfg.w,.13,cfg.d,.035,materials.pcb,b,cfg.x,.29,cfg.z);
    // Anclajes se sitúan siempre dentro del contorno de la placa.
    for(const x of [left+.24,right-.24])
      for(const z of [top+.22,bottom-.25]){
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
    // Panel de puertos traseros, en lateral izquierdo.
    for(let i=0;i<5;i++){
      rounded(.22,.27,.33,.02,i%2?alu:silver,b,left+.13,.51,top+.55+i*.50);
    }
    // Socket real, CPU retirada en pieza independiente.
    rounded(1.13,.085,1.13,.065,silver,b,cfg.cpuX,.43,cfg.cpuZ);
    rounded(.94,.04,.94,.04,dark,b,cfg.cpuX,.50,cfg.cpuZ);
    for(let i=0;i<6;i++){
      rounded(.11,.18,.16,.017,dark,b,cfg.cpuX-.79+i*.20,.52,cfg.cpuZ-.78);
    }
    // Disipadores VRM, más grandes en Z790.
    const tall=id==='z790'?.48:(id==='b650'?.37:.15);
    rounded(.46,tall,2.18,.05,id==='a520'?dark:alu,b,left+.48,.40+tall/2,top+1.30);
    rounded(1.68,tall,.35,.04,id==='a520'?dark:alu,b,cfg.cpuX,.40+tall/2,top+.26);
    if(id==='z790')for(let i=0;i<7;i++){
      box(.018,.015,1.84,dark,b,left+.29+i*.06,.40+tall,top+1.30);
    }
    // DIMM: cada ranura es el largo de un módulo de 133 mm.
    for(let i=0;i<cfg.dimms;i++){
      const x=cfg.dimmXs[i],z=cfg.cpuZ+.05;
      rounded(.16,.12,mm(135),.02,dark,b,x,.45,z);
      for(let sign of [-1,1]){
        box(.21,.14,.10,white,b,x,.49,z+sign*mm(66));
      }
    }
    // ATX 24 pines (derecha), EPS CPU (esquina superior izquierda).
    rounded(.28,.43,.90,.02,dark,b,cfg.atxX,.60,cfg.atxZ);
    rounded(.40,.32,.48,.02,dark,b,cfg.epsX,.55,cfg.epsZ);
    // Cabecera F_PANEL y sus dos filas de pines en el borde inferior derecho.
    const frontX=cfg.x+cfg.w/2-.42,frontZ=cfg.z+cfg.d/2-.32;
    rounded(.52,.075,.24,.014,dark,b,frontX,.44,frontZ);
    for(let pin=0;pin<8;pin++){
      const x=frontX-.19+(pin%4)*.125;
      const z=frontZ+(pin<4?-.06:.06);
      box(.025,.12,.027,gold,b,x,.52,z);
    }
    for(let i=0;i<12;i++) cylinder(.018,.04,gold,b,cfg.atxX,.84,cfg.atxZ-.38+i*.064,6);
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
    // SATA orientados hacia el borde delantero.
    for(let i=0;i<4;i++){
      rounded(.25,.20,.14,.015,dark,b,cfg.sataX-(i%2)*.28,.47,cfg.sataZ+Math.floor(i/2)*.19);
    }
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
    rounded(id==='rtx4070'?.30:.38,.18,.18,.01,dark,g,len*.37,hgt+.10,0);
  }
  makeCard('rx7600',[245,134,49],metal);
  makeCard('rtx4070',[267.01,133.94,51.13],materials.blue);

  // Fuente ATX abierta sólo en la superficie de ventilación; el rotor
  // queda hundido y una rejilla estacionaria protege su cara superior.
  psu.position.set(3.18,.12,1.35);
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
  for(const [kind,p] of Object.entries(PSU_CABLE_PORTS)){
    const yy=p[1]-.12,zz=p[2]-1.35;
    const big=kind==='atx24';
    const h=big?.36:.24,d=big?.43:.34;
    rounded(.12,h,d,.014,black,psu,pw/2+.09,yy,zz);
    // Pines dorados en dos hileras dentro del conector.
    for(let col=0;col<(big?5:3);col++)
      for(let row=0;row<2;row++)
        box(.016,.026,.026,gold,psu,pw/2+.157,yy+(row?-.058:.058),
          zz+(col-((big?5:3)-1)/2)*(big?.074:.088));
  }
  // Toma IEC AC trasera, diferente de los cuatro conectores modulares.
  rounded(.57,.34,.075,.02,dark,psu,-.92,.57,-pd/2-.018);
  const psuLabel=label('ATX PSU',.85,.18);
  psuLabel.position.set(0,ph+.055,1.25);psu.add(psuLabel);

  // Soporte de unidades de la bancada: físicamente separado del PCB,
  // con raíles para SSD de 2.5 y HDD de 3.5.
  const tray=new THREE.Group();storage.add(tray);
  tray.position.set(3.08,0,-2.00);
  rounded(3.36,.065,2.48,.05,dark,tray,0,.095,0);
  for(const x of [-1.60,1.60]){
    rounded(.09,.20,2.36,.02,alu,tray,x,.19,0);
    for(const z of [-.91,.91])cylinder(.045,.02,silver,tray,x,.295,z,12);
  }
  for(const z of [-1.16,1.16])
    rounded(3.18,.09,.07,.01,metal,tray,0,.16,z);

  // SSD SATA 2.5": 100x69.85x7 mm, sobre el soporte, no en un slot M.2.
  const sataDrive=new THREE.Group();storage.add(sataDrive);
  sataDrive.position.set(3.08,.17,-2.00);
  rounded(mm(100),mm(7),mm(69.85),.035,black,sataDrive,0,mm(7)/2,0);
  rounded(1.83,.013,1.20,.02,alu,sataDrive,0,mm(7)+.01,0);
  rounded(.12,.10,.30,.012,dark,sataDrive,-1.05,.13,-.23);
  rounded(.12,.10,.48,.012,dark,sataDrive,-1.05,.13,.30);
  const ssdText=label('SATA SSD',.75,.15);
  ssdText.position.set(0,.18,0);sataDrive.add(ssdText);

  // HDD SATA 3.5": 147x101.6x26.1 mm, más grande y grueso.
  const hddDrive=new THREE.Group();storage.add(hddDrive);
  hddDrive.position.set(3.08,.17,-2.00);
  rounded(mm(147),mm(26.1),mm(101.6),.055,metal,hddDrive,0,mm(26.1)/2,0);
  rounded(2.65,.012,1.67,.02,alu,hddDrive,0,mm(26.1)+.012,0);
  rounded(.13,.13,.39,.018,dark,hddDrive,-1.52,.23,0);
  const hddText=label('HDD 3.5',.79,.17);
  hddText.position.set(0,mm(26.1)+.025,0);hddDrive.add(hddText);

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
    cpu.position.set(cfg.cpuX,.40,cfg.cpuZ);
    cooler.position.set(cfg.cpuX,.43,cfg.cpuZ);
    const chosen=s?.selected?.ram;
    const twoSticks=chosen==='ddr5_32';
    modules[0].position.set(cfg.dimmXs[Math.max(0,cfg.dimms===2?0:1)],.50,cfg.cpuZ+.05);
    modules[1].position.set(cfg.dimmXs[cfg.dimms-1],.50,cfg.cpuZ+.05);
    modules[1].visible=twoSticks;
    const card=s?.selected?.gpu==='rtx4070'?'rtx4070':'rx7600';
    for(const [key,obj] of Object.entries(videoCards))obj.visible=key===card;
    gpu.position.set(cfg.pcieX,.46,cfg.pcieZ+.01);
    m2Drive.position.set(cfg.x-.80,.49,cfg.z+.08);
    sataDrive.visible=s?.selected?.storage==='sataSSD';
    hddDrive.visible=s?.selected?.storage==='hdd';
    m2Drive.visible=s?.selected?.storage==='nvmeSSD';
    const needsSata=sataDrive.visible||hddDrive.visible;
    tray.visible=needsSata;
    anchors.eps.set(cfg.epsX,.94,cfg.epsZ);
    anchors.atx.set(cfg.atxX,.82,cfg.atxZ);
    anchors.frontPanel.set(cfg.x+cfg.w/2-.42,.59,cfg.z+cfg.d/2-.32);
    anchors.ram.set(modules[0].position.x,1.50,cfg.cpuZ+.05);
    anchors.sata.set(needsSata?2.10:cfg.x-.80,needsSata?.58:.76,
      needsSata?-2.0:cfg.z+.08);
    anchors.gpu.set(cfg.pcieX+1.08,3.36,cfg.pcieZ+.35);
    anchors.fan.set(cfg.cpuX,3.45,cfg.cpuZ+.60);
    return {cfg,anchors,sataDrive,hddDrive,m2Drive,tray,needsSata};
  }
  return {chassis,board,cpu,ram,cooler,gpu,psu,storage,doorHinge,caseFrame,
    configure,anchors,motherboardModels,videoCards,sataDrive,hddDrive,m2Drive,tray};
}
