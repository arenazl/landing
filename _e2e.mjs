import { createRequire } from 'module';
const require = createRequire('d:/Code/sugerenciasMun/frontend/');
const { chromium } = require('playwright');
const b = await chromium.launch({ channel: 'msedge' });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
// la landing local recibiendo el parametro, como si viniera del boton
await p.goto('http://localhost:8123/demo.html?m=Chivilcoy&pais=AR&origen=llamados', { waitUntil: 'networkidle' });
await p.waitForTimeout(4500);
console.log(JSON.stringify(await p.evaluate(() => ({
  pais: document.querySelector('[data-pais]')?.value,
  municipioEnElInput: document.querySelector('[data-muni]')?.value,
  botonHabilitado: !document.querySelector('[data-crear-btn]')?.disabled,
  mensaje: document.querySelector('[data-estado]')?.innerText?.trim().slice(0,90),
})), null, 1));
await p.screenshot({ path: 'd:/Code/sugerenciasMun/landing/_shots/demo-precargada.png', clip: {x:0,y:300,width:1440,height:560} });
await b.close();
