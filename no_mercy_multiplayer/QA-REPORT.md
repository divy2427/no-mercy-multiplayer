# QA fixes — NO MERCY v1.4.0

Review source: no_mercy_multiplayer_detailed_review.pdf supplied by the user, dated 12 November 2026. Verification date: 12 November 2026. Tested build: complete v1.4.0 source package. The review distinguishes documentation findings from unverified behavior; this report retains that distinction.

## Findings and retest status

| ID / area | Final behavior | Evidence / result |
| --- | --- | --- |
| F-01 Color Roulette | Rules explicitly say ALL revealed cards, including wilds and the matching card, enter the next player's hand; wilds do not end drawing; turn then passes; drawing stops at Mercy. Existing engine behavior retained. | Directed Roulette test verifies chosen player, wild handling, +3 cards and next player. Browser rules text checked. PASS. |
| F-02 scoring | Rules identify non-eliminated hands, 250 per Mercy opponent, no double counting, and no Mercy bonus for a departure. Added worked example: 9 + 20 + 50 + 2 x 250 = 579; 450 + 579 = 1029. | New regression calculates exactly 579, 1029 and one history entry. Existing departed-Mercy bonus regression passes. PASS. |
| F-03 Discard All | Says YOUR own matching-color cards go under the action card, which stays on top. | Existing regression verifies remaining hand and discard ordering. PASS. |
| F-04 7–8 player extension | Explicitly labeled a house rule. | Directed reverse/skip/skip-all/7-swap/0-pass tests at 7 and 8 players, both directions, with an eliminated seat. Full standard simulations for every count 2–8. PASS. |
| Names and rapid actions | Shared trimmed 1–18 character validation; blank/control/long names rejected, duplicate names rejected case-insensitively within a room. | Engine, server and browser blank-name checks. Same-revision repeated start and same-turn skip-all duplicate rejected. PASS. |
| Room-code generation | Six characters generated with crypto.randomInt rather than Math.random. | Source inspection; codes remain unique among existing rooms. Not a claim of penetration testing. |
| Session isolation | A bound socket cannot resume another seat; unbound resume requires ID, code and private token. | Invalid-token, bound-socket resume, refresh, unrelated-room and secret-state tests. PASS. |
| Authoritative actions | Online actions require current revision; stale/repeated actions return a fresh private snapshot and a clear error. Engine continues validating actor, ownership, turn and legality. | Duplicate start, retained-turn duplicate play, out-of-turn conflict and forged-card tests. Eight clients converge after every accepted action. PASS. |
| Abandoned seats and host transfer | Disconnect starts a two-minute reservation after detection; reconnect cancels expiry. Expired seats leave, host transfers, empty rooms are deleted. Heartbeat detects dead sockets. | Expiry tests use the same code with a 1.2-second reservation for speed. Reconnect, explicit leave, host transfer, expired-token and empty-room tests. PASS. |
| Between-hand joining | Replacement guests can join a finished hand; next deal requires at least two players. Running hands reject new guests. | New engine regression and real two-client server test join a replacement and start hand two. PASS. |
| Input/XSS | Names continue to be rendered with textContent. | Two browser tabs displayed literal <b>Host</b> rather than creating markup. State does not expose other hands or resume tokens. PASS for checked cases. |
| CSV | Shared tested serializer escapes quotes and prefixes formula-like values, including leading whitespace. | Formula prefixes =,+,-,@ and quote/comma cases pass. Browser download opened and matched one finished-hand record. PASS for checked cases. |
| Responsive UI | Existing sorted fan retained; hand-end button sits above cards; no new layout redesign. | Existing fan bounds checked for 1–49 cards at four sizes. Browser desktop gameplay, wild dialog, refresh, rules and history checked. Earlier phone-viewport fan screenshots remain relevant; no physical-phone certification. |

## Reproducible commands and retained evidence

From no_mercy_multiplayer:

    npm install
    npm test
    npm run test:online

npm test passes 16 standard-rule groups, 12 custom/history groups, layout checks and 9 new review regression groups. The 77 simulated standard/custom games check card conservation after every action; a fixed seed makes this repeatable.

npm run test:online starts an isolated server on a free port and stops it afterward. All 13 online acceptance groups passed in the final run. An eight-client hand completed in 82 accepted actions; all clients' shared state matched after each accepted action. The earlier exploratory run completed in 328 actions. These network games use random shuffles, so their action counts vary.

Browser checks used two local browser tabs: create, join, deal, Wild Reverse +4 with color selection, matching updates, refresh/resume, departure, finished-hand history and CSV download. Rules displayed the corrected example. This is a local test, not a claim that the live Render deployment is updated.

Evidence supplied beside the ZIP:

- no-mercy-v1.4-unit-results.txt
- no-mercy-v1.4-online-results.txt
- no-mercy-v1.4-hand-record.jpg
- no-mercy-v1.4-rules.jpg

## Limits and release procedure

This is targeted functional and robustness testing, not an independent release approval or penetration test. No physical handset, multi-server deployment, load test or spreadsheet application's formula execution was tested. Formula safety was checked in generated CSV text. Browser visual checks do not certify all devices or accessibility compliance.

Online rooms and records remain in memory. A server restart/deployment clears them. Reconnect reservations expire; CSV export is the way to retain a local history copy. Computer games remain local to the browser tab.

Room codes are shareable invitations, not account authentication. The new revision protocol requires the matching server and browser files. Upload the entire extracted folder at the repository ROOT, deploy the latest commit, close old game tabs and reopen. Do not mix this server with older client files. No live deployment was performed during this task.
