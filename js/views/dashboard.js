/* ===== Dashboard / ダッシュボード ===== */
(function () {
  "use strict";
  const { $, money, kpi, jobCardHTML, fmtDateLong, esc } = UI;

  window.Views = window.Views || {};
  window.Views.dashboard = {
    title: "ダッシュボード",
    render(el) {
      const biz = Store.currentBiz;
      const all = Store.jobs({ biz });
      const assigned = all.filter((j) => j.assigned);
      const income = assigned.reduce((s, j) => s + j.price, 0);
      const cost = assigned.reduce((s, j) => s + j.cost, 0);
      const margin = income ? Math.round(((income - cost) / income) * 100) : 0;
      const unassigned = all.filter((j) => !j.assigned).length;
      const done = all.filter((j) => j.status === "done").length;
      const today = Store.jobs({ biz, date: Store.TODAY });
      const invoices = Store.invoices(biz);
      const outstanding = invoices.filter((i) => i.status !== "paid").reduce((s, i) => s + i.total, 0);

      el.innerHTML = `
        <div class="page-head">
          <div><h1>ダッシュボード <span class="muted">/ Dashboard</span></h1>
          <p class="muted">${esc(Store.BUSINESSES[biz].name)} · 週 21–27 Sep 2026 · Cairns QLD</p></div>
        </div>

        <section class="kpis">
          ${kpi("今週の売上 / Income", money(income), "↑ vs last wk", "up")}
          ${kpi("コスト / Cost", money(cost), "wages + fuel", "")}
          ${kpi("粗利率 / Margin", margin + "%", "auto-calculated", "up")}
          ${kpi("確定ジョブ / Jobs", assigned.length, `${done} 完了`, "")}
          ${kpi("未割当 / Unassigned", unassigned, unassigned ? "ロスターへ →" : "all assigned ✓", unassigned ? "warn" : "up")}
          ${kpi("未収金 / Outstanding", money(outstanding), `${invoices.length} 請求書`, outstanding ? "warn" : "up")}
        </section>

        <div class="enter-once">
          <div class="title">⚡ 1回入力 → 自動反映</div>
          <div class="flow" id="flow">
            <a class="chip" href="#/bookings">📥 予約入力</a><span class="arrow">→</span>
            <a class="chip" href="#/roster">🗓 ロスター</a><span class="arrow">→</span>
            <a class="chip" href="#/daily">📋 日報 Daily</a><span class="arrow">→</span>
            <a class="chip" href="#/invoicing">🧾 請求 / XERO</a><span class="arrow">→</span>
            <a class="chip" href="#/payroll">💰 給与計算</a>
          </div>
        </div>

        <div class="grid-2">
          <section class="panel">
            <div class="panel-head"><h2>📅 本日のジョブ — ${fmtDateLong(Store.TODAY)}</h2>
              <span class="count gray">${today.length}</span></div>
            <div class="pad list-gap" id="todayList">
              ${today.length ? today.map((j) => jobCardHTML(j, { showStatus: true, draggable: false })).join("")
                : `<div class="pool-hint">本日のジョブはありません。</div>`}
            </div>
          </section>

          <section class="panel">
            <div class="panel-head"><h2>📥 未割当の予約</h2><span class="count">${unassigned}</span></div>
            <div class="pad list-gap">
              ${unassigned ? all.filter((j) => !j.assigned).map((j) => jobCardHTML(j, { draggable: false })).join("")
                : `<div class="pool-hint">✅ 未割当のジョブはありません。</div>`}
              ${unassigned ? `<a class="btn primary block" href="#/roster">🗓 ロスターで割り当てる</a>` : ""}
            </div>
          </section>
        </div>`;

      $("#todayList", el) && $$jobsClick(el);
    },
  };

  function $$jobsClick(el) {
    el.querySelectorAll(".job").forEach((c) =>
      c.addEventListener("click", () => location.hash = "#/daily"));
  }
})();
