# 表情偵探社

適合兩人在車上、等餐、排隊或睡前玩的低音量心情猜謎。演員偷看一張心情卡，用表情與小動作演出；偵探猜完後交換角色。

## 玩法

1. 演員偷看心情、想像場景。
2. 按「藏起答案」，把手機交給偵探。
3. 演員用表情或安靜手勢演出，偵探猜心情並說明觀察線索。
4. 玩完 5 回合結案，沒有輸贏或扣分。

## 本機執行

在 repository 根目錄啟動靜態伺服器：

```bash
python3 -m http.server 8000
```

開啟 `http://localhost:8000/apps/tiny-expression-detective/`。

## 測試

```bash
node apps/tiny-expression-detective/test-core.js
```
