# Level 5 — Bayesian Networks

## Release identity

- Entry point: `index.html`
- Algorithm: Bayesian Networks (AIMA Chapters 12–13)
- Story frame: understanding why community volunteers stay
- Canonical transition: **Ataraxy Portico（靜心之門）**
- Owner playtest: approved except for the corrected Ataraxy Portico English label, 2026-08-22
- Mobile behavior: follows the protected `level1_STABLE_手機OK.html` contract

## Self-contained runtime

Level 5 owns every image and audio file it uses. Player-facing runtime files must not reference `../assets/`, another level, or another mutable shared folder.

## Release gate

Run from the repository root:

```bash
node level5/asset_check.js
```

The gate verifies approved asset hashes, all local references, canonical naming, portrait/landscape mobile rules, and the absence of external runtime dependencies.

## Owner-protected decisions

- Do not replace or remove an image or audio file without Owner review.
- Do not rename **Ataraxy Portico（靜心之門）** as “Gate of Stillness” or “Ataraxy Portal.”
- Do not delete or replace the Level 1 stable mobile standard while maintaining this level.
