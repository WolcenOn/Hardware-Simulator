import { BOARD_LAYOUTS, MOTHERBOARD_MOUNT, getMotherboardMountPoints, MM_PER_UNIT } from '../js/partsRealScale.js';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
const html=read('index.html');
const source=html.match(/<script>\s*const \$=id=>document\.getElementById\(id\);([\s\S]*?)<\/script>/)?.[0].replace(/<\/?script>/g,'');
assert(source,'Inline script missing');
const elements={};let errors=[];
const get=id=>elements[id]||(elements[id]={
 id,innerHTML:'',textContent:'',scrollTop:0,value:'ssd',hidden:true,dataset:{},
 style:{setProperty(){}},classList:{add(){},remove(){},toggle(){}},
 addEventListener(){},querySelector(){return null},querySelectorAll(){return []},
 getBoundingClientRect(){return {left:0,top:0,width:1200,height:600};}
});
const document={getElementById:get,querySelectorAll:()=>[],addEventListener(){},
 body:{classList:{add(){},remove(){}}}};
const window={PC3D:null,addEventListener(){},dispatchEvent(){}};
const ctx=vm.createContext({window,document,console:{log(){},error(...a){errors.push(String(a[0]));}},
 setTimeout:()=>0,Date,Math,Intl});
for(const path of ['js/hardwareExpansion.js','js/adventureMode.js','js/partInspector.js'])
 vm.runInContext(read(path),ctx,{filename:path});
vm.runInContext(source+';globalThis.lab={get s(){return state},get g(){return adventureGame},autoBuild,power,bios,calculateThermals};',
 ctx,{filename:'index.html'});
const l=ctx.lab,g=l.g;
assert(g.active);
l.autoBuild();assert(!g.active&&l.s.installed.motherboard);
l.power();assert(l.s.power);l.bios();assert(l.s.bios);
g.start('office');
const caseRenders=[];
const viewEvents=[];
window.PC3D={
  ready:true,
  update(state){if(state.installed.case)
    caseRenders.push(state.selected.caseVariant);},
  updateStaging(){},
  viewStaging(){viewEvents.push('staging')},
  viewAssemblyDesk(){viewEvents.push('assembly')}
};
const buy=(c,id)=>g.purchase(c,id);
const fit=k=>{g.select(k);g.perform('fit')};
buy('case','towerWhite');fit('case:towerWhite');
assert.equal(l.s.selected.caseVariant,'towerWhite');
assert.equal(caseRenders.at(-1),'towerWhite','3D debe dibujar el acabado antes del encaje');
assert(viewEvents.includes('assembly'),'Al montar caja enfoca la mesa principal');
buy('item','ioShield');fit('item:ioShield');
buy('psu','psu450');fit('psu:psu450');
buy('motherboard','b650');fit('motherboard:b650');
assert(!l.s.installed.motherboard);
g.perform('route');assert(l.s.psuAccessRouted);
fit('motherboard:b650');assert(l.s.installed.motherboard);
buy('item','keyboard');buy('item','mouse');
g.connect('keyboard');g.connect('mouse');
assert(l.s.keyboardConnected&&l.s.mouseConnected);
g.disconnect('keyboard');assert(!l.s.keyboardConnected);
buy('item','rgbStrip');g.select('item:rgbStrip');g.perform('apply');
assert(l.s.rgbInstalled);
buy('cpu','r7600');fit('cpu:r7600');
buy('item','paste');g.select('item:paste');g.perform('apply');
buy('cooler','aio240');fit('cooler:aio240');
assert.equal(l.s.selected.cooler,'aio240');
l.s.cpuFan=true;
const aio=l.calculateThermals([]);
l.s.selected.cooler='stock';
assert(aio<l.calculateThermals([]));
g.start('office');
buy('case','towerGraphite');fit('case:towerGraphite');
assert.equal(l.s.selected.caseVariant,'towerGraphite');
assert.equal(caseRenders.at(-1),'towerGraphite',
  'El material grafito debe llegar al render 3D en el mismo frame');
assert(!errors.length,'Browser mock errors: '+errors.join(', '));
// Regresión: no dejar la motherboard suspendida sobre los separadores.
const mount=MOTHERBOARD_MOUNT;
const bottom=mount.pcbCenterY-mount.pcbThickness/2+mount.offsetY;
assert(Math.abs(bottom-(mount.trayTopY+mount.standoffHeight))*MM_PER_UNIT<.1);
assert.equal(mount.standoffHeight*MM_PER_UNIT,6.5);
for(const [id,cfg] of Object.entries(BOARD_LAYOUTS)){
  const holes=getMotherboardMountPoints(cfg);
  assert.equal(holes.length,4,id);
  assert.equal(new Set(holes.map(v=>v.join(':'))).size,4,id);
  assert(holes.every(([x,z])=>x>=-4.055&&x<=1.695&&z>=-3.33&&z<=3.31),id);
}
console.log('Smoke OK: demo, BIOS, PSU, USB, RGB, AIO and 3D case finishes');
