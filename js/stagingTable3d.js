// Mesa auxiliar de preparación para el modo aventura 8.2.
// 1 unidad = 50 mm. Es una representación 3D educativa de las piezas
// adquiridas, no modelos CAD detallados ni un nuevo lugar de instalación.
export const STAGING_LAYOUT=Object.freeze({
  centerX:18.5,centerZ:.35,width:16.5,depth:17,
  columns:3,rows:4
});
export function createStagingTable(THREE,scene){
  const root=new THREE.Group();root.name='Mesa auxiliar / piezas compradas';
  scene.add(root);
  const mat=(color,metalness=.22,roughness=.69)=>
    new THREE.MeshStandardMaterial({color,metalness,roughness});
  const tabletop=mat(0x414e59),rail=mat(0x7f9ba8,.7,.39),
    pad=mat(0x121f29),pcb=mat(0x146052),chip=mat(0x1e2c36),
    gold=mat(0xc4a466,.5),steel=mat(0x9faeba,.62,.38),
    plastic=mat(0x232f3a),labelInk=mat(0x182d41);
  const mesh=(parent,w,h,d,x,y,z,m)=>{
    const object=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);
    object.position.set(x,y,z);object.receiveShadow=true;
    object.castShadow=true;parent.add(object);return object;
  };
  const {centerX,centerZ,width,depth}=STAGING_LAYOUT;
  mesh(root,width,.26,depth,centerX,-.49,centerZ,tabletop);
  mesh(root,width-.22,.035,depth-.22,centerX,-.34,centerZ,rail);
  for(const x of [centerX-width/2+.45,centerX+width/2-.45])
    for(const z of [centerZ-depth/2+.52,centerZ+depth/2-.52])
      mesh(root,.22,2,.22,x,-1.60,z,rail);
  mesh(root,width-.48,.05,depth-.46,centerX,-.30,centerZ,pad);
  const slots=[];
  const xStart=centerX-4.9,zStart=centerZ-5.8;
  for(let row=0;row<STAGING_LAYOUT.rows;row++)
    for(let col=0;col<STAGING_LAYOUT.columns;col++){
      const x=xStart+col*4.9,z=zStart+row*3.85;
      mesh(root,4.48,.025,3.43,x,-.255,z,
        new THREE.MeshStandardMaterial({color:(row+col)%2?0x1d303d:0x1b2b39,roughness:.91}));
      slots.push({x,z});
    }
  // Etiquetas flotantes legibles desde la cámara, no pegadas al suelo.
  function textTexture(name,quantity){
    const c=document.createElement('canvas');c.width=1024;c.height=256;
    const ctx=c.getContext('2d');
    ctx.fillStyle='#071522';ctx.fillRect(0,0,1024,256);
    ctx.fillStyle='#0b3b51';ctx.fillRect(0,0,1024,20);
    ctx.lineWidth=10;ctx.strokeStyle='#68c7e5';ctx.strokeRect(6,5,1012,245);
    ctx.font='bold 55px system-ui';ctx.fillStyle='#f3fbff';ctx.textAlign='center';
    const words=String(name||'Pieza').split(/\s+/);
    const lines=[''];for(const word of words){
      const n=lines.length-1,combined=(lines[n]+' '+word).trim();
      if(ctx.measureText(combined).width>880&&lines[n]&&lines.length<2)
        lines.push(word);
      else lines[n]=combined;
    }
    if(lines[1]&&ctx.measureText(lines[1]).width>900)
      lines[1]=lines[1].slice(0,25)+'…';
    const top=lines.length===1?117:88;
    lines.forEach((line,k)=>ctx.fillText(line,512,top+k*66,926));
    ctx.font='bold 38px system-ui';ctx.fillStyle='#94ebd1';
    ctx.fillText('EN MESA  ×'+quantity,512,224);
    const texture=new THREE.CanvasTexture(c);
    texture.colorSpace=THREE.SRGBColorSpace;
    return texture;
  }
  // Geometrías de exposición 3D: caja ATX miniaturizada, tornillos
  // individuales, jeringa de pasta y periféricos reconocibles.
  const pale=mat(0xe5e9e9,.05,.47),blue=mat(0x3688bb,.24,.48),
    cyan=mat(0x7ad5ef,.30,.30),graphite=mat(0x11181e,.32,.42),
    glass=new THREE.MeshStandardMaterial({color:0x83aeca,transparent:true,
      opacity:.40,depthWrite:false,metalness:.22,roughness:.13}),
    red=mat(0xe48e67,.30,.5);
  function cylinder(parent,rTop,rBottom,height,x,y,z,m,segments=24){
    const object=new THREE.Mesh(new THREE.CylinderGeometry(rTop,rBottom,height,segments),m);
    object.position.set(x,y,z);object.castShadow=true;parent.add(object);
    return object;
  }
  function line(parent,points,radius,m){
    const curve=new THREE.CatmullRomCurve3(points.map(v=>new THREE.Vector3(...v)));
    const obj=new THREE.Mesh(new THREE.TubeGeometry(curve,15,radius,6,false),m);
    parent.add(obj);return obj;
  }
  function model(group,category,id){
    const part=new THREE.Group();group.add(part);
    const m=(w,h,d,x,y,z,c)=>mesh(part,w,h,d,x,y,z,c);
    switch(category){
      case 'case':{
        // Torre vacía, pequeña pero con chasis, cristal, bahías y ventiladores.
        m(2.44,.14,2.60,0,.24,0,steel);
        m(2.44,.13,2.60,0,2.78,0,graphite);
        for(const x of [-1.13,1.13])for(const z of [-1.20,1.20])
          m(.12,2.55,.12,x,1.47,z,steel);
        m(2.31,2.48,.10,0,1.51,-1.26,plastic);
        m(2.31,2.48,.075,0,1.51,1.26,graphite);
        m(.07,2.45,2.36,-1.22,1.51,0,glass);
        for(const y of [.78,1.58,2.31]){
          const rotor=cylinder(part,.28,.28,.05,0,y,1.34,steel,24);
          rotor.rotation.x=Math.PI/2;
          m(.75,.035,.75,0,y,1.39,graphite);
        }
        for(const x of [-.90,.90])for(const z of [-1,.95])
          m(.24,.20,.24,x,.09,z,plastic);
        m(.50,.08,.17,.63,2.86,1.0,cyan);
        break;
      }
      case 'motherboard':
        m(2.40,.11,2.35,0,.25,0,pcb);
        m(.70,.18,.66,-.47,.42,-.53,steel);
        m(.55,.13,.47,-.40,.53,-.53,chip);
        for(let k=0;k<4;k++)m(.12,.26,1.25,.28+k*.23,.47,.38,plastic);
        for(let k=0;k<3;k++)m(.34,.28,.18,-1.11,.50,-.82+k*.65,steel);
        m(.63,.10,.38,-.56,.41,.71,chip);
        m(1.26,.10,.18,-.13,.35,1.07,graphite);
        break;
      case 'cpu':
        m(.92,.13,.92,0,.32,0,gold);m(.82,.14,.82,0,.44,0,steel);
        m(.58,.02,.58,0,.52,0,chip);break;
      case 'ram':
        for(const x of [-.30,.30]){
          m(.16,.46,1.90,x,.59,0,pcb);
          m(.20,.10,1.80,x,.84,0,graphite);
          for(let z=-.69;z<.8;z+=.36)m(.19,.13,.20,x,.64,z,chip);
          m(.16,.04,1.62,x,.32,0,gold);
        }
        break;
      case 'cooler':
        m(1.49,.78,1.49,0,.75,0,steel);
        for(let z=-.58;z<=.6;z+=.19)m(1.55,.035,.09,0,1.19,z,graphite);
        cylinder(part,.54,.54,.08,0,1.28,0,blue);break;
      case 'storage':
        if(/nvme/i.test(id)){
          m(1.78,.09,.48,0,.33,0,pcb);
          m(.53,.08,.39,-.45,.42,0,chip);
          for(const x of [.04,.38,.74])m(.23,.09,.32,x,.40,0,plastic);
          m(.10,.09,.44,-.88,.34,0,gold);
        }else{
          m(2.14,.35,1.30,0,.42,0,steel);
          m(1.76,.018,.93,0,.61,0,id.startsWith('hdd')?blue:graphite);
          m(.38,.08,.14,-.72,.46,.65,gold);
        }break;
      case 'gpu':
        m(2.91,.43,1.25,0,.58,0,graphite);
        m(2.77,.08,1.15,0,.84,0,steel);
        for(const x of [-.76,.76]){
          cylinder(part,.43,.43,.07,x,.91,0,plastic,28);
          cylinder(part,.16,.16,.09,x,.98,0,steel,20);
        }
        m(2.54,.045,.13,0,.32,.60,gold);
        m(.10,.24,1.44,-1.50,.55,0,steel);break;
      case 'psu':
        m(2.08,1.30,1.96,0,.85,0,graphite);
        m(1.98,.07,1.84,0,1.53,0,steel);
        cylinder(part,.61,.61,.08,0,1.59,0,plastic);
        for(let x=-.55;x<=.56;x+=.28)
          m(.045,.025,1.30,x,1.66,0,steel);
        for(const x of [-.62,0,.62])m(.34,.29,.10,x,.68,.99,graphite);
        break;
      default:
        if(id==='screws'){
          // Bolsa y tornillos independientes: cabezas ranuradas visibles.
          m(2.16,.10,1.23,0,.28,0,plastic);
          for(let i=0;i<10;i++){
            const x=-.75+(i%5)*.39,z=-.32+Math.floor(i/5)*.65;
            cylinder(part,.115,.115,.08,x,.39,z,steel,12);
            cylinder(part,.054,.065,.22,x,.53,z,gold,10);
            m(.14,.015,.026,x,.65,z,graphite);
          }
        }else if(id==='paste'){
          // Jeringa tumbada, etiqueta y boquilla diferenciables.
          const barrel=cylinder(part,.22,.23,1.53,0,.53,0,pale,20);
          barrel.rotation.x=Math.PI/2;
          const band=cylinder(part,.234,.234,.63,0,.53,.17,blue,20);
          band.rotation.x=Math.PI/2;
          const nozzle=cylinder(part,.075,.14,.40,0,.53,-.91,red,18);
          nozzle.rotation.x=Math.PI/2;
          const plunger=cylinder(part,.09,.09,.32,0,.53,.91,steel);
          plunger.rotation.x=Math.PI/2;
          m(.52,.08,.17,0,.53,1.12,graphite);
        }else if(id==='screwdriver'){
          const grip=cylinder(part,.21,.21,1.33,0,.50,.32,red);
          grip.rotation.x=Math.PI/2;
          const shaft=cylinder(part,.075,.075,1.30,0,.50,-.77,steel);
          shaft.rotation.x=Math.PI/2;
          m(.21,.12,.12,0,.50,-1.48,steel);
        }else if(id==='ioShield'){
          for(const z of [-.59,.59])m(1.72,.11,.12,0,.34,z,steel);
          for(const x of [-.79,.79])m(.12,.11,1.30,x,.34,0,steel);
          for(let k=0;k<4;k++)m(.19,.06,.24,-.40+k*.28,.35,0,plastic);
        }else if(id==='fan'){
          m(1.49,.23,1.49,0,.34,0,graphite);
          cylinder(part,.55,.55,.04,0,.49,0,steel,28);
          cylinder(part,.17,.17,.11,0,.57,0,plastic,18);
          for(const x of [-.64,.64])for(const z of [-.64,.64])
            cylinder(part,.045,.045,.08,x,.50,z,gold,10);
        }else if(id==='keyboard'){
          m(2.67,.13,1.06,0,.31,0,graphite);
          for(let row=0;row<4;row++)for(let col=0;col<13;col++)
            m(.15,.025,.15,-1.17+col*.19,.40,-.37+row*.22,steel);
        }else if(id==='mouse'){
          const mouse=new THREE.Mesh(new THREE.SphereGeometry(.52,16,12),graphite);
          mouse.scale.set(.68,.39,1);mouse.position.set(0,.45,0);part.add(mouse);
          m(.028,.012,.33,0,.65,-.28,steel);
        }else if(id==='hdmi'||id==='sataCable'){
          line(part,[[-.92,.36,0],[-.48,.42,.65],[.12,.45,.58],
            [.78,.38,.05]],.050,id==='hdmi'?graphite:blue);
          for(const x of [-.92,.78])m(.41,.19,.27,x,.42,0,steel);
        }else if(id==='osusb'){
          m(.65,.30,1.73,0,.39,0,blue);m(.44,.19,.41,0,.39,-1.05,steel);
        }else{
          m(1.48,.48,1.10,0,.52,0,plastic);
          m(1.12,.02,.60,0,.79,0,blue);
        }
    }
    return part;
  }
  const stockGroups=new Map();
  let selectedKey='',page=0,allItems=[],overflow=0;
  function update(items=[],selected=''){
    selectedKey=selected;
    allItems=items.filter(v=>v.quantity>0);
    const count=Math.max(1,Math.ceil(allItems.length/12));
    page=Math.max(0,Math.min(page,count-1));
    const available=allItems.slice(page*12,(page+1)*12);
    const keys=new Set(available.map(v=>v.key));
    for(const [key,group] of stockGroups){
      if(!keys.has(key)){
        root.remove(group);
        group.traverse(node=>{
          if(node.isMesh)node.geometry.dispose();
          const material=node.material;
          if(material?.map){material.map.dispose();material.dispose();}
          if(node.isSprite){node.material?.map?.dispose();node.material?.dispose();}
        });
        stockGroups.delete(key);
      }
    }
    available.forEach((item,i)=>{
      let g=stockGroups.get(item.key);
      if(!g){
        g=new THREE.Group();g.name='Bandeja: '+item.label;
        g.userData.stageKey=item.key;g.userData.stageItem=true;
        root.add(g);stockGroups.set(item.key,g);
        model(g,item.category,item.id);
        const tx=textTexture(item.label,item.quantity);
        const label=new THREE.Sprite(new THREE.SpriteMaterial({
          map:tx,transparent:true,depthTest:false,depthWrite:false
        }));
        label.position.set(0,1.90,1.30);
        label.scale.set(4.18,1.05,1);
        label.renderOrder=12;
        label.userData.stagingLabel=true;
        g.add(label);
        g.userData.labelSprite=label;
        g.userData.quantity=item.quantity;
      }
      if(g.userData.quantity!==item.quantity){
        const sprite=g.userData.labelSprite;
        if(sprite){
          sprite.material.map.dispose();
          sprite.material.map=textTexture(item.label,item.quantity);
          sprite.material.needsUpdate=true;
        }
        g.userData.quantity=item.quantity;
      }
      g.position.set(slots[i].x,-.22,slots[i].z);
      const highlighted=item.key===selectedKey;
      g.scale.setScalar(highlighted?1.09:1);
      g.userData.stageItem=true;g.userData.stageKey=item.key;
    });
    overflow=Math.max(0,allItems.length-(page+1)*12);
  }
  // Los modelos se seleccionan a través de raycasting sobre meshes de su grupo.
  function identify(object){
    let p=object;
    while(p&&p!==root){
      if(p.userData?.stageKey)return p.userData.stageKey;
      p=p.parent;
    }
    return null;
  }
  function turnPage(step){
    const count=Math.max(1,Math.ceil(allItems.length/12));
    page=(page+step+count)%count;
    update(allItems,selectedKey);
    return page+1;
  }
  function getPageInfo(){
    return {page:page+1,pages:Math.max(1,Math.ceil(allItems.length/12)),
      total:allItems.length};
  }
  return {root,update,identify,turnPage,getPageInfo,
    get overflow(){return overflow;},layout:STAGING_LAYOUT};
}
