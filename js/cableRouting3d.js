import {HDD_BAY_LAYOUT,SSD_BAY_LAYOUT,getSsdBayPosition} from './partsRealScale.js?v=8-4-11-drive-bays';
// Planificador de mazos 3D en coordenadas de la torre (1 u = 50 mm).
// En vez de una curva libre que atraviesa el PC, utiliza pasillos:
// salida normal -> borde de placa -> cámara trasera -> borde -> inserción.
// Compara variantes por longitud, giros y colisión con volúmenes ocupados.
const dist=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1],a[2]-b[2]);
const same=(a,b)=>dist(a,b)<1e-4;
const v=(x,y,z)=>[x,y,z];
export function cableObstacles(cfg,gpuChoice='rx7600',storageChoice='nvmeSSD'){
  const left=cfg.x-cfg.w/2,right=cfg.x+cfg.w/2;
  const top=cfg.z-cfg.d/2,bottom=cfg.z+cfg.d/2;
  const len=gpuChoice==='rtx4070'?267.01/50:245/50;
  const minRam=Math.min(...cfg.dimmXs),maxRam=Math.max(...cfg.dimmXs);
  const blocks=[
    {id:'pcb',min:[left,-.51,top],max:[right,-.14,bottom]},
    {id:'tray',min:[-4.055,-.53,-3.33],max:[1.695,-.41,3.31]},
    {id:'cooler',min:[cfg.cpuX-1.06,-.11,cfg.cpuZ-1.13],
      max:[cfg.cpuX+1.06,3.24,cfg.cpuZ+1.13]},
    {id:'ram',min:[minRam-.14,-.12,cfg.cpuZ-1.36],
      max:[maxRam+.14,2.26,cfg.cpuZ+1.46]},
    {id:'gpu',min:[cfg.pcieX-len/2,-.12,cfg.pcieZ-.62],
      max:[cfg.pcieX+len/2,3.22,cfg.pcieZ+.62]},
    {id:'psu',min:[-4.02,.27,3.66],max:[-1.01,3.20,5.46]},
    {id:'shroud',min:[-3.88,-.605,3.33],max:[4.92,3.74,3.47]}
  ];
  if(['hdd','hdd4'].includes(storageChoice)){
    // Volumen real del disco MONTADO en la jaula, no su ubicación antigua.
    const [x,y,z]=[...HDD_BAY_LAYOUT.cageCenter];
    const [w,h,d]=HDD_BAY_LAYOUT.driveSize;
    const base=HDD_BAY_LAYOUT.driveBaseY;
    blocks.push({id:'hdd',min:[x-w/2,base,z-d/2],
      max:[x+w/2,base+h,z+d/2]});
  }
  if(['sataSSD','sataSSD2'].includes(storageChoice)){
    const [x,y,z]=getSsdBayPosition();
    const [w,h,d]=SSD_BAY_LAYOUT.driveSize;
    blocks.push({id:'ssd',min:[x-w/2,y,z-d/2],
      max:[x+w/2,y+h,z+d/2]});
  }
  return blocks;
}
function hitsBox(a,b,box,clearance=0){
  // Slab test para un segmento completo, incluidas aristas diagonales.
  let t0=0,t1=1;
  for(let axis=0;axis<3;axis++){
    const lo=box.min[axis]-clearance,hi=box.max[axis]+clearance;
    const d=b[axis]-a[axis];
    if(Math.abs(d)<1e-9){
      if(a[axis]<lo||a[axis]>hi)return false;
      continue;
    }
    const u=(lo-a[axis])/d,w=(hi-a[axis])/d;
    t0=Math.max(t0,Math.min(u,w));t1=Math.min(t1,Math.max(u,w));
    if(t0>t1)return false;
  }
  return true;
}
export function routeCollisions(points,obstacles,clearance=.045){
  const hits=[];
  // El acoplamiento y salida inicial pueden tocar su propio disipador o
  // alojamiento: sólo el tramo realmente enrutable se examina.
  for(let i=0;i<points.length-1;i++){
    for(const box of obstacles){
      if(hitsBox(points[i],points[i+1],box,clearance))
        hits.push({segment:i,obstacle:box.id});
    }
  }
  return hits;
}
function dedupe(points){
  return points.filter((p,i)=>i===0||!same(points[i-1],p));
}
function score(points,obstacles,start,end){
  const trimmed=points.slice(1,-1);
  const hits=routeCollisions(trimmed,obstacles,.040)
    .filter(h=>!((h.segment===0&&dist(points[0],start)<.01)||
      (h.segment===trimmed.length-2&&dist(points.at(-1),end)<.01)));
  const length=points.slice(1).reduce((n,p,i)=>n+dist(points[i],p),0);
  return {hits,length,score:hits.length*10000+length+points.length*.085};
}
function sideAccess(point,normal,cfg,edge,lane,rearY,role,id){
  const left=cfg.x-cfg.w/2,right=cfg.x+cfg.w/2;
  const outerRight=Math.max(1.87,right+.46)+lane*.055;
  const outerLeft=Math.min(-3.83,left-.24)-lane*.012;
  const x=edge==='left'?outerLeft:outerRight;
  const isBoardEnd=role==='board',isFront=role==='front',isPsu=role==='psu';
  const p=point;
  if(isBoardEnd){
    // La clavija ya está fuera del header; cruzar al borde sobre la PCB,
    // caer a la cámara posterior sólo cuando x queda fuera de la bandeja.
    return dedupe([p,v(x,p[1],p[2]),v(x,rearY,p[2])]);
  }
  if(isPsu){
    // Salir de la fuente hasta el pasillo libre junto al shroud.
    return dedupe([p,v(1.14,p[1],p[2]),v(1.14,rearY,p[2]),
      v(outerRight,rearY,p[2])]);
  }
  if(isFront){
    // Los mazos de la botonera nunca atraviesan la placa por el aire.
    return dedupe([p,v(2.12,p[1],p[2]),v(outerRight,p[1],p[2]),
      v(outerRight,rearY,p[2])]);
  }
  if(role==='drive'){
    // Ambos discos comparten jaula; SATA sale por el borde X izquierdo.
    // Evita atravesar los estantes antes de entrar a la canaleta posterior.
    const outside=HDD_BAY_LAYOUT.insideX[0]-.17;
    return dedupe([p,v(outside,p[1],p[2]),
      v(outside,rearY,p[2]),v(outerRight,rearY,p[2])]);
  }
  if(role==='caseRear')
    return dedupe([p,v(outerLeft,p[1],p[2]),v(outerLeft,rearY,p[2])]);
  return dedupe([p,v(outerRight,p[1],p[2]),v(outerRight,rearY,p[2])]);
}
function routeVariant(id,cfg,start,end,startRole,endRole,edge,lane,rearY,mode){
  const left=cfg.x-cfg.w/2,right=cfg.x+cfg.w/2;
  const zTop=cfg.z-cfg.d/2-.25,zBottom=cfg.z+cfg.d/2+.30;
  const from=sideAccess(start,null,cfg,startRole==='board'?edge:'right',
    lane,rearY,startRole,id);
  const to=sideAccess(end,null,cfg,endRole==='board'?edge:'right',
    lane,rearY,endRole,id);
  let first=from.at(-1),last=to.at(-1);
  const rightCorr=Math.max(1.87,right+.46)+lane*.055;
  const leftCorr=Math.min(-3.83,left-.24)-lane*.012;
  const transit=mode==='top'?zTop:mode==='bottom'?zBottom:
    mode==='shroud'?3.69:null;
  const route=[...from];
  if(edge==='left'&&endRole==='board'||edge==='left'&&startRole==='board'){
    // El mazo EPS / SYS_FAN trasero discurre detrás de toda la bandeja
    // y rodea el shroud por debajo; no perfora el PCB.
    route.push(v(first[0],rearY,3.67),v(rightCorr,rearY,3.67));
    if(last[0]===leftCorr){
      route.push(v(rightCorr,rearY,last[2]),v(leftCorr,rearY,last[2]));
    }else route.push(v(rightCorr,rearY,last[2]));
  }else if(transit!==null){
    route.push(v(first[0],rearY,transit),v(rightCorr,rearY,transit),
      v(rightCorr,rearY,last[2]));
  }else{
    route.push(v(rightCorr,rearY,first[2]),v(rightCorr,rearY,last[2]));
  }
  // En el último tramo, conectar desde el pasillo a la rodilla sin
  // interpolación diagonal que pueda cortar GPU, DIMM o placa.
  if(!same(route.at(-1),last)){
    route.push(v(last[0],rearY,route.at(-1)[2]),last);
  }
  route.push(...to.slice(0,-1).reverse());
  return dedupe(route);
}
export function planCableRoute({id,cfg,start,end,startRole='psu',endRole='board',
  gpuChoice='rx7600',storageChoice='nvmeSSD'}){
  const obstacles=cableObstacles(cfg,gpuChoice,storageChoice);
  const lanes={atx24:0,eps:1,gpu:2,sataPower:3,sataData:4,
    frontPanel:5,frontUsb3:6,frontUsbC:7,fan:8,
    caseFan0:9,caseFan1:10,caseFan2:11};
  const lane=lanes[id]??0;
  // La cámara de cables discurre detrás del plano de bandeja (-Y).
  const rearY=-.668-(lane%3)*.008;
  // EPS y SYS_FAN trasero salen por el borde izquierdo; los restantes
  // utilizan pasacables del canto derecho, como en una torre ATX real.
  const preferLeft=id==='eps'||id==='caseFan2';
  const edge=preferLeft?'left':'right';
  // Los cables CPU_FAN sólo recorren la zona superior a la placa; no
  // necesitan llegar a la cámara posterior.
  if(id==='fan'){
    const roof=3.56,top=cfg.z-cfg.d/2-.14;
    const points=dedupe([start,[start[0],roof,start[2]],
      [start[0],roof,top],[end[0],roof,top],
      [end[0],roof,end[2]],end]);
    return {points,strategy:'upper-edge',collisions:[],obstacles};
  }
  let best;
  for(const mode of ['direct','top','bottom','shroud']){
    const points=routeVariant(id,cfg,start,end,startRole,endRole,
      edge,lane,rearY,mode);
    const result=score(points,obstacles,start,end);
    if(!best||result.score<best.score)
      best={points,strategy:mode,collisions:result.hits,score:result.score};
  }
  return {...best,obstacles};
}

