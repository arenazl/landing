import { createRequire } from 'module';
const require = createRequire('d:/Code/sugerenciasMun/frontend/');
const { chromium } = require('playwright');
const b = await chromium.launch({ channel: 'msedge' });
const p = await b.newPage({ viewport: { width: 390, height: 844 } });
const errs = [], api = [], fails = [];
p.on('console', m => { if (m.type() === 'error') errs.push(m.text().slice(0,80)); });
p.on('response', r => { if (/\/api\//.test(r.url())) api.push(r.status() + ' ' + r.url().split('/api/')[1]); });
p.on('requestfailed', r => fails.push(r.url().split('/').pop()));
await p.goto('http://localhost:8123/llamados/', { waitUntil: 'networkidle' });
await p.waitForTimeout(3000);
console.log(JSON.stringify(await p.evaluate(() => ({
  titulo: document.title,
  robots: document.querySelector('meta[name=robots]')?.content,
  reglasCSS: [...document.styleSheets].reduce((a,s)=>{try{return a+s.cssRules.length}catch{return a}},0),
  apiBase: (window.API_BASE || 'no expuesta'),
  texto: document.body.innerText.trim().slice(0,80).replace(/\n/g,' | '),
  desborde: document.documentElement.scrollWidth - document.documentElement.clientWidth,
  manifest: document.querySelector('link[rel=manifest]')?.getAttribute('href'),
})), null, 1));
console.log('  errores:', errs.length, errs.slice(0,2));
console.log('  requests fallidos:', fails.length, fails.slice(0,3));
console.log('  llamadas al API:', api.length ? api : '(ninguna al cargar, es on-demand)');
await p.screenshot({ path: 'd:/Code/sugerenciasMun/landing/_shots/llamados.png' });
await b.close();
