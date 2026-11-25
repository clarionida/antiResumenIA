# Textos para la ficha de la Chrome Web Store

El nombre y la descripción corta salen de `_locales/*/messages.json` (`extName`, `extDescription`). La descripción larga se pega en el panel.

---

## Español (idioma predeterminado)

**Nombre** (61/75)
Buscar sin IA: oculta resúmenes de IA y anuncios para Google™

**Descripción corta** (116/132)
Oculta resúmenes de IA, anuncios y bloques de relleno en Google. Ve solo resultados con links. Gratis y sin rastreo.

**Descripción larga**

```
¿Extrañas cuando buscar en Google era ver una lista de links? Buscar sin IA limpia la página de resultados para que tú decidas qué ver.

Marca lo que quieres ocultar:

INTELIGENCIA ARTIFICIAL
• Resúmenes de IA («Resumen de IA» / «AI Overview»)
• La pestaña y el botón de «Modo IA»

PUBLICIDAD Y COMPRAS
• Resultados patrocinados y anuncios
• Carruseles de productos y precios

BLOQUES QUE EMPUJAN LOS RESULTADOS
• «Otras preguntas de los usuarios»
• Carruseles de videos y videos cortos
• Bloques de imágenes entre los resultados
• Mapas y negocios cercanos («Sitios»)
• «Debates y foros»
• «También se buscó» (búsquedas relacionadas)

MIS SITIOS BLOQUEADOS
• Escribe un dominio (por ejemplo, pinterest.com) y sus resultados desaparecen, también los de sus subdominios.

AVANZADO (apagado de inicio)
• Modo «Solo Web»: abre tus búsquedas directamente en la vista «Web» de Google.
• «Solo contenido anterior a la IA»: agrega un filtro de fecha que tú eliges.

DETALLES QUE IMPORTAN
• Los cambios se aplican al instante, sin recargar.
• Un aviso pequeño te dice cuántos elementos se ocultaron y te deja verlos con un clic. Puedes apagarlo.
• Interruptor para pausar todo.
• Funciona con Google en español, inglés y portugués, y en los dominios de país (google.com.mx, google.es, google.com.ar, google.com.co, google.cl, google.com.pe, google.com.br y más).
• Modo claro y oscuro, navegable con teclado.
• Exporta e importa tu configuración en JSON.

PRIVACIDAD
No recopila, no envía y no vende ningún dato. No hace peticiones de red ni tiene analítica. Tus opciones se guardan con la sincronización de Chrome y el contador queda solo en tu navegador.

¿Algo no se oculta? Repórtalo con el link «Reportar un problema» de las opciones.

Es 100 % gratis: sin versión premium y sin funciones bloqueadas. Extensión independiente, sin relación con Google LLC. Google es una marca comercial de Google LLC.

¿Te sirve? Si quieres, puedes invitarme un café ☕ https://donate.stripe.com/bJeeVfgHU7Npa1A59ocAo00 (totalmente opcional).
```

---

## English

**Name** (56/75)
Search Without AI: hide AI Overviews and ads for Google™

**Short description** (103/132)
Hide AI Overviews, ads and filler blocks on Google. See just the results with links. Free, no tracking.

**Long description**

```
Miss when a Google search was just a list of links? Search Without AI cleans up the results page so you decide what you see.

Tick what you want to hide:

ARTIFICIAL INTELLIGENCE
• AI Overviews
• The “AI Mode” tab and button

ADS AND SHOPPING
• Sponsored results and ads
• Product and price carousels

BLOCKS THAT PUSH RESULTS DOWN
• “People also ask”
• Video and short-video carousels
• Image blocks between results
• Maps and nearby businesses (“Places”)
• “Discussions and forums”
• “People also search for” (related searches)

MY BLOCKED SITES
• Type a domain (for example, pinterest.com) and its results disappear, subdomains included.

ADVANCED (off by default)
• “Web only” mode: opens your searches straight in Google’s “Web” view.
• “Only pre-AI content”: adds a date filter you choose.

THE DETAILS
• Changes apply instantly, no reload needed.
• A small notice tells you how many items were hidden and lets you see them in one click. You can turn it off.
• A switch to pause everything.
• Works with Google in English, Spanish and Portuguese, and on country domains.
• Light and dark mode, keyboard friendly.
• Export and import your settings as JSON.

PRIVACY
No data is collected, sent or sold. No network requests, no analytics. Your options are saved with Chrome sync and the counter stays in your browser.

Something not hidden? Report it with the “Report a problem” link in the options.

100% free: no premium version, no locked features. Independent extension, not affiliated with Google LLC. Google is a trademark of Google LLC.

Find it useful? You can buy me a coffee ☕ https://donate.stripe.com/bJeeVfgHU7Npa1A59ocAo00 (totally optional).
```

