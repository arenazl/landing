import { createRequire } from 'module';
const require = createRequire('d:/Code/sugerenciasMun/frontend/');
const { chromium } = require('playwright');
const b = await chromium.launch({ channel: 'msedge' });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto('http://localhost:8123/tramites-municipales', { waitUntil: 'networkidle' });
await p.click('[data-theme-toggle]'); await p.waitForTimeout(800);
console.log(JSON.stringify(await p.evaluate(() => {
  const card = [...document.querySelectorAll('.bento--ink')].find(c => /Entrega online/.test(c.textContent));
  if (!card) return 'no encontrada';
  const h3 = card.querySelector('h3'), cs = getComputedStyle(card);
  return { cardBgColor: cs.backgroundColor, cardBgImage: cs.backgroundImage.slice(0, 70),
           h3color: getComputedStyle(h3).color, h3inline: h3.getAttribute('style') };
}), null, 1));
await b.close();
