/* ===== Customers / 顧客管理 ===== */
(function () {
  "use strict";
  const { $, $$, esc, money, toast, modal, closeModal } = UI;

  const KIND = { private: "個人", agent: "代理店", commercial: "法人" };

  window.Views = window.Views || {};
  window.Views.customers = {
    title: "顧客",
    render(el) {
      const biz = Store.currentBiz;
      const custs = Store.customers(biz);
      el.innerHTML = `
        <div class="page-head">
          <div><h1>顧客 <span class="muted">/ Customers</span></h1>
          <p class="muted">${biz === "cleaning" ? "清掃クライアント" : "旅行代理店・個人"}の連絡先と取引履歴。</p></div>
          <button class="btn primary" id="newCust">＋ 顧客追加</button>
        </div>
        <section class="panel">
          <div class="panel-head"><h2>顧客一覧</h2><span class="count gray">${custs.length}</span></div>
          <div class="table-wrap">
            <table class="data">
              <thead><tr><th>顧客名</th><th>区分</th><th>担当/連絡</th><th>連絡先</th><th class="r">取引</th><th class="r">売上累計</th><th></th></tr></thead>
              <tbody>${custs.map(rowHTML).join("") || `<tr><td colspan="7" class="empty">顧客がいません。</td></tr>`}</tbody>
            </table>
          </div>
        </section>`;

      $("#newCust", el).addEventListener("click", () => openForm(null));
      $$("[data-edit]", el).forEach((b) => b.addEventListener("click", () => openForm(b.dataset.edit)));
    },
  };

  function rowHTML(c) {
    const jobs = Store.jobs({ biz: c.biz }).filter((j) => j.customerId === c.id);
    const revenue = jobs.reduce((s, j) => s + j.price, 0);
    return `<tr>
      <td><b>${esc(c.name)}</b>${c.note ? `<div class="sub">${esc(c.note)}</div>` : ""}</td>
      <td><span class="chip-mini">${KIND[c.kind] || c.kind}</span></td>
      <td>${esc(c.contact || "")}</td>
      <td class="sub">${esc(c.phone || "")} · ${c.channel === "wa" ? "WhatsApp" : "LINE"}</td>
      <td class="r">${jobs.length}</td>
      <td class="r">${money(revenue)}</td>
      <td class="actions"><button class="icon" data-edit="${c.id}" title="編集">✏️</button></td>
    </tr>`;
  }

  function openForm(id) {
    const biz = Store.currentBiz;
    const c = id ? Store.customerById(id) : { name: "", kind: biz === "cleaning" ? "private" : "agent", contact: "", phone: "", channel: biz === "cleaning" ? "wa" : "line", note: "" };
    modal(id ? "顧客を編集" : "顧客を追加", `
      <form id="cf" class="form">
        <label>顧客名 / Name<input name="name" value="${esc(c.name)}" required></label>
        <div class="row">
          <label>区分 / Kind
            <select name="kind">${Object.entries(KIND).map(([v, t]) => `<option value="${v}" ${c.kind === v ? "selected" : ""}>${t}</option>`).join("")}</select>
          </label>
          <label>連絡 / Channel
            <select name="channel"><option value="line" ${c.channel === "line" ? "selected" : ""}>LINE</option><option value="wa" ${c.channel === "wa" ? "selected" : ""}>WhatsApp</option></select>
          </label>
        </div>
        <div class="row">
          <label>担当者 / Contact<input name="contact" value="${esc(c.contact || "")}"></label>
          <label>電話 / Phone<input name="phone" value="${esc(c.phone || "")}"></label>
        </div>
        <label>メモ / Notes<textarea name="note" rows="2">${esc(c.note || "")}</textarea></label>
      </form>`, {
      footer: `<button class="btn ghost" data-act="cancel">キャンセル</button><button class="btn primary" data-act="save">保存</button>`,
      onMount(w) {
        $('[data-act="cancel"]', w).addEventListener("click", closeModal);
        $('[data-act="save"]', w).addEventListener("click", () => {
          const form = $("#cf", w);
          if (!form.name.value) { toast("顧客名を入力してください", "warn"); return; }
          const data = { name: form.name.value, kind: form.kind.value, channel: form.channel.value, contact: form.contact.value, phone: form.phone.value, note: form.note.value };
          if (id) Store.updateCustomer(id, data);
          else Store.addCustomer(Object.assign({ biz }, data));
          closeModal(); toast(id ? "更新しました ✓" : "顧客を追加しました ✓");
        });
      },
    });
  }
})();
