# CLAUDE.md — platform 技術脈絡

業務定義見 [README.md](README.md)。本檔只放`邊界`與`擁有權`。

## 結構 (Structure)

```tree
./
├── .gitmodules            # 唯一的成員清單：8 個 submodule 的 path / url / branch
├── .claude-plugin/
│   └── marketplace.json   # Claude Code marketplace registry，登記 gosdk / identity / inf / n8n 四個 plugin
├── .gitignore             # 通用 ignore template
├── .claudeignore          # 與 .gitignore 同內容，供 agent 使用
├── .geminiignore          # 同上
├── docs/
│   ├── specs/             # 工作區層級的設計與規格，YYYY-MM-DD-<topic>.md
│   ├── backlog/           # 工作區層級的待辦想法
│   └── tutorials/         # 工作區層級的領域知識
└── <submodule>/           # 8 個獨立 repo，各自擁有完整的統一介面
```

## Ownership

| 事實 | Owner | 說明 |
| --- | --- | --- |
| 工作區有哪些成員 | `.gitmodules` | 唯一事實來源，`README.md` 的表格是導覽不是清單 |
| 每個成員 pin 在哪個 commit | 本 repo 的 git index | 由 `git add <submodule>` 更新 |
| 子專案的業務、結構、建置、部署 | 該 submodule 的 `README.md` / `CLAUDE.md` | 本 repo `不複述` |
| 子專案的背景任務 | 該 submodule 的 `ecosystem.config.js` | 沒有根目錄總表 |
| 對外發佈哪些 plugin | `.claude-plugin/marketplace.json` | 只登記 `name` 與 `source`，`不`複述 skill 清單 |
| 每個 plugin 的身分與 skill 清單 | 該 submodule 的 `.claude-plugin/plugin.json` | skill 由 `skills/` 目錄慣例自動探索 |
| 工作區層級的待辦 | `README.todo` | 子專案的待辦在各自的 `README.todo` |

## 關鍵決策 (Key Decisions)

- `Submodule 而非 monorepo`：每個成員有自己的 remote、自己的 issue、自己的發佈節奏。
  聚合只發生在`檔案系統`與`agent 上下文`這一層，不發生在版本控制的歷史裡。
- `一律在 master 上工作`：不開 branch、不用 worktree。submodule 的 detached HEAD
  是最常見的資料遺失來源，維持所有 submodule 恆在 `master` 可以整類避開。
- `沒有根目錄的編排`：本 repo `沒有` `package.json`、`沒有` `scripts/run.sh`、
  `沒有` `ecosystem.config.js`。成員之間沒有真實的建置順序，硬造一層 orchestration
  只會製造一份會過期的假事實。要跑什麼就進那個目錄跑。
- `Marketplace 而非單一聚合 plugin`：本 repo 是 `marketplace`（plugin 的目錄），不是 plugin。
  plugin 身分屬於`擁有那些 skill 的 repo`——`gosdk`、`inf`、`n8n` 各自帶 `.claude-plugin/plugin.json`，
  單獨 clone 也能安裝。本層的 `marketplace.json` 只記 `name` + `source`，
  skill 清單`不在這裡複述`，避免產生第二份會過期的事實。
- `統一介面由各成員各自滿足`：`README.md` / `CLAUDE.md` / `AGENTS.md` / `README.todo` /
  `docs/terminology.md` / `docs/memory/` 是`每個 repo`的責任，本 repo 也不例外。
- `Remote URL 大小寫統一為 BizShuk`：GitHub 的 owner 名稱不分大小寫，但混用會讓
  `.gitmodules` 與 `.git/config` 的字面值比對失敗，也讓 grep 稽核漏抓。
- `.gitmodules 依 submodule 名稱字母排序`：新增成員時有唯一正確的插入位置，避免
  每次新增都產生一筆「加在最後面」的無意義 diff 順序。

## 邊界 (Boundaries)

- 本 repo `不擁有任何可執行程式`。
- `vscode-shuk/` 目前是`未追蹤目錄`，不是 submodule。它自帶完整的統一介面，
  狀態上等同「已經是 repo，只是還沒登記」。在登記進 `.gitmodules` 之前，
  本 repo 對它`沒有任何擁有權`。（`architecture/` 已於登記後成為 submodule。）
- 跨專案的稽核（一致性、命名、相依）可以在本層做，但`修正一律落在各 submodule`，
  本 repo 只更新 pin。

## 慣例 (Conventions)

- 提交順序：先在 submodule 內 commit + push，`再`回本 repo `git add <submodule>` 記錄 pin。
- 檢查落後：`git submodule status`，開頭 `+` 代表 checkout 已超前記錄的 pin。
- 日期檔名：`docs/specs/` 與 `plans/` 一律 `YYYY-MM-DD-<topic>.md`，topic 要能表意。
- `AGENTS.md` 一律是指向 `CLAUDE.md` 的 symlink，不是複本。
