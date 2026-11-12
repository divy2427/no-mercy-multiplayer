/* Shared rules for online rooms and browser-local computer matches. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.NoMercy=factory();})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const COLORS=['red','blue','green','yellow'];
const ACTIONS=['draw2','draw4','skip','reverse','discardAll','skipAll'];
const WILDS=['reverse4','draw6','draw10','roulette'];
const DRAW={draw2:2,draw4:4,reverse4:4,draw6:6,draw10:10};
const LABELS={draw2:'+2',draw4:'+4',reverse4:'↔ +4',draw6:'+6',draw10:'+10',roulette:'?',skip:'⊘',reverse:'↔',discardAll:'ALL',skipAll:'↻'};
let serial=0;
const id=()=> 'c'+Date.now().toString(36)+(serial++).toString(36);
function shuffle(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
function defaultRules(){return {numbers:Array.from({length:10},(_,i)=>String(i)),actions:ACTIONS.slice(),wildCounts:{reverse4:8,draw6:4,draw10:4,roulette:8},startingCards:7,stacking:true,swap7:true,pass0:true,mercyLimit:25};}
function normalizeRules(input){
 const defaults=defaultRules();if(input===undefined)return defaults;
 if(!input||typeof input!=='object'||Array.isArray(input))throw Error('Invalid room rules.');
 const r={...defaults,wildCounts:{...defaults.wildCounts}};
 for(const [key,allowed] of [['numbers',defaults.numbers],['actions',ACTIONS]]){
  if(input[key]!==undefined){if(!Array.isArray(input[key])||input[key].some(v=>!allowed.includes(v))||new Set(input[key]).size!==input[key].length)throw Error('Invalid '+key+' selection.');r[key]=input[key].slice();}
 }
 if(!r.numbers.length)throw Error('Enable at least one number card for the opening discard.');
 if(input.wildCounts!==undefined){if(!input.wildCounts||typeof input.wildCounts!=='object'||Array.isArray(input.wildCounts))throw Error('Invalid wild card counts.');for(const key of WILDS){const value=input.wildCounts[key]??r.wildCounts[key];if(!Number.isInteger(value)||value<0||value>20)throw Error('Each wild-card count must be a whole number from 0 to 20.');r.wildCounts[key]=value;}}
 for(const key of ['stacking','swap7','pass0'])if(input[key]!==undefined){if(typeof input[key]!=='boolean')throw Error('Invalid '+key+' rule.');r[key]=input[key];}
 for(const [key,min,max] of [['startingCards',3,12],['mercyLimit',10,50]])if(input[key]!==undefined){if(!Number.isInteger(input[key])||input[key]<min||input[key]>max)throw Error((key==='startingCards'?'Starting hand size':'Mercy limit')+' must be a whole number from '+min+' to '+max+'.');r[key]=input[key];}
 if(r.mercyLimit<=r.startingCards)throw Error('Mercy limit must be greater than starting cards.');
 if(deckSize(r)<r.startingCards*2+1)throw Error('Your deck is too small for two players. Enable more cards, increase wild counts, or reduce starting cards.');
 return r;
}
function deckSize(r=defaultRules()){return r.numbers.length*8+r.actions.reduce((n,value)=>n+(['draw4','skipAll'].includes(value)?8:12),0)+WILDS.reduce((n,k)=>n+r.wildCounts[k],0);}
function capacity(r){return Math.min(8,Math.floor((deckSize(r)-1)/r.startingCards));}
function makeDeck(options){const rules=normalizeRules(options),d=[];for(const color of COLORS){for(const value of rules.numbers)for(let i=0;i<2;i++)d.push({id:id(),color,value});for(const value of rules.actions)for(let i=0;i<(['draw4','skipAll'].includes(value)?2:3);i++)d.push({id:id(),color,value});}for(const value of WILDS)for(let i=0;i<rules.wildCounts[value];i++)d.push({id:id(),color:'wild',value});return shuffle(d);}
function points(c){return c.color==='wild'?50:/^[0-9]$/.test(c.value)?Number(c.value):20;}
function create(code,scoreMode=false,options){const rules=normalizeRules(options);return {code,rules,revision:0,history:[],handNumber:0,matchNumber:1,knockouts:0,roundPlayerCount:0,scoreMode:!!scoreMode,players:[],hostId:null,status:'lobby',deck:[],discard:[],reserve:[],direction:1,activeColor:null,currentPlayerId:null,message:'Waiting for players.',winner:null,matchWinner:null,pendingDraw:0,stackMin:0,choice:null,forcedCardId:null,unoVulnerable:[],roundPoints:0,revealed:[],dealer:-1};}
function playerName(value){
 if(typeof value!=='string')throw Error('Enter a player name.');
 const name=value.trim().normalize('NFC');
 if(!name||/[\u0000-\u001f\u007f]/.test(name))throw Error('Enter a player name without control characters.');
 if([...name].length>18)throw Error('Player names must be 18 characters or fewer.');
 return name;
}
function add(room,player){player.name=playerName(player.name);if(room.players.some(p=>p.name.toLocaleLowerCase()===player.name.toLocaleLowerCase()))throw Error('That name is already in this room. Choose another name.');if(!['lobby','finished'].includes(room.status))throw Error('This hand has already started. Wait until it finishes to join.');if(room.players.length>=capacity(room.rules))throw Error('Room is full. This deck supports '+capacity(room.rules)+' players.');Object.assign(player,{hand:[],eliminated:false,unoDeclared:false,score:0});room.players.push(player);room.revision++;if(!room.hostId)room.hostId=player.id;room.message=player.name+' joined ('+room.players.length+'/'+capacity(room.rules)+').';}
function living(r){return r.players.filter(p=>!p.eliminated);}
function next(r,from=r.currentPlayerId,steps=1){let i=r.players.findIndex(p=>p.id===from);for(let n=0;n<steps;n++){let guard=0;do{i=(i+r.direction+r.players.length)%r.players.length;}while(r.players[i].eliminated&&++guard<r.players.length);}return r.players[i];}
function take(r){if(!r.deck.length){r.deck=shuffle([...r.discard.slice(0,-1),...r.reserve]);r.reserve=[];r.discard=r.discard.slice(-1);}return r.deck.pop()||null;}
function finish(r,p){if(!p||r.status!=='playing')return;r.status='finished';r.winner=p.name;r.currentPlayerId=null;r.choice=null;r.forcedCardId=null;r.unoVulnerable=[];r.pendingDraw=0;r.stackMin=0;r.roundPoints=r.players.filter(q=>q.id!==p.id&&!q.eliminated).reduce((sum,q)=>sum+q.hand.reduce((a,c)=>a+points(c),0),0)+250*r.knockouts;if(r.scoreMode){p.score+=r.roundPoints;if(p.score>=1000)r.matchWinner=p.name;}r.history.push({hand:r.handNumber,match:r.matchNumber,winnerId:p.id,winner:p.name,points:r.roundPoints,reason:living(r).length===1?(r.knockouts===r.roundPlayerCount-1?'Mercy':'Last standing'):'Empty hand',time:Date.now()});r.history=r.history.slice(-100);r.message=p.name+' wins the hand!'+(r.scoreMode?' +'+r.roundPoints+' points.':'')+(r.matchWinner?' '+p.name+' wins the 1000-point match!':'');}
function checkMercy(r,p){if(p.hand.length<r.rules.mercyLimit||p.eliminated)return false;p.eliminated=true;r.knockouts++;r.reserve.push(...p.hand);p.hand=[];p.unoDeclared=false;r.unoVulnerable=r.unoVulnerable.filter(x=>x!==p.id);r.message=p.name+' reached '+r.rules.mercyLimit+' cards and is out (Mercy).';if(living(r).length===1)finish(r,living(r)[0]);return true;}
function drawCards(r,p,count){let got=0;while(got<count&&!p.eliminated){const c=take(r);if(!c)break;p.hand.push(c);got++;p.unoDeclared=false;if(checkMercy(r,p))break;}return got;}
function start(r){if(r.players.length<2||r.players.length>capacity(r.rules))throw Error('This deck supports 2–'+capacity(r.rules)+' players.');if(r.players.some(p=>p.connected===false))throw Error('Wait for disconnected players to return, or ask them to leave.');if(r.matchWinner){r.players.forEach(p=>p.score=0);r.matchNumber++;}Object.assign(r,{status:'playing',deck:makeDeck(r.rules),discard:[],reserve:[],direction:1,activeColor:null,currentPlayerId:null,winner:null,matchWinner:null,pendingDraw:0,stackMin:0,choice:null,forcedCardId:null,unoVulnerable:[],roundPoints:0,revealed:[]});r.handNumber++;r.knockouts=0;r.roundPlayerCount=r.players.length;r.players.forEach(p=>{p.hand=[];p.eliminated=false;p.unoDeclared=false;});
// Reserve a number for the opening so even a tiny custom number set can be dealt safely.
const opening=r.deck.splice(r.deck.findIndex(c=>/^[0-9]$/.test(c.value)),1)[0];
for(let i=0;i<r.rules.startingCards;i++)r.players.forEach(p=>drawCards(r,p,1));r.discard=[opening];r.activeColor=opening.color;r.dealer=(r.dealer+1)%r.players.length;r.currentPlayerId=r.players[(r.dealer+1)%r.players.length].id;r.message='Hand '+r.handNumber+' dealt. Match color, number or symbol. Call UNO at one card!';}
function canPlay(r,p,c){if(r.status!=='playing'||p.eliminated||r.currentPlayerId!==p.id||r.choice)return false;if(r.forcedCardId)return c.id===r.forcedCardId;if(r.pendingDraw)return r.rules.stacking&&(DRAW[c.value]||0)>=r.stackMin;const top=r.discard.at(-1);return c.color==='wild'||c.color===r.activeColor||c.value===top?.value;}
function synchronizeUno(r,before,actor){for(const p of living(r)){const previous=before.get(p.id)||[];const changed=previous.length!==p.hand.length||previous.some((c,i)=>c.id!==p.hand[i]?.id);if(changed){const declared=p.id===actor&&p.unoDeclared;p.unoDeclared=!!declared&&p.hand.length===1;r.unoVulnerable=r.unoVulnerable.filter(x=>x!==p.id);if(p.hand.length===1&&!p.unoDeclared)r.unoVulnerable.push(p.id);}}}
function advance(r,from,steps=1){if(r.status==='playing')r.currentPlayerId=next(r,from,steps).id;}
function applyAction(r,playerId,data){const p=r.players.find(q=>q.id===playerId);if(!p)throw Error('Player not found.');if(data.type==='start'){if(playerId!==r.hostId)throw Error('Only the host can deal.');if(r.status==='playing')throw Error('A hand is already in progress.');start(r);return;}
if(r.status!=='playing'||p.eliminated)throw Error(p.eliminated?'You are out this hand. Spectate or play the next hand.':'Start a hand first.');
if(data.type==='uno'){if(p.hand.length===1){p.unoDeclared=true;r.unoVulnerable=r.unoVulnerable.filter(x=>x!==p.id);r.message=p.name+' called UNO!';return;}if(p.hand.length===2&&r.currentPlayerId===p.id){p.unoDeclared=true;r.message=p.name+' is calling UNO on their next play.';return;}throw Error('Call UNO when you have one card, or just before playing from two.');}
if(data.type==='catchUno'){const target=r.players.find(q=>q.id===data.targetId);if(!target||target.id===p.id||target.hand.length!==1||target.unoDeclared||!r.unoVulnerable.includes(target.id))throw Error('That player cannot be caught now.');r.unoVulnerable=r.unoVulnerable.filter(x=>x!==target.id);drawCards(r,target,2);r.message=p.name+' caught '+target.name+' without UNO: draw 2!';return;}
if(r.currentPlayerId!==p.id)throw Error('Wait for your turn.');
const before=new Map(r.players.map(q=>[q.id,q.hand.slice()]));
if(r.choice){if(data.type!=='chooseColor'||!COLORS.includes(data.color))throw Error('Choose a color for Color Roulette.');r.unoVulnerable=[];r.choice=null;r.activeColor=data.color;r.revealed=[];let got=0,card;do{card=take(r);if(!card)break;r.revealed.push(card);p.hand.push(card);got++;p.unoDeclared=false;if(checkMercy(r,p))break;}while(card.color!==data.color);if(r.status==='playing'){r.message=p.name+' drew '+got+' cards in '+data.color+' roulette.'+(p.eliminated?' Mercy: out!':'');advance(r,p.id);}synchronizeUno(r,before,p.id);return;}
if(data.type==='draw'){
 if(r.forcedCardId)throw Error('Play the card you just drew.');
 if(r.pendingDraw){r.revealed=[];r.unoVulnerable=[];const amount=r.pendingDraw;r.pendingDraw=0;r.stackMin=0;const count=drawCards(r,p,amount);if(r.status==='playing'){r.message=p.name+' took the '+amount+'-card stack ('+count+' drawn).'+(p.eliminated?' Mercy: out!':'');advance(r,p.id);}synchronizeUno(r,before,p.id);return;}
 if(p.hand.some(c=>canPlay(r,p,c)))throw Error('You have a matching card. Play it instead of drawing.');
 r.revealed=[];r.unoVulnerable=[];let count=0,c;while(!p.eliminated){c=take(r);if(!c)break;p.hand.push(c);count++;p.unoDeclared=false;if(checkMercy(r,p))break;if(canPlay(r,p,c)){r.forcedCardId=c.id;break;}}
 if(r.status==='playing'){r.message=p.name+' drew '+count+' card(s).'+(p.eliminated?' Mercy: out!':r.forcedCardId?' Play the highlighted card.':' No cards available; turn passes.');if(!r.forcedCardId)advance(r,p.id);}synchronizeUno(r,before,p.id);return;
}
if(data.type!=='play')throw Error('Unknown game action.');
const card=p.hand.find(c=>c.id===data.cardId);if(!card||!canPlay(r,p,card))throw Error(r.pendingDraw?'Stack a draw card of +'+r.stackMin+' or higher, or take the penalty.':'That card does not match.');
if(card.color==='wild'&&card.value!=='roulette'&&!COLORS.includes(data.color))throw Error('Choose the next color.');
const target=card.value==='7'&&r.rules.swap7&&p.hand.length>1?r.players.find(q=>q.id===data.targetId&&q.id!==p.id&&!q.eliminated):null;
if(card.value==='7'&&r.rules.swap7&&p.hand.length>1&&!target)throw Error('Choose a player to swap hands with.');
r.revealed=[];r.unoVulnerable=[];r.forcedCardId=null;p.hand.splice(p.hand.indexOf(card),1);
if(card.value==='discardAll'){const extras=p.hand.filter(c=>c.color===card.color);p.hand=p.hand.filter(c=>c.color!==card.color);r.discard.push(...extras);}
r.discard.push(card);r.activeColor=card.color==='wild'?(data.color||null):card.color;
r.message=p.name+' played '+(LABELS[card.value]||card.value)+'.';
if(!p.hand.length){finish(r,p);return;}
if(card.value==='reverse'||card.value==='reverse4')r.direction*=-1;
if(DRAW[card.value]){r.pendingDraw+=DRAW[card.value];r.stackMin=DRAW[card.value];r.currentPlayerId=card.value==='reverse4'&&living(r).length===2?p.id:next(r,p.id).id;r.message+=r.rules.stacking?' Stack is +'+r.pendingDraw+'; respond with +'+r.stackMin+' or higher, or draw.':' Draw +'+r.pendingDraw+' and miss your turn (stacking is off).';}
else if(card.value==='roulette'){const victim=next(r,p.id);r.currentPlayerId=victim.id;r.choice={type:'roulette',playerId:victim.id};r.message=victim.name+' must choose a color for roulette.';}
else if(card.value==='skipAll'||(card.value==='reverse'&&living(r).length===2))r.currentPlayerId=p.id;
else {if(card.value==='7'&&r.rules.swap7){[p.hand,target.hand]=[target.hand,p.hand];p.unoDeclared=false;target.unoDeclared=false;r.message+=' Swapped hands with '+target.name+'.';}if(card.value==='0'&&r.rules.pass0){const active=living(r),hands=new Map(active.map(q=>[q.id,q.hand]));for(const q of active){next(r,q.id).hand=hands.get(q.id);}active.forEach(q=>q.unoDeclared=false);r.message+=' All hands passed '+(r.direction===1?'clockwise.':'counterclockwise.');}advance(r,p.id,card.value==='skip'?2:1);}
synchronizeUno(r,before,p.id);
}
function act(r,playerId,data){
 if(!data||typeof data!=='object'||Array.isArray(data))throw Error('Invalid game action.');
 if(data.revision!==undefined&&data.revision!==r.revision)throw Error('The table changed. Check the updated hand and try again.');
 applyAction(r,playerId,data);r.revision++;
}
function publicState(r,viewer){const p=r.players.find(q=>q.id===viewer);return {code:r.code,revision:r.revision,rules:r.rules,deckSize:deckSize(r.rules),maxPlayers:capacity(r.rules),history:r.history,handNumber:r.handNumber,matchNumber:r.matchNumber,status:r.status,hostId:r.hostId,players:r.players.map(q=>({id:q.id,name:q.name,count:q.hand.length,connected:q.connected!==false,bot:!!q.bot,eliminated:q.eliminated,unoDeclared:q.unoDeclared,score:q.score})),currentPlayerId:r.currentPlayerId,direction:r.direction,top:r.discard.at(-1)||null,activeColor:r.activeColor,hand:p?.hand||[],playableCardIds:p?p.hand.filter(c=>canPlay(r,p,c)).map(c=>c.id):[],pendingDraw:r.pendingDraw,stackMin:r.stackMin,choice:r.choice,forcedCardId:r.forcedCardId,unoVulnerable:r.unoVulnerable.slice(),scoreMode:r.scoreMode,roundPoints:r.roundPoints,rouletteRevealed:r.revealed||[],matchWinner:r.matchWinner,message:r.message,winner:r.winner,canDraw:!!p&&r.status==='playing'&&!p.eliminated&&r.currentPlayerId===p.id&&!r.choice&&!r.forcedCardId&&(r.pendingDraw>0||!p.hand.some(c=>canPlay(r,p,c)))};}
function remove(r,pid){const index=r.players.findIndex(p=>p.id===pid);if(index<0)return;const p=r.players[index],successor=r.status==='playing'&&living(r).length>1?next(r,pid).id:null;r.reserve.push(...p.hand);r.players.splice(index,1);r.revision++;r.unoVulnerable=r.unoVulnerable.filter(x=>x!==pid);if(r.hostId===pid)r.hostId=r.players[0]?.id||null;if(!r.players.length)return;if(r.status==='playing'){if(living(r).length===1)finish(r,living(r)[0]);else if(r.currentPlayerId===pid){r.currentPlayerId=successor;r.choice=null;r.forcedCardId=null;}}if(r.status!=='finished')r.message=p.name+' left the room.';}
function botAction(r,pid){const p=r.players.find(q=>q.id===pid);if(!p||p.eliminated||r.status!=='playing')return null;const uncaught=r.players.find(q=>q.id!==pid&&r.unoVulnerable.includes(q.id)&&q.hand.length===1&&!q.unoDeclared);if(uncaught)return {type:'catchUno',targetId:uncaught.id};if(p.hand.length===1&&!p.unoDeclared)return {type:'uno'};if(r.currentPlayerId!==pid)return null;const color=COLORS.slice().sort((a,b)=>p.hand.filter(c=>c.color===b).length-p.hand.filter(c=>c.color===a).length)[0];if(r.choice)return {type:'chooseColor',color};if(p.hand.length===2&&!p.unoDeclared)return {type:'uno'};const legal=p.hand.filter(c=>canPlay(r,p,c));if(!legal.length)return {type:'draw'};legal.sort((a,b)=>{const score=c=>c.value==='discardAll'?p.hand.filter(x=>x.color===c.color).length*30:DRAW[c.value]?20+DRAW[c.value]:c.color==='wild'?-5:5;return score(b)-score(a);});const card=legal[0],target=living(r).filter(q=>q.id!==pid).sort((a,b)=>a.hand.length-b.hand.length)[0];return {type:'play',cardId:card.id,color,targetId:target?.id};}
return {COLORS,ACTIONS,WILDS,DRAW,LABELS,defaultRules,normalizeRules,deckSize,capacity,playerName,create,add,start,act,publicState,makeDeck,canPlay,remove,botAction,points,living,checkMercy,drawCards};
});
