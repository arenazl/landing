import { createRequire } from 'module';
const require = createRequire('d:/Code/sugerenciasMun/frontend/');
const { chromium } = require('playwright');
const b = await chromium.launch({ channel: 'msedge' });
const PAGS = ['/','/demo.html','/comunicaciones.html','/reclamos-vecinales','/tramites-municipales','/tesoreria','/precios','/contacto','/software-gestion-municipal'];
let mal = 0;
for (const w of [390, 414, 768]) {
  for (const ruta of PAGS) {
    const p = await b.newPage({ viewport: { width: w, height: 844 } });
    await p.goto('http://localhost:8123' + ruta, { waitUntil: 'networkidle' });
    await p.waitForTimeout(900);
    const r = await p.evaluate(() => {
      const W = document.documentElement.clientWidth;
      const culpables = [...document.querySelectorAll('body *')]
        .filter(n => { const b = n.getBoundingClientRect(); return b.width > 0 && (b.right > W + 1 || b.left < -1); })
        .map(n => (n.tagName + '.' + (n.className || '').toString().split(' ')[0]) + ' [' + Math.round(n.getBoundingClientRect().right) + 'px]');
      return { desb: document.documentElement.scrollWidth - W, culpables: [...new Set(culpables)].slice(0, 4) };
    });
    if (r.desb > 1 || r.culpables.length) {
      mal++;
      console.log(`${w}px ${ruta.padEnd(30)} desborde ${r.desb}px  ${r.culpables.join(' | ')}`);
    }
    await p.close();
  }
}
await b.close();
console.log(mal ? `\n${mal} casos con desborde` : '\nninguna pagina desborda en 390/414/768');
