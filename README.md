# 親子小工具合集

適合手機上快速開啟的親子互動小工具合集，目標是讓車上、餐廳、排隊、睡前等零碎時間變得更容易互動。

## 目前工具

- `apps/tiny-adventure-dice/`：親子任務骰子
- `apps/tiny-taxi-meter/`：小小計程車跳錶
- `apps/tiny-sound-hunter/`：安靜聲音獵人
- `apps/tiny-rhythm-train/`：手指節奏小火車
- `apps/tiny-expression-detective/`：表情偵探社
- `apps/tiny-one-line-drawing/`：一筆猜猜畫
- `apps/tiny-memory-suitcase/`：記憶旅行箱
- `apps/tiny-color-scouts/`：小小顏色搜查隊

## 正式部署

- 正式網址：<https://xn--kdw.tw/kids/>
- `https://xn--kdw.tw/` 保留既有 Cloud Lab 首頁。
- 網站由班班 VPS 的 Nginx／Traefik 提供，部署內容為 `main` 的純靜態 runtime 檔案。
- 舊 Vercel 網址僅作遷移轉址，所有路徑會永久導向 `https://xn--kdw.tw/kids/` 下的對應路徑。

## 隱私

公開版本不得包含小朋友或家庭真實照片、Picker 下載檔、候選圖、EXIF、相簿來源資訊或相關憑證。親子工具若需個人照片，只能採瀏覽器端當次選取且不離開裝置的設計。
