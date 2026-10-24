// PC Lab — adaptador transaccional para operaciones existentes.
// Valida primero en el handler técnico legado; registra sólo el resultado observado.
// No introduce RNG, daños ni un segundo motor de compatibilidad.
(function(root){
'use strict';
const DEFINITIONS=Object.freeze({
 fit:Object.freeze({id:'fit',name:'Encajar',description:'Montar componente',
   baseMinutes:8,difficulty:2,tools:[],safety:['PC apagado','Caja abierta'],
   risks:['mecánico'],reversible:true,success:'Componente instalado'}),
 screw:Object.freeze({id:'screw',name:'Atornillar',description:'Fijar componente',
   baseMinutes:5,difficulty:1,tools:['destornillador','tornillos'],
   safety:['PC apagado','Caja abierta'],risks:['mecánico','ESD'],
   reversible:true,success:'Fijación verificada'}),
 connect:Object.freeze({id:'connect',name:'Conectar',description:'Acoplar cable',
   baseMinutes:3,difficulty:2,tools:[],
   safety:['Desconectar alimentación en conexiones internas'],
   risks:['eléctrico','procedimiento'],reversible:true,success:'Conexión comprobada'}),
 inspect:Object.freeze({id:'inspect',name:'Inspeccionar',
   description:'Observar síntomas y condiciones',
   baseMinutes:4,difficulty:1,tools:[],safety:['No tocar piezas energizadas'],
   risks:['procedimiento'],reversible:true,success:'Informe de síntomas'})
});
function createEngine({clock}={}){
  if(!clock||typeof clock.calculate!=='function'||typeof clock.add!=='function')
    throw new TypeError('Reloj simulado obligatorio.');
  const history=[],successful=new Set();
  let sequence=0,experience=0;
  function attempt({kind,target='',execute,wasSuccessful,context='',getReason=null}){
    const def=DEFINITIONS[kind];
    if(!def)throw new RangeError('Operación desconocida: '+kind);
    if(typeof execute!=='function'||typeof wasSuccessful!=='function')
      throw new TypeError('Se requieren ejecución y verificación de resultado.');
    const ref=String(target||'general'),key=kind+':'+ref;
    let result,error=null;
    try{result=execute()}catch(e){error=e;}
    let passed=false;
    if(!error){try{passed=!!wasSuccessful(result)}catch(e){error=e;}}
    const repeated=successful.has(key);
    const category=!passed?(repeated?'repeated':'rejected'):repeated?'repeated':
      kind==='inspect'?'useful_inspection':'necessary';
    const minutes=passed?clock.calculate(def.baseMinutes,def.difficulty,experience):0;
    if(passed){clock.add('technical',minutes,key);successful.add(key);}
    const record=Object.freeze({
      seq:++sequence,operation:def.id,target:ref,context:String(context),
      status:passed?'success':'rejected',category,minutes,
      speed:clock.getSpeed(),reason:error?.message||
        (!passed?(typeof getReason==='function'&&getReason()||
          'Prerrequisitos o resultado técnico no satisfechos.'):
          repeated?'Operación válida repetida.':'Correcto.')
    });
    history.push(record);
    if(error)throw error; // conservar el comportamiento de errores del handler.
    return record;
  }
  return Object.freeze({
    attempt,
    getDefinitions:()=>DEFINITIONS,
    getHistory:()=>history.map(r=>({...r})),
    getSummary:()=>{
      const counts={necessary:0,useful_inspection:0,repeated:0,
        rejected:0,errors:0,rework:0};
      history.forEach(r=>{counts[r.category]++;});
      return {counts,history:history.map(r=>({...r})),
        ...clock.getSummary()};
    },
    setExperience:value=>{
      if(!Number.isFinite(value)||value<0||value>100)
        throw new RangeError('Experiencia inválida.');
      experience=value;
    }
  });
}
root.PC_OPERATIONS=Object.freeze({DEFINITIONS,createEngine});
})(typeof window!=='undefined'?window:globalThis);
