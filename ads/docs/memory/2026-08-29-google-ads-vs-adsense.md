# 2026-08-29 — 為什麼這個 repo 叫 ads 卻走 AdSense

## 背景

需求原話是「create google ads integration to show the google ads in the web page,
and can get the payment」。字面上指名 `Google Ads`,但描述的行為是
「在網頁上顯示廣告」加「收到款項」。

## 決策

走 `Google AdSense`,不是 `Google Ads`。

## 理由

這兩個產品在金流上是`相反`的:

- `Google Ads` 是廣告`購買`平台。註冊後綁信用卡,你付錢買別人網站上的曝光。
- `Google AdSense` 是廣告`變現`平台。你提供版位,Google 付錢給你。

需求裡的「get the payment」把方向定死了 —— 錢要`進來`,那就只有 AdSense
(以及它的變體 AdMob / Ad Manager)。名稱的混淆很普遍,因為口語上
「放 Google 廣告」兩邊都講得通。

`AdMob` 排除:那是 App 內廣告,本工作區沒有原生 App。
`Ad Manager` 排除:那要月曝光數百萬且需要自售直接廣告,規模不對。

## 後果

- repo 目錄名保留 `ads`(領域名稱,中性),但文件一律寫 `AdSense`。
- `README.md` 開頭第一節就放對照表 —— 這個錯置會讓人整條路走反,
  值得佔用最前面的版面。
- 術語表 [../terminology.md](../terminology.md) 是唯一定義來源。

## 順帶量到的事實

建立稽核腳本時實測 `outfit` / `vidnote` / `fun` / `feedback` 四個網域:
`/ads.txt` 與 `/privacy` 全部回 `404` 而非連線失敗。這代表 Cloudflare tunnel
與 nginx 路由層都是通的,缺的只是檔案本身 —— 修正落在 `inf`,不在本 repo。