---

## Justificación de permisos (formulario de revisión)

**Propósito único** (Single purpose)
- ES: Limpiar la página de resultados de Google ocultando los bloques que el usuario elige (resúmenes de IA, Modo IA, anuncios, compras, preguntas, videos, foros y sitios que bloquea), para ver solo los resultados con links.
- EN: Clean up the Google search results page by hiding the blocks the user chooses (AI Overviews, AI Mode, ads, shopping, questions, videos, forums and sites they block), so they see just the results with links.

**storage**
- ES: Guarda las opciones del usuario y su lista de sitios bloqueados (chrome.storage.sync), y un contador local de elementos ocultados (chrome.storage.local). Nada se envía fuera del navegador.
- EN: Stores the user’s options and blocked-site list (chrome.storage.sync) and a local counter of hidden items (chrome.storage.local). Nothing leaves the browser.

**declarativeNetRequestWithHostAccess**
- ES: Solo se usa en dos opciones avanzadas que vienen apagadas: «Solo Web» agrega udm=14 a la URL de búsqueda de Google, y «Solo contenido anterior a la IA» agrega un filtro de fecha (tbs). Son reglas de redirección declarativas limitadas a www.google.<país>/search. No bloquean ni leen ninguna petición. Se eligió esta variante porque solo actúa en los hosts ya declarados.
- EN: Used only by two advanced options that are off by default: “Web only” adds udm=14 to the Google search URL, and “Only pre-AI content” adds a date filter (tbs). They are declarative redirect rules limited to www.google.<country>/search. They don’t block or read any request. This variant was chosen because it only acts on the hosts already declared.

**Permisos de host** (www.google.com y dominios de país de Google)
- ES: Necesarios para inyectar el script y el CSS que ocultan los bloques elegidos en la página de resultados de Google (y el botón de Modo IA en la portada), y para que funcionen las redirecciones de las opciones avanzadas. Se listan solo los dominios de búsqueda de Google porque no existe un comodín válido para todos sus dominios de país. No se pide acceso a ningún otro sitio.
- EN: Required to inject the script and CSS that hide the chosen blocks on the Google results page (and the AI Mode button on the home page), and for the advanced options’ redirects to work. Only Google search domains are listed, because no valid wildcard covers all of Google’s country domains. No other site is accessed.

**¿Usa código remoto?** No. Todo el JavaScript va dentro del paquete. No hay eval, ni scripts externos, ni código descargado.
*Are you using remote code?* No, I am not using remote code.

---

## Prácticas de privacidad (pestaña Privacy practices)

**Uso de datos: ¿qué datos del usuario recopila?** No marques ninguna casilla:
- Información de identificación personal: No
- Información de salud: No
- Información financiera y de pago: No
- Información de autenticación: No
- Comunicaciones personales: No
- Ubicación: No
- Historial web: No
- Actividad del usuario: No
- Contenido del sitio web: No. El contenido de la página se analiza localmente solo para ocultar bloques y no se guarda ni se transmite.

**Certificaciones** (marca las tres):
- [x] No vendo ni transfiero datos de usuarios a terceros, salvo en los casos de uso aprobados.
- [x] No uso ni transfiero datos de usuarios con fines no relacionados con el propósito único del elemento.
- [x] No uso ni transfiero datos de usuarios para determinar la solvencia crediticia ni para otorgar préstamos.

**URL de la política de privacidad:** la dirección pública donde publiques `PRIVACY.md` (por ejemplo, GitHub Pages).

---

## Política de privacidad breve (para pegar donde haga falta)

ES: Buscar sin IA no recopila, no envía, no vende y no comparte ningún dato. Solo lee la página de resultados de Google en tu navegador, lo necesario para ocultar los bloques que eliges. Tus opciones se guardan con chrome.storage.sync y el contador, solo en tu navegador. No hace peticiones de red, no tiene analítica y no carga código remoto.

EN: Search Without AI does not collect, send, sell or share any data. It only reads the Google results page in your browser, just enough to hide the blocks you choose. Your options are saved with chrome.storage.sync and the counter stays in your browser. No network requests, no analytics, no remote code.
