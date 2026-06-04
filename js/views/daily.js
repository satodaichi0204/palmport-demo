/* ===== Daily Report / 日報 — completion feeds invoicing + payroll ===== */
(function () {
  "use strict";
  const { $, $$, esc, money, fmtDate, fmtDateLong, statusPill, initials, toast, modal, closeModal, weekDates, weekLabel, addDays } = UI;

  let weekAnchor = null;
  let selectedDate = null;
  let _el = null;

  window.Views = window.Views || {};
  window.Views.daily = {
    title: "日報",
    render(el) {
      _el = el;
      const biz = Store.currentBiz;
      weekAnchor = weekAnchor || Store.WEEK[0];
      const week = weekDates(weekAnchor);
      if (!selectedDate || week.indexOf(selectedDate) < 0) selectedDate = week.indexOf(Store.TODAY) >= 0 ? Store.TODAY : week[0];

      const jobs = Store.jobs({ biz, date: selectedDate }).filter((j) => j.assigned);
      const done = jobs.filter((j) => j.status === "done").length;
      const revenue = jobs.filter((j) => j.status === "done").reduce((s, j) => s + j.price, 0);

      el.innerHTML = `
        <div class="page-head">
          <div><h1>日報 <span class="muted">/ Daily Report</span></h1>
          <p class="muted">${fmtDateLong(selectedDate)} · 完了登録すると請求・給与へ反映されます。</p></div>
          <div class="hstack">
            <div class="week-nav"><button id="wPrev" title="前週">‹</button><span>${weekLabel(week)}</span><button id="wNext" title="翌週">›</button></div>
            <button class="btn ghost" id="byGuide">🖨 Daily BY GUIDE</button>
          </div>
        </div>

        <div class="seg" id="dayPicker">
          ${week.map((d) => `<button data-d="${d}" class="${d === selectedDate ? "on" : ""}">
            ${d.slice(8)}<small>${UI.DOW[new Date(d + "T00:00:00Z").getUTCDay()]}</small></button>`).join("")}
        </div>

        <section class="kpis tri" style="margin-top:14px">
          ${UI.kpi("当日ジョブ / Jobs", jobs.length, biz === "cleaning" ? "清掃" : "ツアー・送迎", "")}
          ${UI.kpi("完了 / Completed", `${done}/${jobs.length}`, jobs.length && done === jobs.length ? "全完了 ✓" : "進行中", done === jobs.length && jobs.length ? "up" : "warn")}
          ${UI.kpi("当日売上(完了) / Revenue", money(revenue), "請求対象", "up")}
        </section>

        <section class="panel">
          <div class="panel-head"><h2>📋 当日の作業 — ${fmtDateLong(selectedDate)}</h2></div>
          <div class="pad daily-list">
            ${jobs.length ? jobs.map(reportCard).join("")
              : `<div class="pool-hint">この日の割当ジョブはありません。<a href="#/roster">ロスター</a>で割り当ててください。</div>`}
          </div>
        </section>`;

      $("#wPrev", el).addEventListener("click", () => { weekAnchor = addDays(weekAnchor, -7); selectedDate = null; render(el); });
      $("#wNext", el).addEventListener("click", () => { weekAnchor = addDays(weekAnchor, 7); selectedDate = null; render(el); });
      $("#byGuide", el).addEventListener("click", () => byGuide(selectedDate));
      $$("#dayPicker button", el).forEach((b) => b.addEventListener("click", () => { selectedDate = b.dataset.d; render(el); }));
      $$("[data-start]", el).forEach((b) => b.addEventListener("click", () => {
        const j = Store.jobById(b.dataset.start);
        Store.setStatus(j.id, "in_progress", { actualStart: j.time });
        toast(`${j.title} 開始 ▶`);
      }));
      $$("[data-done]", el).forEach((b) => b.addEventListener("click", () => openComplete(b.dataset.done)));
      $$("[data-reopen]", el).forEach((b) => b.addEventListener("click", () => {
        const j = Store.jobById(b.dataset.reopen);
        if (j.invoiceId) { toast("請求済のため変更できません", "warn"); return; }
        Store.setStatus(j.id, "assigned"); toast("作業を再オープン");
      }));
    },
  };

  function render(el) { window.Views.daily.render(el); }

  function reportCard(j) {
    const s = Store.staffById(j.assigned);
    const invoiced = !!j.invoiceId;
    return `<div class="report-card ${j.cls} ${j.status}">
      <div class="rc-thumb" style="background-image:url('${UI.imgFor(j)}')"></div>
      <div class="rc-left">
        <div class="rc-time">${esc(j.time)}${j.actualStart ? ` <span class="muted">→ 実 ${esc(j.actualStart)}${j.actualEnd ? "–" + esc(j.actualEnd) : ""}</span>` : ""}</div>
        <div class="rc-title">${esc(j.title)} <span class="mono muted">${esc(j.ref)}</span></div>
        <div class="rc-meta">👤 ${esc(j.customer)} · 📍 ${esc(j.meta)} · ${money(j.price)} · ${j.durationH}h</div>
        ${j.note ? `<div class="rc-note">📝 ${esc(j.note)}</div>` : ""}
        ${j.completionNote ? `<div class="rc-note done">✅ ${esc(j.completionNote)}</div>` : ""}
        ${j.photos && j.photos.length ? `<div class="rc-photos">${j.photos.map((p) => `<span class="ph">🖼 ${esc(p)}</span>`).join("")}</div>` : ""}
      </div>
      <div class="rc-right">
        <div class="rc-staff"><span class="av sm" style="background:${s ? s.color : "#888"}">${s ? initials(s.name) : "?"}</span>${s ? esc(s.name) : ""}</div>
        <div class="rc-status">${statusPill(j.status)}${invoiced ? ` <span class="badge wa">🧾 ${esc(j.invoiceId)}</span>` : ""}</div>
        <div class="rc-actions">
          ${j.status === "assigned" ? `<button class="btn sm" data-start="${j.id}">▶ 開始</button>` : ""}
          ${j.status !== "done" ? `<button class="btn sm primary" data-done="${j.id}">✓ 完了登録</button>` : ""}
          ${j.status === "done" && !invoiced ? `<button class="btn sm ghost" data-reopen="${j.id}">↺ 再開</button>` : ""}
        </div>
      </div>
    </div>`;
  }

  function openComplete(id) {
    const j = Store.jobById(id);
    const isClean = j.biz === "cleaning";
    modal("完了登録 / Complete job", `
      <div class="form">
        <p class="muted" style="margin:0 0 6px">${esc(j.title)} · ${esc(j.customer)}</p>
        <div class="row">
          <label>開始 / Start<input type="time" id="cStart" value="${esc(j.actualStart || j.time)}"></label>
          <label>終了 / End<input type="time" id="cEnd" value="${esc(j.actualEnd || addH(j.time, j.durationH))}"></label>
        </div>
        <label>完了メモ / Completion note
          <textarea id="cNote" rows="2" placeholder="${isClean ? "作業内容、追加対応、引継ぎ等" : "ツアー状況、顧客対応、引継ぎ等"}">${esc(j.completionNote || "")}</textarea>
        </label>
        ${isClean ? `<label>写真報告 / Photos (Bond clean 等で必須)
          <input id="cPhotos" placeholder="例: kitchen.jpg, bathroom.jpg (カンマ区切り)" value="${esc((j.photos || []).join(", "))}"></label>` : ""}
      </div>`, {
      footer: `<button class="btn ghost" data-act="cancel">キャンセル</button><button class="btn primary" data-act="ok">✓ 完了 → 請求対象へ</button>`,
      onMount(w) {
        $('[data-act="cancel"]', w).addEventListener("click", closeModal);
        $('[data-act="ok"]', w).addEventListener("click", () => {
          const photos = isClean && $("#cPhotos", w).value
            ? $("#cPhotos", w).value.split(",").map((s) => s.trim()).filter(Boolean) : (j.photos || []);
          Store.setStatus(id, "done", { actualStart: $("#cStart", w).value, actualEnd: $("#cEnd", w).value, completionNote: $("#cNote", w).value, photos });
          closeModal(); toast("完了 ✓ 請求・給与へ反映されました");
        });
      },
    });
  }

  // ----- Daily BY GUIDE printable report -----
  function byGuide(date) {
    const biz = Store.currentBiz;
    const staff = Store.staff(biz).filter((s) => s.active);
    const rows = staff.map((s) => ({ s, jobs: Store.jobs({ biz, staff: s.id, date }) })).filter((r) => r.jobs.length);
    const body = `
      <div class="byguide">
        <div class="bg-head"><div><b>DAILY BY GUIDE</b> — Palm Port (${esc(Store.BUSINESSES[biz].short)})</div><div>${fmtDateLong(date)}</div></div>
        ${rows.length ? rows.map((r) => `
          <div class="bg-staff">${esc(r.s.code || "")} ${esc(r.s.name)} <span class="muted">· ${esc(r.s.role)}</span></div>
          <table class="data tight"><thead><tr>
            <th>AGT</th><th>Tour</th><th>Tour No</th><th>Service</th><th>Start/Finish</th><th>Place</th><th class="r">Pax</th><th class="r">Inf</th><th class="r">TC</th><th>Coach</th><th>Comment</th>
          </tr></thead><tbody>
            ${r.jobs.map((j) => { const v = j.vehicleId ? Store.vehicleById(j.vehicleId) : null; return `<tr>
              <td>${esc(j.agtCode || "")}</td><td>${esc(j.title)}</td><td class="mono">${esc(j.ref)}</td>
              <td>${esc(j.fromLoc || "")}${j.toLoc ? " → " + esc(j.toLoc) : ""}</td>
              <td>${esc(j.startTime || j.time)}${j.finishTime ? "–" + esc(j.finishTime) : ""}</td>
              <td>${esc(j.meta || "")}</td><td class="r">${j.pax}</td><td class="r">${j.inf || 0}</td><td class="r">${j.tc || 0}</td>
              <td>${v ? esc(v.rego || v.name) : ""}</td><td>${esc(j.completionNote || j.note || "")}</td></tr>`; }).join("")}
          </tbody></table>`).join("")
          : `<p class="pool-hint">この日の割当はありません。</p>`}
      </div>`;
    modal("Daily BY GUIDE", body, {
      wide: true,
      footer: `<button class="btn ghost" data-act="close">閉じる</button><button class="btn primary" data-act="print">🖨 印刷</button>`,
      onMount(w) {
        $('[data-act="close"]', w).addEventListener("click", closeModal);
        $('[data-act="print"]', w).addEventListener("click", () => window.print());
      },
    });
  }

  function addH(hm, h) {
    const [H, M] = hm.split(":").map(Number);
    let t = H * 60 + M + Math.round((Number(h) || 0) * 60);
    t = ((t % 1440) + 1440) % 1440;
    return String(Math.floor(t / 60)).padStart(2, "0") + ":" + String(t % 60).padStart(2, "0");
  }
})();
