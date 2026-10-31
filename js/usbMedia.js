// PC LAB 8.22 — medios USB físicos, persistentes y multiboot.
// Las ISO y el particionado son simulados; no se crean dispositivos reales.
(function(root){
'use strict';
const STORAGE='hardware-simulator-usb-media-v1';
const ISO=Object.freeze({
  novadesk:Object.freeze({id:'novadesk',file:'NovaDesk_11_x64.iso',gb:5.4}),
  libreforge:Object.freeze({id:'libreforge',file:'LibreForge_24.iso',gb:2.8}),
  terminalis:Object.freeze({id:'terminalis',file:'Terminalis_1.iso',gb:.9})
});
const CAPACITIES=[32,64];
// El navegador almacena inventario educativo, nunca datos personales.
// Los datos locales son modificables por el usuario: revalidarlos al leer.
const MAX_LOCAL_BYTES=48_000,MAX_DEVICES=64,MAX_SERIAL=999_999;
const clone=x=>JSON.parse(JSON.stringify(x));
function createLibrary(storage){
  let seq=0,drives=[];
  try{
    const raw=storage?.getItem(STORAGE)||'null';
    if(raw.length>MAX_LOCAL_BYTES)throw new Error('Estado local demasiado grande');
    const saved=JSON.parse(raw);
    if(saved&&Array.isArray(saved.drives)){
      const seen=new Set();
      for(const d of saved.drives.slice(0,MAX_DEVICES)){
        if(!d||typeof d!=='object'||Array.isArray(d)||
          !/^USB-[1-9]\d{0,5}$/.test(d.id)||seen.has(d.id)||
          !CAPACITIES.includes(d.capacityGb)||!['blank','ventoy'].includes(d.mode)||
          !Array.isArray(d.images))continue;
        const items=[...new Set(d.images.filter(x=>
          typeof x==='string'&&Object.hasOwn(ISO,x)))].slice(0,3);
        const valid=d.mode==='ventoy'&&
          items.reduce((n,x)=>n+ISO[x].gb,.064)<=d.capacityGb?items:[];
        seen.add(d.id);
        // Lista blanca de campos: sin propiedades arbitrarias de JSON.
        drives.push({id:d.id,capacityGb:d.capacityGb,mode:d.mode,
          partition:d.mode==='ventoy'&&['GPT','MBR'].includes(d.partition)?
            d.partition:d.mode==='ventoy'?'GPT':null,
          filesystem:d.mode==='ventoy'?'exFAT':null,
          images:valid,bootable:d.mode==='ventoy'});
      }
      seq=Math.max(...drives.map(d=>Number(d.id.slice(4))),0);
      if(Number.isInteger(saved.seq)&&saved.seq>=seq&&saved.seq<=MAX_SERIAL)
        seq=saved.seq;
    }
  }catch(_e){}
  const persist=()=>{try{storage?.setItem(STORAGE,JSON.stringify({seq,drives}));}catch(_e){}};
  const find=id=>drives.find(d=>d.id===id);
  const list=()=>clone(drives);
  const get=id=>{const d=find(id);return d?clone(d):null;};
  const freeGb=d=>Math.round((d.capacityGb-(d.mode==='ventoy'?.064:0)-
    d.images.reduce((sum,id)=>sum+ISO[id].gb,0))*1000)/1000;
  function acquire(capacityGb=32){
    if(!CAPACITIES.includes(capacityGb))return {ok:false,reason:'Capacidad no disponible.'};
    if(drives.length>=MAX_DEVICES||seq>=MAX_SERIAL)
      return {ok:false,reason:'Límite de memorias del taller alcanzado.'};
    const d={id:'USB-'+(++seq),capacityGb,mode:'blank',partition:null,images:[],
      filesystem:null,bootable:false};
    drives.push(d);persist();return {ok:true,drive:clone(d)};
  }
  function installVentoy(id,partition='GPT',confirmed=false){
    const d=find(id);
    if(!d)return {ok:false,reason:'No se encuentra ese USB físico.'};
    if(!['GPT','MBR'].includes(partition))return {ok:false,reason:'Selecciona GPT o MBR.'};
    if(!confirmed)return {ok:false,requiresConfirmation:true,
      reason:'Instalar Ventoy borra todas las particiones y archivos de esta memoria.'};
    d.mode='ventoy';d.partition=partition;d.filesystem='exFAT';
    d.images=[];d.bootable=true;persist();
    return {ok:true,drive:clone(d),reason:'Ventoy instalado. La partición de datos está vacía.'};
  }
  function copyISO(id,iso){
    const d=find(id),image=ISO[iso];
    if(!d||d.mode!=='ventoy')return {ok:false,reason:'Primero instala Ventoy en esta memoria.'};
    if(!image)return {ok:false,reason:'Imagen ISO desconocida.'};
    if(d.images.includes(iso))return {ok:false,reason:'Esa imagen ya está copiada.'};
    if(freeGb(d)<image.gb)return {ok:false,reason:'No queda espacio suficiente para '+image.file+'.'};
    d.images.push(iso);persist();
    return {ok:true,drive:clone(d),reason:image.file+' copiada sin reformatear.'};
  }
  function removeISO(id,iso){
    const d=find(id);if(!d||!d.images.includes(iso))return false;
    d.images=d.images.filter(x=>x!==iso);persist();return true;
  }
  function remove(id){
    const i=drives.findIndex(d=>d.id===id);
    if(i<0)return false;drives.splice(i,1);persist();return true;
  }
  function inspect(id){
    const d=find(id);return d?{...clone(d),freeGb:freeGb(d),
      images:d.images.map(k=>ISO[k])}:null;
  }
  return {acquire,installVentoy,copyISO,removeISO,remove,get,list,inspect,freeGb:id=>{
    const d=find(id);return d?freeGb(d):null;}};
}
root.PC_USB=Object.freeze({STORAGE,ISO,CAPACITIES,createLibrary});
})(typeof window==='undefined'?globalThis:window);
