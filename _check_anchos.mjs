/* La topbar se rompia en anchos intermedios y el verificador no lo veia porque
   solo probaba 1440. Esto la mide en 8 anchos: nada se pliega, nada se pisa. */
import { createRequire } from 'module';
const require = createRequire('d:/Code/sugerenciasMun/frontend/');
const { chromium } = require('playwright');
const ANCHOS = [1920, 1600, 1440, 1366, 1280, 1180, 1100, 1024, 900, 768, 390];
const b = await chromium.launch({ channel: 'msedge' });
let fallas = 0;
for (const w of ANCHOS) {
  const p = await b.newPage({ viewport: { width: w, height: 900 } });
  await p.goto('http://localhost:8123/', { waitUntil: 'networkidle' });
  await p.waitForTimeout(400);
  const r = await p.evaluate(() => {
    const tb = document.querySelector('.tb2');
    const alto = tb.getBoundingClientRect().height;
    // solo los bloques VISIBLES: abajo de 1024 el nav esta en display:none y
    // su rect es 0,0 -> comparar contra eso daba un "se pisan" que no existe
    const hijos = [...tb.children]
      .filter(n => { const b = n.getBoundingClientRect(); return b.width > 0 && b.height > 0; })
      .map(n => n.getBoundingClientRect());
    // ¿algo se plego? (mas alto que una linea)
    const plegados = [...tb.querySelectorAll('a,button,span')].filter(n => {
      const b = n.getBoundingClientRect();
      const lh = parseFloat(getComputedStyle(n).lineHeight) || 20;
      return b.height > lh * 1.9 && n.textContent.trim().length > 2 && !n.querySelector('*');
    }).map(n => n.textContent.trim().slice(0, 22));
    // ¿se pisan entre si?
    let pisan = null;
    for (let i = 0; i < hijos.length - 1; i++)
      if (hijos[i].right > hijos[i + 1].left + 1) pisan = `bloque ${i} pisa al ${i + 1}`;
    const desb = document.documentElement.scrollWidth - window.innerWidth;
    return { alto: Math.round(alto), plegados: [...new Set(plegados)], pisan, desb };
  });
  const mal = r.plegados.length || r.pisan || r.desb > 1 || r.alto > 92;
  if (mal) fallas++;
  console.log(`${String(w).padStart(4)}px  alto=${String(r.alto).padStart(3)}  ${mal ? 'ROTA -> ' : 'ok'}${r.pisan || ''}${r.plegados.length ? ' plegados: ' + r.plegados.join(', ') : ''}${r.desb > 1 ? ' desborde ' + r.desb : ''}`);
  await p.close();
}
await b.close();
console.log(fallas ? `\n${fallas} anchos ROTOS` : '\nla topbar aguanta los 11 anchos');
process.exit(fallas ? 1 : 0);
