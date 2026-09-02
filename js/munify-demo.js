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

  /* LAS DEMOS SIEMPRE VAN A QA, tambien desde munify.com.ar. Es a proposito.

     Dos motivos, los dos del dueño (2026-08-31):
     1. El municipio que crea un prospecto es un PROTOTIPO, no tiene validez, y no
        tiene por que ensuciar la base productiva — donde vive el unico municipio
        real (San Pedro Norte).
     2. La base de QA (sugerenciasmun-ensayo) es la que tiene cargada la geografia
        completa: zonas con contorno, localidades por zona, los 6 paises. En la
        base de produccion las demos salen pobres, sin geoposiciones.

     O sea: esto NO es un olvido de promocion que haya que "corregir". Si algun dia
     se quiere que produccion genere demos en su propia base, se cambian estas dos
     constantes sabiendo lo que implica.

     Historia: antes se elegia por hostname con /(^|.)munify.com.ar$/, y como
     "qa.munify.com.ar" TERMINA en ".munify.com.ar" pasaba justo lo contrario: la
     landing de QA escribia en la base REAL. */
  var API = 'https://munify-api-qa-vmpxsxe7ra-uk.a.run.app/api';
  var APP = 'https://qa-app.munify.com.ar';

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
          'Probá con otro nombre o <a href="https://wa.me/5491138518148" target="_blank" rel="noopener">consultanos por WhatsApp</a>.</div>';
        caja.hidden = false; acomodar(); return;
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
          // Se piden las vecinas ya, para tenerlas listas cuando arranque la
          // creacion: pedirlas ahi meteria una espera antes del primer paso.
          traerVecinas(m);
          inpMuni.value = m.nombre;
          btn.disabled = false;
          cerrar();
        });
        caja.appendChild(b);
      });
      caja.hidden = false;
      acomodar();
    }

    function cerrar() {
      caja.hidden = true; caja.innerHTML = '';
      caja.classList.remove('dmsug--arriba');
      caja.style.maxHeight = '';
    }

    /* El listado abria SIEMPRE hacia abajo y con el formulario cerca del pie
       se salia de la pantalla: los ultimos municipios quedaban abajo del
       borde y no habia forma de llegar (dueño, 2026-08-31). Ahora mide lo que
       hay libre y decide: si abajo no entra pero arriba si, abre hacia arriba;
       si no entra en ningun lado, se queda abajo con scroll propio. */
    function acomodar() {
      if (caja.hidden) return;
      caja.classList.remove('dmsug--arriba');
      caja.style.maxHeight = '';
      var refe = caja.parentElement.getBoundingClientRect();
      var alto = caja.scrollHeight;
      var margen = 16;
      var abajo = window.innerHeight - refe.bottom - margen;
      var arriba = refe.top - margen;
      if (alto <= abajo) return;                       // entra abajo, sin tocar nada
      if (alto <= arriba) { caja.classList.add('dmsug--arriba'); return; }
      var lado = Math.max(abajo, arriba);
      if (arriba > abajo) caja.classList.add('dmsug--arriba');
      caja.style.maxHeight = Math.max(140, lado) + 'px';
    }
    window.addEventListener('resize', acomodar);
    window.addEventListener('scroll', acomodar, { passive: true });

    /* ---------- crear la demo ---------- */
    function mostrar(clase, html) {
      estado.className = 'dmestado is-on dmestado--' + clase;
      estado.innerHTML = html;
    }

    /* Las etapas REALES del alta, en el orden en que el backend las corre
       (services/seed_demo.py). Los segundos son estimados y solo marcan el
       ritmo: el ultimo paso no se cierra por reloj sino cuando responde el
       servidor, para que la pantalla nunca diga "listo" antes de que lo este. */
    /* Cada paso con SU icono: siete circulitos iguales no cuentan nada, y esto
       es lo unico que el visitante mira durante los dos minutos que tarda la
       demo (dueño, 2026-08-31). El `s` es cuanto dura: la barrita de abajo se
       llena en ese tiempo, asi el avance se ve en vez de adivinarse. */
    var PASOS = [
      { t: 'Ubicando {M} y su zona',             d: 'coordenadas y localidades del catálogo oficial', s: 2.2,
        ic: '<path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>' },
      { t: 'Trayendo sus barrios',               d: 'los que tiene mapeados OpenStreetMap', s: 2.6,
        ic: '<path d="m12 2 9 4.5-9 4.5-9-4.5L12 2Z"/><path d="m3 12 9 4.5 9-4.5"/><path d="m3 17 9 4.5 9-4.5"/>' },
      { t: 'Armando las áreas del municipio',    d: 'dependencias, y qué reclamo va a cuál', s: 1.6,
        ic: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>' },
      { t: 'Cargando los trámites',              d: 'con los requisitos de cada uno', s: 1.4,
        ic: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M9 15h6"/>' },
      { t: 'Sembrando tres meses de reclamos',   d: 'con su circuito completo, no fotos sueltas', s: 3.2,
        ic: '<path d="m3 11 18-5v12L3 13v-2Z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/>' },
      { t: 'Repartiendo el trabajo de campo',    d: 'cuadrillas, órdenes de trabajo e inventario', s: 2.4,
        ic: '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76Z"/>' },
      { t: 'Abriendo la agenda y la tesorería',  d: 'turnos, cajas y gastos del municipio', s: 2.2,
        ic: '<rect x="2" y="6" width="20" height="13" rx="2"/><path d="M2 10h20M6 15h4"/>' }
    ];

    /* Lo que el seed crea DE VERDAD, para irlo tildando de a uno mientras se
       espera (dueño, 2026-08-31). No es socket: el timing lo marca el `s` de
       cada paso repartido entre sus items. Los que no tienen lista —barrios,
       reclamos— muestran un contador, porque sus nombres salen de OSM recien
       al crearse y ponerlos inventados seria mentir. */
    /* Las localidades de la MISMA provincia, sacadas del catalogo oficial. Es
       lo que hace que la espera no parezca una demo generica: el visitante ve
       nombres de su zona (dueño, 2026-08-31). Son reales —salen del mismo
       endpoint que alimenta el buscador—, no una lista inventada. */
    var VECINAS = [];
    /* El endpoint del catalogo pide 3+ letras (con `q` vacio devuelve 0,
       verificado), asi que se piden dos terminos frecuentes acotados a la
       provincia y se juntan. Los nombres que salen son REALES: los mismos que
       alimentan el buscador de arriba. */
    var SEMILLAS = ['san', 'la', 'villa', 'del'];
    /* Cada pais llama distinto a lo mismo: en Peru y Paraguay son distritos,
       en Chile comunas. Decirle "localidades" a un alcalde peruano es hablarle
       en idioma ajeno (dueño, 2026-08-31). */
    var COMO_SE_LLAMAN = {
      AR: 'localidades', UY: 'municipios', BO: 'municipios',
      PY: 'distritos',   PE: 'distritos',  CL: 'comunas'
    };
    function comoSeLlaman() {
      return COMO_SE_LLAMAN[selPais.value] || 'localidades';
    }
    /* El catalogo de municipios no cambia de un dia para el otro, asi que las
       vecinas de una provincia se guardan 7 dias: la segunda vez que alguien
       arma una demo de la misma zona no sale ni un request (dueño,
       2026-08-31). Mismo patron que el sondeo de paises de arriba. */
    var CACHE_VEC = 'munifyVecinas';
    function cacheLeer(clave) {
      try {
        var c = JSON.parse(localStorage.getItem(CACHE_VEC) || '{}');
        var e = c[clave];
        if (e && Date.now() - e.t < 6048e5 && e.v && e.v.length) return e.v;   // 7 dias
      } catch (e) {}
      return null;
    }
    function cacheGuardar(clave, lista) {
      if (!lista || !lista.length) return;
      try {
        var c = JSON.parse(localStorage.getItem(CACHE_VEC) || '{}');
        c[clave] = { t: Date.now(), v: lista };
        localStorage.setItem(CACHE_VEC, JSON.stringify(c));
      } catch (e) {}
    }

    function traerVecinas(m) {
      VECINAS = [];
      if (!m || !m.provincia) return;
      var pais = selPais.value || 'AR';
      var clave = pais + '|' + m.provincia;
      var guardadas = cacheLeer(clave);
      if (guardadas) {
        // Se saca el municipio elegido por si quedo guardado desde otra demo
        // de la misma provincia.
        VECINAS = guardadas.filter(function (n) { return n !== m.nombre; }).slice(0, 6);
        if (VECINAS.length) return;
      }
      var pendientes = SEMILLAS.length;
      SEMILLAS.forEach(function (q) {
        var url = API + '/municipios/catalogo?q=' + q + '&pais=' + pais
          + '&provincia=' + encodeURIComponent(m.provincia);
        traer(url).then(function (rs) {
          if (!Array.isArray(rs)) return;
          /* Maximo 2 por semilla: con una sola, las seis salian empezando
             con "San" y parecia una lista armada, no la zona real. */
          var puestas = 0;
          rs.forEach(function (r) {
            if (puestas >= 2 || VECINAS.length >= 6) return;
            if (r.nombre && r.nombre !== m.nombre && VECINAS.indexOf(r.nombre) === -1) {
              VECINAS.push(r.nombre); puestas++;
            }
          });
        }).catch(function () { /* sin vecinas cae al aviso: no se inventa nada */ })
          .then(function () {
            // Cuando contestaron las cuatro, se guarda lo que se junto.
            if (--pendientes <= 0) cacheGuardar(clave, VECINAS);
          });
      });
    }

    var DETALLE = [
      { vecinas: true },
      { cuenta: 'barrios mapeados' },
      ['Obras Públicas', 'Servicios Públicos', 'Tránsito y Vial', 'Habilitaciones', 'Ambiente'],
      ['Licencia de conducir', 'Habilitación comercial', 'Permiso de obra menor', 'Libre deuda municipal'],
      { cuenta: 'reclamos con su circuito' },
      ['Cuadrillas', 'Órdenes de trabajo', 'Inventario del corralón'],
      ['Turnos', 'Cajas y fondos', 'Gastos por proyecto']
    ];

    /* Va tildando los items de un paso, uno por uno, y avisa cuando termino. */
    function detallar(fila, i, dur, fin) {
      var d = DETALLE[i];
      var caja = document.createElement('span');
      caja.className = 'dmpaso__items';
      fila.querySelector('.dmpaso__n').appendChild(caja);

      /* Las vecinas viajan por red y pueden no haber llegado (o no existir
         para esa provincia). En vez de dejar el paso mudo, se avisa que se
         estan buscando, con la palabra que usa ESE pais. Si aparecen, se
         tildan; si no, el aviso se queda y no se inventa ningun nombre. */
      if (d && d.vecinas) {
        if (VECINAS.length) {
          d = VECINAS;
        } else {
          var esperando = document.createElement('span');
          esperando.className = 'dmpaso__buscando';
          esperando.textContent = 'Obteniendo ' + comoSeLlaman() + ' de la zona';
          caja.appendChild(esperando);
          var reintentos = 0;
          var espera = setInterval(function () {
            reintentos++;
            if (VECINAS.length) {
              clearInterval(espera);
              caja.removeChild(esperando);
              tildar(caja, VECINAS, Math.max(0.6, dur - reintentos * 0.3), fin);
            } else if (reintentos > 10) {          // ~3s: no llegaron
              clearInterval(espera);
              esperando.textContent = 'Zona ubicada por coordenadas';
              esperando.classList.add('is-ok');
              fin();
            }
          }, 300);
          return;
        }
      }
      if (!d) { caja.remove(); setTimeout(fin, dur * 1000); return; }

      if (d.cuenta) {
        var n = document.createElement('span');
        n.className = 'dmpaso__cuenta';
        caja.appendChild(n);
        var hasta = 12 + Math.floor(Math.random() * 26), v = 0;
        var paso = Math.max(40, (dur * 1000) / hasta);
        var t = setInterval(function () {
          v++; n.textContent = v + ' ' + d.cuenta;
          if (v >= hasta) { clearInterval(t); fin(); }
        }, paso);
        return;
      }

      tildar(caja, d, dur, fin);
    }

    /* Va agregando los chips de a uno, repartidos en el tiempo del paso. */
    function tildar(caja, lista, dur, fin) {
      var k = 0, cada = (dur * 1000) / (lista.length + 0.5);
      var t2 = setInterval(function () {
        if (k >= lista.length) { clearInterval(t2); fin(); return; }
        var it = document.createElement('span');
        it.className = 'dmpaso__it';
        it.textContent = lista[k];
        caja.appendChild(it);
        k++;
      }, cada);
    }

    function pintarPasos(nombre) {
      estado.className = 'dmestado is-on dmestado--work';
      estado.innerHTML = '<b>Creando la demo de ' + nombre + '</b>'
        + '<div class="dmpasos">' + PASOS.map(function (p, i) {
            return '<div class="dmpaso" data-p="' + i + '"' + (i ? ' hidden' : '') + '>'
              + '<span class="dmpaso__ic"><svg viewBox="0 0 24 24" aria-hidden="true">' + p.ic + '</svg></span>'
              + '<span class="dmpaso__n">' + p.t.replace('{M}', nombre)
              + '<span class="dmpaso__d">' + p.d + '</span>'
              + '<span class="dmpaso__barra"><i style="animation-duration:' + p.s + 's"></i></span>'
              + '</span></div>';
          }).join('') + '</div>';
      return estado.querySelectorAll('.dmpaso');
    }

    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      if (!elegido) { inpMuni.focus(); return; }
      btn.disabled = true;

      var filas = pintarPasos(elegido.nombre);
      var actual = 0, timer = null, terminado = false;

      function marcar(i, clase) {
        var f = filas[i]; if (!f) return;
        f.className = 'dmpaso ' + clase;
        /* Cuando le toca, la linea aparece; las anteriores quedan a la vista
           tildadas, que es lo que muestra el trabajo hecho. */
        if (f.hidden) { f.hidden = false; f.classList.add('entra'); }
      }
      function avanzar() {
        if (terminado) return;
        if (actual > 0) marcar(actual - 1, 'is-ok');
        /* Se frena en el ultimo: de ahi no pasa hasta que el servidor conteste. */
        if (actual >= PASOS.length) return;
        var i = actual;
        marcar(i, 'is-now');
        actual++;
        /* El paso no avanza por reloj pelado: avanza cuando termino de tildar
           sus items. Asi lo que se ve es el trabajo, no una barra que corre. */
        detallar(filas[i], i, PASOS[i].s, function () {
          if (!terminado) timer = setTimeout(avanzar, 180);
        });
      }
      avanzar();

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
          terminado = true; clearTimeout(timer);
          for (var i = 0; i < PASOS.length; i++) marcar(i, 'is-ok');
          var pie = document.createElement('div');
          pie.className = 'dmpaso is-now';
          pie.innerHTML = '<span class="dmpaso__ic"></span><span class="dmpaso__n">Entrando a '
            + d.nombre + '…</span>';
          estado.querySelector('.dmpasos').appendChild(pie);
          /* Medio segundo para que se vean los siete tildes antes de saltar:
             es el momento en que el prospecto entiende TODO lo que se armo. */
          setTimeout(function () {
            /* LA LLAVE VIAJA EN LA URL, y no es un detalle: la app vive en OTRO
               dominio, asi que el localStorage donde ella la guarda no se
               comparte con esta pagina. Sin este parametro, el prospecto que
               acaba de generar su demo llega a una pantalla que no lo deja
               entrar — la demo es suya y no tiene como abrirla. */
            var url = APP + (d.redirect_path || '/' + d.codigo);
            if (d.demo_token) {
              url += (url.indexOf('?') === -1 ? '?' : '&')
                   + 't=' + encodeURIComponent(d.demo_token);
            }
            window.location.href = url;
          }, 650);
        })
        .catch(function () {
          terminado = true; clearTimeout(timer);
          /* El paso en curso queda en rojo: se ve DONDE se corto, no un
             "algo salio mal" generico. */
          marcar(Math.max(0, actual - 1), 'is-bad');
          btn.disabled = false;
          var msg = document.createElement('div');
          msg.className = 'dmestado__err';
          msg.innerHTML = 'No pudimos crear la demo. Probá de nuevo o '
            + '<a href="https://wa.me/5491138518148" target="_blank" rel="noopener">escribinos por WhatsApp</a>.';
          estado.appendChild(msg);
          estado.className = 'dmestado is-on dmestado--bad';
        });
    });

    /* ---------- el contador ----------
       Cuenta TODAS las demos que se generaron alguna vez, no las que estan
       vivas hoy (dueño, 2026-09-02): las que se dieron de baja fueron
       municipios reales que armaron la suya y se borraron por comodidad
       nuestra. Y sube con cada una nueva, aunque a esa no se le de acceso —
       se genero igual.

       Sale de la base, no hay piso decorativo: el numero real ya es mas del
       doble del que se iba a poner a mano. Si el endpoint no contesta, el
       KPI se esconde en vez de mostrar un numero inventado. */
    function cargarContador() {
      var kpi = $('[data-cat-demos]');
      if (!kpi) return;
      traer(API + '/municipios/public/demo-stats').then(function (st) {
        var n = (st && st.generadas) || 0;
        if (!n) throw new Error('sin dato');
        kpi.textContent = n;
      }).catch(function () {
        var caja = kpi.parentElement;
        if (caja) caja.style.display = 'none';
      });
    }

    /* ---------- los que ya armaron su demo ----------
       DOS COSAS DISTINTAS salen de la misma llamada (Lucas, 2026-09-02):

       1. El LISTADO COMERCIAL: los municipios que ya generaron la suya. Es
          para mostrar volumen —"mira cuantos ya la tienen"—, no un menu de
          accesos: no se entra a ninguno, porque la demo de otro puede tener
          los datos que cargo esa persona. Por eso ningun item es un link.

       2. La de MUESTRA (`demo_publica`), que sale del listado y va arriba,
          en su propio bloque, como la puerta para el que no quiere generar
          nada. Es una sola: si hubiera varias marcadas, manda la primera. */
    function cargarDemos() {
      var cont = $('[data-demos]'), buscador = $('[data-buscar-demo]');
      var probar = $('[data-probar]');
      if (!cont) return;
      traer(API + '/municipios/public').then(function (ds) {
        var muestra = null, lista = [];
        ds.forEach(function (d) {
          if (d.demo_publica && !muestra) muestra = d; else lista.push(d);
        });

        if (probar && muestra) {
          probar.href = APP + '/' + muestra.codigo;
          probar.hidden = false;
        }

        function pintar(filtro) {
          var f = (filtro || '').trim().toLowerCase();
          var vis = f ? lista.filter(function (d) {
            return (d.nombre + ' ' + d.codigo).toLowerCase().indexOf(f) !== -1;
          }) : lista;
          cont.innerHTML = '';
          if (!vis.length) {
            cont.innerHTML = '<div class="dmex__vacio">No hay municipios que coincidan con “' + f + '”.</div>';
            return;
          }
          vis.forEach(function (d) {
            var it = document.createElement('div');
            it.className = 'dmit';
            it.innerHTML = '<span class="dmit__p"></span><span class="dmit__n"></span>';
            it.querySelector('.dmit__n').textContent = d.nombre;
            cont.appendChild(it);
          });
        }
        pintar('');
        if (buscador) buscador.addEventListener('input', function () { pintar(buscador.value); });
      }).catch(function () {
        cont.innerHTML = '<div class="dmex__vacio">No pudimos cargar el listado. Recargá la página.</div>';
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

  /* ---------- Llegada desde el directorio de llamados ----------
     /demo?m=Chivilcoy&pais=AR&origen=llamados

     Quien vende no tiene que tipear el municipio delante del cliente: llega
     con el nombre puesto, la busqueda ya hecha y el boton habilitado. Lo unico
     que le queda es apretar "Probar ahora" — que es el momento que el cliente
     tiene que ver, no la parte de escribir.

     A proposito NO se crea sola: el acto de crearla es la demostracion. Si la
     pantalla llegara con la demo ya hecha, se pierde lo unico que impresiona,
     que es verla aparecer. */
  function precargarDesdeURL() {
    var p = new URLSearchParams(location.search);
    var muni = (p.get('m') || p.get('municipio') || '').trim();
    if (!muni) return;
    var pais = (p.get('pais') || 'AR').toUpperCase();

    var aplicar = function () {
      if ([].slice.call(selPais.options).some(function (o) { return o.value === pais && !o.disabled; })) {
        selPais.value = pais;
      }
      inpMuni.value = muni;
      cargarProvincias(selPais.value).then(function () {
        var url = modoLegacy
          ? API + '/municipios/argentina?q=' + encodeURIComponent(muni)
          : API + '/municipios/catalogo?q=' + encodeURIComponent(muni) + '&pais=' + selPais.value;
        traer(url).then(function (rs) {
          /* Con una sola coincidencia se elige sola: es el caso normal viniendo
             del directorio, donde el municipio ya esta identificado. Con varias
             (hay 6 'San Martin' en el pais) se muestran para que elija la
             persona: adivinar el municipio equivocado delante del cliente es
             peor que un click de mas. */
          var exacta = rs.filter(function (x) {
            return x.nombre.toLowerCase() === muni.toLowerCase();
          });
          if (exacta.length === 1) {
            elegido = exacta[0];
            inpMuni.value = exacta[0].nombre;
            btn.disabled = false;
            mostrar('work', 'Listo para crear la demo de <b>' + exacta[0].nombre + '</b>. Cuando quieras, tocá “Probar ahora”.');
          } else if (rs.length) {
            pintarSugerencias(rs);
          }
        }).catch(function () {});
      });
    };

    /* El combo de paises se llena tras sondear el catalogo: si todavia no
       esta, se espera a que aparezca en vez de escribir sobre un select vacio. */
    if (selPais.options.length) aplicar();
    else {
      var esperas = 0;
      var t = setInterval(function () {
        if (selPais.options.length || ++esperas > 40) { clearInterval(t); aplicar(); }
      }, 150);
    }
  }

    cargarDemos();
    cargarContador();
    precargarDesdeURL();
  }


  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar);
  else iniciar();
})();
