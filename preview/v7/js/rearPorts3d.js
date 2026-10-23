// Tomas hembra: MISMO perfil que clavija, pero con interior empotrado.
// Origen: plano de conexión; eje +X penetra en la motherboard/bracket.
import {portBezelGeometry,REAR_PORT_SPECS} from './portProfiles.js?v=8-4-6-port-geometry';
export function createRearReceptacle3d(THREE,kind){
  if(!REAR_PORT_SPECS[kind])throw new RangeError('Toma desconocida: '+kind);
  const g=new THREE.Group();g.name='Toma trasera '+kind;
  g.userData.receptacleType=kind;
  const metal=new THREE.MeshStandardMaterial({color:0xadb9bf,metalness:.86,roughness:.25});
  const cavity=new THREE.MeshStandardMaterial({color:0x090f17,metalness:.04,roughness:.96});
  const insulator=new THREE.MeshStandardMaterial({
    color:kind==='usbA'?0x1c6caa:0x202931,metalness:.12,roughness:.66});
  const gold=new THREE.MeshStandardMaterial({color:0xcfaa63,metalness:.75,roughness:.3});
  const add=(w,h,d,x,y,z,mat,name)=>{
    const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);
    m.position.set(x,y,z);m.name=name;g.add(m);return m;
  };
  // Los contornos de estas bocas NO son simples rectángulos pintados.
  // El perfil HDMI es trapezoidal y el DP tiene una esquina biselada.
  const rim=new THREE.Mesh(portBezelGeometry(THREE,kind,.20),metal);
  rim.rotation.y=Math.PI/2;
  rim.position.x=-.024;rim.name='Marco hueco '+kind;
  g.add(rim);
  const spec=REAR_PORT_SPECS[kind];
  add(.018,spec.height*.72,spec.width*.73,.177,0,0,cavity,'Fondo oscuro del puerto');
  if(kind==='usbA'){
    add(.15,.015,.175,.060,-.017,0,insulator,'Lengüeta USB-A interna');
    for(let i=0;i<4;i++)
      add(.077,.010,.018,.055,-.003,-.057+i*.038,gold,'Contacto USB-A '+i);
  }else{
    add(.12,.015,spec.width*.69,.073,0,0,insulator,
      kind==='hdmi'?'Inserto HDMI':'Inserto DisplayPort');
    for(let i=0;i<10;i++)
      for(let row=0;row<2;row++)
        add(.044,.008,.013,.045,row?.024:-.024,
          (-.083+i*.018),gold,'Contacto señal '+(i+row*10));
    if(kind==='displayPort')
      add(.10,.025,.026,.035,spec.height*.31,-spec.width*.29,cavity,
        'Esquina codificada DisplayPort');
  }
  return g;
}
