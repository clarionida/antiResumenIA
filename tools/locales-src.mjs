// Fuente única de los textos de la interfaz. Genera _locales/*/messages.json:
//   node tools/locales-src.mjs
// Puedes editar directamente los messages.json si prefieres; este script solo
// evita errores de formato y mantiene las mismas claves en todos los idiomas.
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

// [clave, descripción, es, en, pt]
const M = [
  ['extName', 'Nombre en la Chrome Web Store y en chrome://extensions (máx. 75)', 'Buscar sin IA: oculta resúmenes de IA y anuncios para Google™', 'Search Without AI: hide AI Overviews and ads for Google™', 'Busca sem IA: oculte resumos de IA e anúncios para Google™'],
  ['extShortName', 'Nombre corto', 'Buscar sin IA', 'Search Without AI', 'Busca sem IA'],
  ['extDescription', 'Descripción corta (máx. 132)', 'Oculta resúmenes de IA, anuncios y bloques de relleno en Google. Ve solo resultados con links. Gratis y sin rastreo.', 'Hide AI Overviews, ads and filler blocks on Google. See just the results with links. Free, no tracking.', 'Oculte resumos de IA, anúncios e blocos extras no Google. Veja só os resultados com links. Grátis e sem rastreio.'],
  ['langCode', 'Código de idioma para <html lang>', 'es', 'en', 'pt'],
  ['actionTitle', 'Tooltip del ícono', 'Buscar sin IA', 'Search Without AI', 'Busca sem IA'],

  ['masterName', 'Interruptor general', 'Extensión activa', 'Extension on', 'Extensão ativada'],
  ['masterOnDesc', 'Estado activo', 'Limpiando tus búsquedas.', 'Cleaning up your searches.', 'Limpando suas buscas.'],
  ['masterOffDesc', 'Estado en pausa', 'En pausa: Google se ve como siempre.', 'Paused: Google looks as usual.', 'Pausada: o Google aparece como sempre.'],
  ['masterOptionsDesc', 'Descripción en opciones', 'Apágala para pausar todo sin perder tu configuración.', 'Turn it off to pause everything without losing your settings.', 'Desative para pausar tudo sem perder sua configuração.'],

  ['groupGeneral', '', 'General', 'General', 'Geral'],
  ['groupAi', '', 'Inteligencia artificial', 'Artificial intelligence', 'Inteligência artificial'],
  ['groupAdsShopping', '', 'Publicidad y compras', 'Ads and shopping', 'Publicidade e compras'],
  ['groupBlocks', '', 'Bloques que empujan los resultados', 'Blocks that push results down', 'Blocos que empurram os resultados'],
  ['groupSites', '', 'Mis sitios bloqueados', 'My blocked sites', 'Meus sites bloqueados'],
  ['groupAdvanced', '', 'Avanzado', 'Advanced', 'Avançado'],
  ['groupStats', '', 'Contador', 'Counter', 'Contador'],
  ['groupData', '', 'Tu configuración', 'Your settings', 'Sua configuração'],

  ['optAiOverviewName', '', 'Ocultar resúmenes de IA', 'Hide AI Overviews', 'Ocultar resumos de IA'],
  ['optAiOverviewDesc', '', 'Quita el bloque «Resumen de IA» que aparece arriba de los resultados.', 'Removes the “AI Overview” box shown above the results.', 'Remove o bloco “Visão geral criada por IA” que aparece acima dos resultados.'],
  ['optAiModeName', '', 'Ocultar el Modo IA', 'Hide AI Mode', 'Ocultar o Modo IA'],
  ['optAiModeDesc', '', 'Quita la pestaña y el botón de «Modo IA».', 'Removes the “AI Mode” tab and button.', 'Remove a guia e o botão “Modo IA”.'],
  ['optAdsName', '', 'Ocultar anuncios', 'Hide ads', 'Ocultar anúncios'],
  ['optAdsDesc', '', 'Quita los resultados patrocinados y los anuncios.', 'Removes sponsored results and ads.', 'Remove resultados patrocinados e anúncios.'],
  ['optShoppingName', '', 'Ocultar bloques de compras', 'Hide shopping blocks', 'Ocultar blocos de compras'],
  ['optShoppingDesc', '', 'Quita los carruseles de productos, precios y tiendas.', 'Removes product, price and store carousels.', 'Remove os carrosséis de produtos, preços e lojas.'],
  ['optPaaName', '', 'Ocultar «Otras preguntas de los usuarios»', 'Hide “People also ask”', 'Ocultar “As pessoas também perguntam”'],
  ['optPaaDesc', '', 'Quita la lista de preguntas que se despliegan.', 'Removes the list of expandable questions.', 'Remove a lista de perguntas que se expandem.'],
  ['optVideosName', '', 'Ocultar carruseles de videos', 'Hide video carousels', 'Ocultar carrosséis de vídeos'],
  ['optVideosDesc', '', 'Quita los carruseles de videos y de videos cortos.', 'Removes video and short-video carousels.', 'Remove os carrosséis de vídeos e de vídeos curtos.'],
  ['optImagesName', '', 'Ocultar bloques de imágenes', 'Hide image blocks', 'Ocultar blocos de imagens'],
  ['optImagesDesc', '', 'Quita los recuadros de imágenes entre los resultados. La pestaña «Imágenes» sigue funcionando.', 'Removes image boxes between results. The “Images” tab still works.', 'Remove os quadros de imagens entre os resultados. A guia “Imagens” continua funcionando.'],
  ['optForumsName', '', 'Ocultar «Debates y foros»', 'Hide “Discussions and forums”', 'Ocultar “Discussões e fóruns”'],
  ['optForumsDesc', '', 'Quita el bloque de conversaciones de Reddit, Quora y otros foros. Los resultados normales de esos sitios se quedan.', 'Removes the block of threads from Reddit, Quora and other forums. Regular results from those sites stay.', 'Remove o bloco de conversas do Reddit, Quora e outros fóruns. Os resultados normais desses sites continuam.'],
  ['optRelatedName', '', 'Ocultar «También se buscó»', 'Hide “People also search for”', 'Ocultar “Pesquisas relacionadas”'],
  ['optRelatedDesc', '', 'Quita las sugerencias de búsquedas relacionadas, al final de la página y dentro de los resultados.', 'Removes related-search suggestions, at the bottom of the page and inside results.', 'Remove as sugestões de pesquisas relacionadas, no fim da página e dentro dos resultados.'],
  ['optNoticeName', '', 'Mostrar aviso en la página', 'Show on-page notice', 'Mostrar aviso na página'],
  ['optNoticeDesc', '', 'Un aviso pequeño te dice cuántos elementos se ocultaron y te deja verlos.', 'A small notice tells you how many items were hidden and lets you see them.', 'Um aviso pequeno mostra quantos itens foram ocultados e permite vê-los.'],

  ['sitesIntro', '', 'Los resultados de estos sitios, y de sus subdominios, no aparecerán.', 'Results from these sites, and their subdomains, won’t appear.', 'Os resultados destes sites, e dos seus subdomínios, não vão aparecer.'],
  ['sitesInputLabel', '', 'Sitio para bloquear', 'Site to block', 'Site para bloquear'],
  ['sitesPlaceholder', '', 'por ejemplo, pinterest.com', 'for example, pinterest.com', 'por exemplo, pinterest.com'],
  ['sitesAdd', '', 'Agregar', 'Add', 'Adicionar'],
  ['sitesRemove', '', 'Quitar', 'Remove', 'Remover'],
  ['sitesRemoveAria', 'Etiqueta accesible del botón quitar', 'Quitar $SITE$', 'Remove $SITE$', 'Remover $SITE$', { site: '$1' }],
  ['sitesEmpty', '', 'No hay sitios bloqueados todavía.', 'No blocked sites yet.', 'Ainda não há sites bloqueados.'],
  ['sitesInvalid', '', 'Eso no parece un dominio. Prueba con algo como pinterest.com.', 'That doesn’t look like a domain. Try something like pinterest.com.', 'Isso não parece um domínio. Tente algo como pinterest.com.'],
  ['sitesGoogle', '', 'No se pueden bloquear los dominios de Google.', 'Google domains can’t be blocked.', 'Não é possível bloquear domínios do Google.'],
  ['sitesDuplicate', '', '$SITE$ ya está en tu lista.', '$SITE$ is already on your list.', '$SITE$ já está na sua lista.', { site: '$1' }],
  ['sitesAdded', '', 'Se agregó $SITE$.', 'Added $SITE$.', '$SITE$ foi adicionado.', { site: '$1' }],
  ['sitesRemoved', '', 'Se quitó $SITE$.', 'Removed $SITE$.', '$SITE$ foi removido.', { site: '$1' }],
  ['sitesLimit', '', 'La lista ya tiene el máximo de $MAX$ sitios.', 'The list already has the maximum of $MAX$ sites.', 'A lista já tem o máximo de $MAX$ sites.', { max: '$1' }],
  ['sitesCount', '', 'Sitios bloqueados: $COUNT$', 'Blocked sites: $COUNT$', 'Sites bloqueados: $COUNT$', { count: '$1' }],

  ['advancedIntro', '', 'Estas opciones cambian la dirección de tus búsquedas. Están apagadas de inicio; actívalas solo si sabes lo que hacen.', 'These options change the address of your searches. They start off; turn them on only if you know what they do.', 'Estas opções mudam o endereço das suas buscas. Começam desativadas; ative só se souber o que fazem.'],
  ['optWebOnlyName', '', 'Modo «Solo Web»', '“Web only” mode', 'Modo “Somente Web”'],
  ['optWebOnlyDesc', '', 'Abre tus búsquedas directamente en la vista «Web» de Google: solo resultados con links.', 'Opens your searches straight in Google’s “Web” view: just results with links.', 'Abre suas buscas direto na visualização “Web” do Google: só resultados com links.'],
  ['webOnlyWarning', '', 'Este modo también quita otros paneles, como la ficha de información, mapas, noticias destacadas o el clima. Imágenes, Noticias, Videos, Maps y Shopping siguen igual. Mientras esté activo, la pestaña «Todo» te regresa a «Web».', 'This mode also removes other panels, like info cards, maps, top stories or weather. Images, News, Videos, Maps and Shopping stay the same. While it’s on, the “All” tab takes you back to “Web”.', 'Este modo também remove outros painéis, como o painel de informações, mapas, principais notícias ou o clima. Imagens, Notícias, Vídeos, Maps e Shopping continuam iguais. Enquanto estiver ativo, a guia “Todas” volta para “Web”.'],
  ['optBeforeDateName', '', 'Solo contenido anterior a la IA', 'Only pre-AI content', 'Só conteúdo anterior à IA'],
  ['optBeforeDateDesc', '', 'Agrega un filtro de fecha para ver páginas publicadas antes del día que elijas.', 'Adds a date filter to show pages published before the day you choose.', 'Adiciona um filtro de data para ver páginas publicadas antes do dia que você escolher.'],
  ['beforeDateLabel', '', 'Mostrar resultados anteriores al', 'Show results from before', 'Mostrar resultados anteriores a'],
  ['beforeDateWarning', '', 'Google estima la fecha de cada página a su manera: algunas páginas sin fecha clara pueden desaparecer y otras más nuevas pueden colarse. Si eliges otro rango en «Herramientas», se respeta el tuyo.', 'Google estimates each page’s date its own way: some pages without a clear date may disappear and some newer ones may slip in. If you pick another range under “Tools”, yours is kept.', 'O Google estima a data de cada página do jeito dele: algumas páginas sem data clara podem sumir e outras mais novas podem aparecer. Se você escolher outro período em “Ferramentas”, o seu é mantido.'],
  ['beforeDateInvalid', '', 'Elige una fecha entre el 4 de septiembre de 1998 y hoy.', 'Pick a date between September 4, 1998 and today.', 'Escolha uma data entre 4 de setembro de 1998 e hoje.'],

  ['statsTitle', '', 'Elementos ocultados', 'Items hidden', 'Itens ocultados'],
  ['popupCounterLabel', 'Contador total acumulado (popup y opciones)', 'Elementos ocultados en total', 'Items hidden in total', 'Itens ocultados no total'],
  ['statsTotal', '', 'Total', 'Total', 'Total'],
  ['statsLocalNote', '', 'Este contador se guarda solo en tu navegador y nunca se envía a ningún lado.', 'This counter is stored only in your browser and is never sent anywhere.', 'Este contador fica salvo só no seu navegador e nunca é enviado para lugar nenhum.'],
  ['statsReset', '', 'Reiniciar contador', 'Reset counter', 'Zerar contador'],
  ['statsResetConfirm', '', '¿Reiniciar el contador a cero?', 'Reset the counter to zero?', 'Zerar o contador?'],
  ['typeAiOverview', '', 'Resúmenes de IA', 'AI Overviews', 'Resumos de IA'],
  ['typeAiMode', '', 'Modo IA', 'AI Mode', 'Modo IA'],
  ['typeAds', '', 'Anuncios', 'Ads', 'Anúncios'],
  ['typeShopping', '', 'Compras', 'Shopping', 'Compras'],
  ['typePeopleAlsoAsk', '', 'Otras preguntas', 'People also ask', 'Outras perguntas'],
  ['typeVideos', '', 'Videos', 'Videos', 'Vídeos'],
  ['typeImages', '', 'Imágenes', 'Images', 'Imagens'],
  ['typeForums', '', 'Debates y foros', 'Discussions and forums', 'Discussões e fóruns'],
  ['typeRelatedSearches', '', 'Búsquedas relacionadas', 'Related searches', 'Pesquisas relacionadas'],
  ['typeBlockedSites', '', 'Sitios bloqueados', 'Blocked sites', 'Sites bloqueados'],

  ['exportBtn', '', 'Exportar configuración', 'Export settings', 'Exportar configuração'],
  ['importBtn', '', 'Importar configuración', 'Import settings', 'Importar configuração'],
  ['resetBtn', '', 'Restablecer valores predeterminados', 'Restore defaults', 'Restaurar padrões'],
  ['dataDesc', '', 'Guarda tus opciones y tu lista de sitios en un archivo JSON, o cárgalas en otro navegador.', 'Save your options and site list to a JSON file, or load them in another browser.', 'Salve suas opções e sua lista de sites em um arquivo JSON, ou carregue em outro navegador.'],
  ['resetConfirm', '', 'Se restablecerán todas las opciones y se vaciará tu lista de sitios bloqueados. El contador no cambia. ¿Continuar?', 'All options will be restored and your blocked-site list will be emptied. The counter stays as is. Continue?', 'Todas as opções serão restauradas e sua lista de sites bloqueados será esvaziada. O contador não muda. Continuar?'],
  ['resetDone', '', 'Listo: se restablecieron los valores predeterminados.', 'Done: defaults restored.', 'Pronto: os padrões foram restaurados.'],
  ['importDone', '', 'Configuración importada.', 'Settings imported.', 'Configuração importada.'],
  ['importError', '', 'No se pudo leer el archivo. Usa un JSON exportado desde esta extensión.', 'Couldn’t read the file. Use a JSON file exported from this extension.', 'Não foi possível ler o arquivo. Use um JSON exportado desta extensão.'],
  ['saved', '', 'Guardado', 'Saved', 'Salvo'],

  ['optionsTitle', '', 'Opciones', 'Options', 'Opções'],
  ['optionsSubtitle', '', 'Elige qué quieres ocultar de tus búsquedas en Google. Los cambios se aplican al instante, también en las pestañas abiertas.', 'Choose what to hide from your Google searches. Changes apply instantly, even in open tabs.', 'Escolha o que ocultar nas suas buscas no Google. As mudanças valem na hora, inclusive nas abas abertas.'],
  ['popupMoreOptions', '', 'Más opciones', 'More options', 'Mais opções'],
  ['popupMainOptions', 'Título de la sección del popup', 'Qué ocultar', 'What to hide', 'O que ocultar'],

  ['freeNote', '', 'Todo es gratis. Donar es opcional.', 'Everything is free. Donating is optional.', 'Tudo é grátis. Doar é opcional.'],
  ['donateLink', '', '¿Te sirve? Puedes invitarme un café ☕', 'Find it useful? You can buy me a coffee ☕', 'Foi útil? Você pode me pagar um café ☕'],
  ['donatePromptTitle', '', '¡Ya van más de $COUNT$ elementos ocultados!', 'Over $COUNT$ items hidden already!', 'Já são mais de $COUNT$ itens ocultados!', { count: '$1' }],
  ['donatePromptBody', '', 'Esta extensión es gratis y lo seguirá siendo. Si te ha servido, puedes apoyarla con un café. Es totalmente opcional.', 'This extension is free and will stay free. If it’s helped you, you can support it with a coffee. Totally optional.', 'Esta extensão é grátis e vai continuar assim. Se ela te ajudou, você pode apoiar com um café. É totalmente opcional.'],
  ['donateSupport', '', 'Apoyar', 'Support', 'Apoiar'],
  ['donateDismiss', '', 'No volver a mostrar', 'Don’t show again', 'Não mostrar de novo'],
  ['newTabHint', 'Texto para lectores de pantalla', '(se abre en una pestaña nueva)', '(opens in a new tab)', '(abre em uma nova aba)'],
  ['reportLink', '', 'Reportar un problema', 'Report a problem', 'Relatar um problema'],
  ['reportHint', '', 'Se abre en GitHub, en una pestaña nueva. Necesitas una cuenta gratuita. Solo se envía lo que escribas tú.', 'Opens GitHub in a new tab. You need a free account. Only what you write is sent.', 'Abre o GitHub em uma nova aba. Você precisa de uma conta gratuita. Só é enviado o que você escrever.'],
  ['trademarkNote', 'Atribución de marca exigida por la Chrome Web Store', 'Extensión independiente, sin relación con Google LLC. Google es una marca comercial de Google LLC.', 'Independent extension, not affiliated with Google LLC. Google is a trademark of Google LLC.', 'Extensão independente, sem relação com a Google LLC. Google é uma marca comercial da Google LLC.'],
  ['madeBy', 'Crédito al pie del popup y de opciones', 'Hecho con cariño por Clariónida', 'Made with care by Clariónida', 'Feito com carinho por Clariónida'],
  ['privacyNote', '', 'Sin rastreo: no recopila ni envía ningún dato. Tus opciones se guardan con la sincronización de Chrome.', 'No tracking: no data is collected or sent. Your options are saved with Chrome sync.', 'Sem rastreio: nenhum dado é coletado ou enviado. Suas opções ficam salvas com a sincronização do Chrome.'],

  ['noticeRegion', 'Etiqueta accesible del aviso en Google', 'Buscar sin IA', 'Search Without AI', 'Busca sem IA'],
  ['noticeHiddenOne', '', 'Se ocultó 1 elemento', '1 item hidden', '1 item ocultado'],
  ['noticeHiddenMany', '', 'Se ocultaron $COUNT$ elementos', '$COUNT$ items hidden', '$COUNT$ itens ocultados', { count: '$1' }],
  ['noticeShowingOne', '', 'Mostrando 1 elemento oculto', 'Showing 1 hidden item', 'Mostrando 1 item oculto'],
  ['noticeShowingMany', '', 'Mostrando $COUNT$ elementos ocultos', 'Showing $COUNT$ hidden items', 'Mostrando $COUNT$ itens ocultos', { count: '$1' }],
  ['noticeShow', '', 'Mostrar', 'Show', 'Mostrar'],
  ['noticeHide', '', 'Ocultar', 'Hide', 'Ocultar'],
  ['noticeClose', '', 'Cerrar aviso', 'Close notice', 'Fechar aviso']
];

