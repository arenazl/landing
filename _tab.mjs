import { createRequire } from 'module';
const require = createRequire('d:/Code/sugerenciasMun/frontend/');
const { chromium } = require('playwright');
const b = await chromium.launch({ channel: 'msedge' });
for (const [w, h, etiq] of [[1024, 768, 'iPad horizontal'], [820, 1180, 'iPad vertical'], [1366, 1024, 'iPad Pro horiz']]) {
  const p = await b.newPage({ viewport: { width: w, height: h }, hasTouch: true });
  await p.goto('file:///D:/Code/sugerenciasMun/frontend/public/calls/index.html', { waitUntil: 'networkidle', timeout: 45000 }).catch(()=>{});
  await p.waitForTimeout(2500);
  // ir a la vista Trabajar
  await p.click('text=Trabajar').catch(()=>{});
  await p.waitForTimeout(1500);
  const r = await p.evaluate(() => {
    const scrollea = n => n.scrollHeight > n.clientHeight + 2;
    const cs = n => getComputedStyle(n);
    const cols = [...document.querySelectorAll('div,section,aside,main')]
      .filter(n => { const b = n.getBoundingClientRect();
        return b.height > 200 && b.width > 150 && /auto|scroll/.test(cs(n).overflowY); })
      .map(n => ({ cls: (n.className||'').toString().split(' ').slice(0,2).join('.') || n.tagName,
                   w: Math.round(n.getBoundingClientRect().width),
                   scrollea: scrollea(n), overflowY: cs(n).overflowY, touch: cs(n).touchAction,
                   alto: Math.round(n.getBoundingClientRect().height),
                   contenido: n.scrollHeight }));
    return { body: { overflow: cs(document.body).overflow, alto: document.body.clientHeight,
                     contenido: document.body.scrollHeight },
             paginaScrollea: document.documentElement.scrollHeight > document.documentElement.clientHeight + 2,
             columnasConScroll: cols };
  });
  console.log(`\n===== ${etiq} (${w}x${h}) =====`);
  console.log('  pagina scrollea:', r.paginaScrollea, '| body:', r.body.overflow, `(${r.body.contenido} en ${r.body.alto})`);
  r.columnasConScroll.forEach(c => console.log(`   ${c.scrollea ? 'SCROLLEA' : 'NO      '}  ${c.cls.padEnd(26)} ${String(c.w).padStart(4)}px  contenido ${c.contenido} en ${c.alto}  touch=${c.touch}`));
  await p.close();
}
await b.close();
