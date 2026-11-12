// Fixed seed makes the simulation evidence reproducible.
const originalRandom=Math.random;let seed=12345;
Math.random=()=>{seed=(Math.imul(1664525,seed)+1013904223)>>>0;return seed/4294967296;};
try{require('./rules.cjs');require('./custom-rules.cjs');require('./layout.cjs');require('./review.cjs');}finally{Math.random=originalRandom;}
