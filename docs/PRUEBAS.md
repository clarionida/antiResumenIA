# Pruebas manuales

Hazlas en Google real después de cargar la extensión sin empaquetar. Para cada caso, marca ✅ o ❌ y anota la URL si algo falla.

**Preparación**
- Usa una ventana normal y otra de incógnito con la extensión permitida en incógnito (`chrome://extensions` → Detalles → «Permitir en incógnito»).
- Para ver Google en otro idioma, agrega `&hl=es` o `&hl=en` a la URL, o cámbialo en la configuración de Google.
- Los resúmenes de IA y los anuncios cambian según el país, la cuenta y la consulta. Si una búsqueda no muestra el bloque, prueba otra de la lista.

**Búsquedas sugeridas**
- Con resumen de IA: «qué es la fotosíntesis», «cómo quitar manchas de café», «diferencia entre virus y bacteria».
- Con anuncios: «seguro de auto», «vuelos baratos a Cancún», «comprar laptop».
- Con compras: «tenis para correr», «licuadora».
- Con «Otras preguntas»: «cuánto duerme un gato».
- Con videos: «cómo hacer pan casero», «tutorial excel tabla dinámica».
- Con foros: «mejor teclado mecánico reddit», «vale la pena comprar steam deck».
- Sin bloques: «site:wikipedia.org gato».

## 1. Resúmenes de IA (activado por defecto)
- [ ] Con la opción activada, el «Resumen de IA» no aparece y no se ve un parpadeo al cargar.
- [ ] Desactívala en el popup con la pestaña abierta: el resumen aparece sin recargar.
- [ ] Vuelve a activarla: desaparece sin recargar.
- [ ] Con `&hl=en`, «AI Overview» también desaparece.
- [ ] Con `&hl=pt-BR` en google.com.br, «Visão geral criada por IA» también desaparece.
- [ ] Si el resumen tarda en generarse, desaparece cuando termina de cargar.
- [ ] El primer resultado normal sigue visible y en su lugar, sin hueco arriba.

## 2. Modo IA (activado por defecto)
- [ ] La pestaña «Modo IA» no aparece en la barra de pestañas y no deja hueco.
- [ ] El botón de «Modo IA» junto a la caja de búsqueda no aparece, ni en resultados ni en la portada de google.com.
- [ ] Al desactivar la opción, ambos reaparecen sin recargar.
- [ ] Las demás pestañas (Todo, Imágenes, Videos, Noticias…) siguen visibles.

## 3. Anuncios (activado por defecto)
- [ ] Los anuncios de arriba («Patrocinado») no aparecen.
- [ ] Los anuncios de abajo de la página tampoco.
- [ ] El carrusel de productos patrocinados no aparece.
- [ ] Al desactivar la opción, los anuncios reaparecen sin recargar.

## 4. Compras (desactivado por defecto)
- [ ] Con la opción apagada, los bloques de productos se ven.
- [ ] Al activarla, desaparecen «Productos populares» o «Productos» y los carruseles de precios.
- [ ] El panel de información de la derecha (por ejemplo, de una marca) no desaparece entero.

## 5. «Otras preguntas de los usuarios» (desactivado)
- [ ] Al activarla, desaparece el bloque completo, incluido el encabezado.
- [ ] Si abriste una pregunta antes de activarla, el bloque desaparece igual y no se lleva resultados vecinos.
- [ ] Al desactivarla, reaparece.

## 6. Videos (desactivado)
- [ ] Al activarla, desaparecen los carruseles «Videos» y «Videos cortos».
- [ ] Un resultado normal de YouTube (con título azul) **sigue visible**.
- [ ] La pestaña «Videos» de la barra superior sigue visible.
- [ ] El panel de la derecha no desaparece entero aunque tenga una sección «Videos».

## 7. «Debates y foros» (desactivado)
- [ ] Al activarla, desaparece el bloque.
- [ ] La pestaña «Foros» de la barra superior sigue visible.

## 8. Mis sitios bloqueados
- [ ] Agrega `pinterest.com`: desaparecen los resultados de `www.pinterest.com`, `es.pinterest.com` y `ar.pinterest.com`.
- [ ] `pinterest.com.mx` **no** se bloquea si no está en la lista.
- [ ] Escribe `https://www.Quora.com/algo?x=1 `: se guarda como `quora.com`.
- [ ] Escribe `*.reddit.com`: se guarda como `reddit.com`.
- [ ] Escribe `hola`, `localhost` o `1.2.3.4`: se muestra un error claro y no se guarda nada.
- [ ] Escribe `google.com`: se rechaza.
- [ ] Repite un dominio: aparece «ya está en tu lista».
- [ ] Quita un dominio: sus resultados reaparecen sin recargar.
- [ ] Con varios resultados bloqueados seguidos, los resultados de otros sitios entre ellos siguen visibles.
- [ ] Todo funciona con el teclado: Tab hasta el campo, Enter para agregar, Tab hasta «Quitar» y Enter.

