import { createRequire } from 'module';
const require = createRequire('d:/Code/sugerenciasMun/frontend/');
const { chromium } = require('playwright');
const b = await chromium.launch({ channel: 'msedge' });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
const alto = async (url, sel) => {
  await p.goto(url, { waitUntil: 'load' }).catch(()=>{});
  await p.waitForTimeout(2200);
  return p.evaluate(s => {
    // en el .dc el hero es el primer div con height fijo
    const n = s ? document.querySelector(s) : [...document.querySelectorAll('div')].find(d => {
      const h = getComputedStyle(d).height; return /^\d{3,4}px$/.test(h) && parseInt(h) > 400 && parseInt(h) < 900; });
    return n ? Math.round(n.getBoundingClientRect().height) : null;
  }, sel);
};
const DC='file:///D:/Code/sugerenciasMun/landing/docs/design-sync/comercial-2026-08-30/pages/';
for (const [n, dc, ruta] of [['tesoreria','Tesoreria.dc.html','/tesoreria'],
                             ['reclamos','Reclamos.dc.html','/reclamos-vecinales'],
                             ['tramites','Tramites.dc.html','/tramites-municipales']]) {
  const a = await alto(DC + encodeURIComponent(dc), null);
  const c = await alto('http://localhost:8123' + ruta, '.ih');
  console.log(`  ${n.padEnd(12)} prototipo ${a}px   vs   mio ${c}px   ${a && c && Math.abs(a-c) > 40 ? '<-- DIFERENTE' : ''}`);
}
await b.close();
