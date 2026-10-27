// Pinouts didácticos numerados y medidor de dos puntas.
// Referencias: Intel ATX 3.0 Multi Rail Desktop PSU Design Guide (24p),
// Intel ATX12VO DC Connectors (EPS8 / PCIe8), SATA-IO / Intel SATA power.
// Esquemas NUMÉRICOS, no plantillas para fabricar o modificar cables.
(function(root){
'use strict';
function pin(number,signal,rail,color,notes=''){
  return Object.freeze({number,signal,rail,color,notes});
}
const COLORS=Object.freeze({orange:'#ec994d',red:'#e85a59',yellow:'#f6c453',
  black:'#536272',purple:'#ad84de',green:'#71c79a',gray:'#c4d1da',
  blue:'#73a9e5',none:'#80949e'});
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
  if(n===11)return pin(n,'P11 · actividad / control','signal','gray',
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
root.PC_PINOUTS=Object.freeze({CONNECTORS,COLORS,lookup,level,measure});
})(typeof window==='undefined'?globalThis:window);
