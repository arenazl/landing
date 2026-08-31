import { createRequire } from 'module';
const require = createRequire('d:/Code/sugerenciasMun/frontend/');
const { chromium } = require('playwright');
const b = await chromium.launch({ channel: 'msedge' });
const p = await b.newPage({ viewport: { width: 1024, height: 768 }, hasTouch: true });
await p.goto('https://qa-app.munify.com.ar/calls/', { waitUntil: 'networkidle', timeout: 45000 }).catch(()=>{});
await p.waitForTimeout(2500);
await p.click('text=Trabajar').catch(()=>{});
await p.waitForTimeout(1200);
// elegir un municipio de la lista para que la ficha tenga contenido real
await p.click('.lista-col .item, .lista-col [data-id], .lista-col li, .lista-col > div > div').catch(e=>console.log('  no pude clickear:', e.message.slice(0,40)));
await p.waitForTimeout(1500);
console.log(JSON.stringify(await p.evaluate(() => {
  const f = document.querySelector('.ficha-col'), e = document.querySelector('.extra');
  const info = (n, nom) => { if (!n) return { [nom]: 'no existe' };
    const cs = getComputedStyle(n);
    const hijos = [...n.children].map(c => ({ cls: (c.className||'').toString().split(' ')[0] || c.tagName,
      alto: Math.round(c.getBoundingClientRect().height), scrollH: c.scrollHeight,
      overflow: getComputedStyle(c).overflowY }));
    return { [nom]: { clientH: n.clientHeight, scrollH: n.scrollHeight, overflowY: cs.overflowY,
             minHeight: cs.minHeight, height: cs.height, display: cs.display, hijos } };
  };
  return { ...info(f, 'ficha'), ...info(e, 'extra'),
           gridPadre: (() => { const g = document.querySelector('.ops-grid, .ops') ||
             (f && f.parentElement); return g ? { cls: (g.className||'').toString(),
             display: getComputedStyle(g).display, cols: getComputedStyle(g).gridTemplateColumns,
             alto: Math.round(g.getBoundingClientRect().height),
             overflow: getComputedStyle(g).overflow } : null; })() };
}), null, 1));
await b.close();
