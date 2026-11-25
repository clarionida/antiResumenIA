/*
 * Buscar sin IA · Archivo de configuración central
 * ==================================================
 *
 * ESTE es el archivo que hay que tocar cuando Google cambie su página.
 * Aquí viven:
 *   1. DONATION_URL y otras constantes generales.
 *   2. Los valores predeterminados de cada opción.
 *   3. TODAS las reglas de detección (selectores estables y textos por idioma).
 *
 * Reglas de oro para editar DETECTION (ver docs/SELECTORES.md):
 *   - No uses clases ofuscadas de Google (p. ej. ".MjjYud", ".hdzaWe"): cambian sin aviso.
 *   - Prefiere IDs históricos (#rso, #tads...), atributos con significado
 *     (data-text-ad, href*="udm=50") y textos visibles de los encabezados.
 *   - Los textos se comparan completos (no "contiene"), sin importar
 *     mayúsculas, espacios dobles ni signos como "·", ":" o "…" al final.
 *   - Si un selector no existe en la página, simplemente no hace nada.
 *     Si existe pero apunta a otra cosa, puede ocultar algo indebido:
 *     ante la duda, mejor un texto que un selector.
 *
 * Este archivo lo cargan: el content script, el service worker, el popup
 * y la página de opciones. No hace nada por sí solo: solo declara datos.
 */
