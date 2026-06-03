/* ===== Payroll / 給与計算 — derived from roster + daily ===== */
(function () {
  "use strict";
  const { $, $$, esc, money2, initials, toast, modal, closeModal } = UI;

  window.Views = window.Views || {};
  window.Views.payroll = {
    title: "給与計算",
    render(el) {
      const biz = Store.currentBiz;
      const rows = Store.payroll(biz).filter((r) => r.jobCount > 0 || r.staff.access.indexOf("roster") >= 0);
      const totalGross = rows.reduce((s, r) => s + r.gross, 0);
      const totalHours = rows.reduce((s, r) => s + r.hours, 0);
      const totalJobs = rows.reduce((s, r) => s + r.jobCount, 0);

      el.innerHTML = `
        <div class="page-head">
          <div><h1>給与計算 <span class="muted">/ Payroll</span></h1>
          <p class="muted">ロスター割当 × 時給から自動計算。期間: 21–27 Sep 2026（週次）。</p></div>
          <button class="btn ghost" id="exportPay">⬇ CSV書出 (給与ソフト用)</button>
        </div>

        <section class="kpis tri">
          ${UI.kpi("総支給 / Gross", money2(totalGross), `${rows.length} 名`, "")}
          ${UI.kpi("総労働時間 / Hours", totalHours.toFixed(1) + "h", "今週", "")}
          ${UI.kpi("対象ジョブ / Jobs", totalJobs, "割当済", "")}
        </section>

        <section class="panel">
          <div class="panel-head"><h2>💰 週次給与明細</h2><span class="muted small">クリックで内訳</span></div>
          <div class="table-wrap">
            <table class="data">
              <thead><tr><th>スタッフ</th><th>役割</th><th class="r">ジョブ</th><th class="r">完了</th><th class="r">時間</th><th class="r">時給</th><th class="r">総支給(AUD)</th><th></th></tr></thead>
              <tbody>
                ${rows.map(payRow).join("") || `<tr><td colspan="8" class="empty">今週の割当がありません。</td></tr>`}
              </tbody>
              ${rows.length ? `<tfoot><tr><td colspan="4"></td><td class="r"><b>${totalHours.toFixed(1)}h</b></td><td></td><td class="r"><b>${money2(totalGross)}</b></td><td></td></tr></tfoot>` : ""}
            </table>
          </div>
          <p class="fineprint">※ 時間 = 各ジョブの所要時間の合計。総支給 = 時間 × 時給（デモ計算。手当・残業・休憩控除は本番で調整）。</p>
        </section>`;

      $$("[data-pay]", el).forEach((b) => b.addEventListener("click", () => detail(b.dataset.pay)));
      $("#exportPay", el).addEventListener("click", () => exportPay(rows));
    },
  };

  function payRow(r) {
    return `<tr class="clickable" data-pay="${r.staff.id}">
      <td><span class="av sm" style="background:${r.staff.color}">${initials(r.staff.name)}</span> ${esc(r.staff.name)}</td>
      <td class="muted">${esc(r.staff.role)}</td>
      <td class="r">${r.jobCount}</td>
      <td class="r">${r.done}</td>
      <td class="r">${r.hours.toFixed(1)}h</td>
      <td class="r">$${r.rate}/h</td>
      <td class="r"><b>${money2(r.gross)}</b></td>
      <td class="actions"><button class="icon" data-pay="${r.staff.id}" title="内訳">📄</button></td>
    </tr>`;
  }

  function detail(staffId) {
    const r = Store.payroll(Store.currentBiz).find((x) => x.staff.id === staffId);
    if (!r) return;
    modal(`給与内訳 — ${r.staff.name}`, `
      <p class="muted" style="margin:0 0 8px">${esc(r.staff.role)} · $${r.rate}/h · 期間 21–27 Sep 2026</p>
      <table class="data tight"><thead><tr><th>日付</th><th>ジョブ</th><th class="r">時間</th><th class="r">小計</th></tr></thead>
        <tbody>${r.jobs.map((j) => `<tr><td>${UI.fmtDate(j.date)}</td><td>${esc(j.title)} ${UI.statusPill(j.status)}</td><td class="r">${j.durationH}h</td><td class="r">${money2((Number(j.durationH) || 0) * r.rate)}</td></tr>`).join("") || `<tr><td colspan="4" class="empty">割当なし</td></tr>`}</tbody>
        <tfoot><tr><td colspan="2"></td><td class="r"><b>${r.hours.toFixed(1)}h</b></td><td class="r"><b>${money2(r.gross)}</b></td></tr></tfoot>
      </table>`, {
      footer: `<button class="btn ghost" data-act="close">閉じる</button>`,
      onMount(w) { $('[data-act="close"]', w).addEventListener("click", closeModal); },
    });
  }

  function exportPay(rows) {
    if (!rows.length) { toast("書き出すデータがありません", "warn"); return; }
    const out = [["Staff", "Role", "Jobs", "Completed", "Hours", "Rate", "Gross"]];
    rows.forEach((r) => out.push([r.staff.name, r.staff.role, r.jobCount, r.done, r.hours, r.rate, r.gross]));
    const csv = out.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `palmport_payroll_${Store.currentBiz}.csv`;
    a.click();
    toast("給与CSVを書き出しました ⬇");
  }
})();
