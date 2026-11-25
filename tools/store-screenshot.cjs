// Arma la captura «antes / después» para la Chrome Web Store (1280×800).
//   node tools/store-screenshot.cjs --antes ruta.png --despues ruta.png [--lang es|en|pt] [--out store/captura-1-es.png]
// Si falta alguna imagen, deja un recuadro de muestra en su lugar.
// Las capturas deben ser REALES (la tienda exige mostrar cómo funciona de verdad).
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const args = Object.fromEntries(process.argv.slice(2).reduce((acc, v, i, all) => {
  if (v.startsWith('--')) acc.push([v.slice(2), all[i + 1]]);
  return acc;
}, []));
const lang = args.lang || 'es';
const out = path.resolve(args.out || `store/captura-1-${lang}.png`);
const T = {
  es: { name: 'Buscar sin IA', tag: 'Google como antes: solo resultados con links.', before: 'Antes', after: 'Después', phBefore: 'Captura «antes»\n(extensión en pausa)', phAfter: 'Captura «después»\n(extensión activa)' },
  en: { name: 'Search Without AI', tag: 'Google like it used to be: just results with links.', before: 'Before', after: 'After', phBefore: '“Before” screenshot\n(extension paused)', phAfter: '“After” screenshot\n(extension on)' },
  pt: { name: 'Busca sem IA', tag: 'O Google como antes: só resultados com links.', before: 'Antes', after: 'Depois', phBefore: 'Captura “antes”\n(extensão pausada)', phAfter: 'Captura “depois”\n(extensão ativa)' }
}[lang];

const dataUri = (file) => {
  if (!file) return null;
  const ext = path.extname(file).slice(1).toLowerCase().replace('jpg', 'jpeg');
  return `data:image/${ext};base64,${fs.readFileSync(file).toString('base64')}`;
};
const icon = dataUri(path.join(__dirname, '..', 'icons', 'icon128.png'));
const panel = (src, label, cls, ph) => `
  <figure class="panel ${cls}">
    <figcaption>${label}</figcaption>
    <div class="shot">${src ? `<img src="${src}" alt="">` : `<div class="ph">${ph.replace('\n', '<br>')}</div>`}</div>
  </figure>`;

const html = `<!doctype html><html><head><meta charset="utf-8"><style>
  * { box-sizing: border-box; margin: 0; }
  body { width: 1280px; height: 800px; background: #fbf6f0; font-family: system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif; color: #2b1f17; overflow: hidden; }
  header { display: flex; align-items: center; gap: 18px; padding: 26px 40px 0; height: 108px; }
  header img { width: 64px; height: 64px; }
  h1 { font-size: 34px; letter-spacing: -.01em; }
  p { font-size: 20px; color: #6b5749; margin-top: 2px; }
  main { display: flex; gap: 40px; padding: 14px 40px 0; position: relative; }
  .panel { width: 580px; }
  .shot { position: relative; width: 580px; height: 600px; background: #fff; border: 1px solid #e8d8c7; border-radius: 16px; overflow: hidden; box-shadow: 0 6px 24px rgba(60,35,20,.10); }
  .shot img { width: 100%; height: 100%; object-fit: cover; object-position: top left; display: block; }
  figcaption { display: inline-block; margin: 0 0 10px 4px; font-weight: 700; font-size: 18px; padding: 5px 16px; border-radius: 999px; }
  .before figcaption { background: #5b4b40; color: #fff; }
  .after figcaption { background: #c4622d; color: #fff; }
  .after .shot { border: 3px solid #c4622d; }
  .ph { height: 100%; display: grid; place-items: center; text-align: center; font-size: 22px; color: #9a8676; border: 3px dashed #e3cdb8; border-radius: 16px; line-height: 1.5; }
  .arrow { position: absolute; left: 50%; top: calc(50% + 24px); transform: translate(-50%, -50%); width: 56px; height: 56px; border-radius: 50%; background: #c4622d; color: #fff; display: grid; place-items: center; font-size: 30px; box-shadow: 0 4px 14px rgba(196,98,45,.35); z-index: 3; }
</style></head><body>
  <header><img src="${icon}" alt=""><div><h1>${T.name}</h1><p>${T.tag}</p></div></header>
  <main>
    ${panel(dataUri(args.antes), T.before, 'before', T.phBefore)}
    <div class="arrow" aria-hidden="true">→</div>
    ${panel(dataUri(args.despues), T.after, 'after', T.phAfter)}
  </main>
</body></html>`;

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 });
  await page.setContent(html);
  await page.waitForTimeout(200);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  await page.screenshot({ path: out, type: 'png' });
  await browser.close();
  console.log('Listo:', path.relative(process.cwd(), out));
})();
