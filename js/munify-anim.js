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

  /* ---- Observer principal ---- */
  function observe() {
    if (!('IntersectionObserver' in window)) {
      // Fallback: mostrar todo de una
      document.querySelectorAll('.reveal').forEach(function (el) { el.classList.add('visible'); });
      document.querySelectorAll('[data-count]').forEach(countUp);
      document.querySelectorAll('.barchart').forEach(function (el) { el.classList.add('in-view'); });
      document.querySelectorAll('.donut').forEach(fillDonut);
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var t = e.target;
        if (t.classList.contains('reveal')) t.classList.add('visible');
        if (t.classList.contains('barchart')) t.classList.add('in-view');
        if (t.classList.contains('donut')) fillDonut(t);
        if (t.hasAttribute('data-count')) countUp(t);
        io.unobserve(t);
      });
    }, { threshold: 0.18, rootMargin: '0px 0px -8% 0px' });

    document.querySelectorAll('.reveal, .barchart, .donut, [data-count]')
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

  function init() {
    // Avisa al fail-safe del <head> que el sistema de animación está vivo.
    document.documentElement.setAttribute('data-anim-ready', '1');
    assignStagger();
    stackTables();
    observe();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
