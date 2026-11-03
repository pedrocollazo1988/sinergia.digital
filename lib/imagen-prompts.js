// Prompts de las imagenes de categoria.
//
// Este archivo es la FUENTE UNICA del texto que se le pide al generador. Lo usan
// tanto el script de generacion por lotes (herramientas/generar-imagenes.mjs)
// como el endpoint /api/imagen, para que las imagenes se vean siempre igual.
//
// Reglas del prompt (importante para que no salgan cosas raras):
// - Se pide UNA sola foto de producto, centrada y sobre fondo liso. Sin fondo
//   liso, los generadores meten escenas, personas y texto.
// - Siempre se prohibe texto, marca de agua, logotipo y personas: los modelos
//   inventan palabras ilegibles y caras deformes.
// - El estilo es comun a todas (ESTILO) para que el carrusel se vea coherente.

// Sufijo comun: fija el aspecto de todas las imagenes.
const ESTILO = [
  "professional e-commerce product photograph",
  "single product centered in frame",
  "seamless light gray studio background",
  "soft diffused even lighting",
  "sharp focus, high detail, realistic",
  "no text, no watermark, no logo, no brand, no people, no hands"
].join(", ");

// Una entrada por imagen de la portada. La clave es el id de categoria que ya
// usa la tienda (CATEGORIA_IMAGEN en index.html), mas unos pocos bloques
// tematicos para las promos y los accesos rapidos.
const PROMPTS = {
  // --- Categorias del carrusel ---
  computo: "a modern silver laptop computer, open at a slight angle",
  telecom: "a white dual-band wifi router with antennas",
  impresion: "a white multifunction inkjet printer",
  seguridad: "a white dome CCTV surveillance camera",
  alarmas: "a wall-mounted alarm system control panel with keypad",
  electrodomesticos: "a stainless steel refrigerator",
  oficina: "a neat stack of white A4 paper reams",
  escolar: "a blue school backpack with notebooks",
  solar: "a blue photovoltaic solar panel",
  clima: "a white wall-mounted split air conditioner unit",
  herramientas: "a black and green cordless power drill",
  hogar: "a set of stainless steel cooking pots",

  // --- Bloques de portada (promos y accesos rapidos) ---
  "promo-energia": "a portable solar power station with a folded solar panel",
  "promo-ofertas": "a neat pile of colorful shopping bags and gift boxes",
  "promo-mayorista": "stacked brown cardboard shipping boxes in a warehouse",
  "quick-masvendido": "a modern tablet computer with a stylus",
  "quick-novedades": "a sleek modern smartphone and wireless earbuds",
  "quick-ofertas": "a bright yellow price tag shape on a plain surface"
};

// Solo estas se exponen por /api/imagen. El resto de PROMPTS lo usa unicamente
// el script de generacion por lotes, que corre en local.
const CATEGORIAS = [
  "computo", "telecom", "impresion", "seguridad", "alarmas",
  "electrodomesticos", "oficina", "escolar", "solar", "clima",
  "herramientas", "hogar"
];

function promptDe(categoria) {
  const base = PROMPTS[categoria];
  return base ? base + ", " + ESTILO : null;
}

module.exports = { PROMPTS, CATEGORIAS, ESTILO, promptDe };
