import { createRequire } from 'module';
const require = createRequire('d:/Code/sugerenciasMun/frontend/');
const { chromium } = require('playwright');
const b = await chromium.launch({ channel: 'msedge' });
for (const [w,h,etiq] of [[1024,768,'iPad horiz'],[1366,1024,'iPad Pro horiz']]) {
  const p = await b.newPage({ viewport: { width: w, height: h }, hasTouch: true });
  await p.goto('file:///D:/Code/sugerenciasMun/frontend/public/calls/index.html', { waitUntil: 'load' });
  await p.waitForTimeout(2000);
  await p.click('text=Trabajar').catch(()=>{});
  await p.waitForTimeout(1000);
  // clickear el primer municipio de la lista
  const ok = await p.evaluate(() => {
    const el = document.querySelector('.lista-col button, .lista-col [role=button], .lista-col .fila, .lista-col > * > *');
    if (el) { el.click(); return el.textContent.trim().slice(0,30); } return null;
  });
  await p.waitForTimeout(1200);
  const r = await p.evaluate(() => {
    const q = s => document.querySelector(s);
    const m = (n,nom) => n ? { [nom]: { alto: n.clientHeight, contenido: n.scrollHeight,
      SCROLLEA: n.scrollHeight > n.clientHeight + 2, overflow: getComputedStyle(n).overflowY } } : {};
    return { ...m(q('.ficha-col'),'fichaCol'), ...m(q('.ficha'),'ficha'), ...m(q('.f-body'),'fBody'),
             ...m(q('.extra'),'extra'), textoFicha: (q('.f-body')||{}).innerText?.trim().slice(0,50) };
  });
  console.log(`\n${etiq}  (municipio: ${ok || 'no clickeo'})`);
  console.log(' ', JSON.stringify(r));
  await p.close();
}
await b.close();
