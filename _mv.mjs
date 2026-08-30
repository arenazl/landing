import { createRequire } from 'module';
const require = createRequire('d:/Code/sugerenciasMun/frontend/');
const { chromium } = require('playwright');
const b = await chromium.launch({ channel: 'msedge' });
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true,
  deviceScaleFactor: 3,
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1' });
const p = await ctx.newPage();
await p.goto('http://localhost:8123/demo.html', { waitUntil: 'networkidle' });
await p.waitForTimeout(2500);
// el viewport quedo fijo?
console.log(JSON.stringify(await p.evaluate(() => ({
  viewport: document.querySelector('meta[name=viewport]').content,
  inputMasChico: Math.min(...[...document.querySelectorAll('input,select,textarea')].map(n => parseFloat(getComputedStyle(n).fontSize))),
  overflowX: getComputedStyle(document.body).overflowX,
  desborde: document.documentElement.scrollWidth - document.documentElement.clientWidth,
  hamburguesaEnX: Math.round(document.querySelector('#mobileBtn').getBoundingClientRect().left),
  logoEnX: Math.round(document.querySelector('.tb2__brand').getBoundingClientRect().left),
})), null, 1));
await p.screenshot({ path: 'd:/Code/sugerenciasMun/landing/_shots/mv-demo.png' });
await b.close();
