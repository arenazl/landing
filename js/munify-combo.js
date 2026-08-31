/**
 * munify-combo.js — el desplegable de la landing, con la cara de la app.
 *
 * Un `<select>` nativo abre la lista que dibuja el SISTEMA OPERATIVO: fondo
 * blanco, tipografía de Windows y esa barra de scroll gris, en el medio de una
 * página oscura (dueño, 2026-08-31).
 *
 * En vez de reemplazar el select —que rompería todo el JS que ya lee su
 * `.value` y escucha su `change`—, se lo deja EN SU LUGAR, invisible, y se le
 * monta encima un combo que lo maneja. Para `munify-demo.js` nada cambió: sigue
 * habiendo un select con sus opciones y sus eventos.
 *
 * Se auto-actualiza: las provincias se cargan por JS después del arranque, así
 * que un MutationObserver repinta la lista cuando cambian las <option>.
 */
(function () {
  'use strict';

  var ABIERTO = null;   // sólo un combo abierto por vez

  function crear(sel) {
    if (sel.dataset.comboListo) return;
    sel.dataset.comboListo = '1';

    var caja = document.createElement('div');
    caja.className = 'mcombo';

    var boton = document.createElement('button');
    boton.type = 'button';
    boton.className = 'mcombo__b';
    boton.setAttribute('aria-haspopup', 'listbox');
    boton.setAttribute('aria-expanded', 'false');
    if (sel.getAttribute('aria-label')) boton.setAttribute('aria-label', sel.getAttribute('aria-label'));

    var texto = document.createElement('span');
    texto.className = 'mcombo__t';
    boton.appendChild(texto);

    var flecha = document.createElement('span');
    flecha.className = 'mcombo__f';
    flecha.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><polyline points="6 9 12 15 18 9"/></svg>';
    boton.appendChild(flecha);

    var panel = document.createElement('div');
    panel.className = 'mcombo__p';
    panel.setAttribute('role', 'listbox');
    panel.hidden = true;

    sel.parentNode.insertBefore(caja, sel);
    caja.appendChild(boton);
    caja.appendChild(panel);
    caja.appendChild(sel);          // el select real queda adentro, oculto por CSS

    function pintar() {
      texto.textContent = sel.options.length && sel.selectedIndex >= 0
        ? sel.options[sel.selectedIndex].textContent
        : '';
      boton.disabled = sel.disabled;
      caja.classList.toggle('is-off', sel.disabled);
      /* Sin valor elegido el rótulo va apagado: es un placeholder, no un dato. */
      caja.classList.toggle('is-vacio', !sel.value);

      panel.innerHTML = '';
      Array.prototype.forEach.call(sel.options, function (op, i) {
        var it = document.createElement('button');
        it.type = 'button';
        it.className = 'mcombo__o' + (i === sel.selectedIndex ? ' is-sel' : '');
        it.setAttribute('role', 'option');
        it.setAttribute('aria-selected', i === sel.selectedIndex ? 'true' : 'false');
        it.textContent = op.textContent;
        it.addEventListener('click', function () {
          sel.value = op.value;
          sel.dispatchEvent(new Event('change', { bubbles: true }));
          cerrar();
          pintar();
        });
        panel.appendChild(it);
      });
    }

    function abrir() {
      if (sel.disabled) return;
      if (ABIERTO && ABIERTO !== cerrar) ABIERTO();
      panel.hidden = false;
      caja.classList.add('is-open');
      boton.setAttribute('aria-expanded', 'true');
      ABIERTO = cerrar;
      /* Si abajo no entra, abre hacia arriba: mismo criterio que el listado de
         municipios, que se salía de la pantalla. */
      var r = boton.getBoundingClientRect();
      var libre = window.innerHeight - r.bottom - 16;
      var alto = Math.min(panel.scrollHeight, 320);
      caja.classList.toggle('mcombo--arriba', alto > libre && r.top > libre);
      panel.style.maxHeight = Math.max(160, Math.min(320, Math.max(libre, r.top - 16))) + 'px';
      var elegida = panel.querySelector('.is-sel');
      if (elegida) elegida.scrollIntoView({ block: 'nearest' });
    }

    function cerrar() {
      panel.hidden = true;
      caja.classList.remove('is-open', 'mcombo--arriba');
      boton.setAttribute('aria-expanded', 'false');
      if (ABIERTO === cerrar) ABIERTO = null;
    }

    boton.addEventListener('click', function (e) {
      e.stopPropagation();
      panel.hidden ? abrir() : cerrar();
    });
    boton.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') { e.preventDefault(); abrir(); }
      if (e.key === 'Escape') cerrar();
    });
    document.addEventListener('click', function (e) { if (!caja.contains(e.target)) cerrar(); });
    window.addEventListener('resize', cerrar);

    // Las provincias llegan por JS después del arranque: hay que repintar.
    new MutationObserver(pintar).observe(sel, { childList: true, attributes: true, attributeFilter: ['disabled'] });
    sel.addEventListener('change', pintar);

    pintar();
  }

  function montar() {
    Array.prototype.forEach.call(document.querySelectorAll('select.dmsel'), crear);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', montar);
  else montar();
})();
