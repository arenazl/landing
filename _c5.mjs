import { createRequire } from 'module';
const require = createRequire('d:/Code/sugerenciasMun/frontend/');
const { chromium } = require('playwright');
const b = await chromium.launch({ channel: 'msedge' });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto('file:///D:/Code/sugerenciasMun/frontend/public/calls/index.html', { waitUntil: 'load' });
await p.waitForTimeout(1500);
const r = await p.evaluate(() => {
  const out = {};
  for (const pais of ['Argentina','Paraguay','Perú','Uruguay','Bolivia (no existe)']) {
    const c = cierreDe(pais, 'Cerrillos');
    out[pais] = { link: c.link.slice(0, 105), duda: c.duda.slice(0, 80) };
  }
  return out;
});
for (const [pais, c] of Object.entries(r)) {
  console.log(`\n=== ${pais} ===`);
  console.log('  1:', c.link);
  console.log('  2:', c.duda);
}
await b.close();
