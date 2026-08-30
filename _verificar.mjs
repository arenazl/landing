/* ============================================================
   Verificador del restyling — TODAS las páginas, los 2 modos.

   Existe por una razón concreta: los checks anteriores daban verde
   mientras el dueño veía problemas reales. Dos causas de falso
   positivo, ya corregidas acá:

   1. Mirar SOLO body y h1. La fuente se rompía en los eyebrows
      (munify-v2 los clava en Manrope con !important) y no lo veía.
      -> ahora se chequea la familia computada de UNA MUESTRA de
         cada tipo de elemento, y que la fuente esté realmente
         CARGADA (document.fonts.check), no sólo declarada.
   2. Capturar sin scrollear. Las secciones .reveal arrancan en
      opacity 0 y salían huecos negros que no eran bugs.
      -> se recorre la página entera antes de capturar.

   3. Probar UN SOLO ancho (1440). La topbar entraba ahi y se
      rompia a ~1180: el logo pisaba el primer link y el boton de
      WhatsApp se plegaba en cuatro renglones.
      -> `node _check_anchos.mjs` mide la barra en 11 anchos.

   Uso:  node _verificar.mjs            (todas)
         node _verificar.mjs index      (una)
         node _check_anchos.mjs         (la topbar en 11 anchos)
   ============================================================ */
import { createRequire } from 'module';
const require = createRequire('d:/Code/sugerenciasMun/frontend/');
const { chromium } = require('playwright');

const BASE = 'http://localhost:8123';
const OUT = 'd:/Code/sugerenciasMun/landing/_shots';

const PAGINAS = [
  ['index', '/'],
  ['reclamos', '/reclamos-vecinales'],
  ['tramites', '/tramites-municipales'],
  ['tesoreria', '/tesoreria'],
  ['precios', '/precios'],
  ['contacto', '/contacto'],
  ['demo', '/demo.html'],
  ['comunicaciones', '/comunicaciones.html'],
  ['software', '/software-gestion-municipal'],
];

const filtro = process.argv[2];
const lista = filtro ? PAGINAS.filter(p => p[0] === filtro) : PAGINAS;

let fallas = [];
const b = await chromium.launch({ channel: 'msedge', args: ['--disable-http-cache'] });
/* bypassCache: sin esto se mide el CSS cacheado y los arreglos parecen no aplicar */

