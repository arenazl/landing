/* ============================================================
   Audita que el restyling NO haya roto el SEO.

   La indexación costó tiempo y trabajo: title, description,
   canonical, hreflang, Open Graph, Twitter, JSON-LD, robots,
   la jerarquía de encabezados y los alt de las imágenes tienen
   que seguir como estaban. Este script compara la versión de
   `master` (la indexada) contra la de esta rama, página por
   página, y avisa de cualquier pérdida.

   Perder algo acá no se ve en pantalla — se ve tres semanas
   después en el buscador, que es lo peor que puede pasar.

   Uso: node _seo.mjs
   ============================================================ */
import { execSync } from 'child_process';
import { readFileSync, existsSync } from 'fs';

const PAGINAS = ['index.html', 'software-gestion-municipal.html', 'reclamos-vecinales.html',
  'tramites-municipales.html', 'tesoreria.html', 'precios.html', 'contacto.html'];

const et = (html, re) => [...html.matchAll(re)].map(m => (m[1] || '').trim());

function extraer(html) {
  return {
    title: (html.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [, ''])[1].trim(),
    description: (html.match(/<meta\s+name=["']description["']\s+content=["']([\s\S]*?)["']/i) || [, ''])[1].trim(),
    keywords: (html.match(/<meta\s+name=["']keywords["']\s+content=["']([\s\S]*?)["']/i) || [, ''])[1].trim(),
    robots: (html.match(/<meta\s+name=["']robots["']\s+content=["']([\s\S]*?)["']/i) || [, ''])[1].trim(),
    canonical: (html.match(/<link\s+rel=["']canonical["']\s+href=["']([^"']+)["']/i) || [, ''])[1].trim(),
    hreflang: et(html, /<link\s+rel=["']alternate["']\s+hreflang=["']([^"']+)["']/gi).sort(),
    og: et(html, /<meta\s+property=["'](og:[^"']+)["']/gi).sort(),
    twitter: et(html, /<meta\s+name=["'](twitter:[^"']+)["']/gi).sort(),
    jsonld: (html.match(/<script[^>]*application\/ld\+json[^>]*>/gi) || []).length,
    tiposJsonld: et(html, /"@type"\s*:\s*"([^"]+)"/g).sort(),
    h1: et(html, /<h1[^>]*>([\s\S]*?)<\/h1>/gi).map(t => t.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()),
    cuantosH2: (html.match(/<h2[\s>]/gi) || []).length,
    cuantosH3: (html.match(/<h3[\s>]/gi) || []).length,
    imgSinAlt: (html.match(/<img(?![^>]*\balt=)[^>]*>/gi) || []).length,
    imgTotal: (html.match(/<img[\s>]/gi) || []).length,
    lang: (html.match(/<html[^>]*\blang=["']([^"']+)["']/i) || [, ''])[1],
    viewport: (html.match(/<meta\s+name=["']viewport["']\s+content=["']([^"']+)["']/i) || [, ''])[1],
    manifest: /rel=["']manifest["']/i.test(html),
    prerender: /speculationrules/i.test(html),
  };
}

let problemas = [];
console.log('  Comparando el SEO de esta rama contra master\n');

for (const p of PAGINAS) {
  let viejo;
  try { viejo = execSync(`git show origin/master:${p}`, { encoding: 'utf8', maxBuffer: 40e6 }); }
  catch { console.log(`  ${p.padEnd(34)} (no existe en master — pagina nueva, se saltea)`); continue; }
  if (!existsSync(p)) { problemas.push(`${p}: LA PAGINA YA NO EXISTE (estaba indexada)`); continue; }

  const a = extraer(viejo), b = extraer(readFileSync(p, 'utf8'));
  const fallas = [];

  const igual = (k, etiqueta) => {
    const x = Array.isArray(a[k]) ? a[k].join('|') : String(a[k]);
    const y = Array.isArray(b[k]) ? b[k].join('|') : String(b[k]);
    if (x !== y) fallas.push(`${etiqueta}\n            master: ${x.slice(0, 96) || '(vacio)'}\n            ahora : ${y.slice(0, 96) || '(vacio)'}`);
  };

  // Lo que NO puede cambiar
  igual('canonical', 'canonical distinto');
  igual('hreflang', 'hreflang distinto');
  igual('lang', 'atributo lang del <html>');
  igual('robots', 'meta robots');
  /* viewport-fit=cover es una ADICION legitima (habilita las safe-area del
     iPhone) y no cambia como indexa Google. Lo que SI seria un problema es
     bloquear el zoom (user-scalable=no / maximum-scale) en un sitio publico:
     Lighthouse lo marca como falla de accesibilidad. Se chequea eso. */
  const sinZoom = /user-scalable\s*=\s*no|maximum-scale\s*=\s*1/.test(b.viewport);
  if (sinZoom) fallas.push('el viewport BLOQUEA EL ZOOM: falla de accesibilidad en un sitio indexado');
  const base = v => v.replace(/,?\s*viewport-fit=cover/, '').replace(/initial-scale=1\.0/, 'initial-scale=1').trim();
  if (base(a.viewport) !== base(b.viewport)) fallas.push(`viewport distinto
            master: ${a.viewport}
            ahora : ${b.viewport}`);

  // Lo que no puede PERDERSE (cambiar el texto está bien; borrarlo no)
  if (a.title && !b.title) fallas.push('SE PERDIO el <title>');
  if (a.description && !b.description) fallas.push('SE PERDIO la meta description');
  if (a.keywords && !b.keywords) fallas.push('se perdio la meta keywords');
  if (a.manifest && !b.manifest) fallas.push('SE PERDIO el link al manifest');
  if (a.prerender && !b.prerender) fallas.push('SE PERDIERON las speculation rules (prerender)');
  if (a.jsonld > b.jsonld) fallas.push(`SE PERDIO datos estructurados JSON-LD: ${a.jsonld} -> ${b.jsonld} (${a.tiposJsonld.join(', ')})`);
  const ogFalta = a.og.filter(x => !b.og.includes(x));
  if (ogFalta.length) fallas.push(`SE PERDIERON etiquetas Open Graph: ${ogFalta.join(', ')}`);
  const twFalta = a.twitter.filter(x => !b.twitter.includes(x));
  if (twFalta.length) fallas.push(`se perdieron etiquetas Twitter: ${twFalta.join(', ')}`);

  // Estructura
  if (b.h1.length === 0) fallas.push('LA PAGINA QUEDO SIN H1');
  if (b.h1.length > 1) fallas.push(`${b.h1.length} H1 en la misma pagina (Google espera uno)`);
  if (b.imgSinAlt > a.imgSinAlt) fallas.push(`mas imagenes sin alt: ${a.imgSinAlt} -> ${b.imgSinAlt} (de ${b.imgTotal})`);
  if (b.cuantosH2 === 0 && a.cuantosH2 > 0) fallas.push('se quedo sin H2');

  console.log(`  ${p.padEnd(34)} ${fallas.length ? 'REVISAR' : 'ok'}`);
  fallas.forEach(f => { console.log(`      · ${f}`); problemas.push(`${p}: ${f.split('\n')[0]}`); });
}

console.log('');
console.log(problemas.length ? `${problemas.length} cosas para revisar en el SEO` : 'el SEO quedo intacto');
process.exit(problemas.length ? 1 : 0);
