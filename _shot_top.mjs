import { createRequire } from 'module';
const require = createRequire('d:/Code/sugerenciasMun/frontend/');
const { chromium } = require('playwright');
const b = await chromium.launch({ channel: 'msedge' });
const p = await b.newPage({ viewport: { width: 1440, height: 460 } });
await p.goto('http://localhost:8123/', { waitUntil: 'networkidle' });
await p.waitForTimeout(3000);
await p.screenshot({ path: 'd:/Code/sugerenciasMun/landing/_shots/top-sin-banda.png' });
const f = await p.evaluate(async () => { await document.fonts.ready;
  return { h1: getComputedStyle(document.querySelector('h1')).fontFamily.split(',')[0],
           body: getComputedStyle(document.body).fontFamily.split(',')[0],
           inter: document.fonts.check('16px Inter'), sora: document.fonts.check('600 16px Sora') }; });
console.log('fuentes:', JSON.stringify(f));
await b.close();
