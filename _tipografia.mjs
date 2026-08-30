/* ============================================================
   Compara la TIPOGRAFÍA completa contra el prototipo.

   El comparador anterior sólo miraba font-family, y por eso daba
   verde con la letra visiblemente distinta: el tamaño, el peso,
   el letter-spacing y el line-height no se estaban mirando.
   Acá se comparan TODOS los modificadores, propiedad por
   propiedad, y cualquier diferencia se reporta con los dos
   valores.

   Uso:  node _tipografia.mjs           (todas)
         node _tipografia.mjs home       (una)
   ============================================================ */
import { createRequire } from 'module';
const require = createRequire('d:/Code/sugerenciasMun/frontend/');
const { chromium } = require('playwright');

const DC = 'file:///D:/Code/sugerenciasMun/landing/docs/design-sync/comercial-2026-08-30/pages/';
const WEB = 'http://localhost:8123';

const PARES = [
  ['home',           'Munify Home.dc.html',    '/'],
  ['reclamos',       'Reclamos.dc.html',       '/reclamos-vecinales'],
  ['tramites',       'Tramites.dc.html',       '/tramites-municipales'],
  ['tesoreria',      'Tesoreria.dc.html',      '/tesoreria'],
  ['precios',        'Precios.dc.html',        '/precios'],
  ['contacto',       'Contacto.dc.html',       '/contacto'],
  ['demo',           'Demo.dc.html',           '/demo.html'],
  ['comunicaciones', 'Comunicaciones.dc.html', '/comunicaciones.html'],
];

const filtro = process.argv[2];
const lista = filtro ? PARES.filter(p => p[0] === filtro) : PARES;

/* Se emparejan por el TEXTO: el mismo texto de un lado y del otro
   tiene que estar dibujado con la misma letra. Es el criterio más
   honesto — no depende de que las clases coincidan. */
async function tipografia(page, url) {
  await page.goto(url, { waitUntil: 'load' }).catch(() => {});
  await page.waitForTimeout(url.startsWith('file') ? 2600 : 2000);
  await page.evaluate(async () => {
    for (let y = 0; y < document.documentElement.scrollHeight; y += 500) {
      window.scrollTo(0, y); await new Promise(r => setTimeout(r, 40));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(700);
  return page.evaluate(async () => {
    await document.fonts.ready;
    const norm = t => (t || '').replace(/\s+/g, ' ').trim();
    const salida = {};
    document.querySelectorAll('h1,h2,h3,h4,p,span,a,div,button,li').forEach(n => {
      if (n.children.length) return;
      const t = norm(n.textContent);
      if (t.length < 8 || t.length > 90) return;
      const r = n.getBoundingClientRect();
      if (!r.width || !r.height) return;
      const c = getComputedStyle(n);
      /* redondeos: el .dc es de ancho fijo y la página es fluida, así que
         un decimal de diferencia en el tamaño no es una diferencia real */
      /* Un mismo texto aparece varias veces ("Reclamos" esta en el nav, en el
         menu movil y en el pie). Si se guarda uno solo, gana el ultimo del DOM
         y se compara el link del pie contra el del nav del prototipo: falso
         positivo garantizado. Se guardan TODAS las ocurrencias. */
      const k = t.toLowerCase();
      (salida[k] = salida[k] || []).push({
        familia: c.fontFamily.split(',')[0].replace(/["']/g, '').trim(),
        tam: Math.round(parseFloat(c.fontSize)),
        peso: c.fontWeight,
        espaciado: c.letterSpacing === 'normal' ? '0px' : (Math.round(parseFloat(c.letterSpacing) * 100) / 100) + 'px',
        interlinea: Math.round(parseFloat(c.lineHeight)),
        transformacion: c.textTransform,
        estilo: c.fontStyle,
      });
    });
    return salida;
  });
}

const b = await chromium.launch({ channel: 'msedge', args: ['--disable-http-cache'] });
/* bypassCache: sin esto se mide el CSS cacheado y los arreglos parecen no aplicar */
let total = 0;

for (const [nombre, dc, ruta] of lista) {
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
  const pa = await (async () => { const q = await ctx.newPage(); await q.route('**/*.{css,js}', r => r.continue({ headers: { ...r.request().headers(), 'cache-control': 'no-cache' } })); return q; })(), pb = await (async () => { const q = await ctx.newPage(); await q.route('**/*.{css,js}', r => r.continue({ headers: { ...r.request().headers(), 'cache-control': 'no-cache' } })); return q; })();
  const proto = await tipografia(pa, DC + encodeURIComponent(dc));
  const mio = await tipografia(pb, WEB + ruta);

  const CLAVES = ['familia', 'tam', 'peso', 'espaciado', 'interlinea', 'transformacion', 'estilo'];
  const diferencias = (p, m) => {
    const malas = [];
    for (const k of CLAVES) {
      if (k === 'tam' && Math.abs(p[k] - m[k]) <= 1) continue;
      /* line-height:normal da NaN al parsear: si el prototipo no lo declara,
         no hay nada que comparar */
      if (k === 'interlinea' && (Number.isNaN(p[k]) || Number.isNaN(m[k]))) continue;
      if (k === 'interlinea' && Math.abs(p[k] - m[k]) <= 2) continue;
      if (String(p[k]) !== String(m[k])) malas.push(`${k}: ${p[k]} -> ${m[k]}`);
    }
    return malas;
  };

  const difs = [];
  for (const [texto, listaP] of Object.entries(proto)) {
    const listaM = mio[texto];
    if (!listaM) continue;                  // el texto que falta lo reporta _comparar.mjs
    /* Alcanza con que ALGUNA de las apariciones de ese texto en mi pagina
       coincida con alguna del prototipo: es el mismo texto dibujado igual en
       algun lado. Se reporta la diferencia MAS CHICA, que es la del elemento
       que realmente se corresponde. */
    let mejor = null;
    for (const p of listaP) {
      for (const m of listaM) {
        const d = diferencias(p, m);
        if (!d.length) { mejor = []; break; }
        if (!mejor || d.length < mejor.length) mejor = d;
      }
      if (mejor && !mejor.length) break;
    }
    if (mejor && mejor.length) difs.push({ texto: texto.slice(0, 42), malas: mejor });
  }

  console.log(`\n  ${nombre}  ${difs.length ? difs.length + ' textos con la letra distinta' : 'tipografia identica'}`);
  difs.slice(0, 8).forEach(d => console.log(`      "${d.texto}"\n          ${d.malas.join('  |  ')}`));
  if (difs.length > 8) console.log(`      ... y ${difs.length - 8} mas`);
  total += difs.length;
  await ctx.close();
}

await b.close();
console.log('\n' + (total ? `${total} textos con tipografia distinta al prototipo` : 'la tipografia coincide en todo'));
process.exit(total ? 1 : 0);
