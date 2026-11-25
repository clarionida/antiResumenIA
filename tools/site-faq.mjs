// Preguntas frecuentes de la página web: fuente única para lo visible y para
// los datos estructurados (FAQPage) en español e inglés.
//   node tools/site-faq.mjs
// Reescribe el bloque entre <!-- FAQ:INICIO --> y <!-- FAQ:FIN --> y el
// <script id="faq-jsonld"> de site/index.html y site/en/index.html.
// Las respuestas admiten <code>, <strong> y <a>; en los datos estructurados se
// guardan como texto plano.
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const REPORT = 'https://github.com/clarionida/antiResumenIA/issues/new?template=problema.yml';

const FAQ = {
  es: [
    { title: 'Inteligencia artificial', items: [
      ['¿Cómo quito el resumen de IA de Google?',
        'Instala la extensión gratuita Buscar sin IA en Chrome. Desde ese momento, el bloque «Resumen de IA», «Vista creada con IA» o «Visión general creada por IA» deja de aparecer en tus búsquedas de Google, y el resto de los resultados se queda igual.'],
      ['¿Cómo quito el «Modo IA» de Google?',
        'Buscar sin IA oculta la pestaña «Modo IA» de la barra de pestañas y su botón junto a la caja de búsqueda. Viene activado desde el inicio.'],
      ['¿Se puede desactivar la IA de Google sin instalar nada?',
        'Google no tiene un botón para apagarla. Puedes elegir la pestaña «Web» en cada búsqueda o crear un buscador personalizado con el parámetro <code>udm=14</code>. Buscar sin IA lo hace automático y te deja elegir qué ocultar.']
    ] },
    { title: 'Anuncios y compras', items: [
      ['¿Cómo quito los anuncios de Google?',
        'Buscar sin IA oculta los anuncios y los resultados patrocinados («Patrocinado», «Resultado patrocinado») de arriba y de abajo de la página de resultados. Viene activado desde el inicio, así que solo ves los resultados normales.'],
      ['¿Es un bloqueador de anuncios como AdBlock o uBlock?',
        'No exactamente. Buscar sin IA solo limpia la página de resultados de Google: no bloquea anuncios en otros sitios web ni en YouTube. Tampoco bloquea conexiones: solo oculta lo que no quieres ver. Si ya usas un bloqueador de anuncios, puedes usar las dos a la vez.'],
      ['¿Puedo ocultar los productos, precios y tiendas de los resultados?',
        'Sí. Activa «Ocultar bloques de compras» y desaparecen las cuadrículas y carruseles de productos con precios, aunque no tengan título. La pestaña «Shopping» de Google sigue funcionando normal por si quieres comprar algo.']
    ] },
    { title: 'Otras secciones de Google', items: [
      ['¿Cómo quito «Otras preguntas de los usuarios» o «Más preguntas»?',
        'Activa «Ocultar «Otras preguntas de los usuarios»» en las opciones. La lista de preguntas desplegables desaparece y los resultados suben.'],
      ['¿Puedo ocultar los videos, las imágenes y los mapas de Google?',
        'Sí, cada uno por separado: carruseles de videos y videos cortos, recuadros de imágenes entre los resultados, y el bloque «Sitios» con el mapa y los negocios cercanos. Las pestañas «Videos» e «Imágenes» y Google Maps siguen funcionando.'],
      ['¿Cómo quito «También se buscó» o las búsquedas relacionadas?',
        'Activa «Ocultar «También se buscó»». Desaparecen las sugerencias del final de la página y el recuadro «La gente también busca» que aparece debajo de un resultado al volver atrás. La paginación se queda.'],
      ['¿Cómo quito «Debates y foros» o los resultados de Reddit?',
        'La opción «Ocultar «Debates y foros»» quita el bloque de conversaciones de Reddit, Quora y otros foros. Si además no quieres ver los resultados normales de Reddit, agrega <code>reddit.com</code> a tus sitios bloqueados.']
    ] },
    { title: 'Sitios bloqueados', items: [
      ['¿Puedo bloquear sitios como Pinterest en los resultados de Google?',
        'Sí. En «Mis sitios bloqueados» escribe el dominio, por ejemplo <code>pinterest.com</code>, y sus resultados desaparecen de tus búsquedas, incluidos los de sus subdominios (es.pinterest.com, ar.pinterest.com…). Puedes agregar hasta 300 sitios y quitarlos cuando quieras.']
    ] },
    { title: 'Opciones avanzadas', items: [
      ['¿Qué es el modo «Solo Web» (udm=14)?',
        'Abre tus búsquedas directamente en la vista «Web» de Google, que muestra solo resultados con links. Para eso agrega <code>udm=14</code> a la dirección de la búsqueda. Este modo también quita otros paneles, como la ficha de información o el clima. Imágenes, Noticias, Videos, Maps y Shopping siguen igual. Viene apagado.'],
      ['¿Puedo ver solo páginas anteriores a la IA, por ejemplo de antes de 2023?',
        'Sí. La opción «Solo contenido anterior a la IA» agrega a tus búsquedas el filtro de fecha de Google para mostrar páginas publicadas antes del día que elijas (de inicio, el 1 de enero de 2023). Google estima la fecha de cada página, así que puede no ser exacto. Viene apagada.']
    ] },
    { title: 'Uso, privacidad y compatibilidad', items: [
      ['¿Buscar sin IA es gratis?',
        'Sí, es 100 % gratis: sin versión premium, sin funciones bloqueadas y sin anuncios. Las donaciones son opcionales.'],
      ['¿Recopila mis datos o mis búsquedas?',
        'No. No recopila, no envía y no vende ningún dato, no hace peticiones a internet y no tiene analítica. Solo lee la página de resultados de Google en tu navegador para ocultar lo que elegiste.'],
      ['¿Puedo ver lo que se ocultó o pausar la extensión?',
        'Sí. En la página de Google aparece un aviso pequeño, «Se ocultaron N elementos · Mostrar», que te deja ver lo oculto, marcado con un borde punteado. Y con el interruptor del ícono de la barra pausas todo al instante sin perder tu configuración.'],
      ['¿Mi configuración se guarda en todas mis computadoras?',
        'Si usas la sincronización de Chrome, tus opciones y tus sitios bloqueados se guardan en tu cuenta y aparecen en tus otras computadoras. También puedes exportarlos a un archivo e importarlos en otro navegador.'],
      ['¿Funciona con Google de mi país?',
        'Sí. Funciona en más de 40 dominios de Google, como google.com, google.com.mx, google.es, google.com.ar, google.com.co, google.cl, google.com.pe y google.com.br, con Google en español, inglés o portugués.'],
      ['¿Funciona en Edge, Brave u Opera?',
        'Esos navegadores están basados en Chrome y aceptan sus extensiones, así que debería funcionar, aunque está probada en Chrome. Solo actúa cuando buscas en Google.'],
      ['¿Funciona en el celular?',
        'No. Chrome para Android y para iPhone no admite extensiones. Funciona en Chrome de computadora.'],
      ['¿Qué pasa si Google cambia su página?',
        `Google cambia su página seguido. La extensión se revisa cada mes y se actualiza cuando hace falta. Si algo deja de ocultarse, puedes <a href="${REPORT}">reportarlo</a> desde el link «Reportar un problema» de las opciones.`],
      ['¿En qué se diferencia de otras extensiones?',
        'Está pensada primero en español, no solo quita la IA (también anuncios, compras y otras secciones), te deja elegir qué ocultar una por una, incluye una lista de sitios bloqueados, no rastrea nada y su código es público en GitHub.']
    ] }
  ],

  en: [
    { title: 'Artificial intelligence', items: [
      ['How do I remove the AI Overview from Google?',
        'Install the free Search Without AI extension in Chrome. From then on, the “AI Overview” box no longer appears in your Google searches, and the rest of the results stay the same.'],
      ['How do I remove Google’s “AI Mode”?',
        'Search Without AI hides the “AI Mode” tab and its button next to the search box. It’s on by default.'],
      ['Can I turn off Google’s AI without installing anything?',
        'Google has no switch to turn it off. You can pick the “Web” tab on every search or set up a custom search engine with the <code>udm=14</code> parameter. Search Without AI does it automatically and lets you choose what to hide.']
    ] },
    { title: 'Ads and shopping', items: [
      ['How do I remove ads from Google search results?',
        'Search Without AI hides ads and sponsored results (“Sponsored”) at the top and bottom of the results page. It’s on by default, so you only see regular results.'],
      ['Is it an ad blocker like AdBlock or uBlock?',
        'Not exactly. Search Without AI only cleans up the Google results page: it doesn’t block ads on other websites or YouTube, and it doesn’t block connections, it just hides what you don’t want to see. If you already use an ad blocker, you can use both at the same time.'],
      ['Can I hide products, prices and stores from the results?',
        'Yes. Turn on “Hide shopping blocks” and product grids and carousels with prices disappear, even when they have no heading. Google’s “Shopping” tab still works normally if you want to buy something.']
    ] },
    { title: 'Other Google sections', items: [
      ['How do I remove “People also ask”?',
        'Turn on “Hide “People also ask”” in the options. The list of expandable questions disappears and the results move up.'],
      ['Can I hide Google’s videos, images and maps?',
        'Yes, each one separately: video and short-video carousels, image boxes between results, and the places block with the map and nearby businesses. The “Videos” and “Images” tabs and Google Maps keep working.'],
      ['How do I remove “People also search for” or related searches?',
        'Turn on “Hide “People also search for””. The suggestions at the bottom of the page disappear, and so does the box that shows up under a result when you go back. Pagination stays.'],
      ['How do I remove “Discussions and forums” or Reddit results?',
        'The “Hide “Discussions and forums”” option removes the block of threads from Reddit, Quora and other forums. If you also don’t want regular Reddit results, add <code>reddit.com</code> to your blocked sites.']
    ] },
    { title: 'Blocked sites', items: [
      ['Can I block sites like Pinterest from Google results?',
        'Yes. In “My blocked sites” type the domain, for example <code>pinterest.com</code>, and its results disappear from your searches, subdomains included. You can add up to 300 sites and remove them anytime.']
    ] },
    { title: 'Advanced options', items: [
      ['What is “Web only” mode (udm=14)?',
        'It opens your searches straight in Google’s “Web” view, which shows just results with links, by adding <code>udm=14</code> to the search address. It also removes other panels, like info cards or weather. Images, News, Videos, Maps and Shopping stay the same. It’s off by default.'],
      ['Can I see only pre-AI pages, for example from before 2023?',
        'Yes. The “Only pre-AI content” option adds Google’s date filter to your searches to show pages published before the day you choose (January 1, 2023 by default). Google estimates each page’s date, so it may not be exact. It’s off by default.']
    ] },
    { title: 'Usage, privacy and compatibility', items: [
      ['Is Search Without AI free?',
        'Yes, 100% free: no premium version, no locked features and no ads. Donations are optional.'],
      ['Does it collect my data or my searches?',
        'No. It doesn’t collect, send or sell any data, makes no network requests and has no analytics. It only reads the Google results page in your browser to hide what you chose.'],
      ['Can I see what was hidden or pause the extension?',
        'Yes. A small notice on the Google page says “N items hidden · Show” and lets you see what was hidden, outlined with a dashed border. The switch in the toolbar icon pauses everything instantly without losing your settings.'],
      ['Are my settings saved across my computers?',
        'If you use Chrome sync, your options and blocked sites are saved to your account and show up on your other computers. You can also export them to a file and import them in another browser.'],
      ['Does it work with my country’s Google?',
        'Yes. It works on more than 40 Google domains, such as google.com, google.co.uk, google.ca, google.com.au, google.es and google.com.mx, with Google in English, Spanish or Portuguese.'],
      ['Does it work in Edge, Brave or Opera?',
        'Those browsers are based on Chrome and accept its extensions, so it should work, although it’s tested in Chrome. It only acts when you search on Google.'],
      ['Does it work on my phone?',
        'No. Chrome for Android and iPhone doesn’t support extensions. It works in desktop Chrome.'],
      ['What happens if Google changes its page?',
        `Google changes its page often. The extension is reviewed every month and updated when needed. If something stops being hidden, you can <a href="${REPORT}">report it</a> with the “Report a problem” link in the options.`],
      ['How is it different from other extensions?',
        'It’s Spanish-first, it doesn’t just remove AI (ads, shopping and other sections too), it lets you choose what to hide one by one, it includes a blocked-sites list, it tracks nothing and its code is public on GitHub.']
    ] }
  ]
};

