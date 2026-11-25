#!/usr/bin/env bash
# Empaqueta la extensión para subirla a la Chrome Web Store.
#   bash tools/build-zip.sh      → dist/antiresumen-ia-<versión>.zip
# Solo incluye los archivos que usa la extensión (nada de tests, docs ni tools).
set -euo pipefail
cd "$(dirname "$0")/.."
VERSION=$(node -p "require('./manifest.json').version")
OUT="dist/antiresumen-ia-${VERSION}.zip"
mkdir -p dist
rm -f "$OUT"
node -e "JSON.parse(require('fs').readFileSync('manifest.json','utf8'))"   # manifest válido
for f in _locales/*/messages.json; do node -e "JSON.parse(require('fs').readFileSync('$f','utf8'))"; done
zip -r -X -q "$OUT" manifest.json _locales src popup options ui \
  icons/icon16.png icons/icon32.png icons/icon48.png icons/icon128.png \
  -x '*.DS_Store' -x '*/.*'
echo "Listo: $OUT"
unzip -l "$OUT" | tail -n 1
