import { createRequire } from 'module';
const require = createRequire('d:/Code/sugerenciasMun/frontend/');
const { chromium } = require('playwright');
const b = await chromium.launch({ channel: 'msedge' });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
const errs = [];
p.on('console', m => { if (m.type() === 'error') errs.push(m.text().slice(0,90)); });
await p.goto('file:///D:/Code/sugerenciasMun/frontend/public/calls/index.html', { waitUntil: 'load' });
await p.waitForTimeout(1800);
await p.click('text=Trabajar').catch(()=>{});
await p.waitForTimeout(1000);
// recorrer un municipio de cada pais
for (const pais of ['Argentina','Paraguay','Perú','Uruguay']) {
  const ok = await p.evaluate(async (pais) => {
    const sel = document.querySelector('select#fPais, [id*=Pais], select');
    if (sel) { sel.value = pais; sel.dispatchEvent(new Event('change', {bubbles:true})); }
    await new Promise(r => setTimeout(r, 700));
    for (const n of document.querySelectorAll('.lista-col *')) if (n.onclick || n.tagName==='BUTTON') { n.click(); break; }
    await new Promise(r => setTimeout(r, 900));
    const c = document.querySelector('.cierre-b');
    const muni = document.querySelector('.ficha h2, .ficha h1, .f-body h2')?.textContent?.trim();
    return c ? { muni, txt: c.innerText.replace(/\n+/g,' ').slice(0, 170) } : null;
  }, pais);
  console.log(`\n--- ${pais} (${ok?.muni || '?'}) ---\n  ${ok ? ok.txt : 'sin cierre'}`);
}
console.log('\nerrores de consola:', errs.length, errs.slice(0,2));
await b.close();
