import { createRequire } from 'module';
const require = createRequire('d:/Code/sugerenciasMun/frontend/');
const { chromium } = require('playwright');
const b = await chromium.launch({ channel: 'msedge' });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto('http://localhost:8123/', { waitUntil: 'networkidle' });
await p.waitForTimeout(600);
console.log(JSON.stringify(await p.evaluate(() => {
  const t = document.querySelector('.topbar'), h = document.querySelector('.hero2'), m = document.querySelector('main');
  const cs = getComputedStyle(t);
  return {
    topbar: { pos: cs.position, top: t.getBoundingClientRect().top, alto: t.getBoundingClientRect().height, bg: cs.backgroundColor },
    hero_top: h.getBoundingClientRect().top,
    main_paddingTop: getComputedStyle(m).paddingTop,
    main_top: m.getBoundingClientRect().top,
  };
}), null, 1));
await b.close();
