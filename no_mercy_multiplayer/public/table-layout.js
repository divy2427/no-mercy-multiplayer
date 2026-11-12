/* Shared layout math: keep gameplay wide even when the browser stays portrait. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.TableLayout=factory();})(typeof globalThis!=='undefined'?globalThis:this,function(){
 function viewport(width,height){const virtual=width<height&&width<=900;return {width:virtual?height:width,height:virtual?width:height,virtual,compact:(virtual?width:height)<=600};}
 const seats={1:[],2:[[50,1]],3:[[0,40],[100,40]],4:[[0,44],[50,0],[100,44]],5:[[0,48],[28,0],[72,0],[100,48]],6:[[0,52],[12,3],[50,-3],[88,3],[100,52]],7:[[0,56],[0,10],[34,-2],[66,-2],[100,10],[100,56]],8:[[0,56],[0,10],[28,-2],[50,-5],[72,-2],[100,10],[100,56]]};
 function seat(count,index){return index===0?[0,100]:(seats[count]||seats[8])[index-1];}
 function fan(count,index){return Math.max(-13,Math.min(13,(index-(count-1)/2)*Math.min(3.6,32/Math.max(1,count))));}
 function hand(count,width,height){
  const availableWidth=Math.max(40,width-206),n=Math.max(1,count);
  const capacity=Math.max(1,Math.floor((availableWidth-100)/18)+1),rows=Math.ceil(n/capacity),columns=Math.ceil(n/rows);
  const areaHeight=Math.max(120,Math.min(220,height*.46)),cardHeight=Math.max(8,Math.min(160,(areaHeight-30)/rows-10)),cardWidth=cardHeight*.68;
  const step=columns===1?0:Math.min(cardWidth*.68,(availableWidth-cardWidth-54)/(columns-1));
  return {rows,columns,cardHeight,cardWidth,areaHeight,availableWidth,step};
 }
 function cardPosition(fit,count,index){
  const row=Math.floor(index/fit.columns),col=index%fit.columns,n=Math.min(fit.columns,count-row*fit.columns),t=n===1?0:(col/(n-1)*2-1);
  const span=fit.cardWidth+(n-1)*fit.step;
  return {left:6+(fit.availableWidth-span)/2+col*fit.step,bottom:8+(fit.rows-row-1)*(fit.cardHeight+14)+(1-t*t)*14,angle:t*11};
 }
 return {viewport,seat,fan,hand,cardPosition};
});

