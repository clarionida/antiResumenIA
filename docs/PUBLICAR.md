# Empaquetar y publicar en la Chrome Web Store

## 1. Antes de empaquetar
- [ ] `npm test` pasa.
- [ ] Hiciste las pruebas manuales de `docs/PRUEBAS.md` en Google real.
- [ ] Subiste `version` en `manifest.json`. Cada envío necesita un número mayor que el anterior.
- [ ] `DONATION_URL` en `src/config.js` es el link correcto.

## 2. Crear el .zip

```bash
bash tools/build-zip.sh
```

Genera `dist/buscar-sin-ia-<versión>.zip` con `manifest.json` en la raíz y solo los archivos de la extensión (`_locales`, `src`, `popup`, `options`, `ui` y los PNG de `icons`). No incluye tests, docs ni herramientas.

Sin bash (Windows), comprime a mano esas carpetas y archivos. `manifest.json` tiene que quedar en la **raíz** del zip, no dentro de otra carpeta.

Comprueba el zip: descomprímelo en una carpeta nueva y cárgalo con «Cargar extensión sin empaquetar». No debe dar errores.

## 3. Cuenta de desarrollador (una sola vez)
1. Entra a https://chrome.google.com/webstore/devconsole con la cuenta que publicará.
2. Paga la cuota única de registro (5 USD) y acepta el acuerdo.
3. Verifica tu correo de contacto. Es obligatorio para publicar.

## 4. Subir el elemento
1. En el panel, pulsa **Nuevo elemento** y sube el `.zip`.
2. **Ficha de Play Store** (Store listing): copia los textos de `docs/FICHA-CWS.md`.
   - Idioma predeterminado: Español. Agrega el inglés y el portugués en «Idiomas».
   - Categoría: «Productividad» (Productivity → Tools/Workflow).
   - Ícono de la tienda: `icons/icon128.png`.
   - Capturas: al menos 1 de 1280×800 o 640×400. Deben ser **reales**. La primera, «antes / después»:
     1. Busca algo con resumen de IA y anuncios. Con la ventana a unos 1280 px de ancho, **pausa** la extensión, recarga y captura solo la zona de resultados (desde el logo de Google hacia abajo, unos 860 px de ancho). En Mac: Cmd+Mayús+4 y arrastra.
     2. **Activa** la extensión, recarga y captura la misma zona, del mismo tamaño.
     3. `node tools/store-screenshot.cjs --antes antes.png --despues despues.png --lang es` → `store/captura-1-es.png`. Repite con `--lang en` para la ficha en inglés.
     4. Evita que se vea información personal (tu ubicación, tu foto de perfil, otras pestañas).
     Otras capturas sugeridas: el popup y la página de opciones.
   - Mosaico promocional pequeño (440×280): opcional, pero ayuda.
3. **Prácticas de privacidad**: llénala con `docs/FICHA-CWS.md`, sección «Prácticas de privacidad».
   - URL de la política de privacidad: publica `PRIVACY.md`, por ejemplo con GitHub Pages o el link directo al archivo en GitHub, y pega esa URL.
4. **Distribución**: Público, gratis, todos los países.
5. Pulsa **Enviar para revisión**. Por los permisos de host suele tardar de unos días a un par de semanas.

## 5. Actualizaciones
1. Sube `version`.
2. `bash tools/build-zip.sh`.
3. En el panel: el elemento → **Paquete** → **Subir paquete nuevo** → Enviar para revisión.
4. Si agregaste dominios de país en `host_permissions`, Chrome vuelve a pedir permiso a quienes ya la tienen instalada. Agrupa esos cambios en una sola versión.

## Causas frecuentes de rechazo
- Usar «Google» o sus logos como nombre principal → el nombre es «Buscar sin IA». «Para Google» solo va en las descripciones.
- Permisos sin justificar → usa los textos de `docs/FICHA-CWS.md`.
- Descripción con palabras clave repetidas o testimonios → la ficha propuesta no los tiene.
- Código remoto u ofuscado → no hay. Todo el código es local y legible.
