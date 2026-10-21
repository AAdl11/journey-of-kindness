# 規格 02 檢查結果

【已查證】本包基準為 repo `AAdl11/journey-of-kindness` 的版本 `233727b9b18e40a09b822208e81da46b2ebab297`；來源：本次 GitHub 讀取與 baseline.json。

## 結果與限制

【已查證】14 組來源檔／記憶體 DOM 測試全部 PASS；測試直接載入本包引擎、渲染器與首頁程式，使用假時鐘檢查分鏡，不連線正式分析後台。來源：本次測試輸出及附錄 results-spec02.json。

【已查證】預覽服務啟動成功，但預覽瀏覽器存取被其安全政策拒絕。依該政策未繞過或改用其他瀏覽器控制途徑。因此，以下項目**尚未驗收**：390px 真正渲染與無橫向捲動、桌機畫面視覺檢查、手機實機與效能、真實媒體播放、GA4 DebugView。記憶體 DOM 不計算畫面幾何，不能替代以上檢查。來源：本次工具回傳。

【已查證】樣式已採 viewport、100svh、clamp 字級、可點元素 touch-action、窄螢幕單欄章節清單與固定第一屏下緣按鈕；這是程式實作狀態，不是實測通過聲明。來源：index.html 與 assets/css/door.css。

## 程式檢查

- 【已查證】PASS — baseline bytes and shared engine/renderer unchanged。來源：results-spec02.json。
- 【已查證】PASS — GA initialization preserved byte-for-byte in script elements。來源：results-spec02.json。
- 【已查證】PASS — removed quotes/social links and no autoplay attributes。來源：results-spec02.json。
- 【已查證】PASS — all eight original SVGs inlined verbatim。來源：results-spec02.json。
- 【已查證】PASS — three-language groups complete; LPC confined to two prescribed groups。來源：results-spec02.json。
- 【已查證】PASS — one door_seen; visible CTA; no media play; search starts at 2000ms。來源：results-spec02.json。
- 【已查證】PASS — roadblock restarts from original start; event after replay; toast displayed。來源：results-spec02.json。
- 【已查證】PASS — credits after interaction; second shared-engine map; CTA event。來源：results-spec02.json。
- 【已查證】PASS — idle visitor transitions at 15000ms without a roadblock。來源：results-spec02.json。
- 【已查證】PASS — rapid edits retained; no-path preserves walls and permits removal before transition。來源：results-spec02.json。
- 【已查證】PASS — all saved languages restored; only L1/L4/L8 checked; progress data not rewritten。來源：results-spec02.json。
- 【已查證】PASS — malformed/unavailable storage does not break the page。來源：results-spec02.json。
- 【已查證】PASS — mini grid loops at 200ms while visible and pauses off screen without media。來源：results-spec02.json。
- 【已查證】PASS — video source/play only after explicit footer click; close unloads it。來源：results-spec02.json。

## 保護檔案

【已查證】以下基準原檔重新計算 Git blob SHA 均相符；本更新包完全不包含這些路徑，因此套用時不會覆蓋。共用引擎與渲染器的隨包副本也與基準位元組相同。來源：本次雜湊比對與壓縮檔成員清單。

| 路徑 | 基準 Git blob SHA |
|---|---|
| `outro.html` | `acaa5740b8e7e4448183f2016259b5a513b7ed46` |
| `level1/level1_STABLE_手機OK.html` | `5fab3bc04c751c47bc8657ccce8b9ffaf626b8fe` |
| `level1/index.html` | `c751f00e71c86b5921e3e29b6917c4506309e59f` |
| `level2/index.html` | `41617a2ea791e3077ce34e9515250115371105aa` |
| `level3/index.html` | `c6abee763a99f8e8ddcc49e230ee9556558cf285` |
| `level4/index.html` | `ac45dbf84f16ef4dd62534af36f26f6b22fb4724` |
| `level5/index.html` | `650137b81984a55598ab12bc25926bfc659aea52` |
| `level6/index.html` | `4878e206c2970148a1a021f851f6b59214a2f49b` |
| `level7/index.html` | `fd2abcce5967638990602aa7d66cf888b797137f` |
| `level8/index.html` | `52db07110557879e19c4af94285812bb7625abac` |

## 交付範圍

【已查證】更新包包含首頁、新增首頁樣式／程式、未修改的共用引擎／渲染器及社區底圖；既有影片、音樂與關卡沿用 repo 原檔。來源：壓縮檔成員清單。

【不知道】未取得實機、實際瀏覽器渲染或分析後台接收結果，不能宣稱規格 02 全部驗收通過；請依手機清單補驗。
