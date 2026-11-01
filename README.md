# Sinergia Digital — Tienda online (Cuba)

Tienda de tecnología lista para producción: catálogo, carrito, checkout por pasos,
ticket en PDF, envío del pedido por WhatsApp y Telegram, dimensionador solar,
calculadora de BTU, SEO técnico y cabeceras de seguridad.

Todo el front-end vive en **un solo archivo** `index.html` (HTML5 + CSS + JS vanilla,
sin frameworks). La única librería externa es **jsPDF 2.5.1** desde cdnjs, con SRI,
y solo se usa para el ticket; si no carga, el ticket cae en `window.print()`.

---

## 1. Archivos entregados

| Archivo | Para qué sirve |
|---|---|
| `index.html` | La tienda completa (HTML + CSS + JS embebidos). |
| `robots.txt` | Reglas de rastreo y referencia al sitemap. |
| `sitemap.xml` | 102 URLs (páginas, 12 categorías y 77 productos). |
| `.htaccess` | Cabeceras de seguridad, HTTPS, caché y rutas limpias para **Apache** (Hostinger/cPanel). |
| `nginx.conf` | Lo mismo para **nginx** (VPS propio). |
| `vercel.json` | Cabeceras, rewrites y caché para **Vercel/Netlify**. |

---

## 2. Guía de despliegue

### Opción A — Hostinger / cPanel (Apache)
1. Entra en **Administrador de archivos** y abre `public_html/`.
2. Sube `index.html`, `robots.txt`, `sitemap.xml` y `.htaccess`.
   - El `.htaccess` empieza por punto: activa "mostrar archivos ocultos" para verlo.
3. En **SSL/TLS**, activa el certificado Let's Encrypt gratuito.
4. Fuerza HTTPS desde el panel (o confía en la regla del `.htaccess`).
5. Comprueba: `https://tudominio/robots.txt` y `https://tudominio/sitemap.xml`.

### Opción B — Vercel (recomendada si quieres CI/CD con Git)
1. Sube el repo a GitHub y conéctalo en Vercel (**Add New → Project**).
2. Framework Preset: **Other**. Build command: *(vacío)*. Output: `.`
3. Vercel detecta `vercel.json` y aplica cabeceras, rewrites y caché.
4. El dominio queda en HTTPS automático.

### Opción C — Netlify
1. **Add new site → Import an existing project**, elige el repo.
2. Build command: *(vacío)*. Publish directory: `.`
3. Copia las cabeceras de `vercel.json` a un archivo `_headers` en la raíz:
   ```
   /*
     Strict-Transport-Security: max-age=31536000; includeSubDomains
     X-Frame-Options: DENY
     X-Content-Type-Options: nosniff
     Referrer-Policy: strict-origin-when-cross-origin
     Permissions-Policy: geolocation=(), microphone=(), camera=(), payment=(), usb=()
   ```
   Y las redirecciones a `_redirects`: `/*  /index.html  200`

### Opción D — nginx (VPS propio)
1. Copia los archivos a `/var/www/sinergia/`.
2. Incluye los bloques de `nginx.conf` en tu `server {}`.
3. `sudo certbot --nginx -d tudominio -d www.tudominio`
4. `sudo nginx -t && sudo systemctl reload nginx`

---

## 3. Valores que DEBES reemplazar en `CONFIG`

Abre `index.html`, busca `REEMPLAZAR` (hay 28 marcadores) y cambia:

### Datos del negocio (`CONFIG.negocio`)
- `nombre`, `eslogan`
- `nit` — NIT real de la empresa
- `direccion`, `municipio`, `provincia`
- `telefono` (`+53XXXXXXXX`) y `whatsapp` (**solo dígitos**, sin `+` ni espacios)
- `telegramUsuario` (sin `@`)
- `correo`
- `horario` y `horarioCorto`
- `coordenadas` — latitud y longitud de la tienda (para el mapa)
- `sitio` — dominio final, con `https://`
- `redes.facebook`, `redes.instagram`, `redes.telegram`

