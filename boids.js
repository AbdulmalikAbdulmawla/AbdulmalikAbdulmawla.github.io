/* ============================================================
   Hero motif — boids flocking across a street network.
   A nod to Abdulmalik's arc: from swarm / cellular-automata
   simulation of natural behaviour → urban movement, traffic
   and spatial-economic analysis. The flock (Reynolds boids)
   migrates node-to-node along a procedural street graph.
   The cursor is an attractor: the flock streams toward it and
   orbits it, then drifts back to the streets on leave / idle.

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
  var EDGE = "rgba(31,41,51,0.09)";
  var NODE = "rgba(31,41,51,0.14)";

  /* effective motion state, resolved onto <html> by the inline
     head script and flipped live by the motion.js toggle */
  function motionOff() {
    return document.documentElement.classList.contains("motion-off");
  }
  var DPR = Math.min(window.devicePixelRatio || 1, 2);

  var W = 0, H = 0, nodes = [], boids = [], raf = null, running = false;

  /* ---- cursor attractor state (canvas-local coords) ---- */
  var PTR = { x: 0, y: 0, active: false, last: 0 };
  var ptrInf = 0;                          // eased 0..1 cursor influence
  var heroRect = null, heroRectDirty = true;
  var P_SEEK = 1.1,                        // pull toward the cursor (waypoint seek is 0.55)
      P_ORBIT_R = 90,                      // inside this radius: orbit instead of seek
      P_ORBIT = 0.9,                       // tangential (CCW) orbit force
      P_RING = 1.2,                        // radial spring toward the orbit ring
      P_IDLE = 2500;                       // ms without movement → release the flock

  function rand(a, b) { return a + Math.random() * (b - a); }

  /* ---- procedural street network: jittered grid + neighbour links ---- */
  function buildNetwork() {
    nodes = [];
    var cell = 118;
    var cols = Math.max(2, Math.ceil(W / cell) + 1);
    var rows = Math.max(2, Math.ceil(H / cell) + 1);
    var grid = [];
    for (var r = 0; r < rows; r++) {
      grid[r] = [];
      for (var c = 0; c < cols; c++) {
        var n = {
          x: c * cell + rand(-cell * 0.28, cell * 0.28),
          y: r * cell + rand(-cell * 0.28, cell * 0.28),
          nbrs: []
        };
        grid[r][c] = n;
        nodes.push(n);
      }
    }
    // link to right + bottom neighbours (planar grid), drop ~15% for irregularity
    function link(a, b) { if (Math.random() > 0.15) { a.nbrs.push(b); b.nbrs.push(a); } }
    for (var r2 = 0; r2 < rows; r2++) {
      for (var c2 = 0; c2 < cols; c2++) {
        if (c2 + 1 < cols) link(grid[r2][c2], grid[r2][c2 + 1]);
        if (r2 + 1 < rows) link(grid[r2][c2], grid[r2 + 1][c2]);
      }
    }
    // guarantee no isolated nodes
    for (var i = 0; i < nodes.length; i++) {
      if (!nodes[i].nbrs.length) nodes[i].nbrs.push(nodes[(i + 1) % nodes.length]);
    }
  }

  function initBoids() {
    boids = [];
    var count = Math.round(W / 26);
    count = Math.max(16, Math.min(count, 58));
    for (var i = 0; i < count; i++) {
      var start = nodes[(Math.random() * nodes.length) | 0];
      var ang = rand(0, Math.PI * 2);
      boids.push({
        x: start.x, y: start.y,
        vx: Math.cos(ang), vy: Math.sin(ang),
        cur: start,
        target: start.nbrs[(Math.random() * start.nbrs.length) | 0],
        color: PALETTE[i % PALETTE.length]
      });
    }
  }

  /* ---- Reynolds flocking + weak seek toward the current target node ---- */
  var R = 66, R2 = 24, MAXV = 1.35, MINV = 0.55;

  function step() {
    // ease cursor influence in/out — engagement and release never snap
    var pTgt = (PTR.active && performance.now() - PTR.last < P_IDLE) ? 1 : 0;
    ptrInf += (pTgt - ptrInf) * (pTgt > ptrInf ? 0.06 : 0.04);
    for (var i = 0; i < boids.length; i++) {
      var b = boids[i];
      var sepx = 0, sepy = 0, alx = 0, aly = 0, cohx = 0, cohy = 0, n = 0;
      for (var j = 0; j < boids.length; j++) {
        if (i === j) continue;
        var o = boids[j], dx = b.x - o.x, dy = b.y - o.y;
        var d2 = dx * dx + dy * dy;
        if (d2 < R * R && d2 > 0) {
          n++;
          alx += o.vx; aly += o.vy;
          cohx += o.x; cohy += o.y;
          if (d2 < R2 * R2) { var d = Math.sqrt(d2); sepx += dx / d; sepy += dy / d; }
        }
      }
      var ax = 0, ay = 0;
      if (n) {
        alx /= n; aly /= n; ax += alx * 0.9; ay += aly * 0.9;                 // alignment
        cohx = cohx / n - b.x; cohy = cohy / n - b.y; ax += cohx * 0.010; ay += cohy * 0.010; // cohesion
        var sw = 1.5 * (1 + 0.4 * ptrInf);                                     // separation (boosted at the ring)
        ax += sepx * sw; ay += sepy * sw;
      }
      // cursor attractor — stream toward it from afar; orbit + ring-spring when near
      if (ptrInf > 0.001) {
        var pdx = PTR.x - b.x, pdy = PTR.y - b.y;
        var pd = Math.sqrt(pdx * pdx + pdy * pdy) || 1;
        var pux = pdx / pd, puy = pdy / pd;
        if (pd > P_ORBIT_R) {
          ax += pux * P_SEEK * ptrInf; ay += puy * P_SEEK * ptrInf;
        } else {
          var rad = (pd - P_ORBIT_R * 0.72) / P_ORBIT_R;   // ring spring: + outside, − inside
          ax += (-puy * P_ORBIT + pux * rad * P_RING) * ptrInf;
          ay += (pux * P_ORBIT + puy * rad * P_RING) * ptrInf;
        }
      }
      // seek current target node; hop to a neighbour on arrival (traffic on streets)
      var tx = b.target.x - b.x, ty = b.target.y - b.y;
      var td = Math.sqrt(tx * tx + ty * ty) || 1;
      if (td < 26) { b.cur = b.target; b.target = b.cur.nbrs[(Math.random() * b.cur.nbrs.length) | 0]; }
      else {
        var wp = 0.55 * (1 - 0.85 * ptrInf);   // streets fade while the cursor leads
        ax += (tx / td) * wp; ay += (ty / td) * wp;
      }

      b.vx += ax * 0.06; b.vy += ay * 0.06;
      var sp = Math.sqrt(b.vx * b.vx + b.vy * b.vy) || 1;
      if (sp > MAXV) { b.vx = b.vx / sp * MAXV; b.vy = b.vy / sp * MAXV; }
      else if (sp < MINV) { b.vx = b.vx / sp * MINV; b.vy = b.vy / sp * MINV; }
      b.x += b.vx; b.y += b.vy;
      // toroidal wrap
      if (b.x < -12) b.x = W + 12; else if (b.x > W + 12) b.x = -12;
      if (b.y < -12) b.y = H + 12; else if (b.y > H + 12) b.y = -12;
    }
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    // street edges
    ctx.strokeStyle = EDGE; ctx.lineWidth = 1;
    ctx.beginPath();
    for (var i = 0; i < nodes.length; i++) {
      var a = nodes[i];
      for (var k = 0; k < a.nbrs.length; k++) {
        var c = a.nbrs[k];
        if (a.x <= c.x) { ctx.moveTo(a.x, a.y); ctx.lineTo(c.x, c.y); }  // draw each edge once
      }
    }
    ctx.stroke();
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

  function frame() { if (!running) return; step(); draw(); raf = requestAnimationFrame(frame); }
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
  // Mouse and finger are treated the same: a touch drag steers the flock while the
  // finger is down (pointermove only fires during contact on touch), and a tap
  // plants the attractor at that spot until the idle timer releases it. When a
  // gesture turns into a page scroll the browser fires pointercancel — we release
  // immediately there, so the flock never jerks mid-scroll.
  function setPtr(e) {
    if (heroRectDirty) { heroRect = canvas.getBoundingClientRect(); heroRectDirty = false; }
    PTR.x = e.clientX - heroRect.left; PTR.y = e.clientY - heroRect.top;
    PTR.active = PTR.x >= 0 && PTR.y >= 0 && PTR.x <= W && PTR.y <= H;
    PTR.last = performance.now();
  }
  window.addEventListener("pointermove", setPtr, { passive: true });
  window.addEventListener("pointerdown", setPtr, { passive: true });
  window.addEventListener("pointercancel", function () { PTR.active = false; });
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
