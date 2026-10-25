import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
function game(){
  const frames=[];
  const window={frames,requestAnimationFrame:fn=>{frames.push(fn);return frames.length}};
  const ctx=vm.createContext({window,Math,Number,Object,Float64Array,Array});
  vm.runInContext(read('js/thermalPaste.js'),ctx);
  vm.runInContext(read('js/pasteGameplay.js'),ctx);
  const syringe=window.PC_THERMAL_PASTE.makeSyringe();
  syringe.pointer(.5,.5);syringe.pump(true);
  for(let i=0;i<75;i++)syringe.advance(40);
  syringe.pump(false);for(let i=0;i<20;i++)syringe.advance(40);
  return {window,spread:window.PC_THERMAL_PASTE.createSpread(syringe.confirm().dots),frames};
}
function node(attrs={}){
  return {attrs,style:{opacity:(attrs.style||'').match(/opacity:([\d.]+)/)?.[1]||'1'},
    textContent:'',setAttribute(k,v){this.attrs[k]=v},
    getAttribute(k){return this.attrs[k]}};
}
function popup(markup){
  const children=[...markup.matchAll(/<rect class="thermal-cell" data-thermal-cell="([^"]+)" x="([^"]+)" y="([^"]+)" width="([^"]+)" height="([^"]+)" style="opacity:([^"]+)"\/>/g)]
    .map(([,key,x,y,width,height,opacity])=>node({
      'data-thermal-cell':key,x,y,width,height,style:'opacity:'+opacity}));
  const ownerDocument={createElementNS(ns,tag){
    assert.equal(ns,'http://www.w3.org/2000/svg');assert.equal(tag,'rect');return node();
  }};
  const grid={children,ownerDocument,querySelectorAll(){return this.children},
    appendChild(n){this.children.push(n)}};
  const elements={'#thermalSpreadCells':grid};
  for(const id of ['thermalCoverage','thermalOverflow','thermalImbalance','thermalTurnInfo',
    'thermalCoverageBar'])elements['#'+id]=node();
  for(let i=0;i<4;i++){
    elements['[data-thermal-corner="'+i+'"]']={classList:{
      toggle(_,yes){this.active=yes}
    }};
    elements['[data-thermal-depth="'+i+'"]']=node();
  }
  return {grid,elements,querySelector(selector){return elements[selector]||null}};
}
test('El mapa aparece en la cabecera visible durante el atornillado',()=>{
  const mode=read('js/adventureMode.js');
  assert(mode.includes('has-thermal-spread'));
  assert(mode.includes('root.PC_PASTE_UI.spreadMarkup(pasteSpread,screwHoleIndex)'));
  assert(mode.includes('root.PC_PASTE_UI.updateSpread(screwPopup,pasteSpread,screwHoleIndex)'));
  const html=read('index.html');
  assert(html.includes('.screw-precision-dialog.has-thermal-spread .thermal-live'));
  assert(html.includes('position:sticky;top:0;z-index:8'));
});
test('Cada giro cambia inmediatamente DOM, cobertura y presión de la esquina',()=>{
  const {window,spread,frames}=game(),before=spread.getState();
  const markup=window.PC_PASTE_UI.spreadMarkup(spread,0),scene=popup(markup);
  assert(markup.includes('EN DIRECTO'));
  assert(markup.includes('thermalCoverageBar'));
  assert(markup.includes('thermalCornerMarkers'));
  const first=scene.grid.children[0],count=scene.grid.children.length;
  spread.tighten(0,10);
  const current=spread.getState();
  assert(current.coverage>before.coverage);
  const ui=window.PC_PASTE_UI.updateSpread(scene,spread,0);
  assert.equal(ui.coverage,current.coverage);
  assert.equal(scene.elements['#thermalCoverage'].textContent,current.coverage+'%');
  assert.equal(scene.elements['#thermalCoverageBar'].style.width,current.coverage+'%');
  assert(scene.grid.children.length>count);
  assert(scene.grid.children.includes(first),'Los rectángulos existentes NO se destruyen');
  assert.equal(scene.elements['[data-thermal-depth="0"]'].textContent,'10%');
  assert.equal(scene.elements['[data-thermal-corner="0"]'].classList.active,true);
  const added=scene.grid.children.find(c=>c.style.opacity==='0');
  assert(added);
  while(frames.length){const callbacks=frames.splice(0);callbacks.forEach(cb=>cb());}
  assert(Number(added.style.opacity)>0);
  spread.tighten(3,10);
  window.PC_PASTE_UI.updateSpread(scene,spread,3);
  assert.equal(scene.elements['[data-thermal-corner="3"]'].classList.active,true);
  assert.equal(scene.elements['[data-thermal-depth="3"]'].textContent,'10%');
});
test('El código pinta la expansión antes de completar los cuatro tornillos',()=>{
  const mode=read('js/adventureMode.js'),start=mode.indexOf('function screwTurn('),
    finish=mode.indexOf('function screwPopupMarkup(',start);
  assert(start>=0&&finish>start);
  const handler=mode.slice(start,finish);
  const model=handler.indexOf('pasteSpread.tighten(screwHoleIndex,result.depth)');
  const visual=handler.indexOf('root.PC_PASTE_UI.updateSpread(screwPopup,pasteSpread,screwHoleIndex)');
  const complete=handler.indexOf('if(result.complete){');
  assert(model>=0&&visual>model&&complete>visual,
    'La vista se debe actualizar en cada giro, ANTES de completar la fijación');
});