const plain = (html) => html.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&');
const indent = (s, n) => s.split('\n').map((l) => (l ? ' '.repeat(n) + l : l)).join('\n');

function visible(groups) {
  return groups.map((g) => [
    `<h3>${g.title}</h3>`,
    ...g.items.map(([q, a]) => `<details>\n  <summary>${q}</summary>\n  <p>${a}</p>\n</details>`)
  ].join('\n')).join('\n');
}

function jsonld(groups) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: groups.flatMap((g) => g.items.map(([q, a]) => ({
      '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: plain(a) }
    })))
  };
  return JSON.stringify(data, null, 2);
}

for (const [lang, file] of [['es', 'site/index.html'], ['en', 'site/en/index.html']]) {
  const path = join(ROOT, file);
  let html = readFileSync(path, 'utf8');
  const groups = FAQ[lang];
  const vis = /(<!-- FAQ:INICIO -->)[\s\S]*?(\s*<!-- FAQ:FIN -->)/;
  const ld = /(<script type="application\/ld\+json" id="faq-jsonld">)[\s\S]*?(<\/script>)/;
  if (!vis.test(html) || !ld.test(html)) throw new Error(`${file}: faltan los marcadores de preguntas frecuentes`);
  html = html.replace(vis, (_, a, b) => `${a}\n${indent(visible(groups), 8)}${b}`);
  html = html.replace(ld, (_, a, b) => `${a}\n${indent(jsonld(groups), 2)}\n  ${b}`);
  writeFileSync(path, html);
  const n = groups.reduce((s, g) => s + g.items.length, 0);
  console.log(`${file}: ${n} preguntas en ${groups.length} grupos`);
}
