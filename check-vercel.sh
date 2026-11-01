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

// Simulacion de rutas: comprueba que los archivos reales NO queden capturados
// por la reescritura y que las rutas de la app si lo esten.
const reales = fs.readdirSync(".").filter(f => /\.(html|txt|xml)$/.test(f)).map(f => "/" + f);
const existentes = new Set([...reales, "/", "/public/img/x.webp"]);
const rutas = [
  ...reales.map(f => [f, "ARCHIVO"]),
  ["/public/img/x.webp", "ARCHIVO"],
  ["/catalogo", "APP"],
  ["/producto/p48", "APP"],
  ["/metodos-pago", "APP"],
];
let malos = 0;
console.log("\n  ruta                             esperado  resultado");
for (const [ruta, esperado] of rutas) {
  let salida = "404";
  const pasos = (getTransformedRoutes({ ...rest, rewrites }).routes || []);
  for (const x of pasos) {
    const m = new RegExp(x.src).exec(ruta);
    if (!m) continue;
    if (x.status) { salida = x.status + " -> " + (x.headers.Location || "").replace("$1", m[1] || ""); break; }
    if (x.handle === "filesystem") {
      // El sistema de archivos tiene prioridad: si el archivo existe, se sirve
      // y se detiene el procesado del resto de reglas.
      if (existentes.has(ruta)) { salida = "ARCHIVO"; break; }
      continue;
    }
    if (x.dest) { salida = "APP -> " + x.dest; break; }
  }
  const tipo = salida.startsWith("ARCHIVO") ? "ARCHIVO" : salida.startsWith("APP") ? "APP" : "OTRO";
  const ok = tipo === esperado;
  if (!ok) malos++;
  console.log("  " + (ok ? "ok  " : "MAL ") + ruta.padEnd(32) + esperado.padEnd(10) + salida);
}
if (malos) {
  console.log("\ncheck-vercel: " + malos + " ruta(s) con comportamiento inesperado.");
  console.log("Sospecha habitual: 'cleanUrls': true convierte /pagina.html en un 308");
  console.log("a /pagina, que ya no existe como archivo y cae en la reescritura.");
  process.exit(1);
}
console.log("\ncheck-vercel: rutas correctas (los archivos reales se sirven como tales).");
JS
