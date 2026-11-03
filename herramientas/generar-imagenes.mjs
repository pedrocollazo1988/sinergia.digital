#!/usr/bin/env node
// Genera las imagenes de categoria y las guarda en public/img/gen.
//
// Uso:  node herramientas/generar-imagenes.mjs [categoria ...]
//       node herramientas/generar-imagenes.mjs            # todas
//       node herramientas/generar-imagenes.mjs computo    # solo una
//
// Requiere Pillow (para pasar de JPEG a WebP):  python3 -m pip install pillow
// El JPEG que devuelve el generador se convierte a WebP porque pesa la mitad y
// la tienda ya usa WebP en todo el catalogo.
//
// Los prompts salen de lib/imagen-prompts.js, la misma fuente que usa el
// endpoint /api/imagen, para que no se separen.

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..");
const DESTINO = join(RAIZ, "public", "img", "gen");
const ANCHO = 480;
const ALTO = 360;
const SEED = 42;
// El plan gratis de Pollinations permite 1 imagen cada 45 s por IP. Se espera un
// poco mas para no chocar con el limite y, si aun asi responde 402, se reintenta
// leyendo el "Retry after Ns" que trae el propio error.
const ESPERA_BASE_MS = 48000;
const MAX_INTENTOS = 5;

const { PROMPTS, promptDe } = await import(join(RAIZ, "lib", "imagen-prompts.js"));

const pedidas = process.argv.slice(2);
const categorias = pedidas.length ? pedidas : Object.keys(PROMPTS);

mkdirSync(DESTINO, { recursive: true });

const dormir = ms => new Promise(r => setTimeout(r, ms));

// Pide la imagen y devuelve el JPEG, esperando y reintentando si el plan gratis
// responde 402 (limite de ritmo) o 503 (el generador esta saturado).
async function pedirImagen(url, etiqueta) {
  for (let intento = 1; intento <= MAX_INTENTOS; intento++) {
    let r;
    try {
      r = await fetch(url, {
        headers: { "Accept": "image/jpeg,image/*", "User-Agent": "SinergiaDigital/1.0" },
        signal: AbortSignal.timeout(120000)
      });
    } catch (e) {
      console.log(`    ${etiqueta}: ${e.message}, reintento (${intento}/${MAX_INTENTOS})`);
      await dormir(15000);
      continue;
    }
    if (r.ok) return Buffer.from(await r.arrayBuffer());
    if (r.status === 402 || r.status === 503 || r.status === 429) {
      let espera = ESPERA_BASE_MS;
      try {
        const j = await r.json();
        const m = /retry after (\d+)/i.exec(j?.error?.message || "");
        if (m) espera = (Number(m[1]) + 5) * 1000;
      } catch (e) {}
      console.log(`    ${etiqueta}: HTTP ${r.status}, espero ${Math.round(espera / 1000)} s (intento ${intento}/${MAX_INTENTOS})`);
      await dormir(espera);
      continue;
    }
    console.error(`    ${etiqueta}: HTTP ${r.status}`);
    return null;
  }
  console.error(`    ${etiqueta}: se agotaron los intentos`);
  return null;
}

for (const cat of categorias) {
  const prompt = promptDe(cat);
  if (!prompt) {
    console.error(`  ${cat}: categoría desconocida, se omite`);
    continue;
  }
  const destino = join(DESTINO, `${cat}.webp`);
  const url = "https://image.pollinations.ai/prompt/" + encodeURIComponent(prompt) +
    `?width=${ANCHO}&height=${ALTO}&nologo=true&model=flux&seed=${SEED}`;
  const jpg = await pedirImagen(url, cat);
  if (!jpg) continue;
  if (jpg.length < 1024) { console.error(`  ${cat}: imagen vacía`); continue; }
  const tmp = join("/tmp", `gen-${cat}.jpg`);
  writeFileSync(tmp, jpg);
  execFileSync("python3", ["-c",
    `from PIL import Image; Image.open("${tmp}").convert("RGB").save("${destino}","WEBP",quality=82,method=6)`
  ]);
  const kb = (readFileSync(destino).length / 1024).toFixed(1);
  console.log(`  ${cat}.webp  ${ANCHO}x${ALTO}  ${kb} KB`);
}
console.log(`\nListo. Imágenes en ${DESTINO}`);
