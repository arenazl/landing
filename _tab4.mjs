import { createRequire } from 'module';
const require = createRequire('d:/Code/sugerenciasMun/frontend/');
const { chromium } = require('playwright');
const b = await chromium.launch({ channel: 'msedge' });
for (const [w,h,etiq] of [[1080,810,'tablet 1080 (la suya)'],[1024,768,'iPad horiz'],[1180,820,'iPad Air'],[1366,1024,'iPad Pro'],[1440,900,'escritorio']]) {
  const p = await b.newPage({ viewport: { width: w, height: h }, hasTouch: w < 1400 });
  await p.goto('file:///D:/Code/sugerenciasMun/frontend/public/calls/index.html', { waitUntil: 'load' });
  await p.waitForTimeout(1600);
  await p.click('text=Trabajar').catch(()=>{});
  await p.waitForTimeout(1000);
  const r = await p.evaluate(() => {
    const vis = n => n && getComputedStyle(n).display !== 'none' && n.getBoundingClientRect().width > 0;
    const q = s => document.querySelector(s);
    const sc = n => n && n.scrollHeight > n.clientHeight + 2;
    return { columnas: ['.lista-col','.ficha-col','.extra'].filter(s => vis(q(s))).length,
             zoom: getComputedStyle(q('.wrap')).zoom,
             lista: sc(q('.lista-col')), fbody: !!q('.f-body'), extra: vis(q('.extra')),
             desborde: document.documentElement.scrollWidth - document.documentElement.clientWidth };
  });
  console.log(`  ${etiq.padEnd(24)} ${r.columnas} columnas · zoom ${r.zoom} · extra=${r.extra ? 'visible' : 'OCULTA'} · desborde ${r.desborde}px`);
  await p.close();
}
await b.close();
