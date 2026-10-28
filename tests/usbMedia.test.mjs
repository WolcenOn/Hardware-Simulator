import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const ctx=vm.createContext({});
for(const file of ['usbMedia.js','osEmulation.js'])
  vm.runInContext(fs.readFileSync(new URL('../js/'+file,import.meta.url),'utf8'),ctx);
const media=ctx.PC_USB,OS=ctx.PC_OS;
const memory=new Map();
const storage={getItem:k=>memory.get(k)||null,setItem:(k,v)=>memory.set(k,v)};
test('USB físico conserva ID y contenido entre sesiones',()=>{
  const lib=media.createLibrary(storage),created=lib.acquire(32);
  assert.equal(created.ok,true);
  const id=created.drive.id;
  assert.match(id,/^USB-\d+$/);
  assert.equal(lib.installVentoy(id,'GPT').requiresConfirmation,true);
  assert.equal(lib.get(id).mode,'blank','sin consentimiento no se formatea');
  assert.equal(lib.installVentoy(id,'GPT',true).ok,true);
  assert.equal(lib.copyISO(id,'novadesk').ok,true);
  assert.equal(lib.copyISO(id,'libreforge').ok,true);
  assert.equal(lib.copyISO(id,'terminalis').ok,true);
  assert.equal(lib.copyISO(id,'novadesk').ok,false,'una misma ISO no se duplica');
  const again=media.createLibrary(storage);
  assert.equal(again.get(id).id,id);
  assert.equal(again.inspect(id).images.length,3);
  assert(Math.abs(again.inspect(id).freeGb-(32-.064-5.4-2.8-.9))<.001);
  assert.equal(again.get(id).partition,'GPT');
  assert.equal(again.get(id).filesystem,'exFAT');
  assert.equal(again.removeISO(id,'libreforge'),true);
  assert.equal(again.inspect(id).images.length,2);
  assert.equal(again.installVentoy(id,'MBR',true).ok,true);
  assert.equal(again.inspect(id).images.length,0,'reinstalar Ventoy sí borra las ISO');
});
test('Ventoy ofrece menu, no arranca sin elegir ISO, conserva discos',()=>{
  const lib=media.createLibrary(null),id=lib.acquire().drive.id;
  lib.installVentoy(id,'GPT',true);
  lib.copyISO(id,'novadesk');lib.copyISO(id,'libreforge');
  const machine={
    power:true,installed:{storage:true},selected:{storage:'hdd'},sataData:true,
    sataPower:true,biosCfg:{sata:'AHCI',secure:'on',uefi:'on',
      boot:'usb',bootOrder:['usb','ssd','pxe']},
    usbConnected:true,usbMedia:lib.get(id),usbMediaKey:id,
    usbMenuActive:true,usbMenuIndex:1,usbImage:'none',
    installedOs:{id:'terminalis',storageId:'hdd'},osInstalling:false
  };
  const hw={post:true,ramGb:16,disk:{name:'HDD 2 TB',interface:'SATA'},diskGb:2000};
  const menu=OS.resolveBoot(machine,hw);
  assert.equal(menu.kind,'ventoy');
  assert.equal(menu.images.length,2);
  assert.equal(menu.selection,1);
  machine.usbMenuActive=false;machine.usbImage='libreforge';
  assert.equal(OS.resolveBoot(machine,hw).kind,'installer');
  machine.usbConnected=false;
  assert.equal(OS.resolveBoot(machine,hw).kind,'desktop');
  assert.equal(OS.resolveBoot(machine,hw).os.id,'terminalis');
});
test('capacidad, MBR, USB vacío y modelos distintos',()=>{
  const lib=media.createLibrary(null);
  const a=lib.acquire(32).drive.id,b=lib.acquire(64).drive.id;
  assert.notEqual(a,b);
  assert.equal(lib.get(a).bootable,false);
  assert.equal(lib.copyISO(a,'novadesk').ok,false);
  assert.equal(lib.installVentoy(a,'invalid',true).ok,false);
  assert.equal(lib.installVentoy(b,'MBR',true).ok,true);
  assert.equal(lib.get(b).partition,'MBR');
  assert.equal(lib.remove(b),true);
  assert.equal(lib.get(b),null);
});
