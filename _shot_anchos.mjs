import { createRequire } from 'module';
const require = createRequire('d:/Code/sugerenciasMun/frontend/');
const { chromium } = require('playwright');
const b = await chromium.launch({ channel: 'msedge' });
for (const w of [1180, 1280]) {
  const p = await b.newPage({ viewport: { width: w, height: 220 } });
  await p.goto('http://localhost:8123/', { waitUntil: 'networkidle' });
  await p.waitForTimeout(600);
  await p.locator('.topbar').screenshot({ path: `d:/Code/sugerenciasMun/landing/_shots/topbar-${w}.png` });
  await p.close();
}
console.log('capturas de topbar listas');
await b.close();
