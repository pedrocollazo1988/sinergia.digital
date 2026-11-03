#!/usr/bin/env node
// Genera las fotos de PRODUCTO y las guarda en public/img (sobrescribe las
// fotos viejas de Wikimedia Commons). Los prompts salen de
// lib/imagen-productos.js.
//
// Uso:  node herramientas/generar-productos.mjs [fichero ...]
//       node herramientas/generar-productos.mjs            # todos
//       node herramientas/generar-productos.mjs sarten.webp # solo uno
//
// Es REANUDABLE: si un fichero ya tiene una version generada (se apunta en
// herramientas/.generado-productos.txt), se salta. Asi se puede cortar y volver a lanzar sin perder
// lo hecho, que importa porque el plan gratis de Pollinations solo deja UNA
// imagen cada 45 s por IP.
//
// Requiere Pillow:  python3 -m pip install pillow

import { readFileSync, writeFileSync, mkdirSync, existsSync, appendFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..");
const DESTINO = join(RAIZ, "public", "img");
// Fuera de public/ para no ensuciar lo que se despliega.
const REGISTRO = join(RAIZ, "herramientas", ".generado-productos.txt");
const ANCHO = 640;
const ALTO = 480;
const SEED = 7;
// Pollinations (plan gratis) permite 1 imagen cada 45 s por IP. Se espera un
// poco mas para no chocar y, si responde 402, se reintenta leyendo el
// "Retry after Ns" que trae el propio error.
const ESPERA_BASE_MS = 47000;
const MAX_INTENTOS = 6;

const { PROMPTS_PRODUCTO, promptProductoDe } = await import(join(RAIZ, "lib", "imagen-productos.js"));

mkdirSync(DESTINO, { recursive: true });

// Ficheros ya generados en ejecuciones anteriores.
const hechos = existsSync(REGISTRO)
  ? new Set(readFileSync(REGISTRO, "utf8").split("\n").map(s => s.trim()).filter(Boolean))
  : new Set();

const pedidas = process.argv.slice(2);
const ficheros = pedidas.length ? pedidas : Object.keys(PROMPTS_PRODUCTO);

const dormir = ms => new Promise(r => setTimeout(r, ms));

async function pedirImagen(url, etiqueta) {
  for (let intento = 1; intento <= MAX_INTENTOS; intento++) {
    let r;
    try {
      r = await fetch(url, {
        headers: { "Accept": "image/jpeg,image/*", "User-Agent": "SinergiaDigital/1.0" },
        signal: AbortSignal.timeout(120000)
      });
    } catch (e) {
      console.log(`  ${etiqueta}: ${e.message}, reintento (${intento}/${MAX_INTENTOS})`);
      await dormir(15000);
      continue;
    }
    if (r.ok) return Buffer.from(await r.arrayBuffer());
    // 402 = limite de ritmo del plan gratis (1 imagen / 45 s): hay que esperar.
    // 429/503 = el generador esta saturado: es pasajero, se reintenta pronto.
    if (r.status === 402 || r.status === 429 || r.status === 503) {
      let espera = r.status === 402 ? ESPERA_BASE_MS : 9000;
      try {
        const j = await r.json();
        const m = /retry after (\d+)/i.exec(j?.error?.message || "");
        if (m) espera = Math.max(espera, (Number(m[1]) + 6) * 1000);
      } catch (e) {}
      console.log(`  ${etiqueta}: HTTP ${r.status}, espero ${Math.round(espera / 1000)} s (intento ${intento}/${MAX_INTENTOS})`);
      await dormir(espera);
      continue;
    }
    console.error(`  ${etiqueta}: HTTP ${r.status}`);
    return null;
  }
  console.error(`  ${etiqueta}: se agotaron los intentos`);
  return null;
}

let ok = 0, saltados = 0, fallos = 0;
for (const fichero of ficheros) {
  const prompt = promptProductoDe(fichero);
  if (!prompt) { console.error(`  ${fichero}: sin prompt, se omite`); continue; }
  if (hechos.has(fichero)) { saltados++; continue; }

  const destino = join(DESTINO, fichero);
  const url = "https://image.pollinations.ai/prompt/" + encodeURIComponent(prompt) +
    `?width=${ANCHO}&height=${ALTO}&nologo=true&model=flux&seed=${SEED}`;
  const jpg = await pedirImagen(url, fichero);
  if (!jpg) { fallos++; continue; }
  if (jpg.length < 1024) { console.error(`  ${fichero}: imagen vacia`); fallos++; continue; }

  const tmp = join("/tmp", `prod-${fichero.replace(/[^a-z0-9]/gi, "_")}.jpg`);
  writeFileSync(tmp, jpg);
  execFileSync("python3", ["-c",
    `from PIL import Image; Image.open("${tmp}").convert("RGB").save("${destino}","WEBP",quality=82,method=6)`
  ]);
  appendFileSync(REGISTRO, fichero + "\n");
  const kb = (readFileSync(destino).length / 1024).toFixed(1);
  ok++;
  console.log(`  ${fichero}  ${ANCHO}x${ALTO}  ${kb} KB  (${ok + saltados}/${ficheros.length})`);
}
console.log(`\nListo: ${ok} generadas, ${saltados} ya estaban, ${fallos} fallos.`);
