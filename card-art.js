/* ============================================================
   Generative card art — the five work-card diagrams come alive.
   Each `.card-media[data-art]` gets a <canvas> scene themed to
   its project, injected over the hand-authored SVG. The SVG
   stays in the DOM as the no-JS / reduced-motion / print
   fallback and returns whenever the canvas is hidden.

   One shared engine: a single rAF loop drives only the scenes
   currently on screen (IntersectionObserver — panels hidden by
   the tab bar report non-intersecting, so switching tabs pauses
   them for free) and stops itself when none are. With a mouse, a
   scene runs ONLY while the cursor is over its card (plus a short
   ease-out tail), then freezes on its last frame — at rest the
   static SVG diagram shows. On touch devices (hover:none) there
   is no hover to gate on: visible cards play on their own, and a
   finger pressed on a card drives the cursor effects. All scenes
   share one window-level pointer tracker; the canvases are
   pointer-events:none so the stretched card links stay clickable. Everything obeys the
   site motion state on <html> (`motion-off` = OS reduced-motion
   preference or the motion.js pause toggle): canvases are
   CSS-hidden and the engine stops. Vanilla canvas 2D, no deps.

   Scenes (bound by data-art; unknown values are skipped, so a
   future real screenshot just needs its attribute removed):
     unfall  — accident points + hotspot; cursor = inspection lens
     toolbox — a street network that draws itself; cursor = gravity well
     flows   — particles on bendable mobility corridors
     dcities — the joined Amman+Erfurt map (the owner's project
               banner) under one centrality analysis; the cursor
               is the analysis probe (reticle) revealing weights
     miner   — live (weighted) least-squares regression
     sishane — atelier semilattice; cursor = a new production centre
               that condenses extra dependency links around itself
     blanken — masterplan parcels cut by a tram line whose points
               snap toward the cursor, re-cutting the geometry live
   ============================================================ */
