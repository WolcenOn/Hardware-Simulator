// Panel 3D de práctica: terminales seleccionables, NO representación de cara física.
export function createPinoutBoard(THREE,scene,definitions){
  const root=new THREE.Group();root.name='Panel de puntos eléctricos de la PSU';
  root.position.set(11.2,0,-8.4);scene.add(root);
  const back=new THREE.MeshStandardMaterial({color:0x253949,metalness:.4,roughness:.68});
  const rim=new THREE.MeshStandardMaterial({color:0x6b8c9d,metalness:.76,roughness:.38});
  const inactive=new THREE.MeshStandardMaterial({color:0x344f5c,roughness:.68});
  const contacts=new Map();
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
  for(const [id,config]of Object.entries(layouts)){
    const def=definitions[id];if(!def)continue;
    const headline=print(config.label,id==='atx24'?4.2:id==='sata15'?4.5:3,.40);
    headline.position.set(config.x,config.y+.64,.1);root.add(headline);
    const rows=def.rows,cols=def.columns;
    box(root,Math.max(1.1,cols*config.step+.23),rows*.43+.29,.2,
      config.x,config.y,-.03,inactive);
    for(const p of def.pins){
      const idx=p.number-1,row=Math.floor(idx/cols),col=idx%cols;
      const holder=new THREE.Group();
      holder.position.set(config.x+(col-(cols-1)/2)*config.step,
        config.y+(rows-1)/2*.43-row*.43,.23);
      holder.userData.pinoutConnector=id;holder.userData.pinoutPin=p.number;
      holder.name=id+' · pin '+p.number+' · '+p.signal;
      root.add(holder);
      const material=new THREE.MeshStandardMaterial({color:p.rail==='gnd'?0x667a85:
        p.rail==='12v'?0xffc857:p.rail==='5v'?0xf26c65:
        p.rail==='3v3'?0xf7a956:p.rail==='5vsb'?0xb392eb:
        p.rail==='nc'?0x768d94:0x6de1bf,metalness:.55,roughness:.42,
        emissive:0x000000,emissiveIntensity:.32});
      const terminal=new THREE.Mesh(new THREE.CylinderGeometry(.16,.16,.16,18),material);
      terminal.rotation.x=Math.PI/2;terminal.position.z=.05;holder.add(terminal);
      // Etiqueta numérica visible sobre el metal, seleccionable con click/raycast.
      const t=print(String(p.number),.32,.22);
      t.position.set(0,0,.15);holder.add(t);
      contacts.set(id+':'+p.number,{holder,material});
    }
  }
  const legend=print('ESQUEMA DE PINES NUMERADOS · NO LADO MODULAR PSU',8.4,.38);
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
