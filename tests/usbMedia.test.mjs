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

test('seguridad: el almacenamiento local malformado no inyecta campos ni memorias',()=>{
  const input={
    seq:999999999,drives:[
      {id:'USB-1',capacityGb:32,mode:'ventoy',partition:'GPT',
        filesystem:'HTML',bootable:false,images:['libreforge','libreforge','bad-iso'],
        __proto__:{admin:true},html:'<img src=x onerror=alert(1)>'},
      {id:'USB-1',capacityGb:64,mode:'blank',images:[]},
      {id:'USB-<script>',capacityGb:32,mode:'ventoy',images:['novadesk']},
      {id:'USB-2',capacityGb:64,mode:'blank',images:['novadesk']}
    ]
  };
  const store={getItem:()=>JSON.stringify(input),setItem(){}};
  const lib=media.createLibrary(store),list=lib.list();
  assert.equal(list.length,2,'rechazar IDs duplicados o inválidos');
  assert.deepEqual(Object.keys(list[0]).sort(),[
    'bootable','capacityGb','filesystem','id','images','mode','partition'].sort());
  assert.equal(list[0].bootable,true);
  assert.equal(list[0].filesystem,'exFAT');
  assert.equal(list[0].images.length,1);
  assert.equal(list[1].images.length,0,'un USB vacío no conserva ISO');
  assert.equal(lib.acquire(32).drive.id,'USB-3','serie saneada y sin colisión');
});
test('seguridad: datos locales excesivos y dispositivos agotados',()=>{
  const oversize=media.createLibrary({getItem:()=>'{'.repeat(49_000),setItem(){}});
  assert.equal(oversize.list().length,0);
  const store={getItem:()=>JSON.stringify({seq:999999,drives:[]}),setItem(){}};
  assert.equal(media.createLibrary(store).acquire(32).ok,false);
});
