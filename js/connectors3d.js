import {portBezelGeometry} from './portProfiles.js?v=8-4-7-cable-exits';
// Conectores procedurales (1 unidad = 50 mm). Las dimensiones son aproximadas.
// Origen = punta insertada; eje +Y = sentido del cable / cuerpo de la clavija.
// Se orientan hacia el tramo de cable sin depender de ninguna cámara.
export function createConnector3d(THREE,kind){
  const g=new THREE.Group();
  g.name='Clavija '+kind;
  g.userData.connectorType=kind;
  g.userData.insertLocal=[0,0,0];
  // La salida se mide en la ÚLTIMA superficie del alivio de tensión.
  g.userData.cableExitLocal=[0,0,0];
  const jacket=new THREE.MeshStandardMaterial({color:0x171e28,metalness:.10,roughness:.75});
  const grip=new THREE.MeshStandardMaterial({color:0x303943,metalness:.14,roughness:.69});
  const steel=new THREE.MeshStandardMaterial({color:0xa9bac5,metalness:.84,roughness:.28});
  const gold=new THREE.MeshStandardMaterial({color:0xc99f4e,metalness:.65,roughness:.37});
  const dark=new THREE.MeshStandardMaterial({color:0x080e14,metalness:.13,roughness:.78});
  const blue=new THREE.MeshStandardMaterial({color:0x2677bc,metalness:.14,roughness:.66});
  const add=(w,h,d,x,y,z,material,part)=>{
    const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);
    mesh.position.set(x,y,z);
    mesh.name=part||'Carcasa';
    g.add(mesh);return mesh;
  };
  const strain=(bodyHeight=.36,width=.22)=>{
    add(width,.20,width*.76,0,bodyHeight+.1,0,grip,'Alivio de tensión');
    const tip=new THREE.Mesh(new THREE.CylinderGeometry(width*.25,width*.33,.14,12),grip);
    tip.position.y=bodyHeight+.24;tip.name='Salida de manguera';g.add(tip);
    g.userData.cableExitLocal=[0,bodyHeight+.31,0];
  };
  function socketGrid(rows,cols,width,depth,omit=-1){
    const px=width/rows,pz=depth/cols;
    for(let row=0;row<rows;row++)for(let col=0;col<cols;col++){
      if(row*cols+col===omit)continue;
      const x=(row-(rows-1)/2)*px,z=(col-(cols-1)/2)*pz;
      add(Math.min(px*.69,.072),.020,Math.min(pz*.71,.066),
        x,-.016,z,dark,'Alvéolo hembra '+(row*cols+col));
      add(Math.min(px*.26,.024),.005,Math.min(pz*.31,.022),
        x,-.028,z,gold,'Contacto interior '+(row*cols+col));
    }
  }
  const rectangular=(w,d,h,rows,cols,omit=-1)=>{
    add(w,h,d,0,h/2-.015,0,jacket,'Cuerpo aislante');
    add(w*.94,.060,d*.91,0,.014,0,grip,'Frente con reborde');
    socketGrid(rows,cols,w*.77,d*.79,omit);
    for(const x of [-w*.42,w*.42])
      add(.024,h*.68,d*.69,x,h*.48,0,grip,'Nervio lateral de guiado');
    strain(h,w*.40);
  };
  // Borde REAL con contorno compartido con la toma hembra. El metal
  // penetra en el puerto; el sobremolde queda fuera, hacia el cable.
  function metalTip(kind){
    const rim=new THREE.Mesh(portBezelGeometry(THREE,kind,.155),steel);
    rim.rotation.x=Math.PI/2;
    rim.position.y=-.025;
    rim.name='Carcasa macho '+kind+' con abertura hueca';g.add(rim);
    return rim;
  }
  function cableBoot(width=.25,base=.48){
    for(let i=0;i<5;i++){
      const y=base+i*.075;
      add(width*(1-i*.105),.025,width*.76*(1-i*.105),0,y,0,
        i%2?grip:jacket,'Nervio flexible del cable');
    }
    const sleeve=new THREE.Mesh(new THREE.CylinderGeometry(.07,.10,.26,12),jacket);
    sleeve.position.y=base+.53;sleeve.name='Último tramo flexible';g.add(sleeve);
    g.userData.cableExitLocal=[0,base+.66,0];
  }
  function videoTip(kind){
    metalTip(kind);
    add(kind==='hdmi'?.36:.39,.39,.24,0,.255,0,jacket,
      kind==='hdmi'?'Mango HDMI trapezoidal':'Mango DisplayPort biselado');
    // Aislante y contactos visibles en dos filas dentro del blindaje.
    add(.20,.075,.030,0,-.105,0,dark,'Lengüeta de vídeo');
    for(let i=0;i<10;i++)
      for(let row=0;row<2;row++)
        add(.012,.020,.009,-.087+i*.019,-.136,row?.021:-.021,
          gold,'Contacto de señal '+(i+row*10));
    if(kind==='displayPort'){
      add(.075,.030,.050,.15,.095,.07,grip,'Pestaña de liberación DisplayPort');
      add(.060,.055,.048,-.16,.115,.04,grip,'Bloqueo DisplayPort');
    }
    cableBoot(.23,.46);
  }
  switch(kind){
    case 'atx24':
      // ATX 24 vías: dos filas de doce alvéolos y pestaña central de cierre.
      rectangular(.36,1.04,.46,2,12);
      add(.09,.23,.28,.23,.28,0,grip,'Clip de retención ATX 24');
      add(.065,.036,.18,.23,.15,0,dark,'Hueco del seguro ATX');
      break;
    case 'eps':
      // EPS 4+4 con hendidura entre mitades y alvéolos cuadrados codificados.
      rectangular(.42,.49,.42,2,4);
      add(.022,.35,.48,0,.20,0,dark,'Junta 4+4 EPS');
      add(.08,.18,.21,.25,.27,0,grip,'Seguro EPS 8-pin');
      break;
    case 'gpu':
      // PCIe 6+2 con bloque de dos polos separado, no un cubo uniforme.
      rectangular(.42,.51,.43,2,4);
      add(.024,.38,.49,.105,.19,0,dark,'Línea divisoria PCIe 6+2');
      add(.08,.17,.17,-.25,.29,.08,grip,'Clip alimentación GPU');
      break;
    case 'frontUsb3':
      rectangular(.53,.44,.40,2,10,19);
      add(.062,.12,.13,.30,.21,0,blue,'Llave de orientación USB 3.0');
      add(.055,.18,.28,-.30,.23,0,grip,'Pestaña 19-pines');
      break;
    case 'frontUsbC':
      // Header Type-E: pequeña ranura codificada y collar rígido.
      add(.38,.34,.32,0,.16,0,jacket,'Carcasa Type-E');
      add(.29,.045,.13,0,-.018,0,grip,'Guía perimetral Type-E');
      add(.21,.021,.070,0,-.034,0,dark,'Boca Type-E codificada');
      add(.12,.014,.026,-.025,-.044,0,steel,'Pieza interior USB Type-E');
      strain(.36,.25);
      break;
    case 'frontPanel':
      // POWER SW 2-pines, cuerpo negro estrecho con marca de polaridad.
      rectangular(.20,.25,.33,1,2);
      add(.025,.045,.038,.113,.08,-.075,steel,'Indicador POWER SW');
      break;
    case 'fan':
    case 'caseFan0':case 'caseFan1':case 'caseFan2':
      rectangular(.22,.42,.35,1,4);
      add(.045,.23,.34,.145,.17,0,grip,'Guía lateral PWM 4 pines');
      break;
    case 'sataData':
    case 'sataPower':{
      const wide=kind==='sataPower',w=wide?.52:.31;
      add(w,.35,.19,0,.16,0,jacket,wide?'Mango SATA 15p':'Mango SATA 7p');
      add(w*.89,.07,.15,0,-.028,0,steel,'Bisel de inserción SATA');
      add(w*.73,.014,.065,-w*.09,-.075,.026,dark,'Canal en forma de L SATA');
      add(.036,.058,.098,-w*.40,-.062,-.015,grip,'Llave L polarizada');
      for(let i=0;i<(wide?15:7);i++)
        add(.014,.008,.015,-w*.31+i*(w*.62/(wide?14:6)),-.078,.026,
          gold,'Contacto SATA '+(i+1));
      strain(.35,w*.43);break;
    }
    case 'usbA':{
      metalTip('usbA');
      add(.175,.11,.024,0,-.126,-.019,blue,'Lengüeta aislante USB-A');
      for(let i=0;i<4;i++)
        add(.022,.037,.009,-.056+i*.037,-.125,-.040,
          gold,'Contacto USB-A '+(i+1));
      // Ventanas para las dos uñas de retención de la cubierta.
      for(const x of [-.056,.056])
        add(.032,.041,.007,x,-.104,.049,dark,'Retención de carcasa USB-A');
      add(.34,.34,.19,0,.25,0,jacket,'Sobremolde rectangular USB-A');
      add(.33,.036,.19,0,.091,0,grip,'Cuello del sobremolde');
      cableBoot(.22,.44);
      break;
    }
    case 'usbC':{
      // Cápsula USB-C reversible, sin confundirla con USB-A rectangular.
      const shell=new THREE.Mesh(new THREE.CapsuleGeometry(.072,.093,5,10),steel);
      shell.rotation.x=Math.PI/2;shell.position.y=-.12;
      shell.scale.set(1,.62,1);shell.name='Carcasa ovalada USB-C';g.add(shell);
      add(.18,.036,.034,0,-.150,0,dark,'Boca USB-C');
      add(.13,.024,.016,0,-.157,0,gold,'Lengüeta USB-C');
      add(.285,.33,.17,0,.21,0,jacket,'Mango USB-C');cableBoot(.19,.42);
      break;
    }
    case 'video':
    case 'displayPort':
      videoTip('displayPort');break;
    case 'videoIGPU':
    case 'hdmi':
      videoTip('hdmi');break;
    default:
      rectangular(.22,.23,.30,2,2);
  }
  return g;
}

