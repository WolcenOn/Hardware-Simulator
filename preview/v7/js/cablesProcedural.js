// Cableado simplificado para enseñanza: tubos procedurales conectados al estado real.
// No modifica compatibilidad, BIOS ni reglas de reparación.
export function createCableHarness(THREE,scene){
  const root=new THREE.Group();root.name='Cableado';scene.add(root);
  const palette={
    sataData:new THREE.MeshStandardMaterial({color:0x2b94e8,roughness:.76}),
    sataPower:new THREE.MeshStandardMaterial({color:0x303a46,roughness:.82}),
    eps:new THREE.MeshStandardMaterial({color:0x161d27,roughness:.79}),
    gpu:new THREE.MeshStandardMaterial({color:0x30363f,roughness:.72}),
    fan:new THREE.MeshStandardMaterial({color:0x647786,roughness:.75})
  };
  const wires={};
  let layoutKey='';
  function make(id,coords,radius){
    const points=coords.map(p=>new THREE.Vector3(...p));
    const curve=new THREE.CatmullRomCurve3(points,false,'centripetal',.35);
    const tube=new THREE.Mesh(
      new THREE.TubeGeometry(curve,Math.max(28,points.length*9),radius,8,false),
      palette[id]
    );
    tube.castShadow=false;
    tube.name='cable_'+id;
    root.add(tube);
    wires[id]=tube;
  }
  function clear(){
    for(const obj of Object.values(wires)){
      root.remove(obj);obj.geometry.dispose();
    }
    for(const key of Object.keys(wires))delete wires[key];
  }
  function rebuild(cfg,gpuChoice,storageChoice){
    clear();
    const isHdd=storageChoice==='hdd';
    const portX=isHdd?4.30:4.07;
    // Cables SATA sólo van a una unidad física lateral, nunca al NVMe.
    make('sataData',[
      [2.10,.45,-2.00],[1.75,.38,-2.15],
      [1.52,.31,-2.50],[1.58,.32,cfg.sataZ+.48],
      [cfg.sataX,.62,cfg.sataZ]
    ],.021);
    make('sataPower',[
      [3.82,.65,1.10],[4.78,.50,.42],[4.83,.36,-1.32],
      [portX,.39,-2.00]
    ],.034);
    // Alimentación EPS: recorrido por el perímetro, sin cruzar el socket.
    make('eps',[
      [2.35,.72,1.62],[1.80,.38,2.92],
      [1.65,.30,-3.42],[-1.75,.32,-3.43],
      [cfg.epsX,.78,cfg.epsZ]
    ],.037);
    const height=gpuChoice==='rtx4070'?133.94/50:134/50;
    const length=gpuChoice==='rtx4070'?267.01/50:245/50;
    make('gpu',[
      [2.39,.72,1.32],[2.17,1.73,1.45],
      [1.05,2.65,cfg.pcieZ+.73],
      [cfg.pcieX+length*.37,.46+height+.13,cfg.pcieZ+.12]
    ],.040);
    // CPU_FAN es un cable fino de señal, no un cable grueso de potencia.
    make('fan',[
      [cfg.cpuX+.93,.55,cfg.cpuZ+.88],
      [cfg.cpuX+.97,.92,cfg.cpuZ+.84],
      [cfg.cpuX+.88,1.98,cfg.cpuZ+.71],
      [cfg.cpuX+.47,2.06,cfg.cpuZ+.63]
    ],.015);
  }
  function update(state,cfg,needsSata){
    const key=[state.selected?.motherboard,state.selected?.gpu,state.selected?.storage].join(':');
    if(key!==layoutKey){
      rebuild(cfg,state.selected?.gpu,state.selected?.storage);
      layoutKey=key;
    }
    const installed=state.installed||{};
    const base=!!installed.case&&!!installed.motherboard&&!!installed.psu;
    const exploded=!!state.explode;
    wires.sataData.visible=!exploded&&base&&needsSata&&!!installed.storage&&!!state.sataData;
    wires.sataPower.visible=!exploded&&base&&needsSata&&!!installed.storage&&!!state.sataPower;
    wires.eps.visible=!exploded&&base&&!!state.eps;
    wires.gpu.visible=!exploded&&base&&!!installed.gpu&&state.selected?.gpu!=='none'&&!!state.gpuPower;
    wires.fan.visible=!exploded&&!!installed.motherboard&&!!installed.cooler&&!!state.cpuFan;
  }
  return {update,root};
}
