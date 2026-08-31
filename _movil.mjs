import { createRequire } from 'module';
const require = createRequire('d:/Code/sugerenciasMun/frontend/');
const { chromium } = require('playwright');
const b = await chromium.launch({ channel: 'msedge' });
const p = await b.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true,
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1' });
await p.goto('http://localhost:8123/', { waitUntil: 'networkidle' });
await p.waitForTimeout(2500);
console.log(JSON.stringify(await p.evaluate(() => {
  const r = s => { const n = document.querySelector(s); if (!n) return null;
    const b = n.getBoundingClientRect(); return { top: Math.round(b.top), bottom: Math.round(b.bottom), h: Math.round(b.height) }; };
  const tb = document.querySelector('.topbar').getBoundingClientRect();
  const eye = document.querySelector('.hero2__eyebrow').getBoundingClientRect();
  return {
    topbar: r('.topbar'), eyebrow: r('.hero2__eyebrow'), h1: r('.hero2__h1'),
    SE_PISAN: eye.top < tb.bottom,
    solape: Math.round(tb.bottom - eye.top),
    heroBodyPadTop: getComputedStyle(document.querySelector('.hero2__body')).paddingTop,
  };
}), null, 1));
await p.screenshot({ path: 'd:/Code/sugerenciasMun/landing/_shots/movil-hero.png' });
await b.close();
