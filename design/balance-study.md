# Three-Floor Chess — AI self-play balance study

*Method: headless self-play with the in-game AI, symmetric armies both sides.*

## King grounding (the core decisiveness fix)
With the king able to climb, games almost never reached checkmate — the king hid across
three floors, climbed away when cornered, and had three defensive actions a turn.
**Grounding the king** (it can no longer change floors) made checkmate achievable: a king
in check with no in-floor escape is mated. You must mass attackers on the king's floor.

## AI rebuild (v1.7)
The variant (Three-Floor/Shafts) uses a turn-level negamax; Classic uses a real,
perft-verified alpha-beta chess engine; Pawn Race uses a race-aware alpha-beta. Rating
tiers 200–2000 come from search depth/time + a controlled slice of randomness, not injected
blunders (top tier = no noise).

## First-move-advantage study (2026-08-05) — the watch item, resolved (with a caveat)

**Question:** quantify the suspected White (first-mover) advantage.

**Headline: at engine level the variant is a forced draw, so first-move advantage is not
measurable as a win-rate effect.** Across 40+ self-play games spanning tiers 200/400/800/
1200 and two independent start methods (standard mirrored deployment; and varied
random-opening midgames with position bias cancelled by colour-swapped mirror pairs), the
result was **100% draws** — every game hit the 120-ply no-progress rule.

**Why (an AI-passivity problem, not a rules problem).** A diagnostic that logged captures
and king-outs showed the cause: from the symmetric deployment the bots make **zero
captures** and **never force a king out of reserve** (avg captures/game = 0.0; king-out rate
= 0%). The turn-level negamax only grabs free, undefended material; it has no eval incentive
to advance pawns, break the position, or spend material to prise a general loose. With no
pawn breaks there is no contact, no general captured, no king forced out — and with the king
in reserve, checkmate is structurally impossible. (This also reconciles with the old "~50%
checkmate at 1200" figure from the pre-rebuild 1-ply AI, which blundered into contact; the
stronger rebuilt engine defends itself into a dead draw.)

**The one first-move edge that did exist — now fixed.** `buildArmy` placed back-rank rooks
on open files; whoever moved first could slide a rook the length of a file and capture an
undefended enemy rook on turn one (observed: the bot took three rooks before the human's
first move when playing Black). Fixed by giving every back-rank officer a shield pawn.

**Bottom line / next step.** Add an **initiative/aggression term** to the variant eval
(reward pawn advancement / space; value forcing a general off and massing attackers on the
king's floor) so self-play converts — prerequisite for measuring first-move advantage.
Re-run the mirror-pair study (`tests/study2.js`) afterwards.
