// Hardware Simulator v8.12: popup de jeringuilla de pasta térmica.
(function(root){
'use strict';
function create({popup,onConfirm,onCancel}){
  let session=null,frame=0,last=0;
  const now=()=>root.performance?.now?.()??0;
  function stop(){if(frame&&root.cancelAnimationFrame)root.cancelAnimationFrame(frame);frame=0;}
  function close(){stop();session=null;if(popup){popup.hidden=true;popup.innerHTML='';}}
  function draw(){
    if(!session||!popup)return;
    const st=session.getState(),dots=popup.querySelector('#pasteDots');
    if(dots)dots.innerHTML=st.dots.map(d=>
      '<circle cx="'+Math.round(d.x*200)+'" cy="'+Math.round(d.y*200)+
      '" r="'+Math.min(38,Math.max(2,Math.sqrt(d.volume)*23)).toFixed(1)+
      '" fill="#c4e3e8" stroke="#edf9fa" stroke-width=".4" opacity=".95"/>').join('');
    const point=popup.querySelector('#pasteNozzle');
    if(point){point.style.left=st.x*100+'%';point.style.top=st.y*100+'%';}
    const used=popup.querySelector('#pasteUsed');
    if(used)used.textContent=st.used.toFixed(2)+' / 3,00 dosis';
    const remaining=popup.querySelector('#pasteBar');
    if(remaining)remaining.style.height=(st.remaining/3*100)+'%';
    const flow=popup.querySelector('#pasteFlow');
    if(flow)flow.textContent='Caudal '+Math.round(st.flow*100)+'%'+
      (st.pressed?' · inyectando':st.flow>.01?' · inercia por viscosidad':'');
  }
  function tick(ms){if(!session)return null;const s=session.advance(ms);draw();return s;}
  function pump(down){return session?.pump(down)||false;}
  function pointer(x,y){if(!session)return false;const ok=session.pointer(x,y);if(ok)draw();return ok;}
  function animate(){
    if(!session||!root.requestAnimationFrame)return;
    frame=root.requestAnimationFrame(()=>{
      frame=0;if(!session)return;
      const t=now();tick(Math.max(0,Math.min(80,t-last)));last=t;animate();
    });
  }
  function markup(){
    const s=session.getState();
    return '<section class="paste-precision-dialog" role="dialog" aria-modal="true" '+
      'aria-label="Minijuego de aplicación de pasta térmica">'+
      '<header><div><small>TALLER 3D · CPU</small><h3>Jeringuilla de pasta térmica</h3>'+
      '</div><button type="button" data-paste-cancel>✕</button></header>'+
      '<p>Mueve la punta sobre la CPU. Mantén pulsado para empujar el émbolo y '+
      'suelta con anticipación: la pasta sigue saliendo por inercia.</p>'+
      '<div class="paste-workbench">'+
      '<div class="paste-chip" data-paste-chip tabindex="0" role="button" '+
      'aria-label="Superficie CPU: mantener pulsado para dispensar">'+
      '<svg viewBox="0 0 200 200" aria-label="Pasta depositada"><rect x="1" y="1" '+
      'width="198" height="198" rx="7" fill="#899da4" stroke="#dee5dd" '+
      'stroke-width="2"/><g id="pasteDots"></g></svg>'+
      '<span class="paste-nozzle" id="pasteNozzle" style="left:'+
      s.x*100+'%;top:'+s.y*100+'%">⊕</span></div>'+
      '<div class="paste-syringe"><b>Jeringuilla</b>'+
      '<div class="paste-capacity"><div id="pasteBar" class="paste-fill" style="height:'+
      s.remaining/3*100+'%"></div>'+
      [0,1,2,3].map(n=>'<span class="paste-tick" style="top:'+
        (n/3*100)+'%">'+(3-n)+'</span>').join('')+'</div>'+
      '<output id="pasteUsed">'+s.used.toFixed(2)+' / 3,00 dosis</output>'+
      '<span id="pasteFlow">Caudal 0%</span></div></div>'+
      '<div class="paste-actions"><button type="button" class="primary" data-paste-confirm>'+
      'OK · Terminar aplicación</button>'+
      '<button type="button" data-paste-cancel>Cancelar</button></div>'+
      '<p>La pasta se expandirá después, cuando aprietes los tornillos del disipador.</p>'+
      '</section>';
  }
  function open(){
    if(!popup)return false;
    if(!session)session=root.PC_THERMAL_PASTE.makeSyringe();
    popup.hidden=false;popup.innerHTML=markup();draw();last=now();animate();return true;
  }
  function confirm(){
    if(!session)return false;
    session.pump(false);
    for(let i=0;i<10;i++)session.advance(40);
    const deposit=session.confirm();
    if(!deposit)return false;
    if(onConfirm?.(deposit)===false)return false;
    close();return true;
  }
  if(popup){
    popup.addEventListener('click',event=>{
      const button=event.target.closest('button');if(!button||!session)return;
      if(button.hasAttribute('data-paste-cancel')){close();onCancel?.();}
      else if(button.hasAttribute('data-paste-confirm'))confirm();
    });
    popup.addEventListener('pointerdown',event=>{
      const chip=event.target.closest('[data-paste-chip]');
      if(!session||!chip)return;
      chip.setPointerCapture?.(event.pointerId);
      const b=chip.getBoundingClientRect();
      if(b.width&&b.height)pointer((event.clientX-b.left)/b.width,
        (event.clientY-b.top)/b.height);
      pump(true);event.preventDefault();
    });
    popup.addEventListener('pointermove',event=>{
      if(!session)return;
      const chip=popup.querySelector('[data-paste-chip]');
      const b=chip?.getBoundingClientRect();
      if(b?.width&&b.height)pointer((event.clientX-b.left)/b.width,
        (event.clientY-b.top)/b.height);
    });
    popup.addEventListener('pointerup',()=>pump(false));
    popup.addEventListener('pointercancel',()=>pump(false));
    popup.addEventListener('keydown',event=>{
      if(!session)return;
      if(event.key==='Escape'){event.preventDefault();close();onCancel?.();}
      if(event.target.closest('[data-paste-chip]')){
        const s=session.getState();
        const keys={ArrowLeft:[-.02,0],ArrowRight:[.02,0],
          ArrowUp:[0,-.02],ArrowDown:[0,.02]};
        if(keys[event.key]){
          event.preventDefault();pointer(s.x+keys[event.key][0],s.y+keys[event.key][1]);
        }
        if(event.key===' '){event.preventDefault();pump(true);tick(180);pump(false);}
      }
    });
  }
  return Object.freeze({open,close,tick,pump,pointer,confirm,getState:()=>session?.getState()||null});
}
// El mapa se mantiene visible durante el apriete y utiliza los mismos
// elementos SVG entre giros: CSS puede interpolar cada cambio de opacidad.
const CORNERS=[[25,25],[75,25],[25,75],[75,75]];
const svgNS='http://www.w3.org/2000/svg';
function cellKey(p){return Math.round(p.x*1000)+':'+Math.round(p.y*1000);}
function cellOpacity(mass){
  return Math.max(.11,Math.min(.98,Math.sqrt(mass/.002)*.9)).toFixed(3);
}
function cellsMarkup(cells){
  return cells.map(p=>'<rect class="thermal-cell" data-thermal-cell="'+cellKey(p)+
    '" x="'+(p.x*100).toFixed(1)+'" y="'+(p.y*100).toFixed(1)+
    '" width="3.9" height="3.9" style="opacity:'+cellOpacity(p.mass)+'"/>').join('');
}
function cornersMarkup(s,activeIndex){
  return CORNERS.map(([x,y],i)=>{
    const active=i===activeIndex;
    return '<g class="thermal-corner'+(active?' active':'')+'" data-thermal-corner="'+i+'">'+
      '<circle cx="'+x+'" cy="'+y+'" r="10" class="thermal-corner-halo"/>'+
      '<circle cx="'+x+'" cy="'+y+'" r="7.6" class="thermal-corner-disc"/>'+
      '<text x="'+x+'" y="'+(y-1.3)+'" text-anchor="middle" class="thermal-corner-number">'+
      (i+1)+'</text>'+
      '<text x="'+x+'" y="'+(y+5.8)+'" text-anchor="middle" class="thermal-corner-depth" '+
      'data-thermal-depth="'+i+'">'+s.screws[i]+'%</text></g>';
  }).join('');
}
function spreadMarkup(model,activeIndex=0){
  if(!model)return '';
  const s=model.getState();
  return '<div class="thermal-spread-panel thermal-live" role="region" '+
    'aria-label="Pasta térmica expandiéndose en directo durante los tornillos">'+
    '<div class="thermal-spread-heading">'+
      '<strong><span class="thermal-live-dot">●</span> Pasta térmica · EN DIRECTO</strong>'+
      '<span id="thermalTurnInfo">Tornillo '+(activeIndex+1)+' · '+s.screws[activeIndex]+'%</span>'+
    '</div>'+
    '<div class="thermal-spread-layout">'+
      '<svg id="thermalSpreadMap" viewBox="-22 -22 144 144" '+
        'aria-label="Pasta extendiéndose según la presión de los cuatro tornillos">'+
        '<defs><filter id="thermalPasteSoft" x="-8%" y="-8%" width="116%" height="116%">'+
          '<feGaussianBlur stdDeviation=".28"/></filter></defs>'+
        '<rect x="-18" y="-18" width="136" height="136" rx="10" class="thermal-chip-frame"/>'+
        '<rect x="0" y="0" width="100" height="100" class="thermal-chip-face"/>'+
        '<g id="thermalSpreadCells" filter="url(#thermalPasteSoft)">'+cellsMarkup(s.cells)+'</g>'+
        '<rect x="0" y="0" width="100" height="100" class="thermal-chip-edge"/>'+
        '<g id="thermalCornerMarkers">'+cornersMarkup(s,activeIndex)+'</g>'+
      '</svg>'+
      '<div class="thermal-spread-readings" aria-live="polite" aria-atomic="false">'+
        '<div><span>Cobertura actual</span><strong id="thermalCoverage">'+s.coverage+'%</strong>'+
          '<div class="thermal-meter-track"><div id="thermalCoverageBar" class="thermal-meter-fill" '+
          'style="width:'+s.coverage+'%"></div></div></div>'+
        '<div><span>Rebose</span><strong id="thermalOverflow">'+s.overflow+'%</strong></div>'+
        '<div><span>Desnivel máx.</span><strong id="thermalImbalance">'+s.peakImbalance+'%</strong></div>'+
      '</div>'+
    '</div>'+
    '<small>La pasta clara se mueve con cada giro. Alterna los tornillos '+
    'para repartir la presión de forma gradual. Modelo didáctico.</small>'+
  '</div>';
}
function updateSpread(popup,model,activeIndex=0){
  if(!popup||!model)return null;
  const s=model.getState(),cells=popup.querySelector('#thermalSpreadCells');
  if(cells){
    const existing=new Map(Array.from(cells.querySelectorAll('[data-thermal-cell]'),
      node=>[node.getAttribute('data-thermal-cell'),node]));
    const keys=new Set(),added=[];
    let canAppend=!!cells.ownerDocument?.createElementNS;
    for(const p of s.cells){
      const key=cellKey(p);keys.add(key);
      const opacity=cellOpacity(p.mass);
      const node=existing.get(key);
      if(node){
        node.style.opacity=opacity;
      }else if(canAppend){
        const fresh=cells.ownerDocument.createElementNS(svgNS,'rect');
        fresh.setAttribute('class','thermal-cell');
        fresh.setAttribute('data-thermal-cell',key);
        fresh.setAttribute('x',(p.x*100).toFixed(1));
        fresh.setAttribute('y',(p.y*100).toFixed(1));
        fresh.setAttribute('width','3.9');
        fresh.setAttribute('height','3.9');
        fresh.style.opacity='0';
        cells.appendChild(fresh);
        added.push([fresh,opacity]);
      }
    }
    if(!canAppend)cells.innerHTML=cellsMarkup(s.cells);
    else {
      for(const [key,node] of existing)if(!keys.has(key))node.style.opacity='0';
      // Dos frames separan inserción y cambio de opacidad; con ello,
      // las celdas recién ocupadas aparecen de forma fluida, no de golpe.
      const reveal=()=>added.forEach(([node,opacity])=>{node.style.opacity=opacity;});
      if(root.requestAnimationFrame){
        root.requestAnimationFrame(()=>root.requestAnimationFrame(reveal));
      }else reveal();
    }
  }
  for(const [id,value] of [
    ['thermalCoverage',s.coverage+'%'],
    ['thermalOverflow',s.overflow+'%'],
    ['thermalImbalance',s.peakImbalance+'%'],
    ['thermalTurnInfo','Tornillo '+(activeIndex+1)+' · '+s.screws[activeIndex]+'%']
  ]){
    const node=popup.querySelector('#'+id);
    if(node)node.textContent=value;
  }
  const meter=popup.querySelector('#thermalCoverageBar');
  if(meter)meter.style.width=s.coverage+'%';
  for(let i=0;i<4;i++){
    const marker=popup.querySelector('[data-thermal-corner="'+i+'"]');
    marker?.classList?.toggle('active',i===activeIndex);
    const depth=popup.querySelector('[data-thermal-depth="'+i+'"]');
    if(depth)depth.textContent=s.screws[i]+'%';
  }
  return {coverage:s.coverage,overflow:s.overflow,activeIndex,screws:s.screws};
}
root.PC_PASTE_UI=Object.freeze({create,spreadMarkup,updateSpread});
})(typeof window!=='undefined'?window:globalThis);
