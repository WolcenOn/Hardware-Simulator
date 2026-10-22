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
  motherboard:[['b650',159],['b650m',129],['a520',79],['b550',109],['z790',249],['h610',75],['b760',165]],
  cpu:[['r7600',189],['r5600',99],['r5600g',129],['r5700x',145],['r8600g',219],['r8700g',295],['r7700',275],['i512400',165],['i512400f',139],['i514400',239],['i513600k',279]],
  ram:[['ddr4_8',28],['ddr4_16',42],['ddr4_32',79],['ddr5_8',45],['ddr5_16',62],['ddr5_32',114],['ddr5_64',215]],
  storage:[['sataSSD',64],['sataSSD2',109],['nvmeSSD',79],['nvme2',145],['hdd',57],['hdd4',99]],
  gpu:[['rx6600',179],['rx7600',249],['rtx3060',235],['rtx4060',289],['rtx4070',529]],
  psu:[['psu450',49],['psu550',69],['psu650',89],['psu750',115],['psu850',139],['psu1000',199]],
  case:[['tower',89]],
  cooler:[['air',39]],
  item:[['screwdriver',12],['screws',8],['paste',9],['ioShield',8],['sataCable',7],
    ['hdmi',10],['keyboard',22],['mouse',14],['osusb',18],['fan',15]]
};
const LABELS={
  'case:tower':'Caja ATX con bandejas',
  'cooler:air':'Disipador de CPU (aire)',
  'item:screwdriver':'Destornillador de estrella',
  'item:screws':'Juego de tornillos (10)',
  'item:paste':'Pasta térmica (1 aplicación)',
  'item:ioShield':'Chapa I/O trasera ATX',
  'item:sataCable':'Cable SATA de datos',
  'item:hdmi':'Cable HDMI/DisplayPort',
  'item:keyboard':'Teclado USB',
  'item:mouse':'Ratón USB',
  'item:osusb':'Memoria USB con instalador del SO',
  'item:fan':'Ventilador PWM de caja de 120 mm'
};
const CATEGORIES={case:'Caja',motherboard:'Placa',cpu:'CPU',ram:'RAM',
  cooler:'Disipador',storage:'Disco',gpu:'GPU',psu:'Fuente',
  item:'Herramientas y accesorios'};
