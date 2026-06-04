/* ===== Roster / ロスター — drag & drop assignment, multi-week ===== */
(function () {
  "use strict";
  const { $, $$, esc, initials, jobCardHTML, toast, weekDates, weekLabel, addDays } = UI;

  let _sortables = [];
  let _el = null;
  let weekAnchor = null;

  window.Views = window.Views || {};
  window.Views.roster = {
    title: "ロスター",
    render(el) {
      _el = el;
      const biz = Store.currentBiz;
      weekAnchor = weekAnchor || Store.WEEK[0];
      const week = weekDates(weekAnchor);
      const staff = Store.staff(biz).filter((s) => s.active);
      const pool = Store.jobs({ biz }).filter((j) => !j.assigned);

      el.innerHTML = `
        <div class="page-head">
          <div><h1>ロスター <span class="muted">/ Roster</span></h1>
          <p class="muted">未割当カードをスタッフ×曜日のマスへドラッグ。割当は日報・給与へ即反映。請求済は黄色表示。</p></div>
          <div class="week-nav">
            <button id="wPrev" title="前週">‹</button><span id="wLabel">${weekLabel(week)}</span><button id="wNext" title="翌週">›</button>
            <button class="btn ghost sm" id="wToday">今週</button>
          </div>
        </div>

        <div class="layout-roster">
          <aside class="panel">
            <div class="panel-head"><h2>📥 未割当</h2><span class="count" id="poolCount">${pool.length}</span></div>
            <div class="pool-body" id="poolBody">
              ${pool.length ? pool.map((j) => jobCardHTML(j)).join("")
                : `<div class="pool-hint">✅ 未割当はありません。<br>新規予約はここに入り、<br>ドラッグで割当します。</div>`}
            </div>
          </aside>

          <section class="panel">
            <div class="panel-head"><h2>🗓 週間ロスター</h2><span class="muted small">ドラッグ＆ドロップ / ダブルクリックで編集</span></div>
            <div class="roster-wrap">
              <div class="roster" id="roster" style="grid-template-columns:150px repeat(${week.length}, minmax(150px,1fr));min-width:${150 + week.length * 150}px">
                <div class="r-cell r-corner r-head">Staff \\ Day</div>
                ${week.map((d) => `<div class="r-cell r-head ${d === Store.TODAY ? "today" : ""}">
                    <div>${d.slice(8)} ${UI.MON[Number(d.slice(5,7)) - 1]}</div><div class="dow">${UI.DOW[new Date(d + "T00:00:00Z").getUTCDay()]}</div></div>`).join("")}
                ${staff.map((s) => rosterRow(s, week)).join("")}
              </div>
            </div>
          </section>
        </div>`;

      $("#wPrev", el).addEventListener("click", () => { weekAnchor = addDays(weekAnchor, -7); render(el); });
      $("#wNext", el).addEventListener("click", () => { weekAnchor = addDays(weekAnchor, 7); render(el); });
      $("#wToday", el).addEventListener("click", () => { weekAnchor = Store.WEEK[0]; render(el); });
      bindCards(el);
      initSortable(el);
    },
    destroy() { _sortables.forEach((s) => { try { s.destroy(); } catch (e) {} }); _sortables = []; },
  };

  function render(el) { window.Views.roster.render(el); }

  function rosterRow(s, week) {
    let html = `<div class="r-cell r-staff">
      <div class="av" style="background:${s.color}">${initials(s.name)}</div>
      <div><div class="nm">${esc(s.name)}</div><div class="role">${esc(s.role)}</div></div></div>`;
    week.forEach((d) => {
      const cell = Store.jobs({ biz: Store.currentBiz, staff: s.id, date: d });
      html += `<div class="r-cell r-slot" data-staff="${s.id}" data-day="${d}">
        ${cell.map((j) => jobCardHTML(j)).join("")}</div>`;
    });
    return html;
  }

  function bindCards(el) {
    $$(".job", el).forEach((c) => c.addEventListener("dblclick", () => Views.bookings.openForm(c.dataset.id)));
  }

  function initSortable(el) {
    _sortables.forEach((s) => { try { s.destroy(); } catch (e) {} });
    _sortables = [];
    if (typeof Sortable === "undefined") return;
    const opts = { group: "jobs", animation: 160, ghostClass: "sortable-ghost", chosenClass: "sortable-chosen", forceFallback: true, fallbackOnBody: true, onAdd: onMove, onUpdate: onMove };
    _sortables.push(Sortable.create($("#poolBody", el), opts));
    $$(".r-slot", el).forEach((slot) => _sortables.push(Sortable.create(slot, opts)));
  }

  function onMove(evt) {
    const id = evt.item.dataset.id;
    const dest = evt.to;
    const toPool = dest.id === "poolBody";
    const staffId = toPool ? null : dest.dataset.staff;
    const date = toPool ? null : dest.dataset.day;
    setTimeout(() => {
      Store.assign(id, staffId, date);
      if (toPool) toast("未割当に戻しました");
      else { const s = Store.staffById(staffId); toast(`割当 → ${s ? s.name : ""} ✓ 日報・給与へ反映`); }
    }, 0);
  }
})();
