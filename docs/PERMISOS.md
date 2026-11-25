# Permisos y su justificación

| Permiso | Para qué | Por qué no hay alternativa más pequeña |
|---|---|---|
| `storage` | Guardar tus opciones y tu lista de sitios bloqueados (`chrome.storage.sync`) y el contador local de elementos ocultados (`chrome.storage.local`). | Es la única forma de guardar la configuración de una extensión. |
| `declarativeNetRequestWithHostAccess` | Solo para los modos avanzados, apagados de inicio: «Solo Web» agrega `udm=14` a la URL de búsqueda y «Antes de la IA» agrega un rango de fechas (`tbs`). | Es la variante más acotada: solo actúa en los hosts de `host_permissions` y no agrega la advertencia «Bloquear contenido en cualquier página» que sí trae `declarativeNetRequest`. Las reglas son declarativas, así que la extensión nunca lee ni intercepta tu tráfico. |
| `host_permissions`: `https://www.google.<país>/*` (43 dominios) | Inyectar el script y el CSS que ocultan bloques en la página de resultados (y en la portada, por el botón de Modo IA), y permitir la redirección de los modos avanzados. | No hay comodín válido para «todos los dominios de país de Google» (`google.*` no es un patrón permitido), así que se listan uno por uno. No se pide acceso a ningún otro sitio. |

**Lo que no se pide:** `tabs`, `scripting`, `activeTab`, `notifications`, `webRequest`, `<all_urls>` ni acceso a otros sitios.

Para agregar un dominio de país: edita `GOOGLE_DOMAINS` en `tools/sync-manifest.mjs` y ejecuta `node tools/sync-manifest.mjs`. Agregar hosts nuevos hace que Chrome vuelva a pedir permiso a quienes ya la tienen instalada, así que conviene agruparlos en una sola versión.
