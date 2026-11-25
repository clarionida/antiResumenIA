// Simula la evaluación de declarativeNetRequest (gana la mayor prioridad; allow > redirect
// en empate) y sigue redirecciones para verificar que no hay bucles.
//   node tests/dnr.test.cjs
const assert = require('assert');
globalThis.ARI_CONFIG = undefined;
require('../src/dnr-rules.js');
const { buildRules, cdMaxFromIso } = globalThis.ARI_DNR;

function evaluate(rules, url) {
  const matching = rules.filter((r) => new RegExp(r.condition.regexFilter, 'i').test(url));
  if (!matching.length) return null;
  matching.sort((a, b) => b.priority - a.priority || (a.action.type === 'allow' ? -1 : 1));
  return matching[0];
}
function navigate(rules, url) {
  const seen = [url];
  for (let i = 0; i < 10; i++) {
    const r = evaluate(rules, url);
    if (!r || r.action.type === 'allow') return { url, hops: seen.length - 1 };
    const u = new URL(url);
    for (const p of r.action.redirect.transform.queryTransform.addOrReplaceParams) u.searchParams.set(p.key, p.value);
    url = u.toString();
    seen.push(url);
  }
  throw new Error('BUCLE: ' + seen.join(' -> '));
}
const q = (u) => new URL(u).searchParams;
const base = { enabled: true, webOnly: false, beforeDateEnabled: false, beforeDate: '2023-01-01' };

assert.strictEqual(cdMaxFromIso('2023-01-01'), '12/31/2022');
assert.strictEqual(cdMaxFromIso('2024-03-01'), '2/29/2024');
assert.deepStrictEqual(buildRules({ ...base }), []);
assert.deepStrictEqual(buildRules({ ...base, enabled: false, webOnly: true }), []);

const urls = {
  web: 'https://www.google.com/search?q=gatos&hl=es',
  mx: 'https://www.google.com.mx/search?q=tacos',
  uk: 'https://www.google.co.uk/search?q=tea&sourceid=chrome&ie=UTF-8',
  images: 'https://www.google.com/search?q=gatos&udm=2',
  imagesOld: 'https://www.google.es/search?q=gatos&tbm=isch',
  news: 'https://www.google.com/search?q=gatos&tbm=nws',
  shopping: 'https://www.google.com/search?q=zapatos&udm=28',
  aiMode: 'https://www.google.com/search?q=x&udm=50',
  udm1: 'https://www.google.com/search?q=x&udm=1',
  udm140: 'https://www.google.com/search?udm=140&q=x',
  jobs: 'https://www.google.com/search?q=empleo&ibp=htl;jobs',
  withTbs: 'https://www.google.com/search?q=x&tbs=qdr:y',
  already: 'https://www.google.com/search?q=x&udm=14',
  maps: 'https://www.google.com/maps/search/pizza',
  other: 'https://www.example.com/search?q=x'
};

// --- Solo Web
let rules = buildRules({ ...base, webOnly: true });
for (const k of ['web', 'mx', 'uk']) {
  const r = navigate(rules, urls[k]);
  assert.strictEqual(q(r.url).get('udm'), '14', k);
  assert.strictEqual(r.hops, 1, k);
  assert.strictEqual(q(r.url).get('q'), q(urls[k]).get('q'));
}
for (const k of ['images', 'imagesOld', 'news', 'shopping', 'aiMode', 'udm1', 'udm140', 'jobs', 'already', 'maps', 'other']) {
  assert.strictEqual(navigate(rules, urls[k]).hops, 0, k);
}
assert.strictEqual(q(navigate(rules, urls.withTbs).url).get('tbs'), 'qdr:y');

// --- Antes de la IA
rules = buildRules({ ...base, beforeDateEnabled: true });
let r = navigate(rules, urls.web);
assert.strictEqual(q(r.url).get('tbs'), 'cdr:1,cd_max:12/31/2022');
assert.strictEqual(q(r.url).get('udm'), null);
assert.strictEqual(navigate(rules, urls.withTbs).hops, 0, 'respeta tbs del usuario');
assert.strictEqual(q(navigate(rules, urls.already).url).get('tbs'), 'cdr:1,cd_max:12/31/2022', 'udm=14 también recibe fecha');
for (const k of ['images', 'news', 'shopping', 'aiMode', 'jobs']) assert.strictEqual(navigate(rules, urls[k]).hops, 0, k);

// --- Ambos
rules = buildRules({ ...base, webOnly: true, beforeDateEnabled: true, beforeDate: '2022-06-15' });
r = navigate(rules, urls.web);
assert.strictEqual(r.hops, 1);
assert.strictEqual(q(r.url).get('udm'), '14');
assert.strictEqual(q(r.url).get('tbs'), 'cdr:1,cd_max:6/14/2022');
r = navigate(rules, urls.withTbs);
assert.strictEqual(q(r.url).get('udm'), '14');
assert.strictEqual(q(r.url).get('tbs'), 'qdr:y');
r = navigate(rules, urls.already);
assert.strictEqual(q(r.url).get('tbs'), 'cdr:1,cd_max:6/14/2022');
r = navigate(rules, 'https://www.google.com/search?tbs=cdr:1&q=x&udm=14');
assert.strictEqual(r.hops, 0);
for (const k of ['images', 'imagesOld', 'news', 'shopping', 'aiMode', 'jobs', 'maps']) assert.strictEqual(navigate(rules, urls[k]).hops, 0, k);

// IDs únicos
for (const set of [{ webOnly: true }, { beforeDateEnabled: true }, { webOnly: true, beforeDateEnabled: true }]) {
  const ids = buildRules({ ...base, ...set }).map((x) => x.id);
  assert.strictEqual(new Set(ids).size, ids.length);
}
console.log('DNR: todas las pruebas pasaron');
