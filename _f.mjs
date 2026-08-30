import { createRequire } from 'module';
const require = createRequire('d:/Code/sugerenciasMun/frontend/');
const { chromium } = require('playwright');
const b = await chromium.launch({ channel: 'msedge' });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto('http://localhost:8123/comunicaciones.html', { waitUntil: 'networkidle' });
await p.waitForTimeout(3000);
console.log('COMUNICACIONES:', JSON.stringify(await p.evaluate(async () => {
  await document.fonts.ready;
  return { sora400: document.fonts.check('400 16px Sora'), sora600: document.fonts.check('600 16px Sora'),
           sora700: document.fonts.check('700 16px Sora'), sora800: document.fonts.check('800 16px Sora'),
           cargadas: [...document.fonts].filter(f=>f.family==='Sora'&&f.status==='loaded').map(f=>f.weight) };
})));
await p.goto('http://localhost:8123/software-gestion-municipal', { waitUntil: 'networkidle' });
await p.evaluate(async () => { const h=()=>document.documentElement.scrollHeight;
  for (let y=0;y<h();y+=400){window.scrollTo(0,y);await new Promise(r=>setTimeout(r,70));} window.scrollTo(0,h()); });
await p.waitForTimeout(1500);
console.log('SOFTWARE cierre:', JSON.stringify(await p.evaluate(() => {
  const c = document.querySelector('.cierre');
  return { existe: !!c, clases: c?.className, opacity: c && getComputedStyle(c).opacity,
           top: c && Math.round(c.getBoundingClientRect().top), visible: c?.classList.contains('visible') };
})));
await b.close();
