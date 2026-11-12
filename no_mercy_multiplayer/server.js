const express=require('express');
const http=require('http');
const {WebSocketServer}=require('ws');
const crypto=require('crypto');
const Game=require('./public/engine');
const app=express(),server=http.createServer(app),wss=new WebSocketServer({server,maxPayload:16384});
app.use(express.static(require('path').join(__dirname,'public')));
app.get('/health',(_,res)=>res.json({ok:true}));
const rooms=new Map();
const CHARS='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
function code(){let c;do{c=Array.from({length:6},()=>CHARS[Math.floor(Math.random()*CHARS.length)]).join('');}while(rooms.has(c));return c;}
function send(ws,data){if(ws.readyState===1)ws.send(JSON.stringify(data));}
function broadcast(room){room.players.forEach(p=>{if(p.ws)send(p.ws,{type:'state',state:Game.publicState(room,p.id)});});}
function joined(ws,room,p){send(ws,{type:'joined',id:p.id,code:room.code,token:p.resumeToken});broadcast(room);}
function handle(ws,raw){let data;try{data=JSON.parse(raw);}catch{return;}if(!data||typeof data!=='object')return;
 if(data.type==='ping')return send(ws,{type:'pong'});
 if(data.type==='resume'){
  const room=rooms.get(String(data.code||'').toUpperCase()),p=room?.players.find(p=>p.id===data.id&&p.resumeToken===data.token);
  if(!p)return send(ws,{type:'error',code:'resume_failed',message:'Your previous room is no longer available. The server may have restarted. Create or join a new room.'});
  const old=p.ws;p.ws=ws;p.connected=true;ws.playerId=p.id;ws.roomCode=room.code;
  if(old&&old!==ws)old.close(4001,'Session resumed in another connection');
  room.message=p.name+' reconnected.';joined(ws,room,p);return;
 }
 if(data.type==='create'||data.type==='join'){
  if(ws.playerId)return;
  let room;if(data.type==='create'){room=Game.create(code(),data.scoreMode===true,data.rules);rooms.set(room.code,room);}else room=rooms.get(String(data.code||'').toUpperCase());
  if(!room)throw Error('Room not found. Check the code.');
  const p={id:crypto.randomUUID(),resumeToken:crypto.randomBytes(32).toString('hex'),name:String(data.name||'Player').trim().slice(0,18)||'Player',ws,connected:true};
  Game.add(room,p);ws.playerId=p.id;ws.roomCode=room.code;joined(ws,room,p);return;
 }
 const room=rooms.get(ws.roomCode),p=room?.players.find(p=>p.id===ws.playerId);
 if(!room||!p||p.ws!==ws)return;
 if(data.type==='leave'){Game.remove(room,p.id);ws.playerId=null;ws.roomCode=null;if(!room.players.length)rooms.delete(room.code);else broadcast(room);return;}
 Game.act(room,p.id,data);broadcast(room);
}
wss.on('connection',ws=>{
 ws.on('error',err=>console.warn('WebSocket error:',err.message));
 ws.on('message',raw=>{try{handle(ws,raw);}catch(err){send(ws,{type:'error',message:err.message});}});
 ws.on('close',()=>{const room=rooms.get(ws.roomCode),p=room?.players.find(p=>p.id===ws.playerId);if(p&&p.ws===ws){p.connected=false;p.ws=null;room.message=p.name+' disconnected. Waiting for reconnection.';broadcast(room);}});
});
const port=process.env.PORT||3000;
server.listen(port,()=>console.log('Game server listening on '+port));
