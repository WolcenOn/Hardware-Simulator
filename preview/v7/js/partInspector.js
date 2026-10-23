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
  fan2:'Ventilador trasero'};
const special={
  'case:tower':{name:'Caja ATX con bandejas',sizeMm:'453 × 230 × 466 mm (referencia)',desc:'Chasis de torre ATX con PSU inferior, jaula HDD, bandeja SSD y pasacables.'},
  'cooler:air':{name:'Disipador por aire',desc:'Requiere pasta térmica y conexión CPU_FAN.'},
  'item:paste':{name:'Pasta térmica',desc:'Aplicar sobre la CPU antes de fijar el disipador.'},
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
  let target=null,detailsOpen=false;
  const good=(label,on,description='')=>({label,level:on?'ok':'warn',value:on?'Correcto':'Pendiente',description});
  const info=(label,value,description='')=>({label,level:'info',value,description});
  function parse(ref){
    if(!ref)return null;
    const raw=String(ref);
    if(raw.startsWith('fan')&&/^fan[0-2]$/.test(raw))
      return {category:raw,id:raw,key:raw};
    const [category,...rest]=raw.split(':');
    if(groups[category]||['case','cooler','item'].includes(category)){
      const id=rest.length?rest.join(':'):api.state()?.selected?.[category]||
        (category==='case'?'tower':category==='cooler'?'air':'');
      return {category,id,key:category+':'+id};
    }
    if(titles[raw])return {category:raw,id:raw,key:raw};
    return null;
  }
  function getInfo(ref){
    const t=parse(ref);if(!t)return null;
    const catalog=api.catalog?.[groups[t.category]];
    const model=catalog?.[t.id]||special[t.key]||{};
    return {...t,name:model.name||titles[t.category]||t.id,model};
  }
  function installed(t,st){
    if(t.category.startsWith('fan'))return !!st.caseFans?.[Number(t.category.slice(-1))]?.installed;
    if(['monitor','keyboard','mouse'].includes(t.category))return true;
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
  function checks(t){
    const st=api.state(),ad=api.adventure?.(),g=ad?.game;
    const isInstalled=installed(t,st),screw=k=>
      !g?info('Atornillado','No registrado en modo técnico'):
      good('Fijación con tornillos',!!g.screwed?.[k],'Fijar con destornillador y tornillos');
    if(t.category==='item')return [info('Ubicación',g?.stock?.[t.key]?'Inventario / mesa auxiliar':'No disponible')];
    if(/^fan[0-2]$/.test(t.category)){
      const fan=st.caseFans?.[Number(t.category.slice(-1))];
      return [good('Montado',!!fan?.installed),good('Cable PWM · SYS_FAN',!!fan?.connected),
        info('Refrigeración',fan?.installed&&fan?.connected?'Activo':'Inactivo')];
    }
    if(t.category==='monitor')return [good('Cable de vídeo',!!st.monitorCable),
      good('Señal de imagen',!!api.video?.(api.evaluate?.()),'Requiere POST, salida adecuada y equipo encendido'),
      info('Salida seleccionada',st.videoPort==='motherboard'?'Placa HDMI/DP':'GPU dedicada / automática')];
    if(t.category==='keyboard'||t.category==='mouse')return [
      good('USB conectado',!!st[t.category==='keyboard'?'keyboardConnected':'mouseConnected'])];
    if(!isInstalled)return [good('Situado en el chasis',false),
      info('En inventario',g?.stock?.[t.key]??0)];
    switch(t.category){
      case 'case':return [good('Caja colocada',!!st.installed.case),
        good('Chapa I/O',!!st.ioShield),info('Panel',st.caseClosed?'Cerrado':'Abierto'),
        info('Ventiladores instalados',String(st.caseFans?.filter(f=>f.installed).length||0)+'/3')];
      case 'motherboard':return [screw('motherboard'),
        good('ATX 24 pines',!!st.atx24),good('POWER SW / F_PANEL',!!st.frontPanel),
        good('EPS 8 pines CPU',!!st.eps),good('Chapa I/O',!!st.ioShield)];
      case 'cpu':return [good('CPU instalada',true),good('Disipador',!!st.installed.cooler),
        good('Pasta térmica',st.paste>=.7),good('EPS placa',!!st.eps)];
      case 'ram':return [good('DIMM bloqueado en pestañas',!!st.ramSeated)];
      case 'cooler':return [good('Pasta térmica aplicada',st.paste>=.7),
        good('CPU_FAN conectado',!!st.cpuFan),
        info('Temperatura CPU',String(api.evaluate?.()?.temp??'—')+' °C')];
      case 'gpu':return [screw('gpu'),
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
    const on=installed(t,st);
    const actions=[{verb:'sheet',label:'Ficha técnica',enabled:true}];
    if(!active)return actions;
    if(t.category==='item'){
      if(t.id==='paste'||t.id==='ioShield'||t.id==='fan')
        actions.push({verb:t.id==='paste'?'apply':'fit',label:t.id==='paste'?'Aplicar':'Encajar',enabled:true});
      return actions;
    }
    if(/^fan[0-2]$/.test(t.category)){
      const n=Number(t.category.slice(-1));
      if(on)actions.push({verb:'connect',target:'sysfan'+n,label:st.caseFans?.[n]?.connected?'Desconectar PWM':'Conectar PWM',enabled:true});
      return actions;
    }
    if(['keyboard','mouse','monitor'].includes(t.category)){
      const target=t.category;
      const flag=target==='monitor'?'monitorCable':target+'Connected';
      actions.push({verb:st[flag]?'disconnect':'connect',target,label:st[flag]?'Desconectar':'Conectar',enabled:true});
      return actions;
    }
    if(!on)actions.push({verb:'fit',label:t.category==='case'?'Colocar caja':'Encajar',enabled:true});
    else{
      if(['motherboard','psu','storage','gpu'].includes(t.category)&&!ad.game?.screwed?.[t.category])
        actions.push({verb:'screw',label:'Atornillar',enabled:true});
      // Cada clavija es independiente: mostrar exactamente la acción
      // necesaria y no pedir nunca SATA a un disco NVMe.
      const plugs={
        motherboard:[['atx24','atx24','ATX24'],['eps','eps','EPS CPU'],
          ['frontPanel','frontpanel','POWER SW']],
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
    return actions;
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
    const st=api.state(),mounted=['case','motherboard','cpu','ram','cooler',
      'gpu','storage','psu',...([0,1,2].filter(i=>st.caseFans?.[i]?.installed)
        .map(i=>'fan'+i))];
    const rows=mounted.filter(part=>part.startsWith('fan')||!!st.installed?.[part])
      .map(part=>{
        const t=getInfo(part);
        if(!t)return '';
        const states=checks(t);
        const pending=states.filter(x=>x.level==='warn').length;
        return '<button type="button" class="part-mounted-row" data-mounted-inspect="'+
          escape(t.key)+'"><b>'+escape(t.name)+'</b><span class="'+
          (pending?'warn':'ok')+'">'+(pending?pending+' pendientes':'Revisado')+
          '</span><small>'+states.slice(0,4).map(x=>
            escape(x.label)+': '+escape(x.value)).join(' · ')+'</small></button>';
      }).join('');
    return rows||'<p class="muted">Todavía no hay piezas instaladas. Compra una caja y colócala en el banco.</p>';
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
    const mounted=installed(t,api.state());
    const status=checks(t);
    pop.hidden=false;
    pop.innerHTML='<div class="part-inspector-title"><strong>'+escape(t.name)+
      '</strong><button type="button" data-part-close title="Cerrar menú">✕</button></div>'+
      '<p class="part-context-sub">'+(mounted?'● Montado':'● Sin instalar')+
      (target?.source==='table'?' · Mesa auxiliar':' · Vista 3D')+'</p>'+
      '<div class="part-context-actions">'+actionList(t).map(a=>
        '<button type="button" data-part-verb="'+escape(a.verb)+'"'+
        (a.target?' data-part-target="'+escape(a.target)+'"':'')+
        (!a.enabled?' disabled':'')+'>'+escape(a.label)+'</button>').join('')+'</div>'+
      '<div class="part-status-preview">'+
      formatRows(status.filter(x=>x.level!=='info').slice(0,5))+
      '</div>';
    pop.scrollTop=top;
    if(detailsOpen)showSheet();
  }
  function open(ref,source='tower',x=null,y=null){
    const t=getInfo(ref);if(!t)return false;
    target={ref:t.key,source};
    detailsOpen=false;sheet.hidden=true;
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
    target=null;detailsOpen=false;pop.hidden=true;sheet.hidden=true;
  }
  function refresh(){if(target)draw();}
  function perform(verb,connector){
    if(!target)return;
    if(verb==='sheet'){showSheet();return;}
    const t=getInfo(target.ref),ad=api.adventure?.();
    if(!ad?.active){
      showSheet();return;
    }
    if(verb==='connect'||verb==='disconnect'){
      if(!connector)return;
      if(/^fan[0-2]$/.test(t.category)){
        const i=Number(t.category.slice(-1));
        api.fan?.(i,api.state().caseFans?.[i]?.connected?'disconnect':'connect');
      }else if(verb==='connect')ad.connect(connector);
      else ad.disconnect(connector);
    }else{
      if(!ad.game?.stock?.[t.key]&&!ad.game?.used?.[t.key]&&t.category!=='item'){
        api.notice?.('La pieza debe comprarse antes de poder usar herramientas.');
        return;
      }
      if(ad.game?.stock?.[t.key]||ad.game?.used?.[t.key])ad.select(t.key);
      ad.perform(verb);
    }
    refresh();
  }
  pop.addEventListener('click',e=>{
    const b=e.target.closest('button');if(!b)return;
    if(b.hasAttribute('data-part-close')){close();return;}
    if(b.dataset.partVerb)perform(b.dataset.partVerb,b.dataset.partTarget);
  });
  sheet.addEventListener('click',e=>{
    if(e.target.closest('[data-part-close-sheet]')){detailsOpen=false;sheet.hidden=true;}
  });
  api.document.addEventListener('keydown',e=>{
    if(e.key==='Escape'&&target)close();
  });
  return {open,close,refresh,showSheet,summaryHTML,inspect:checks,getInfo,compatibility,
    get active(){return !!target;},get selected(){return target?.ref||null;}};
}
root.createPartInspector=createPartInspector;
})(window);
