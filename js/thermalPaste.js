// Hardware Simulator 8.12: aplicación de pasta y expansión progresiva por tornillos.
// Modelo 2D didáctico determinista; NO reproduce la reología ni el par reales.
(function(root){
'use strict';
const N=35, MIN=-.18,MAX=1.18, STEP=(MAX-MIN)/N;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const POINTS=Object.freeze([{id:'s1',x:.25,y:.25},{id:'s2',x:.75,y:.25},
 {id:'s3',x:.25,y:.75},{id:'s4',x:.75,y:.75}]);
const coords=Array.from({length:N*N},(_,i)=>({x:MIN+((i%N)+.5)*STEP,y:MIN+(Math.floor(i/N)+.5)*STEP}));
const region=coords.map(p=>p.x>=0&&p.x<=1&&p.y>=0&&p.y<=1);
function empty(){return new Float64Array(N*N);}
function splat(grid,x,y,amount,radius=.038){
  const weights=coords.map(p=>Math.exp(-((p.x-x)**2+(p.y-y)**2)/(2*radius*radius)));
  const sum=weights.reduce((a,b)=>a+b,0);
  for(let i=0;i<grid.length;i++)grid[i]+=amount*weights[i]/sum;
}
function measure(grid,volume){
  let inside=0,outside=0,covered=0;
  const active=region.filter(Boolean).length;
  for(let i=0;i<grid.length;i++){
    if(region[i]){inside+=grid[i];if(grid[i]>=.00023)covered++;}
    else outside+=grid[i];
  }
  const coverage=Math.round(100*covered/active);
  const overflow=volume>0?Math.round(1000*outside/volume)/10:0;
  const quality=volume<.53||coverage<64?'insufficient':
    volume>1.75||overflow>11?'excessive':
    coverage<76?'uneven':'good';
  return {coverage,overflow,quality,volume:Math.round(volume*100)/100,
    inside:Math.round(inside*100)/100,unit:'dosis simulada'};
}
function makeSyringe(){
  let x=.5,y=.5,flow=0,used=0,pressed=false;
  const grid=empty(),dots=[];
  let confirmed=false;
  return Object.freeze({
    pointer(nx,ny){
      if(confirmed||!Number.isFinite(nx)||!Number.isFinite(ny))return false;
      x=clamp(nx,0,1);y=clamp(ny,0,1);return true;
    },
    pump(down){if(confirmed)return false;pressed=!!down;return true;},
    advance(ms){
      if(confirmed||!Number.isFinite(ms)||ms<0)return null;
      const dt=clamp(ms,0,80)/1000;
      const target=pressed?1.0:0;
      // Viscosidad: la salida tarda en crecer y decae tras soltar el émbolo.
      const tau=pressed?.24:.17;
      flow+=(target-flow)*(1-Math.exp(-dt/tau));
      const volume=Math.min(3-used,flow*dt*.47);
      if(volume>0.00001){
        splat(grid,x,y,volume);
        const last=dots.at(-1);
        if(last&&Math.abs(last.x-x)<.016&&Math.abs(last.y-y)<.016)last.volume+=volume;
        else dots.push({x,y,volume});
        used+=volume;
      }
      return this.getState();
    },
    getState(){return {stage:confirmed?'ready':'dispense',x,y,flow:Math.round(flow*100)/100,
      pressed,used:Math.round(used*1000)/1000,capacity:3,remaining:Math.round((3-used)*1000)/1000,
      dots:dots.map(d=>({...d}))};},
    confirm(){
      if(confirmed||used<.01)return null;
      confirmed=true;pressed=false;
      return {dots:dots.map(d=>({...d})),volume:used};
    }
  });
}
function createSpread(deposits){
  const grid=empty();let volume=0;
  for(const d of deposits||[]){
    if(!Number.isFinite(d.x)||!Number.isFinite(d.y)||!Number.isFinite(d.volume)||d.volume<=0)continue;
    volume+=d.volume;splat(grid,clamp(d.x,0,1),clamp(d.y,0,1),d.volume);
  }
  const screws=[0,0,0,0],history=[];
  let peakImbalance=0;
  function diffuse(anchorIndex){
    const anchor=POINTS[anchorIndex];
    for(let k=0;k<4;k++){
      const next=empty();
      for(let i=0;i<grid.length;i++){
        const v=grid[i];if(v<=0)continue;
        const p=coords[i];
        const proximity=Math.exp(-((p.x-anchor.x)**2+(p.y-anchor.y)**2)/.26);
        // La presión local aumenta la movilidad de la pasta cercana
        // y la empuja radialmente; el resultado depende del orden real.
        const rate=.09+.16*proximity;
        let moved=v*rate;next[i]+=v-moved;
        const row=Math.floor(i/N),col=i%N;
        const dx=p.x-anchor.x,dy=p.y-anchor.y;
        const neighbors=[[col-1,row,1-.55*dx],[col+1,row,1+.55*dx],
          [col,row-1,1-.55*dy],[col,row+1,1+.55*dy]]
          .filter(([c,r])=>c>=0&&c<N&&r>=0&&r<N);
        const total=neighbors.reduce((s,a)=>s+a[2],0);
        for(const [c,r,w]of neighbors)next[r*N+c]+=moved*w/total;
      }
      grid.set(next);
    }
  }
  return Object.freeze({
    tighten(index,depth){
      if(!Number.isInteger(index)||index<0||index>=4||
        !Number.isFinite(depth))return false;
      const target=clamp(Math.round(depth),0,100);
      const old=screws[index],change=target-old;
      if(change<0){screws[index]=target;history.push({anchor:POINTS[index].id,depth:target,kind:'loosen'});return this.getState();}
      if(change===0)return this.getState();
      screws[index]=target;
      peakImbalance=Math.max(peakImbalance,Math.max(...screws)-Math.min(...screws));
      // Por cada avance equivalente al 10 % hacemos un pulso de presión.
      for(let i=0;i<Math.ceil(change/10);i++)diffuse(index);
      history.push({anchor:POINTS[index].id,depth:target,kind:'tighten'});
      return this.getState();
    },
    getState(){
      const readings=measure(grid,volume);
      const dif=Math.max(...screws)-Math.min(...screws);
      const tightened=screws.filter(x=>x===100).length;
      const balance=100-dif;
      const finalQuality=tightened===4&&readings.quality==='good'&&peakImbalance>65?
        'unbalanced':readings.quality;
      return {...readings,quality:finalQuality,screws:[...screws],tightened,balance,
        peakImbalance,
        history:history.map(x=>({...x})),
        cells:Array.from(grid,(v,i)=>({
          x:Math.round(coords[i].x*1000)/1000,
          y:Math.round(coords[i].y*1000)/1000,
          mass:Math.round(v*1000000)/1000000
        })).filter(p=>p.mass>.00003)};
    }
  });
}
root.PC_THERMAL_PASTE=Object.freeze({POINTS,makeSyringe,createSpread,measure});
})(typeof window!=='undefined'?window:globalThis);
