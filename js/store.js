/* =========================================================
   Palm Port — Unified Operations  ·  Data Store
   Single source of truth. Persists to localStorage so a
   booking entered once auto-reflects across every page:
   予約 → ロスター → 日報 → 請求/XERO → 給与
   ========================================================= */
(function (global) {
  "use strict";

  const KEY = "palmport_state_v3";
  const TODAY = "2026-09-23"; // app "today" — inside the seeded operating week

  // ---- the operating week (Mon-Sun) shown across roster / daily ----
  const WEEK = [
    "2026-09-21", "2026-09-22", "2026-09-23",
    "2026-09-24", "2026-09-25", "2026-09-26", "2026-09-27",
  ];

  const BUSINESSES = {
    tourism:  { id: "tourism",  code: "PDC", name: "旅行業 (Pacific Day Cruises)", short: "旅行業 PDC", accent: "#0ea5e9", channel: "line", gst: 0.10 },
    cleaning: { id: "cleaning", code: "JQC", name: "清掃業 (Jewel Quality Cleaning)", short: "清掃業 JQC", accent: "#10b981", channel: "wa",  gst: 0.10 },
  };

  // ---------- seed data ----------
  function seed() {
    const staff = [
      // tourism
      { id:"t1", biz:"tourism", name:"Mizuho",    role:"Driver / Guide", color:"#0ea5e9", payRate:42, phone:"0411 200 101", email:"mizuho@palmport.au",  access:["roster","daily","mobile"], active:true },
      { id:"t2", biz:"tourism", name:"Kenji N.",  role:"Driver",         color:"#0284c7", payRate:38, phone:"0411 200 102", email:"kenji@palmport.au",   access:["roster","daily","mobile"], active:true },
      { id:"t3", biz:"tourism", name:"Hiroshi T.",role:"Driver",         color:"#0369a1", payRate:38, phone:"0411 200 103", email:"hiroshi@palmport.au", access:["daily","mobile"], active:true },
      { id:"t4", biz:"tourism", name:"Nanase U.", role:"Guide",          color:"#6366f1", payRate:36, phone:"0411 200 104", email:"nanase@palmport.au",  access:["daily","mobile"], active:true },
      { id:"t5", biz:"tourism", name:"Mariko K.", role:"Guide",          color:"#8b5cf6", payRate:36, phone:"0411 200 105", email:"mariko@palmport.au",  access:["daily","mobile"], active:true },
      // cleaning
      { id:"c1", biz:"cleaning", name:"Deb",      role:"Cleaner / Lead", color:"#10b981", payRate:34, phone:"0422 300 201", email:"deb@palmport.au",    access:["roster","daily","mobile"], active:true },
      { id:"c2", biz:"cleaning", name:"Kate G.",  role:"Cleaner",        color:"#059669", payRate:32, phone:"0422 300 202", email:"kate@palmport.au",   access:["daily","mobile"], active:true },
      { id:"c3", biz:"cleaning", name:"Annette",  role:"Cleaner",        color:"#0d9488", payRate:32, phone:"0422 300 203", email:"annette@palmport.au",access:["daily","mobile"], active:true },
      { id:"c4", biz:"cleaning", name:"Daisy S.", role:"Cleaner",        color:"#14b8a6", payRate:32, phone:"0422 300 204", email:"daisy@palmport.au",  access:["daily","mobile"], active:true },
      { id:"c5", biz:"cleaning", name:"Wendy M.", role:"Cleaner",        color:"#22c55e", payRate:32, phone:"0422 300 205", email:"wendy@palmport.au",  access:["daily","mobile"], active:true },
    ];

    const customers = [
      { id:"cu1", biz:"tourism",  name:"Kawai Family",      kind:"private", contact:"Shiho Kawai",  channel:"line", phone:"+81 90 1234 5678", note:"日本語ガイド希望" },
      { id:"cu2", biz:"tourism",  name:"Pacific CNS",       kind:"agent",   contact:"Y. Tanaka",    channel:"line", phone:"+61 7 4000 1000", note:"" },
      { id:"cu3", biz:"tourism",  name:"Down Under Tours",  kind:"agent",   contact:"Booking desk", channel:"line", phone:"+61 7 4000 2000", note:"Coach charters" },
      { id:"cu4", biz:"tourism",  name:"JTB Cairns",        kind:"agent",   contact:"Ops",          channel:"line", phone:"+61 7 4000 3000", note:"" },
      { id:"cu5", biz:"tourism",  name:"Lavie Tourist",     kind:"agent",   contact:"Agent email",  channel:"line", phone:"+81 3 5555 0000", note:"NEW" },
      { id:"cu6", biz:"tourism",  name:"Yamada",            kind:"private", contact:"Yamada",        channel:"line", phone:"+81 80 0000 0000", note:"" },
      { id:"cu10", biz:"cleaning", name:"Taron Clarke",     kind:"private", contact:"Taron Clarke", channel:"wa", phone:"0433 100 100", note:"Balsam Green, Mt Sheridan · 鍵はメーター箱内" },
      { id:"cu11", biz:"cleaning", name:"Deb @ Caravonica", kind:"private", contact:"Deb",          channel:"wa", phone:"0433 100 101", note:"床/段差注意。過去クレーム有" },
      { id:"cu12", biz:"cleaning", name:"City Park Gardens",kind:"commercial",contact:"Facilities", channel:"wa", phone:"0433 100 102", note:"施錠確認" },
      { id:"cu13", biz:"cleaning", name:"Hari Ross",        kind:"private", contact:"Hari Ross",    channel:"wa", phone:"0433 100 103", note:"Bond clean · 写真報告必須" },
      { id:"cu14", biz:"cleaning", name:"A. Crawford",      kind:"private", contact:"A. Crawford",  channel:"wa", phone:"0433 100 104", note:"NEW · Edmonton" },
    ];

    const jobs = [
      // ---- TOURISM ----
      mkJob({ id:"j1", biz:"tourism", cls:"transfer", date:"2026-09-23", time:"04:30", durationH:1.5, title:"TRF JQ26 → Hotel", ref:"OT26024", customerId:"cu1", customer:"Kawai Family", pax:2, meta:"Arr JQ26 · Shiho & Yukimi Ms", type:"pp", price:291, cost:120, recurring:false, msg:"line", note:"日本語ガイド希望。空港到着ロビーで KAWAI のボードを持って待機。", staff:"t1" }),
      mkJob({ id:"j2", biz:"tourism", cls:"transfer", date:"2026-09-25", time:"05:10", durationH:1.5, title:"TRF Hotel → QF1963", ref:"OT26024", customerId:"cu1", customer:"Kawai Family", pax:2, meta:"Dep QF1963 0710", type:"pp", price:238, cost:110, recurring:false, msg:"line", note:"出発2.5h前にホテル発。荷物4個。", staff:"t2" }),
      mkJob({ id:"j3", biz:"tourism", cls:"tour", date:"2026-09-23", time:"07:00", durationH:9, title:"Kuranda Day Tour", ref:"OT26031", customerId:"cu2", customer:"Pacific CNS", pax:4, meta:"Skyrail + Scenic Rail", type:"pp", price:680, cost:240, recurring:false, msg:"line", note:"キュランダ。レインフォレステーション込み。", staff:"t4" }),
      mkJob({ id:"j4", biz:"tourism", cls:"tour", date:"2026-09-26", time:"08:30", durationH:6, title:"Green Island Transfer", ref:"OT26033", customerId:"cu3", customer:"Down Under Tours", pax:12, meta:"Coach charter", type:"pj", price:982, cost:380, recurring:false, msg:"line", note:"12名グループ。リーフフリート桟橋へ。", staff:"t3" }),
      mkJob({ id:"j5", biz:"tourism", cls:"tour", date:"2026-09-26", time:"06:00", durationH:4, title:"GBR Pier Shuttle", ref:"OT26040", customerId:"cu4", customer:"JTB Cairns", pax:8, meta:"Per-person shuttle", type:"pp", price:440, cost:160, recurring:false, msg:"line", note:"", staff:"t1" }),
      // ---- CLEANING ----
      mkJob({ id:"j10", biz:"cleaning", cls:"clean", date:"2026-09-22", time:"14:15", durationH:2, title:"Domestic Cleaning", ref:"JQ-1163", customerId:"cu10", customer:"Taron Clarke", pax:1, meta:"Balsam Green, Mt Sheridan", type:"pj", price:116, cost:55, recurring:true, recurrence:"隔週", msg:"wa", note:"隔週(Fortnightly) 2.0h。掃除機 → 拭き掃除 → 浴室。鍵はメーター箱内。", staff:"c1" }),
      mkJob({ id:"j11", biz:"cleaning", cls:"clean", date:"2026-09-24", time:"09:30", durationH:2, title:"Domestic Cleaning", ref:"JQ-1140", customerId:"cu11", customer:"Deb @ Caravonica", pax:1, meta:"Caravonica", type:"pj", price:124, cost:58, recurring:true, recurrence:"隔週", msg:"wa", note:"隔週2.0h。過去にクレーム有 → 段差/床注意。", staff:"c1" }),
      mkJob({ id:"j12", biz:"cleaning", cls:"clean", date:"2026-09-22", time:"10:00", durationH:2.5, title:"Office Clean", ref:"JQ-1188", customerId:"cu12", customer:"City Park Gardens", pax:1, meta:"Cairns City", type:"pj", price:223, cost:95, recurring:true, recurrence:"毎週", msg:"wa", note:"毎週。施錠確認を忘れずに。", staff:"c2" }),
      mkJob({ id:"j13", biz:"cleaning", cls:"clean", date:"2026-09-25", time:"08:00", durationH:3, title:"Bond Clean (One-off)", ref:"JQ-1201", customerId:"cu13", customer:"Hari Ross", pax:1, meta:"Bayview Heights", type:"pj", price:188, cost:80, recurring:false, msg:"wa", note:"退去クリーニング。写真報告必須。", staff:"c4" }),
      // ---- UNASSIGNED (land in pool, drag onto roster) ----
      mkJob({ id:"j20", biz:"tourism", cls:"tour", date:"2026-09-24", time:"09:00", durationH:8, title:"Atherton Tablelands Tour", ref:"OT26052", customerId:"cu5", customer:"Lavie Tourist", pax:3, meta:"NEW from agent email", type:"pp", price:540, cost:200, recurring:false, msg:"line", note:"滝めぐり。日本語ガイド。", staff:null }),
      mkJob({ id:"j21", biz:"tourism", cls:"transfer", date:"2026-09-25", time:"05:40", durationH:1.5, title:"TRF Hotel → Airport", ref:"OT26055", customerId:"cu6", customer:"Yamada", pax:2, meta:"NEW · Dep JQ52", type:"pp", price:198, cost:90, recurring:false, msg:"line", note:"", staff:null }),
      mkJob({ id:"j22", biz:"cleaning", cls:"clean", date:"2026-09-24", time:"13:00", durationH:2.5, title:"Domestic Cleaning", ref:"JQ-1212", customerId:"cu14", customer:"A. Crawford", pax:1, meta:"NEW · Edmonton", type:"pj", price:132, cost:60, recurring:true, recurrence:"隔週", msg:"wa", note:"隔週2.5h 希望。新規クライアント。", staff:null }),
    ];

    return { staff, customers, jobs, invoices: [], seq: { job: 100, inv: 1000, cust: 100 }, currentBiz: "tourism" };
  }

  function mkJob(o) {
    return {
      id: o.id, biz: o.biz, cls: o.cls, date: o.date, time: o.time,
      durationH: o.durationH || 2, title: o.title, ref: o.ref,
      customerId: o.customerId || null, customer: o.customer, pax: o.pax || 1,
      meta: o.meta || "", type: o.type || "pj", price: o.price || 0, cost: o.cost || 0,
      recurring: !!o.recurring, recurrence: o.recurrence || "", msg: o.msg || "line",
      note: o.note || "",
      assigned: o.staff || null,
      status: o.staff ? "assigned" : "unassigned", // unassigned | assigned | in_progress | done
      actualStart: null, actualEnd: null, photos: [], completionNote: "",
      invoiceId: null,
    };
  }

  // ---------- persistence ----------
  let state = load();

  function load() {
    try {
      const raw = global.localStorage.getItem(KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) { /* ignore */ }
    const s = seed();
    persist(s);
    return s;
  }
  function persist(s) {
    try { global.localStorage.setItem(KEY, JSON.stringify(s || state)); } catch (e) {}
  }

  // ---------- pub/sub so pages auto-refresh ----------
  const listeners = new Set();
  function emit() { persist(); listeners.forEach((fn) => { try { fn(); } catch (e) {} }); }

  // ---------- public API ----------
  const Store = {
    TODAY, WEEK, BUSINESSES,

    onChange(fn) { listeners.add(fn); return () => listeners.delete(fn); },
    notify: emit,

    state() { return state; },
    get currentBiz() { return state.currentBiz; },
    setBiz(biz) { state.currentBiz = biz; emit(); },

    reset() { state = seed(); emit(); },

    // ----- staff / customers -----
    staff(biz) { return state.staff.filter((s) => (!biz || s.biz === biz)); },
    staffById(id) { return state.staff.find((s) => s.id === id); },
    addStaff(o) {
      const id = "s" + (++state.seq.cust);
      state.staff.push(Object.assign({ id, color:"#64748b", payRate:32, access:["daily","mobile"], active:true }, o));
      emit(); return id;
    },
    updateStaff(id, patch) { Object.assign(this.staffById(id) || {}, patch); emit(); },
    removeStaff(id) { state.staff = state.staff.filter((s) => s.id !== id); emit(); },

    customers(biz) { return state.customers.filter((c) => (!biz || c.biz === biz)); },
    customerById(id) { return state.customers.find((c) => c.id === id); },
    addCustomer(o) {
      const id = "cu" + (++state.seq.cust);
      state.customers.push(Object.assign({ id, kind:"private", channel: o.biz === "cleaning" ? "wa" : "line" }, o));
      emit(); return id;
    },
    updateCustomer(id, patch) { Object.assign(this.customerById(id) || {}, patch); emit(); },

    // ----- jobs / bookings -----
    jobs(filter) {
      let list = state.jobs.slice();
      if (filter && filter.biz) list = list.filter((j) => j.biz === filter.biz);
      if (filter && filter.date) list = list.filter((j) => j.date === filter.date);
      if (filter && filter.staff) list = list.filter((j) => j.assigned === filter.staff);
      if (filter && filter.status) list = list.filter((j) => j.status === filter.status);
      return list.sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
    },
    jobById(id) { return state.jobs.find((j) => j.id === id); },
    addBooking(o) {
      const id = "j" + (++state.seq.job);
      const biz = o.biz || state.currentBiz;
      const cust = o.customerId ? this.customerById(o.customerId) : null;
      const job = mkJob({
        id, biz, cls: o.cls || (biz === "cleaning" ? "clean" : "tour"),
        date: o.date, time: o.time, durationH: Number(o.durationH) || 2,
        title: o.title, ref: o.ref || autoRef(biz),
        customerId: o.customerId || null, customer: o.customer || (cust && cust.name) || "—",
        pax: Number(o.pax) || 1, meta: o.meta || "", type: o.type || "pj",
        price: Number(o.price) || 0, cost: Number(o.cost) || 0,
        recurring: !!o.recurring, recurrence: o.recurrence || "",
        msg: o.msg || (cust && cust.channel) || (biz === "cleaning" ? "wa" : "line"),
        note: o.note || "", staff: o.assigned || null,
      });
      state.jobs.push(job); emit(); return id;
    },
    updateJob(id, patch) {
      const j = this.jobById(id); if (!j) return;
      Object.assign(j, patch);
      if (patch.assigned !== undefined) {
        if (!patch.assigned && j.status === "assigned") j.status = "unassigned";
        else if (patch.assigned && j.status === "unassigned") j.status = "assigned";
      }
      emit();
    },
    assign(id, staffId, date) {
      const j = this.jobById(id); if (!j) return;
      j.assigned = staffId || null;
      if (date) j.date = date;
      j.status = staffId ? (j.status === "done" || j.status === "in_progress" ? j.status : "assigned") : "unassigned";
      emit();
    },
    setStatus(id, status, extra) {
      const j = this.jobById(id); if (!j) return;
      j.status = status; if (extra) Object.assign(j, extra);
      emit();
    },
    removeJob(id) { state.jobs = state.jobs.filter((j) => j.id !== id); emit(); },

    // ----- invoicing -----
    invoices(biz) { return state.invoices.filter((i) => (!biz || i.biz === biz)); },
    invoiceById(id) { return state.invoices.find((i) => i.id === id); },
    // group completed, un-invoiced jobs by customer → returns previews
    invoiceableGroups(biz) {
      const done = state.jobs.filter((j) => j.biz === biz && j.status === "done" && !j.invoiceId);
      const map = {};
      done.forEach((j) => {
        const k = j.customerId || j.customer;
        (map[k] = map[k] || { customer: j.customer, customerId: j.customerId, jobs: [] }).jobs.push(j);
      });
      return Object.values(map);
    },
    createInvoice(biz, jobIds) {
      const jobs = jobIds.map((id) => this.jobById(id)).filter(Boolean);
      if (!jobs.length) return null;
      const subtotal = jobs.reduce((s, j) => s + j.price, 0);
      const gst = Math.round(subtotal * (BUSINESSES[biz].gst) * 100) / 100;
      const id = "INV-" + (++state.seq.inv);
      const inv = {
        id, biz, customer: jobs[0].customer, customerId: jobs[0].customerId,
        jobIds: jobs.map((j) => j.id), subtotal, gst, total: Math.round((subtotal + gst) * 100) / 100,
        status: "draft", date: TODAY, xeroSynced: false,
      };
      jobs.forEach((j) => { j.invoiceId = id; });
      state.invoices.push(inv); emit(); return id;
    },
    setInvoiceStatus(id, status, patch) {
      const inv = this.invoiceById(id); if (!inv) return;
      inv.status = status; if (patch) Object.assign(inv, patch);
      emit();
    },
    deleteInvoice(id) {
      const inv = this.invoiceById(id); if (!inv) return;
      inv.jobIds.forEach((jid) => { const j = this.jobById(jid); if (j) j.invoiceId = null; });
      state.invoices = state.invoices.filter((i) => i.id !== id); emit();
    },

    // ----- payroll: compute from completed/assigned jobs -----
    payroll(biz, weekDates) {
      const dates = weekDates || WEEK;
      return this.staff(biz).map((s) => {
        const jobs = state.jobs.filter((j) => j.assigned === s.id && dates.indexOf(j.date) >= 0);
        const hours = jobs.reduce((sum, j) => sum + (Number(j.durationH) || 0), 0);
        const done = jobs.filter((j) => j.status === "done").length;
        const gross = Math.round(hours * s.payRate * 100) / 100;
        return { staff: s, jobs, jobCount: jobs.length, done, hours: Math.round(hours * 10) / 10, rate: s.payRate, gross };
      });
    },
  };

  function autoRef(biz) {
    const n = state.seq.job;
    return biz === "cleaning" ? "JQ-" + (1200 + n) : "OT26" + String(60 + n).padStart(3, "0");
  }

  global.Store = Store;
})(window);
