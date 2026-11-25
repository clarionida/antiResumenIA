/*
 * AntiResumen IA · Reglas de declarativeNetRequest (modos avanzados)
 * ==================================================================
 *
 * Se usan reglas DINÁMICAS (no un ruleset estático en JSON) porque la fecha del
 * filtro "Solo contenido anterior a la IA" la elige el usuario, y porque los dos
 * modos se combinan entre sí. Las reglas se recalculan en el service worker cada
 * vez que cambia la configuración.
 *
 * Qué hacen:
 *   - "Solo Web": agrega udm=14 a las búsquedas web de Google.
 *   - "Antes de la IA": agrega tbs=cdr:1,cd_max:M/D/AAAA (rango de fechas de Google).
 *
 * Cómo se evitan los bucles de redirección:
 *   Cada redirección produce una URL que cumple una regla "allow" de MAYOR prioridad,
 *   así que la segunda vuelta ya no se redirige. En declarativeNetRequest gana la regla
 *   de mayor prioridad; "allow" impide que se apliquen las de prioridad menor.
 *
 * Qué NO se toca (regla allow de prioridad máxima):
 *   - Verticales con tbm= (isch, nws, vid, shop, bks...).
 *   - Verticales con udm= distinto de 14 (2 Imágenes, 7 Videos, 28 Shopping, 50 Modo IA...).
 *   - Empleos, vuelos y similares (ibp=).
 *   - Maps, Noticias de news.google.com, etc. no pasan por /search de www.google.*.
 *
 * Nota de sintaxis: regexFilter usa RE2 (sin lookahead). Por eso "no contiene X"
 * se expresa con reglas allow en vez de con expresiones negativas.
 */
(function (root) {
  'use strict';

  // https://www.google.<tld>/search?  (com, es, com.mx, co.uk, com.br, ...)
  const BASE = '^https://www\\.google\\.[a-z]{2,3}(?:\\.[a-z]{2})?/search\\?';
  // Inicio de un parámetro: justo después de "?" o de un "&" posterior.
  const PARAM = '(?:[^#]*&)?';
  const END = '(?:&|#|$)';

  const RX = Object.freeze({
    base: BASE,
    verticalTbm: BASE + PARAM + 'tbm=',
    verticalIbp: BASE + PARAM + 'ibp=',
    // udm con un valor distinto de exactamente "14".
    verticalUdm: BASE + PARAM + 'udm=(?:[^1&#]|1(?:[^4]|$)|14[^&#])',
    hasUdm14: BASE + PARAM + 'udm=14' + END,
    hasTbs: BASE + PARAM + 'tbs=',
    hasBoth: BASE + PARAM + '(?:udm=14(?:&' + PARAM + 'tbs=)|tbs=[^#]*&udm=14' + END + ')'
  });

  const ID = Object.freeze({
    allowTbm: 1, allowUdm: 2, allowIbp: 3, allowDone: 10,
    redirectTbsOnly: 20, redirectUdmOnly: 21, redirectBoth: 22, redirectUdm: 23, redirectTbs: 24
  });

  const TOP = 100;   // allow de verticales
  const DONE = 50;   // allow "ya tiene lo que necesita"

  /** "2023-01-01" → "12/31/2022" (cd_max es inclusivo y Google espera M/D/AAAA). */
  function cdMaxFromIso(iso) {
    const [y, m, d] = iso.split('-').map(Number);
    const date = new Date(Date.UTC(y, m - 1, d));
    date.setUTCDate(date.getUTCDate() - 1);
    return `${date.getUTCMonth() + 1}/${date.getUTCDate()}/${date.getUTCFullYear()}`;
  }

  function tbsValue(iso) {
    return 'cdr:1,cd_max:' + cdMaxFromIso(iso);
  }

  const MAIN_FRAME = ['main_frame'];

  function allow(id, priority, regexFilter) {
    return { id, priority, action: { type: 'allow' }, condition: { regexFilter, resourceTypes: MAIN_FRAME } };
  }

  function redirect(id, priority, regexFilter, params) {
    return {
      id,
      priority,
      action: {
        type: 'redirect',
        redirect: { transform: { queryTransform: { addOrReplaceParams: params } } }
      },
      condition: { regexFilter, resourceTypes: MAIN_FRAME }
    };
  }

  /**
   * Construye la lista de reglas dinámicas para una configuración.
   * Devuelve [] si la extensión está en pausa o si no hay modos avanzados activos.
   */
  function buildRules(settings) {
    if (!settings || !settings.enabled) return [];
    const web = settings.webOnly === true;
    const date = settings.beforeDateEnabled === true;
    if (!web && !date) return [];

    const udm = { key: 'udm', value: '14' };
    const tbs = { key: 'tbs', value: tbsValue(settings.beforeDate) };

    const rules = [
      allow(ID.allowTbm, TOP, RX.verticalTbm),
      allow(ID.allowUdm, TOP, RX.verticalUdm),
      allow(ID.allowIbp, TOP, RX.verticalIbp)
    ];

    if (web && date) {
      rules.push(
        allow(ID.allowDone, DONE, RX.hasBoth),
        // Ya tiene un rango de fechas elegido por el usuario: se respeta y solo se agrega udm=14.
        redirect(ID.redirectUdmOnly, 40, RX.hasTbs, [udm]),
        redirect(ID.redirectTbsOnly, 30, RX.hasUdm14, [tbs]),
        redirect(ID.redirectBoth, 10, RX.base, [udm, tbs])
      );
    } else if (web) {
      rules.push(
        allow(ID.allowDone, DONE, RX.hasUdm14),
        redirect(ID.redirectUdm, 10, RX.base, [udm])
      );
    } else {
      rules.push(
        allow(ID.allowDone, DONE, RX.hasTbs),
        redirect(ID.redirectTbs, 10, RX.base, [tbs])
      );
    }
    return rules;
  }

  root.ARI_DNR = Object.freeze({ buildRules, cdMaxFromIso, RX });
})(globalThis);
