/* ============================================================
   Munify — switcher de tema (restyling comercial 2026)
   Spec: docs/design-sync/comercial-2026-08-30/README.md

   Dark es el modo PRINCIPAL. El handoff trae las paginas Light
   duplicadas solo para documentar el mapeo de colores; en
   produccion es un switcher real, que es lo que hace este archivo.

   Sin flash: el guard inline del <head> aplica data-theme antes
   de que pinte nada (mismo patron que el "anim guard" existente).
   ============================================================ */
(function () {
  'use strict';

  var KEY = 'munifyTheme';
  var DARK = 'dark', LIGHT = 'light';

  function current() {
    return document.documentElement.getAttribute('data-theme') === LIGHT ? LIGHT : DARK;
  }

  function apply(mode) {
    if (mode === LIGHT) document.documentElement.setAttribute('data-theme', LIGHT);
    else document.documentElement.removeAttribute('data-theme');
    try { localStorage.setItem(KEY, mode); } catch (e) {}
    var btn = document.querySelector('[data-theme-toggle]');
    if (btn) {
      var next = mode === LIGHT ? 'oscuro' : 'claro';
      btn.setAttribute('aria-label', 'Cambiar a modo ' + next);
      btn.setAttribute('title', 'Cambiar a modo ' + next);
    }
    window.dispatchEvent(new CustomEvent('munify:themechange', { detail: { mode: mode } }));
  }

  function toggle() { apply(current() === LIGHT ? DARK : LIGHT); }

  /* Iconos SVG (nunca emojis): sol = pasar a claro, luna = pasar a oscuro */
  var ICONS =
    '<svg class="icon-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"' +
    ' stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<circle cx="12" cy="12" r="4"></circle>' +
    '<path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2' +
    'M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"></path></svg>' +
    '<svg class="icon-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"' +
    ' stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<path d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.79 9.79z"></path></svg>';

  function mount() {
    var btn = document.querySelector('[data-theme-toggle]');
    if (!btn) {
      /* Si la pagina todavia no declara el boton, se inyecta al final del nav */
      var host = document.querySelector('.nav__actions') ||
                 document.querySelector('.nav__links') ||
                 document.querySelector('nav');
      if (!host) return;
      btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'theme-toggle';
      btn.setAttribute('data-theme-toggle', '');
      host.appendChild(btn);
    }
    if (!btn.innerHTML.trim()) btn.innerHTML = ICONS;
    if (!btn.classList.contains('theme-toggle')) btn.classList.add('theme-toggle');
    btn.addEventListener('click', toggle);
    apply(current());
  }

  window.MunifyTheme = { apply: apply, toggle: toggle, current: current };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
  else mount();
})();

/* ============================================================
   02 · Los dos lados en tiempo real — simulación sincronizada.
   Los 4 estados (Recibido → Asignado → En camino → Resuelto)
   avanzan solos cada 2s y mueven LOS DOS paneles a la vez: es
   lo que la sección tiene que demostrar. Arranca al entrar en
   viewport y se detiene al salir; respeta reduced-motion y la
   pausa global de animaciones del sitio.
   ============================================================ */
