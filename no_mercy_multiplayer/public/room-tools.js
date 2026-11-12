/* Room setup, read-only rules summary and completed-hand records. */
const RoomTools=(()=>{
 const $=id=>document.getElementById(id),G=NoMercy;
 const names={draw2:'Draw 2',draw4:'Draw 4',skip:'Skip',reverse:'Reverse',discardAll:'Discard All',skipAll:'Skip Everyone',reverse4:'Wild Reverse +4',draw6:'Wild +6',draw10:'Wild +10',roulette:'Color Roulette'};
 const palette=['#dbff65','#6de2b4','#7ab7ff','#ffa7bd','#d5b0ff','#ffcd74','#86dedb','#f3ebc7'];
 let current=null,lastRendered='';
 function checkbox(group,value,text){const label=document.createElement('label');label.className='card-toggle';const input=document.createElement('input');input.type='checkbox';input.dataset[group]=value;input.checked=true;const caption=document.createElement('span');caption.textContent=text;label.append(input,caption);return label;}
 function readRules(){
  if([...document.querySelectorAll('[data-wild]')].some(e=>e.value.trim()===''))throw Error('Enter a count from 0 to 20 for every wild-card type.');
  return G.normalizeRules({numbers:[...document.querySelectorAll('[data-number]:checked')].map(e=>e.dataset.number),actions:[...document.querySelectorAll('[data-action]:checked')].map(e=>e.dataset.action),wildCounts:Object.fromEntries([...document.querySelectorAll('[data-wild]')].map(e=>[e.dataset.wild,Number(e.value)])),startingCards:Number($('startingCards').value),mercyLimit:Number($('mercyLimit').value),stacking:$('enableStacking').checked,swap7:$('enableSwap').checked,pass0:$('enablePass').checked});
 }
 function preview(){try{const rules=readRules(),size=G.deckSize(rules),capacity=G.capacity(rules);$('deckPreview').textContent=size+' cards · up to '+capacity+' players · '+rules.startingCards+' cards each';$('rulesValidation').textContent='';$('customBadge').textContent=JSON.stringify(rules)===JSON.stringify(G.defaultRules())?'Standard deck':'Custom deck';}catch(e){$('deckPreview').textContent='Check your deck settings';$('rulesValidation').textContent=e.message;$('customBadge').textContent='Needs attention';}}
 function resetDefaults(){const r=G.defaultRules();document.querySelectorAll('[data-number],[data-action]').forEach(e=>e.checked=true);document.querySelectorAll('[data-wild]').forEach(e=>e.value=r.wildCounts[e.dataset.wild]);$('startingCards').value=r.startingCards;$('mercyLimit').value=r.mercyLimit;$('enableStacking').checked=$('enableSwap').checked=$('enablePass').checked=true;preview();}
 G.defaultRules().numbers.forEach(n=>$('numberCards').append(checkbox('number',n,n)));
 G.ACTIONS.forEach(value=>$('actionCards').append(checkbox('action',value,names[value])));
 G.WILDS.forEach(value=>{const label=document.createElement('label');label.textContent=names[value];const input=document.createElement('input');input.type='number';input.min='0';input.max='20';input.step='1';input.value=G.defaultRules().wildCounts[value];input.dataset.wild=value;input.setAttribute('aria-label',names[value]+' count');label.append(input);$('wildCards').append(label);});
 $('customRules').addEventListener('input',preview);$('resetRules').onclick=resetDefaults;preview();
 function summary(rules){const r=rules||G.defaultRules();return [G.deckSize(r)+' cards; '+r.startingCards+' dealt per player; Mercy at '+r.mercyLimit+'.','Numbers: '+r.numbers.join(', ')+'.','Action cards: '+(r.actions.map(k=>names[k]).join(', ')||'None')+'.','Wild counts: '+G.WILDS.map(k=>names[k]+' × '+r.wildCounts[k]).join('; ')+'.','Stacking '+(r.stacking?'ON':'OFF')+' · 7 swaps '+(r.swap7?'ON':'OFF')+' · 0 passes '+(r.pass0?'ON':'OFF')+'.'].join('\n');}
 function svgElement(tag,attributes={},text){const e=document.createElementNS('http://www.w3.org/2000/svg',tag);for(const [key,value]of Object.entries(attributes))e.setAttribute(key,String(value));if(text!==undefined)e.textContent=text;return e;}
 function drawHistory(){
  const records=current?.history||[],compact=TableLayout.viewport(window.innerWidth,window.innerHeight).compact,key=JSON.stringify(records)+'|'+compact;if(key===lastRendered&&$('historyChart').childNodes.length)return;lastRendered=key;
  $('historyCount').textContent=records.length?records.length+' completed hand'+(records.length===1?'':'s')+' recorded. '+(records.length===100?'Latest 100 only.':''):'Finish a hand to record its winner and points.';
  $('historyChart').replaceChildren();$('historyRows').replaceChildren();$('historyLegend').replaceChildren();$('exportHistory').disabled=!records.length;
  $('historyEmpty').classList.toggle('hidden',!!records.length);$('historyTableWrap').classList.toggle('hidden',!records.length);
  if(!records.length)return;
  const recent=records.slice(-12),winnerIds=[...new Set(records.map(r=>r.winnerId))],colorFor=id=>palette[winnerIds.indexOf(id)%palette.length];
  winnerIds.forEach(id=>{const name=records.find(r=>r.winnerId===id).winner,chip=document.createElement('span');const dot=document.createElement('i');dot.style.background=colorFor(id);chip.append(dot,document.createTextNode(name));$('historyLegend').append(chip);});
  const svg=svgElement('svg',{viewBox:'0 0 680 '+(compact?154:260),role:'img','aria-label':'Hand points earned by each winner, most recent '+recent.length+' completed hands'});svg.append(svgElement('title',{},'Completed-hand points'),svgElement('desc',{},recent.map(r=>'Hand '+r.hand+': '+r.winner+', '+r.points+' points, '+r.reason).join('. ')));
  const max=Math.max(10,...recent.map(r=>r.points)),ceiling=Math.ceil(max/10)*10,left=46,top=compact?16:22,width=614,height=compact?100:188;
  for(let i=0;i<=4;i++){const y=top+height-i*height/4;svg.append(svgElement('line',{x1:left,y1:y,x2:left+width,y2:y,stroke:'#385057','stroke-width':1}),svgElement('text',{x:left-9,y:y+4,'text-anchor':'end',fill:'#b1c5be','font-size':11},String(Math.round(ceiling*i/4))));}
  const step=width/recent.length;
  recent.forEach((r,i)=>{const h=r.points/ceiling*height,x=left+step*i+step*.17,bw=Math.min(step*.66,76),offset=(step*.66-bw)/2;const bar=svgElement('rect',{x:x+offset,y:top+height-Math.max(2,h),width:bw,height:Math.max(2,h),rx:4,fill:colorFor(r.winnerId),tabindex:0});bar.append(svgElement('title',{},'Hand '+r.hand+' · '+r.winner+' · '+r.points+' points · '+r.reason));svg.append(bar,svgElement('text',{x:x+offset+bw/2,y:Math.max(14,top+height-h-7),'text-anchor':'middle',fill:'#eef5f2','font-size':12},String(r.points)),svgElement('text',{x:x+offset+bw/2,y:top+height+24,'text-anchor':'middle',fill:'#c2d8cb','font-size':11},'H'+r.hand));});
  $('historyChart').append(svg);
  records.slice().reverse().forEach(r=>{const row=document.createElement('tr');for(const value of [r.hand,r.winner,r.points,r.reason,'M'+r.match]){const cell=document.createElement('td');cell.textContent=value;row.append(cell);}$('historyRows').append(row);});
 }
 function setState(state){current=state;$('historyOpen').textContent='History · '+(state.history?.length||0);$('activeRules').textContent=summary(state.rules);$('activeRulesHeading').textContent='This room’s rules';if($('historyDialog').open)drawHistory();}
 $('historyOpen').onclick=()=>{drawHistory();$('historyDialog').showModal();};$('historyClose').onclick=()=>$('historyDialog').close();
 $('roomRules').onclick=()=>$('rules').showModal();
 $('exportHistory').onclick=()=>{const records=current?.history||[];if(!records.length)return;const quote=value=>{let s=String(value);if(/^[=+@-]/.test(s))s="'"+s;return '"'+s.replaceAll('"','""')+'"';};const rows=[['Hand','Winner','Points earned','Victory','Match','Completed UTC'],...records.map(r=>[r.hand,r.winner,r.points,r.reason,r.match,new Date(r.time).toISOString()])];const blob=new Blob(['\uFEFF'+rows.map(row=>row.map(quote).join(',')).join('\r\n')],{type:'text/csv;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='no-mercy-hand-records.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
 function closeMenu(){document.body.classList.remove('game-menu-open');$('tableMenu').setAttribute('aria-expanded','false');}
 async function enterFullscreen(){
  try {
   if(document.fullscreenElement){await document.exitFullscreen();return;}
   if(document.documentElement.requestFullscreen)await document.documentElement.requestFullscreen();
   if(screen.orientation?.lock)await screen.orientation.lock('landscape');
  } catch { /* CSS landscape view remains usable when the browser cannot lock orientation. */ }
 }
 const fullscreen=$('fullScreen');fullscreen.hidden=false;fullscreen.onclick=enterFullscreen;$('landscapeScreen').onclick=enterFullscreen;
 $('tableMenu').onclick=()=>{const open=document.body.classList.toggle('game-menu-open');$('tableMenu').setAttribute('aria-expanded',String(open));};
 document.addEventListener('click',event=>{if(!event.target.closest('#tableMenu')&&!event.target.closest('#tableActions'))closeMenu();});
 document.querySelectorAll('#tableActions button').forEach(button=>button.addEventListener('click',closeMenu));
 document.addEventListener('fullscreenchange',()=>{fullscreen.textContent=document.fullscreenElement?'Exit full screen':'Full screen';if(!document.fullscreenElement)screen.orientation?.unlock?.();});
 $('activeRules').textContent=summary();
 return {readRules,setState,reset(){current=null;lastRendered='';$('historyDialog').close();if(document.fullscreenElement)document.exitFullscreen().catch(()=>{});$('activeRulesHeading').textContent='Standard rules';$('activeRules').textContent=summary();}};
})();
