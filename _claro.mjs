import { createRequire } from 'module';
const require = createRequire('d:/Code/sugerenciasMun/frontend/');
const { chromium } = require('playwright');
const b = await chromium.launch({ channel: 'msedge' });
const p = await b.newPage({ viewport: { width: 390, height: 844 } });
await p.goto('http://localhost:8123/demo.html', { waitUntil: 'networkidle' });
await p.click('[data-theme-toggle]'); await p.waitForTimeout(900);
console.log(JSON.stringify(await p.evaluate(() => {
  const c = s => { const n = document.querySelector(s); return n ? getComputedStyle(n).color : '(no hay)'; };
  const tb = document.querySelector('#mobileBtn').getBoundingClientRect();
  const tg = document.querySelector('[data-theme-toggle]').getBoundingClientRect();
  return { marca: c('.tb2__brand span'), kpiNeutro: c('.ihk__n'), crumb: c('.ih__crumb'),
           h1: c('.ih__h1'), togglePisaHamburguesa: !(tg.left > tb.right || tg.right < tb.left),
           toggleAncho: Math.round(tg.width) };
}), null, 1));
await p.screenshot({ path: 'd:/Code/sugerenciasMun/landing/_shots/claro-movil.png' });
await b.close();
