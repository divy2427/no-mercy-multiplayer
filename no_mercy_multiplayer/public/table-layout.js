/* Shared layout math: keep gameplay wide even when the browser stays portrait. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.TableLayout=factory();})(typeof globalThis!=='undefined'?globalThis:this,function(){
 function viewport(width,height){const virtual=width<height&&width<=900;return {width:virtual?height:width,height:virtual?width:height,virtual,compact:(virtual?width:height)<=600};}
 const seats={1:[],2:[[50,1]],3:[[0,40],[100,40]],4:[[0,44],[50,0],[100,44]],5:[[0,48],[28,0],[72,0],[100,48]],6:[[0,52],[12,3],[50,-3],[88,3],[100,52]],7:[[0,56],[0,10],[34,-2],[66,-2],[100,10],[100,56]],8:[[0,56],[0,10],[28,-2],[50,-5],[72,-2],[100,10],[100,56]]};
 function seat(count,index){return index===0?[0,100]:(seats[count]||seats[8])[index-1];}
 function fan(count,index){return Math.max(-13,Math.min(13,(index-(count-1)/2)*Math.min(3.6,32/Math.max(1,count))));}
 return {viewport,seat,fan};
});
