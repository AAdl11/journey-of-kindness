# Level 6 — First-Order Logic

## Release identity

- Entry point: `index.html`
- Algorithm: First-Order Logic and the Closed-World Assumption (AIMA Chapters 8–9)
- Story opening and Level 5-to-6 transition: the 2006 raw-rice incident at John Muir Elementary
- Canonical transition: **Ataraxy Portico（靜心之門）**
- Owner assets: 8 approved story images and 4 audio tracks
- Mobile behavior: follows the protected `level1_STABLE_手機OK.html` contract
- Ataraxy UI: Traditional Chinese, English, and Spanish (`Portal de la Serenidad`)

## Music acts

1. Raw-rice opening transition: `rice_incident.mp3`
2. FOL Court / 「一念之間」: `funny-suspenseful-cartoon-style-music-336058.mp3`
3. System judgment, objection, and investigation: `bad-day-137530.mp3`
4. Ataraxy Portico: `ataraxy-music.mp3`

Navigation within the same act does not restart its track. The first tap starts the
music selected for the destination screen; it must not force the opening track back on.

## Self-contained runtime

Level 6 owns every image and audio file it uses. Player-facing runtime files must not reference `../assets/`, another level, or another mutable shared folder.

## Release gates

Run from the repository root:

```bash
node level6/asset_check.js
node level6/tests.js
```

The gates verify asset hashes, all local references, story-screen transitions, canonical naming, Spanish Ataraxy UI, four-act music mapping, portrait/landscape mobile rules, and the absence of external runtime dependencies.
