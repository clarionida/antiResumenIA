/*
 * Buscar sin IA · Utilidades compartidas
 * Lo usan el content script, el service worker, el popup y la página de opciones.
 * Depende de src/config.js (globalThis.ARI_CONFIG).
 *
 * Almacenamiento:
 *   chrome.storage.sync  → "settings", "blockedSites", "donationPromptDismissed"
 *   chrome.storage.local → "stats" (contador local; nunca sale del navegador)
 */
(function (root) {
  'use strict';
  const CFG = root.ARI_CONFIG;

  // ---------------------------------------------------------------- fechas

  /** true si "AAAA-MM-DD" es una fecha real. */
  function isValidIsoDate(value) {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const [y, m, d] = value.split('-').map(Number);
    const date = new Date(Date.UTC(y, m - 1, d));
    return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
  }

  /** Fecha de hoy en formato AAAA-MM-DD (hora local). */
  function todayIso() {
    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  }

  /** Acepta una fecha si es real y está entre MIN_BEFORE_DATE y hoy. */
  function sanitizeBeforeDate(value) {
    if (!isValidIsoDate(value)) return CFG.DEFAULT_BEFORE_DATE;
    if (value < CFG.MIN_BEFORE_DATE) return CFG.MIN_BEFORE_DATE;
    const today = todayIso();
    return value > today ? today : value;
  }

  // -------------------------------------------------------------- dominios

  /**
   * Normaliza lo que escribe el usuario en "Mis sitios bloqueados".
   * "  HTTPS://www.Pinterest.com/pin/123?x=1 " → "pinterest.com"
   * "*.reddit.com" → "reddit.com"   ·   "ñandú.com" → "xn--and-6ma2c.com"
   * Devuelve null si no es un dominio válido.
   */
  function normalizeDomain(input) {
    if (typeof input !== 'string') return null;
    let value = input.trim().toLowerCase().replace(/\s+/g, '');
    if (!value) return null;
    value = value.replace(/^[a-z][a-z0-9+.-]*:\/\//, ''); // esquema (https://, http://...)
    value = value.replace(/^\/\//, '');
    value = value.replace(/^[^@/]*@/, '');                 // usuario:clave@
    value = value.split(/[/?#\\]/)[0];                     // ruta, query, hash
    value = value.replace(/:\d*$/, '');                    // puerto
    value = value.replace(/^\*\./, '').replace(/^\.+|\.+$/g, '');
    if (!value) return null;
    let host;
    try {
      host = new URL('http://' + value).hostname; // convierte IDN a punycode
    } catch (_) {
      return null;
    }
    host = host.replace(/^www\d*\./, '').replace(/\.$/, '');
    if (host.length > 253 || !host.includes('.')) return null;
    const labels = host.split('.');
    const labelOk = (l) => /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(l);
    if (!labels.every(labelOk)) return null;
    if (!/^(?:[a-z]{2,63}|xn--[a-z0-9-]{1,59})$/.test(labels[labels.length - 1])) return null; // TLD sin números
    return host;
  }

  /** Limpia una lista de dominios: normaliza, quita repetidos y aplica el límite. */
  function sanitizeSites(list) {
    if (!Array.isArray(list)) return [];
    const out = [];
    const seen = new Set();
    for (const item of list) {
      const d = normalizeDomain(item);
      if (d && !seen.has(d)) {
        seen.add(d);
        out.push(d);
        if (out.length >= CFG.MAX_BLOCKED_SITES) break;
      }
    }
    return out;
  }

  /** true si host es el dominio bloqueado o uno de sus subdominios. */
  function hostMatches(host, domains) {
    if (!host) return false;
    const h = host.toLowerCase().replace(/\.$/, '');
    for (const d of domains) {
      if (h === d || h.endsWith('.' + d)) return true;
    }
    return false;
  }

  // ---------------------------------------------------------- configuración

  /** Devuelve una configuración completa y válida a partir de cualquier objeto. */
  function sanitizeSettings(raw) {
    const src = raw && typeof raw === 'object' ? raw : {};
    const out = {};
    for (const [key, def] of Object.entries(CFG.DEFAULT_SETTINGS)) {
      const v = src[key];
      out[key] = typeof v === typeof def ? v : def;
    }
    out.beforeDate = sanitizeBeforeDate(out.beforeDate);
    return out;
  }

  /** Lee configuración, sitios bloqueados y estado del aviso de donación. */
  async function loadState() {
    const data = await chrome.storage.sync.get(['settings', 'blockedSites', 'donationPromptDismissed']);
    return {
      settings: sanitizeSettings(data.settings),
      blockedSites: sanitizeSites(data.blockedSites),
      donationPromptDismissed: data.donationPromptDismissed === true
    };
  }

  /** Cambia una o varias opciones y guarda. */
  async function updateSettings(patch) {
    const { settings } = await chrome.storage.sync.get('settings');
    const next = sanitizeSettings(Object.assign({}, sanitizeSettings(settings), patch));
    await chrome.storage.sync.set({ settings: next });
    return next;
  }

  async function saveBlockedSites(list) {
    const clean = sanitizeSites(list);
    await chrome.storage.sync.set({ blockedSites: clean });
    return clean;
  }

  /** Tipos de bloque activos según la configuración. */
  function enabledTypes(settings, blockedSites) {
    const set = new Set();
    if (!settings.enabled) return set;
    for (const type of CFG.BLOCK_TYPES) {
      const key = CFG.TYPE_SETTING[type];
      if (key ? settings[key] === true : blockedSites.length > 0) set.add(type);
    }
    return set;
  }

  // -------------------------------------------------------------- contador

  function emptyStats() {
    const byType = {};
    for (const t of CFG.BLOCK_TYPES) byType[t] = 0;
    return { total: 0, byType };
  }

  function sanitizeStats(raw) {
    const out = emptyStats();
    if (!raw || typeof raw !== 'object') return out;
    const num = (v) => (Number.isSafeInteger(v) && v > 0 ? v : 0);
    for (const t of CFG.BLOCK_TYPES) out.byType[t] = num(raw.byType && raw.byType[t]);
    out.total = num(raw.total);
    return out;
  }

  async function loadStats() {
    const { stats } = await chrome.storage.local.get('stats');
    return sanitizeStats(stats);
  }

  // -------------------------------------------------------------- textos

  /** Normaliza un texto para compararlo con las etiquetas de DETECTION. */
  function normalizeLabel(text) {
    return String(text)
      .normalize('NFC')
      .toLowerCase()
      .replace(/[\s ​‎‏]+/g, ' ')
      .replace(/^[\s·•:|›»\-–—]+/, '')
      .replace(/[\s·•:|›»\-–—….]+$/, '')
      .trim();
  }

  /** chrome.i18n.getMessage con respaldo, para no mostrar huecos si falta una clave. */
  function t(key, subs) {
    try {
      return chrome.i18n.getMessage(key, subs) || key;
    } catch (_) {
      return key;
    }
  }

  root.ARI = Object.freeze({
    isValidIsoDate,
    todayIso,
    sanitizeBeforeDate,
    normalizeDomain,
    sanitizeSites,
    hostMatches,
    sanitizeSettings,
    loadState,
    updateSettings,
    saveBlockedSites,
    enabledTypes,
    emptyStats,
    sanitizeStats,
    loadStats,
    normalizeLabel,
    t
  });
})(globalThis);
