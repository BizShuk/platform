#!/usr/bin/env bash
# scripts/check.sh — 上線前缺口稽核 (idempotent, 唯讀)
#
# 分兩類回報:
#   [tech]   本 repo 或基礎設施可以修的
#   [manual] 只能到 AdSense 後台或銀行去做的, 程式無法代勞
#
# 退出碼: 有任何 FAIL 回 1. 供 CI 使用.

set -uo pipefail

DOMAINS="${ADS_DOMAINS:-outfit.shuks.dev vidnote.shuks.dev fun.shuks.dev feedback.shuks.dev}"
STATE="${ADS_STATE:-$HOME/.config/ads/state.env}"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

pass=0; fail=0; warn=0
ok()   { printf '  \033[32mPASS\033[0m  %s\n' "$1"; pass=$((pass+1)); }
no()   { printf '  \033[31mFAIL\033[0m  %s\n'   "$1"; fail=$((fail+1)); }
hm()   { printf '  \033[33mWARN\033[0m  %s\n'   "$1"; warn=$((warn+1)); }
head_() { printf '\n\033[1m%s\033[0m\n' "$1"; }

# shellcheck disable=SC1090
[ -f "$STATE" ] && . "$STATE"

head_ "[tech] 本 repo 的設定"

PUB="$(grep -Eo 'pub-[0-9]{16}' "$ROOT/public/ads.txt" 2>/dev/null | head -1)"
if [ -z "$PUB" ]; then
  no "public/ads.txt 沒有合法的 Publisher ID"
elif [ "$PUB" = "pub-0000000000000000" ]; then
  no "public/ads.txt 仍是樣板佔位值 pub-0000000000000000 — 需要真的 Publisher ID"
else
  ok "public/ads.txt 已填入 $PUB"
fi

if grep -q 'data-hosts=""' "$ROOT/web/demo/index.html" 2>/dev/null; then
  no "demo 的 data-hosts 是空的"
else
  ok "載入器有正式網域白名單 (dev guard 生效)"
fi

command -v node >/dev/null 2>&1 &&
  { node --check "$ROOT/web/ads.js" >/dev/null 2>&1 && ok "web/ads.js 語法正確" \
    || no "web/ads.js 語法錯誤"; }

head_ "[tech] 各網域的線上狀態"

for d in $DOMAINS; do
  code="$(curl -sS -o /dev/null -w '%{http_code}' --max-time 8 "https://$d/ads.txt" 2>/dev/null)"
  case "$code" in
    200) ok "https://$d/ads.txt 可讀取" ;;
    000) hm "https://$d 連不上 (服務未啟動或網路不通) — 無法判定" ;;
    *)   no "https://$d/ads.txt 回應 $code — 買方抓不到就不會出價" ;;
  esac

  pcode="$(curl -sS -o /dev/null -w '%{http_code}' --max-time 8 "https://$d/privacy" 2>/dev/null)"
  [ "$pcode" = "200" ] && ok "https://$d/privacy 存在" \
    || no "https://$d/privacy 不存在 — AdSense 政策強制要求隱私權政策頁"
done

head_ "[manual] 只能在 AdSense 後台 / 銀行完成的前置"

gate() {
  local key="$1" desc="$2"
  case "${!key:-}" in
    done|DONE|yes|true) ok "$desc" ;;
    *) no "$desc  (完成後在 $STATE 設 $key=done)" ;;
  esac
}

gate ADS_ACCOUNT   "AdSense 帳號已通過審核, 拿到 ca-pub- Publisher ID"
gate ADS_SITE_APPROVED "要放廣告的網域已在 AdSense 後台通過站台審核"
gate ADS_TAX_FORM  "稅務資訊已提交 (台灣個人 = W-8BEN, 未交會被預扣最高 30%)"
gate ADS_IDENTITY  "身分驗證文件已上傳並通過"
gate ADS_PIN       "地址 PIN 驗證完成 (達驗證門檻時 Google 寄國際平信, 約 3 週送達)"
gate ADS_BANK      "已綁定可收 USD 的銀行帳戶 (電匯需 SWIFT code)"
gate ADS_CMP       "已安裝 Google 認證 CMP (2024-01-16 起, 沒有它就不能對 EEA/UK 投放個人化廣告)"

head_ "結果"
printf '  PASS %d  FAIL %d  WARN %d\n\n' "$pass" "$fail" "$warn"
[ "$fail" -eq 0 ]
