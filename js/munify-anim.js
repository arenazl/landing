/* ============================================================
   Munify Landing — capa de movimiento (vanilla, sin dependencias)
   Progressive enhancement: el contenido (texto, números, %) ya vive
   en el HTML. Este script SOLO lo anima al entrar en viewport.
   Si no carga o el browser pide menos movimiento, todo se ve igual,
   completo y estático → SEO y accesibilidad intactos.
   ============================================================ */
(function () {
  'use strict';

  var reduce = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Estado global de "movimiento": el botón de la topbar lo togglea.
     paused congela las animaciones CSS (vía .anim-paused) y corta los
     timers de los sliders. La preferencia se recuerda en localStorage. */
  var paused = false;
  var sliderCtrls = [];   // { start, stop } por cada slider

  /* ---- Stagger: a cada .reveal le asigno su índice dentro del grupo
         (mismo padre) para que entren escalonados vía --i en el CSS ---- */
  function assignStagger() {
    var groups = new Map();
    document.querySelectorAll('.reveal').forEach(function (el) {
      var parent = el.parentElement;
      var n = groups.get(parent) || 0;
      el.style.setProperty('--i', n);
      groups.set(parent, n + 1);
    });
  }

  /* ---- Count-up: anima un número de 0 a data-count al entrar ---- */
  function countUp(el) {
    var target = parseFloat(el.getAttribute('data-count'));
    if (isNaN(target)) return;
    var dur = parseInt(el.getAttribute('data-dur') || '1200', 10);
    var decimals = (el.getAttribute('data-count').split('.')[1] || '').length;
    var prefix = el.getAttribute('data-prefix') || '';
    var suffix = el.getAttribute('data-suffix') || '';
    if (reduce) { el.textContent = prefix + target.toFixed(decimals) + suffix; return; }
    var start = null;
    function frame(ts) {
      if (start === null) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      // easeOutExpo
      var eased = p === 1 ? 1 : 1 - Math.pow(2, -10 * p);
      var val = (target * eased).toFixed(decimals);
      el.textContent = prefix + val + suffix;
      if (p < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  /* ---- Donut: sube --val de 0 al valor real (anima por @property) ---- */
  function fillDonut(el) {
    var val = parseFloat(el.getAttribute('data-val')) || 0;
    if (reduce) { el.style.setProperty('--val', val); return; }
    // doble rAF para que el transition de --val tome efecto
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { el.style.setProperty('--val', val); });
    });
  }

  /* ---- Tacómetro: setea offset del arco + ángulo de la aguja, anima por CSS ---- */
  var GAUGE_LEN = 264; // longitud del arco semicircular (r≈84)
  function fillGauge(el) {
    var val = Math.max(0, Math.min(100, parseFloat(el.getAttribute('data-val')) || 0));
    el.style.setProperty('--off', (GAUGE_LEN * (1 - val / 100)).toFixed(1));
    el.style.setProperty('--angle', ((val / 100) * 180 - 90).toFixed(1) + 'deg');
    el.classList.add('in-view');
  }

  /* ---- Observer principal ---- */
  function observe() {
    if (!('IntersectionObserver' in window)) {
      // Fallback: mostrar todo de una
      document.querySelectorAll('.reveal').forEach(function (el) { el.classList.add('visible'); });
      document.querySelectorAll('[data-count]').forEach(countUp);
      document.querySelectorAll('.barchart, .kpi-strip').forEach(function (el) { el.classList.add('in-view'); });
      document.querySelectorAll('.donut').forEach(fillDonut);
      document.querySelectorAll('.gauge').forEach(fillGauge);
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var t = e.target;
        if (t.classList.contains('reveal')) t.classList.add('visible');
        if (t.classList.contains('barchart') || t.classList.contains('kpi-strip')) t.classList.add('in-view');
        if (t.classList.contains('donut')) fillDonut(t);
        if (t.classList.contains('gauge')) fillGauge(t);
        if (t.hasAttribute('data-count')) countUp(t);
        io.unobserve(t);
      });
    }, { threshold: 0.18, rootMargin: '0px 0px -8% 0px' });

    document.querySelectorAll('.reveal, .barchart, .kpi-strip, .donut, .gauge, [data-count]')
      .forEach(function (el) { io.observe(el); });
  }

  /* ---- Tablas apiladas en mobile: copia encabezado → data-label ---- */
  function stackTables() {
    document.querySelectorAll('table.table-stack').forEach(function (table) {
      var heads = [].map.call(table.querySelectorAll('thead th'), function (th) {
        return th.textContent.trim();
      });
      table.querySelectorAll('tbody tr').forEach(function (tr) {
        [].forEach.call(tr.children, function (td, i) {
          if (i > 0 && heads[i]) td.setAttribute('data-label', heads[i]);
        });
      });
    });
  }

  /* ---- Slider del mockup: rota entre vistas (panel ⇄ wizard) ---- */
  function initSliders() {
    document.querySelectorAll('.mock-slides').forEach(function (box) {
      var slides = box.querySelectorAll(':scope > .mock-slide');
      if (slides.length < 2) return;
      var dotsWrap = box.parentElement.querySelector('.mock-dots');
      var dots = dotsWrap ? dotsWrap.querySelectorAll('span') : [];
      var i = 0;
      var timer = null;
      function show(n) {
        i = (n + slides.length) % slides.length;
        slides.forEach(function (s, k) { s.classList.toggle('is-active', k === i); });
        for (var d = 0; d < dots.length; d++) dots[d].classList.toggle('is-active', d === i);
      }
      function start() { if (!reduce && !paused && !timer) timer = setInterval(function () { show(i + 1); }, 4500); }
      function stop() { if (timer) { clearInterval(timer); timer = null; } }
      for (var d = 0; d < dots.length; d++) (function (k) { dots[k].onclick = function () { show(k); }; })(d);
      start();
      sliderCtrls.push({ start: start, stop: stop });
    });
  }

  /* ---- Clips en loop: crossfade entre videos declarados en data-videos
         de cualquier contenedor (hero, cards bento). Progressive: si no
         corre este JS (o hay reduced-motion / save-data / mobile) queda
         el <img> de base. ---- */
  function initLoopVideos() {
    if (reduce) return;
    if (navigator.connection && navigator.connection.saveData) return;
    if (!window.matchMedia || !window.matchMedia('(min-width: 768px)').matches) return;
    var boxes = document.querySelectorAll('[data-videos]');
    if (!('IntersectionObserver' in window)) {
      boxes.forEach(initLoopBox);
      return;
    }
    // lazy: los clips de cada contenedor recien se descargan al acercarse al viewport
    var lazy = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        lazy.unobserve(e.target);
        initLoopBox(e.target);
      });
    }, { rootMargin: '300px 0px' });
    boxes.forEach(function (b) { lazy.observe(b); });
  }

  function initLoopBox(media) {
    var srcs = media.getAttribute('data-videos').split(',')
      .map(function (s) { return s.trim(); }).filter(Boolean);
    if (!srcs.length) return;

    var vids = srcs.map(function (src, k) {
      var v = document.createElement('video');
      v.muted = true; v.defaultMuted = true; v.loop = true; v.playsInline = true;
      v.setAttribute('muted', ''); v.setAttribute('playsinline', '');
      v.preload = k === 0 ? 'auto' : 'metadata';
      v.setAttribute('aria-hidden', 'true'); v.tabIndex = -1;
      v.src = src;
      media.appendChild(v);
      return v;
    });

    var i = 0, timer = null, fadeT = null;
    function play(v) { var p = v.play(); if (p && p.catch) p.catch(function () {}); }
    function show(n) {
      i = (n + vids.length) % vids.length;
      vids.forEach(function (v, k) {
        v.classList.toggle('is-on', k === i);
        if (k === i) play(v);
      });
      // al terminar el crossfade (1.4s) los clips ocultos dejan de decodificar
      clearTimeout(fadeT);
      fadeT = setTimeout(function () {
        vids.forEach(function (v, k) {
          if (k !== i) { try { v.pause(); } catch (e) {} }
        });
      }, 1600);
    }
    function start() {
      if (paused || timer) return;
      show(i);
      if (vids.length > 1) timer = setInterval(function () { show(i + 1); }, 9000);
    }
    function stop() {
      if (timer) { clearInterval(timer); timer = null; }
      vids.forEach(function (v) { try { v.pause(); } catch (e) {} });
    }
    // el primer clip aparece recién cuando tiene data (sin flash gris)
    vids[0].addEventListener('canplay', function onCan() {
      vids[0].removeEventListener('canplay', onCan);
      if (!paused) start();
    });
    play(vids[0]);

    sliderCtrls.push({ start: start, stop: stop });

    // perf: los clips se pausan cuando el hero sale del viewport
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) { if (!paused) start(); } else { stop(); }
        });
      }, { threshold: 0.05 });
      io.observe(media);
    }
  }

  /* ---- Pausa/reanuda TODO el movimiento de la página ---- */
  function setPaused(p) {
    paused = !!p;
    document.documentElement.classList.toggle('anim-paused', paused);
    sliderCtrls.forEach(function (c) { paused ? c.stop() : c.start(); });
    document.querySelectorAll('.anim-toggle').forEach(function (b) {
      b.setAttribute('aria-pressed', paused ? 'true' : 'false');
      b.setAttribute('title', paused ? 'Reanudar animaciones' : 'Pausar animaciones');
    });
    try { localStorage.setItem('munify-anim-paused', paused ? '1' : '0'); } catch (e) {}
  }

  window.MunifyAnim = {
    pause: function () { setPaused(true); },
    resume: function () { setPaused(false); },
    toggle: function () { setPaused(!paused); },
    isPaused: function () { return paused; }
  };

  function initAnimToggle() {
    var btns = document.querySelectorAll('.anim-toggle');
    if (!btns.length) return;
    btns.forEach(function (b) { b.addEventListener('click', function () { setPaused(!paused); }); });
    var saved = null;
    try { saved = localStorage.getItem('munify-anim-paused'); } catch (e) {}
    if (saved === '1') setPaused(true);
  }

  function init() {
    // Avisa al fail-safe del <head> que el sistema de animación está vivo.
    document.documentElement.setAttribute('data-anim-ready', '1');
    assignStagger();
    stackTables();
    observe();
    initSliders();
    initLoopVideos();
    initAnimToggle();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
