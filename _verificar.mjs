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

   Uso:  node _verificar.mjs            (todas)
         node _verificar.mjs index      (una)
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
  ['software', '/software-gestion-municipal'],
];

const filtro = process.argv[2];
const lista = filtro ? PAGINAS.filter(p => p[0] === filtro) : PAGINAS;

let fallas = [];
const b = await chromium.launch({ channel: 'msedge' });

for (const [nombre, ruta] of lista) {
  for (const modo of ['dark', 'light']) {
    const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
    const p = await ctx.newPage();
    const errs = [], reqFail = [];
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
      const cargada = {};
      familias.forEach(x => { cargada[x] = document.fonts.check(`16px "${x}"`); });
      return { muestras, familias, cargada };
    });
    const PERMITIDAS = ['Sora', 'Nunito'];
    const intrusas = f.familias.filter(x => !PERMITIDAS.includes(x));
    if (intrusas.length) mal(`fuentes que no son Sora/Nunito: ${intrusas.join(', ')} — ` +
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
    // (asi se colaron un eyebrow y un boton en blanco sobre blanco)
    const fantasmas = await p.evaluate(() => {
      const lum = c => { const m = c.match(/[\d.]+/g); if (!m) return null;
        const [r, g, b] = m.slice(0, 3).map(Number).map(v => { v /= 255; return v <= .03928 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; });
        return .2126 * r + .7152 * g + .0722 * b; };
      const fondoDe = el => { let n = el; while (n && n !== document.documentElement) {
          const c = getComputedStyle(n).backgroundColor;
          if (c && !/rgba\(0, 0, 0, 0\)|transparent/.test(c)) return c; n = n.parentElement; }
        return getComputedStyle(document.body).backgroundColor; };
      const out = [];
      document.querySelectorAll('h1,h2,h3,p,span,a,div,button').forEach(el => {
        if (el.children.length) return;
        const t = (el.textContent || '').trim(); if (t.length < 3) return;
        const r = el.getBoundingClientRect(); if (!r.width || !r.height) return;
        const cs = getComputedStyle(el);
        if (cs.visibility === 'hidden' || +cs.opacity < .1) return;
        const l1 = lum(cs.color), l2 = lum(fondoDe(el)); if (l1 === null || l2 === null) return;
        const ratio = (Math.max(l1, l2) + .05) / (Math.min(l1, l2) + .05);
        if (ratio < 1.7) out.push(t.slice(0, 34) + ' [' + ratio.toFixed(2) + ':1]');
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
      for (let y = 0; y < document.body.scrollHeight; y += 400) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 60)); }
      window.scrollTo(0, 0);
    });
    await p.waitForTimeout(900);
    const invis = await p.$$eval('main section, body > section', ns => ns.filter(n => +getComputedStyle(n).opacity < .9).map(n => n.className.split(' ')[0]));
    if (invis.length) mal(`secciones invisibles tras scroll: ${invis.join(', ')}`);

    if (errs.length) mal(`errores de consola: ${errs.slice(0, 2).join(' | ')}`);
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
