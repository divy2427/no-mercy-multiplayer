let ws, myId = null, roomCode = null, state = null, pendingCard = null, connecting = false;
const $ = id => document.getElementById(id);
const colors = ['red', 'blue', 'green', 'yellow'];
const faces = ['😎', '😏', '🤩', '🦊', '🐼', '🤠'];
const palettes = ['violet', 'coral', 'mint'];
function error(message = '') { $('error').textContent = message; $('error').classList.toggle('hidden', !message); }
function send(message) {
  if (ws?.readyState !== WebSocket.OPEN) { error('Connection lost. Leave this room and join a new one to reconnect.'); return false; }
  ws.send(JSON.stringify(message)); return true;
}
function connect() {
  return new Promise((resolve, reject) => {
    const socket = new WebSocket(`${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}`);
    ws = socket;
    socket.onopen = resolve;
    socket.onerror = () => reject(new Error('Could not connect to the game server. Please try again.'));
    socket.onclose = () => { if (socket === ws && roomCode) { error('Connection lost. Leave this room and join a new one to reconnect.'); $('draw').disabled = $('deck').disabled = $('start').disabled = true; document.querySelectorAll('#hand button').forEach(b => b.disabled = true); } };
    socket.onmessage = event => {
      const message = JSON.parse(event.data);
      if (message.type === 'error') { error(message.message); return; }
      if (message.type === 'joined') {
        myId = message.id; roomCode = message.code; error();
        $('lobby').classList.add('hidden'); $('game').classList.remove('hidden'); $('code').textContent = roomCode;
      }
      if (message.type === 'state') { state = message.state; render(); }
    };
  });
}
async function enter(type) {
  if (connecting || !$('name').reportValidity()) return;
  const code = $('roomInput').value.trim().toUpperCase();
  if (type === 'join' && !/^[A-Z0-9]{6}$/.test(code)) { error('Enter the 6-character code shared by your host.'); $('roomInput').focus(); return; }
  connecting = true; $('create').disabled = $('join').disabled = true; error();
  try {
    if (!ws || ws.readyState !== WebSocket.OPEN) await connect();
    send({ type, name: $('name').value.trim() || 'Player', code });
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
$('copy').onclick = async () => { try { await navigator.clipboard.writeText(roomCode); $('copy').textContent = 'Copied!'; setTimeout(() => $('copy').textContent = 'Copy code', 1800); } catch { error('Your room code is ' + roomCode); } };
$('start').onclick = () => send({ type: 'start' });
$('draw').onclick = $('deck').onclick = () => send({ type: 'draw' });
$('leave').onclick = () => {
  if (ws?.readyState === WebSocket.OPEN) send({ type: 'leave' });
  const previous = ws; ws = null; previous?.close();
  myId = roomCode = state = pendingCard = null;
  $('colorPicker').close(); $('game').classList.add('hidden'); $('lobby').classList.remove('hidden'); error();
};
$('rulesOpen').onclick = () => $('rules').showModal();
$('rulesClose').onclick = () => $('rules').close();
$('cancelColor').onclick = () => $('colorPicker').close();
$('colorPicker').onclose = () => { pendingCard = null; };
document.querySelectorAll('[data-color]').forEach(button => button.onclick = () => {
  if (pendingCard && state?.currentPlayerId === myId) send({ type: 'play', cardId: pendingCard, color: button.dataset.color });
  $('colorPicker').close();
});
function label(card) { return ({ draw2: '+2', wild4: '+4', reverse: '↔', skip: '⊘', wild: '★' })[card.value] || card.value; }
function decorateCard(element, card) {
  element.className = 'card ' + (card?.color || 'wild');
  element.dataset.value = card ? label(card) : '?';
  const span = document.createElement('span'); span.textContent = element.dataset.value; element.replaceChildren(span);
}
function render() {
  if (!state) return;
  const playing = state.status === 'playing', ownTurn = playing && state.currentPlayerId === myId;
  if (!ownTurn && $('colorPicker').open) $('colorPicker').close();
  const myIndex = state.players.findIndex(player => player.id === myId);
  const ordered = [...state.players.slice(myIndex), ...state.players.slice(0, myIndex)];
  const positions = [[50, 94], [10, 58], [24, 10], [76, 10], [90, 58], [50, 3]];
  const layouts = { 1: [0], 2: [0, 5], 3: [0, 2, 3], 4: [0, 1, 5, 4], 5: [0, 1, 2, 3, 4], 6: [0, 1, 2, 5, 3, 4] };
  $('players').replaceChildren();
  ordered.forEach((player, index) => {
    const originalIndex = state.players.findIndex(p => p.id === player.id);
    const seat = document.createElement('div');
    seat.className = 'player' + (player.id === myId ? ' self' : '') + (player.id === state.currentPlayerId ? ' current' : '') + (!player.connected ? ' offline' : '');
    const [left, top] = positions[layouts[ordered.length][index]]; seat.style.left = left + '%'; seat.style.top = top + '%';
    const avatar = document.createElement('span'); avatar.className = 'avatar ' + palettes[originalIndex % 3]; avatar.textContent = faces[originalIndex % 6]; avatar.setAttribute('aria-hidden', 'true');
    const name = document.createElement('span'); name.className = 'player-name'; name.textContent = player.name + (player.id === myId ? ' · You' : '') + (player.id === state.hostId ? ' ♛' : '');
    const count = document.createElement('span'); count.className = 'player-count'; count.textContent = !player.connected ? 'Disconnected' : state.status === 'lobby' ? 'Ready to play' : `${player.count} card${player.count === 1 ? '' : 's'}`;
    seat.append(avatar, name, count); $('players').append(seat);
  });
  $('start').classList.toggle('hidden', state.hostId !== myId || state.status !== 'lobby');
  $('start').disabled = state.players.length < 4;
  $('waiting').classList.toggle('hidden', state.status !== 'lobby');
  $('table').classList.toggle('hidden', state.status === 'lobby');
  $('waitingText').textContent = `${state.players.length}/6 players at the table. ` + (state.players.length < 4 ? `Invite ${4 - state.players.length} more to start.` : state.hostId === myId ? 'Everyone’s here. Ready to deal?' : 'Waiting for the host to deal.');
  $('status').textContent = state.message || '';
  $('turn').textContent = state.status === 'lobby' ? 'Your cards will appear here' : state.status === 'finished' ? `${state.winner} wins! 🎉` : ownTurn ? 'Your turn. Make it count.' : `${state.players.find(p => p.id === state.currentPlayerId)?.name || 'Another player'}’s turn`;
  $('turn').classList.toggle('your-turn', ownTurn);
  decorateCard($('topcard'), state.top);
  $('active').textContent = state.activeColor ? `${state.activeColor} to play` : 'Waiting to deal';
  $('colorDot').style.background = colors.includes(state.activeColor) ? `var(--${state.activeColor})` : 'var(--lime)';
  $('direction').textContent = state.direction === 1 ? '↻' : '↺';
  $('direction').setAttribute('aria-label', state.direction === 1 ? 'Clockwise' : 'Counterclockwise');
  $('draw').disabled = $('deck').disabled = !ownTurn;
  $('handCount').textContent = state.hand.length ? ` / ${state.hand.length}` : '';
  $('hand').replaceChildren();
  $('hand').classList.toggle('many', state.hand.length > (window.innerWidth < 721 ? 8 : 12));
  state.hand.forEach((card, index) => {
    const button = document.createElement('button'); decorateCard(button, card);
    const playable = ownTurn && (card.color === 'wild' || card.color === state.activeColor || card.value === state.top?.value);
    button.disabled = !playable; button.classList.toggle('playable', playable);
    button.setAttribute('aria-label', `Play ${card.color} ${card.value}`); button.title = `${card.color} ${card.value}`;
    button.style.setProperty('--tilt', `${Math.max(-10, Math.min(10, (index - (state.hand.length - 1) / 2) * 2))}deg`);
    button.onclick = () => { if (card.color === 'wild') { pendingCard = card.id; $('colorPicker').showModal(); } else send({ type: 'play', cardId: card.id }); };
    $('hand').append(button);
  });
}
if ('serviceWorker' in navigator) window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => {}));
