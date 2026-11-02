// Puente hacia la API del Banco Central de Cuba.
//
// Por que existe este archivo: la API del BC (api.bc.gob.cu) no garantiza
// cabeceras CORS, asi que el navegador puede bloquear la lectura directa. Al
// pedirla desde el mismo dominio (/api/tasas) no hay CORS que valga: el
// servidor hace la peticion y devuelve el JSON ya limpio. Ademas la CSP no
// necesita abrir connect-src hacia el BC.
//
// Es de solo lectura y no recibe datos del cliente: no se le pasa ningun
// parametro a la API del BC, asi que no hay forma de usarlo de rebote contra
// otro destino (nada de SSRF).

const BC_URL = "https://api.bc.gob.cu/v1/tasas-de-cambio/activas";
const TIMEOUT_MS = 8000;

module.exports = async (req, res) => {
  // Solo lectura.
  if (req.method !== "GET") {
    res.status(405).json({ error: "Método no permitido" });
    return;
  }

  const ctrl = new AbortController();
  const reloj = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const r = await fetch(BC_URL, {
      signal: ctrl.signal,
      headers: { "Accept": "application/json", "User-Agent": "SinergiaDigital/1.0" }
    });
    if (!r.ok) {
      res.status(502).json({ error: "El BC respondió " + r.status });
      return;
    }
    const datos = await r.json();
    const lista = Array.isArray(datos && datos.tasas) ? datos.tasas : null;
    if (!lista) {
      res.status(502).json({ error: "Respuesta del BC sin tasas" });
      return;
    }
    // Se devuelve solo lo que la tienda usa, sin metadatos internos.
    const tasas = lista.map(t => ({
      codigoMoneda: t.codigoMoneda,
      nombreMoneda: t.nombreMoneda,
      tasaOficial: t.tasaOficial,
      tasaPublica: t.tasaPublica,
      tasaEspecial: t.tasaEspecial,
      fechaDia: t.fechaDia
    }));
    // Cache corta en el borde: las tasas cambian una vez al dia.
    res.setHeader("Cache-Control", "public, max-age=0, s-maxage=1800, stale-while-revalidate=86400");
    res.status(200).json({ tasas: tasas, fuente: "bc.gob.cu" });
  } catch (e) {
    res.status(504).json({ error: "Sin respuesta del BC" });
  } finally {
    clearTimeout(reloj);
  }
};
