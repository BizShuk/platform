# CLAUDE.md — ads 技術脈絡

業務定義見 [README.md](README.md);術語見 [docs/terminology.md](docs/terminology.md);
完整缺口分析見 [docs/specs/2026-08-29-adsense-integration.md](docs/specs/2026-08-29-adsense-integration.md)。

## 專案結構 (Project Structure)

```tree
ads/
├── web/
│   ├── ads.js                  # 嵌入用單一 JS 檔:dev guard + 佔位 + lazy + consent gate
│   ├── ads.test.js             # dev guard 迴歸測試(node, 零相依)
│   └── demo/index.html         # 驗證頁,`刻意`停在佔位模式(見下方決策)
├── public/
│   └── ads.txt                 # 授權賣方宣告樣板,要複製到`每個`網域根目錄
├── scripts/
│   └── check.sh                # 上線前缺口稽核:[tech] 自動驗、[manual] 讀狀態檔
├── docs/
│   ├── terminology.md          # 名詞的單一定義來源
│   ├── specs/                  # 設計與缺口分析
│   └── memory/                 # 決策 retrospective
├── package.json                # dev / check / test / run:setup
├── README.md
├── README.todo
└── AGENTS.md -> CLAUDE.md
```

`沒有後端`。AdSense 的投放、計費、結算全在 Google 那邊,本 repo 唯一的執行期產物
是一支瀏覽器端的 JS。這是刻意的 —— 自建任何伺服器都只會多一個要維運的東西,
換不到一塊錢收益。

## Ownership

| 事實 | Owner | 說明 |
| --- | --- | --- |
| 版位載入邏輯 | `web/ads.js` | 唯一的執行期程式 |
| 哪些網域算正式環境 | 宿主頁面的 `data-hosts` | `不`寫死在 JS 裡,不同站可以不同 |
| Publisher ID | `public/ads.txt` 與宿主頁面的 `data-client` | 兩處都要填,格式不同(見術語表) |
| 手動前置的完成狀態 | `~/.config/ads/state.env` | 不進 git,一台機器一份 |
| 版位尺寸 | 宿主頁面的 `data-ad-height` | 佔位高度是版面的事,不是載入器的事 |
| 同意介面 | `尚無 owner` | CMP 還沒選,見 README.todo |
| 網域上 `ads.txt` 的實際供應 | `inf` 的 nginx 設定 | 本 repo 只提供內容,`不`負責路由 |

## 關鍵決策 (Key Decisions)

- `預設不投放,白名單才投放`:`data-hosts` 沒對上就只畫佔位框,不發任何請求。
  相反的預設(預設投放、黑名單排除開發環境)只要漏一個環境就會產生無效流量,
  而無效流量的懲罰是`停權`,不是警告。錯誤的方向要指向「沒賺到錢」,
  不能指向「帳號沒了」。
- `佔位在網路請求之前`:`reserve()` 在 `collect()` 當下同步跑完,早於任何
  `<script>` 插入。廣告是非同步的,順序反過來就一定產生 CLS。
- `lazy load 用 IntersectionObserver,不是捲動事件`:捲動事件會在主執行緒上
  高頻觸發,而廣告本來就重。沒有 `IntersectionObserver` 的瀏覽器直接全部載入,
  不做 polyfill —— 那些瀏覽器的流量價值遠低於一份 polyfill 的成本。
- `consent gate 只留掛點,不內建 CMP`:`window.ads.grantConsent()` 是介面,
  誰來呼叫是宿主頁面的事。內建一個沒經過 Google 認證的同意介面,
  比沒有還糟 —— 它會讓人以為合規了。
- `demo 頁刻意不投放`:`data-hosts` 不含 `127.0.0.1`。demo 的價值是驗證版面與
  guard 行為,不是看到真廣告。想看真廣告的唯一正確方式是部署到正式網域。
- `ads.txt 放 public/ 而不是 web/`:它不是被瀏覽器 `<script>` 載入的資產,
  是要被`複製到別的網域根目錄`的檔案。混在 `web/` 會讓人以為從這裡供應。

## 邊界 (Boundaries)

- 本 repo `不`碰金流、`不`存廣告素材、`不`做帳務對帳。
- 本 repo `不`負責把 `ads.txt` 送上線 —— 那要改 `inf` 的 nginx 設定,
  修正落在 `inf`,本 repo 只提供內容與稽核。
- 本 repo `不`能讓你通過 AdSense 審核。審核看的是`內容`,不是程式碼。
- `scripts/check.sh` 的 `[manual]` 區塊`不會`自己變綠 —— 它讀
  `~/.config/ads/state.env`,那是人做完事之後手動記上去的。
  程式無法驗證你是否真的寄回了那張明信片。

## 慣例 (Conventions)

- `ads.js` 是 ES5 + IIFE,`不`用 build step。它要能被貼進任何靜態站,
  包含沒有打包工具的頁面。
- 新增檢查項一律加進 `scripts/check.sh`,並標明 `[tech]` 或 `[manual]`。
  分類判準:`這件事程式能自己驗證嗎`。
- 每個新的收益前置條件都要同時出現在 `check.sh` 與 `README.todo`,
  否則會變成只存在於某個人腦中的隱性步驟。
