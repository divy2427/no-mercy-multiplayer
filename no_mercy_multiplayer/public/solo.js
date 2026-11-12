/* Computer games run entirely in this browser. No server or hidden opponent hands are needed by the AI policy. */
class LocalGameSocket {
 constructor(opponents){this.readyState=0;this.opponents=opponents;this.timer=null;setTimeout(()=>{if(this.readyState!==0)return;this.readyState=1;this.onopen?.();},0);}
 emit(data){if(this.readyState===1)this.onmessage?.({data:JSON.stringify(data)});}
 state(){this.emit({type:'state',state:NoMercy.publicState(this.room,'human')});}
 schedule(){clearTimeout(this.timer);if(this.readyState!==1||this.room?.status!=='playing')return;const p=this.room.players.find(p=>p.bot&&!p.eliminated&&p.hand.length===1&&!p.unoDeclared)||this.room.players.find(p=>p.id===this.room.currentPlayerId&&p.bot);if(!p)return;this.timer=setTimeout(()=>{if(this.readyState!==1)return;try{const action=NoMercy.botAction(this.room,p.id);if(action)NoMercy.act(this.room,p.id,action);this.state();this.schedule();}catch(e){this.emit({type:'error',message:e.message});}},1300);}
 send(raw){if(this.readyState!==1)return;const data=JSON.parse(raw);try{
  if(data.type==='ping'){this.emit({type:'pong'});return;}
  if(data.type==='create'){const room=NoMercy.create('COMPUTER',data.scoreMode,data.rules);if(this.opponents+1>NoMercy.capacity(room.rules))throw Error('This deck supports only '+NoMercy.capacity(room.rules)+' players. Choose fewer computer opponents or add more cards.');this.room=room;NoMercy.add(this.room,{id:'human',name:data.name,connected:true});for(let i=0;i<this.opponents;i++)NoMercy.add(this.room,{id:'bot'+i,name:(['Nova','Blaze','Pixel','Echo','Orbit','Ace','Luna'][i]+' CPU').toLocaleLowerCase()===data.name.toLocaleLowerCase()?'CPU '+(i+1):['Nova','Blaze','Pixel','Echo','Orbit','Ace','Luna'][i]+' CPU',bot:true,connected:true});this.emit({type:'joined',id:'human',code:'COMPUTER'});NoMercy.start(this.room);this.state();this.schedule();return;}
  if(data.type==='leave'){this.close();return;}
  NoMercy.act(this.room,'human',data);this.state();this.schedule();
 }catch(e){this.emit({type:'error',message:e.message});}}
 close(){clearTimeout(this.timer);this.readyState=3;this.onclose?.({code:1000});}
}
