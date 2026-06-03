/* ===== Daily Report / 日報 — completion feeds invoicing + payroll ===== */
(function () {
  "use strict";
  const { $, $$, esc, money, fmtDateLong, statusPill, initials, toast, modal, closeModal } = UI;

  let selectedDate = null;

  window.Views = window.Views || {};
  window.Views.daily = {
    title: "日報",
    render(el) {
      const biz = Store.currentBiz;
      selectedDate = selectedDate && Store.WEEK.indexOf(selectedDate) >= 0 ? selectedDate : Store.TODAY;
      const jobs = Store.jobs({ biz, date: selectedDate }).filter((j) => j.assigned);
      const done = jobs.filter((j) => j.status === "done").length;
      const revenue = jobs.filter((j) => j.status === "done").reduce((s, j) => s + j.price, 0);

      el.innerHTML = `
        <div class="page-head">
          <div><h1>日報 <span class="muted">/ Daily Report</span></h1>
          <p class="muted">${fmtDateLong(selectedDate)} · 完了登録すると請求・給与へ反映されます。</p></div>
          <div class="seg" id="dayPicker">
            ${Store.WEEK.map((d) => `<button data-d="${d}" class="${d === selectedDate ? "on" : ""}">
              ${d.slice(8)}<small>${UI.DOW[new Date(d + "T00:00:00Z").getUTCDay()]}</small></button>`).join("")}
          </div>
        </div>

        <section class="kpis tri">
          ${UI.kpi("当日ジョブ / Jobs", jobs.length, `${biz === "cleaning" ? "清掃" : "ツアー・送迎"}`, "")}
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

      $$("#dayPicker button", el).forEach((b) => b.addEventListener("click", () => {
        selectedDate = b.dataset.d; this2render(el);
      }));
      $$("[data-start]", el).forEach((b) => b.addEventListener("click", () => {
        const j = Store.jobById(b.dataset.start);
        Store.setStatus(j.id, "in_progress", { actualStart: nowHM() });
        toast(`${j.title} 開始 ▶`);
      }));
      $$("[data-done]", el).forEach((b) => b.addEventListener("click", () => openComplete(b.dataset.done)));
      $$("[data-reopen]", el).forEach((b) => b.addEventListener("click", () => {
        const j = Store.jobById(b.dataset.reopen);
        if (j.invoiceId) { toast("請求済みのため変更できません", "warn"); return; }
        Store.setStatus(j.id, "assigned");
        toast("作業を再オープン");
      }));
    },
  };

  function this2render(el) { window.Views.daily.render(el); }

  function reportCard(j) {
    const s = Store.staffById(j.assigned);
    const invoiced = !!j.invoiceId;
    return `<div class="report-card ${j.cls} ${j.status}">
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
          Store.setStatus(id, "done", {
            actualStart: $("#cStart", w).value, actualEnd: $("#cEnd", w).value,
            completionNote: $("#cNote", w).value, photos,
          });
          closeModal();
          toast("完了 ✓ 請求・給与へ反映されました");
        });
      },
    });
  }

  function nowHM() { return "09:00"; }
  function addH(hm, h) {
    const [H, M] = hm.split(":").map(Number);
    let t = H * 60 + M + Math.round((Number(h) || 0) * 60);
    t = ((t % 1440) + 1440) % 1440;
    return String(Math.floor(t / 60)).padStart(2, "0") + ":" + String(t % 60).padStart(2, "0");
  }
})();
