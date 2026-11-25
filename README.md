# Buscar sin IA

*Search Without AI · Busca sem IA*

Extensión gratuita para Chrome (Manifest V3) que limpia la página de resultados de Google: eliges qué bloques ocultar (resúmenes de IA, Modo IA, anuncios, compras, «Otras preguntas», videos, foros, sitios que no quieres ver) y te quedan los resultados con links, como antes.

Todo es gratis, sin versión premium. No recopila ni envía datos y no hace peticiones de red.

## Enfoque y decisiones clave

- **Detección sin clases ofuscadas.** Cada bloque se reconoce combinando IDs históricos de Google (`#rso`, `#tads`, `#bottomads`…), atributos con significado (`data-text-ad`, `href*="udm=50"`) y el **texto exacto** de su encabezado en español, inglés y portugués. Desde esa pista se sube por el DOM hasta el contenedor del bloque, sin pasar de la columna de resultados y sin tragarse resultados normales vecinos. Si no encuentra una columna conocida, no oculta nada: prefiere quedarse corto antes que ocultar de más.
- **Todo en un archivo.** Selectores, textos por idioma, valores predeterminados y `DONATION_URL` están en [`src/config.js`](src/config.js).
- **Sin parpadeo.** El CSS entra en `document_start` y oculta de inmediato lo que tiene selector estable. Lo que se detecta por texto se procesa en un `requestAnimationFrame`, que corre antes de pintar.
- **Ocultar, no borrar.** Se marca el contenedor con `data-ari-hidden` y el CSS aplica `display:none`, que no deja huecos. Por eso «Mostrar» y los cambios de opciones son instantáneos.
- **Modos avanzados con reglas dinámicas de declarativeNetRequest** ([`src/dnr-rules.js`](src/dnr-rules.js)). Las reglas son dinámicas porque la fecha es editable y los dos modos se combinan. Los bucles se evitan con reglas `allow` de mayor prioridad, y las verticales (Imágenes, Noticias, Shopping, Modo IA, Empleos…) no se tocan.

### Cambios frente al pedido original (políticas y fragilidad)

1. **`declarativeNetRequestWithHostAccess` en lugar de `declarativeNetRequest`.** Hace lo mismo para este caso, pero solo actúa en los dominios de `host_permissions` y no agrega la advertencia «Bloquear contenido en cualquier página». Es el permiso más acotado.
2. **Sin comentarios en `manifest.json`.** JSON no admite comentarios y la Chrome Web Store puede rechazar el paquete. La justificación de cada permiso está en [`docs/PERMISOS.md`](docs/PERMISOS.md) y en la cabecera de `src/background.js`.
3. **«Google» solo como «para Google™».** Las reglas de marca de la Chrome Web Store prohíben usar una marca de Google como nombre, pero permiten «para Google™» con atribución. El nombre es «Buscar sin IA: oculta resúmenes de IA y anuncios para Google™» (en inglés, «Search Without AI: hide AI Overviews and ads for Google™»). La línea de atribución está en la página de opciones y en la descripción de la ficha.
4. **Colombia es `google.com.co`.** Se incluyó también `google.co` porque venía en la lista, aunque no es un dominio de búsqueda habitual.
5. **Partes frágiles (avisadas en la interfaz):**
   - *Detección por texto.* Depende del idioma de la interfaz de Google (es, en o pt). Si Google cambia un encabezado, se agrega el texto nuevo en `config.js`. Ver [`docs/SELECTORES.md`](docs/SELECTORES.md).
   - *«Solo contenido anterior a la IA».* Usa el rango de fechas de Google (`tbs=cdr:1,cd_max:…`). Google estima las fechas, así que algunas páginas sin fecha pueden desaparecer. Si el usuario ya eligió otro rango, se respeta el suyo.
   - *«Solo Web».* Mientras está activo, la pestaña «Todo» regresa a «Web».
6. **No hay actualización remota de selectores.** Sería una petición de red y rompería la promesa de privacidad. Cuando Google cambie su HTML, se publica una versión nueva.

## Estructura

