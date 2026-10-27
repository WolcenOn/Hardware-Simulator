// Estantería procedural independiente del chasis y la mesa de piezas.
export function createToolRack(THREE,scene){
 const root=new THREE.Group();root.name='Estantería del taller';
 root.position.set(11.2,0,-8.4);scene.add(root);
 const metal=new THREE.MeshStandardMaterial({color:0x506576,metalness:.72,roughness:.43});
 const dark=new THREE.MeshStandardMaterial({color:0x213440,roughness:.75});
 const warm=new THREE.MeshStandardMaterial({color:0xf1a957,roughness:.6});
 const mint=new THREE.MeshStandardMaterial({color:0x56d9bf,roughness:.5});
 const silver=new THREE.MeshStandardMaterial({color:0xbed4d9,metalness:.54,roughness:.42});
 const keys=['screwdriver','multimeter','gpuTest','ramDdr4','ramDdr5','brush',
   'vacuum','alcohol','wipes','airDuster','cleaner','esdStrap','usbWriter'];
 const objects=new Map();
 function box(parent,w,h,d,x,y,z,material){
   const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);
   mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;
   parent.add(mesh);return mesh;
 }
 for(const x of [-4.4,4.4])box(root,.22,8.7,2.7,x,4.2,0,metal);
 for(const y of [.25,3,5.7,8.25])box(root,9.0,.2,2.7,0,y,0,metal);
 box(root,8.8,.7,.2,0,8.85,-1.2,dark);
 const canvas=document.createElement('canvas');canvas.width=512;canvas.height=64;
 const ctx=canvas.getContext('2d');ctx.fillStyle='#d7fff0';
 ctx.font='bold 43px system-ui';ctx.textAlign='center';ctx.fillText('TALLER · EQUIPO',256,49);
 const sign=new THREE.Mesh(new THREE.PlaneGeometry(7.5,.65),
   new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(canvas),transparent:true,side:THREE.DoubleSide}));
 sign.position.set(0,8.85,1.45);root.add(sign);
 keys.forEach((id,i)=>{
   const holder=new THREE.Group();holder.name='Herramienta '+id;holder.userData.toolId=id;
   holder.position.set(-3.35+i%5*1.68,1.34+Math.floor(i/5)*2.67,0);
   root.add(holder);objects.set(id,holder);
   if(id==='screwdriver'){
     box(holder,.24,1,.2,0,0,.2,warm);box(holder,.11,.7,.11,0,.82,.2,silver);
   }else if(id==='multimeter'){
     box(holder,1.25,1.7,.4,0,0,.1,dark);
     box(holder,.9,.5,.05,0,.4,.33,mint);
     const dial=new THREE.Mesh(new THREE.CylinderGeometry(.3,.3,.13,24),silver);
     dial.rotation.x=Math.PI/2;dial.position.set(0,-.32,.38);holder.add(dial);
   }else if(id==='gpuTest'){
     box(holder,1.65,.85,.25,0,.1,.2,dark);
     for(const x of [-.38,.38]){
       const fan=new THREE.Mesh(new THREE.CylinderGeometry(.24,.24,.15,22),silver);
       fan.rotation.x=Math.PI/2;fan.position.set(x,.11,.38);holder.add(fan);
     }
   }else if(id.startsWith('ram')){
     for(const z of [.15,.42])box(holder,1.55,.32,.11,0,0,z,mint);
   }else if(id==='brush'){
     for(const x of [-.36,.36]){
       box(holder,.12,.95,.12,x,0,.2,silver);box(holder,.35,.31,.22,x,.58,.2,warm);
     }
   }else if(id==='vacuum'){
     box(holder,1.25,.85,.8,0,0,.2,dark);box(holder,.74,.35,.62,0,.56,.2,mint);
   }else if(id==='wipes'){
     box(holder,1.25,.35,.8,0,-.25,.1,silver);
   }else if(id==='esdStrap'){
     // Pulsera con banda y cordón: la geometría solo aparece al comprar.
     const band=new THREE.Mesh(new THREE.TorusGeometry(.38,.13,10,28),mint);
     band.rotation.x=Math.PI/2;band.position.set(0,.07,.1);holder.add(band);
     const lead=new THREE.Mesh(new THREE.TorusGeometry(.56,.035,6,26,Math.PI*1.3),silver);
     lead.position.set(.13,-.43,.18);holder.add(lead);
     box(holder,.36,.2,.19,.5,-.72,.25,silver);
   }else if(id==='usbWriter'){
     box(holder,1.22,.52,.3,0,.05,.25,dark);
     box(holder,.32,.34,.23,.79,.05,.25,silver);
     box(holder,.4,.14,.04,-.1,.09,.43,mint);
   }else{
     const bottle=new THREE.Mesh(new THREE.CylinderGeometry(.35,.42,1.25,18),warm);
     bottle.position.set(0,.1,.2);holder.add(bottle);
     box(holder,.37,.24,.37,0,.85,.2,dark);
   }
   const label=document.createElement('canvas');label.width=260;label.height=60;
   const c=label.getContext('2d');c.fillStyle='#102735';c.fillRect(0,0,260,60);
   c.fillStyle='#e4fff6';c.font='bold 25px system-ui';c.textAlign='center';
   c.fillText(id,130,39,252);
   const marker=new THREE.Mesh(new THREE.PlaneGeometry(1.95,.43),
     new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(label),transparent:true,side:THREE.DoubleSide}));
   marker.position.set(0,-.8,1.29);holder.add(marker);
 });
 function update(ids=[]){const set=new Set(ids);for(const [id,o] of objects)o.visible=set.has(id);}
 function identify(object){
   let o=object;while(o&&o!==root){if(o.userData?.toolId)return o.userData.toolId;o=o.parent;}
   return null;
 }
 update(['screwdriver']);
 return {root,update,identify,visible:()=>[...objects].filter(([,o])=>o.visible).map(([k])=>k)};
}
