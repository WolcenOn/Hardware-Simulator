import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const script=fs.readFileSync(new URL('../js/osEmulation.js',import.meta.url),'utf8');
const context=vm.createContext({});
vm.runInContext(script,context);
const OS=context.PC_OS;
const hardware={
  post:true,ramGb:16,disk:{name:'HDD 2 TB',interface:'SATA'},
  secondaryDisk:{name:'HDD 4 TB',interface:'SATA'},diskGb:2000
};
function machine(){
  return {
    power:true,bootStage:6,
    installed:{storage:true},selected:{storage:'hdd'},
    sataData:true,sataPower:true,
    biosCfg:{sata:'AHCI',secure:'on',uefi:'on',boot:'ssd',bootOrder:['ssd','usb','pxe']},
    installedOs:{id:'libreforge',storageId:'hdd'},
    secondaryStorage:{id:'hdd4',installed:true,sataData:true,sataPower:true,installedOs:null},
    osInstallTarget:'ssd',usbConnected:false,usbImage:'none',osInstalling:false,
    monitorCable:true,keyboardConnected:true,bios:false
  };
}
test('UEFI enumera dos HDD reales con identidades y cableado independientes',()=>{
  const st=machine();
  const disks=OS.availableDrives(st,hardware);
  assert.equal(disks.length,2);
  assert.equal(disks[0].id,'hdd');
  assert.equal(disks[1].id,'hdd4');
  assert.equal(disks[0].ready,true);
  st.secondaryStorage.sataPower=false;
  assert.equal(OS.availableDrives(st,hardware)[1].ready,false);
  assert.equal(OS.availableDrives(st,hardware)[0].ready,true);
});
test('BIOS arranca del HDD 1 mientras el HDD 2 sigue vacío',()=>{
  const st=machine();
  assert.equal(OS.resolveBoot(st,hardware).device,'ssd');
  st.biosCfg.bootOrder=['hdd2','ssd','usb','pxe'];
  assert.equal(OS.resolveBoot(st,hardware).device,'ssd');
});
test('BIOS permite elegir HDD 2 con otro SO y mantiene HDD 1',()=>{
  const st=machine();
  st.secondaryStorage.installedOs={id:'terminalis',storageId:'hdd4'};
  st.biosCfg.bootOrder=['hdd2','ssd','usb','pxe'];
  const fromSecond=OS.resolveBoot(st,hardware);
  assert.equal(fromSecond.device,'hdd2');
  assert.equal(fromSecond.os.id,'terminalis');
  st.biosCfg.bootOrder=['ssd','hdd2','usb','pxe'];
  assert.equal(OS.resolveBoot(st,hardware).os.id,'libreforge');
  st.secondaryStorage.sataData=false;
  assert.equal(OS.resolveBoot(st,hardware).device,'ssd');
});
test('la instalación se dirige al HDD 2 y no sobrescribe el SO del HDD 1',()=>{
  const st=machine();
  st.usbConnected=true;st.usbImage='novadesk';
  st.osInstallTarget='hdd2';
  st.biosCfg.boot='usb';st.biosCfg.bootOrder=['usb','ssd','hdd2','pxe'];
  const check=OS.canInstall(st,hardware);
  assert.equal(check.ok,true,check.reason);
  assert.equal(check.device,'hdd2');
  const done=OS.installRecord(st,hardware);
  assert.equal(done.ok,true,done.reason);
  assert.equal(st.installedOs.id,'libreforge');
  assert.equal(st.secondaryStorage.installedOs.id,'novadesk');
  assert.equal(st.secondaryStorage.installedOs.storageId,'hdd4');
  st.usbConnected=false;
  st.biosCfg.boot='hdd2';st.biosCfg.bootOrder=['hdd2','ssd','usb','pxe'];
  assert.equal(OS.resolveBoot(st,hardware).device,'hdd2');
});
test('no se puede instalar ni arrancar desde un segundo disco sin SATA datos',()=>{
  const st=machine();
  st.secondaryStorage.sataData=false;
  st.osInstallTarget='hdd2';st.usbConnected=true;st.usbImage='libreforge';
  st.biosCfg.boot='usb';st.biosCfg.bootOrder=['usb','hdd2','ssd','pxe'];
  assert.equal(OS.canInstall(st,hardware).code,'DISK_NOT_READY');
  st.usbConnected=false;st.secondaryStorage.installedOs={id:'terminalis',storageId:'hdd4'};
  st.biosCfg.bootOrder=['hdd2','ssd','usb','pxe'];
  assert.equal(OS.resolveBoot(st,hardware).device,'ssd');
});
