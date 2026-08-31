import { createRequire } from 'module';
const require = createRequire('d:/Code/sugerenciasMun/frontend/');
const { chromium } = require('playwright');
const PAGS = [['home','/'],['reclamos','/reclamos-vecinales'],['tramites','/tramites-municipales'],
  ['tesoreria','/tesoreria'],['precios','/precios'],['contacto','/contacto'],
  ['demo','/demo.html'],['comunicaciones','/comunicaciones.html'],['software','/software-gestion-municipal']];
const b = await chromium.launch({ channel: 'msedge' });
for (const [w] of [[390],[1440]]) {
  console.log(`\n--- ${w}px ---`);
  for (const [n, ruta] of PAGS) {
    const p = await b.newPage({ viewport: { width: w, height: 900 } });
    await p.goto('http://localhost:8123' + ruta, { waitUntil: 'networkidle' });
    await p.waitForTimeout(1200);
    const r = await p.evaluate(() => {
      const tb = document.querySelector('.topbar').getBoundingClientRect();
      const prim = document.querySelector('.ih__crumb, .hero2__eyebrow, .ih__eyebrow');
      if (!prim) return null;
      const pb = prim.getBoundingClientRect();
      return { aire: Math.round(pb.top - tb.bottom), texto: prim.textContent.trim().slice(0, 24) };
    });
    if (r) console.log(`  ${n.padEnd(15)} ${String(r.aire).padStart(4)}px de aire ${r.aire < 16 ? '<-- APRETADO' : ''}`);
    await p.close();
  }
}
await b.close();
