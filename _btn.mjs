import { createRequire } from 'module';
const require = createRequire('d:/Code/sugerenciasMun/frontend/');
const { chromium } = require('playwright');
const b = await chromium.launch({ channel: 'msedge' });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
p.on('pageerror', e => console.log('  ERROR:', e.message.slice(0,100)));
await p.goto('file:///D:/Code/sugerenciasMun/frontend/public/calls/index.html', { waitUntil: 'load' });
await p.waitForTimeout(1800);
await p.click('text=Trabajar').catch(()=>{});
await p.waitForTimeout(1000);
await p.evaluate(() => { for (const n of document.querySelectorAll('.lista-col *')) if (n.onclick || n.tagName==='BUTTON') { n.click(); break; } });
await p.waitForTimeout(1300);
const r = await p.evaluate(() => {
  const a = document.querySelector('.demo-btn');
  return a ? { texto: a.textContent.trim(), href: a.href, nota: document.querySelector('.demo-nota')?.textContent.slice(0,70) } : null;
});
console.log(r ? JSON.stringify(r, null, 1) : '  NO aparece el boton');
if (r) { const el = await p.$('.demo-btn'); await el.scrollIntoViewIfNeeded(); await p.waitForTimeout(300);
  const box = await p.$('.sec:has(.demo-btn)') || el;
  await box.screenshot({ path: 'd:/Code/sugerenciasMun/landing/_shots/btn-demo.png' }); }
await b.close();
