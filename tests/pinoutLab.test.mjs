import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const content=fs.readFileSync(new URL('../js/pinoutLab.js',import.meta.url),'utf8');
const ctx={window:{}};vm.runInNewContext(content,ctx);
const {CONNECTORS,lookup,measure}=ctx.window.PC_PINOUTS;
const m=(connector,red,black,opts={})=>measure({connector,red,black,...opts});
test('pinout exacto ATX24 24 contactos, PS_ON 16, PWR_OK 8, VSB 9 y NC 20',()=>{
  assert.equal(CONNECTORS.atx24.pins.length,24);
  assert.equal(lookup('atx24',16).rail,'psOn');
  assert.equal(lookup('atx24',8).rail,'pwrOk');
  assert.equal(lookup('atx24',9).rail,'5vsb');
  assert.equal(lookup('atx24',20).rail,'nc');
  assert.equal(lookup('atx24',14).rail,'minus12');
  assert.equal(CONNECTORS.eps8.pins.length,8);
  assert.equal(CONNECTORS.pcie8.pins.length,8);
  assert.equal(CONNECTORS.sata15.pins.length,15);
});
test('ATX en marcha: 12, 5, 3.3, -12 y tensiones entre dos raíles',()=>{
  const on={psu:true,powered:true};
  assert.equal(m('atx24',10,3,on).value,'12.0 V⎓');
  assert.equal(m('atx24',4,3,on).value,'5.0 V⎓');
  assert.equal(m('atx24',1,3,on).value,'3.3 V⎓');
  assert.equal(m('atx24',14,3,on).value,'-12.0 V⎓');
  assert.equal(m('atx24',10,4,on).value,'7.0 V⎓');
  assert.equal(m('atx24',4,10,on).value,'-7.0 V⎓');
  assert.equal(m('atx24',3,15,on).value,'0.0 V⎓');
  assert.equal(m('atx24',20,3,on).value,'OL');
});
test('standby y señales: 5VSB y PS_ON funcionan con el PC apagado',()=>{
  const off={psu:true,powered:false};
  assert.equal(m('atx24',9,3,off).value,'5.0 V⎓');
  assert.equal(m('atx24',16,3,off).value,'5.0 V⎓');
  assert.equal(m('atx24',8,3,off).value,'0.0 V⎓');
  assert.equal(m('atx24',10,3,off).value,'0.0 V⎓');
  assert.equal(m('atx24',16,3,{psu:true,powered:true}).value,'0.0 V⎓');
  assert.equal(m('atx24',8,3,{psu:true,powered:true}).value,'5.0 V⎓');
});
test('EPS, PCIe y SATA con señales especiales',()=>{
  const on={psu:true,powered:true};
  assert.equal(m('eps8',5,1,on).value,'12.0 V⎓');
  assert.equal(m('pcie8',1,6,on).value,'12.0 V⎓');
  assert.equal(m('pcie8',4,5,on).value,'0.0 V⎓');
  assert.equal(m('sata15',8,4,on).value,'5.0 V⎓');
  assert.equal(m('sata15',14,10,on).value,'12.0 V⎓');
  assert.equal(m('sata15',3,4,on).value,'OL');
  assert.equal(m('sata15',11,4,on).value,'OL');
});
test('seguridad: A en paralelo con VSB aún apagado funde fusible; fusible evita segundo arco',()=>{
  const off={psu:true,powered:false,mode:'adc',jack:'amp'};
  assert.equal(m('atx24',9,3,off).spark,true);
  assert.equal(m('atx24',9,3,{...off,fuseBlown:true}).value,'FUSE');
  assert.equal(m('atx24',10,3,off).spark,undefined);
  assert.equal(m('atx24',10,3,{psu:true,powered:true,jack:'amp',mode:'vdc'}).spark,true);
  assert.equal(m('atx24',3,7,{psu:true,powered:true,jack:'amp',mode:'adc'}).value,'Err');
});
test('ohmios exigen PSU sin CA y no diagnostican líneas ajenas',()=>{
  assert.equal(m('atx24',3,7,{psu:true,powered:false,mode:'ohm'}).value,'STOP');
  assert.equal(m('atx24',3,7,{psu:false,mode:'ohm'}).value,'0.3 Ω');
  assert.equal(m('atx24',3,10,{psu:false,mode:'ohm'}).value,'OL');
  assert.equal(m('atx24',20,3,{psu:false,mode:'ohm'}).value,'OL');
});
