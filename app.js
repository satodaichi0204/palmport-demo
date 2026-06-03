/* =========================================================
   Palm Port Pty Ltd — Unified Operations (Demo / たたき台)
   Static prototype: no backend, mock data only.
   ========================================================= */

// ---- Week of 21–27 Sep 2026 (matches tour ref OT26024 dates) ----
const DAYS = [
  { dow: "Mon", date: "21" }, { dow: "Tue", date: "22" }, { dow: "Wed", date: "23" },
  { dow: "Thu", date: "24" }, { dow: "Fri", date: "25" }, { dow: "Sat", date: "26" },
  { dow: "Sun", date: "27" },
];
const TODAY_INDEX = 2; // Wed 23 Sep highlighted

// ---- Staff (numbers mirror the client's doc) ----
const STAFF = {
  tourism: [
    { id: "t1", name: "Mizuho",   role: "Driver / Guide", color: "#0ea5e9" },
    { id: "t2", name: "Kenji N.", role: "Driver",         color: "#0284c7" },
    { id: "t3", name: "Hiroshi T.", role: "Driver",       color: "#0369a1" },
    { id: "t4", name: "Nanase U.", role: "Guide",         color: "#6366f1" },
    { id: "t5", name: "Mariko K.", role: "Guide",         color: "#8b5cf6" },
  ],
  cleaning: [
    { id: "c1", name: "Deb",      role: "Cleaner", color: "#10b981" },
    { id: "c2", name: "Kate G.",  role: "Cleaner", color: "#059669" },
    { id: "c3", name: "Annette",  role: "Cleaner", color: "#0d9488" },
    { id: "c4", name: "Daisy S.", role: "Cleaner", color: "#14b8a6" },
    { id: "c5", name: "Wendy M.", role: "Cleaner", color: "#22c55e" },
  ],
};

// ---- Jobs.  assigned = staffId, day = index (null,null => unassigned pool) ----
let JOBS = [
  // ---- TOURISM ----
  { id:"j1", biz:"tourism", cls:"transfer", time:"04:30", title:"TRF JQ26 → Hotel",
    ref:"OT26024", customer:"Kawai Family (2 pax)", meta:"Arr JQ26 · Shiho & Yukimi Ms",
    type:"pp", price:291, cost:120, recurring:false, msg:"line",
    note:"日本語ガイド希望。空港到着ロビーで KAWAI のボードを持って待機。",
    assigned:"t1", day:2 },
  { id:"j2", biz:"tourism", cls:"transfer", time:"05:10", title:"TRF Hotel → QF1963",
    ref:"OT26024", customer:"Kawai Family (2 pax)", meta:"Dep QF1963 0710",
    type:"pp", price:238, cost:110, recurring:false, msg:"line",
    note:"出発2.5h前にホテル発。荷物4個。", assigned:"t2", day:4 },
  { id:"j3", biz:"tourism", cls:"tour", time:"07:00", title:"Kuranda Day Tour",
    ref:"OT26031", customer:"Pacific CNS (4 pax)", meta:"Skyrail + Scenic Rail",
    type:"pp", price:680, cost:240, recurring:false, msg:"line",
    note:"キュランダ。レインフォレステーション込み。", assigned:"t4", day:2 },
  { id:"j4", biz:"tourism", cls:"tour", time:"08:30", title:"Green Island Transfer",
    ref:"OT26033", customer:"Down Under Tours (12 pax)", meta:"Coach charter",
    type:"pj", price:982, cost:380, recurring:false, msg:"line",
    note:"12名グループ。リーフフリート桟橋へ。", assigned:"t3", day:5 },
  { id:"j5", biz:"tourism", cls:"tour", time:"06:00", title:"GBR Pier Shuttle",
    ref:"OT26040", customer:"JTB Cairns (8 pax)", meta:"Per-person shuttle",
    type:"pp", price:440, cost:160, recurring:false, msg:"line",
    note:"", assigned:"t1", day:5 },

  // ---- CLEANING ----
  { id:"j10", biz:"cleaning", cls:"clean", time:"14:15", title:"Domestic Cleaning",
    ref:"JQ-1163", customer:"Taron Clarke", meta:"Balsam Green, Mt Sheridan",
    type:"pj", price:116, cost:55, recurring:true, msg:"wa",
    note:"隔週(Fortnightly) 2.0h。掃除機 → 拭き掃除 → 浴室。鍵はメーター箱内。",
    assigned:"c1", day:1 },
  { id:"j11", biz:"cleaning", cls:"clean", time:"09:30", title:"Domestic Cleaning",
    ref:"JQ-1140", customer:"Deb @ Caravonica", meta:"Caravonica",
    type:"pj", price:124, cost:58, recurring:true, msg:"wa",
    note:"隔週2.0h。過去にクレーム有 → 段差/床注意。少し斜めにアクセス。",
    assigned:"c1", day:3 },
  { id:"j12", biz:"cleaning", cls:"clean", time:"10:00", title:"Office Clean",
    ref:"JQ-1188", customer:"City Park Gardens", meta:"Cairns City",
    type:"pj", price:223, cost:95, recurring:true, msg:"wa",
    note:"毎週。施錠確認を忘れずに。", assigned:"c2", day:1 },
  { id:"j13", biz:"cleaning", cls:"clean", time:"08:00", title:"Bond Clean (One-off)",
    ref:"JQ-1201", customer:"Hari Ross", meta:"Bayview Heights",
    type:"pj", price:188, cost:80, recurring:false, msg:"wa",
    note:"退去クリーニング。写真報告必須。", assigned:"c4", day:4 },

  // ---- UNASSIGNED (drag me onto the roster!) ----
  { id:"j20", biz:"tourism", cls:"tour", time:"09:00", title:"Atherton Tablelands Tour",
    ref:"OT26052", customer:"Lavie Tourist (3 pax)", meta:"NEW from agent email",
    type:"pp", price:540, cost:200, recurring:false, msg:"line",
    note:"滝めぐり。日本語ガイド。", assigned:null, day:null },
  { id:"j21", biz:"tourism", cls:"transfer", time:"05:40", title:"TRF Hotel → Airport",
    ref:"OT26055", customer:"Yamada (2 pax)", meta:"NEW · Dep JQ52",
    type:"pp", price:198, cost:90, recurring:false, msg:"line",
    note:"", assigned:null, day:null },
  { id:"j22", biz:"cleaning", cls:"clean", time:"13:00", title:"Domestic Cleaning",
    ref:"JQ-1212", customer:"A. Crawford", meta:"NEW · Edmonton",
    type:"pj", price:132, cost:60, recurring:true, msg:"wa",
    note:"隔週2.5h 希望。新規クライアント。", assigned:null, day:null },
];