### Tasas de cambio (`CONFIG.tasas`)
- `usdCup` — 1 USD en CUP
- `usdtUsd` — 1 USDT en USD
- `fecha` — fecha de actualización (`YYYY-MM-DD`), se muestra en la web
- `comisionPago` — recargo por gestión de pago (`0` para desactivarlo)

### Envíos (`CONFIG.envios`)
- `costo` y `plazo` de cada provincia. Los municipios heredan el costo de su provincia.

### Pasarelas de pago (`CONFIG.pagos`)
- **Tropipay**: `usuario`, `enlace`
- **Ebioro**: `usuario`, `cuenta`
- **Antillas Capital**: `cuenta`, `titular`, `banco`
- **QvaPay**: `usuario`, `enlace`
- **Enzona**: `usuario`, `telefono`
- **Transfermóvil**: `tarjeta`, `titular`
- **USDT**: `walletTRC20`, `walletBEP20`
- **Visa/Mastercard**: `enlaceCheckout` (checkout alojado de la pasarela)

### Cupones (`CONFIG.cupones`)
- `BIENVENIDA10` (10 %), `ENVIOGRATIS` (envío gratis desde 150 USD), `SOLAR5` (5 % en solar).
  Cámbialos o quítalos antes de publicar.

### Otros
- `index.html`: `<link rel="canonical">`, `og:url`, `og:image`, los `hreflang` y el `@id`
  del JSON-LD usan `https://sinergiadigital-pedrocollazo1988.vercel.app` — cámbialo por tu dominio.
- `robots.txt` y `sitemap.xml`: mismo dominio.
- Las imágenes de producto apuntan a **Unsplash**. Para producción, súbelas a tu propio
  hosting (mejora privacidad, velocidad y evita dependencias externas).

---

## 4. Cómo funciona

- **Navegación** con History API y URLs limpias (`/catalogo`, `/producto/p01`, `/ofertas`…).
  Cada vista actualiza `<title>`, meta description y canonical al vuelo.
- **Persistencia** en `localStorage` dentro de `try/catch`: carrito, favoritos,
  comparador, moneda y tema. Nunca se guardan datos sensibles.
- **Checkout en 4 pasos**: datos → entrega (domicilio / recogida / mensajería) → pago → confirmación.
- **Número de pedido** con formato `SD-AAAAMMDD-0001`, estado inicial *Pendiente de pago*.
- **Ticket** en PDF con jsPDF: logo, datos del negocio, cliente, tabla de productos,
  envío, total en USD y CUP, método de pago, instrucciones y QR con el número de pedido.
  Botones: *Descargar PDF*, *Imprimir* y *Copiar resumen*.
- **Mensajería**: WhatsApp (`wa.me`), Telegram (`t.me/share`) y Web Share API en móvil
  para adjuntar el PDF si el navegador lo permite.
- **Herramientas Cuba**: dimensionador solar (equipos + horas de uso → paneles, inversor
  y baterías del catálogo) y calculadora de BTU para elegir el split.

---

## 5. Checklist de SEO off-page

- [ ] Alta en **Google Search Console** y envío del `sitemap.xml`.
- [ ] Alta en **Bing Webmaster Tools** (importa desde GSC).
- [ ] Ficha en **Google Business Profile** con dirección, horario, fotos y categoría.
- [ ] Consistencia **NAP** (Nombre, Dirección, Teléfono) en todas las menciones.
- [ ] Perfiles en **Facebook, Instagram y Telegram** enlazados desde el pie.
- [ ] Pide **reseñas** a clientes satisfechos (Google, Facebook).
- [ ] Consigue **enlaces** de directorios cubanos, cámaras de comercio, prensa local
      y colaboraciones con negocios complementarios.
- [ ] Publica guías útiles ("Cómo dimensionar un sistema solar en Cuba",
      "Qué aire acondicionado comprar según tu cuarto") y enlázalas desde la tienda.
- [ ] Vigila Core Web Vitals en **PageSpeed Insights** y corrige regresiones.

---

## 6. Limitaciones honestas de una tienda en un solo archivo

Esto es importante y conviene tenerlo claro antes de invertir en SEO:

