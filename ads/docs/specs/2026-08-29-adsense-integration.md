# AdSense 整合設計與缺口盤點 (2026-08-29)

## 摘要

目標:在 `shuks.dev` 底下的站台顯示廣告,並實際收到 Google 的匯款。

現況:`本 repo 的嵌入端已完成`,但整條路上還有 `16 個 FAIL`,其中`只有 3 個是程式問題`。
最慢的兩段(帳號審核、地址 PIN 明信片)是`外部等待`,加起來通常 4 到 8 週。
先把它們排到最前面啟動,其餘工作可以平行進行。

稽核用 `./scripts/check.sh`,本文是它每一條的理由與修法。

## 一、名詞錯置(這條決定其餘全部)

需求原話是「Google Ads」,但要達成的是「在網頁上顯示廣告並收款」。
這兩件事在 Google 的產品線上是`相反的兩端`:

- `Google Ads` = 你`付錢`買曝光(廣告主)
- `Google AdSense` = Google `付錢`給你(發布商)

走錯產品的症狀是:開了 Google Ads 帳號、綁了信用卡、然後發現系統在跟你要錢。
本設計全程走 `AdSense`。詳細對照見 [../terminology.md](../terminology.md)。

## 二、缺口盤點

### A. 帳號與資格 —— `全部未開始`,且是最長的路徑

| # | 缺口 | 影響 | 誰能修 |
| --- | --- | --- | --- |
| A1 | 沒有 AdSense 帳號, 沒有 `ca-pub-` Publisher ID | 整條路的前置, 沒有它其餘全部無意義 | 只能人工申請 |
| A2 | 沒有一個站符合「原創且有實質內容」 | 審核最常見的拒絕理由 `Low Value Content` | 需要先產內容 |
| A3 | 網域已公開可存取 | `已滿足` — Cloudflare tunnel 已上線, 實測有回應 | — |

`A2 是真正的瓶頸`。目前 `shuks.dev` 底下的站分成兩類,兩類都過不了審核:

- `工具型` (feedback / identity / webhook) —— 功能站, 沒有可供閱讀的內容頁面
- `登入後才有內容` (feedback admin, 只聽 127.0.0.1) —— 審核員根本看不到

AdSense 審核員是`匿名訪客`。他打開網址看到的東西, 就是審核的全部依據。
可行的方向有二,擇一即可:

1. 挑一個站(`vidnote` 或 `fun` 較有機會)補上`公開的內容頁面` —— 教學、
   說明、文章列表,至少 15 到 20 頁有實質內容的頁面。
2. 另開一個純內容站(部落格 / 文件站),先讓它過審。AdSense 帳號是`帳號層級`的,
   過審之後其他網域只需要走比較短的「新增站台」流程。

### B. 收款前置 —— 未開始, 且其中一項含`實體郵寄等待`

| # | 缺口 | 影響 |
| --- | --- | --- |
| B1 | 稅務資訊未提交 | 台灣個人需填 `W-8BEN`。未提交會依美國稅法預扣`最高 30%`, 甚至暫停付款 |
| B2 | 身分驗證文件未上傳 | 未通過不撥款 |
| B3 | 地址 PIN 未驗證 | 達驗證門檻時 Google 以`國際平信`寄 6 位數 PIN, 官方說法約 `3 週`送達且`無追蹤號碼`。未輸入 PIN 則永遠不撥款 |
| B4 | 沒有綁定可收 USD 的銀行帳戶 | 電匯需要`外幣帳戶` + `SWIFT code`, 開戶要臨櫃 |
| B5 | 付款門檻 `100 USD` | 未達門檻只累積不撥款, 達標後於次月 21 至 26 日撥款。以個人站的流量規模, 累積到門檻可能是`數個月` |

`PIN 必須等收益先達到驗證門檻才會寄`,不能提前申請。Google `不公開`該門檻金額。
這代表「開始有收益」到「收到第一筆錢」之間,天然存在數週的行政延遲。
把 B1 / B2 / B4 現在就做完,才不會在明信片到的時候還卡別的。

### C. 法遵與同意 —— 未開始, 且會直接吃掉收益

| # | 缺口 | 影響 |
| --- | --- | --- |
| C1 | 沒有隱私權政策頁 | AdSense 政策`強制要求`。實測 4 個網域的 `/privacy` 全部 404 |
| C2 | 沒有安裝 Google 認證 CMP | 2024-01-16 起, 未整合 TCF 的認證 CMP 就`不能對 EEA / UK 投放個人化廣告`, 只剩非個人化與限定廣告, 收益大幅縮水 |
| C3 | 沒有 cookie 同意機制 | GDPR / ePrivacy 違規風險 |
| C4 | 沒有 CCPA / 美國各州的 opt-out | 美國部分州流量的合規風險 |