// ---------- state ----------
let currentBiz = "tourism";

// ---------- helpers ----------
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const money = (n) => "$" + n.toLocaleString("en-AU");
const initials = (name) => name.split(/[ .]/).filter(Boolean).slice(0,2).map(w=>w[0]).join("").toUpperCase();
const jobById = (id) => JOBS.find(j => j.id === id);

function badgeHTML(j) {
  let b = "";
  if (j.recurring) b += `<span class="badge recurring">🔁 Recurring</span>`;
  b += j.type === "pp" ? `<span class="badge pp">Per person</span>` : `<span class="badge pj">Per job</span>`;
  b += j.msg === "wa" ? `<span class="badge wa">WhatsApp</span>` : `<span class="badge line">LINE</span>`;
  return b;
}

function jobCardHTML(j) {
  return `<div class="job ${j.cls}" data-id="${j.id}" draggable="true">
    <div class="j-time">${j.time} · <span style="opacity:.6">${j.ref}</span></div>
    <div class="j-title">${j.title}</div>
    <div class="j-meta">${j.customer} — ${j.meta}</div>
    <div class="badges">${badgeHTML(j)}<span class="badge">${money(j.price)}</span></div>
  </div>`;
}

// ---------- render: KPIs ----------
function renderKPIs() {
  const list = JOBS.filter(j => j.biz === currentBiz && j.assigned);
  const income = list.reduce((s,j)=>s+j.price,0);
  const cost   = list.reduce((s,j)=>s+j.cost,0);
  const margin = income ? Math.round(((income-cost)/income)*100) : 0;
  const unassigned = JOBS.filter(j => j.biz === currentBiz && !j.assigned).length;
  const staffCount = STAFF[currentBiz].length;

  $("#kpis").innerHTML = `
    ${kpi("今週の売上 / Income", money(income), "↑ vs last wk", "up")}
    ${kpi("コスト / Cost", money(cost), "wages + fuel", "")}
    ${kpi("粗利率 / Margin", margin + "%", "auto-calculated", "up")}
    ${kpi("確定ジョブ / Jobs", list.length, `${staffCount} staff active`, "")}
    ${kpi("未割当 / Unassigned", unassigned, unassigned ? "drag onto roster →" : "all assigned ✓", unassigned ? "warn" : "up")}
  `;
}
function kpi(label, value, delta, cls) {
  return `<div class="kpi"><div class="label">${label}</div>
    <div class="value">${value}</div><div class="delta ${cls}">${delta}</div></div>`;
}

// ---------- render: unassigned pool ----------
function renderPool() {
  const pool = JOBS.filter(j => j.biz === currentBiz && !j.assigned);
  $("#poolCount").textContent = pool.length;
  const body = $("#poolBody");
  body.innerHTML = pool.length
    ? pool.map(jobCardHTML).join("")
    : `<div class="pool-hint">✅ 未割当のジョブはありません。<br>新しい予約はここに入り、<br>ドラッグでスタッフに割り当てます。</div>`;
}

