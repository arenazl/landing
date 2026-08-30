import { createRequire } from 'module';
const require = createRequire('d:/Code/sugerenciasMun/frontend/');
const { chromium } = require('playwright');
const b = await chromium.launch({ channel: 'msedge' });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
const fails = [], errs = [];
p.on('requestfailed', r => fails.push(r.url().split('/').slice(-2).join('/')));
p.on('console', m => { if (m.type() === 'error') errs.push(m.text().slice(0, 120)); });
const f = 'file:///D:/Code/sugerenciasMun/landing/docs/design-sync/comercial-2026-08-30/pages/Munify%20Home.dc.html';
await p.goto(f, { waitUntil: 'load' }).catch(e => console.log('goto:', e.message.slice(0,80)));
await p.waitForTimeout(3000);
const info = await p.evaluate(() => ({
  bodyText: document.body.innerText.trim().slice(0, 120),
  h1: document.querySelector('h1')?.textContent?.slice(0,50) || '(sin h1)',
  imgs: [...document.images].map(i => ({ src: i.src.split('/').pop(), ok: i.naturalWidth > 0 })),
  videos: document.querySelectorAll('video').length,
  xdc: !!document.querySelector('x-dc'),
}));
console.log('render:', JSON.stringify(info, null, 1).slice(0, 900));
console.log('\nrequests fallidos:', fails.length); fails.slice(0,8).forEach(x => console.log('  -', decodeURIComponent(x)));
console.log('errores consola:', errs.length); errs.slice(0,4).forEach(x => console.log('  -', x));
await p.screenshot({ path: 'd:/Code/sugerenciasMun/landing/_shots/dc-abierto.png' });
await b.close();
