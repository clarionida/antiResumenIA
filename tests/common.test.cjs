// node tests/common.test.cjs
const assert = require('assert');
require('../src/config.js');
require('../src/common.js');
const U = globalThis.ARI;
const cases = {
  'pinterest.com': 'pinterest.com',
  '  HTTPS://www.Pinterest.com/pin/123?x=1 ': 'pinterest.com',
  'http://es.pinterest.com:8080/': 'es.pinterest.com',
  '*.reddit.com': 'reddit.com',
  'www.quora.com/': 'quora.com',
  '//medium.com/@user': 'medium.com',
  'ñandú.com': 'xn--and-6ma2c.com',
  'pinterest .com': 'pinterest.com',
  'user:pw@site.org/x': 'site.org',
  'localhost': null, '': null, 'http://': null, '1.2.3.4': null, 'foo..com': null, 'a_b.com': null, 'xyz': null
};
for (const [input, expected] of Object.entries(cases)) assert.strictEqual(U.normalizeDomain(input), expected, input);
assert.ok(U.hostMatches('es.pinterest.com', ['pinterest.com']));
assert.ok(U.hostMatches('pinterest.com', ['pinterest.com']));
assert.ok(!U.hostMatches('notpinterest.com', ['pinterest.com']));
assert.ok(!U.hostMatches('pinterest.com.mx', ['pinterest.com']));
assert.deepStrictEqual(U.sanitizeSites(['a.com', 'A.com', 'bad', 'b.org']), ['a.com', 'b.org']);
const s = U.sanitizeSettings({ hideAds: 'yes', webOnly: true, beforeDate: '2023-02-30', extra: 1 });
assert.strictEqual(s.hideAds, true); assert.strictEqual(s.webOnly, true);
assert.strictEqual(s.beforeDate, '2023-01-01'); assert.ok(!('extra' in s));
assert.strictEqual(U.sanitizeBeforeDate('1990-01-01'), '1998-09-04');
assert.strictEqual(U.normalizeLabel('  Resumen de IA · '), 'resumen de ia');
assert.strictEqual(U.normalizeLabel('AI Overview…'), 'ai overview');
console.log('common: todas las pruebas pasaron');
