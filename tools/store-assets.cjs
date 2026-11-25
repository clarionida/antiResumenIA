// Genera las imágenes de la ficha de la Chrome Web Store en store/:
//   - icono-tienda-128.png       ícono de 128 px con el margen transparente recomendado (dibujo de 96 px)
//   - mosaico-440x280-<lang>.png  mosaico promocional pequeño
//   - captura-interfaz-<lang>.png captura real del popup y de la página de opciones (1280×800)
//   node tools/store-assets.cjs
const { chromium } = require('playwright');
const fs = require('fs');
const os = require('os');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'store');
const svg = fs.readFileSync(path.join(ROOT, 'icons', 'icon.svg'), 'utf8');
const b64 = (file) => 'data:image/png;base64,' + fs.readFileSync(file).toString('base64');

const T = {
  es: { name: 'Buscar sin IA', tag: 'Google como antes: solo resultados con links.', free: 'Gratis · Sin rastreo · Sin cuentas', ui: 'Tú eliges qué ocultar. Los cambios se aplican al instante.' },
  en: { name: 'Search Without AI', tag: 'Google like it used to be: just results with links.', free: 'Free · No tracking · No accounts', ui: 'You choose what to hide. Changes apply instantly.' }
};

async function shoot(browser, html, w, h, file, transparent) {
  const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
  await page.setContent(html);
  await page.waitForTimeout(150);
  await page.screenshot({ path: file, omitBackground: !!transparent });
  await page.close();
}

async function uiShots(lang) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'bsi-'));
  const ctx = await chromium.launchPersistentContext(dir, {
    channel: 'chromium',
    headless: true,
    env: Object.assign({}, process.env, { LANGUAGE: lang, LANG: lang === 'es' ? 'es_MX.UTF-8' : 'en_US.UTF-8' }),
    args: [`--lang=${lang}`, `--disable-extensions-except=${ROOT}`, `--load-extension=${ROOT}`]
  });
  let [sw] = ctx.serviceWorkers();
  if (!sw) sw = await ctx.waitForEvent('serviceworker');
  await new Promise((r) => setTimeout(r, 500));
  await sw.evaluate(async () => {
    await chrome.storage.local.set({ stats: { total: 1284, byType: { aiOverview: 412, aiMode: 388, ads: 297, shopping: 61, peopleAlsoAsk: 54, videos: 23, images: 18, places: 9, forums: 7, relatedSearches: 11, blockedSites: 4 } } });
    const { settings } = await chrome.storage.sync.get('settings');
    await chrome.storage.sync.set({ settings: Object.assign({}, settings, { hidePeopleAlsoAsk: true, hideShopping: true }), blockedSites: ['pinterest.com'], donationPromptDismissed: true });
  });
  const id = sw.url().split('/')[2];
  const page = await ctx.newPage();
  await page.emulateMedia({ colorScheme: 'light' });
  await page.setViewportSize({ width: 340, height: 600 });
  await page.goto(`chrome-extension://${id}/popup/popup.html`);
  await page.waitForTimeout(300);
  const popup = path.join(dir, 'popup.png');
  await (await page.$('main')).screenshot({ path: popup });
  await page.setViewportSize({ width: 820, height: 1000 });
  await page.goto(`chrome-extension://${id}/options/options.html`);
  await page.waitForTimeout(300);
  const options = path.join(dir, 'options.png');
  await page.screenshot({ path: options, clip: { x: 0, y: 0, width: 820, height: 1000 } });
  await ctx.close();
  return { popup, options };
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();

  // Ícono de tienda: 128×128 con 16 px de margen transparente (recomendación de Google).
  await shoot(browser, `<html><body style="margin:0;background:transparent">
    <div style="width:128px;height:128px;display:grid;place-items:center">${svg.replace('<svg ', '<svg style="display:block;width:96px;height:96px" ')}</div></body></html>`,
  128, 128, path.join(OUT, 'icono-tienda-128.png'), true);

  for (const lang of ['es', 'en']) {
    const t = T[lang];
    // Mosaico promocional pequeño 440×280.
    await shoot(browser, `<html><body style="margin:0;width:440px;height:280px;background:#fbf6f0;font-family:system-ui,-apple-system,'Segoe UI',Roboto,Arial,sans-serif;color:#2b1f17;display:flex;align-items:center;gap:22px;padding:0 30px;box-sizing:border-box;overflow:hidden">
      ${svg.replace('<svg ', '<svg style="display:block;width:118px;height:118px;flex:none" ')}
      <div><div style="font-size:34px;font-weight:800;letter-spacing:-.01em;line-height:1.05">${t.name}</div>
      <div style="font-size:16px;color:#6b5749;margin-top:8px;line-height:1.3">${t.tag}</div>
      <div style="font-size:13px;color:#a8461b;font-weight:700;margin-top:12px">${t.free}</div></div></body></html>`,
    440, 280, path.join(OUT, `mosaico-440x280-${lang}.png`));

    // Captura de la interfaz 1280×800.
    const { popup, options } = await uiShots(lang);
    await shoot(browser, `<html><body style="margin:0;width:1280px;height:800px;background:#fbf6f0;font-family:system-ui,-apple-system,'Segoe UI',Roboto,Arial,sans-serif;color:#2b1f17;overflow:hidden">
      <header style="display:flex;align-items:center;gap:18px;padding:26px 40px 0;height:108px;box-sizing:border-box">
        ${svg.replace('<svg ', '<svg style="display:block;width:64px;height:64px" ')}
        <div><div style="font-size:34px;font-weight:800">${t.name}</div><div style="font-size:20px;color:#6b5749;margin-top:2px">${t.ui}</div></div>
      </header>
      <div style="position:relative;padding:14px 40px">
        <div style="position:absolute;left:40px;top:14px;width:820px;height:640px;border-radius:16px;overflow:hidden;border:1px solid #e8d8c7;box-shadow:0 6px 24px rgba(60,35,20,.10);background:#fbf6f0">
          <img src="${b64(options)}" style="display:block;width:820px">
        </div>
        <div style="position:absolute;left:880px;top:14px;width:342px;border-radius:16px;overflow:hidden;border:1px solid #e8d8c7;box-shadow:0 10px 30px rgba(60,35,20,.18);background:#fbf6f0">
          <img src="${b64(popup)}" style="display:block;width:340px">
        </div>
      </div></body></html>`,
    1280, 800, path.join(OUT, `captura-interfaz-${lang}.png`));
  }
  await browser.close();
  console.log('Listo: imágenes en store/');
})().catch((e) => { console.error(e); process.exit(1); });
