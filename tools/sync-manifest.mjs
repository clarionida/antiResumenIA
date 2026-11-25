// Mantiene sincronizados host_permissions y content_scripts.matches del manifest.json
// con la lista de dominios de búsqueda de Google de abajo.
//   node tools/sync-manifest.mjs
// Para agregar un país: añade su dominio a GOOGLE_DOMAINS y vuelve a ejecutar.
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

export const GOOGLE_DOMAINS = [
  // Global / Estados Unidos
  'google.com',
  // Hispanoamérica, España y Guinea Ecuatorial
  'google.com.mx', 'google.es', 'google.com.ar', 'google.com.co', 'google.co', 'google.cl',
  'google.com.pe', 'google.co.ve', 'google.com.ec', 'google.com.bo', 'google.com.py',
  'google.com.uy', 'google.co.cr', 'google.com.pa', 'google.com.gt', 'google.hn',
  'google.com.sv', 'google.com.ni', 'google.com.do', 'google.com.pr', 'google.com.cu',
  'google.gq', 'google.ad',
  // Lusófonos
  'google.com.br', 'google.pt', 'google.co.ao', 'google.co.mz', 'google.cv',
  // Otros con muchos hispanohablantes o de uso frecuente
  'google.co.uk', 'google.ca', 'google.com.au', 'google.co.nz', 'google.ie', 'google.co.in',
  'google.co.za', 'google.de', 'google.fr', 'google.it', 'google.nl', 'google.be',
  'google.ch', 'google.at'
];

const file = join(ROOT, 'manifest.json');
const manifest = JSON.parse(readFileSync(file, 'utf8'));
const patterns = GOOGLE_DOMAINS.map((d) => `https://www.${d}/*`);
manifest.host_permissions = patterns;
manifest.content_scripts[0].matches = patterns;
writeFileSync(file, JSON.stringify(manifest, null, 2) + '\n');
console.log(`manifest.json: ${patterns.length} dominios`);
