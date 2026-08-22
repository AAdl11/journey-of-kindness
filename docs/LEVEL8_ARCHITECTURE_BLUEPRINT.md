# Level 8 — The Tree of Many Futures

- Traditional Chinese: `萬千未來之樹`
- Spanish: `El árbol de muchos futuros`
- Architecture subtitle: `Three-Act Adversarial Search — Minimax · Alpha-Beta Pruning · Monte Carlo Tree Search`

**Status:** Approved for implementation — 2026-08-22
**Claim discipline:** This is *a Human-Centered AI Literacy Prototype using psychology-informed game design to make foundational AI concepts accessible to novice and nontraditional learners* — **not** educationally validated, research-proven, or industry-approved. Every numeric claim must be reproducible via a repository test command.

## 0. Roles & decision protocol
| Role | Authority |
|---|---|
| Mei-Hsien | Product Owner, community-context authority, final human decision |
| Claude | Technical architect, critical reviewer |
| ChatGPT/Codex | Architecture reviewer, visual-asset producer, implementation verifier |

Disagreement classes: **Correctness blocker** (cite conflict, smallest fix) · **Engineering tradeoff** (recommend, Owner decides) · **Design preference** (implement as decided).

## 1. Audience & framing rules
**Primary research/evaluation population:** novice and nontraditional learners entering foundational AI education, incl. community-college learners without a traditional CS pathway.
**Broader community audience:** community youth, first-generation learners, older volunteers, families — varied language, literacy, digital familiarity, physical ability.
**Framing:** residents are participants with agency — never portrayed through deficit, rescue, poverty, or trauma framing; never the adversary; no real names, biographies, vulnerabilities, or identifiable events. The only adversary is the clearly labeled **⚙️ Community Response Stress-Test Engine**.

## 2. Fixed design decisions (summary)
One community task, three acts: **Act 1 Minimax → Act 2 Alpha-Beta → Act 3 two-player adversarial MCTS**, sharing state, legal actions, utility/constraints, MAX/MIN roles, Engine rules. Volunteer = MAX; Engine = MIN. **V1 fully observable, deterministic** — no hidden truth, determinization, chance nodes, expectimax, ISMCTS, belief states (roadmap only). Immersive play: the player moves a character in a scene — no A/B cards, button grids, `<details>` textbook, or dashboard-as-gameplay. Simulation slider: Engineer View only.
**V0 disposition (Owner decision):** the existing `level8/index.html` and `level8/mcts_core.js` on `main` are superseded by this blueprint — preserved through Git history, overwritten in place during the rebuild. No further V0 uploads.

## 3. Shared game-state contract (all acts)
| Element | Contract |
|---|---|
| Board | Tile grid; Act 1/2: 3×3; Act 3: 5×5. Edges may be closed by Engine |
| Entities | Volunteer (MAX pawn); households `{pos, need∈{1,2,3}}` all visible; Engine totem (no board position) |
| Turn order | Strict alternating plies: MAX acts, then MIN acts. MIN actions consume no time; only MAX actions advance `t` (by their time cost, below) |
| MAX actions & time cost | `MOVE(dir)` along open edge — cost 1, **cost 2 while fog is active**; `SERVE` household on current tile — cost 1, **cost 2 while that household's delay token is active**; `WAIT` — cost 1. A MAX action is legal iff `t + cost ≤ T`. Since `WAIT` costs 1, it is legal at every non-terminal state — a live MAX node can never lack a legal move |
| MIN actions | `ROAD_CLOSE(edge)`, `SUPPLY_DELAY(house)`, `FOG`, `PASS` (see §4) |
| Turn & terminal order | (1) MAX acts, `t += cost`; (2) terminal test — if `t ≥ T` or all households served, utility is evaluated **immediately, with no trailing MIN ply**; (3) otherwise MIN acts. Duration/cooldown semantics (declarative, in plies not time units): an effect with duration *d* applies to the next *d* MAX plies after placement, whatever their time cost; a MIN move with cooldown *k* is illegal for the *k* MIN plies after the one that used it |
| Hard constraints | Engine may never target a household's people — only roads, supplies, weather. **Urgency rule:** when MAX occupies the tile of an unserved need-3 household and `SERVE` is legal there, `MOVE` is illegal — MAX must serve before leaving ("no skipping the urgent"). Keyed to tile occupancy, never adjacency; `WAIT` stays legal, so no no-legal-move state can arise. When time is too short for a (possibly delayed) `SERVE`, the `SERVE`-legality guard releases the rule. (Thematic ancestry noted informally; no formal L7 hand-off is claimed until L7 is revised separately) |
| Terminal | `t ≥ T` (A1/2: T=3, fixture A1F below; A3: T=12) or all households served |
| Utility (terminal, MAX view) | `4·served₃ + 2·served₂ + 1·served₁ − 3·unserved₃` |
| Determinism | No RNG in game rules. Canonical tie-break: lowest index in the documented enumeration order (MOVE N,E,S,W → SERVE → WAIT; Engine: enumerated edge list → house list → FOG → PASS) |
| i18n | All player-facing strings in one `L8_STRINGS = {en, "zh-Hant", es}` table in a dedicated file; game logic never contains display text, so the three languages cannot drift into different rules |

