// Genera la imagen de una categoria con Pollinations.ai.
//
// Por que existe este archivo: Pollinations es gratis y no pide clave, pero si
// el navegador la llamara directamente habria que abrir la CSP a un dominio
// externo y el texto del prompt viajaria desde el cliente (cualquiera podria
// cambiarlo y usar el servicio como generador libre). Aqui el prompt lo pone el
// servidor desde una lista cerrada (lib/imagen-prompts.js) y el cliente solo
// manda el id de categoria.
//
// Cache: la respuesta se marca como inmutable un ano. Cada combinacion
// categoria+tamano+semilla es una URL distinta, asi que Vercel la guarda en su
// CDN y a partir de la segunda visita no se vuelve a llamar a Pollinations. Eso
// es lo que hace que salga "ligero": se genera una vez, no en cada visita.
//
// Las imagenes que sirve la tienda estan ademas pre-generadas en public/img/gen
// (ver herramientas/generar-imagenes.mjs), asi que en produccion normal este
// endpoint casi no se usa: es la via para regenerar o para probar prompts.

const { CATEGORIAS, promptDe } = require("../lib/imagen-prompts.js");

const BASE = "https://image.pollinations.ai/prompt/";
const TIMEOUT_MS = 60000; // el modelo tarda; 60 s es el tope razonable en Vercel
const MAX_LADO = 1024;    // tope de tamano: evita que alguien pida 4000x4000

module.exports = async (req, res) => {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Método no permitido" });
    return;
  }

  const cat = String(req.query.cat || "");
  if (!CATEGORIAS.includes(cat)) {
    res.status(400).json({ error: "Categoría desconocida", categorias: CATEGORIAS });
    return;
  }

  const prompt = promptDe(cat);
  const w = clamp(req.query.w, 480);
  const h = clamp(req.query.h, 360);
  // Semilla fija por defecto: la misma categoria da siempre la misma imagen.
  const seed = clamp(req.query.seed, 42);

  const url = BASE + encodeURIComponent(prompt) +
    `?width=${w}&height=${h}&nologo=true&model=flux&seed=${seed}`;

  const ctrl = new AbortController();
  const reloj = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const r = await fetch(url, {
      signal: ctrl.signal,
      headers: { "Accept": "image/jpeg,image/*", "User-Agent": "SinergiaDigital/1.0" }
    });
    if (!r.ok) {
      res.status(502).json({ error: "El generador no respondió", estado: r.status });
      return;
    }
    const buf = Buffer.from(await r.arrayBuffer());
    if (buf.length < 1024) {
      res.status(502).json({ error: "El generador devolvió una imagen vacía" });
      return;
    }
    res.setHeader("Content-Type", r.headers.get("content-type") || "image/jpeg");
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    res.setHeader("X-Imagen-Categoria", cat);
    res.status(200).send(buf);
  } catch (e) {
    const corte = e.name === "AbortError";
    res.status(504).json({ error: corte ? "El generador tardó demasiado" : "Fallo al generar la imagen" });
  } finally {
    clearTimeout(reloj);
  }
};

// Lee un entero de la query, con tope y valor por defecto.
function clamp(valor, porDefecto) {
  const n = parseInt(valor, 10);
  if (!Number.isFinite(n) || n <= 0) return porDefecto;
  return Math.min(n, MAX_LADO);
}