// Tramos rectos y curvas locales con un fillet comprobado contra obstáculos.
// Nunca usar CatmullRom global para el interior: recorta las esquinas.
export function createSafeCableCurve(THREE,points,obstacles=[]){
  const nodes=points.map(p=>new THREE.Vector3(...p));
  const curve=new THREE.CurvePath();
  if(nodes.length<2)return curve;
  let previous=nodes[0].clone();
  for(let i=1;i<nodes.length-1;i++){
    const a=nodes[i-1],b=nodes[i],c=nodes[i+1];
    const vin=b.clone().sub(a),vout=c.clone().sub(b);
    if(vin.length()<1e-5||vout.length()<1e-5)continue;
    const inDir=vin.normalize(),outDir=vout.normalize();
    if(inDir.dot(outDir)>.992)continue;
    let radius=Math.min(.12,b.distanceTo(a)*.22,b.distanceTo(c)*.22);
    let entry=b.clone(),exit=b.clone();
    for(let tries=0;tries<6;tries++){
      const e=b.clone().addScaledVector(inDir,-radius),
        x=b.clone().addScaledVector(outDir,radius);
      const bend=new THREE.QuadraticBezierCurve3(e,b,x);
      const samples=bend.getPoints(8).map(v=>v.toArray());
      if(routeCollisions(samples,obstacles,.018).length===0){
        entry=e;exit=x;break;
      }
      radius*=.5;
    }
    if(previous.distanceTo(entry)>1e-5)
      curve.add(new THREE.LineCurve3(previous.clone(),entry.clone()));
    if(entry.distanceTo(exit)>1e-5)
      curve.add(new THREE.QuadraticBezierCurve3(entry.clone(),b.clone(),exit.clone()));
    previous=exit;
  }
  if(previous.distanceTo(nodes.at(-1))>1e-5)
    curve.add(new THREE.LineCurve3(previous,nodes.at(-1)));
  return curve;
}
