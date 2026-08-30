import { createRequire } from 'module';
const require = createRequire('d:/Code/sugerenciasMun/frontend/');
const { chromium } = require('playwright');
const b = await chromium.launch({ channel: 'msedge' });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
const errs = [], api = [];
p.on('console', m => { if (m.type() === 'error') errs.push(m.text().slice(0, 90)); });
p.on('response', r => { if (/\/api\//.test(r.url())) api.push(r.status() + ' ' + r.url().split('/api/')[1].slice(0, 52)); });

await p.goto('http://localhost:8123/demo.html', { waitUntil: 'networkidle' });
await p.waitForTimeout(6000);

const est = await p.evaluate(() => ({
  paises: [...document.querySelectorAll('[data-pais] option')].map(o => o.textContent + (o.disabled ? ' [off]' : '')),
  provDisabled: document.querySelector('[data-provincia]').disabled,
  provOpciones: document.querySelectorAll('[data-provincia] option').length,
  leyenda: document.querySelector('[data-cat-leyenda]')?.textContent,
  kpiPaises: document.querySelector('[data-cat-paises]')?.textContent,
  kpiDemos: document.querySelector('[data-cat-demos]')?.textContent,
  demosPintadas: document.querySelectorAll('.dmchip').length,
}));
console.log('ESTADO:', JSON.stringify(est, null, 1));

// autocomplete real
await p.fill('[data-muni]', 'pergam');
await p.waitForTimeout(1400);
const sug = await p.$$eval('.dmsug__i', ns => ns.map(n => n.textContent.replace(/\s+/g, ' ').trim().slice(0, 46)));
console.log('\nSUGERENCIAS para "pergam":', sug.length ? sug : 'ninguna');

// el boton se habilita al elegir
if (sug.length) {
  await p.click('.dmsug__i');
  await p.waitForTimeout(400);
  console.log('boton habilitado tras elegir:', !(await p.getAttribute('[data-crear-btn]', 'disabled') !== null));
}
// buscador de demos existentes
await p.fill('[data-buscar-demo]', 'san');
await p.waitForTimeout(500);
console.log('demos filtrando "san":', await p.$$eval('.dmchip', n => n.length));

console.log('\nAPI:'); [...new Set(api)].slice(0, 12).forEach(a => console.log('  ' + a));
console.log('errores de consola:', errs.length, errs.slice(0, 3));
await p.evaluate(() => window.scrollTo(0, 0));
await p.screenshot({ path: 'd:/Code/sugerenciasMun/landing/_shots/demo.png', fullPage: true });
await b.close();
