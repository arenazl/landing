import { createRequire } from 'module';
const require = createRequire('d:/Code/sugerenciasMun/frontend/');
const { chromium } = require('playwright');
const b = await chromium.launch({ channel: 'msedge' });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto('http://localhost:8123/', { waitUntil: 'networkidle' });
await p.waitForTimeout(800);
const antes = await p.evaluate(() => {
  const s = document.querySelector('.planes');
  const cs = getComputedStyle(s);
  return { opacity: cs.opacity, transform: cs.transform, alto: s.getBoundingClientRect().height, clases: s.className };
});
console.log('SIN scrollear :', JSON.stringify(antes));
// scrollear hasta el fondo, como haria una persona
await p.evaluate(async () => {
  for (let y = 0; y < document.body.scrollHeight; y += 400) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 60)); }
});
await p.waitForTimeout(1200);
const despues = await p.evaluate(() => {
  const s = document.querySelector('.planes');
  const cs = getComputedStyle(s);
  return { opacity: cs.opacity, alto: s.getBoundingClientRect().height, planes: document.querySelectorAll('.plan').length };
});
console.log('DESPUES scroll:', JSON.stringify(despues));
await b.close();
