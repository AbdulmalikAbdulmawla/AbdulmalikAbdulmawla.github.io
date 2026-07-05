/* ============================================================
   Hero motif — a living street network carrying traffic-like
   agents. A nod to Abdulmalik's arc: swarm / cellular-automata
   simulation of natural behaviour → space syntax → urban
   movement and traffic analysis.

   The street graph itself is alive: intersections drift slowly
   around home anchors (Lissajous wander) and links fade out/in
   as their endpoints stretch apart / come back together. The
   agents (Reynolds boids with cohesion ≈ 0) ride the streets
   like two-way traffic — aiming slightly right of the line so
   opposing streams pass each other, braking behind slower
   agents ahead — and the cursor reroutes them at intersections
   instead of pulling them off the network.

   Vanilla canvas, no deps. Decorative + aria-hidden. Freezes to
   a single static frame while <html> carries `motion-off` (the
   OS reduced-motion preference or the site's pause toggle — see
   motion.js), and pauses when the hero is off-screen or the tab
   is hidden.
   ============================================================ */
(function () {
  "use strict";

  var canvas = document.querySelector(".hero-canvas");
  if (!canvas || !canvas.getContext) return;
  var ctx = canvas.getContext("2d");

  var PALETTE = ["#2b6cb0", "#c8452f", "#e0a92e"];      // muted Bauhaus trio
  var EDGE = "rgba(31,41,51,0.09)";                     // secondary streets
  var EDGE_MAIN = "rgba(31,41,51,0.30)";               // arterials (main roads) — heavier
  var MAIN_W = 2.2;                                     // arterial stroke width
  var NODE = "rgba(31,41,51,0.14)";

  /* effective motion state, resolved onto <html> by the inline
     head script and flipped live by the motion.js toggle */
  function motionOff() {
    return document.documentElement.classList.contains("motion-off");
  }
  var DPR = Math.min(window.devicePixelRatio || 1, 2);

  var W = 0, H = 0, nodes = [], edges = [], boids = [], raf = null, running = false;

  /* ---- cursor state (canvas-local coords) ---- */
  var PTR = { x: 0, y: 0, active: false, last: 0 };
  var ptrInf = 0;                          // eased 0..1 cursor influence
  var heroRect = null, heroRectDirty = true;
  var P_IDLE = 2500,                       // ms without movement → cursor influence releases
      P_BOOST = 0.35,                      // traffic speeds up toward the cursor by up to this
      P_ROUTE = 0.75;                      // chance a hop routes toward the cursor while it leads

  /* ---- living-network tuning ---- */
  var CELL = 118,                          // grid spacing (matches the original static look)
      DRIFT_A1 = 9, DRIFT_A2 = 16,         // px node-wander amplitude range
      DRIFT_T1 = 6250, DRIFT_T2 = 17500,   // ms node-wander period range (4× faster drift)
      LINK_FADE = 0.025,                   // link alpha easing per frame (fade, never pop)
      LIVE = 0.35;                         // a link is routable above this alpha

  /* ---- traffic tuning ---- */
  var R = 66, R2 = 24,                     // neighbour / separation radii
      W_ALIGN = 0.3,                       // whisper of alignment (streets do the aligning)
      W_SEP = 0.8,                         // avoid collisions only a bit
      W_SEEK = 1.8,                        // strong pull onto the street being travelled
      LANE = 5,                            // aim this far right of the line → two-way lanes
      AHEAD = 30,                          // look-ahead distance for car-following
      CRUISE_LO = 0.35, CRUISE_HI = 0.675, // per-agent cruise speed range (px/frame — half speed, calmer)
      V_MIN = 0.1, V_MAX = 0.95;           // hard safety clamp

  /* ---- road hierarchy: 2 horizontal + 3 vertical arterials ---- */
  var MAIN_SHARE = 0.75,                    // fraction of agents that ride the main roads
      MAIN_BIAS = 0.88;                     // a main agent's chance of staying on an arterial at a hop

  function rand(a, b) { return a + Math.random() * (b - a); }

  /* ---- living street network: jittered grid of wandering nodes;
          candidate links (orthogonal + diagonal) live and die by a
          stretch-ratio hysteresis as the nodes drift ---- */
  function buildNetwork() {
    nodes = []; edges = [];
    var cols = Math.max(2, Math.ceil(W / CELL) + 1);
    var rows = Math.max(2, Math.ceil(H / CELL) + 1);
    var grid = [];
    for (var r = 0; r < rows; r++) {
      grid[r] = [];
      for (var c = 0; c < cols; c++) {
        var n = {
          hx: c * CELL + rand(-CELL * 0.28, CELL * 0.28),   // home anchor
          hy: r * CELL + rand(-CELL * 0.28, CELL * 0.28),
          x: 0, y: 0,
          a1: rand(DRIFT_A1, DRIFT_A2), a2: rand(DRIFT_A1, DRIFT_A2),
          f1: (Math.PI * 2) / rand(DRIFT_T1, DRIFT_T2),     // rad per ms
          f2: (Math.PI * 2) / rand(DRIFT_T1, DRIFT_T2),
          p1: rand(0, Math.PI * 2), p2: rand(0, Math.PI * 2),
          cand: []                                           // candidate edges at this node
        };
        grid[r][c] = n;
        nodes.push(n);
      }
    }
    driftNodes(performance.now());

    // arterials: 2 horizontal rows + 3 vertical cols, ~equally spaced (snapped
    // to the nearest grid line). Their edges are the "main roads".
    var artRow = {}, artCol = {};
    artRow[Math.round(rows / 3)] = 1; artRow[Math.round(rows * 2 / 3)] = 1;
    artCol[Math.round(cols / 4)] = 1; artCol[Math.round(cols / 2)] = 1; artCol[Math.round(cols * 3 / 4)] = 1;

    // candidate links: orthogonal ones start alive (~15% dropped for
    // irregularity, as before); diagonals start dark and only light up
    // when the drift compresses them — that's the visible churn. Arterial
    // edges are permanent (never dropped, never fade) so main roads persist.
    function link(a, b, diag, art) {
      if (!art && !diag && Math.random() < 0.15) return;     // permanent drop (arterials exempt)
      var dx = b.x - a.x, dy = b.y - a.y;
      var e = {
        a: a, b: b, art: !!art,
        L0: Math.sqrt(dx * dx + dy * dy) || 1,               // rest length (stretch r = 1 now)
        ron: diag ? 0.965 : 1.045,                           // live when r < ron …
        roff: diag ? 1.005 : 1.11,                           // … dead when r > roff (hysteresis)
        live: art ? true : !diag,
        alpha: (art || !diag) ? 1 : 0
      };
      edges.push(e);
      a.cand.push(e); b.cand.push(e);
      if (art) { a.art = true; b.art = true; }
    }
    for (var r2 = 0; r2 < rows; r2++) {
      for (var c2 = 0; c2 < cols; c2++) {
        if (c2 + 1 < cols) link(grid[r2][c2], grid[r2][c2 + 1], false, artRow[r2]);
        if (r2 + 1 < rows) link(grid[r2][c2], grid[r2 + 1][c2], false, artCol[c2]);
        if (c2 + 1 < cols && r2 + 1 < rows) link(grid[r2][c2], grid[r2 + 1][c2 + 1], true, false);
        if (c2 > 0 && r2 + 1 < rows) link(grid[r2][c2], grid[r2 + 1][c2 - 1], true, false);
      }
    }
    // guarantee every node keeps at least one always-on link
    for (var i = 0; i < nodes.length; i++) {
      var alive = false, cl = nodes[i].cand;
      for (var k = 0; k < cl.length; k++) if (cl[k].live) { alive = true; break; }
      if (!alive && cl.length) { cl[0].live = true; cl[0].alpha = 1; cl[0].ron = 9; cl[0].roff = 99; }
    }
  }

  function driftNodes(now) {
    for (var i = 0; i < nodes.length; i++) {
      var n = nodes[i];
      n.x = n.hx + n.a1 * Math.sin(now * n.f1 + n.p1);
      n.y = n.hy + n.a2 * Math.sin(now * n.f2 + n.p2);
    }
  }

  function updateNetwork(now) {
    driftNodes(now);
    for (var i = 0; i < edges.length; i++) {
      var e = edges[i];
      if (e.art) continue;                 // main roads never fade or die
      var dx = e.b.x - e.a.x, dy = e.b.y - e.a.y;
      var r = Math.sqrt(dx * dx + dy * dy) / e.L0;
      if (e.live) { if (r > e.roff) e.live = false; }
      else if (r < e.ron) e.live = true;
      e.alpha += ((e.live ? 1 : 0) - e.alpha) * LINK_FADE;
    }
  }

  /* next node from b.cur: live links only, no immediate U-turn unless
     forced; while the cursor leads, pick the neighbour nearest it; otherwise
     main-road agents prefer to stay on arterials */
  function pickNext(b) {
    var c = b.cur, list = [], k, e, o;    // list entries: { o: node, art: bool }
    for (k = 0; k < c.cand.length; k++) {
      e = c.cand[k];
      if (e.alpha <= LIVE) continue;
      o = (e.a === c) ? e.b : e.a;
      if (o !== b.prev) list.push({ o: o, art: e.art });
    }
    if (!list.length) {                    // dead end: allow the U-turn / any candidate
      for (k = 0; k < c.cand.length; k++) {
        e = c.cand[k];
        o = (e.a === c) ? e.b : e.a;
        if (e.alpha > LIVE || e.live) list.push({ o: o, art: e.art });
      }
    }
    if (!list.length) return b.prev || c;
    // cursor leads: head toward it regardless of tier
    if (ptrInf > 0.1 && Math.random() < P_ROUTE) {
      var pick = list[0].o, best = Infinity;
      for (k = 0; k < list.length; k++) {
        var ddx = list[k].o.x - PTR.x, ddy = list[k].o.y - PTR.y, dd = ddx * ddx + ddy * ddy;
        if (dd < best) { best = dd; pick = list[k].o; }
      }
      return pick;
    }
    // main-road agents usually keep to the arterials
    if (b.tier === "main" && Math.random() < MAIN_BIAS) {
      var art = [];
      for (k = 0; k < list.length; k++) if (list[k].art) art.push(list[k].o);
      if (art.length) return art[(Math.random() * art.length) | 0];
    }
    return list[(Math.random() * list.length) | 0].o;
  }

  function nearestNode(x, y) {
    var best = nodes[0], bd = Infinity;
    for (var i = 0; i < nodes.length; i++) {
      var dx = nodes[i].x - x, dy = nodes[i].y - y, d = dx * dx + dy * dy;
      if (d < bd) { bd = d; best = nodes[i]; }
    }
    return best;
  }

  function initBoids() {
    boids = [];
    var count = Math.round(W / 22);        // agent density
    count = Math.max(20, Math.min(count, 68));
    // arterial nodes to spawn main-road agents on (fallback: any node)
    var artNodes = nodes.filter(function (n) { return n.art; });
    if (!artNodes.length) artNodes = nodes;
    var nMain = Math.round(count * MAIN_SHARE);
    for (var i = 0; i < count; i++) {
      var main = i < nMain;
      var start = main
        ? artNodes[(Math.random() * artNodes.length) | 0]
        : nodes[(Math.random() * nodes.length) | 0];
      var ang = rand(0, Math.PI * 2);
      var cruise = rand(CRUISE_LO, CRUISE_HI);
      var b = {
        x: start.x, y: start.y,
        vx: Math.cos(ang), vy: Math.sin(ang),
        cur: start, prev: null, target: null,
        tier: main ? "main" : "secondary",
        cruise: cruise, spd: cruise,       // own cruise speed + eased actual speed
        color: PALETTE[i % PALETTE.length]
      };
      b.target = pickNext(b);
      boids.push(b);
    }
  }

  function step(now) {
    // ease cursor influence in/out — engagement and release never snap
    var pTgt = (PTR.active && now - PTR.last < P_IDLE) ? 1 : 0;
    ptrInf += (pTgt - ptrInf) * (pTgt > ptrInf ? 0.06 : 0.04);

    updateNetwork(now);

    for (var i = 0; i < boids.length; i++) {
      var b = boids[i];
      var sepx = 0, sepy = 0, alx = 0, aly = 0, n = 0;
      var leadSp = -1;                     // slowest same-direction agent just ahead
      for (var j = 0; j < boids.length; j++) {
        if (i === j) continue;
        var o = boids[j], dx = b.x - o.x, dy = b.y - o.y;
        var d2 = dx * dx + dy * dy;
        if (d2 < R * R && d2 > 0) {
          n++;
          alx += o.vx; aly += o.vy;
          if (d2 < R2 * R2) { var d = Math.sqrt(d2); sepx += dx / d; sepy += dy / d; }
          // car-following: an agent ahead of us, heading roughly our way
          if (d2 < AHEAD * AHEAD &&
              (-dx * b.vx - dy * b.vy) > 0 &&
              (b.vx * o.vx + b.vy * o.vy) > 0) {
            if (leadSp < 0 || o.spd < leadSp) leadSp = o.spd;
          }
        }
      }
      var ax = 0, ay = 0;
      if (n) {
        alx /= n; aly /= n; ax += alx * W_ALIGN; ay += aly * W_ALIGN;   // alignment (whisper)
        ax += sepx * W_SEP; ay += sepy * W_SEP;                         // separation (only a bit)
        // cohesion deliberately ≈ 0 — traffic, not a flock
      }
      // ride the street: hop at the intersection, otherwise aim slightly
      // RIGHT of the line toward the target node (two-way lanes)
      var tx = b.target.x - b.x, ty = b.target.y - b.y;
      var td = Math.sqrt(tx * tx + ty * ty) || 1;
      if (td < 26) {
        b.prev = b.cur; b.cur = b.target; b.target = pickNext(b);
      } else {
        var ex = b.target.x - b.cur.x, ey = b.target.y - b.cur.y;
        var el = Math.sqrt(ex * ex + ey * ey) || 1;
        var mx = b.target.x - (ey / el) * LANE - b.x;    // right-hand perp offset
        var my = b.target.y + (ex / el) * LANE - b.y;
        var md = Math.sqrt(mx * mx + my * my) || 1;
        ax += (mx / md) * W_SEEK; ay += (my / md) * W_SEEK;
      }

      // speed: own cruise (+cursor boost), braking behind a slower leader;
      // brake quickly, accelerate lazily — reads as traffic
      var desired = b.cruise * (1 + P_BOOST * ptrInf);
      if (leadSp >= 0 && leadSp < desired) desired = Math.max(leadSp * 0.9, V_MIN);
      b.spd += (desired - b.spd) * (desired < b.spd ? 0.15 : 0.03);

      b.vx += ax * 0.06; b.vy += ay * 0.06;
      var sp = Math.sqrt(b.vx * b.vx + b.vy * b.vy) || 1;
      var v = Math.max(V_MIN, Math.min(b.spd, V_MAX));
      b.vx = b.vx / sp * v; b.vy = b.vy / sp * v;
      b.x += b.vx; b.y += b.vy;
      // toroidal wrap — re-home onto the nearest intersection so the strong
      // street-seek never drags a wrapped agent back across the screen
      var wrapped = false;
      if (b.x < -12) { b.x = W + 12; wrapped = true; }
      else if (b.x > W + 12) { b.x = -12; wrapped = true; }
      if (b.y < -12) { b.y = H + 12; wrapped = true; }
      else if (b.y > H + 12) { b.y = -12; wrapped = true; }
      if (wrapped) { b.cur = nearestNode(b.x, b.y); b.prev = null; b.target = pickNext(b); }
    }
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    // secondary streets — each fades with its own life alpha
    ctx.strokeStyle = EDGE; ctx.lineWidth = 1;
    for (var i = 0; i < edges.length; i++) {
      var e = edges[i];
      if (e.art || e.alpha < 0.02) continue;
      ctx.globalAlpha = e.alpha;
      ctx.beginPath(); ctx.moveTo(e.a.x, e.a.y); ctx.lineTo(e.b.x, e.b.y); ctx.stroke();
    }
    // arterials (main roads) on top — heavier, always solid
    ctx.globalAlpha = 1; ctx.strokeStyle = EDGE_MAIN; ctx.lineWidth = MAIN_W;
    for (var a2 = 0; a2 < edges.length; a2++) {
      var ea = edges[a2];
      if (!ea.art) continue;
      ctx.beginPath(); ctx.moveTo(ea.a.x, ea.a.y); ctx.lineTo(ea.b.x, ea.b.y); ctx.stroke();
    }
    ctx.lineWidth = 1;
    // nodes
    ctx.fillStyle = NODE;
    for (var m = 0; m < nodes.length; m++) {
      ctx.beginPath(); ctx.arc(nodes[m].x, nodes[m].y, 1.8, 0, 6.2832); ctx.fill();
    }
    // boids — small triangles oriented to velocity
    for (var b2 = 0; b2 < boids.length; b2++) {
      var bo = boids[b2], ang = Math.atan2(bo.vy, bo.vx);
      ctx.save();
      ctx.translate(bo.x, bo.y); ctx.rotate(ang);
      ctx.globalAlpha = 0.9; ctx.fillStyle = bo.color;
      ctx.beginPath();
      ctx.moveTo(6, 0); ctx.lineTo(-4, 3.2); ctx.lineTo(-4, -3.2); ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
    ctx.globalAlpha = 1;
  }

  function frame() { if (!running) return; step(performance.now()); draw(); raf = requestAnimationFrame(frame); }
  function start() { if (running || motionOff()) return; running = true; raf = requestAnimationFrame(frame); }
  function stop() { running = false; if (raf) cancelAnimationFrame(raf); raf = null; }

  function resize() {
    var rect = canvas.getBoundingClientRect();
    W = rect.width; H = rect.height;
    canvas.width = Math.round(W * DPR); canvas.height = Math.round(H * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    buildNetwork(); initBoids();
    heroRectDirty = true;
    if (motionOff()) draw();       // one static frame
  }

  var rt;
  window.addEventListener("resize", function () {
    clearTimeout(rt);
    rt = setTimeout(function () { var was = running; stop(); resize(); if (was) start(); }, 180);
  });

  resize();

  // pointer input — listeners on window: the canvas itself is pointer-events:none.
  // Mouse and finger are treated the same: while the pointer leads, agents pick
  // the street toward it at each intersection and speed up a touch (they never
  // leave the network). A tap plants the influence at that spot until the idle
  // timer releases it. When a gesture turns into a page scroll the browser fires
  // pointercancel — mouse releases immediately; touch stays latched so the flow
  // never jerks mid-scroll.
  function setPtr(e) {
    if (heroRectDirty) { heroRect = canvas.getBoundingClientRect(); heroRectDirty = false; }
    PTR.x = e.clientX - heroRect.left; PTR.y = e.clientY - heroRect.top;
    PTR.active = PTR.x >= 0 && PTR.y >= 0 && PTR.x <= W && PTR.y <= H;
    PTR.last = performance.now();
  }
  window.addEventListener("pointermove", setPtr, { passive: true });
  window.addEventListener("pointerdown", setPtr, { passive: true });
  // touch: a slight drift fires pointercancel (scroll takeover) — keep the
  // attractor latched and let the P_IDLE timer release it; mouse still snaps off
  window.addEventListener("pointercancel", function (e) {
    if (e.pointerType === "mouse") PTR.active = false;
  });
  window.addEventListener("scroll", function () { heroRectDirty = true; }, { passive: true });
  document.documentElement.addEventListener("mouseleave", function () { PTR.active = false; });

  // pause when the hero scrolls out of view
  var heroVisible = true;
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (entries) {
      heroVisible = entries[0].isIntersecting;
      heroVisible ? start() : stop();
    }, { threshold: 0.01 }).observe(canvas);
  } else {
    start();
  }
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) stop();
    else if (!("IntersectionObserver" in window)) start();
  });

  // play/pause toggle (motion.js) — resume in place or freeze a clean frame
  window.addEventListener("motionchange", function () {
    if (motionOff()) { stop(); draw(); }
    else if (heroVisible && !document.hidden) start();
  });
})();
