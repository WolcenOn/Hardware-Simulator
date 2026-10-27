import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source=fs.readFileSync(new URL('../js/workshopTools.js',import.meta.url),'utf8');
const window={};
vm.runInNewContext(source,{window,console},{filename:'workshopTools.js'});
const {ITEMS,createBank,meterRead}=window.PC_WORKSHOP_TOOLS;
function memoryStorage(){
  const map=new Map();
  return {getItem:key=>map.get(key)||null,setItem:(key,val)=>map.set(key,val)};
}
test('patrimonio propio persistente, sin recomprar destornillador',()=>{
  const store=memoryStorage(),bank=createBank(store);
  assert.equal(bank.snapshot().cash,300);
  assert.equal(bank.owns('screwdriver'),true);
  assert.deepEqual(bank.buy('screwdriver').ok,false);
  assert.equal(bank.snapshot().cash,300);
  assert.equal(bank.buy('multimeter').ok,true);
  assert.equal(bank.buy('multimeter').ok,false);
  assert.equal(bank.snapshot().cash,252);
  assert.equal(bank.reward('office'),true);
  assert.equal(bank.reward('office'),false);
  assert.equal(bank.snapshot().cash,362);
  assert.equal(bank.buy('alcohol').ok,true);
  assert.equal(bank.snapshot().supplies.alcohol,4);
  assert.equal(bank.use('alcohol'),true);
  assert.equal(bank.snapshot().supplies.alcohol,3);
  const reloaded=createBank(store);
  assert.equal(reloaded.owns('multimeter'),true);
  assert.equal(reloaded.snapshot().supplies.alcohol,3);
  assert.equal(reloaded.snapshot().cash,350);
  assert.equal(ITEMS.vacuum.price,62);
});
test('multímetro exige magnitud, borne y posición coherentes',()=>{
  const on={powered:true,psu:true,sata:true,fan:true};
  assert.equal(meterRead({...on,mode:'vdc',point:'psu12'}).value,'12.0 V⎓');
  assert.equal(meterRead({...on,mode:'vdc',point:'psu5'}).value,'5.0 V⎓');
  assert.equal(meterRead({...on,mode:'vac',point:'psu12'}).value,'0.0 V~');
  assert.equal(meterRead({...on,mode:'ohm',point:'sataWire'}).value,'STOP');
  assert.equal(meterRead({mode:'ohm',point:'sataWire',sata:true}).value,'0.3 Ω');
  assert.equal(meterRead({mode:'ohm',point:'sataWire',sata:false}).value,'OL');
  assert.equal(meterRead({...on,mode:'adc',point:'fanSeries',jack:'amp'}).value,'0.18 A');
  assert.equal(meterRead({...on,mode:'adc',point:'fanSeries',jack:'vohm'}).value,'LEAd');
  assert.equal(meterRead({...on,mode:'adc',point:'psu12',jack:'amp'}).spark,true);
  assert.equal(meterRead({...on,mode:'vdc',point:'psu12',jack:'amp'}).spark,true);
  assert.equal(meterRead({mode:'adc',point:'psu12',jack:'amp',powered:false,psu:true}).spark,undefined);
});
test('el cortocircuito funde fusible virtual, reparación pagada con fondo propio',()=>{
  const bank=createBank(memoryStorage());
  bank.buy('multimeter');
  bank.shortCircuit();
  assert.equal(bank.snapshot().fuseBlown,true);
  assert.equal(meterRead({mode:'adc',jack:'amp',point:'fanSeries',fuseBlown:true}).value,'FUSE');
  assert.equal(bank.replaceFuse(),true);
  assert.equal(bank.replaceFuse(),false);
  assert.equal(bank.snapshot().cash,247);
});
