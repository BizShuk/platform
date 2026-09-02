// web/ads.test.js — dev guard 迴歸測試 (node, 零相依)
//
// 只驗一件事, 但那是唯一會導致`帳號停權`的邏輯:
// 非白名單網域絕不能對 Google 發出任何請求.
// 跑法: npm test
const path = require('path');
const ADS = path.join(__dirname, 'ads.js');

// 最小 DOM stub:只證明一件事 —— 非白名單網域不得產生任何對外請求。
function run(hostname, hosts, client) {
  const appended = [];
  const el = { style:{}, attrs:{'data-ad-slot':'123'}, children:[],
    setAttribute(k,v){this.attrs[k]=v;}, getAttribute(k){return this.attrs[k]??null;},
    appendChild(c){this.children.push(c);}, set textContent(v){this._t=v;} };
  const script = { getAttribute:(k)=>({'data-client':client,'data-consent':'not-required',
    'data-hosts':hosts,'data-lazy-margin':null}[k] ?? null) };
  global.window = { adsbygoogle:undefined };
  global.document = { currentScript: script, readyState:'complete',
    querySelectorAll:(s)=> s.startsWith('[data-ad-slot]') && !el.attrs['data-ad-ready'] ? [el] : [],
    createElement:(t)=>({tagName:t,style:{},setAttribute(k,v){this[k]=v;},
      set src(v){appended.push(v);}, get src(){return this._s;}}),
    addEventListener(){}, head:{appendChild(n){ if(n.src) appended.push(n.src); }} };
  global.location = { hostname };
  global.IntersectionObserver = function(cb){ this.observe=(t)=>cb([{isIntersecting:true,target:t}],this);
    this.unobserve=()=>{}; };
  delete require.cache[require.resolve(ADS)];
  require(ADS);
  return { state: global.window.ads.state(), requests: appended };
}

const cases = [
  ['dev 主機不在白名單', run('127.0.0.1','fun.shuks.dev','ca-pub-1234567890123456'), false],
  ['白名單空白',        run('fun.shuks.dev','','ca-pub-1234567890123456'),          false],
  ['Publisher ID 是樣板', run('fun.shuks.dev','fun.shuks.dev','ca-pub-0000'),        false],
  ['正式網域 + 合法 ID', run('fun.shuks.dev','fun.shuks.dev','ca-pub-1234567890123456'), true],
];
let bad = 0;
for (const [name, r, expectLive] of cases) {
  const okLive = r.state.live === expectLive;
  const okNet  = expectLive ? r.requests.length > 0 : r.requests.length === 0;
  const pass = okLive && okNet;
  if (!pass) bad++;
  console.log(`${pass?'PASS':'FAIL'}  ${name}  live=${r.state.live} 對外請求=${r.requests.length}  ${r.state.reason||''}`);
}
process.exit(bad ? 1 : 0);
