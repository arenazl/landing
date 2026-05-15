/**
 * Genera favicons, apple-touch e iconos PNG para la landing
 * desde el SVG nuevo de Munify (con tilde verde).
 *
 * Master: images/Munify.svg (para fondo claro)
 * iOS:    images/Munify-ios.svg (fondo azul + M blanca + check verde)
 */
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const MASTER = path.join(ROOT, 'images/Munify.svg');
const MASTER_IOS = path.join(ROOT, 'images/Munify-ios.svg');
const OUT = path.join(ROOT, 'images');

async function renderAt(svg, size, opts = {}) {
  const density = Math.min(400, Math.max(96, size * 2));
  return sharp(svg, { density, limitInputPixels: false })
    .resize(size, size, {
      fit: opts.fit || 'contain',
      background: opts.background || { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();
}

async function main() {
  if (!fs.existsSync(MASTER)) { console.error('No master'); process.exit(1); }

  // Favicon 32 (con tilde verde, transparente)
  fs.writeFileSync(path.join(OUT, 'munify_logo_no_text (1).png'), await renderAt(MASTER, 64));
  console.log('OK munify_logo_no_text (1).png 64x64');

  // Logo con padding mayor para header (sigue siendo solo el mark)
  fs.writeFileSync(path.join(OUT, 'munify_logo_1.png'), await renderAt(MASTER, 256));
  console.log('OK munify_logo_1.png 256x256');

  // Apple touch (iOS) — fondo azul brand + M blanca + tilde verde
  if (fs.existsSync(MASTER_IOS)) {
    await sharp(MASTER_IOS, { density: 400, limitInputPixels: false })
      .resize(180, 180, { fit: 'cover' })
      .png()
      .toFile(path.join(OUT, 'apple-touch-icon.png'));
    console.log('OK apple-touch-icon.png 180x180 (iOS)');
  }

  // OG image 1200x630 con logo centrado sobre azul brand
  // Render mark grande sobre azul
  const ogBg = Buffer.from(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630">' +
    '<rect width="1200" height="630" fill="#112a6c"/>' +
    '</svg>'
  );
  const ogBase = await sharp(ogBg).png().toBuffer();
  const ogLogo = await sharp(MASTER_IOS, { density: 400, limitInputPixels: false })
    .resize(300, 300, { fit: 'contain' })
    .toBuffer();
  await sharp(ogBase)
    .composite([{ input: ogLogo, gravity: 'centre' }])
    .png()
    .toFile(path.join(OUT, 'og-image.png'));
  console.log('OK og-image.png 1200x630');

  console.log('Done.');
}

main().catch(e => { console.error(e); process.exit(1); });
