// PC LAB — emulador educativo de instalación y arranque.
// Sistemas, marcas, interfaces y fondos originales. No ejecuta ningún SO real.
(function(root){
'use strict';
const CATALOG=Object.freeze({
  novadesk:Object.freeze({id:'novadesk',name:'NovaDesk 11',family:'modern',
    detail:'Entorno de escritorio ficticio',minGb:64,minRamGb:4,
    requiresUefi:true,requiresSecureBoot:true,accent:'#6bcbff'}),
  libreforge:Object.freeze({id:'libreforge',name:'LibreForge',family:'open',
    detail:'Entorno libre ficticio',minGb:20,minRamGb:2,
    requiresUefi:false,requiresSecureBoot:false,accent:'#c7a1ff'}),
  terminalis:Object.freeze({id:'terminalis',name:'Terminalis',family:'terminal',
    detail:'Sistema de consola ficticio',minGb:8,minRamGb:1,
    requiresUefi:false,requiresSecureBoot:false,accent:'#84f4b8'})
});
const BOOT_LABELS=Object.freeze({ssd:'Disco interno',usb:'USB',pxe:'Red PXE'});
function storageCapacityGb(id,name=''){
  const known={sataSSD:1000,nvmeSSD:500,hdd:2000,hdd4:4000,
    sataSSD2:2000,nvme2:2000};
  if(known[id])return known[id];
  const m=String(name).match(/(\d+(?:[.,]\d+)?)\s*(TB|GB)/i);
  if(!m)return 0;
  return Math.round(Number(m[1].replace(',','.'))*(m[2].toUpperCase()==='TB'?1000:1));
}
function installedDiskReady(state,disk={}){
  if(!state?.installed?.storage)return false;
  if(disk.interface==='SATA'&&(!state.sataData||!state.sataPower))return false;
  if(disk.interface==='SATA'&&state.biosCfg?.sata!=='AHCI')return false;
  return true;
}
function requirement(image,state,hardware={}){
  const os=CATALOG[image];
  if(!os)return {ok:false,code:'NO_IMAGE',reason:'No hay imagen de instalación válida.'};
  if(os.requiresUefi&&state?.biosCfg?.uefi==='off')
    return {ok:false,code:'UEFI_REQUIRED',reason:os.name+' requiere arranque UEFI.'};
  if(os.requiresSecureBoot&&state?.biosCfg?.secure!=='on')
    return {ok:false,code:'SECURE_BOOT_REQUIRED',
      reason:os.name+' requiere Secure Boot activado.'};
  if((hardware.ramGb||0)<os.minRamGb)
    return {ok:false,code:'RAM_REQUIRED',
      reason:os.name+' requiere al menos '+os.minRamGb+' GB de RAM.'};
  return {ok:true,code:'OK',reason:'Requisitos de firmware correctos.'};
}
function canInstall(state,hardware={}){
  const image=state?.usbImage;
  if(!state?.usbConnected||!CATALOG[image])
    return {ok:false,code:'NO_INSTALLER_USB',
      reason:'Conecta un USB con un instalador válido.'};
  if(!state?.installed?.storage)
    return {ok:false,code:'NO_TARGET_DISK',reason:'No hay disco de destino instalado.'};
  if(!installedDiskReady(state,hardware.disk))
    return {ok:false,code:'DISK_NOT_READY',
      reason:'La unidad no está disponible: revisa cables SATA y modo AHCI.'};
  const check=requirement(image,state,hardware);
  if(!check.ok)return check;
  const gb=hardware.diskGb||storageCapacityGb(state.selected?.storage,hardware.disk?.name);
  if(gb<CATALOG[image].minGb)
    return {ok:false,code:'DISK_TOO_SMALL',reason:CATALOG[image].name+
      ' necesita '+CATALOG[image].minGb+' GB; disco detectado: '+gb+' GB.'};
  if(!state.power||!hardware.post)
    return {ok:false,code:'NO_POST',reason:'Enciende el equipo y completa el POST.'};
  if(state.bios)
    return {ok:false,code:'BIOS_OPEN',reason:'Sal de la BIOS para iniciar el instalador.'};
  if(!state.monitorCable||!state.keyboardConnected)
    return {ok:false,code:'MISSING_PERIPHERALS',
      reason:'Conecta un monitor con señal y el teclado.'};
  if(state.biosCfg?.bootOrder?.[0]!=='usb'&&state.biosCfg?.boot!=='usb')
    return {ok:false,code:'USB_NOT_FIRST',
      reason:'Selecciona USB como primera prioridad de arranque en UEFI.'};
  return {ok:true,code:'READY',reason:'Instalador listo.',os:CATALOG[image],diskGb:gb};
}
function resolveBoot(state,hardware={}){
  if(!state?.power)return {kind:'off',code:'OFF',message:'Equipo apagado.'};
  if(!hardware.post)return {kind:'post-error',code:'POST_FAILED',
    message:'El hardware no ha completado el POST.'};
  if(state.osInstalling)return {kind:'installing',code:'INSTALLING',os:CATALOG[state.usbImage],
    progress:state.osInstallProgress||0,message:'Instalación ficticia en curso.'};
  const order=state.biosCfg?.bootOrder||[state.biosCfg?.boot||'ssd','usb','pxe'];
  const media=state.installedOs;
  const diskValid=!!media&&!!CATALOG[media.id]&&
    media.storageId===state.selected?.storage&&installedDiskReady(state,hardware.disk);
  for(const device of order){
    if(device==='usb'&&state.usbConnected&&CATALOG[state.usbImage]){
      const check=requirement(state.usbImage,state,hardware);
      if(!check.ok)return {kind:'blocked',device:'usb',code:check.code,
        message:check.reason,os:CATALOG[state.usbImage]};
      return {kind:'installer',code:'USB_INSTALLER',device:'usb',
        os:CATALOG[state.usbImage],message:'Instalador USB detectado.'};
    }
    if(device==='ssd'&&diskValid){
      const check=requirement(media.id,state,hardware);
      if(!check.ok)return {kind:'blocked',device:'ssd',code:check.code,
        message:check.reason,os:CATALOG[media.id]};
      return {kind:'desktop',code:'DISK_OS',device:'ssd',
        os:CATALOG[media.id],message:'Sistema instalado en '+(hardware.disk?.name||'disco')+'.'};
    }
  }
  if(state.installed?.storage&&!installedDiskReady(state,hardware.disk))
    return {kind:'no-boot',code:'DISK_NOT_READY',
      message:'Disco sin comunicación o alimentación. Revisa SATA/UEFI.'};
  return {kind:'no-boot',code:'NO_BOOTABLE_DEVICE',
    message:state.installed?.storage?
      'No hay un sistema instalado ni USB de arranque válido.':
      'No hay disco ni USB de arranque válido.'};
}
function installRecord(state,hardware={}){
  const check=canInstall(state,hardware);
  if(!check.ok)return check;
  state.installedOs={id:state.usbImage,storageId:state.selected.storage,
    storageInterface:hardware.disk?.interface||'unknown'};
  // La licencia corresponde al PC instalado, no al medio USB. NovaDesk
  // es propietario ficticio y puede arrancar sin activación; las
  // distribuciones libres no requieren una compra adicional.
  state.osActivated=state.usbImage!=='novadesk';
  state.osInstalled=true;state.osInstalling=false;state.osInstallProgress=100;
  return {ok:true,code:'INSTALLED',os:CATALOG[state.usbImage],
    reason:'Instalación completada. Retira el USB o coloca el disco primero en la BIOS.'};
}
function presentation(state,hardware={}){
  const boot=resolveBoot(state,hardware);
  if(state.power&&state.bootStage<4)return {kind:'post',code:'POST_RUNNING'};
  if(boot.kind==='installer'&&state.osInstallProgress===100&&
      state.installedOs?.id===state.usbImage)
    return {...boot,kind:'installed',progress:100};
  if(boot.kind==='desktop'&&state.bootStage>=4&&state.bootStage<6)
    return {...boot,kind:'splash',progress:state.bootStage===4?30:75};
  return boot;
}
function paint(ctx,w,h,visual){
  if(!visual||!['installer','installing','installed','desktop','splash','blocked','no-boot'].includes(visual.kind))
    return false;
  const os=visual.os||{},accent=os.accent||'#78ddeb';
  const modern=os.family==='modern',terminal=os.family==='terminal';
  const bg=ctx.createLinearGradient(0,0,w,h);
  bg.addColorStop(0,modern?'#102a49':terminal?'#04130f':'#231737');
  bg.addColorStop(1,modern?'#0b1425':terminal?'#081d18':'#101523');
  ctx.fillStyle=bg;ctx.fillRect(0,0,w,h);
  ctx.fillStyle=accent;ctx.fillRect(55,58,18,18);
  ctx.fillRect(81,58,9,18);
  ctx.fillStyle='#e6f4ff';ctx.font='bold 33px sans-serif';
  ctx.fillText(os.name||'PC LAB · firmware',112,84);
  ctx.font='22px sans-serif';ctx.fillStyle='#a9bed2';
  ctx.fillText('EMULACIÓN EDUCATIVA • INTERFAZ ORIGINAL',55,126);
  if(visual.kind==='no-boot'||visual.kind==='blocked'){
    ctx.fillStyle='#e4ae7b';ctx.font='bold 47px sans-serif';
    ctx.fillText(visual.kind==='blocked'?'CONFIGURACIÓN INCOMPATIBLE':'NO HAY DISPOSITIVO ARRANCABLE',
      75,295,1370);
    ctx.fillStyle='#e3eaf4';ctx.font='30px sans-serif';
    ctx.fillText(visual.message||'Comprueba el firmware y los medios de arranque.',75,360,1360);
    ctx.fillStyle='#a9becf';ctx.font='26px monospace';
    ctx.fillText('UEFI → Orden de arranque → USB / Disco interno',75,430);
    ctx.fillText('Inserta un USB instalador, o instala un SO en la unidad.',75,482);
  }else if(visual.kind==='installer'||visual.kind==='installing'||visual.kind==='splash'){
    ctx.fillStyle='#ffffff';ctx.font='bold 58px sans-serif';
    ctx.fillText(visual.kind==='installer'?'Preparar instalación':
      visual.kind==='installing'?'Instalando sistema':visual.kind==='installed'?'Instalación completada':'Iniciando sesión',76,282);
    ctx.fillStyle='#cbdaef';ctx.font='30px sans-serif';
    ctx.fillText(visual.kind==='installer'?'Selecciona «Instalar SO» desde el panel de arranque.':
      visual.kind==='installing'?'Copiando archivos ficticios y preparando servicios…':
      visual.kind==='installed'?'Retira el USB o cambia el orden para arrancar desde el disco.':
      'Iniciando servicios y escritorio simulado…',76,340);
    const progress=visual.kind==='installer'?0:(visual.progress||0);
    ctx.fillStyle='#26384d';ctx.fillRect(76,415,w-160,18);
    ctx.fillStyle=accent;ctx.fillRect(76,415,(w-160)*progress/100,18);
    ctx.fillStyle='#e5f5ff';ctx.font='25px monospace';
    ctx.fillText(progress+'%'+(visual.kind==='installer'?' · Unidad lista para instalar':''),76,469);
  }else if(visual.kind==='desktop'){
    // Interfaz propia: tarjetas geométricas, sin reproducir barras, iconos o logotipos comerciales.
    ctx.fillStyle='#172b3a';ctx.fillRect(35,158,w-70,h-235);
    for(let i=0;i<3;i++){
      const x=75+i*470;
      ctx.fillStyle=['#23485d','#374463','#234d48'][i];ctx.fillRect(x,224,414,320);
      ctx.fillStyle=accent;ctx.fillRect(x+25,255,70,8);
      ctx.fillStyle='#f1f7ff';ctx.font='bold 30px sans-serif';
      ctx.fillText(['Explorador','Estado del sistema','Consola de aprendizaje'][i],x+25,337,370);
      ctx.fillStyle='#d5e3ef';ctx.font='23px sans-serif';
      ctx.fillText(['Discos y archivos simulados','Red y recursos de hardware',
        'Sesión ficticia activa'][i],x+25,390,365);
    }
    ctx.fillStyle='#08131f';ctx.fillRect(35,h-105,w-70,68);
    ctx.fillStyle='#b1cbdc';ctx.font='25px sans-serif';
    ctx.fillText(os.name+' · Escritorio de demostración',75,h-60);
  }
  ctx.fillStyle='#90aabd';ctx.font='19px sans-serif';
  ctx.fillText('PC LAB · No es un sistema operativo real',55,h-33);
  return true;
}
root.PC_OS=Object.freeze({CATALOG,BOOT_LABELS,storageCapacityGb,installedDiskReady,
  requirement,canInstall,resolveBoot,installRecord,presentation,paint});
})(typeof window!=='undefined'?window:globalThis);
