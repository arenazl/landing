import { createRequire } from 'module';
const require = createRequire('d:/Code/sugerenciasMun/frontend/');
const { chromium } = require('playwright');
const b = await chromium.launch({ channel: 'msedge' });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
const mirar = async (url, etiqueta) => {
  await p.goto(url, { waitUntil: 'load' }).catch(()=>{});
  await p.waitForTimeout(2200);
  const r = await p.evaluate(() => [...document.querySelectorAll('*')]
    .filter(n => !n.children.length && /^0[1-4]$/.test(n.textContent.trim()))
    .map(n => { const c = getComputedStyle(n); return n.textContent.trim() + ' ' + c.fontSize + ' ' + c.fontWeight + ' ' + c.color; }));
  console.log(etiqueta + ':', r.length ? r.join(' | ') : 'no hay');
};
await mirar('file:///D:/Code/sugerenciasMun/landing/docs/design-sync/comercial-2026-08-30/pages/Tramites.dc.html', 'PROTOTIPO');
await mirar('http://localhost:8123/tramites-municipales', 'MI PAGINA');
await b.close();
