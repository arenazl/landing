import { createRequire } from 'module';
const require = createRequire('d:/Code/sugerenciasMun/frontend/');
const { chromium } = require('playwright');
const b = await chromium.launch({ channel: 'msedge' });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto('http://localhost:8123/', { waitUntil: 'networkidle' });
await p.waitForTimeout(3500);
const info = await p.evaluate(() => {
  const c = document.querySelector('.hero2__media');
  const vs = [...document.querySelectorAll('.hero2__media video')];
  return {
    contenedor: c ? c.className : 'NO EXISTE',
    dataVideos: c ? c.getAttribute('data-videos') : null,
    cantidad: vs.length,
    videos: vs.map(v => ({
      src: v.currentSrc.split('/').pop(),
      opacity: getComputedStyle(v).opacity,
      display: getComputedStyle(v).display,
      readyState: v.readyState,   // 4 = puede reproducir entero
      paused: v.paused,
      w: v.videoWidth,
    })),
    imgFallback: (() => { const i = c && c.querySelector('img'); return i ? { src: i.src.split('/').pop(), opacity: getComputedStyle(i).opacity } : null; })(),
  };
});
console.log(JSON.stringify(info, null, 1));
await b.close();
