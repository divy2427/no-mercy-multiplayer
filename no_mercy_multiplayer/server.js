const express = require("express");
const http = require("http");
const { WebSocketServer } = require("ws");
const crypto = require("crypto");

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });
app.use(express.static("public"));
app.get("/health", (_, res) => res.json({ ok: true }));

const rooms = new Map();
const COLORS = ["red", "blue", "green", "yellow"];
const SUITS = ["0","1","2","3","4","5","6","7","8","9","skip","reverse","draw2"];
const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function roomCode() {
  let code;
  do {
    code = Array.from({length: 6}, () => CODE_CHARS[Math.floor(Math.random()*CODE_CHARS.length)]).join("");
  } while (rooms.has(code));
  return code;
}
function makeDeck() {
  const deck = [];
  for (const color of COLORS) {
    deck.push({id:crypto.randomUUID(), color, value:"0"});
    for (let n=1;n<=9;n++) {
      deck.push({id:crypto.randomUUID(), color, value:String(n)});
      deck.push({id:crypto.randomUUID(), color, value:String(n)});
    }
    for (const value of ["skip","reverse","draw2"]) {
      deck.push({id:crypto.randomUUID(), color, value});
      deck.push({id:crypto.randomUUID(), color, value});
    }
  }
  for (let i=0;i<4;i++) deck.push({id:crypto.randomUUID(), color:"wild", value:"wild"});
  for (let i=0;i<4;i++) deck.push({id:crypto.randomUUID(), color:"wild", value:"wild4"});
  return shuffle(deck);
}
function shuffle(a) {
  for (let i=a.length-1;i>0;i--) { const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; }
  return a;
}
function draw(room, player, count=1) {
  for (let i=0;i<count;i++) {
    if (!room.deck.length) {
      const top = room.discard.pop();
      room.deck = shuffle(room.discard);
      room.discard = [top];
    }
    if (room.deck.length) player.hand.push(room.deck.pop());
  }
}
function publicState(room, viewerId) {
  return {
    code: room.code, status: room.status, hostId: room.hostId,
    players: room.players.map(p => ({id:p.id, name:p.name, count:p.hand.length, connected:p.connected})),
    currentPlayerId: room.currentPlayerId,
    direction: room.direction,
    top: room.discard[room.discard.length-1],
    activeColor: room.activeColor,
    hand: room.players.find(p=>p.id===viewerId)?.hand || [],
    message: room.message,
    winner: room.winner || null
  };
}
function sendRoom(room) {
  for (const p of room.players) {
    if (p.ws && p.ws.readyState === 1) {
      p.ws.send(JSON.stringify({type:"state", state:publicState(room,p.id)}));
    }
  }
}
function tell(room, msg) { room.message = msg; sendRoom(room); }
function nextIndex(room, from=room.players.findIndex(p=>p.id===room.currentPlayerId)) {
  return (from + room.direction + room.players.length) % room.players.length;
}
function startGame(room) {
  if (room.players.length < 4 || room.players.length > 6) return tell(room,"A game needs 4–6 players.");
  room.deck = makeDeck(); room.discard=[]; room.direction=1; room.activeColor=null; room.winner=null;
  room.players.forEach(p=>p.hand=[]);
  room.players.forEach(p=>draw(room,p,7));
  let first = room.deck.pop();
  while (first.color==="wild") { room.deck.unshift(first); first=room.deck.pop(); }
  room.discard.push(first); room.activeColor=first.color;
  room.status="playing"; room.currentPlayerId=room.players[0].id;
  tell(room,"Game started! Match the colour or value.");
}
function canPlay(card, top, activeColor) {
  return card.color==="wild" || card.color===activeColor || card.value===top.value;
}
function playCard(room, player, cardId, chosenColor) {
  if (room.status!=="playing" || room.currentPlayerId!==player.id) return;
  const idx=player.hand.findIndex(c=>c.id===cardId);
  if (idx<0) return;
  const card=player.hand[idx], top=room.discard[room.discard.length-1];
  if (!canPlay(card,top,room.activeColor)) return tell(room,"That card doesn't match the colour or value.");
  player.hand.splice(idx,1); room.discard.push(card);
  room.activeColor = card.color==="wild" ? (COLORS.includes(chosenColor)?chosenColor:COLORS[0]) : card.color;
  if (!player.hand.length) { room.status="finished"; room.winner=player.name; return tell(room,`${player.name} wins!`); }
  if (card.value==="reverse" && room.players.length>2) room.direction *= -1;
  if (card.value==="skip") room.currentPlayerId=room.players[nextIndex(room)].id;
  else {
    if (card.value==="draw2" || card.value==="wild4") {
      const victim=room.players[nextIndex(room)];
      draw(room,victim,card.value==="draw2"?2:4);
      room.currentPlayerId=room.players[nextIndex(room,nextIndex(room))].id;
    } else room.currentPlayerId=room.players[nextIndex(room)].id;
  }
  tell(room,`${player.name} played ${card.value}.`);
}
function handle(ws, msg) {
  let data; try { data=JSON.parse(msg); } catch { return; }
  if (data.type==="create" || data.type==="join") {
    const name=String(data.name||"Player").trim().slice(0,18) || "Player";
    let room;
    if (data.type==="create") {
      const code=roomCode();
      room={code,hostId:null,players:[],status:"lobby",deck:[],discard:[],direction:1,activeColor:null,currentPlayerId:null,message:"Waiting for players.",winner:null};
      rooms.set(code,room);
    } else room=rooms.get(String(data.code||"").toUpperCase());
    if (!room) return ws.send(JSON.stringify({type:"error",message:"Room not found. Check the code."}));
    if (room.status!=="lobby") return ws.send(JSON.stringify({type:"error",message:"That game has already started."}));
    if (room.players.length>=6) return ws.send(JSON.stringify({type:"error",message:"Room is full (6 players max)."}));
    const player={id:crypto.randomUUID(),name,hand:[],ws,connected:true};
    room.players.push(player); if (!room.hostId) room.hostId=player.id;
    ws.playerId=player.id; ws.roomCode=room.code;
    ws.send(JSON.stringify({type:"joined",id:player.id,code:room.code}));
    tell(room,`${name} joined (${room.players.length}/6).`);
    return;
  }
  const room=rooms.get(ws.roomCode);
  const player=room?.players.find(p=>p.id===ws.playerId);
  if (!room || !player) return;
  if (data.type==="start") {
    if (player.id!==room.hostId) return;
    if (room.players.length<4) return tell(room,"Need at least 4 players to start.");
    startGame(room);
  } else if (data.type==="play") {
    playCard(room,player,data.cardId,data.color);
  } else if (data.type==="draw") {
    if (room.status!=="playing" || room.currentPlayerId!==player.id) return;
    draw(room,player,1);
    room.currentPlayerId=room.players[nextIndex(room)].id;
    tell(room,`${player.name} drew a card.`);
  } else if (data.type==="leave") {
    removePlayer(room,player.id);
  }
}
function removePlayer(room,id) {
  const i=room.players.findIndex(p=>p.id===id);
  if (i<0) return;
  const [p]=room.players.splice(i,1);
  if (room.hostId===id) room.hostId=room.players[0]?.id || null;
  if (!room.players.length) rooms.delete(room.code);
  else {
    if (room.currentPlayerId===id) room.currentPlayerId=room.players[0].id;
    tell(room,`${p.name} left the room.`);
  }
}
wss.on("connection", ws => {
  ws.on("message", msg => handle(ws,msg));
  ws.on("close", () => {
    const room=rooms.get(ws.roomCode);
    const player=room?.players.find(p=>p.id===ws.playerId);
    if (player) { player.connected=false; player.ws=null; tell(room,`${player.name} disconnected.`); }
  });
});
const port=process.env.PORT || 3000;
server.listen(port,()=>console.log(`Game server listening on ${port}`));
