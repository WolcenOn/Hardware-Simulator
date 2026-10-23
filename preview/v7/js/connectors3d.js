import {portBezelGeometry} from './portProfiles.js?v=8-4-6-port-geometry';
// Conectores procedurales (1 unidad = 50 mm). Las dimensiones son aproximadas.
// Origen = punta insertada; eje +Y = sentido del cable / cuerpo de la clavija.
// Se orientan hacia el tramo de cable sin depender de ninguna cámara.
export function createConnector3d(THREE,kind){
  const g=new THREE.Group();
  g.name='Clavija '+kind;
  g.userData.connectorType=kind;
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
    const tip=new THREE.Mesh(new THREE.CylinderGeometry(width*.25,width*.33,.10,12),grip);
    tip.position.y=bodyHeight+.24;g.add(tip);
  };
  function socketGrid(rows,cols,width,depth,omit=-1){
    const px=width/rows,pz=depth/cols;
    for(let row=0;row<rows;row++)for(let col=0;col<cols;col++){
      if(row*cols+col===omit)continue;
      const x=(row-(rows-1)/2)*px,z=(col-(cols-1)/2)*pz;
      add(Math.min(px*.57,.064),.011,Math.min(pz*.64,.066),
        x,-.009,z,dark,'Hueco de pin '+(row*cols+col));
    }
  }
  const rectangular=(w,d,h,rows,cols,omit=-1)=>{
    add(w,h,d,0,h/2-.015,0,jacket,'Cuerpo aislante');
    add(w*.91,.052,d*.89,0,.010,0,grip,'Frente enchufable');
    socketGrid(rows,cols,w*.77,d*.79,omit);
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
    sleeve.position.y=base+.53;g.add(sleeve);
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
      rectangular(.34,1.03,.43,2,12, -1);
      add(.09,.09,.29,.205,.30,0,grip,'Pestaña de retención ATX24');
      break;
    case 'eps':
      rectangular(.36,.46,.40,2,4);
      add(.08,.09,.22,.225,.31,0,grip,'Clip EPS 4+4');
      break;
    case 'gpu':
      rectangular(.35,.48,.40,2,4);
      add(.075,.12,.19,-.21,.31,.13,grip,'Seguro PCIe 6+2');
      break;
    case 'frontUsb3':
      rectangular(.50,.43,.37,2,10,19);
      add(.06,.07,.11,.24,.15,0,blue,'Guía del conector USB 19 pin');
      break;
    case 'frontUsbC':
      add(.34,.29,.30,0,.14,0,grip,'Type-E de placa');
      add(.23,.036,.135,0,-.011,0,dark,'Ranura hembra USB-C Type-E');
      add(.16,.024,.046,0,-.020,0,steel,'Llave de inserción');
      strain(.29,.24);
      break;
    case 'frontPanel':
      rectangular(.19,.16,.30,2,1);
      break;
    case 'fan':
    case 'caseFan0':case 'caseFan1':case 'caseFan2':
      rectangular(.20,.39,.32,1,4);
      add(.045,.13,.27,.12,.16,0,grip,'Guía PWM');
      break;
    case 'sataData':
    case 'sataPower':{
      const wide=kind==='sataPower';
      const w=wide?.53:.30;
      add(w,.29,.18,0,.15,0,jacket,'Mango SATA');
      add(w*.88,.075,.135,0,-.007,0,steel,'Blindaje SATA');
      // El tabique lateral crea la característica muesca en L.
      add(w*.68,.018,.060,-w*.10,-.051,.022,dark,'Ranura SATA');
      add(.035,.040,.095,-w*.40,-.044,-.01,grip,'Llave en L');
      strain(.29,w*.42);
      break;
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
