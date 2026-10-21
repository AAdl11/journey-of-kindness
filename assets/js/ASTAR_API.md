# 共用搜尋介面

【已查證】以下介面依本包 `astar-engine.js`、`astar-renderer.js` 及其瀏覽器測試整理。沒有框架、建置步驟或頁面專屬全域變數依賴；先載入引擎，再載入渲染器。首頁本次未修改。

```html
<div id="search-board"></div>
<script src="assets/js/astar-engine.js"></script>
<script src="assets/js/astar-renderer.js"></script>
<script>
const grid = AStarEngine.createGrid({
  cols: 12, rows: 12,
  walls: [{x: 3, y: 2}],
  start: {x: 0, y: 0}, goal: {x: 11, y: 11}
});
const view = mountAStar(document.getElementById('search-board'), grid, {
  cellSize: 40,
  gap: 3,
  colors: {frontier: '#626d38', path: '#71ba8a'},
  editable: true,
  onDone(path) { /* 呼叫端處理完成狀態 */ },
  onNoPath() { /* 呼叫端提供自己的三語無路提示 */ }
});
// 由使用者操作觸發，以便瀏覽器允許音效。
// playButton.addEventListener('click', () => view.setSpeed(350).play());
</script>
```

## 引擎

【已查證】來源：`astar-engine.js`。

- `createGrid({cols, rows, walls, start, goal})` 複製輸入座標，四方向移動，每步成本為 1；曼哈頓距離估計。
- `astarSteps(grid)` 成功時回傳快照陣列，最後一筆有 `path`。無路時依原規格回傳 `{steps, path: null}`，**不是陣列**；請用 `Array.isArray(result)` 區分。
- 快照含 `current`、`open: [{x,y,f}]`、`closed: [{x,y}]`、`cameFrom`；另提供 `g/h/f` 供面板顯示。
- `cameFrom` 的 key 是 `"x,y"`，value 是前一格的 `{x,y}`。每張快照都有獨立複本。
- 成功路徑包含起點與終點；起點等於終點時有一個點。非法座標會擲出錯誤；被牆占用的端點回傳無路。
- 預設同分時優先較大的 `g`，與原動畫紀錄器一致。可在 `createGrid` 額外傳 `tieBreak:'fifo'`，供原關卡的路徑計算保留原排序；首頁使用預設即可。
- 傳統瀏覽器腳本匯出 `AStarEngine`；亦支援 `require()`。沒有使用 DOM 或亂數。

## 渲染器

【已查證】來源：`astar-renderer.js`、`QA_REPORT.md`。

| 方法 | 行為 |
|---|---|
| `play()` | 從目前進度播放；已完成時先 `reset()` 才重播 |
| `pause()` | 停在目前畫面 |
| `step()` | 暫停自動播放並前進一個搜尋／路徑動畫步驟 |
| `reset()` | 使用目前的牆配置回到第零步；不自動播放、不移除使用者新增的牆 |
| `setSpeed(ms)` | 設定正數毫秒間隔；預設為 350 |
| `onDone(cb)` | 設定完成回呼，收到完整路徑；路徑逐格亮完才觸發 |
| `onNoPath(cb)` | 設定無路回呼；搜尋播至 frontier 耗盡後觸發；也可透過 options 提供 |
| `dropWall(x,y)` | 一般道路加牆、既有牆移除；起終點僅移除牆、保持可走。保留原起點，重新搜尋並從零播放，間隔為最近設定值的一半；不會每次再對半累乘 |
| `destroy()` | 停止計時與回呼；同一容器再次 mount 時會自動清理舊實例 |

【已查證】`dropWall` 不修改呼叫端傳入的 grid，無路時保留牆；越界／非整數座標忽略。頁面可用 `editable:true` 讓格子接受點擊或鍵盤操作；預設不自行綁加牆操作。來源：渲染器與獨立容器測試。

【已查證】可選 `options`（來源：渲染器）：

| 選項 | 用途 |
|---|---|
| `cellSize`, `width`, `gap`, `padding`, `fontSize` | 數字視為 px，也可傳 CSS 長度字串；格子尺寸為上限，容器變窄時縮小 |
| `colors` | 名稱對應下列 CSS 變數去掉 `--astar-` 前綴 |
| `sound` | 布林值或回傳布林值的函式，讓呼叫端接自己的靜音開關 |
| `vibrate` | 設為 `false` 可關閉震動；預設每步嘗試 `navigator.vibrate(8)` |
| `onStep(snapshot,index)` | 每個搜尋快照的通知，供數字面板更新；路徑亮起階段不再呼叫 |
| `onCellClick(x,y)` | 自訂格子操作，優先於 `editable` 的加牆行為 |
| `renderCell(cell,point,frame)` | 自訂格子圖示；渲染器仍管理搜尋狀態樣式 |
| `hostLayout` | 既有關卡的版面相容選項；一般新容器省略即可 |

【已查證】CSS 變數（來源：渲染器內的局部樣式）：尺寸有 `--astar-cell-size`、`--astar-width`、`--astar-gap`、`--astar-padding`、`--astar-radius`、`--astar-cell-radius`、`--astar-font-size`、`--astar-score-size`；顏色有 `--astar-board`、`--astar-cell`、`--astar-border`、`--astar-text`、`--astar-wall`、`--astar-frontier`、`--astar-frontier-border`、`--astar-closed`、`--astar-current`、`--astar-path`、`--astar-path-glow`。設在容器上即可；`--astar-cols` 由實際地圖欄數設定。

【已查證】既有關卡另用 `redraw(snapshot,path)` 與 `refresh()` 重畫故事圖示；這些方法不推進搜尋、不播放音效、不觸發完成回呼。聲音與震動不支援時會靜默略過。來源：渲染器原始碼。
