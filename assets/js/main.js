/* =========================================================
   USTT Valenciennes — animations & interactions
   ========================================================= */
(function () {
  "use strict";
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var doc = document.documentElement;

  /* ---------- En-tête : fond au défilement + progression ---------- */
  var header = document.querySelector(".header");
  var progress = document.querySelector(".progress");
  var heroPhoto = document.querySelector(".hero__photo, .page-hero__bg");
  function onScroll() {
    var y = window.scrollY;
    if (header) header.classList.toggle("is-solid", y > 40);
    var max = doc.scrollHeight - window.innerHeight;
    if (progress) progress.style.setProperty("--p", max > 0 ? Math.min(1, y / max) : 0);
    if (heroPhoto && !reduce && y < window.innerHeight * 1.2) {
      heroPhoto.style.transform = "translateY(" + y * 0.3 + "px) scale(1.1)";
    }
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- Menu mobile ---------- */
  var burger = document.querySelector(".burger");
  if (burger) {
    burger.addEventListener("click", function () {
      var open = document.body.classList.toggle("nav-open");
      burger.setAttribute("aria-expanded", open);
      document.body.style.overflow = open ? "hidden" : "";
    });
    document.querySelectorAll(".nav a").forEach(function (a) {
      a.addEventListener("click", function () {
        document.body.classList.remove("nav-open");
        burger.setAttribute("aria-expanded", "false");
        document.body.style.overflow = "";
      });
    });
  }

  /* ---------- Apparitions au défilement ---------- */
  var reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); }
      });
    }, { threshold: 0.15, rootMargin: "0px 0px -40px 0px" });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add("is-in"); });
  }

  /* ---------- Compteurs animés ---------- */
  function animateCount(el) {
    var target = parseFloat(el.dataset.count);
    var dur = 1800, start = null;
    function step(ts) {
      if (!start) start = ts;
      var p = Math.min(1, (ts - start) / dur);
      var eased = 1 - Math.pow(1 - p, 4);
      el.textContent = Math.round(target * eased).toLocaleString("fr-FR");
      if (p < 1) requestAnimationFrame(step);
    }
    if (reduce) el.textContent = target.toLocaleString("fr-FR");
    else requestAnimationFrame(step);
  }
  var counters = document.querySelectorAll("[data-count]");
  if ("IntersectionObserver" in window) {
    var co = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { animateCount(e.target); co.unobserve(e.target); }
      });
    }, { threshold: 0.6 });
    counters.forEach(function (c) { co.observe(c); });
  } else counters.forEach(animateCount);

  /* ---------- Anneau 60 % (mécénat) ---------- */
  document.querySelectorAll(".ring").forEach(function (ring) {
    var v = parseFloat(ring.dataset.value || 60);
    var done = false;
    function run() {
      if (done) return; done = true;
      var s = null;
      function f(ts) {
        if (!s) s = ts;
        var p = Math.min(1, (ts - s) / 1600);
        ring.style.setProperty("--d", (v * (1 - Math.pow(1 - p, 3))).toFixed(1));
        if (p < 1) requestAnimationFrame(f);
      }
      if (reduce) ring.style.setProperty("--d", v); else requestAnimationFrame(f);
    }
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (en, o) { if (en[0].isIntersecting) { run(); o.disconnect(); } }, { threshold: 0.5 }).observe(ring);
    } else run();
  });

  /* ---------- Filtre du planning ---------- */
  var chips = document.querySelectorAll(".chip[data-f]");
  chips.forEach(function (chip) {
    chip.addEventListener("click", function () {
      var f = chip.dataset.f;
      chips.forEach(function (c) { c.classList.toggle("is-active", c === chip); c.setAttribute("aria-pressed", c === chip); });
      document.querySelectorAll(".slot").forEach(function (s) {
        var hit = f === "all" || s.dataset.t === f;
        s.classList.toggle("is-dim", !hit);
        s.classList.toggle("is-hit", hit && f !== "all");
      });
    });
  });

  /* ---------- Formulaire de contact (ouvre la messagerie) ---------- */
  var form = document.querySelector("#contact-form");
  if (form) {
    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      var d = new FormData(form);
      var to = form.dataset.to;
      var subject = "[Site web] " + (d.get("sujet") || "Demande") + " — " + (d.get("nom") || "");
      var body = "Nom : " + d.get("nom") + "\nE-mail : " + d.get("email") + "\nTéléphone : " + (d.get("tel") || "-") +
        "\nSujet : " + d.get("sujet") + "\n\n" + d.get("message");
      window.location.href = "mailto:" + to + "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
      var ok = form.querySelector(".form-ok");
      if (ok) ok.hidden = false;
    });
  }

  /* ---------- Échange animé sur la table (accueil) ---------- */
  var svg = document.querySelector("#rally");
  if (svg) initRally(svg);

  function initRally(svg) {
    var ball = svg.querySelector(".r-ball");
    var shadow = svg.querySelector(".r-shadow");
    var pNear = svg.querySelector(".r-paddle-near");
    var pFar = svg.querySelector(".r-paddle-far");
    var ripple = svg.querySelector(".r-ripple");
    var trail = svg.querySelectorAll(".r-trail");
    // Projection : table vue en perspective (u = largeur 0..1, v = profondeur 0 près .. 1 loin, z = hauteur)
    function lerp(a, b, t) { return a + (b - a) * t; }
    function proj(u, v, z) {
      var y0 = lerp(400, 232, v);
      var w = lerp(420, 262, v);
      var s = lerp(1, 0.64, v);
      return { x: 250 + (u - 0.5) * w, y: y0 - z * s * 2.1, s: s };
    }
    var hitZ = 34, nearV = -0.1, farV = 1.12;
    var shots = [], t0 = null, DUR = 620;
    function rnd(a, b) { return a + Math.random() * (b - a); }
    var cur = { u: 0.7, v: nearV, z: hitZ };
    function makeShot(from, toFar) {
      var bounce = { u: rnd(0.18, 0.82), v: toFar ? rnd(0.62, 0.86) : rnd(0.14, 0.38), z: 0 };
      var hit = { u: rnd(0.2, 0.8), v: toFar ? farV : nearV, z: hitZ };
      return { a: from, b: bounce, c: hit, toFar: toFar, h1: rnd(26, 44), h2: rnd(24, 36) };
    }
    var shot = makeShot(cur, true);
    var history = [];
    var running = true, rippleT = -1, lastBounce = null;

    function pos(sh, t) {
      // t 0..1 : première moitié jusqu'au rebond, seconde moitié jusqu'à la frappe
      var k, p, q, H;
      if (t < 0.55) { k = t / 0.55; p = sh.a; q = sh.b; H = sh.h1; }
      else { k = (t - 0.55) / 0.45; p = sh.b; q = sh.c; H = sh.h2; }
      return {
        u: lerp(p.u, q.u, k), v: lerp(p.v, q.v, k),
        z: lerp(p.z, q.z, k) + 4 * H * k * (1 - k)
      };
    }
    function placePaddle(el, u, v, swing) {
      var p = proj(u, v, hitZ);
      el.setAttribute("transform", "translate(" + p.x.toFixed(1) + "," + p.y.toFixed(1) + ") scale(" + p.s.toFixed(3) + ") rotate(" + swing.toFixed(1) + ")");
    }
    var nearU = 0.7, farU = 0.3;
    function frame(ts) {
      if (!running) return;
      if (t0 === null) t0 = ts;
      var t = (ts - t0) / DUR;
      if (t >= 1) {
        cur = shot.c;
        shot = makeShot(cur, !shot.toFar);
        t0 = ts; t = 0;
      }
      var b = pos(shot, t);
      var P = proj(b.u, b.v, b.z);
      var S = proj(b.u, b.v, 0);
      ball.setAttribute("cx", P.x.toFixed(1)); ball.setAttribute("cy", P.y.toFixed(1));
      ball.setAttribute("r", (9 * P.s).toFixed(2));
      shadow.setAttribute("cx", S.x.toFixed(1)); shadow.setAttribute("cy", (S.y + 2).toFixed(1));
      shadow.setAttribute("rx", (10 * S.s * (1 - b.z / 120)).toFixed(2));
      shadow.setAttribute("ry", (3.5 * S.s).toFixed(2));
      shadow.setAttribute("opacity", Math.max(0.1, 0.45 - b.z / 140).toFixed(2));
      // Ombre portée seulement au-dessus de la table
      shadow.style.display = (b.v > 0 && b.v < 1) ? "" : "none";
      // Traînée
      history.unshift([P.x, P.y, P.s]); if (history.length > 14) history.pop();
      trail.forEach(function (c, i) {
        var h = history[(i + 1) * 3]; if (!h) return;
        c.setAttribute("cx", h[0].toFixed(1)); c.setAttribute("cy", h[1].toFixed(1));
        c.setAttribute("r", (7 * h[2] * (1 - i * 0.22)).toFixed(2));
      });
      // Rebond : petit impact sur la table
      if (t >= 0.55 && lastBounce !== shot) {
        lastBounce = shot; rippleT = ts;
        var R = proj(shot.b.u, shot.b.v, 0);
        ripple.setAttribute("cx", R.x.toFixed(1)); ripple.setAttribute("cy", R.y.toFixed(1));
      }
      if (rippleT > 0) {
        var rk = (ts - rippleT) / 450;
        if (rk <= 1) {
          var sc = proj(shot.b.u, shot.b.v, 0).s;
          ripple.setAttribute("rx", (6 + rk * 26) * sc); ripple.setAttribute("ry", (2 + rk * 8) * sc);
          ripple.setAttribute("opacity", (1 - rk).toFixed(2));
        } else ripple.setAttribute("opacity", 0);
      }
      // Les raquettes suivent la balle
      var targetNear = shot.toFar ? nearU : shot.c.u;
      var targetFar = shot.toFar ? shot.c.u : farU;
      nearU += (targetNear - nearU) * 0.08;
      farU += (targetFar - farU) * 0.08;
      var swingNear = 0, swingFar = 0;
      if (!shot.toFar && t > 0.8) swingNear = -40 * Math.sin((t - 0.8) / 0.2 * Math.PI / 2);
      if (shot.toFar && t < 0.15) swingNear = -40 * Math.cos(t / 0.15 * Math.PI / 2);
      if (shot.toFar && t > 0.8) swingFar = 35 * Math.sin((t - 0.8) / 0.2 * Math.PI / 2);
      if (!shot.toFar && t < 0.15) swingFar = 35 * Math.cos(t / 0.15 * Math.PI / 2);
      placePaddle(pNear, nearU + 0.06, nearV - 0.02, -20 + swingNear);
      placePaddle(pFar, farU - 0.04, farV + 0.02, 160 + swingFar);
      requestAnimationFrame(frame);
    }
    if (reduce) {
      var P = proj(0.6, 0.6, 30); ball.setAttribute("cx", P.x); ball.setAttribute("cy", P.y); ball.setAttribute("r", 6);
      placePaddle(pNear, 0.76, nearV, -20); placePaddle(pFar, 0.26, farV, 160);
      return;
    }
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (en) {
        var vis = en[0].isIntersecting;
        if (vis && !running) { running = true; t0 = null; requestAnimationFrame(frame); }
        else if (!vis) running = false;
      }).observe(svg);
    }
    requestAnimationFrame(frame);
  }

  /* ---------- Clic = une balle de ping qui rebondit ---------- */
  if (!reduce) {
    var balls = [];
    document.addEventListener("click", function (e) {
      if (e.target.closest("a,button,input,select,textarea,label,iframe,.chip")) return;
      if (balls.length > 12) return;
      var el = document.createElement("span");
      el.className = "fx-ball" + (Math.random() < 0.3 ? " orange" : "");
      document.body.appendChild(el);
      var b = { el: el, x: e.clientX, y: e.clientY, vx: (Math.random() - 0.5) * 9, vy: -8 - Math.random() * 5, life: 0 };
      balls.push(b);
      if (balls.length === 1) requestAnimationFrame(tick);
    });
    function tick() {
      var H = window.innerHeight, W = window.innerWidth;
      for (var i = balls.length - 1; i >= 0; i--) {
        var b = balls[i];
        b.vy += 0.55; b.x += b.vx; b.y += b.vy; b.life++;
        if (b.y > H - 8) { b.y = H - 8; b.vy *= -0.72; b.vx *= 0.92; }
        if (b.x < 8 || b.x > W - 8) { b.vx *= -0.9; b.x = Math.max(8, Math.min(W - 8, b.x)); }
        b.el.style.transform = "translate(" + b.x + "px," + b.y + "px)";
        if (b.life > 150) b.el.style.opacity = Math.max(0, 1 - (b.life - 150) / 30);
        if (b.life > 180) { b.el.remove(); balls.splice(i, 1); }
      }
      if (balls.length) requestAnimationFrame(tick);
    }
  }

  /* ---------- Année automatique dans le pied de page ---------- */
  var yr = document.querySelector("[data-year]");
  if (yr) yr.textContent = new Date().getFullYear();
})();