// El cable acaba detrás de la funda rígida, jamás en la punta insertada.
// El mismo método se usa para alimentación interna y USB/vídeo externos.
export function getCableExit(THREE,plug,targetParent=null){
  plug.updateWorldMatrix(true,false);
  const p=new THREE.Vector3(...plug.userData.cableExitLocal);
  plug.localToWorld(p);
  return targetParent?targetParent.worldToLocal(p):p;
}
export function getPlugExitDistance(kind){
  const model={atx24:.77,eps:.73,gpu:.74,frontUsb3:.71,
    frontUsbC:.67,frontPanel:.64,fan:.66,sataData:.66,sataPower:.66,
    usbA:1.10,usbC:1.08,hdmi:1.12,displayPort:1.12};
  if(!(kind in model))throw new RangeError('Conector desconocido');
  return model[kind];
}

// Toma de placa para cada conector: cavidad profunda, orientación con
// nervios guía, pines dorados, frente a ras de la altura de inserción.
export const INTERNAL_HEADER_SPECS=Object.freeze({
  atx24:{w:.36,d:1.04,rows:2,cols:12,depth:.40},
  eps:{w:.42,d:.49,rows:2,cols:4,depth:.34},
  gpu:{w:.42,d:.51,rows:2,cols:4,depth:.34},
  frontUsb3:{w:.53,d:.44,rows:2,cols:10,depth:.27,omit:19},
  frontUsbC:{w:.38,d:.32,rows:0,cols:0,depth:.28},
  frontPanel:{w:.20,d:.25,rows:1,cols:2,depth:.17},
  fan:{w:.22,d:.42,rows:1,cols:4,depth:.26},
  sataData:{w:.31,d:.19,rows:1,cols:7,depth:.21},
  sataPower:{w:.52,d:.19,rows:1,cols:15,depth:.21}
});
export function createInternalHeader3d(THREE,kind){
  const spec=INTERNAL_HEADER_SPECS[kind];
  if(!spec)throw new RangeError('Header interno desconocido: '+kind);
  const group=new THREE.Group();group.name='Header '+kind;
  group.userData.headerType=kind;
  const shell=new THREE.MeshStandardMaterial({color:0x151b22,metalness:.09,roughness:.68});
  const border=new THREE.MeshStandardMaterial({color:0x3c4751,metalness:.21,roughness:.51});
  const cavity=new THREE.MeshStandardMaterial({color:0x05090e,roughness:.95});
  const metal=new THREE.MeshStandardMaterial({color:0xbda46c,metalness:.79,roughness:.26});
  const box=(w,h,d,x,y,z,mat,name)=>{
    const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);
    mesh.position.set(x,y,z);mesh.name=name;group.add(mesh);
  };
  // El cero está en la boca real; el cuerpo cae hacia el PCB (-Y).
  box(spec.w,spec.depth,spec.d,0,-spec.depth/2,0,shell,'Alojamiento de placa');
  box(spec.w*.88,.024,spec.d*.86,0,-.006,0,border,'Contorno de inserción');
  box(spec.w*.78,.025,spec.d*.75,0,.009,0,cavity,'Hueco de contacto');
  if(spec.rows){
    for(let i=0;i<spec.rows;i++)for(let j=0;j<spec.cols;j++){
      if(spec.omit===i*spec.cols+j)continue;
      const x=(i-(spec.rows-1)/2)*spec.w*.42/Math.max(1,spec.rows-1),
        z=(j-(spec.cols-1)/2)*spec.d*.72/Math.max(1,spec.cols-1);
      box(.020,.074,.018,x,.038,z,metal,'Pin '+(1+i*spec.cols+j));
    }
  }else{
    box(spec.w*.54,.035,spec.d*.31,0,.015,0,metal,'Lengüeta Type-E');
    box(spec.w*.18,.055,.024,-spec.w*.25,.029,0,border,'Guía polarizada Type-E');
  }
  if(['atx24','eps','gpu','frontUsb3'].includes(kind))
    box(.06,.10,spec.d*.33,spec.w/2+.026,-.024,0,border,'Retención de clavija');
  if(['sataData','sataPower'].includes(kind))
    box(.031,.048,spec.d*.50,-spec.w*.37,.012,0,border,'Llave L SATA');
  if(kind==='frontPanel')
    box(.02,.024,.05,spec.w*.55,-.02,-spec.d*.29,border,'Marca POWER SW');
  return group;
}
