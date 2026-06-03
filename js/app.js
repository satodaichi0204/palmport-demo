/* =========================================================
   Palm Port — Unified Operations  ·  App bootstrap
   ========================================================= */
(function () {
  "use strict";
  const { $, $$, toast } = UI;

  function setBizUI(biz) {
    document.documentElement.style.setProperty("--biz-accent", Store.BUSINESSES[biz].accent);
    document.documentElement.style.setProperty("--biz-soft", biz === "cleaning" ? "#d1fae5" : "#e0f2fe");
    document.body.dataset.biz = biz;
    $$(".biz-toggle button").forEach((b) => b.classList.toggle("active", b.dataset.biz === biz));
  }

  document.addEventListener("DOMContentLoaded", () => {
    // business toggle
    setBizUI(Store.currentBiz);
    $$(".biz-toggle button").forEach((b) =>
      b.addEventListener("click", () => { Store.setBiz(b.dataset.biz); setBizUI(b.dataset.biz); }));

    // re-sync toggle highlight if biz changes elsewhere
    Store.onChange(() => setBizUI(Store.currentBiz));

    // mobile staff view
    $("#btnMobile").addEventListener("click", () => MobileView.open());

    // reset demo data
    const reset = $("#btnReset");
    if (reset) reset.addEventListener("click", () => {
      UI.confirmDialog("デモデータを初期状態に戻しますか？（入力内容は消えます）", () => {
        Store.reset(); toast("デモデータをリセットしました");
      });
    });

    // sidebar collapse on mobile
    const burger = $("#burger");
    if (burger) burger.addEventListener("click", () => document.body.classList.toggle("nav-open"));
    $$(".nav a[data-route]").forEach((a) => a.addEventListener("click", () => document.body.classList.remove("nav-open")));

    // go!
    Router.start($("#view"));
  });
})();
