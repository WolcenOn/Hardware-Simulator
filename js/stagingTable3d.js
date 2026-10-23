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
  function textTexture(lines){
    const c=document.createElement('canvas');c.width=512;c.height=128;
    const ctx=c.getContext('2d');
    ctx.fillStyle='#142338';ctx.fillRect(0,0,512,128);
    ctx.strokeStyle='#517c8b';ctx.lineWidth=5;ctx.strokeRect(2,2,508,124);
    ctx.fillStyle='#d2f1f5';ctx.textAlign='center';
    ctx.font='bold 34px system-ui';
    ctx.fillText(String(lines||'Pieza').slice(0,24),256,55,476);
    return new THREE.CanvasTexture(c);
  }
  // Dibujos de piezas identificables por silueta, proporción y color.
  function model(group,category,id){
    const part=new THREE.Group();group.add(part);
    const m=(w,h,d,x,y,z,c)=>mesh(part,w,h,d,x,y,z,c);
    switch(category){
      case 'case':
        m(2.25,1.7,1.95,0,1.01,0,steel);
        m(1.95,1.3,.06,0,1.05,1,plastic);
        break;
      case 'motherboard':
        m(2.30,.14,2.30,0,.24,0,pcb);
        m(.65,.12,.65,-.35,.38,-.39,steel);
        for(let k=0;k<4;k++)m(.12,.12,1.20,.65+k*.20-.28,.38,.32,plastic);
        break;
      case 'cpu':
        m(.95,.20,.95,0,.34,0,steel);m(.68,.035,.68,0,.47,0,chip);
        break;
      case 'ram':
        for(const x of [-.30,.30]){
          m(.16,.52,1.75,x,.59,0,pcb);
          m(.18,.10,1.74,x,.80,0,plastic);
          m(.17,.05,1.65,x,.29,0,gold);
        }
        break;
      case 'cooler':
        m(1.38,.95,1.38,0,.80,0,steel);
        for(let z=-.45;z<=.45;z+=.22)m(1.47,.04,.10,0,1.31,z,plastic);
        break;
      case 'storage':
        if(/nvme/i.test(id)){m(1.65,.12,.42,0,.33,0,pcb);m(.52,.07,.37,-.33,.43,0,chip);}
        else {m(2.12,.30,1.27,0,.38,0,steel);m(1.20,.03,.77,0,.56,0,plastic);}
        break;
      case 'gpu':
        m(2.80,.43,1.04,0,.52,0,plastic);
        for(const x of [-.70,.70]){
          const rotor=new THREE.Mesh(new THREE.CylinderGeometry(.33,.33,.06,20),steel);
          rotor.position.set(x,.78,0);part.add(rotor);
        }
        m(2.55,.055,.16,0,.29,.53,gold);
        break;
      case 'psu':
        m(1.97,1.22,1.90,0,.77,0,steel);
        m(1.57,.04,1.46,0,1.40,0,plastic);
        break;
      default: // consumibles, herramientas, cables y periféricos
        if(/paste/i.test(id)){
          m(.32,.24,1.53,0,.34,0,steel);
          m(.16,.16,.47,0,.33,-.88,gold);
        } else if(/screw|ioShield/i.test(id)){
          m(1.48,.12,1.12,0,.31,0,steel);
        } else if(/fan/i.test(id)){
          m(1.37,.19,1.37,0,.37,0,plastic);
          const rotor=new THREE.Mesh(new THREE.CylinderGeometry(.48,.48,.05,20),steel);
          rotor.position.set(0,.52,0);part.add(rotor);
        } else if(/keyboard/i.test(id)){
          m(2.5,.13,.86,0,.31,0,plastic);
        } else if(/mouse/i.test(id)){
          const mouse=new THREE.Mesh(new THREE.SphereGeometry(.52,16,12),plastic);
          mouse.scale.set(.67,.36,1);mouse.position.set(0,.44,0);part.add(mouse);
        } else {
          m(1.28,.48,1.03,0,.51,0,plastic);
        }
    }
    return part;
  }
  const stockGroups=new Map();
  let selectedKey='';
  let overflow=0;
  function update(items=[],selected=''){
    selectedKey=selected;
    const available=items.filter(v=>v.quantity>0).slice(0,12);
    const keys=new Set(available.map(v=>v.key));
    for(const [key,group] of stockGroups){
      if(!keys.has(key)){
        root.remove(group);
        group.traverse(node=>{
          if(node.isMesh)node.geometry.dispose();
          const material=node.material;
          if(material?.map){material.map.dispose();material.dispose();}
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
        const tx=textTexture(item.label);
        const label=new THREE.Mesh(new THREE.PlaneGeometry(3.9,.98),
          new THREE.MeshBasicMaterial({map:tx,transparent:true,side:THREE.DoubleSide}));
        label.rotation.x=-Math.PI/2;label.position.set(0,.02,1.23);
        g.add(label);
      }
      g.position.set(slots[i].x,-.22,slots[i].z);
      const highlighted=item.key===selectedKey;
      g.scale.setScalar(highlighted?1.09:1);
      g.userData.stageItem=true;g.userData.stageKey=item.key;
    });
    overflow=Math.max(0,items.filter(v=>v.quantity>0).length-12);
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
  return {root,update,identify,get overflow(){return overflow;},layout:STAGING_LAYOUT};
}
