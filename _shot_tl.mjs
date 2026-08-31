import { createRequire } from 'module';
const require = createRequire('d:/Code/sugerenciasMun/frontend/');
const { chromium } = require('playwright');
const b = await chromium.launch({ channel: 'msedge' });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto('http://localhost:8123/', { waitUntil: 'networkidle' });
await p.waitForTimeout(1500);
const tl = await p.$('.tl2');
if (tl) { await tl.scrollIntoViewIfNeeded(); await p.waitForTimeout(900);
  await p.locator('.sec2').first().screenshot({ path: 'd:/Code/sugerenciasMun/landing/_shots/timeline.png' });
  console.log('timeline capturada');
} else console.log('NO se encontro .tl2');
// videos del hero enganchados?
const v = await p.evaluate(() => ({
  media: !!document.querySelector('.hero2__media[data-videos]'),
  videos: document.querySelectorAll('.hero2__media video').length,
}));
console.log('hero:', JSON.stringify(v));
await b.close();