(function (root) {
  'use strict';

  /** Enlace de donación. Cámbialo aquí y se actualiza en el popup y en opciones. */
  const DONATION_URL = 'https://donate.stripe.com/bJeeVfgHU7Npa1A59ocAo00';

  /**
   * Formulario para reportar problemas (GitHub Issues). Se abre solo cuando el usuario
   * hace clic. Usa la plantilla .github/ISSUE_TEMPLATE/problema.yml.
   */
  const ISSUES_URL = 'https://github.com/clarionida/antiResumenIA/issues/new?template=problema.yml';

  /** El mensaje amable de donación aparece UNA sola vez al llegar a este total. */
  const DONATION_PROMPT_THRESHOLD = 200;

  /** Límite de la lista de sitios bloqueados (chrome.storage.sync admite 8 KB por elemento). */
  const MAX_BLOCKED_SITES = 300;

  /** Fecha predeterminada del modo "Solo contenido anterior a la IA" (AAAA-MM-DD). */
  const DEFAULT_BEFORE_DATE = '2023-01-01';

  /** Fecha mínima aceptada en el filtro de fecha. */
  const MIN_BEFORE_DATE = '1998-09-04';

  /**
   * Valores predeterminados. Se guardan en chrome.storage.sync bajo la clave "settings".
   * Si agregas una opción nueva, agrégala aquí y en TYPE_SETTING si oculta un tipo de bloque.
   */
  const DEFAULT_SETTINGS = Object.freeze({
    enabled: true,              // Interruptor general (pausa todo).
    hideAiOverview: true,       // 1. Resúmenes de IA.
    hideAiMode: true,           // 2. Pestaña y botón de "Modo IA".
    hideAds: true,              // 3. Anuncios y resultados patrocinados.
    hideShopping: false,        // 4. Bloques de compras y productos.
    hidePeopleAlsoAsk: false,   // 5. "Otras preguntas de los usuarios".
    hideVideos: false,          // 6. Carruseles de videos y videos cortos.
    hideForums: false,          // 7. "Debates y foros".
    showPageNotice: true,       // Aviso pequeño "Se ocultaron N elementos · Mostrar".
    webOnly: false,             // 9. Modo "Solo Web" (udm=14) con declarativeNetRequest.
    beforeDateEnabled: false,   // 10. Filtro "Solo contenido anterior a la IA".
    beforeDate: DEFAULT_BEFORE_DATE
  });

  /** Tipos de bloque que se cuentan y se pueden ocultar. */
  const BLOCK_TYPES = Object.freeze([
    'aiOverview', 'aiMode', 'ads', 'shopping',
    'peopleAlsoAsk', 'videos', 'forums', 'blockedSites'
  ]);

  /** Qué opción activa cada tipo. "blockedSites" se activa si la lista no está vacía. */
  const TYPE_SETTING = Object.freeze({
    aiOverview: 'hideAiOverview',
    aiMode: 'hideAiMode',
    ads: 'hideAds',
    shopping: 'hideShopping',
    peopleAlsoAsk: 'hidePeopleAlsoAsk',
    videos: 'hideVideos',
    forums: 'hideForums',
    blockedSites: null
  });

  /**
   * DETECCIÓN
   * ---------
   * Cómo funciona (resumen; el detalle está en src/content/content.js):
   *
   *  - "containers": selectores que YA son el bloque completo. Se ocultan tal cual.
   *  - "markers":    selectores de una pieza interna del bloque. Desde ahí se
   *                  sube por el árbol hasta el contenedor del bloque.
   *  - "labels":     textos exactos de encabezados o etiquetas, por idioma.
   *                  Se busca el nodo de texto y se sube hasta el contenedor.
   *  - "strategy":   "block"   → sube hasta el hijo directo de una columna de
   *                              resultados (ver columnRoots) sin tragarse
   *                              resultados normales vecinos.
   *                  "control" → oculta el botón/link/pestaña más cercano
   *                              (se usa para "Modo IA").
   *  - "areas":      "main" = solo columna central; "all" = central + lateral.
   *  - "maxInnerResults": cuántos títulos de resultado normal (a h3) puede
   *                  contener el bloque. Los anuncios de texto traen uno.
   */
  const DETECTION = Object.freeze({
    /**
     * Columnas de resultados. Un bloque nunca se oculta por encima de su hijo
     * directo, y nunca se oculta un elemento que contenga alguna de estas.
     * Son IDs que Google mantiene desde hace muchos años.
     */
    columnRoots: [
      '#rcnt', '#center_col', '#res', '#search', '#rso', '#botstuff',
      '#taw', '#tvcap', '#atvcap', '#bres', '#rhs', '#appbar', '#extabar', '#cnt'
    ],

    /** Zona de la columna central donde pueden estar los bloques. */
    mainArea: ['#center_col', '#res', '#search', '#rso', '#botstuff', '#taw', '#bres', '#atvcap'],

    /** Columna lateral (panel de información, anuncios de compras a la derecha). */
    sideArea: ['#rhs'],

    /** Zonas de navegación: las etiquetas encontradas aquí NO se tratan como bloques. */
    navigationArea: ['#hdtb', '#top_nav', '#hdtbMenus', '[role="navigation"]', 'header', '#searchform', 'form[role="search"]'],

    /**
     * Fichas de información (knowledge panel). Un encabezado "Videos" dentro de
     * una ficha no debe ocultar la ficha entera.
     */
    ignoreLabelsInside: ['.kp-wholepage', '.kp-blk', '[data-attrid^="kc:"]'],

    /** Título de un resultado normal con link. */
    organicTitle: 'a[href] h3',

    /** Títulos que NO cuentan como resultado normal (respuestas desplegadas de "Otras preguntas"). */
    organicTitleExclude: ['.related-question-pair', '[data-initq]', '[data-q]'],

    /** Elementos de control para la estrategia "control". */
    controlElements: ['a[href]', 'button', '[role="button"]', '[role="link"]', '[role="tab"]', '[role="menuitem"]'],

    /** Contenedor de pestaña: se oculta en lugar del link si solo contiene ese link. */
    tabWrappers: ['[role="listitem"]', 'li'],

    /** Un control con más texto que esto no se oculta (evita ocultar tarjetas grandes). */
    maxControlTextLength: 40,

    /** Textos más largos que esto ni se comparan (rendimiento). */
    maxLabelLength: 60,

    types: {
      aiOverview: {
        strategy: 'block',
        areas: 'main',
        containers: [],
        markers: [],
        labels: {
          es: [
            'Resumen de IA', 'Resumen creado con IA', 'Resumen creado por IA',
            'Resumen generado por IA', 'Resumen generado con IA',
            'Vista creada con IA', 'Vista general creada por IA',
            'Visión general creada por IA', 'Descripción general creada por IA',
            'Información general de IA'
          ],
          en: ['AI Overview', 'AI Overviews', 'AI-generated overview'],
          pt: ['Visão geral criada por IA', 'Visão geral de IA', 'Visão geral gerada por IA', 'Resumo de IA']
        },
        maxInnerResults: 0
      },

      aiMode: {
        strategy: 'control',
        areas: 'all',
        // udm=50 es el parámetro de la vista "Modo IA". Es lo más estable que hay.
        containers: [],
        markers: ['a[href*="udm=50"]'],
        labels: {
          es: ['Modo IA', 'Modo de IA'],
          en: ['AI Mode'],
          pt: ['Modo IA', 'Modo de IA']
        },
        // También se buscan botones de solo ícono por su aria-label con estos mismos textos.
        matchAriaLabel: true
      },

      ads: {
        strategy: 'block',
        areas: 'all',
        // #tads (arriba), #tadsb/#bottomads (abajo) y data-text-ad (cada anuncio de texto).
        containers: ['#tads', '#tadsb', '#bottomads', '[data-text-ad]'],
        markers: [],
        labels: {
          es: ['Patrocinado', 'Patrocinados', 'Patrocinada', 'Patrocinadas', 'Resultados patrocinados', 'Anuncio', 'Anuncios'],
          en: ['Sponsored', 'Sponsored results', 'Ad', 'Ads'],
          pt: ['Patrocinado', 'Patrocinados', 'Resultados patrocinados', 'Anúncio', 'Anúncios']
        },
        maxInnerResults: 1
      },

      shopping: {
        strategy: 'block',
        areas: 'all',
        // Clases sin ofuscar que Google usa desde hace años para unidades comerciales.
        containers: ['.commercial-unit-desktop-top', '.commercial-unit-desktop-rhs', '.cu-container'],
        markers: [],
        labels: {
          es: ['Productos', 'Productos populares', 'Comprar productos', 'Más productos', 'Ofertas', 'Compras', 'Precios y tiendas'],
          en: ['Products', 'Popular products', 'Shop products', 'More products', 'Deals', 'Shopping'],
          pt: ['Produtos', 'Produtos populares', 'Comprar produtos', 'Mais produtos', 'Ofertas', 'Compras']
        },
        maxInnerResults: 0
      },

      peopleAlsoAsk: {
        strategy: 'block',
        areas: 'main',
        containers: [],
        // Piezas internas de "Otras preguntas" (nombres sin ofuscar).
        markers: ['.related-question-pair', '[data-initq]'],
        labels: {
          es: ['Otras preguntas de los usuarios', 'Más preguntas', 'Preguntas relacionadas', 'Otras preguntas'],
          en: ['People also ask', 'More questions', 'Related questions'],
          pt: ['As pessoas também perguntam', 'Mais perguntas', 'Perguntas relacionadas']
        },
        maxInnerResults: 0
      },

      videos: {
        strategy: 'block',
        areas: 'main',
        containers: [],
        markers: [],
        labels: {
          es: ['Videos', 'Vídeos', 'Videos cortos', 'Vídeos cortos', 'Shorts'],
          en: ['Videos', 'Short videos', 'Shorts'],
          pt: ['Vídeos', 'Vídeos curtos', 'Shorts']
        },
        maxInnerResults: 0
      },

      forums: {
        strategy: 'block',
        areas: 'main',
        containers: [],
        markers: [],
        labels: {
          es: ['Debates y foros', 'Foros y debates'],
          en: ['Discussions and forums', 'Forums'],
          pt: ['Discussões e fóruns', 'Fóruns e discussões']
        },
        maxInnerResults: 0
      }
    }
  });

  root.ARI_CONFIG = Object.freeze({
    DONATION_URL,
    ISSUES_URL,
    DONATION_PROMPT_THRESHOLD,
    MAX_BLOCKED_SITES,
    DEFAULT_BEFORE_DATE,
    MIN_BEFORE_DATE,
    DEFAULT_SETTINGS,
    BLOCK_TYPES,
    TYPE_SETTING,
    DETECTION
  });
})(globalThis);
