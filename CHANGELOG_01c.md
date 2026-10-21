# JOK 01c（2026-10-21，明覺製作，基準 commit 233727b）

- level1/index.html watchAStar()：原本只在「正式挑戰」(challengeMode) 才播提示，玩家在示範結束後的交棒段按鈕會重新啟動整段示範，把玩家位置重設為 0。改為只要 gameState.mode === 'player' 就播「目前位置→下一個路標」的提示；AI 演示中或尚未開始才重播示範。GA4 的 l1_hint_astar 仍只在正式挑戰送出。
- 其餘零變更。
