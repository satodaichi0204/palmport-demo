/* ===== Messaging / 自動連絡 (Confirmation email + WhatsApp reminder) ===== */
(function () {
  "use strict";
  const { $, $$, esc, fmtDate, fmtDateLong, toast, modal, closeModal } = UI;

  window.Views = window.Views || {};
  window.Views.messaging = {
    title: "自動連絡",
    render(el) {
      const biz = Store.currentBiz;
      if (biz === "tourism") renderTourism(el);
      else renderCleaning(el);
    },
  };

  // ---------- Tourism: agent confirmation emails ----------
  function renderTourism(el) {
    const jobs = Store.jobs({ biz: "tourism" });
    el.innerHTML = `
      <div class="page-head">
        <div><h1>自動連絡 <span class="muted">/ Auto Confirmation</span></h1>
        <p class="muted">予約確定 → エージェントへ Confirmation メールを自動生成。内容を確認して送信（デモ）。</p></div>
      </div>
      <section class="panel">
        <div class="panel-head"><h2>✉️ 確認メール (エージェント宛)</h2><span class="count gray">${jobs.length}</span></div>
        <div class="table-wrap"><table class="data">
          <thead><tr><th>Ref</th><th>ツアー</th><th>エージェント</th><th>日付</th><th>Pax</th><th></th></tr></thead>
          <tbody>${jobs.map((j) => {
            const c = j.customerId ? Store.customerById(j.customerId) : null;
            return `<tr><td class="mono">${esc(j.ref)}</td><td>${esc(j.title)}</td><td>${esc(j.customer)}${c && c.code ? ` <span class="muted">(${esc(c.code)})</span>` : ""}</td><td>${fmtDate(j.date)}</td><td>${j.pax}</td>
              <td class="actions"><button class="btn sm" data-conf="${j.id}">✉️ 確認メール</button></td></tr>`;
          }).join("") || `<tr><td colspan="6" class="empty">予約がありません。</td></tr>`}</tbody>
        </table></div>
      </section>`;
    $$("[data-conf]", el).forEach((b) => b.addEventListener("click", () => confirmEmail(b.dataset.conf)));
  }

  function confirmEmail(id) {
    const j = Store.jobById(id);
    const c = j.customerId ? Store.customerById(j.customerId) : null;
    const body =
`${(c && c.contact) || "Reservation Team"} Sama,

Thank you for your booking. I am happy to confirm this as below.

TOUR REF   : ${j.ref}
TOUR NAME  : ${j.title}
AGENT      : ${j.customer}${c && c.code ? " (" + c.code + ")" : ""}
DATE       : ${fmtDateLong(j.date)}
TIME       : ${j.startTime || j.time}${j.finishTime ? " - " + j.finishTime : ""}
PAX        : ${j.pax} pax${j.inf ? " + " + j.inf + " inf" : ""}
ROUTE      : ${j.fromLoc || "-"} → ${j.toLoc || "-"}
PRICE      : $${Number(j.price).toFixed(2)} (inc. GST)

Please confirm above booking by return e-mail.

Best regards,
Palm Port Pty Ltd / Dolphin Tours`;
    modal(`確認メール — ${j.ref}`, `
      <div class="form">
        <label>宛先 / To<input value="${esc((c && c.email) || "agent@example.com")}" readonly></label>
        <label>件名 / Subject<input value="Booking Confirmation ${esc(j.ref)} — ${esc(j.title)}" readonly></label>
        <label>本文 / Body<textarea rows="14" class="mono" style="font-size:12px" readonly>${esc(body)}</textarea></label>
        <p class="fineprint">※ 実際の自動送信にはメール連携（バックエンド）が必要です。ここでは内容生成のデモです。</p>
      </div>`, {
      wide: true,
      footer: `<button class="btn ghost" data-act="close">閉じる</button><button class="btn" data-act="copy">📋 コピー</button><button class="btn primary" data-act="send">✉️ 送信(デモ)</button>`,
      onMount(w) {
        $('[data-act="close"]', w).addEventListener("click", closeModal);
        $('[data-act="copy"]', w).addEventListener("click", () => { copy(body); toast("本文をコピーしました 📋"); });
        $('[data-act="send"]', w).addEventListener("click", () => { closeModal(); toast(`${j.ref} の確認メールを送信しました ✓ (デモ)`); });
      },
    });
  }

  // ---------- Cleaning: WhatsApp reminders ----------
  function renderCleaning(el) {
    const due = Store.remindersDue("cleaning");
    el.innerHTML = `
      <div class="page-head">
        <div><h1>自動連絡 <span class="muted">/ WhatsApp Reminder</span></h1>
        <p class="muted">ジョブ2日前にお客様へ WhatsApp リマインダー（LINE はクライアントが使用不可）。</p></div>
      </div>
      <section class="panel">
        <div class="panel-head"><h2>📲 リマインダー対象</h2><span class="count">${due.filter((j) => !j.reminderSent).length}</span></div>
        <div class="table-wrap"><table class="data">
          <thead><tr><th>日付</th><th>顧客</th><th>住所</th><th>時間</th><th>状態</th><th></th></tr></thead>
          <tbody>${due.map((j) => {
            const c = j.customerId ? Store.customerById(j.customerId) : null;
            return `<tr><td>${fmtDate(j.date)}</td><td><b>${esc(j.customer)}</b></td><td class="sub">${esc(j.suburb || j.meta || "")}</td><td>${esc(j.time)}</td>
              <td>${j.reminderSent ? `<span class="status-pill done">送信済</span>` : `<span class="status-pill assigned">未送信</span>`}</td>
              <td class="actions"><button class="btn sm" data-rem="${j.id}">📲 WhatsApp</button></td></tr>`;
          }).join("") || `<tr><td colspan="6" class="empty">リマインダー対象はありません。</td></tr>`}</tbody>
        </table></div>
      </section>`;
    $$("[data-rem]", el).forEach((b) => b.addEventListener("click", () => reminder(b.dataset.rem)));
  }

  function reminder(id) {
    const j = Store.jobById(id);
    const c = j.customerId ? Store.customerById(j.customerId) : null;
    const name = (c && c.contact) || j.customer;
    const msg =
`Hello ${name},

Just to confirm your house cleaning on ${fmtDate(j.date)} this week.
Estimated arrival time will be ${j.time}.

Thank you.
JQ Cleaning`;
    modal(`WhatsApp リマインダー — ${esc(j.customer)}`, `
      <div class="form">
        <label>宛先 / To (WhatsApp)<input value="${esc((c && c.phone) || "")}" readonly></label>
        <label>メッセージ / Message<textarea rows="8" readonly>${esc(msg)}</textarea></label>
        <p class="fineprint">※ 実際の自動送信には WhatsApp Business API（バックエンド）が必要です。</p>
      </div>`, {
      footer: `<button class="btn ghost" data-act="close">閉じる</button><button class="btn" data-act="copy">📋 コピー</button><button class="btn primary" data-act="send">📲 送信済にする</button>`,
      onMount(w) {
        $('[data-act="close"]', w).addEventListener("click", closeModal);
        $('[data-act="copy"]', w).addEventListener("click", () => { copy(msg); toast("メッセージをコピーしました 📋"); });
        $('[data-act="send"]', w).addEventListener("click", () => { Store.markReminderSent(id); closeModal(); toast("リマインダーを送信済にしました ✓"); });
      },
    });
  }

  function copy(text) { try { navigator.clipboard.writeText(text); } catch (e) {} }
})();
