import { createRequire } from 'module';
const require = createRequire('d:/Code/sugerenciasMun/frontend/');
const { chromium, devices } = require('playwright');
const b = await chromium.launch({ channel: 'msedge' });
for (const d of ['iPhone 14 Pro', 'iPad (gen 7)']) {
  const ctx = await b.newContext({ ...devices[d] });
  const p = await ctx.newPage();
  for (const ruta of ['/', '/demo.html']) {
    await p.goto('http://localhost:8123' + ruta, { waitUntil: 'networkidle' });
    await p.waitForTimeout(1500);
    const r = await p.evaluate(async () => {
      const antes = window.scrollY;
      window.scrollTo(0, 900); await new Promise(r => setTimeout(r, 350));
      const conJS = window.scrollY;
      const ch = getComputedStyle(document.documentElement), cb = getComputedStyle(document.body);
      return { scrolleaConJS: conJS > antes, llego: conJS,
               htmlOverflowX: ch.overflowX, bodyOverflowX: cb.overflowX,
               htmlOverscroll: ch.overscrollBehavior, alto: document.documentElement.scrollHeight };
    });
    console.log(`  ${d.padEnd(16)} ${ruta.padEnd(11)} scroll=${r.scrolleaConJS ? 'OK ('+r.llego+'px)' : 'ROTO'}  html.overflowX=${r.htmlOverflowX}  body.overflowX=${r.bodyOverflowX}`);
  }
  await ctx.close();
}
await b.close();
