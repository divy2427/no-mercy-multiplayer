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

for(const [width,height] of [[568,320],[844,390],[720,360],[1280,720]])for(let count=1;count<=49;count++){
 const fit=layout.hand(count,width,height);
 assert.ok(fit.rows*fit.columns>=count);
 assert.ok(fit.cardWidth*fit.columns+4*(fit.columns-1)<=fit.availableWidth+.001);
 assert.ok(fit.cardHeight*fit.rows+4*(fit.rows-1)<=fit.areaHeight-12+.001);
 assert.ok(fit.cardHeight>0);
}
console.log('All 1–49 card hands fit without scrolling at four viewport sizes.');
