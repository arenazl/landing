import { createRequire } from 'module';
const require = createRequire('d:/Code/sugerenciasMun/frontend/');
const { chromium } = require('playwright');
const b = await chromium.launch({ channel: 'msedge' });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto('http://localhost:8123/', { waitUntil: 'networkidle' });
await p.waitForTimeout(2500);
console.log(JSON.stringify(await p.evaluate(() => {
  const tb = document.querySelector('.topbar'), hero = document.querySelector('.hero2');
  const media = document.querySelector('.hero2__media'), veil = document.querySelector('.hero2__veil');
  const vid = document.querySelector('.hero2__media video.is-on');
  const r = n => { const b = n.getBoundingClientRect(); return {top: Math.round(b.top), h: Math.round(b.height)}; };
  return {
    topbar: {...r(tb), bg: getComputedStyle(tb).backgroundColor, z: getComputedStyle(tb).zIndex},
    hero: r(hero), media: r(media), video: vid ? r(vid) : 'sin video activo',
    veil: {...r(veil), bg: getComputedStyle(veil).backgroundImage.slice(0,90)},
    // que se ve en el punto medio de la topbar
    debajoDeLaTopbar: document.elementsFromPoint(700, 40).map(n => n.className || n.tagName).slice(0,5),
  };
}), null, 1));
await b.close();
