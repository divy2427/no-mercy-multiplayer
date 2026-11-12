# NO MERCY v1.3.2

Dark card-table game with mobile landscape play, custom rooms, local computer opponents and completed-hand records.

## Upload this release

1. Extract the ZIP. It contains one folder, `no_mercy_multiplayer`.
2. Open the ROOT of your GitHub repository. Choose **Add file > Upload files** and drag in that entire folder.
3. Commit the upload, then use **Render > Manual Deploy > Deploy latest commit**.
4. Once Live, close old game tabs, reopen the site and create a NEW room.

Keep the path `no_mercy_multiplayer/public/index.html`; do not create a second nested `no_mercy_multiplayer` directory.

Upload the whole folder, including **server.js**, **public/engine.js**, **public/room-tools.js**, the NEW **public/table.css** and **public/table-layout.js**, and the existing **public/fonts/** folder. Updating only the stylesheet will not enable custom online rules or history. Matching files are replaced and new files are added; no manual deletion is required.

The archive contains one README.md and a separate RULES.md. Do not restore an old README.txt.

## Mobile landscape

Gameplay fills one landscape screen: opponents around the table, discard in the center, and a sorted, overlapping card fan across the bottom. Cards are grouped by colour and value. Every corner label remains exposed without dragging; larger hands use balanced fans with smaller cards. Next hand appears above the cards. The small menu at the top right contains Rules, History and Leave room.

Turn the phone sideways to play. If auto-rotate is disabled, the game itself turns sideways so you can still hold the phone in landscape. The lobby stays upright. The fullscreen icon requests fullscreen and landscape orientation where supported; browser support varies.

Checked at browser viewport sizes 844 x 390, 568 x 320 and 390 x 844, including eight-player seating and the sideways history dialog. These are browser checks, not physical-device testing.

## Customize a room or computer match

Enter a name, expand **Customize rules**, and choose settings before creating the room or pressing **Play vs computer**.

- Enable or exclude each number type (0-9).
- Enable or exclude Draw 2, Draw 4, Skip, Reverse, Discard All and Skip Everyone.
- Set total copies of EACH wild type from 0 to 20: Wild Reverse +4, Wild +6, Wild +10 and Color Roulette. Zero removes that type.
- Deal 3-12 cards per player.
- Set the Mercy threshold from 10 to 50 cards; it must exceed the starting hand size.
- Toggle draw stacking, 7 swaps and 0 passes independently. A 7 or 0 remains an ordinary number when its special rule is off.
- Use **Reset standard rules** to restore the standard 168-card configuration.

The deck preview shows its size, starting-hand size and player capacity. At least one number type must be enabled. A number is reserved for the opening discard, so a custom deck cannot accidentally deal all its number cards into hands.

A valid deck must support at least two players. Its maximum capacity is the smaller of 8 or `floor((deck size - 1) / starting cards)`. A smaller deck may therefore support fewer than eight players. The app rejects invalid settings and too many computer opponents; the server also enforces the room limit.

Settings are fixed for that room and are shared with guests and reconnecting players. The in-room **Rules** button shows the exact active configuration above the standard-rule reference. Create a new room to use different settings.

Number copies and enabled colored-action copy counts keep their standard distribution. Wild counts are adjustable individually. The standard inventory and rules are in RULES.md.

## Hand record and chart

Open **History** from the room bar. A completed hand records its hand number, winner, points earned, victory type, match number and completion time.

The chart shows the most recent 12 completed hands, colored by winner. The table keeps the latest 100 records, newest first. Points are recorded even when the optional 1000-point victory mode is off; they are hand statistics in that mode, not a different win condition.

Use **Download CSV** to keep all stored records. Exported completion times are UTC. Starting another hand keeps the history. Starting a new scored match resets live match scores but keeps earlier hand records with their match numbers.

Mercy bonuses remain counted if an eliminated player leaves before the hand ends. A win caused by another active player leaving is recorded as **Last standing**, rather than incorrectly claiming a Mercy elimination.

## Online and computer play

Online rooms support 2-8 players with the standard deck. The host shares a six-character room code and deals once enough players have joined. Reconnection restores the same seat, hand, rules and records while the server still retains that room.

Computer matches support 1-7 opponents, subject to the selected deck's capacity. They run in the browser using the same rules engine and do not need a game-server connection after the assets load. The installed app cache can also reload those assets after a successful online visit.

UNO calling, missed-call catching, all No Mercy actions, optional scoring and next-hand play remain available.

## Run locally

From `no_mercy_multiplayer/`:

    npm install
    npm test
    npm start

Open http://localhost:3000. Do not open index.html directly. No new npm dependencies or API keys are required for this release.

## Validation

- 28 directed rules, customization and history tests.
- 77 complete computer simulations covering standard and custom decks, with card conservation checked after each action.
- Standard online games with two and eight players, including reconnecting with the same private hand and turn.
- A custom online game: exact room settings shared with guests, three-card deal, host-only start, finished-hand record and history restored on reconnection.
- Server-side rejection of invalid wild quantities and custom-deck capacity overflow.
- Browser checks of settings, resetting defaults, landscape fitting, seven-card hand scrolling, portrait rotation and custom-rule play.
- Real completed-hand chart checked against two results and a downloaded CSV.
- Compact chart checked in a 568 x 320 viewport.
- Cached-page reload and a new computer match with the local server stopped.
- All 11 cached assets returned HTTP 200; syntax and whitespace checks passed.

## Record lifetime and deployment limits

Online rooms and their records are stored in server memory. A server restart or deployment clears them. A browser refresh can resume an online room if it still exists.

Computer matches and their records belong to the current tab session. Refreshing the page or starting a different room resets them. Export the CSV before leaving or refreshing if you want to retain the records. This release does not add a database or cloud history.

The ZIP is a tested release package, not confirmation of a live deployment. Upload and deploy it to update your Render site.
