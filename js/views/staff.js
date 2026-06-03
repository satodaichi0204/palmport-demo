/* ===== Staff & Access / スタッフ・権限管理 ===== */
(function () {
  "use strict";
  const { $, $$, esc, initials, toast, modal, closeModal, confirmDialog } = UI;

  const ACCESS = [["roster", "ロスター編集"], ["daily", "日報入力"], ["mobile", "携帯画面"], ["invoicing", "請求"], ["payroll", "給与"]];

  window.Views = window.Views || {};
  window.Views.staff = {
    title: "スタッフ・権限",
    render(el) {
      const biz = Store.currentBiz;
      const staff = Store.staff(biz);
      el.innerHTML = `
        <div class="page-head">
          <div><h1>スタッフ・権限 <span class="muted">/ Staff & Access</span></h1>
          <p class="muted">スタッフ、役割、時給、各画面へのアクセス権限を管理。</p></div>
          <button class="btn primary" id="newStaff">＋ スタッフ追加</button>
        </div>
        <section class="panel">
          <div class="panel-head"><h2>${esc(Store.BUSINESSES[biz].short)} スタッフ</h2><span class="count gray">${staff.length}</span></div>
          <div class="table-wrap">
            <table class="data">
              <thead><tr><th>名前</th><th>役割</th><th>連絡先</th><th class="r">時給</th><th>アクセス権限</th><th>状態</th><th></th></tr></thead>
              <tbody>${staff.map(rowHTML).join("") || `<tr><td colspan="7" class="empty">スタッフがいません。</td></tr>`}</tbody>
            </table>
          </div>
        </section>`;

      $("#newStaff", el).addEventListener("click", () => openForm(null));
      $$("[data-edit]", el).forEach((b) => b.addEventListener("click", () => openForm(b.dataset.edit)));
      $$("[data-del]", el).forEach((b) => b.addEventListener("click", () => {
        const s = Store.staffById(b.dataset.del);
        confirmDialog(`${s.name} を削除しますか？`, () => { Store.removeStaff(b.dataset.del); toast("削除しました"); });
      }));
      $$("[data-toggle]", el).forEach((b) => b.addEventListener("click", () => {
        const s = Store.staffById(b.dataset.toggle); Store.updateStaff(s.id, { active: !s.active });
      }));
    },
  };

  function rowHTML(s) {
    return `<tr class="${s.active ? "" : "inactive"}">
      <td><span class="av sm" style="background:${s.color}">${initials(s.name)}</span> <b>${esc(s.name)}</b></td>
      <td>${esc(s.role)}</td>
      <td class="sub">${esc(s.phone || "")}<br>${esc(s.email || "")}</td>
      <td class="r">$${s.payRate}/h</td>
      <td>${(s.access || []).map((a) => `<span class="chip-mini">${accLabel(a)}</span>`).join("") || `<span class="muted small">なし</span>`}</td>
      <td><button class="status-pill ${s.active ? "done" : "unassigned"}" data-toggle="${s.id}">${s.active ? "稼働" : "停止"}</button></td>
      <td class="actions">
        <button class="icon" data-edit="${s.id}" title="編集">✏️</button>
        <button class="icon" data-del="${s.id}" title="削除">🗑</button>
      </td>
    </tr>`;
  }
  const accLabel = (a) => (ACCESS.find((x) => x[0] === a) || [a, a])[1];

  function openForm(id) {
    const s = id ? Store.staffById(id) : { name: "", role: Store.currentBiz === "cleaning" ? "Cleaner" : "Driver", phone: "", email: "", payRate: 32, access: ["daily", "mobile"], active: true, color: "#0ea5e9" };
    modal(id ? "スタッフ編集" : "スタッフ追加", `
      <form id="sf" class="form">
        <div class="row">
          <label>名前 / Name<input name="name" value="${esc(s.name)}" required></label>
          <label>役割 / Role<input name="role" value="${esc(s.role)}"></label>
        </div>
        <div class="row">
          <label>電話 / Phone<input name="phone" value="${esc(s.phone || "")}"></label>
          <label>メール / Email<input name="email" type="email" value="${esc(s.email || "")}"></label>
        </div>
        <div class="row">
          <label>時給 / Rate (AUD/h)<input name="payRate" type="number" step="0.5" value="${esc(s.payRate)}"></label>
          <label>カラー / Color<input name="color" type="color" value="${esc(s.color || "#0ea5e9")}"></label>
        </div>
        <fieldset class="access">
          <legend>アクセス権限 / Access</legend>
          ${ACCESS.map(([v, t]) => `<label class="check"><input type="checkbox" name="acc" value="${v}" ${(s.access || []).indexOf(v) >= 0 ? "checked" : ""}> ${t}</label>`).join("")}
        </fieldset>
      </form>`, {
      wide: true,
      footer: `<button class="btn ghost" data-act="cancel">キャンセル</button><button class="btn primary" data-act="save">保存</button>`,
      onMount(w) {
        $('[data-act="cancel"]', w).addEventListener("click", closeModal);
        $('[data-act="save"]', w).addEventListener("click", () => {
          const form = $("#sf", w);
          if (!form.name.value) { toast("名前を入力してください", "warn"); return; }
          const access = $$('input[name="acc"]:checked', w).map((i) => i.value);
          const data = { name: form.name.value, role: form.role.value, phone: form.phone.value, email: form.email.value, payRate: Number(form.payRate.value) || 0, color: form.color.value, access };
          if (id) Store.updateStaff(id, data);
          else Store.addStaff(Object.assign({ biz: Store.currentBiz, active: true }, data));
          closeModal(); toast(id ? "更新しました ✓" : "スタッフを追加しました ✓");
        });
      },
    });
  }
})();
