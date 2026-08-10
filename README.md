# platform — 專案工作區聚合 (Workspace Aggregation)

`platform` 本身`不是產品`，它是一個工作區：把數個各自獨立、各自有 remote 的 repo
以 git submodule 聚在同一棵目錄樹下，讓跨專案的搜尋、稽核與 agent 上下文一次到位。

這裡`唯一擁有`的事實只有三樣：哪些 repo 屬於這個工作區、它們各自的 pin 在哪個 commit、
以及聚合而成的 Claude Code plugin。任何一個子專案的業務邏輯、建置方式與部署流程，
都由該 repo 自己的 `README.md` / `CLAUDE.md` 擁有，本檔`不複述`。

## 業務領域 (Business Domains)

### 工作區成員 (Workspace Members)

| Submodule | 領域 | 一句話 |
| --- | --- | --- |
| [`cloud`](cloud/) | 實體機器佈建 | 讓任何一台機器能`從空碟重灌回到可用狀態`，不依賴任何人的記憶 |
| [`inf`](inf/) | 本地基礎設施與可觀測性 | 本機的 Grafana LGTM Stack、告警、資料儲存與本地語音辨識 |
| [`gosdk`](gosdk/) | Go 共用函式庫 | 設定管理、儲存、觀測、CLI 子命令等可重用模組 |
| [`feedback`](feedback/) | 網站意見回饋 | 一個 `<script>` 標籤，讓任何網站長出「意見回饋」標籤 |
| [`rnet`](rnet/) | 同網段網路工具 | 監看一個網段上的即時流量，以及 DNS-SD 服務發現 |
| [`n8n`](n8n/) | AI 工作流平台 | 可自架的 n8n，執行平台與工作流原始碼放在同一個 repo |
| [`superset`](superset/) | VS Code 擴充功能 | 側欄整合 Terminals / MDNS / Topology / TODO 觀察型面板 |

### 領域關聯 (Domain Relationships)

成員之間`刻意保持鬆散`——絕大多數可以單獨 clone、單獨建置、單獨部署。
目前只有兩條真實的耦合：

- `feedback` 在 `go.mod` 依賴 `gosdk`，走一般的 Go module 版本解析，`不`靠工作區的相對路徑。
- `gosdk/metric` 的預設遙測端點指向 `inf` 起的 VictoriaMetrics / Tempo / Loki，
  但那是`執行期的 URL 設定`，不是編譯期相依——`inf` 沒起也不影響任何專案建置。

其餘關係是`概念上`的：`cloud` 佈建出來的機器可以跑 `inf`，`superset` 觀察的是整個
工作區的 `README.todo`。這些都不構成建置順序。

## 領域流程 (Domain Flow)

1. `Clone` — `git clone --recurse-submodules`，或事後 `git submodule update --init`。
2. `工作` — 一律`直接在各 submodule 的 master 上開發`，不開 branch、不用 worktree。
3. `推送子專案` — 在 submodule 內 commit 並 push 到它自己的 remote。
4. `更新 pin` — 回到本 repo `git add <submodule>` 並 commit，記錄新的 commit 指標。

第 4 步`最容易漏`。漏了的症狀是：子專案的 remote 上有新版本，但任何人 clone 本 repo
拿到的仍是舊 commit。以 `git submodule status` 檢查，開頭有 `+` 就代表 pin 已落後。

## 快速開始 (Quick Start)

```bash
git clone --recurse-submodules https://github.com/BizShuk/platform.git
cd platform

git submodule status          # 檢查 pin 是否與各 submodule 的 checkout 一致
git submodule foreach 'git status --short'
```

各子專案的建置與執行方式一律看該目錄下的 `README.md`。

結構、邊界與 ownership 見 [CLAUDE.md](CLAUDE.md)；待辦見 [README.todo](README.todo)。
