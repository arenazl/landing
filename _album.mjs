import { createRequire } from 'module';
const require = createRequire('d:/Code/sugerenciasMun/frontend/');
const { chromium } = require('playwright');
const PAGS = [['home','/'],['reclamos','/reclamos-vecinales'],['tramites','/tramites-municipales'],
  ['tesoreria','/tesoreria'],['precios','/precios'],['contacto','/contacto'],
  ['demo','/demo.html'],['comunicaciones','/comunicaciones.html'],['software','/software-gestion-municipal']];
const b = await chromium.launch({ channel: 'msedge' });
for (const [n, ruta] of PAGS) {
  for (const [modo, w, h] of [['desk', 1440, 900], ['movil', 390, 844]]) {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
    const p = await ctx.newPage();
    await p.goto('http://localhost:8123' + ruta, { waitUntil: 'networkidle' });
    await p.waitForTimeout(1800);
    await p.evaluate(async () => { const f=()=>document.documentElement.scrollHeight;
      for (let y=0;y<f();y+=350){window.scrollTo(0,y);await new Promise(r=>setTimeout(r,55));}
      window.scrollTo(0,f()); await new Promise(r=>setTimeout(r,700)); window.scrollTo(0,0); });
    await p.waitForTimeout(900);
    await p.screenshot({ path: `d:/Code/sugerenciasMun/landing/_shots/rev-${n}-${modo}.png`, fullPage: true });
    await ctx.close();
  }
  console.log('  ' + n);
}
await b.close();
console.log('album listo');
