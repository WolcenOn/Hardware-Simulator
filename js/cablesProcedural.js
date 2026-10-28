// Cableado procedural del laboratorio (1 unidad = 50 mm).
// Separa los cables de alimentación que nacen en los cuatro puertos de la misma
// cara modular de la PSU de las conexiones de datos, vídeo y panel frontal.
import { PSU_CABLE_PORTS, MOTHERBOARD_MOUNT, REAR_CASE_FAN_Y, FRONT_IO_LAYOUT,
  getInternalHeaderAnchor, getGpuPowerAnchor } from './partsRealScale.js?v=8-21-3-pcb-edge-headers';
import {createConnector3d,getCableExit} from './connectors3d.js?v=8-4-9-routed-cables';
import {planCableRoute,createSafeCableCurve,routeCollisions}
  from './cableRouting3d.js?v=8-4-11-drive-bays';

export function createCableHarness(THREE,scene,assembly,tower){
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
  let activeConfig,activeGpu,activeStorage,activeBoardId='b650';

  function tube(parent,positions,radius,material,obstacles=[]){
    const curve=createSafeCableCurve(THREE,positions,obstacles);
    const mesh=new THREE.Mesh(
      new THREE.TubeGeometry(curve,Math.max(40,positions.length*12),radius,7,false),
      material||palette.fan
    );
    mesh.castShadow=false;
    parent.add(mesh);
    return mesh;
  }
  // Los receptáculos son la ÚNICA referencia de orientación. El cable
  // no determina la rotación de la clavija. Y local = eje de inserción;
  // +Y apunta hacia fuera de la toma, perpendicular a su abertura.
  const up=new THREE.Vector3(0,1,0);
  function physicalHeader(id,side,boardId){
    const boardHeaders=assembly.internalHeaderModels[boardId]||{};
    if(side===0){
      if(['atx24','eps','gpu','sataPower'].includes(id))
        return assembly.psuCableSockets[id];
      if(['sataData','fan'].includes(id))return boardHeaders[id];
      if(['frontPanel','frontUsb3','frontUsbC'].includes(id))
        return tower.frontIOHeaders[id];
      if(id.startsWith('caseFan'))
        return assembly.caseFanSourcePorts[Number(id.slice(-1))];
      return null;
    }
    if(id==='gpu')return assembly.gpuPowerHeader;
    if(id==='fan')return assembly.coolerFanPort;
    if(['sataData','sataPower'].includes(id)){
      const ports=['hdd','hdd4'].includes(activeStorage)?
        assembly.sataHddPorts:assembly.sataSsdPorts;
      return ports[id];
    }
    if(['atx24','eps','frontPanel','frontUsb3','frontUsbC'].includes(id)
      ||id.startsWith('caseFan'))return boardHeaders[id];
    return null;
  }
  function fallbackNormal(){return up.clone();}
  function endpointRole(id,side){
    if(side===0){
      if(['atx24','eps','gpu','sataPower'].includes(id))return 'psu';
      if(['frontPanel','frontUsb3','frontUsbC'].includes(id))return 'front';
      if(id==='caseFan2')return 'caseRear';
      if(id.startsWith('caseFan'))return 'front';
      return 'board';
    }
    if(['sataData','sataPower'].includes(id))return 'drive';
    if(id==='fan')return 'cooler';
    return 'board';
  }
  function getEndPose(id,side,point,boardId){
    const port=physicalHeader(id,side,boardId);
    if(!port)return {point:new THREE.Vector3(...point),
      normal:fallbackNormal(id,side),port:null};
    // El header puede heredar escalas no uniformes (PSU); aplicar matrices,
    // NO deducir el eje a partir de la posición del siguiente waypoint.
    scene.updateMatrixWorld(true);
    const origin=port.getWorldPosition(new THREE.Vector3());
    const outward=port.localToWorld(up.clone());
    const p=scene.worldToLocal(origin.clone());
    const normal=scene.worldToLocal(outward).sub(p).normalize();
    return {point:p,normal,port};
  }
  function make(id,waypoints,radius,boardId){
    const g=new THREE.Group();g.name='cable_'+id;root.add(g);
    const isPower=powerIds.includes(id);
    const kind=id.startsWith('caseFan')?'fan':id;
    const poses=[getEndPose(id,0,waypoints[0],boardId),
      getEndPose(id,1,waypoints.at(-1),boardId)];
    const plugs=[];
    for(let side=0;side<2;side++){
      const pose=poses[side];
      const plug=createConnector3d(THREE,kind);
      plug.position.copy(pose.point);
      // Encaje perpendicular forzado al plano del receptáculo 3D.
      plug.quaternion.setFromUnitVectors(up,pose.normal);
      plug.name='conector_'+id+(side?'_destino':'_origen');
      g.add(plug);plugs.push(plug);
    }
    root.updateMatrixWorld(true);
    const exits=plugs.map(plug=>getCableExit(THREE,plug,root));
    // El conector GPU queda próximo al cristal: su cuello recto es más
    // corto para no salir del volumen útil del chasis.
    const straightLength=id==='gpu'?.16:['atx24','eps'].includes(id)?.30:.23;
    const leadLength=id==='gpu'?.10:.17;
    const knees=exits.map((v,i)=>v.clone().addScaledVector(poses[i].normal,straightLength));
    const leads=knees.map((v,i)=>v.clone().addScaledVector(poses[i].normal,leadLength));
    // El planificador utiliza las tomas REALES y pasillos protegidos,
    // sin seguir los waypoints heredados que cruzaban el PCB y la GPU.
    const plan=planCableRoute({id,cfg:activeConfig,
      start:leads[0].toArray(),end:leads[1].toArray(),
      startRole:endpointRole(id,0),endRole:endpointRole(id,1),
      gpuChoice:activeGpu,storageChoice:activeStorage});
    const center=[knees[0].toArray(),...plan.points,knees[1].toArray()];
    const mainMaterial=palette[id]||palette.fan;
    if(isPower){
      const count=strands[id]||3;
      for(let i=0;i<count;i++){
        const angle=i*Math.PI*2/count;
        const dx=Math.cos(angle)*.038,dz=Math.sin(angle)*.038;
        const displaced=center.map((p,k)=>{
          const taper=k<2||k>center.length-3?0:1;
          return [p[0]+dx*taper,p[1]+Math.sin(angle)*.021*taper,
            p[2]+dz*taper];
        });
        tube(g,displaced,radius*.38,mainMaterial,plan.obstacles);
      }
      for(const index of [2,Math.max(3,center.length-3)]){
        const tie=new THREE.Mesh(new THREE.CylinderGeometry(.067,.067,.10,10),connectorMaterial);
        tie.position.set(...center[index]);g.add(tie);
      }
    }else{
      tube(g,center,radius,mainMaterial,plan.obstacles);
    }
    for(let side=0;side<2;side++)
      tube(g,[exits[side].toArray(),knees[side].toArray()],
        isPower?radius*.62:radius,mainMaterial);
    g.userData.flexEnds=exits.map(v=>v.toArray());
    g.userData.connectionAnchors=poses.map(p=>p.point.toArray());
    g.userData.normals=poses.map(p=>p.normal.toArray());
    g.userData.straightLength=straightLength;
    g.userData.knees=knees.map(v=>v.toArray());
    g.userData.routePoints=center;
    g.userData.routeStrategy=plan.strategy;
    g.userData.routeCollisions=plan.collisions;
    g.userData.routeLengthMm=center.slice(1).reduce((total,p,i)=>
      total+new THREE.Vector3(...p).distanceTo(new THREE.Vector3(...center[i]))*50,0);
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
  function rebuild(cfg,gpuChoice,storageChoice,secured,boardId){
    clear();
    activeConfig=cfg;activeGpu=gpuChoice;activeStorage=storageChoice;
    activeBoardId=boardId;
    const len=gpuChoice==='rtx4070'?267.01/50:245/50;
    const height=gpuChoice==='rtx4070'?133.94/50:134/50;
    const hdd=['hdd','hdd4'].includes(storageChoice);
    const drive=hdd?[1.57,.85,4.70]:[-1.23,-.48,.65];
    // Cables fijados: recorren la cámara trasera Y<0 y atraviesan
    // los pasacables del borde derecho, antes de llegar al conector.
    const channelY=-.665;
    const crossY=1.22;
    const boardRight=cfg.x+cfg.w/2,boardBottom=cfg.z+cfg.d/2;
    const ingressX=Math.min(1.54,boardRight+.20);
    // Los mazos pasan por detrás del PCB y rodean su canto; ningún
    // waypoint debe seguir apuntando a la antigua zona del chipset.
    const frontUsbPath=(kind,lead,first)=>{
      const end=getInternalHeaderAnchor(cfg,kind);
      const bottomSide=end[0]<boardRight-.95;
      const via=bottomSide?[
        [ingressX,channelY,boardBottom+.22],
        [end[0],channelY,boardBottom+.22],
        [end[0],1.03+boardY,boardBottom+.22]
      ]:[
        [ingressX,channelY,end[2]+.09],
        [ingressX,1.55,end[2]+.09]
      ];
      return [lead,first,[4.70,channelY,-1.80],...via,end];
    };
    const routeRight=(end)=>[
      [1.76,channelY,4.38],[1.71,channelY,end[2]],
      [1.53,crossY,end[2]],[...end]
    ];

    make('atx24',[
      PSU_CABLE_PORTS.atx24,
      [1.76,channelY,4.25],[1.74,channelY,-1.45],
      [1.52,crossY,-1.45],[1.52,1.79,-1.45],
      getInternalHeaderAnchor(cfg,'atx24')
    ],.055,boardId);
    make('eps',[
      PSU_CABLE_PORTS.eps,[1.90,channelY,5.05],
      [1.85,channelY,-3.12],[-3.84,channelY,-3.09],
      [-3.84,1.65,-3.09],getInternalHeaderAnchor(cfg,'eps')
    ],.044,boardId);
    make('gpu',[
      PSU_CABLE_PORTS.gpu,[1.77,channelY,4.18],
      [1.75,channelY,2.86],[1.42,crossY,2.53],
      [1.20,2.42,cfg.pcieZ+.78],
      [cfg.pcieX+len*.37,4.71,cfg.pcieZ+.78],
      getGpuPowerAnchor(cfg,gpuChoice)
    ],.045,boardId);
    make('sataPower',[
      PSU_CABLE_PORTS.sataPower,[1.60,channelY,4.91],
      [1.58,channelY,drive[2]],[...drive]
    ],.033,boardId);
    const sataHeader=getInternalHeaderAnchor(cfg,'sataData');
    make('sataData',[
      sataHeader,
      [ingressX,1.46,sataHeader[2]+.09],
      [ingressX,.24+boardY,sataHeader[2]+.09],
      [1.55,channelY,drive[2]],[...drive]
    ],.023,boardId);

    // POWER SW y los dos mazos USB parten del frontal superior del chasis.
    // Los puntos de placa se comparten con los alojamientos físicos.
    const frontHeader=getInternalHeaderAnchor(cfg,'frontPanel');
    make('frontPanel',[
      FRONT_IO_LAYOUT.powerLead,[4.70,2.93,-1.70],
      [4.72,channelY,-1.80],
      [ingressX,channelY,frontHeader[2]+.10],
      [ingressX,1.61,frontHeader[2]+.10],frontHeader
    ],.018,boardId);
    make('frontUsb3',frontUsbPath('frontUsb3',
      FRONT_IO_LAYOUT.usbALead,[4.75,1.94,-1.62]),.029,boardId);
    make('frontUsbC',frontUsbPath('frontUsbC',
      FRONT_IO_LAYOUT.usbCLead,[4.73,.98,-1.63]),.023,boardId);
    make('fan',[
      getInternalHeaderAnchor(cfg,'fan'),
      [cfg.cpuX+1.03,.93+boardY,cfg.cpuZ+.85],
      [cfg.cpuX+.88,1.93+boardY,cfg.cpuZ+.74],
      [cfg.cpuX+.47,2.06+boardY,cfg.cpuZ+.63]
    ],.016,boardId);
    [
      [[4.78,1.61,-2.0],[4.67,.72,-2.08],[1.69,channelY,-2.27],
       [cfg.x-.63,.60+boardY,cfg.z+2.42]],
      [[4.78,1.61,.47],[4.67,.72,.49],[1.70,channelY,.52],
       [cfg.x+cfg.w/2-.23,.61+boardY,cfg.z+1.62]],
      [[-3.89,REAR_CASE_FAN_Y,-1.25],[-3.74,1.15,-1.18],[-3.49,channelY,-1.14],
       [cfg.x-.93,.60+boardY,cfg.z-cfg.d/2+.52]]
    ].forEach((points,i)=>make('caseFan'+i,points,.018,boardId));

    // Cableado interno de vídeo sólo hasta la salida trasera del PC.
    // El tramo externo al monitor se dibuja en coordenadas del taller.
    make('video',[
      [cfg.pcieX-len/2-.09,1.18+boardY,cfg.pcieZ+.10],
      [-3.75,.83+boardY,cfg.pcieZ+.30],[-4.06,.58+boardY,cfg.pcieZ+.30]
    ],.028,boardId);
    make('videoIGPU',[
      [cfg.x-cfg.w/2+.13,.64+boardY,cfg.z-cfg.d/2+.48],
      [-3.90,.69+boardY,cfg.z-cfg.d/2+.48],[-4.06,.58+boardY,cfg.z-cfg.d/2+.48]
    ],.028,boardId);
  }
  function update(state,cfg,needsSata){
    const key=[state.selected?.motherboard,state.selected?.gpu,state.selected?.storage,
      !!state.psuAccessRouted].join(':');
    if(layoutKey!==key){
      rebuild(cfg,state.selected?.gpu,state.selected?.storage,!!state.psuAccessRouted,
        state.selected?.motherboard||'b650');
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
  function getSocketAlignment(){
    scene.updateMatrixWorld(true);
    const report=[];
    for(const id of Object.keys(wires)){
      if(['video','videoIGPU'].includes(id))continue;
      const plugs=wires[id].children.filter(o=>o.userData?.connectorType);
      for(let side=0;side<2;side++){
        const port=physicalHeader(id,side,activeBoardId);
        const plug=plugs[side];
        if(!port||!plug)continue;
        const actual=port.getWorldPosition(new THREE.Vector3());
        const atPlug=plug.getWorldPosition(new THREE.Vector3());
        const normal=port.localToWorld(new THREE.Vector3(0,1,0)).sub(actual).normalize();
        const axis=plug.localToWorld(new THREE.Vector3(0,1,0)).sub(atPlug).normalize();
        report.push({id,side,visible:wires[id].visible,
          gapMm:actual.distanceTo(atPlug)*50,
          angleDegrees:axis.angleTo(normal)*180/Math.PI,
          header:port.name});
      }
    }
    return report;
  }
  function getRoutingReport(){
    return Object.entries(wires).filter(([id])=>!['video','videoIGPU'].includes(id))
      .map(([id,g])=>({id,visible:g.visible,strategy:g.userData.routeStrategy,
        collisions:g.userData.routeCollisions||[],
        lengthMm:g.userData.routeLengthMm,
        points:g.userData.routePoints?.map(p=>[...p])||[]}));
  }
  function getFlexAlignment(){
    root.updateMatrixWorld(true);
    return Object.entries(wires).filter(([id])=>!['video','videoIGPU'].includes(id))
      .map(([id,g])=>{
        const plugs=g.children.filter(o=>o.userData?.connectorType);
        const ends=g.userData.flexEnds;
        const gaps=plugs.map((plug,i)=>getCableExit(THREE,plug,root)
          .distanceTo(new THREE.Vector3(...ends[i]))*50);
        const axes=plugs.map((plug,i)=>new THREE.Vector3(0,1,0)
          .applyQuaternion(plug.quaternion).normalize()
          .angleTo(new THREE.Vector3(...g.userData.normals[i]))*180/Math.PI);
        const straightMm=g.userData.knees.map((p,i)=>new THREE.Vector3(...p)
          .distanceTo(new THREE.Vector3(...ends[i]))*50);
        return {id,gapsMm:gaps,angleDegrees:axes,straightMm,
          visible:g.visible,kind:plugs[0]?.userData.connectorType};
      });
  }
  function getPlugMesh(id,index=1){
    return (wires[id]?.children.filter(o=>o.userData?.connectorType)||[])[index]||null;
  }
  function getPlugWorld(id,index=1){
    return getPlugMesh(id,index)?.getWorldPosition(new THREE.Vector3())||null;
  }
  return {update,root,ports:PSU_CABLE_PORTS,getFlexAlignment,
    getRoutingReport,getSocketAlignment,
    getPlugWorld,getPlugMesh,
    isVisible:id=>!!wires[id]?.visible,
    connectorTypes:id=>wires[id]?.children?.filter(o=>o.userData?.connectorType)
      .map(o=>o.userData.connectorType)||[]};
}
