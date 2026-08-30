import { createRequire } from 'module';
const require = createRequire('d:/Code/sugerenciasMun/frontend/');
const { chromium } = require('playwright');
const b = await chromium.launch({ channel: 'msedge' });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto('http://localhost:8123/tramites-municipales', { waitUntil: 'networkidle' });
await p.waitForTimeout(1500);
console.log(JSON.stringify(await p.evaluate(() => {
  const nav = document.querySelector('.tb2__nav a');
  const h1 = document.querySelector('.ih__h1');
  const tag = [...document.querySelectorAll('*')].find(n => !n.children.length && /más elegido/i.test(n.textContent));
  return {
    bodyClass: document.body.className,
    nav: { peso: getComputedStyle(nav).fontWeight, fam: getComputedStyle(nav).fontFamily.split(',')[0] },
    h1: { tam: getComputedStyle(h1).fontSize, clases: h1.className },
    tagManrope: tag ? getComputedStyle(tag).fontFamily : '(no hay en esta pagina)',
  };
}), null, 1));
await b.close();
