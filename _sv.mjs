import { createRequire } from 'module';
const require = createRequire('d:/Code/sugerenciasMun/frontend/');
const { chromium } = require('playwright');
const b = await chromium.launch({ channel: 'msedge' });
for (const [w, etiq] of [[390,'movil'],[1440,'desktop']]) {
  const p = await b.newPage({ viewport: { width: w, height: 844 }, isMobile: w < 500, hasTouch: w < 500 });
  await p.goto('http://localhost:8123/', { waitUntil: 'networkidle' });
  await p.waitForTimeout(3500);
  const r = await p.evaluate(async () => {
    const antes = window.scrollY;
    window.scrollTo(0, 600);
    await new Promise(r => setTimeout(r, 300));
    const despues = window.scrollY;
    const cs = getComputedStyle(document.body), ch = getComputedStyle(document.documentElement);
    return {
      SCROLLEA: despues > antes,
      scrollY: despues,
      alturaPagina: document.documentElement.scrollHeight,
      ventana: window.innerHeight,
      bodyOverflow: cs.overflow + ' / ' + cs.overflowY,
      htmlOverflow: ch.overflow + ' / ' + ch.overflowY,
      bodyPosition: cs.position, htmlPosition: ch.position,
      videos: document.querySelectorAll('video').length,
      videoCorriendo: [...document.querySelectorAll('video')].filter(v => !v.paused && v.currentTime > 0).length,
      videoVisible: [...document.querySelectorAll('video')].filter(v => +getComputedStyle(v).opacity > 0.1).length,
    };
  });
  console.log(etiq + ':', JSON.stringify(r, null, 1));
  await p.close();
}
await b.close();
