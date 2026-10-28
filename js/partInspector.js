// Hardware Simulator 8.3: menú 3D contextual y ficha técnica / montaje.
// Componente puramente de UI: lee estados del motor, no altera el modelo físico.
(function(root){
'use strict';
const groups={motherboard:'motherboards',cpu:'cpus',ram:'ram',storage:'storage',
  gpu:'gpus',psu:'psus'};
const titles={case:'Caja ATX',cooler:'Disipador CPU',motherboard:'Placa base',
  cpu:'Procesador',ram:'Memoria RAM',storage:'Almacenamiento',
  gpu:'Tarjeta gráfica',psu:'Fuente ATX',monitor:'Monitor',keyboard:'Teclado USB',
  mouse:'Ratón USB',fan0:'Ventilador frontal 1',fan1:'Ventilador frontal 2',
  fan2:'Ventilador trasero',casePower:'Botón de encendido',
  frontUsb3:'USB-A frontal 3.0',frontUsbC:'Puerto USB-C frontal'};
const special={
  'case:tower':{name:'Caja ATX negra',sizeMm:'453 × 230 × 466 mm',desc:'Torre ATX negra con PSU inferior.'},
  'case:towerWhite':{name:'Caja ATX blanca',sizeMm:'453 × 230 × 466 mm',desc:'Misma torre en acabado blanco.'},
  'case:towerGraphite':{name:'Caja ATX grafito',sizeMm:'453 × 230 × 466 mm',desc:'Misma torre con pintura grafito.'},
  'cooler:stock':{name:'Disipador compacto',sizeMm:'90 × 90 × 55 mm',desc:'Ventilador de serie; menos margen térmico.'},
  'cooler:twinTower':{name:'Doble torre de aire 120 mm',sizeMm:'140 × 125 × 160 mm',desc:'Dos bloques de aletas de aluminio.'},
  'cooler:aio240':{name:'AIO líquida 240 mm',sizeMm:'240 × 120 mm',desc:'Radiador doble, bomba y tubos; requiere CPU_FAN.'},
  'cooler:aio360':{name:'AIO líquida 360 mm',sizeMm:'360 × 120 mm',desc:'Radiador triple y bomba; requiere CPU_FAN.'},
  'cooler:air':{name:'Disipador por aire',desc:'Requiere pasta térmica y conexión CPU_FAN.'},
  'item:paste':{name:'Pasta térmica',desc:'Aplicar sobre la CPU antes de fijar el disipador.'},
  'item:rgbStrip':{name:'Tira LED ARGB',desc:'Instalar en chasis abierto, apagado; brilla al arrancar.'},
  'item:screws':{name:'Juego de tornillos',desc:'Se consumen al fijar componentes instalados.'},
  'item:screwdriver':{name:'Destornillador',desc:'Herramienta reutilizable de montaje.'},
  'item:ioShield':{name:'Chapa I/O',desc:'Debe colocarse antes de instalar la placa.'},
  'item:sataCable':{name:'Cable SATA',interface:'SATA',desc:'Datos desde placa al disco SATA.'},
  'item:hdmi':{name:'Cable HDMI/DP',desc:'Conecta la salida de vídeo elegida al monitor.'},
  'item:fan':{name:'Ventilador de caja PWM',sizeMm:'120 mm',desc:'Requiere conexión SYS_FAN.'},
  'item:osusb':{name:'USB de instalación de SO',desc:'Instalador de sistema; requiere Boot #1 USB en BIOS.'},
  'item:keyboard':{name:'Teclado USB',desc:'Necesario para la BIOS y la instalación.'},
  'item:mouse':{name:'Ratón USB',desc:'Dispositivo de entrada USB.'}
};
const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function createPartInspector(api){
  const mount=api.document.getElementById('viewportWrap');
  const pop=api.document.getElementById('partContextMenu');
  const sheet=api.document.getElementById('partSpecSheet');
  let target=null,detailsOpen=false,feedback=null;
  const good=(label,on,description='')=>({label,level:on?'ok':'warn',value:on?'Correcto':'Pendiente',description});
  const info=(label,value,description='')=>({label,level:'info',value,description});
  function parse(ref){
    if(!ref)return null;
    const raw=String(ref);
    if(/^item:osusb:USB-\d+$/.test(raw))
      return {category:'item',id:'osusb',key:'item:osusb',mediaId:raw.split(':')[2]};
    if(raw==='storage2')return {category:'storage2',id:api.state()?.secondaryStorage?.id||'',key:'storage2'};
    if(raw.startsWith('fan')&&/^fan[0-2]$/.test(raw))
      return {category:raw,id:raw,key:raw};
    const [category,...rest]=raw.split(':');
    if(groups[category]||['case','cooler','item'].includes(category)){
      const id=rest.length?rest.join(':'):
        (category==='case'?api.state()?.selected?.caseVariant:
         api.state()?.selected?.[category])||
        (category==='case'?'tower':category==='cooler'?'air':'');
      return {category,id,key:category+':'+id};
    }
    if(titles[raw])return {category:raw,id:raw,key:raw};
    return null;
  }
  function getInfo(ref){
    const t=parse(ref);if(!t)return null;
    const catalog=api.catalog?.[t.category==='storage2'?'storage':groups[t.category]];
    const model=catalog?.[t.id]||special[t.key]||{};
    const name=t.mediaId?t.mediaId+' · USB físico de 32 GB':
      t.category==='storage2'?'Unidad 2 · '+(model.name||'Almacenamiento SATA'):
      model.name||titles[t.category]||t.id;
    return {...t,name,model};
  }
  function installed(t,st,source='tower'){
    // Una referencia en la mesa es una unidad física libre, aunque su SKU
    // coincida con otro componente que ya está dentro de la caja.
    if(source==='table')return false;
    if(t.category==='storage2')return !!st.secondaryStorage?.installed;
    if(t.category.startsWith('fan'))return !!st.caseFans?.[Number(t.category.slice(-1))]?.installed;
    if(['monitor','keyboard','mouse'].includes(t.category))return true;
    if(['casePower','frontUsb3','frontUsbC'].includes(t.category))return !!st.installed?.case;
    if(t.category==='item')return false;
    return !!st.installed?.[t.category]&&
      (['case','cooler'].includes(t.category)||st.selected?.[t.category]===t.id);
  }
  function compatibility(t){
    const st=api.state(),m=t.model,b=api.catalog?.motherboards?.[st.selected?.motherboard],
      cpu=api.catalog?.cpus?.[st.selected?.cpu],ram=api.catalog?.ram?.[st.selected?.ram],
      psu=api.catalog?.psus?.[st.selected?.psu];
    if(!m)return [];
    switch(t.category){
      case 'motherboard':return [
        good('Socket placa ↔ CPU',!cpu||m.socket===cpu.socket,(m.socket||'—')+' / '+(cpu?.socket||'—')),
        good('Estándar RAM',!ram||m.ram===ram.type,(m.ram||'—')+' / '+(ram?.type||'—'))];
      case 'cpu':return [
        good('Socket CPU ↔ placa',!b||m.socket===b.socket,(m.socket||'—')+' / '+(b?.socket||'—')),
        info('Gráficos integrados',m.igpu?(m.igpuName||'Sí'):'No; requiere GPU dedicada')];
      case 'ram':return [good('Tipo RAM ↔ placa',!b||m.type===b.ram,(m.type||'—')+' / '+(b?.ram||'—'))];
      case 'storage':return [good('Interfaz compatible',m.interface==='M2_NVME'?
        !!b?.slots?.m2:!!b?.slots?.sata,'Tipo: '+(m.interface||'—'))];
      case 'gpu':return [
        ...(m.power||[]).map(c=>good('Fuente: conector '+c,!!psu?.connectors?.[c],
          'Disponibles: '+(psu?.connectors?.[c]||0))),
        info('Bus PCIe',m.gen?'Gen '+m.gen:'—')];
      case 'psu':{
        const gpu=api.catalog?.gpus?.[st.selected?.gpu];
        const watts=api.watts?.()??0;
        return [
          good('Potencia con margen 25 %',(m.max||0)>=watts*1.25,
            'Estimado '+Math.ceil(watts*1.25)+' W / PSU '+(m.max||0)+' W'),
          ...(gpu?.power||[]).map(c=>good('GPU necesita '+c,!!m.connectors?.[c],
            'PSU tiene '+(m.connectors?.[c]||0)))];
      }
      default:return [];
    }
  }
  function checks(t,source=target?.source||'tower'){
    const st=api.state(),ad=api.adventure?.(),g=ad?.game;
    if(t.id==='osusb'&&t.category==='item'){
      const media=ad?.usbDrives?.().find(d=>d.id===t.mediaId)||
        ad?.usbDrives?.().find(d=>d.id===ad.game?.usbSelected);
      if(media)return [
        info('Número de serie',media.id),
        info('Ubicación',st.usbConnected&&st.usbMediaKey===media.id?
          'USB-A del PC · insertado':'Mesa del técnico · disponible'),
        info('Capacidad libre',media.freeGb.toFixed(2)+' GB / '+media.capacityGb+' GB'),
        info('Contenido',media.mode==='ventoy'?
          'Ventoy '+media.partition+' · '+media.images.length+' ISO':'Memoria vacía'),
        ...media.images.map(i=>info('ISO',i.file+' · '+i.gb+' GB'))];
    }
    if(source==='table')return [
      info('Ubicación física','Mesa de componentes · sin instalar'),
      info('Unidades disponibles',String(g?.stock?.[t.key]||0)),
      ...(t.category==='storage'?[info('Bahía','Se asigna al encajar esta unidad')]:[])
    ];
    const esdRate=window.PC_MISHAPS?.componentEsdRisk?.(t.category,
      !!g?.esdConnected)||0;
    const isInstalled=installed(t,st,source),screw=k=>
      !g?info('Atornillado','No registrado en modo técnico'):
      good('Fijación con tornillos',!!g.screwed?.[k],'Fijar con destornillador y tornillos');
    if(t.category==='storage2'){
      const disk=st.secondaryStorage||{};
      return [good('Unidad 2 · bahía '+(disk.bay==='upper'?'superior':'inferior'),!!disk.installed),
        good('SATA datos 2',!!disk.sataData),
        good('Alimentación SATA 2',!!disk.sataPower),
        info('Sistema instalado',window.PC_OS?.CATALOG?.[disk.installedOs?.id]?.name||'Ninguno'),
        info('Orden UEFI',st.biosCfg?.boot==='hdd2'?'Primero':'Otra prioridad')];
    }
    if(t.key==='item:rgbStrip')return [
      good('Tira LED instalada',!!st.rgbInstalled),
      info('Iluminación',st.rgbInstalled&&st.power?'Encendida':'Apagada')
    ];
    if(t.key==='item:ioShield')return [
      good('Chapa I/O trasera encajada',!!st.ioShield,
        'El marco rodea las salidas USB y HDMI/DP de la placa'),
      info('Posición','Abertura trasera del chasis · zona rear I/O'),
      info('Placa instalada',st.installed.motherboard?'Sí':'No; instalar después de la chapa')
    ];
    if(t.category==='item')return [
      info('Ubicación',g?.stock?.[t.key]?'Inventario / mesa auxiliar':'No disponible')];
    if(/^fan[0-2]$/.test(t.category)){
      const fan=st.caseFans?.[Number(t.category.slice(-1))];
      return [good('Montado',!!fan?.installed),good('Cable PWM · SYS_FAN',!!fan?.connected),
        info('Refrigeración',fan?.installed&&fan?.connected?'Activo':'Inactivo')];
    }
    if(t.category==='casePower')return [
      good('POWER SW → F_PANEL',!!st.frontPanel),
      info('Estado',st.power?'PC encendido':'PC apagado')];
    if(t.category==='frontUsb3'||t.category==='frontUsbC')return [
      good('Cable interno USB conectado',!!st[t.category]),
      info('Cabecera',t.category==='frontUsb3'?'USB 3.0 (19 pines)':'USB-C Type-E')];
    if(t.category==='monitor')return [good('Cable de vídeo',!!st.monitorCable),
      good('Señal de imagen',!!api.video?.(api.evaluate?.()),'Requiere POST, salida adecuada y equipo encendido'),
      info('Salida seleccionada',st.videoPort==='motherboard'?'Placa HDMI/DP':'GPU dedicada / automática')];
    if(t.category==='keyboard'||t.category==='mouse')return [
      good('USB conectado',!!st[t.category==='keyboard'?'keyboardConnected':'mouseConnected'])];
    if(!isInstalled)return [good('Situado en el chasis',false),
      info('En inventario',g?.stock?.[t.key]??0),
      ...(esdRate?[info('Riesgo ESD educativo',Math.round(esdRate*100)+' % por manipulación')]:[])];
    switch(t.category){
      case 'case':return [good('Caja colocada',!!st.installed.case),
        good('Chapa I/O',!!st.ioShield),info('Panel',st.caseClosed?'Cerrado':'Abierto'),
        info('Ventiladores instalados',String(st.caseFans?.filter(f=>f.installed).length||0)+'/3')];
      case 'motherboard':return [screw('motherboard'),info('Riesgo ESD educativo',Math.round(esdRate*100)+' %'),
        good('ATX 24 pines',!!st.atx24),good('POWER SW / F_PANEL',!!st.frontPanel),
        good('EPS 8 pines CPU',!!st.eps),good('Chapa I/O',!!st.ioShield)];
      case 'cpu':return [good('CPU instalada',true),good('Disipador',!!st.installed.cooler),
        info('Riesgo ESD educativo',Math.round(esdRate*100)+' % por manipulación'),
        good('Pasta térmica',st.paste>=.7),info('Limpieza',st.paste>0?'Necesita alcohol y toallitas antes de otra aplicación':'Superficie limpia'),
        good('EPS placa',!!st.eps)];
      case 'ram':return [good('DIMM bloqueado en pestañas',!!st.ramSeated),
        info('Riesgo ESD educativo',Math.round(esdRate*100)+' % por manipulación')];
      case 'cooler':return [info('Modelo',window.PC_COOLER_OPTIONS?.[st.selected.cooler]?.name||'Torre de aire'),
        good('Pasta térmica aplicada',st.paste>=.7),
        good('CPU_FAN conectado',!!st.cpuFan),
        info('Temperatura CPU',String(api.evaluate?.()?.temp??'—')+' °C')];
      case 'gpu':return [screw('gpu'),info('Riesgo ESD educativo',Math.round(esdRate*100)+' %'),
        ...(t.model.power?.length?[good('Alimentación PCIe / 12VHPWR',!!st.gpuPower),
          info('Conector requerido',t.model.power.join(', '))]:
          [info('Alimentación auxiliar','No necesaria')]),
        good('Cable de vídeo en GPU',!!st.monitorCable&&st.videoPort!=='motherboard')];
      case 'storage':return [screw('storage'),
        ...(t.model.interface==='SATA'?[good('SATA datos',!!st.sataData),
          good('SATA alimentación',!!st.sataPower)]:
          [info('Interfaz M.2 NVMe','Sin cables SATA')]),
        info('SO instalado',st.osInstalled?'Sí':'No')];
      case 'psu':return [screw('psu'),
        good('24 pines ATX',!!st.atx24),good('EPS CPU',!!st.eps),
        ...(st.installed.gpu?[good('Alimentación GPU',!!st.gpuPower)]:[]),
        good('Mazos asegurados',!!st.psuAccessRouted)];
      default:return [good('Instalado',true)];
    }
  }
  function actionList(t){
    const st=api.state(),ad=api.adventure?.(),active=!!ad?.active;
    const on=installed(t,st,target?.source||'tower');
    const actions=[{verb:'sheet',label:'Ficha técnica',enabled:true}];
    if(!active)return actions;
    if(t.category==='storage2'){
      const disk=st.secondaryStorage||{};
      actions.push({verb:'secondaryData',label:disk.sataData?'Desconectar SATA datos 2':'Conectar SATA datos 2',enabled:!st.power&&!st.caseClosed});
      actions.push({verb:'secondaryPower',label:disk.sataPower?'Desconectar alimentación 2':'Conectar alimentación 2',enabled:!st.power&&!st.caseClosed});
      actions.push({verb:'secondaryTarget',label:'Instalar SO en HDD 2',enabled:disk.installed});
      actions.push({verb:'secondaryBoot',label:'Prioridad de arranque: HDD 2',enabled:disk.installed});
      actions.push({verb:'secondaryRemove',label:'Retirar HDD 2',enabled:!st.power&&!st.caseClosed&&!disk.sataData&&!disk.sataPower});
      return actions;
    }
    const returnAction=()=>{
      // La ficha 3D usa exactamente las mismas reglas que Inventario:
      // no devuelve una pieza colocada, un consumible gastado o un cable activo.
      if(!ad.game?.purchases?.some(p=>p.k===t.key))return;
      const paid=ad.game.purchases.findLast(p=>p.k===t.key)?.price;
      const enabled=!!ad.canReturn?.(t.key);
      actions.push({verb:'return',label:'Devolver'+
        (Number.isFinite(paid)?' · +'+paid+' €':''),
        enabled,reason:enabled?'Devolver una unidad sin instalar':'Primero retira la pieza o desconecta el cable para devolverlo.'});
    };
    if(t.category==='item'){
      if(t.id==='osusb'){
        const media=(ad.usbDrives?.()||[]).find(d=>d.id===t.mediaId)||
          (ad.usbDrives?.()||[]).find(d=>d.id===ad.game?.usbSelected);
        const connected=!!media&&st.usbConnected&&st.usbMediaKey===media.id;
        const available=!!media&&!st.usbConnected&&!!st.installed.motherboard;
        actions.push({verb:'usbStation',label:'Abrir estación del técnico · '+(media?.id||'USB'),
          enabled:!!media});
        if(media&&media.mode==='blank'){
          actions.push({verb:'usbFormat',label:'Formatear e instalar Ventoy (GPT)',enabled:!connected,
            reason:'Requiere confirmar: se perderá el contenido de la memoria'});
        }else if(media&&media.mode==='ventoy'){
          actions.push({verb:'usbFormat',label:'Reinstalar Ventoy / formatear',enabled:!connected,
            reason:'Elimina TODAS las ISO guardadas en la memoria'});
          actions.push({verb:'usbCopyIso',label:'Copiar ISO seleccionada',enabled:!connected,
            reason:'La imagen ocupa espacio disponible en esta memoria'});
          actions.push({verb:'usbDeleteIso',label:'Eliminar ISO seleccionada',enabled:!connected&&!!media.images.length});
        }
        if(target?.formatConfirm&&media?.id===target.formatConfirm)
          actions.push({verb:'usbFormatConfirm',label:'CONFIRMAR: borrar memoria e instalar Ventoy',enabled:!connected});
        if(target?.formatConfirm)actions.push({verb:'usbFormatCancel',label:'Cancelar formateo',enabled:true});
        if(connected)actions.push({verb:'usbEject',label:'Expulsar USB del PC',enabled:!st.osInstalling});
        else actions.push({verb:'usbInsert',label:'Conectar '+(media?.id||'USB')+' al puerto trasero',
          enabled:available,reason:st.usbConnected?'Expulsa el USB conectado primero':'Requiere placa instalada'});
      }
      if(t.id==='paste'||t.id==='ioShield'||t.id==='fan'||t.id==='rgbStrip'){
        const mountedIO=(t.id==='ioShield'&&st.ioShield)||(t.id==='rgbStrip'&&st.rgbInstalled);
        if(!mountedIO)actions.push({verb:(t.id==='paste'||t.id==='rgbStrip')?'apply':'fit',
          label:(t.id==='paste'||t.id==='rgbStrip')?'Aplicar':t.id==='ioShield'?'Encajar en rear I/O':'Encajar',enabled:true});
      }
      returnAction();return actions;
    }
    if(/^fan[0-2]$/.test(t.category)){
      const n=Number(t.category.slice(-1));
      if(on)actions.push({verb:'connect',target:'sysfan'+n,label:st.caseFans?.[n]?.connected?'Desconectar PWM':'Conectar PWM',enabled:true});
      return actions;
    }
    if(['frontUsb3','frontUsbC'].includes(t.category)){
      const connector=t.category==='frontUsb3'?'frontusb3':'frontusbc';
      actions.push({verb:st[t.category]?'disconnect':'connect',target:connector,
        label:st[t.category]?'Desconectar cable USB':'Conectar cable USB',enabled:true});
      return actions;
    }
    if(['keyboard','mouse','monitor'].includes(t.category)){
      const target=t.category;
      const flag=target==='monitor'?'monitorCable':target+'Connected';
      actions.push({verb:st[flag]?'disconnect':'connect',target,label:st[flag]?'Desconectar':'Conectar',enabled:true});
      const os=st.biosCfg?.boot==='hdd2'?st.secondaryStorage?.installedOs:st.installedOs;
      if(target==='monitor'&&os?.id==='novadesk'&&!os.activated&&
        !(st.biosCfg?.boot!=='hdd2'&&st.osActivated))
        actions.push({verb:'activate',label:'Activar NovaDesk con licencia',enabled:true});
      return actions;
    }
    if(t.category==='storage'&&target?.source==='table'&&st.installed.storage){
      // SKU y ubicación son entidades distintas. Si un SSD/HDD se encuentra
      // en la mesa, nunca hereda las conexiones del ejemplar instalado.
      const free=(ad.game?.stock?.[t.key]||0)>0;
      const sata=['hdd','hdd4','sataSSD','sataSSD2'].includes(t.id);
      if(free&&sata&&!st.secondaryStorage?.installed){
        const primary=st.selected.storage;
        const upper=['sataSSD','sataSSD2'].includes(primary)||
          (!['hdd','hdd4'].includes(primary)&&['hdd','hdd4'].includes(t.id));
        actions.push({verb:'installSecond',
          label:'Encajar unidad adicional · bahía '+(upper?'superior':'inferior'),
          enabled:!st.power&&!st.caseClosed,
          reason:st.power?'Apaga el PC para instalarla':
            st.caseClosed?'Abre el panel lateral':'La unidad principal se conserva sin cambios'});
      }else{
        const reason=st.secondaryStorage?.installed?
          'Ya hay dos unidades: retira una para liberar espacio':
          !free?'No quedan unidades de este modelo en la mesa':
          'Una segunda NVMe requiere otra ranura M.2; elige SSD SATA o HDD';
        actions.push({verb:'occupiedStorage',label:reason,enabled:false});
      }
      returnAction();return actions;
    }
    if(!on){
      if(t.category==='motherboard'&&st.installed.psu&&!st.psuAccessRouted)
        actions.push({verb:'route',label:'Apartar mazos PSU',enabled:true});
      actions.push({verb:'fit',label:t.category==='case'?'Colocar caja':'Encajar',enabled:true});
    }
    else{
      if(t.category==='case')
        actions.push({verb:'caseToggle',label:st.caseClosed?'Abrir panel lateral':'Cerrar panel lateral',enabled:!st.power});
      if(t.category==='cpu'&&!st.installed.cooler){
        if(st.paste>0)actions.push({verb:'clean',label:'🧴 Limpiar pasta térmica (alcohol + toallita)',enabled:!st.power&&!st.caseClosed,
          reason:'Consume una dosis de alcohol y una toallita del taller'});
        else actions.push({verb:'apply',label:'Aplicar pasta térmica nueva',enabled:!st.power&&!st.caseClosed&&!!ad.game?.stock?.['item:paste']});
      }
      if(['motherboard','psu','storage','gpu'].includes(t.category)&&!ad.game?.screwed?.[t.category])
        actions.push({verb:'screw',label:'Atornillar',enabled:true});
      // Cada clavija es independiente: mostrar exactamente la acción
      // necesaria y no pedir nunca SATA a un disco NVMe.
      const plugs={
        motherboard:[['atx24','atx24','ATX24'],['eps','eps','EPS CPU'],
          ['frontPanel','frontpanel','POWER SW'],
           ['frontUsb3','frontusb3','USB-A frontal'],['frontUsbC','frontusbc','USB-C frontal']],
        psu:[['atx24','atx24','ATX24'],['eps','eps','EPS'],
          ...(st.installed.gpu?[['gpuPower','gpupower','PCIe GPU']]:[])],
        cooler:[['cpuFan','cpufan','CPU_FAN']],
        gpu:t.model.power?.length?[['gpuPower','gpupower','PCIe GPU']]:[],
        storage:t.model.interface==='SATA'?
          [['sataData','sataData','SATA datos'],['sataPower','sataPower','SATA power']]:[]
      };
      for(const [flag,connector,name] of plugs[t.category]||[]){
        actions.push({verb:st[flag]?'disconnect':'connect',target:connector,
          label:(st[flag]?'Soltar ':'Conectar ')+name,enabled:true});
      }
      if(t.category==='ram'&&!st.ramSeated)actions.push({verb:'fit',label:'Encajar DIMM',enabled:true});
      actions.push({verb:'remove',label:'Retirar',enabled:true});
    }
    returnAction();return actions;
  }
  function details(t){
    const m=t.model,rows=[];
    const skip=new Set(['name','desc']);
    for(const [k,v] of Object.entries(m)){
      if(skip.has(k))continue;
      let value=v;
      if(Array.isArray(v))value=v.join(', ')||'Ninguno';
      else if(v&&typeof v==='object')value=Object.entries(v).map(([x,y])=>x+': '+y).join(' · ');
      rows.push({label:k,value:String(value)});
    }
    return rows;
  }
  function formatRows(rows){
    return rows.map(r=>'<div class="part-check '+r.level+'">'+
      '<b>'+escape(r.level==='ok'?'✓':r.level==='warn'?'!':'•')+' '+escape(r.label)+'</b>'+
      '<span>'+escape(r.value)+'</span>'+
      (r.description?'<small>'+escape(r.description)+'</small>':'')+'</div>').join('');
  }
  function summaryHTML(){
    const st=api.state(),mounted=['case',...(st.ioShield?['item:ioShield']:[]),
      'motherboard','cpu','ram','cooler',
      'gpu','storage',...(st.secondaryStorage?.installed?['storage2']:[]),
      'psu',...([0,1,2].filter(i=>st.caseFans?.[i]?.installed)
        .map(i=>'fan'+i))];
    const rows=mounted.filter(part=>part==='item:ioShield'||
      part.startsWith('fan')||!!st.installed?.[part])
      .map(part=>{
        const t=getInfo(part);
        if(!t)return '';
        const states=checks(t,'tower');
        const pending=states.filter(x=>x.level==='warn').length;
        return '<button type="button" class="part-mounted-row" data-mounted-inspect="'+
          escape(t.key)+'"><b>'+escape(t.name)+'</b><span class="'+
          (pending?'warn':'ok')+'">'+(pending?pending+' pendientes':'Revisado')+
          '</span><small>'+states.slice(0,4).map(x=>
            escape(x.label)+': '+escape(x.value)).join(' · ')+'</small></button>';
      }).join('');
    return rows||'<p class="muted">Todavía no hay piezas instaladas. Compra una caja y colócala en el banco.</p>';
  }
  function contextButtons(t){
    const media=t.id==='osusb'&&t.category==='item'?
      (api.adventure?.()?.usbDrives?.()||[]).find(d=>d.id===t.mediaId||
        !t.mediaId&&d.id===api.adventure?.()?.game?.usbSelected):null;
    const images=window.PC_USB?.ISO||{};
    const isoPicker=media?.mode==='ventoy'?
      '<label class="part-usb-iso-label" for="partUsbIso">Imagen ISO de la memoria</label>'+
      '<select id="partUsbIso" aria-label="Imagen ISO">'+
      Object.values(images).map(i=>'<option value="'+escape(i.id)+'"'+
        ((target?.iso||'novadesk')===i.id?' selected':'')+'>'+
        escape(i.file)+' · '+i.gb+' GB</option>').join('')+'</select>':'';
    return isoPicker+'<div class="part-context-actions">'+actionList(t).map(a=>
      '<button type="button" data-part-verb="'+escape(a.verb)+'"'+
      (a.target?' data-part-target="'+escape(a.target)+'"':'')+
      (a.verb==='return'?' class="part-return-action"':'')+
      (a.reason?' title="'+escape(a.reason)+'"':'')+
      (!a.enabled?' disabled':'')+'>'+escape(a.label)+'</button>').join('')+'</div>';
  }
  function feedbackHTML(){
    return feedback?'<p class="part-action-feedback '+
      (feedback.level==='ok'?'ok':'warn')+'" role="status">'+
      escape(feedback.text)+'</p>':'';
  }
  function showSheet(){
    const t=getInfo(target?.ref);if(!t)return;
    const props=details(t);
    const compat=compatibility(t);
    const statuses=checks(t);
    sheet.hidden=false;detailsOpen=true;
    sheet.innerHTML='<div class="part-inspector-title">'+
      '<h3>Ficha técnica · '+escape(t.name)+'</h3>'+
      '<button type="button" data-part-close-sheet title="Cerrar ficha">✕</button></div>'+
      '<p class="muted">'+escape(t.model.desc||'Modelo procedural educativo del simulador.')+'</p>'+
      '<h4>Acciones disponibles</h4>'+contextButtons(t)+feedbackHTML()+
      '<h4>Características</h4>'+
      (props.length?'<dl class="part-specs">'+props.map(row=>'<div><dt>'+
        escape(row.label)+'</dt><dd>'+escape(row.value)+'</dd></div>').join('')+'</dl>':
        '<p class="muted">Sin especificaciones adicionales en el catálogo.</p>')+
      '<h4>Compatibilidad con selección actual</h4>'+
      (compat.length?formatRows(compat):'<p class="muted">Sin restricciones específicas registradas.</p>')+
      '<h4>Estado real del montaje</h4>'+formatRows(statuses);
  }
  function draw(){
    const t=getInfo(target?.ref);if(!t)return;
    const top=pop.scrollTop;
    const mounted=installed(t,api.state(),target?.source||'tower');
    const status=checks(t);
    pop.hidden=false;
    pop.innerHTML='<div class="part-inspector-title"><strong>'+escape(t.name)+
      '</strong><button type="button" data-part-close title="Cerrar menú">✕</button></div>'+
      '<p class="part-context-sub">'+(mounted?'● Montado':'● Sin instalar')+
      (target?.source==='table'?' · Mesa auxiliar':' · Vista 3D')+'</p>'+
      contextButtons(t)+feedbackHTML()+
      '<div class="part-status-preview">'+
      formatRows(status.filter(x=>x.level!=='info').slice(0,5))+
      '</div>';
    pop.scrollTop=top;
    if(detailsOpen)showSheet();
  }
  function open(ref,source='tower',x=null,y=null){
    const t=getInfo(ref);if(!t)return false;
    target={ref:t.mediaId?'item:osusb:'+t.mediaId:t.key,source,iso:'novadesk',formatConfirm:null};
    feedback=null;detailsOpen=false;sheet.hidden=true;
    const box=mount.getBoundingClientRect();
    const w=Math.max(230,Math.min(325,box.width-18));
    const h=Math.min(415,Math.max(250,box.height-15));
    pop.style.width=w+'px';
    pop.style.left=Math.max(8,Math.min((x==null?box.width/2:x-box.left),box.width-w-9))+'px';
    pop.style.top=Math.max(8,Math.min((y==null?box.height*.40:y-box.top),box.height-h-9))+'px';
    draw();
    return true;
  }
  function close(){
    target=null;detailsOpen=false;feedback=null;pop.hidden=true;sheet.hidden=true;
  }
  function refresh(){if(target)draw();}
  function perform(verb,connector){
    if(!target)return;
    if(verb==='sheet'){showSheet();return;}
    const t=getInfo(target.ref),ad=api.adventure?.();
    if(!ad?.active){showSheet();return;}
    const prev=ad.game?.lastFeedback;
    if(t.id==='osusb'&&t.category==='item'){
      const id=t.mediaId||ad.game?.usbSelected||ad.usbDrives?.()[0]?.id;
      if(verb==='usbStation'){ad.openUsbStation?.(id);close();return;}
      if(verb==='usbFormat'){
        target.formatConfirm=id;
        feedback={text:'Atención: esta operación BORRA todas las ISO del USB '+id+
          '. Pulsa CONFIRMAR para continuar.',level:'warn'};
        refresh();return;
      }
      if(verb==='usbFormatCancel'){
        target.formatConfirm=null;feedback=null;refresh();return;
      }
      let ok=false;
      if(verb==='usbFormatConfirm'){
        if(target.formatConfirm!==id)return;
        ok=!!ad.installVentoyDrive?.(id,'GPT',true);
        target.formatConfirm=null;
      }else if(verb==='usbCopyIso')ok=!!ad.copyUsbISO?.(id,target.iso||'novadesk');
      else if(verb==='usbDeleteIso')ok=!!ad.removeUsbISO?.(id,target.iso||'novadesk');
      else if(verb==='usbInsert')ok=!!ad.connectInstallerUsb?.(id);
      else if(verb==='usbEject')ok=!!ad.disconnectInstallerUsb?.();
      else return;
      feedback={text:ad.game?.lastFeedback?.text||(ok?'Operación USB completada.':'No se pudo completar.'),
        level:ok?'ok':'warn'};
      refresh();return;
    }
    if(verb==='installSecond'){
      const ok=ad.installSecondHdd?.(t.key);
      feedback={text:ad.game?.lastFeedback?.text||(ok?'Unidad adicional encajada.':'No se pudo instalar la unidad adicional.'),
        level:ok?'ok':'warn'};
      if(ok&&target?.source==='table'&&!ad.game?.stock?.[t.key]){
        // La pieza desaparece de la mesa y ahora se selecciona el disco
        // físico nuevo, en vez de mantener abierta la ficha del repuesto.
        open('storage2','tower');
        return;
      }
      refresh();return;
    }
    if(t.category==='storage2'&&verb.startsWith('secondary')){
      const operation={secondaryData:'sataData',secondaryPower:'sataPower',
        secondaryTarget:'target',secondaryBoot:'boot',secondaryRemove:'remove'}[verb];
      const ok=ad.secondaryHddAction?.(operation);
      feedback={text:ad.game?.lastFeedback?.text||(ok?'Operación aplicada':'Operación rechazada'),
        level:ok?'ok':'warn'};
      if(operation==='remove'&&ok){close();return;}
      refresh();return;
    }
    if(verb==='caseToggle'&&t.category==='case'){
      api.caseToggle?.();
      feedback={text:api.state().caseClosed?'Panel de la caja cerrado.':'Panel de la caja abierto.',level:'ok'};
      refresh();return;
    }
    if(verb==='activate'&&t.category==='monitor'){
      ad.activateOS?.();feedback=ad.game?.lastFeedback||null;refresh();return;
    }
    if(verb==='clean'&&t.category==='cpu'){
      const ok=ad.cleanThermalPaste?.();
      feedback=ad.game?.lastFeedback?{...ad.game.lastFeedback}:
        {text:ok?'Pasta térmica limpiada':'No se pudo limpiar la CPU',level:ok?'ok':'warn'};
      refresh();return;
    }
    if(verb==='apply'&&t.category==='cpu'){
      ad.select('item:paste');
      ad.perform('apply');
      feedback=ad.game?.lastFeedback?{...ad.game.lastFeedback}:
        {text:'Aplicación de pasta iniciada',level:'ok'};
      refresh();return;
    }
    if(verb==='return'){
      const purchased=ad.game?.purchases?.some(p=>p.k===t.key);
      if(!purchased||!ad.canReturn?.(t.key)){
        feedback={text:'No se puede devolver esta unidad. Debe estar sin montar, disponible y sin cables activos.',level:'warn'};
        refresh();return;
      }
      const ok=ad.returnItem(t.key);
      if(!ok){
        feedback={text:'No se pudo procesar la devolución.',level:'warn'};
        refresh();return;
      }
      const notice=api.document.getElementById('partReturnNotice');
      if(notice){
        notice.textContent=ad.game?.lastFeedback?.text||
          'Devolución registrada. Presupuesto actualizado.';
        notice.hidden=false;
        root.setTimeout?.(()=>{notice.hidden=true;},5500);
      }
      // La mesa elimina el modelo al agotarse el stock. Cerramos su ficha
      // para no mantener un control flotante sobre una pieza inexistente.
      if(target.source==='table'&&!(ad.game?.stock?.[t.key]>0)){
        close();return;
      }
      feedback=ad.game?.lastFeedback?{...ad.game.lastFeedback}:
        {text:'Devolución registrada. Presupuesto actualizado.',level:'ok'};
      refresh();return;
    }
    if(verb==='connect'||verb==='disconnect'){
      if(!connector){
        feedback={text:'No se ha seleccionado ningún conector.',level:'warn'};
        refresh();return;
      }
      if(/^fan[0-2]$/.test(t.category)){
        const i=Number(t.category.slice(-1));
        const connected=!!api.state().caseFans?.[i]?.connected;
        if(verb==='connect'&&connected||verb==='disconnect'&&!connected)
          feedback={text:'El SYS_FAN ya está en ese estado.',level:'warn'};
        else{
          api.fan?.(i,verb);
          feedback={text:'SYS_FAN '+(i+1)+(verb==='connect'?' conectado.':' desconectado.'),
            level:'ok'};
        }
      }else if(verb==='connect')ad.connect(connector);
      else ad.disconnect(connector);
    }else{
      if(!ad.game?.stock?.[t.key]&&!ad.game?.used?.[t.key]&&t.category!=='item'){
        feedback={text:'Debes comprar la pieza antes de realizar la operación.',level:'warn'};
        refresh();return;
      }
      if(ad.game?.stock?.[t.key]||ad.game?.used?.[t.key]){
        ad.select(t.key);
      }
      // Ejecutamos el verbo explícito de este botón, nunca el elegido
      // previamente en el acordeón del lateral.
      ad.perform(verb);
    }
    if(ad.game?.lastFeedback&&ad.game.lastFeedback!==prev){
      feedback={...ad.game.lastFeedback};
    }else if(!feedback){
      feedback={text:'Operación procesada. Comprueba el estado del componente.',level:'ok'};
    }
    refresh();
  }
  pop.addEventListener('change',e=>{
    if(e.target.id==='partUsbIso'&&target)target.iso=e.target.value;
  });
  sheet.addEventListener('change',e=>{
    if(e.target.id==='partUsbIso'&&target)target.iso=e.target.value;
  });
  pop.addEventListener('click',e=>{
    const b=e.target.closest('button');if(!b)return;
    if(b.hasAttribute('data-part-close')){close();return;}
    if(b.dataset.partVerb)perform(b.dataset.partVerb,b.dataset.partTarget);
  });
  sheet.addEventListener('click',e=>{
    const button=e.target.closest('button');
    if(!button)return;
    if(button.hasAttribute('data-part-close-sheet')){
      detailsOpen=false;sheet.hidden=true;return;
    }
    if(button.dataset.partVerb){
      perform(button.dataset.partVerb,button.dataset.partTarget);
    }
  });
  api.document.addEventListener('keydown',e=>{
    if(e.key==='Escape'&&target)close();
  });
  return {open,close,refresh,showSheet,summaryHTML,inspect:checks,getInfo,compatibility,
    get active(){return !!target;},get selected(){return target?.ref||null;}};
}
root.createPartInspector=createPartInspector;
})(window);
