# Level 7 修正版 v2.0

**日期**: 2026年1月19日  
**修正者**: Claude (協助美嫻)

---

## ✅ 修正內容

### 1. 打字機音效 ✅
- 保留原有 `playTypeSound()` 函數
- 每 3 個字元播放一次溫暖的 click 音效
- 使用 Web Audio API 產生程式化音效

### 2. 新增導航按鈕

| 按鈕 | 功能 | 位置 |
|------|------|------|
| 🎬 Story | 重播 29 秒開場影片 | 左下角浮動按鈕 |
| ⬅ Level 6 | 返回第六關 | 所有結局畫面 + 靜心之門 |
| 🏠 Home | 回到主頁面 | 靜心之門 |
| ↻ Play Again | 重玩本關 | 所有結局畫面 + 靜心之門 |
| 🌳 Hope Tree | 前往 Outro | 靜心之門 |

### 3. 導航邏輯

```
Level 6 ← [⬅ Level 6]
         ↓
     Level 7 遊戲
         ↓
  結局 A / B / C
         ↓
    靜心之門 (4-4-4 呼吸)
         ↓
[🌳 Hope Tree →] → Outro
```

### 4. 新增函數

```javascript
// 返回 Level 6
function goToLevel6() {
    stopBackgroundMusic();
    stopAtaraxyMusic();
    window.location.href = '../level6/index.html';
}

// 重播 29 秒故事
function goToStory() {
    stopBackgroundMusic();
    stopAtaraxyMusic();
    window.location.href = '../index.html?play=intro';
}
```

---

## 📁 檔案清單

| 檔案 | 說明 |
|------|------|
| index.html | 主遊戲檔案（已修正） |
| L7_trolley_background.png | 遊戲背景 |
| L7_5families.png | 選項 A：五個家庭 |
| L7_1elder.png | 選項 B：一位長者 |
| L7_lever_switch.png | 封面：雙閘門 |
| L7_ai_advisor.png | AI 顧問頭像 |
| L7_ending_A/B/C.png | 三種結局背景 |
| 靜心之門.png | Ataraxy Portico 背景 |
| L7_火車動.mp4 | 火車動畫 |
| L7_suspense_mp3.mp3 | 緊張背景音樂 |
| L7_switch_mp3_mp3.mp3 | 拉桿音效 |
| ataraxy-music.mp3 | 靜心之門平靜音樂 |

---

## 🚀 部署步驟

1. 將整個 `level7/` 資料夾上傳到 GitHub
2. 確保路徑結構為：
   ```
   journey-of-kindness/
   ├── index.html (主頁面)
   ├── level6/
   │   └── index.html
   ├── level7/
   │   └── index.html (本檔案)
   └── outro.html
   ```
3. 測試所有導航連結是否正常

---

*Made with 💗 for Journey of Kindness*
