NO MERCY ROOM PLAY — MULTIPLAYER STARTER

What this is
- An unofficial, fan-made, UNO-style multiplayer prototype.
- Room-code online play for 4–6 players.
- A Node.js WebSocket server manages rooms and turns.
- Installable Android PWA when hosted on HTTPS.
- This is not an official Mattel product and does not use official UNO artwork.

IMPORTANT PROTOTYPE LIMITS
- This is a starter build, not a finished commercial game.
- Rules are simplified: colour/value matching, skip, reverse, draw two, wild and wild-four.
- It does not yet implement the complete UNO No Mercy rules, stacking, challenge rules,
  reconnect recovery, persistent rooms, moderation, or production-grade anti-cheat.
- Players need an internet connection and the server must remain running.
- Do not share personal information in room names or chat (there is no chat).

RUN LOCALLY (computer required)
1. Install Node.js 18 or newer.
2. Unzip this project.
3. Open a terminal in this folder.
4. Run: npm install
5. Run: npm start
6. Open http://localhost:3000 in a browser.
   For testing with phones, deploy the server to a public HTTPS host.

DEPLOY
Deploy this whole project to a Node.js hosting service that supports WebSockets.
Set the start command to: npm start
The host should provide an HTTPS URL. Do not deploy only the public folder:
the server.js backend is required for room codes and live multiplayer.

INSTALL ON ANDROID
1. Open the deployed HTTPS URL in Chrome.
2. Open Chrome's ⋮ menu.
3. Tap "Install app" or "Add to Home screen".
4. Launch NO MERCY from your home screen.

ROOM FLOW
- One player creates a room and shares the 6-character code.
- Friends enter the code and join.
- Host can start once 4–6 players are in the room.

SECURITY / PRIVACY
This prototype has no accounts and no chat. Anyone with the room code can join
while the room is open. Use random room codes and only share them with friends.
For a public release, add rate limits, reconnection tokens, room expiry, server-side
validation of all rules, abuse reporting, and privacy/security review.
