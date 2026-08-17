# sync_r2 — 本機目錄上傳至 Cloudflare R2 (Local Directory Uploader)

把本機的 `tmp/` 目錄一次性上傳到 Cloudflare R2 bucket，並保留原本的相對路徑作為
object key，讓檔案在 R2 上仍然是 `tmp/<filename>`。

用途是把本機產生的圖片或檔案`快速換成一個可公開存取的 URL`，不需要開 Web 伺服器、
不需要手動一個個拖上 Cloudflare Dashboard。

## 業務領域 (Business Domains)

### 一次性目錄上傳 (One-Shot Directory Upload)

執行一次、走訪一次、結束。不是常駐同步服務，也不會刪除 R2 上已不存在於本機的物件。
重跑就是`整個目錄重新上傳一遍`，同名 object 被覆寫。

`領域流程 (Domain Flow):`

1. 從環境變數讀取 R2 帳號、憑證與 bucket；缺任何一項直接終止。
2. 以 account ID 組出 R2 的 S3-compatible endpoint，region 固定為 `auto`。
3. 走訪本機 `../tmp`（相對於執行時的工作目錄），略過目錄本身。
4. 每個檔案依副檔名推得 Content-Type，推不出來就用 `application/octet-stream`。
5. 上傳為 object key `tmp/<相對路徑>`，逐檔印出結果。
6. 結束時印出公開存取用的 R2 dev URL 樣板。

`核心實體 (Key Entities):` Bucket、Object Key、Content-Type

`相關處理器 (Related Handlers):` `main()`、`filepath.Walk` 的匿名 callback、`client.PutObject`

## 領域關聯 (Domain Relationships)

本工具`只有一個領域`，沒有內部模組關係。對外的唯一契約是：
`上傳來源固定為工作目錄的上一層的 tmp/`，`object key 固定加上 tmp/ 前綴`。
任何依賴此 URL 形狀的下游（例如把圖片貼到文件裡）都靠這個約定。

## 使用方式 (Usage)

先設定四個環境變數，再從`目標 tmp/ 目錄的同層`執行：

```bash
export R2_ACCOUNT_ID=...
export AWS_ACCESS_KEY_ID=...
export AWS_SECRET_ACCESS_KEY=...
export R2_BUCKET_NAME=...

go run main.go
```

上傳來源是`../tmp`，也就是`執行時工作目錄的上一層`的 `tmp/`。這個路徑寫死在程式碼裡，
無法用參數或環境變數改變——換目錄必須改 `main.go`。

單一檔案上傳失敗只會印出錯誤並繼續處理下一個；只有走訪本身失敗才會終止。

## 改善建議 (Improvement Suggestions)

- [ ] 補 `go.mod`：目前目錄下只有 `main.go`，沒有 module 定義，`go build ./...` 直接失敗。這是可執行性的前提。
- [ ] 把 `../tmp` 從寫死改成 flag 或環境變數，並讓 object key 前綴跟著來源目錄走。
- [ ] 上傳前比對 size 或 ETag，跳過未變更的檔案；目前每次都重傳整個目錄。
- [ ] 逐檔上傳失敗只印訊息、離開時仍回傳成功；改為累計失敗數並以非零 exit code 結束，否則自動化流程無法察覺部分失敗。
- [ ] `aws.EndpointResolverWithOptionsFunc` 與 `config.WithEndpointResolverWithOptions` 在 aws-sdk-go-v2 已標記為 deprecated，改用 `BaseEndpoint`。
- [ ] 公開 dev URL 寫死在程式碼的結尾輸出中；改為由 bucket 設定推導或移入設定。
