import { createRequire } from 'module';
const require = createRequire('d:/Code/sugerenciasMun/frontend/');
const { chromium } = require('playwright');
const b = await chromium.launch({ channel: 'msedge' });
const p = await b.newPage({ viewport: { width: 1080, height: 810 }, hasTouch: true });
await p.goto('file:///D:/Code/sugerenciasMun/frontend/public/calls/index.html', { waitUntil: 'load' });
await p.waitForTimeout(1800);
await p.click('text=Trabajar').catch(()=>{});
await p.waitForTimeout(1200);
// abrir una ficha real
const quien = await p.evaluate(() => {
  const c = document.querySelectorAll('.lista-col *');
  for (const n of c) if (n.onclick || n.tagName === 'BUTTON') { n.click(); return n.textContent.trim().slice(0,28); }
  return null;
});
await p.waitForTimeout(1500);
console.log('municipio abierto:', quien || '(el que venia)');
console.log(JSON.stringify(await p.evaluate(() => {
  const q = s => document.querySelector(s);
  const est = (s, nom) => { const n = q(s); if (!n) return `${nom}: no existe`;
    return `${nom}: ${n.scrollHeight > n.clientHeight + 2 ? 'SCROLLEA' : 'entra entero'} (${n.scrollHeight} en ${n.clientHeight})`; };
  return [est('.lista-col','lista'), est('.f-body','ficha (f-body)'), est('.extra','extra')];
}), null, 1));
await p.screenshot({ path: 'd:/Code/sugerenciasMun/landing/_shots/calls-tablet.png' });
await b.close();
