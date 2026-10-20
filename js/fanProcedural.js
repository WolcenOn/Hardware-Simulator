// Ventiladores axiales modelados por geometría: marco, aletas curvadas,
// rotor, tornillos, anillo exterior y vista de giro rápido. Sin assets externos.
export function createProceduralFan(THREE,parent,materials,position,radius,options={}){
  const {kind='gpu',square=false,grille=false}=options;
  const housing=new THREE.Group();
  housing.position.set(...position);
  housing.name='fan_'+kind;
  parent.add(housing);

  const dark=materials.black2, hubMaterial=materials.black, rimMaterial=materials.aluminium;
  const bladeMaterial=new THREE.MeshStandardMaterial({
    color:kind==='cooler'?0x667d85:0x35454d,
    metalness:.35,roughness:.48,side:THREE.DoubleSide
  });
  const add=(geo,mat,holder,x=0,y=0,z=0)=>{
    const mesh=new THREE.Mesh(geo,mat);
    mesh.position.set(x,y,z);
    mesh.castShadow=true;
    holder.add(mesh);return mesh;
  };
  // Fondo circular interior con el rotor libre, sin cilindro macizo delante.
  add(new THREE.CylinderGeometry(radius*.94,radius*.94,.085,48),dark,housing,0,-.09,0);

  // Aro de montaje: diámetro interior visible y detalles de tornillería.
  const ring=add(new THREE.TorusGeometry(radius*.94,radius*.057,9,56),rimMaterial,housing,0,.035,0);
  ring.rotation.x=Math.PI/2;
  const inner=add(new THREE.TorusGeometry(radius*.83,radius*.013,6,48),dark,housing,0,.066,0);
  inner.rotation.x=Math.PI/2;
  if(square){
    const half=radius*1.04, thickness=radius*.16;
    for(const side of [-1,1]){
      add(new THREE.BoxGeometry(thickness,.20,half*2),dark,housing,half*side,.045,0);
      add(new THREE.BoxGeometry(half*2,.20,thickness),dark,housing,0,.045,half*side);
      for(const z of [-half,half]){
        const screw=add(new THREE.CylinderGeometry(radius*.043,radius*.043,.015,12),
          rimMaterial,housing,half*side,.16,z);
        screw.rotation.y=Math.PI/4;
      }
    }
  }

  const rotor=new THREE.Group();
  rotor.position.y=.035;
  rotor.name='rotor_'+kind;
  housing.add(rotor);

  // Perfil de pala con borde de ataque curvado, ensanchamiento y barrido.
  // Cada pala conserva espesor y bisel, no es un rectángulo plano.
  const shape=new THREE.Shape();
  shape.moveTo(radius*.17,-radius*.055);
  shape.bezierCurveTo(radius*.39,-radius*.22,radius*.67,-radius*.21,radius*.88,-radius*.07);
  shape.bezierCurveTo(radius*.99,radius*.02,radius*.87,radius*.14,radius*.64,radius*.20);
  shape.bezierCurveTo(radius*.42,radius*.23,radius*.23,radius*.13,radius*.17,-radius*.055);
  const bladeGeometry=new THREE.ExtrudeGeometry(shape,{
    depth:radius*.035,steps:1,bevelEnabled:true,bevelThickness:radius*.012,
    bevelSize:radius*.010,bevelSegments:1,curveSegments:8
  });
  bladeGeometry.rotateX(-Math.PI/2);
  const blades=kind==='gpu'?9:kind==='cooler'?9:7;
  for(let i=0;i<blades;i++){
    const blade=add(bladeGeometry,bladeMaterial,rotor);
    blade.rotation.y=i*Math.PI*2/blades;
  }
  // Hub central independiente: se mantiene visible en modo blur.
  add(new THREE.CylinderGeometry(radius*.19,radius*.19,.13,32),
    hubMaterial,housing,0,.10,0);
  add(new THREE.CylinderGeometry(radius*.105,radius*.105,.137,32),
    rimMaterial,housing,0,.113,0);

  const blur=add(new THREE.RingGeometry(radius*.18,radius*.87,60),
    new THREE.MeshBasicMaterial({color:0x9fb1b8,transparent:true,
      opacity:.23,depthWrite:false,side:THREE.DoubleSide}),
    housing,0,.11,0);
  blur.rotation.x=-Math.PI/2;
  blur.visible=false;

  if(grille){
    // Parrilla estacionaria, concéntrica y elevada sobre las aspas.
    for(const factor of [.29,.50,.72,.94]){
      const g=add(new THREE.TorusGeometry(radius*factor,radius*.013,6,64),
        rimMaterial,housing,0,.205,0);
      g.rotation.x=Math.PI/2;
    }
    for(let i=0;i<4;i++){
      const a=i*Math.PI/4;
      const bar=add(new THREE.BoxGeometry(radius*1.89,.032,radius*.032),
        rimMaterial,housing,0,.205,0);
      bar.rotation.y=a;
    }
  }
  return {housing,rotor,blur,kind};
}
