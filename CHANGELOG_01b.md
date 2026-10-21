# JOK 01b（2026-10-21，明覺製作，基準 commit fb482db）

## 改了什麼
- level1/index.html：修兩個原版 bug。
  1. aiStepForward()：快轉時不再先呼叫 stopCinematic()，改為清計時器與提示後直接 handoffToPlayer()，所以不會卡在 AI 模式。
  2. 方向鍵：movePlayer() 接受絕對座標，鍵盤改傳「目前位置 ± 1」，連按會連走。
  故事文案、引言、圖片、音樂、GA4 事件零變更；三段 <script> 語法檢查通過。
- outro.html：移除 Facebook 與 Instagram 兩張 QR 卡片及其 CSS；問卷 QR 保留並置中；許願樹、14 張真實故事、回主頁按鈕不動。
- assets/icons/l1_route.svg … l8_hourglass.svg：八個原創線條圖示（24×24、stroke=currentColor），給規格 02 首頁卡片用。

## 套用
解壓到 repo 根目錄覆蓋同名檔案。
