/* ============================================================
   Munify — pantalla pública de demos (landing comercial)
   Spec: docs/design-sync/comercial-2026-08-30/pages/Demo.dc.html

   País → provincia → municipio del catálogo oficial → crear demo.

   DEGRADA SOLA, y eso no es un detalle: los endpoints multipaís
   viven hoy en `qa` y todavía no están promovidos a producción
   (verificado: /catalogo da 401 y /catalogo/provincias 404 en
   prod, mientras /argentina responde bien). Entonces:

     - se prueba /catalogo?pais=XX por país; el que no responde,
       queda deshabilitado en el combo, NO listado como si
       anduviera;
     - si ninguno responde, cae a /municipios/argentina y la
       pantalla funciona igual con Argentina;
     - las provincias sólo se ofrecen si /catalogo/provincias
       contesta. Sin ese endpoint no se inventan: el combo queda
       deshabilitado y el autocomplete busca en todo el país.

   Cuando Infra promueva qa→prod, los 6 países y las provincias
   aparecen solos, sin tocar una línea de esto.
   ============================================================ */
(function () {
  'use strict';

  var API = 'https://munify-api-1060106389361.us-east4.run.app/api';
  var APP = 'https://app.munify.com.ar';

  var PAISES = [
    { c: 'AR', n: 'Argentina' }, { c: 'PY', n: 'Paraguay' }, { c: 'UY', n: 'Uruguay' },
    { c: 'CL', n: 'Chile' },     { c: 'PE', n: 'Perú' },     { c: 'BO', n: 'Bolivia' }
  ];

  var $ = function (s, r) { return (r || document).querySelector(s); };

  function traer(url) {
    return fetch(url, { cache: 'no-store' }).then(function (r) {
      if (!r.ok) throw new Error(r.status);
      return r.json();
    });
  }

  function iniciar() {
    var form = $('[data-crear]');
    if (!form) return;

    var selPais = $('[data-pais]'), selProv = $('[data-provincia]');
    var inpMuni = $('[data-muni]'), caja = $('[data-sug]'), btn = $('[data-crear-btn]');
    var estado = $('[data-estado]'), leyenda = $('[data-cat-leyenda]');
    var elegido = null, paisesVivos = [], modoLegacy = false;

    /* ---------- qué países tienen catálogo de verdad ---------- */
    var CACHE = 'munifyCatalogoPaises';
    function sondear() {
      /* El resultado se cachea 24h: preguntar en cada carga si el catalogo
         multipais esta publicado es un request (y un 401 en consola) que no
         aporta nada al segundo visitante del dia. */
      try {
        var c = JSON.parse(localStorage.getItem(CACHE) || 'null');
        if (c && Date.now() - c.t < 864e5) return Promise.resolve(c.p);
      } catch (e) {}
      return sondearReal().then(function (p) {
        try { localStorage.setItem(CACHE, JSON.stringify({ t: Date.now(), p: p })); } catch (e) {}
        return p;
      });
    }
    function sondearReal() {
      /* Se prueba AR primero y solo. Si el catalogo multipais no esta
         publicado, ese unico request ya lo dice y no tiene sentido pedir los
         otros cinco para cobrar cinco 401 en la consola del visitante. */
      return traer(API + '/municipios/catalogo?q=san&pais=AR')
        .then(function (r) {
          if (!Array.isArray(r) || !r.length) return [];
          return Promise.all(PAISES.slice(1).map(function (p) {
            return traer(API + '/municipios/catalogo?q=san&pais=' + p.c)
              .then(function (x) { return Array.isArray(x) && x.length ? p : null; })
              .catch(function () { return null; });
          })).then(function (rs) { return [PAISES[0]].concat(rs.filter(Boolean)); });
        })
        .catch(function () { return []; });
    }

    function pintarPaises() {
      selPais.innerHTML = '';
      var lista = paisesVivos.length ? paisesVivos : [{ c: 'AR', n: 'Argentina' }];
      lista.forEach(function (p) {
        var o = document.createElement('option');
        o.value = p.c; o.textContent = p.n;
        selPais.appendChild(o);
      });
      /* Los que no tienen catálogo se muestran deshabilitados, no se ocultan:
         es honesto decir "todavía no" en vez de fingir que no existen. */
      if (paisesVivos.length && paisesVivos.length < PAISES.length) {
        PAISES.forEach(function (p) {
          if (paisesVivos.some(function (v) { return v.c === p.c; })) return;
          var o = document.createElement('option');
          o.value = p.c; o.textContent = p.n + ' — próximamente';
          o.disabled = true;
          selPais.appendChild(o);
        });
      }
      selPais.disabled = lista.length < 2;
    }

    /* ---------- provincias del país elegido ---------- */
    function cargarProvincias(pais) {
      selProv.innerHTML = '<option value="">Elegí la provincia…</option>';
      selProv.disabled = true;
      if (modoLegacy) return Promise.resolve();
      return traer(API + '/municipios/catalogo/provincias?pais=' + pais)
        .then(function (ps) {
          if (!Array.isArray(ps) || !ps.length) return;
          ps.forEach(function (p) {
            var o = document.createElement('option');
            o.value = p.provincia;
            o.textContent = p.provincia + ' (' + p.total + ')';
            selProv.appendChild(o);
          });
          selProv.disabled = false;
        })
        .catch(function () { /* sin endpoint: se busca en todo el país */ });
    }

    /* ---------- autocomplete de municipio ---------- */
    var timer = null;
    function buscar() {
      var q = inpMuni.value.trim();
      elegido = null; btn.disabled = true;
      if (q.length < 2) { cerrar(); return; }
      clearTimeout(timer);
      timer = setTimeout(function () {
        var url = modoLegacy
          ? API + '/municipios/argentina?q=' + encodeURIComponent(q)
          : API + '/municipios/catalogo?q=' + encodeURIComponent(q) + '&pais=' + selPais.value +
            (selProv.value ? '&provincia=' + encodeURIComponent(selProv.value) : '');
        traer(url).then(pintarSugerencias).catch(function () { cerrar(); });
      }, 220);
    }

    function pintarSugerencias(rs) {
      caja.innerHTML = '';
      if (!rs.length) {
        caja.innerHTML = '<div class="dmsug__vacio">No encontramos ese municipio en el catálogo. ' +
          'Probá con otro nombre o <a href="https://wa.me/5491160526449" target="_blank" rel="noopener">consultanos por WhatsApp</a>.</div>';
        caja.hidden = false; return;
      }
      rs.slice(0, 6).forEach(function (m) {
        var b = document.createElement('button');
        b.type = 'button'; b.className = 'dmsug__i';
        b.innerHTML =
          '<span class="dmsug__ico"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path><circle cx="12" cy="10" r="3"></circle></svg></span>' +
          '<span class="dmsug__n"></span><span class="dmsug__p"></span><span class="dmsug__a">Crear demo →</span>';
        b.querySelector('.dmsug__n').textContent = m.nombre;
        b.querySelector('.dmsug__p').textContent = m.provincia || '';
        b.addEventListener('click', function () {
          elegido = m;
          inpMuni.value = m.nombre;
          btn.disabled = false;
          cerrar();
        });
        caja.appendChild(b);
      });
      caja.hidden = false;
    }

    function cerrar() { caja.hidden = true; caja.innerHTML = ''; }

    /* ---------- crear la demo ---------- */
    function mostrar(clase, html) {
      estado.className = 'dmestado is-on dmestado--' + clase;
      estado.innerHTML = html;
    }

    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      if (!elegido) { inpMuni.focus(); return; }
      btn.disabled = true;
      mostrar('work', '<span class="dmspin"></span> Armando la demo de ' + elegido.nombre + '…');

      fetch(API + '/municipios/crear-demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: elegido.nombre,
          lat: elegido.lat, lng: elegido.lng,
          provincia: elegido.provincia || null
        })
      })
        .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
        .then(function (d) {
          mostrar('work', '<span class="dmspin"></span> Listo. Entrando a ' + d.nombre + '…');
          window.location.href = APP + (d.redirect_path || '/' + d.codigo);
        })
        .catch(function () {
          btn.disabled = false;
          mostrar('bad', 'No pudimos crear la demo. Probá de nuevo o ' +
            '<a href="https://wa.me/5491160526449" target="_blank" rel="noopener">escribinos por WhatsApp</a>.');
        });
    });

    /* ---------- demos existentes ---------- */
    function cargarDemos() {
      var cont = $('[data-demos]'), buscador = $('[data-buscar-demo]');
      if (!cont) return;
      traer(API + '/municipios/public').then(function (ds) {
        var kpi = $('[data-cat-demos]');
        if (kpi) kpi.textContent = ds.length;

        function pintar(filtro) {
          var f = (filtro || '').trim().toLowerCase();
          var vis = f ? ds.filter(function (d) {
            return (d.nombre + ' ' + d.codigo).toLowerCase().indexOf(f) !== -1;
          }) : ds;
          cont.innerHTML = '';
          if (!vis.length) {
            cont.innerHTML = '<div class="dmex__vacio">No hay demos que coincidan con “' + f + '”.</div>';
            return;
          }
          vis.forEach(function (d) {
            var a = document.createElement('a');
            a.className = 'dmchip';
            a.href = APP + '/' + d.codigo;
            a.innerHTML = '<div class="dmchip__b"><div class="dmchip__n"></div><div class="dmchip__s"></div></div><span class="dmchip__a">Entrar →</span>';
            a.querySelector('.dmchip__n').textContent = d.nombre;
            a.querySelector('.dmchip__s').textContent = d.codigo;
            cont.appendChild(a);
          });
        }
        pintar('');
        if (buscador) buscador.addEventListener('input', function () { pintar(buscador.value); });
      }).catch(function () {
        cont.innerHTML = '<div class="dmex__vacio">No pudimos cargar las demos. Recargá la página.</div>';
      });
    }

    /* ---------- arranque ---------- */
    selPais.addEventListener('change', function () {
      inpMuni.value = ''; elegido = null; btn.disabled = true; cerrar();
      cargarProvincias(selPais.value);
    });
    selProv.addEventListener('change', function () { if (inpMuni.value.trim().length >= 2) buscar(); });
    inpMuni.addEventListener('input', buscar);
    document.addEventListener('click', function (e) {
      if (!e.target.closest('.dmwrap')) cerrar();
    });

    sondear().then(function (vivos) {
      paisesVivos = vivos;
      modoLegacy = vivos.length === 0;      // sin catálogo multipaís: sólo AR
      pintarPaises();
      var n = vivos.length || 1;
      if (leyenda) {
        leyenda.textContent = modoLegacy
          ? 'Catálogo oficial de municipios de Argentina'
          : 'Catálogo oficial en ' + n + (n === 1 ? ' país' : ' países');
      }
      var kp = $('[data-cat-paises]'), kl = $('[data-cat-paises-lbl]');
      if (kp) kp.textContent = n;
      if (kl) kl.textContent = n === 1 ? 'país' : 'países';
      /* No existe endpoint que devuelva cuantos municipios tiene el catalogo.
         El prototipo dice 5.122, pero hardcodear ese numero seria presentar
         como real un dato que no verificamos: se oculta el KPI. */
      var kt = $('[data-cat-total]');
      if (kt && kt.textContent === '—') {
        var box = kt.parentElement;
        if (box) box.style.display = 'none';
        var grid = box && box.parentElement;
        if (grid) grid.style.gridTemplateColumns = 'repeat(3,1fr)';
      }
      var tit = $('[data-catalogo-titulo]');
      if (tit) tit.textContent = 'Munify · Catálogo oficial de ' + n + (n === 1 ? ' país' : ' países');
      return cargarProvincias(selPais.value);
    });

    cargarDemos();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar);
  else iniciar();
})();
