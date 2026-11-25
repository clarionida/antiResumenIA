/*
 * Buscar sin IA · Content script (document_start)
 *
 * Flujo:
 *   1. Arranca un MutationObserver de inmediato (Google carga contenido por partes
 *      y con scroll infinito).
 *   2. Lee la configuración de chrome.storage.sync y hace un primer barrido.
 *   3. Cada lote de nodos nuevos se procesa en un requestAnimationFrame, que corre
 *      justo antes de pintar: lo oculto no llega a verse y el trabajo se agrupa.
 *   4. Si cambia la configuración (chrome.storage.onChanged), se deshace todo y se
 *      vuelve a aplicar al instante, sin recargar.
 *
 * Para ocultar se marca el contenedor con data-ari-hidden="<tipo>" y el CSS hace
 * display:none. Nunca se elimina nada del DOM, así "Mostrar" es inmediato.
 *
 * Todos los selectores y textos están en src/config.js (DETECTION).
 */
(() => {
  'use strict';

  if (globalThis.__ariContentLoaded) return;
  globalThis.__ariContentLoaded = true;

  // Solo en resultados (/search) y en la portada (por el botón de Modo IA).
  const path = location.pathname;
  const IS_SEARCH = path === '/search';
  // Pestañas como Shopping (udm=28), Imágenes (udm=2) o Noticias (tbm=nws).
  const PARAMS = new URLSearchParams(location.search);
  const UDM = PARAMS.get('udm');
  const IS_VERTICAL = IS_SEARCH && (PARAMS.has('tbm') || (UDM !== null && UDM !== '' && UDM !== '14'));
  if (!(IS_SEARCH || path === '/' || path === '/webhp')) return;

  const CFG = globalThis.ARI_CONFIG;
  const U = globalThis.ARI;
  const D = CFG.DETECTION;
  const ATTR = 'data-ari-hidden';
  const HIDDEN_SEL = '[' + ATTR + ']';
  const html = document.documentElement;

  const SEL = {
    roots: D.columnRoots.join(','),
    main: D.mainArea.join(','),
    side: D.sideArea.join(','),
    nav: D.navigationArea.join(','),
    ignoreInside: D.ignoreLabelsInside.join(','),
    organicExclude: D.organicTitleExclude.concat(HIDDEN_SEL).join(','),
    control: D.controlElements.join(','),
    tabWrappers: D.tabWrappers.join(','),
    boundaries: D.blockBoundaries.join(',')
  };

  // ------------------------------------------------- índice de etiquetas por texto
  /** texto normalizado → tipo */
  const LABELS = new Map();
  let maxLabelLength = 0;
  for (const [type, def] of Object.entries(D.types)) {
    for (const list of Object.values(def.labels || {})) {
      for (const text of list) {
        const norm = U.normalizeLabel(text);
        if (!LABELS.has(norm)) LABELS.set(norm, type);
        maxLabelLength = Math.max(maxLabelLength, text.length);
      }
    }
  }
  maxLabelLength = Math.min(D.maxLabelLength, maxLabelLength + 6);

  /** Selectores por aria-label para controles de solo ícono (Modo IA). */
  function ariaSelector(def) {
    const texts = new Set();
    for (const list of Object.values(def.labels || {})) list.forEach((x) => texts.add(x));
    const parts = [];
    for (const text of texts) {
      const safe = text.replace(/["\\]/g, '\\$&');
      parts.push(`:is(a,button,[role="button"],[role="link"],[role="tab"])[aria-label="${safe}" i]`);
    }
    return parts.join(',');
  }

  const TYPE_SELECTORS = {};
  for (const [type, def] of Object.entries(D.types)) {
    TYPE_SELECTORS[type] = {
      containers: (def.containers || []).join(','),
      markers: (def.markers || []).join(','),
      aria: def.matchAriaLabel ? ariaSelector(def) : ''
    };
  }

  // ------------------------------------------------------------------ estado
  const state = {
    ready: false,
    settings: Object.assign({}, CFG.DEFAULT_SETTINGS),
    blockedSites: [],
    types: new Set(),
    revealed: false,
    noticeClosed: false,
    pending: new Set(),
    rafId: 0,
    counted: new WeakSet(),     // para no contar dos veces el mismo elemento
    statsPending: Object.create(null),
    statsTimer: 0,
    notice: null,
    lastNotice: ''
  };

  // --------------------------------------------------------------- utilidades
  function qsaWithSelf(rootNode, selector) {
    if (!selector || rootNode.nodeType !== 1) return [];
    const out = rootNode.matches(selector) ? [rootNode] : [];
    for (const el of rootNode.querySelectorAll(selector)) out.push(el);
    return out;
  }

  function isGoogleHost(host) {
    return /(^|\.)google\.[a-z]{2,3}(\.[a-z]{2})?$/i.test(host);
  }

  /** Dominio real de un link de resultado (resuelve /url?q=...). */
  function linkHost(a) {
    try {
      let url = new URL(a.href, location.href);
      if (isGoogleHost(url.hostname) && url.pathname === '/url') {
        const target = url.searchParams.get('q') || url.searchParams.get('url');
        if (target) url = new URL(target);
      }
      return url.hostname.toLowerCase();
    } catch (_) {
      return '';
    }
  }

  function isExternalLink(a) {
    const host = linkHost(a);
    return !!host && !isGoogleHost(host);
  }

  function countOrganic(el) {
    let n = 0;
    for (const h3 of el.querySelectorAll(D.organicTitle)) {
      if (!h3.closest(SEL.organicExclude)) n++;
    }
    return n;
  }

  function countHeadings(el) {
    return el.querySelectorAll('h2, [role="heading"]').length;
  }

  function inArea(el, areas) {
    if (areas === 'page') return true; // la navegación ya se excluyó antes
    if (el.closest(SEL.main)) return true;
    return areas === 'all' && !!el.closest(SEL.side);
  }

  // ------------------------------------------------------- ocultar / mostrar
  function hide(el, type) {
    if (!el || el === html || el === document.body || el.nodeType !== 1) return false;
    if (el.hasAttribute(ATTR)) return false;
    if (el.parentElement && el.parentElement.closest(HIDDEN_SEL)) return false;
    // Nunca ocultar una columna entera ni algo que la contenga.
    if (el.matches(SEL.roots) || el.querySelector(SEL.roots)) return false;
    // Lo que quede adentro se absorbe en este bloque.
    for (const inner of el.querySelectorAll(HIDDEN_SEL)) inner.removeAttribute(ATTR);
    el.setAttribute(ATTR, type);
    if (!state.counted.has(el)) {
      state.counted.add(el);
      bumpStat(type);
    }
    return true;
  }

  function unhideAll() {
    for (const el of document.querySelectorAll(HIDDEN_SEL)) el.removeAttribute(ATTR);
  }

  /**
   * Sube desde una pieza del bloque hasta su contenedor: el hijo directo de una
   * columna de resultados. Se detiene antes si el padre ya incluye resultados
   * normales (a h3) que no son del bloque. Devuelve null si no encuentra una
   * columna conocida (mejor no ocultar que ocultar de más).
   */
  function findBlockRoot(start, maxInner) {
    const limit = countOrganic(start) + (maxInner || 0);
    let node = start;
    for (;;) {
      const parent = node.parentElement;
      if (!parent || parent === document.body || parent === html) return null;
      if (parent.matches(SEL.roots)) return node;
      if (parent.querySelector(SEL.roots)) return node;
      if (countOrganic(parent) > limit) return node;
      if (addsBoundary(parent, node)) return node;
      node = parent;
    }
  }

  /** true si el padre trae paginación o navegación que no está dentro del nodo actual. */
  function addsBoundary(parent, node) {
    for (const el of parent.querySelectorAll(SEL.boundaries)) {
      if (!node.contains(el)) return true;
    }
    return false;
  }

  /** Contenedor de un resultado normal (para sitios bloqueados). */
  function findResultRoot(link) {
    let node = link;
    for (;;) {
      const parent = node.parentElement;
      if (!parent || parent === document.body || parent === html) return null;
      if (parent.matches(SEL.roots) || parent.querySelector(SEL.roots)) return node;
      // Si el padre trae otro resultado que no está bloqueado, o un bloque con
      // encabezado propio (p. ej. "Otras preguntas"), nos quedamos aquí.
      let foreign = false;
      for (const h3 of parent.querySelectorAll(D.organicTitle)) {
        const a = h3.closest('a[href]');
        if (a && !U.hostMatches(linkHost(a).replace(/^www\./, ''), state.blockedSites)) {
          foreign = true;
          break;
        }
      }
      if (foreign || countHeadings(parent) > countHeadings(node)) return node;
      node = parent;
    }
  }

  /** Botón, link o pestaña más cercano (estrategia "control"). */
  function findControl(start) {
    const control = start.closest(SEL.control);
    if (!control) return null;
    if (control.matches('a[href]') && isExternalLink(control)) return null;
    if ((control.textContent || '').trim().length > D.maxControlTextLength) return null;
    // Si es una pestaña dentro de un contenedor que solo la tiene a ella, ocultar el contenedor.
    const wrapper = control.parentElement && control.parentElement.closest(SEL.tabWrappers);
    if (wrapper && wrapper.contains(control)) {
      let depth = 0;
      for (let p = control.parentElement; p && p !== wrapper; p = p.parentElement) depth++;
      const controls = wrapper.querySelectorAll('a[href], button, [role="button"]').length;
      if (depth <= 3 && controls <= 1 && !wrapper.matches(SEL.roots)) return wrapper;
    }
    return control;
  }

  // ---------------------------------------------------------------- detección
  function handleLabel(textNode, type) {
    const el = textNode.parentElement;
    if (!el || el.closest(HIDDEN_SEL)) return;
    // Títulos y URLs de resultados normales no son etiquetas de bloque.
    if (el.closest('h3') && el.closest('a[href]')) return;
    if (el.closest('cite')) return;
    const link = el.closest('a[href]');
    if (link && isExternalLink(link)) return;

    const def = D.types[type];
    if (def.strategy === 'control') {
      const control = findControl(el);
      if (control) hide(control, type);
      return;
    }
    if (el.closest(SEL.nav)) return;
    if (SEL.ignoreInside && el.closest(SEL.ignoreInside)) return;
    if (!inArea(el, def.areas)) return;
    const block = findBlockRoot(el, def.maxInnerResults);
    if (block) hideBlock(block, type);
  }

  /** Tipo de la primera etiqueta conocida dentro de un bloque (en orden del documento). */
  function firstLabelType(block) {
    const walker = document.createTreeWalker(block, NodeFilter.SHOW_TEXT);
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      const text = n.nodeValue;
      if (!text || text.length > maxLabelLength) continue;
      const type = LABELS.get(U.normalizeLabel(text));
      if (type && D.types[type].strategy === 'block') return type;
    }
    return null;
  }

  /**
   * Oculta un bloque según el tipo de su PRIMER encabezado. Ej.: una sección
   * «Imágenes» dentro del resumen de IA no oculta el resumen como «imágenes».
   * Si el tipo define "yieldsTo", solo cede ante esos tipos.
   */
  function hideBlock(block, type) {
    const first = firstLabelType(block);
    if (first && first !== type) {
      const yieldsTo = D.types[type].yieldsTo;
      if (yieldsTo && !yieldsTo.includes(first)) {
        hide(block, type);
        return;
      }
      if (state.types.has(first)) hide(block, first);
      return;
    }
    hide(block, type);
  }

  // --------------------------------------------- cuadrículas de productos sin título
  const PRICE_DEF = D.types.shopping && D.types.shopping.priceGrid;
  const PRICE_RE = PRICE_DEF ? new RegExp(PRICE_DEF.pattern) : null;

  function isPriceText(text) {
    return !!PRICE_RE && text.length <= 32 && PRICE_RE.test(text.replace(/\s+/g, ' ').trim());
  }

  function looksLikeProductGrid(block) {
    if (block.querySelectorAll('img').length < PRICE_DEF.minImages) return false;
    if (countOrganic(block) > 0) return false;
    let prices = 0;
    const walker = document.createTreeWalker(block, NodeFilter.SHOW_TEXT);
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      if (isPriceText(n.nodeValue || '') && ++prices >= PRICE_DEF.minPrices) return true;
    }
    return false;
  }

  function handlePrices(nodes) {
    const seen = new Set();
    for (const node of nodes) {
      const el = node.parentElement;
      if (!el || !el.isConnected || el.closest(HIDDEN_SEL) || el.closest(SEL.nav)) continue;
      if (el.closest('a[href] h3') || !inArea(el, 'all')) continue;
      if (SEL.ignoreInside && el.closest(SEL.ignoreInside)) continue;
      const block = findBlockRoot(el, 0);
      if (!block || seen.has(block)) continue;
      seen.add(block);
      if (looksLikeProductGrid(block)) hideBlock(block, 'shopping');
    }
  }

  const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEXTAREA', 'TEMPLATE', 'svg', 'SVG']);

  function scanLabels(rootNode) {
    const wantPrices = !!PRICE_RE && state.types.has('shopping');
    const prices = [];
    const check = (node) => {
      const text = node.nodeValue;
      if (!text || text.length > maxLabelLength) return;
      const type = LABELS.get(U.normalizeLabel(text));
      if (type && state.types.has(type)) handleLabel(node, type);
      else if (wantPrices && isPriceText(text)) prices.push(node);
    };
    if (rootNode.nodeType === 3) {
      check(rootNode);
      if (prices.length) handlePrices(prices);
      return;
    }
    const walker = document.createTreeWalker(rootNode, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        if (node.nodeType === 1) {
          if (SKIP_TAGS.has(node.tagName) || node.hasAttribute(ATTR)) return NodeFilter.FILTER_REJECT;
          return NodeFilter.FILTER_SKIP;
        }
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    const found = [];
    for (let n = walker.nextNode(); n; n = walker.nextNode()) found.push(n);
    found.forEach(check);
    if (prices.length) handlePrices(prices);
  }

  function scanSelectors(rootNode) {
    for (const type of state.types) {
      const def = D.types[type];
      const sels = TYPE_SELECTORS[type];
      if (!def || !sels) continue;

      if (sels.containers) {
        for (let el of qsaWithSelf(rootNode, sels.containers)) {
          // Sube al contenedor más externo del mismo tipo (#tads sobre data-text-ad).
          for (let p = el.parentElement && el.parentElement.closest(sels.containers); p;
            p = p.parentElement && p.parentElement.closest(sels.containers)) el = p;
          if ((el.textContent || '').trim().length === 0 && !el.querySelector('img, video')) continue;
          hide(el, type);
        }
      }

      const markerSel = [sels.markers, sels.aria].filter(Boolean).join(',');
      if (markerSel) {
        for (const el of qsaWithSelf(rootNode, markerSel)) {
          if (el.closest(HIDDEN_SEL)) continue;
          if (def.strategy === 'control') {
            const control = findControl(el);
            if (control) hide(control, type);
          } else if (inArea(el, def.areas) && !el.closest(SEL.nav)) {
            const block = findBlockRoot(el, def.maxInnerResults);
            if (block) hideBlock(block, type);
          }
        }
      }
    }
  }

  function scanBlockedSites(rootNode) {
    if (!state.types.has('blockedSites') || rootNode.nodeType !== 1) return;
    const titles = qsaWithSelf(rootNode, D.organicTitle);
    // El nodo nuevo puede ser un h3 suelto dentro de un link ya existente.
    if (rootNode.matches('h3') && rootNode.closest('a[href]')) titles.push(rootNode);
    for (const h3 of titles) {
      const link = h3.closest('a[href]');
      if (!link || link.closest(HIDDEN_SEL) || link.closest(SEL.nav)) continue;
      if (!inArea(link, 'all')) continue;
      const host = linkHost(link).replace(/^www\./, '');
      if (!U.hostMatches(host, state.blockedSites)) continue;
      const box = findResultRoot(link);
      if (box) hide(box, 'blockedSites');
    }
  }

  function scanNode(rootNode) {
    scanSelectors(rootNode);
    scanLabels(rootNode);
    scanBlockedSites(rootNode);
  }

  // ------------------------------------------------- MutationObserver agrupado
  function schedule() {
    if (!state.rafId) state.rafId = requestAnimationFrame(processPending);
  }

  function processPending() {
    state.rafId = 0;
    if (!state.ready || !state.settings.enabled || state.types.size === 0) {
      state.pending.clear();
      return;
    }
    const nodes = state.pending;
    state.pending = new Set();
    for (const node of nodes) {
      if (!node.isConnected) continue;
      // Si un ancestro también está en la lista, ese barrido ya lo cubre.
      let covered = false;
      for (let p = node.parentNode; p; p = p.parentNode) {
        if (nodes.has(p)) { covered = true; break; }
      }
      if (covered) continue;
      const el = node.nodeType === 1 ? node : node.parentElement;
      if (el && el.closest(HIDDEN_SEL)) continue;
      scanNode(node);
    }
    updateNotice();
  }

  const observer = new MutationObserver((records) => {
    if (state.ready && (!state.settings.enabled || state.types.size === 0)) return;
    for (const record of records) {
      for (const node of record.addedNodes) {
        if (node === state.notice) continue;
        if (node.nodeType === 1) state.pending.add(node);
        else if (node.nodeType === 3 && node.parentElement) state.pending.add(node.parentElement);
      }
    }
    if (state.pending.size) schedule();
  });
  observer.observe(html, { childList: true, subtree: true });

  // ------------------------------------------------------- aplicar configuración
  function apply() {
    state.types = U.enabledTypes(state.settings, state.blockedSites);
    if (IS_VERTICAL) {
      for (const t of Array.from(state.types)) if (!D.typesOnVerticals.includes(t)) state.types.delete(t);
    }
    html.setAttribute('data-ari-hide', Array.from(state.types).join(' '));
    html.setAttribute('data-ari-ready', '');
    unhideAll();
    state.pending.clear();
    if (!state.settings.enabled) setReveal(false);
    if (state.types.size) scanNode(html);
    updateNotice();
  }

  async function loadAndApply() {
    try {
      const st = await U.loadState();
      state.settings = st.settings;
      state.blockedSites = st.blockedSites;
    } catch (_) {
      // Si no se puede leer (p. ej. extensión recién actualizada), quedan los predeterminados.
    }
    state.ready = true;
    apply();
  }

  try {
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area === 'sync' && (changes.settings || changes.blockedSites)) loadAndApply();
    });
  } catch (_) { /* contexto invalidado */ }

  // ------------------------------------------------------------------ contador
  function bumpStat(type) {
    state.statsPending[type] = (state.statsPending[type] || 0) + 1;
    if (!state.statsTimer) state.statsTimer = setTimeout(flushStats, 2000);
  }

  function flushStats() {
    clearTimeout(state.statsTimer);
    state.statsTimer = 0;
    const counts = state.statsPending;
    state.statsPending = Object.create(null);
    if (!Object.keys(counts).length) return;
    try {
      const p = chrome.runtime.sendMessage({ type: 'ari:stats', counts });
      if (p && p.catch) p.catch(() => {});
    } catch (_) { /* extensión recargada: se pierde este lote, no pasa nada */ }
  }

  addEventListener('pagehide', flushStats);

  // ------------------------------------------------------------ aviso en página
  function setReveal(on) {
    state.revealed = !!on;
    if (state.revealed) html.setAttribute('data-ari-reveal', '');
    else html.removeAttribute('data-ari-reveal');
  }

  function pageIsDark() {
    try {
      const bg = getComputedStyle(document.body).backgroundColor;
      const m = bg.match(/\d+(\.\d+)?/g);
      if (m && m.length >= 3 && (m.length < 4 || Number(m[3]) > 0)) {
        const [r, g, b] = m.map(Number);
        return 0.2126 * r + 0.7152 * g + 0.0722 * b < 128;
      }
    } catch (_) { /* sin body todavía */ }
    return matchMedia('(prefers-color-scheme: dark)').matches;
  }

  const NOTICE_CSS = `
    :host { all: initial; position: fixed; left: 16px; bottom: 16px; z-index: 2147483000; }
    .pill {
      --bg: #fffaf4; --fg: #3b2a20; --muted: #7a6455; --line: #ead9c8; --accent: #a8461b; --focus: #c4622d;
      display: flex; align-items: center; gap: 6px; max-width: calc(100vw - 32px);
      font: 13px/1.3 system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif;
      color: var(--fg); background: var(--bg); border: 1px solid var(--line);
      border-radius: 999px; padding: 5px 6px 5px 12px; box-shadow: 0 2px 10px rgba(60, 35, 20, .14);
    }
    .pill.dark { --bg: #2a221d; --fg: #f4ebe3; --muted: #c2b2a5; --line: #4a3b31; --accent: #f2a774; --focus: #f2a774; }
    .msg { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .sep { color: var(--muted); }
    button {
      font: inherit; color: var(--accent); background: transparent; border: 0; cursor: pointer;
      padding: 3px 6px; border-radius: 999px; font-weight: 600;
    }
    button:hover { text-decoration: underline; }
    button:focus-visible { outline: 2px solid var(--focus); outline-offset: 1px; }
    .close { color: var(--muted); font-weight: 400; font-size: 16px; line-height: 1; padding: 2px 7px; }
    @media (prefers-reduced-motion: no-preference) { .pill { animation: in .18s ease-out; } }
    @keyframes in { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
    @media print { :host { display: none; } }
  `;

  function buildNotice() {
    const host = document.createElement('div');
    host.setAttribute('data-ari-notice', '');
    const shadow = host.attachShadow({ mode: 'closed' });
    const style = document.createElement('style');
    style.textContent = NOTICE_CSS;
    const pill = document.createElement('div');
    pill.className = 'pill' + (pageIsDark() ? ' dark' : '');
    pill.setAttribute('role', 'status');
    pill.setAttribute('aria-live', 'polite');
    pill.setAttribute('aria-label', U.t('noticeRegion'));
    const msg = document.createElement('span');
    msg.className = 'msg';
    const sep = document.createElement('span');
    sep.className = 'sep';
    sep.setAttribute('aria-hidden', 'true');
    sep.textContent = '·';
    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'toggle';
    toggle.addEventListener('click', () => {
      setReveal(!state.revealed);
      updateNotice(true);
    });
    const close = document.createElement('button');
    close.type = 'button';
    close.className = 'close';
    close.textContent = '×';
    close.setAttribute('aria-label', U.t('noticeClose'));
    close.title = U.t('noticeClose');
    close.addEventListener('click', () => {
      state.noticeClosed = true;
      updateNotice();
    });
    pill.append(msg, sep, toggle, close);
    shadow.append(style, pill);
    host._ari = { msg, toggle };
    return host;
  }

  function updateNotice(force) {
    const count = document.querySelectorAll(HIDDEN_SEL).length;
    const show = IS_SEARCH && state.ready && state.settings.enabled && state.settings.showPageNotice &&
      !state.noticeClosed && count > 0;

    if (!show) {
      if (state.notice) {
        state.notice.remove();
        state.notice = null;
      }
      if (count === 0 && state.revealed) setReveal(false);
      state.lastNotice = '';
      return;
    }
    if (!document.body) return;
    if (!state.notice) {
      state.notice = buildNotice();
      document.body.appendChild(state.notice);
    }
    const key = (state.revealed ? 'noticeShowing' : 'noticeHidden') + (count === 1 ? 'One' : 'Many');
    const signature = key + count;
    if (signature === state.lastNotice && !force) return;
    state.lastNotice = signature;
    const { msg, toggle } = state.notice._ari;
    msg.textContent = U.t(key, [String(count)]);
    toggle.textContent = U.t(state.revealed ? 'noticeHide' : 'noticeShow');
    toggle.setAttribute('aria-pressed', String(state.revealed));
  }

  // El aviso necesita <body>; si aún no existe, se reintenta al terminar de cargar.
  document.addEventListener('DOMContentLoaded', () => updateNotice(), { once: true });

  loadAndApply();
})();
