// Tarjeta promocional de marquesina (1400×560) para la Chrome Web Store.
//   node tools/store-marquee.cjs --despues captura-despues.png [--lang es|en] [--out store/marquesina-1400x560-es.png]
// Usa una captura REAL de Google con la extensión activa.
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const args = Object.fromEntries(process.argv.slice(2).reduce((acc, v, i, all) => {
  if (v.startsWith('--')) acc.push([v.slice(2), all[i + 1]]);
  return acc;
}, []));
const lang = args.lang || 'es';
const out = path.resolve(args.out || `store/marquesina-1400x560-${lang}.png`);
const T = {
  es: { name: 'Buscar sin IA', tag: 'Google como antes: solo resultados con links.', list: ['Sin resúmenes de IA', 'Sin anuncios', 'Sin rastreo · Gratis'] },
  en: { name: 'Search Without AI', tag: 'Google like it used to be: just results with links.', list: ['No AI Overviews', 'No ads', 'No tracking · Free'] }
}[lang];
const svg = fs.readFileSync(path.join(__dirname, '..', 'icons', 'icon.svg'), 'utf8');
const shot = args.despues ? 'data:image/png;base64,' + fs.readFileSync(args.despues).toString('base64') : null;

const html = `<!doctype html><html><head><meta charset="utf-8"><style>
  * { box-sizing: border-box; margin: 0; }
  body { width: 1400px; height: 560px; overflow: hidden; background: #fbf6f0; font-family: system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif; color: #2b1f17; position: relative; }
  .left { position: absolute; left: 80px; top: 0; bottom: 0; width: 640px; display: flex; flex-direction: column; justify-content: center; }
  .brand { display: flex; align-items: center; gap: 24px; }
  .brand svg { width: 112px; height: 112px; flex: none; }
  h1 { font-size: 64px; font-weight: 800; letter-spacing: -.02em; }
  p { font-size: 26px; color: #6b5749; margin-top: 22px; line-height: 1.35; }
  ul { list-style: none; padding: 0; margin-top: 26px; display: flex; flex-direction: column; gap: 10px; }
  li { font-size: 22px; font-weight: 600; color: #8a3712; }
  li::before { content: "✓"; display: inline-block; width: 30px; color: #c4622d; font-weight: 800; }
  .shot { position: absolute; right: -40px; top: 60px; width: 620px; height: 560px; border-radius: 18px 0 0 0; overflow: hidden; border: 3px solid #c4622d; box-shadow: 0 16px 40px rgba(60,35,20,.18); background: #fff; }
  .shot img { width: 100%; display: block; }
</style></head><body>
  <div class="left">
    <div class="brand">${svg.replace('<svg ', '<svg ')}<h1>${T.name}</h1></div>
    <p>${T.tag}</p>
    <ul>${T.list.map((x) => `<li>${x}</li>`).join('')}</ul>
  </div>
  ${shot ? `<div class="shot"><img src="${shot}" alt=""></div>` : ''}
</body></html>`;

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1400, height: 560 }, deviceScaleFactor: 1 });
  await page.setContent(html);
  await page.waitForTimeout(200);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  await page.screenshot({ path: out, type: 'png' });
  await browser.close();
  console.log('Listo:', path.relative(process.cwd(), out));
})();
