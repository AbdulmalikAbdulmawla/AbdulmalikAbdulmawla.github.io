/* ============================================================
   Motion toggle — user control over the site's animations.
   The inline <head> script resolves the initial state onto
   <html> as `motion-on` / `motion-off`: a stored per-device
   choice (localStorage "motion") wins, else the OS
   prefers-reduced-motion preference. This module injects a
   pause/play button beside the language toggle in the sticky
   tab bar (the pause control stays reachable while content
   moves — WCAG 2.2.2), flips the class pair, persists the
   choice, and broadcasts `motionchange`; boids.js and
   card-art.js listen. The icon follows the html class via CSS,
   so the button only maintains aria-pressed (true = running).
   aria-label "Animation" is the same word in EN and DE — no
   i18n keys needed. With JS off the button never exists and
   the reduced-motion media query is the fallback. No deps.
   ============================================================ */
(function () {
  "use strict";

  var root = document.documentElement;
  var lang = document.getElementById("lang-toggle");
  if (!lang || !lang.parentNode) return;

  var btn = document.createElement("button");
  btn.type = "button";
  btn.id = "motion-toggle";
  btn.className = "lang-toggle motion-toggle";
  btn.setAttribute("aria-label", "Animation");
  btn.title = "Animation";
  btn.innerHTML =
    '<svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">' +
    '<g class="mi-pause"><rect x="3" y="2.5" width="3.6" height="11" rx="1"/>' +
    '<rect x="9.4" y="2.5" width="3.6" height="11" rx="1"/></g>' +
    '<path class="mi-play" d="M4.5 2.5 L13.5 8 L4.5 13.5 Z"/></svg>';
  lang.parentNode.insertBefore(btn, lang);

  function isOn() { return !root.classList.contains("motion-off"); }
  function reflect() { btn.setAttribute("aria-pressed", isOn() ? "true" : "false"); }

  function set(on, persist) {
    root.classList.toggle("motion-off", !on);
    root.classList.toggle("motion-on", on);
    reflect();
    if (persist) { try { localStorage.setItem("motion", on ? "on" : "off"); } catch (e) {} }
    window.dispatchEvent(new CustomEvent("motionchange", { detail: { on: on } }));
  }

  btn.addEventListener("click", function () { set(!isOn(), true); });

  // no stored choice → keep following the OS preference live
  if (window.matchMedia) {
    var mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    var onChange = function (e) {
      var stored = null;
      try { stored = localStorage.getItem("motion"); } catch (err) {}
      if (stored !== "on" && stored !== "off") set(!e.matches, false);
    };
    if (mq.addEventListener) mq.addEventListener("change", onChange);
    else if (mq.addListener) mq.addListener(onChange);
  }

  reflect();
})();
