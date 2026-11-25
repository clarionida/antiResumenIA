// Prueba de punta a punta con la extensión real cargada en Chromium.
// Sirve páginas de resultados simuladas (tests/fixtures) en URLs reales de Google.
//   node tests/e2e.test.cjs
const { chromium } = require('playwright');
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');

const EXT = path.resolve(__dirname, '..');
const FIX = (n) => fs.readFileSync(path.join(__dirname, 'fixtures', n), 'utf8');
const SHOTS = process.env.SHOTS_DIR;

(async () => {
  const userDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ari-'));
  const context = await chromium.launchPersistentContext(userDir, {
    channel: 'chromium',
    headless: true,
    args: [`--disable-extensions-except=${EXT}`, `--load-extension=${EXT}`]
  });
  const requested = [];
  await context.route(/^https:\/\/www\.google\.[a-z.]+\/.*/, (route) => {
    const url = route.request().url();
    requested.push(url);
    const file = url.includes('google.co.uk') ? 'serp-en.html' : url.includes('google.com.ar') ? 'serp-es-2026.html' : 'serp-es.html';
    route.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body: FIX(file) });
  });

  let [sw] = context.serviceWorkers();
  if (!sw) sw = await context.waitForEvent('serviceworker');
  const extId = sw.url().split('/')[2];
  const setSync = (obj) => sw.evaluate((o) => chrome.storage.sync.set(o), obj);
  const getLocal = () => sw.evaluate(() => chrome.storage.local.get('stats'));
  await sw.evaluate(async () => { for (let i = 0; i < 50; i++) { const { settings } = await chrome.storage.sync.get('settings'); if (settings) return; await new Promise((r) => setTimeout(r, 50)); } });

  const page = await context.newPage();
  await page.goto('https://www.google.com/search?q=gatos');
  await page.waitForTimeout(700);

  const visible = (id) => page.evaluate((i) => {
    const el = document.getElementById(i);
    return !!el && el.getClientRects().length > 0 && getComputedStyle(el).display !== 'none';
  }, id);
  const hiddenType = (id) => page.evaluate((i) => {
    for (let el = document.getElementById(i); el; el = el.parentElement) if (el.hasAttribute('data-ari-hidden')) return el.getAttribute('data-ari-hidden');
    return null;
  }, id);
  const expect = async (map, label) => {
    for (const [id, want] of Object.entries(map)) {
      const v = await visible(id);
      assert.strictEqual(v, want, `${label}: #${id} debería estar ${want ? 'visible' : 'oculto'}`);
    }
  };

  // 1) Valores predeterminados
  await expect({ 'b-ai': false, 'tab-ai': false, ad1: false, ad3: false, 'b-pin': true, 'b-paa': true, 'b-org1': true,
    'b-vid': true, 'b-forum': true, 'b-shop': true, kp: true, 'b-org-videos-title': true }, 'predeterminado');
  assert.strictEqual(await hiddenType('b-ai'), 'aiOverview');
  assert.strictEqual(await page.evaluate(() => document.getElementById('tab-ai').closest('[role=listitem]').getAttribute('data-ari-hidden')), 'aiMode');
  assert.strictEqual(await page.evaluate(() => document.querySelector('button[aria-label="Modo IA"]').getAttribute('data-ari-hidden')), 'aiMode');
  assert.ok(await visible('tads') === false);
  const notice = () => page.evaluate(() => !!document.querySelector('[data-ari-notice]'));
  assert.ok(await notice(), 'aviso visible');
  if (SHOTS) await page.screenshot({ path: path.join(SHOTS, '1-default.png'), fullPage: true });

  // 2) Activar todo con la página abierta (sin recargar)
  await setSync({ settings: { enabled: true, hideAiOverview: true, hideAiMode: true, hideAds: true, hideShopping: true,
    hidePeopleAlsoAsk: true, hideVideos: true, hideForums: true, showPageNotice: true, webOnly: false, beforeDateEnabled: false, beforeDate: '2023-01-01' } });
  await page.waitForTimeout(300);
  await expect({ 'b-paa': false, 'b-vid': false, 'b-forum': false, 'b-shop': false, 'b-org1': true, kp: true,
    'b-org-videos-title': true, 'b-pin': true, 'b-org2': true }, 'todo activado');

  // 3) Sitios bloqueados con subdominios + contenido tardío
  await setSync({ blockedSites: ['pinterest.com'] });
  await page.waitForTimeout(300);
  await expect({ 'b-pin': false, 'b-pin2': false, 'b-late-pin': false, 'b-org2': true, 'b-late-org': true, 'b-org1': true }, 'bloqueados');
  assert.strictEqual(await hiddenType('b-pin2'), 'blockedSites');
  if (SHOTS) await page.screenshot({ path: path.join(SHOTS, '2-all.png'), fullPage: true });

  // 3b) Bloques de imágenes
  assert.strictEqual(await visible('b-img'), true, 'imágenes visibles con la opción apagada');
  await sw.evaluate(async () => { const { settings } = await chrome.storage.sync.get('settings'); settings.hideImages = true; await chrome.storage.sync.set({ settings }); });
  await page.waitForTimeout(300);
  assert.strictEqual(await visible('b-img'), false, 'bloque de imágenes oculto');
  assert.strictEqual(await hiddenType('b-img'), 'images');
  assert.strictEqual(await visible('kp'), true, 'la ficha de la derecha no se oculta por su sección «Imágenes»');
  assert.strictEqual(await page.evaluate(() => [...document.querySelectorAll('#hdtb a')].find((a) => a.textContent === 'Imágenes').getClientRects().length > 0), true, 'la pestaña «Imágenes» sigue visible');
  assert.strictEqual(await visible('b-org1'), true, 'resultado normal visible');
  await sw.evaluate(async () => { const { settings } = await chrome.storage.sync.get('settings'); settings.hideImages = false; await chrome.storage.sync.set({ settings }); });
  await page.waitForTimeout(300);
  assert.strictEqual(await visible('b-img'), true, 'imágenes vuelven a verse');

  // 4) "Mostrar" temporalmente
  await page.evaluate(() => document.documentElement.setAttribute('data-ari-reveal', ''));
  await expect({ 'b-ai': true, 'b-paa': true, ad1: true }, 'mostrar');
  await page.evaluate(() => document.documentElement.removeAttribute('data-ari-reveal'));

  // 5) Desactivar el aviso
  await sw.evaluate(async () => { const { settings } = await chrome.storage.sync.get('settings'); settings.showPageNotice = false; await chrome.storage.sync.set({ settings }); });
  await page.waitForTimeout(200);
  assert.ok(!(await notice()), 'aviso desactivado');

  // 6) Pausa
  await sw.evaluate(async () => { const { settings } = await chrome.storage.sync.get('settings'); settings.enabled = false; await chrome.storage.sync.set({ settings }); });
  await page.waitForTimeout(200);
  await expect({ 'b-ai': true, 'tab-ai': true, ad1: true, 'b-paa': true, 'b-pin': true }, 'pausa');
  await sw.evaluate(async () => { const { settings } = await chrome.storage.sync.get('settings'); settings.enabled = true; settings.showPageNotice = true; await chrome.storage.sync.set({ settings }); });
  await page.waitForTimeout(200);
  await expect({ 'b-ai': false, ad1: false }, 'reanudar');

  // 7) Inglés + streaming
  await setSync({ blockedSites: [] });
  const en = await context.newPage();
  await en.goto('https://www.google.co.uk/search?q=cats');
  await en.waitForTimeout(500);
  const vis = (p, id) => p.evaluate((i) => { const el = document.getElementById(i); return !!el && el.getClientRects().length > 0; }, id);
  assert.strictEqual(await vis(en, 'e-ai'), false, 'en: AI Overview');
  assert.strictEqual(await vis(en, 'e-paa'), false, 'en: PAA');
  assert.strictEqual(await vis(en, 'e-sp'), false, 'en: sponsored');
  assert.strictEqual(await vis(en, 'e-forum'), false, 'en: forums');
  assert.strictEqual(await vis(en, 'e-org'), true, 'en: organic');
  assert.strictEqual(await en.evaluate(() => document.querySelector('a[href*="udm=50"]').getClientRects().length), 0, 'en: AI Mode tab');

  // 7b) Diseño nuevo de 2026: resumen de IA a todo el ancho y «Más preguntas» con respuestas de IA escondidas
  await sw.evaluate(async () => { const { settings } = await chrome.storage.sync.get('settings'); settings.hidePeopleAlsoAsk = false; await chrome.storage.sync.set({ settings }); });
  await new Promise((r) => setTimeout(r, 200));
  const ar = await context.newPage();
  await ar.goto('https://www.google.com.ar/search?q=fotosintesis');
  await ar.waitForTimeout(400);
  assert.strictEqual(await vis(ar, 'n-ai'), false, '2026: resumen de IA a todo el ancho');
  assert.strictEqual(await vis(ar, 'n-paa'), true, '2026: «Más preguntas» visible con la opción apagada');
  assert.strictEqual(await vis(ar, 'n-org1'), true, '2026: resultado normal visible');
  assert.strictEqual(await vis(ar, 'n-org2'), true, '2026: resultado normal 2 visible');
  await sw.evaluate(async () => { const { settings } = await chrome.storage.sync.get('settings'); settings.hidePeopleAlsoAsk = true; await chrome.storage.sync.set({ settings }); });
  await ar.waitForTimeout(300);
  assert.strictEqual(await vis(ar, 'n-paa'), false, '2026: «Más preguntas» oculto con la opción activa');
  assert.strictEqual(await ar.evaluate(() => document.getElementById('n-paa').getAttribute('data-ari-hidden')), 'peopleAlsoAsk');
  assert.strictEqual(await vis(ar, 'n-org1'), true, '2026: resultado normal sigue visible');
  await sw.evaluate(async () => { const { settings } = await chrome.storage.sync.get('settings'); settings.hidePeopleAlsoAsk = false; await chrome.storage.sync.set({ settings }); });
  await ar.waitForTimeout(300);
  assert.strictEqual(await vis(ar, 'n-paa'), true, '2026: «Más preguntas» vuelve a verse');
  assert.strictEqual(await vis(ar, 'n-related'), true, '2026: «También se buscó» visible con la opción apagada');
  // Resumen de IA visible + imágenes ocultas: la sección «Imágenes» dentro del resumen no se lo lleva.
  await sw.evaluate(async () => { const { settings } = await chrome.storage.sync.get('settings'); settings.hideAiOverview = false; settings.hideImages = true; await chrome.storage.sync.set({ settings }); });
  await ar.waitForTimeout(300);
  assert.strictEqual(await vis(ar, 'n-ai'), true, 'resumen de IA visible aunque tenga una sección «Imágenes»');
  await sw.evaluate(async () => { const { settings } = await chrome.storage.sync.get('settings'); settings.hideAiOverview = true; settings.hideImages = false; await chrome.storage.sync.set({ settings }); });
  await ar.waitForTimeout(300);
  assert.strictEqual(await vis(ar, 'n-ai'), false, 'resumen de IA oculto otra vez');

  // 7c) «También se buscó»
  await sw.evaluate(async () => { const { settings } = await chrome.storage.sync.get('settings'); settings.hideRelatedSearches = true; await chrome.storage.sync.set({ settings }); });
  await ar.waitForTimeout(300);
  assert.strictEqual(await vis(ar, 'n-related'), false, '«También se buscó» oculto');
  assert.strictEqual(await vis(ar, 'n-next'), true, 'la paginación «Siguiente» sigue visible');
  assert.strictEqual(await vis(ar, 'n-inline'), false, '«La gente también busca» dentro del resultado oculto');
  assert.strictEqual(await vis(ar, 'n-org2-title'), true, 'el resultado con sugerencias sigue visible');
  assert.strictEqual(await visible('b-related'), false, '«También se buscó» oculto en la otra página');
  assert.strictEqual(await ar.evaluate(() => document.getElementById('n-related').getAttribute('data-ari-hidden')), 'relatedSearches');
  await sw.evaluate(async () => { const { settings } = await chrome.storage.sync.get('settings'); settings.hideRelatedSearches = false; await chrome.storage.sync.set({ settings }); });
  await ar.waitForTimeout(300);
  assert.strictEqual(await vis(ar, 'n-related'), true, '«También se buscó» vuelve a verse');

  // 8) Contador local
  await page.evaluate(() => window.dispatchEvent(new Event('pagehide')));
  await page.waitForTimeout(2500);
  const { stats } = await getLocal();
  assert.ok(stats.total > 0 && stats.byType.aiOverview >= 1 && stats.byType.blockedSites >= 2, 'contador: ' + JSON.stringify(stats));

  // 9) Solo Web (declarativeNetRequest)
  await sw.evaluate(async () => { const { settings } = await chrome.storage.sync.get('settings'); settings.webOnly = true; await chrome.storage.sync.set({ settings }); });
  await page.waitForTimeout(400);
  const rules = await sw.evaluate(() => chrome.declarativeNetRequest.getDynamicRules());
  assert.ok(rules.length >= 4, 'reglas dinámicas creadas');
  requested.length = 0;
  await page.goto('https://www.google.com.mx/search?q=tacos');
  const finalUrl = page.url();
  console.log('   Solo Web →', finalUrl);
  await page.goto('https://www.google.com.mx/search?q=tacos&udm=2');
  console.log('   Imágenes →', page.url());
  await sw.evaluate(async () => { const { settings } = await chrome.storage.sync.get('settings'); settings.webOnly = false; await chrome.storage.sync.set({ settings }); });
  await page.waitForTimeout(300);
  assert.strictEqual((await sw.evaluate(() => chrome.declarativeNetRequest.getDynamicRules())).length, 0, 'reglas eliminadas');

  // 10) Popup y opciones cargan sin errores
  const errors = [];
  for (const p of ['popup/popup.html', 'options/options.html']) {
    const ui = await context.newPage();
    ui.on('pageerror', (e) => errors.push(p + ': ' + e.message));
    await ui.goto(`chrome-extension://${extId}/${p}`);
    await ui.waitForTimeout(300);
    if (p.startsWith('options')) {
      const href = await ui.getAttribute('#reportLink', 'href');
      assert.ok(href.startsWith('https://github.com/clarionida/antiResumenIA/issues/new?template=problema.yml') && href.includes('version=' + require('../manifest.json').version), 'link de reportes: ' + href);
    }
    if (SHOTS) {
      await ui.setViewportSize(p.startsWith('popup') ? { width: 340, height: 520 } : { width: 900, height: 1400 });
      await ui.screenshot({ path: path.join(SHOTS, p.split('/')[0] + '.png'), fullPage: true });
    }
  }
  assert.deepStrictEqual(errors, []);

  console.log('E2E: todas las pruebas pasaron', JSON.stringify(stats));
  await context.close();
})().catch((e) => { console.error(e); process.exit(1); });
