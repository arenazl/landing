import { createRequire } from 'module';
const require = createRequire('d:/Code/sugerenciasMun/frontend/');
const { chromium } = require('playwright');
const b = await chromium.launch({ channel: 'msedge' });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto('http://localhost:8123/reclamos-vecinales', { waitUntil: 'networkidle' });
await p.locator('.cats').scrollIntoViewIfNeeded();
await p.waitForTimeout(1500);
console.log(JSON.stringify(await p.evaluate(() => {
  const c = document.querySelector('.cats');
  return { clases: c.className, opacity: getComputedStyle(c).opacity,
           top: Math.round(c.getBoundingClientRect().top), alto: Math.round(c.getBoundingClientRect().height),
           visible_class: c.classList.contains('visible') };
}), null, 1));
await b.close();
