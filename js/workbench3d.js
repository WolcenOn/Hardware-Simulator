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
  rounded(root,[15.4,.26,15.1],[.35,-.49,.20],desk);
  rounded(root,[15.2,.055,14.9],[.35,-.34,.20],rubber);
  for(const x of [-6.95,7.65])for(const z of [-7.03,7.43]){
    rounded(root,[.22,2.0,.22],[x,-1.60,z],edge);
  }
  // Monitor de 24" aprox.: 530 x 300 mm => 10.6 x 6 unidades.
  // Elevado sobre las piezas; el plano visible mira hacia el usuario (+Z).
  const monitorX=-.55, monitorZ=-5.78;
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
  const kbX=-1.10,kbZ=5.34;
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
  const mouseX=4.65, mouseZ=5.31;
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
    // LED de alimentación y scanline sutiles.
    ctx.fillStyle=powered?'#66f4bd':'#81909e';
    ctx.fillRect(56,height-50,17,11);
    ctx.fillStyle='rgba(18,70,61,.12)';
    for(let y=110;y<height-45;y+=9)ctx.fillRect(32,y,width-64,1);
    tex.needsUpdate=true;
  }
  updateScreen('Sistema apagado.\nPulsa Encender PC para iniciar POST.',false,false);
  return {root,updateScreen,screen,keyboard,mouseGroup,texture:tex};
}
