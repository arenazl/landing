import { createRequire } from 'module';
const require = createRequire('d:/Code/sugerenciasMun/frontend/');
const { chromium } = require('playwright');
const b = await chromium.launch({ channel: 'msedge' });
const p = await b.newPage({ viewport: { width: 1080, height: 810 }, hasTouch: true });
await p.goto('file:///D:/Code/sugerenciasMun/frontend/public/calls/index.html', { waitUntil: 'load' });
await p.waitForTimeout(1800);
await p.click('text=Trabajar').catch(()=>{});
await p.waitForTimeout(1200);
await p.evaluate(() => { for (const n of document.querySelectorAll('.lista-col *')) if (n.onclick || n.tagName==='BUTTON') { n.click(); break; } });
await p.waitForTimeout(1500);
const r = await p.evaluate(() => {
  const c = document.querySelector('.cierre-b');
  return c ? { existe: true, municipioEnLaFrase: /San Rafael|[A-Z][a-zá-ú]+/.test(c.innerText),
               pasos: c.querySelectorAll('.cierre-p').length,
               tieneOjo: !!c.querySelector('.cierre-ojo'),
               botonCopiar: !!document.getElementById('pCopiarCierre'),
               texto: c.innerText.replace(/\n+/g,' | ').slice(0,240) } : { existe: false };
});
console.log(JSON.stringify(r, null, 1));
// que el boton copie de verdad
await p.evaluate(() => document.getElementById('pCopiarCierre')?.click());
await p.waitForTimeout(500);
const cl = await p.evaluate(() => document.getElementById('pCopiarCierre')?.textContent);
console.log('  boton tras click:', cl);
const el = await p.$('.cierre-b');
if (el) { await el.scrollIntoViewIfNeeded(); await p.waitForTimeout(400);
  await el.screenshot({ path: 'd:/Code/sugerenciasMun/landing/_shots/cierre.png' }); }
await b.close();