### 3.1 Act 1/2 micro-fixture **A1F** (exact definition)
Acts 1 and 2 play this single crafted scenario — deliberately small, so the rendered tree is genuinely complete and displayable, not a huge full-length game tree. Coordinates `(row,col)`, `(0,0)` top-left.

| Field | Value |
|---|---|
| Start | Volunteer at `(1,1)`; `t=0`, `T=3` (remaining horizon: 3 MAX time units ⇒ ply sequence MAX·MIN·MAX·MIN·MAX, then terminal) |
| Households | `H_A (0,2)` need 3, unserved; `H_B (2,2)` need 1, unserved — south region is pre-cut, so `H_B` is honestly unreachable today (triage visual; need-1 carries no terminal penalty) |
| Pre-closed edges (storm damage, not Engine moves) | `(1,0)–(1,1)`, `(1,1)–(2,1)`, `(1,2)–(2,2)`, `(0,0)–(0,1)` — the other 8 edges start open. Live region: `{(1,1),(0,1),(0,2),(1,2)}`, a 2×2 loop with two routes to `H_A`: N-then-E via `(0,1)`, or E-then-N via `(1,2)` |
| Engine fixture-legal targets & budgets | `ROAD_CLOSE` targets `{(0,1)–(0,2)}` only, budget 1; `SUPPLY_DELAY` budget 0; `FOG` budget 0; `PASS` unlimited. Cooldowns per §4 |
| Branching bound | MAX ≤ 3 anywhere in the live region (≤2 open exits + `WAIT`; on `H_A`'s tile the urgency rule leaves `{SERVE, WAIT}`); MIN ≤ 2. `tests.js` computes the exact complete-tree node count and asserts it ≤ 200; Act 1 renders every node (pan/zoom) |
| Design intent (verified in Step 4, whose hand-checked table is authoritative) | The N route can be cut by the Engine's one closure after MAX commits (best play → `H_A` unserved, utility −3); the E route cannot (`(0,2)–(1,2)` is not a legal target), so MAX guarantees `SERVE H_A` (+4). Intended root PV: `MOVE E → MOVE N → SERVE`. The teaching point: two routes look identical until you ask what the adversary can do |

### 3.2 Act 3 fixture **A3** (exact definition)

- Board: 5×5 orthogonal grid; coordinates `(row,col)`, `(0,0)` top-left.
- Start: volunteer at `(2,2)`; `t=0`, `T=12`.
- All 40 orthogonal grid edges start open.
- No initial fog, delay token, road closure, or cooldown.
- Households, all visible and initially unserved:
  - `H_A (0,2)`, need 3
  - `H_B (4,2)`, need 3
  - `H_C (2,0)`, need 2
  - `H_D (2,4)`, need 2
  - `H_E (0,0)`, need 1
  - `H_F (0,4)`, need 1
  - `H_G (4,0)`, need 1
  - `H_H (4,4)`, need 1
- Engine fixture-legal targets:
  - `ROAD_CLOSE`: any currently open grid edge allowed by §4
  - `SUPPLY_DELAY`: any unserved household allowed by §4
  - `FOG` and `PASS`: per §4
- Initial Engine budgets: road close 2, supply delay 2, fog 1.
- The symmetric logical grid defines search state only. The final RV Park artwork may use perspective and curved visual paths, but its interaction anchors must map one-to-one to these coordinates and edges.
- Any Step 3 recalibration must update this fixture and §4 together.

`engine.js` exports these fixtures as `A1F` (§3.1) and `A3` (§3.2) (Step 2).

## 4. Stress-Test Engine legal moves
| Move | Precondition | Effect | Budget/game | Cooldown |
|---|---|---|---|---|
| `ROAD_CLOSE(e)` | Edge `e` open, not previously closed | `e` impassable for 2 MAX plies | 2 | 1 ply |
| `SUPPLY_DELAY(h)` | `h` unserved, no delay token | Serving `h` costs +1 extra MAX ply while token active (2 plies) | 2 | 1 ply |
| `FOG` | Fog inactive | MAX move cost ×2 for next 2 MAX plies | 1 | 2 plies |
| `PASS` | Always | No effect | ∞ | — |

Budgets/cooldowns live in state (search sees them); they prevent strongest-move spam and keep trees small. The 2/2/1 budgets are **provisional calibration values** (Owner decision): Step 3 may make the smallest necessary adjustment and record the final delta in this document without a new approval loop — unless a change would touch MAX/MIN roles, the set of disruption types, or the core learning design, which still requires Owner review.

## 5. Implementation steps (ordered; each step gates the next)

**Step 1 — Scope freeze.** *Goal:* commit this document as the single spec. *Files:* `docs/LEVEL8_ARCHITECTURE_BLUEPRINT.md`. *Test gate:* Owner + Codex sign-off recorded in commit message. *Assets:* none. *Stop:* no code before sign-off.

**Step 2 — Shared game-state module.** *Goal:* one rules engine for all acts. *Inputs:* §3–4. *Files:* create `level8/engine.js` (pure functions: `initState(act)`, `legalMoves(s)`, `apply(s,a)`, `isTerminal(s)`, `utility(s)`, canonical ordering; exports fixtures `A1F` (§3.1) and `A3`). *Contract:* deterministic, side-effect-free, no DOM, no RNG. *Player-visible:* none yet. *Test gate:* `node level8/tests.js unit` — legality, budgets, cooldowns, constraint filter, terminal/utility on hand-built positions. *Assets:* none. *Stop:* any red test.

**Step 3 — Engine (MIN) rules-level invariant audit.** *Goal:* verify the rules cannot wedge — a rules-level audit only, with **no search and no solvability claim** (deliberate sequencing: exact solvability is proven for `A1F` in Step 4; `A3` robustness is benchmarked in Step 7). *Files:* `tests.js` cases. *Contract (invariants):* every nonterminal MAX state has ≥1 legal action (the `WAIT` guarantee, §3); durations and cooldowns expire deterministically per §3's declarative semantics; Engine budgets are bounded and strictly consumed; no combination of legal MIN moves creates a permanent rules-created lockout (every Engine effect is finite-duration or budget-limited). *Test gate:* invariant suite passes, including hand-built worst-case positions. *Stop:* none requiring re-approval — on failure, smallest budget/cooldown adjustment with the final delta recorded in §4; only changes to roles, disruption types, or learning design go back to the Owner (per §4 note).

**Step 4 — Minimax ground truth.** *Goal:* exact solver; this step **is the exact `A1F` solvability proof**. *Files:* `level8/search_core.js` (`minimax(s)` returning `{action, value, nodes, pv}`). *Contract:* full expansion to terminal on `A1F`; canonical tie-break. *Player-visible:* none. *Test gate:* `A1F` root value and PV match a hand-verified table committed in `tests.js` (expected per §3.1 design intent: value +4, PV `E→N→SERVE` — the hand check, not this document, is authoritative); a hand-verified root value > 0 constitutes the full-horizon solvability proof; node count recorded and ≤ 200 per §3.1. *Assets:* none. *Stop:* value table not hand-verified.

**Step 5 — Alpha-Beta + move ordering.** *Goal:* same answers, fewer nodes. *Files:* `search_core.js` (`alphabeta(s,α,β)` sharing evaluation with minimax; optional ordering hook). *Contract:* on **all** test positions: identical value; with canonical tie-break, identical action. Node reduction is asserted only on `A1F` (verified prunable). Ordering hook exposes `nodesExplored` for both natural and best-first order — the teaching comparison. *Test gate:* `tests.js ab` — value/action equality on **every position reachable from the `A1F` root** (exhaustive enumeration; count printed); `nodes_ab < nodes_minimax` on `A1F`; ordering demo reproduces two distinct counts. *Stop:* any inequality.

**Step 6 — Two-player adversarial MCTS.** *Goal:* honest large-tree search. *Files:* `search_core.js` (`mcts(s, iters, seed)`); uniform-random legal rollouts for both roles; visit-count root choice; per-root-action `{visits, mean}` exposed for visualization. **Adversarial UCT convention (explicit):** every node's stored mean value `x̄` is from **MAX's perspective**. At a MAX-to-move node, selection maximizes `x̄ + C·√(ln N / n)`; at a MIN-to-move node, selection minimizes `x̄ − C·√(ln N / n)` (equivalently: maximizes `−x̄ + C·√(ln N / n)`) — both roles favor underexplored children, and unvisited children are expanded first. *Contract:* no determinization; no randomized MIN policy inside the tree; seeded PRNG only inside MCTS (rules stay deterministic). No claim that any fixed iteration count equals Minimax; no monotonicity assumption — finite-sample MCTS need not improve monotonically in iters. *Test gate:* `tests.js mcts` — on `A1F`, seeds {1…20} × iters {100, 500, 1500, 3000}: (a) **determinism** — re-running the same seed set reproduces the results table byte-identically; (b) **calibrated endpoint** — at iters=3000, action-match-rate vs. minimax ≥ `T_match` and mean utility regret ≤ `T_regret`, thresholds calibrated once on this frozen seed set and committed as constants in `tests.js` (so the gate cannot flake). The full table across all budgets is reported, not asserted; trends are described observationally. *Stop:* endpoint below threshold → fix before UI.

**Step 7 — Reproducible test harness + A3 robustness benchmark.** *Goal:* one command, all gates — plus the `A3` gate, placed here because it needs Alpha-Beta (Step 5) and MCTS (Step 6) to exist. *Files:* `level8/tests.js` (steps 2–6 suites + `--convergence` + `--a3bench`). *A3 robustness gate:* evaluate `A3` reproducibly against a **documented, fixed suite of strongest-available scripted MIN policies plus a fixed-depth Alpha-Beta MIN** (depth, any cutoff evaluation, and the reference MAX policy all documented in `tests.js`); the reference MAX policy must retain **positive utility** under this calibrated benchmark. **This is an adversarial robustness benchmark — not proof of full-game solvability or optimality** — and is described as such wherever its numbers are cited. An exact memoized `A3` solve may be attempted later as an optional diagnostic, never as a release blocker. On failure, budget/cooldown recalibration follows the §4 note. *Test gate:* `node level8/tests.js` exits 0 (invariants, ground truth, AB equality, MCTS endpoint, A3 benchmark); README-able output block. *Stop:* harness not in repo (numbers may not be quoted anywhere until it is).

**Step 8 — Three-act gameplay loop.** *Goal:* immersive play per fixed decisions. *Files:* rewrite `level8/index.html` (imports engine/search; no game rules in UI layer); `level8/strings.js`. *Player-visible:* Act 1 — player walks the volunteer tile-by-tile through `A1F`, taps the edge/house where they expect the Engine to strike, Engine replies with its Minimax-best move, then the **complete `A1F` tree** (§3.1, ≤200 nodes, pan/zoom) unfolds with the worst-case line lit. Act 2 — same fixture replays; pruned branches gray out with ✂️ beside a live explored-node counter; a move-ordering toggle shows Step 5's two counts. Act 3 — larger park; translucent "future volunteers" rehearse routes that thicken/brighten with visit count; Engine plies animate on the totem. Engineer View (collapsed by default) holds the slider and stats. *Test gate:* scripted DOM-stub playthrough of all three acts, zero exceptions; prediction interactions fire learning-evidence events (Step 11); no `<details>` teaching, no button-grid play. *Assets:* per the Step 9 contract table. *Stop:* any act unplayable on 390×844 viewport.

**Step 9 — Visual asset contract.** *Goal:* Codex produces art to spec. *Files:* none (table below is the contract). *Stop:* placeholder rectangles acceptable for testing; release blocked until real assets land.

All backgrounds are **new art produced by Codex** (Owner decision); the existing `assets/hunters_point_map.png` serves as a visual-language reference only — it is **not** the Act 3 base image. Multi-state art ships as one horizontal sprite strip per file (`_sheet` suffix), frame 0 leftmost, exact sheet dimensions below; single-state art is one static frame, animated only by CSS (fade/position).

| Filename | Purpose | Sheet size (frames × frame size, left→right order) | BG | Anchor/collision | Acts |
|---|---|---|---|---|---|
| `l8_bg_grove.png` | Act 1/2 backdrop (small grove corner of park; new art) | 1 × 1080×1620 portrait | full | none | 1,2 |
| `l8_bg_park.png` | Act 3 backdrop (wider RV park; new art, reference-only note above) | 1 × 1080×1620 portrait | full | none | 3 |
| `l8_volunteer_sheet.png` | MAX pawn | **1536×256** = 6 × 256×256: `idle, walk1, walk2, walk3, walk4, serve` | transparent | feet-center; 96px tile | all |
| `l8_ghost_volunteer_sheet.png` | MCTS rehearsal copies | **512×256** = 2 × 256×256: `walk1, walk2` (50 % opacity baked) | transparent | feet-center | 3 |
| `l8_engine_totem_sheet.png` | Labeled MIN adversary | **384×192** = 2 × 192×192: `idle, active` | transparent | center | all |
| `l8_house_marker_sheet.png` | Household marker | **320×160** = 2 × 160×160: `normal, served` | transparent | center; 96px tile | all |
| `l8_need_badges.png` | Need 1/2/3 badges | **192×64** = 3 × 64×64: `need-1, need-2, need-3` | transparent | top-right of marker | all |
| `l8_roadblock.png` | Closed edge | 1 × 128×128 (appear = CSS fade) | transparent | edge midpoint | all |
| `l8_fog_overlay.png` | Fog effect | 1 × 1080×1620 (fade in/out = CSS opacity) | translucent | none | all |
| `l8_tree_node_sheet.png` | Tree-view node frame | **192×96** = 2 × 96×96: `lit, pruned` | transparent | center | 1,2 |

**Step 10 — Mobile / language / accessibility.** *Goal:* meet access requirements. *Files:* `index.html`, `strings.js`. *Contract:* mobile-first portrait; touch targets ≥ 44px with text labels; plain language; icons paired with text; no color-only information (badges: shape+number); no mandatory timed reading; pause/replay/restart/safe-home; `prefers-reduced-motion` honored (ghosts become static paths); fully playable without audio, audio cues get visible equivalents; static hosting, tolerant of unstable connections (no CDNs beyond existing GA4). EN/zh-Hant/ES via `strings.js` only. *Test gate:* manual checklist on phone + string-coverage script (no hard-coded display text outside `strings.js`). *Stop:* any checklist miss.

**Step 11 — Learning-evidence events.** *Goal:* evidence from play, not quizzes. *Files:* `index.html` (GA4 wrapper). *Events:* `l8_predict_engine {predicted, actual, match}` (Act 1 prediction), `l8_prune_predict {edge, wasPruned}` (Act 2 tap-before-reveal), `l8_rehearsal_follow {followed, bestVisits}` (Act 3 follow-or-override), plus `level_start/complete/abandon`. *Claim discipline:* GA4 is instrumentation for a **planned usability evaluation** — never described as research validation. *Test gate:* events fire in stub playthrough with correct payloads. *Stop:* none.

**Step 12 — Release & GitHub gates.** *Goal:* controlled ship. *Sequence:* (1) `tests.js` green in CI-style local run; (2) Owner plays all acts on phone; (3) Codex visual QA; (4) upload `level8/` + `docs/`; (5) homepage unlock is a **separate, Owner-triggered commit**; (6) only then alignment edits elsewhere. *Future alignment work (listed, not done here):* README L8 row → three-act wording; `level7` ending → one hand-off line (values → search); homepage card copy. *Stop:* any gate fails → Coming Soon stays.

## 6. Future roadmap (out of V1 scope)
Partial observability with ISMCTS/belief states (Advanced Mode); weighted terrain; coin-unlock progression; empirical learning study design after usability evaluation.
