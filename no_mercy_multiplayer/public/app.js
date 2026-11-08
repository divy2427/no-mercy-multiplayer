let ws, myId = null, roomCode = null, state = null, pendingCard = null, connecting = false;
let soloMode = false, pendingAction = null;
const $ = id => document.getElementById(id);
const colors = ['red', 'blue', 'green', 'yellow'];
const faces = ['😎', '😏', '🤩', '🦊', '🐼', '🤠', '🦁', '🐸'];
const palettes = ['violet', 'coral', 'mint'];
function error(message = '') { $('error').textContent = message; $('error').classList.toggle('hidden', !message); }
let session = null, connectionReady = false, reconnectTimer = null, reconnectAttempts = 0, connectPromise = null, lastSeen = Date.now();
try { session = JSON.parse(sessionStorage.getItem('no-mercy-session') || 'null'); } catch {}
function saveSession(value) {
  session = value;
  try { if (value) sessionStorage.setItem('no-mercy-session', JSON.stringify(value)); else sessionStorage.removeItem('no-mercy-session'); } catch {}
}
function disableActions() {
  connectionReady = false;
  $('create').disabled = $('join').disabled = true;
  $('draw').disabled = $('deck').disabled = $('start').disabled = $('uno').disabled = true;
  document.querySelectorAll('#hand button').forEach(button => button.disabled = true);
  if ($('colorPicker').open) $('colorPicker').close();
}
function resetRoom(message = '') {
  clearTimeout(reconnectTimer); reconnectTimer = null; reconnectAttempts = 0;
  saveSession(null); connectionReady = false;
  $('create').disabled = $('join').disabled = false;
  const previous = ws; ws = null; previous?.close();
  myId = roomCode = state = pendingCard = pendingAction = null; soloMode = false;
  $('targetPicker').close();
  $('colorPicker').close(); $('game').classList.add('hidden'); $('lobby').classList.remove('hidden'); error(message);
}
function scheduleReconnect(immediate = false) {
  if (!session || reconnectTimer) return;
  disableActions(); error('Connection interrupted. Reconnecting to your room…');
  const delay = immediate ? 0 : Math.min(1000 * 2 ** reconnectAttempts++, 10000);
  reconnectTimer = setTimeout(async () => {
    reconnectTimer = null;
    try { await connect(); } catch { scheduleReconnect(); }
  }, delay);
}
function send(message) {
  if (!connectionReady || ws?.readyState !== WebSocket.OPEN) { scheduleReconnect(true); return false; }
  ws.send(JSON.stringify(message)); return true;
}
function connect() {
  if (connectPromise) return connectPromise;
  connectPromise = new Promise((resolve, reject) => {
    const socket = soloMode ? new LocalGameSocket(Number($('botCount').value)) : new WebSocket((location.protocol === 'https:' ? 'wss' : 'ws') + '://' + location.host);
    ws = socket; connectionReady = false;
    let opened = false;
    const timeout = setTimeout(() => { reject(new Error('The game server is taking too long to respond. Please try again.')); socket.close(); }, 20000);
    socket.onopen = () => {
      opened = true; clearTimeout(timeout);
      if (socket !== ws) { socket.close(); resolve(); return; }
      lastSeen = Date.now();
      if (session) socket.send(JSON.stringify({type:'resume', ...session}));
      else connectionReady = true;
      resolve();
    };
    socket.onerror = () => reject(new Error('Could not connect to the game server. Please try again.'));
    socket.onclose = event => {
      clearTimeout(timeout);
      if (!opened) reject(new Error('Could not connect to the game server. Please try again.'));
      if (socket !== ws) return;
      disableActions();
      if (event.code === 4001) { resetRoom('This seat was opened in another tab. Create or join a room to play separately.'); return; }
      if (session) scheduleReconnect();
      else { $('create').disabled = $('join').disabled = false; error('Connection interrupted. Please try creating or joining a room again.'); }
    };
    socket.onmessage = event => {
      if (socket !== ws) return;
      lastSeen = Date.now();
      const message = JSON.parse(event.data);
      if (message.type === 'pong') return;
      if (message.type === 'error') {
        if (message.code === 'resume_failed') { resetRoom(message.message); return; }
        error(message.message); return;
      }
      if (message.type === 'joined') {
        myId = message.id; roomCode = message.code; connectionReady = true; reconnectAttempts = 0;
        if (message.token) saveSession({id:myId,code:roomCode,token:message.token});
        error(); $('lobby').classList.add('hidden'); $('game').classList.remove('hidden'); $('code').textContent = roomCode; window.scrollTo(0, 0);
      }
      if (message.type === 'state') { state = message.state; if (connectionReady) error(); render(); }
    };
  }).finally(() => { connectPromise = null; });
  return connectPromise;
}
setInterval(() => {
  if (!session) return;
  if (ws?.readyState === WebSocket.OPEN) {
    if (Date.now() - lastSeen > 60000) { ws.close(); return; }
    ws.send(JSON.stringify({type:'ping'}));
  } else if (ws?.readyState !== WebSocket.CONNECTING) scheduleReconnect();
}, 20000);
window.addEventListener('online', () => { if (session && ws?.readyState !== WebSocket.OPEN) scheduleReconnect(true); });
document.addEventListener('visibilitychange', () => {
  if (!document.hidden && session) {
    if (ws?.readyState === WebSocket.OPEN && Date.now() - lastSeen > 60000) ws.close();
    else if (ws?.readyState !== WebSocket.OPEN) scheduleReconnect(true);
  }
});
async function enter(type) {
  if (connecting || !$('name').reportValidity()) return;
  const code = $('roomInput').value.trim().toUpperCase();
  if (type === 'join' && !/^[A-Z0-9]{6}$/.test(code)) { error('Enter the 6-character code shared by your host.'); $('roomInput').focus(); return; }
  connecting = true; $('create').disabled = $('join').disabled = true; error();
  try {
    if (!ws || ws.readyState !== WebSocket.OPEN) await connect();
    send({ type, scoreMode: $('scoreMode').checked, name: $('name').value.trim() || 'Player', code });
  } catch (e) { error(e.message); }
  finally { connecting = false; $('create').disabled = $('join').disabled = false; }
}
$('roomForm').onsubmit = event => { event.preventDefault(); enter($('joinBox').classList.contains('hidden') ? 'create' : 'join'); };
$('create').onclick = event => { event.preventDefault(); enter('create'); };
$('joinToggle').onclick = () => {
  const expanded = $('joinBox').classList.toggle('hidden') === false;
  $('joinToggle').setAttribute('aria-expanded', String(expanded));
  if (expanded) $('roomInput').focus();
};
$('join').onclick = () => enter('join');
$('playComputer').onclick = () => { if (connecting || !$('name').reportValidity()) return; const old = ws; ws = null; old?.close(); saveSession(null); clearTimeout(reconnectTimer); reconnectTimer = null; soloMode = true; enter('create'); };
$('uno').onclick = () => send({type:'uno'});
$('copy').onclick = async () => { try { await navigator.clipboard.writeText(roomCode); $('copy').textContent = 'Copied!'; setTimeout(() => $('copy').textContent = 'Copy code', 1800); } catch { error('Your room code is ' + roomCode); } };
$('start').onclick = () => send({ type: 'start' });
$('draw').onclick = $('deck').onclick = () => send({ type: 'draw' });
$('leave').onclick = () => {
  if (connectionReady && ws?.readyState === WebSocket.OPEN) send({ type:'leave' });
  resetRoom();
};
$('rulesOpen').onclick = () => $('rules').showModal();
$('rulesClose').onclick = () => $('rules').close();
$('cancelColor').onclick = () => $('colorPicker').close();
$('colorPicker').addEventListener('cancel', event => { if (state?.choice?.playerId === myId) event.preventDefault(); });
$('colorPicker').onclose = () => { pendingCard = pendingAction = null; };
$('cancelTarget').onclick = () => $('targetPicker').close();
$('targetPicker').onclose = () => { pendingAction = null; };
document.querySelectorAll('[data-color]').forEach(button => button.onclick = () => {
  if (state?.choice?.playerId === myId) send({type:'chooseColor',color:button.dataset.color});
  else if (pendingAction && state?.currentPlayerId === myId) send({...pendingAction,color:button.dataset.color});
  $('colorPicker').close();
});
function requestPlay(card) {
  pendingAction = {type:'play',cardId:card.id};
  if (card.value === '7' && state.hand.length > 1) {
    $('targetOptions').replaceChildren();
    state.players.filter(p=>p.id!==myId&&!p.eliminated).forEach(p=>{const button=document.createElement('button');button.className='secondary';button.textContent=p.name+' · '+p.count+' cards';button.onclick=()=>{send({...pendingAction,targetId:p.id});$('targetPicker').close();};$('targetOptions').append(button);});
    $('targetPicker').showModal();
  } else if (card.color === 'wild' && card.value !== 'roulette') {
    $('colorPicker').querySelector('h2').textContent = 'Pick your next color.';
    $('cancelColor').classList.remove('hidden'); $('colorPicker').showModal();
  } else { send(pendingAction); pendingAction = null; }
}
function label(card) { return NoMercy.LABELS[card.value] || card.value; }
function decorateCard(element, card) {
  element.className = 'card ' + (card?.color || 'wild') + (card && label(card).length > 2 ? ' special-card' : '');
  element.dataset.value = card ? label(card) : '?';
  const span = document.createElement('span'); span.textContent = element.dataset.value; element.replaceChildren(span);
}
function render() {
 if (!state) return;
 const me=state.players.find(p=>p.id===myId),playing=state.status==='playing',ownTurn=connectionReady&&playing&&state.currentPlayerId===myId&&!me?.eliminated;
 if (!ownTurn) { $('colorPicker').close(); $('targetPicker').close(); }
 const myIndex=state.players.findIndex(p=>p.id===myId),ordered=[...state.players.slice(myIndex),...state.players.slice(0,myIndex)];
 $('players').replaceChildren();
 ordered.forEach((p,index)=>{
  const original=state.players.findIndex(q=>q.id===p.id),seat=document.createElement('div');seat.className='player'+(p.id===myId?' self':'')+(p.id===state.currentPlayerId?' current':'')+(!p.connected?' offline':'')+(p.eliminated?' eliminated':'');
  const angle=index*2*Math.PI/ordered.length;seat.style.left=(50-42*Math.sin(angle))+'%';seat.style.top=(49+45*Math.cos(angle))+'%';
  const avatar=document.createElement('span');avatar.className='avatar '+palettes[original%3];avatar.textContent=p.bot?'🤖':faces[original%faces.length];avatar.setAttribute('aria-hidden','true');
  const name=document.createElement('span');name.className='player-name';name.textContent=p.name+(p.id===myId?' · You':'')+(p.id===state.hostId?' ♛':'');
  const count=document.createElement('span');count.className='player-count';count.textContent=p.eliminated?'OUT · Mercy':!p.connected?'Disconnected':state.status==='lobby'?'Ready to play':p.count+(p.count===1?' card':' cards')+(p.unoDeclared&&p.count===1?' · UNO!':'')+(state.scoreMode?' · '+p.score+' pts':'');
  seat.append(avatar,name,count);$('players').append(seat);
 });
 const canStart=state.hostId===myId&&(state.status==='lobby'||state.status==='finished');
 $('start').classList.toggle('hidden',!canStart||state.status==='finished');
 $('start').disabled=!connectionReady||state.players.length<2;
 $('waiting').classList.toggle('hidden',state.status!=='lobby');$('table').classList.toggle('hidden',state.status==='lobby');
 $('waitingText').textContent=state.players.length+'/8 players at the table. '+(state.players.length<2?'Invite one more to start.':state.hostId===myId?'Ready to deal?':'Waiting for the host to deal.');
 $('copy').classList.toggle('hidden',soloMode);
 $('status').textContent=state.message||'';
 $('turn').textContent=state.status==='lobby'?'Your cards will appear here':state.status==='finished'?(state.matchWinner?state.matchWinner+' wins the match!':state.winner+' wins the hand!'):me?.eliminated?'Mercy! You are out. Watch the rest of the hand.':ownTurn?(state.choice?'Choose a color for roulette':state.forcedCardId?'Play the card you just drew':state.pendingDraw?'Stack +'+state.stackMin+' or higher, or take +'+state.pendingDraw:'Your turn. Make it count.'):(state.players.find(p=>p.id===state.currentPlayerId)?.name||'Another player')+'’s turn';
 $('turn').classList.toggle('your-turn',ownTurn);
 decorateCard($('topcard'),state.top);
 $('active').textContent=state.choice?'COLOR ROULETTE':state.activeColor?state.activeColor+' to play':'Waiting to deal';
 $('colorDot').style.background=colors.includes(state.activeColor)?'var(--'+state.activeColor+')':'var(--lime)';
 $('direction').textContent=state.direction===1?'↻':'↺';$('direction').setAttribute('aria-label',state.direction===1?'Clockwise':'Counterclockwise');
 $('draw').disabled=$('deck').disabled=!connectionReady||!state.canDraw;
 $('draw').textContent=state.pendingDraw?'Take +'+state.pendingDraw:'Draw until playable';
 $('deck').setAttribute('aria-label',state.pendingDraw?'Take '+state.pendingDraw+' card penalty':'Draw until you find a playable card');
 $('uno').disabled=!connectionReady||!playing||me?.eliminated||me?.unoDeclared||!(me?.count===1||(ownTurn&&me?.count===2));$('uno').textContent=me?.unoDeclared?'UNO ✓':'UNO!';
 $('handCount').textContent=state.hand.length?' / '+state.hand.length:'';
 $('roundInfo').replaceChildren();
 if(state.pendingDraw){$('roundInfo').textContent='STACK: +'+state.pendingDraw+' · Next draw card must be +'+state.stackMin+' or higher.';}
 else if(state.scoreMode){$('roundInfo').textContent='First to 1000 points · '+state.players.map(p=>p.name+': '+p.score).join(' / ');}
 if(state.rouletteRevealed?.length){const reveal=document.createElement('div');reveal.className='roulette-reveal';const title=document.createElement('strong');title.textContent='Roulette revealed: ';reveal.append(title);state.rouletteRevealed.forEach((card,index)=>{const chip=document.createElement('span');chip.className='reveal-chip '+card.color;chip.textContent=card.color+' '+label(card);chip.style.animationDelay=(index*.12)+'s';reveal.append(chip);});$('roundInfo').append(reveal);}
 if(state.status==='finished'&&state.hostId===myId){const b=document.createElement('button');b.className='primary';b.textContent=state.matchWinner?'New match →':'Next hand →';b.onclick=()=>send({type:'start'});$('roundInfo').append(b);}
 $('catchButtons').replaceChildren();
 if(connectionReady&&playing&&!me?.eliminated)state.players.filter(p=>p.id!==myId&&state.unoVulnerable?.includes(p.id)).forEach(p=>{const b=document.createElement('button');b.className='catch-button';b.textContent='Catch '+p.name+' · no UNO!';b.onclick=()=>send({type:'catchUno',targetId:p.id});$('catchButtons').append(b);});
 $('hand').replaceChildren();$('hand').classList.toggle('many',state.hand.length>(window.innerWidth<721?8:12));
 state.hand.forEach((card,index)=>{const b=document.createElement('button');decorateCard(b,card);const playable=ownTurn&&state.playableCardIds.includes(card.id);b.disabled=!playable;b.classList.toggle('playable',playable);b.classList.toggle('special-card',label(card).length>2);b.setAttribute('aria-label','Play '+card.color+' '+card.value);b.title=card.color+' '+card.value;b.style.setProperty('--tilt',Math.max(-10,Math.min(10,(index-(state.hand.length-1)/2)*2))+'deg');b.onclick=()=>requestPlay(card);$('hand').append(b);});
 if(ownTurn&&state.choice?.type==='roulette'&&!$('colorPicker').open){pendingAction=null;$('colorPicker').querySelector('h2').textContent='Roulette: choose a color.';$('cancelColor').classList.add('hidden');$('colorPicker').showModal();}
}
if ('serviceWorker' in navigator) window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => {}));

if (session) { disableActions(); error('Reconnecting to your room…'); connect().catch(() => scheduleReconnect()); }
