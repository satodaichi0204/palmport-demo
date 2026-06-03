/* ===== Vehicle Management / 車両管理 ===== */
(function () {
  "use strict";
  const { $, $$, esc, toast, modal, closeModal, confirmDialog } = UI;

  window.Views = window.Views || {};
  window.Views.vehicles = {
    title: "車両管理",
    render(el) {
      const biz = Store.currentBiz;
      const list = Store.vehicles(biz);
      const totalSeats = list.reduce((s, v) => s + (Number(v.paxCapacity) || 0), 0);
      el.innerHTML = `
        <div class="page-head">
          <div><h1>車両管理 <span class="muted">/ Vehicles</span></h1>
          <p class="muted">${biz === "cleaning" ? "清掃用車両" : "バス・コーチ・車両"}の登録、定員、ロスター割当に使用。</p></div>
          <button class="btn primary" id="newVeh">＋ 車両追加</button>
        </div>
        <section class="kpis tri">
          ${UI.kpi("車両台数 / Fleet", list.length, biz === "cleaning" ? "清掃車両" : "バス・車両", "")}
          ${UI.kpi("総定員 / Pax capacity", totalSeats, "全車合計", "")}
          ${UI.kpi("稼働 / Active", list.filter((v) => v.active).length, "", "up")}
        </section>
        <section class="panel">
          <div class="panel-head"><h2>車両一覧</h2><span class="count gray">${list.length}</span></div>
          <div class="table-wrap">
            <table class="data">
              <thead><tr><th>種別</th><th>名称</th><th>登録番号</th><th class="r">座席</th><th class="r">定員</th><th class="r">年式</th><th>備考</th><th>状態</th><th></th></tr></thead>
              <tbody>${list.map(rowHTML).join("") || `<tr><td colspan="9" class="empty">車両がありません。</td></tr>`}</tbody>
            </table>
          </div>
        </section>`;
      $("#newVeh", el).addEventListener("click", () => openForm(null));
      $$("[data-edit]", el).forEach((b) => b.addEventListener("click", () => openForm(b.dataset.edit)));
      $$("[data-del]", el).forEach((b) => b.addEventListener("click", () => {
        const v = Store.vehicleById(b.dataset.del);
        confirmDialog(`車両「${v.name}」を削除しますか？`, () => { Store.removeVehicle(b.dataset.del); toast("削除しました"); });
      }));
      $$("[data-toggle]", el).forEach((b) => b.addEventListener("click", () => { const v = Store.vehicleById(b.dataset.toggle); Store.updateVehicle(v.id, { active: !v.active }); }));
    },
  };

  function rowHTML(v) {
    return `<tr class="${v.active ? "" : "inactive"}">
      <td><span class="chip-mini">${esc(v.kind)}</span></td>
      <td><b>${esc(v.name)}</b></td>
      <td class="mono">${esc(v.rego || "")}</td>
      <td class="r">${v.seats || "—"}</td>
      <td class="r">${v.paxCapacity || "—"}</td>
      <td class="r">${v.year || "—"}</td>
      <td class="sub">${esc(v.remark || "")}</td>
      <td><button class="status-pill ${v.active ? "done" : "unassigned"}" data-toggle="${v.id}">${v.active ? "稼働" : "停止"}</button></td>
      <td class="actions"><button class="icon" data-edit="${v.id}" title="編集">✏️</button><button class="icon" data-del="${v.id}" title="削除">🗑</button></td>
    </tr>`;
  }

  function openForm(id) {
    const biz = Store.currentBiz;
    const v = id ? Store.vehicleById(id) : { kind: biz === "cleaning" ? "Car" : "Coach", name: "", rego: "", seats: "", paxCapacity: "", year: "", remark: "", active: true };
    modal(id ? "車両を編集" : "車両を追加", `
      <form id="vf" class="form">
        <div class="row">
          <label>種別 / Kind
            <select name="kind">${["Coach","Coaster","Van","Car","Other"].map((k) => `<option ${v.kind === k ? "selected" : ""}>${k}</option>`).join("")}</select>
          </label>
          <label>名称 / Name<input name="name" value="${esc(v.name)}" required></label>
        </div>
        <div class="row">
          <label>登録番号 / Rego<input name="rego" value="${esc(v.rego || "")}"></label>
          <label>年式 / Year<input name="year" type="number" value="${esc(v.year || "")}"></label>
        </div>
        <div class="row">
          <label>座席 / Seats<input name="seats" type="number" value="${esc(v.seats || "")}"></label>
          <label>定員 / Pax capacity<input name="paxCapacity" type="number" value="${esc(v.paxCapacity || "")}"></label>
        </div>
        <label>備考 / Remark<input name="remark" value="${esc(v.remark || "")}"></label>
      </form>`, {
      footer: `<button class="btn ghost" data-act="cancel">キャンセル</button><button class="btn primary" data-act="save">保存</button>`,
      onMount(w) {
        $('[data-act="cancel"]', w).addEventListener("click", closeModal);
        $('[data-act="save"]', w).addEventListener("click", () => {
          const f = $("#vf", w);
          if (!f.name.value) { toast("名称を入力してください", "warn"); return; }
          const data = { kind: f.kind.value, name: f.name.value, rego: f.rego.value, year: Number(f.year.value) || null, seats: Number(f.seats.value) || 0, paxCapacity: Number(f.paxCapacity.value) || 0, remark: f.remark.value };
          if (id) Store.updateVehicle(id, data); else Store.addVehicle(Object.assign({ biz, active: true }, data));
          closeModal(); toast(id ? "更新しました ✓" : "車両を追加しました ✓");
        });
      },
    });
  }
})();