1. **El HTML de producto lo genera JavaScript.** Google renderiza JS, pero con retraso
   y menos fiabilidad. Solo el catálogo por categorías, los textos clave y el menú están
   en HTML estático (y en un `<noscript>`). Las fichas de producto no.
2. **El contenido no se prerenderiza.** Los buscadores ven un HTML casi vacío en
   `/producto/...` la primera vez que rastrean.
3. **Sin backend no hay pagos ni stock reales.** El front-end solo *muestra* instrucciones
   y guarda la referencia. La confirmación del pago la hace una persona o un backend.
4. **Sin backend no hay pedidos persistentes.** Si el cliente borra el navegador, pierde
   su resumen (el número de pedido y el PDF sí quedan si los guardó o los envió por chat).

**Recomendación**: cuando el negocio lo justifique, migra a un framework con
**prerenderizado o SSR** (Next.js, Astro, Nuxt) y añade un backend ligero para pedidos,
stock y verificación de pagos. El `CONFIG`, el catálogo y las utilidades se trasladan casi
tal cual; lo que ganas es SEO real por producto y pedidos que no se pierden.

---

## 7. Autoevaluación

### Seguridad

| Control | Estado |
|---|---|
| CSP restrictiva (`default-src 'self'`, orígenes mínimos) | ✅ en `<meta>` y como cabecera en `.htaccess` / `nginx.conf` / `vercel.json` |
| `X-Frame-Options` / `frame-ancestors` | ✅ como cabecera de servidor (en `<meta>` no funcionan) |
| HSTS | ✅ en las tres configuraciones de servidor |
| `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy` | ✅ |
| Sin `innerHTML` con datos del usuario | ✅ se usa `textContent` / `createElement` / `escapeHTML` |
| Validación y saneado de campos (teléfono, correo, longitudes) | ✅ regex + `normalizarTelefonoCuba` |
| Filtrado de parámetros de URL | ✅ se valida contra listas blancas |
| Honeypot antispam + rate limit en cliente | ✅ campo trampa + `puedeEnviar()` |
| Confirmación antes de acciones críticas | ✅ (vaciar carrito, confirmar pedido) |
| Enlaces externos con `rel="noopener noreferrer"` | ✅ |
| Script externo con `integrity` + `crossorigin` | ✅ jsPDF 2.5.1 con SRI |
| Sin datos sensibles ni secretos en el código | ✅ `localStorage` solo guarda carrito, favoritos, tema y moneda |
| Nunca se piden datos de tarjeta | ✅ aviso visible; Visa/MC solo por checkout alojado |
| Aviso de que el front-end no valida pagos | ✅ en Métodos de pago, checkout y ticket |

**Aviso**: `'unsafe-inline'` es necesario porque el CSS y el JS van embebidos en `index.html`.
Para eliminarlo, separa los estilos y el script a archivos propios y usa `nonce` o `hash`.
Un CSP con `'unsafe-inline'` sigue bloqueando orígenes externos, pero no es el techo de
seguridad; es el mejor equilibrio posible en un archivo único.

### SEO

| Elemento | Estado |
|---|---|
| `title` < 60 caracteres | ✅ 47 |
| `meta description` < 160 | ✅ 154 |
| `lang="es-CU"`, canonical, hreflang, robots, theme-color | ✅ |
| Open Graph + Twitter Cards | ✅ |
| JSON-LD: Organization, Store, WebSite + SearchAction, BreadcrumbList, FAQPage | ✅ |
| JSON-LD: Product + Offer (precio, moneda, disponibilidad, valoración) | ✅ al abrir una ficha |
| Un solo H1 visible, jerarquía H2/H3 | ✅ (el H1 se mueve a la vista activa) |
| HTML semántico + `alt` en todas las imágenes | ✅ |
| Contenido estático rastreable + `<noscript>` con enlaces | ✅ |
| URLs limpias con History API y metas dinámicos | ✅ |
| Core Web Vitals: lazy loading, preconnect, sin layout shift | ✅ dimensiones fijas y precarga del hero |
| `robots.txt` + `sitemap.xml` | ✅ |

**Lo que falta para un SEO de primera**: prerenderizado de las fichas de producto
(ver sección 6).
