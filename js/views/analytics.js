/* ===== Analytics / 経営分析 ===== */
(function () {
  "use strict";
  const { $, esc, money2, kpi } = UI;

  window.Views = window.Views || {};
  window.Views.analytics = {
    title: "経営分析",
    render(el) {
      const t = Store.analytics("tourism");
      const c = Store.analytics("cleaning");
      const totalIncome = t.income + c.income;
      const totalCost = t.cost + c.cost;
      const totalProfit = totalIncome - totalCost;
      const pct = (n) => (totalIncome ? Math.round((n / totalIncome) * 100) : 0);

      el.innerHTML = `
        <div class="page-head">
          <div><h1>経営分析 <span class="muted">/ Analytics</span></h1>
          <p class="muted">2社合算・期間 21 Sep–04 Oct 2026（2週間）。収入 / コスト / 利益 / 各社割合。</p></div>
        </div>

        <section class="kpis">
          ${kpi("総収入 / Income", money2(totalIncome), "2社合算", "")}
          ${kpi("総コスト / Cost", money2(totalCost), "仕入+人件費", "")}
          ${kpi("総利益 / Profit", money2(totalProfit), totalIncome ? Math.round(totalProfit / totalIncome * 100) + "% margin" : "", totalProfit >= 0 ? "up" : "warn")}
          ${kpi("旅行業 割合", pct(t.income) + "%", money2(t.income), "")}
          ${kpi("清掃業 割合", pct(c.income) + "%", money2(c.income), "")}
          ${kpi("ジョブ数 / Jobs", t.jobCount + c.jobCount, `旅行${t.jobCount}・清掃${c.jobCount}`, "")}
        </section>

        <div class="grid-2">
          <section class="panel">
            <div class="panel-head"><h2>📊 収入の構成 (旅行業 vs 清掃業)</h2></div>
            <div class="pad">
              ${bar("旅行業 PDC", t.income, totalIncome, "#0ea5e9")}
              ${bar("清掃業 JQC", c.income, totalIncome, "#10b981")}
            </div>
          </section>
          <section class="panel">
            <div class="panel-head"><h2>💹 事業別 損益</h2></div>
            <div class="table-wrap">
              <table class="data">
                <thead><tr><th>事業</th><th class="r">収入</th><th class="r">仕入コスト</th><th class="r">人件費</th><th class="r">利益</th><th class="r">粗利率</th></tr></thead>
                <tbody>
                  ${plRow("旅行業 PDC", t)}
                  ${plRow("清掃業 JQC", c)}
                </tbody>
                <tfoot><tr><td><b>合計</b></td><td class="r"><b>${money2(totalIncome)}</b></td><td class="r">${money2(t.supplierCost + c.supplierCost)}</td><td class="r">${money2(t.wages + c.wages)}</td><td class="r"><b>${money2(totalProfit)}</b></td><td class="r">${totalIncome ? Math.round(totalProfit / totalIncome * 100) : 0}%</td></tr></tfoot>
              </table>
            </div>
          </section>
        </div>

        <section class="panel">
          <div class="panel-head"><h2>🧱 コスト内訳</h2></div>
          <div class="pad">
            ${bar("仕入 / Supplier cost", t.supplierCost + c.supplierCost, totalCost || 1, "#f59e0b")}
            ${bar("人件費 / Wages", t.wages + c.wages, totalCost || 1, "#6366f1")}
          </div>
          <p class="fineprint">※ 収入=割当済ジョブ料金、仕入=ジョブのコスト、人件費=給与(時間×時給＋手当)。デモ計算。</p>
        </section>`;
    },
  };

  function bar(label, val, total, color) {
    const pc = total ? Math.round((val / total) * 100) : 0;
    return `<div class="abar">
      <div class="abar-top"><span>${esc(label)}</span><span><b>${money2(val)}</b> · ${pc}%</span></div>
      <div class="abar-track"><div class="abar-fill" style="width:${pc}%;background:${color}"></div></div>
    </div>`;
  }
  function plRow(name, a) {
    return `<tr><td>${esc(name)}</td><td class="r">${money2(a.income)}</td><td class="r">${money2(a.supplierCost)}</td><td class="r">${money2(a.wages)}</td><td class="r"><b>${money2(a.profit)}</b></td><td class="r">${a.margin}%</td></tr>`;
  }
})();
