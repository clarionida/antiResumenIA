<p align="center">
  <img src="store/icon512.png" width="112" height="112" alt="">
</p>

<h1 align="center">Buscar sin IA</h1>

<p align="center">
  <strong>Google como antes: solo resultados con links.</strong><br>
  Extensión gratuita para Chrome que oculta los resúmenes de IA, los anuncios y otros recuadros de la página de resultados de Google.
</p>

<p align="center"><em>Search Without AI · Busca sem IA</em></p>

<p align="center"><a href="https://clarionida.com/buscar-sin-ia/"><strong>Página web</strong></a> · <a href="https://clarionida.com/buscar-sin-ia/en/">Website (English)</a></p>

---

## Qué hace

Tú eliges qué quieres ocultar. Cada opción se activa o se desactiva con una casilla, y los cambios se aplican al instante, sin recargar.

**Inteligencia artificial** *(activadas desde el inicio)*
- Resúmenes de IA («Resumen de IA», «Visión general creada por IA», «AI Overview»)
- La pestaña y el botón de «Modo IA»

**Publicidad y compras**
- Anuncios y resultados patrocinados *(activada desde el inicio)*
- Cuadrículas y carruseles de productos con precios

**Otras secciones de Google**
- «Otras preguntas de los usuarios» / «Más preguntas»
- Carruseles de videos y videos cortos
- Bloques de imágenes entre los resultados
- Mapas y negocios cercanos («Sitios»)
- «Debates y foros»
- «También se buscó» (búsquedas relacionadas)

**Mis sitios bloqueados**
- Escribe un sitio (por ejemplo, `pinterest.com`) y sus resultados desaparecen, también los de sus subdominios.

**Avanzado** *(apagado desde el inicio)*
- **Solo Web:** abre tus búsquedas directamente en la vista «Web» de Google.
- **Solo contenido anterior a la IA:** agrega un filtro de fecha que tú eliges.

**Además**
- Un aviso pequeño te dice cuántos elementos se ocultaron y te deja verlos con un clic.
- Un interruptor para pausar todo sin perder tu configuración.
- Funciona con Google en español, inglés y portugués, y en los dominios de cada país (google.com.mx, google.es, google.com.ar, google.com.co, google.cl, google.com.br y más).
- Modo claro y oscuro, y se puede usar con el teclado.
- Puedes guardar tu configuración en un archivo y cargarla en otro navegador.

## Privacidad

- **No recopila, no envía y no vende ningún dato.**
- No hace peticiones a internet, no tiene analítica y no carga código externo.
- Solo lee la página de resultados de Google en tu navegador, lo necesario para ocultar lo que elegiste.
- Tus opciones se guardan con la sincronización de Chrome. El contador de elementos ocultados queda solo en tu navegador.

Política completa: [PRIVACY.md](PRIVACY.md).

## Instalación

**Chrome Web Store:** próximamente.

**Mientras tanto, de forma manual:**

