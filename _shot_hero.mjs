import { createRequire } from 'module';
const require = createRequire('d:/Code/sugerenciasMun/frontend/');
const { chromium } = require('playwright');
const b = await chromium.launch({ channel: 'msedge' });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto('http://localhost:8123/', { waitUntil: 'networkidle' });
await p.waitForTimeout(4000);
console.log(JSON.stringify(await p.evaluate(() => {
  const hijos = [...document.querySelector('.hero2__media').children];
  return hijos.map(n => ({ tag: n.tagName, cls: n.className, op: getComputedStyle(n).opacity,
                           z: getComputedStyle(n).zIndex, t: n.tagName==='VIDEO' ? n.currentTime.toFixed(1) : '-' }));
}), null, 1));
await p.locator('.hero2').screenshot({ path: 'd:/Code/sugerenciasMun/landing/_shots/hero-video.png' });
await b.close();
