# Cómo actualizar la detección cuando Google cambie su página

Toda la detección está en **`src/config.js` → `DETECTION`**. Casi nunca hace falta tocar `content.js`.

## 1. Encuentra qué cambió

1. Abre la búsqueda donde algo dejó de ocultarse.
2. Clic derecho sobre el bloque → **Inspeccionar**.
3. Busca, en este orden:
   - **El texto visible del encabezado** (por ejemplo «Resumen de IA»). ¿Cambió la frase? Es lo más común.
   - **Un ID o atributo con significado** (`id="tads"`, `data-text-ad`, `href` con `udm=50`).
   - **La columna que lo contiene.** Sube en el árbol hasta un ID como `#rso`, `#center_col`, `#botstuff` o `#rhs`.
4. Ignora clases como `MjjYud`, `hdzaWe` o `V3FYCf`: son ofuscadas y cambian sin aviso.

En la consola de la pestaña de Google puedes revisar qué se ocultó y de qué tipo:

```js
[...document.querySelectorAll('[data-ari-hidden]')].map(e => [e.dataset.ariHidden, e.innerText.slice(0, 60)])
```

## 2. Arreglos típicos

| Síntoma | Arreglo en `config.js` |
|---|---|
| Google cambió el encabezado (p. ej. «Resumen de IA» → «Vista de IA») | Agrega el texto nuevo en `types.aiOverview.labels.es`. Las comparaciones no distinguen mayúsculas ni signos finales. |
| Un bloque nuevo usa un ID o atributo estable | Si el elemento **es** el bloque completo, agrégalo a `containers`. Si es una pieza interna, agrégalo a `markers` y el script subirá hasta el bloque. |
| Ya no se oculta nada de nada | Revisa si cambiaron `columnRoots` o `mainArea` (`#rso`, `#center_col`…). Sin una columna conocida, el script no oculta nada por seguridad. |
| Se oculta algo de más | Busca el texto que lo activó con el comando de consola de arriba. Quítalo de `labels` o agrega su contenedor a `ignoreLabelsInside`. |
| La pestaña de Modo IA cambió de parámetro | Cambia `udm=50` en `types.aiMode.markers` **y** en `src/content/content.css`. |
| Los anuncios aparecen un instante antes de ocultarse | Si encontraste un selector estable nuevo, agrégalo también a la lista de anuncios de `content.css`. |
| Aparece un idioma nuevo | Agrega una clave (`fr: [...]`) en `labels`. No hace falta tocar nada más. |

## 3. Qué significa cada campo

- `strategy: 'block'`: desde la pista, sube hasta el hijo directo de una columna de resultados. Se detiene antes si el siguiente nivel incluye resultados normales (`a h3`) ajenos al bloque.
- `strategy: 'control'`: oculta el botón, link o pestaña más cercano (Modo IA). Nunca oculta un control con más de `maxControlTextLength` caracteres.
- `areas`: `'main'` solo en la columna central; `'all'` también en la lateral.
- `maxInnerResults`: cuántos títulos de resultado puede tener el bloque. Los anuncios traen uno.
- `navigationArea`: aquí los textos no cuentan como bloque. Por eso la pestaña «Videos» no activa la opción de videos.
- `blockBoundaries`: paginación y navegación. Un bloque nunca se extiende hasta incluirlas; por eso ocultar «También se buscó» no se lleva el botón «Siguiente».
- `yieldsTo`: si un bloque empieza con el título de otro tipo, pertenece a ese tipo. Así, «Más preguntas» (que trae respuestas con el título «Visión general creada por IA») cuenta como preguntas y no como resumen de IA.
- `priceGrid` (en `shopping`): detecta cuadrículas de productos sin título contando precios e imágenes. Si Google usa una moneda nueva o cambia el formato del precio, ajusta `pattern`.
- `typesOnVerticals`: tipos que se aplican en pestañas como Shopping, Imágenes o Noticias. Los demás se apagan ahí para no vaciar esas pestañas.
- `ignoreLabelsInside`: fichas de información. Un «Videos» dentro de una ficha no oculta la ficha entera.

## 4. Verifica y publica

1. `npm test`. Si cambiaste la estructura, actualiza `tests/fixtures/*.html` para que imite el HTML nuevo.
2. Recarga la extensión en `chrome://extensions` y repite las pruebas afectadas de `docs/PRUEBAS.md`, en español y en inglés.
3. Sube la versión en `manifest.json` (`1.0.0` → `1.0.1`), ejecuta `bash tools/build-zip.sh` y publica (ver `docs/PUBLICAR.md`).

> No agregues descarga remota de selectores: sería una petición de red y rompería la política de privacidad.
