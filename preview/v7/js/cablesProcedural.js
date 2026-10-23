// Cableado procedural del laboratorio (1 unidad = 50 mm).
// Separa los cables de alimentación que nacen en los cuatro puertos de la misma
// cara modular de la PSU de las conexiones de datos, vídeo y panel frontal.
import { PSU_CABLE_PORTS, MOTHERBOARD_MOUNT, REAR_CASE_FAN_Y, FRONT_IO_LAYOUT,
  getInternalHeaderAnchor, getGpuPowerAnchor } from './partsRealScale.js?v=8-4-7-cable-exits';
import {createConnector3d,getCableExit} from './connectors3d.js?v=8-4-7-cable-exits';

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
    const g=new THREE.Group();g.name='cable_'+id;root.add(g);
    const isPower=powerIds.includes(id);
    // Montar ANTES las dos clavijas para encontrar la salida exacta de goma.
    const plugs=[];
    const ends=[0,waypoints.length-1];
    for(const index of ends){
      const kind=id.startsWith('caseFan')?'fan':id;
      const plug=createConnector3d(THREE,kind);
      plug.position.set(...waypoints[index]);
      const next=new THREE.Vector3(...waypoints[index===0?1:index-1]);
      const dir=next.sub(plug.position);
      if(dir.lengthSq()>1e-8)
        plug.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),dir.normalize());
      plug.name='conector_'+id+(index?'_destino':'_origen');
      g.add(plug);plugs.push(plug);
    }
    root.updateMatrixWorld(true);
    const tips=plugs.map(plug=>getCableExit(THREE,plug,root));
    const segment=waypoints.map(p=>new THREE.Vector3(...p));
    const tangent0=segment[1].clone().sub(segment[0]).normalize();
    const tangent1=segment.at(-2).clone().sub(segment.at(-1)).normalize();
    // Los tramos rígidos desaparecen de la ruta. El cable flexible EMPIEZA
    // donde acaba el cuello de plástico, y sale siguiendo el eje del mismo.
    const path=[tips[0].toArray(),
      tips[0].clone().addScaledVector(tangent0,.12).toArray(),
      ...waypoints.slice(1,-1),
      tips[1].clone().addScaledVector(tangent1,.12).toArray(),
      tips[1].toArray()];
    if(isPower){
      const count=strands[id]||3;
      for(let i=0;i<count;i++){
        const angle=i*Math.PI*2/count;
        const dx=Math.cos(angle)*.038,dz=Math.sin(angle)*.038;
        tube(g,path.map((p,k)=>{
          const taper=(k===0||k===path.length-1)?0:1;
          return [p[0]+dx*taper,p[1]+Math.sin(angle)*.021*taper,
            p[2]+dz*taper];
        }),radius*.38,palette[id]);
      }
      for(const index of [2,Math.max(3,path.length-3)]){
        const tie=new THREE.Mesh(new THREE.CylinderGeometry(.067,.067,.10,10),connectorMaterial);
        tie.position.set(...path[index]);g.add(tie);
      }
    }else{
      tube(g,path,radius,palette[id]);
    }
    g.userData.flexEnds=path.length?[path[0],path.at(-1)]:[];
    g.userData.connectionAnchors=[...ends.map(index=>[...waypoints[index]])];
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
  const boardY=MOTHERBOARD_MOUNT.offsetY;
  function rebuild(cfg,gpuChoice,storageChoice,secured){
    clear();
    const len=gpuChoice==='rtx4070'?267.01/50:245/50;
    const height=gpuChoice==='rtx4070'?133.94/50:134/50;
    const hdd=['hdd','hdd4'].includes(storageChoice);
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
      [1.52,crossY,-1.45],getInternalHeaderAnchor(cfg,'atx24')
    ],.055);
    make('eps',[
      PSU_CABLE_PORTS.eps,[1.90,channelY,5.05],
      [1.85,channelY,-3.12],[-3.49,channelY,-3.09],
      getInternalHeaderAnchor(cfg,'eps')
    ],.044);
    make('gpu',[
      PSU_CABLE_PORTS.gpu,[1.77,channelY,4.18],
      [1.75,channelY,2.86],[1.42,crossY,2.53],
      [1.20,2.42,cfg.pcieZ+.78],
      getGpuPowerAnchor(cfg,gpuChoice)
    ],.045);
    make('sataPower',[
      PSU_CABLE_PORTS.sataPower,[1.60,channelY,4.91],
      [1.58,channelY,drive[2]],[...drive]
    ],.033);
    make('sataData',[
      getInternalHeaderAnchor(cfg,'sataData'),
      [1.51,.24+boardY,cfg.sataZ+.16],
      [1.55,channelY,drive[2]],[...drive]
    ],.023);

    // POWER SW y los dos mazos USB parten del frontal superior del chasis.
    // Los puntos de placa se comparten con los alojamientos físicos.
    make('frontPanel',[
      FRONT_IO_LAYOUT.powerLead,[4.70,2.93,-3.00],
      [4.72,channelY,-2.94],[1.66,channelY,2.54],
      getInternalHeaderAnchor(cfg,'frontPanel')
    ],.018);
    make('frontUsb3',[
      FRONT_IO_LAYOUT.usbALead,[4.75,1.94,-2.99],
      [4.70,channelY,-2.74],[1.72,channelY,getInternalHeaderAnchor(cfg,'frontUsb3')[2]],
      getInternalHeaderAnchor(cfg,'frontUsb3')
    ],.029);
    make('frontUsbC',[
      FRONT_IO_LAYOUT.usbCLead,[4.73,.98,-3.02],
      [4.68,channelY,-2.51],[1.63,channelY,getInternalHeaderAnchor(cfg,'frontUsbC')[2]],
      getInternalHeaderAnchor(cfg,'frontUsbC')
    ],.023);
    make('fan',[
      getInternalHeaderAnchor(cfg,'fan'),
      [cfg.cpuX+1.03,.93+boardY,cfg.cpuZ+.85],
      [cfg.cpuX+.88,1.93+boardY,cfg.cpuZ+.74],
      [cfg.cpuX+.47,2.06+boardY,cfg.cpuZ+.63]
    ],.016);
    [
      [[4.78,1.61,-2.0],[4.67,.72,-2.08],[1.69,channelY,-2.27],
       [cfg.x-.63,.60+boardY,cfg.z+2.42]],
      [[4.78,1.61,.47],[4.67,.72,.49],[1.70,channelY,.52],
       [cfg.x+cfg.w/2-.23,.61+boardY,cfg.z+1.62]],
      [[-3.89,REAR_CASE_FAN_Y,-1.25],[-3.74,1.15,-1.18],[-3.49,channelY,-1.14],
       [cfg.x-.93,.60+boardY,cfg.z-cfg.d/2+.52]]
    ].forEach((points,i)=>make('caseFan'+i,points,.018));

    // Cableado interno de vídeo sólo hasta la salida trasera del PC.
    // El tramo externo al monitor se dibuja en coordenadas del taller.
    make('video',[
      [cfg.pcieX-len/2-.09,1.18+boardY,cfg.pcieZ+.10],
      [-3.75,.83+boardY,cfg.pcieZ+.30],[-4.06,.58+boardY,cfg.pcieZ+.30]
    ],.028);
    make('videoIGPU',[
      [cfg.x-cfg.w/2+.13,.64+boardY,cfg.z-cfg.d/2+.48],
      [-3.90,.69+boardY,cfg.z-cfg.d/2+.48],[-4.06,.58+boardY,cfg.z-cfg.d/2+.48]
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
    wires.frontUsb3.visible=!exploded&&!!installed.case&&
      !!installed.motherboard&&!!state.frontUsb3;
    wires.frontUsbC.visible=!exploded&&!!installed.case&&
      !!installed.motherboard&&!!state.frontUsbC;
    wires.fan.visible=!exploded&&!!installed.motherboard&&
      !!installed.cooler&&!!state.cpuFan;
    for(let i=0;i<3;i++)wires['caseFan'+i].visible=!exploded&&
      !!installed.case&&!!installed.motherboard&&
      !!state.caseFans?.[i]?.installed&&!!state.caseFans?.[i]?.connected;
    const onGPU=!!installed.gpu&&state.selected?.gpu!=='none';
    const port=state.videoPort||'auto';
    const gpuOutput=port==='gpu'||(port==='auto'&&onGPU);
    const boardOutput=port==='motherboard'||(port==='auto'&&!onGPU);
    // El vídeo NO circula por un mazo independiente dentro del chasis.
    // Sólo se dibuja el cable EXTERIOR en procedural3d, con una única
    // clavija insertada en GPU DP o en HDMI de la placa.
    wires.video.visible=false;
    wires.videoIGPU.visible=false;
  }
  function getFlexAlignment(){
    root.updateMatrixWorld(true);
    return Object.entries(wires).filter(([id])=>!['video','videoIGPU'].includes(id))
      .map(([id,g])=>{
        const plugs=g.children.filter(o=>o.userData?.connectorType);
        const ends=g.userData.flexEnds;
        const gaps=plugs.map((plug,i)=>getCableExit(THREE,plug,root)
          .distanceTo(new THREE.Vector3(...ends[i]))*50);
        return {id,gapsMm:gaps,visible:g.visible,kind:plugs[0]?.userData.connectorType};
      });
  }
  function getPlugWorld(id,index=1){
    const plugs=wires[id]?.children.filter(o=>o.userData?.connectorType)||[];
    return plugs[index]?.getWorldPosition(new THREE.Vector3())||null;
  }
  return {update,root,ports:PSU_CABLE_PORTS,getFlexAlignment,getPlugWorld,
    isVisible:id=>!!wires[id]?.visible,
    connectorTypes:id=>wires[id]?.children?.filter(o=>o.userData?.connectorType)
      .map(o=>o.userData.connectorType)||[]};
}
