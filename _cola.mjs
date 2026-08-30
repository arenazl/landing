import { createRequire } from 'module';
const require = createRequire('d:/Code/sugerenciasMun/frontend/');
const { chromium } = require('playwright');
const b = await chromium.launch({ channel: 'msedge' });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto('file:///D:/Code/sugerenciasMun/frontend/public/calls/index.html', { waitUntil: 'load' });
await p.waitForTimeout(2000);
const r = await p.evaluate(() => {
  const cola = colaDelDia(15);
  return {
    sugerido: (() => { const c = siguienteSugerido(); return c ? `${c.localidad} (${c.pais}, ${c.habitantes} hab)` : null; })(),
    primeros15: cola.map(c => `${c.localidad} · ${c.pais}`),
    paisesEnLos15: [...new Set(cola.map(c => c.pais))],
    totalArgentina: CONTACTOS.filter(c => c.pais === 'Argentina').length,
  };
});
console.log('  SUGERIDO DE HOY:', r.sugerido);
console.log('  paises en los primeros 15:', r.paisesEnLos15.join(', '));
console.log('  municipios argentinos en total:', r.totalArgentina);
console.log('\n  la cola:');
r.primeros15.forEach((x,i) => console.log(`   ${String(i+1).padStart(2)}. ${x}`));
// el rotulo del hero
await p.waitForTimeout(500);
console.log('\n  rotulo del hero:', await p.evaluate(() => document.querySelector('#siguiente .k')?.textContent));
console.log('  titulo del hero:', await p.evaluate(() => document.querySelector('#siguiente h2')?.textContent));
await b.close();