(function () {
  'use strict';

  var ESTADOS = [
    { pill: 'Recibido',    sub: 'recién ingresado · sin asignar',   toast: 'Tu reclamo fue recibido',        color: 'var(--accent)',        bg: 'var(--accent-soft)' },
    { pill: 'Asignado',    sub: 'Cuadrilla 3 · clasificado por IA', toast: 'Ya lo tomó la Cuadrilla 3',      color: 'var(--accent-bright)', bg: 'rgba(63,106,200,0.2)' },
    { pill: 'En camino',   sub: 'Cuadrilla 3 · en la calle',        toast: 'La cuadrilla salió al lugar',    color: 'var(--warn)',          bg: 'var(--warn-soft)' },
    { pill: 'Resuelto',    sub: 'resuelto con foto de evidencia',   toast: 'Tu reclamo fue resuelto',        color: 'var(--good)',          bg: 'var(--good-soft)' }
  ];

  function arrancar(sec) {
    var pasos = sec.querySelectorAll('.vstep');
    var pill = sec.querySelector('[data-pill]');
    var sub = sec.querySelector('[data-row-sub]');
    var toast = sec.querySelector('[data-toast]');
    var toastT = sec.querySelector('[data-toast-title]');
    var sync = sec.querySelector('[data-sync]');
    if (!pasos.length || !pill) return;

    var i = 0, timer = null, giro = 0;

    function pintar() {
      var e = ESTADOS[i];
      for (var k = 0; k < pasos.length; k++) pasos[k].classList.toggle('is-on', k <= i);
      pill.textContent = e.pill;
      pill.style.color = e.color;
      pill.style.background = e.bg;
      if (sub) sub.textContent = e.sub;
      if (toastT) toastT.textContent = e.toast;
      if (toast) {
        toast.classList.remove('is-on');
        /* reflow para que la transición vuelva a correr en cada paso */
        void toast.offsetWidth;
        toast.classList.add('is-on');
      }
      if (sync) { giro += 180; sync.style.transform = 'rotate(' + giro + 'deg)'; }
    }

    function tick() { i = (i + 1) % ESTADOS.length; pintar(); }

    function play() {
      if (timer) return;
      pintar();
      timer = setInterval(tick, 2000);
    }
    function stop() { clearInterval(timer); timer = null; }

    var quieto = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (quieto) { pintar(); return; }

    if (!('IntersectionObserver' in window)) { play(); return; }
    new IntersectionObserver(function (es) {
      es.forEach(function (en) { en.isIntersecting ? play() : stop(); });
    }, { threshold: 0.35 }).observe(sec);

    /* La pausa global del sitio (botón de la topbar) también la frena */
    document.addEventListener('munify:anim', function (ev) {
      if (ev.detail && ev.detail.paused) stop(); else play();
    });
  }

  function init() {
    var secs = document.querySelectorAll('[data-sim]');
    for (var i = 0; i < secs.length; i++) arrancar(secs[i]);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();

/* ============================================================
   03 - Carrusel del intendente. Auto-avance 3.6s, pausa en
   hover, dots clickeables (el activo se estira) y flechas.
   Igual que la simulacion: corre solo mientras se ve.
   ============================================================ */
(function () {
  'use strict';

  function armar(sec) {
    var slides = sec.querySelectorAll('[data-slide]');
    var dotsBox = sec.querySelector('[data-dots]');
    var prev = sec.querySelector('[data-prev]');
    var next = sec.querySelector('[data-next]');
    if (slides.length < 2) return;

    var i = 0, timer = null, dots = [];

    for (var k = 0; k < slides.length; k++) {
      (function (n) {
        var d = document.createElement('button');
        d.type = 'button';
        d.className = 'carru__dot' + (n === 0 ? ' is-on' : '');
        d.setAttribute('aria-label', 'Ver panel ' + (n + 1));
        d.addEventListener('click', function () { ir(n); reiniciar(); });
        dotsBox.appendChild(d);
        dots.push(d);
      })(k);
    }

    function ir(n) {
      i = (n + slides.length) % slides.length;
      for (var k = 0; k < slides.length; k++) {
        slides[k].classList.toggle('is-on', k === i);
        dots[k].classList.toggle('is-on', k === i);
      }
    }

    function avanzar() { ir(i + 1); }
    function play() { if (!timer) timer = setInterval(avanzar, 3600); }
    function stop() { clearInterval(timer); timer = null; }
    function reiniciar() { stop(); play(); }

    if (prev) prev.addEventListener('click', function () { ir(i - 1); reiniciar(); });
    if (next) next.addEventListener('click', function () { ir(i + 1); reiniciar(); });

    /* Pausa en hover: si lo esta mirando, no se lo movemos abajo del dedo */
    sec.addEventListener('mouseenter', stop);
    sec.addEventListener('mouseleave', play);

    var quieto = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (quieto) return;

    if (!('IntersectionObserver' in window)) { play(); return; }
    new IntersectionObserver(function (es) {
      es.forEach(function (en) { en.isIntersecting ? play() : stop(); });
    }, { threshold: 0.25 }).observe(sec);
  }

  function init() {
    var cs = document.querySelectorAll('[data-carru]');
    for (var i = 0; i < cs.length; i++) armar(cs[i]);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
