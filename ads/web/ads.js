/* ads.js — AdSense 版位載入器 (zero dependency, no build step)
 *
 * 設計目標只有三個,每一個都對應一種會真的讓你損失錢的失敗:
 *
 *   1. dev guard    —— 非正式網域絕不發出廣告請求。開發機的曝光與點擊會被
 *                      Google 記為無效流量 (invalid traffic),累積到一定量`直接停權`。
 *   2. 佔位優先      —— 廣告到達之前就把高度佔好,避免 CLS 把內文往下推。
 *   3. consent gate  —— EEA / UK 訪客在同意之前不載入,否則違反 GDPR,
 *                      而且沒有認證 CMP 就只能拿到非個人化與限定廣告。
 *
 * 掛法見 README.md。本檔`不`處理同意介面本身 —— CMP 是獨立的一塊,
 * 這裡只提供 `window.ads.grantConsent()` 這個掛點給它呼叫。
 */
(function () {
  'use strict';

  var ADSENSE_SRC = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js';
  var self = document.currentScript;
  if (!self) return;

  var cfg = {
    client: (self.getAttribute('data-client') || '').trim(),
    consent: (self.getAttribute('data-consent') || 'required').trim(),
    hosts: split(self.getAttribute('data-hosts')),
    lazyMargin: self.getAttribute('data-lazy-margin') || '600px'
  };

  function split(v) {
    if (!v) return [];
    return v.split(',').map(function (s) { return s.trim().toLowerCase(); })
            .filter(Boolean);
  }

  // --- 判斷這次載入該不該真的叫廣告 ---------------------------------------
  // 白名單`沒填`時一律當作非正式環境。預設安全:漏設定的後果是「沒廣告」,
  // 而不是「拿開發機的流量去撞 Google 的無效流量偵測」。
  var host = location.hostname.toLowerCase();
  var live = cfg.hosts.indexOf(host) !== -1;
  var reason = live ? '' :
    cfg.hosts.length === 0 ? 'data-hosts 未設定' : host + ' 不在 data-hosts 白名單';

  if (live && !/^ca-pub-\d{16}$/.test(cfg.client)) {
    live = false;
    reason = 'data-client 不是合法的 Publisher ID (ca-pub- + 16 位數字)';
  }

  // --- 佔位:在任何網路請求之前先做完 --------------------------------------
  var slots = [];
  function collect() {
    var nodes = document.querySelectorAll('[data-ad-slot]:not([data-ad-ready])');
    for (var i = 0; i < nodes.length; i++) {
      var el = nodes[i];
      el.setAttribute('data-ad-ready', '');
      reserve(el);
      slots.push(el);
    }
  }

  function reserve(el) {
    var h = parseInt(el.getAttribute('data-ad-height') || '280', 10);
    el.style.minHeight = h + 'px';
    el.style.display = 'block';
    el.style.overflow = 'hidden';
    if (!live) placeholder(el, h);
  }

  // 非正式環境畫一個看得見的框:版位存在、尺寸正確、但沒有任何對外請求。
  // 靠這個框才能在 demo 與預覽環境驗證版面,不必冒停權風險。
  function placeholder(el, h) {
    el.style.background =
      'repeating-linear-gradient(45deg,#f4f4f5,#f4f4f5 10px,#ebebed 10px,#ebebed 20px)';
    el.style.border = '1px dashed #c4c4c8';
    el.style.borderRadius = '4px';
    el.style.font = '12px/1.6 ui-monospace,SFMono-Regular,Menlo,monospace';
    el.style.color = '#71717a';
    el.style.display = 'flex';
    el.style.alignItems = 'center';
    el.style.justifyContent = 'center';
    el.style.textAlign = 'center';
    el.textContent = 'AD SLOT ' + (el.getAttribute('data-ad-slot') || '?') +
      ' · ' + h + 'px · ' + reason;
  }

  // --- consent gate --------------------------------------------------------
  var granted = cfg.consent !== 'required';
  var pending = [];

  function grantConsent() {
    if (granted) return;
    granted = true;
    var q = pending; pending = [];
    q.forEach(function (fn) { fn(); });
  }

  function whenConsented(fn) {
    if (granted) fn(); else pending.push(fn);
  }

  // --- 載入 AdSense 主程式 (只載一次) --------------------------------------
  var loading = false;
  function ensureScript() {
    if (loading) return;
    loading = true;
    var s = document.createElement('script');
    s.src = ADSENSE_SRC + '?client=' + encodeURIComponent(cfg.client);
    s.async = true;
    s.crossOrigin = 'anonymous';
    document.head.appendChild(s);
  }

  // --- 真正把一個版位交給 AdSense ------------------------------------------
  function fill(el) {
    var ins = document.createElement('ins');
    ins.className = 'adsbygoogle';
    ins.style.display = 'block';
    ins.setAttribute('data-ad-client', cfg.client);
    ins.setAttribute('data-ad-slot', el.getAttribute('data-ad-slot'));
    ins.setAttribute('data-ad-format', el.getAttribute('data-ad-format') || 'auto');
    ins.setAttribute('data-full-width-responsive',
      el.getAttribute('data-ad-full-width') || 'true');
    el.appendChild(ins);
    ensureScript();
    (window.adsbygoogle = window.adsbygoogle || []).push({});
  }

  // --- lazy load:接近視窗才載 ---------------------------------------------
  // 一次把整頁版位都送出去會拉高「曝光但沒被看到」的比例,
  // 那個比例正是 viewability 指標,直接影響單價。
  function observe() {
    if (!('IntersectionObserver' in window)) {
      slots.forEach(function (el) { whenConsented(function () { fill(el); }); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        io.unobserve(e.target);
        var el = e.target;
        whenConsented(function () { fill(el); });
      });
    }, { rootMargin: cfg.lazyMargin });
    slots.forEach(function (el) { io.observe(el); });
  }

  function start() {
    collect();
    if (live) observe();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }

  // 對外掛點。CMP 在取得同意後呼叫 grantConsent();動態載入的內容呼叫 refresh()
  // 讓新插入的版位也被佔位與觀察。
  window.ads = {
    grantConsent: grantConsent,
    refresh: start,
    state: function () {
      return { live: live, reason: reason, consent: granted, slots: slots.length };
    }
  };
})();