for (const [nombre, ruta] of lista) {
  for (const modo of ['dark', 'light']) {
    const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
    const p = await (async () => { const q = await ctx.newPage(); await q.route('**/*.{css,js}', r => r.continue({ headers: { ...r.request().headers(), 'cache-control': 'no-cache' } })); return q; })();
    const errs = [], reqFail = [];
    // El 401 de /municipios/catalogo NO es un fallo: la pantalla de demos
    // pregunta si el catalogo multipais ya esta publicado en prod y degrada
    // sola segun la respuesta. Se lo distingue de un error de verdad en vez
    // de relajar el check entero.
    let sondaCatalogo = 0;
    p.on('response', r => { if (/municipios\/catalogo/.test(r.url()) && r.status() === 401) sondaCatalogo++; });
    p.on('console', m => { if (m.type() === 'error') errs.push(m.text().slice(0, 90)); });
    p.on('requestfailed', r => { if (!/\.mp4/.test(r.url())) reqFail.push(r.url().split('/').pop()); });

    const id = `${nombre}/${modo}`;
    const mal = (m) => fallas.push(`${id}: ${m}`);

    await p.goto(BASE + ruta, { waitUntil: 'networkidle' });
    if (modo === 'light') { await p.click('[data-theme-toggle]').catch(() => mal('no hay toggle de tema')); await p.waitForTimeout(600); }
    await p.waitForTimeout(700);

    // --- FUENTES: por elemento, y realmente cargadas ---
    const f = await p.evaluate(async () => {
      await document.fonts.ready;
      const fam = el => el ? getComputedStyle(el).fontFamily.split(',')[0].replace(/["']/g, '').trim() : null;
      const sel = s => document.querySelector(s);
      const muestras = {
        body: fam(document.body),
        h1: fam(sel('h1')),
        h2: fam(sel('h2')),
        h3: fam(sel('h3')),
        parrafo: fam(sel('main p, p')),
        eyebrow: fam(sel('.eyebrow, .hero2__eyebrow, .sec2__eyebrow')),
        boton: fam(sel('.btn, .btn2')),
        nav: fam(sel('.tb2__nav a')),
      };
      const familias = [...new Set(Object.values(muestras).filter(Boolean))];
      /* Hay que preguntar por el PESO que la pagina realmente usa: el navegador
         solo descarga los pesos que aparecen, y `check('16px Sora')` asume 400.
         Comunicaciones usa Sora 600/700/800 y ninguno 400 -> decia "declarada
         pero no cargada" sobre una fuente que estaba perfectamente cargada. */
      const pesos = {};
      document.querySelectorAll('h1,h2,h3,p,span,a,div').forEach(n => {
        if (n.children.length) return;
        const c = getComputedStyle(n);
        const fam = c.fontFamily.split(',')[0].replace(/["']/g, '').trim();
        (pesos[fam] = pesos[fam] || new Set()).add(c.fontWeight);
      });
      const cargada = {};
      familias.forEach(x => {
        const ws = pesos[x] ? [...pesos[x]] : ['400'];
        cargada[x] = ws.some(w => document.fonts.check(`${w} 16px "${x}"`));
      });
      return { muestras, familias, cargada };
    });
    const PERMITIDAS = ['Sora', 'Inter'];
    const intrusas = f.familias.filter(x => !PERMITIDAS.includes(x));
    if (intrusas.length) mal(`fuentes que no son Sora/Inter: ${intrusas.join(', ')} — ` +
      Object.entries(f.muestras).filter(([, v]) => intrusas.includes(v)).map(([k, v]) => `${k}=${v}`).join(' '));
    const sinCargar = f.familias.filter(x => !f.cargada[x]);
    if (sinCargar.length) mal(`declaradas pero NO cargadas: ${sinCargar.join(', ')}`);

    // --- TOPBAR: legible y sin tapar el contenido ---
    const tb = await p.evaluate(() => {
      const t = document.querySelector('.topbar'); if (!t) return null;
      const r = t.getBoundingClientRect(), cs = getComputedStyle(t);
      const link = t.querySelector('a');
      const primerTexto = document.querySelector('h1');
      return {
        alto: Math.round(r.height), top: Math.round(r.top), pos: cs.position,
        bg: cs.backgroundColor, colorLink: link ? getComputedStyle(link).color : null,
        h1Top: primerTexto ? Math.round(primerTexto.getBoundingClientRect().top) : null,
        items: t.querySelectorAll('.tb2__nav a').length,
        logo: (t.querySelector('img') || {}).src?.split('/').pop(),
      };
    });
    if (!tb) mal('no hay topbar');
    else {
      if (tb.top !== 0) mal(`topbar no arranca en 0 (top ${tb.top})`);
      if (tb.items !== 7) mal(`la topbar tiene ${tb.items} items, deberian ser 7`);
      if (tb.logo !== 'munify-logo-color.svg') mal(`logo equivocado en la topbar: ${tb.logo}`);
      if (tb.h1Top !== null && tb.h1Top < tb.alto - 6) mal(`la topbar TAPA el h1 (h1 en ${tb.h1Top}, topbar mide ${tb.alto})`);
    }

    // --- Contraste real del texto de la topbar sobre lo que tiene detrás ---
    const contraste = await p.evaluate(() => {
      const lum = (c) => { const [r, g, bb] = c.match(/\d+/g).map(Number).map(v => { v /= 255; return v <= .03928 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; }); return .2126 * r + .7152 * g + .0722 * bb; };
      const link = document.querySelector('.tb2__nav a'); if (!link) return null;
      const r = link.getBoundingClientRect();
      // que hay detras del link, en su punto medio
      const detras = document.elementsFromPoint(r.left + r.width / 2, r.top + r.height / 2)
        .map(n => getComputedStyle(n).backgroundColor).find(c => c && c !== 'rgba(0, 0, 0, 0)') || 'rgb(255,255,255)';
      const l1 = lum(getComputedStyle(link).color), l2 = lum(detras);
      const ratio = (Math.max(l1, l2) + .05) / (Math.min(l1, l2) + .05);
      return { ratio: +ratio.toFixed(2), color: getComputedStyle(link).color, detras };
    });
    if (contraste && contraste.ratio < 3) mal(`links de la topbar ilegibles: contraste ${contraste.ratio}:1 (${contraste.color} sobre ${contraste.detras})`);

    // --- TEXTO INVISIBLE: color practicamente igual al fondo ---
    // Dos cosas que lo hacian dar falsas alarmas, ya resueltas:
    //  a) no componia el alpha: leia rgba(76,217,198,.12) como si fuera un
    //     verde opaco y creia que un texto claro encima no se leia.
    //  b) el texto sobre los heros esta encima de un VIDEO + velo oscuro, no
    //     sobre el fondo de la seccion -> se excluye ese caso.
    const fantasmas = await p.evaluate(() => {
      const rgb = c => { const m = (c || '').match(/[\d.]+/g); return m ? m.slice(0, 4).map(Number) : null; };
      const sobre = (fg, bg) => {   // compone fg (con alpha) sobre bg opaco
        const a = fg.length > 3 ? fg[3] : 1;
        return [0, 1, 2].map(i => fg[i] * a + bg[i] * (1 - a));
      };
      const lum = ([r, g, b]) => { const f = v => { v /= 255; return v <= .03928 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; };
        return .2126 * f(r) + .7152 * f(g) + .0722 * f(b); };
      const fondoReal = el => {                    // apila los fondos hasta uno opaco
        const capas = []; let n = el;
        while (n && n !== document.documentElement) {
          const c = rgb(getComputedStyle(n).backgroundColor);
          if (c && (c.length < 4 || c[3] > 0)) { capas.push(c); if (c.length < 4 || c[3] === 1) break; }
          n = n.parentElement;
        }
        let base = rgb(getComputedStyle(document.body).backgroundColor) || [255, 255, 255];
        for (let i = capas.length - 1; i >= 0; i--) base = sobre(capas[i], base);
        return base;
      };
      const out = [];
      document.querySelectorAll('h1,h2,h3,p,span,a,div,button').forEach(el => {
        if (el.children.length) return;
        if (el.closest('.ih, .hero2, .bandavid')) return;   // encima de video + velo
        // Si el elemento o un ancestro pinta con GRADIENTE/imagen, el color de
        // fondo real no se puede leer con getComputedStyle: subir al ancestro
        // da el fondo de la seccion y se reporta como invisible algo que se ve
        // perfecto (paso con .bento--ink, blanco sobre una card navy).
        // Preferimos no opinar antes que dar una falla falsa.
        for (let n = el; n && n !== document.documentElement; n = n.parentElement) {
          if (getComputedStyle(n).backgroundImage !== 'none') return;
        }
        const t = (el.textContent || '').trim(); if (t.length < 3) return;
        const r = el.getBoundingClientRect(); if (!r.width || !r.height) return;
        const cs = getComputedStyle(el);
        if (cs.visibility === 'hidden' || +cs.opacity < .1) return;
        const fg = rgb(cs.color); if (!fg) return;
        const bg = fondoReal(el);
        const l1 = lum(sobre(fg, bg)), l2 = lum(bg);
        const ratio = (Math.max(l1, l2) + .05) / (Math.min(l1, l2) + .05);
        if (ratio < 1.9) out.push(t.slice(0, 34) + ' [' + ratio.toFixed(2) + ':1]');
      });
      return [...new Set(out)].slice(0, 6);
    });
    if (fantasmas.length) mal(`texto invisible (color ~ fondo): ${fantasmas.join(' | ')}`);

    // --- Imágenes rotas y desborde ---
    const rotas = await p.$$eval('img', is => is.filter(i => !i.complete || i.naturalWidth === 0).map(i => i.src.split('/').pop()));
    if (rotas.length) mal(`imagenes rotas: ${rotas.join(', ')}`);
    const desb = await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    if (desb > 1) mal(`desborde horizontal de ${desb}px`);

    // --- Recorrer la pagina (para los .reveal) y capturar ---
    await p.evaluate(async () => {
      // body.scrollHeight se queda corto: hay que usar documentElement y
      // terminar tocando el fondo, o las ultimas secciones nunca intersectan
      // y el test las reporta invisibles sin estarlo.
      const fin = () => document.documentElement.scrollHeight;
      for (let y = 0; y < fin(); y += 400) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 70)); }
      window.scrollTo(0, fin()); await new Promise(r => setTimeout(r, 900));
      window.scrollTo(0, 0);
    });
    await p.waitForTimeout(900);
    const invis = await p.$$eval('main section, body > section', ns => ns.filter(n => +getComputedStyle(n).opacity < .9).map(n => n.className.split(' ')[0]));
    if (invis.length) mal(`secciones invisibles tras scroll: ${invis.join(', ')}`);

    const errsReales = errs.filter(e => !(sondaCatalogo && /401/.test(e)));
    if (errsReales.length) mal(`errores de consola: ${errsReales.slice(0, 2).join(' | ')}`);
    if (reqFail.length) mal(`requests fallidos: ${[...new Set(reqFail)].slice(0, 3).join(', ')}`);

    await p.screenshot({ path: `${OUT}/v-${nombre}-${modo}.png`, fullPage: true });
    await ctx.close();
  }
  console.log(`  ${nombre.padEnd(12)} ${fallas.filter(x => x.startsWith(nombre)).length === 0 ? 'ok' : 'CON FALLAS'}`);
}

await b.close();
console.log('');
if (fallas.length) { console.log(`${fallas.length} FALLAS:`); fallas.forEach(f => console.log('  - ' + f)); process.exit(1); }
console.log('TODO VERDE en ' + lista.length + ' paginas x 2 modos');
