# ads — 網站廣告變現 (Web Ad Monetization)

在 `shuks.dev` 底下的站台放上廣告版位,讓流量變成收入。

這個 repo 擁有的是`嵌入端`與`前置條件`兩件事:一支零相依的 `<script>` 載入器,
以及一份「還差什麼才收得到錢」的稽核清單。廣告本身由 Google 投放,
帳務由 Google 結算,本 repo `不`碰錢也`不`存廣告素材。

## 先講一個名詞錯置 (Terminology Correction)

`Google Ads` 與 `Google AdSense` 是`相反的兩端`,選錯就整條路走不通:

| 產品 | 你的角色 | 金流方向 | 適用情境 |
| --- | --- | --- | --- |
| `Google Ads` | 廣告主 (advertiser) | 你`付錢`給 Google | 你要買流量,推廣自己的產品 |
| `Google AdSense` | 發布商 (publisher) | Google `付錢`給你 | 你有網站,想靠版位賺錢 |
| `Google Ad Manager` | 大型發布商 | Google 付錢給你 | 月曝光數百萬、要自售直接廣告 |
| `Google AdMob` | App 發布商 | Google 付錢給你 | iOS / Android App 內廣告 |

「在網頁上顯示廣告並收款」= `AdSense`。本 repo 全部圍繞 AdSense 設計。
流量成長到自售直接廣告的規模之前,`不`需要 Ad Manager。

## 為什麼用它 (Why)

直接把 Google 給的那段 `<script>` 貼到頁面上是可行的,但會踩到三個坑:

- `無效流量 (invalid traffic)` —— 開發機、預覽環境、自己重整頁面產生的曝光,
  Google 一律視為無效流量。累積到一定程度`直接停權`,且申訴成功率低。
  本 repo 的載入器在非正式網域`不載入`廣告,從源頭杜絕。
- `版面位移 (CLS)` —— 廣告是非同步塞進 DOM 的,不預留高度就會把內文往下推,
  Core Web Vitals 直接爛掉,連帶影響 SEO。載入器強制先佔位。
- `同意聲明 (consent)` —— 對 EEA / UK 的訪客,沒有 Google 認證的 CMP 就`不能投放個人化廣告`
  (2024-01-16 起的規定),只剩非個人化與限定廣告,收益大幅縮水。
  載入器留了 consent gate 掛點。

## 領域流程 (Domain Flow)

收到第一筆錢要走完`五個階段`,每一階段都會卡住,順序不能顛倒:

1. `資格` —— 網站公開可存取、有原創內容、有隱私權政策。送審通過拿到
   `Publisher ID`(格式 `ca-pub-` 加 16 位數字)。
2. `宣告` —— 每個網域的根目錄放上 `ads.txt`,寫明誰有權賣這個網域的版位。
   沒有這個檔,絕大多數買方`不會出價`。
3. `嵌入` —— 頁面掛上載入器,宣告版位。這是`唯一`本 repo 寫程式的一步。
4. `收款前置` —— 稅務表單、身分驗證、地址 PIN 明信片、可收 USD 的銀行帳戶。
   四項缺一就算有收益也`匯不出來`。
5. `結算` —— 累積收益達 `100 USD` 門檻,次月 `21 至 26 日`之間撥款。

第 1 與第 4 階段`完全不是工程問題`,而且是全程最慢的兩段(各自數天到數週)。
目前的缺口盤點見 [README.todo](README.todo),完整分析見
[docs/specs/2026-08-29-adsense-integration.md](docs/specs/2026-08-29-adsense-integration.md)。

## 怎麼開始 (Quickstart)

```bash
# 1. 看目前還缺什麼(不需要任何帳號就能跑)
./scripts/check.sh

# 2. 起 demo 頁,確認版位佔位與 dev guard 行為
npm run dev            # http://127.0.0.1:8600/demo/
```

拿到 Publisher ID 之後,在頁面貼上這一行:

```html
<script src="https://ads.shuks.dev/ads.js"
        data-client="ca-pub-0000000000000000"
        data-slots="1234567890,0987654321"
        data-consent="required"
        data-hosts="outfit.shuks.dev,vidnote.shuks.dev,fun.shuks.dev" defer></script>
```

版位放在要顯示廣告的位置:

```html
<div data-ad-slot="1234567890" data-ad-height="280"></div>
```

`data-hosts` 是`正式網域白名單`。不在清單上的網域(localhost、預覽環境、
任何人 fork 之後的部署)一律只畫佔位框,`不`發出任何對 Google 的請求。

## 不做什麼 (Non-Goals)

- `不`自建廣告伺服器,也不做 header bidding —— 那是月曝光百萬級才划算的事。
- `不`存放或代管廣告素材 —— 素材永遠來自 Google 的 CDN。
- `不`碰任何金流 —— 錢從 Google 直接匯進銀行帳戶,本 repo 沒有帳務邏輯。
- `不`做付費牆或訂閱 —— 那是另一個領域,要做請另開 repo。

技術脈絡與邊界見 [CLAUDE.md](CLAUDE.md);術語見 [docs/terminology.md](docs/terminology.md)。