const CONNECTIONS=[
  ['atx24','Placa · ATX 24 pines'],['eps','CPU · EPS 8 pines'],
  ['frontpanel','Caja · POWER SW'],['gpupower','GPU · PCIe / 12VHPWR'],
  ['sataData','Disco · SATA datos'],['sataPower','Disco · SATA alimentación'],
  ['cpufan','Disipador · CPU_FAN'],['monitor','Monitor · HDMI / DP'],
  ['keyboard','Teclado · USB'],['mouse','Ratón · USB'],
  ['sysfan0','Caja · SYS_FAN 1'],['sysfan1','Caja · SYS_FAN 2'],
  ['sysfan2','Caja · SYS_FAN 3']
];
const VERBS=[['fit','Encajar'],['screw','Atornillar'],['connect','Conectar'],
  ['apply','Aplicar'],['route','Ordenar cables'],['remove','Retirar'],['boot','Encender / apagar'],
  ['bios','BIOS'],['os','Instalar SO'],['inspect','Inspeccionar']];
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const format=amount=>amount.toLocaleString('es-ES',{style:'currency',currency:'EUR',minimumFractionDigits:0,maximumFractionDigits:0});
const key=(cat,id)=>cat+':'+id;
const safe=val=>String(val).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
function createAdventureGame(api){
  let game=null;
  const panel=api.document.getElementById('adventurePanel');
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
    game.messages=game.messages.slice(0,9);
    api.log(level,text);
    paint();
  }
  const stock=(k)=>game?.stock[k]||0;
  const owned=(k)=>stock(k)>0||!!game?.used[k];
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
    state.adventureMode=true;state.osInstalled=false;state.paste=0;state.videoPort=which==='office'?'motherboard':'gpu';
    state.selected.gpu=which==='office'?'none':'rx7600';
    game={
      caseId:which,budget:CASES[which].budget,spent:0,stock:{},used:{},
      selected:'',verb:'fit',connection:'atx24',videoOutput:which==='office'?'motherboard':'gpu',shopCategory:'motherboard',
      screwed:{},messages:[],attempts:0,inspection:'',report:null,
      purchases:[],osUSB:false
    };
    api.document.body.classList.add('adventure-on');
    message('Nuevo encargo: '+CASES[which].client+'. Compra componentes y herramientas antes de montar.','ok');
    api.render();
  }
  function exit(){
    api.document.body.classList.remove('adventure-on');
    const state=api.state();
    state.adventureMode=false;
    game=null;
    api.reset();
    api.render();
    paint();
  }
  function canReturn(k){
    const qty=k==='item:screws'?10:1;
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
  function purchase(cat,id){
    const cost=price(cat,id);
    if(cost==null||!game)return;
    if(game.spent+cost>game.budget){
      message('Saldo insuficiente: necesitas '+format(cost)+', te quedan '+format(game.budget-game.spent)+'.');
      return;
    }
    const k=key(cat,id);
    if(cat==='gpu'&&id==='none')return;
    game.stock[k]=(game.stock[k]||0)+(k==='item:screws'?10:1);
    game.spent+=cost;
    game.purchases.push({k,price:cost});
    game.selected=k;
    message('Comprado: '+label(cat,id)+' por '+format(cost)+'.','ok');
  }
  function select(k){if(!owned(k)){message('No tienes ese objeto en el inventario.');return;}game.selected=k;paint();}
  function selectVerb(verb){game.verb=verb;paint();}
  function perform(override=null){
    if(!game)return;
    const g=game,st=api.state(),verb=override||g.verb,k=g.selected;
    if(verb==='boot'){api.power();return;}
    if(verb==='route'){api.action('route_psu');return;}
    if(verb==='bios'){api.bios();return;}
    if(verb==='inspect'){inspect();return;}
    if(verb==='os'){installOS();return;}
    if(!k){message('Selecciona primero una pieza del inventario.');return;}
    if(verb==='connect'){connect(g.connection);return;}
    if(verb==='apply'){apply(k);return;}
    const [cat,id]=k.split(':');
    if(verb==='fit'){
      if(cat==='ram'&&st.installed.ram&&!st.ramSeated){
        api.action('seat_ram');message('DIMM encajado en ambas pestañas.','ok');return;
      }
      if(k==='item:ioShield'){
        if(!has(k)){message('Necesitas la chapa I/O.');return;}
        api.installIOShield();
        if(st.ioShield){expend(k);message('Chapa I/O colocada antes de la placa.','ok');}
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
      api.install(part);
      if(st.installed[part]&&!previous){
        expend(k);
        if(part==='ram')message('Módulos colocados, pero hay que presionar hasta encajar el DIMM.','ok');
        else message(label(cat,id)+' encajado. Comprueba tornillos y conexiones.','ok');
      }else if(previous)message('La pieza ya está instalada: prueba atornillar o conectar.');
      return;
    }
    if(verb==='screw'){
      if(cat==='item'){message('Selecciona una pieza instalada para atornillarla.');return;}
      const part=cat;
      if(!st.installed[part]){message('Antes de atornillar debes encajar la pieza.');return;}
      if(!owned('item:screwdriver')||!has('item:screws')){
        message('Necesitas destornillador y tornillos sin usar. Cómpralos en la tienda.');return;
      }
      if(g.screwed[part]){message('Esta pieza ya está atornillada.');return;}
      expend('item:screws');
      g.screwed[part]=true;
      message('Atornillado: '+label(cat,id)+'.','ok');
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
      if(cat==='gpu'){st.gpuPower=false;st.monitorCable=false;}
      if(cat==='psu'){st.eps=false;st.atx24=false;st.gpuPower=false;}
      if(cat==='ram')st.ramSeated=false;
      if(cat==='cooler')st.cpuFan=false;
      if(cat==='storage'){st.sataData=false;st.sataPower=false;st.osInstalled=false;}
      delete g.screwed[cat];
      g.stock[k]=(g.stock[k]||0)+1;
      message('Retirado: '+label(cat,id)+'. Queda disponible para volver a montar.','ok');
      api.render();return;
    }
    message('Esa acción no es válida para el objeto seleccionado.');
  }
  function apply(k){
    if(k!=='item:paste'){message('Para aplicar necesitas seleccionar pasta térmica.');return;}
    const st=api.state();
    if(st.power||st.caseClosed){message('No apliques pasta con el PC encendido o cerrado.');return;}
    if(!st.installed.cpu||st.installed.cooler){
      message('La pasta se aplica sobre la CPU, antes de fijar el disipador.');return;
    }
    if(!expend(k)){message('Ya no te queda pasta térmica. Compra otra aplicación.');return;}
    st.paste=1;
    message('Pasta térmica aplicada correctamente sobre la CPU.','ok');
    api.render();
  }
  function connect(target){
    const st=api.state();
    const internal=!['monitor','keyboard','mouse'].includes(target);
    if(internal&&(st.power||st.caseClosed)){
      message('Para conectar componentes internos, apaga y abre la caja.');return;
    }
    const preconditions={
      atx24:()=>st.installed.psu&&st.installed.motherboard,
      eps:()=>st.installed.psu&&st.installed.motherboard,
      frontpanel:()=>st.installed.case&&st.installed.motherboard,
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
    const flags={atx24:'atx24',eps:'eps',frontpanel:'frontPanel',gpupower:'gpuPower',
      sataData:'sataData',sataPower:'sataPower',cpufan:'cpuFan',
      monitor:'monitorCable',keyboard:'keyboardConnected',mouse:'mouseConnected'};
    if(st[flags[target]]){message('Esa conexión ya está realizada.');return;}
    const actions={atx24:'connect_atx24',eps:'connect_eps',
      frontpanel:'connect_frontpanel',gpupower:'gpu_power',
      sataData:'connect_sata',sataPower:'connect_sata_power',cpufan:'connect_fan',
      monitor:'connect_monitor',keyboard:'connect_keyboard',mouse:'connect_mouse'};
    api.action(actions[target]);
    if(st[flags[target]])message('Conexión realizada: '+(CONNECTIONS.find(x=>x[0]===target)?.[1]||target)+'.','ok');
    else message('No se ha podido completar la conexión. Comprueba fuente y cableado.');
  }
  function installOS(){
    const st=api.state(),ev=api.evaluate();
    if(!owned('item:osusb')){message('Compra una memoria USB de instalación.');return;}
    if(!st.power||!ev.post||ev.temp>=102){message('El PC debe completar el POST sin protección térmica antes de instalar el SO.');return;}
    if(st.biosCfg.boot!=='usb'){message('Entra en UEFI y coloca USB primero en el orden de arranque.');return;}
    if(!st.installed.storage){message('No hay disco donde instalar el sistema.');return;}
    if(api.part('storage').interface==='SATA'&&(!st.sataData||!st.sataPower)){
      message('El instalador no detecta el disco: revisa datos y alimentación SATA.');return;
    }
    if(!st.monitorCable||!st.keyboardConnected){message('Conecta monitor y teclado para completar el instalador.');return;}
    st.osInstalled=true;
    gOS();
    message('SO instalado en '+api.part('storage').name+'. ¡Recuerda volver a arrancar desde SSD!','ok');
  }
  function gOS(){api.render();}
  function inspect(){
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
    game.inspection=symptoms.join(' ');
    message('Inspección: '+game.inspection,'ok');
  }
  function checkDelivery(){
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
        (job.minStorage==='nvme'?drive==='M2_NVME':st.selected.storage!=='hdd')],
      ['Gráfica adecuada',!job.gpu||!!st.installed.gpu&&!!st.gpuPower],
      ['Temperatura aceptable y CPU_FAN',ev.temp<=job.maxTemp&&!!st.installed.cooler&&!!st.cpuFan],
      ['Piezas fijadas y seguras',['motherboard','psu','storage']
        .every(x=>!st.installed[x]||game.screwed[x])],
      ['Conexiones externas y pasta',st.monitorCable&&st.keyboardConnected&&st.mouseConnected&&st.paste>=.7]
    ];
    const ok=checks.every(x=>x[1]);
    game.report={ok,checks,score:checks.filter(x=>x[1]).length,spent:game.spent};
    message(ok?'¡Entrega aceptada por '+job.client+'!':
      'Entrega rechazada: hay '+checks.filter(x=>!x[1]).length+' requisitos sin cumplir.',ok?'ok':'warn');
  }
  function shopMarkup(){
    const cat=game.shopCategory;
    const entries=OFFERS[cat]||[];
    return '<label class="adventure-label">Departamento de la tienda</label>'+
      '<select id="advShopCategory">'+Object.keys(OFFERS).map(k=>
        '<option value="'+k+'"'+(k===cat?' selected':'')+'>'+safe(CATEGORIES[k])+'</option>').join('')+
      '</select><div class="adv-list">'+entries.map(([id,cost])=>
        '<div class="adv-card"><div><strong>'+safe(label(cat,id))+'</strong>'+
        '<small>'+safe(cat==='item'?'Herramienta/consumible':CATEGORIES[cat])+'</small></div>'+
        '<button type="button" data-buy="'+safe(key(cat,id))+'"'+
        (cost>game.budget-game.spent?' disabled':'')+'>'+
        format(cost)+'</button></div>').join('')+'</div>';
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
  function paint(){
    if(!game){if(panel)panel.innerHTML='';return;}
    const job=CASES[game.caseId];
    panel.innerHTML=
      '<div class="title"><h2>Encargos y tienda</h2><span>Aventura de montaje</span></div>'+
      '<label class="adventure-label">Cliente</label><select id="advClient">'+
      Object.entries(CASES).map(([id,c])=>'<option value="'+id+'"'+(id===game.caseId?' selected':'')+
        '>'+safe(c.name)+'</option>').join('')+'</select>'+
      '<p class="adv-story"><b>'+safe(job.client)+'</b>: '+safe(job.story)+'</p>'+
      '<div class="adv-ledger"><span>Presupuesto: <b>'+format(job.budget)+'</b></span>'+
      '<span>Gastado: <b>'+format(game.spent)+'</b></span>'+
      '<span>Disponible: <b>'+format(job.budget-game.spent)+'</b></span></div>'+
      '<p class="muted">Precios ficticios en euros, únicamente para el juego.</p>'+ '<h3>1. Tu inventario (editable)</h3>'+
      '<p class="muted">Devuelve piezas sin montar o cámbialas por otra referencia. Para devolver algo instalado, utiliza primero Retirar.</p>'+
      '<div class="adv-inventory-grid">'+inventoryMarkup()+'</div>'+
      '<p class="adv-current">Objeto: <b>'+safe(game.selected?label(...game.selected.split(':')):'Ninguno')+'</b></p>'+
      exchangeMarkup()+
      '<h3>2. Tienda de informática</h3>'+shopMarkup()+
      '<h3>3. Acciones</h3><div class="adv-verbs">'+VERBS.map(([id,text])=>
        '<button type="button" class="'+(game.verb===id?'chosen':'')+'" data-verb="'+id+'">'+text+'</button>').join('')+'</div>'+
      '<label class="adventure-label">Destino del cable (verbo Conectar)</label>'+
      '<label class="adventure-label">Salida de vídeo al monitor</label>'+
      '<select id="advVideoOutput">'+
      '<option value="motherboard"'+(game.videoOutput==='motherboard'?' selected':'')+
      '>Placa base · HDMI/DP (requiere iGPU de CPU)</option>'+
      '<option value="gpu"'+(game.videoOutput==='gpu'?' selected':'')+
      '>Tarjeta gráfica dedicada · HDMI/DP</option></select>'+
      '<select id="advConnection">'+CONNECTIONS.map(([id,text])=>
        '<option value="'+id+'"'+(id===game.connection?' selected':'')+'>'+text+'</option>').join('')+'</select>'+
      '<div class="adv-actions"><button type="button" class="primary" data-go>Realizar acción</button>'+
      '<button type="button" data-rear>Ver trasera</button>'+
      '<button type="button" data-close>Cerrar / abrir caja</button></div>'+
      '<h3>4. Encargo</h3><p class="adv-story">'+job.goals.map(safe).join(' · ')+'</p>'+
      '<button type="button" class="primary adv-deliver" data-deliver>Entregar PC al cliente</button>'+
      (game.report?'<div class="adv-report"><b>'+ (game.report.ok?'ENCARGO SUPERADO':'REVISAR MONTAJE')+
        ' · '+game.report.score+'/10</b>'+
        game.report.checks.map(([c,ok])=>'<div class="'+(ok?'oktxt':'errtxt')+'">'+
        (ok?'✓ ':'✗ ')+safe(c)+'</div>').join('')+'</div>':'')+
      '<div class="adv-log" role="status" aria-live="polite">'+game.messages.map(m=>
        '<p class="'+(m.level==='ok'?'oktxt':'warntxt')+'">'+safe(m.text)+'</p>').join('')+'</div>'+
      '<button type="button" data-exit-mode>Salir al modo técnico</button>';
  }
  // El inventario también se puede arrastrar hasta los anclajes verdes
  // del 3D. Nunca instala piezas que no se hayan comprado.
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
    const button=event.target.closest('button');if(!button||!game)return;
    if(button.dataset.returnItem)returnItem(button.dataset.returnItem);
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
  panel.addEventListener('change',event=>{
    if(!game)return;
    if(event.target.id==='advShopCategory'){game.shopCategory=event.target.value;paint();}
    else if(event.target.id==='advClient')start(event.target.value);
    else if(event.target.id==='advConnection'){game.connection=event.target.value;}
    else if(event.target.id==='advVideoOutput'){
      game.videoOutput=event.target.value;
      const st=api.state();
      if(st.monitorCable){st.monitorCable=false;api.render();}
      paint();
    }
  });
  return {start,exit,paint,perform,dropPart,purchase,returnItem,exchange,select,selectVerb,connect,apply,installOS,checkDelivery,
    get active(){return !!game},get game(){return game}};
}
root.createAdventureGame=createAdventureGame;
})(window);
