import { createRequire } from 'module';
const require = createRequire('d:/Code/sugerenciasMun/frontend/');
const { chromium } = require('playwright');
const b = await chromium.launch({ channel: 'msedge' });
for (const [w, etiq] of [[1440,'desktop'],[390,'movil']]) {
  const p = await b.newPage({ viewport: { width: w, height: 900 } });
  const errs = [], fails = [];
  p.on('console', m => { if (m.type() === 'error') errs.push(m.text().slice(0,80)); });
  p.on('requestfailed', r => fails.push(r.url().split('/').pop()));
  await p.goto('https://qa-app.munify.com.ar/calls/', { waitUntil: 'networkidle', timeout: 45000 }).catch(e=>console.log('goto:',e.message.slice(0,50)));
  await p.waitForTimeout(3000);
  const r = await p.evaluate(() => {
    const cs = getComputedStyle(document.body);
    return { titulo: document.title, bg: cs.backgroundColor, fuente: cs.fontFamily.split(',')[0],
             hojas: document.styleSheets.length,
             reglas: [...document.styleSheets].reduce((a,s)=>{try{return a+s.cssRules.length}catch{return a}},0),
             texto: document.body.innerText.trim().slice(0,90).replace(/\n/g,' | '),
             desborde: document.documentElement.scrollWidth - document.documentElement.clientWidth };
  });
  console.log(etiq + ':', JSON.stringify(r, null, 1));
  console.log('  errores:', errs.length, '| requests fallidos:', fails.length, fails.slice(0,3));
  await p.screenshot({ path: `d:/Code/sugerenciasMun/landing/_shots/calls-${etiq}.png` });
  await p.close();
}
await b.close();
