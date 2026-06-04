/* ===== Customers / 顧客・エージェント管理 ===== */
(function () {
  "use strict";
  const { $, $$, esc, money, toast, modal, closeModal } = UI;

  const KIND = { private: "個人", agent: "代理店", commercial: "法人" };

  window.Views = window.Views || {};
  window.Views.customers = {
    title: "顧客",
    render(el) {
      const biz = Store.currentBiz;
      const isTour = biz === "tourism";
      const custs = Store.customers(biz);
      el.innerHTML = `
        <div class="page-head">
          <div><h1>${isTour ? "エージェント / 顧客" : "顧客"} <span class="muted">/ ${isTour ? "Agents" : "Customers"}</span></h1>
          <p class="muted">${isTour ? "旅行代理店・個人。AGT CODE / ABN / FAX / メール。" : "清掃クライアントの連絡先・住所・鍵情報。"}</p></div>
          <button class="btn primary" id="newCust">＋ ${isTour ? "エージェント追加" : "顧客追加"}</button>
        </div>
        <section class="panel">
          <div class="panel-head"><h2>${isTour ? "エージェント一覧" : "顧客一覧"}</h2><span class="count gray">${custs.length}</span></div>
          <div class="table-wrap">
            <table class="data">
              <thead><tr>
                ${isTour ? "<th>CODE</th>" : ""}
                <th>${isTour ? "エージェント名" : "顧客名"}</th><th>区分</th><th>担当/連絡</th>
                ${isTour ? "<th>メール</th><th>ABN</th>" : "<th>住所</th><th>鍵</th>"}
                <th class="r">取引</th><th class="r">売上</th><th></th>
              </tr></thead>
              <tbody>${custs.map((c) => rowHTML(c, isTour)).join("") || `<tr><td colspan="9" class="empty">登録がありません。</td></tr>`}</tbody>
            </table>
          </div>
        </section>`;
      $("#newCust", el).addEventListener("click", () => openForm(null));
      $$("[data-edit]", el).forEach((b) => b.addEventListener("click", () => openForm(b.dataset.edit)));
    },
  };

  function rowHTML(c, isTour) {
    const jobs = Store.jobs({ biz: c.biz }).filter((j) => j.customerId === c.id);
    const revenue = jobs.reduce((s, j) => s + j.price, 0);
    return `<tr>
      ${isTour ? `<td class="mono"><b>${esc(c.code || "")}</b></td>` : ""}
      <td><b>${esc(c.name)}</b>${c.note ? `<div class="sub">${esc(c.note)}</div>` : ""}</td>
      <td><span class="chip-mini">${KIND[c.kind] || c.kind}</span></td>
      <td>${esc(c.contact || "")}<div class="sub">${esc(c.phone || "")} · ${c.channel === "wa" ? "WhatsApp" : "LINE"}</div></td>
      ${isTour
        ? `<td class="sub">${esc(c.email || "")}${c.fax ? `<br>FAX ${esc(c.fax)}` : ""}</td><td class="sub">${esc(c.abn || "")}</td>`
        : `<td class="sub">${esc(c.street || "")}${c.suburb ? `<br>${esc(c.suburb)}` : ""}</td><td class="sub">${esc(c.accessKey || "")}</td>`}
      <td class="r">${jobs.length}</td>
      <td class="r">${money(revenue)}</td>
      <td class="actions"><button class="icon" data-edit="${c.id}" title="編集">✏️</button></td>
    </tr>`;
  }

  function openForm(id) {
    const biz = Store.currentBiz;
    const isTour = biz === "tourism";
    const c = id ? Store.customerById(id) : { name: "", code: "", kind: isTour ? "agent" : "private", contact: "", phone: "", channel: isTour ? "line" : "wa", email: "", email2: "", fax: "", abn: "", address: "", suburb: "", street: "", accessKey: "", note: "" };
    const tourFields = `
      <div class="row">
        <label>AGT CODE<input name="code" value="${esc(c.code || "")}" placeholder="例: AABH"></label>
        <label>ABN<input name="abn" value="${esc(c.abn || "")}"></label>
      </div>
      <div class="row">
        <label>メール / Email<input name="email" type="email" value="${esc(c.email || "")}"></label>
        <label>メール2 / Email 2<input name="email2" type="email" value="${esc(c.email2 || "")}"></label>
      </div>
      <div class="row">
        <label>FAX<input name="fax" value="${esc(c.fax || "")}"></label>
        <label>住所 / Address<input name="address" value="${esc(c.address || "")}"></label>
      </div>`;
    const cleanFields = `
      <div class="row">
        <label>Suburb<input name="suburb" value="${esc(c.suburb || "")}"></label>
        <label>Street<input name="street" value="${esc(c.street || "")}"></label>
      </div>
      <label>鍵・アクセス / Access key<input name="accessKey" value="${esc(c.accessKey || "")}" placeholder="例: メーター箱内"></label>`;
    modal(id ? "編集" : "追加", `
      <form id="cf" class="form">
        <label>${isTour ? "エージェント名 / Name" : "顧客名 / Name"}<input name="name" value="${esc(c.name)}" required></label>
        <div class="row">
          <label>区分 / Kind<select name="kind">${Object.entries(KIND).map(([v, t]) => `<option value="${v}" ${c.kind === v ? "selected" : ""}>${t}</option>`).join("")}</select></label>
          <label>連絡 / Channel<select name="channel"><option value="line" ${c.channel === "line" ? "selected" : ""}>LINE</option><option value="wa" ${c.channel === "wa" ? "selected" : ""}>WhatsApp</option></select></label>
        </div>
        <div class="row">
          <label>担当者 / Contact<input name="contact" value="${esc(c.contact || "")}"></label>
          <label>電話 / Phone<input name="phone" value="${esc(c.phone || "")}"></label>
        </div>
        ${isTour ? tourFields : cleanFields}
        <label>メモ / Notes<textarea name="note" rows="2">${esc(c.note || "")}</textarea></label>
      </form>`, {
      wide: true,
      footer: `<button class="btn ghost" data-act="cancel">キャンセル</button><button class="btn primary" data-act="save">保存</button>`,
      onMount(w) {
        $('[data-act="cancel"]', w).addEventListener("click", closeModal);
        $('[data-act="save"]', w).addEventListener("click", () => {
          const f = $("#cf", w);
          if (!f.name.value) { toast("名称を入力してください", "warn"); return; }
          const data = Object.fromEntries(new FormData(f).entries());
          if (id) Store.updateCustomer(id, data); else Store.addCustomer(Object.assign({ biz }, data));
          closeModal(); toast(id ? "更新しました ✓" : "追加しました ✓");
        });
      },
    });
  }
})();
