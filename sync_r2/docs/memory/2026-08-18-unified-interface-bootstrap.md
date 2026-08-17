# 2026-08-18 統一介面補齊 (Unified Interface Bootstrap)

## 做了什麼

本專案原本`只有 main.go`，六項必備檔案全缺。本次以 bootstrap 模式（先讀完
`main.go`，再由程式碼實況產出文件）補上 `README.md`、`CLAUDE.md`、`AGENTS.md`
（軟連結）、`README.todo`、`docs/terminology.md` 與本檔。程式碼未改動。

依據是 `~/projects` 的統一介面稽核：每個專案目錄都必須具備上述六項。

## 讀程式碼時發現的事

`一、這個專案目前無法建置。` 目錄下沒有 `go.mod`，上層 `platform/` 也沒有
`go.work`（`platform/` 下只有 `gosdk/`、`rnet/`、`feedback/` 三個 module）。實測
`go build ./...` 回報 `directory prefix . does not contain main module or its
selected dependencies`。也就是說 `main.go` 依賴四個 `aws-sdk-go-v2` 套件，卻沒有
任何地方宣告它們。這是所有其他待辦的前提，已列為 `README.todo` 第一項。

`二、上傳來源寫死且相對於工作目錄。` `localDir := "../tmp"` 不是相對於原始碼位置，
而是相對於執行時的 CWD。從 `sync_r2/` 執行會抓 `platform/tmp`，從別處執行會抓別的
東西。文件因此明確寫「從目標 tmp/ 目錄的同層執行」，而不是含糊的「執行 main.go」。

`三、部分失敗不會反映在 exit code。` 逐檔錯誤只 `log.Printf` 後 `return nil`，
走訪結束仍是成功路徑。放進自動化流程時會`靜默漏檔`。

## 值得留底的決策

`把「無法建置」寫進 CLAUDE.md 的正文，而不是只列成待辦。` 通常「還沒做完」屬於
`README.todo`，但這一項會讓任何人照文件執行時立刻撞牆，屬於`當下的技術事實`，
因此在 CLAUDE.md 的「建置」與「已知限制」兩處直接寫明，並附上實際的錯誤訊息原文，
避免下一個人重跑一次才發現。

`terminology.md 只收五個名詞加四個環境變數並標記待補。` 這個工具的領域太薄，
硬湊到十筆只能靠通用技術詞（HTTP、MIME、SigV4）充數，而術語表規則明訂通用技術詞
不收。寧可留一張誠實的小表。
