import { createRequire } from 'module';
const require = createRequire('d:/Code/sugerenciasMun/frontend/');
const { chromium } = require('playwright');

const OUT = 'd:/Code/sugerenciasMun/landing/_shots';
const BASE = 'http://localhost:8123';
const b = await chromium.launch({ channel: 'msedge' });

let fallos = 0;
const ok = (c, m) => { console.log((c ? '  OK   ' : '  FALLA') + '  ' + m); if (!c) fallos++; };

for (const modo of ['dark', 'light']) {
  console.log('\n===== ' + modo.toUpperCase() + ' =====');
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
  const p = await ctx.newPage();
  const errs = [], fails = [];
  p.on('console', m => { if (m.type() === 'error') errs.push(m.text().slice(0, 100)); });
  p.on('requestfailed', r => { if (!/\.mp4/.test(r.url())) fails.push(r.url().split('/').pop()); });

  await p.goto(BASE + '/', { waitUntil: 'networkidle' });
  if (modo === 'light') { await p.click('[data-theme-toggle]'); await p.waitForTimeout(700); }
  await p.waitForTimeout(900);

  // 1. las 8 secciones del prototipo
  const secs = await p.$$eval('main section, body > section', ns => ns.map(n => n.className.split(' ')[0]));
  ok(secs.length === 8, 'secciones del prototipo: ' + secs.join(' > '));

  // 2. nada del sitio viejo
  const viejo = await p.evaluate(() => ({
    kpi: document.querySelectorAll('.kpi-strip').length,
    bento: document.querySelectorAll('.bento').length,
    logoViejo: [...document.images].filter(i => /Munify\.svg|munify_logo_no_text/.test(i.src)).length,
  }));
  ok(viejo.kpi === 0 && viejo.bento === 0, 'sin KPIs ni bento viejos');
  ok(viejo.logoViejo === 0, 'sin el logo viejo (usa el del handoff)');

  // 3. menu de 7
  const nav = await p.$$eval('.tb2__nav a', as => as.map(a => a.textContent.trim()));
  ok(nav.length === 7, 'menu de 7: ' + nav.join(' · '));

  // 4. tipografia y tokens
  const t = await p.evaluate(() => {
    const cs = getComputedStyle(document.documentElement);
    return { h1: getComputedStyle(document.querySelector('h1')).fontFamily.split(',')[0],
             body: getComputedStyle(document.body).fontFamily.split(',')[0],
             paper: cs.getPropertyValue('--paper').trim(), accent: cs.getPropertyValue('--accent').trim() };
  });
  ok(t.h1.includes('Sora') && t.body.includes('Inter'), 'Sora + Inter (' + t.h1 + ' / ' + t.body + ')');
  ok(t.paper === (modo === 'dark' ? '#060E22' : '#F2F5FA'), 'token --paper ' + t.paper);
  ok(t.accent === (modo === 'dark' ? '#4CD9C6' : '#0E9384'), 'token --accent ' + t.accent);

  // 5. imagenes rotas
  const rotas = await p.$$eval('img', is => is.filter(i => !i.complete || i.naturalWidth === 0).map(i => i.src.split('/').pop()));
  ok(rotas.length === 0, 'imagenes rotas: ' + (rotas.join(', ') || 'ninguna'));

  // 6. simulacion de la 02
  await p.locator('#dos-lados').scrollIntoViewIfNeeded(); await p.waitForTimeout(800);
  const s1 = await p.textContent('[data-pill]'); await p.waitForTimeout(2300);
  const s2 = await p.textContent('[data-pill]');
  ok(s1 !== s2, 'simulacion 02 avanza sola: ' + s1 + ' -> ' + s2);

  // 7. carrusel del intendente
  await p.locator('[data-carru]').scrollIntoViewIfNeeded(); await p.waitForTimeout(600);
  const dots = await p.$$eval('.carru__dot', d => d.length);
  const c1 = await p.$$eval('[data-slide]', s => s.findIndex(x => x.classList.contains('is-on')));
  await p.click('[data-next]'); await p.waitForTimeout(700);
  const c2 = await p.$$eval('[data-slide]', s => s.findIndex(x => x.classList.contains('is-on')));
  ok(dots === 3 && c1 !== c2, 'carrusel: ' + dots + ' dots, slide ' + c1 + ' -> ' + c2);

  // 8. sin scroll horizontal
  const ancho = await p.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);
  ok(ancho, 'sin desborde horizontal');

  ok(errs.length === 0, 'errores de consola: ' + (errs.slice(0, 2).join(' | ') || '0'));
  ok(fails.length === 0, 'requests fallidos: ' + (fails.slice(0, 3).join(', ') || '0'));

  // Las secciones .reveal arrancan en opacity:0 y solo aparecen al intersectar,
  // asi que hay que recorrer la pagina como una persona antes de capturar:
  // si no, el fullPage sale con huecos negros que NO son un bug de la pagina.
  await p.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 400) {
      window.scrollTo(0, y); await new Promise(r => setTimeout(r, 70));
    }
    window.scrollTo(0, 0);
  });
  await p.waitForTimeout(1000);
  const invisibles = await p.$$eval('main section, body > section',
    ns => ns.filter(n => +getComputedStyle(n).opacity < 0.9).map(n => n.className.split(' ')[0]));
  ok(invisibles.length === 0, 'todas las secciones visibles tras scroll: ' + (invisibles.join(', ') || 'si'));
  const planes = await p.$$eval('.plan', n => n.length);
  ok(planes === 3, 'los 3 planes renderizados');
  await p.screenshot({ path: `${OUT}/home-final-${modo}.png`, fullPage: true });
  await ctx.close();
}

// movil
console.log('\n===== MOVIL 390x844 =====');
const m = await b.newContext({ viewport: { width: 390, height: 844 } });
const pm = await m.newPage();
await pm.goto(BASE + '/', { waitUntil: 'networkidle' });
await pm.waitForTimeout(800);
const desborde = await pm.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
ok(desborde <= 1, 'sin scroll horizontal en movil (desborde ' + desborde + 'px)');
await pm.screenshot({ path: `${OUT}/home-movil.png` });
await m.close();

await b.close();
console.log('\n' + (fallos === 0 ? 'TODO VERDE' : fallos + ' FALLAS'));
process.exit(fallos ? 1 : 0);
