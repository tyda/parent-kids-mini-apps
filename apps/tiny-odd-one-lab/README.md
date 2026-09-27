# 怪怪分類研究所

一個適合手機、可離線使用的親子分類討論遊戲。每題會顯示四張圖卡，玩家輪流挑出「最不一樣」的一張並說明理由，再對照研究所的參考線索。

## 玩法

1. 小小研究員與大研究員輪流先選圖卡。
2. 選完後說出分類理由；完成一個理由可收集一顆星。
3. 若能找出另一種合理分法，再收集第二顆星。
4. 一局六題，約 5–10 分鐘。答案允許多種解釋，重點是觀察與表達。

## 本機執行

在 repository 根目錄啟動靜態伺服器：

```bash
python3 -m http.server 8000
```

開啟 `http://localhost:8000/apps/tiny-odd-one-lab/`。

## 測試

```bash
node apps/tiny-odd-one-lab/test-core.js
node --check apps/tiny-odd-one-lab/app.js
node --check apps/tiny-odd-one-lab/sw.js
```

所有題目、圖示與狀態皆隨程式提供；不需帳號、不讀取照片，也不會上傳資料。
