// Panel 3D de práctica: terminales seleccionables, NO representación de cara física.
export function createPinoutBoard(THREE,scene,definitions){
  const root=new THREE.Group();root.name='Panel de puntos eléctricos de la PSU';
  root.position.set(11.2,0,-8.4);scene.add(root);
  const back=new THREE.MeshStandardMaterial({color:0x253949,metalness:.4,roughness:.68});
  const rim=new THREE.MeshStandardMaterial({color:0x6b8c9d,metalness:.76,roughness:.38});
  const inactive=new THREE.MeshStandardMaterial({color:0x344f5c,roughness:.68});
  const contacts=new Map();
  const physics=window.PC_PINOUTS;
  function box(parent,w,h,d,x,y,z,mat){
    const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);
    mesh.position.set(x,y,z);parent.add(mesh);return mesh;
  }
  function print(text,width=3,scale=.55){
    const c=document.createElement('canvas');c.width=512;c.height=96;
    const ctx=c.getContext('2d');
    ctx.fillStyle='#d5ffee';ctx.font='bold 46px system-ui';ctx.textAlign='center';
    ctx.fillText(text,256,65,490);
    const tx=new THREE.CanvasTexture(c);tx.colorSpace=THREE.SRGBColorSpace;
    const mesh=new THREE.Mesh(new THREE.PlaneGeometry(width,scale),
      new THREE.MeshBasicMaterial({map:tx,transparent:true,side:THREE.DoubleSide}));
    return mesh;
  }
  box(root,9.55,7.5,.33,0,12.45,-.2,back);
  for(const x of [-4.5,4.5]){
    box(root,.15,1.8,.65,x,8.1,-.4,rim);
    for(const y of [9.1,15.8]){
      const screw=new THREE.Mesh(new THREE.CylinderGeometry(.12,.12,.10,16),rim);
      screw.rotation.x=Math.PI/2;screw.position.set(x,y,.1);root.add(screw);
    }
  }
  const title=print('PSU · PINOUT DE PRUEBAS',7.8,.75);
  title.position.set(0,15.7,.07);root.add(title);
  const layouts={
    atx24:{x:0,y:14.45,step:.65,label:'ATX 24 · PLACA'},
    eps8:{x:-2.5,y:12.58,step:.73,label:'EPS 8 · CPU'},
    pcie8:{x:2.55,y:12.58,step:.73,label:'PCIe 8 · GPU'},
    sata15:{x:0,y:10.7,step:.54,label:'SATA 15 · POWER'}
  };
  function cavity(shape,material){
    const radius=.14,cut=.045;
    const points=shape==='bevel'?[
      [-radius+cut,-radius],[radius-cut,-radius],[radius,-radius+cut],
      [radius,radius-cut],[radius-cut,radius],[-radius+cut,radius],
      [-radius,radius-cut],[-radius,-radius+cut]
    ]:shape==='blade'?[
      [-radius,-.07],[radius,-.07],[radius,.07],[-radius,.07]
    ]:[
      [-radius,-radius],[radius,-radius],[radius,radius],[-radius,radius]
    ];
    const shape2=new THREE.Shape();
    shape2.moveTo(...points[0]);
    for(const point of points.slice(1))shape2.lineTo(...point);
    shape2.closePath();
    return new THREE.Mesh(new THREE.ExtrudeGeometry(shape2,{
      depth:.085,bevelEnabled:false
    }),material);
  }
  for(const [id,config]of Object.entries(layouts)){
    const def=definitions[id];if(!def)continue;
    const headline=print(config.label,id==='atx24'?4.2:id==='sata15'?4.5:3,.40);
    headline.position.set(config.x,config.y+.64,.1);root.add(headline);
    const rows=def.rows,cols=def.columns;
    const housing=physics.HOUSINGS[id];
    const clipMat=new THREE.MeshStandardMaterial({color:0x80949d,roughness:.55});
    const bracket=box(root,id==='atx24'?1.14:.8,.12,.45,
      config.x,config.y+(rows-1)*.215+.38,.09,clipMat);
    if(housing.clip){
      bracket.name=id+' · clip de retención, arriba';
      box(root,id==='atx24'?1.65:1.15,.09,.35,
        config.x,bracket.position.y+.13,.12,back);
    }else{
      bracket.name=id+' · guía de inserción SATA en L';
      box(root,.20,.43,.30,config.x-cols*config.step/2-.10,
        config.y-.02,.20,clipMat);
      box(root,.85,.08,.30,config.x-cols*config.step/2+.28,
        config.y-.28,.20,clipMat);
    }
    if(housing.split){
      const separations={atx24:2,eps8:2,pcie8:1};
      const boundary=cols-separations[id]-.5;
      const x=config.x+(boundary-(cols-1)/2)*config.step;
      box(root,.075,rows*.47+.25,.26,x,config.y,.16,clipMat).name=
        id+' · separación de cable '+housing.split;
    }
    box(root,Math.max(1.1,cols*config.step+.23),rows*.43+.29,.2,
      config.x,config.y,-.03,inactive);
    for(const p of [...def.pins].sort((a,b)=>a.number-b.number)){
      const idx=p.number-1,row=rows===2?(idx<cols?1:0):0,col=idx%cols;
      const holder=new THREE.Group();
      holder.position.set(config.x+(col-(cols-1)/2)*config.step,
        config.y+(rows-1)/2*.43-row*.43,.23);
      holder.userData.pinoutConnector=id;holder.userData.pinoutPin=p.number;
      holder.name=id+' · pin '+p.number+' · '+p.signal+' · cable '+
        (window.PC_PINOUTS?.colorName?.(p)||'sin referencia');
      root.add(holder);
      // Mismo color de línea que el esquema 2D. El color real del cable no
      // está garantizado por el estándar ni se aplica al lado modular PSU.
      const hex=window.PC_PINOUTS?.COLORS?.[p.color]||'#80949e';
      const material=new THREE.MeshStandardMaterial({color:parseInt(hex.slice(1),16),
        metalness:.55,roughness:.42,emissive:0x000000,emissiveIntensity:.32});
      const sleeve=new THREE.Mesh(new THREE.CylinderGeometry(.14,.14,.38,16),material);
      sleeve.rotation.x=Math.PI/2;sleeve.position.z=-.21;holder.add(sleeve);
      const terminal=cavity(physics.keyShape(id,p.number),material);
      terminal.position.z=.05;holder.add(terminal);
      const border=new THREE.Mesh(new THREE.BoxGeometry(.33,.33,.04),
        new THREE.MeshStandardMaterial({color:0x101e29,roughness:.82}));
      border.position.z=-.08;holder.add(border);
      if(p.wireColors?.length>1){
        // P13 ATX: retorno marrón sense junto al +3,3 V naranja.
        const extra=window.PC_PINOUTS?.COLORS?.[p.wireColors[1]]||'#a57b58';
        const stripe=new THREE.Mesh(new THREE.BoxGeometry(.10,.30,.09),
          new THREE.MeshStandardMaterial({color:parseInt(extra.slice(1),16)}));
        stripe.position.set(.07,-.07,.14);holder.add(stripe);
      }
      // Etiqueta numérica visible sobre el metal, seleccionable con click/raycast.
      const t=print(String(p.number),.32,.22);
      t.position.set(0,0,.15);holder.add(t);
      contacts.set(id+':'+p.number,{holder,material});
    }
  }
  const legend=print('CARA DE CONTACTOS · PESTAÑA SUPERIOR / SATA L · NO LADO PSU',8.7,.38);
  legend.position.set(0,9.2,.12);root.add(legend);
  function identify(object){
    let cursor=object;
    while(cursor&&cursor!==root){
      if(cursor.userData?.pinoutConnector&&cursor.userData?.pinoutPin)
        return {connector:cursor.userData.pinoutConnector,pin:cursor.userData.pinoutPin};
      cursor=cursor.parent;
    }
    return null;
  }
  function highlight(connector,red,black){
    for(const [id,obj]of contacts){
      const redOn=id===connector+':'+red,blackOn=id===connector+':'+black;
      obj.material.emissive.setHex(redOn?0x941f2b:blackOn?0x1665aa:0x000000);
      obj.holder.scale.setScalar(redOn||blackOn?1.20:1);
    }
  }
  highlight('atx24',10,3);
  return {root,identify,highlight,contacts:()=>contacts.size};
}
