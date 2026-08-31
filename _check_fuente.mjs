import { createRequire } from 'module';
const require = createRequire('d:/Code/sugerenciasMun/frontend/');
const { chromium } = require('playwright');
const b = await chromium.launch({ channel: 'msedge' });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
const css = [];
p.on('response', r => { if (/fonts\.(googleapis|gstatic)/.test(r.url())) css.push(r.status() + ' ' + r.url().slice(0, 95)); });
await p.goto('http://localhost:8123/', { waitUntil: 'networkidle' });
await p.waitForTimeout(2500);
console.log('--- pedidos a Google Fonts ---'); css.forEach(c => console.log('  ' + c));
console.log('\n--- fuentes REALMENTE cargadas ---');
console.log(JSON.stringify(await p.evaluate(async () => {
  await document.fonts.ready;
  const cargadas = [...document.fonts].map(f => f.family + ' ' + f.weight + ' [' + f.status + ']');
  return {
    disponibles: [...new Set(cargadas)].sort(),
    check_Nunito: document.fonts.check('16px Nunito'),
    check_Sora: document.fonts.check('600 16px Sora'),
    check_Inter: document.fonts.check('16px Inter'),
    body_declarado: getComputedStyle(document.body).fontFamily,
    h1_declarado: getComputedStyle(document.querySelector('h1')).fontFamily,
    p_declarado: getComputedStyle(document.querySelector('.hero2__sub')).fontFamily,
  };
}), null, 1));
await b.close();
