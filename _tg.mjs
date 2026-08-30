import { createRequire } from 'module';
const require = createRequire('d:/Code/sugerenciasMun/frontend/');
const { chromium } = require('playwright');
const b = await chromium.launch({ channel: 'msedge' });
for (const w of [390, 1440]) {
  const p = await b.newPage({ viewport: { width: w, height: 844 } });
  await p.goto('http://localhost:8123/', { waitUntil: 'networkidle' });
  await p.waitForTimeout(1200);
  const leer = () => p.evaluate(() => {
    const t = document.querySelector('[data-theme-toggle]');
    const vis = s => { const n = t.querySelector(s); return n && getComputedStyle(n).display !== 'none'; };
    return { tema: document.documentElement.getAttribute('data-theme') || 'oscuro',
             sol: vis('.icon-sun'), luna: vis('.icon-moon'),
             texto: getComputedStyle(t, '::after').content, ancho: Math.round(t.getBoundingClientRect().width) };
  });
  const a = await leer();
  await p.click('[data-theme-toggle]'); await p.waitForTimeout(700);
  const c = await leer();
  console.log(`${w}px  en ${a.tema}: ${a.sol?'SOL':''}${a.luna?'LUNA':''} texto=${a.texto} ancho=${a.ancho}`);
  console.log(`      en ${c.tema}: ${c.sol?'SOL':''}${c.luna?'LUNA':''} texto=${c.texto} ancho=${c.ancho}`);
  await p.close();
}
await b.close();
