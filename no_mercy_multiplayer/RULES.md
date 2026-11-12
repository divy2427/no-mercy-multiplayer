# Game rules and adaptations

## v1.2 room overrides

The host may override the standard deck and rules when creating the room: enabled number and colored-action types; 0-20 copies of each wild type; a 3-12 card starting hand; a 10-50 card Mercy limit; and stacking, 7-swap and 0-pass toggles. These settings also apply to computer matches and remain fixed across hands in the same room.

One enabled number card is reserved before dealing to guarantee a valid opening discard, even with a tiny custom number set. Deck size limits room capacity to `min(8, floor((deck size - 1) / starting cards))`.

Completed-hand records use the same point calculation as optional scoring. They are recorded even when score-based victory is off. Mercy bonuses persist after an eliminated player leaves. A last-survivor win caused by a player leaving is labeled Last standing.

The standard reference below applies wherever the host has not selected an override.
## Implemented rules

The supplied RULE.pdf is the primary rules reference. The interface includes a rewritten summary in **How to play**.

- 168-card deck; deal seven cards each; skip initial action cards until a number opens the discard pile; first player is after the dealer. The dealer rotates on subsequent hands.
- Match color, number or symbol; wild cards are unrestricted.
- With no matching card, draw until a playable card is found, then play that specific card. Drawing voluntarily when a match exists is disabled.
- Stack +2, colored +4, Wild Reverse +4, Wild +6 and Wild +10 only with an equal-or-higher draw value. Color does not restrict stacking. Taking the stack ends the turn.
- Mercy eliminates a player immediately upon reaching 25 cards. Their cards remain set aside until the draw pile must be replenished. The last surviving player wins.
- A 7 requires a chosen opponent for a hand swap; a 0 passes all active hands in the current direction.
- Skip, Reverse, colored Draw 2/4 and Skip Everyone. Discard All discards every card in the acting player's own hand matching its color; those extras go under the Discard All card, which remains on top.
- Wild Reverse Draw 4, including its two-player self-penalty and ability to stack back to the opponent.
- Wild Draw 6 and Draw 10.
- Color Roulette: the NEXT player chooses the color, draws through wilds and other colors until that color appears, adds ALL revealed cards (including wilds and the matching card) to their own hand, and loses the turn. The interface shows the revealed sequence.
- UNO button at one card, with the convenience of arming it immediately before playing from two cards. Catch buttons appear for an uncalled one-card hand. A successful catch adds two cards. The catch window closes when the next valid turn action begins.
- Empty-hand victory or last-survivor victory, and a next-hand button.
- Optional 1000-point match: number face values; 20 per colored action; 50 per wild action; 250 per eliminated opponent, excluding their eliminated cards. The hand winner receives the points. Starting after a match win resets scores.

## Explicit adaptations and edge cases

- The printed sheet specifies 2-6 players; this app keeps your requested 2-8 extension.
- The sheet gives a 168-card total but does not enumerate copy counts. The configured inventory is: two of every 0-9 per color; three each of Draw 2, Skip, Reverse and Discard All per color; two each of colored Draw 4 and Skip Everyone per color; eight each of Wild Reverse +4 and Color Roulette; four each of Wild +6 and +10. These copy counts are explicit configuration, not a claim that the PDF enumerates them.
- Playing the final card wins immediately, including a final 0 or 7; no further hand exchange is requested after victory.
- A draw penalty or roulette stops at Mercy elimination because a player leaves immediately at 25 cards.
- If the draw pile and every eligible recycled card are exhausted before a match can be drawn, the turn passes rather than freezing the game.
- Computer matches are local to this tab. They cannot be shared as online room codes.

## Worked scoring example

The winner receives cards remaining in non-eliminated opponents' hands plus 250 for every opponent eliminated by Mercy during this hand. A Mercy opponent still counts after leaving; a departure alone is not a Mercy elimination. Eliminated hands are excluded from card totals.

One active opponent holds a 9, a Skip and a Wild +6: 9 + 20 + 50 = 79. Two opponents were eliminated by Mercy: 2 x 250 = 500. The winner earns 579 points. A previous score of 450 becomes 1029 and wins the optional match. The same 579 points appear in hand history when match scoring is off.

## Online room lifecycle

Distinct player names are required within each room (case-insensitive). Names must contain 1-18 characters after trimming. Reconnection requires the private resume token, not just the room code. A disconnected seat is reserved for two minutes after the server detects disconnection, then removed; the host role transfers to the first remaining player if necessary. Mercy bonuses are not awarded for timeouts or departures.

Guests can join before the first hand or between completed hands, subject to capacity. They cannot join a running hand. At least two connected players are required to deal. Empty abandoned rooms are deleted. Server restart still clears all in-memory rooms and records.
