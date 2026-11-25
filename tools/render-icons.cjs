// Exporta icons/icon.svg a PNG de 32, 48 y 128 px, e icons/icon-small.svg a 16 px, con el Chromium de Playwright.
//   node tools/render-icons.cjs
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const dir = path.join(__dirname, '..', 'icons');
  const svgBig = fs.readFileSync(path.join(dir, 'icon.svg'), 'utf8');
  // 16 px usa una versión simplificada para que se lea en la barra de Chrome.
  const svgSmall = fs.readFileSync(path.join(dir, 'icon-small.svg'), 'utf8');
  const browser = await chromium.launch();
  for (const size of [16, 32, 48, 128]) {
    const page = await browser.newPage({ viewport: { width: size, height: size }, deviceScaleFactor: 1 });
    const svg = size === 16 ? svgSmall : svgBig;
    const html = `<html><body style="margin:0;background:transparent">${svg.replace('<svg ', `<svg style="display:block;width:${size}px;height:${size}px" `)}</body></html>`;
    await page.setContent(html);
    await page.screenshot({ path: path.join(dir, `icon${size}.png`), omitBackground: true });
    await page.close();
  }
  await browser.close();
  console.log('PNG listos en icons/');
})();
