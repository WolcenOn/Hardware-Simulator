import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const window={};
vm.runInNewContext(fs.readFileSync(new URL('../js/timeEngine.js',import.meta.url),'utf8'),
 {window,console,Math,Number,Object,RangeError,TypeError});
const {PC_TIME}=window;
test('tres velocidades tienen minutos reproducibles',()=>{
 assert.equal(PC_TIME.duration(10,'careful'),14);
 assert.equal(PC_TIME.duration(10,'normal'),10);
 assert.equal(PC_TIME.duration(10,'fast'),7);
 for(let i=0;i<20;i++)assert.equal(PC_TIME.duration(8,'fast',2,0),6.2);
});
test('minutos técnicos, de cliente y espera se contabilizan por separado',()=>{
 const clock=PC_TIME.createClock();
 clock.add('technical',8.8,'fit:board');
 clock.add('customer',2,'briefing');
 clock.add('waiting',3.2,'delivery');
 assert.equal(clock.getSummary().total,14);
 assert.equal(clock.getSummary().technical,8.8);
 assert.equal(clock.getSummary().customer,2);
 assert.equal(clock.getSummary().waiting,3.2);
});
test('velocidad y dificultad sólo afectan al tiempo simulado, no al reloj real',()=>{
 const clock=PC_TIME.createClock();
 clock.setSpeed('fast');
 assert.equal(clock.calculate(10,3,0),8.4);
 clock.setSpeed('careful');
 assert.equal(clock.calculate(10,3,0),16.8);
 assert.equal(clock.getSummary().total,0);
});
test('se rechazan velocidades y tiempos inválidos',()=>{
 const clock=PC_TIME.createClock();
 assert.throws(()=>clock.setSpeed('unsafe'),/Velocidad/);
 assert.throws(()=>clock.add('technical',-2),/Tiempo/);
 assert.throws(()=>clock.add('unknown',2),/Categoría/);
 assert.throws(()=>PC_TIME.duration(1,'fast',6),/Dificultad/);
});
