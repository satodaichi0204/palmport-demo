/* ===== Invoicing / 請求・XERO ===== */
(function () {
  "use strict";
  const { $, $$, esc, money2, fmtDate, toast, modal, closeModal, confirmDialog } = UI;

  window.Views = window.Views || {};
  window.Views.invoicing = {
    title: "請求・XERO",
    render(el) {
      const biz = Store.currentBiz;
      const groups = Store.invoiceableGroups(biz);
      const invoices = Store.invoices(biz);
      const totals = invoices.reduce((a, i) => {
        a.total += i.total; if (i.status === "paid") a.paid += i.total; else a.due += i.total; return a;
      }, { total: 0, paid: 0, due: 0 });

      el.innerHTML = `
        <div class="page-head">
          <div><h1>請求 <span class="muted">/ Invoicing · XERO</span></h1>
          <p class="muted">完了ジョブから請求書を作成 → XERO へ連携。GST 10% 自動計算。</p></div>
          <button class="btn ghost" id="exportCsv">⬇ CSV書出</button>
        </div>

        <section class="kpis tri">
          ${UI.kpi("請求総額 / Invoiced", money2(totals.total), `${invoices.length} 請求書`, "")}
          ${UI.kpi("入金済 / Paid", money2(totals.paid), "", "up")}
          ${UI.kpi("未収 / Due", money2(totals.due), totals.due ? "follow up" : "all clear", totals.due ? "warn" : "up")}
        </section>

        <section class="panel">
          <div class="panel-head"><h2>🧾 請求待ち (完了・未請求)</h2><span class="count">${groups.length}</span></div>
          <div class="pad list-gap">
            ${groups.length ? groups.map(groupHTML).join("")
              : `<div class="pool-hint">請求待ちはありません。<a href="#/daily">日報</a>でジョブを完了登録すると、ここに顧客別で集計されます。</div>`}
          </div>
        </section>

        <section class="panel">
          <div class="panel-head"><h2>📑 請求書一覧</h2><span class="count gray">${invoices.length}</span></div>
          <div class="table-wrap">
            <table class="data">
              <thead><tr><th>請求番号</th><th>顧客</th><th>発行日</th><th class="r">小計</th><th class="r">GST</th><th class="r">合計</th><th>状態</th><th>XERO</th><th></th></tr></thead>
              <tbody>
                ${invoices.length ? invoices.map(invRow).join("")
                  : `<tr><td colspan="9" class="empty">まだ請求書はありません。</td></tr>`}
              </tbody>
            </table>
          </div>
        </section>`;

      $$("[data-mkinv]", el).forEach((b) => b.addEventListener("click", () => {
        const ids = b.dataset.mkinv.split(",");
        const id = Store.createInvoice(Store.currentBiz, ids);
        toast(`請求書 ${id} を作成しました`);
      }));
      $$("[data-view]", el).forEach((b) => b.addEventListener("click", () => viewInvoice(b.dataset.view)));
      $$("[data-xero]", el).forEach((b) => b.addEventListener("click", () => sendToXero(b.dataset.xero)));
      $$("[data-paid]", el).forEach((b) => b.addEventListener("click", () => {
        Store.setInvoiceStatus(b.dataset.paid, "paid"); toast("入金済に更新 ✓");
      }));
      $$("[data-delinv]", el).forEach((b) => b.addEventListener("click", () => {
        confirmDialog(`請求書 ${b.dataset.delinv} を削除しますか？（ジョブは未請求へ戻ります）`,
          () => { Store.deleteInvoice(b.dataset.delinv); toast("請求書を削除しました"); });
      }));
      $("#exportCsv", el).addEventListener("click", () => exportCsv(invoices));
    },
  };

  function groupHTML(g) {
    const subtotal = g.jobs.reduce((s, j) => s + j.price, 0);
    const gst = Math.round(subtotal * 0.1 * 100) / 100;
    return `<div class="inv-group">
      <div class="ig-head">
        <div><b>${esc(g.customer)}</b> <span class="muted">· ${g.jobs.length} 件</span></div>
        <div class="ig-amt">小計 ${money2(subtotal)} ＋GST ${money2(gst)} = <b>${money2(subtotal + gst)}</b></div>
      </div>
      <div class="ig-jobs">
        ${g.jobs.map((j) => `<div class="ig-job"><span>${fmtDate(j.date)} · ${esc(j.title)} <span class="mono muted">${esc(j.ref)}</span></span><span>${money2(j.price)}</span></div>`).join("")}
      </div>
      <button class="btn primary sm" data-mkinv="${g.jobs.map((j) => j.id).join(",")}">🧾 請求書を作成</button>
    </div>`;
  }

  function invRow(i) {
    return `<tr>
      <td class="mono"><b>${esc(i.id)}</b></td>
      <td>${esc(i.customer)}</td>
      <td>${fmtDate(i.date)}</td>
      <td class="r">${money2(i.subtotal)}</td>
      <td class="r">${money2(i.gst)}</td>
      <td class="r"><b>${money2(i.total)}</b></td>
      <td><span class="status-pill inv-${i.status}">${invLabel(i.status)}</span></td>
      <td>${i.xeroSynced ? `<span class="badge xero">✓ XERO</span>` : `<span class="muted small">未連携</span>`}</td>
      <td class="actions">
        <button class="icon" data-view="${i.id}" title="表示">👁</button>
        ${!i.xeroSynced ? `<button class="icon" data-xero="${i.id}" title="XEROへ送信">🔗</button>` : ""}
        ${i.status !== "paid" ? `<button class="icon" data-paid="${i.id}" title="入金済">💰</button>` : ""}
        <button class="icon" data-delinv="${i.id}" title="削除">🗑</button>
      </td>
    </tr>`;
  }

  const invLabel = (s) => ({ draft: "下書き", sent: "送付済", paid: "入金済" }[s] || s);

  function sendToXero(id) {
    const inv = Store.invoiceById(id);
    Store.setInvoiceStatus(id, inv.status === "draft" ? "sent" : inv.status, { xeroSynced: true });
    toast(`${id} を XERO へ連携しました ✓ (デモ)`);
  }

  function viewInvoice(id) {
    const i = Store.invoiceById(id);
    const biz = Store.BUSINESSES[i.biz];
    const jobs = i.jobIds.map((jid) => Store.jobById(jid)).filter(Boolean);
    modal(`請求書 ${i.id}`, `
      <div class="invoice-doc">
        <div class="inv-top">
          <div><div class="inv-co">Palm Port Pty Ltd</div><div class="muted small">${esc(biz.name)} · Cairns QLD · ABN 00 000 000 000</div></div>
          <div class="r"><div class="inv-no">${esc(i.id)}</div><div class="muted small">発行日 ${fmtDate(i.date)}</div></div>
        </div>
        <div class="inv-bill"><span class="muted small">請求先 / Bill to</span><div><b>${esc(i.customer)}</b></div></div>
        <table class="data tight"><thead><tr><th>日付</th><th>内容</th><th class="r">金額</th></tr></thead>
          <tbody>${jobs.map((j) => `<tr><td>${fmtDate(j.date)}</td><td>${esc(j.title)} <span class="muted small">${esc(j.ref)}</span></td><td class="r">${money2(j.price)}</td></tr>`).join("")}</tbody>
        </table>
        <div class="inv-tot">
          <div><span>小計 Subtotal</span><span>${money2(i.subtotal)}</span></div>
          <div><span>GST 10%</span><span>${money2(i.gst)}</span></div>
          <div class="grand"><span>合計 Total (AUD)</span><span>${money2(i.total)}</span></div>
        </div>
        <div class="inv-status">状態: <span class="status-pill inv-${i.status}">${invLabel(i.status)}</span> ${i.xeroSynced ? `· <span class="badge xero">✓ XERO 連携済</span>` : ""}</div>
      </div>`, {
      wide: true,
      footer: `<button class="btn ghost" data-act="close">閉じる</button>
               ${!i.xeroSynced ? `<button class="btn" data-act="xero">🔗 XEROへ送信</button>` : ""}
               ${i.status !== "paid" ? `<button class="btn primary" data-act="paid">💰 入金済にする</button>` : ""}`,
      onMount(w) {
        $('[data-act="close"]', w).addEventListener("click", closeModal);
        const xb = $('[data-act="xero"]', w); if (xb) xb.addEventListener("click", () => { sendToXero(id); closeModal(); });
        const pb = $('[data-act="paid"]', w); if (pb) pb.addEventListener("click", () => { Store.setInvoiceStatus(id, "paid"); closeModal(); toast("入金済に更新 ✓"); });
      },
    });
  }

  function exportCsv(invoices) {
    if (!invoices.length) { toast("書き出す請求書がありません", "warn"); return; }
    const rows = [["InvoiceNo", "Customer", "Date", "Subtotal", "GST", "Total", "Status", "XeroSynced"]];
    invoices.forEach((i) => rows.push([i.id, i.customer, i.date, i.subtotal, i.gst, i.total, i.status, i.xeroSynced]));
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `palmport_invoices_${Store.currentBiz}.csv`;
    a.click();
    toast("CSV を書き出しました ⬇");
  }
})();
