/* ===== Hash router — maps #/route to a view, re-renders on store change ===== */
(function (global) {
  "use strict";

  const ROUTES = ["dashboard", "bookings", "roster", "daily", "invoicing", "payroll", "staff", "customers"];
  const DEFAULT = "dashboard";

  let current = null;
  let mountEl = null;

  function parse() {
    const h = (location.hash || "").replace(/^#\/?/, "").split("/")[0];
    return ROUTES.indexOf(h) >= 0 ? h : DEFAULT;
  }

  function render() {
    const name = parse();
    const view = (global.Views || {})[name];
    if (!view || !mountEl) return;
    // tear down previous view (e.g. roster's SortableJS instances)
    if (current && current !== name) {
      const prev = (global.Views || {})[current];
      if (prev && prev.destroy) try { prev.destroy(); } catch (e) {}
    }
    current = name;
    mountEl.scrollTop = 0;
    view.render(mountEl);
    highlightNav(name);
  }

  function highlightNav(name) {
    document.querySelectorAll(".nav a[data-route]").forEach((a) =>
      a.classList.toggle("active", a.dataset.route === name));
    const titleEl = document.getElementById("crumb");
    if (titleEl && global.Views[name]) titleEl.textContent = global.Views[name].title;
  }

  const Router = {
    start(el) {
      mountEl = el;
      window.addEventListener("hashchange", render);
      // re-render the active view whenever shared data changes
      Store.onChange(() => render());
      if (!location.hash) location.hash = "#/" + DEFAULT;
      render();
    },
    go(name) { location.hash = "#/" + name; },
    current() { return current; },
  };

  global.Router = Router;
})(window);
