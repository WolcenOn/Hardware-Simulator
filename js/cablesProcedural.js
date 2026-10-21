// Cableado procedural del laboratorio (1 unidad = 50 mm).
// Separa los cables de alimentación que nacen en los cuatro puertos de la misma
// cara modular de la PSU de las conexiones de datos, vídeo y panel frontal.
import { PSU_CABLE_PORTS } from './partsRealScale.js?v=7-0-psu-layout2';

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
      material
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
  function rebuild(cfg,gpuChoice,storageChoice){
    clear();
    const len=gpuChoice==='rtx4070'?267.01/50:245/50;
    const height=gpuChoice==='rtx4070'?133.94/50:134/50;
    const drivePortX=storageChoice==='hdd'?1.56:2.03;
    const drivePortY=storageChoice==='hdd'?.47:.31;

    // Alimento principal 24 pines: PSU -> borde derecho de motherboard.
    make('atx24',[
      PSU_CABLE_PORTS.atx24,
      [5.22,1.13,2.03],[5.36,.52,3.62],
      [1.73,.43,3.64],[1.59,.42,-.85],
      [cfg.atxX,.69,cfg.atxZ]
    ],.055);
    // EPS 8 pines: PSU -> perímetro posterior -> esquina superior izquierda.
    make('eps',[
      PSU_CABLE_PORTS.eps,
      [5.24,1.05,.75],[5.38,.43,-.82],
      [5.15,.36,-3.62],[-3.55,.35,-3.63],
      [cfg.epsX,.78,cfg.epsZ]
    ],.044);
    // Alimentación GPU: PSU -> arco sobre el borde -> conector superior.
    make('gpu',[
      PSU_CABLE_PORTS.gpu,
      [5.14,.89,.83],[5.40,1.02,2.50],
      [3.20,1.73,2.74],[1.10,2.72,cfg.pcieZ+.78],
      [cfg.pcieX+len*.37,.46+height+.13,cfg.pcieZ+.12]
    ],.045);
    // SATA power: PSU -> conector eléctrico lateral de la unidad.
    make('sataPower',[
      PSU_CABLE_PORTS.sataPower,
      [5.24,.69,2.02],[5.46,.42,-2.67],
      [4.20,.38,-2.83],[drivePortX,drivePortY,-2.0]
    ],.033);

    // Datos SATA sale de la motherboard, nunca de la PSU.
    make('sataData',[
      [cfg.sataX,.62,cfg.sataZ],
      [1.72,.46,cfg.sataZ+.23],[1.78,.33,3.48],
      [5.61,.34,3.59],[5.66,.34,-2.80],
      [drivePortX,drivePortY,-2.17]
    ],.023);

    const frontX=cfg.x+cfg.w/2-.42;
    const frontZ=cfg.z+cfg.d/2-.32;
    // F_PANEL tiene origen en el botón POWER físico, no en la fuente.
    make('frontPanel',[
      [5.16,-.16,3.27],[4.92,-.20,3.60],
      [3.10,.30,3.69],[1.63,.32,3.50],
      [frontX,.52,frontZ]
    ],.018);
    // CPU_FAN sólo recorre la zona del socket.
    make('fan',[
      [cfg.cpuX+.93,.55,cfg.cpuZ+.88],
      [cfg.cpuX+1.03,.93,cfg.cpuZ+.85],
      [cfg.cpuX+.88,1.93,cfg.cpuZ+.74],
      [cfg.cpuX+.47,2.06,cfg.cpuZ+.63]
    ],.016);
    // El cable de vídeo puede entrar por una GPU dedicada o por salida iGPU.
    // Son conectores alternativos: nunca salen simultáneamente.
    make('video',[
      [cfg.pcieX-len/2-.09,1.18,cfg.pcieZ+.10],
      [-4.08,.46,cfg.pcieZ+.38],
      [-4.85,.30,-3.64],[-5.36,.35,-6.24],
      [4.20,.38,-6.22],[4.20,2.65,-5.89]
    ],.028);
    make('videoIGPU',[
      [cfg.x-cfg.w/2+.13,.64,cfg.z-cfg.d/2+.48],
      [-4.60,.33,-3.58],[-5.36,.35,-6.24],
      [4.20,.38,-6.22],[4.20,2.65,-5.89]
    ],.028);

  }
  function update(state,cfg,needsSata){
    const key=[state.selected?.motherboard,state.selected?.gpu,state.selected?.storage].join(':');
    if(layoutKey!==key){
      rebuild(cfg,state.selected?.gpu,state.selected?.storage);
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
    const onGPU=!!installed.gpu&&state.selected?.gpu!=='none';
    wires.video.visible=!exploded&&!!state.monitorCable&&
      !!installed.motherboard&&onGPU;
    wires.videoIGPU.visible=!exploded&&!!state.monitorCable&&
      !!installed.motherboard&&!onGPU&&state.selected?.gpu==='none'&&
      !!installed.cpu;
  }
  return {update,root,ports:PSU_CABLE_PORTS};
}
