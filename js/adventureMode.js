// Hardware Simulator Adventure: tienda, encargos y verbos de montaje.
// Precios completamente ficticios/educativos en EUR; NO son cotizaciones de tiendas.
(function(root){
'use strict';
const CASES={
  office:{name:'Oficina de barrio',client:'Lucía · Administración',
    story:'Necesito trabajar, videollamadas, documentos y un SSD rápido. No hace falta gráfica dedicada.',
    budget:800,minRam:16,gpu:false,minStorage:'ssd',maxTemp:90,
    goals:['Entrega con sistema operativo','16 GB RAM o más','Almacenamiento SSD','Teclado, ratón y vídeo']},
  gaming:{name:'PC para juegos 1080p',client:'Marcos · Estudiante',
    story:'Quiero jugar en 1080p con gráfica dedicada y almacenamiento rápido. Prioriza el rendimiento sin superar el presupuesto.',
    budget:1500,minRam:16,gpu:true,minStorage:'ssd',maxTemp:90,
    goals:['GPU dedicada alimentada','16 GB RAM mínimo','SSD y sistema operativo','Refrigeración funcional']},
  creator:{name:'Estación de edición',client:'Elena · Fotografía y vídeo',
    story:'Necesito 32 GB RAM, una buena GPU y SSD para editar vídeo, sin renunciar a la estabilidad.',
    budget:2000,minRam:32,gpu:true,minStorage:'nvme',maxTemp:85,
    goals:['32 GB RAM','GPU dedicada','SSD M.2 NVMe','Sistema operativo y buen flujo de aire']}
};
const OFFERS={
  motherboard:[['b650',159],['b650m',129],['x670e',295],['a520',79],['b550',109],['x570',185],['z790',249],['h610',75],['b760',165],['b760m',137]],
  cpu:[['r7600',189],['r5600',99],['r5600g',129],['r5700x',145],['r8600g',219],['r8700g',295],['r7700',275],['i512400',165],['i512400f',139],['i514400',239],['i513600k',279]],
  ram:[['ddr4_8',28],['ddr4_16',42],['ddr4_32',79],['ddr5_8',45],['ddr5_16',62],['ddr5_32',114],['ddr5_64',215]],
  storage:[['sataSSD',64],['sataSSD2',109],['nvmeSSD',79],['nvme2',145],['hdd',57],['hdd4',99]],
  gpu:[['rx6600',179],['rx7600',249],['rtx3060',235],['rtx4060',289],['rtx4070',529]],
  psu:[['psu450',49],['psu550',69],['psu650',89],['psu750',115],['psu850',139],['psu1000',199]],
  case:[['tower',89],['towerWhite',94],['towerGraphite',94]],
  cooler:[['air',39],['stock',15],['twinTower',69],['aio240',109],['aio360',155]],
  item:[['screwdriver',12],['screws',8],['paste',9],['ioShield',8],['sataCable',7],
    ['hdmi',10],['keyboard',22],['mouse',14],['esdStrap',16],['osusb',12],
    ['usbNova',39],['usbLibre',24],['usbTerminal',19],['fan',15],['rgbStrip',18]]
};
const LABELS={
  'case:tower':'Caja ATX negra',
  'case:towerWhite':'Caja ATX blanca',
  'case:towerGraphite':'Caja ATX grafito',
  'cooler:stock':'Disipador compacto de serie',
  'cooler:twinTower':'Disipador doble torre 120 mm',
  'cooler:aio240':'Refrigeración líquida AIO 240 mm',
  'cooler:aio360':'Refrigeración líquida AIO 360 mm',
  'item:rgbStrip':'Tira LED ARGB 5V',
  'cooler:air':'Disipador de CPU (aire)',
  'item:screwdriver':'Destornillador de estrella',
  'item:esdStrap':'Pulsera ESD con cable a masa',
  'item:screws':'Juego de tornillos (10)',
  'item:paste':'Pasta térmica (1 aplicación)',
  'item:ioShield':'Chapa I/O trasera ATX',
  'item:sataCable':'Cable SATA de datos',
  'item:hdmi':'Cable HDMI/DisplayPort',
  'item:keyboard':'Teclado USB',
  'item:mouse':'Ratón USB',
  'item:osusb':'Memoria USB de 32 GB vacía',
  'item:usbNova':'USB preparado · NovaDesk 11',
  'item:usbLibre':'USB preparado · LibreForge',
  'item:usbTerminal':'USB preparado · Terminalis',
  'item:fan':'Ventilador PWM de caja de 120 mm'
};
const CATEGORIES={case:'Caja',motherboard:'Placa',cpu:'CPU',ram:'RAM',
  cooler:'Disipador',storage:'Disco',gpu:'GPU',psu:'Fuente',
  item:'Herramientas y accesorios'};
const SHOP_ICONS={case:'🖥️',motherboard:'🧩',cpu:'⚙️',ram:'📏',
  cooler:'❄️',storage:'💾',gpu:'🎮',psu:'🔌',item:'🧰'};
// Datos técnicos didácticos ya usados por las fichas del visor 3D.
// La tienda muestra estos datos, sin calcular la compatibilidad.
const STORE_SPECIAL={
  'case:tower':{sizeMm:'453 × 230 × 466 mm',desc:'Torre ATX negra con PSU inferior.'},
  'case:towerWhite':{sizeMm:'453 × 230 × 466 mm',desc:'Misma torre en acabado blanco.'},
  'case:towerGraphite':{sizeMm:'453 × 230 × 466 mm',desc:'Misma torre con pintura grafito.'},
  'cooler:stock':{sizeMm:'90 × 90 × 55 mm',desc:'Ventilador de serie; menos margen térmico.'},
  'cooler:twinTower':{sizeMm:'140 × 125 × 160 mm',desc:'Dos bloques de aletas de aluminio.'},
  'cooler:aio240':{sizeMm:'240 × 120 mm',desc:'Radiador doble, bomba y tubos; requiere CPU_FAN.'},
  'cooler:aio360':{sizeMm:'360 × 120 mm',desc:'Radiador triple y bomba; requiere CPU_FAN.'},
  'cooler:air':{desc:'Requiere pasta térmica y conexión CPU_FAN.'},
  'item:paste':{desc:'Aplicar sobre la CPU antes de fijar el disipador.'},
  'item:rgbStrip':{desc:'Instalar en chasis abierto, apagado.'},
  'item:screws':{desc:'Se consumen al fijar componentes instalados.'},
  'item:screwdriver':{desc:'Herramienta reutilizable de montaje.'},
  'item:ioShield':{desc:'Debe colocarse antes de instalar la placa.'},
  'item:sataCable':{interface:'SATA',desc:'Datos desde placa al disco SATA.'},
  'item:hdmi':{desc:'Conecta la salida de vídeo elegida al monitor.'},
  'item:fan':{sizeMm:'120 mm',desc:'Requiere conexión SYS_FAN.'},
  'item:osusb':{desc:'Instalador de sistema; requiere Boot #1 USB en BIOS.'},
  'item:keyboard':{desc:'Necesario para la BIOS y la instalación.'},
  'item:mouse':{desc:'Dispositivo de entrada USB.'}
};
const SHOP_FIELDS={socket:'Zócalo',chipset:'Chipset',ram:'Memoria compatible declarada',
  type:'Tipo',sizeMm:'Dimensiones',interface:'Interfaz',peak:'Consumo máximo indicado (W)',
  watts:'Consumo indicado (W)',igpu:'Gráficos integrados',capacity:'Capacidad',
  capacityGb:'Capacidad (GB)',memory:'Memoria',vram:'Memoria gráfica',
  power:'Potencia',wattage:'Potencia (W)',efficiency:'Eficiencia',
  formFactor:'Formato',format:'Formato',pins:'Conectores',slots:'Ranuras / puertos',
  size:'Tamaño',connectors:'Conexiones',tdp:'TDP indicado (W)',desc:'Descripción'};
const CONNECTIONS=[
  ['atx24','Placa · ATX 24 pines'],['eps','CPU · EPS 8 pines'],
  ['frontpanel','Caja · POWER SW'],
  ['frontusb3','Caja · USB 3.0 frontal (2 puertos)'],
  ['frontusbc','Caja · USB-C frontal'],['gpupower','GPU · PCIe / 12VHPWR'],
  ['sataData','Disco · SATA datos'],['sataPower','Disco · SATA alimentación'],
  ['cpufan','Disipador · CPU_FAN'],['monitor','Monitor · HDMI / DP'],
  ['keyboard','Teclado · USB'],['mouse','Ratón · USB'],
  ['sysfan0','Caja · SYS_FAN 1'],['sysfan1','Caja · SYS_FAN 2'],
  ['sysfan2','Caja · SYS_FAN 3']
];
const USB_PREPARED=Object.freeze({
  usbNova:{os:'novadesk',fee:27,label:'NovaDesk 11'},
  usbLibre:{os:'libreforge',fee:12,label:'LibreForge'},
  usbTerminal:{os:'terminalis',fee:7,label:'Terminalis'}
});
const VERBS=[['fit','Encajar'],['screw','Atornillar'],['connect','Conectar'],['disconnect','Desconectar'],
  ['apply','Aplicar'],['route','Ordenar cables'],['remove','Retirar'],['boot','Encender / apagar'],
  ['bios','BIOS'],['os','Instalar SO'],['inspect','Inspeccionar']];
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const format=amount=>amount.toLocaleString('es-ES',{style:'currency',currency:'EUR',minimumFractionDigits:0,maximumFractionDigits:0});
const key=(cat,id)=>cat+':'+id;
const safe=val=>String(val).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
function createAdventureGame(api){
  let game=null,importedSerial=0,clock=null,operationEngine=null,mishaps=null;
  const workshop=root.PC_WORKSHOP_TOOLS.createBank(root.localStorage);
  const equipment=root.PC_WORKSHOP_TOOLS.ITEMS;
  function buyTool(id){
    if(!game)return false;
    const r=workshop.buy(id);
    message(r.ok?'Adquirido para el taller: '+equipment[id].label+'.':
      'Compra no realizada: '+r.reason+'.',r.ok?'ok':'warn');
    return r.ok;
  }
  function useTool(id){
    if(!game||!equipment[id]||!workshop.owns(id))return false;
    if(id==='multimeter')return openMeter();
    if(id==='screwdriver'){message('Destornillador ya disponible, sin recompra.','ok');return true;}
    if(api.state().power){
      message('Apaga el PC antes de limpiar o probar piezas de referencia.');return false;
    }
    if(!workshop.use(id))return false;
    if(['gpuTest','ramDdr4','ramDdr5'].includes(id)){
      game.benchTests.push(id);
      message('Prueba comparativa virtual con '+equipment[id].label+
        '. No instala piezas ni resuelve la compatibilidad.','ok');
    }else{
      game.cleanings.push(id);
      message('Limpieza simulada con '+equipment[id].label+
        (equipment[id].units?' (una dosis gastada).':'.')+
        ' No corrige averías automáticamente.','ok');
    }
    return true;
  }
  function openTool(id){
    if(!game)return false;
    if(id==='multimeter'&&workshop.owns(id))return openMeter();
    game.openSections=[...game.openSections.filter(v=>v!=='workshop'),'workshop'].slice(-2);
    paint();api.toolView?.();return true;
  }
  function openMeter(){
    if(!game)return false;
    if(!workshop.owns('multimeter')){
      message('Primero compra un multímetro para el taller.');return false;
    }
    game.meterOpen=true;game.meterReading=null;renderMeter();return true;
  }
  function closeMeter(){if(game)game.meterOpen=false;
    if(meterPopup)meterPopup.hidden=true;}
  function selectMeterConnector(id){
    if(!game||!root.PC_PINOUTS.CONNECTORS[id])return false;
    game.meterConnector=id;game.meterTest='pins';game.meterReading=null;
    const defaults={atx24:[10,3],eps8:[5,1],pcie8:[1,5],sata15:[8,4]};
    [game.meterRedPin,game.meterBlackPin]=defaults[id];
    api.pinoutSelection?.(id,game.meterRedPin,game.meterBlackPin);
    renderMeter();return true;
  }
  function selectMeterPin(pin,lead=game?.meterLead){
    if(!game||!root.PC_PINOUTS.lookup(game.meterConnector,pin))return false;
    if(lead==='black')game.meterBlackPin=Number(pin);
    else game.meterRedPin=Number(pin);
    game.meterReading=null;game.meterTest='pins';
    api.pinoutSelection?.(game.meterConnector,game.meterRedPin,game.meterBlackPin);
    renderMeter();return true;
  }
  function openMeterAtPin(id,pin){
    if(!game)return false;
    game.meterFace='contacts';
    if(!workshop.owns('multimeter'))return openMeter();
    if(!root.PC_PINOUTS.lookup(id,pin))return false;
    if(game.meterConnector!==id)selectMeterConnector(id);
    selectMeterPin(pin);return openMeter();
  }
  function probeMeter(){
    if(!game?.meterOpen)return null;
    const st=api.state();
    const electrical={mode:game.meterMode,jack:game.meterJack,
      powered:!!st.power,psu:!!st.installed.psu,
      fuseBlown:workshop.snapshot().fuseBlown};
    const reading=game.meterTest==='series'?
      root.PC_WORKSHOP_TOOLS.meterRead({
        ...electrical,point:'fanSeries',sata:!!st.sataData,fan:!!st.cpuFan
      }):root.PC_PINOUTS.measure({
        ...electrical,connector:game.meterConnector,
        red:game.meterRedPin,black:game.meterBlackPin
      });
    game.meterReading=reading;
    if(reading.spark){
      workshop.shortCircuit();game.meterShorts++;
      api.log('warn','Chispazo ficticio: cortocircuito por multímetro en amperios.');
    }
    renderMeter();return reading;
  }
  function replaceMeterFuse(){
    if(!game||!workshop.replaceFuse()){
      message('El fusible no se ha cambiado (cuesta 5 € y debe estar fundido).');return false;
    }
    game.meterReading={value:'FUSE OK',message:'Fusible de amperios reemplazado.'};
    renderMeter();message('Fusible de amperios sustituido por 5 € del fondo del taller.','ok');
    return true;
  }

  let ramPrecisionEngine=null,ramPrecisionSession=null,ramPrecisionBypass=false;
  let screwEngine=null,screwSession=null,screwBypass=false,screwDragging=false;
  let screwHoleIndex=0,screwSessions=new Map();
  let pasteUi=null,pasteSpread=null,pasteBypass=false;
  let cpuEngine=null,cpuSession=null,cpuBypass=false,cpuDragging=false;
  let cpuFrame=0,cpuOscStart=0,cpuFeedback='Gira y alinea el procesador.';
  let screwFeedback='Arrastra el tornillo hasta el centro del agujero.';
  function operationSummary(){return operationEngine?.getSummary()||null;}
  function setRiskEnabled(enabled){
    if(!game)return false;
    game.riskEnabled=!!enabled;
    message(game.riskEnabled?
      'Incidencias educativas activas (semilla '+game.riskSeed+').':
      'Incidencias educativas desactivadas.','ok');
    return true;
  }
  function setRiskSeed(seed){
    if(!game)return false;
    try{
      const value=String(seed||'').trim();
      const next=root.PC_MISHAPS.createEngine({seed:value});
      game.riskSeed=value;mishaps=next;
      // El minijuego usa un RNG SEPARADO; cambiar la semilla cancela la
      // presentación abierta sin alterar incidencias ya registradas.
      ramPrecisionEngine=root.PC_RAM_PRECISION.createEngine({seed:value});
      screwEngine=root.PC_SCREW_PRECISION.createEngine({seed:value});
      cpuEngine=root.PC_CPU_PRECISION.createEngine({seed:value});
      pasteUi?.close();
      closeCpuPrecision();closeScrewPractice();
      ramPrecisionSession=null;stopRamAnimation();ramCaptures={left:null,right:null};
      message('Semilla guardada: '+value+'. Secuencia reiniciada.','ok');
      return true;
    }catch(err){message('Semilla inválida: '+err.message);return false;}
  }
  function toggleEsd(){
    if(!game)return false;
    if(game.esdConnected){
      game.esdConnected=false;
      message('Pulsera ESD desconectada de la masa del chasis.','ok');return true;
    }
    const st=api.state();
    if(!owned('item:esdStrap')||!st.installed.case||st.power){
      message('Compra pulsera ESD, monta el chasis y apaga el PC para conectarla a masa.');
      return false;
    }
    game.esdConnected=true;
    message('Pulsera ESD colocada y conectada a masa del chasis.','ok');return true;
  }
  function setSpeed(speed){
    if(!clock||!game)return;
    try{
      clock.setSpeed(speed);
      // Evitar reconstruir el <select> durante su evento change: Playwright y
      // navegadores táctiles pueden perder la selección si se reemplaza el nodo.
      const indicator=panel.querySelector('#advVirtualClock');
      if(indicator){
        const summary=clock.getSummary();
        indicator.textContent='Tiempo virtual: '+summary.total+' min · '+
          operationEngine.getHistory().length+' operaciones registradas';
      }
    }catch(e){message(e.message);}
  }
  function tracked(kind,target,execute,verify){
    if(!operationEngine)return execute();
    // Delegar prerrequisitos al handler técnico existente; no introducir
    // aleatoriedad ni una validación de montaje duplicada.
    const beforeFeedback=game.lastFeedback;
    // Capturar condiciones ANTES de ejecutar. Una acción rechazada jamás
    // consume números aleatorios, ni puede generar una incidencia.
    const st=api.state(),powered=!!st.power;
    const esd={worn:!!game.esdConnected,
      grounded:!!game.esdConnected&&owned('item:esdStrap')&&!!st.installed.case&&!powered};
    // Reparar una avería conocida no debe provocar un ciclo interminable:
    // se comprueba la reparación, pero no se sortea una nueva avería SATA.
    const repairingSata=kind==='connect'&&target==='sataData'&&
      game.pendingSataRepair;
    const record=operationEngine.attempt({kind,target,execute,wasSuccessful:verify,
      context:game.caseId,getReason:()=>game.lastFeedback!==beforeFeedback?
        game.lastFeedback?.text:null,
      incidentEvaluator:game.riskEnabled&&!repairingSata?
        ({kind,speed,difficulty,experience})=>
          mishaps.assess({kind,target,speed,difficulty,experience,esd,powered,
            tools:{adequate:true}}):null});
    if(record.status==='success'&&repairingSata){
      game.pendingSataRepair=false;
      const openIncident=game.incidents.findLast(x=>
        ['loose_sata','latent_sata'].includes(x.outcome)&&!x.resolved);
      if(openIncident){
        openIncident.resolved=true;openIncident.resolvedSequence=record.seq;
        openIncident.resolvedBy='sata_reconnect';
      }
      message('Reparación SATA completada: cable de datos reconectado y verificado.','ok');
    }
    // Una desconexión deliberada descubre el contacto latente sin POWER.
    if(record.status==='success'&&kind==='disconnect'&&target==='sataData'&&
      game.pendingSataLatent){
      game.pendingSataLatent=false;game.pendingSataRepair=true;
      const latent=game.incidents.findLast(x=>x.outcome==='latent_sata'&&!x.resolved);
      if(latent){latent.revealed=true;latent.revealedBy='disconnect';}
      message('Al retirar SATA se detecta posible contacto deficiente: reconecta y verifica.','warn');
    }
    // Retirar el disco es una solución válida: no bloquear montajes alternativos.
    if(record.status==='success'&&kind==='remove'&&target.startsWith('storage:')&&
      (game.pendingSataLatent||game.pendingSataRepair)){
      game.pendingSataLatent=false;game.pendingSataRepair=false;
      operationEngine.markUndone('connect','sataData');
      const unresolved=game.incidents.findLast(x=>
        ['loose_sata','latent_sata'].includes(x.outcome)&&!x.resolved);
      if(unresolved){
        unresolved.resolved=true;unresolved.resolvedSequence=record.seq;
        unresolved.resolvedBy='storage_removed';
      }
      message('Unidad retirada: incidencia SATA cerrada; puedes instalar otra unidad.','ok');
    }
    if(record.status==='success'&&kind==='inspect'&&game.pendingReview){
      game.pendingReview=0;
      message('Inspección de seguridad completada: incidencias pendientes revisadas.','ok');
    }
    if(record.incident){
      const entry={operation:kind,target,...record.incident,sequence:record.seq};
      if(entry.outcome==='loose_sata'){
        // El handler ha conectado y verificado el cable; la incidencia
        // posterior lo suelta, sin inventar daño ni gastar material.
        api.state().sataData=false;
        operationEngine.markUndone('connect','sataData');
        game.pendingSataRepair=true;
        entry.resolved=false;
        api.render();
      }else if(entry.outcome==='latent_sata'){
        // Montaje aparentemente correcto; el fallo aparece solo al encender.
        game.pendingSataLatent=true;
        entry.revealed=false;entry.resolved=false;
      }
      game.incidents.push(entry);
      if(entry.outcome==='review')game.pendingReview++;
      message(entry.code+' · '+entry.description+
        ' (+'+entry.delayMinutes+' min simulados).');
    }
    paint();return record;
  }
  function revealLatentSataOnPower(){
    if(!game?.pendingSataLatent)return false;
    const st=api.state();
    // La rutina POWER llama aquí tras validar chasis, PSU, placa y cable POWER.
    if(!st.installed.storage||api.part('storage').interface!=='SATA'){
      game.pendingSataLatent=false;
      const incident=game.incidents.findLast(x=>x.outcome==='latent_sata'&&!x.resolved);
      if(incident){incident.resolved=true;incident.resolvedBy='storage_replaced';}
      paint();return false;
    }
    st.sataData=false;
    operationEngine.markUndone('connect','sataData');
    game.pendingSataLatent=false;game.pendingSataRepair=true;
    const incident=game.incidents.findLast(x=>x.outcome==='latent_sata'&&!x.resolved);
    if(incident){incident.revealed=true;incident.revealedBy='power-on';}
    message('El disco SATA no responde al encender: diagnostica y comprueba el cable de datos.','warn');
    return true;
  }
  function importCases(raw){
    const incoming=Array.isArray(raw)?raw:[raw];
    if(!incoming.length||incoming.length>20)throw new Error('Máximo 20 casos por archivo.');
    const validated=incoming.map(x=>root.PC_CLASSROOM.normalizeCase(x));
    return validated.map(c=>{
      const id='teacher-'+(++importedSerial);
      CASES[id]={name:c.title,client:c.client,story:c.story,budget:c.budget,
        minRam:c.minRam,gpu:c.gpu,minStorage:c.minStorage,maxTemp:c.maxTemp,
        goals:c.goals};return id;
    });
  }
  function getCase(){return game?{id:game.caseId,...CASES[game.caseId]}:null;}
  function getExport(){if(!game)return null;return {
    case:getCase(),spent:game.spent,caseReport:game.report,
    workshop:workshop.snapshot(),benchTests:[...game.benchTests],cleanings:[...game.cleanings],meterShorts:game.meterShorts,
    meter:{connector:game.meterConnector,redPin:game.meterRedPin,
      blackPin:game.meterBlackPin,mode:game.meterMode,jack:game.meterJack,
      helpMode:game.meterHelpMode,face:game.meterFace,
      lastReading:game.meterReading?{...game.meterReading}:null},
    purchases:game.purchases.map(x=>({...x})),fixings:{...game.screwed},
    operationHistory:operationEngine?.getHistory()||[],
    simulatedTime:clock?.getSummary()||null,
    incidentSimulation:{enabled:game.riskEnabled,seed:game.riskSeed,
      incidents:game.incidents.map(item=>({...item})),
      pendingReview:game.pendingReview,
      pendingRepairs:game.pendingSataRepair?['sataData']:[],
      pendingLatent:game.pendingSataLatent?['sataData']:[]},
    ramPrecision:{enabled:game.ramPrecisionEnabled,
      attempts:game.ramPrecisionHistory.map(item=>({...item})),
      active:ramPrecisionSession?.getState()||null},
    cpuPrecision:{enabled:game.cpuPrecisionEnabled,
      attempts:game.cpuPrecisionHistory.map(x=>({...x})),
      active:cpuSession?.getState()||null},
    thermalPaste:{enabled:game.thermalPasteEnabled,
      application:game.thermalPaste?{...game.thermalPaste,
        dots:game.thermalPaste.dots.map(d=>({...d}))}:null,
      spread:pasteSpread?.getState()||null,
      review:game.pasteReview?{...game.pasteReview}:null,
      history:game.thermalHistory.map(x=>({...x}))},
    screwPractice:{enabled:game.screwPracticeEnabled,
      attempts:game.screwHistory.map(item=>({...item})),
      progress:Object.fromEntries(Object.entries(game.screwProgress).map(
        ([cat,info])=>[cat,{target:info.target,completed:[...info.completed]}])),
      active:screwSession?.getState()||null,
      activeHole:screwSession?screwHoleIndex:null}};}

  const panel=api.document.getElementById('adventurePanel');
  const storePage=api.document.getElementById('adventureStorePage');
  const meterPopup=api.document.getElementById('multimeterLabPopup');
  const ramPopup=api.document.getElementById('ramPrecisionPopup');
  const screwPopup=api.document.getElementById('screwPrecisionPopup');
  const pastePopup=api.document.getElementById('pastePrecisionPopup');
  function pastePrerequisites(){
    if(!game||!game.thermalPasteEnabled)return 'La aplicación clásica está activada.';
    const st=api.state();
    if(st.power||st.caseClosed)return 'Apaga el PC y abre la caja antes de aplicar pasta.';
    if(!st.installed.cpu||st.installed.cooler)
      return 'La pasta va sobre la CPU antes de instalar el disipador.';
    if(st.paste>0)return 'Ya hay pasta aplicada; termina o retira el disipador.';
    if(!has('item:paste'))return 'Compra una dosis de pasta térmica.';
    return '';
  }
  function openPastePractice(){
    const issue=pastePrerequisites();
    if(issue){message(issue,'warn');return false;}
    closeCpuPrecision();closeScrewPractice();
    if(ramPrecisionSession){ramPrecisionSession=null;stopRamAnimation();}
    game.openSections=['actions','mission'];paint();
    return pasteUi?.open()||false;
  }
  function togglePastePractice(){
    if(!game)return false;
    game.thermalPasteEnabled=!game.thermalPasteEnabled;
    if(!game.thermalPasteEnabled)pasteUi?.close();
    message(game.thermalPasteEnabled?'Jeringuilla térmica activada.':
      'Aplicación clásica de pasta térmica activada.','ok');
    return game.thermalPasteEnabled;
  }
  function thermalNext(){
    if(!game)return false;
    const st=api.state();
    if(!st.installed.cpu||st.installed.cooler||!st.paste){
      message('Aplica primero la pasta sobre la CPU y comprueba que el disipador siga pendiente.');return false;
    }
    // Usar una pieza real del inventario, no crear ni seleccionar un
    // disipador que no se haya comprado.
    const cooler=Object.keys(game.stock).find(k=>k.startsWith('cooler:')&&has(k));
    if(cooler){
      game.selected=cooler;
      game.verb='fit';
      game.openSections=['inventory','actions'];
      message('Pasta preparada. Disipador seleccionado: pulsa «Encajar» en Acciones.','ok');
      return true;
    }
    game.shopCategory='cooler';
    game.openSections=['shop','actions'];
    openStore('cooler');
    message('Pasta preparada. Compra un disipador en Tienda → Disipador; después podrás encajarlo.','ok');
    return false;
  }
  function onPasteConfirm(deposit){
    if(!game||game.selected!=='item:paste'||pastePrerequisites())return false;
    pasteBypass=true;let result;
    try{result=apply('item:paste');}finally{pasteBypass=false;}
    if(result?.status!=='success'||!api.state().paste)return false;
    game.thermalPaste={dots:deposit.dots,volume:deposit.volume,status:'ready'};
    pasteSpread=root.PC_THERMAL_PASTE.createSpread(deposit.dots);
    game.thermalHistory.push({type:'applied',volume:Math.round(deposit.volume*100)/100});
    thermalNext();
    return true;
  }
  pasteUi=root.PC_PASTE_UI.create({popup:pastePopup,onConfirm:onPasteConfirm,
    onCancel:()=>message('Jeringuilla cancelada: no se ha consumido pasta.')});
  function thermalReview(){
    if(!pasteSpread)return null;
    const r=pasteSpread.getState();
    return {quality:r.quality,coverage:r.coverage,overflow:r.overflow,
      peakImbalance:r.peakImbalance,volume:r.volume};
  }
  function finishCoolerPractice(clean=false){
    if(!game?.pasteReview||!screwSession||
      !screwSession.getState().target.startsWith('cooler:'))return false;
    if(clean){
      closeScrewPractice();
      const record=perform('remove');
      if(record?.status!=='success')return false;
      api.state().paste=0;game.thermalPaste=null;pasteSpread=null;
      game.thermalHistory.push({type:'clean',minutes:2});
      game.pasteReview=null;
      clock.add('technical',2,'paste-clean');
      message('Disipador retirado y pasta limpiada. Necesitas otra dosis para repetir.','warn');
      return true;
    }
    const review=game.pasteReview;
    closeScrewPractice();screwBypass=true;let record;
    try{record=perform('screw');}finally{screwBypass=false;}
    if(record?.status!=='success')return false;
    game.thermalHistory.push({type:'final',...review});
    if(game.thermalPaste)game.thermalPaste.status='sealed';
    api.state().paste=review.quality==='good'?1:.5;
    game.pasteReview=null;
    message(review.quality==='good'?'Disipador fijado: cobertura '+review.coverage+
      '%, rebose '+review.overflow+'%.':
      'Disipador fijado con advertencia térmica ('+review.quality+
      '). Para corregir, retira el disipador y renueva la pasta.',
      review.quality==='good'?'ok':'warn');
    return true;
  }

  const cpuPopup=api.document.getElementById('cpuPrecisionPopup');
  const cpuNow=()=>root.performance?.now?.()??0;
  function stopCpuAnimation(){
    if(cpuFrame&&root.cancelAnimationFrame)root.cancelAnimationFrame(cpuFrame);
    cpuFrame=0;
  }
  function closeCpuPrecision(){
    stopCpuAnimation();cpuSession=null;cpuDragging=false;
    if(cpuPopup){cpuPopup.hidden=true;cpuPopup.innerHTML='';}
  }
  function cpuPrecisionState(){return cpuSession?.getState()||null;}
  function cpuPrerequisites(){
    const st=api.state(),selected=String(game?.selected||'');
    const id=selected.split(':')[1];
    if(!game||!selected.startsWith('cpu:')||!game.cpuPrecisionEnabled)
      return 'Selecciona una CPU para instalar.';
    if(!has(selected))return 'Compra una CPU antes de instalarla.';
    if(!st.installed.case||!st.installed.motherboard)
      return 'Coloca la caja y la placa base antes de presentar la CPU.';
    if(st.power||st.caseClosed)return 'Apaga el ordenador y abre la caja antes de tocar el zócalo.';
    if(st.installed.cpu||st.installed.cooler)
      return 'Retira primero la CPU o el disipador ya instalados.';
    const cpu=api.catalog.cpus?.[id],board=api.part('motherboard');
    if(!cpu?.socket||!board?.socket)return 'No se puede identificar el tipo de zócalo.';
    if(cpu.socket!==board.socket)
      return 'CPU '+cpu.socket+' incompatible con zócalo '+board.socket+'. Elige una compatible.';
    return '';
  }
  function openCpuPrecision(){
    const problem=cpuPrerequisites();
    if(problem){message(problem,'warn');return false;}
    closeScrewPractice();
    ramPrecisionSession=null;ramCaptures={left:null,right:null};
    stopRamAnimation();
    if(!cpuSession)cpuSession=cpuEngine.begin({
      target:game.selected,socket:api.part('motherboard').socket
    });
    game.openSections=['actions','mission'];
    paint();
    cpuPopup?.querySelector('[data-cpu-piece]')?.focus?.();
    return true;
  }
  function toggleCpuPrecision(){
    if(!game)return false;
    game.cpuPrecisionEnabled=!game.cpuPrecisionEnabled;
    if(!game.cpuPrecisionEnabled)closeCpuPrecision();
    message(game.cpuPrecisionEnabled?
      'Minijuego de CPU activado para este encargo.':
      'Inserción clásica de CPU activada para este encargo.','ok');
    return game.cpuPrecisionEnabled;
  }
  function drawCpuForce(){
    if(!cpuSession||cpuSession.getState().stage!=='lever'){
      stopCpuAnimation();return;
    }
    const reading=root.PC_CPU_PRECISION.oscillatorValue(cpuNow()-cpuOscStart);
    const marker=cpuPopup?.querySelector('[data-cpu-force-marker]');
    const output=cpuPopup?.querySelector('[data-cpu-force-reading]');
    if(marker)marker.style.left=reading+'%';
    if(output)output.textContent=reading+'/100';
    if(root.requestAnimationFrame)cpuFrame=root.requestAnimationFrame(drawCpuForce);
  }
  function paintCpuPopup(){
    if(!cpuPopup)return;
    const active=!!game?.cpuPrecisionEnabled&&!!cpuSession;
    cpuPopup.hidden=!active;
    cpuPopup.innerHTML=active?cpuPopupMarkup():'';
    if(active&&cpuSession.getState().stage==='lever'&&!cpuFrame)drawCpuForce();
    else if(!active)stopCpuAnimation();
  }
  function cpuPrecisionMove(x,y){
    if(!cpuSession||!cpuSession.move(x,y))return false;
    drawCpuPiece();return true;
  }
  function cpuPiecePose(st){
    // El centro geométrico de la CPU y el zócalo coincide exactamente
    // con X=0, Y=0. "Bajar" modifica únicamente su escala (profundidad),
    // nunca su alineación vertical: antes lower=100 restaba 24px,
    // obligando a ajustar Y=12 para verla centrada.
    return {
      left:'calc(50% + '+(st.x*2)+'px)',
      top:'calc(50% + '+(st.y*2)+'px)',
      transform:'translate(-50%,-50%) rotate('+st.rotation+'deg) scale('+
        (1-st.lower*.001)+')'
    };
  }
  function drawCpuPiece(){
    if(!cpuSession||!cpuPopup)return;
    const st=cpuSession.getState(),piece=cpuPopup.querySelector('[data-cpu-piece]');
    if(piece){
      const pose=cpuPiecePose(st);
      piece.style.left=pose.left;
      piece.style.top=pose.top;
      piece.style.transform=pose.transform;
    }
    for(const [name,value] of [['X',st.x],['Y',st.y],['Lower',st.lower]]){
      const control=cpuPopup.querySelector('#cpu'+name);
      const output=cpuPopup.querySelector('#cpu'+name+'Value');
      if(control)control.value=String(value);
      if(output)output.textContent=String(value)+(name==='Lower'?'%':'');
    }
  }
  function cpuPrecisionStep(action){
    if(!cpuSession||!game)return null;
    if(action==='cancel'){
      closeCpuPrecision();message('Práctica CPU cancelada. El zócalo queda vacío.','warn');
      return null;
    }
    if(action==='rotate'){
      cpuSession.rotate();cpuFeedback='Alinea el triángulo y centra la CPU sobre el zócalo.';
      paint();return null;
    }
    if(action!=='present')return null;
    const result=cpuSession.present();
    if(!result)return null;
    cpuFeedback=result.message;
    if(!result.ok){
      const snapshot=cpuSession.getState();
      game.cpuPrecisionHistory.push({session:snapshot.id,component:game.selected,
        ...snapshot.attempts.at(-1)});
      if(result.penaltyMinutes)
        clock.add('technical',result.penaltyMinutes,'cpu-precision:'+result.code);
    }else cpuOscStart=cpuNow();
    paint();return result;
  }
  function cpuPrecisionCapture(value=null){
    if(!cpuSession||!game||cpuSession.getState().stage!=='lever')return null;
    const st=cpuSession.getState(),force=Number.isFinite(value)?
      value:root.PC_CPU_PRECISION.oscillatorValue(cpuNow()-cpuOscStart);
    if(st.target!==game.selected||cpuPrerequisites()){
      closeCpuPrecision();message('Condiciones de CPU cambiadas. Reinicia el montaje.');
      return null;
    }
    const result=cpuSession.capture(force);
    const snapshot=cpuSession.getState();
    game.cpuPrecisionHistory.push({session:snapshot.id,component:game.selected,
      ...snapshot.attempts.at(-1)});
    cpuFeedback=result.message;
    if(result.penaltyMinutes)
      clock.add('technical',result.penaltyMinutes,'cpu-precision:'+result.code);
    if(result.ok){
      closeCpuPrecision();cpuBypass=true;
      try{perform('fit');}finally{cpuBypass=false;}
      message(api.state().installed.cpu?
        'CPU insertada y palanca del zócalo cerrada correctamente.':
        'La prueba terminó, pero el montaje técnico rechazó la instalación.',
        api.state().installed.cpu?'ok':'warn');
    }else{
      cpuOscStart=cpuNow();
      stopCpuAnimation();
      paint();
    }
    return result;
  }
  function cpuPopupMarkup(){
    if(!game?.cpuPrecisionEnabled||!cpuSession)return '';
    const st=cpuSession.getState(),align=st.stage==='align',pose=cpuPiecePose(st);
    const controls=align?
      '<div class="cpu-precision-controls">'+
        '<button type="button" data-cpu-rotate>Girar procesador 90°</button>'+
        '<div class="cpu-align-grid">'+
          [['X','Centrado horizontal',st.x,-30,30],
           ['Y','Centrado vertical',st.y,-30,30],
           ['Lower','Bajar suavemente',st.lower,0,100]].map(([k,label,value,min,max])=>
            '<label for="cpu'+k+'">'+label+' <output id="cpu'+k+'Value">'+value+
            (k==='Lower'?'%':'')+'</output><input id="cpu'+k+'" type="range" min="'+
            min+'" max="'+max+'" value="'+value+'"></label>').join('')+
        '</div><button type="button" class="primary" data-cpu-present>'+
        'Apoyar CPU en zócalo</button></div>':
      '<div class="cpu-lever-controls"><p>CPU apoyada. Detén el marcador en verde '+
        'para cerrar la palanca de retención.</p>'+
        '<div class="cpu-force-scale" aria-label="Indicador oscilante de fuerza: rojo, '+
          'amarillo, verde, amarillo, rojo" role="img">'+
          '<i class="cpu-force-needle" data-cpu-force-marker style="left:50%"></i></div>'+
        '<div class="cpu-force-head"><span>Fuerza didáctica de palanca</span>'+
          '<output data-cpu-force-reading>50/100</output></div>'+
        '<button type="button" class="primary" data-cpu-capture>'+
        'Cerrar palanca · detener marcador</button>'+
        '<small>Zona verde: 58–74. No equivale a newtons ni a una fuerza recomendada.</small>'+
      '</div>';
    return '<section class="cpu-precision-dialog" role="dialog" aria-modal="true" '+
      'aria-label="Inserción de procesador CPU">'+
      '<header><div><small>TALLER 3D · ZÓCALO '+safe(st.socket)+'</small>'+
        '<h3>'+(align?'Orientar y colocar CPU':'Cerrar palanca de retención')+
        '</h3></div><button type="button" data-cpu-cancel '+
        'aria-label="Cancelar montaje CPU">✕</button></header>'+
      '<p>Haz coincidir las marcas triangulares del procesador y del zócalo. '+
        'No fuerces los contactos.</p>'+
      '<div class="cpu-precision-scene" aria-label="Esquema del zócalo y procesador">'+
        '<div class="cpu-socket"><span class="cpu-socket-triangle">◤</span>'+
          '<span class="cpu-socket-text">'+safe(st.socket)+'</span></div>'+
        '<div class="cpu-piece" data-cpu-piece tabindex="0" role="button" '+
          'aria-label="Arrastrar CPU, flechas para alinear y botón para girar" style="'+
          'left:'+pose.left+';top:'+pose.top+';transform:'+pose.transform+'">'+
          '<span class="cpu-corner-marker">◤</span><span>CPU</span></div>'+
        '<div class="cpu-retention-lid'+(align?'':' close')+
          '" aria-hidden="true"></div></div>'+
      controls+
      '<p class="cpu-feedback" role="status" aria-live="polite">'+safe(cpuFeedback)+'</p>'+
      '<footer><span>Intentos: '+st.attempts.length+
        ' · fallo: +0,6 min virtuales</span>'+
        '<button type="button" data-cpu-cancel>Cancelar y volver</button></footer>'+
      '</section>';
  }

  const screwable=new Set(['motherboard','psu','storage','gpu','cooler']);
  function screwLayout(target){return root.PC_SCREW_PRECISION.layoutFor(target);}
  function screwProgressFor(target){
    const cat=String(target).split(':')[0];
    let p=game.screwProgress[cat];
    if(!p||p.target!==target){
      p={target,completed:[]};game.screwProgress[cat]=p;
    }
    return p;
  }
  function screwNextHole(target){
    const done=screwProgressFor(target).completed;
    return screwLayout(target).findIndex(point=>!done.includes(point.id));
  }
  function screwPickHole(index){
    if(!screwSession||!game||game.pasteReview||!Number.isInteger(index))return false;
    const target=screwSession.getState().target,layout=screwLayout(target);
    if(index<0||index>=layout.length||
      screwProgressFor(target).completed.includes(layout[index].id))return false;
    // Preservar roscados parciales al alternar las esquinas.
    screwSessions.set(target+'|'+layout[screwHoleIndex].id,screwSession);
    screwHoleIndex=index;
    const key=target+'|'+layout[index].id;
    screwSession=screwSessions.get(key)||screwEngine.begin(target);
    screwSessions.set(key,screwSession);
    screwFeedback='Alinea el tornillo con el agujero seleccionado ('+
      (index+1)+'/'+layout.length+').';
    paint();return true;
  }
  function closeScrewPractice(){
    screwSession=null;screwDragging=false;screwHoleIndex=0;
    if(screwPopup){screwPopup.hidden=true;screwPopup.innerHTML='';}
  }
  function screwPracticeState(){return screwSession?.getState()||null;}
  function screwValid(target=game?.selected){
    if(!game||!target)return false;
    const [cat,id]=String(target).split(':');
    const st=api.state();
    return screwable.has(cat)&&!!st.installed[cat]&&
      !st.power&&!st.caseClosed&&!game.screwed[cat]&&
      !st.fixings?.[cat]&&!!game.screwPracticeEnabled&&
      owned('item:screwdriver')&&has('item:screws')&&
      (cat==='cooler'||st.selected[cat]===id);
  }
  function openScrewPractice(){
    if(!screwValid())return false;
    pasteUi?.close();
    // No se pueden tener dos prácticas superpuestas sobre el mismo visor.
    closeCpuPrecision();
    if(ramPrecisionSession){
      ramPrecisionSession=null;ramCaptures={left:null,right:null};
      stopRamAnimation();
    }
    if(screwSession&&screwSession.getState().target!==game.selected)
      closeScrewPractice();
    if(!screwSession){
      const next=screwNextHole(game.selected);
      if(next<0)return false;
      screwHoleIndex=next;
      const key=game.selected+'|'+screwLayout(game.selected)[next].id;
      screwSession=screwSessions.get(key)||screwEngine.begin(game.selected);
      screwSessions.set(key,screwSession);
      screwFeedback='Punto '+(next+1)+'/'+screwLayout(game.selected).length+
        ': arrastra el tornillo al agujero y gira la rueda para roscar.';
    }
    game.openSections=['actions','mission'];
    paint();
    screwPopup?.querySelector('[data-screw-head]')?.focus?.();
    return true;
  }
  function continueCoolerMount(){
    // Un disipador YA encajado ha consumido su stock: no debe depender de
    // poder seleccionarlo de nuevo desde Inventario.
    const st=api.state();
    if(!game||!st.installed.cooler||st.fixings?.cooler||game.screwed.cooler){
      if(game)message('Primero encaja un disipador pendiente de fijación.','warn');
      return false;
    }
    const coolerId=st.selected.cooler||'air';
    const coolerKey='cooler:'+coolerId;
    if(!owned(coolerKey)){
      message('No se encuentra el disipador instalado en este encargo.','warn');
      return false;
    }
    game.selected=coolerKey;
    game.verb='screw';
    if(!game.screwPracticeEnabled){
      game.awaitingCoolerTools=false;
      game.openSections=['inventory','actions'];
      message('Atornillado clásico seleccionado. Pulsa «Atornillar» para completar la fijación.','ok');
      return false;
    }
    const missing=[!owned('item:screwdriver')?'destornillador':null,
      !has('item:screws')?'tornillos':null].filter(Boolean);
    if(missing.length){
      game.awaitingCoolerTools=true;
      game.shopCategory='item';
      openStore('item');
      game.openSections=['shop','actions'];
      message('Disipador encajado. Para iniciar el minijuego de presión compra '+
        missing.join(' y ')+' en Tienda → Material; la práctica se abrirá al tenerlos.','warn');
      return false;
    }
    game.awaitingCoolerTools=false;
    game.openSections=['actions','mission'];
    if(openScrewPractice())return true;
    message('No se puede iniciar el atornillado: apaga el PC, abre la caja y revisa la fijación.','warn');
    return false;
  }
  function toggleScrewPractice(){
    if(!game)return false;
    game.screwPracticeEnabled=!game.screwPracticeEnabled;
    if(!game.screwPracticeEnabled)closeScrewPractice();
    message(game.screwPracticeEnabled?
      'Atornillado de precisión activado: alinea y gira con la rueda.':
      'Atornillado clásico activado para este encargo.','ok');
    return game.screwPracticeEnabled;
  }
  function drawScrewPractice(){
    if(!screwPopup||!screwSession)return;
    const st=screwSession.getState();
    const head=screwPopup.querySelector('[data-screw-head]');
    const progress=screwPopup.querySelector('#screwDepthFill');
    const output=screwPopup.querySelector('#screwDepthValue');
    const feedback=screwPopup.querySelector('#screwFeedback');
    const accuracy=screwPopup.querySelector('#screwAlignStatus');
    if(head){
      head.style.left=st.x+'%';head.style.top=st.y+'%';
      // Visualizar cada giro, incluso cuando la rosca no engancha.
      head.style.transform='translate(-50%,-50%) rotate('+(st.turns*45)+
        'deg) scale('+(1-st.depth*.002)+')';
    }
    if(progress)progress.style.width=st.depth+'%';
    const meter=screwPopup.querySelector('[role="progressbar"]');
    if(meter)meter.setAttribute('aria-valuenow',String(st.depth));
    if(output)output.textContent=st.depth+'%';
    if(feedback)feedback.textContent=screwFeedback;
    if(accuracy)accuracy.textContent=st.aligned?
      '✓ Tornillo centrado: la rosca puede avanzar.':
      'Tornillo desalineado: al girar no entra.';
  }
  function screwMove(x,y){
    if(!screwSession||!screwSession.move(x,y))return false;
    drawScrewPractice();return true;
  }
  function screwTurn(direction=1){
    if(!screwSession||!game||game.pasteReview)return null;
    const target=screwSession.getState().target;
    if(target!==game.selected||!screwValid(target)){
      closeScrewPractice();
      message('Las condiciones de montaje cambiaron. Revisa la pieza y las herramientas.');
      return null;
    }
    const result=screwSession.turn(direction);
    if(!result)return null;
    const points=screwLayout(target),point=points[screwHoleIndex];
    const progress=screwProgressFor(target);
    game.screwHistory.push({session:screwSession.getState().id,
      anchor:point.id,anchorIndex:screwHoleIndex,...result});
    if(target.startsWith('cooler:')&&pasteSpread&&result.code!=='not_engaged'){
      pasteSpread.tighten(screwHoleIndex,result.depth);
      // La presión modifica el dibujo EN EL MISMO GIRO. Nunca esperar a
      // completar los cuatro tornillos para pintar la pasta.
      root.PC_PASTE_UI.updateSpread(screwPopup,pasteSpread,screwHoleIndex);
    }
    if(result.penaltyMinutes)
      clock.add('technical',result.penaltyMinutes,'screw-precision:misaligned');
    screwFeedback=result.code==='not_engaged'?
      'Giro en falso: el tornillo no ha cogido la rosca. Corrige la alineación.':
      result.code==='unscrewing'?'Aflojando: disminuye la profundidad.':
      result.complete?'El tornillo ha alcanzado la profundidad correcta.':
      'Enroscando correctamente: la profundidad aumenta.';
    if(result.complete){
      // Cada punto terminado requiere su propio tornillo. En el último
      // punto delegamos el consumo restante y el estado de fijación
      // exclusivamente al handler técnico de siempre.
      if(progress.completed.length+1<points.length){
        if(!expend('item:screws')){
          closeScrewPractice();
          message('No quedan tornillos. Compra otro paquete para seguir.');return result;
        }
        progress.completed.push(point.id);
        screwSessions.delete(target+'|'+point.id);
        // Cada anclaje requiere tiempo, además del tiempo de la operación
        // técnica final. Se suma una sola vez por tornillo terminado.
        clock.add('technical',.5,'screw-precision:anchor');
        screwHoleIndex=screwNextHole(target);
        if(!has('item:screws')){
          closeScrewPractice();
          message('Fijados '+progress.completed.length+'/'+points.length+
            ' puntos. Compra más tornillos para continuar.','warn');
        }else{
          const key=target+'|'+points[screwHoleIndex].id;
          screwSession=screwSessions.get(key)||screwEngine.begin(target);
          screwSessions.set(key,screwSession);
          screwFeedback='Tornillo '+progress.completed.length+'/'+points.length+
            ' fijado. Continúa con el punto '+(screwHoleIndex+1)+'.';
          paint();
          screwPopup?.querySelector('[data-screw-head]')?.focus?.();
        }
      }else if(target.startsWith('cooler:')&&pasteSpread){
        screwSessions.delete(target+'|'+point.id);
        game.pasteReview=thermalReview();
        screwFeedback='Los cuatro tornillos están apretados. Revisa la pasta.';
        paint();
      }else{
        closeScrewPractice();screwBypass=true;
        try{perform('screw');}finally{screwBypass=false;}
        if(!api.state().fixings?.[target.split(':')[0]])
          message('No se pudo confirmar la fijación. Comprueba el montaje.');
      }
    }else{
      drawScrewPractice();
      const c=panel.querySelector('#advVirtualClock');
      if(c)c.textContent='Tiempo virtual: '+clock.getSummary().total+' min · '+
        operationEngine.getHistory().length+' operaciones registradas';
    }
    return result;
  }
  function screwPopupMarkup(){
    if(!game?.screwPracticeEnabled||!screwSession)return '';
    const st=screwSession.getState(),holes=screwLayout(st.target),
      progress=screwProgressFor(st.target);
    const anchors=holes.map((hole,i)=>{
      const done=progress.completed.includes(hole.id),current=i===screwHoleIndex;
      return '<button type="button" class="screw-anchor'+
        (done?' completed':'')+(current?' current':'')+
        '" data-screw-hole="'+i+'" style="left:'+hole.x+'%;top:'+hole.y+
        '%" aria-label="'+safe(hole.label)+(done?' fijado':current?' seleccionado':' libre')+
        '" aria-pressed="'+current+'"'+(done?' disabled':'')+'>'+
        (done?'✚':current?'◎':'○')+'</button>';
    }).join('');
    if(game.pasteReview&&st.target.startsWith('cooler:')){
      const r=game.pasteReview;
      const qualityLabel={good:'Cobertura equilibrada',
        unbalanced:'Apriete desigual',insufficient:'Cantidad insuficiente',
        excessive:'Exceso de pasta',uneven:'Distribución irregular'}[r.quality]||r.quality;
      return '<section class="screw-precision-dialog" role="dialog" aria-modal="true" '+
        'aria-label="Resultado de la pasta térmica">'+
        '<header><h3>Resultado final de la pasta y el disipador</h3></header>'+
        root.PC_PASTE_UI.spreadMarkup(pasteSpread,screwHoleIndex)+
        '<p><b>Resultado: '+safe(qualityLabel)+'</b>. '+
        (r.quality==='good'?'Distribución adecuada.':
        'Riesgo de mala transferencia térmica o presión irregular.')+'</p>'+
        '<div class="screw-fallback-controls"><button type="button" class="primary" '+
        'data-cooler-finish>Finalizar instalación del disipador</button>'+
        '<button type="button" data-cooler-clean>Limpiar y repetir</button></div></section>';
    }
    return '<section class="screw-precision-dialog'+
      (st.target.startsWith('cooler:')&&pasteSpread?' has-thermal-spread':'')+
      '" role="dialog" aria-modal="true" aria-label="Minijuego de atornillado">'+
      '<header><div><small>TALLER 3D · FIJACIÓN</small><h3>Atornillar '+safe(label(...st.target.split(':')))+
      '</h3></div><button type="button" data-screw-cancel aria-label="Cerrar atornillado">✕</button></header>'+
      // En el disipador los cuatro tornillos y la pasta comparten un
      // tablero de dos columnas: nada flotante, pegajoso ni superpuesto.
      (st.target.startsWith('cooler:')&&pasteSpread?
        '<div class="cooler-screw-layout"><div class="cooler-pressure-column">'+
        root.PC_PASTE_UI.spreadMarkup(pasteSpread,screwHoleIndex):'')+
      (st.target.startsWith('cooler:')&&pasteSpread?'':'<p>Fijaciones de '+
        safe(label(...st.target.split(':')))+': <b>'+progress.completed.length+
        '/'+holes.length+'</b> tornillos fijados. Tornillos disponibles: '+
        stock('item:screws')+'.</p>')+
      '<div class="screw-anchor-map" role="group" aria-label="Puntos de anclaje del componente">'+
      '<div class="screw-part-outline"></div>'+anchors+'</div>'+
      (st.target.startsWith('cooler:')&&pasteSpread?
        '</div><div class="cooler-tool-column">'+
        '<p class="cooler-screw-count"><b>'+progress.completed.length+'/'+holes.length+
        '</b> fijados · '+stock('item:screws')+' tornillos disponibles</p>'+
        '<p class="cooler-screw-tip">Elige esquina, centra el tornillo y gira la rueda.</p>':
        '<p>Selecciona un agujero libre. Arrastra el tornillo hacia su centro '+
        'y gira la rueda hacia abajo para enroscar.</p>')+
      '<div class="screw-alignment-board" aria-label="Área para alinear el tornillo">'+
      '<div class="screw-hole" aria-hidden="true"><span>+</span></div>'+
      '<div class="screw-head" data-screw-head role="button" tabindex="0" '+
      'aria-label="Arrastrar tornillo; flechas para ajustar; rueda o teclas más y menos para girar" '+
      'style="left:'+st.x+'%;top:'+st.y+'%"><span>✚</span></div></div>'+
      '<p id="screwAlignStatus" class="screw-alignment-status"></p>'+
      '<div class="screw-depth-top"><strong>Profundidad de inserción</strong>'+
      '<output id="screwDepthValue">'+st.depth+'%</output></div>'+
      '<div class="screw-depth-track" role="progressbar" aria-label="Profundidad" '+
      'aria-valuemin="0" aria-valuemax="100" aria-valuenow="'+st.depth+'">'+
      '<div id="screwDepthFill" style="width:'+st.depth+'%"></div></div>'+
      '<p id="screwFeedback" role="status" aria-live="polite">'+safe(screwFeedback)+'</p>'+
      '<div class="screw-fallback-controls">'+
      '<button type="button" data-screw-turn="1">Enroscar ↻</button>'+
      '<button type="button" data-screw-turn="-1">Aflojar ↺</button>'+
      '</div>'+
      (st.target.startsWith('cooler:')&&pasteSpread?'</div></div>':'')+
      '<footer><span>Giro en falso: +0,2 min virtuales · sin gasto de tornillo</span>'+
      '<button type="button" data-screw-cancel>Cancelar práctica</button></footer>'+
      '</section>';
  }
  function paintScrewPopup(){
    if(!screwPopup)return;
    const active=!!game?.screwPracticeEnabled&&!!screwSession;
    screwPopup.hidden=!active;
    screwPopup.innerHTML=active?screwPopupMarkup():'';
    if(active){
      drawScrewPractice();
      if(screwSession.getState().target.startsWith('cooler:')&&pasteSpread)
        root.PC_PASTE_UI.updateSpread(screwPopup,pasteSpread,screwHoleIndex);
    }
  }
  let ramFrame=0,ramOscillationStart=0,ramCaptures={left:null,right:null};
  const ramNow=()=>root.performance?.now?.()??0;
  function stopRamAnimation(){
    if(ramFrame&&root.cancelAnimationFrame)root.cancelAnimationFrame(ramFrame);
    ramFrame=0;
  }
  function drawRamOscillators(){
    if(!game||!ramPrecisionSession||ramPrecisionSession.getState().stage!=='pressure'){
      stopRamAnimation();return;
    }
    for(const side of ['left','right']){
      const captured=ramCaptures[side];
      const value=captured===null?
        root.PC_RAM_PRECISION.oscillatorValue(ramNow()-ramOscillationStart,side):
        captured;
      const marker=ramPopup?.querySelector('[data-ram-marker="'+side+'"]');
      const number=ramPopup?.querySelector('[data-ram-reading="'+side+'"]');
      if(marker)marker.style.left=value+'%';
      if(number)number.textContent=captured===null?
        'Oscilando · '+value+' / 100':'Fijada · '+value+' / 100';
    }
    if(root.requestAnimationFrame)ramFrame=root.requestAnimationFrame(drawRamOscillators);
  }
  function ramPrecisionCapture(side,elapsedMs=null){
    if(!ramPrecisionSession||ramPrecisionSession.getState().stage!=='pressure'||
      !['left','right'].includes(side)||ramCaptures[side]!==null)return null;
    const elapsed=Number.isFinite(elapsedMs)?elapsedMs:ramNow()-ramOscillationStart;
    const value=root.PC_RAM_PRECISION.oscillatorValue(elapsed,side);
    ramCaptures[side]=value;
    ramPrecisionSession.setPressure(side,value);
    if(ramCaptures.left!==null&&ramCaptures.right!==null)
      return ramPrecisionStep('press');
    paintRamPopup();
    return Object.freeze({side,value,waitingForOther:true});
  }
  const field=id=>api.document.getElementById(id);
  const query=(selector)=>panel.querySelector(selector);
  const label=(cat,id)=>{
    const k=key(cat,id);
    return LABELS[k]||api.catalog[{
      motherboard:'motherboards',cpu:'cpus',ram:'ram',storage:'storage',
      gpu:'gpus',psu:'psus'
    }[cat]]?.[id]?.name||k;
  };
  const price=(cat,id)=>OFFERS[cat]?.find(x=>x[0]===id)?.[1]??null;
  function message(text,level='warn'){
    if(!game)return;
    game.messages.unshift({text,level});
    game.lastFeedback={text,level};
    game.messages=game.messages.slice(0,9);
    api.log(level,text);
    paint();
  }
  const stock=(k)=>game?.stock[k]||0;
  const owned=(k)=>k==='item:screwdriver'&&workshop.owns('screwdriver')||stock(k)>0||!!game?.used[k];
  const has=(k)=>stock(k)>0;
  function expend(k,amount=1){
    if(stock(k)<amount)return false;
    game.stock[k]-=amount;
    game.used[k]=(game.used[k]||0)+amount;
    return true;
  }
  function start(which='office'){
    if(!CASES[which])return;
    api.reset();
    const state=api.state();
    state.adventureMode=true;state.fixings={};state.osInstalled=false;state.installedOs=null;
    state.usbImage='none';state.usbConnected=false;state.usbMediaKey=null;state.paste=0;state.videoPort=which==='office'?'motherboard':'gpu';
    state.selected.gpu=which==='office'?'none':'rx7600';
    clock=root.PC_TIME.createClock();
    operationEngine=root.PC_OPERATIONS.createEngine({clock});
    mishaps=root.PC_MISHAPS.createEngine({seed:which+'-aula-1'});
    ramPrecisionEngine=root.PC_RAM_PRECISION.createEngine({seed:which+'-aula-1'});
    screwEngine=root.PC_SCREW_PRECISION.createEngine({seed:which+'-aula-1'});
    cpuEngine=root.PC_CPU_PRECISION.createEngine({seed:which+'-aula-1'});
    pasteUi?.close();pasteSpread=null;screwSessions.clear();
    closeCpuPrecision();closeScrewPractice();closeMeter();
    ramPrecisionSession=null;ramPrecisionBypass=false;
    stopRamAnimation();ramCaptures={left:null,right:null};
    game={
      caseId:which,budget:CASES[which].budget,spent:0,stock:{},used:{},
      selected:'',verb:'fit',connection:'atx24',videoOutput:which==='office'?'motherboard':'gpu',shopCategory:'case',openSections:['mission','shop'],
      screwed:{},messages:[],lastFeedback:null,attempts:0,inspection:'',report:null,
      purchases:[],osUSB:false,pendingDemo:false,
      riskEnabled:false,riskSeed:which+'-aula-1',esdConnected:false,incidents:[],
      pendingReview:0,pendingSataRepair:false,pendingSataLatent:false,
      ramPrecisionEnabled:true,ramPrecisionHistory:[],
      cpuPrecisionEnabled:true,cpuPrecisionHistory:[],
      screwPracticeEnabled:true,screwHistory:[],screwProgress:{},
      thermalPasteEnabled:true,thermalPaste:null,thermalHistory:[],pasteReview:null,
      awaitingCoolerTools:false,storeInfo:null,storeQuery:'',sellerTopic:'materials',
       meterOpen:false,meterMode:'vdc',meterJack:'vohm',meterPoint:'psu12',
       meterTest:'pins',meterConnector:'atx24',meterRedPin:10,meterBlackPin:3,
       meterLead:'red',meterHelpMode:'signals',meterFace:'contacts',meterReading:null,meterShorts:0,benchTests:[],cleanings:[]
    };
    state.casePlaced=false;
    api.document.body.classList.add('adventure-on');
    api.document.body.classList.remove('adventure-store-on');
    message('Nuevo encargo: '+CASES[which].client+'. Compra componentes y herramientas antes de montar.','ok');
    api.render();
  }
  function runTechnicalDemo(){
    // La demostración no consume presupuesto ni entrega encargos.
    exit();
    api.demoBuild?.();
    api.document.getElementById('workshopFeedback').textContent=
      'Demostración técnica cargada: utiliza Encender PC o Entrar BIOS.';
  }
  function demoBuild(){
    if(!game)return;
    const hasProgress=game.purchases.length>0||
      Object.values(api.state().installed||{}).some(Boolean);
    if(!hasProgress){runTechnicalDemo();return;}
    // Confirmación accesible dentro del panel, evitando window.confirm
    // que muchos navegadores de prueba y bloqueadores cierran sin avisar.
    game.pendingDemo=true;game.openSections=['mission','actions'];
    message('La demostración reiniciará este encargo y sus compras. Confirma o cancela aquí.', 'warn');
  }
  function cancelDemo(){
    if(!game)return;
    game.pendingDemo=false;
    message('Demostración cancelada. Se conservan las compras.', 'ok');
  }
  function exit(){
    pasteUi?.close();pasteSpread=null;screwSessions.clear();
    closeCpuPrecision();closeScrewPractice();closeMeter();
    stopRamAnimation();ramPrecisionSession=null;ramCaptures={left:null,right:null};
    api.stage?.([], '');api.tools?.([]);
    api.document.body.classList.remove('adventure-on');
    api.document.body.classList.remove('adventure-store-on');
    const state=api.state();
    state.adventureMode=false;
    game=null;
    api.reset();
    api.render();
    paint();
  }
  function canReturn(k){
    const qty=k==='item:screws'?10:1;
    const st=api.state();
    const connected={
      'item:hdmi':st.monitorCable,
      'item:sataCable':st.sataData,
      'item:keyboard':st.keyboardConnected,
      'item:mouse':st.mouseConnected
    };
    // No se puede devolver un cable, teclado o ratón todavía en uso.
    if(connected[k]&&stock(k)<=1)return false;
    if(api.state().usbConnected&&api.state().usbMediaKey===k)return false;
    if(k==='item:esdStrap'&&game?.esdConnected)return false;
    return !!game&&stock(k)>=qty&&game.purchases.some(p=>p.k===k);
  }
  function returnItem(k){
    if(!game||!canReturn(k)){
      message('Sólo puedes devolver piezas sin montar o consumibles sin gastar. Retira primero la pieza instalada.');
      return false;
    }
    const idx=game.purchases.findLastIndex(p=>p.k===k);
    if(idx<0)return false;
    const paid=game.purchases[idx].price;
    game.purchases.splice(idx,1);
    game.stock[k]-=k==='item:screws'?10:1;
    game.spent=Math.max(0,game.spent-paid);
    if(game.selected===k&&stock(k)===0)
      game.selected=Object.keys(game.stock).find(x=>stock(x)>0)||'';
    message('Devolución de '+label(...k.split(':'))+': recuperas '+format(paid)+'.','ok');
    return true;
  }
  function exchange(k,newId){
    const [cat,oldId]=String(k).split(':');
    const next=key(cat,newId),cost=price(cat,newId);
    if(!game||cost==null||oldId===newId||!canReturn(k)){
      message('Selecciona una pieza sin instalar y otro producto de su categoría.');return false;
    }
    const idx=game.purchases.findLastIndex(p=>p.k===k);
    const oldCost=game.purchases[idx].price,delta=cost-oldCost;
    if(game.spent+delta>game.budget){
      message('El cambio necesita '+format(game.spent+delta-game.budget)+' más de saldo.');return false;
    }
    game.stock[k]-=k==='item:screws'?10:1;
    game.purchases.splice(idx,1);
    game.stock[next]=(game.stock[next]||0)+(next==='item:screws'?10:1);
    game.purchases.push({k:next,price:cost});
    game.spent+=delta;game.selected=next;
    message('Cambio de '+label(cat,oldId)+' por '+label(cat,newId)+
      '. Diferencia: '+(delta>=0?'+':'')+format(delta)+'.','ok');
    return true;
  }
  // Todo objeto comprado permanece visible en la mesa auxiliar mientras
  // existe una unidad física en la mochila. Los montados abandonan la mesa.
  function stagedItems(){
    if(!game)return [];
    const available=Object.entries(game.stock)
      .filter(([k,n])=>n>0)
      .map(([k,n])=>{
        const [category,id]=k.split(':');
        return {key:k,category,id,label:label(category,id),quantity:n};
      });
    // Piezas esenciales primero; los consumibles siguen en el inventario.
    const priority=['case','motherboard','cpu','ram','cooler','gpu','psu','storage','item'];
    available.sort((a,b)=>priority.indexOf(a.category)-priority.indexOf(b.category));
    return available;
  }
  function purchase(cat,id){
    const cost=price(cat,id);
    if(cost==null||!game)return;
    const k=key(cat,id);
    if(k==='item:screwdriver'&&workshop.owns('screwdriver')){
      message('El destornillador ya pertenece al taller, sin coste ni duplicación.','ok');return;
    }
    if(game.spent+cost>game.budget){
      message('Saldo insuficiente: necesitas '+format(cost)+', te quedan '+format(game.budget-game.spent)+'.');
      return;
    }
    if(cat==='gpu'&&id==='none')return;
    game.stock[k]=(game.stock[k]||0)+(k==='item:screws'?10:1);
    game.spent+=cost;
    game.purchases.push({k,price:cost});
    game.selected=k;
    game.openSections=cat==='cooler'&&api.state().installed.cpu&&api.state().paste>0?
      ['inventory','actions']:['shop','inventory'];
    if(cat==='cooler'&&api.state().installed.cpu&&api.state().paste>0)
      game.verb='fit';
    // Tras comprar la primera caja se ve directamente sobre la mesa auxiliar.
    if(cat==='case')api.stagingView?.();
    message('Comprado: '+label(cat,id)+' por '+format(cost)+'.','ok');
    // El último material comprado reanuda el montaje pendiente del
    // disipador sin perderlo por haber cambiado la selección a «tornillos».
    if(game.awaitingCoolerTools&&
      (k==='item:screwdriver'||k==='item:screws')&&
      owned('item:screwdriver')&&has('item:screws')){
      closeStore();
      continueCoolerMount();
    }
  }
  function prepareUsb(osId){
    if(!game)return false;
    const entry=Object.entries(USB_PREPARED).find(([,p])=>p.os===osId);
    if(!entry){message('Selecciona un sistema válido para preparar el USB.');return false;}
    const [id,p]=entry;
    if(!has('item:osusb')){message('Compra antes un USB vacío de 32 GB.');return false;}
    if(game.spent+p.fee>game.budget){message('No hay saldo para preparar '+p.label+' por '+format(p.fee)+'.');return false;}
    const index=game.purchases.findLastIndex(p=>p.k==='item:osusb');
    if(index<0){message('No hay una memoria USB vacía disponible.');return false;}
    const item='item:'+id,old=game.purchases[index];
    game.purchases[index]={k:item,price:old.price+p.fee};
    game.stock['item:osusb']--;game.stock[item]=(game.stock[item]||0)+1;
    game.spent+=p.fee;game.selected=item;game.openSections=['inventory','actions'];
    message('USB de 32 GB preparado con '+p.label+' por '+format(p.fee)+
      '. Ya puedes conectarlo al PC.','ok');return true;
  }
  function connectInstallerUsb(item=game?.selected){
    if(!game)return false;
    const profile=USB_PREPARED[String(item).split(':')[1]],st=api.state();
    if(!profile||!has(item)){message('Selecciona un USB preparado que tengas comprado. El USB vacío no arranca.');return false;}
    if(!st.installed.motherboard){message('Instala la placa base para usar su puerto USB-A trasero.');return false;}
    if(st.osInstalling){message('No cambies de memoria durante la instalación.');return false;}
    if(st.usbConnected){message('Expulsa primero la memoria conectada.');return false;}
    st.usbConnected=true;st.usbImage=profile.os;st.usbMediaKey=item;
    game.selected=item;
    message('Memoria USB '+profile.label+' conectada a la placa base.','ok');
    // Pintar el puerto 3D fuera del evento de clic: WebGL puede tardar
    // en CI y no debe bloquear la interacción con el inventario.
    setTimeout(()=>api.render(),0);return true;
  }
  function disconnectInstallerUsb(){
    if(!game)return false;
    const st=api.state();
    if(!st.usbConnected){message('No hay un USB conectado.');return false;}
    if(st.osInstalling){message('No se puede expulsar durante la instalación.');return false;}
    st.usbConnected=false;st.usbImage='none';st.usbMediaKey=null;
    message('USB expulsado: ahora puedes conectar otro instalador.','ok');
    setTimeout(()=>api.render(),0);return true;
  }
  function toggleInstallerUsb(){return api.state().usbConnected?
    disconnectInstallerUsb():connectInstallerUsb();}
  function openRamPrecision(){
    closeCpuPrecision();closeScrewPractice();
    if(!game?.ramPrecisionEnabled||!root.PC_RAM_PRECISION)return false;
    const st=api.state(),[cat,id]=String(game.selected||'').split(':');
    if(cat!=='ram'||!st.installed.ram||st.ramSeated||
       st.selected.ram!==id||st.power||st.caseClosed)return false;
    if(!ramPrecisionSession)ramPrecisionSession=ramPrecisionEngine.begin();
    ramCaptures={left:null,right:null};
    game.openSections=['actions','mission'];
    paint();
    ramPopup?.querySelector('[data-ram-flip]')?.focus?.();
    return true;
  }
  function toggleRamPrecision(){
    if(!game)return false;
    game.ramPrecisionEnabled=!game.ramPrecisionEnabled;
    if(!game.ramPrecisionEnabled){
      ramPrecisionSession=null;ramCaptures={left:null,right:null};
      stopRamAnimation();
    }
    message(game.ramPrecisionEnabled?
      'Prueba de precisión RAM activada: al colocar un DIMM practicarás su asentamiento.':
      'Prueba de precisión RAM desactivada: disponible el encaje clásico.','ok');
    return game.ramPrecisionEnabled;
  }
  function ramPrecisionStep(kind){
    if(!ramPrecisionSession||!game)return null;
    let result=null;
    if(kind==='flip'){ramPrecisionSession.flip();paint();return null;}
    if(kind==='cancel'){
      stopRamAnimation();ramCaptures={left:null,right:null};
      ramPrecisionSession=null;
      message('Práctica cancelada. La RAM permanece sin asentar: puedes volver a intentarlo.','warn');
      return null;
    }
    result=kind==='present'?ramPrecisionSession.present():
      kind==='press'?ramPrecisionSession.press():null;
    if(!result)return null;
    if(result.step==='present'&&result.ok){
      ramCaptures={left:null,right:null};ramOscillationStart=ramNow();
      paint();return result;
    }
    const snapshot=ramPrecisionSession.getState();
    game.ramPrecisionHistory.push({session:snapshot.id,component:game.selected,
      ...snapshot.attempts.at(-1)});
    if(result.penaltyMinutes)
      clock.add('technical',result.penaltyMinutes,'ram-precision:'+result.code);
    if(result.step==='press'){
      // Nuevo intento con dos marcadores en movimiento, tras un fallo.
      stopRamAnimation();ramCaptures={left:null,right:null};
      ramOscillationStart=ramNow();
    }
    if(result.ok&&result.step==='press'){
      const before=api.state().ramSeated;
      if(!before&&api.state().installed.ram&&!api.state().power&&!api.state().caseClosed){
        ramPrecisionBypass=true;
        try{perform('fit');}finally{ramPrecisionBypass=false;}
      }
      if(api.state().ramSeated){
        ramPrecisionSession=null;
        message('RAM encajada con ambos cierres: '+result.message,'ok');
      }else{
        ramPrecisionSession=null;
        message('La prueba terminó, pero el montaje técnico rechazó el encaje. Revisa los prerrequisitos.','warn');
      }
    }else message(result.message,result.ok?'ok':'warn');
    return result;
  }
  function ramPrecisionState(){return ramPrecisionSession?.getState()||null;}
  function select(k){
    if(!owned(k)){message('No tienes ese objeto en el inventario.');return;}
    if(ramPrecisionSession&&game.selected!==k){
      ramPrecisionSession=null;stopRamAnimation();
      ramCaptures={left:null,right:null};
    }
    if(screwSession&&game.selected!==k)closeScrewPractice();
    if(cpuSession&&game.selected!==k)closeCpuPrecision();
    if(game.selected!==k)pasteUi?.close();
    game.selected=k;
    game.openSections=['inventory','actions'];
    paint();
  }
  function selectVerb(verb){game.verb=verb;paint();}
  function perform(override=null){
    if(!game)return;
    const verb=override||game.verb;
    if(verb==='fit'&&String(game.selected).startsWith('cooler:')&&
      api.state().installed.cooler&&!api.state().fixings?.cooler){
      continueCoolerMount();return null;
    }
    if(verb==='fit'&&String(game.selected).startsWith('cpu:')&&
       api.state().installed.motherboard){
      const cpuId=String(game.selected).split(':')[1];
      const cpuSocket=api.catalog.cpus?.[cpuId]?.socket;
      const boardSocket=api.part('motherboard')?.socket;
      if(cpuSocket&&boardSocket&&cpuSocket!==boardSocket){
        message('CPU '+cpuSocket+' incompatible con zócalo '+boardSocket+
          '. No se puede encajar este procesador.','warn');
        return null;
      }
    }
    if(verb!=='fit'&&cpuSession)closeCpuPrecision();
    if(verb==='fit'&&!cpuBypass&&game.cpuPrecisionEnabled&&
      String(game.selected).startsWith('cpu:')&&!api.state().installed.cpu){
      openCpuPrecision();return null;
    }
    if(verb!=='screw'&&screwSession)closeScrewPractice();
    if(verb==='screw'&&!screwBypass&&openScrewPractice())return null;
    if(verb==='fit'&&!ramPrecisionBypass&&game.ramPrecisionEnabled&&
      String(game.selected).startsWith('ram:')&&api.state().installed.ram&&
      !api.state().ramSeated){
      if(openRamPrecision())return null;
    }
    if(verb==='route'){
      const st=api.state(),was=!!st.psuAccessRouted;
      return tracked('route','psu-cables',()=>performLegacy(override),
        ()=>!was&&!!st.psuAccessRouted);
    }
    if(verb==='remove'){
      const st=api.state(),item=game.selected||'',cat=String(item).split(':')[0];
      const was=!!st.installed[cat];
      const record=tracked('remove',item||'sin-seleccion',()=>performLegacy(override),
        ()=>was&&!st.installed[cat]);
      if(record.status==='success'&&screwSession)closeScrewPractice();
      if(record.status==='success')
        for(const key of [...screwSessions.keys()])
          if(key.startsWith(cat+':'))screwSessions.delete(key);
      if(record.status==='success'&&game.screwProgress[cat]){
        // Retirar con destornillador libera los tornillos fijados.
        game.stock['item:screws']=(game.stock['item:screws']||0)+
          game.screwProgress[cat].completed.length;
        delete game.screwProgress[cat];
      }
      if(record.status==='success'&&cat==='cpu'){
        closeCpuPrecision();pasteUi?.close();pasteSpread=null;
        game.thermalPaste=null;game.pasteReview=null;st.paste=0;
      }
      if(record.status==='success'&&cat==='cooler'){
        game.pasteReview=null;game.awaitingCoolerTools=false;
      }
      if(record.status==='success'&&cat==='ram'){
        // Una retirada invalida la colocación física y cualquier sesión abierta.
        // La próxima instalación creará una práctica nueva automáticamente.
        ramPrecisionSession=null;ramCaptures={left:null,right:null};
        stopRamAnimation();paintRamPopup();
      }
      return record;
    }
    if(verb!=='fit'&&verb!=='screw')return performLegacy(override);
    const st=api.state(),k=game.selected,[cat,id]=String(k||'').split(':');
    const part=cat;
    const readResult=()=>verb==='screw'?!!st.fixings?.[part]:
      k==='item:ioShield'?!!st.ioShield:
      cat==='item'&&id==='fan'?st.caseFans.filter(x=>x.installed).length:
      cat==='ram'&&st.installed.ram&&!st.ramSeated?false:
      !!st.installed[part];
    const old=readResult(),wasRamInstalled=!!st.installed.ram,
      wasRamSeated=!!st.ramSeated;
    const record=tracked(verb,k||'sin-seleccion',()=>performLegacy(override),()=>{
      // El DIMM tiene dos hitos físicos distintos: colocar y asentar.
      // Colocarlo SIN cerrar pestañas no es un rechazo de la instalación.
      if(verb==='fit'&&cat==='ram')
        return wasRamInstalled?!wasRamSeated&&!!st.ramSeated:
          !!st.installed.ram&&!st.ramSeated;
      const now=readResult();
      return typeof old==='number'?now>old:!old&&!!now;
    });
    // La primera colocación RAM continúa usando el handler técnico real,
    // con consumo de inventario normal; el minijuego sustituye el clic
    // posterior que asienta las dos pestañas, sin instalar por adelantado.
    if(!ramPrecisionBypass&&game.ramPrecisionEnabled&&verb==='fit'&&
       cat==='ram'&&record.status==='success'&&st.installed.ram&&!st.ramSeated)
      openRamPrecision();
    // La instalación del disipador tiene dos fases físicas. Tras encajarlo,
    // abrir inmediatamente el minijuego de cuatro tornillos y presión
    // térmica, si dispone de herramientas; si no, explicar cómo comprarlas.
    if(verb==='fit'&&cat==='cooler'&&record.status==='success'&&
      st.installed.cooler&&!st.fixings?.cooler)
      continueCoolerMount();
    return record;
  }
  function performLegacy(override=null){
    if(!game)return;
    const g=game,st=api.state(),verb=override||g.verb,k=g.selected;
    if(verb==='boot'){
      const before=st.log?.[0];
      const powered=!!st.power;
      api.power();
      const explanation=st.log?.[0]!==before?st.log?.[0]?.m:null;
      if(powered!==!!st.power){
        message(st.power?'Equipo encendido. Revisa el POST en el monitor.':'Equipo apagado.','ok');
      }else{
        message('No se pudo encender/apagar: '+(explanation||
          'revisa POWER SW, 24 pines ATX, placa base y fuente.'),
          'warn');
      }
      g.openSections=['actions','delivery'];
      return;
    }
    if(verb==='route'){
      const before=st.log?.[0];
      api.action('route_psu');
      const reason=st.log?.[0]!==before?st.log?.[0]?.m:null;
      message(st.psuAccessRouted?
        'Mazos PSU apartados y asegurados. Ya puedes encajar la placa base.':
        'No se pudieron ordenar los cables: '+(reason||'comprueba que la fuente esté instalada y la caja abierta.'),
        st.psuAccessRouted?'ok':'warn');
      return;
    }
    if(verb==='bios'){
      const before=st.log?.[0],wasOpen=!!st.bios;
      api.bios();
      const explanation=st.log?.[0]!==before?st.log?.[0]?.m:null;
      message(wasOpen!==!!st.bios?
        (st.bios?'BIOS UEFI abierta. Puedes modificar el orden de arranque.':
          'BIOS cerrada.'):('No se puede entrar en BIOS: '+
        (explanation||'enciende el equipo, completa POST, conecta teclado y vídeo.')),
        wasOpen!==!!st.bios?'ok':'warn');
      g.openSections=['actions','delivery'];
      return;
    }
    if(verb==='inspect')return inspect();
    if(verb==='os'){installOS();return;}
    if(!k){message('Selecciona primero una pieza del inventario.');return;}
    if(verb==='connect')return connect(g.connection);
    if(verb==='disconnect')return disconnect(g.connection);
    if(verb==='apply')return apply(k);
    const [cat,id]=k.split(':');
    if(verb==='fit'){
      if(cat==='case'&&st.installed.case){
        message('La caja ya está situada en la mesa principal. Abre el panel para colocar componentes.');
        return;
      }
      if(cat==='ram'&&st.installed.ram&&!st.ramSeated){
        api.action('seat_ram');message('DIMM encajado en ambas pestañas.','ok');return;
      }
      if(k==='item:ioShield'){
        if(st.ioShield){
          message('La chapa I/O ya está encajada en los puertos traseros de la caja.','ok');
          return;
        }
        if(!has(k)){message('Necesitas comprar una chapa I/O.');return;}
        const beforeLog=st.log?.[0];
        try{api.installIOShield();}catch(err){
          message('No se pudo colocar la chapa I/O: '+(err?.message||String(err)));return;
        }
        if(st.ioShield){
          expend(k);
          message('Chapa I/O colocada en la abertura trasera USB/HDMI. Ya puedes montar la placa.','ok');
        }else{
          const reason=st.log?.[0]!==beforeLog?st.log?.[0]?.m:null;
          message('Chapa I/O no instalada: '+(reason||'revisa que la caja esté abierta, colocada y sin corriente.'));
        }
        return;
      }
      if(!has(k)){message('Ya has usado esa pieza o no está en el inventario.');return;}
      if(cat==='item'){
        if(id==='fan'){
          const i=st.caseFans.findIndex(f=>!f.installed);
          if(i<0){message('No hay ranuras libres de los tres ventiladores disponibles.');return;}
          api.fan(i,'install');
          if(st.caseFans[i].installed){expend(k);message('Ventilador encajado en ranura '+(i+1)+'. Falta conectar SYS_FAN.','ok');}
        }else message('Este objeto es una herramienta o consumible. Prueba otra acción.');
        return;
      }
      if(cat==='gpu'&&id==='none')return;
      const part=cat==='case'?'case':cat==='cooler'?'cooler':cat;
      if(cat!=='case'&&cat!=='cooler'){
        if(st.installed[part]&&st.selected[cat]!==id){
          message('Retira primero el componente anterior antes de colocar otro.');return;
        }
        st.selected[cat]=id;
      }
      const previous=!!st.installed[part];
      const previousLog=st.log?.[0];
      // La vista 3D se actualiza *dentro* de api.install. Es imprescindible
      // definir el color y el modelo de refrigeración ANTES de ese render.
      const oldFinish=st.selected.caseVariant||'tower';
      const oldCooler=st.selected.cooler||'air';
      if(part==='case')st.selected.caseVariant=id;
      if(part==='cooler')st.selected.cooler=id;
      try{api.install(part);}catch(err){
        st.selected.caseVariant=oldFinish;
        st.selected.cooler=oldCooler;
        api.render();
        message('Error instalando '+label(cat,id)+': '+(err?.message||String(err)));
        return;
      }
      if(!st.installed[part]&&!previous){
        // Una condición de montaje rechazó la operación; no pintar una caja
        // o disipador todavía sin instalar ni consumir la referencia.
        st.selected.caseVariant=oldFinish;
        st.selected.cooler=oldCooler;
        api.render();
      }
      if(st.installed[part]&&!previous){
        expend(k);
        if(part==='case'){
          st.casePlaced=true;
          api.workView?.();
          message('Caja '+label(cat,id)+' colocada con el acabado elegido.','ok');
        }
        if(part==='ram')message('Módulos colocados, pero hay que presionar hasta encajar el DIMM.','ok');
        else message(label(cat,id)+' encajado. Comprueba tornillos y conexiones.','ok');
      }else if(previous)message('La pieza ya está instalada: prueba atornillar o conectar.');
      else{
        const reason=st.log?.[0]!==previousLog?st.log?.[0]?.m:null;
        const detail=reason||st.lastRenderError||
          'La pieza no quedó instalada. Comprueba que el chasis esté abierto, sin alimentación y que los separadores estén accesibles.';
        message('No se puede montar '+label(cat,id)+': '+detail);
        g.openSections=['actions','mission'];
      }
      return;
    }
    if(verb==='screw'){
      if(cat==='item'){message('Selecciona una pieza instalada para atornillarla.');return;}
      const part=cat;
      if(!st.installed[part]){message('Antes de atornillar debes encajar la pieza.');return;}
      if(st.power){message('Apaga el ordenador antes de utilizar el destornillador.');return;}
      if(st.caseClosed){message('Abre el panel lateral antes de atornillar el hardware.');return;}
      if(!owned('item:screwdriver')||!has('item:screws')){
        const missing=[
          !owned('item:screwdriver')?'destornillador':null,
          !has('item:screws')?'tornillos':null
        ].filter(Boolean).join(' y ');
        message('Falta '+missing+'. Compra el material en la tienda, luego repite Atornillar.');return;
      }
      if(g.screwed[part]){message('Esta pieza ya está atornillada.','ok');return;}
      const points=screwLayout(k),progress=screwProgressFor(k);
      const remaining=points.filter(p=>!progress.completed.includes(p.id));
      if(stock('item:screws')<remaining.length){
        message('Faltan '+(remaining.length-stock('item:screws'))+
          ' tornillos para fijar '+label(cat,id)+'. Compra otro paquete.');return;
      }
      if(!expend('item:screws',remaining.length)){
        message('No quedan tornillos suficientes.');return;
      }
      progress.completed=points.map(point=>point.id);
      g.screwed[part]=true;st.fixings[part]=true;
      message('Atornillado: '+label(cat,id)+' ('+points.length+' puntos).','ok');
      return;
    }
    if(verb==='remove'){
      if(!st.installed[cat]){message('No hay esa pieza instalada.');return;}
      if(st.power||st.caseClosed){message('Apaga el PC y abre la caja para retirar componentes.');return;}
      if(cat!=='case'&&cat!=='cooler'&&cat!=='ram'&&st.selected[cat]!==id){
        message('Esa no es la pieza que está instalada. Selecciona la correcta.');return;
      }
      if(cat==='motherboard'&&['cpu','ram','cooler','gpu','storage'].some(p=>st.installed[p])){
        message('Antes de sacar la placa retira CPU, RAM, GPU, disipador y unidades fijadas a ella.');return;
      }
      if(cat==='cpu'&&st.installed.cooler){
        message('Debes desmontar primero el disipador para retirar el procesador.');return;
      }
      if(cat==='case'&&Object.entries(st.installed).some(([part,yes])=>part!=='case'&&yes)){
        message('La caja no se puede retirar mientras queden componentes en su interior.');return;
      }
      if(cat==='storage'&&st.selected.storage==='nvmeSSD'&&st.installed.gpu){
        message('Desmonta la GPU para acceder al tornillo M.2.');return;
      }
      if(cat!=='ram'&&!owned('item:screwdriver')){
        message('Necesitas un destornillador para retirar la pieza.');return;
      }
      st.installed[cat]=false;
      if(cat==='case')st.casePlaced=false;
      if(cat==='gpu'){st.gpuPower=false;st.monitorCable=false;}
      if(cat==='psu'){st.eps=false;st.atx24=false;st.gpuPower=false;}
      if(cat==='ram')st.ramSeated=false;
      if(cat==='cooler')st.cpuFan=false;
      if(cat==='storage'){st.sataData=false;st.sataPower=false;st.osInstalling=false;st.osInstallToken++;}
      delete g.screwed[cat];delete st.fixings[cat];
      g.stock[k]=(g.stock[k]||0)+1;
      message('Retirado: '+label(cat,id)+'. Queda disponible para volver a montar.','ok');
      api.render();return;
    }
    message('Esa acción no es válida para el objeto seleccionado.');
  }
  function apply(k){
    if(!game)return;
    if(k==='item:paste'&&!pasteBypass&&game.thermalPasteEnabled){
      openPastePractice();return null;
    }
    const prior=game.used[k]||0;
    return tracked('apply',k||'sin-seleccion',()=>applyLegacy(k),
      ()=>(game.used[k]||0)>prior);
  }
  function applyLegacy(k){
    const st=api.state();
    if(k==='item:rgbStrip'){
      if(!has(k)){message('Compra una tira LED ARGB antes de aplicarla.');return;}
      if(st.power||st.caseClosed||!st.installed.case){
        message('Apaga el PC, abre el chasis e instala una caja antes de añadir iluminación.');return;
      }
      if(st.rgbInstalled){message('La iluminación ARGB ya está montada.','ok');return;}
      expend(k);st.rgbInstalled=true;st.rgbOn=true;
      message('Tira LED ARGB instalada. Se iluminará con el equipo encendido.','ok');
      api.render();return;
    }
    if(k!=='item:paste'){message('Selecciona pasta térmica o una tira LED ARGB para aplicar.');return;}
    if(st.power||st.caseClosed){message('No apliques pasta con el PC encendido o cerrado.');return;}
    if(!st.installed.cpu||st.installed.cooler){
      message('La pasta se aplica sobre la CPU, antes de fijar el disipador.');return;
    }
    if(st.paste>0){message('Ya hay pasta aplicada sobre la CPU.');return;}
    if(!expend(k)){message('Ya no te queda pasta térmica. Compra otra aplicación.');return;}
    st.paste=1;
    message('Pasta térmica aplicada correctamente sobre la CPU.','ok');
    api.render();
  }
  function connect(target){
    if(!game)return;
    const st=api.state(),flag={atx24:'atx24',eps:'eps',frontpanel:'frontPanel',
      frontusb3:'frontUsb3',frontusbc:'frontUsbC',gpupower:'gpuPower',
      sataData:'sataData',sataPower:'sataPower',cpufan:'cpuFan',
      monitor:'monitorCable',keyboard:'keyboardConnected',mouse:'mouseConnected'}[target];
    const index=target.startsWith('sysfan')?Number(target.slice(-1)):-1;
    const was=index>=0?!!st.caseFans[index]?.connected:!!st[flag];
    return tracked('connect',target,()=>connectLegacy(target),()=>
      !was&&(index>=0?!!st.caseFans[index]?.connected:!!st[flag]));
  }
  function connectLegacy(target){
    const st=api.state();
    const internal=!['monitor','keyboard','mouse'].includes(target);
    if(internal&&(st.power||st.caseClosed)){
      message('Para conectar componentes internos, apaga y abre la caja.');return;
    }
    const preconditions={
      atx24:()=>st.installed.psu&&st.installed.motherboard,
      eps:()=>st.installed.psu&&st.installed.motherboard,
      frontpanel:()=>st.installed.case&&st.installed.motherboard,
      frontusb3:()=>st.installed.case&&st.installed.motherboard,
      frontusbc:()=>st.installed.case&&st.installed.motherboard,
      gpupower:()=>st.installed.psu&&st.installed.gpu,
      sataData:()=>st.installed.storage&&st.installed.motherboard&&api.part('storage').interface==='SATA',
      sataPower:()=>st.installed.storage&&st.installed.psu&&api.part('storage').interface==='SATA',
      cpufan:()=>st.installed.cooler&&st.installed.motherboard,
      monitor:()=>st.installed.motherboard,
      keyboard:()=>st.installed.motherboard,
      mouse:()=>st.installed.motherboard
    };
    if(target==='monitor'){
      if(game.videoOutput==='motherboard'){
        if(!st.installed.cpu||!api.part('cpu').igpu||
          !api.part('motherboard').videoOutputs?.length){
          message('El HDMI de placa requiere CPU con gráficos integrados. Intel F y Ryzen sin iGPU necesitan tarjeta gráfica.');return;
        }
      }else if(!st.installed.gpu||!st.gpuPower){
        message('GPU dedicada no instalada o sin alimentación. Elige salida de placa si tienes iGPU.');return;
      }
      st.videoPort=game.videoOutput;
    }
    if(target.startsWith('sysfan')){
      const n=Number(target.slice(-1));
      if(!st.caseFans[n]?.installed||!st.installed.motherboard){message('Instala el ventilador y la placa antes de conectar PWM.');return;}
      api.fan(n,'connect');
      message('SYS_FAN '+(n+1)+' conectado.','ok');return;
    }
    if(!preconditions[target]?.()){message('El conector no tiene instaladas las dos piezas necesarias.');return;}
    const material={sataData:'item:sataCable',monitor:'item:hdmi',
      keyboard:'item:keyboard',mouse:'item:mouse'}[target];
    if(material&&!owned(material)){message('Falta comprar '+LABELS[material]+'.');return;}
    const flags={atx24:'atx24',eps:'eps',frontpanel:'frontPanel',
      frontusb3:'frontUsb3',frontusbc:'frontUsbC',gpupower:'gpuPower',
      sataData:'sataData',sataPower:'sataPower',cpufan:'cpuFan',
      monitor:'monitorCable',keyboard:'keyboardConnected',mouse:'mouseConnected'};
    if(st[flags[target]]){message('Esa conexión ya está realizada.');return;}
    const actions={atx24:'connect_atx24',eps:'connect_eps',
      frontpanel:'connect_frontpanel',frontusb3:'connect_frontusb3',
      frontusbc:'connect_frontusbc',gpupower:'gpu_power',
      sataData:'connect_sata',sataPower:'connect_sata_power',cpufan:'connect_fan',
      monitor:'connect_monitor',keyboard:'connect_keyboard',mouse:'connect_mouse'};
    api.action(actions[target]);
    if(st[flags[target]])message('Conexión realizada: '+(CONNECTIONS.find(x=>x[0]===target)?.[1]||target)+'.','ok');
    else message('No se ha podido completar la conexión. Comprueba fuente y cableado.');
  }
  function disconnect(target){
    if(!game)return false;
    const st=api.state(),index=target.startsWith('sysfan')?
      Number(target.slice(-1)):-1;
    const flags={atx24:'atx24',eps:'eps',frontpanel:'frontPanel',
      frontusb3:'frontUsb3',frontusbc:'frontUsbC',
      gpupower:'gpuPower',sataData:'sataData',sataPower:'sataPower',
      cpufan:'cpuFan',monitor:'monitorCable',
      keyboard:'keyboardConnected',mouse:'mouseConnected'};
    const flag=flags[target];
    const active=()=>index>=0?!!st.caseFans[index]?.connected:!!st[flag];
    const was=active();
    return tracked('disconnect',target,()=>disconnectLegacy(target),
      ()=>was&&!active());
  }
  function disconnectLegacy(target){
    const st=api.state();
    const internal=!['monitor','keyboard','mouse'].includes(target);
    if(internal&&(st.power||st.caseClosed)){
      message('Apaga el equipo y abre la caja antes de soltar una conexión interna.');return false;
    }
    if(target.startsWith('sysfan')){
      const i=Number(target.slice(-1));
      if(!st.caseFans[i]?.connected){message('Ese ventilador ya está desconectado.');return false;}
      api.fan(i,'disconnect');
      message('SYS_FAN '+(i+1)+' desconectado.','ok');return true;
    }
    const props={atx24:'atx24',eps:'eps',frontpanel:'frontPanel',
      frontusb3:'frontUsb3',frontusbc:'frontUsbC',
      gpupower:'gpuPower',sataData:'sataData',sataPower:'sataPower',
      cpufan:'cpuFan',monitor:'monitorCable',keyboard:'keyboardConnected',
      mouse:'mouseConnected'};
    const property=props[target];
    if(!property||!st[property]){message('Esta conexión ya está suelta.');return false;}
    st[property]=false;
    message('Conexión retirada: '+(CONNECTIONS.find(c=>c[0]===target)?.[1]||target)+'.','ok');
    api.render();
    return true;
  }
  function installOS(){
    if(!api.state().usbConnected||!has(api.state().usbMediaKey)){
      message('Compra o prepara un USB y conéctalo antes de instalar.');return;
    }
    api.osInstall(); // Misma comprobación y animación que el taller técnico.
  }
  function inspect(){
    if(!game)return;
    return tracked('inspect','machine',()=>inspectLegacy(),()=>!!game.inspection);
  }
  function inspectLegacy(){
    const st=api.state(),e=api.evaluate();
    const symptoms=[];
    if(!st.power)symptoms.push('Equipo apagado. Prueba encenderlo para observar POST y pitidos.');
    else{
      if(!e.post)symptoms.push('POST interrumpido. Comprueba RAM, alimentación ATX/EPS y compatibilidad.');
      if(!st.monitorCable||!api.video(e))symptoms.push('Monitor sin señal: inspecciona cable de vídeo y alimentación de gráfica.');
      if(st.installed.storage&&api.part('storage').interface==='SATA'&&(!st.sataData||!st.sataPower))
        symptoms.push('Almacenamiento SATA no detectado por BIOS.');
      if(e.post&&!e.boot)symptoms.push('POST correcto pero sin arranque. Comprueba medio, BIOS y sistema operativo.');
      if(e.temp>=90)symptoms.push('Temperatura crítica. Revisa pasta térmica, disipador y ventiladores.');
      if(!symptoms.length)symptoms.push('El equipo responde. Comprueba que cumple los requisitos del cliente.');
    }
    if(game.pendingSataRepair)
      symptoms.push('Cable SATA de datos suelto: comprueba el conector y reconecta con el equipo apagado y la caja abierta.');
    game.inspection=symptoms.join(' ');
    message('Inspección: '+game.inspection,'ok');
  }
  function checkDelivery(){
    if(game?.pendingSataLatent){
      message('Verifica el arranque: hay una incidencia pendiente de comprobación.');return;
    }
    if(game?.pendingSataRepair){
      message('Repara el cable SATA de datos pendiente antes de entregar el equipo.');return;
    }
    if(game?.pendingReview){
      message('Completa una inspección para revisar las '+game.pendingReview+
        ' incidencias pendientes antes de entregar el equipo.');return;
    }
    const st=api.state(),ev=api.evaluate(),job=CASES[game.caseId];
    const size=parseInt(api.part('ram').name,10)||0;
    const drive=api.part('storage').interface;
    const checks=[
      ['Sin sobrepasar el presupuesto',game.spent<=job.budget],
      ['Encendido y POST correctos',st.power&&ev.post],
      ['Pantalla con señal de vídeo',api.video(ev)],
      ['Sistema operativo arrancado',ev.boot&&st.osInstalled&&st.biosCfg.boot==='ssd'],
      ['RAM al menos '+job.minRam+' GB',st.installed.ram&&size>=job.minRam],
      ['Almacenamiento '+job.minStorage,st.installed.storage&&
        (job.minStorage==='nvme'?drive==='M2_NVME':job.minStorage==='any'?true:
          ['sataSSD','sataSSD2','nvmeSSD','nvme2'].includes(st.selected.storage))],
      ['Gráfica adecuada',!job.gpu||!!st.installed.gpu&&!!st.gpuPower],
      ['Temperatura aceptable y CPU_FAN',ev.temp<=job.maxTemp&&!!st.installed.cooler&&!!st.cpuFan],
      ['Piezas fijadas y seguras',['motherboard','psu','storage']
        .every(x=>!st.installed[x]||st.fixings?.[x])],
      ['Conexiones externas y pasta',st.monitorCable&&st.keyboardConnected&&st.mouseConnected&&st.paste>=.7]
    ];
    const ok=checks.every(x=>x[1]);
    game.report={ok,checks,score:checks.filter(x=>x[1]).length,spent:game.spent};
    const earned=ok&&workshop.reward(game.caseId);
    message(ok?'¡Entrega aceptada por '+job.client+'!'+
      (earned?' Fondo del taller +110 € por primera entrega.':''):
      'Entrega rechazada: hay '+checks.filter(x=>!x[1]).length+' requisitos sin cumplir.',ok?'ok':'warn');
  }
  function storeFacts(cat,id){
    const model=api.catalog[{
      motherboard:'motherboards',cpu:'cpus',ram:'ram',storage:'storage',
      gpu:'gpus',psu:'psus',cooler:'coolers',case:'cases',
      item:'items'}[cat]]?.[id]||STORE_SPECIAL[key(cat,id)]||{};
    // Datos declarados por el catálogo, no veredicto de compatibilidad.
    const facts=[];
    function add(k,v){
      if(v==null||v==='')return;
      if(typeof v==='object'){
        for(const [sub,val] of Object.entries(v)){
          if(['string','number','boolean'].includes(typeof val))
            facts.push([k+' · '+sub,String(val)]);
        }
      }else facts.push([SHOP_FIELDS[k]||k,typeof v==='boolean'?(v?'Sí':'No'):String(v)]);
    }
    for(const [k,v]of Object.entries(model))
      if(!['name','id','image','icon','compatibility','compatible'].includes(k))add(k,v);
    if(cat==='item'&&id==='paste')facts.push(['Formato','1 aplicación de pasta térmica']);
    if(cat==='item'&&id==='screws')facts.push(['Contenido','10 tornillos de montaje']);
    if(cat==='item'&&id==='screwdriver')facts.push(['Herramienta','Destornillador para fijaciones']);
    return facts;
  }
  function sellerMessages(){
    const st=api.state(),tips=[];
    const have=k=>owned('item:'+k);
    if(!have('screwdriver'))
      tips.push(['🪛','¿Tienes destornillador?','Lo necesitarás para algunas fijaciones.']);
    if(!has('item:screws'))
      tips.push(['🔩','Revisa los tornillos','Hay componentes que necesitan varias fijaciones.']);
    if((st.installed.cpu||owned('cpu:r7600')||Object.keys(game.stock).some(k=>k.startsWith('cpu:')))&&
      !has('item:paste')&&!st.paste)
      tips.push(['🧴','No olvides la pasta térmica','Suele utilizarse antes de colocar el disipador.']);
    if(st.installed.motherboard&&!st.ioShield&&!have('ioShield'))
      tips.push(['🛡️','Revisa la chapa I/O','¿La has preparado para el montaje?']);
    if(st.installed.storage&&String(st.selected.storage||'').toLowerCase().includes('sata')&&
      !have('sataCable'))
      tips.push(['🔗','¿Tienes cable SATA?','Revisa también el cableado de alimentación.']);
    if(!tips.length)tips.push(['✅','Material básico previsto',
      'Revisa las fichas de cada componente antes de comprar.']);
    return tips.slice(0,4);
  }
  function storeProductCards(){
    const query=(game.storeQuery||'').trim().toLocaleLowerCase('es');
    const entries=(OFFERS[game.shopCategory]||[]).filter(([id])=>
      !query||label(game.shopCategory,id).toLocaleLowerCase('es').includes(query)||
      id.toLocaleLowerCase('es').includes(query));
    if(!entries.length)return '<p class="store-empty">No hay productos con ese nombre en esta categoría.</p>';
    return entries.map(([id,cost])=>{
      const cat=game.shopCategory,k=key(cat,id),facts=storeFacts(cat,id),
        available=stock(k),permanent=k==='item:screwdriver',
        affordable=permanent||cost<=game.budget-game.spent;
      return '<article class="store-product">'+
        '<div class="store-product-icon" aria-hidden="true">'+SHOP_ICONS[cat]+'</div>'+
        '<div class="store-product-main"><h3>'+safe(label(cat,id))+'</h3>'+
        '<p>'+safe(CATEGORIES[cat])+'</p>'+
        (facts.length?'<small>'+safe(facts.slice(0,2).map(([a,b])=>a+': '+b).join(' · '))+'</small>':
        '<small>Abre la ficha para examinar los datos disponibles.</small>')+
        (available?'<span class="store-owned">En inventario: '+available+'</span>':'')+
        '</div><div class="store-product-actions">'+
        '<strong class="store-price">'+(permanent?'Incluido':format(cost))+'</strong>'+
        '<button type="button" data-store-info="'+safe(k)+'">Ficha técnica</button>'+
        '<button type="button" class="primary" data-store-buy="'+safe(k)+'"'+
        (affordable?'':' disabled')+'>'+(permanent?'Ya está en el taller':'Comprar')+'</button></div></article>';
    }).join('');
  }
  function storeDetailMarkup(){
    if(!game.storeInfo)return '<div class="store-detail-empty">'+
      '<span aria-hidden="true">📋</span><h3>Ficha del componente</h3>'+
      '<p>Selecciona «Ficha técnica» en un producto para consultar sus características antes de comprar.</p>'+
      '<p>Compara por tu cuenta zócalo, dimensiones, tipo de memoria y conexiones.</p></div>';
    const [cat,id]=game.storeInfo.split(':'),facts=storeFacts(cat,id),
      title=label(cat,id),amount=price(cat,id);
    return '<div class="store-detail-head"><span aria-hidden="true">'+SHOP_ICONS[cat]+'</span>'+
      '<button type="button" data-store-close-info aria-label="Cerrar ficha">✕</button></div>'+
      '<h3>'+safe(title)+'</h3>'+
      '<p class="store-detail-price">'+format(amount)+'</p>'+
      '<p class="store-facts-note">Datos del catálogo educativo. Comprueba tú mismo '+
      'la compatibilidad con los demás componentes de tu equipo.</p>'+
      (facts.length?'<dl class="store-facts">'+facts.map(([a,b])=>
        '<div><dt>'+safe(a)+'</dt><dd>'+safe(b)+'</dd></div>').join('')+'</dl>':
        '<p>No se han declarado especificaciones adicionales para este artículo.</p>')+
      '<button type="button" class="primary" data-store-buy="'+safe(game.storeInfo)+'"'+
      (game.storeInfo==='item:screwdriver'?'':amount>game.budget-game.spent?' disabled':'')+'>'+ 
      (game.storeInfo==='item:screwdriver'?'Ya disponible en taller':'Comprar por '+format(amount))+'</button>';
  }
  function renderStore(){
    if(!storePage)return;
    if(!game){storePage.hidden=true;storePage.innerHTML='';return;}
    storePage.hidden=false;
    const remaining=game.budget-game.spent;
    storePage.innerHTML='<div class="store-page-head"><div>'+
      '<small>HARDWARE SIMULATOR · ALMACÉN DEL TALLER</small>'+
      '<h2>🛒 Tienda de componentes</h2>'+
      '<p>Compra con el presupuesto de tu encargo. Las compras aparecen en la mesa auxiliar del taller.</p>'+
      '</div><div class="store-page-actions">'+
      '<div class="store-money"><span>Presupuesto disponible</span><strong>'+format(remaining)+
      '</strong><small>Gastado: '+format(game.spent)+' / '+format(game.budget)+'</small></div>'+
      '<button type="button" class="primary" data-store-back>← Volver al taller</button></div></div>'+
      '<nav class="store-categories" aria-label="Categorías de componentes">'+
      Object.keys(OFFERS).map(cat=>
        '<button type="button" data-store-category="'+cat+'" class="'+
        (cat===game.shopCategory?'active':'')+'" aria-pressed="'+
        (cat===game.shopCategory)+'"><span aria-hidden="true">'+SHOP_ICONS[cat]+'</span>'+
        '<strong>'+safe(CATEGORIES[cat])+'</strong><small>'+OFFERS[cat].length+' productos</small></button>'
      ).join('')+'</nav>'+
      '<div class="store-content"><section class="store-catalogue">'+
      '<div class="store-searchbar"><label for="advShopCategory">Departamento</label>'+
      '<select id="advShopCategory">'+Object.keys(OFFERS).map(cat=>
        '<option value="'+cat+'"'+(cat===game.shopCategory?' selected':'')+'>'+
        safe(CATEGORIES[cat])+'</option>').join('')+'</select>'+
      '<label for="storeSearch">Buscar</label><input id="storeSearch" type="search" '+
      'placeholder="Nombre del componente..." value="'+safe(game.storeQuery)+'"></div>'+
      '<div id="storeItems" class="store-products">'+storeProductCards()+'</div></section>'+
      '<aside class="store-side"><section class="store-seller" aria-label="Vendedor virtual">'+
      '<div class="store-seller-heading"><span aria-hidden="true">🧑‍💼</span>'+
      '<div><strong>Álex · Vendedor de la tienda</strong>'+
      '<small>Consejos de material, no soluciones</small></div></div>'+
      '<p>«Te recuerdo herramientas y consumibles. Elegir componentes compatibles '+
      'es parte de tu práctica».</p>'+
      '<div class="store-seller-questions" role="group" aria-label="Preguntar al vendedor">'+
      '<button type="button" data-seller-topic="materials" aria-pressed="'+
      (game.sellerTopic!=='process')+'">¿Me falta material?</button>'+
      '<button type="button" data-seller-topic="process" aria-pressed="'+
      (game.sellerTopic==='process')+'">¿Cómo compro?</button></div>'+
      (game.sellerTopic==='process'?
        '<div class="store-seller-reply">«Abre la ficha técnica, compara las '+
        'características con tus otras piezas y pulsa Comprar. Al regresar al '+
        'taller verás lo adquirido en Inventario».</div>':
        '<ul>'+sellerMessages().map(([icon,headline,body])=>
          '<li><span aria-hidden="true">'+icon+'</span><div><strong>'+safe(headline)+
          '</strong><small>'+safe(body)+'</small></div></li>').join('')+'</ul>')+
      '</section><section class="store-detail" id="storeDetail" aria-label="Ficha previa a compra">'+
      storeDetailMarkup()+'</section></aside></div>'+
      '<p class="store-status" role="status" id="storeStatus">'+
      safe(game.lastFeedback?.text||'Consulta las fichas y selecciona tus artículos.')+'</p>';
  }
  function openStore(category=null){
    if(!game)return false;
    if(category&&OFFERS[category])game.shopCategory=category;
    game.storeInfo=null;game.storeQuery='';
    api.document.body.classList.add('adventure-store-on');
    renderStore();
    return true;
  }
  function closeStore(){
    api.document.body.classList.remove('adventure-store-on');
    paint();
    return true;
  }
  function setStoreCategory(category){
    if(!game||!OFFERS[category])return false;
    game.shopCategory=category;game.storeQuery='';game.storeInfo=null;
    renderStore();return true;
  }
  function shopMarkup(){
    return '<p class="muted">Todos los componentes, sus fichas y el vendedor '+
      'están en la pantalla independiente de la tienda.</p>'+
      '<button type="button" class="primary" data-open-store>'+
      '🛒 Entrar en la tienda de componentes</button>';
  }
  function workshopMarkup(){
    const st=workshop.snapshot();
    return '<div class="workshop-funds"><strong>Fondo propio del taller: '+
      format(st.cash)+'</strong><small>Capital inicial: 300 €. El primer trabajo '+
      'superado de cada tipo añade 110 €. Nunca se descuenta del cliente.</small>'+
      '<button type="button" data-tool-view>Ver estantería 3D</button></div>'+
      '<p class="muted">Las herramientas y piezas de referencia permanecen entre encargos. '+
      'Los consumibles se reponen por dosis.</p>'+
      '<div class="workshop-catalog">'+Object.entries(equipment).map(([id,item])=>{
        const available=workshop.owns(id),count=st.supplies[id]||0;
        return '<article class="workshop-tool"><div>'+item.icon+' <b>'+
          safe(item.label)+'</b></div><small>'+
          (item.units?'Consumible · quedan '+count+' dosis':
            available?'Herramienta permanente disponible':'Ampliación pendiente')+'</small>'+
          '<div class="tools"><button type="button" data-tool-buy="'+id+'"'+
          ((!item.units&&available)||item.price>st.cash?' disabled':'')+'>'+
          (item.units?'Reponer':'Adquirir')+' · '+format(item.price)+'</button>'+
          '<button type="button" data-tool-use="'+id+'"'+(!available?' disabled':'')+'>'+
          (id==='multimeter'?'Abrir multímetro':
            ['gpuTest','ramDdr4','ramDdr5'].includes(id)?'Prueba virtual':'Utilizar')+
          '</button></div></article>';
      }).join('')+'</div>';
  }
  function renderMeter(){
    if(!meterPopup)return;
    if(!game?.meterOpen){meterPopup.hidden=true;meterPopup.innerHTML='';return;}
    meterPopup.hidden=false;
    const reading=game.meterReading,bank=workshop.snapshot(),model=root.PC_PINOUTS;
    const def=model.CONNECTORS[game.meterConnector],series=game.meterTest==='series';
    const modes=[['vdc','V⎓ DC'],['vac','V~ AC'],['ohm','Ω Resistencia'],['adc','A⎓ Corriente']];
    const red=model.lookup(game.meterConnector,game.meterRedPin);
    const black=model.lookup(game.meterConnector,game.meterBlackPin);
    const help=game.meterHelpMode||'signals';
    const masking=help==='exam';
    const face=game.meterFace||'contacts';
    const columns=model.orientedRows(game.meterConnector,face);
    const housing=model.HOUSINGS[game.meterConnector];
    const visibleColors=new Set(def.pins.flatMap(p=>p.wireColors));
    const legend=model.WIRE_LEGEND.filter(x=>visibleColors.has(x.color));
    const shownVoltage=p=>{
      const n=model.level(p.rail,{psu:!!api.state().installed.psu,
        powered:!!api.state().power});
      return n===null?'—':n.toFixed(1)+' V';
    };
    const leadSummary=p=>masking?'P'+p.number:
      'P'+p.number+' · '+p.signal+' · '+model.colorName(p);
    const pinout=series?
      '<section class="meter-pinout"><p>Práctica de ventilador EN SERIE. '+
      'La corriente nunca se mide puenteando dos contactos de una fuente.</p></section>':
      '<section class="meter-pinout" aria-label="Pinout interactivo">'+
      '<h4>Pinout '+safe(def.label)+' · '+def.rows+
      (def.rows===1?' fila':' filas')+' de '+def.columns+' contactos</h4>'+
      (masking?'':('<p>'+safe(def.description)+'</p>'))+
      '<p class="meter-warning">Disposición por número, NO orientación mecánica certificada. '+
      'En el lado modular de la PSU ni los colores ni los pines tienen que coincidir.</p>'+
      '<div class="meter-help-modes" role="group" aria-label="Ayuda del pinout">'+
      [['signals','Señales'],['voltages','Tensiones'],['colors','Colores'],
        ['exam','Modo examen']].map(([id,label])=>
        '<button type="button" data-meter-help="'+id+'" aria-pressed="'+
        (help===id)+'">'+label+'</button>').join('')+'</div>'+
      '<div class="meter-face-controls" role="group" aria-label="Vista del conector">'+
        [['contacts','Frente · cavidades'],['wires','Detrás · cables']].map(([id,label])=>
          '<button type="button" data-meter-face="'+id+'" aria-pressed="'+
          (face===id)+'">'+label+'</button>').join('')+'</div>'+
      '<p class="meter-housing-caption">'+
        (face==='contacts'?'Mirando las cavidades del enchufe del cable':
          'Mirando la entrada de cables: izquierda y derecha quedan reflejadas')+
        ' · '+safe(housing.description)+'</p>'+
      '<p class="meter-row-key">Orden de pines (vista '+(face==='contacts'?'frontal':'posterior')+') · '+(
        def.rows===1?'P1–P'+def.pins.length:
        'fila A P1–P'+def.columns+' / fila B P'+(def.columns+1)+
        '–P'+def.pins.length)+'</p>'+
      '<div class="meter-pin-scroll"><div class="meter-physical-housing meter-housing-'+
        housing.kind+'" data-meter-housing="'+game.meterConnector+'" data-meter-face="'+face+'">'+
      (housing.clip?'<div class="meter-latch" aria-label="Pestaña de bloqueo">'+
        '⌄ PESTAÑA · CLIP ⌄</div>':'<div class="meter-l-key">'+
        '◀ GUÍA L · SATA</div>')+
      '<div class="meter-pin-matrix" style="--meter-columns:'+def.columns+'">'+
      columns.map((row,i)=>
        '<div class="meter-pin-row" role="row" aria-label="Fila '+(i+1)+
        ' de contactos" data-meter-row="'+(i+1)+'">'+
        row.map(pin=>{
          const activeRed=pin.number===game.meterRedPin,
            activeBlack=pin.number===game.meterBlackPin;
          const shade=masking?model.COLORS.none:model.COLORS[pin.color]||model.COLORS.none;
          const value=help==='signals'?pin.signal:
            help==='colors'?model.colorName(pin):
            help==='voltages'?shownVoltage(pin):'·';
          const marker=activeRed&&activeBlack?'🔴⚫':activeRed?'🔴':
            activeBlack?'⚫':'';
          const info=masking?'Pin '+pin.number:
            'Pin '+pin.number+' · '+pin.signal+' · color habitual: '+
            model.colorName(pin)+(pin.notes?' · '+pin.notes:'');
          const shape=model.keyShape(game.meterConnector,pin.number);
          const strip=housing.split?{atx24:2,eps8:2,pcie8:1}[game.meterConnector]:0;
          const breakAt=strip?(face==='contacts'?def.columns-strip:strip):0;
          const isBreak=strip&&i===i&&(
            face==='contacts'?row.indexOf(pin)===breakAt-1:
              row.indexOf(pin)===breakAt-1
          );
          return '<button type="button" data-meter-pin="'+pin.number+'" '+
            'class="meter-pin'+(activeRed?' meter-pin-red':'')+
            (activeBlack?' meter-pin-black':'')+
            (masking?' meter-pin-exam':'')+
            (isBreak?' meter-pin-split':'')+'"'+
            ' style="--pin-color:'+shade+'" title="'+safe(info)+
            '" aria-label="'+safe(info)+'">'+
            '<span class="meter-cavity meter-cavity-'+shape+'" aria-hidden="true"></span>'+
            '<b>'+pin.number+'</b>'+
            (masking?'':'<i class="meter-wire-swatch" aria-hidden="true" style="background:'+
              model.swatch(pin)+'"></i>')+
            '<small>'+safe(value)+'</small><em>'+marker+'</em></button>';
        }).join('')+'</div>'
      ).join('')+'</div></div>'+
      '<p class="meter-housing-foot">P1'+(face==='contacts'?' a la izquierda de la fila inferior':
        ' a la derecha de la fila inferior')+
        (housing.clip?' · clip de retención sobre la fila superior':
          ' · guía lateral en L para impedir el giro')+
        (housing.split?' · división '+housing.split:'')+'</p></div>'+
      (masking?'<p class="meter-pin-hint">Modo examen: sin indicación de líneas, '+
        'colores ni tensiones. Mide para deducir cada función.</p>':
        '<div class="meter-legend" aria-label="Colores habituales de cable">'+
        '<strong>Leyenda de colores habituales</strong>'+
        '<div class="meter-legend-items">'+legend.map(entry=>
          '<span class="meter-legend-entry"><i aria-hidden="true" style="background:'+
          model.COLORS[entry.color]+'"></i><b>'+model.COLOR_NAMES[entry.color]+
          '</b> · '+safe(entry.signal)+'</span>').join('')+'</div>'+
        '<p>Los colores no son universales: algunas fuentes llevan todos los '+
          'cables negros. SATA y los hilos de sense pueden no tener un cable '+
          'independiente por contacto. P13 ATX combina naranja con marrón.</p></div>'+
        '<div class="meter-pin-detail" role="status"><strong>Contactos colocados:</strong> '+
          '⚫ '+safe(leadSummary(black))+' / 🔴 '+safe(leadSummary(red))+
          (red.notes?'<p>Roja: '+safe(red.notes)+'</p>':'')+
          (black.notes?'<p>Negra: '+safe(black.notes)+'</p>':'')+'</div>')+
      '<p class="meter-pin-hint">Haz clic en el contacto de la fila para colocar '+
      'la punta '+(game.meterLead==='red'?'roja':'negra')+
      '. Los colores representan una convención didáctica, no una garantía de cableado.</p>'+
      '</section>';
    meterPopup.innerHTML='<div class="meter-lab-dialog" role="dialog" '+
      'aria-modal="true" aria-label="Multímetro simulado">'+
      '<header><h3>📟 Multímetro · comprobación por pines</h3>'+
      '<button type="button" data-meter-close>✕ Cerrar</button></header>'+
      '<p class="meter-disclaimer">Instrumento virtual, tensiones nominales ficticias. '+
      'Nunca manipules el interior de una fuente física ni cambies cables modulares de PSU.</p>'+
      '<div class="meter-lab-grid"><section class="meter-body'+
      (reading?.spark?' meter-spark':'')+'">'+
      '<div class="meter-display" aria-live="polite">'+safe(reading?.value||'0.0')+'</div>'+
      '<div class="meter-flash" aria-hidden="true">⚡</div>'+
      '<div class="meter-dial" role="group" aria-label="Selector de magnitud">'+
      modes.map(([id,label])=>'<button type="button" data-meter-mode="'+id+'" aria-pressed="'+
        (game.meterMode===id)+'">'+label+'</button>').join('')+'</div>'+
      '<div class="meter-jacks"><span>⚫ COM · punta negra</span>'+
      '<label for="meterJack">🔴 Borne de punta roja</label><select id="meterJack">'+
      '<option value="vohm"'+(game.meterJack==='vohm'?' selected':'')+'>VΩ</option>'+
      '<option value="amp"'+(game.meterJack==='amp'?' selected':'')+'>A (corriente)</option>'+
      '</select></div></section><section class="meter-probes">'+
      '<label for="meterConnector">Conector a examinar</label><select id="meterConnector">'+
      Object.values(model.CONNECTORS).map(c=>'<option value="'+c.id+'"'+
        (!series&&game.meterConnector===c.id?' selected':'')+'>'+safe(c.label)+'</option>').join('')+
      '<option value="series"'+(series?' selected':'')+'>Ventilador · circuito en serie</option></select>'+
      (series?'':'<fieldset class="meter-lead-picker"><legend>Selecciona primero la punta y después el pin</legend>'+
        '<button type="button" data-meter-lead="black" aria-pressed="'+
          (game.meterLead==='black')+'">⚫ Negra P'+game.meterBlackPin+(help==='exam'?'':(' · '+safe(black.signal)))+'</button>'+
        '<button type="button" data-meter-lead="red" aria-pressed="'+
          (game.meterLead==='red')+'">🔴 Roja P'+game.meterRedPin+(help==='exam'?'':(' · '+safe(red.signal)))+'</button></fieldset>')+
      '<button type="button" class="primary" data-meter-probe>Aplicar puntas y medir</button>'+
      '<p role="status" class="'+(reading?.spark?'errtxt':'')+'">'+
      safe(masking&&reading?'Lectura registrada. Cambia a «Señales» para ver qué contactos has medido.':
        reading?.message||'La lectura es V(rojo) − V(negro). La corriente se mide en serie.')+'</p>'+
      (bank.fuseBlown?'<button type="button" data-meter-fuse'+(bank.cash<5?' disabled':'')+
        '>Sustituir fusible A · 5 €</button>':'')+
      '<small>PC '+(api.state().power?'encendido':'apagado')+
      ' · '+(api.state().installed.psu?'CA de PSU simulada: conectada (+5VSB de espera)':
        'Sin PSU instalada')+' · Fusible '+(bank.fuseBlown?'fundido':'correcto')+'</small>'+
      '</section></div>'+pinout+'</div>';
  }
  function inventoryMarkup(){
    const entries=[...new Set([...Object.keys(game.stock),...Object.keys(game.used)])]
      .filter(k=>stock(k)>0||(game.used[k]||0)>0);
    if(!entries.length)return '<p class="muted">La mochila está vacía. Compra primero en la tienda.</p>';
    return entries.map(k=>{
      const available=stock(k),used=game.used[k]||0;
      const [cat,id]=k.split(':');
      const installed=cat!=='item'&&!!api.state().installed[cat]&&
        (cat==='case'||cat==='cooler'||api.state().selected[cat]===id);
      return '<div class="adv-inventory-line">'+
        '<button type="button" draggable="'+(available>0&&cat!=='item')+
        '" data-drag-item="'+safe(k)+'" data-select-item="'+safe(k)+'"'+
        ' class="adv-inventory'+(game.selected===k?' chosen':'')+'">'+
        safe(label(cat,id))+'<span>'+available+' en mochila'+
        (installed?' · montado':'')+
        (used&&!installed?' · '+used+' usado(s)':'')+'</span></button>'+
        '<button type="button" data-return-item="'+safe(k)+'"'+
        (!canReturn(k)?' disabled':'')+' title="Recuperar el importe original de una pieza sin montar">Devolver</button>'+
        '</div>';
    }).join('');
  }
  function exchangeMarkup(){
    const k=game.selected,[cat,id]=String(k).split(':');
    const available=OFFERS[cat]?.filter(([other])=>other!==id)||[];
    return '<div class="adv-exchange">'+
      '<label class="adventure-label">Sustituir la pieza seleccionada por otra de su categoría</label>'+
      '<select id="advExchangeTarget"'+(!canReturn(k)?' disabled':'')+'>'+
      available.map(([newId,cost])=>'<option value="'+safe(newId)+'">'+
        safe(label(cat,newId))+' · '+format(cost)+'</option>').join('')+'</select>'+
      '<button type="button" data-exchange-go'+
      (!canReturn(k)||!available.length?' disabled':'')+'>Cambiar producto</button>'+
      '</div>';
  }
  function contextSuggestions(){
    const st=api.state(),k=game.selected;
    const [cat,id]=String(k).split(':');
    if(!k)return '<p class="muted">Selecciona una pieza de la mesa auxiliar o del inventario para ver qué puedes hacer con ella.</p>';
    const ideas=[];
    const add=(name,desc,verb,enabled=true)=>ideas.push(
      '<button type="button" class="adv-suggest" data-suggest="'+verb+'"'+
      (!enabled?' disabled':'')+'><b>'+name+'</b><small>'+desc+'</small></button>');
    if(cat==='case'){
      if(st.installed.case)add('✓ Caja colocada','Ya está en el banco principal; ahora abre el panel.','inspect');
      else add('Colocar caja en mesa de montaje','Primera acción del encargo · encajar','fit',has(k));
    }else if(k==='item:ioShield'){
      add('Encajar chapa I/O','Antes de atornillar la placa base','fit',has(k)&&!!st.installed.case&&!st.installed.motherboard);
    }else if(k==='item:rgbStrip'){
      add('Instalar tira LED ARGB','Iluminación dentro del chasis, PC apagado','apply',
        has(k)&&!!st.installed.case&&!st.power&&!st.caseClosed);
    }else if(k==='item:paste'){
      if(st.paste>0&&!st.installed.cooler)
        add('✓ Pasta aplicada','Continúa con el disipador en Tienda o Inventario','inspect');
      else add('Aplicar pasta sobre CPU','Antes de montar el disipador','apply',
        has(k)&&!!st.installed.cpu&&!st.installed.cooler);
    }else if(cat==='item'){
      if(id==='fan')add('Encajar ventilador','Colócalo en una ranura del chasis','fit',has(k));
      else if(id==='osusb')add('Preparar USB','Elige el sistema en el panel USB y paga su preparación','inspect',has(k));
      else if(USB_PREPARED[id])add('Conectar USB '+USB_PREPARED[id].label,
        'Utiliza el botón de conexión del panel de memorias','inspect',has(k));
      else add('Material de taller','Se utiliza con Atornillar, Conectar o Instalar SO','inspect');
    }else if(cat!=='undefined'){
      if(cat==='motherboard'&&!st.installed.motherboard&&
         st.installed.psu&&!st.psuAccessRouted)
        add('Apartar y asegurar mazos PSU',
          'La fuente se colocó antes que la placa y sus cables impiden el encaje.',
          'route',true);
      if(!st.installed[cat])
        add('Encajar '+label(cat,id),'Desde mesa auxiliar al anclaje de la torre','fit',has(k));
      else if(cat==='ram'&&!st.ramSeated)
        add('Fijar pestañas DIMM','Presiona la RAM hasta hacer clic','fit');
      else if(['motherboard','psu','storage','gpu','cooler'].includes(cat)&&!game.screwed[cat]){
        const p=game.screwProgress[cat],qty=screwLayout(k).length;
        const done=p?.target===k?p.completed.length:0;
        add('Atornillar '+label(cat,id)+' ('+done+'/'+qty+')',
          'Necesitas destornillador y '+(qty-done)+' tornillo(s) más','screw');
      }
      else
        add('Inspeccionar pieza','Revisar el estado y las conexiones','inspect');
    }
    if(st.installed[cat]&&cat!=='case')
      add('Retirar '+label(cat,id),'Primero apaga el equipo y abre la caja','remove');
    const next=st.installed.cpu&&!st.installed.cooler&&st.paste>0&&
      (k==='item:paste'||cat==='cooler');
    const continueBtn=next?
      '<button type="button" class="adv-suggest adv-next-thermal" data-thermal-next>'+
        '<b>Continuar: colocar disipador</b><small>'+
        (Object.keys(game.stock).some(key=>key.startsWith('cooler:')&&has(key))?
        'Seleccionar el disipador comprado y mostrar Encajar':
        'Abrir la tienda en la categoría Disipador')+'</small></button>':'';
    return '<div class="adv-suggestions">'+continueBtn+ideas.join('')+'</div>';
  }
  function pastePracticeMarkup(){
    if(!game||game.selected!=='item:paste')return '';
    return '<div class="adv-ram-toggle"><button type="button" data-paste-toggle>'+
      (game.thermalPasteEnabled?'Usar pasta clásica':'Activar jeringuilla')+
      '</button><span>'+(game.thermalPasteEnabled?
      'Predeterminado · la expansión sucede al atornillar el disipador':
      'Aplicación clásica, sin simulación de presión')+'</span></div>';
  }
  function cpuPrecisionMarkup(){
    if(!game?.selected?.startsWith('cpu:'))return '';
    return '<div class="adv-ram-toggle"><button type="button" data-cpu-toggle>'+
      (game.cpuPrecisionEnabled?'Usar colocación clásica':'Activar minijuego CPU')+
      '</button><span>'+(game.cpuPrecisionEnabled?
        'Predeterminado · orientar, apoyar y cerrar la palanca en el visor 3D':
        'Modo clásico · pulsa para recuperar el minijuego')+'</span></div>';
  }
  function screwPracticeMarkup(){
    const [cat]=String(game?.selected||'').split(':');
    if(!screwable.has(cat))return '';
    const p=game.screwProgress[cat],qty=screwLayout(game.selected).length;
    const done=p?.target===game.selected?p.completed.length:0;
    return '<div class="adv-ram-toggle"><button type="button" data-screw-toggle>'+
      (game.screwPracticeEnabled?'Usar atornillado clásico':'Activar minijuego de tornillos')+
      '</button><span>'+(game.screwPracticeEnabled?
        'Predeterminado · '+done+'/'+qty+
        ' puntos fijados · rueda sobre el visor 3D':
        'Modo clásico · sin minijuego')+'</span></div>';
  }
  function ramPrecisionMarkup(){
    if(!game?.selected?.startsWith('ram:'))return '';
    return '<div class="adv-ram-toggle"><button type="button" data-ram-toggle>'+
      (game.ramPrecisionEnabled?'Usar montaje clásico':'Activar minijuego RAM')+
      '</button><span>'+
      (game.ramPrecisionEnabled?
        'Predeterminado · se abre al instalar RAM en el visor 3D':
        'Modo clásico · pulsa para recuperar el minijuego')+'</span></div>';
  }
  function ramPrecisionPopupMarkup(){
    if(!ramPrecisionSession||!game?.ramPrecisionEnabled)return '';
    const s=ramPrecisionSession.getState();
    const diagram='<div class="adv-ram-scene" role="img" '+
      'aria-label="Vista didáctica: módulo RAM y muesca sobre la ranura DIMM">'+
      '<div id="advRamStick" class="adv-ram-stick" style="'+
      '--ram-offset:'+(s.alignment*2)+'px;--ram-depth:'+Math.round(s.approach*.46)+
      'px;--ram-flip:'+(s.reversed?-1:1)+'">'+
      '<span class="adv-ram-chips">▮ ▮ ▮ ▮ ▮</span><span class="adv-ram-key"></span>'+
      '<span class="adv-ram-contacts"></span></div>'+
      '<div class="adv-ram-socket"><span class="adv-ram-key"></span></div>'+
      '<div class="adv-ram-clips"><span>◀</span><span>▶</span></div></div>';
    const alignment='<div class="adv-ram-controls">'+
      '<button type="button" data-ram-flip>Girar RAM 180°</button>'+
      '<label for="advRamAlign">Alinear muesca <output id="advRamAlignVal">'+
      s.alignment+'</output><input type="range" id="advRamAlign" min="-30" max="30" step="1" value="'+s.alignment+'"></label>'+
      '<label for="advRamApproach">Acercar a la ranura <output id="advRamApproachVal">'+
      s.approach+'%</output><input type="range" id="advRamApproach" min="0" max="100" step="1" value="'+s.approach+'"></label>'+
      '<button type="button" class="primary" data-ram-present>Presentar RAM alineada</button></div>';
    const meters=['left','right'].map(side=>{
      const title=side==='left'?'Extremo izquierdo':'Extremo derecho';
      const captured=ramCaptures[side];
      return '<div class="ram-pressure-meter">'+
        '<div class="ram-pressure-head"><strong>'+title+'</strong>'+
        '<output data-ram-reading="'+side+'">'+
        (captured===null?'Oscilando':'Fijada · '+captured+' / 100')+'</output></div>'+
        '<div class="ram-pressure-track" role="img" aria-label="Presión de '+title+
        ': rojo, amarillo, verde, amarillo, rojo">'+
        '<i data-ram-marker="'+side+'" class="ram-pressure-needle" style="left:'+
        (captured===null?50:captured)+'%"></i></div>'+
        '<button type="button" data-ram-capture="'+side+'"'+
        (captured!==null?' disabled':'')+'>'+
        (captured===null?'Detener marcador · '+title:'Presión fijada ✓')+
        '</button></div>';
    }).join('');
    const controls=s.stage==='align'?alignment:
      s.stage==='pressure'?'<div class="ram-pressure-controls">'+
        '<p>Detén los dos marcadores: ambos deben estar en verde y con una presión similar.</p>'+
        meters+'<p class="muted">Rango didáctico: 58–74 verde; 45–85 amarillo; fuera rojo. No son newtons.</p>'+
        '</div>':'<p>Verificando el asentamiento de las dos pestañas…</p>';
    return '<section class="ram-precision-dialog" role="dialog" aria-modal="true" '+
      'aria-label="Práctica de montaje de memoria RAM">'+
      '<header><div><small>TALLER 3D · PRÁCTICA DIMM</small>'+
      '<h3>'+(s.stage==='align'?'Orientar y acercar':'Controlar presión de ambos extremos')+
      '</h3></div><button type="button" data-ram-cancel aria-label="Cerrar minijuego">✕</button></header>'+
      '<p class="muted">Se conserva el montaje 3D al fondo. El módulo no se daña por fallar.</p>'+
      diagram+controls+
      '<footer><span>Intentos: '+s.attempts.length+
      ' · fallo: +0,8 min virtuales</span><button type="button" data-ram-cancel>'+
      'Cancelar y volver</button></footer></section>';
  }
  function paintRamPopup(){
    if(!ramPopup)return;
    const active=!!game&&!!game.ramPrecisionEnabled&&!!ramPrecisionSession;
    ramPopup.hidden=!active;
    ramPopup.innerHTML=active?ramPrecisionPopupMarkup():'';
    if(active&&ramPrecisionSession.getState().stage==='pressure'&&!ramFrame)
      drawRamOscillators();
    else if(!active)stopRamAnimation();
  }
  function progressText(){
    const st=api.state();
    if(!st.installed.case)
      return '1 · Compra una CAJA en la tienda. Selecciónala en la mesa auxiliar y pulsa «Colocar caja en mesa de montaje».';
    if(!st.ioShield)
      return '2 · La caja ya está colocada. Compra y encaja la chapa I/O antes de poner la placa.';
    if(!st.installed.motherboard){
      if(st.installed.psu&&!st.psuAccessRouted)
        return '3 · La fuente se instaló antes. Selecciona la placa y usa «Apartar y asegurar mazos PSU»; después encájala.';
      return '3 · Coloca la placa base dentro de la caja y fíjala con tornillos.';
    }
    if(st.installed.cpu&&st.paste>0&&!st.installed.cooler)
      return '5 · Pasta aplicada. Compra o selecciona el disipador y pulsa «Encajar» en Acciones.';
    if(st.installed.cooler&&!st.fixings?.cooler)
      return '5 · Disipador colocado. Atornilla gradualmente sus cuatro esquinas para ver la expansión de la pasta.';
    if(!st.installed.cpu||!st.installed.ram)
      return '4 · Instala CPU y RAM. Encaja las pestañas de memoria; compra pasta térmica.';
    if(!st.installed.cooler||!st.cpuFan)
      return '5 · Aplica pasta, monta el disipador y conecta CPU_FAN.';
    if(!st.installed.psu||!st.atx24||!st.eps||!st.frontPanel)
      return '6 · Coloca la fuente, atorníllala y conecta ATX24, EPS y POWER SW.';
    if(!st.installed.storage)
      return '7 · Instala una unidad SATA o NVMe y asegúrala.';
    if(!st.power)
      return '8 · Comprueba conexiones, conecta periféricos y enciende el equipo.';
    if(!st.osInstalled)return '9 · Compra y prepara una memoria USB, conéctala a la placa, configura UEFI/Secure Boot y arranca desde USB.';
    return '10 · Verifica temperaturas y tornillos. Entrega el PC al cliente.';
  }
  function section(name,title,content,count=''){
    return '<details class="adv-accordion" data-section="'+name+'"'+
      (game.openSections.includes(name)?' open':'')+'>'+
      '<summary><span>'+title+'</span>'+
      (count?'<em>'+count+'</em>':'')+'</summary>'+
      '<div class="adv-accordion-body">'+content+'</div></details>';
  }
  function paint(){
    if(!game){if(panel)panel.innerHTML='';paintRamPopup();paintScrewPopup();paintCpuPopup();return;}
    const top=panel.scrollTop;
    const job=CASES[game.caseId];
    const available=stagedItems();
    api.stage?.(available,game.selected);
    api.tools?.(workshop.list());
    const mission=
      (game.pendingDemo?'<div class="adv-confirm-demo" role="alert">'+
        '<p>¿Abrir montaje recomendado? Se perderá el progreso de este encargo, no se comprarán piezas.</p>'+
        '<button type="button" data-confirm-demo class="primary">Sí, abrir demostración</button>'+
        '<button type="button" data-cancel-demo>Conservar encargo</button></div>':'')+
      '<label class="adventure-label">Cliente</label><select id="advClient">'+
      Object.entries(CASES).map(([id,c])=>'<option value="'+id+'"'+(id===game.caseId?' selected':'')+
        '>'+safe(c.name)+'</option>').join('')+'</select>'+
      '<p class="adv-story"><b>'+safe(job.client)+'</b>: '+safe(job.story)+'</p>'+
      '<div class="adv-ledger"><span>Presupuesto: <b>'+format(job.budget)+'</b></span>'+
      '<span>Gastado: <b>'+format(game.spent)+'</b></span>'+
      '<span>Disponible: <b>'+format(job.budget-game.spent)+'</b></span></div>'+
      '<p class="adv-guide">'+safe(progressText())+'</p>'+
      '<div class="adv-operation-clock"><label for="advWorkSpeed">Velocidad del técnico</label>'+
      '<select id="advWorkSpeed">'+Object.entries(root.PC_TIME.SPEEDS).map(([id,opt])=>
        '<option value="'+id+'"'+(clock?.getSpeed()===id?' selected':'')+'>'+opt.label+'</option>').join('')+
      '</select><p id="advVirtualClock" aria-live="polite">Tiempo virtual: '+
      (clock?.getSummary().total||0)+' min · '+
      (operationEngine?.getHistory().length||0)+' operaciones registradas</p>'+
      '<p id="advWorkSummary" aria-live="polite">'+
      'Necesarias: '+(operationEngine?.getSummary().counts.necessary||0)+
      ' · Retrabajos: '+(operationEngine?.getSummary().counts.rework||0)+
      ' · Rechazos: '+(operationEngine?.getSummary().counts.rejected||0)+
      '</p>'+
      '<div class="adv-risk-panel"><label for="advRiskMode">Incidencias ficticias</label>'+
      '<select id="advRiskMode"><option value="off"'+(!game.riskEnabled?' selected':'')+
      '>Desactivadas (laboratorio seguro)</option><option value="on"'+
      (game.riskEnabled?' selected':'')+'>Activadas con semilla</option></select>'+
      '<label for="advRiskSeed">Semilla reproducible</label>'+
      '<div class="tools"><input id="advRiskSeed" maxlength="80" value="'+safe(game.riskSeed)+'">'+
      '<button type="button" data-risk-seed>Aplicar semilla</button></div>'+
      '<button type="button" data-esd-toggle>'+ (game.esdConnected?
        'Desconectar pulsera ESD':'Conectar pulsera ESD al chasis')+'</button>'+
      '<p id="advRiskStatus" role="status">Incidencias: '+game.incidents.length+
        ' · revisiones pendientes: '+game.pendingReview+
        ' · reparaciones pendientes: '+(game.pendingSataRepair?1:0)+
        ' · comprobaciones pendientes: '+(game.pendingSataLatent?1:0)+
        ' · pulsera ESD: '+(game.esdConnected?'conectada':'desconectada')+
        ' · probabilidades educativas configurables</p></div></div>';
    const inventory=
      '<p class="muted">Comprado → mesa auxiliar → instalado. Pulsa una pieza para seleccionarla. Devuelve o cambia las no utilizadas.</p>'+
      '<div class="adv-inventory-grid">'+inventoryMarkup()+'</div>'+
      '<p class="adv-current">Selección: <b>'+safe(game.selected?label(...game.selected.split(':')):'Ninguna')+'</b></p>'+
      exchangeMarkup();
    const shop=shopMarkup();
    const stActions=api.state();
    const peripherals=
      '<div class="adv-connectivity">'+
      [['keyboard','Teclado USB',stActions.keyboardConnected],
       ['mouse','Ratón USB',stActions.mouseConnected],
       ['monitor','Monitor HDMI/DP',stActions.monitorCable],
        ['frontusb3','USB-A frontales (header 19 pines)',stActions.frontUsb3],
        ['frontusbc','USB-C frontal (header Type-E)',stActions.frontUsbC]]
       .map(([id,label,on])=>
        '<div class="adv-connection-row"><span>'+label+
        '<small>'+(on?'Conectado':'Sin conectar')+'</small></span>'+
        '<button type="button" data-quick-connector="'+id+'">'+
        (on?'Desconectar':'Conectar')+'</button></div>').join('')+
      (stActions.installed.psu&&!stActions.psuAccessRouted?
       '<button type="button" data-quick="route">Apartar y asegurar mazos PSU</button>':
       stActions.psuAccessRouted?
       '<p class="muted">✓ Mazos PSU asegurados</p>':'')+
      '</div>';
    const availableUsbs=Object.entries(USB_PREPARED)
      .map(([id,p])=>({key:'item:'+id,...p,qty:stock('item:'+id)}))
      .filter(x=>x.qty>0);
    const usbTools='<div class="adv-usb-tools" id="advUsbTools">'+
      '<div class="title"><h2>Preparar y conectar USB</h2><span>USB-A trasero</span></div>'+
      '<p class="muted">Compra una memoria vacía (12 €) y graba un sistema, o compra un USB preparado. Precios ficticios.</p>'+
      '<label class="adventure-label" for="advPrepareOS">Sistema que grabar</label>'+
      '<select id="advPrepareOS">'+Object.entries(USB_PREPARED).map(([id,p])=>
        '<option value="'+p.os+'">'+p.label+' · preparación '+format(p.fee)+'</option>').join('')+
      '</select><button type="button" data-prepare-usb'+(!has('item:osusb')?' disabled':'')+
      '>Preparar memoria USB vacía</button>'+
      '<label class="adventure-label" for="advUsbSelection">Memorias preparadas en inventario</label>'+
      '<select id="advUsbSelection"'+(!availableUsbs.length?' disabled':'')+'>'+
      availableUsbs.map(x=>'<option value="'+x.key+'"'+
        (game.selected===x.key?' selected':'')+'>'+x.label+' · '+x.qty+' unidad(es)</option>').join('')+
      '</select><div class="tools"><button type="button" data-connect-usb'+
      (!availableUsbs.length||stActions.usbConnected?' disabled':'')+'>Conectar USB al PC</button>'+
      '<button type="button" data-eject-usb'+(!stActions.usbConnected?' disabled':'')+
      '>Expulsar USB</button></div>'+
      '<div class="issue" id="advUsbStatus" role="status">'+
      (stActions.usbConnected?'Conectado: '+safe(root.PC_OS.CATALOG[stActions.usbImage]?.name||'USB'):
       'Puerto USB-A libre · sin instalador conectado')+'</div></div>';
    const coolerPending=!!stActions.installed.cooler&&
      !stActions.fixings?.cooler&&!game.screwed.cooler;
    const coolerContinue=coolerPending?
      '<div class="adv-thermal-next" role="group" aria-label="Siguiente paso del disipador">'+
      '<p><strong>Disipador colocado: falta fijarlo.</strong> '+
      (game.thermalPaste?'La pasta se distribuirá al apretar cada tornillo.':
        'Sin pasta térmica la refrigeración puede fallar.')+'</p>'+
      '<button type="button" class="primary" data-cooler-start>'+
      (game.screwPracticeEnabled?'Iniciar minijuego del disipador y la pasta':
       'Continuar con atornillado clásico')+'</button></div>':'';
    const actions=
      '<p class="adv-current">Objeto: <b>'+safe(game.selected?label(...game.selected.split(':')):'Ninguno')+'</b></p>'+
      coolerContinue+
      '<div class="adv-quick-actions">'+
      '<button type="button" data-quick="boot" class="primary">'+
      (api.state().power?'Apagar ordenador':'Encender ordenador')+'</button>'+
      '<button type="button" data-quick="bios">Entrar / salir BIOS</button>'+
      '</div>'+
      peripherals+
      '<p class="muted">Acciones sugeridas para la pieza seleccionada:</p>'+contextSuggestions()+
      ramPrecisionMarkup()+screwPracticeMarkup()+cpuPrecisionMarkup()+pastePracticeMarkup()+
      '<div class="adv-verbs">'+VERBS.map(([id,text])=>
        '<button type="button" class="'+(game.verb===id?'chosen':'')+'" data-verb="'+id+'">'+text+'</button>').join('')+'</div>'+
      '<label class="adventure-label">Salida de vídeo al monitor</label>'+
      '<select id="advVideoOutput">'+
      '<option value="motherboard"'+(game.videoOutput==='motherboard'?' selected':'')+
      '>Placa · HDMI/DP (CPU con iGPU)</option>'+
      '<option value="gpu"'+(game.videoOutput==='gpu'?' selected':'')+
      '>Tarjeta gráfica dedicada · HDMI/DP</option></select>'+
      '<label class="adventure-label">Conector (para Conectar / Desconectar)</label>'+
      '<select id="advConnection">'+CONNECTIONS.map(([id,text])=>
        '<option value="'+id+'"'+(id===game.connection?' selected':'')+'>'+text+'</option>').join('')+'</select>'+
      '<div class="adv-actions"><button type="button" class="primary" data-go>Realizar acción</button>'+
      '<button type="button" data-rear>Ver trasera</button>'+
      '<button type="button" data-close>Abrir / cerrar caja</button></div>';
    const delivery=
      '<p class="adv-story">'+job.goals.map(safe).join(' · ')+'</p>'+
      '<button type="button" class="primary adv-deliver" data-deliver>Entregar PC al cliente</button>'+
      (game.report?'<div class="adv-report"><b>'+ (game.report.ok?'ENCARGO SUPERADO':'REVISAR MONTAJE')+
        ' · '+game.report.score+'/10</b>'+
        game.report.checks.map(([c,ok])=>'<div class="'+(ok?'oktxt':'errtxt')+'">'+
        (ok?'✓ ':'✗ ')+safe(c)+'</div>').join('')+'</div>':'')+
      '<div class="adv-log" role="status" aria-live="polite">'+game.messages.map(m=>
        '<p class="'+(m.level==='ok'?'oktxt':'warntxt')+'">'+safe(m.text)+'</p>').join('')+'</div>'+
      '<button type="button" data-demo-build class="adv-demo-build">'+
      'Ver montaje recomendado (demostración, sin encargo)</button>'+
      '<button type="button" data-exit-mode>Salir al modo técnico</button>';
    panel.innerHTML=
      '<div class="title"><h2>Taller de montaje</h2>'+
      '<span title="Revisión de publicación">Modo aventura · Motor 8.17.0</span></div>'+
      '<p class="adv-stage-tip">Mesa auxiliar 3D → selecciona una pieza → elige una acción. '+
      '<button type="button" data-open-store>🛒 Ir a la tienda</button></p>'+
      section('mission','Encargo y progreso',mission)+
      section('workshop','🧰 Estantería y herramientas del taller',workshopMarkup(),workshop.list().length)+
      usbTools+
      section('inventory','Inventario y cambios',inventory,available.reduce((n,x)=>n+x.quantity,0))+
      section('shop','Tienda de informática',shop)+
      section('actions','Acciones y herramientas',actions,game.selected?'●':'')+
      section('installed','Estado de piezas montadas',
        '<p class="muted">Pulsa una pieza para ver tornillos, alimentación, datos y compatibilidad.</p>'+
        (api.statusSummary?.()||'<p class="muted">Todavía no hay estado disponible.</p>'),
        Object.values(api.state().installed).filter(Boolean).length)+
      section('delivery','Diagnóstico y entrega',delivery);
    panel.scrollTop=top;
    paintRamPopup();
    paintScrewPopup();
    paintCpuPopup();
    renderStore();
  }
  // El inventario también se puede arrastrar hasta los anclajes verdes
  // del 3D. Nunca instala piezas que no se hayan comprado.
  cpuPopup?.addEventListener('click',event=>{
    const button=event.target.closest('button');
    if(!button||!game||!cpuSession)return;
    if(button.hasAttribute('data-cpu-cancel')){cpuPrecisionStep('cancel');return;}
    if(button.hasAttribute('data-cpu-rotate')){cpuPrecisionStep('rotate');return;}
    if(button.hasAttribute('data-cpu-present')){cpuPrecisionStep('present');return;}
    if(button.hasAttribute('data-cpu-capture'))cpuPrecisionCapture();
  });
  cpuPopup?.addEventListener('input',event=>{
    if(!cpuSession||!game)return;
    const st=cpuSession.getState(),v=Number(event.target.value);
    if(event.target.id==='cpuX')cpuPrecisionMove(v,st.y);
    else if(event.target.id==='cpuY')cpuPrecisionMove(st.x,v);
    else if(event.target.id==='cpuLower'&&cpuSession.setLower(v))drawCpuPiece();
  });
  cpuPopup?.addEventListener('pointerdown',event=>{
    if(!cpuSession||!event.target.closest('[data-cpu-piece]')||
       cpuSession.getState().stage!=='align')return;
    cpuDragging=true;
    const scene=cpuPopup.querySelector('.cpu-precision-scene');
    scene?.setPointerCapture?.(event.pointerId);
    event.preventDefault();
  });
  cpuPopup?.addEventListener('pointermove',event=>{
    if(!cpuDragging||!cpuSession)return;
    const box=cpuPopup.querySelector('.cpu-precision-scene')?.getBoundingClientRect();
    if(!box)return;
    cpuPrecisionMove((event.clientX-box.left-box.width/2)/2,
      (event.clientY-box.top-box.height/2)/2);
    event.preventDefault();
  });
  cpuPopup?.addEventListener('pointerup',()=>{cpuDragging=false;});
  cpuPopup?.addEventListener('pointercancel',()=>{cpuDragging=false;});
  cpuPopup?.addEventListener('keydown',event=>{
    if(!cpuSession)return;
    if(event.key==='Escape'){event.preventDefault();cpuPrecisionStep('cancel');return;}
    if(!event.target.closest('[data-cpu-piece]'))return;
    const delta={ArrowLeft:[-2,0],ArrowRight:[2,0],
      ArrowUp:[0,-2],ArrowDown:[0,2]}[event.key];
    if(delta){
      event.preventDefault();
      const st=cpuSession.getState();
      cpuPrecisionMove(st.x+delta[0],st.y+delta[1]);
    }else if(event.key==='r'||event.key==='R'){
      event.preventDefault();cpuPrecisionStep('rotate');
    }
  });
  ramPopup?.addEventListener('click',event=>{
    const button=event.target.closest('button');
    if(!button||!game||!ramPrecisionSession)return;
    if(button.hasAttribute('data-ram-flip')){ramPrecisionStep('flip');return;}
    if(button.hasAttribute('data-ram-present')){ramPrecisionStep('present');return;}
    if(button.hasAttribute('data-ram-cancel')){ramPrecisionStep('cancel');return;}
    if(button.dataset.ramCapture)ramPrecisionCapture(button.dataset.ramCapture);
  });
  ramPopup?.addEventListener('input',event=>{
    if(!ramPrecisionSession||!game)return;
    const el=event.target,value=Number(el.value);
    if(el.id==='advRamAlign'){
      ramPrecisionSession.setAlignment(value);
      const output=ramPopup.querySelector('#advRamAlignVal');
      const stick=ramPopup.querySelector('#advRamStick');
      if(output)output.textContent=String(value);
      if(stick)stick.style.setProperty('--ram-offset',(value*2)+'px');
    }else if(el.id==='advRamApproach'){
      ramPrecisionSession.setApproach(value);
      const output=ramPopup.querySelector('#advRamApproachVal');
      const stick=ramPopup.querySelector('#advRamStick');
      if(output)output.textContent=value+'%';
      if(stick)stick.style.setProperty('--ram-depth',Math.round(value*.46)+'px');
    }
  });
  ramPopup?.addEventListener('keydown',event=>{
    if(event.key==='Escape'){event.preventDefault();ramPrecisionStep('cancel');}
  });
  screwPopup?.addEventListener('click',event=>{
    const button=event.target.closest('button');
    if(!button||!screwSession)return;
    if(button.hasAttribute('data-cooler-finish')){finishCoolerPractice(false);return;}
    if(button.hasAttribute('data-cooler-clean')){finishCoolerPractice(true);return;}
    if(game.pasteReview)return;
    if(button.hasAttribute('data-screw-cancel')){closeScrewPractice();paint();return;}
    if(button.dataset.screwHole!==undefined){screwPickHole(Number(button.dataset.screwHole));return;}
    if(button.dataset.screwTurn)screwTurn(Number(button.dataset.screwTurn));
  });
  screwPopup?.addEventListener('pointerdown',event=>{
    if(!screwSession||!event.target.closest('[data-screw-head]'))return;
    screwDragging=true;
    const board=screwPopup.querySelector('.screw-alignment-board');
    board?.setPointerCapture?.(event.pointerId);
    event.preventDefault();
  });
  screwPopup?.addEventListener('pointermove',event=>{
    if(!screwSession||!screwDragging)return;
    const box=screwPopup.querySelector('.screw-alignment-board')?.getBoundingClientRect();
    if(!box||!box.width||!box.height)return;
    screwMove((event.clientX-box.left)/box.width*100,
      (event.clientY-box.top)/box.height*100);
    event.preventDefault();
  });
  screwPopup?.addEventListener('pointerup',()=>{screwDragging=false;});
  screwPopup?.addEventListener('pointercancel',()=>{screwDragging=false;});
  screwPopup?.addEventListener('wheel',event=>{
    if(!screwSession||!event.target.closest('.screw-alignment-board'))return;
    event.preventDefault();event.stopPropagation();
    if(event.deltaY!==0)screwTurn(event.deltaY>0?1:-1);
  },{passive:false});
  screwPopup?.addEventListener('keydown',event=>{
    if(!screwSession)return;
    if(event.key==='Escape'){
      event.preventDefault();closeScrewPractice();paint();return;
    }
    if(!event.target.closest('[data-screw-head]'))return;
    const st=screwSession.getState();
    const arrows={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]};
    if(arrows[event.key]){
      event.preventDefault();
      screwMove(st.x+arrows[event.key][0]*2,st.y+arrows[event.key][1]*2);
    }else if(['+','=','PageDown'].includes(event.key)){
      event.preventDefault();screwTurn(1);
    }else if(['-','PageUp'].includes(event.key)){
      event.preventDefault();screwTurn(-1);
    }
  });
  panel.addEventListener('dragstart',event=>{
    const item=event.target.closest('[data-drag-item]');
    if(!game||!item||item.draggable===false)return;
    const k=item.dataset.dragItem;
    const [category]=k.split(':');
    if(!has(k))return event.preventDefault();
    const part=category;
    game.selected=k;
    event.dataTransfer.setData('text/plain',part);
    event.dataTransfer.effectAllowed='copy';
    root.PC3D?.dragPart?.(part);
  });
  panel.addEventListener('dragend',()=>root.PC3D?.cancelDrag?.());
  function dropPart(part){
    if(!game)return;
    const preferred=game.selected.startsWith(part+':')?game.selected:null;
    const available=preferred&&has(preferred)?preferred:
      Object.keys(game.stock).find(k=>k.startsWith(part+':')&&has(k));
    if(!available){message('Necesitas comprar esa pieza antes de arrastrarla a la torre.');return;}
    game.selected=available;
    perform('fit');
  }
  panel.addEventListener('click',event=>{
    const summary=event.target.closest('summary');
    if(summary&&panel.contains(summary)){
      event.preventDefault();
      const details=summary.parentElement;
      const name=details?.dataset.section;
      if(!name||!game)return;
      if(details.open)game.openSections=game.openSections.filter(x=>x!==name);
      else game.openSections=[...game.openSections.filter(x=>x!==name),name].slice(-2);
      panel.querySelectorAll('details[data-section]').forEach(d=>{
        d.open=game.openSections.includes(d.dataset.section);
      });
      return;
    }
    const button=event.target.closest('button');if(!button||!game)return;
    if(button.hasAttribute('data-open-store')){openStore();return;}
    if(button.dataset.toolBuy){buyTool(button.dataset.toolBuy);return;}
    if(button.dataset.toolUse){useTool(button.dataset.toolUse);return;}
    if(button.hasAttribute('data-tool-view')){api.toolView?.();return;}
    if(button.hasAttribute('data-ram-toggle')){toggleRamPrecision();return;}
    if(button.hasAttribute('data-screw-toggle')){toggleScrewPractice();return;}
    if(button.hasAttribute('data-cpu-toggle')){toggleCpuPrecision();return;}
    if(button.hasAttribute('data-paste-toggle')){togglePastePractice();return;}
    if(button.hasAttribute('data-thermal-next')){thermalNext();return;}
    if(button.hasAttribute('data-cooler-start')){continueCoolerMount();return;}
    if(button.dataset.quick){perform(button.dataset.quick);return;}
    if(button.hasAttribute('data-demo-build')){demoBuild();return;}
    if(button.dataset.shopInfo){api.inspectPart?.(button.dataset.shopInfo);return;}
    if(button.hasAttribute('data-confirm-demo')){runTechnicalDemo();return;}
    if(button.hasAttribute('data-cancel-demo')){cancelDemo();return;}
    if(button.hasAttribute('data-risk-seed')){setRiskSeed(query('#advRiskSeed')?.value);return;}
    if(button.hasAttribute('data-esd-toggle')){toggleEsd();return;}
    if(button.hasAttribute('data-prepare-usb')){prepareUsb(query('#advPrepareOS')?.value);return;}
    if(button.hasAttribute('data-connect-usb')){connectInstallerUsb(query('#advUsbSelection')?.value);return;}
    if(button.hasAttribute('data-eject-usb')){disconnectInstallerUsb();return;}
    if(button.dataset.quickConnector){
      const c=button.dataset.quickConnector;
      const st=api.state();
      const key={monitor:'monitorCable',keyboard:'keyboardConnected',
        mouse:'mouseConnected',frontusb3:'frontUsb3',frontusbc:'frontUsbC'}[c];
      const active=!!st[key];
      if(active)disconnect(c);else connect(c);
      return;
    }
    if(button.dataset.mountedInspect){api.inspectPart?.(button.dataset.mountedInspect);return;}
    if(button.dataset.suggest){game.verb=button.dataset.suggest;perform(button.dataset.suggest);}
    else if(button.dataset.returnItem)returnItem(button.dataset.returnItem);
    else if(button.hasAttribute('data-exchange-go')){
      const target=query('#advExchangeTarget');
      if(target)exchange(game.selected,target.value);
    }else if(button.dataset.buy){
      const [cat,id]=button.dataset.buy.split(':');purchase(cat,id);
    }else if(button.dataset.selectItem)select(button.dataset.selectItem);
    else if(button.dataset.verb)selectVerb(button.dataset.verb);
    else if(button.hasAttribute('data-go'))perform();
    else if(button.hasAttribute('data-deliver'))checkDelivery();
    else if(button.hasAttribute('data-close'))api.caseToggle();
    else if(button.hasAttribute('data-rear'))api.rearView();
    else if(button.hasAttribute('data-exit-mode'))exit();
  });
  meterPopup?.addEventListener('click',event=>{
    const button=event.target.closest('button');if(!button||!game)return;
    if(button.hasAttribute('data-meter-close')){closeMeter();return;}
    if(button.dataset.meterFace){
      if(['contacts','wires'].includes(button.dataset.meterFace)){
        game.meterFace=button.dataset.meterFace;
        game.meterReading=null;renderMeter();
      }
      return;
    }
    if(button.dataset.meterHelp){
      if(['signals','voltages','colors','exam'].includes(button.dataset.meterHelp)){
        game.meterHelpMode=button.dataset.meterHelp;renderMeter();
      }
      return;
    }
    if(button.dataset.meterPin){selectMeterPin(Number(button.dataset.meterPin));return;}
    if(button.dataset.meterLead){
      game.meterLead=button.dataset.meterLead;renderMeter();return;
    }
    if(button.dataset.meterMode){
      game.meterMode=button.dataset.meterMode;game.meterReading=null;renderMeter();return;
    }
    if(button.hasAttribute('data-meter-probe')){probeMeter();return;}
    if(button.hasAttribute('data-meter-fuse')){replaceMeterFuse();return;}
  });
  meterPopup?.addEventListener('change',event=>{
    if(!game)return;
    if(event.target.id==='meterJack'){
      game.meterJack=event.target.value;game.meterReading=null;renderMeter();
    }else if(event.target.id==='meterConnector'){
      if(event.target.value==='series'){
        game.meterTest='series';game.meterReading=null;renderMeter();
      }else selectMeterConnector(event.target.value);
    }
  });
  storePage?.addEventListener('click',event=>{
    const button=event.target.closest('button');
    if(!button||!game)return;
    if(button.hasAttribute('data-store-back')){closeStore();return;}
    if(button.dataset.sellerTopic){
      if(['materials','process'].includes(button.dataset.sellerTopic)){
        game.sellerTopic=button.dataset.sellerTopic;renderStore();
      }
      return;
    }
    if(button.dataset.storeCategory){setStoreCategory(button.dataset.storeCategory);return;}
    if(button.hasAttribute('data-store-close-info')){
      game.storeInfo=null;renderStore();return;
    }
    if(button.dataset.storeInfo){
      const k=button.dataset.storeInfo;
      if(!Object.hasOwn(OFFERS,k.split(':')[0])||
        price(...k.split(':'))==null)return;
      game.storeInfo=k;renderStore();
      // En móvil la ficha va debajo del catálogo: traerla a la vista
      // al pulsar «Ficha técnica» para que parezca una acción inmediata.
      if(root.matchMedia?.('(max-width:850px)')?.matches)
        storePage.querySelector('#storeDetail')?.scrollIntoView?.({block:'start'});
      return;
    }
    if(button.dataset.storeBuy){
      const [cat,id]=button.dataset.storeBuy.split(':');
      if(price(cat,id)!=null)purchase(cat,id);
    }
  });
  storePage?.addEventListener('change',event=>{
    if(event.target.id==='advShopCategory')setStoreCategory(event.target.value);
  });
  storePage?.addEventListener('input',event=>{
    if(!game||event.target.id!=='storeSearch')return;
    game.storeQuery=event.target.value;
    const results=storePage.querySelector('#storeItems');
    if(results)results.innerHTML=storeProductCards();
  });
  panel.addEventListener('change',event=>{
    if(!game)return;
    if(event.target.id==='advClient')start(event.target.value);
    else if(event.target.id==='advConnection'){game.connection=event.target.value;}
    else if(event.target.id==='advWorkSpeed')setSpeed(event.target.value);
    else if(event.target.id==='advRiskMode'){
      // No reconstruir el select durante su evento change.
      game.riskEnabled=event.target.value==='on';
      const status=panel.querySelector('#advRiskStatus');
      if(status)status.textContent='Incidencias: '+game.incidents.length+
        ' · reparaciones pendientes: '+(game.pendingSataRepair?1:0)+
        ' · comprobaciones pendientes: '+(game.pendingSataLatent?1:0)+
        ' · pulsera ESD: '+(game.esdConnected?'conectada':'desconectada')+
        ' · '+(game.riskEnabled?'activas':'desactivadas');
    }
    else if(event.target.id==='advUsbSelection')game.selected=event.target.value;
    else if(event.target.id==='advVideoOutput'){
      game.videoOutput=event.target.value;
      const st=api.state();
      if(st.monitorCable){st.monitorCable=false;api.render();}
      paint();
    }
  });
  return {start,exit,openStore,closeStore,setStoreCategory,renderStore,
    buyTool,useTool,openTool,openMeter,closeMeter,probeMeter,replaceMeterFuse,
    selectMeterConnector,selectMeterPin,openMeterAtPin,
    getWorkshop:()=>workshop.snapshot(),
    storeFacts,sellerMessages,demoBuild,runTechnicalDemo,cancelDemo,paint,perform,dropPart,purchase,returnItem,exchange,select,selectVerb,stagedItems,connect,disconnect,apply,installOS,checkDelivery,
    hasInstallerUSB:()=>Object.keys(USB_PREPARED).some(id=>has('item:'+id)),
    prepareUsb,connectInstallerUsb,disconnectInstallerUsb,toggleInstallerUsb,
    hasPreparedUSB:k=>!!USB_PREPARED[String(k).split(':')[1]]&&has(k),
    importCases,getCase,getExport,operationSummary,setSpeed,
    setRiskEnabled,setRiskSeed,toggleEsd,revealLatentSataOnPower,
    toggleRamPrecision,ramPrecisionStep,ramPrecisionState,ramPrecisionCapture,
    toggleScrewPractice,screwPracticeState,screwMove,screwTurn,
    toggleCpuPrecision,cpuPrecisionState,cpuPrecisionStep,cpuPrecisionCapture,cpuPrecisionMove,
    togglePastePractice,finishCoolerPractice,thermalNext,continueCoolerMount,
    pasteUi:{getState:()=>pasteUi?.getState()||null,
      pump:down=>pasteUi?.pump(down),pointer:(x,y)=>pasteUi?.pointer(x,y),
      tick:ms=>pasteUi?.tick(ms),confirm:()=>pasteUi?.confirm()},
    get active(){return !!game},get game(){return game}};
}
root.createAdventureGame=createAdventureGame;
})(window);