## 9. Modo «Solo Web» (avanzado)
- [ ] Al activarlo, una búsqueda nueva desde la barra de direcciones abre con `udm=14` (pestaña «Web») y no se recarga en bucle.
- [ ] Las pestañas Imágenes (`udm=2`), Noticias, Videos y Shopping funcionan igual.
- [ ] Google Maps y la portada de Google no cambian.
- [ ] Al pulsar «Todo», vuelve a «Web», como explica la advertencia.
- [ ] Al desactivarlo, las búsquedas nuevas vuelven a la vista normal.
- [ ] Con la extensión en pausa, no se agrega `udm=14`.

## 10. «Solo contenido anterior a la IA» (avanzado)
- [ ] Al activarlo, la búsqueda abre con un rango de fechas (en Herramientas se ve «Antes del 31/12/2022» o similar).
- [ ] Cambia la fecha a 1/6/2021: las búsquedas nuevas usan el 31/5/2021.
- [ ] Elige otro rango en «Herramientas» (por ejemplo, «Último año»): se respeta el tuyo y no hay bucle.
- [ ] Una fecha futura o anterior a 1998 no se acepta.
- [ ] Con «Solo Web» y el filtro activos a la vez, la URL lleva `udm=14` y `tbs=…` en una sola redirección.
- [ ] Imágenes y Noticias no reciben el filtro.

## Interruptor general y aviso en la página
- [ ] Al pausar en el popup, todo reaparece al instante en todas las pestañas abiertas de Google.
- [ ] Al reanudar, todo se vuelve a ocultar sin recargar.
- [ ] El aviso «Se ocultaron N elementos · Mostrar» aparece abajo a la izquierda solo si se ocultó algo.
- [ ] «Mostrar» enseña lo oculto con un borde punteado; «Ocultar» lo vuelve a ocultar.
- [ ] La «×» cierra el aviso en esa página.
- [ ] Con «Mostrar aviso en la página» apagado, el aviso no aparece.
- [ ] El aviso es legible con Google en tema oscuro y en tema claro.
- [ ] Con un lector de pantalla (por ejemplo, NVDA o VoiceOver), el aviso se anuncia y sus botones tienen nombre.

## Varios dominios de país
Repite 1, 2 y 3 en: google.com.mx · google.es · google.com.ar · google.com.co · google.cl · google.com.pe · google.com.br · google.co.uk · google.com.

## Scroll infinito y contenido dinámico
- [ ] Baja hasta el final de los resultados: los bloques que se cargan después también se ocultan, incluidos los de sitios bloqueados.
- [ ] Con todas las opciones activas, desplazarse se siente igual de fluido que sin la extensión.

## Popup y opciones
- [ ] El popup y la página de opciones siguen el tema claro u oscuro del sistema.
- [ ] Todo se puede usar solo con el teclado (Tab, Espacio, Enter) y el foco siempre es visible.
- [ ] Con Chrome en inglés o portugués, los textos aparecen en ese idioma.
- [ ] Exportar genera un `.json`. Importarlo en otro perfil restaura las opciones y los sitios.
- [ ] Importar un archivo cualquiera muestra un error y no cambia nada.
- [ ] «Restablecer valores predeterminados» pide confirmación, vuelve a los valores iniciales y no borra el contador.
- [ ] «Reiniciar contador» pide confirmación y pone el contador en 0.

## Donaciones
- [ ] Al instalar o actualizar no se abre ninguna pestaña.
- [ ] El link «¿Te sirve? Puedes invitarme un café ☕» abre Stripe en una pestaña nueva solo al hacer clic.
- [ ] Con el contador por debajo de 200, no aparece el mensaje de donación.
- [ ] Al llegar a 200, aparece una vez en el popup. «No volver a mostrar» lo cierra para siempre, también tras reiniciar Chrome.
- [ ] «Apoyar» abre el link y tampoco vuelve a aparecer el mensaje.
- [ ] No hay nada de donaciones en la página de Google.

## Privacidad
- [ ] En DevTools → Network, filtrando por la extensión, no hay peticiones de red.
- [ ] En `chrome://extensions` → Detalles, los permisos son solo «Leer y cambiar tus datos en www.google.com y otros sitios de Google» y nada más.
