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
    hideRelatedSearches: false, // 7b. "También se buscó" / búsquedas relacionadas.
    hideImages: false,          // 7c. Bloques de imágenes entre los resultados.
    hidePlaces: false,          // 7d. Mapa y negocios cercanos («Sitios»).
    showPageNotice: true,       // Aviso pequeño "Se ocultaron N elementos · Mostrar".
    webOnly: false,             // 9. Modo "Solo Web" (udm=14) con declarativeNetRequest.
    beforeDateEnabled: false,   // 10. Filtro "Solo contenido anterior a la IA".
    beforeDate: DEFAULT_BEFORE_DATE
  });

  /** Tipos de bloque que se cuentan y se pueden ocultar. */
  const BLOCK_TYPES = Object.freeze([
    'aiOverview', 'aiMode', 'ads', 'shopping',
    'peopleAlsoAsk', 'videos', 'images', 'places', 'forums', 'relatedSearches', 'blockedSites'
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
    relatedSearches: 'hideRelatedSearches',
    images: 'hideImages',
    places: 'hidePlaces',
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
   *  - "areas":      "main" = solo columna central; "all" = central + lateral;
   *                  "page" = cualquier parte fuera de la navegación (el resumen
   *                  de IA nuevo ocupa todo el ancho, fuera de #center_col).
   *  - "yieldsTo":   si el bloque encontrado EMPIEZA con la etiqueta de otro tipo,
   *                  pertenece a ese otro tipo. Ej.: «Más preguntas» trae respuestas
   *                  escondidas que dicen «Visión general creada por IA», pero el
   *                  bloque es de preguntas, no el resumen de IA.
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
      '#taw', '#tvcap', '#atvcap', '#bres', '#rhs', '#appbar', '#extabar', '#cnt', '#main'
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

    /**
     * Límites que un bloque nunca absorbe al subir por el árbol: paginación y
     * navegación. Así, ocultar «También se buscó» no se lleva el «Siguiente».
     */
    blockBoundaries: ['#foot', '#navcnt', '[role="navigation"]', 'table[role="presentation"] a[href*="start="]'],

    /**
     * En las pestañas de Google que no son «Todo» o «Web» (Shopping, Imágenes,
     * Noticias…) solo se aplican estos tipos. Así la pestaña Shopping no queda vacía.
     */
    typesOnVerticals: ['aiOverview', 'aiMode', 'ads', 'blockedSites'],

    /**
     * Fila de filtros de Google bajo las pestañas («En stock», «Abierto ahora»,
     * «Mejor valorados»). Solo filtran productos y negocios, así que se oculta
     * cuando están activos TODOS los tipos de "requires". Se oculta la fila
     * completa: se sube desde el botón mientras el contenedor sea bajo (maxRowHeight),
     * con poco texto (maxRowText) y sin pestañas, columnas ni campos de búsqueda.
     */
    filterChips: {
      type: 'shopping',
      requires: ['shopping', 'places'],
      maxRowHeight: 72,
      maxRowText: 200,
      labels: {
        es: ['En stock', 'Abierto ahora', 'Mejor valorados', 'Mejor valorado', 'Envío gratis', 'Cerca de ti', 'Con descuento', 'En oferta'],
        en: ['In stock', 'Open now', 'Top rated', 'Free shipping', 'Nearby', 'On sale'],
        pt: ['Em estoque', 'Aberto agora', 'Mais bem avaliados', 'Frete grátis', 'Perto de você', 'Em promoção']
      }
    },

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
        areas: 'page',
        yieldsTo: ['peopleAlsoAsk', 'forums', 'videos', 'images', 'places', 'shopping', 'relatedSearches'],
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
        maxInnerResults: 0,
        /*
         * Cuadrículas de productos SIN título (precio, tienda, «PRECIO BAJO»…).
         * Un bloque sin resultados normales (a h3) con al menos minPrices textos
         * de precio y minImages imágenes se considera de compras.
         * pattern: texto completo de un precio, con la moneda antes o después.
         */
        priceGrid: {
          pattern: '^(?:(?:MXN|USD|ARS|COP|CLP|PEN|UYU|PYG|BOB|VES|GTQ|HNL|NIO|CRC|PAB|DOP|CUP|BRL|EUR|GBP|CAD|AUD|US\\$|R\\$|RD\\$|C\\$|S\\/\\.?|[$€£])\\s?\\d[\\d.,\\s]*|\\d[\\d.,\\s]*\\s?(?:€|MXN|USD|EUR|ARS|COP|CLP|PEN|BRL))(?:\\s+(?:ahora|now|agora))?$',
          minPrices: 3,
          minImages: 3
        }
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

      images: {
        strategy: 'block',
        // Solo columna central: la pestaña «Imágenes» está en la navegación y las
        // fotos de las fichas de información se ignoran (ignoreLabelsInside).
        areas: 'main',
        containers: [],
        // IDs históricos del bloque de imágenes entre resultados.
        markers: ['#iur', '#imagebox_bigimages'],
        labels: {
          es: ['Imágenes'],
          en: ['Images'],
          pt: ['Imagens']
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
      },

      places: {
        strategy: 'block',
        areas: 'main',
        containers: [],
        // #lu_map: ID histórico del mapa de negocios locales.
        markers: ['#lu_map'],
        labels: {
          es: ['Sitios', 'Lugares', 'Negocios', 'Más lugares', 'Más negocios'],
          en: ['Places', 'Businesses', 'More places', 'More businesses'],
          pt: ['Lugares', 'Locais', 'Empresas', 'Mais lugares', 'Mais empresas']
        },
        maxInnerResults: 0
      },

      relatedSearches: {
        strategy: 'block',
        areas: 'main',
        containers: [],
        markers: [],
        // Aparece al final de la página y, a veces, dentro de un resultado al volver
        // de visitarlo («La gente también busca»). En ese caso solo se oculta el
        // recuadro de sugerencias, no el resultado.
        labels: {
          es: ['También se buscó', 'Búsquedas relacionadas', 'Otras búsquedas', 'La gente también busca', 'Las personas también buscan'],
          en: ['People also search for', 'People also searched for', 'Related searches'],
          pt: ['Pesquisas relacionadas', 'As pessoas também pesquisam', 'As pessoas também pesquisam por', 'Também pesquisaram']
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
