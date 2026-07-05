/* ============================================================
   Accessible tabbed workspace (no framework).
   - Real <section> panels in source order → SEO + no-JS both see all.
   - CSS hides inactive panels only under .js (set synchronously in <head>).
   - Deep-linking: #work / #research / #experience / #about open that tab;
     legacy anchors (#publications, #teaching, #skills…) alias to their tab.
   - Keyboard: ArrowLeft/Right, Home/End (APG tabs pattern).
   ============================================================ */
(function () {
  "use strict";

  var tabs = Array.prototype.slice.call(document.querySelectorAll('[role="tab"]'));
  if (!tabs.length) return;

  // legacy / sub-section anchors → owning tab id
  // (teaching is a real tab since 2026-07-05 — no longer an alias)
  var ALIAS = {
    publications: "research",
    skills: "about", top: "work"
  };

  function panelFor(id) { return document.getElementById(id); }

  function activate(id, opts) {
    opts = opts || {};
    if (!panelFor(id)) return;
    tabs.forEach(function (tab) {
      var target = tab.getAttribute("aria-controls");
      var on = target === id;
      tab.setAttribute("aria-selected", on ? "true" : "false");
      tab.tabIndex = on ? 0 : -1;
      var panel = panelFor(target);
      if (panel) panel.classList.toggle("is-active", on);
    });
    if (opts.focusTab) { document.getElementById("tab-" + id).focus(); }
    if (opts.updateHash) {
      try { history.replaceState(null, "", "#" + id); } catch (e) { /* file:// */ }
    }
  }

  // click → switch (no scroll jump)
  tabs.forEach(function (tab) {
    tab.addEventListener("click", function (e) {
      e.preventDefault();
      activate(tab.getAttribute("aria-controls"), { updateHash: true });
    });
  });

  // keyboard roving
  var tablist = tabs[0].parentNode;
  tablist.addEventListener("keydown", function (e) {
    var i = tabs.indexOf(document.activeElement);
    if (i < 0) return;
    var n = tabs.length, next = null;
    if (e.key === "ArrowRight") next = (i + 1) % n;
    else if (e.key === "ArrowLeft") next = (i - 1 + n) % n;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = n - 1;
    if (next === null) return;
    e.preventDefault();
    activate(tabs[next].getAttribute("aria-controls"), { focusTab: true, updateHash: true });
  });

  // initial state from the URL hash (with aliases), else default = work
  var hash = (location.hash || "").replace(/^#/, "");
  var initial = ALIAS[hash] || (panelFor(hash) ? hash : "work");
  activate(initial);
})();
