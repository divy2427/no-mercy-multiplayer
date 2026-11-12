const express=require('express');
const http=require('http');
const {WebSocketServer}=require('ws');
const crypto=require('crypto');
const Game=require('./public/engine');
const app=express(),server=http.createServer(app),wss=new WebSocketServer({server,maxPayload:16384});
app.disable('x-powered-by');
app.use(express.static(require('path').join(__dirname,'public')));
app.get('/health',(_,res)=>res.json({ok:true}));
const rooms=new Map(),CHARS='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const grace=Number(process.env.RECONNECT_GRACE_MS)||120000;
function code(){let c;do{c=Array.from({length:6},()=>CHARS[crypto.randomInt(CHARS.length)]).join('');}while(rooms.has(c));return c;}
function send(ws,data){if(ws.readyState===1)ws.send(JSON.stringify(data));}
function broadcast(room){room.players.forEach(p=>{if(p.ws)send(p.ws,{type:'state',state:Game.publicState(room,p.id)});});}
function joined(ws,room,p){send(ws,{type:'joined',id:p.id,code:room.code,token:p.resumeToken});broadcast(room);}
function leave(room,p){clearTimeout(p.expiry);Game.remove(room,p.id);if(!room.players.length)rooms.delete(room.code);else broadcast(room);}
function handle(ws,raw){let data;try{data=JSON.parse(raw);}catch{throw Error('Invalid message.');}if(!data||typeof data!=='object'||Array.isArray(data))throw Error('Invalid message.');
 if(data.type==='ping')return send(ws,{type:'pong'});
 if(data.type==='resume'){
  if(ws.playerId)throw Error('This connection already has a seat. Leave it before resuming another.');
  const room=rooms.get(String(data.code||'').toUpperCase()),p=room?.players.find(p=>p.id===data.id&&p.resumeToken===data.token);
  if(!p)return send(ws,{type:'error',code:'resume_failed',message:'Your previous room is no longer available. It may have expired or the server restarted. Create or join a new room.'});
  clearTimeout(p.expiry);const old=p.ws;p.ws=ws;p.connected=true;ws.playerId=p.id;ws.roomCode=room.code;
  if(old&&old!==ws)old.close(4001,'Session resumed in another connection');
  room.revision++;room.message=p.name+' reconnected.';joined(ws,room,p);return;
 }
 if(data.type==='create'||data.type==='join'){
  if(ws.playerId)throw Error('This connection already has a seat.');
  const name=Game.playerName(data.name);
  let room;if(data.type==='create')room=Game.create(code(),data.scoreMode===true,data.rules);else room=rooms.get(String(data.code||'').trim().toUpperCase());
  if(!room)throw Error('Room not found. Check the code.');
  const p={id:crypto.randomUUID(),resumeToken:crypto.randomBytes(32).toString('hex'),name,ws,connected:true};
  Game.add(room,p);if(data.type==='create')rooms.set(room.code,room);
  ws.playerId=p.id;ws.roomCode=room.code;joined(ws,room,p);return;
 }
 const room=rooms.get(ws.roomCode),p=room?.players.find(p=>p.id===ws.playerId);
 if(!room||!p||p.ws!==ws)throw Error('Join a room before playing.');
 if(data.type==='leave'){leave(room,p);ws.playerId=null;ws.roomCode=null;return;}
 if(!Number.isInteger(data.revision)||data.revision!==room.revision){send(ws,{type:'state',state:Game.publicState(room,p.id)});return send(ws,{type:'error',code:'stale_action',message:'The table changed. Check the updated hand and try again.'});}
 Game.act(room,p.id,data);broadcast(room);
}
wss.on('connection',ws=>{
 ws.alive=true;ws.on('pong',()=>ws.alive=true);
 ws.on('error',err=>console.warn('WebSocket error:',err.message));
 ws.on('message',raw=>{try{handle(ws,raw);}catch(err){send(ws,{type:'error',message:err.message});}});
 ws.on('close',()=>{const room=rooms.get(ws.roomCode),p=room?.players.find(p=>p.id===ws.playerId);if(p&&p.ws===ws){p.connected=false;p.ws=null;room.revision++;room.message=p.name+' disconnected. Their seat is reserved briefly for reconnection.';broadcast(room);p.expiry=setTimeout(()=>{if(!p.connected&&room.players.includes(p))leave(room,p);},grace);p.expiry.unref();}});
});
const heartbeat=setInterval(()=>{for(const ws of wss.clients){if(!ws.alive){ws.terminate();continue;}ws.alive=false;ws.ping();}},30000);heartbeat.unref();
const port=process.env.PORT??3000;
server.listen(port,()=>console.log('Game server listening on '+server.address().port));
