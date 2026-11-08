# NO MERCY v1.1.0 — dark release

## Upload to GitHub and Render

The ZIP contains one folder: `no_mercy_multiplayer`.

1. Extract the ZIP on your computer.
2. Open the ROOT of your GitHub repository (the page that contains the existing `no_mercy_multiplayer` folder).
3. Choose **Add file > Upload files** and drag in the extracted `no_mercy_multiplayer` folder. Existing paths are updated; new files are added.
4. Check that the path is `no_mercy_multiplayer/public/index.html`, not `no_mercy_multiplayer/no_mercy_multiplayer/public/index.html`.
5. Click **Commit changes**.
6. In Render, **Manual Deploy > Deploy latest commit**. Wait for Live.
7. Close old game tabs, reopen the website, and create a NEW room. For a cache check, try Incognito once.

Upload the ENTIRE public folder, including its NEW `fonts` folder. The fonts are now local assets. Do not upload just styles.css.

If uploading individual files, the runtime changes from the previous rules release are:

- `no_mercy_multiplayer/public/styles.css`
- `no_mercy_multiplayer/public/app.js`
- `no_mercy_multiplayer/public/index.html`
- `no_mercy_multiplayer/public/manifest.json`
- `no_mercy_multiplayer/public/sw.js`
- `no_mercy_multiplayer/public/fonts/` (both .woff2 files and both license files)

The included `package.json` bumps the version and adds `npm test`; include it with `tests/rules.cjs`. The complete archive includes the existing server and rules files as well, so a fresh install is runnable.

## What changed

- Charcoal interface, deep green felt, lime accents, dark forms and dialogs.
- Desktop hand cards grow from 80 x 118 to 108 x 158 pixels.
- Mobile hand cards grow from 65 x 99 to 88 x 132 pixels.
- Desktop center cards are 110 x 162; phone center cards are 88 x 132 (80 x 120 on the smallest screens).
- Cards retain their full color and brightness when disabled. Playable cards have a lime border and a check mark.
- Larger values, a second corner value, and high-contrast action names on special cards.
- Less overlap and a horizontally scrollable hand; no horizontal page overflow at tested phone widths.
- More spacing between the table seats and the hand panel; compact phone branding and roulette labels.
- Bundled DM Sans and Barlow Condensed font files and their OFL licenses. No Google Fonts requests are required.
- Version 6 app cache includes fonts. Previously cached assets can load after three seconds if the server is slow; a healthy network response continues updating the cache.
- Matching installed-app theme colors, page description, release version and runnable rules tests.

No game rules were changed in this visual release. It retains the 168-card rules engine, UNO calling/catching, optional scoring, 2-8 player online rooms and 1-7 local computer opponents.

## Run locally

From the `no_mercy_multiplayer` folder:

    npm install
    npm test
    npm start

Open http://localhost:3000. The app is served by Node; do not open index.html directly.

## Verification completed

- 16 rule tests, including 56 complete computer simulations over every player count from 2 through 8, with 168-card conservation checked after each move.
- Full online two-player and eight-player matches, including reconnection with the same private hand and turn.
- Browser checks of the dark lobby, eight-seat table, roulette picker, readable card faces and playable-card indicators.
- Phone layouts tested at 390 and 320 CSS pixels. Both lobby and game stay within the page width; only the hand scrolls horizontally.
- Browser reload and a new computer match succeeded with the local server stopped, using the installed asset cache.
- All ten cached assets returned HTTP 200. Both bundled font files have valid WOFF2 headers.
- JavaScript syntax and Git whitespace checks.

## Operating limits

This is a tested release package, not a deployment confirmation. GitHub access in this session is read-only, so it has not been pushed or deployed here.

Online rooms are still stored in server memory: a server restart or deployment clears them. A brief disconnect can resume while the server retains the room. Computer matches run in the browser and continue without a game-server connection after loading, but refreshing starts a new match. Offline reload requires the page assets to have been cached on an earlier successful visit.

Rules adaptations and the configured deck inventory are documented in RULES.md. The app retains the requested 2-8 extension to the printed 2-6 range.
