/* AntiResumen IA · Popup */
(async function () {
  'use strict';
  const CFG = globalThis.ARI_CONFIG;
  const U = globalThis.ARI;
  const $ = (id) => document.getElementById(id);
  const fmt = new Intl.NumberFormat(U.t('langCode'));

  let state = await U.loadState();
  let stats = await U.loadStats();

  function renderSettings() {
    for (const input of document.querySelectorAll('input[data-setting]')) {
      input.checked = state.settings[input.dataset.setting] === true;
    }
    const on = state.settings.enabled;
    document.body.classList.toggle('paused', !on);
    $('masterState').textContent = U.t(on ? 'masterOnDesc' : 'masterOffDesc');
  }

  function renderStats() {
    $('total').textContent = fmt.format(stats.total);
    const show = stats.total >= CFG.DONATION_PROMPT_THRESHOLD && !state.donationPromptDismissed;
    $('donatePrompt').hidden = !show;
    if (show) $('donateTitle').textContent = U.t('donatePromptTitle', [fmt.format(CFG.DONATION_PROMPT_THRESHOLD)]);
  }

  for (const input of document.querySelectorAll('input[data-setting]')) {
    input.addEventListener('change', async () => {
      state.settings = await U.updateSettings({ [input.dataset.setting]: input.checked });
      renderSettings();
    });
  }

  $('moreOptions').addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
    window.close();
  });

  // El mensaje de donación se muestra una sola vez: "Apoyar" o "No volver a mostrar" lo cierran para siempre.
  async function dismissDonation() {
    state.donationPromptDismissed = true;
    await chrome.storage.sync.set({ donationPromptDismissed: true });
    renderStats();
  }
  $('donateSupport').addEventListener('click', () => { dismissDonation(); });
  $('donateDismiss').addEventListener('click', dismissDonation);

  chrome.storage.onChanged.addListener(async (changes, area) => {
    if (area === 'local' && changes.stats) {
      stats = U.sanitizeStats(changes.stats.newValue);
      renderStats();
    }
    if (area === 'sync') {
      state = await U.loadState();
      renderSettings();
      renderStats();
    }
  });

  renderSettings();
  renderStats();
})();
