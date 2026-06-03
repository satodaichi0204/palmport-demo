/* ===== Bookings / 予約入力 — the single point of entry ===== */
(function () {
  "use strict";
  const { $, $$, money, esc, fmtDate, statusPill, modal, closeModal, toast, confirmDialog } = UI;

  const CLASSES = {
    tourism:  [["tour", "ツアー Tour"], ["transfer", "送迎 Transfer"]],
    cleaning: [["clean", "清掃 Cleaning"], ["bond", "退去 Bond clean"]],
  };

  window.Views = window.Views || {};
  window.Views.bookings = {
    title: "予約入力",
    render(el) {
      const biz = Store.currentBiz;
      const jobs = Store.jobs({ biz });
      el.innerHTML = `
        <div class="page-head">
          <div><h1>予約 <span class="muted">/ Bookings</span></h1>
          <p class="muted">ここで1回入力すれば、ロスター・日報・請求・給与へ自動で流れます。</p></div>
          <button class="btn primary" id="newBooking">＋ 新規予約 / New booking</button>
        </div>
        <section class="panel">
          <div class="panel-head"><h2>予約一覧</h2><span class="count gray">${jobs.length}</span></div>
          <div class="table-wrap">
            <table class="data">
              <thead><tr><th>日付</th><th>時間</th><th>Ref</th><th>内容</th><th>顧客</th><th>担当</th><th class="r">料金</th><th>状態</th><th></th></tr></thead>
              <tbody>${jobs.map(rowHTML).join("") || `<tr><td colspan="9" class="empty">予約がありません。「新規予約」から追加してください。</td></tr>`}</tbody>
            </table>
          </div>
        </section>`;
      $("#newBooking", el).addEventListener("click", () => openForm(null));
      $$("[data-edit]", el).forEach((b) => b.addEventListener("click", () => openForm(b.dataset.edit)));
      $$("[data-del]", el).forEach((b) => b.addEventListener("click", () => {
        const j = Store.jobById(b.dataset.del);
        confirmDialog(`予約「${j.title} (${j.ref})」を削除しますか？`, () => { Store.removeJob(b.dataset.del); toast("予約を削除しました"); });
      }));
    },
    openForm,
  };

  function rowHTML(j) {
    const st = Store.staffById(j.assigned);
    return `<tr>
      <td>${fmtDate(j.date)}</td><td>${esc(j.time)}</td>
      <td class="mono">${esc(j.ref)}</td>
      <td><b>${esc(j.title)}</b><div class="sub">${esc(j.meta)}</div></td>
      <td>${esc(j.customer)}${j.pax > 1 ? ` <span class="sub">(${j.pax})</span>` : ""}</td>
      <td>${st ? esc(st.name) : `<span class="muted">未割当</span>`}</td>
      <td class="r">${money(j.price)}</td>
      <td>${statusPill(j.status)}${j.invoiceId ? ` <span class="badge xero">🧾</span>` : ""}</td>
      <td class="actions"><button class="icon" data-edit="${j.id}" title="編集">✏️</button><button class="icon" data-del="${j.id}" title="削除">🗑</button></td>
    </tr>`;
  }

  function openForm(id) {
    const biz = Store.currentBiz;
    const j = id ? Store.jobById(id) : null;
    const custs = Store.customers(biz);
    const staff = Store.staff(biz).filter((s) => s.active);
    const vehicles = Store.vehicles(biz).filter((v) => v.active);
    const suppliers = Store.suppliers(biz);
    const tariffs = Store.tariff(biz);
    const classes = CLASSES[biz] || CLASSES.tourism;
    const isClean = biz === "cleaning";

    const f = j || {
      biz, cls: classes[0][0], date: Store.TODAY, time: "09:00", durationH: 2, pax: 1,
      type: isClean ? "pj" : "pp", price: "", cost: "", recurring: isClean, recurrence: "隔週",
      msg: isClean ? "wa" : "line", title: "", meta: "", note: "", ref: "", customerId: "", assigned: "",
      agtCode: "", fromLoc: "", toLoc: "", startTime: "", finishTime: "", inf: 0, tc: 0, vehicleId: "", supplierId: "", agtFees: "",
      suburb: "", street: "", accessKey: "", labourHours: "",
    };

    const tourismFields = `
      <div class="row">
        <label>From<input name="fromLoc" value="${esc(f.fromLoc)}" placeholder="出発地"></label>
        <label>To<input name="toLoc" value="${esc(f.toLoc)}" placeholder="目的地"></label>
      </div>
      <div class="row">
        <label>開始 / Start<input name="startTime" type="time" value="${esc(f.startTime || f.time)}"></label>
        <label>終了 / Finish<input name="finishTime" type="time" value="${esc(f.finishTime)}"></label>
        <label>幼児 / Inf<input name="inf" type="number" min="0" value="${esc(f.inf || 0)}"></label>
        <label>TC<input name="tc" type="number" min="0" value="${esc(f.tc || 0)}"></label>
      </div>
      <div class="row">
        <label>車両 / Vehicle (Coach)
          <select name="vehicleId"><option value="">—</option>${vehicles.map((v) => `<option value="${v.id}" ${f.vehicleId === v.id ? "selected" : ""}>${esc(v.name)} (${esc(v.rego || "")})</option>`).join("")}</select>
        </label>
        <label>サプライヤー / Supplier
          <select name="supplierId"><option value="">—</option>${suppliers.map((s) => `<option value="${s.id}" ${f.supplierId === s.id ? "selected" : ""}>${esc(s.name)}</option>`).join("")}</select>
        </label>
        <label>AGT Fees<input name="agtFees" type="number" step="0.01" value="${esc(f.agtFees || "")}"></label>
      </div>`;

    const cleaningFields = `
      <div class="row">
        <label>Suburb<input name="suburb" value="${esc(f.suburb)}" placeholder="例: Mount Sheridan"></label>
        <label>Street<input name="street" value="${esc(f.street)}" placeholder="番地・通り"></label>
      </div>
      <div class="row">
        <label>鍵・アクセス / Access key<input name="accessKey" value="${esc(f.accessKey)}" placeholder="例: メーター箱内"></label>
        <label>作業時間 / Labour (h)<input name="labourHours" type="number" step="0.5" value="${esc(f.labourHours || f.durationH)}"></label>
        <label>車両 / Vehicle
          <select name="vehicleId"><option value="">—</option>${vehicles.map((v) => `<option value="${v.id}" ${f.vehicleId === v.id ? "selected" : ""}>${esc(v.name)}</option>`).join("")}</select>
        </label>
      </div>`;

    const body = `
      <form id="bf" class="form">
        ${tariffs.length ? `<label>料金マスタから選択 / From tariff (任意)
          <select id="tariffPick"><option value="">— 手入力 / manual —</option>${tariffs.map((t) => `<option value="${t.id}">${esc(t.code)} · ${esc(t.name)} (${t.type === "pp" ? "PP" : "PJ"} $${t.unitPrice})</option>`).join("")}</select></label>` : ""}
        <div class="row">
          <label>種別 / Type<select name="cls">${classes.map(([v, t]) => `<option value="${v}" ${f.cls === v ? "selected" : ""}>${t}</option>`).join("")}</select></label>
          <label>課金 / Billing<select name="type"><option value="pp" ${f.type === "pp" ? "selected" : ""}>Per person 人数</option><option value="pj" ${f.type === "pj" ? "selected" : ""}>Per job 一式</option></select></label>
        </div>
        <label>タイトル / Title<input name="title" value="${esc(f.title)}" placeholder="例: Kuranda Day Tour / Domestic Cleaning" required></label>
        <div class="row">
          <label>顧客 / ${isClean ? "Customer" : "Agent"}
            <select name="customerId"><option value="">— 選択 —</option>${custs.map((c) => `<option value="${c.id}" ${f.customerId === c.id ? "selected" : ""}>${esc(c.name)}${c.code ? " (" + esc(c.code) + ")" : ""}</option>`).join("")}<option value="__new">＋ 新規…</option></select>
          </label>
          <label>${isClean ? "Pax" : "Pax (大人)"}<input name="pax" type="number" min="1" value="${esc(f.pax)}"></label>
        </div>
        <div id="newCustWrap" class="hidden"><label>新規顧客名<input name="newCust" placeholder="顧客名"></label></div>
        <div class="row">
          <label>日付 / Date<input name="date" type="date" value="${esc(f.date)}" required></label>
          <label>時間 / Time<input name="time" type="time" value="${esc(f.time)}" required></label>
          <label>所要(h)<input name="durationH" type="number" step="0.5" min="0.5" value="${esc(f.durationH)}"></label>
        </div>
        <div class="row">
          <label>料金 / Price (AUD)<input name="price" type="number" step="0.01" value="${esc(f.price)}" required></label>
          <label>コスト / Cost (AUD)<input name="cost" type="number" step="0.01" value="${esc(f.cost)}"></label>
        </div>
        ${isClean ? cleaningFields : tourismFields}
        <div class="row">
          <label>担当 / Assign to<select name="assigned"><option value="">— 後で —</option>${staff.map((s) => `<option value="${s.id}" ${f.assigned === s.id ? "selected" : ""}>${esc(s.name)} · ${esc(s.role)}</option>`).join("")}</select></label>
          <label>連絡 / Channel<select name="msg"><option value="line" ${f.msg === "line" ? "selected" : ""}>LINE</option><option value="wa" ${f.msg === "wa" ? "selected" : ""}>WhatsApp</option></select></label>
        </div>
        <div class="row">
          <label class="check"><input type="checkbox" name="recurring" ${f.recurring ? "checked" : ""}> 🔁 繰返し</label>
          <label>頻度 / Recurrence<select name="recurrence">${["毎週", "隔週", "毎月", "不定期"].map((r) => `<option ${f.recurrence === r ? "selected" : ""}>${r}</option>`).join("")}</select></label>
        </div>
        <label>メモ / Notes<textarea name="note" rows="2" placeholder="鍵の場所、注意点、ガイド希望など">${esc(f.note)}</textarea></label>
        <label>補足 / Meta (一覧表示)<input name="meta" value="${esc(f.meta)}"></label>
        <div class="row"><label>参照番号 / Ref<input name="ref" value="${esc(f.ref)}" placeholder="空欄なら自動採番"></label></div>
      </form>`;

    modal(id ? "予約を編集" : "新規予約 / New booking", body, {
      wide: true,
      footer: `<button class="btn ghost" data-act="cancel">キャンセル</button><button class="btn primary" data-act="save">${id ? "更新 / Update" : "登録 / Save"}</button>`,
      onMount(wrap) {
        const form = $("#bf", wrap);
        const custSel = form.customerId;
        const newWrap = $("#newCustWrap", wrap);
        custSel.addEventListener("change", () => newWrap.classList.toggle("hidden", custSel.value !== "__new"));
        const tp = $("#tariffPick", wrap);
        if (tp) tp.addEventListener("change", () => {
          const t = Store.tariffById(tp.value); if (!t) return;
          if (!form.title.value) form.title.value = t.name;
          form.type.value = t.type;
          form.durationH.value = t.payHours;
          form.price.value = t.type === "pp" ? (Number(t.unitPrice) * (Number(form.pax.value) || 1)) : t.unitPrice;
        });
        $('[data-act="cancel"]', wrap).addEventListener("click", closeModal);
        $('[data-act="save"]', wrap).addEventListener("click", () => save(form, id));
      },
    });
  }

  function save(form, id) {
    const data = Object.fromEntries(new FormData(form).entries());
    if (!data.title || !data.date || !data.time) { toast("必須項目を入力してください", "warn"); return; }
    data.recurring = !!form.recurring.checked;

    if (data.customerId === "__new" && data.newCust) {
      data.customerId = Store.addCustomer({ biz: Store.currentBiz, name: data.newCust, kind: Store.currentBiz === "cleaning" ? "private" : "agent" });
    } else if (data.customerId === "__new") { data.customerId = ""; }
    const cust = data.customerId ? Store.customerById(data.customerId) : null;
    data.customer = cust ? cust.name : (data.title || "—");
    if (cust && cust.code) data.agtCode = cust.code;
    data.biz = Store.currentBiz;

    if (id) {
      Store.updateJob(id, data);
      if (data.assigned !== undefined) Store.assign(id, data.assigned || null, data.date);
      toast("予約を更新しました ✓");
    } else {
      Store.addBooking(data);
      toast("予約を登録 → 全ページへ反映しました ✓");
    }
    closeModal();
  }
})();
