/*
 * AntiResumen IA · Service worker
 *
 * Tareas:
 *   1. Inicializar la configuración la primera vez (sin abrir pestañas ni mostrar nada).
 *   2. Mantener las reglas de declarativeNetRequest de los modos avanzados al día.
 *   3. Sumar el contador local de elementos ocultados (chrome.storage.local).
 *
 * Por qué cada permiso (manifest.json no admite comentarios de forma segura en la
 * Chrome Web Store, así que la justificación vive aquí y en docs/PERMISOS.md):
 *   - "storage": guardar tus opciones (sync) y el contador local (local).
 *   - "declarativeNetRequestWithHostAccess": solo para "Solo Web" y "Antes de la IA".
 *     Agrega parámetros a la URL de búsqueda. Es la variante más restringida del
 *     permiso: solo actúa en los dominios de host_permissions y no muestra la
 *     advertencia de "bloquear contenido en cualquier página".
 *   - host_permissions (solo www.google.<país>): inyectar el content script y el CSS
 *     en la página de resultados, y permitir la redirección de los modos avanzados.
 *
 * Esta extensión no hace ninguna petición de red.
 */
'use strict';

importScripts('config.js', 'common.js', 'dnr-rules.js');

const CFG = self.ARI_CONFIG;
const U = self.ARI;
const DNR = self.ARI_DNR;

// Cola simple: serializa escrituras para no perder conteos entre pestañas.
let queue = Promise.resolve();
function enqueue(task) {
  queue = queue.then(task).catch((err) => console.warn('[AntiResumen IA]', err));
  return queue;
}

async function syncRules() {
  const { settings } = await U.loadState();
  const addRules = DNR.buildRules(settings);
  const existing = await chrome.declarativeNetRequest.getDynamicRules();
  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: existing.map((r) => r.id),
    addRules
  });
}

async function ensureDefaults() {
  const data = await chrome.storage.sync.get(['settings', 'blockedSites']);
  const patch = {};
  // Completa claves nuevas sin pisar lo que el usuario ya eligió.
  const clean = U.sanitizeSettings(data.settings);
  if (JSON.stringify(clean) !== JSON.stringify(data.settings)) patch.settings = clean;
  if (!Array.isArray(data.blockedSites)) patch.blockedSites = [];
  if (Object.keys(patch).length) await chrome.storage.sync.set(patch);

  const { stats } = await chrome.storage.local.get('stats');
  if (!stats) await chrome.storage.local.set({ stats: U.emptyStats() });
}

async function addStats(counts) {
  const { stats } = await chrome.storage.local.get('stats');
  const next = U.sanitizeStats(stats);
  let added = 0;
  for (const type of CFG.BLOCK_TYPES) {
    const n = counts[type];
    if (Number.isSafeInteger(n) && n > 0 && n <= 1000) {
      next.byType[type] += n;
      added += n;
    }
  }
  if (!added) return;
  next.total += added;
  await chrome.storage.local.set({ stats: next });
}

// Al instalar o actualizar: solo prepara datos. No abre pestañas ni notifica.
chrome.runtime.onInstalled.addListener(() => {
  enqueue(async () => {
    await ensureDefaults();
    await syncRules();
  });
});

chrome.runtime.onStartup.addListener(() => {
  enqueue(syncRules);
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'sync' && changes.settings) enqueue(syncRules);
});

chrome.runtime.onMessage.addListener((msg, sender) => {
  if (sender.id !== chrome.runtime.id || !msg || msg.type !== 'ari:stats') return false;
  if (msg.counts && typeof msg.counts === 'object') enqueue(() => addStats(msg.counts));
  return false;
});
