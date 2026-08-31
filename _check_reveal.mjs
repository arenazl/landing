import { createRequire } from 'module';
const require = createRequire('d:/Code/sugerenciasMun/frontend/');
const { chromium } = require('playwright');
const b = await chromium.launch({ channel: 'msedge' });
for (const [nombre, paso, espera] of [['rapido (400px/60ms)', 400, 60], ['lento (200px/200ms)', 200, 200]]) {
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  await p.goto('http://localhost:8123/', { waitUntil: 'networkidle' });
  await p.waitForTimeout(600);
  await p.evaluate(async ({ paso, espera }) => {
    for (let y = 0; y < document.body.scrollHeight; y += paso) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, espera)); }
  }, { paso, espera });
  await p.waitForTimeout(1000);
  const invis = await p.$$eval('section', ns => ns.filter(n => +getComputedStyle(n).opacity < .9).map(n => n.className.split(' ')[0]));
  console.log(`scroll ${nombre.padEnd(22)} -> invisibles: ${invis.join(', ') || 'ninguna'}`);
  await p.close();
}
await b.close();