(function () {
  "use strict";

  if (!window.requestAnimationFrame) return;

  /* effective motion state, resolved onto <html> by the inline
     head script and flipped live by the motion.js toggle */
  function motionOff() {
    return document.documentElement.classList.contains("motion-off");
  }

  var medias = document.querySelectorAll(".card-media[data-art]");
  if (!medias.length) return;

  /* ---------------- shared helpers ---------------- */
  function rand(a, b) { return a + Math.random() * (b - a); }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function gauss(d2, s) { return Math.exp(-d2 / (2 * s * s)); }
  function bezPoint(p, t) {                     // cubic Bezier, p = [{x,y}×4]
    var u = 1 - t, uu = u * u, tt = t * t;
    return {
      x: u * uu * p[0].x + 3 * uu * t * p[1].x + 3 * u * tt * p[2].x + tt * t * p[3].x,
      y: u * uu * p[0].y + 3 * uu * t * p[1].y + 3 * u * tt * p[2].y + tt * t * p[3].y
    };
  }
  function hexRgb(hex) {                        // "#aabbcc" -> "r,g,b"
    var h = hex.replace("#", "");
    if (h.length === 3) h = h.charAt(0) + h.charAt(0) + h.charAt(1) + h.charAt(1) + h.charAt(2) + h.charAt(2);
    var n = parseInt(h, 16);
    return ((n >> 16) & 255) + "," + ((n >> 8) & 255) + "," + (n & 255);
  }

  /* palette from the CSS tokens (fallbacks = the authored values) */
  var P = (function () {
    var cs = window.getComputedStyle(document.documentElement);
    function tok(name, fb) {
      var v = cs.getPropertyValue(name);
      v = v && v.trim();
      return v || fb;
    }
    return {
      blue:   tok("--bau-blue", "#2b6cb0"),
      red:    tok("--bau-red", "#c8452f"),
      yellow: tok("--bau-yellow", "#e0a92e"),
      ochre:  tok("--bau-ochre-dk", "#b07d16"),
      ink:    tok("--ink", "#1f2933"),
      soft:   tok("--ink-soft", "#475160"),
      hair:   tok("--hair", "#e0e3e8"),
      tint:   tok("--bg-tint", "#f7f8fa")
    };
  })();
  var TINT_RGB = hexRgb(P.tint), RED_RGB = hexRgb(P.red), BLUE_RGB = hexRgb(P.blue);

  /* ============================================================
     Scene 1 · unfall — accident points over a street grid.
     Points blink in and out around gaussian cluster centres
     (severity-coloured), a hotspot glow pulses over the densest
     one. The cursor is an inspection lens: points inside it
     enlarge and highlight, and the hotspot re-weights toward it.
     ============================================================ */
  function makeUnfall() {
    var w = 0, h = 0, pts = [], centers = [], glow = { x: 0, y: 0 };
    var curT = 0, curPtr = null;
    var LENS = 56;

    function severity() {
      var r = Math.random();
      return r < 0.5 ? P.yellow : r < 0.83 ? P.blue : P.red;   // light / serious / fatal
    }
    function spawn(p) {
      var c = centers[(Math.random() * centers.length) | 0];
      p.x = clamp(c.x + (rand(-1, 1) + rand(-1, 1)) * c.s, 8, w - 8);
      p.y = clamp(c.y + (rand(-1, 1) + rand(-1, 1)) * c.s * 0.72, 8, h - 8);
      p.r = rand(2, 5.5);
      p.color = severity();
      p.ph = rand(0, Math.PI * 2);
      p.age = 0;
      p.ttl = rand(260, 700);
    }

    return {
      init: function (cw, ch) {
        w = cw; h = ch; pts = []; centers = [];
        var nc = 2 + ((Math.random() * 2) | 0);
        for (var i = 0; i < nc; i++) {
          centers.push({ x: rand(w * 0.2, w * 0.8), y: rand(h * 0.25, h * 0.75), s: rand(26, 42) });
        }
        glow.x = centers[0].x; glow.y = centers[0].y;
        for (var j = 0; j < 64; j++) {
          var p = {}; spawn(p); p.age = rand(0, p.ttl); pts.push(p);
        }
      },
      step: function (dt, t, ptr) {
        curT = t; curPtr = ptr;
        for (var i = 0; i < pts.length; i++) {
          pts[i].age += dt;
          if (pts[i].age > pts[i].ttl) spawn(pts[i]);
        }
        var gx = centers[0].x, gy = centers[0].y;
        if (ptr.over) { gx = lerp(gx, ptr.x, 0.55 * ptr.inf); gy = lerp(gy, ptr.y, 0.55 * ptr.inf); }
        glow.x += (gx - glow.x) * Math.min(0.035 * dt, 1);
        glow.y += (gy - glow.y) * Math.min(0.035 * dt, 1);
      },
      draw: function (ctx, cw, ch) {
        var t = curT, ptr = curPtr;
        ctx.fillStyle = P.tint; ctx.fillRect(0, 0, cw, ch);

        ctx.strokeStyle = P.hair; ctx.lineWidth = 1; ctx.globalAlpha = 0.8;
        ctx.beginPath();
        for (var gx = 24; gx < cw; gx += 48) { ctx.moveTo(gx, 0); ctx.lineTo(gx, ch); }
        for (var gy = 26; gy < ch; gy += 48) { ctx.moveTo(0, gy); ctx.lineTo(cw, gy); }
        ctx.stroke();
        ctx.globalAlpha = 1;

        var pulse = 0.6 + 0.4 * Math.sin(t * 0.0016);
        var grad = ctx.createRadialGradient(glow.x, glow.y, 4, glow.x, glow.y, 66);
        grad.addColorStop(0, "rgba(" + RED_RGB + "," + (0.14 * pulse).toFixed(3) + ")");
        grad.addColorStop(1, "rgba(" + RED_RGB + ",0)");
        ctx.fillStyle = grad;
        ctx.fillRect(glow.x - 70, glow.y - 70, 140, 140);

        // subtle global lean toward the cursor when it is not over the card
        var lx = 0, ly = 0;
        if (ptr && ptr.seen && !ptr.over) {
          var ldx = ptr.x - cw / 2, ldy = ptr.y - ch / 2;
          var ld = Math.sqrt(ldx * ldx + ldy * ldy) || 1;
          lx = (ldx / ld) * 1.5; ly = (ldy / ld) * 1.5;
        }

        for (var i = 0; i < pts.length; i++) {
          var p = pts[i];
          var fade = clamp(Math.min(p.age / 40, (p.ttl - p.age) / 40), 0, 1);
          var a = (0.35 + 0.45 * (0.5 + 0.5 * Math.sin(t * 0.002 + p.ph))) * fade;
          var inLens = false, r = p.r;
          if (ptr && ptr.over) {
            var dx = p.x - ptr.x, dy = p.y - ptr.y;
            inLens = dx * dx + dy * dy < LENS * LENS;
            if (inLens) { r = p.r * (1 + 0.8 * ptr.inf); a = Math.max(a, 0.95 * ptr.inf); }
          }
          ctx.globalAlpha = a;
          ctx.fillStyle = p.color;
          ctx.beginPath(); ctx.arc(p.x + lx, p.y + ly, r, 0, 6.2832); ctx.fill();
          if (inLens) {
            ctx.globalAlpha = 0.7 * ptr.inf; ctx.strokeStyle = P.soft; ctx.lineWidth = 1;
            ctx.beginPath(); ctx.arc(p.x, p.y, r + 2.5, 0, 6.2832); ctx.stroke();
          }
        }

        if (ptr && ptr.inf > 0.02) {
          ctx.globalAlpha = 0.4 * ptr.inf; ctx.strokeStyle = P.soft; ctx.lineWidth = 1;
          ctx.beginPath(); ctx.arc(ptr.x, ptr.y, LENS, 0, 6.2832); ctx.stroke();
          ctx.globalAlpha = 0.05 * ptr.inf; ctx.fillStyle = P.blue;
          ctx.beginPath(); ctx.arc(ptr.x, ptr.y, LENS, 0, 6.2832); ctx.fill();
        }
        ctx.globalAlpha = 1;
      }
    };
  }

  /* ============================================================
     Scene 2 · toolbox — a jittered street network that draws
     itself edge by edge (grow → hold → fade → a new variant),
     node size by degree — parametric urban modelling. The
     cursor is an elastic gravity well: nearby nodes are pulled
     toward it and spring back, edges follow.
     ============================================================ */
  function makeToolbox() {
    var w = 0, h = 0, nds = [], eds = [], T = 0;
    var curT = 0;
    var GROW = 5800, HOLD = 5600, FADE = 1400, TOTAL = GROW + HOLD + FADE;
    var COLORS = [P.blue, P.red, P.yellow];

    function build() {
      nds = []; eds = [];
      var cols = Math.max(4, Math.round(w / 62)), rows = Math.max(3, Math.round(h / 62));
      var sx = w / (cols - 1), sy = h / (rows - 1), grid = [], r, c;
      for (r = 0; r < rows; r++) {
        grid[r] = [];
        for (c = 0; c < cols; c++) {
          var n = {
            hx: clamp(c * sx + rand(-sx, sx) * 0.3, 6, w - 6),
            hy: clamp(r * sy + rand(-sy, sy) * 0.3, 6, h - 6),
            dx: 0, dy: 0, deg: 0, color: COLORS[(Math.random() * 3) | 0]
          };
          grid[r][c] = n; nds.push(n);
        }
      }
      function link(a, b) {
        if (Math.random() > 0.15) { eds.push({ a: a, b: b }); a.deg++; b.deg++; }
      }
      for (r = 0; r < rows; r++) {
        for (c = 0; c < cols; c++) {
          if (c + 1 < cols) link(grid[r][c], grid[r][c + 1]);
          if (r + 1 < rows) link(grid[r][c], grid[r + 1][c]);
        }
      }
      // stagger edge growth roughly from the top-left, with jitter
      eds.sort(function (e1, e2) {
        return (e1.a.hx + e1.a.hy + rand(0, 60)) - (e2.a.hx + e2.a.hy + rand(0, 60));
      });
      var span = GROW * 0.7;
      for (var i = 0; i < eds.length; i++) {
        eds[i].t0 = (i / Math.max(eds.length - 1, 1)) * span;
        eds[i].dur = GROW * 0.3;
      }
    }

    return {
      init: function (cw, ch) { w = cw; h = ch; T = 0; build(); },
      step: function (dt, t, ptr) {
        curT = t;
        T += dt * 16.667;
        if (T > TOTAL) { T = 0; build(); }        // a new network variant
        for (var i = 0; i < nds.length; i++) {
          var n = nds[i], tx = 0, ty = 0;
          if (ptr.over) {
            var ddx = ptr.x - n.hx, ddy = ptr.y - n.hy;
            var g = 0.25 * gauss(ddx * ddx + ddy * ddy, 90) * ptr.inf;
            tx = ddx * g; ty = ddy * g;
          } else if (ptr.seen) {
            var lXd = ptr.x - w / 2, lYd = ptr.y - h / 2;
            var lD = Math.sqrt(lXd * lXd + lYd * lYd) || 1;
            tx = (lXd / lD) * 1.2; ty = (lYd / lD) * 1.2;
          }
          n.dx += (tx - n.dx) * Math.min(0.12 * dt, 1);
          n.dy += (ty - n.dy) * Math.min(0.12 * dt, 1);
        }
      },
      draw: function (ctx, cw, ch) {
        var t = curT;
        ctx.fillStyle = P.tint; ctx.fillRect(0, 0, cw, ch);
        var fadeF = T > GROW + HOLD ? 1 - (T - GROW - HOLD) / FADE : 1;

        ctx.strokeStyle = P.soft; ctx.lineWidth = 1.2;
        ctx.globalAlpha = 0.5 * fadeF;
        ctx.beginPath();
        for (var i = 0; i < eds.length; i++) {
          var e = eds[i];
          var g = T < e.t0 ? 0 : clamp((T - e.t0) / e.dur, 0, 1);
          if (g <= 0) continue;
          var ax = e.a.hx + e.a.dx, ay = e.a.hy + e.a.dy;
          var bx = e.b.hx + e.b.dx, by = e.b.hy + e.b.dy;
          ctx.moveTo(ax, ay);
          ctx.lineTo(lerp(ax, bx, g), lerp(ay, by, g));
        }
        ctx.stroke();

        for (var j = 0; j < nds.length; j++) {
          var n = nds[j];
          var r = (2 + 0.7 * n.deg) * (0.92 + 0.08 * Math.sin(t * 0.0018 + j));
          ctx.globalAlpha = 0.88 * fadeF;
          ctx.fillStyle = n.color;
          ctx.beginPath(); ctx.arc(n.hx + n.dx, n.hy + n.dy, r, 0, 6.2832); ctx.fill();
        }
        ctx.globalAlpha = 1;
      }
    };
  }

  /* ============================================================
     Scene 3 · flows — particles streaming along three mobility
     corridors, with fading trails (the only scene that never
     clears — it fades). The cursor bends the nearest corridor
     toward it and speeds up nearby particles.
     ============================================================ */
  function makeFlows() {
    var w = 0, h = 0, cors = [], fresh = true;
    // corridor shapes in unit space (scaled to the card on init)
    var DEFS = [
      { color: "blue",   u: [[0, 0.78], [0.28, 0.15], [0.55, 0.95], [1, 0.32]] },
      { color: "red",    u: [[0, 0.55], [0.30, 0.38], [0.62, 0.86], [1, 0.58]] },
      { color: "yellow", u: [[0, 0.90], [0.36, 0.74], [0.52, 0.28], [1, 0.74]] }
    ];

    return {
      init: function (cw, ch) {
        w = cw; h = ch; cors = []; fresh = true;
        for (var i = 0; i < DEFS.length; i++) {
          var d = DEFS[i], base = [], cur = [];
          for (var k = 0; k < 4; k++) {
            base.push({ x: d.u[k][0] * w, y: d.u[k][1] * h });
            cur.push({ x: d.u[k][0] * w, y: d.u[k][1] * h });
          }
          var parts = [];
          for (var m = 0; m < 26; m++) {
            parts.push({ s: Math.random(), sp: rand(0.0022, 0.005), off: rand(-5, 5), size: rand(1.1, 2.3) });
          }
          cors.push({ color: P[d.color], base: base, cur: cur, parts: parts });
        }
      },
      step: function (dt, t, ptr) {
        for (var i = 0; i < cors.length; i++) {
          var c = cors[i];
          for (var k = 1; k <= 2; k++) {          // inner control points bend
            var b = c.base[k], q = c.cur[k], tx = b.x, ty = b.y;
            if (ptr.over) {
              var ddx = ptr.x - b.x, ddy = ptr.y - b.y;
              var pull = 0.35 * gauss(ddx * ddx + ddy * ddy, 120) * ptr.inf;
              tx = b.x + ddx * pull; ty = b.y + ddy * pull;
            }
            q.x += (tx - q.x) * Math.min(0.1 * dt, 1);
            q.y += (ty - q.y) * Math.min(0.1 * dt, 1);
          }
          for (var m = 0; m < c.parts.length; m++) {
            var p = c.parts[m], boost = 1;
            if (ptr.over) {
              var pos = bezPoint(c.cur, p.s);
              var pdx = pos.x - ptr.x, pdy = pos.y - ptr.y;
              boost = 1 + 0.9 * gauss(pdx * pdx + pdy * pdy, 80) * ptr.inf;
            }
            p.s += p.sp * dt * boost;
            if (p.s > 1) p.s -= 1;
          }
        }
      },
      draw: function (ctx, cw, ch) {
        if (fresh) { ctx.fillStyle = P.tint; ctx.fillRect(0, 0, cw, ch); fresh = false; }
        else { ctx.fillStyle = "rgba(" + TINT_RGB + ",0.16)"; ctx.fillRect(0, 0, cw, ch); }

        for (var i = 0; i < cors.length; i++) {
          var c = cors[i];
          ctx.globalAlpha = 0.22; ctx.strokeStyle = c.color; ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(c.cur[0].x, c.cur[0].y);
          ctx.bezierCurveTo(c.cur[1].x, c.cur[1].y, c.cur[2].x, c.cur[2].y, c.cur[3].x, c.cur[3].y);
          ctx.stroke();

          ctx.globalAlpha = 0.9; ctx.fillStyle = c.color;
          for (var m = 0; m < c.parts.length; m++) {
            var p = c.parts[m];
            var pos = bezPoint(c.cur, p.s);
            var ahead = bezPoint(c.cur, Math.min(p.s + 0.01, 1));
            var txv = ahead.x - pos.x, tyv = ahead.y - pos.y;
            var tl = Math.sqrt(txv * txv + tyv * tyv) || 1;
            var nx = -tyv / tl, ny = txv / tl;      // perpendicular offset lane
            ctx.beginPath();
            ctx.arc(pos.x + nx * p.off, pos.y + ny * p.off, p.size, 0, 6.2832);
            ctx.fill();
          }
        }
        ctx.globalAlpha = 1;
      }
    };
  }

  /* ============================================================
     Scene 4 · dcities — the Discovering Cities banner, replayed:
     the owner's joined Amman+Erfurt map. Dense angular fabric
     (Amman, left) blends into perimeter blocks with courtyards
     and greens (Erfurt, right) under ONE street-network
     centrality analysis (red artery → ochre → yellow → blue).
     The cursor is the analysis probe: a small reticle under
     which the network shows its full colours and weights; away
     from it the analysis rests faint. Untouched (touch), the
     probe surveys the map on its own.
     ============================================================ */
  function makeDcities() {
    var w = 0, h = 0, blocks = [], lines = [], curT = 0;
    var probe = { x: 0, y: 0, amt: 0 };
    var KC = { ga: "#d7dbe2", gb: "#ccd2da", warm: "#d9cec6", green: "#b1c6b3" };
    var segs = [];                                // flat list for block clearance

    function dseg(px, py, a, b) {
      var dx = b.x - a.x, dy = b.y - a.y, L = dx * dx + dy * dy;
      var t = L === 0 ? 0 : clamp(((px - a.x) * dx + (py - a.y) * dy) / L, 0, 1);
      var qx = a.x + t * dx, qy = a.y + t * dy;
      return Math.sqrt((px - qx) * (px - qx) + (py - qy) * (py - qy));
    }
    function rectPoly(cx, cy, cw2, ch2, rot) {
      var ca = Math.cos(rot), sa = Math.sin(rot), out = [];
      var cs = [[-cw2 / 2, -ch2 / 2], [cw2 / 2, -ch2 / 2], [cw2 / 2, ch2 / 2], [-cw2 / 2, ch2 / 2]];
      for (var i = 0; i < 4; i++) {
        out.push({ x: cx + cs[i][0] * ca - cs[i][1] * sa, y: cy + cs[i][0] * sa + cs[i][1] * ca });
      }
      return out;
    }
    function yAt(pts, x) {
      for (var i = 0; i < pts.length - 1; i++) {
        if (pts[i].x <= x && x <= pts[i + 1].x) {
          var f = (x - pts[i].x) / (pts[i + 1].x - pts[i].x || 1);
          return pts[i].y + f * (pts[i + 1].y - pts[i].y);
        }
      }
      return pts[pts.length - 1].y;
    }

    return {
      init: function (cw, ch) {
        w = cw; h = ch; blocks = []; lines = []; segs = [];
        var kx = w / 320, ky = h / 200, i, x, y;
        // 4 banded routes: wobbly on the Amman side, calm on the Erfurt side
        var BANDS = [
          { color: P.blue,   width: 1.9, y0: 26,  lo: 16,  hi: 40,  wl: 8,  wr: 3 },
          { color: P.ochre,  width: 2.7, y0: 66,  lo: 52,  hi: 86,  wl: 11, wr: 4 },
          { color: P.red,    width: 3.4, y0: 112, lo: 98,  hi: 134, wl: 13, wr: 4 },
          { color: P.yellow, width: 2.3, y0: 164, lo: 150, hi: 182, wl: 11, wr: 5 }
        ];
        var XS = [0, 28, 60, 95, 130, 165, 200, 240, 280, 320];
        var routes = [];
        for (i = 0; i < BANDS.length; i++) {
          var B = BANDS[i], pts = [], yy = B.y0;
          for (var k = 0; k < XS.length; k++) {
            var f = XS[k] / 320;
            yy = clamp(yy + rand(-1, 1) * (B.wl * (1 - f) + B.wr * f), B.lo, B.hi);
            pts.push({ x: XS[k] * kx, y: yy * ky });
          }
          routes.push(pts);
          lines.push({ color: B.color, width: B.width, pts: pts, route: true });
        }
        // connectors: crooked alleys left, straight streets right
        var CXS = [16, 36, 56, 76, 96, 116, 136, 156, 182, 212, 244, 276, 304];
        for (i = 0; i < CXS.length; i++) {
          var cx = CXS[i], left = cx < 165;
          for (var p2 = 0; p2 < 3; p2++) {
            if (Math.random() > (left ? 0.75 : 0.62)) continue;
            var ya = yAt(routes[p2], cx * kx), yb = yAt(routes[p2 + 1], cx * kx);
            var kink = (left ? rand(-5, 5) : rand(-1, 1)) * kx;
            lines.push({
              color: "#9aa3ad", width: 1.2, route: false,
              pts: [{ x: cx * kx, y: ya }, { x: cx * kx + kink, y: (ya + yb) / 2 }, { x: cx * kx, y: yb }]
            });
          }
        }
        for (i = 0; i < lines.length; i++) {
          for (var s = 0; s < lines[i].pts.length - 1; s++) {
            segs.push([lines[i].pts[s], lines[i].pts[s + 1]]);
          }
        }
        function clear(px, py) {
          var m = 1e9;
          for (var q = 0; q < segs.length; q++) m = Math.min(m, dseg(px, py, segs[q][0], segs[q][1]));
          return m;
        }
        // Amman: tight small angular blocks
        x = 2 * kx;
        while (x < 172 * kx) {
          var cellA = rand(10.5, 13) * kx;
          y = 2 * ky;
          while (y < h - 4 * ky) {
            var bx = x + cellA / 2 + rand(-1.2, 1.2) * kx, by = y + cellA / 2 + rand(-1.2, 1.2) * ky;
            if (clear(bx, by) > 4.8 * kx && Math.random() > 0.04) {
              blocks.push({
                poly: rectPoly(bx, by, rand(0.78, 0.98) * cellA, rand(0.72, 0.95) * cellA, rand(-0.23, 0.23)),
                kind: Math.random() < 0.55 ? "ga" : "gb", hole: null
              });
            }
            y += cellA;
          }
          x += cellA;
        }
        // Erfurt: large perimeter blocks with courtyards + greens
        x = 172 * kx;
        while (x < w - 4 * kx) {
          var cellE = rand(23, 28) * kx;
          y = 3 * ky;
          while (y < h - 6 * ky) {
            var ex = x + cellE / 2 + rand(-1, 1) * kx, ey = y + cellE / 2 + rand(-1, 1) * ky;
            if (clear(ex, ey) > 7.5 * kx && Math.random() > 0.06) {
              var bw2 = rand(0.82, 0.96) * cellE, bh2 = rand(0.75, 0.93) * cellE;
              var rot2 = rand(-0.045, 0.045), r3 = Math.random();
              blocks.push({
                poly: rectPoly(ex, ey, bw2, bh2, rot2),
                kind: r3 < 0.18 ? "green" : (r3 < 0.6 ? "warm" : "ga"),
                hole: r3 >= 0.18 && Math.random() < 0.8 ? rectPoly(ex, ey, bw2 * 0.44, bh2 * 0.4, rot2) : null
              });
            }
            y += cellE;
          }
          x += cellE;
        }
        probe.x = w / 2; probe.y = h / 2;
      },
      step: function (dt, t, ptr) {
        curT = t;
        var tx, ty, amt;
        if (ptr.over) { tx = ptr.x; ty = ptr.y; amt = ptr.inf; }
        else {                                    // the probe surveys on its own (touch)
          tx = w * (0.5 + 0.34 * Math.sin(t * 0.00019));
          ty = h * (0.5 + 0.3 * Math.sin(t * 0.00027 + 1.2));
          amt = COARSE ? 0.85 : ptr.inf;
        }
        probe.x += (tx - probe.x) * Math.min(0.1 * dt, 1);
        probe.y += (ty - probe.y) * Math.min(0.1 * dt, 1);
        probe.amt += (amt - probe.amt) * Math.min(0.1 * dt, 1);
      },
      draw: function (ctx, cw, ch) {
        var i, j;
        ctx.fillStyle = P.tint; ctx.fillRect(0, 0, cw, ch);
        // the joined fabric
        for (i = 0; i < blocks.length; i++) {
          var b = blocks[i];
          ctx.fillStyle = KC[b.kind]; ctx.globalAlpha = 1;
          ctx.beginPath();
          ctx.moveTo(b.poly[0].x, b.poly[0].y);
          for (j = 1; j < 4; j++) ctx.lineTo(b.poly[j].x, b.poly[j].y);
          ctx.closePath(); ctx.fill();
          if (b.hole) {
            ctx.fillStyle = P.tint;
            ctx.beginPath();
            ctx.moveTo(b.hole[0].x, b.hole[0].y);
            for (j = 1; j < 4; j++) ctx.lineTo(b.hole[j].x, b.hole[j].y);
            ctx.closePath(); ctx.fill();
          }
        }
        // the analysis: faint at rest, full colour + weight under the probe
        ctx.lineCap = "round"; ctx.lineJoin = "round";
        for (i = 0; i < lines.length; i++) {
          var L = lines[i];
          for (j = 0; j < L.pts.length - 1; j++) {
            var a = L.pts[j], b2 = L.pts[j + 1];
            var mx = (a.x + b2.x) / 2 - probe.x, my = (a.y + b2.y) / 2 - probe.y;
            var wgt = gauss(mx * mx + my * my, 62) * probe.amt;
            ctx.strokeStyle = L.color;
            ctx.globalAlpha = (L.route ? 0.4 : 0.5) + 0.55 * wgt;
            ctx.lineWidth = L.width + (L.route ? 1.6 : 0.8) * wgt;
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b2.x, b2.y); ctx.stroke();
          }
        }
        // the probe reticle — the analyst's cursor
        if (probe.amt > 0.03) {
          var s = 13;
          ctx.globalAlpha = 0.75 * probe.amt;
          ctx.strokeStyle = P.ink; ctx.lineWidth = 1.2;
          ctx.strokeRect(probe.x - s, probe.y - s, s * 2, s * 2);
          ctx.beginPath();
          ctx.moveTo(probe.x - s - 4, probe.y); ctx.lineTo(probe.x - s + 3, probe.y);
          ctx.moveTo(probe.x + s + 4, probe.y); ctx.lineTo(probe.x + s - 3, probe.y);
          ctx.moveTo(probe.x, probe.y - s - 4); ctx.lineTo(probe.x, probe.y - s + 3);
          ctx.moveTo(probe.x, probe.y + s + 4); ctx.lineTo(probe.x, probe.y + s - 3);
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
      }
    };
  }

  /* ============================================================
     Scene 5 · miner — statistics, alive. Dancing bars, a
     drifting scatter cloud, and a trend line that is a REAL
     least-squares fit recomputed every frame. With the cursor
     over the card the points get gaussian distance weights →
     weighted least squares: the line bends toward the local
     cloud (a genuine local regression), and R² updates live.
     ============================================================ */
  function makeMiner() {
    var w = 0, h = 0, bars = [], pts = [], plot = null;
    var fitA = 0, fitB = 0, r2 = 0;
    var curT = 0, curPtr = null;

    return {
      init: function (cw, ch) {
        w = cw; h = ch; bars = []; pts = [];
        plot = { x0: 0.13 * w, x1: 0.94 * w, yTop: 0.11 * h, yBot: 0.83 * h };
        var baseH = [0.24, 0.4, 0.5, 0.33, 0.44];
        for (var i = 0; i < 5; i++) {
          bars.push({
            cx: plot.x0 + (0.06 + i * 0.088) * w,
            bw: 0.047 * w,
            base: baseH[i] * (plot.yBot - plot.yTop),
            ph: rand(0, 6.28)
          });
        }
        // seed the cloud on a ground-truth line + gaussian-ish noise
        var yL = 0.72 * h, yR = 0.24 * h;         // left/right end of the true line
        for (var j = 0; j < 48; j++) {
          var x = rand(plot.x0 + 10, plot.x1 - 6);
          var yTrue = lerp(yL, yR, (x - plot.x0) / (plot.x1 - plot.x0));
          var y = clamp(yTrue + (rand(-1, 1) + rand(-1, 1)) * 0.055 * h, plot.yTop, plot.yBot - 2);
          pts.push({ hx: x, hy: y, x: x, y: y, vx: 0, vy: 0, wgt: 1 });
        }
        fitA = 0; fitB = 0; r2 = 0;
      },
      step: function (dt, t, ptr) {
        curT = t; curPtr = ptr;
        var i, p;
        for (i = 0; i < pts.length; i++) {
          p = pts[i];
          // drift around home: noise + spring back + damping
          p.vx += rand(-1, 1) * 0.055 * dt + (p.hx - p.x) * 0.0045 * dt - p.vx * 0.03 * dt;
          p.vy += rand(-1, 1) * 0.055 * dt + (p.hy - p.y) * 0.0045 * dt - p.vy * 0.03 * dt;
          p.x += p.vx * dt; p.y += p.vy * dt;
          // gaussian cursor weight, blended by influence → smooth line motion
          var wgt = 1;
          if (ptr.seen) {
            var dx = p.x - ptr.x, dy = p.y - ptr.y;
            wgt = lerp(1, 0.05 + gauss(dx * dx + dy * dy, 70), ptr.inf);
          }
          p.wgt = wgt;
        }
        // weighted least squares over the live cloud
        var sw = 0, swx = 0, swy = 0, swxx = 0, swxy = 0;
        for (i = 0; i < pts.length; i++) {
          p = pts[i];
          sw += p.wgt; swx += p.wgt * p.x; swy += p.wgt * p.y;
          swxx += p.wgt * p.x * p.x; swxy += p.wgt * p.x * p.y;
        }
        var den = sw * swxx - swx * swx;
        if (Math.abs(den) > 1e-6) {
          fitB = (sw * swxy - swx * swy) / den;
          fitA = (swy - fitB * swx) / sw;
          var ybar = swy / sw, ssRes = 0, ssTot = 0;
          for (i = 0; i < pts.length; i++) {
            p = pts[i];
            var e = p.y - (fitA + fitB * p.x), d0 = p.y - ybar;
            ssRes += p.wgt * e * e; ssTot += p.wgt * d0 * d0;
          }
          if (ssTot > 1e-6) r2 = clamp(1 - ssRes / ssTot, 0, 1);
        }
      },
      draw: function (ctx, cw, ch) {
        var t = curT, ptr = curPtr;
        ctx.fillStyle = P.tint; ctx.fillRect(0, 0, cw, ch);

        // axes
        ctx.strokeStyle = P.hair; ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(plot.x0, plot.yTop); ctx.lineTo(plot.x0, plot.yBot);
        ctx.lineTo(plot.x1, plot.yBot);
        ctx.stroke();

        // dancing bars
        ctx.fillStyle = P.yellow;
        for (var i = 0; i < bars.length; i++) {
          var b = bars[i];
          var hgt = b.base * (1 + 0.16 * Math.sin(t * 0.0011 + b.ph) + 0.07 * Math.sin(t * 0.0021 + b.ph * 1.7));
          if (ptr && ptr.over) {
            var bdx = b.cx - ptr.x;
            hgt *= 1 + 0.18 * gauss(bdx * bdx, 40) * ptr.inf;
          }
          hgt = Math.min(hgt, plot.yBot - plot.yTop - 2);
          ctx.globalAlpha = 0.8;
          ctx.fillRect(b.cx - b.bw / 2, plot.yBot - hgt, b.bw, hgt);
        }

        // scatter cloud (weights show under the cursor)
        for (var j = 0; j < pts.length; j++) {
          var p = pts[j];
          var wn = ptr && ptr.over ? clamp((p.wgt - 0.05) / 0.95, 0, 1) : 1;
          ctx.globalAlpha = ptr && ptr.over ? 0.3 + 0.65 * wn : 0.85;
          ctx.fillStyle = P.blue;
          ctx.beginPath();
          ctx.arc(p.x, p.y, 2.6 * (ptr && ptr.over ? 0.7 + 0.75 * wn : 1), 0, 6.2832);
          ctx.fill();
        }

        // the trend line — an actual regression over what you see
        var xa = plot.x0 + 6, xb = plot.x1;
        ctx.save();
        ctx.beginPath();
        ctx.rect(plot.x0, plot.yTop - 6, plot.x1 - plot.x0, plot.yBot - plot.yTop + 12);
        ctx.clip();
        ctx.globalAlpha = 0.9; ctx.strokeStyle = P.red; ctx.lineWidth = 3; ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(xa, fitA + fitB * xa);
        ctx.lineTo(xb, fitA + fitB * xb);
        ctx.stroke();
        ctx.restore();

        // live goodness-of-fit — numerals only, no i18n needed
        ctx.globalAlpha = 0.8; ctx.fillStyle = P.soft;
        ctx.font = "600 10px system-ui, -apple-system, 'Segoe UI', sans-serif";
        ctx.textAlign = "right";
        ctx.fillText("R² = " + r2.toFixed(2), plot.x1, plot.yTop + 4);
        ctx.textAlign = "left";
        ctx.globalAlpha = 1;
      }
    };
  }

  /* ============================================================
     Scene 6 · frontage — active frontages along a street grid
     (the SSS13 Weimar paper, animated). Building-edge strips are
     coloured by street-level function — retail clustered at the
     core crossing, service, residential — and pulse like opening
     hours; now and then a frontage flips function (the rise and
     fall of ground-floor uses). Pedestrian dots stream along the
     streets. The cursor is a gravity-accessibility probe: strips
     glow and thicken with negative-exponential distance decay
     (the paper's impedance), inside a soft reach ring.
     ============================================================ */
  function makeFrontage() {
    var w = 0, h = 0, streets = [], strips = [], peds = [], curT = 0, curPtr = null;
    var RESID = "#9aa3ad";
    var DECAY = 55;                               // gaussian-ish reach of the probe (px)
    var RING = 62;

    function pickFn(cx, cy) {
      // retail probability peaks at the card centre — the retail core
      var dx = cx - w / 2, dy = cy - h / 2;
      var core = gauss(dx * dx + dy * dy, Math.min(w, h) * 0.34);
      var r = Math.random();
      if (r < 0.15 + 0.55 * core) return P.red;   // retail
      if (r < 0.45 + 0.45 * core) return P.blue;  // service / cultural
      return RESID;                                // residential
    }

    function build() {
      streets = []; strips = []; peds = [];
      var hy = [h * (0.34 + rand(-0.04, 0.04)), h * (0.72 + rand(-0.04, 0.04))];
      var vx = [w * (0.3 + rand(-0.05, 0.05)), w * (0.68 + rand(-0.05, 0.05))];
      var i;
      for (i = 0; i < hy.length; i++) streets.push({ x1: 0, y1: hy[i], x2: w, y2: hy[i] });
      for (i = 0; i < vx.length; i++) streets.push({ x1: vx[i], y1: 0, x2: vx[i], y2: h });
      // frontage strips: segments with gaps on both sides of every street
      for (i = 0; i < streets.length; i++) {
        var st = streets[i];
        var horiz = st.y1 === st.y2;
        var len = horiz ? w : h;
        for (var side = -1; side <= 1; side += 2) {
          var pos = rand(4, 16);
          while (pos < len - 12) {
            var seg = rand(16, 42);
            if (pos + seg > len - 4) seg = len - 4 - pos;
            var cx = horiz ? pos + seg / 2 : st.x1 + side * 7;
            var cy = horiz ? st.y1 + side * 7 : pos + seg / 2;
            strips.push({
              st: i, side: side, a: pos, b: pos + seg,
              color: pickFn(cx, cy),
              ph: rand(0, 6.28),
              flip: rand(4000, 26000)             // ms until this frontage turns over
            });
            pos += seg + rand(5, 14);
          }
        }
      }
      for (i = 0; i < 16; i++) {
        peds.push({ st: (Math.random() * streets.length) | 0, s: Math.random(),
                    sp: rand(0.0006, 0.0014) * (Math.random() < 0.5 ? -1 : 1) });
      }
    }

    function stripXY(sp, t) {                     // point along a strip (t in [a,b])
      var st = streets[sp.st];
      return st.y1 === st.y2
        ? { x: t, y: st.y1 + sp.side * 5 }
        : { x: st.x1 + sp.side * 5, y: t };
    }

    return {
      init: function (cw, ch) { w = cw; h = ch; build(); },
      step: function (dt, t, ptr) {
        curT = t; curPtr = ptr;
        var i;
        for (i = 0; i < peds.length; i++) {
          var p = peds[i];
          p.s += p.sp * dt;
          if (p.s > 1) p.s -= 1; else if (p.s < 0) p.s += 1;
        }
        for (i = 0; i < strips.length; i++) {
          var s = strips[i];
          s.flip -= dt * 16.667;
          if (s.flip < 0) {                       // ground-floor turnover
            var m = stripXY(s, (s.a + s.b) / 2);
            s.color = pickFn(m.x, m.y);
            s.flip = rand(6000, 30000);
          }
        }
      },
      draw: function (ctx, cw, ch) {
        var t = curT, ptr = curPtr;
        ctx.fillStyle = P.tint; ctx.fillRect(0, 0, cw, ch);
        var i;
        // streets
        ctx.strokeStyle = P.hair; ctx.lineWidth = 1.5;
        ctx.beginPath();
        for (i = 0; i < streets.length; i++) {
          ctx.moveTo(streets[i].x1, streets[i].y1);
          ctx.lineTo(streets[i].x2, streets[i].y2);
        }
        ctx.stroke();
        // frontage strips, weighted by the probe's distance decay
        for (i = 0; i < strips.length; i++) {
          var s = strips[i];
          var m = stripXY(s, (s.a + s.b) / 2);
          var wgt = 0;
          if (ptr && ptr.over) {
            var dx = m.x - ptr.x, dy = m.y - ptr.y;
            wgt = gauss(dx * dx + dy * dy, DECAY) * ptr.inf;
          }
          var pulse = 0.62 + 0.22 * Math.sin(t * 0.0016 + s.ph);
          ctx.globalAlpha = Math.min(pulse + 0.5 * wgt, 1);
          ctx.strokeStyle = s.color;
          ctx.lineWidth = 3.4 + 3 * wgt;
          var a1 = stripXY(s, s.a), b1 = stripXY(s, s.b);
          ctx.beginPath(); ctx.moveTo(a1.x, a1.y); ctx.lineTo(b1.x, b1.y); ctx.stroke();
        }
        // pedestrians on the streets
        ctx.globalAlpha = 0.75; ctx.fillStyle = P.soft;
        for (i = 0; i < peds.length; i++) {
          var pd = peds[i], st = streets[pd.st];
          var px = lerp(st.x1, st.x2, pd.s), py = lerp(st.y1, st.y2, pd.s);
          ctx.beginPath(); ctx.arc(px, py, 1.7, 0, 6.2832); ctx.fill();
        }
        // the accessibility probe's reach ring
        if (ptr && ptr.inf > 0.02 && ptr.over) {
          ctx.globalAlpha = 0.35 * ptr.inf; ctx.strokeStyle = P.soft; ctx.lineWidth = 1;
          ctx.beginPath(); ctx.arc(ptr.x, ptr.y, RING, 0, 6.2832); ctx.stroke();
          ctx.globalAlpha = 0.05 * ptr.inf; ctx.fillStyle = P.yellow;
          ctx.beginPath(); ctx.arc(ptr.x, ptr.y, RING, 0, 6.2832); ctx.fill();
        }
        ctx.globalAlpha = 1;
      }
    };
  }

  /* ============================================================
     Scene 7 · sishane — the atelier network as a SEMILATTICE.
     Spread-out ateliers; a deliberately sparse base net (some
     ateliers stay unconnected). The semilattice itself is the
     prominent layer: soft overlapping group-hulls — sets that
     SHARE members, Alexander's semilattice against the tree.
     The pointer's influence is small and local: it selects the
     single nearest atelier, which quietly links to its own local
     group — one emergent centre, everything else at rest.
     ============================================================ */
  function makeSishane() {
    var w = 0, h = 0, nds = [], base = [], groups = [], curT = 0;
    var act = { i: -1, amt: 0 };
    var R_LOCAL = 62;                             // reach of the selected atelier's group
    var SLOT = 3200;                              // ambient dwell per atelier (touch)

    function hull(pts) {                          // Andrew monotone chain
      var p = pts.slice().sort(function (a, b) { return a.x - b.x || a.y - b.y; });
      if (p.length < 3) return p;
      function cr(o, a, b) { return (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x); }
      var lo = [], up = [], i;
      for (i = 0; i < p.length; i++) {
        while (lo.length > 1 && cr(lo[lo.length - 2], lo[lo.length - 1], p[i]) <= 0) lo.pop();
        lo.push(p[i]);
      }
      for (i = p.length - 1; i >= 0; i--) {
        while (up.length > 1 && cr(up[up.length - 2], up[up.length - 1], p[i]) <= 0) up.pop();
        up.push(p[i]);
      }
      lo.pop(); up.pop();
      return lo.concat(up);
    }

    return {
      init: function (cw, ch) {
        w = cw; h = ch; nds = []; base = []; groups = [];
        var COLORS = [P.red, P.blue, P.yellow, "#9aa3ad"];
        var i, j, k;
        // spread the ateliers: jittered grid cells, a few left empty
        var cols = 7, rows = 4, cells = [];
        for (i = 0; i < cols * rows; i++) cells.push(i);
        for (i = cells.length - 1; i > 0; i--) {
          j = (Math.random() * (i + 1)) | 0;
          k = cells[i]; cells[i] = cells[j]; cells[j] = k;
        }
        for (i = 0; i < 21; i++) {
          var cell = cells[i], cc = cell % cols, cr2 = (cell / cols) | 0;
          nds.push({
            hx: clamp((cc + 0.5 + rand(-0.34, 0.34)) / cols * w, 10, w - 10),
            hy: clamp((cr2 + 0.5 + rand(-0.34, 0.34)) / rows * h, 10, h - 10),
            dx: 0, dy: 0, deg: 0, ph: rand(0, 6.28),
            color: COLORS[(Math.random() * COLORS.length) | 0]
          });
        }
        // sparse base net: nearest neighbour, only sometimes — leaves loners
        var seen = {};
        for (i = 0; i < nds.length; i++) {
          if (Math.random() > 0.6) continue;      // this atelier stays unconnected (for now)
          var b1 = 1e9, n1 = -1;
          for (j = 0; j < nds.length; j++) {
            if (j === i) continue;
            var dx = nds[j].hx - nds[i].hx, dy = nds[j].hy - nds[i].hy, d = dx * dx + dy * dy;
            if (d < b1) { b1 = d; n1 = j; }
          }
          var key = i < n1 ? i + ":" + n1 : n1 + ":" + i;
          if (n1 >= 0 && !seen[key]) {
            seen[key] = true;
            base.push({ a: nds[i], b: nds[n1] });
            nds[i].deg++; nds[n1].deg++;
          }
        }
        // the semilattice: 4 groups anchored at neighbourly positions with a
        // generous radius, so adjacent groups SHARE members — overlapping sets
        var R_GROUP = Math.min(w, h) * 0.62;
        var ANCHORS = [[0.28, 0.32], [0.68, 0.28], [0.36, 0.72], [0.74, 0.7]];
        for (k = 0; k < ANCHORS.length; k++) {
          var axp = ANCHORS[k][0] * w, ayp = ANCHORS[k][1] * h;
          var sBest = 1e9, sI = 0;
          for (i = 0; i < nds.length; i++) {
            var adx = nds[i].hx - axp, ady = nds[i].hy - ayp, ad = adx * adx + ady * ady;
            if (ad < sBest) { sBest = ad; sI = i; }
          }
          var s = nds[sI], mem = [];
          for (i = 0; i < nds.length; i++) {
            var gdx = nds[i].hx - s.hx, gdy = nds[i].hy - s.hy;
            if (gdx * gdx + gdy * gdy < R_GROUP * R_GROUP) mem.push(nds[i]);
          }
          if (mem.length >= 3) groups.push({ color: COLORS[k % COLORS.length], mem: mem });
        }
      },
      step: function (dt, t, ptr) {
        curT = t;
        // choose the ONE active atelier: nearest to the cursor (close by),
        // or — untouched, on touch — a slow rotation through the ateliers
        var target = -1, tAmt = 0, i;
        if (ptr.over) {
          var best = 1e9;
          for (i = 0; i < nds.length; i++) {
            var dx = nds[i].hx - ptr.x, dy = nds[i].hy - ptr.y, d = dx * dx + dy * dy;
            if (d < best) { best = d; target = i; }
          }
          if (best > 100 * 100) { target = -1; }
          else {
            tAmt = ptr.inf;
            // sticky selection: keep the current atelier unless the new one
            // is clearly closer — no flip-flop at midpoints between two nodes
            if (act.i >= 0 && act.i !== target) {
              var kdx = nds[act.i].hx - ptr.x, kdy = nds[act.i].hy - ptr.y;
              if (kdx * kdx + kdy * kdy < best * 1.6) target = act.i;
            }
          }
        } else if (COARSE) {
          target = ((t / SLOT) | 0) % nds.length;
          tAmt = 0.85 * Math.sin(Math.PI * ((t % SLOT) / SLOT));
        }
        if (act.i !== target) {                   // fade out, then hand over
          act.amt += (0 - act.amt) * Math.min(0.14 * dt, 1);
          if (act.amt < 0.05) act.i = target;
        } else {
          act.amt += (tAmt - act.amt) * Math.min(0.08 * dt, 1);
        }
        // only the local group around the selected atelier moves — gently
        var a = act.i >= 0 ? nds[act.i] : null;
        for (i = 0; i < nds.length; i++) {
          var n = nds[i], tx = 0, ty = 0;
          if (a && n !== a) {
            var ddx = a.hx - n.hx, ddy = a.hy - n.hy;
            var g = 0.09 * gauss(ddx * ddx + ddy * ddy, R_LOCAL) * act.amt;
            tx = ddx * g; ty = ddy * g;
          }
          n.dx += (tx - n.dx) * Math.min(0.09 * dt, 1);
          n.dy += (ty - n.dy) * Math.min(0.09 * dt, 1);
        }
      },
      draw: function (ctx, cw, ch) {
        var t = curT, i, j;
        ctx.fillStyle = P.tint; ctx.fillRect(0, 0, cw, ch);

        // the semilattice, prominent: soft hulls of OVERLAPPING groups
        for (i = 0; i < groups.length; i++) {
          var g = groups[i], pts = [], cx = 0, cy = 0;
          for (j = 0; j < g.mem.length; j++) { cx += g.mem[j].hx + g.mem[j].dx; cy += g.mem[j].hy + g.mem[j].dy; }
          cx /= g.mem.length; cy /= g.mem.length;
          var breathe = 13 + 2.5 * Math.sin(t * 0.0009 + i * 1.9);
          for (j = 0; j < g.mem.length; j++) {
            var px = g.mem[j].hx + g.mem[j].dx, py = g.mem[j].hy + g.mem[j].dy;
            var vx = px - cx, vy = py - cy, vl = Math.sqrt(vx * vx + vy * vy) || 1;
            pts.push({ x: px + vx / vl * breathe, y: py + vy / vl * breathe });
          }
          var hp = hull(pts);
          if (hp.length < 3) continue;
          ctx.beginPath();                         // smooth closed curve through hull midpoints
          var m0x = (hp[0].x + hp[1].x) / 2, m0y = (hp[0].y + hp[1].y) / 2;
          ctx.moveTo(m0x, m0y);
          for (j = 1; j <= hp.length; j++) {
            var p1 = hp[j % hp.length], p2 = hp[(j + 1) % hp.length];
            ctx.quadraticCurveTo(p1.x, p1.y, (p1.x + p2.x) / 2, (p1.y + p2.y) / 2);
          }
          ctx.closePath();
          ctx.globalAlpha = 0.09; ctx.fillStyle = g.color; ctx.fill();
          ctx.globalAlpha = 0.4; ctx.strokeStyle = g.color; ctx.lineWidth = 1.2; ctx.stroke();
        }

        // the sparse base net — thin, quiet
        ctx.strokeStyle = P.soft; ctx.lineWidth = 1; ctx.globalAlpha = 0.38;
        ctx.beginPath();
        for (i = 0; i < base.length; i++) {
          var e = base[i];
          ctx.moveTo(e.a.hx + e.a.dx, e.a.hy + e.a.dy);
          ctx.lineTo(e.b.hx + e.b.dx, e.b.hy + e.b.dy);
        }
        ctx.stroke();

        // the ONE selected atelier connects to its local group
        if (act.i >= 0 && act.amt > 0.03) {
          var a = nds[act.i], ax = a.hx + a.dx, ay = a.hy + a.dy;
          ctx.save();
          ctx.setLineDash([4, 4]);
          ctx.strokeStyle = P.soft; ctx.lineWidth = 1;
          ctx.globalAlpha = 0.38 * act.amt;
          ctx.beginPath(); ctx.arc(ax, ay, R_LOCAL, 0, 6.2832); ctx.stroke();
          ctx.restore();
          for (i = 0; i < nds.length; i++) {
            if (i === act.i) continue;
            var n = nds[i];
            var ldx = n.hx + n.dx - ax, ldy = n.hy + n.dy - ay;
            var wgt = gauss(ldx * ldx + ldy * ldy, R_LOCAL * 0.85) * act.amt;
            if (wgt < 0.08) continue;
            ctx.globalAlpha = 0.85 * wgt;
            ctx.strokeStyle = a.color;
            ctx.lineWidth = 1.5;
            ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(n.hx + n.dx, n.hy + n.dy); ctx.stroke();
          }
        }

        // ateliers — small, breathing; only the selected one grows
        for (i = 0; i < nds.length; i++) {
          var nd = nds[i];
          var r = (2.4 + 0.5 * nd.deg) * (0.95 + 0.05 * Math.sin(t * 0.0016 + nd.ph));
          if (i === act.i) r += 2.2 * act.amt;
          ctx.globalAlpha = 0.85;
          ctx.fillStyle = nd.color;
          ctx.beginPath(); ctx.arc(nd.hx + nd.dx, nd.hy + nd.dy, r, 0, 6.2832); ctx.fill();
        }
        ctx.globalAlpha = 1;
      }
    };
  }

  /* ============================================================
     Scene 8 · blanken — the masterplan as negotiable geometry.
     Density-coloured parcels sit on a street grid; the proposed
     tram line runs across them, its vertices snapping toward the
     cursor. Wherever the line crosses a parcel, the parcel is CUT
     along it — the halves part like a design decision taking
     effect, wider near the cursor — and a tram dot rides the line.
     ============================================================ */
  function makeBlanken() {
    var w = 0, h = 0, parcels = [], pts = [], tramS = 0;
    var curT = 0, cen = { x: 0, y: 0, amt: 0 };
    var LINE_U = [[-0.02, 0.9], [0.3, 0.68], [0.62, 0.32], [1.02, 0.13]];
    var ROWS = [[0.08, 0.27], [0.38, 0.6], [0.72, 0.93]];
    var COLS = [[0.06, 0.27], [0.34, 0.58], [0.65, 0.81], [0.87, 0.98]];

    function area(poly) {
      var s = 0;
      for (var i = 0; i < poly.length; i++) {
        var p = poly[i], q = poly[(i + 1) % poly.length];
        s += p.x * q.y - q.x * p.y;
      }
      return Math.abs(s / 2);
    }
    function clipHalf(poly, ax, ay, nx, ny) {     // keep the side where (p-a)·n ≥ 0
      var out = [];
      for (var i = 0; i < poly.length; i++) {
        var p = poly[i], q = poly[(i + 1) % poly.length];
        var dp = (p.x - ax) * nx + (p.y - ay) * ny;
        var dq = (q.x - ax) * nx + (q.y - ay) * ny;
        if (dp >= 0) out.push(p);
        if ((dp >= 0) !== (dq >= 0)) {
          var tt = dp / (dp - dq);
          out.push({ x: p.x + (q.x - p.x) * tt, y: p.y + (q.y - p.y) * tt });
        }
      }
      return out;
    }
    function fillPoly(ctx, poly, ox, oy) {
      ctx.beginPath();
      ctx.moveTo(poly[0].x + ox, poly[0].y + oy);
      for (var i = 1; i < poly.length; i++) ctx.lineTo(poly[i].x + ox, poly[i].y + oy);
      ctx.closePath(); ctx.fill();
    }

    return {
      init: function (cw, ch) {
        w = cw; h = ch; parcels = []; pts = []; tramS = 0;
        var COLORS = [P.blue, P.red, P.yellow, "#9aa3ad"];
        var ci = 0;
        for (var r = 0; r < ROWS.length; r++) {
          for (var c = 0; c < COLS.length; c++) {
            var x0 = COLS[c][0] * w, x1 = COLS[c][1] * w;
            var y0 = ROWS[r][0] * h, y1 = ROWS[r][1] * h;
            parcels.push({
              poly: [{ x: x0, y: y0 }, { x: x1, y: y0 }, { x: x1, y: y1 }, { x: x0, y: y1 }],
              cx: (x0 + x1) / 2, cy: (y0 + y1) / 2,
              color: COLORS[(ci++) % COLORS.length],
              op: rand(0.34, 0.55)
            });
          }
        }
        for (var k = 0; k < LINE_U.length; k++) {
          pts.push({
            hx: LINE_U[k][0] * w, hy: LINE_U[k][1] * h,
            x: LINE_U[k][0] * w, y: LINE_U[k][1] * h,
            ph: rand(0, 6.28)
          });
        }
      },
      step: function (dt, t, ptr) {
        curT = t;
        var amt = ptr.over ? ptr.inf : (COARSE ? 0.85 : ptr.inf);
        cen.x = ptr.x; cen.y = ptr.y; cen.amt = ptr.over ? amt : 0;
        for (var k = 0; k < pts.length; k++) {
          var p = pts[k];
          // ambient sway keeps the cut alive; the cursor snaps vertices toward it
          var tx = p.hx + 5 * Math.sin(t * 0.00042 + p.ph);
          var ty = p.hy + 8 * Math.sin(t * 0.00033 + p.ph * 1.9) * (COARSE || ptr.over ? 1 : amt);
          if (ptr.over) {
            var ddx = ptr.x - p.hx, ddy = ptr.y - p.hy;
            var g = 0.6 * gauss(ddx * ddx + ddy * ddy, 105) * ptr.inf;
            tx += ddx * g; ty += ddy * g;
          }
          p.x += (tx - p.x) * Math.min(0.09 * dt, 1);
          p.y += (ty - p.y) * Math.min(0.09 * dt, 1);
        }
        tramS += 0.0014 * dt;
        if (tramS > 1) tramS -= 1;
      },
      draw: function (ctx, cw, ch) {
        var i, k;
        ctx.fillStyle = P.tint; ctx.fillRect(0, 0, cw, ch);

        // street grid between the parcel rows/columns
        ctx.strokeStyle = P.hair; ctx.lineWidth = 1.5; ctx.globalAlpha = 1;
        ctx.beginPath();
        for (i = 0; i < ROWS.length - 1; i++) {
          var gy = (ROWS[i][1] + ROWS[i + 1][0]) / 2 * ch;
          ctx.moveTo(0, gy); ctx.lineTo(cw, gy);
        }
        for (i = 0; i < COLS.length - 1; i++) {
          var gx = (COLS[i][1] + COLS[i + 1][0]) / 2 * cw;
          ctx.moveTo(gx, 0); ctx.lineTo(gx, ch);
        }
        ctx.stroke();

        // parcels — cut along whichever tram segment crosses them
        for (i = 0; i < parcels.length; i++) {
          var pc = parcels[i];
          var cut = null;
          for (k = 0; k < pts.length - 1; k++) {
            var a = pts[k], b = pts[k + 1];
            // quick bbox reject against the parcel
            if (Math.max(a.x, b.x) < pc.poly[0].x || Math.min(a.x, b.x) > pc.poly[1].x ||
                Math.max(a.y, b.y) < pc.poly[0].y || Math.min(a.y, b.y) > pc.poly[2].y) continue;
            var nx = -(b.y - a.y), ny = b.x - a.x;
            var nl = Math.sqrt(nx * nx + ny * ny) || 1;
            nx /= nl; ny /= nl;
            var h1 = clipHalf(pc.poly, a.x, a.y, nx, ny);
            var h2 = clipHalf(pc.poly, a.x, a.y, -nx, -ny);
            if (h1.length > 2 && h2.length > 2 && area(h1) > 12 && area(h2) > 12) {
              cut = { h1: h1, h2: h2, nx: nx, ny: ny };
              break;
            }
          }
          ctx.globalAlpha = pc.op;
          ctx.fillStyle = pc.color;
          if (cut) {
            var ddx = pc.cx - cen.x, ddy = pc.cy - cen.y;
            var gap = 2.4 + 7 * gauss(ddx * ddx + ddy * ddy, 95) * cen.amt;
            fillPoly(ctx, cut.h1, cut.nx * gap, cut.ny * gap);
            fillPoly(ctx, cut.h2, -cut.nx * gap, -cut.ny * gap);
          } else {
            fillPoly(ctx, pc.poly, 0, 0);
          }
        }

        // the tram line, its stops, and the tram
        ctx.save();
        ctx.setLineDash([7, 4]);
        ctx.strokeStyle = P.soft; ctx.lineWidth = 2.4; ctx.globalAlpha = 0.75;
        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        for (k = 1; k < pts.length; k++) ctx.lineTo(pts[k].x, pts[k].y);
        ctx.stroke();
        ctx.restore();
        for (k = 1; k < pts.length - 1; k++) {     // interior points = suggested stops
          ctx.globalAlpha = 0.95;
          ctx.fillStyle = P.tint; ctx.strokeStyle = P.soft; ctx.lineWidth = 2.2;
          ctx.beginPath(); ctx.arc(pts[k].x, pts[k].y, 5, 0, 6.2832); ctx.fill(); ctx.stroke();
        }
        // tram dot riding the polyline (arc-length parametrised)
        var lens = [], total = 0;
        for (k = 0; k < pts.length - 1; k++) {
          var sdx = pts[k + 1].x - pts[k].x, sdy = pts[k + 1].y - pts[k].y;
          var sl = Math.sqrt(sdx * sdx + sdy * sdy);
          lens.push(sl); total += sl;
        }
        var dist = tramS * total;
        for (k = 0; k < lens.length; k++) {
          if (dist <= lens[k] || k === lens.length - 1) {
            var f = clamp(dist / (lens[k] || 1), 0, 1);
            ctx.globalAlpha = 0.95; ctx.fillStyle = P.ochre;
            ctx.beginPath();
            ctx.arc(lerp(pts[k].x, pts[k + 1].x, f), lerp(pts[k].y, pts[k + 1].y, f), 3.4, 0, 6.2832);
            ctx.fill();
            break;
          }
          dist -= lens[k];
        }
        ctx.globalAlpha = 1;
      }
    };
  }

  /* ---------------- engine ---------------- */
  var SCENES = { unfall: makeUnfall, toolbox: makeToolbox, flows: makeFlows, dcities: makeDcities, miner: makeMiner, frontage: makeFrontage, sishane: makeSishane, blanken: makeBlanken };
  var DPR_CAP = 2;
  /* touch devices have no hover, so the hover-gate would keep scenes dead
     forever there — instead visible cards play on their own (the IO already
     limits that to what's on screen), and a finger down on a card drives
     the cursor effects like the mouse does */
  var COARSE = window.matchMedia &&
    window.matchMedia("(hover: none), (pointer: coarse)").matches;
  /* a touch almost never ends cleanly — a slight drift fires pointercancel
     (scroll takeover). So a finger is a latched trigger: lift/cancel starts a
     hold window instead of dropping the hover state, and the frame loop lets
     it expire (mirrors boids.js P_IDLE). */
  var TOUCH_HOLD = 2500;
  var MOUSE = { cx: 0, cy: 0, seen: false, touchUntil: 0 };
  var rectsDirty = true;
  var recs = [], running = false, raf = null, lastTs = 0;

  Array.prototype.forEach.call(medias, function (media) {
    var make = SCENES[media.getAttribute("data-art")];
    if (!make) return;                            // unknown name (e.g. a screenshot) — skip
    var canvas = document.createElement("canvas");
    canvas.className = "card-canvas";
    canvas.setAttribute("aria-hidden", "true");
    if (!canvas.getContext) return;
    var ctx = canvas.getContext("2d");
    if (!ctx) return;
    media.appendChild(canvas);
    recs.push({
      media: media, canvas: canvas, ctx: ctx, scene: make(),
      w: 0, h: 0, rect: null, visible: false, sized: false,
      sizeDirty: false, live: false, inf: 0, primed: false
    });
  });
  if (!recs.length) return;

  function fit(rec) {
    var rect = rec.canvas.getBoundingClientRect();
    if (rect.width < 1 || rect.height < 1) return false;   // hidden panel — retry later
    var dpr = Math.min(window.devicePixelRatio || 1, DPR_CAP);
    rec.rect = rect; rec.w = rect.width; rec.h = rect.height;
    rec.canvas.width = Math.round(rect.width * dpr);
    rec.canvas.height = Math.round(rect.height * dpr);
    rec.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    rec.scene.init(rec.w, rec.h);
    rec.sized = true; rec.sizeDirty = false;
    return true;
  }

  function anyVisible() {
    for (var i = 0; i < recs.length; i++) if (recs[i].visible) return true;
    return false;
  }

  function frame(ts) {
    if (!running) return;
    var dt = lastTs ? clamp((ts - lastTs) / 16.667, 0, 2) : 1;
    lastTs = ts;
    if (rectsDirty) {
      for (var k = 0; k < recs.length; k++) {
        if (recs[k].visible && recs[k].sized) recs[k].rect = recs[k].canvas.getBoundingClientRect();
      }
      rectsDirty = false;
    }
    if (MOUSE.touchUntil && ts > MOUSE.touchUntil) {
      MOUSE.seen = false; MOUSE.touchUntil = 0;          // latched touch expired
    }
    var alive = false;
    for (var i = 0; i < recs.length; i++) {
      var r = recs[i];
      if (!r.visible) continue;
      alive = true;
      if (!r.sized || r.sizeDirty) {
        if (!fit(r)) continue;
        // a live card refit after resize: repaint its frozen frame
        if (r.live) r.scene.draw(r.ctx, r.w, r.h);
      }
      // prime: every card shows its scene's OWN first frame at rest (same
      // algorithm as the animation — the SVG below is only the no-JS /
      // motion-off / print fallback), then freezes until the cursor arrives
      if (!r.primed) {
        r.scene.step(dt, ts, { x: -9999, y: -9999, over: false, seen: false, inf: 0 });
        r.scene.draw(r.ctx, r.w, r.h);
        r.primed = true;
        if (!r.live) { r.live = true; r.media.classList.add("is-live"); }
      }
      var x = MOUSE.cx - r.rect.left, y = MOUSE.cy - r.rect.top;
      var over = MOUSE.seen && x >= 0 && y >= 0 && x <= r.w && y <= r.h;
      r.inf += ((over ? 1 : 0) - r.inf) * (over ? 0.08 : 0.05);
      // mouse: run under the cursor (+ ease-out tail), else keep the last frame.
      // touch: visible cards play freely; a finger on the card adds the effects.
      if (!COARSE && !over && r.inf < 0.02) continue;
      r.scene.step(dt, ts, { x: x, y: y, over: over, seen: MOUSE.seen, inf: r.inf });
      r.scene.draw(r.ctx, r.w, r.h);
      if (!r.live) { r.live = true; r.media.classList.add("is-live"); }
    }
    if (!alive) { running = false; raf = null; return; }   // self-halt; IO restarts us
    raf = window.requestAnimationFrame(frame);
  }

  function start() {
    if (running || document.hidden || motionOff()) return;
    running = true; lastTs = 0;
    raf = window.requestAnimationFrame(frame);
  }
  function stop() { running = false; if (raf) window.cancelAnimationFrame(raf); raf = null; }
  function maybeStart() { if (anyVisible()) start(); }

  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      for (var i = 0; i < entries.length; i++) {
        var e = entries[i];
        for (var j = 0; j < recs.length; j++) {
          if (recs[j].canvas === e.target) {
            recs[j].visible = e.isIntersecting;
            if (e.isIntersecting && recs[j].sized) recs[j].rect = e.boundingClientRect;
          }
        }
      }
      maybeStart();
    }, { threshold: 0.01 });
    for (var oi = 0; oi < recs.length; oi++) io.observe(recs[oi].canvas);
  } else {
    for (var fi = 0; fi < recs.length; fi++) recs[fi].visible = true;
    maybeStart();
  }

  function trackPointer(e) {
    MOUSE.cx = e.clientX; MOUSE.cy = e.clientY; MOUSE.seen = true;
    MOUSE.touchUntil = 0;                                // contact live — no expiry running
  }
  function releaseTouch(e) {
    if (e.pointerType === "mouse") { MOUSE.seen = false; return; }
    // finger lifted or scroll took over: latch the touch, let the loop expire it
    MOUSE.touchUntil = performance.now() + TOUCH_HOLD;
  }
  window.addEventListener("pointermove", trackPointer, { passive: true });
  window.addEventListener("pointerdown", trackPointer, { passive: true });
  window.addEventListener("pointerup", releaseTouch);
  window.addEventListener("pointercancel", releaseTouch);
  window.addEventListener("scroll", function () { rectsDirty = true; }, { passive: true });
  document.documentElement.addEventListener("mouseleave", function () { MOUSE.seen = false; });

  var rt;
  window.addEventListener("resize", function () {
    clearTimeout(rt);
    rt = setTimeout(function () {
      for (var i = 0; i < recs.length; i++) recs[i].sizeDirty = true;
      rectsDirty = true;
      maybeStart();
    }, 180);
  });

  document.addEventListener("visibilitychange", function () {
    if (document.hidden) stop(); else maybeStart();
  });

  // play/pause toggle (motion.js) — CSS hides the canvases when off
  window.addEventListener("motionchange", function () {
    if (motionOff()) stop(); else maybeStart();
  });
})();
