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


test('8.16: orden por filas de ATX, EPS, PCIe y SATA',()=>{
 const p=ctx.window.PC_PINOUTS;
 const seq=id=>p.orderedRows(id).map(row=>Array.from(row,x=>x.number));
 assert.deepEqual(Array.from(seq('atx24')[0]),Array.from({length:12},(_,i)=>i+1));
 assert.deepEqual(Array.from(seq('atx24')[1]),Array.from({length:12},(_,i)=>i+13));
 for(const id of ['eps8','pcie8']){
   assert.deepEqual(Array.from(seq(id)[0]),[1,2,3,4]);
   assert.deepEqual(Array.from(seq(id)[1]),[5,6,7,8]);
 }
 assert.deepEqual(Array.from(seq('sata15')[0]),Array.from({length:15},(_,i)=>i+1));
 assert.equal(p.orderedRows('unknown').length,0);
});
test('8.16: colores ATX de Intel, incluyendo sense naranja/marrón en P13',()=>{
 const p=ctx.window.PC_PINOUTS;
 const colors=['orange','orange','black','red','black','red',
  'black','gray','purple','yellow','yellow','orange',
  'orange','blue','black','green','black','black',
  'black','none','red','red','red','black'];
 assert.deepEqual(Array.from(CONNECTORS.atx24.pins,pin=>pin.color),colors);
 assert.deepEqual(Array.from(lookup('atx24',13).wireColors),['orange','brown']);
 assert.equal(p.colorName(lookup('atx24',13)),'naranja + marrón');
 assert.match(p.swatch(lookup('atx24',13)),/^linear-gradient/);
 assert.equal(p.colorName(lookup('atx24',20)),'sin color fijo');
 assert.equal(p.colorName(lookup('atx24',9)),'morado');
 assert.equal(p.colorName(lookup('atx24',16)),'verde');
 assert.equal(p.colorName(lookup('atx24',8)),'gris');
 assert.equal(p.colorName(lookup('atx24',14)),'azul');
});
test('8.16: colores comunes de EPS/PCIe y SATA P11 no universal',()=>{
 const p=ctx.window.PC_PINOUTS;
 assert.deepEqual(Array.from(CONNECTORS.eps8.pins,q=>q.color),
  ['black','black','black','black','yellow','yellow','yellow','yellow']);
 assert.deepEqual(Array.from(CONNECTORS.pcie8.pins,q=>q.color),
  ['yellow','yellow','yellow','black','black','black','black','black']);
 assert.equal(lookup('sata15',11).color,'none');
 assert.equal(p.colorName(lookup('sata15',11)),'sin color fijo');
 assert.equal(p.swatch(lookup('sata15',11)),p.COLORS.none);
 assert.equal(p.WIRE_LEGEND.find(q=>q.color==='green').signal,'PS_ON#');
});


test('8.17: las caras opuestas invierten columnas, sin modificar pines',()=>{
 const p=ctx.window.PC_PINOUTS;
 const n=rows=>rows.map(row=>Array.from(row,x=>x.number));
 assert.deepEqual(n(p.orientedRows('atx24','contacts'))[0],
   Array.from({length:12},(_,i)=>i+13));
 assert.deepEqual(n(p.orientedRows('atx24','contacts'))[1],
   Array.from({length:12},(_,i)=>i+1));
 assert.deepEqual(n(p.orientedRows('atx24','wires'))[0],
   Array.from({length:12},(_,i)=>24-i));
 assert.deepEqual(n(p.orientedRows('atx24','wires'))[1],
   Array.from({length:12},(_,i)=>12-i));
 for(const id of ['atx24','eps8','pcie8','sata15']){
   const def=CONNECTORS[id];
   for(const pin of def.pins){
     const a=p.positionOf(id,pin.number,'contacts');
     const b=p.positionOf(id,pin.number,'wires');
     assert.equal(a.row,b.row);
     assert.equal(a.col+b.col,def.columns-1);
     const expected=p.level(pin.rail,{psu:true,powered:true})===null?'OL':'0.0 V⎓';
     assert.equal(m(id,pin.number,pin.number,{psu:true,powered:true}).value,
       expected,id+' / P'+pin.number);
   }
 }
 assert.equal(p.positionOf('atx24',16,'contacts').row,0);
 assert.equal(p.positionOf('atx24',16,'wires').col,8);
 assert.equal(p.positionOf('none',1),null);
 assert.equal(p.orientedRows('atx24','invalid').length,0);
});
test('8.17: polarización EPS y PCIe distinta y llave SATA en L',()=>{
 const p=ctx.window.PC_PINOUTS;
 assert.equal(p.HOUSINGS.atx24.split,'20+4');
 assert.equal(p.HOUSINGS.eps8.split,'4+4');
 assert.equal(p.HOUSINGS.pcie8.split,'6+2');
 assert.equal(p.HOUSINGS.sata15.kind,'sata-l');
 assert.equal(p.keyShape('eps8',6),'square');
 assert.equal(p.keyShape('pcie8',6),'bevel');
 assert.equal(p.keyShape('atx24',1),'neutral');
 assert.equal(p.keyShape('sata15',1),'blade');
 assert.equal(p.keyShape('atx24',25),null);
});
