const assert = require('node:assert/strict');
const layout = require('../public/table-layout');
assert.deepEqual(layout.viewport(390,844),{width:844,height:390,virtual:true,compact:true});
assert.deepEqual(layout.viewport(844,390),{width:844,height:390,virtual:false,compact:true});
assert.equal(layout.viewport(1280,720).compact,false);
for(let n=2;n<=8;n++){
 const positions=[];
 for(let i=1;i<n;i++){const p=layout.seat(n,i);assert.equal(p.length,2);assert.ok(p.every(Number.isFinite));positions.push(p.join(','));}
 assert.equal(new Set(positions).size,n-1);
}
for(let n=1;n<=50;n++)for(let i=0;i<n;i++)assert.ok(Math.abs(layout.fan(n,i))<=13);
console.log('Landscape viewport, seating and hand-fan checks passed.');
