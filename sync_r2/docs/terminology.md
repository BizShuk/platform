# sync_r2 — 術語表 (Terminology)

本專案僅一個 `main.go`，領域名詞極少。以下為目前可從程式碼取得出處的全部術語。

## 儲存 (Storage)

| 術語 (Term) | 英文 (English) | 定義 (Definition) | 出處 (Source) |
| --- | --- | --- | --- |
| `帳號 ID` | Account ID | Cloudflare 帳號識別碼，用來組出 R2 的 S3-compatible endpoint | `main.go` 的 `R2_ACCOUNT_ID` |
| `儲存桶` | Bucket | R2 上的容器，所有 object 上傳的目的地 | `main.go` 的 `R2_BUCKET_NAME` |
| `物件鍵` | Object Key | Object 在 bucket 內的完整路徑；本工具固定為 `tmp/<本機相對路徑>` | `main.go` 的 `key` 變數 |
| `上傳來源` | Local Directory | 走訪的本機根目錄，寫死為 `../tmp`（相對於執行時的工作目錄） | `main.go` 的 `localDir` |
| `內容類型` | Content-Type | 由副檔名推得的 MIME type，推不出來時為 `application/octet-stream` | `main.go` 的 `contentType` |

## 環境變數 (Environment Variables)

| 變數 (Variable) | 字面值 (Literal) | 語意 (Semantics) | 出處 (Source) |
| --- | --- | --- | --- |
| 帳號 ID | `R2_ACCOUNT_ID` | 組出 `https://<account>.r2.cloudflarestorage.com` | `main.go` |
| 存取金鑰 | `AWS_ACCESS_KEY_ID` | R2 API token 的 Access Key | `main.go` |
| 私密金鑰 | `AWS_SECRET_ACCESS_KEY` | R2 API token 的 Secret Key | `main.go` |
| 儲存桶名稱 | `R2_BUCKET_NAME` | 目的地 bucket | `main.go` |

四個變數`全部必填`，缺任何一個即 `log.Fatal` 終止。

## 縮寫 (Abbreviations)

| 縮寫 | 全稱 | 說明 |
| --- | --- | --- |
| `R2` | Cloudflare R2 | Cloudflare 的物件儲存服務，提供 S3-compatible API |

`待補 (To be extended)`：本工具目前沒有自訂的狀態值或流程名詞。加入增量比對、
併發或錯誤彙總後，相關概念再補入本表。
