// Buscar sin IA · Diagnóstico de la página de resultados de Google
// -----------------------------------------------------------------
// Uso: en la pestaña de Google con el problema, abre la consola de DevTools
// (Mac: Cmd+Opción+J · Windows: Ctrl+Mayús+J), pega este código y pulsa Enter.
// Si Chrome pide escribir «allow pasting» (o «permitir pegar»), escríbelo y vuelve a pegar.
// El resultado se copia al portapapeles: pégalo en el reporte o en el chat.
// Solo LEE la página: no cambia nada ni envía nada. Incluye la URL (tu búsqueda).
(() => {
  const ATTRS = ['role', 'jsname', 'jscontroller', 'jsaction', 'data-attrid', 'data-hveid', 'aria-level',
    'aria-label', 'data-ari-hidden', 'data-q', 'data-initq', 'data-subtree', 'data-mcpr', 'data-async-type', 'href'];
  const desc = (el) => {
    if (!el || el.nodeType !== 1) return String(el);
    let s = el.tagName.toLowerCase();
    if (el.id) s += '#' + el.id;
    for (const a of ATTRS) if (el.hasAttribute(a)) s += `[${a}="${(el.getAttribute(a) || '').slice(0, 40)}"]`;
    if (typeof el.className === 'string' && el.className.trim()) s += '.' + el.className.trim().split(/\s+/).slice(0, 3).join('.');
    if (el.shadowRoot) s += ' (shadowRoot)';
    return s;
  };
  const chain = (el, max = 40) => {
    const out = [];
    for (let e = el; e && e !== document.documentElement && out.length < max; e = e.parentElement || (e.getRootNode && e.getRootNode().host)) {
      out.push(`${desc(e)} {hijos:${e.childElementCount}, a_h3:${e.querySelectorAll('a[href] h3').length}}`);
    }
    return out;
  };
  const RE = /^(visi[oó]n general creada (por|con) ia|resumen de ia|vista creada con ia|ai overview|m[aá]s preguntas|otras preguntas de los usuarios|people also ask|modo ia|ai mode|patrocinado|sponsored)$/i;
  const texts = [];
  const walk = (root) => {
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
    for (let n = w.nextNode(); n; n = w.nextNode()) {
      if (n.nodeType === 1) { if (n.shadowRoot) walk(n.shadowRoot); continue; }
      const t = n.nodeValue.replace(/\s+/g, ' ').trim();
      if (t.length < 60 && RE.test(t)) texts.push({ texto: t, cadena: chain(n.parentElement) });
    }
  };
  walk(document.body);
  const report = {
    url: location.href,
    chrome: (navigator.userAgent.match(/Chrome\/[\d.]+/) || [''])[0],
    html: [...document.documentElement.attributes].map((a) => `${a.name}=${a.value.slice(0, 80)}`),
    columnas: ['#rcnt', '#center_col', '#res', '#search', '#rso', '#botstuff', '#rhs', '#taw', '#tvcap', '#cnt', '#main', '#appbar']
      .map((s) => `${s}:${document.querySelector(s) ? 'sí' : 'no'}`),
    iframes: [...document.querySelectorAll('iframe')].slice(0, 10).map(desc),
    ocultos: [...document.querySelectorAll('[data-ari-hidden]')].map((e) => ({
      tipo: e.getAttribute('data-ari-hidden'), el: desc(e), texto: (e.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 100), cadena: chain(e, 12)
    })),
    etiquetas: texts,
    udm50: [...document.querySelectorAll('a[href*="udm=50"]')].slice(0, 15).map((a) => ({
      el: desc(a), texto: (a.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 80), cadena: chain(a, 8)
    }))
  };
  const json = JSON.stringify(report, null, 1);
  try { copy(json); console.log('✅ Diagnóstico copiado al portapapeles (' + json.length + ' caracteres). Pégalo en el chat o en el reporte.'); }
  catch (_) { console.log(json); }
})();
