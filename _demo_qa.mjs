import { createRequire } from 'module';
const require = createRequire('d:/Code/sugerenciasMun/frontend/');
const { chromium } = require('playwright');
const b = await chromium.launch({ channel: 'msedge' });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto('http://localhost:8123/demo.html', { waitUntil: 'networkidle' });
await p.waitForTimeout(4000);
console.log('provincias AR (primeras 6):');
console.log(' ', (await p.$$eval('[data-provincia] option', o => o.slice(1, 7).map(x => x.textContent))).join(' | '));
// cambiar a Paraguay
await p.selectOption('[data-pais]', 'PY');
await p.waitForTimeout(1800);
console.log('\nal elegir Paraguay:');
console.log('  departamentos:', (await p.$$eval('[data-provincia] option', o => o.slice(1, 6).map(x => x.textContent))).join(' | '));
await p.fill('[data-muni]', 'asun');
await p.waitForTimeout(1400);
console.log('  buscar "asun":', (await p.$$eval('.dmsug__i', n => n.map(x => x.textContent.replace(/\s+/g,' ').trim().slice(0,44)))).join(' | ') || 'sin resultados');
// filtrar por departamento
await p.selectOption('[data-provincia]', { index: 1 });
await p.waitForTimeout(300);
await p.fill('[data-muni]', 'san');
await p.waitForTimeout(1400);
const dep = await p.$eval('[data-provincia]', s => s.value);
console.log(`  con departamento "${dep}" -> "san":`, (await p.$$eval('.dmsug__i', n => n.map(x => x.textContent.replace(/\s+/g,' ').trim().slice(0,40)))).join(' | ') || 'sin resultados');
await p.evaluate(() => window.scrollTo(0,0));
await p.screenshot({ path: 'd:/Code/sugerenciasMun/landing/_shots/demo-qa.png', clip: {x:0,y:0,width:1440,height:760} });
await b.close();