1. Descarga el proyecto: [**Descargar .zip**](https://github.com/clarionida/buscar-sin-ia/archive/refs/heads/main.zip).
2. Descomprímelo y guarda la carpeta en un lugar fijo, por ejemplo en Documentos. Chrome la usa desde ahí: no la borres ni la muevas después.
3. En Chrome, abre `chrome://extensions`.
4. Activa **Modo de desarrollador** (arriba a la derecha).
5. Pulsa **Cargar extensión sin empaquetar** y elige la carpeta que tiene el archivo `manifest.json` adentro.
6. Pulsa el ícono de pieza de rompecabezas, junto a la barra de direcciones, y fija **Buscar sin IA** con la chincheta.

## Cómo se usa

- **El ícono de la barra** abre un panel con el interruptor general, las opciones principales y el contador.
- **«Más opciones»** abre la página con todas las opciones, tu lista de sitios bloqueados y el respaldo de tu configuración.
- **En Google**, abajo a la izquierda, verás «Se ocultaron N elementos · Mostrar». Pulsa «Mostrar» para ver lo oculto, marcado con un borde punteado. Este aviso se puede apagar en las opciones.

## ¿En qué navegadores funciona?

- **Google Chrome** en computadora.
- También debería funcionar en navegadores basados en Chrome, como Edge, Brave, Opera o Vivaldi, aunque no se ha probado en ellos.
- Solo limpia **Google**. Si tu navegador busca con otro buscador (Bing, Brave Search…), ahí no hace nada.
- Chrome para celular no admite extensiones.

## ¿Algo no funciona?

Google cambia su página seguido, y a veces un bloque deja de ocultarse.

- Repórtalo en [**Reportar un problema**](https://github.com/clarionida/buscar-sin-ia/issues/new?template=problema.yml). También está el link al pie de la página de opciones.
- Ayuda mucho que incluyas la búsqueda que usaste y el **texto exacto** del título del bloque que no se ocultó.

## Apoyar

Buscar sin IA es y seguirá siendo **gratis**, sin versión premium ni funciones bloqueadas. Si te sirve, puedes [invitarme un café ☕](https://donate.stripe.com/bJeeVfgHU7Npa1A59ocAo00). Es totalmente opcional.

<p align="center"><em>Hecho con cariño por Clariónida</em></p>

<sub>Extensión independiente, sin relación con Google LLC. Google es una marca comercial de Google LLC.</sub>

---

## Para desarrolladores

Todo es JavaScript, HTML y CSS locales, sin dependencias ni pasos de compilación.

### Cómo funciona

- **Detección sin clases ofuscadas.** Cada bloque se reconoce combinando IDs que Google mantiene desde hace años (`#rso`, `#tads`, `#bottomads`…), atributos con significado (`data-text-ad`, `href*="udm=50"`) y el **texto exacto** de su encabezado en español, inglés y portugués. Desde esa pista se sube hasta el contenedor del bloque, sin salir de la columna de resultados y sin tragarse resultados normales vecinos. Si no reconoce la página, no oculta nada.
- **Cuadrículas de productos sin título.** Se detectan por estructura: un bloque sin resultados normales, con varios precios y varias imágenes.
- **Cada bloque pertenece al tipo de su primer encabezado.** Así, «Más preguntas» no se oculta como resumen de IA aunque sus respuestas digan «Visión general creada por IA».
- **Sin parpadeo.** El CSS entra en `document_start` y oculta de inmediato lo que tiene selector estable. Lo demás se procesa con un `MutationObserver` agrupado en `requestAnimationFrame`, que corre antes de pintar.
- **Ocultar, no borrar.** Se marca el contenedor con `data-ari-hidden` y el CSS aplica `display:none`, que no deja huecos.
- **Modos avanzados** con reglas dinámicas de `declarativeNetRequest`. Los bucles de redirección se evitan con reglas `allow` de mayor prioridad. Las pestañas Imágenes, Noticias, Shopping, Modo IA, etc. no se tocan.
- **Pestañas de Google:** en Shopping, Imágenes o Noticias solo se aplican IA, anuncios y sitios bloqueados, para no vaciarlas.

### Estructura

```
manifest.json                 Manifest V3
_locales/{es,en,pt_BR,pt_PT}  Textos (generados por tools/locales-src.mjs)
src/config.js                 ★ Selectores, textos por idioma, valores predeterminados, DONATION_URL, ISSUES_URL
src/common.js                 Almacenamiento y normalización de dominios
src/dnr-rules.js              Reglas de declarativeNetRequest (Solo Web / filtro de fecha)
src/background.js             Service worker: reglas DNR y contador local
src/content/content.js        Detección, MutationObserver y aviso en la página
src/content/content.css       Ocultamiento en document_start
popup/  options/  ui/         Interfaz (popup, opciones, estilos compartidos)
icons/                        icon.svg, icon-small.svg y PNG de 16/32/48/128
store/                        Ícono de 512 px, capturas y mosaicos para la tienda
site/                         Página web (GitHub Pages), publicada por .github/workflows/pages.yml
tools/                        Generadores y empaquetado (no van en el .zip)
tests/                        Pruebas automáticas y páginas de prueba
docs/                         Guías (ver abajo)
```

### Comandos

Requieren Node 18 o superior y Playwright con Chromium.

```bash
npm test                         # pruebas: dominios, reglas DNR y extensión real en Chromium
node tools/locales-src.mjs       # regenera _locales a partir de una sola fuente
node tools/sync-manifest.mjs     # actualiza los dominios de Google en manifest.json
node tools/render-icons.cjs      # exporta los íconos PNG desde los SVG
bash tools/build-zip.sh          # crea dist/buscar-sin-ia-<versión>.zip para la tienda
```

### Guías

- [docs/SELECTORES.md](docs/SELECTORES.md): cómo actualizar la detección cuando Google cambie su página.
- [docs/diagnostico.js](docs/diagnostico.js): script de consola para ver cómo arma Google una página.
- [docs/PRUEBAS.md](docs/PRUEBAS.md): lista de pruebas manuales por opción.
- [docs/PERMISOS.md](docs/PERMISOS.md): por qué se pide cada permiso.
- [docs/PUBLICAR.md](docs/PUBLICAR.md): empaquetar y publicar en la Chrome Web Store.
- [docs/FICHA-CWS.md](docs/FICHA-CWS.md): textos de la ficha de la tienda (es/en).
