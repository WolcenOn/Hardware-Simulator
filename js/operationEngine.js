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
 disconnect:Object.freeze({id:'disconnect',name:'Desconectar',description:'Retirar cable',
   baseMinutes:2,difficulty:2,tools:[],safety:['Apagar equipo para cables internos'],
   risks:['eléctrico','procedimiento'],reversible:true,success:'Cable desconectado'}),
 remove:Object.freeze({id:'remove',name:'Retirar',description:'Desmontar una pieza',
   baseMinutes:6,difficulty:2,tools:['destornillador salvo RAM'],
   safety:['Equipo apagado','Caja abierta'],risks:['mecánico','ESD'],
   reversible:true,success:'Pieza retirada del equipo'}),
 apply:Object.freeze({id:'apply',name:'Aplicar',description:'Usar consumible de montaje',
   baseMinutes:2,difficulty:1,tools:['consumible apropiado'],
   safety:['Equipo apagado','No tocar circuitos energizados'],
   risks:['procedimiento'],reversible:false,success:'Consumible aplicado'}),
 route:Object.freeze({id:'route',name:'Ordenar cables',description:'Apartar mazos PSU',
   baseMinutes:4,difficulty:2,tools:[],
   safety:['Equipo apagado','Caja abierta'],risks:['mecánico','procedimiento'],
   reversible:true,success:'Acceso interior despejado'}),
 inspect:Object.freeze({id:'inspect',name:'Inspeccionar',
   description:'Observar síntomas y condiciones',
   baseMinutes:4,difficulty:1,tools:[],safety:['No tocar piezas energizadas'],
   risks:['procedimiento'],reversible:true,success:'Informe de síntomas'})
});
function createEngine({clock,assessIncident=null}={}){
  if(assessIncident!==null&&typeof assessIncident!=='function')
    throw new TypeError('Evaluador de incidencias inválido.');
  if(!clock||typeof clock.calculate!=='function'||typeof clock.add!=='function')
    throw new TypeError('Reloj simulado obligatorio.');
  const history=[],successful=new Set(),active=new Set(),undone=new Set();
  let sequence=0,experience=0;
  function attempt({kind,target='',execute,wasSuccessful,context='',getReason=null,
    incidentEvaluator=null}){
    const def=DEFINITIONS[kind];
    if(!def)throw new RangeError('Operación desconocida: '+kind);
    if(typeof execute!=='function'||typeof wasSuccessful!=='function')
      throw new TypeError('Se requieren ejecución y verificación de resultado.');
    const ref=String(target||'general'),key=kind+':'+ref;
    let result,error=null;
    try{result=execute()}catch(e){error=e;}
    let passed=false;
    if(!error){try{passed=!!wasSuccessful(result)}catch(e){error=e;}}
    // Deshacer algo realizado durante el encargo es retrabajo;
    // retirar hardware preexistente por primera vez puede ser necesario.
    const reverse=kind==='remove'?'fit':kind==='disconnect'?'connect':null;
    const counterpart=reverse?reverse+':'+ref:null;
    const repeated=successful.has(key);
    const rework=passed&&(
      (counterpart&&active.has(counterpart))||
      undone.has(key));
    const category=!passed?(repeated?'repeated':'rejected'):
      rework?'rework':repeated?'repeated':
      kind==='inspect'?'useful_inspection':'necessary';
    const baseMinutes=passed?clock.calculate(def.baseMinutes,def.difficulty,experience):0;
    // Evaluar solamente DESPUÉS del éxito técnico comprobado. Nunca generar
    // una pifia en una instalación rechazada ni alterar el estado 3D aquí.
    const evaluateIncident=incidentEvaluator||assessIncident;
    if(evaluateIncident!==null&&typeof evaluateIncident!=='function')
      throw new TypeError('Evaluador de incidencias inválido.');
    const incident=passed&&evaluateIncident?
      evaluateIncident({kind,target:ref,speed:clock.getSpeed(),difficulty:def.difficulty,
        experience,definition:def})||null:null;
    const delay=incident?.delayMinutes||0;
    if(!Number.isFinite(delay)||delay<0||delay>60)
      throw new RangeError('Retraso de incidencia no válido.');
    const minutes=Math.round((baseMinutes+delay)*10)/10;
    if(passed){
      clock.add('technical',baseMinutes,key);
      if(delay)clock.add('technical',delay,'incident:'+key);
      successful.add(key);
      active.add(key);
      undone.delete(key);
      if(counterpart&&active.has(counterpart)){
        active.delete(counterpart);
        undone.add(counterpart);
      }
      if(kind==='remove'){
        const screwKey='screw:'+ref;
        if(active.has(screwKey)){active.delete(screwKey);undone.add(screwKey);}
      }
    }
    const record=Object.freeze({
      seq:++sequence,operation:def.id,target:ref,context:String(context),
      status:passed?'success':'rejected',category,minutes,baseMinutes,
      incident:incident?Object.freeze({...incident}):null,
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
    getHistory:()=>history.map(r=>({...r,incident:r.incident?{...r.incident}:null})),
    getSummary:()=>{
      const counts={necessary:0,useful_inspection:0,repeated:0,
        rejected:0,errors:0,rework:0,incidents:0};
      history.forEach(r=>{counts[r.category]++;if(r.incident)counts.incidents++;});
      return {counts,history:history.map(r=>({...r,incident:r.incident?{...r.incident}:null})),
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
