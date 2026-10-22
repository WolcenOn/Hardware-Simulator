// Cableado procedural del laboratorio (1 unidad = 50 mm).
// Separa los cables de alimentación que nacen en los cuatro puertos de la misma
// cara modular de la PSU de las conexiones de datos, vídeo y panel frontal.
import { PSU_CABLE_PORTS } from './partsRealScale.js?v=7-2-casefans-bays';

export function createCableHarness(THREE,scene){
  const root=new THREE.Group();root.name='Cableado procedural';scene.add(root);
  const palette={
    sataData:new THREE.MeshStandardMaterial({color:0x358bd0,roughness:.79}),
    sataPower:new THREE.MeshStandardMaterial({color:0x353b49,roughness:.88}),
    eps:new THREE.MeshStandardMaterial({color:0x1a202a,roughness:.87}),
    gpu:new THREE.MeshStandardMaterial({color:0x303642,roughness:.84}),
    fan:new THREE.MeshStandardMaterial({color:0x626d75,roughness:.86}),
    atx24:new THREE.MeshStandardMaterial({color:0x242d38,roughness:.88}),
    frontPanel:new THREE.MeshStandardMaterial({color:0x536c82,roughness:.83}),
    video:new THREE.MeshStandardMaterial({color:0x191f2b,roughness:.90})
  };
  const connectorMaterial=new THREE.MeshStandardMaterial({
    color:0x111922,metalness:.13,roughness:.67
  });
  const powerIds=['atx24','eps','gpu','sataPower'];
  const strands={atx24:6,eps:4,gpu:4,sataPower:3};
  const wires={};
  let layoutKey='';

  function tube(parent,positions,radius,material){
    const points=positions.map(([x,y,z])=>new THREE.Vector3(x,y,z));
    const curve=new THREE.CatmullRomCurve3(points,false,'centripetal',.40);
    const mesh=new THREE.Mesh(
      new THREE.TubeGeometry(curve,Math.max(40,points.length*12),radius,7,false),
      material||palette.fan
    );
    mesh.castShadow=false;
    parent.add(mesh);
    return mesh;
  }
  function make(id,waypoints,radius){
    const g=new THREE.Group();
    g.name='cable_'+id;
    root.add(g);
    const isPower=powerIds.includes(id);
    if(isPower){
      // Mazo real: varios conductores negros paralelos, no una línea blanca.
      const count=strands[id]||3;
      for(let i=0;i<count;i++){
        const angle=i*Math.PI*2/count;
        const dx=Math.cos(angle)*.038, dz=Math.sin(angle)*.038;
        const coords=waypoints.map((p,k)=>{
          const taper=(k===0||k===waypoints.length-1)?.55:1;
          return [p[0]+dx*taper,p[1]+Math.sin(angle)*.021*taper,p[2]+dz*taper];
        });
        tube(g,coords,radius*.38,palette[id]);
      }
      // Abrazaderas de mazos oscuras, distribuidas en tramos accesibles.
      for(const index of [1,Math.max(2,waypoints.length-2)]){
        const p=waypoints[index];
        const tie=new THREE.Mesh(
          new THREE.CylinderGeometry(.067,.067,.10,10),connectorMaterial
        );
        tie.position.set(...p);
        g.add(tie);
      }
    }else{
      tube(g,waypoints,radius,palette[id]);
    }

    // Terminales con proporción y posición coherentes con cada conector.
    const dims=id==='atx24'?[.32,.33,.43]:id==='sataData'?[.20,.13,.26]:
      id==='frontPanel'?[.14,.10,.16]:id==='gpu'?[.27,.19,.27]:
      id==='eps'?[.26,.19,.24]:[.19,.15,.24];
    [0,waypoints.length-1].forEach((index,terminal)=>{
      const plug=new THREE.Mesh(new THREE.BoxGeometry(...dims),connectorMaterial);
      plug.position.set(...waypoints[index]);
      plug.name='conector_'+id+(terminal?'_destino':'_origen');
      g.add(plug);
    });
    wires[id]=g;
  }
  function clear(){
    for(const g of Object.values(wires)){
      root.remove(g);
      g.traverse(obj=>{
        if(obj.isMesh) obj.geometry.dispose();
      });
    }
    for(const id of Object.keys(wires))delete wires[id];
  }
  function rebuild(cfg,gpuChoice,storageChoice,secured){
    clear();
    const len=gpuChoice==='rtx4070'?267.01/50:245/50;
    const height=gpuChoice==='rtx4070'?133.94/50:134/50;
    const hdd=storageChoice==='hdd';
    const drive=hdd?[1.57,.85,4.70]:[-1.23,-.48,.65];
    // Cables fijados: recorren la cámara trasera Y<0 y atraviesan
    // los pasacables del borde derecho, antes de llegar al conector.
    const channelY=secured?-.49:1.73;
    const crossY=secured?-.36:1.22;
    const routeRight=(end)=>[
      [1.76,channelY,4.38],[1.71,channelY,end[2]],
      [1.53,crossY,end[2]],[...end]
    ];

    make('atx24',[
      PSU_CABLE_PORTS.atx24,
      [1.76,channelY,4.25],[1.74,channelY,-1.45],
      [1.52,crossY,-1.45],[cfg.atxX,.69,cfg.atxZ]
    ],.055);
    make('eps',[
      PSU_CABLE_PORTS.eps,[1.90,channelY,5.05],
      [1.85,channelY,-3.12],[-3.49,channelY,-3.09],
      [cfg.epsX,.78,cfg.epsZ]
    ],.044);
    make('gpu',[
      PSU_CABLE_PORTS.gpu,[1.77,channelY,4.18],
      [1.75,channelY,2.86],[1.42,crossY,2.53],
      [1.20,2.42,cfg.pcieZ+.78],
      [cfg.pcieX+len*.37,.46+height+.13,cfg.pcieZ+.12]
    ],.045);
    make('sataPower',[
      PSU_CABLE_PORTS.sataPower,[1.60,channelY,4.91],
      [1.58,channelY,drive[2]],[...drive]
    ],.033);
    make('sataData',[
      [cfg.sataX,.62,cfg.sataZ],
      [1.51,.24,cfg.sataZ+.16],
      [1.55,channelY,drive[2]],[...drive]
    ],.023);

    // Panel frontal se conecta a F_PANEL por la canaleta.
    const frontX=cfg.x+cfg.w/2-.42,frontZ=cfg.z+cfg.d/2-.32;
    make('frontPanel',[
      [5.00,.40,-1.36],[4.88,channelY,-1.40],
      [1.64,channelY,2.54],[frontX,.52,frontZ]
    ],.018);
    make('fan',[
      [cfg.cpuX+.93,.55,cfg.cpuZ+.88],
      [cfg.cpuX+1.03,.93,cfg.cpuZ+.85],
      [cfg.cpuX+.88,1.93,cfg.cpuZ+.74],
      [cfg.cpuX+.47,2.06,cfg.cpuZ+.63]
    ],.016);
    [
      [[4.78,1.61,-2.0],[4.67,.72,-2.08],[1.69,channelY,-2.27],
       [cfg.x-.63,.60,cfg.z+2.42]],
      [[4.78,1.61,.47],[4.67,.72,.49],[1.70,channelY,.52],
       [cfg.x+cfg.w/2-.23,.61,cfg.z+1.62]],
      [[-3.89,1.61,-1.25],[-3.74,.58,-1.18],[-3.49,channelY,-1.14],
       [cfg.x-.93,.60,cfg.z-cfg.d/2+.52]]
    ].forEach((points,i)=>make('caseFan'+i,points,.018));

    // Cableado interno de vídeo sólo hasta la salida trasera del PC.
    // El tramo externo al monitor se dibuja en coordenadas del taller.
    make('video',[
      [cfg.pcieX-len/2-.09,1.18,cfg.pcieZ+.10],
      [-3.75,.83,cfg.pcieZ+.30],[-4.06,.58,cfg.pcieZ+.30]
    ],.028);
    make('videoIGPU',[
      [cfg.x-cfg.w/2+.13,.64,cfg.z-cfg.d/2+.48],
      [-3.90,.69,cfg.z-cfg.d/2+.48],[-4.06,.58,cfg.z-cfg.d/2+.48]
    ],.028);
  }
  function update(state,cfg,needsSata){
    const key=[state.selected?.motherboard,state.selected?.gpu,state.selected?.storage,!!state.psuAccessRouted].join(':');
    if(layoutKey!==key){
      rebuild(cfg,state.selected?.gpu,state.selected?.storage,!!state.psuAccessRouted);
      layoutKey=key;
    }
    const installed=state.installed||{};
    const base=!!installed.case&&!!installed.motherboard&&!!installed.psu;
    const exploded=!!state.explode;
    wires.atx24.visible=!exploded&&base&&!!state.atx24;
    wires.eps.visible=!exploded&&base&&!!state.eps;
    wires.gpu.visible=!exploded&&base&&!!installed.gpu&&
      state.selected?.gpu!=='none'&&!!state.gpuPower;
    wires.sataPower.visible=!exploded&&base&&needsSata&&
      !!installed.storage&&!!state.sataPower;
    wires.sataData.visible=!exploded&&!!installed.motherboard&&needsSata&&
      !!installed.storage&&!!state.sataData;
    wires.frontPanel.visible=!exploded&&!!installed.case&&
      !!installed.motherboard&&!!state.frontPanel;
    wires.fan.visible=!exploded&&!!installed.motherboard&&
      !!installed.cooler&&!!state.cpuFan;
    for(let i=0;i<3;i++)wires['caseFan'+i].visible=!exploded&&
      !!installed.case&&!!installed.motherboard&&
      !!state.caseFans?.[i]?.installed&&!!state.caseFans?.[i]?.connected;
    const onGPU=!!installed.gpu&&state.selected?.gpu!=='none';
    wires.video.visible=!exploded&&!!state.monitorCable&&
      !!installed.motherboard&&onGPU;
    wires.videoIGPU.visible=!exploded&&!!state.monitorCable&&
      !!installed.motherboard&&!onGPU&&state.selected?.gpu==='none'&&
      !!installed.cpu;
  }
  return {update,root,ports:PSU_CABLE_PORTS};
}
