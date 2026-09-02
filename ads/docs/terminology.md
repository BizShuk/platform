# 術語表 (Terminology)

本檔是 `ads` 領域名詞的`單一定義來源`。其他文件一律引用這裡,不重新定義。

## 產品名稱 (最容易搞混的一組)

| 名詞 | 定義 | 你的角色 |
| --- | --- | --- |
| `Google Ads` | 廣告`購買`平台。你付錢, Google 把你的廣告投到別人的網站 | 廣告主 |
| `Google AdSense` | 廣告`變現`平台。你提供版位, Google 付錢給你 | 發布商 |
| `Google Ad Manager` | 大型發布商用的投放伺服器, 可混合自售與程式化廣告 | 發布商 |
| `Google AdMob` | AdSense 的 App 版, 用於 iOS / Android 原生 App | App 發布商 |
| `Funding Choices` | Google 自家的 CMP, 用來收集 GDPR / CCPA 同意 | 發布商 |

本 repo 只用 `AdSense`。

## 識別碼 (Identifiers)

| 名詞 | 格式 | 出現在哪 |
| --- | --- | --- |
| `Publisher ID` | `ca-pub-` + 16 位數字 | 載入器的 `data-client`、`<ins data-ad-client>` |
| `Publisher ID (ads.txt 形式)` | `pub-` + 16 位數字, `沒有` `ca-` 前綴 | `ads.txt` 的第二欄 |
| `Ad Slot ID` | 10 位數字 | `data-ad-slot`, 每個版位一個, 在後台建立 |
| `TAG ID` | `f08c47fec0942fa0` | `ads.txt` 第四欄, Google 的固定值 |

`ca-pub-` 與 `pub-` 的差別是實務上最常見的 `ads.txt` 失效原因。

## 收益指標 (Revenue Metrics)

| 名詞 | 全稱 | 定義 |
| --- | --- | --- |
| `Impression` | — | 廣告被載入一次 |
| `Viewability` | — | 廣告有 50% 面積在視窗內至少 1 秒的比例 |
| `CTR` | Click-Through Rate | 點擊數 ÷ 曝光數 |
| `CPC` | Cost Per Click | 每次點擊的收益 |
| `CPM` | Cost Per Mille | 每千次曝光的收益 |
| `RPM` | Revenue Per Mille | 每千次`頁面`瀏覽的收益, 發布商最常看的數字 |

`CPM` 是每千次`廣告`曝光, `RPM` 是每千次`頁面`瀏覽 —— 一頁三個版位時兩者差三倍。

## 合規與政策 (Compliance)

| 名詞 | 定義 | 不做的後果 |
| --- | --- | --- |
| `ads.txt` | 網域根目錄的授權賣方宣告檔 (IAB Tech Lab 規格) | 買方不出價, 收益趨近零 |
| `CMP` | Consent Management Platform, 同意管理平台 | EEA/UK 流量只剩非個人化與限定廣告, 收益大幅縮水 |
| `TCF` | Transparency & Consent Framework, IAB 的同意訊號標準 | CMP 未認證即無效 |
| `Invalid Traffic` | 無效流量: 自己點、機器人、開發環境的曝光 | 扣款、`帳號停權` |
| `Low Value Content` | 低價值內容, 審核最常見的拒絕理由 | 申請不通過 |
| `W-8BEN` | 非美國個人的美國稅務表單 | 預扣最高 30%, 可能暫停付款 |

## 付款 (Payment)

| 名詞 | 值 | 說明 |
| --- | --- | --- |
| `PIN 驗證` | 達`驗證門檻`觸發 (Google `未公開`確切金額) | Google 以國際平信寄 6 位數 PIN 到登記地址, 約 `3 週`送達, 無追蹤號碼。輸入 PIN 才解鎖付款 |
| `付款門檻` | `100 USD` | 未達門檻的收益累積到下個月, 不撥款 |
| `付款週期` | 每月 `21 日至 26 日`之間 | 結算上個月的收益, 前提是月底餘額已達門檻且無付款保留 |
