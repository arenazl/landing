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
