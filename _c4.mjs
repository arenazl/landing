import { createRequire } from 'module';
const require = createRequire('d:/Code/sugerenciasMun/frontend/');
const { chromium } = require('playwright');
const b = await chromium.launch({ channel: 'msedge' });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto('file:///D:/Code/sugerenciasMun/frontend/public/calls/index.html', { waitUntil: 'load' });
await p.waitForTimeout(1800);
await p.click('text=Trabajar').catch(()=>{});
await p.waitForTimeout(900);
for (const pais of ['Argentina','Paraguay','Perú','Uruguay']) {
  const r = await p.evaluate(async (pais) => {
    const s = document.getElementById('selPais');
    s.value = pais; s.dispatchEvent(new Event('change', {bubbles:true}));
    await new Promise(r => setTimeout(r, 800));
    for (const n of document.querySelectorAll('.lista-col *')) if (n.onclick || n.tagName==='BUTTON') { n.click(); break; }
    await new Promise(r => setTimeout(r, 900));
    const f = document.querySelectorAll('.cierre-frase');
    return f.length ? { p1: f[0].innerText.slice(0,120), p2: f[1]?.innerText.slice(0,95) } : null;
  }, pais);
  console.log(`\n=== ${pais} ===`);
  console.log('  1:', r ? r.p1 : 'sin cierre');
  console.log('  2:', r ? r.p2 : '');
}
await b.close();
