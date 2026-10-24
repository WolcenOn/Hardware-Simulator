import { getRearUsbAnchor } from './partsRealScale.js?v=8-4-7-cable-exits';
import {createConnector3d,getCableExit} from './connectors3d.js?v=8-4-7-cable-exits';
import {alignRearPlug} from './portProfiles.js?v=8-4-7-cable-exits';
// Banco de trabajo y periféricos hechos con Three.js (sin assets externos).
// La pantalla refleja literalmente la misma cadena de texto del monitor HTML.
// Medidas: 1 unidad Three.js = 50 mm. Mesa 1350 x 850 mm aprox.
export const WORKBENCH_LAYOUT = Object.freeze({
  desk:{centerX:-4.30,centerZ:.35,width:27.0,depth:17.0},
  monitor:{x:-10.85,z:-3.12,screenY:5.17,frameWidth:11.02},
  keyboard:{x:-10.45,z:5.42},
  mouse:{x:-4.62,z:5.37}
});
export function createWorkbench(THREE,scene,materials) {
  const root=new THREE.Group();root.name='Banco de trabajo';scene.add(root);
  const desk=new THREE.MeshStandardMaterial({color:0x303c47,metalness:.24,roughness:.68});
  const edge=new THREE.MeshStandardMaterial({color:0x70838e,metalness:.62,roughness:.36});
  const rubber=new THREE.MeshStandardMaterial({color:0x111923,metalness:.05,roughness:.89});
  const keys=new THREE.MeshStandardMaterial({color:0x313f4b,metalness:.10,roughness:.66});
  const light=new THREE.MeshStandardMaterial({color:0x73dac6,emissive:0x164c46,emissiveIntensity:.5});
  function rounded(parent,size,where,material,r=.06) {
    // RoundedBoxGeometry se inyecta para mantener este módulo independiente.
    const mesh=new THREE.Mesh(new THREE.BoxGeometry(...size),material);
    mesh.position.set(...where);
    mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);
    return mesh;
  }
  // Dos puestos diferenciados: pantalla y periféricos a la izquierda,
  // torre ATX a la derecha. Mesa de 1350 x 850 mm, sin solapamiento visual.
  const {desk:table}=WORKBENCH_LAYOUT;
  rounded(root,[table.width,.26,table.depth],
    [table.centerX,-.49,table.centerZ],desk);
  rounded(root,[table.width-.2,.055,table.depth-.2],
    [table.centerX,-.34,table.centerZ],rubber);
  const xMin=table.centerX-table.width/2+.45;
  const xMax=table.centerX+table.width/2-.45;
  const zMin=table.centerZ-table.depth/2+.45;
  const zMax=table.centerZ+table.depth/2-.45;
  for(const x of [xMin,xMax])for(const z of [zMin,zMax]){
    rounded(root,[.22,2.0,.22],[x,-1.60,z],edge);
  }
  // Alfombrillas antideslizantes diferencian las dos zonas del taller.
  rounded(root,[12.2,.022,7.45],[-10.2,-.299,1.80],materials.black2);
  rounded(root,[10.75,.022,11.4],[1.1,-.299,.55],materials.black2);
  // Monitor de 24" aprox.: 530 x 300 mm => 10.6 x 6 unidades.
  // Elevado sobre las piezas; el plano visible mira hacia el usuario (+Z).
  const {monitor}=WORKBENCH_LAYOUT;
  const monitorX=monitor.x, monitorZ=monitor.z;
  rounded(root,[11.35,.035,1.25],[monitorX,-.292,monitorZ+.1],materials.black2);
  const screen=new THREE.Group();screen.name='Monitor 3D';
  screen.position.set(monitorX,0,monitorZ);root.add(screen);
  rounded(screen,[11.02,6.34,.27],[0,5.15,0],materials.black);
  rounded(screen,[10.76,6.12,.055],[0,5.17,.153],rubber);
  // Pedestal alineado bajo el panel: base junto a la superficie del taller.
  rounded(screen,[.26,2.48,.22],[0,.91,-.04],edge);
  rounded(screen,[2.5,.12,1.15],[0,-.21,-.04],materials.black2);
  const standby=new THREE.Mesh(new THREE.SphereGeometry(.044,10,8),light);
  standby.position.set(5.23,2.09,.178);screen.add(standby);

  const canvas=document.createElement('canvas');
  canvas.width=1536;canvas.height=864;
  const ctx=canvas.getContext('2d',{alpha:false});
  const tex=new THREE.CanvasTexture(canvas);
  tex.colorSpace=THREE.SRGBColorSpace;
  tex.minFilter=THREE.LinearFilter;
  tex.magFilter=THREE.LinearFilter;
  const screenMaterial=new THREE.MeshBasicMaterial({map:tex,toneMapped:false});
  const display=new THREE.Mesh(new THREE.PlaneGeometry(10.52,5.92),screenMaterial);
  display.position.set(0,5.17,.189);
  screen.add(display);

  // Interruptor físico del panel frontal junto a la bandeja del ordenador.
  const switchBody=rounded(root,[.68,.13,.68],[5.16,-.25,3.27],materials.black2);
  const switchRing=new THREE.Mesh(new THREE.TorusGeometry(.20,.032,8,30),light);
  switchRing.rotation.x=-Math.PI/2;
  switchRing.position.set(5.16,-.16,3.27);
  root.add(switchRing);
  const switchTop=new THREE.Mesh(new THREE.CylinderGeometry(.13,.13,.07,24),edge);
  switchTop.position.set(5.16,-.18,3.27);
  switchTop.name='Botón POWER (panel frontal)';
  root.add(switchTop);

  // Teclado completo, anchura física 440 mm y fondo 135 mm:
  // con la escala 50 mm/u son 8.8 x 2.7 unidades.
  const keyboard=new THREE.Group();keyboard.name='Teclado 3D';
  const kbX=WORKBENCH_LAYOUT.keyboard.x,kbZ=WORKBENCH_LAYOUT.keyboard.z;
  keyboard.position.set(kbX,-.20,kbZ);root.add(keyboard);
  rounded(keyboard,[9.0,.15,2.68],[0,0,0],materials.black);
  rounded(keyboard,[8.87,.036,2.52],[0,.095,0],rubber);
  const keyGeo=new THREE.BoxGeometry(.38,.07,.33);
  const positions=[];
  for(let row=0;row<5;row++)for(let col=0;col<18;col++){
    if(row===4&&col>=5&&col<=10)continue;
    if(col===12&&row!==0)continue;
    positions.push([-4.12+col*.49,-.92+row*.48]);
  }
  const keyMesh=new THREE.InstancedMesh(keyGeo,keys,positions.length+1);
  const dummy=new THREE.Object3D();
  positions.forEach(([x,z],i)=>{
    dummy.position.set(x,.137,z);dummy.updateMatrix();
    keyMesh.setMatrixAt(i,dummy.matrix);
  });
  dummy.position.set(-.30,.137,1.0);dummy.scale.set(7.4,1,1);
  dummy.updateMatrix();
  keyMesh.setMatrixAt(positions.length,dummy.matrix);
  keyMesh.instanceMatrix.needsUpdate=true;keyMesh.castShadow=true;
  keyboard.add(keyMesh);
  for(const x of [-4.14,4.15]){
    const foot=rounded(keyboard,[.30,.06,.16],[x,-.10,-.88],edge);
    foot.castShadow=false;
  }

  // Ratón tipo oficina: 120 x 65 mm (2.4 x 1.3 u) con alfombrilla.
  const mouseGroup=new THREE.Group();mouseGroup.name='Ratón 3D';
  const mouseX=WORKBENCH_LAYOUT.mouse.x, mouseZ=WORKBENCH_LAYOUT.mouse.z;
  mouseGroup.position.set(mouseX,-.21,mouseZ);root.add(mouseGroup);
  rounded(root,[1.86,.027,3.0],[mouseX,-.288,mouseZ],materials.black2);
  const mouse=new THREE.Mesh(new THREE.SphereGeometry(1,32,20),materials.black);
  mouse.scale.set(.65,.22,1.20);mouse.position.y=.16;mouseGroup.add(mouse);
  rounded(mouseGroup,[.033,.016,.45],[0,.371,-.42],edge,.01);
  const wheel=new THREE.Mesh(new THREE.CylinderGeometry(.085,.085,.135,20),edge);
  wheel.rotation.z=Math.PI/2;wheel.position.set(0,.389,-.51);mouseGroup.add(wheel);
  const wireCurve=new THREE.CatmullRomCurve3([
    new THREE.Vector3(mouseX,-.01,mouseZ-1.05),
    new THREE.Vector3(mouseX+.10,-.11,mouseZ-1.84),
    new THREE.Vector3(mouseX+.42,-.20,mouseZ-2.35)
  ]);
  const wire=new THREE.Mesh(new THREE.TubeGeometry(wireCurve,24,.018,6,false),rubber);
  root.add(wire);
  // Los puertos del ratón y del teclado son puntos de la propia placa base,
  // no coordenadas absolutas congeladas antes de ajustar sus separadores.
  const usbGroup=new THREE.Group();usbGroup.name='Conexiones USB externas';root.add(usbGroup);
  const rearCables={};
  const USB_PORT_INDEX={keyboard:2,mouse:3};
  const cablePaths={
    keyboard:[[kbX,-.10,kbZ-1.28],[kbX-.55,-.19,kbZ-1.90],
      [-16.0,-.17,.35],[-14.75,-.12,-5.55],[-6.50,-.10,-5.65]],
    mouse:[[mouseX,-.05,mouseZ-1.06],[mouseX+.38,-.16,3.85],
      [-5.70,-.17,2.75],[-6.25,-.15,-4.95]]
  };
  const cableColors={keyboard:0x455768,mouse:0x42505d};
  let rearLayoutKey='';
  function clearRearCables(){
    for(const entry of Object.values(rearCables)){
      usbGroup.remove(entry.group);
      const disposed=new Set();
      entry.group.traverse(node=>{
        node.geometry?.dispose();
        const all=Array.isArray(node.material)?node.material:[node.material];
        for(const mat of all)if(mat&&!disposed.has(mat)){mat.dispose();disposed.add(mat);}
      });
    }
    for(const id of Object.keys(rearCables))delete rearCables[id];
  }
  function rebuildRearCables(cfg,assemblyRoot){
    const key=[cfg.x,cfg.z,cfg.w,cfg.d].join(':');
    if(rearLayoutKey===key)return;
    assemblyRoot.updateMatrixWorld(true);
    clearRearCables();
    for(const id of ['keyboard','mouse']){
      const socketLocal=getRearUsbAnchor(cfg,USB_PORT_INDEX[id]);
      const socket=assemblyRoot.localToWorld(new THREE.Vector3(...socketLocal));
      const toArray=v=>v.toArray();
      const g=new THREE.Group();g.name='USB-A '+id;usbGroup.add(g);
      const plug=createConnector3d(THREE,'usbA');
      plug.name='Clavija USB-A '+id;
      plug.position.copy(socket);
      // Puerto trasero orientado hacia -X: la clavija se introduce hacia +X,
      // mientras que el cable sale perpendicularmente hacia el exterior.
      alignRearPlug(THREE,plug,assemblyRoot);
      g.add(plug);
      g.updateMatrixWorld(true);
      const tail=getCableExit(THREE,plug);
      const axis=new THREE.Vector3(0,1,0).applyQuaternion(
        plug.getWorldQuaternion(new THREE.Quaternion()));
      // El cable flexible parte DESPUÉS del sobremolde, no del contacto USB.
      const path=[...cablePaths[id],
        toArray(tail.clone().addScaledVector(axis,.82).add(new THREE.Vector3(0,-.35,0))),
        toArray(tail.clone().addScaledVector(axis,.25)),
        toArray(tail)];
      const material=new THREE.MeshStandardMaterial({color:cableColors[id],roughness:.86});
      const curve=new THREE.CatmullRomCurve3(path.map(v=>new THREE.Vector3(...v)),
        false,'centripetal',.4);
      const cable=new THREE.Mesh(new THREE.TubeGeometry(curve,64,.022,8,false),material);
      cable.name='Cable flexible USB '+id;g.add(cable);
      rearCables[id]={group:g,plug,flexTail:tail.clone(),
        portIndex:USB_PORT_INDEX[id],socketLocal};
    }
    rearLayoutKey=key;
  }
  wire.visible=false; // El tramo anterior era sólo decorativo.
  function updateConnections(s,cfg,assemblyRoot){
    if(cfg&&assemblyRoot)rebuildRearCables(cfg,assemblyRoot);
    for(const id of ['keyboard','mouse']){
      const row=rearCables[id];
      if(row)row.group.visible=!!s?.[id+'Connected']&&!!s?.installed?.motherboard;
    }
  }
  function getRearUsbAlignment(assemblyRoot,receptacles=[]){
    if(!assemblyRoot)return [];
    assemblyRoot.updateMatrixWorld(true);
    return ['keyboard','mouse'].map(id=>{
      const row=rearCables[id];if(!row)return null;
      const socket=assemblyRoot.localToWorld(new THREE.Vector3(...row.socketLocal));
      const real=receptacles[row.portIndex];
      const portWorld=real?.getWorldPosition(new THREE.Vector3())||socket;
      const plug=row.plug.getWorldPosition(new THREE.Vector3());
      const socketAxis=real?new THREE.Vector3(0,0,1).applyQuaternion(
        real.getWorldQuaternion(new THREE.Quaternion())):new THREE.Vector3(0,0,1);
      const maleAxis=new THREE.Vector3(1,0,0).applyQuaternion(
        row.plug.getWorldQuaternion(new THREE.Quaternion()));
      const angleDegrees=Math.acos(Math.min(1,Math.abs(socketAxis.dot(maleAxis))))*180/Math.PI;
      return {id,portIndex:row.portIndex,portWorld:portWorld.toArray(),
        plugWorld:plug.toArray(),gapMm:portWorld.distanceTo(plug)*50,
        angleDegrees,
        flexGapMm:getCableExit(THREE,row.plug).distanceTo(row.flexTail)*50,
        visible:row.group.visible,connectorType:row.plug.userData.connectorType};
    }).filter(Boolean);
  }

  let currentOsVisual=null;
  let lastSignature='';
  function wrapLine(text,max=48){
    if(text.length<=max)return [text];
    const out=[];let current=text;
    while(current.length>max){
      let cut=current.lastIndexOf(' ',max);
      if(cut<12)cut=max;
      out.push(current.slice(0,cut));
      current=current.slice(cut).trimStart();
    }
    out.push(current);
    return out;
  }
  function updateScreen(consoleText, powered=false, bios=false, signal=false, osVisual=null){
    currentOsVisual=osVisual?.kind||null;
    const signature=[consoleText, powered, bios, signal,osVisual?.kind,
      osVisual?.progress,osVisual?.code].join('\u0001');
    if(signature===lastSignature)return;
    lastSignature=signature;
    const width=canvas.width,height=canvas.height;
    ctx.fillStyle=signal?'#05120e':'#03060a';ctx.fillRect(0,0,width,height);
    standby.material.emissiveIntensity=signal?1.1:.05;
    if(!signal){tex.needsUpdate=true;return;}
    if(!bios&&window.PC_OS?.paint(ctx,width,height,osVisual)){
      tex.needsUpdate=true;return;
    }
    const grad=ctx.createLinearGradient(0,0,0,height);
    grad.addColorStop(0,powered?'rgba(41,134,107,.17)':'rgba(40,73,96,.08)');
    grad.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=grad;ctx.fillRect(0,0,width,height);
    ctx.strokeStyle='#28463e';ctx.lineWidth=3;
    ctx.strokeRect(20,20,width-40,height-40);
    ctx.font='bold 38px monospace';
    ctx.fillStyle=powered?'#92eed3':'#89a4b5';
    ctx.fillText(bios?'UEFI / BIOS':'PC LAB - CONSOLA',56,94);
    ctx.fillStyle=powered?'#ccffe6':'#9db4c3';
    ctx.font='36px monospace';
    const lines=String(consoleText||'').split(/\r?\n/).flatMap(t=>wrapLine(t,58));
    const maxLines=15;
    lines.slice(0,maxLines).forEach((line,i)=>{
      const isError=/ERROR|FAILED|HALTED|FALLO|fallido|sin encajar/i.test(line);
      ctx.fillStyle=isError?'#ff9b9b':powered?'#a9f3cb':'#a5bdc9';
      ctx.fillText(line,56,164+i*40,1420);
    });
    if(bios){
      // Controles de BIOS físicamente dentro de la pantalla.
      ctx.fillStyle='#173b33';
      ctx.fillRect(930,568,542,210);
      ctx.fillStyle='#b0ffe5';
      ctx.font='bold 29px monospace';
      ctx.fillText('PRIORIDAD DE ARRANQUE',954,606);
      const boot=String(consoleText||'').split('\n')
        .filter(x=>/^[123]\.\s/.test(x)).slice(0,3);
      boot.forEach((line,i)=>{
        const y=622+i*48;
        ctx.fillStyle=i===0?'#275b47':'#20473a';
        ctx.fillRect(942,y,510,43);
        ctx.fillStyle='#efffee';ctx.font='bold 27px monospace';
        ctx.fillText(line+'  [SUBIR]',957,y+31,480);
      });
    }
    // LED de alimentación y scanline sutiles.
    ctx.fillStyle=powered?'#66f4bd':'#81909e';
    ctx.fillRect(56,height-50,17,11);
    ctx.fillStyle='rgba(18,70,61,.12)';
    for(let y=110;y<height-45;y+=9)ctx.fillRect(32,y,width-64,1);
    tex.needsUpdate=true;
  }
  function hitBootOption(uv){
    if(!uv)return -1;
    const x=uv.x*canvas.width,y=(1-uv.y)*canvas.height;
    if(x<942||x>1452)return -1;
    for(let i=0;i<3;i++){
      const top=622+i*48;
      if(y>=top&&y<=top+43)return i;
    }
    return -1;
  }
  updateScreen('Sistema apagado.',false,false,false);
  updateConnections({});
  return {root,updateScreen,updateConnections,getRearUsbAlignment,hitBootOption,display,
    getOSMonitorKind:()=>currentOsVisual,
    screen,keyboard,mouseGroup,texture:tex,layout:WORKBENCH_LAYOUT};
}
