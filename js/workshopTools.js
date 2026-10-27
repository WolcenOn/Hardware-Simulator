// Economía separada de los encargos y medición eléctrica completamente ficticia.
(function(root){
'use strict';
const STORAGE='hardware-simulator.workshop.8.14';
const ITEMS=Object.freeze({
 screwdriver:{label:'Destornillador de precisión',icon:'🪛',price:0},
 multimeter:{label:'Multímetro digital',icon:'📟',price:48},
 esdStrap:{label:'Pulsera antiestática ESD reutilizable',icon:'⚡',price:16},
 usbWriter:{label:'USB instalador reutilizable (32 GB)',icon:'💾',price:22},
 gpuTest:{label:'Tarjeta gráfica de prueba',icon:'🎮',price:85},
 ramDdr4:{label:'RAM DDR4 de prueba',icon:'🧪',price:34},
 ramDdr5:{label:'RAM DDR5 de prueba',icon:'🧪',price:44},
 brush:{label:'Brochas antiestáticas',icon:'🖌️',price:9},
 vacuum:{label:'Aspiradora para electrónica ESD',icon:'🧹',price:62},
 alcohol:{label:'Alcohol isopropílico (4 limpiezas)',icon:'🧴',price:12,units:4},
 wipes:{label:'Toallitas sin pelusa (6 usos)',icon:'🧻',price:6,units:6},
 airDuster:{label:'Aire técnico',icon:'💨',price:14,units:4},
 cleaner:{label:'Limpiador de contactos',icon:'🧴',price:16,units:3}
});
function meterRead({mode='vdc',jack='vohm',point='psu12',powered=false,
 psu=false,sata=false,fan=false,fuseBlown=false}={}){
 const volts={psu12:12,psu5:5,psu33:3.3,sata5:5};
 const voltagePoint=Object.hasOwn(volts,point);
 if(jack==='amp'&&powered&&psu&&voltagePoint)
   return {value:'⚡ CORTO',spark:true,
     message:'Chispazo ficticio: borne A conectado en paralelo a una tensión. Fusible virtual fundido.'};
 if(mode==='adc'){
   if(jack!=='amp')return {value:'LEAd',message:'Conecta la punta roja al borne A.'};
   if(fuseBlown)return {value:'FUSE',message:'Fusible A fundido; debes sustituirlo.'};
   if(point!=='fanSeries')return {value:'Err',message:'La corriente se mide en serie, nunca en paralelo con una fuente.'};
   return {value:(powered&&psu&&fan?.18:0).toFixed(2)+' A',
     message:'Corriente ficticia de ventilador; mide en serie.'};
 }
 if(jack!=='vohm')return {value:'LEAd',message:'Utiliza el borne VΩ para esta magnitud.'};
 if(mode==='ohm'){
   if(powered)return {value:'STOP',message:'No midas resistencia ni continuidad con el PC encendido.'};
   if(point!=='sataWire')return {value:'OL',message:'Selecciona los extremos del cable para medir continuidad.'};
   return {value:sata?'0.3 Ω':'OL',message:sata?
     'Continuidad simulada en cable SATA.':'Circuito abierto simulado; revisa el cable.'};
 }
 if(!voltagePoint)return {value:'—',message:'Elige un punto de tensión para la escala V.'};
 if(mode==='vac')return {value:'0.0 V~',message:'En esta fuente DC no se simula tensión alterna.'};
 const v=powered&&psu?volts[point]:0;
 return {value:v.toFixed(1)+' V⎓',message:v?
   'Medición DC ficticia. Negro a COM/masa; rojo a VΩ.':'Punto sin alimentación: 0 V en esta simulación.'};
}
function createBank(storage){
 let state={cash:300,earned:0,tools:{screwdriver:true},supplies:{},rewarded:{},fuseBlown:false};
 try{
   const raw=JSON.parse(storage?.getItem(STORAGE)||'null');
   if(raw&&Number.isFinite(raw.cash)&&raw.cash>=0){
     state.cash=raw.cash;state.earned=Number.isFinite(raw.earned)?raw.earned:0;
     for(const id of Object.keys(ITEMS)){
       if(!ITEMS[id].units&&raw.tools?.[id])state.tools[id]=true;
       if(ITEMS[id].units&&Number.isInteger(raw.supplies?.[id]))
         state.supplies[id]=Math.max(0,Math.min(999,raw.supplies[id]));
     }
     if(raw.rewarded&&typeof raw.rewarded==='object')
       state.rewarded=Object.fromEntries(Object.keys(raw.rewarded).slice(0,100).map(id=>[id,true]));
     state.fuseBlown=!!raw.fuseBlown;
   }
 }catch(_e){/* localStorage privado o no disponible */}
 function persist(){try{storage?.setItem(STORAGE,JSON.stringify(state));}catch(_e){}}
 function owns(id){return !!state.tools[id]||(state.supplies[id]||0)>0;}
 function buy(id){
   const item=ITEMS[id];if(!item)return {ok:false,reason:'Artículo inexistente'};
   if(!item.units&&state.tools[id])return {ok:false,reason:'Ya pertenece al taller'};
   if(state.cash<item.price)return {ok:false,reason:'Fondo de taller insuficiente'};
   state.cash-=item.price;
   if(item.units)state.supplies[id]=(state.supplies[id]||0)+item.units;
   else state.tools[id]=true;
   persist();return {ok:true,id,price:item.price};
 }
 function use(id){
   const item=ITEMS[id];if(!item||!owns(id))return false;
   if(item.units){state.supplies[id]--;persist();}
   return true;
 }
 function useMany(ids){
   if(!Array.isArray(ids)||ids.length===0||
      ids.some(id=>!ITEMS[id]||!ITEMS[id].units))return false;
   const needs={};
   for(const id of ids)needs[id]=(needs[id]||0)+1;
   if(Object.entries(needs).some(([id,n])=>(state.supplies[id]||0)<n))return false;
   for(const [id,n]of Object.entries(needs))state.supplies[id]-=n;
   persist();return true;
 }
 function reward(caseId){
   if(!caseId||state.rewarded[caseId])return false;
   state.rewarded[caseId]=true;state.cash+=110;state.earned+=110;persist();return true;
 }
 function shortCircuit(){state.fuseBlown=true;persist();}
 function replaceFuse(){
   if(!state.fuseBlown||state.cash<5)return false;
   state.cash-=5;state.fuseBlown=false;persist();return true;
 }
 function snapshot(){return JSON.parse(JSON.stringify(state));}
 return {owns,buy,use,useMany,reward,shortCircuit,replaceFuse,snapshot,
   list:()=>Object.keys(ITEMS).filter(owns)};
}
root.PC_WORKSHOP_TOOLS=Object.freeze({ITEMS,createBank,meterRead,STORAGE});
})(typeof window==='undefined'?globalThis:window);
