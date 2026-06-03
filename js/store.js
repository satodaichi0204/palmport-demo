/* =========================================================
   Palm Port — Unified Operations  ·  Data Store
   Single source of truth. Persists to localStorage so a
   booking entered once auto-reflects across every page:
   予約 → ロスター → 日報 → 請求/XERO → 給与
   (NOTE: localStorage = single-device demo persistence;
    production needs a backend — see README.)
   ========================================================= */
(function (global) {
  "use strict";

  const KEY = "palmport_state_v4";
  const TODAY = "2026-09-23";
  const WEEK = ["2026-09-21","2026-09-22","2026-09-23","2026-09-24","2026-09-25","2026-09-26","2026-09-27"];
  // fortnight = this week + next (payroll runs fortnightly per client)
  const WEEK2 = ["2026-09-28","2026-09-29","2026-09-30","2026-10-01","2026-10-02","2026-10-03","2026-10-04"];
  const FORTNIGHT = WEEK.concat(WEEK2);

  const BUSINESSES = {
    tourism:  { id:"tourism",  code:"PDC", name:"旅行業 (Dolphin Tours / PDC)", short:"旅行業 PDC", accent:"#0ea5e9", channel:"line", gst:0.10 },
    cleaning: { id:"cleaning", code:"JQC", name:"清掃業 (JQ Cleaning)", short:"清掃業 JQC", accent:"#10b981", channel:"wa", gst:0.10 },
  };

  function seed() {
    const staff = [
      // ---- tourism: drivers + guides ----
      { id:"t1", biz:"tourism", code:"MZ", name:"Mizuho",        role:"Driver / Guide", color:"#0ea5e9", payRate:42, phone:"0411 200 101", email:"mizuho@palmport.au",  visa:"PR",          startDate:"2019-03-01", vehicleId:"v_p5", access:["roster","daily","mobile","invoicing"], active:true },
      { id:"t2", biz:"tourism", code:"NK", name:"Kenji N.",      role:"Driver",         color:"#0284c7", payRate:38, phone:"0411 200 102", email:"kenji@palmport.au",   visa:"PR",          startDate:"2020-06-15", vehicleId:"v_p1", access:["roster","daily","mobile"], active:true },
      { id:"t3", biz:"tourism", code:"HT", name:"Hiroshi T.",    role:"Driver",         color:"#0369a1", payRate:38, phone:"0411 200 103", email:"hiroshi@palmport.au", visa:"Citizen",     startDate:"2018-01-20", vehicleId:"v_p11", access:["daily","mobile"], active:true },
      { id:"t4", biz:"tourism", code:"NU", name:"Nanase Uraoka", role:"Guide",          color:"#6366f1", payRate:36, phone:"0411 200 104", email:"nanase@palmport.au",  visa:"WHV",         startDate:"2024-02-10", vehicleId:null, access:["daily","mobile"], active:true },
      { id:"t5", biz:"tourism", code:"MK", name:"Mariko Kato",   role:"Guide",          color:"#8b5cf6", payRate:36, phone:"0411 200 105", email:"mariko@palmport.au",  visa:"Student",     startDate:"2024-08-01", vehicleId:null, access:["daily","mobile"], active:true },
      { id:"t6", biz:"tourism", code:"MO", name:"Mio Ogino",     role:"Guide",          color:"#a855f7", payRate:36, phone:"0411 200 106", email:"mio@palmport.au",     visa:"WHV",         startDate:"2025-01-12", vehicleId:null, access:["daily","mobile"], active:true },
      { id:"t7", biz:"tourism", code:"NM", name:"Natsumi Kokaji",role:"Driver / Guide", color:"#0ea5e9", payRate:40, phone:"0411 200 107", email:"natsumi@palmport.au", visa:"PR",          startDate:"2021-09-05", vehicleId:"v_p14", access:["daily","mobile"], active:true },
      { id:"t8", biz:"tourism", code:"NO", name:"Nonoka Mitani", role:"Guide",          color:"#6366f1", payRate:34, phone:"0411 200 108", email:"nonoka@palmport.au",  visa:"Student",     startDate:"2025-03-01", vehicleId:null, access:["daily","mobile"], active:true },
      { id:"t9", biz:"tourism", code:"NH", name:"Nozomu Hirobe", role:"Driver",         color:"#0284c7", payRate:38, phone:"0411 200 109", email:"nozomu@palmport.au",  visa:"PR",          startDate:"2022-04-18", vehicleId:"v_p7", access:["daily","mobile"], active:true },
      { id:"t10",biz:"tourism", code:"RU", name:"Rio Uenishi",   role:"Driver",         color:"#0369a1", payRate:38, phone:"0411 200 110", email:"rio@palmport.au",     visa:"WHV",         startDate:"2024-11-02", vehicleId:"v_p9", access:["daily","mobile"], active:true },
      { id:"t11",biz:"tourism", code:"MS", name:"Manami Suehiro",role:"Guide",          color:"#8b5cf6", payRate:36, phone:"0411 200 111", email:"manami@palmport.au",  visa:"WHV",         startDate:"2025-02-20", vehicleId:null, access:["daily","mobile"], active:true },
      { id:"t12",biz:"tourism", code:"MN", name:"Minami Onodera",role:"Driver / Guide", color:"#0ea5e9", payRate:40, phone:"0411 200 112", email:"minami@palmport.au",  visa:"PR",          startDate:"2021-07-11", vehicleId:"v_p12", access:["daily","mobile"], active:true },

      // ---- cleaning: cleaners ----
      { id:"c1", biz:"cleaning", code:"DEB", name:"Deb",        role:"Cleaner / Lead", color:"#10b981", payRate:34, phone:"0422 300 201", email:"deb@palmport.au",    visa:"Citizen", startDate:"2017-05-01", vehicleId:"v_c1", access:["roster","daily","mobile"], active:true },
      { id:"c2", biz:"cleaning", code:"KG", name:"Kate G.",     role:"Cleaner",        color:"#059669", payRate:32, phone:"0422 300 202", email:"kate@palmport.au",   visa:"PR",      startDate:"2020-02-10", vehicleId:"v_c2", access:["daily","mobile"], active:true },
      { id:"c3", biz:"cleaning", code:"AN", name:"Annette",     role:"Cleaner",        color:"#0d9488", payRate:32, phone:"0422 300 203", email:"annette@palmport.au",visa:"Citizen", startDate:"2019-08-22", vehicleId:"v_c3", access:["daily","mobile"], active:true },
      { id:"c4", biz:"cleaning", code:"DS", name:"Daisy S.",    role:"Cleaner",        color:"#14b8a6", payRate:32, phone:"0422 300 204", email:"daisy@palmport.au",  visa:"WHV",     startDate:"2024-09-15", vehicleId:"v_c4", access:["daily","mobile"], active:true },
      { id:"c5", biz:"cleaning", code:"WM", name:"Wendy M.",    role:"Cleaner",        color:"#22c55e", payRate:32, phone:"0422 300 205", email:"wendy@palmport.au",  visa:"PR",      startDate:"2021-11-30", vehicleId:"v_c5", access:["daily","mobile"], active:true },
      { id:"c6", biz:"cleaning", code:"YM", name:"Yuki Matsumoto",role:"Cleaner",      color:"#16a34a", payRate:32, phone:"0422 300 206", email:"yukim@palmport.au",  visa:"WHV",     startDate:"2025-01-08", vehicleId:"v_c6", access:["daily","mobile"], active:true },
      { id:"c7", biz:"cleaning", code:"YK", name:"Yuko Kuramoto",role:"Cleaner",       color:"#15803d", payRate:32, phone:"0422 300 207", email:"yukok@palmport.au",  visa:"Student", startDate:"2025-04-01", vehicleId:"v_c7", access:["daily","mobile"], active:true },
      { id:"c8", biz:"cleaning", code:"AZ", name:"Azumi Nishiwaki",role:"Cleaner",     color:"#10b981", payRate:32, phone:"0422 300 208", email:"azumi@palmport.au",  visa:"WHV",     startDate:"2024-12-01", vehicleId:null, access:["daily","mobile"], active:true },
      { id:"c9", biz:"cleaning", code:"ST", name:"Shion Takagi", role:"Cleaner",       color:"#059669", payRate:32, phone:"0422 300 209", email:"shion@palmport.au",  visa:"Student", startDate:"2025-03-15", vehicleId:null, access:["daily","mobile"], active:true },
    ];

    const vehicles = [
      // tourism buses / coaches
      { id:"v_p11", biz:"tourism", kind:"Coach", name:"IRIZAR i6 (P11)", rego:"XB17JR", seats:54, paxCapacity:53, year:2023, remark:"", active:true },
      { id:"v_p14", biz:"tourism", kind:"Coach", name:"Yutong C12 (P14)", rego:"XB79ML", seats:58, paxCapacity:57, year:2024, remark:"", active:true },
      { id:"v_p15", biz:"tourism", kind:"Coach", name:"Yutong C12 (P15)", rego:"XC29BI", seats:58, paxCapacity:57, year:2026, remark:"", active:true },
      { id:"v_p7",  biz:"tourism", kind:"Coach", name:"Yutong D7 (P7)",  rego:"XB83OM", seats:29, paxCapacity:28, year:2024, remark:"", active:true },
      { id:"v_p12", biz:"tourism", kind:"Coach", name:"Mitsubishi Fuso (P12)", rego:"XB95AC", seats:25, paxCapacity:24, year:2017, remark:"", active:true },
      { id:"v_p9",  biz:"tourism", kind:"Coaster", name:"Toyota Coaster (P9)", rego:"XB86WU", seats:22, paxCapacity:21, year:2025, remark:"Towbar", active:true },
      { id:"v_p1",  biz:"tourism", kind:"Van", name:"Toyota Hiace (P1)", rego:"876JN3", seats:14, paxCapacity:12, year:2014, remark:"+8 trailer", active:true },
      { id:"v_p5",  biz:"tourism", kind:"Van", name:"Toyota Hiace (P5)", rego:"862FU9", seats:12, paxCapacity:10, year:2022, remark:"+8 trailer", active:true },
      { id:"v_mb",  biz:"tourism", kind:"Van", name:"Mercedes V (MB)", rego:"966OK8", seats:7, paxCapacity:6, year:null, remark:"", active:true },
      { id:"v_ody", biz:"tourism", kind:"Car", name:"Honda Odyssey", rego:"788BD4", seats:8, paxCapacity:7, year:2017, remark:"", active:true },
      { id:"v_tar", biz:"tourism", kind:"Car", name:"Toyota Tarago", rego:"433YLS", seats:7, paxCapacity:5, year:2018, remark:"", active:true },
      // cleaning vehicles
      { id:"v_c1", biz:"cleaning", kind:"Van", name:"Cleaning Van 1", rego:"JQ01CL", seats:2, paxCapacity:0, year:2021, remark:"用具一式", active:true },
      { id:"v_c2", biz:"cleaning", kind:"Car", name:"Cleaning Car 2", rego:"JQ02CL", seats:5, paxCapacity:0, year:2020, remark:"", active:true },
      { id:"v_c3", biz:"cleaning", kind:"Car", name:"Cleaning Car 3", rego:"JQ03CL", seats:5, paxCapacity:0, year:2019, remark:"", active:true },
      { id:"v_c4", biz:"cleaning", kind:"Car", name:"Cleaning Car 4", rego:"JQ04CL", seats:5, paxCapacity:0, year:2022, remark:"", active:true },
      { id:"v_c5", biz:"cleaning", kind:"Van", name:"Cleaning Van 5", rego:"JQ05CL", seats:2, paxCapacity:0, year:2023, remark:"スチーム機", active:true },
      { id:"v_c6", biz:"cleaning", kind:"Car", name:"Cleaning Car 6", rego:"JQ06CL", seats:5, paxCapacity:0, year:2018, remark:"", active:true },
      { id:"v_c7", biz:"cleaning", kind:"Car", name:"Cleaning Car 7", rego:"JQ07CL", seats:5, paxCapacity:0, year:2024, remark:"", active:true },
    ];

    const suppliers = [
      { id:"sp1", biz:"tourism", name:"Down Under Tours", category:"Coach charter" },
      { id:"sp2", biz:"tourism", name:"Queensland Rail", category:"Scenic Rail" },
      { id:"sp3", biz:"tourism", name:"Doki Doki Tours", category:"Activity" },
      { id:"sp4", biz:"tourism", name:"Rainforestation", category:"Attraction" },
      { id:"sp5", biz:"tourism", name:"Skyrail", category:"Attraction" },
      { id:"sp6", biz:"cleaning", name:"Bunnings", category:"用具・消耗品" },
      { id:"sp7", biz:"cleaning", name:"Fuel (Ampol)", category:"ガソリン" },
    ];

    const tariff = [
      { id:"tf1", biz:"tourism", code:"TRF-APT", name:"Airport ⇄ Hotel Transfer", type:"pp", unitPrice:145, payHours:1.5 },
      { id:"tf2", biz:"tourism", code:"KUR-DAY", name:"Kuranda Day Tour", type:"pp", unitPrice:170, payHours:9 },
      { id:"tf3", biz:"tourism", code:"GI-TRF",  name:"Green Island Transfer", type:"pj", unitPrice:982, payHours:6 },
      { id:"tf4", biz:"tourism", code:"GBR-SHT", name:"GBR Pier Shuttle", type:"pp", unitPrice:55, payHours:4 },
      { id:"tf5", biz:"tourism", code:"ATH-DAY", name:"Atherton Tablelands Tour", type:"pp", unitPrice:180, payHours:8 },
      { id:"tf6", biz:"tourism", code:"GUIDE-H", name:"Guide (per hour)", type:"pj", unitPrice:36, payHours:1 },
      { id:"tf10", biz:"cleaning", code:"DOM-2H", name:"Domestic Cleaning 2.0h", type:"pj", unitPrice:116, payHours:2 },
      { id:"tf11", biz:"cleaning", code:"DOM-25", name:"Domestic Cleaning 2.5h", type:"pj", unitPrice:132, payHours:2.5 },
      { id:"tf12", biz:"cleaning", code:"OFFICE", name:"Office Clean (weekly)", type:"pj", unitPrice:223, payHours:2.5 },
      { id:"tf13", biz:"cleaning", code:"BOND",   name:"Bond Clean (one-off)", type:"pj", unitPrice:188, payHours:3 },
    ];

    const customers = [
      // tourism = agents (with AGT CODE etc.)
      { id:"cu1", biz:"tourism",  name:"LAVIE Tourist", code:"LAVIE", kind:"agent", contact:"Okuda", channel:"line", phone:"+81 3 5555 0000", email:"book@lavie.jp", email2:"", fax:"", abn:"", address:"Tokyo, JP", note:"OT26024 Kawai family" },
      { id:"cu2", biz:"tourism",  name:"Pacific CNS", code:"PAC", kind:"agent", contact:"Y. Tanaka", channel:"line", phone:"+61 7 4000 1000", email:"ops@pacificcns.au", email2:"", fax:"07 4000 1001", abn:"39 000 000 001", address:"Cairns QLD", note:"" },
      { id:"cu3", biz:"tourism",  name:"Down Under Tours", code:"DUT", kind:"agent", contact:"Booking desk", channel:"line", phone:"+61 7 4000 2000", email:"res@downundertours.au", email2:"", fax:"", abn:"39 000 000 002", address:"Cairns QLD", note:"Coach charters" },
      { id:"cu4", biz:"tourism",  name:"JTB Cairns", code:"JTB", kind:"agent", contact:"Ops", channel:"line", phone:"+61 7 4000 3000", email:"cns@jtb.au", email2:"", fax:"", abn:"39 000 000 003", address:"Cairns QLD", note:"" },
      { id:"cu5", biz:"tourism",  name:"Australia and Beyond Holidays", code:"AABH", kind:"agent", contact:"Reservations", channel:"line", phone:"0289993860", email:"abko@aabh.com.au", email2:"", fax:"", abn:"41 584 212 385", address:"AU", note:"" },
      { id:"cu6", biz:"tourism",  name:"Yamada", code:"", kind:"private", contact:"Yamada", channel:"line", phone:"+81 80 0000 0000", email:"", note:"" },
      // cleaning = private/commercial clients
      { id:"cu10", biz:"cleaning", name:"Taron Clarke", kind:"private", contact:"Taron Clarke", channel:"wa", phone:"0434033805", suburb:"Mount Sheridan", street:"16 Balsam Green", accessKey:"メーター箱内", note:"細かい方。段差注意。" },
      { id:"cu11", biz:"cleaning", name:"Deb @ Caravonica", kind:"private", contact:"Deb", channel:"wa", phone:"0433 100 101", suburb:"Caravonica", street:"", accessKey:"", note:"床/段差注意。過去クレーム有" },
      { id:"cu12", biz:"cleaning", name:"City Park Gardens", kind:"commercial", contact:"Facilities", channel:"wa", phone:"0433 100 102", suburb:"Cairns City", street:"", accessKey:"", note:"施錠確認" },
      { id:"cu13", biz:"cleaning", name:"Hari Ross", kind:"private", contact:"Hari Ross", channel:"wa", phone:"0433 100 103", suburb:"Bayview Heights", street:"", accessKey:"", note:"Bond clean · 写真報告必須" },
      { id:"cu14", biz:"cleaning", name:"A. Crawford", kind:"private", contact:"A. Crawford", channel:"wa", phone:"0433 100 104", suburb:"Edmonton", street:"", accessKey:"", note:"NEW" },
    ];

    const jobs = [
      mkJob({ id:"j1", biz:"tourism", cls:"transfer", date:"2026-09-23", time:"04:30", durationH:1.5, title:"TRF JQ26 → Hotel", ref:"OT26024", customerId:"cu1", customer:"LAVIE Tourist", pax:2, meta:"Arr JQ26 · Shiho & Yukimi Ms", type:"pp", price:291, cost:120, recurring:false, msg:"line", note:"日本語ガイド希望。空港到着ロビーで KAWAI のボードを持って待機。", staff:"t1", agtCode:"LAVIE", fromLoc:"Cairns Airport", toLoc:"Pacific Hotel CNS", startTime:"04:30", finishTime:"06:00", inf:0, tc:0, vehicleId:"v_p5", supplierId:"" }),
      mkJob({ id:"j2", biz:"tourism", cls:"transfer", date:"2026-09-25", time:"05:10", durationH:1.5, title:"TRF Hotel → QF1963", ref:"OT26024", customerId:"cu1", customer:"LAVIE Tourist", pax:2, meta:"Dep QF1963 0710", type:"pp", price:238, cost:110, recurring:false, msg:"line", note:"出発2.5h前にホテル発。荷物4個。", staff:"t2", agtCode:"LAVIE", fromLoc:"Pacific Hotel CNS", toLoc:"Cairns Airport", startTime:"05:10", finishTime:"06:40", vehicleId:"v_p1" }),
      mkJob({ id:"j3", biz:"tourism", cls:"tour", date:"2026-09-23", time:"07:00", durationH:9, title:"Kuranda Day Tour", ref:"OT26031", customerId:"cu2", customer:"Pacific CNS", pax:4, meta:"Skyrail + Scenic Rail", type:"pp", price:680, cost:240, recurring:false, msg:"line", note:"キュランダ。レインフォレステーション込み。", staff:"t4", agtCode:"PAC", fromLoc:"Cairns", toLoc:"Kuranda", supplierId:"sp2" }),
      mkJob({ id:"j4", biz:"tourism", cls:"tour", date:"2026-09-26", time:"08:30", durationH:6, title:"Green Island Transfer", ref:"OT26033", customerId:"cu3", customer:"Down Under Tours", pax:12, meta:"Coach charter", type:"pj", price:982, cost:380, recurring:false, msg:"line", note:"12名グループ。リーフフリート桟橋へ。", staff:"t7", agtCode:"DUT", vehicleId:"v_p14", supplierId:"sp1" }),
      mkJob({ id:"j5", biz:"tourism", cls:"tour", date:"2026-09-26", time:"06:00", durationH:4, title:"GBR Pier Shuttle", ref:"OT26040", customerId:"cu4", customer:"JTB Cairns", pax:8, meta:"Per-person shuttle", type:"pp", price:440, cost:160, recurring:false, msg:"line", note:"", staff:"t1", agtCode:"JTB", vehicleId:"v_p5" }),

      mkJob({ id:"j10", biz:"cleaning", cls:"clean", date:"2026-09-22", time:"14:15", durationH:2, title:"Domestic Cleaning", ref:"JQ-1163", customerId:"cu10", customer:"Taron Clarke", pax:1, meta:"Balsam Green, Mt Sheridan", type:"pj", price:116, cost:55, recurring:true, recurrence:"隔週", msg:"wa", note:"隔週(Fortnightly) 2.0h。掃除機 → 拭き掃除 → 浴室。鍵はメーター箱内。", staff:"c1", suburb:"Mount Sheridan", street:"16 Balsam Green", accessKey:"メーター箱内", labourHours:2, vehicleId:"v_c1" }),
      mkJob({ id:"j11", biz:"cleaning", cls:"clean", date:"2026-09-24", time:"09:30", durationH:2, title:"Domestic Cleaning", ref:"JQ-1140", customerId:"cu11", customer:"Deb @ Caravonica", pax:1, meta:"Caravonica", type:"pj", price:124, cost:58, recurring:true, recurrence:"隔週", msg:"wa", note:"隔週2.0h。過去にクレーム有 → 段差/床注意。", staff:"c1", suburb:"Caravonica", labourHours:2, vehicleId:"v_c1" }),
      mkJob({ id:"j12", biz:"cleaning", cls:"clean", date:"2026-09-22", time:"10:00", durationH:2.5, title:"Office Clean", ref:"JQ-1188", customerId:"cu12", customer:"City Park Gardens", pax:1, meta:"Cairns City", type:"pj", price:223, cost:95, recurring:true, recurrence:"毎週", msg:"wa", note:"毎週。施錠確認を忘れずに。", staff:"c2", suburb:"Cairns City", labourHours:2.5, vehicleId:"v_c2" }),
      mkJob({ id:"j13", biz:"cleaning", cls:"bond", date:"2026-09-25", time:"08:00", durationH:3, title:"Bond Clean (One-off)", ref:"JQ-1201", customerId:"cu13", customer:"Hari Ross", pax:1, meta:"Bayview Heights", type:"pj", price:188, cost:80, recurring:false, msg:"wa", note:"退去クリーニング。写真報告必須。", staff:"c4", suburb:"Bayview Heights", labourHours:3, vehicleId:"v_c4" }),

      // unassigned pool
      mkJob({ id:"j20", biz:"tourism", cls:"tour", date:"2026-09-24", time:"09:00", durationH:8, title:"Atherton Tablelands Tour", ref:"OT26052", customerId:"cu5", customer:"Australia and Beyond Holidays", pax:3, meta:"NEW from agent email", type:"pp", price:540, cost:200, recurring:false, msg:"line", note:"滝めぐり。日本語ガイド。", staff:null, agtCode:"AABH" }),
      mkJob({ id:"j21", biz:"tourism", cls:"transfer", date:"2026-09-25", time:"05:40", durationH:1.5, title:"TRF Hotel → Airport", ref:"OT26055", customerId:"cu6", customer:"Yamada", pax:2, meta:"NEW · Dep JQ52", type:"pp", price:198, cost:90, recurring:false, msg:"line", note:"", staff:null }),
      mkJob({ id:"j22", biz:"cleaning", cls:"clean", date:"2026-09-24", time:"13:00", durationH:2.5, title:"Domestic Cleaning", ref:"JQ-1212", customerId:"cu14", customer:"A. Crawford", pax:1, meta:"NEW · Edmonton", type:"pj", price:132, cost:60, recurring:true, recurrence:"隔週", msg:"wa", note:"隔週2.5h 希望。新規クライアント。", staff:null, suburb:"Edmonton", labourHours:2.5 }),
    ];

    return {
      staff, vehicles, suppliers, tariff, customers, jobs,
      invoices: [],
      payAdjust: {},   // staffId -> { fuel, equipment, reimbursement }
      seq: { job:100, inv:2944, cust:100, veh:100, sup:100, tf:100 },
      currentBiz: "tourism",
    };
  }

  function mkJob(o) {
    return {
      id:o.id, biz:o.biz, cls:o.cls, date:o.date, time:o.time, durationH:o.durationH||2,
      title:o.title, ref:o.ref, customerId:o.customerId||null, customer:o.customer, pax:o.pax||1,
      meta:o.meta||"", type:o.type||"pj", price:o.price||0, cost:o.cost||0,
      recurring:!!o.recurring, recurrence:o.recurrence||"", msg:o.msg||"line", note:o.note||"",
      assigned:o.staff||null, status:o.staff?"assigned":"unassigned",
      actualStart:null, actualEnd:null, photos:[], completionNote:"", invoiceId:null,
      // tourism extras
      agtCode:o.agtCode||"", fromLoc:o.fromLoc||"", toLoc:o.toLoc||"", startTime:o.startTime||o.time||"",
      finishTime:o.finishTime||"", inf:o.inf||0, tc:o.tc||0, vehicleId:o.vehicleId||null,
      unitPrice:o.unitPrice||0, agtFees:o.agtFees||0, supplierId:o.supplierId||"", infoWage:o.infoWage||0, report:o.report||"",
      // cleaning extras
      suburb:o.suburb||"", street:o.street||"", accessKey:o.accessKey||"", labourHours:o.labourHours||o.durationH||0,
      reminderSent:false,
    };
  }

  // ---------- persistence ----------
  let state = load();
  function load() {
    try { const raw = global.localStorage.getItem(KEY); if (raw) return JSON.parse(raw); } catch (e) {}
    const s = seed(); try { global.localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) {}
    return s;
  }
  function persist() { try { global.localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {} }

  const listeners = new Set();
  function emit() { persist(); listeners.forEach((fn) => { try { fn(); } catch (e) {} }); }

  function autoRef(biz) {
    const n = state.seq.job;
    return biz === "cleaning" ? "JQ-" + (1200 + n) : "OT26" + String(60 + n).padStart(3, "0");
  }

  const Store = {
    TODAY, WEEK, WEEK2, FORTNIGHT, BUSINESSES,
    onChange(fn) { listeners.add(fn); return () => listeners.delete(fn); },
    notify: emit,
    state() { return state; },
    get currentBiz() { return state.currentBiz; },
    setBiz(b) { state.currentBiz = b; emit(); },
    reset() { state = seed(); emit(); },

    // staff
    staff(biz) { return state.staff.filter((s) => !biz || s.biz === biz); },
    staffById(id) { return state.staff.find((s) => s.id === id); },
    addStaff(o) { const id = "s" + (++state.seq.cust); state.staff.push(Object.assign({ id, color:"#64748b", payRate:32, access:["daily","mobile"], active:true }, o)); emit(); return id; },
    updateStaff(id, p) { Object.assign(this.staffById(id) || {}, p); emit(); },
    removeStaff(id) { state.staff = state.staff.filter((s) => s.id !== id); emit(); },

    // vehicles
    vehicles(biz) { return state.vehicles.filter((v) => !biz || v.biz === biz); },
    vehicleById(id) { return state.vehicles.find((v) => v.id === id); },
    addVehicle(o) { const id = "v" + (++state.seq.veh); state.vehicles.push(Object.assign({ id, active:true, kind:"Car", seats:0, paxCapacity:0 }, o)); emit(); return id; },
    updateVehicle(id, p) { Object.assign(this.vehicleById(id) || {}, p); emit(); },
    removeVehicle(id) { state.vehicles = state.vehicles.filter((v) => v.id !== id); emit(); },

    // suppliers
    suppliers(biz) { return state.suppliers.filter((s) => !biz || s.biz === biz); },
    supplierById(id) { return state.suppliers.find((s) => s.id === id); },
    addSupplier(o) { const id = "sp" + (++state.seq.sup); state.suppliers.push(Object.assign({ id }, o)); emit(); return id; },
    supplierPayments(biz, dates) {
      const ds = dates || FORTNIGHT;
      const rows = this.suppliers(biz).map((sp) => {
        const jobs = state.jobs.filter((j) => j.biz === biz && j.supplierId === sp.id && ds.indexOf(j.date) >= 0);
        return { supplier: sp, jobs, total: jobs.reduce((s, j) => s + (Number(j.cost) || 0), 0) };
      });
      return rows.filter((r) => r.jobs.length);
    },

    // tariff
    tariff(biz) { return state.tariff.filter((t) => !biz || t.biz === biz); },
    tariffById(id) { return state.tariff.find((t) => t.id === id); },
    addTariff(o) { const id = "tf" + (++state.seq.tf); state.tariff.push(Object.assign({ id, type:"pj", unitPrice:0, payHours:1 }, o)); emit(); return id; },
    updateTariff(id, p) { Object.assign(this.tariffById(id) || {}, p); emit(); },
    removeTariff(id) { state.tariff = state.tariff.filter((t) => t.id !== id); emit(); },

    // customers
    customers(biz) { return state.customers.filter((c) => !biz || c.biz === biz); },
    customerById(id) { return state.customers.find((c) => c.id === id); },
    addCustomer(o) { const id = "cu" + (++state.seq.cust); state.customers.push(Object.assign({ id, kind:"private", channel: o.biz === "cleaning" ? "wa" : "line" }, o)); emit(); return id; },
    updateCustomer(id, p) { Object.assign(this.customerById(id) || {}, p); emit(); },

    // jobs
    jobs(f) {
      let l = state.jobs.slice();
      if (f && f.biz) l = l.filter((j) => j.biz === f.biz);
      if (f && f.date) l = l.filter((j) => j.date === f.date);
      if (f && f.staff) l = l.filter((j) => j.assigned === f.staff);
      if (f && f.status) l = l.filter((j) => j.status === f.status);
      return l.sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
    },
    jobById(id) { return state.jobs.find((j) => j.id === id); },
    addBooking(o) {
      const id = "j" + (++state.seq.job);
      const biz = o.biz || state.currentBiz;
      const cust = o.customerId ? this.customerById(o.customerId) : null;
      const job = mkJob(Object.assign({}, o, {
        id, biz, cls: o.cls || (biz === "cleaning" ? "clean" : "tour"),
        ref: o.ref || autoRef(biz),
        customer: o.customer || (cust && cust.name) || "—",
        staff: o.assigned || null,
        msg: o.msg || (cust && cust.channel) || (biz === "cleaning" ? "wa" : "line"),
        durationH: Number(o.durationH) || 2, pax: Number(o.pax) || 1,
        price: Number(o.price) || 0, cost: Number(o.cost) || 0,
      }));
      state.jobs.push(job); emit(); return id;
    },
    updateJob(id, p) {
      const j = this.jobById(id); if (!j) return;
      Object.assign(j, p);
      if (p.assigned !== undefined) {
        if (!p.assigned && j.status === "assigned") j.status = "unassigned";
        else if (p.assigned && j.status === "unassigned") j.status = "assigned";
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
    setStatus(id, status, extra) { const j = this.jobById(id); if (!j) return; j.status = status; if (extra) Object.assign(j, extra); emit(); },
    markReminderSent(id) { const j = this.jobById(id); if (j) { j.reminderSent = true; emit(); } },
    removeJob(id) { state.jobs = state.jobs.filter((j) => j.id !== id); emit(); },

    // reminders due (cleaning): jobs 2 days out, not yet reminded
    remindersDue(biz) {
      return state.jobs.filter((j) => j.biz === biz && j.assigned && !j.reminderSent && j.status !== "done")
        .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
    },

    // invoicing
    invoices(biz) { return state.invoices.filter((i) => !biz || i.biz === biz); },
    invoiceById(id) { return state.invoices.find((i) => i.id === id); },
    invoiceableGroups(biz) {
      const done = state.jobs.filter((j) => j.biz === biz && j.status === "done" && !j.invoiceId);
      const map = {};
      done.forEach((j) => { const k = j.customerId || j.customer; (map[k] = map[k] || { customer: j.customer, customerId: j.customerId, jobs: [] }).jobs.push(j); });
      return Object.values(map);
    },
    createInvoice(biz, jobIds, opts) {
      opts = opts || {};
      const jobs = jobIds.map((id) => this.jobById(id)).filter(Boolean);
      if (!jobs.length) return null;
      const subtotal = jobs.reduce((s, j) => s + j.price, 0);
      const gst = Math.round(subtotal * BUSINESSES[biz].gst * 100) / 100;
      const id = "INV-" + (++state.seq.inv);
      const anyRecurring = jobs.some((j) => j.recurring);
      const inv = {
        id, biz, customer: jobs[0].customer, customerId: jobs[0].customerId,
        jobIds: jobs.map((j) => j.id), subtotal, gst, total: Math.round((subtotal + gst) * 100) / 100,
        status: "draft", date: TODAY, xeroSynced: false,
        recurring: opts.recurring != null ? opts.recurring : anyRecurring,
        frequency: opts.frequency || (anyRecurring ? jobs[0].recurrence : ""),
        nextDate: opts.nextDate || "",
      };
      jobs.forEach((j) => { j.invoiceId = id; });
      state.invoices.push(inv); emit(); return id;
    },
    setInvoiceStatus(id, status, patch) { const i = this.invoiceById(id); if (!i) return; i.status = status; if (patch) Object.assign(i, patch); emit(); },
    deleteInvoice(id) { const i = this.invoiceById(id); if (!i) return; i.jobIds.forEach((jid) => { const j = this.jobById(jid); if (j) j.invoiceId = null; }); state.invoices = state.invoices.filter((x) => x.id !== id); emit(); },

    // wage adjustments (fuel / equipment / reimbursement)
    adjust(staffId) { return state.payAdjust[staffId] || { fuel: 0, equipment: 0, reimbursement: 0 }; },
    setAdjust(staffId, patch) { state.payAdjust[staffId] = Object.assign(this.adjust(staffId), patch); emit(); },

    // payroll (default fortnightly per client)
    payroll(biz, dates) {
      const ds = dates || FORTNIGHT;
      return this.staff(biz).map((s) => {
        const jobs = state.jobs.filter((j) => j.assigned === s.id && ds.indexOf(j.date) >= 0);
        const hours = jobs.reduce((sum, j) => sum + (Number(j.durationH) || 0), 0);
        const done = jobs.filter((j) => j.status === "done").length;
        const gross = Math.round(hours * s.payRate * 100) / 100;
        const adj = this.adjust(s.id);
        const extras = (Number(adj.fuel) || 0) + (Number(adj.equipment) || 0) + (Number(adj.reimbursement) || 0);
        return { staff: s, jobs, jobCount: jobs.length, done, hours: Math.round(hours * 10) / 10, rate: s.payRate, gross, adj, extras, net: Math.round((gross + extras) * 100) / 100 };
      });
    },

    // analytics
    analytics(biz, dates) {
      const ds = dates || FORTNIGHT;
      const jobs = state.jobs.filter((j) => j.biz === biz && ds.indexOf(j.date) >= 0 && j.assigned);
      const income = jobs.reduce((s, j) => s + j.price, 0);
      const supplierCost = jobs.reduce((s, j) => s + (Number(j.cost) || 0), 0);
      const wages = this.payroll(biz, ds).reduce((s, r) => s + r.net, 0);
      const cost = supplierCost + wages;
      return { income, supplierCost, wages, cost, profit: income - cost, margin: income ? Math.round(((income - cost) / income) * 100) : 0, jobCount: jobs.length };
    },
  };

  global.Store = Store;
})(window);
