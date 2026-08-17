# sync_r2 — 技術脈絡 (Technical Context)

本檔記錄本工具的結構、邊界與已知限制。業務定義與使用方式在 [README.md](README.md)。

## 專案結構 (Project Structure)

```tree
sync_r2/
├── README.md                  # 業務定義與使用方式
├── CLAUDE.md                  # 本檔
├── AGENTS.md -> CLAUDE.md     # 軟連結
├── README.todo                # 待辦
├── docs/
│   ├── terminology.md         # 術語 (最小表格, 待補)
│   └── memory/                # 決策與操作紀錄
└── main.go                    # 全部邏輯, package main, 單一 main()
```

`沒有 go.mod。` 這是目前最重要的結構事實——見下方「已知限制」。

## 技術棧 (Tech Stack)

- Language: Go（`go version` 於本機為 `go1.26.3 darwin/arm64`）
- Key dependencies（由 `main.go` 的 import 推得，未由 `go.mod` 宣告）:
  - `github.com/aws/aws-sdk-go-v2/aws`
  - `github.com/aws/aws-sdk-go-v2/config`
  - `github.com/aws/aws-sdk-go-v2/credentials`
  - `github.com/aws/aws-sdk-go-v2/service/s3`
- 其餘為標準函式庫: `context`、`fmt`、`log`、`mime`、`os`、`path/filepath`、`strings`

## 關鍵決策 (Key Decisions)

### 決策一: 用 S3 SDK 打 R2，而非 Cloudflare 專用 SDK

R2 提供 S3-compatible API，因此直接用 `aws-sdk-go-v2`：以 account ID 組出
`https://<account>.r2.cloudflarestorage.com`，`HostnameImmutable: true` 避免 SDK 自行
加上 bucket 或 region 子網域，region 與 signing region 都固定字串 `auto`（R2 沒有
region 概念，但 SigV4 簽章必須有值）。

### 決策二: 憑證只從環境變數取，且四個都必填

不讀 `~/.aws/credentials`、不支援 profile。四個環境變數缺任何一個就 `log.Fatal`
終止，錯誤訊息一次列出全部四個名稱。用 `StaticCredentialsProvider` 明確覆蓋 SDK 的
預設 credential chain，避免誤用到其他 AWS 帳號的憑證。

### 決策三: object key 由本機相對路徑推導，刻意保留 `tmp/` 前綴

走訪根目錄是 `../tmp`，key 的算法是把路徑正規化為 slash 形式後，只去掉開頭的兩點斜線。
因此 `../tmp/image.png` 上傳後是 `tmp/image.png`。這讓 R2 上的路徑與本機一致，
也讓公開 URL 的形狀可預測。

### 決策四: 單檔失敗不中斷

開檔失敗與 `PutObject` 失敗都只 `log.Printf` 後 `return nil`，走訪繼續。只有
`filepath.Walk` 本身回傳錯誤才 `log.Fatalf`。副作用是`部分失敗時 exit code 仍為 0`，
呼叫端無法從結束狀態判斷成敗——這是目前的行為，不是筆誤。

## 模組對應 (Module Mapping)

| 業務領域 (Domain) | 位置 (Location) | 進入點 (Entry Point) |
| --- | --- | --- |
| 設定與憑證載入 | `main.go` 前段 | `main()` |
| Endpoint 解析 | `main.go` 的 `customResolver` | `aws.EndpointResolverWithOptionsFunc` |
| 目錄走訪與上傳 | `main.go` 的 Walk callback | `filepath.Walk` |

## 開發指南 (Development Guide)

### 前置需求 (Prerequisites)

- Go toolchain
- 一組 Cloudflare R2 的 API token（Access Key / Secret Key）與 bucket

### 安裝 (Installation)

未偵測到 (Not detected)。沒有 `go.mod`，也沒有 vendor 目錄。

### 建置 (Build)

`目前無法建置。` `go build ./...` 回報：

```text
pattern ./...: directory prefix . does not contain main module or its selected dependencies
```

上層 `platform/` 也沒有 `go.work`，因此本目錄不屬於任何 Go module。要能執行必須先
`go mod init` 並 `go get` 上述四個 aws-sdk-go-v2 套件。

### 測試 (Test)

無測試 (No test)。

### 部署 (Deploy)

未偵測到部署設定 (No deployment config detected)。本工具設計為手動一次性執行。

## 已知限制 (Known Limitations)

- `無 go.mod`：不是可建置的 module（見上）。
- `上傳來源寫死`為 `../tmp`，且相對於執行時的工作目錄，不是相對於原始碼位置。
- `無增量判斷`：不比對 size、mtime 或 ETag，每次都重傳整個目錄。
- `無刪除同步`：本機刪檔不會讓 R2 上的 object 消失。
- `無併發`：逐檔序列上傳。
- `部分失敗不反映在 exit code`。
- `aws.EndpointResolverWithOptionsFunc` 與 `config.WithEndpointResolverWithOptions`
  在 aws-sdk-go-v2 已 deprecated，建議改用 `BaseEndpoint`。

## 慣例 (Conventions)

- Naming: 標準 Go MixedCaps；目前無 exported 識別符（全部在 `main()` 內）。
- Error handling: 前置條件用 `log.Fatal` 終止；逐檔錯誤用 `log.Printf` 後續行。
- Logging: 標準 `log` 套件（非結構化）；成功訊息用 `fmt.Printf` 直接印到 stdout。
- 絕對路徑不寫進文件與程式碼。