// Ajustes para portugués de Portugal (el resto se comparte con pt_BR).
const PT_PT = {
  extDescription: 'Oculte resumos de IA, anúncios e blocos extra no Google. Veja só os resultados com links. Grátis e sem rastreio.',
  optAiModeDesc: 'Remove o separador e o botão “Modo IA”.',
  webOnlyWarning: 'Este modo também remove outros painéis, como o painel de informações, mapas, notícias principais ou o tempo. Imagens, Notícias, Vídeos, Maps e Shopping continuam iguais. Enquanto estiver ativo, o separador “Tudo” volta para “Web”.',
  donateLink: 'É útil? Pode pagar-me um café ☕',
  donatePromptBody: 'Esta extensão é grátis e vai continuar assim. Se lhe foi útil, pode apoiá-la com um café. É totalmente opcional.',
  newTabHint: '(abre num novo separador)',
  optBeforeDateDesc: 'Adiciona um filtro de data para ver páginas publicadas antes do dia que escolher.',
  statsLocalNote: 'Este contador fica guardado só no seu navegador e nunca é enviado para lado nenhum.',
  privacyNote: 'Sem rastreio: nenhum dado é recolhido ou enviado. As suas opções ficam guardadas com a sincronização do Chrome.',
  sitesEmpty: 'Ainda não há sites bloqueados.',
  dataDesc: 'Guarde as suas opções e a sua lista de sites num ficheiro JSON, ou carregue-as noutro navegador.',
  importError: 'Não foi possível ler o ficheiro. Use um JSON exportado desta extensão.',
  optionsSubtitle: 'Escolha o que ocultar nas suas pesquisas no Google. As alterações aplicam-se de imediato, também nos separadores abertos.',
  masterOffDesc: 'Em pausa: o Google aparece como sempre.',
  masterOnDesc: 'A limpar as suas pesquisas.',
  masterOptionsDesc: 'Desative para pausar tudo sem perder a sua configuração.',
  langCode: 'pt-PT',
  extName: 'Pesquisa sem IA: oculte resumos de IA e anúncios para Google™',
  extShortName: 'Pesquisa sem IA',
  actionTitle: 'Pesquisa sem IA',
  noticeRegion: 'Pesquisa sem IA',
  reportHint: 'Abre o GitHub num novo separador. Precisa de uma conta gratuita. Só é enviado o que escrever.'
};

function build(col, overrides = {}) {
  const out = {};
  for (const [key, desc, ...rest] of M) {
    const values = rest.slice(0, 3);
    const ph = rest[3];
    const message = overrides[key] ?? values[col];
    const entry = { message };
    if (desc) entry.description = desc;
    if (ph) {
      entry.placeholders = {};
      for (const [name, content] of Object.entries(ph)) entry.placeholders[name] = { content };
    }
    out[key] = entry;
  }
  return out;
}

const targets = { es: build(0), en: build(1), pt_BR: build(2, { langCode: 'pt-BR' }), pt_PT: build(2, PT_PT) };
for (const [loc, data] of Object.entries(targets)) {
  const file = join(ROOT, '_locales', loc, 'messages.json');
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, JSON.stringify(data, null, 2) + '\n');
}

// Comprobaciones de longitud que exige la Chrome Web Store.
for (const [loc, data] of Object.entries(targets)) {
  const name = data.extName.message.length, desc = data.extDescription.message.length;
  if (name > 75 || desc > 132) throw new Error(`${loc}: nombre ${name}/75, descripción ${desc}/132`);
  console.log(`${loc}: nombre ${name}/75 · descripción ${desc}/132`);
}