C1 是`一頁靜態 HTML 就能解決`的事,但它是硬性政策要求,沒有就不會過審。
C2 的正解是接 `Google Funding Choices`(Google 自家 CMP,免費且天然通過認證),
接上之後由它呼叫本 repo 的 `window.ads.grantConsent()`。

### D. 技術缺口 —— `本次已修 3 項, 剩 2 項在別的 repo`

| # | 缺口 | 狀態 |
| --- | --- | --- |
| D1 | 沒有版位載入器 | `已修` — `web/ads.js`, 含 dev guard / 佔位 / lazy / consent gate |
| D2 | 沒有 `ads.txt` 內容 | `已修` — `public/ads.txt` 樣板, 待填 Publisher ID |
| D3 | 沒有上線前稽核 | `已修` — `scripts/check.sh`, 可進 CI |
| D4 | `ads.txt` 在各網域上是 404 | `未修, 落在 inf` — nginx 是純 reverse proxy, 只端 `/health` 與 `robots.txt`, 需要新增 `/ads.txt` 的 location |
| D5 | 沒有收益資料回收 | `未修` — 若要把 RPM / 收益進 Grafana, 需要 AdSense Management API 的 OAuth 憑證 |

D4 實測結果:4 個網域的 `/ads.txt` 全部回 `404`,代表`網域活著但檔案不存在`。
這是好消息 —— 路由層是通的,只差一個 location 區塊。

另外兩點在動 CSP 之前不會浮現,先記著:

- 若之後加 `Content-Security-Policy`,需放行 `pagead2.googlesyndication.com`、
  `googleads.g.doubleclick.net`、`tpc.googlesyndication.com`、
  `fundingchoicesmessages.google.com`。漏掉會`靜默失效`,沒有錯誤訊息。
- `nginx` 的 `limit_req` 目前是 `10r/s`。廣告會讓單頁請求數上升,
  上線後要看 429 有沒有變多。

## 三、無效流量:唯一會讓你`失去帳號`的風險

其餘所有缺口的後果都是「賺不到錢」,只有這一項的後果是「帳號沒了」。

觸發條件包含:在自己的站上點自己的廣告、開發環境反覆重整產生曝光、
請朋友幫忙點、把廣告放在會誤觸的位置。Google 的偵測是自動的,
停權後申訴成功率低,而且`同一個人不能重新申請`。

本 repo 的對策是把預設值設成`不投放`:`data-hosts` 白名單沒對上就只畫佔位框,
連一個對 Google 的請求都不發。漏設定的後果是「今天沒賺到錢」,
而不是「這輩子不能再用 AdSense」。

## 四、建議順序

`外部等待最久的先啟動`,其餘平行做:

1. `立刻` — 決定用哪個網域過審, 開始補公開內容 (A2, 最慢的一段)
2. `立刻` — 寫隱私權政策頁並上線 (C1, 一頁 HTML, 但是審核硬性條件)
3. `平行` — 在 `inf` 加 `/ads.txt` 的 nginx location (D4)
4. `內容就緒後` — 送 AdSense 審核 (A1), 等待期間做 B1 / B2 / B4
5. `拿到 Publisher ID 後` — 填 `public/ads.txt` 與各頁的 `data-client`, 部署載入器
6. `有流量後` — 接 Funding Choices CMP (C2), 等 PIN 明信片 (B3)
7. `之後` — AdSense Management API 接進 Grafana (D5)

## 五、驗收

```bash
./scripts/check.sh     # 全部 PASS 才算真的能收到錢
```

`[tech]` 區塊全綠代表工程面完成;`[manual]` 區塊全綠代表行政面完成。
兩邊都綠之後,第一筆撥款仍需等收益累積到 `100 USD`。

## 六、來源 (Sources)

本文的產品定位與所有金額 / 天數,`一律以 Google 官方說明文件為準`,
於 2026-08-29 核對。第三方部落格常見的數字(例如「PIN 門檻 10 美元」)
`不`採用 —— Google 未公開該金額。

| 主張 | 來源 |
| --- | --- |
| AdSense 是發布商變現, Google `付錢給你` | [AdSense 總覽](https://support.google.com/adsense/answer/6242051) |
| Google Ads 是廣告主`付錢給 Google` | [Google Ads 總覽](https://support.google.com/google-ads/answer/6146252) |
| 付款門檻 `100 USD` | [Payment thresholds](https://support.google.com/adsense/answer/1709871) |
| 撥款於每月 `21 至 26 日` | [Steps to getting paid](https://support.google.com/adsense/answer/1709858) |
| PIN 走國際平信, 約 `3 週`, 無追蹤號碼, 門檻金額未公開 | [Address verification (PIN) overview](https://support.google.com/adsense/answer/157667) |
| 2024-01-16 起, EEA / UK 個人化廣告需 TCF 認證 CMP; 否則只剩非個人化與限定廣告 | [Certified CMP requirement](https://support.google.com/adsense/answer/13554116) |
