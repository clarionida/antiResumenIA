/* Buscar sin IA · Página de opciones */
(async function () {
  'use strict';
  const CFG = globalThis.ARI_CONFIG;
  const U = globalThis.ARI;
  const t = U.t;
  const $ = (id) => document.getElementById(id);
  const fmt = new Intl.NumberFormat(t('langCode'));
  const EXPORT_FORMAT = 'buscar-sin-ia-settings';

  let state = await U.loadState();
  let stats = await U.loadStats();

  // ------------------------------------------------------------ "Guardado"
  let savedTimer = 0;
  function flashSaved() {
    $('saved').textContent = t('saved');
    clearTimeout(savedTimer);
    savedTimer = setTimeout(() => { $('saved').textContent = ''; }, 1600);
  }

  function setStatus(el, text, kind) {
    el.textContent = text || '';
    el.classList.toggle('ok', kind === 'ok');
    el.classList.toggle('error', kind === 'error');
  }

  // ------------------------------------------------------------ opciones
  function renderSettings() {
    for (const input of document.querySelectorAll('input[data-setting]')) {
      input.checked = state.settings[input.dataset.setting] === true;
    }
    const date = $('beforeDate');
    if (document.activeElement !== date) date.value = state.settings.beforeDate;
    date.min = CFG.MIN_BEFORE_DATE;
    date.max = U.todayIso();
    date.disabled = !state.settings.beforeDateEnabled;
  }

  for (const input of document.querySelectorAll('input[data-setting]')) {
    input.addEventListener('change', async () => {
      state.settings = await U.updateSettings({ [input.dataset.setting]: input.checked });
      renderSettings();
      flashSaved();
    });
  }

  $('beforeDate').addEventListener('change', async (e) => {
    const value = e.target.value;
    const ok = U.isValidIsoDate(value) && value >= CFG.MIN_BEFORE_DATE && value <= U.todayIso();
    if (!ok) {
      setStatus($('dateStatus'), t('beforeDateInvalid'), 'error');
      e.target.setAttribute('aria-invalid', 'true');
      return;
    }
    e.target.removeAttribute('aria-invalid');
    setStatus($('dateStatus'), '');
    state.settings = await U.updateSettings({ beforeDate: value });
    flashSaved();
  });

  // ---------------------------------------------------------- sitios bloqueados
  function renderSites() {
    const list = $('siteList');
    list.textContent = '';
    for (const site of state.blockedSites) {
      const li = document.createElement('li');
      const name = document.createElement('span');
      name.textContent = site;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'btn subtle';
      btn.textContent = t('sitesRemove');
      btn.setAttribute('aria-label', t('sitesRemoveAria', [site]));
      btn.addEventListener('click', () => removeSite(site));
      li.append(name, btn);
      list.append(li);
    }
    const n = state.blockedSites.length;
    $('siteEmpty').hidden = n > 0;
    $('siteCount').hidden = n === 0;
    $('siteCount').textContent = t('sitesCount', [fmt.format(n)]);
  }

  $('siteForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const input = $('siteInput');
    const status = $('siteStatus');
    const domain = U.normalizeDomain(input.value);
    input.removeAttribute('aria-invalid');
    if (!domain) {
      input.setAttribute('aria-invalid', 'true');
      return setStatus(status, t('sitesInvalid'), 'error');
    }
    if (/(^|\.)google\.[a-z]{2,3}(\.[a-z]{2})?$/.test(domain)) {
      input.setAttribute('aria-invalid', 'true');
      return setStatus(status, t('sitesGoogle'), 'error');
    }
    if (state.blockedSites.includes(domain)) return setStatus(status, t('sitesDuplicate', [domain]), 'error');
    if (state.blockedSites.length >= CFG.MAX_BLOCKED_SITES) {
      return setStatus(status, t('sitesLimit', [String(CFG.MAX_BLOCKED_SITES)]), 'error');
    }
    state.blockedSites = await U.saveBlockedSites([...state.blockedSites, domain]);
    input.value = '';
    setStatus(status, t('sitesAdded', [domain]), 'ok');
    renderSites();
    flashSaved();
  });

  async function removeSite(site) {
    state.blockedSites = await U.saveBlockedSites(state.blockedSites.filter((s) => s !== site));
    setStatus($('siteStatus'), t('sitesRemoved', [site]), 'ok');
    renderSites();
    $('siteInput').focus();
    flashSaved();
  }

  // ------------------------------------------------------------------ contador
  const TYPE_LABELS = {
    aiOverview: 'typeAiOverview', aiMode: 'typeAiMode', ads: 'typeAds', shopping: 'typeShopping',
    peopleAlsoAsk: 'typePeopleAlsoAsk', videos: 'typeVideos', images: 'typeImages', places: 'typePlaces', forums: 'typeForums', relatedSearches: 'typeRelatedSearches', blockedSites: 'typeBlockedSites'
  };

  function renderStats() {
    $('statTotal').textContent = fmt.format(stats.total);
    const dl = $('statTypes');
    dl.textContent = '';
    for (const type of CFG.BLOCK_TYPES) {
      const row = document.createElement('div');
      const dt = document.createElement('dt');
      dt.textContent = t(TYPE_LABELS[type]);
      const dd = document.createElement('dd');
      dd.textContent = fmt.format(stats.byType[type]);
      row.append(dt, dd);
      dl.append(row);
    }
  }

  $('resetStats').addEventListener('click', async () => {
    if (!confirm(t('statsResetConfirm'))) return;
    stats = U.emptyStats();
    await chrome.storage.local.set({ stats });
    renderStats();
  });

  // ------------------------------------------------- exportar / importar / reset
  $('exportBtn').addEventListener('click', () => {
    const data = {
      format: EXPORT_FORMAT,
      version: 1,
      exportedAt: new Date().toISOString(),
      settings: state.settings,
      blockedSites: state.blockedSites
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `buscar-sin-ia-${U.todayIso()}.json`;
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });

  $('importBtn').addEventListener('click', () => $('importFile').click());

  $('importFile').addEventListener('change', async (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!file) return;
    try {
      if (file.size > 256 * 1024) throw new Error('too big');
      const data = JSON.parse(await file.text());
      if (!data || data.format !== EXPORT_FORMAT || typeof data.settings !== 'object') throw new Error('format');
      const settings = U.sanitizeSettings(data.settings);
      const blockedSites = U.sanitizeSites(data.blockedSites);
      await chrome.storage.sync.set({ settings, blockedSites });
      state = await U.loadState();
      renderAll();
      setStatus($('dataStatus'), t('importDone'), 'ok');
    } catch (_) {
      setStatus($('dataStatus'), t('importError'), 'error');
    }
  });

  $('resetBtn').addEventListener('click', async () => {
    if (!confirm(t('resetConfirm'))) return;
    await chrome.storage.sync.set({ settings: Object.assign({}, CFG.DEFAULT_SETTINGS), blockedSites: [] });
    state = await U.loadState();
    renderAll();
    setStatus($('dataStatus'), t('resetDone'), 'ok');
  });

  // ------------------------------------------------------- reportar un problema
  // Rellena de antemano la versión de la extensión, la de Chrome y el idioma para que
  // el reporte sea útil. No se envía nada: GitHub solo recibe lo que el usuario envíe.
  (function setupReportLink() {
    const url = new URL(CFG.ISSUES_URL);
    const chromeVersion = (navigator.userAgent.match(/Chrome\/([\d.]+)/) || [])[1] || '';
    url.searchParams.set('version', chrome.runtime.getManifest().version);
    if (chromeVersion) url.searchParams.set('chrome', chromeVersion);
    url.searchParams.set('idioma', chrome.i18n.getUILanguage());
    $('reportLink').href = url.toString();
  })();

  // ------------------------------------------- cambios hechos desde el popup
  chrome.storage.onChanged.addListener(async (changes, area) => {
    if (area === 'sync') {
      state = await U.loadState();
      renderSettings();
      renderSites();
    } else if (area === 'local' && changes.stats) {
      stats = U.sanitizeStats(changes.stats.newValue);
      renderStats();
    }
  });

  function renderAll() {
    renderSettings();
    renderSites();
    renderStats();
  }
  renderAll();
})();
