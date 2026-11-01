#!/usr/bin/env sh
# Comprueba vercel.json con el MISMO validador que usa Vercel al desplegar.
#
# Por que existe: el 2026-11-01 un despliegue fallo con "invalid-route-source-
# pattern". La causa no era la regla de reescritura, sino el patron de una
# cabecera: Vercel no admite "[0-9]+" ni ".*" sin agrupar dentro de "source".
# El error solo se ve en el despliegue, minutos despues de empujar.
#
# Uso:  sh check-vercel.sh
# Necesita node y el paquete @vercel/routing-utils (se instala solo, en .build/).
set -e

cd "$(dirname "$0")"

if ! command -v node >/dev/null 2>&1; then
  echo "check-vercel: no hay node; se omite la comprobacion." >&2
  exit 0
fi

DIR=".build/vercel-check"
if [ ! -d "$DIR/node_modules/@vercel/routing-utils" ]; then
  echo "check-vercel: instalando @vercel/routing-utils (una sola vez)..."
  mkdir -p "$DIR"
  (cd "$DIR" && npm init -y >/dev/null 2>&1 && npm install @vercel/routing-utils >/dev/null 2>&1) || {
    echo "check-vercel: no se pudo instalar; se omite la comprobacion." >&2
    exit 0
  }
fi

node - "$DIR" <<'JS'
const fs = require("fs");
const path = process.argv[2];
const { getTransformedRoutes } = require("./" + path + "/node_modules/@vercel/routing-utils");

const cfg = JSON.parse(fs.readFileSync("vercel.json", "utf8"));
const { rewrites = [], headers = [], redirects = [], ...rest } = cfg;
let errores = 0;

function revisar(etiqueta, clave, valor) {
  const r = getTransformedRoutes({ ...rest, [clave]: valor });
  if (r.error) {
    console.log("RECHAZA " + etiqueta + "\n   -> " + r.error.message);
    errores++;
  }
}

if (rewrites.length) revisar("rewrites", "rewrites", rewrites);
if (redirects.length) revisar("redirects", "redirects", redirects);
headers.forEach((h, i) => revisar("headers[" + i + "] " + h.source, "headers", [h]));

if (errores) {
  console.log("\ncheck-vercel: " + errores + " patron(es) que Vercel rechazaria.");
  console.log("Recuerda: 'source' usa path-to-regexp, no RegExp. Envuelve los");
  console.log("grupos de captura: '/public/logo-(.*)' si, '/public/logo-.*' no.");
  process.exit(1);
}
console.log("check-vercel: vercel.json correcto (" + rewrites.length + " reescritura(s), " +
            headers.length + " bloque(s) de cabeceras).");
JS
