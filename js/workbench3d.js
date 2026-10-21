// Banco de trabajo y periféricos hechos con Three.js (sin assets externos).
// La pantalla refleja literalmente la misma cadena de texto del monitor HTML.
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
  // Mesa amplia: las piezas siguen estando en el banco original, y
  // los periféricos ocupan sus zonas anterior y posterior.
  rounded(root,[13.2,.26,13.7],[.35,-.49,.20],desk);
  rounded(root,[13.0,.055,13.52],[.35,-.34,.20],rubber);
  for(const x of [-5.48,6.10])for(const z of [-5.56,5.87]){
    rounded(root,[.22,2.0,.22],[x,-1.60,z],edge);
  }
  // Alfombrilla y soporte de monitor, detrás de la zona de montaje.
  rounded(root,[5.55,.025,1.35],[-1.36,-.30,-5.02],materials.black2);
  const screen=new THREE.Group();screen.name='Monitor 3D';root.add(screen);
  screen.position.set(-1.35,0,-5.20);
  rounded(screen,[4.32,2.55,.17],[0,1.91,0],materials.black);
  rounded(screen,[4.02,2.27,.04],[0,1.94,.102],rubber);
  rounded(screen,[.19,.85,.18],[0,.73,-.04],edge);
  rounded(screen,[1.35,.08,.84],[0,.32,-.02],materials.black2);
  const standby=new THREE.Mesh(new THREE.SphereGeometry(.038,10,8),light);
  standby.position.set(1.89,.735,.14);screen.add(standby);

  const canvas=document.createElement('canvas');
  canvas.width=1024;canvas.height=576;
  const ctx=canvas.getContext('2d',{alpha:false});
  const tex=new THREE.CanvasTexture(canvas);
  tex.colorSpace=THREE.SRGBColorSpace;
  tex.minFilter=THREE.LinearFilter;
  tex.magFilter=THREE.LinearFilter;
  const screenMaterial=new THREE.MeshBasicMaterial({map:tex,toneMapped:false});
  const display=new THREE.Mesh(new THREE.PlaneGeometry(3.91,2.18),screenMaterial);
  display.position.set(0,1.94,.131);
  screen.add(display);

  // Teclado: filas reales y grupos separados, teclas instanciadas para
  // evitar cientos de llamadas de dibujo.
  const keyboard=new THREE.Group();keyboard.name='Teclado 3D';
  keyboard.position.set(-1.6,-.20,4.77);root.add(keyboard);
  rounded(keyboard,[3.58,.15,1.19],[0,0,0],materials.black);
  rounded(keyboard,[3.47,.035,1.08],[0,.095,0],rubber);
  const keyGeo=new THREE.BoxGeometry(.15,.065,.13);
  const positions=[];
  for(let row=0;row<5;row++)for(let col=0;col<17;col++){
    if(row===4 && col>=5 && col<=10)continue;
    if(col===12 && row!==0)continue; // respiración entre grupo principal y navegación
    const z=-.42+row*.21;
    positions.push([-1.58+col*.197,z]);
  }
  const keyMesh=new THREE.InstancedMesh(keyGeo,keys,positions.length+1);
  const dummy=new THREE.Object3D();
  positions.forEach(([x,z],i)=>{
    dummy.position.set(x,.133,z);dummy.updateMatrix();
    keyMesh.setMatrixAt(i,dummy.matrix);
  });
  // Espaciador largo, sin tecla repetida por debajo.
  dummy.position.set(-.07,.133,.42);dummy.scale.set(6.7,1,1);
  dummy.updateMatrix();
  keyMesh.setMatrixAt(positions.length,dummy.matrix);
  keyMesh.instanceMatrix.needsUpdate=true;keyMesh.castShadow=true;
  keyboard.add(keyMesh);
  for(const x of [-1.45,1.50]){
    const foot=rounded(keyboard,[.24,.065,.11],[x,-.09,-.35],edge);
    foot.castShadow=false;
  }

  // Ratón ergonómico con rueda central, botones y alfombrilla.
  const mouseGroup=new THREE.Group();mouseGroup.name='Ratón 3D';
  mouseGroup.position.set(2.06,-.21,4.75);root.add(mouseGroup);
  rounded(root,[1.40,.025,1.58],[2.06,-.285,4.75],materials.black2);
  const mouse=new THREE.Mesh(new THREE.SphereGeometry(1,24,16),materials.black);
  mouse.scale.set(.31,.16,.48);mouse.position.y=.10;mouseGroup.add(mouse);
  rounded(mouseGroup,[.028,.014,.32],[0,.257,-.17],edge,.01);
  const wheel=new THREE.Mesh(new THREE.CylinderGeometry(.060,.060,.095,16),edge);
  wheel.rotation.z=Math.PI/2;wheel.position.set(0,.276,-.22);mouseGroup.add(wheel);
  // Cable periférico hacia monitor/banco (no sustituye conexiones de la PC).
  const wireCurve=new THREE.CatmullRomCurve3([
    new THREE.Vector3(2.06,-.04,4.40),
    new THREE.Vector3(2.20,-.13,3.68),
    new THREE.Vector3(2.55,-.20,3.33)
  ]);
  const wire=new THREE.Mesh(new THREE.TubeGeometry(wireCurve,20,.015,6,false),rubber);
  root.add(wire);

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
  function updateScreen(consoleText, powered=false, bios=false){
    const signature=[consoleText, powered, bios].join('\u0001');
    if(signature===lastSignature)return;
    lastSignature=signature;
    const width=canvas.width,height=canvas.height;
    ctx.fillStyle=powered?'#05120e':'#080e14';ctx.fillRect(0,0,width,height);
    const grad=ctx.createLinearGradient(0,0,0,height);
    grad.addColorStop(0,powered?'rgba(41,134,107,.17)':'rgba(40,73,96,.08)');
    grad.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=grad;ctx.fillRect(0,0,width,height);
    ctx.strokeStyle='#28463e';ctx.lineWidth=3;
    ctx.strokeRect(20,20,width-40,height-40);
    ctx.font='bold 26px monospace';
    ctx.fillStyle=powered?'#92eed3':'#89a4b5';
    ctx.fillText(bios?'UEFI / BIOS':'PC LAB - CONSOLA',40,62);
    ctx.fillStyle=powered?'#ccffe6':'#9db4c3';
    ctx.font='25px monospace';
    const lines=String(consoleText||'').split(/\r?\n/).flatMap(t=>wrapLine(t));
    const maxLines=14;
    lines.slice(0,maxLines).forEach((line,i)=>{
      const isError=/ERROR|FAILED|HALTED|FALLO|fallido|sin encajar/i.test(line);
      ctx.fillStyle=isError?'#ff9b9b':powered?'#a9f3cb':'#a5bdc9';
      ctx.fillText(line,40,106+i*30,950);
    });
    // LED de alimentación y scanline sutiles.
    ctx.fillStyle=powered?'#66f4bd':'#81909e';
    ctx.fillRect(40,height-34,13,8);
    ctx.fillStyle='rgba(18,70,61,.12)';
    for(let y=83;y<height-38;y+=8)ctx.fillRect(24,y,width-48,1);
    tex.needsUpdate=true;
  }
  updateScreen('Sistema apagado.\nPulsa Encender PC para iniciar POST.',false,false);
  return {root,updateScreen,screen,keyboard,mouseGroup,texture:tex};
}
