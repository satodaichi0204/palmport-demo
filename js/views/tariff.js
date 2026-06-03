/* ===== Job Details / 料金マスタ (Tariff) ===== */
(function () {
  "use strict";
  const { $, $$, esc, money2, toast, modal, closeModal, confirmDialog } = UI;

  window.Views = window.Views || {};
  window.Views.tariff = {
    title: "料金マスタ",
    render(el) {
      const biz = Store.currentBiz;
      const list = Store.tariff(biz);
      el.innerHTML = `
        <div class="page-head">
          <div><h1>ジョブ料金マスタ <span class="muted">/ Job Details · Tariff</span></h1>
          <p class="muted">ジョブ種類ごとの料金（Per person / Per job）とスタッフ支払い時間数。予約入力時に参照。</p></div>
          <button class="btn primary" id="newTf">＋ 料金を追加</button>
        </div>
        <section class="panel">
          <div class="panel-head"><h2>料金表</h2><span class="count gray">${list.length}</span></div>
          <div class="table-wrap">
            <table class="data">
              <thead><tr><th>コード</th><th>内容</th><th>課金</th><th class="r">単価 (AUD)</th><th class="r">支払時間</th><th></th></tr></thead>
              <tbody>${list.map(rowHTML).join("") || `<tr><td colspan="6" class="empty">料金がありません。</td></tr>`}</tbody>
            </table>
          </div>
          <p class="fineprint">※ Per person = 単価 × 人数、Per job = 一式。支払時間はスタッフ給与計算（時間 × 時給）の基準。</p>
        </section>`;
      $("#newTf", el).addEventListener("click", () => openForm(null));
      $$("[data-edit]", el).forEach((b) => b.addEventListener("click", () => openForm(b.dataset.edit)));
      $$("[data-del]", el).forEach((b) => b.addEventListener("click", () => {
        const t = Store.tariffById(b.dataset.del);
        confirmDialog(`料金「${t.name}」を削除しますか？`, () => { Store.removeTariff(b.dataset.del); toast("削除しました"); });
      }));
    },
  };

  function rowHTML(t) {
    return `<tr>
      <td class="mono"><b>${esc(t.code)}</b></td>
      <td>${esc(t.name)}</td>
      <td><span class="badge ${t.type}">${t.type === "pp" ? "Per person" : "Per job"}</span></td>
      <td class="r">${money2(t.unitPrice)}</td>
      <td class="r">${t.payHours}h</td>
      <td class="actions"><button class="icon" data-edit="${t.id}" title="編集">✏️</button><button class="icon" data-del="${t.id}" title="削除">🗑</button></td>
    </tr>`;
  }

  function openForm(id) {
    const biz = Store.currentBiz;
    const t = id ? Store.tariffById(id) : { code: "", name: "", type: biz === "cleaning" ? "pj" : "pp", unitPrice: "", payHours: 2 };
    modal(id ? "料金を編集" : "料金を追加", `
      <form id="tf" class="form">
        <div class="row">
          <label>コード / Code<input name="code" value="${esc(t.code)}" placeholder="例: KUR-DAY"></label>
          <label>課金 / Billing
            <select name="type"><option value="pp" ${t.type === "pp" ? "selected" : ""}>Per person</option><option value="pj" ${t.type === "pj" ? "selected" : ""}>Per job</option></select>
          </label>
        </div>
        <label>内容 / Name<input name="name" value="${esc(t.name)}" required></label>
        <div class="row">
          <label>単価 / Unit price (AUD)<input name="unitPrice" type="number" step="0.01" value="${esc(t.unitPrice)}" required></label>
          <label>支払時間 / Pay hours<input name="payHours" type="number" step="0.5" value="${esc(t.payHours)}"></label>
        </div>
      </form>`, {
      footer: `<button class="btn ghost" data-act="cancel">キャンセル</button><button class="btn primary" data-act="save">保存</button>`,
      onMount(w) {
        $('[data-act="cancel"]', w).addEventListener("click", closeModal);
        $('[data-act="save"]', w).addEventListener("click", () => {
          const f = $("#tf", w);
          if (!f.name.value) { toast("内容を入力してください", "warn"); return; }
          const data = { code: f.code.value, name: f.name.value, type: f.type.value, unitPrice: Number(f.unitPrice.value) || 0, payHours: Number(f.payHours.value) || 0 };
          if (id) Store.updateTariff(id, data); else Store.addTariff(Object.assign({ biz }, data));
          closeModal(); toast(id ? "更新しました ✓" : "料金を追加しました ✓");
        });
      },
    });
  }
})();
