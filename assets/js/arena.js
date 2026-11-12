/* =========================================================
   USTT Valenciennes — échange de ping en 3D (vue "télé")
   Table aux dimensions officielles : 2,74 m x 1,525 m, 76 cm
   ========================================================= */
(function () {
  "use strict";
  var canvas = document.getElementById("arena");
  if (!canvas || !canvas.getContext) return;
  var ctx = canvas.getContext("2d");
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var elHome = document.getElementById("sc-home"), elAway = document.getElementById("sc-away"),
      elRally = document.getElementById("sc-rally"), elFlash = document.getElementById("sc-flash");

  var L = 1.37, W = 0.7625, H = 0.76, NET = 0.1525;
  var W_, H_, DPR, F, CX, CY;
  function resize() {
    var r = canvas.getBoundingClientRect();
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W_ = r.width; H_ = r.height;
    canvas.width = Math.round(W_ * DPR); canvas.height = Math.round(H_ * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    F = Math.min(W_ * 1.12, H_ * 1.3);
    CX = W_ * 0.5; CY = H_ * 0.58;
  }
  resize();
  if ("ResizeObserver" in window) new ResizeObserver(resize).observe(canvas);
  else window.addEventListener("resize", resize);

  // ---------- Caméra ----------
  var cam = { x: 0, y: 0, z: 0 }, fw, rt, up;
  var mouse = 0, mouseT = 0;
  window.addEventListener("pointermove", function (e) { mouseT = (e.clientX / window.innerWidth - 0.5); }, { passive: true });
  function sub(a, b) { return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z }; }
  function dot(a, b) { return a.x * b.x + a.y * b.y + a.z * b.z; }
  function cross(a, b) { return { x: a.y * b.z - a.z * b.y, y: a.z * b.x - a.x * b.z, z: a.x * b.y - a.y * b.x }; }
  function norm(a) { var l = Math.hypot(a.x, a.y, a.z); return { x: a.x / l, y: a.y / l, z: a.z / l }; }
  function setCam(t) {
    var a = reduce ? 0.62 : 0.62 + 0.2 * Math.sin(t * 0.00012) + mouse * 0.25;
    var R = 4.0;
    cam = { x: R * Math.sin(a), y: 2.15, z: -R * Math.cos(a) };
    var target = { x: 0, y: 0.62, z: 0.15 };
    fw = norm(sub(target, cam));
    rt = norm(cross(fw, { x: 0, y: 1, z: 0 }));
    up = cross(rt, fw);
  }
  function P(x, y, z) {
    var d = sub({ x: x, y: y, z: z }, cam);
    var zc = dot(d, fw); if (zc < 0.05) zc = 0.05;
    return { x: CX + F * dot(d, rt) / zc, y: CY - F * dot(d, up) / zc, s: F / zc };
  }
  function poly(pts, fill, stroke, lw) {
    ctx.beginPath();
    pts.forEach(function (p, i) { var q = P(p[0], p[1], p[2]); i ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y); });
    ctx.closePath();
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw || 1; ctx.stroke(); }
  }
  function line(a, b, col, lw) {
    var p = P(a[0], a[1], a[2]), q = P(b[0], b[1], b[2]);
    ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y);
    ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.stroke();
  }

  // ---------- Décor ----------
  function drawFloor() {
    var c = P(0, 0, 0);
    var g = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, F * 0.9);
    g.addColorStop(0, "rgba(209,10,17,.55)"); g.addColorStop(.55, "rgba(134,26,47,.25)"); g.addColorStop(1, "rgba(22,20,46,0)");
    poly([[-2.6, 0, -3.6], [2.6, 0, -3.6], [2.6, 0, 3.6], [-2.6, 0, 3.6]], g);
    // séparations du terrain (fond et côté gauche)
    var bar = function (pts) { poly(pts, "rgba(10,61,156,.85)"); };
    bar([[-2.6, 0, 3.6], [2.6, 0, 3.6], [2.6, .7, 3.6], [-2.6, .7, 3.6]]);
    bar([[-2.6, 0, -3.6], [-2.6, 0, 3.6], [-2.6, .7, 3.6], [-2.6, .7, -3.6]]);
    line([-2.6, .7, 3.6], [2.6, .7, 3.6], "rgba(255,255,255,.7)", 1.5);
    line([-2.6, .7, -3.6], [-2.6, .7, 3.6], "rgba(255,255,255,.7)", 1.5);
    // lettrage des séparations
    for (var i = 0; i < 3; i++) {
      var p = P(-1.6 + i * 1.6, .35, 3.6);
      ctx.save(); ctx.fillStyle = "rgba(255,255,255,.55)"; ctx.font = "400 " + Math.max(8, p.s * .2) + "px Anton, Impact, sans-serif";
      ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText("USTT VALENCIENNES", p.x, p.y); ctx.restore();
    }
  }
  function drawTable() {
    // ombre au sol
    var c = P(0, 0, 0);
    ctx.save(); ctx.filter = "blur(10px)";
    poly([[-W - .1, 0, -L - .1], [W + .1, 0, -L - .1], [W + .1, 0, L + .1], [-W - .1, 0, L + .1]], "rgba(0,0,0,.45)");
    ctx.restore();
    // pieds
    [[-W + .15, -L + .25], [W - .15, -L + .25], [-W + .15, L - .25], [W - .15, L - .25]].forEach(function (k) {
      line([k[0], 0, k[1]], [k[0], H - .03, k[1]], "#0B0A1A", Math.max(2, P(k[0], .4, k[1]).s * .045));
    });
    line([0, .35, -L + .25], [0, .35, L - .25], "#0B0A1A", 3);
    // épaisseur
    poly([[-W, H - .03, -L], [W, H - .03, -L], [W, H - .03, L], [-W, H - .03, L]], "#062A6E");
    poly([[-W, H, -L], [W, H, -L], [W, H - .03, -L], [-W, H - .03, -L]], "#0A2F7C");
    poly([[W, H, -L], [W, H, L], [W, H - .03, L], [W, H - .03, -L]], "#08307F");
    // plateau
    var a = P(-W, H, L), b = P(W, H, -L);
    var g = ctx.createLinearGradient(a.x, a.y, b.x, b.y);
    g.addColorStop(0, "#0E3FA8"); g.addColorStop(1, "#1A5BD6");
    poly([[-W, H, -L], [W, H, -L], [W, H, L], [-W, H, L]], g);
    // lignes blanches
    var wl = function (pts) { poly(pts, null, "rgba(255,255,255,.95)", 2); };
    wl([[-W + .01, H, -L + .01], [W - .01, H, -L + .01], [W - .01, H, L - .01], [-W + .01, H, L - .01]]);
    line([0, H, -L], [0, H, L], "rgba(255,255,255,.85)", 1.2);
    // reflet
    ctx.save(); ctx.globalAlpha = .1;
    poly([[-W, H, .2], [W, H, -.4], [W, H, .1], [-W, H, .7]], "#fff");
    ctx.restore();
  }
  function drawNet() {
    var x0 = -W - NET, x1 = W + NET, top = H + NET;
    poly([[x0, H, 0], [x1, H, 0], [x1, top, 0], [x0, top, 0]], "rgba(240,240,255,.18)");
    for (var x = x0; x <= x1; x += .09) line([x, H, 0], [x, top, 0], "rgba(255,255,255,.28)", .8);
    for (var y = H + .03; y < top; y += .03) line([x0, y, 0], [x1, y, 0], "rgba(255,255,255,.28)", .8);
    line([x0, top, 0], [x1, top, 0], "#fff", 2.5);
    line([x0, H - .02, 0], [x0, top + .01, 0], "#E8E8F0", 3);
    line([x1, H - .02, 0], [x1, top + .01, 0], "#E8E8F0", 3);
  }

  // ---------- Échange ----------
  function rnd(a, b) { return a + Math.random() * (b - a); }
  var END = 1.62, HITY = .95;
  var score = { h: 0, a: 0 }, rally = 0, rallyLen = Math.round(rnd(6, 16));
  var shot, t0 = null, DUR = 560, pause = 0, rings = [], trail = [], flashes = [];
  function newShot(fromZ, fromX, missing) {
    var dir = fromZ < 0 ? 1 : -1; // vers le fond si frappé côté caméra
    var a = { x: fromX, y: HITY, z: fromZ };
    var b, c, h1 = rnd(.22, .34), h2 = rnd(.2, .3);
    if (missing) {
      b = { x: rnd(-.5, .5), y: 0, z: dir * rnd(2.0, 2.4) };
      c = { x: b.x * 1.2, y: 0, z: dir * 3.0 }; h1 = rnd(.35, .5); h2 = .12;
    } else {
      b = { x: rnd(-.6, .6), y: H + .02, z: dir * rnd(.35, 1.15) };
      c = { x: rnd(-.7, .7), y: HITY + rnd(-.05, .08), z: dir * END };
    }
    return { a: a, b: b, c: c, h1: h1, h2: h2, missing: missing, nearHit: dir > 0, bounced: false };
  }
  function at(sh, k) {
    var s1 = .52, p, q, h, u;
    if (k < s1) { u = k / s1; p = sh.a; q = sh.b; h = sh.h1; }
    else { u = (k - s1) / (1 - s1); p = sh.b; q = sh.c; h = sh.h2; }
    return { x: p.x + (q.x - p.x) * u, y: p.y + (q.y - p.y) * u + 4 * h * u * (1 - u), z: p.z + (q.z - p.z) * u };
  }
  shot = newShot(-END, .3, false);

  function setText(el, v) { if (el && el.textContent !== String(v)) el.textContent = v; }
  function flash(msg) {
    if (!elFlash) return;
    elFlash.textContent = msg; elFlash.classList.remove("is-on"); void elFlash.offsetWidth; elFlash.classList.add("is-on");
  }
  function onHit(pos) {
    rally++; setText(elRally, rally);
    flashes.push({ x: pos.x, y: pos.y, z: pos.z, t: performance.now() });
  }
  function nextShot(now) {
    var from = shot.c;
    if (shot.missing) {
      // point marqué par celui qui n'a pas raté
      if (shot.nearHit) score.a++; else score.h++;
      flash(shot.nearHit ? "Point visiteurs" : "Point USTT !");
      if (score.h >= 11 || score.a >= 11) {
        setTimeout(function () { flash(score.h > score.a ? "Set USTT !" : "Set visiteurs"); score = { h: 0, a: 0 }; setText(elHome, 0); setText(elAway, 0); }, 1100);
      }
      setText(elHome, score.h); setText(elAway, score.a);
      rally = 0; rallyLen = Math.round(rnd(5, 15));
      pause = now + 1300; trail = [];
      shot = newShot(-END, rnd(-.4, .4), false);
      setText(elRally, 0);
      return;
    }
    onHit(from);
    var miss = rally >= rallyLen;
    // l'USTT (côté caméra) gagne la plupart des points
    if (miss && shot.nearHit && Math.random() < .7) { rallyLen += 2; miss = false; }
    shot = newShot(from.z, from.x, miss);
  }

  // ---------- Rendu ----------
  function ensureSize() {
    var w = canvas.clientWidth, h = canvas.clientHeight;
    if (w > 0 && h > 0 && (Math.abs(w - W_) > .5 || Math.abs(h - H_) > .5 || canvas.width === 0)) resize();
    return W_ > 0 && H_ > 0;
  }
  function fadeEdges() {
    // fondu des bords dessiné dans le canvas (plus fiable qu'un masque CSS)
    ctx.save();
    ctx.globalCompositeOperation = "destination-in";
    ctx.translate(W_ * .5, H_ * .56); ctx.scale(W_ * .5, H_ * .5);
    var g = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
    g.addColorStop(0, "rgba(0,0,0,1)"); g.addColorStop(.62, "rgba(0,0,0,1)"); g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g; ctx.fillRect(-1.2, -1.2, 2.4, 2.4);
    ctx.restore();
  }
  var lastFrame = 0, rafPending = false, paused = false, pausedAt = 0;
  function schedule() {
    if (rafPending) return;
    rafPending = true;
    requestAnimationFrame(function (t) { rafPending = false; frame(performance.now()); });
  }
  // filet de sécurité : si le navigateur bride requestAnimationFrame, on anime quand même
  setInterval(function () { if (!paused && performance.now() - lastFrame > 120) frame(performance.now()); }, 33);
  var btn = document.getElementById("arena-pause");
  if (btn) btn.addEventListener("click", function () {
    paused = !paused;
    btn.setAttribute("aria-pressed", paused);
    btn.setAttribute("aria-label", paused ? "Relancer l'animation" : "Mettre l'animation en pause");
    btn.classList.toggle("is-paused", paused);
    var now = performance.now();
    if (paused) pausedAt = now;
    else { var d = now - pausedAt; if (t0 !== null) t0 += d; if (pause) pause += d; rings.forEach(function (r) { r.t += d; }); flashes.forEach(function (f) { f.t += d; }); schedule(); }
  });
  function frame(now) {
    lastFrame = now;
    if (paused) return;
    if (!ensureSize()) { schedule(); return; }
    mouse += (mouseT - mouse) * .03;
    setCam(now);
    ctx.clearRect(0, 0, W_, H_);
    drawFloor();
    drawTable();

    var k = 0, b = null;
    if (now >= pause) {
      if (t0 === null || t0 < pause) t0 = Math.max(now, pause);
      k = (now - t0) / DUR;
      if (k >= 1) { nextShot(now); t0 = Math.max(now, pause); k = 0; }
      if (now >= pause) {
        b = at(shot, Math.min(k, 1));
        if (k >= .52 && !shot.bounced) { shot.bounced = true; rings.push({ x: shot.b.x, y: shot.b.y + .001, z: shot.b.z, t: now }); }
        trail.push(b); if (trail.length > 22) trail.shift();
      }
    }

    // impacts sur la table
    rings = rings.filter(function (r) {
      var u = (now - r.t) / 700; if (u > 1) return false;
      ctx.save(); ctx.globalAlpha = 1 - u;
      var pts = []; for (var i = 0; i < 28; i++) { var an = i / 28 * Math.PI * 2; pts.push([r.x + Math.cos(an) * (.02 + u * .22), r.y, r.z + Math.sin(an) * (.02 + u * .22)]); }
      poly(pts, null, "#fff", 2); ctx.restore(); return true;
    });

    var ballFar = b && b.z > 0;
    function drawBall() {
      if (!b) return;
      // ombre
      var onTable = Math.abs(b.x) < W && Math.abs(b.z) < L;
      var sy = onTable ? H + .002 : 0, sp = P(b.x, sy, b.z);
      var hh = Math.max(0, b.y - sy);
      ctx.save(); ctx.globalAlpha = Math.max(.08, .5 - hh * .6); ctx.fillStyle = "#000";
      ctx.beginPath(); ctx.ellipse(sp.x, sp.y, sp.s * .03 * (1 + hh), sp.s * .012 * (1 + hh), 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
      // trajectoire lumineuse
      ctx.save(); ctx.lineCap = "round"; ctx.shadowColor = "rgba(255,60,60,.9)"; ctx.shadowBlur = 14;
      for (var i = 1; i < trail.length; i++) {
        var p = P(trail[i - 1].x, trail[i - 1].y, trail[i - 1].z), q = P(trail[i].x, trail[i].y, trail[i].z);
        var u = i / trail.length;
        ctx.strokeStyle = "rgba(255," + Math.round(60 + 140 * u) + "," + Math.round(60 + 140 * u) + "," + (u * .9) + ")";
        ctx.lineWidth = Math.max(1, q.s * .022 * u);
        ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke();
      }
      ctx.restore();
      // balle
      var bp = P(b.x, b.y, b.z), r = Math.max(2.5, bp.s * .022);
      var g = ctx.createRadialGradient(bp.x - r * .35, bp.y - r * .4, r * .1, bp.x, bp.y, r);
      g.addColorStop(0, "#fff"); g.addColorStop(.7, "#F1ECE4"); g.addColorStop(1, "#C8BEB0");
      ctx.save(); ctx.shadowColor = "rgba(255,255,255,.8)"; ctx.shadowBlur = 10;
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(bp.x, bp.y, r, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    }
    if (ballFar) drawBall();
    drawNet();
    if (!ballFar) drawBall();

    // éclats de frappe
    flashes = flashes.filter(function (f) {
      var u = (now - f.t) / 380; if (u > 1) return false;
      var p = P(f.x, f.y, f.z), R = p.s * (.05 + u * .2);
      ctx.save(); ctx.globalAlpha = 1 - u; ctx.strokeStyle = "#F2B33D"; ctx.lineWidth = 2;
      for (var i = 0; i < 8; i++) {
        var an = i / 8 * Math.PI * 2;
        ctx.beginPath(); ctx.moveTo(p.x + Math.cos(an) * R * .5, p.y + Math.sin(an) * R * .5);
        ctx.lineTo(p.x + Math.cos(an) * R, p.y + Math.sin(an) * R); ctx.stroke();
      }
      ctx.restore(); return true;
    });

    fadeEdges();
    schedule();
  }

  schedule();
})();
