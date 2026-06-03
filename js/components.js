/* =========================================================
   Palm Port — shared helpers & UI components
   ========================================================= */
(function (global) {
  "use strict";

  const $  = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];

  const money = (n) => "$" + Number(n || 0).toLocaleString("en-AU", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  const money2 = (n) => "$" + Number(n || 0).toLocaleString("en-AU", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const initials = (name) =>
    (name || "?").split(/[ .]/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();

  const esc = (s) =>
    String(s == null ? "" : s).replace(/[&<>"']/g, (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const MON = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  function fmtDate(iso) {
    if (!iso) return "—";
    const [y, m, d] = iso.split("-").map(Number);
    const dt = new Date(Date.UTC(y, m - 1, d));
    return `${DOW[dt.getUTCDay()]} ${d} ${MON[m - 1]}`;
  }
  function fmtDateLong(iso) {
    const [y, m, d] = iso.split("-").map(Number);
    const dt = new Date(Date.UTC(y, m - 1, d));
    return `${DOW[dt.getUTCDay()]}, ${d} ${MON[m - 1]} ${y}`;
  }

  function badgeHTML(j) {
    let b = "";
    if (j.recurring) b += `<span class="badge recurring">🔁 ${esc(j.recurrence || "Recurring")}</span>`;
    b += j.type === "pp" ? `<span class="badge pp">Per person</span>` : `<span class="badge pj">Per job</span>`;
    b += j.msg === "wa" ? `<span class="badge wa">WhatsApp</span>` : `<span class="badge line">LINE</span>`;
    return b;
  }

  const STATUS_LABEL = {
    unassigned: "未割当",
    assigned:   "割当済",
    in_progress:"作業中",
    done:       "完了",
  };

  function statusPill(status) {
    return `<span class="status-pill ${status}">${STATUS_LABEL[status] || status}</span>`;
  }

  function jobCardHTML(j, opts) {
    opts = opts || {};
    return `<div class="job ${j.cls}" data-id="${j.id}" ${opts.draggable !== false ? 'draggable="true"' : ""}>
      <div class="j-time">${esc(j.time)} · <span style="opacity:.6">${esc(j.ref)}</span>${opts.showStatus ? " " + statusPill(j.status) : ""}</div>
      <div class="j-title">${esc(j.title)}</div>
      <div class="j-meta">${esc(j.customer)}${j.pax > 1 ? ` (${j.pax} pax)` : ""} — ${esc(j.meta)}</div>
      <div class="badges">${badgeHTML(j)}<span class="badge price">${money(j.price)}</span></div>
    </div>`;
  }

  // ---------- toast ----------
  let toastTimer = null;
  function toast(msg, kind) {
    let el = $("#toast");
    if (!el) { el = document.createElement("div"); el.id = "toast"; document.body.appendChild(el); }
    el.className = "toast show" + (kind ? " " + kind : "");
    el.textContent = msg;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { el.className = "toast"; }, 2600);
  }

  // ---------- modal ----------
  function modal(title, bodyHTML, opts) {
    opts = opts || {};
    closeModal();
    const wrap = document.createElement("div");
    wrap.className = "modal-overlay show";
    wrap.id = "modalOverlay";
    wrap.innerHTML = `
      <div class="modal ${opts.wide ? "wide" : ""}">
        <div class="modal-head">
          <h3>${esc(title)}</h3>
          <button class="modal-x" aria-label="close">×</button>
        </div>
        <div class="modal-body">${bodyHTML}</div>
        ${opts.footer ? `<div class="modal-foot">${opts.footer}</div>` : ""}
      </div>`;
    document.body.appendChild(wrap);
    wrap.addEventListener("click", (e) => { if (e.target === wrap) closeModal(); });
    $(".modal-x", wrap).addEventListener("click", closeModal);
    if (opts.onMount) opts.onMount(wrap);
    return wrap;
  }
  function closeModal() { const m = $("#modalOverlay"); if (m) m.remove(); }

  function confirmDialog(message, onYes) {
    modal("確認 / Confirm",
      `<p style="margin:4px 0 2px">${esc(message)}</p>`,
      { footer: `<button class="btn ghost" data-act="no">キャンセル</button><button class="btn danger" data-act="yes">削除 / Delete</button>`,
        onMount(wrap) {
          $('[data-act="no"]', wrap).addEventListener("click", closeModal);
          $('[data-act="yes"]', wrap).addEventListener("click", () => { closeModal(); onYes && onYes(); });
        } });
  }

  // KPI tile
  function kpi(label, value, delta, cls) {
    return `<div class="kpi"><div class="label">${label}</div>
      <div class="value">${value}</div><div class="delta ${cls || ""}">${delta || ""}</div></div>`;
  }

  global.UI = {
    $, $$, money, money2, initials, esc, fmtDate, fmtDateLong,
    badgeHTML, jobCardHTML, statusPill, STATUS_LABEL, toast, modal, closeModal, confirmDialog, kpi, DOW, MON,
  };
})(window);
