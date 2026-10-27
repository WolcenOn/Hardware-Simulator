// Pinouts didácticos numerados y medidor de dos puntas.
// Referencias: Intel ATX 3.0 Multi Rail Desktop PSU Design Guide (24p),
// Intel ATX12VO DC Connectors (EPS8 / PCIe8), SATA-IO / Intel SATA power.
// Esquemas NUMÉRICOS, no plantillas para fabricar o modificar cables.
(function(root){
'use strict';
// Los colores son la convención orientativa del cable en el lado del dispositivo.
// No describen el lado modular de la PSU ni obligan a los fabricantes.
function pin(number,signal,rail,color,notes=''){
  const wireColors=number===13&&signal.includes('sense')?
    ['orange','brown']:color==='none'?[]:[color];
  return Object.freeze({number,signal,rail,color,
    wireColors:Object.freeze(wireColors),notes});
}
const COLORS=Object.freeze({orange:'#ec994d',red:'#e85a59',yellow:'#f6c453',
  black:'#536272',purple:'#ad84de',green:'#71c79a',gray:'#c4d1da',
  blue:'#73a9e5',brown:'#a57b58',none:'#80949e'});
const COLOR_NAMES=Object.freeze({
  orange:'naranja',red:'rojo',yellow:'amarillo',black:'negro',
  purple:'morado',green:'verde',gray:'gris',blue:'azul',
  brown:'marrón',none:'sin color fijo'
});
const WIRE_LEGEND=Object.freeze([
  Object.freeze({color:'yellow',signal:'+12 V'}),
  Object.freeze({color:'red',signal:'+5 V'}),
  Object.freeze({color:'orange',signal:'+3,3 V'}),
  Object.freeze({color:'black',signal:'COM / masa'}),
  Object.freeze({color:'purple',signal:'+5VSB (espera)'}),
  Object.freeze({color:'green',signal:'PS_ON#'}),
  Object.freeze({color:'gray',signal:'PWR_OK'}),
  Object.freeze({color:'blue',signal:'−12 V'}),
  Object.freeze({color:'brown',signal:'Sense de +3,3 V (P13)'})
]);
function orderedRows(connector){
  const definition=CONNECTORS[connector];if(!definition)return [];
  const pins=[...definition.pins].sort((a,b)=>a.number-b.number);
  return Object.freeze(Array.from({length:definition.rows},(_,index)=>
    Object.freeze(pins.slice(index*definition.columns,(index+1)*definition.columns))));
}
// Vista didáctica desde la cara del terminal del cable, con pestaña arriba.
// Al girar al lado de los cables se invierte la izquierda/derecha. El número
// físico es invariable: el giro cambia sólo coordenadas de representación.
// Los contornos EPS/PCIe son esquemas de polarización; no son calibres.
const HOUSINGS=Object.freeze({
 atx24:Object.freeze({kind:'minifit',latch:'Pestaña de bloqueo arriba',
   split:'20+4',clip:true,description:'Carcasa Mini-Fit de dos filas, clip de retención y tramo desmontable 20+4.'}),
 eps8:Object.freeze({kind:'minifit',latch:'Pestaña de bloqueo arriba',
   split:'4+4',clip:true,description:'CPU EPS12V 4+4: cavidades cuadradas y con esquina biselada; no es PCIe.'}),
 pcie8:Object.freeze({kind:'minifit',latch:'Pestaña de bloqueo arriba',
   split:'6+2',clip:true,description:'GPU PCIe 6+2: patrón de guía distinto de EPS, dos pines de detección.'}),
 sata15:Object.freeze({kind:'sata-l',latch:'Ranura en L · polarización',
   split:'',clip:false,description:'SATA alimentación plano: guía en forma de L; no se encaja invertido.'})
});
function keyShape(connector,number){
  const n=Number(number);
  if(!lookup(connector,n))return null;
  // ATX: indicación genérica de cavidad; no se adjudica una geometría
  // concreta por pin sin plano mecánico del fabricante del housing.
  if(connector==='atx24')return 'neutral';
  if(connector==='sata15')return 'blade';
  const patterns={
    // Orden eléctrico: P1..P4 (abajo), P5..P8 (arriba).
    eps8:['square','bevel','bevel','square','bevel','square','square','bevel'],
    pcie8:['square','bevel','bevel','square','bevel','bevel','square','bevel']
  };
  return patterns[connector]?.[n-1]||'neutral';
}
function orientedRows(connector,face='contacts'){
  const rows=orderedRows(connector);
  if(!rows.length||!['contacts','wires'].includes(face))return [];
  // En la vista desde los contactos: fila de números mayores ARRIBA.
  // Desde detrás de la misma clavija, se ve reflejada horizontalmente.
  const topFirst=rows.length===2?[rows[1],rows[0]]:rows;
  return Object.freeze(topFirst.map(row=>Object.freeze(
    face==='wires'?[...row].reverse():[...row]
  )));
}
function positionOf(connector,number,face='contacts'){
  const rows=orientedRows(connector,face);
  for(let row=0;row<rows.length;row++){
    const col=rows[row].findIndex(p=>p.number===Number(number));
    if(col>=0)return Object.freeze({row,col,number:Number(number)});
  }
  return null;
}
function colorName(pin){
  if(!pin)return 'sin color fijo';
  return pin.wireColors.length?pin.wireColors.map(key=>COLOR_NAMES[key]).join(' + '):
    COLOR_NAMES.none;
}
function swatch(pin){
  const shades=(pin?.wireColors||[]).map(key=>COLORS[key]).filter(Boolean);
  if(!shades.length)return COLORS.none;
  if(shades.length===1)return shades[0];
  return 'linear-gradient(90deg,'+shades.map((color,i)=>
    color+' '+(100*i/shades.length)+'%,'+color+' '+(100*(i+1)/shades.length)+'%'
  ).join(',')+')';
}
const ATX=[
 ['+3.3 V','3v3','orange'],['+3.3 V','3v3','orange'],['COM','gnd','black'],
 ['+5 V','5v','red'],['COM','gnd','black'],['+5 V','5v','red'],
 ['COM','gnd','black'],['PWR_OK','pwrOk','gray'],
 ['+5 VSB','5vsb','purple'],['+12 V','12v','yellow'],['+12 V','12v','yellow'],
 ['+3.3 V','3v3','orange'],['+3.3 V / sense','3v3','orange'],
 ['-12 V','minus12','blue'],['COM','gnd','black'],['PS_ON#','psOn','green'],
 ['COM','gnd','black'],['COM','gnd','black'],['COM','gnd','black'],
 ['Reservado','nc','none'],['+5 V','5v','red'],['+5 V','5v','red'],
 ['+5 V','5v','red'],['COM','gnd','black']
].map(([name,rail,color],i)=>pin(i+1,name,rail,color,
 i===12?'Retorno de sensado +3,3 V; no es línea adicional de salida.':
 i===15?'Señal activa a nivel bajo: ~5 V en reposo y ~0 V al encender.':
 i===7?'Señal PWR_OK; estado nominal simplificado.':
 i===8?'Alimentación de espera incluso con PC apagado, si la fuente tiene CA.':
 i===19?'Pin 20 reservado: NO usar como -5 V en ATX moderno.':'' ));
const EPS=Array.from({length:8},(_,i)=>pin(i+1,i<4?'COM':'+12 V',
  i<4?'gnd':'12v',i<4?'black':'yellow'));
const PCIE=[
 pin(1,'+12 V','12v','yellow'),pin(2,'+12 V','12v','yellow'),
 pin(3,'+12 V','12v','yellow'),pin(4,'SENSE1 / COM','gnd','black','Señal de presencia llevada a masa en cable de 8 pines.'),
 pin(5,'COM','gnd','black'),pin(6,'SENSE0 / COM','gnd','black','Señal de presencia llevada a masa.'),
 pin(7,'COM','gnd','black'),pin(8,'COM','gnd','black')
];
const SATA=Array.from({length:15},(_,i)=>{
  const n=i+1;
  if(n<=3)return pin(n,'+3,3 V opcional','sata3v3','orange',
    'En este banco se modela SIN +3,3 V SATA (opcional, P3 puede ser PWDIS).');
  if(n<=6||n===10||n===12)return pin(n,'COM','gnd','black');
  if(n>=7&&n<=9)return pin(n,'+5 V','5v','red',
    n===7?'P7 contacto de precarga.':'');
  if(n===11)return pin(n,'P11 · actividad / control','signal','none',
    'Puede cumplir funciones DAS/DSS; no asumir masa.');
  return pin(n,'+12 V','12v','yellow',
    n===13?'P13 contacto de precarga.':'');
});
const CONNECTORS=Object.freeze({
  atx24:Object.freeze({id:'atx24',label:'ATX 24 pines · placa',columns:12,rows:2,
    description:'Conector ATX clásico de fuente multirail; 5VSB, PS_ON# y PWR_OK.',
    pins:Object.freeze(ATX)}),
  eps8:Object.freeze({id:'eps8',label:'EPS12V 8 pines · CPU',columns:4,rows:2,
    description:'Cuatro contactos COM y cuatro +12 V. NO intercambiar con PCIe 8 pines.',
    pins:Object.freeze(EPS)}),
  pcie8:Object.freeze({id:'pcie8',label:'PCIe 8 pines · GPU',columns:4,rows:2,
    description:'Tres +12 V y contactos COM/SENSE. NO es un conector EPS.',
    pins:Object.freeze(PCIE)}),
  sata15:Object.freeze({id:'sata15',label:'SATA alimentación · 15 contactos',columns:15,rows:1,
    description:'Modelo con +3,3 V opcional no suministrado; P11 puede ser señal.',
    pins:Object.freeze(SATA)})
});
function lookup(connector,number){
  const group=CONNECTORS[connector];
  return group?.pins.find(p=>p.number===Number(number))||null;
}
function level(rail,{powered=false,psu=false}={}){
  if(rail==='gnd')return 0;
  if(['nc','signal','sata3v3'].includes(rail))return null;
  if(!psu)return 0;
  if(rail==='5vsb')return 5;
  if(rail==='psOn')return powered?0:5;
  if(rail==='pwrOk')return powered?5:0;
  if(!powered)return 0;
  return { '12v':12,'5v':5,'3v3':3.3,'minus12':-12 }[rail]??null;
}
function measure({connector='atx24',red=10,black=3,mode='vdc',
  jack='vohm',psu=false,powered=false,fuseBlown=false}={}){
  const a=lookup(connector,red),b=lookup(connector,black);
  if(!a||!b)return {value:'—',message:'Selecciona dos contactos válidos del mismo conector.'};
  const prefix='Roja P'+a.number+' ('+a.signal+'), negra P'+b.number+' ('+b.signal+'). ';
  const va=level(a.rail,{psu,powered}),vb=level(b.rail,{psu,powered});
  if(mode==='ohm'){
    if(jack!=='vohm')return {value:'LEAd',message:prefix+'Para Ω usa el borne VΩ.'};
    if(psu)return {value:'STOP',message:prefix+
      'No midas Ω con la fuente conectada a CA: el +5VSB puede seguir vivo aunque el PC esté apagado.'};
    if(va===null||vb===null)return {value:'OL',message:prefix+
      'Contacto reservado/opcional: no hay una continuidad simulada fiable.'};
    const same=a.rail===b.rail;
    return {value:same?'0.3 Ω':'OL',message:prefix+
      (same?'Continuidad didáctica entre contactos de una misma red, fuente aislada.':
        'Redes diferentes: no se infiere una avería a partir de este OL.')};
  }
  if(jack==='amp'&&fuseBlown)return {value:'FUSE',message:prefix+
    'Fusible del amperímetro fundido. Reemplázalo antes de medir A.'};
  if(va===null||vb===null)return {value:'OL',message:prefix+
    'Contacto sin tensión definida en este modelo (reservado, opcional o señal).'};
  const differential=va-vb;
  if(jack==='amp'&&psu&&Math.abs(differential)>.1)
    return {value:'⚡ CORTO',spark:true,voltage:differential,
      message:prefix+'Cortocircuito didáctico: el borne A une puntos con '+
        Math.abs(differential).toFixed(1)+' V de diferencia. Fusible A fundido.'};
  if(mode==='adc'){
    if(jack!=='amp')return {value:'LEAd',message:prefix+'Conecta la punta al borne A para corriente.'};
    return {value:'Err',message:prefix+
      'No midas corriente entre dos pines: debes abrir un circuito y medir EN SERIE.'};
  }
  if(jack!=='vohm')return {value:'LEAd',message:prefix+'Para V utiliza el borne VΩ.'};
  if(mode==='vac')return {value:'0.0 V~',voltage:0,
    message:prefix+'El modelo de la PSU entrega CC; no modelamos rizado de CA.'};
  if(mode!=='vdc')return {value:'Err',message:'Magnitud no admitida.'};
  return {value:differential.toFixed(1)+' V⎓',voltage:differential,
    message:prefix+'Diferencia de potencial nominal simulada entre ambos contactos.'};
}
root.PC_PINOUTS=Object.freeze({CONNECTORS,COLORS,COLOR_NAMES,WIRE_LEGEND,
  lookup,level,measure,orderedRows,orientedRows,positionOf,keyShape,
  HOUSINGS,colorName,swatch});
})(typeof window==='undefined'?globalThis:window);