```
manifest.json                 Manifest V3 (generado en parte por tools/sync-manifest.mjs)
_locales/{es,en,pt_BR,pt_PT}  Textos (generados por tools/locales-src.mjs)
src/config.js                 ★ Selectores, textos por idioma, predeterminados, DONATION_URL
src/common.js                 Utilidades: almacenamiento, normalización de dominios
src/dnr-rules.js              Reglas de declarativeNetRequest (Solo Web / filtro de fecha)
src/background.js             Service worker: reglas DNR y contador local
src/content/content.js        Detección, MutationObserver y aviso en la página
src/content/content.css       Ocultamiento en document_start
popup/                        Popup (interruptor, opciones 1–3, contador, donación)
options/                      Página de opciones completa
ui/                           Estilos compartidos (claro/oscuro) y traducción del HTML
icons/                        icon.svg + PNG 16/32/48/128
tools/                        Generadores y empaquetado (no van en el .zip)
tests/                        Pruebas automáticas (no van en el .zip)
docs/                         Pruebas manuales, selectores, publicación, ficha, privacidad
```

## Probarla con «Cargar extensión sin empaquetar»

1. Descarga o clona esta carpeta.
2. En Chrome, abre `chrome://extensions`.
3. Activa **Modo de desarrollador** (arriba a la derecha).
4. Pulsa **Cargar extensión sin empaquetar** y elige la carpeta que contiene `manifest.json`.
5. Fija el ícono: menú de extensiones (pieza de rompecabezas) → chincheta junto a «Buscar sin IA».
6. Busca algo en Google, por ejemplo «qué es la fotosíntesis». El resumen de IA y los anuncios desaparecen, y abajo a la izquierda aparece «Se ocultaron N elementos · Mostrar».
7. Si cambias código, pulsa el botón ↻ de la extensión en `chrome://extensions` y recarga la pestaña de Google.

Para ver errores: en `chrome://extensions` → «Service worker» (consola del fondo), o DevTools en la pestaña de Google (consola del content script).

## Pruebas automáticas

Requieren Node 18 o superior y Playwright con Chromium.

```bash
npm test
```

- `tests/common.test.cjs`: normalización de dominios, fechas y configuración.
- `tests/dnr.test.cjs`: simula declarativeNetRequest y verifica que no haya bucles y que no se toquen las verticales.
- `tests/e2e.test.cjs`: carga la extensión real en Chromium, sirve páginas simuladas en URLs de Google (`tests/fixtures`) y comprueba cada opción, los cambios en vivo, los sitios bloqueados, la pausa, el contador y la redirección real a `udm=14`.

Las páginas simuladas imitan la estructura de Google, pero **no sustituyen las pruebas manuales en Google real** ([`docs/PRUEBAS.md`](docs/PRUEBAS.md)).

## Ícono

`icons/icon.svg` es original: una lupa con tres renglones, que representan resultados con links, sobre un fondo terracota. Para regenerar los PNG:

```bash
node tools/render-icons.cjs
```

Para exportarlo a mano con Inkscape:

```bash
for s in 16 32 48 128; do inkscape icons/icon.svg -w $s -h $s -o icons/icon$s.png; done
```

En Figma o Illustrator, exporta el SVG como PNG a 16, 32, 48 y 128 px con fondo transparente.

## Documentación

- [docs/PRUEBAS.md](docs/PRUEBAS.md): lista de pruebas manuales por opción.
- [docs/SELECTORES.md](docs/SELECTORES.md): cómo actualizar la detección cuando Google cambie.
- [docs/PUBLICAR.md](docs/PUBLICAR.md): empaquetar en .zip y subir a la Chrome Web Store.
- [docs/FICHA-CWS.md](docs/FICHA-CWS.md): textos de la ficha (es/en), justificación de permisos y prácticas de privacidad.
- [docs/PERMISOS.md](docs/PERMISOS.md): por qué se pide cada permiso.
- [PRIVACY.md](PRIVACY.md): política de privacidad (es/en).

## Reportar problemas

En la página de opciones hay un link «Reportar un problema». Abre un formulario de GitHub Issues ([`.github/ISSUE_TEMPLATE/problema.yml`](.github/ISSUE_TEMPLATE/problema.yml)) con la versión de la extensión, la de Chrome y el idioma ya rellenados. La URL está en `ISSUES_URL`, dentro de `src/config.js`. Un agente programado revisa estos reportes cada mes.

## Donaciones

La extensión es y seguirá siendo gratis. Si te sirve, puedes [invitarme un café ☕](https://donate.stripe.com/bJeeVfgHU7Npa1A59ocAo00). Es totalmente opcional.
