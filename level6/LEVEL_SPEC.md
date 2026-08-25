# Level 6 — First-Order Logic

## Release identity

- Entry point: `index.html`
- Algorithm: First-Order Logic and the Closed-World Assumption (AIMA Chapters 8–9)
- Story opening and Level 5-to-6 transition: the 2006 raw-rice incident at John Muir Elementary
- Canonical transition: **Ataraxy Portico（靜心之門）**
- Owner assets: 8 approved story images and 4 audio tracks
- Mobile behavior: follows the protected `level1_STABLE_手機OK.html` contract
- Localization: complete Traditional Chinese, English, and Spanish coverage for
  story text, FOL engine labels, evidence forms, results, Jing Si Aphorisms,
  navigation, and Ataraxy Portico (`Portal de la Serenidad`)

## Music acts

1. Raw-rice narrative only: `rice_incident.mp3`. It starts from the explicit
   **Start Story** tap, does not loop, and stops/reset at **25 Years Later**.
2. FOL Court / 「一念之間」: `funny-suspenseful-cartoon-style-music-336058.mp3`
3. System misjudgment and bad ending: `bad-day-137530.mp3`
4. Ataraxy Portico: `ataraxy-music.mp3`

Navigation within the same act does not restart its track. Choosing **Object** ends
`bad-day-137530.mp3` and restores the FOL investigation track. Unrelated first taps
(for example, changing language) must not start or replace story music.

## Self-contained runtime

Level 6 owns every image and audio file it uses. Player-facing runtime files must not reference `../assets/`, another level, or another mutable shared folder.

## Release gates

Run from the repository root:

```bash
node level6/asset_check.js
node level6/tests.js
node tools/i18n_gate.js
```

The gates verify asset hashes, all local references, story-screen transitions,
canonical naming, complete Spanish UI and dynamic FOL output, the scene-accurate
four-track music mapping, portrait/landscape mobile rules, and the absence of
external runtime dependencies. Unmarked visible text fails the localization gate
unless it is explicitly identified as a stable name, score, or FOL expression.
