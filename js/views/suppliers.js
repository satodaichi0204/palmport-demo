/* ===== Supplier Payment / サプライヤー支払い (DOL SP COST) ===== */
(function () {
  "use strict";
  const { $, $$, esc, money2, fmtDate, toast } = UI;

  window.Views = window.Views || {};
  window.Views.suppliers = {
    title: "サプライヤー支払い",
    render(el) {
      const biz = Store.currentBiz;
      const rows = Store.supplierPayments(biz);
      const grand = rows.reduce((s, r) => s + r.total, 0);
      el.innerHTML = `
        <div class="page-head">
          <div><h1>サプライヤー支払い <span class="muted">/ Supplier Payment</span></h1>
          <p class="muted">各サプライヤーへの支払い額を期間（2週間: 21 Sep–04 Oct）で集計。ジョブのコストから自動計算。</p></div>
          <button class="btn ghost" id="expSup">⬇ CSV書出</button>
        </div>
        <section class="kpis tri">
          ${UI.kpi("支払総額 / Payable", money2(grand), `${rows.length} 社`, "")}
          ${UI.kpi("対象ジョブ / Jobs", rows.reduce((s, r) => s + r.jobs.length, 0), "コスト計上", "")}
          ${UI.kpi("登録サプライヤー / Suppliers", Store.suppliers(biz).length, "", "")}
        </section>
        <section class="panel">
          <div class="panel-head"><h2>📦 サプライヤー別 支払い</h2></div>
          <div class="pad list-gap">
            ${rows.length ? rows.map(groupHTML).join("") : `<div class="pool-hint">この期間のサプライヤー支払いはありません。予約にサプライヤーを設定するとここに集計されます。</div>`}
          </div>
        </section>`;
      $("#expSup", el).addEventListener("click", () => exportCsv(rows));
    },
  };

  function groupHTML(r) {
    return `<div class="inv-group">
      <div class="ig-head"><div><b>${esc(r.supplier.name)}</b> <span class="muted">· ${esc(r.supplier.category || "")}</span></div>
        <div class="ig-amt">支払 <b>${money2(r.total)}</b></div></div>
      <div class="ig-jobs">
        ${r.jobs.map((j) => `<div class="ig-job"><span>${fmtDate(j.date)} · ${esc(j.title)} <span class="mono muted">${esc(j.ref)}</span></span><span>${money2(j.cost)}</span></div>`).join("")}
      </div>
    </div>`;
  }

  function exportCsv(rows) {
    if (!rows.length) { toast("書き出すデータがありません", "warn"); return; }
    const out = [["Supplier", "Category", "Jobs", "PayableAUD"]];
    rows.forEach((r) => out.push([r.supplier.name, r.supplier.category || "", r.jobs.length, r.total]));
    const csv = out.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = `palmport_suppliers_${Store.currentBiz}.csv`; a.click(); toast("CSVを書き出しました ⬇");
  }
})();
