/* AntiResumen IA · Traduce el HTML del popup y de opciones con chrome.i18n.
   data-i18n="clave"            → textContent
   data-i18n-aria-label="clave" → aria-label
   data-i18n-title="clave"      → title
   data-i18n-placeholder="clave"→ placeholder */
(function () {
  'use strict';
  const t = globalThis.ARI.t;
  document.documentElement.lang = t('langCode');
  for (const el of document.querySelectorAll('[data-i18n]')) el.textContent = t(el.dataset.i18n);
  for (const [attr, data] of [['aria-label', 'i18nAriaLabel'], ['title', 'i18nTitle'], ['placeholder', 'i18nPlaceholder']]) {
    for (const el of document.querySelectorAll(`[data-${'i18n-' + attr}]`)) el.setAttribute(attr, t(el.dataset[data]));
  }
  // Enlaces de donación: la URL vive solo en src/config.js (DONATION_URL).
  for (const a of document.querySelectorAll('a[data-donate]')) {
    a.href = globalThis.ARI_CONFIG.DONATION_URL;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
  }
})();
