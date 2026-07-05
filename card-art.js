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
     venn    — exchange between three communities
     miner   — live (weighted) least-squares regression
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
     Scene 4 · venn — three breathing communities (Weimar, Amman,
     the workshop cohort) drifting on slow Lissajous paths while
     particles migrate between them along arcs — an exchange
     project. The cursor softly attracts the constellation and
     raises the exchange rate.
     ============================================================ */
  function makeVenn() {
    var w = 0, h = 0, discs = [], parts = [], acc = 0;
    var curT = 0;
    var DEFS = [
      { u: [0.375, 0.5], r: 0.3,   color: "blue" },
      { u: [0.625, 0.5], r: 0.3,   color: "red" },
      { u: [0.5, 0.75],  r: 0.225, color: "yellow" }
    ];

    function spawnParticle(inf) {
      if (parts.length >= 60) return;
      var i = (Math.random() * discs.length) | 0;
      var j = (i + 1 + ((Math.random() * (discs.length - 1)) | 0)) % discs.length;
      var A = discs[i], B = discs[j];
      var mx = (A.x + B.x) / 2, my = (A.y + B.y) / 2;
      var dx = B.x - A.x, dy = B.y - A.y;
      var bend = rand(-0.4, 0.4);
      parts.push({
        from: i, to: j, s: 0, sp: rand(0.006, 0.013),
        ax: A.x, ay: A.y, bx: B.x, by: B.y,
        cx: mx - dy * bend, cy: my + dx * bend,
        color: A.color
      });
    }

    return {
      init: function (cw, ch) {
        w = cw; h = ch; discs = []; parts = []; acc = 0;
        var rs = Math.min(w / 1.6, h);            // radius scale keeps the trio inside
        for (var i = 0; i < DEFS.length; i++) {
          var d = DEFS[i];
          discs.push({
            bx: d.u[0] * w, by: d.u[1] * h, r: d.r * rs, color: P[d.color],
            fx: rand(0.00013, 0.00023), fy: rand(0.0001, 0.0002),
            px: rand(0, 6.28), py: rand(0, 6.28), x: 0, y: 0
          });
        }
      },
      step: function (dt, t, ptr) {
        curT = t;
        for (var i = 0; i < discs.length; i++) {
          var d = discs[i];
          d.x = d.bx + 7 * Math.sin(t * d.fx + d.px);
          d.y = d.by + 5 * Math.sin(t * d.fy + d.py);
          if (ptr.over) {                          // constellation follows, softly
            d.x += (ptr.x - d.bx) * 0.08 * ptr.inf;
            d.y += (ptr.y - d.by) * 0.08 * ptr.inf;
          }
        }
        acc += dt * 16.667 * (1 + 1.5 * (ptr.over ? ptr.inf : 0));
        if (acc > 620) { acc = 0; spawnParticle(); }
        for (var m = parts.length - 1; m >= 0; m--) {
          var p = parts[m];
          p.s += p.sp * dt;
          if (p.s >= 1) { parts.splice(m, 1); }
        }
      },
      draw: function (ctx, cw, ch) {
        ctx.fillStyle = P.tint; ctx.fillRect(0, 0, cw, ch);

        ctx.globalCompositeOperation = "multiply";
        for (var i = 0; i < discs.length; i++) {
          var d = discs[i];
          var breathe = 1 + 0.03 * Math.sin(curT * 0.0011 + i * 2.1);
          ctx.globalAlpha = 0.38;
          ctx.fillStyle = d.color;
          ctx.beginPath(); ctx.arc(d.x, d.y, d.r * breathe, 0, 6.2832); ctx.fill();
        }
        ctx.globalCompositeOperation = "source-over";

        for (var m = 0; m < parts.length; m++) {
          var p = parts[m], t1 = p.s, u = 1 - t1;
          // quadratic arc from source to destination disc centre
          var x = u * u * p.ax + 2 * u * t1 * p.cx + t1 * t1 * p.bx;
          var y = u * u * p.ay + 2 * u * t1 * p.cy + t1 * t1 * p.by;
          ctx.globalAlpha = 0.85 * Math.min(p.s / 0.12, (1 - p.s) / 0.12, 1);
          ctx.fillStyle = p.color;
          ctx.beginPath(); ctx.arc(x, y, 1.9, 0, 6.2832); ctx.fill();
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

  /* ---------------- engine ---------------- */
  var SCENES = { unfall: makeUnfall, toolbox: makeToolbox, flows: makeFlows, venn: makeVenn, miner: makeMiner, frontage: makeFrontage };
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
      sizeDirty: false, live: false, inf: 0
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
