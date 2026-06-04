/* ===== Staff mobile view / スタッフ携帯画面 ===== */
(function () {
  "use strict";
  const { $, $$, esc, money, initials, fmtDateLong, toast } = UI;

  let curStaff = null;
  let unsub = null;

  function open() {
    const staff = Store.staff(Store.currentBiz).filter((s) => s.active);
    if (!staff.length) { toast("スタッフがいません", "warn"); return; }
    curStaff = (curStaff && staff.find((s) => s.id === curStaff)) ? curStaff : staff[0].id;
    let ov = $("#mobileOverlay");
    if (!ov) {
      ov = document.createElement("div");
      ov.id = "mobileOverlay";
      ov.className = "overlay";
      document.body.appendChild(ov);
    }
    ov.innerHTML = `
      <div class="phone">
        <button class="close-x" id="mClose">×</button>
        <div class="notch"></div>
        <div class="phone-head">
          <div class="who" id="mWho">—</div>
          <div class="date" id="mDate">—</div>
        </div>
        <div class="phone-body" id="phoneBody"></div>
        <div class="phone-pick"><span>👤</span><select id="mobilePick"></select></div>
      </div>`;
    ov.classList.add("show");
    $("#mobilePick", ov).innerHTML = staff.map((s) => `<option value="${s.id}" ${s.id === curStaff ? "selected" : ""}>${esc(s.name)} — ${esc(s.role)}</option>`).join("");
    $("#mobilePick", ov).addEventListener("change", (e) => { curStaff = e.target.value; paint(); });
    $("#mClose", ov).addEventListener("click", close);
    ov.addEventListener("click", (e) => { if (e.target === ov) close(); });
    if (unsub) unsub();
    unsub = Store.onChange(() => { if (ov.classList.contains("show")) paint(); });
    paint();
  }

  function close() {
    const ov = $("#mobileOverlay");
    if (ov) ov.classList.remove("show");
    if (unsub) { unsub(); unsub = null; }
  }

  function paint() {
    const ov = $("#mobileOverlay"); if (!ov) return;
    const s = Store.staffById(curStaff); if (!s) return;
    const mine = Store.jobs({ staff: curStaff, date: Store.TODAY });
    $("#mWho", ov).textContent = s.name;
    $("#mDate", ov).textContent = `${s.role} · ${fmtDateLong(Store.TODAY)}`;
    const body = $("#phoneBody", ov);
    body.innerHTML = mine.length ? mine.map(cardHTML).join("")
      : `<div class="pool-hint">本日の割当はありません。</div>`;

    $$("[data-mstart]", body).forEach((b) => b.addEventListener("click", () => {
      Store.setStatus(b.dataset.mstart, "in_progress", { actualStart: clock() });
      toast("📍 GPS開始を記録しました");
    }));
    $$("[data-mdone]", body).forEach((b) => b.addEventListener("click", () => {
      const j = Store.jobById(b.dataset.mdone);
      Store.setStatus(j.id, "done", { actualEnd: clock(), actualStart: j.actualStart || j.time });
      toast("✓ 完了。日報・請求へ反映");
    }));
  }

  function cardHTML(j) {
    return `<div class="m-card ${j.cls} ${j.status}">
      <div class="m-banner" style="background-image:url('${UI.imgFor(j)}')"><span class="m-banner-tag">${esc(j.time)}</span></div>
      <div class="m-time">${esc(j.time)} · ${esc(j.ref)} ${UI.statusPill(j.status)}</div>
      <div class="m-title">${esc(j.title)}</div>
      <div class="m-row">👤 ${esc(j.customer)}${j.pax > 1 ? ` (${j.pax} pax)` : ""}</div>
      <div class="m-row">📍 ${esc(j.meta)}</div>
      <div class="m-row">💵 ${money(j.price)} · ${j.type === "pp" ? "Per person" : "Per job"}${j.recurring ? " · 🔁 " + esc(j.recurrence || "Recurring") : ""}</div>
      ${j.note ? `<div class="m-note">📝 ${esc(j.note)}</div>` : ""}
      ${j.actualStart ? `<div class="m-row muted">⏱ 実績 ${esc(j.actualStart)}${j.actualEnd ? "–" + esc(j.actualEnd) : ""}</div>` : ""}
      <div class="m-actions">
        ${j.status !== "done" && j.biz === "cleaning" && j.status !== "in_progress" ? `<button class="m-btn start" data-mstart="${j.id}">▶ GPS開始</button>` : ""}
        ${j.status !== "done" && j.biz !== "cleaning" && j.status !== "in_progress" ? `<button class="m-btn start" data-mstart="${j.id}">▶ 開始</button>` : ""}
        ${j.status !== "done" ? `<button class="m-btn done" data-mdone="${j.id}">✓ 完了</button>` : `<button class="m-btn map">🗺 地図</button>`}
      </div>
    </div>`;
  }

  function clock() { return "10:30"; }

  window.MobileView = { open, close };
})();
