/* ============================================================
   Compara CADA página contra su prototipo del handoff.

   Existe porque el dueño encontraba las diferencias antes que yo:
   teniendo el .dc al lado, el primero en notar que algo no se
   parece no puede ser él.

   Abre el .dc.html y la página implementada, y contrasta lo que
   se puede contrastar objetivamente:
     - los textos (H1, H2, H3) — que estén TODOS y digan lo mismo
     - los números de los KPIs
     - las familias tipográficas
     - la paleta que efectivamente se pinta

   No compara pixel a pixel: el .dc tiene ancho fijo y la página
   es fluida, así que un diff de imagen daría rojo por diseño.

   Uso:  node _comparar.mjs           (todas)
         node _comparar.mjs demo      (una)
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

const norm = s => (s || '').replace(/\s+/g, ' ').replace(/[“”"']/g, '').trim().toLowerCase();

async function leer(page, url) {
  await page.goto(url, { waitUntil: 'load' }).catch(() => {});
  await page.waitForTimeout(url.startsWith('file') ? 2500 : 2000);
  await page.evaluate(async () => {
    for (let y = 0; y < document.documentElement.scrollHeight; y += 500) {
      window.scrollTo(0, y); await new Promise(r => setTimeout(r, 40));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(600);
  return page.evaluate(() => {
    const T = sel => [...document.querySelectorAll(sel)]
      .map(n => n.textContent.replace(/\s+/g, ' ').trim())
      .filter(t => t.length > 2);
    return {
      h1: T('h1'), h2: T('h2'), h3: T('h3'),
      // Números grandes (KPIs). Se toma el texto del CONTENEDOR, no del nodo
      // hoja: la implementación parte el número para el count-up
      // (<span data-count>88</span>%) y buscarlo como nodo suelto daba
      // "falta 88%" sobre un 88% que estaba ahí, a la vista.
      nums: [...new Set([...document.querySelectorAll('*')]
        .filter(n => parseFloat(getComputedStyle(n).fontSize) >= 22)
        .map(n => (n.textContent || '').replace(/\s+/g, ' ').trim())
        .filter(t => t.length <= 12)
        .map(t => (t.match(/[−×+]?[\d.,]+\s?(?:%|min|días|\/7)?/) || [''])[0].trim())
        .filter(Boolean))],
      fuentes: [...new Set([...document.querySelectorAll('h1,h2,h3,p,span,a')]
        .slice(0, 400).map(n => getComputedStyle(n).fontFamily.split(',')[0].replace(/["']/g, '').trim()))],
    };
  });
}

const b = await chromium.launch({ channel: 'msedge' });
let problemas = [];

for (const [nombre, dc, ruta] of lista) {
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
  const pa = await ctx.newPage(), pb = await ctx.newPage();
  const proto = await leer(pa, DC + encodeURIComponent(dc));
  const mio = await leer(pb, WEB + ruta);

  const falta = (tipo, esperados, tengo) => {
    const mios = tengo.map(norm);
    return esperados.filter(t => !mios.some(m => m.includes(norm(t)) || norm(t).includes(m)));
  };

  const fh1 = falta('H1', proto.h1, mio.h1);
  const fh2 = falta('H2', proto.h2, mio.h2);
  const fh3 = falta('H3', proto.h3, mio.h3);
  const fnum = proto.nums.filter(n => !mio.nums.includes(n));
  const fuentesMal = mio.fuentes.filter(f => !['Sora', 'Inter'].includes(f));

  const linea = [];
  if (fh1.length) linea.push(`H1 que faltan: ${fh1.join(' / ')}`);
  if (fh2.length) linea.push(`H2 que faltan (${fh2.length}/${proto.h2.length}): ${fh2.slice(0, 3).join(' / ')}`);
  if (fh3.length) linea.push(`H3 que faltan (${fh3.length}/${proto.h3.length}): ${fh3.slice(0, 4).join(' / ')}`);
  if (fnum.length) linea.push(`números del prototipo que no están: ${fnum.slice(0, 6).join(' ')}`);
  if (fuentesMal.length) linea.push(`fuentes ajenas: ${fuentesMal.join(', ')}`);

  const ok = linea.length === 0;
  console.log(`  ${nombre.padEnd(15)} ${ok ? 'igual al prototipo' : 'DIFERENCIAS'}`);
  linea.forEach(l => { console.log(`      · ${l}`); problemas.push(`${nombre}: ${l}`); });
  await ctx.close();
}

await b.close();
console.log('');
console.log(problemas.length ? `${problemas.length} diferencias con el handoff` : 'las paginas coinciden con el handoff');
process.exit(problemas.length ? 1 : 0);
