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
    case 'usbA':
      add(.245,.20,.103,0,.055,0,steel,'Carcasa metálica USB-A');
      add(.178,.034,.060,0,-.057,0,dark,'Boca USB-A');
      add(.146,.014,.047,0,-.068,-.003,blue,'Lengüeta USB-A');
      for(let j=0;j<4;j++)
        add(.019,.009,.025,-.051+j*.034,-.075,-.008,gold,'Contacto USB '+j);
      add(.30,.27,.18,0,.275,0,jacket,'Sobremolde USB-A');
      strain(.38,.20);
      break;
    case 'usbC':
      add(.24,.18,.070,0,.025,0,steel,'Cápsula simétrica USB-C');
      add(.170,.027,.043,0,-.061,0,dark,'Boca USB-C');
      add(.110,.009,.012,0,-.076,0,gold,'Lengüeta USB-C');
      add(.28,.29,.155,0,.245,0,jacket,'Sobremolde USB-C');
      strain(.35,.18);
      break;
    case 'video':
    case 'videoIGPU':
    case 'hdmi':
      add(.37,.20,.23,0,.026,0,steel,'Blindaje HDMI / DisplayPort');
      add(.30,.015,.155,0,-.083,0,dark,'Boca de vídeo');
      add(.24,.015,.055,0,-.094,0,gold,'Contacto de vídeo');
      add(.42,.33,.27,0,.28,0,jacket,'Mango HDMI / DP');
      strain(.40,.23);
      break;
    default:
      rectangular(.22,.23,.30,2,2);
  }
  return g;
}