// ---------- render: roster ----------
function renderRoster() {
  const staff = STAFF[currentBiz];
  let html = `<div class="r-cell r-corner r-head">Staff \\ Day</div>`;
  DAYS.forEach((d,i) => {
    html += `<div class="r-cell r-head ${i===TODAY_INDEX?'today':''}">
      <div>${d.date} Sep</div><div class="dow">${d.dow}</div></div>`;
  });
  staff.forEach(s => {
    html += `<div class="r-cell r-staff">
      <div class="av" style="background:${s.color}">${initials(s.name)}</div>
      <div><div class="nm">${s.name}</div><div class="role">${s.role}</div></div></div>`;
    DAYS.forEach((d,i) => {
      const cell = JOBS.filter(j => j.biz===currentBiz && j.assigned===s.id && j.day===i);
      html += `<div class="r-cell r-slot" data-staff="${s.id}" data-day="${i}">
        ${cell.map(jobCardHTML).join("")}</div>`;
    });
  });
  $("#roster").innerHTML = html;
}

// ---------- drag & drop (SortableJS) ----------
let _sortables = [];
function initSortable() {
  _sortables.forEach(s => { try { s.destroy(); } catch (e) {} });
  _sortables = [];
  const opts = {
    group: "jobs", animation: 160, ghostClass: "sortable-ghost",
    chosenClass: "sortable-chosen", forceFallback: true, fallbackOnBody: true,
    onAdd: onMove, onUpdate: onMove,
  };
  _sortables.push(Sortable.create($("#poolBody"), opts));           // pool
  $$(".r-slot").forEach(slot => _sortables.push(Sortable.create(slot, opts))); // roster slots
}

function onMove(evt) {
  const id = evt.item.dataset.id;
  const j = jobById(id);
  if (!j) return;
  const dest = evt.to;
  if (dest.id === "poolBody") {
    j.assigned = null; j.day = null;
  } else {
    j.assigned = dest.dataset.staff;
    j.day = Number(dest.dataset.day);
  }
  // light up the "enter once" flow + refresh derived views
  pulseFlow();
  renderKPIs();
  $("#poolCount").textContent = JOBS.filter(x => x.biz===currentBiz && !x.assigned).length;
}

// "1回入力 → 全部に反映" animated chips
function pulseFlow() {
  const chips = $$("#flow .chip");
  chips.forEach((c,i) => {
    setTimeout(() => {
      c.classList.add("lit");
      setTimeout(() => c.classList.remove("lit"), 700);
    }, i * 130);
  });
}

// ---------- business toggle ----------
function setBiz(biz) {
  currentBiz = biz;
  $$(".toggle button").forEach(b => b.classList.toggle("active", b.dataset.biz === biz));
  // recolor enter-once chips by business
  document.documentElement.style.setProperty("--tour-soft", biz==="cleaning" ? "#d1fae5" : "#e0f2fe");
  renderAll();
}

// ---------- mobile staff view ----------
function openMobile() {
  buildMobilePicker();
  showMobileFor(STAFF[currentBiz][0].id);
  $("#overlay").classList.add("show");
}
function buildMobilePicker() {
  const sel = $("#mobilePick");
  sel.innerHTML = STAFF[currentBiz].map(s => `<option value="${s.id}">${s.name} — ${s.role}</option>`).join("");
}
function showMobileFor(staffId) {
  const s = STAFF[currentBiz].find(x => x.id === staffId);
  const mine = JOBS.filter(j => j.assigned === staffId).sort((a,b)=>a.time.localeCompare(b.time));
  $("#mWho").textContent = s.name;
  $("#mDate").textContent = `${s.role} · Wed 23 Sep 2026`;
  const body = $("#phoneBody");
  body.innerHTML = mine.length ? mine.map(j => `
    <div class="m-card ${j.cls==='clean'?'clean':''}">
      <div class="m-time">${j.time} · ${j.ref}</div>
      <div class="m-title">${j.title}</div>
      <div class="m-row">👤 ${j.customer}</div>
      <div class="m-row">📍 ${j.meta}</div>
      <div class="m-row">💵 ${money(j.price)} · ${j.type==='pp'?'Per person':'Per job'}${j.recurring?' · 🔁 Recurring':''}</div>
      ${j.note ? `<div class="m-note">📝 ${j.note}</div>` : ``}
      <div class="m-actions">
        ${j.biz==='cleaning' ? `<button class="m-btn start">▶ GPS Start / 開始</button>` : ``}
        <button class="m-btn map">🗺 Map / 地図</button>
      </div>
    </div>`).join("")
    : `<div class="pool-hint">本日の割当はありません。</div>`;
}

// ---------- bootstrap ----------
function renderAll() {
  renderKPIs();
  renderPool();
  renderRoster();
  initSortable();
}

document.addEventListener("DOMContentLoaded", () => {
  renderAll();
  $$(".toggle button").forEach(b => b.addEventListener("click", () => setBiz(b.dataset.biz)));
  $("#btnMobile").addEventListener("click", openMobile);
  $("#overlay").addEventListener("click", (e) => { if (e.target.id === "overlay") $("#overlay").classList.remove("show"); });
  $("#closeMobile").addEventListener("click", () => $("#overlay").classList.remove("show"));
  $("#mobilePick").addEventListener("change", (e) => showMobileFor(e.target.value));
});
