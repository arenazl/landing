import { createRequire } from 'module';
const require = createRequire('d:/Code/sugerenciasMun/frontend/');
const { chromium } = require('playwright');
const b = await chromium.launch({ channel: 'msedge' });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto('http://localhost:8123/', { waitUntil: 'networkidle' });
await p.waitForTimeout(3000);
const buf = await p.screenshot({ clip: { x: 600, y: 0, width: 40, height: 300 } });
const sharp = require('sharp');
const { data, info } = await sharp(buf).raw().toBuffer({ resolveWithObject: true });
console.log('columna de pixeles (x=620), de y=0 a 300:');
let prev = null;
for (let y = 0; y < 300; y += 5) {
  const i = (y * info.width + 20) * info.channels;
  const c = `${data[i]},${data[i+1]},${data[i+2]}`;
  const marca = prev && Math.abs(data[i] - prev[0]) + Math.abs(data[i+1] - prev[1]) + Math.abs(data[i+2] - prev[2]) > 24 ? '  <-- SALTO' : '';
  console.log(`  y=${String(y).padStart(3)}  rgb(${c})${marca}`);
  prev = [data[i], data[i+1], data[i+2]];
}
await b.close();
