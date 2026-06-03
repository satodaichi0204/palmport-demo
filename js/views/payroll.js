/* ===== Payroll / 給与計算 — fortnightly, +fuel/equipment, payslip ===== */
(function () {
  "use strict";
  const { $, $$, esc, money2, initials, toast, modal, closeModal, fmtDate } = UI;

  window.Views = window.Views || {};
  window.Views.payroll = {
    title: "給与計算",
    render(el) {
      const biz = Store.currentBiz;
      const rows = Store.payroll(biz).filter((r) => r.jobCount > 0 || r.staff.access.indexOf("roster") >= 0);
      const totalGross = rows.reduce((s, r) => s + r.gross, 0);
      const totalExtras = rows.reduce((s, r) => s + r.extras, 0);
      const totalNet = rows.reduce((s, r) => s + r.net, 0);
      const totalHours = rows.reduce((s, r) => s + r.hours, 0);

      el.innerHTML = `
        <div class="page-head">
          <div><h1>給与計算 <span class="muted">/ Payroll</span></h1>
          <p class="muted">ロスター割当 × 時給 ＋ ガソリン/用具/立替。期間: 2週間 (21 Sep–04 Oct 2026)、隔週支払い。</p></div>
          <button class="btn ghost" id="exportPay">⬇ CSV書出 (給与ソフト用)</button>
        </div>

        <section class="kpis">
          ${UI.kpi("総支給(基本) / Gross", money2(totalGross), `${rows.length} 名`, "")}
          ${UI.kpi("手当 / Allowances", money2(totalExtras), "ガソリン+用具+立替", "")}
          ${UI.kpi("支払総額 / Net pay", money2(totalNet), "隔週", "up")}
          ${UI.kpi("総労働時間 / Hours", totalHours.toFixed(1) + "h", "2週間", "")}
        </section>

        <section class="panel">
          <div class="panel-head"><h2>💰 給与明細 (隔週)</h2><span class="muted small">明細・支払いスリップ →</span></div>
          <div class="table-wrap">
            <table class="data">
              <thead><tr><th>スタッフ</th><th class="r">時間</th><th class="r">時給</th><th class="r">基本</th><th class="r">ガソリン</th><th class="r">用具</th><th class="r">立替</th><th class="r">支払額</th><th></th></tr></thead>
              <tbody>${rows.map(payRow).join("") || `<tr><td colspan="9" class="empty">対象の割当がありません。</td></tr>`}</tbody>
              ${rows.length ? `<tfoot><tr><td class="r"><b>合計</b></td><td class="r"><b>${totalHours.toFixed(1)}h</b></td><td></td><td class="r"><b>${money2(totalGross)}</b></td><td colspan="3" class="r">${money2(totalExtras)}</td><td class="r"><b>${money2(totalNet)}</b></td><td></td></tr></tfoot>` : ""}
            </table>
          </div>
          <p class="fineprint">※ 基本 = 時間 × 時給。支払額 = 基本 ＋ 手当。XERO 連携・残業/休憩控除は本番で調整。</p>
        </section>`;

      $$("[data-slip]", el).forEach((b) => b.addEventListener("click", () => slip(b.dataset.slip)));
      $$("[data-adj]", el).forEach((b) => b.addEventListener("click", (e) => { e.stopPropagation(); adjust(b.dataset.adj); }));
      $("#exportPay", el).addEventListener("click", () => exportPay(rows));
    },
  };

  function payRow(r) {
    return `<tr>
      <td><span class="av sm" style="background:${r.staff.color}">${initials(r.staff.name)}</span> ${esc(r.staff.name)}<div class="sub">${esc(r.staff.role)}</div></td>
      <td class="r">${r.hours.toFixed(1)}h</td>
      <td class="r">$${r.rate}</td>
      <td class="r">${money2(r.gross)}</td>
      <td class="r">${money2(r.adj.fuel || 0)}</td>
      <td class="r">${money2(r.adj.equipment || 0)}</td>
      <td class="r">${money2(r.adj.reimbursement || 0)}</td>
      <td class="r"><b>${money2(r.net)}</b></td>
      <td class="actions"><button class="icon" data-adj="${r.staff.id}" title="手当編集">✏️</button><button class="icon" data-slip="${r.staff.id}" title="支払いスリップ">🧾</button></td>
    </tr>`;
  }

  function adjust(staffId) {
    const a = Store.adjust(staffId);
    const s = Store.staffById(staffId);
    modal(`手当の編集 — ${esc(s.name)}`, `
      <form id="af" class="form">
        <div class="row">
          <label>ガソリン代 / Fuel<input name="fuel" type="number" step="0.01" value="${a.fuel || 0}"></label>
          <label>用具代 / Equipment<input name="equipment" type="number" step="0.01" value="${a.equipment || 0}"></label>
        </div>
        <label>立替・その他 / Reimbursement<input name="reimbursement" type="number" step="0.01" value="${a.reimbursement || 0}"></label>
      </form>`, {
      footer: `<button class="btn ghost" data-act="cancel">キャンセル</button><button class="btn primary" data-act="save">保存</button>`,
      onMount(w) {
        $('[data-act="cancel"]', w).addEventListener("click", closeModal);
        $('[data-act="save"]', w).addEventListener("click", () => {
          const f = $("#af", w);
          Store.setAdjust(staffId, { fuel: Number(f.fuel.value) || 0, equipment: Number(f.equipment.value) || 0, reimbursement: Number(f.reimbursement.value) || 0 });
          closeModal(); toast("手当を更新しました ✓");
        });
      },
    });
  }

  function slip(staffId) {
    const r = Store.payroll(Store.currentBiz).find((x) => x.staff.id === staffId);
    if (!r) return;
    modal(`給与支払いスリップ — ${r.staff.name}`, `
      <div class="invoice-doc">
        <div class="inv-top">
          <div><div class="inv-co">WAGE PAYMENT SLIP</div><div class="muted small">Palm Port Pty Ltd · PO Box 6372 Cairns QLD 4870</div></div>
          <div class="r"><div class="muted small">期間 / Period</div><div>21 Sep – 04 Oct 2026</div></div>
        </div>
        <div class="inv-bill"><b>${esc(r.staff.name)}</b> · ${esc(r.staff.role)} · ${esc(r.staff.code || "")}</div>
        <table class="data tight"><thead><tr><th>日付</th><th>ジョブ</th><th class="r">時間</th><th class="r">小計</th></tr></thead>
          <tbody>${r.jobs.map((j) => `<tr><td>${fmtDate(j.date)}</td><td>${esc(j.title)}</td><td class="r">${j.durationH}h</td><td class="r">${money2((Number(j.durationH) || 0) * r.rate)}</td></tr>`).join("") || `<tr><td colspan="4" class="empty">割当なし</td></tr>`}</tbody>
        </table>
        <div class="inv-tot">
          <div><span>基本給 (${r.hours.toFixed(1)}h × $${r.rate})</span><span>${money2(r.gross)}</span></div>
          <div><span>ガソリン代</span><span>${money2(r.adj.fuel || 0)}</span></div>
          <div><span>用具代</span><span>${money2(r.adj.equipment || 0)}</span></div>
          <div><span>立替・その他</span><span>${money2(r.adj.reimbursement || 0)}</span></div>
          <div class="grand"><span>支払総額 / Net pay (AUD)</span><span>${money2(r.net)}</span></div>
        </div>
      </div>`, {
      wide: true,
      footer: `<button class="btn ghost" data-act="close">閉じる</button><button class="btn primary" data-act="print">🖨 印刷</button>`,
      onMount(w) {
        $('[data-act="close"]', w).addEventListener("click", closeModal);
        $('[data-act="print"]', w).addEventListener("click", () => window.print());
      },
    });
  }

  function exportPay(rows) {
    if (!rows.length) { toast("書き出すデータがありません", "warn"); return; }
    const out = [["Staff", "Role", "Hours", "Rate", "Gross", "Fuel", "Equipment", "Reimbursement", "NetPay"]];
    rows.forEach((r) => out.push([r.staff.name, r.staff.role, r.hours, r.rate, r.gross, r.adj.fuel || 0, r.adj.equipment || 0, r.adj.reimbursement || 0, r.net]));
    const csv = out.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = `palmport_payroll_${Store.currentBiz}.csv`; a.click(); toast("給与CSVを書き出しました ⬇");
  }
})();
