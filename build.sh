#!/usr/bin/env sh
# Ensambla index.html a partir de los fragmentos de .build/.
# El orden importa: es el mismo que se ha usado siempre.
# Uso:  sh build.sh
set -e

cd "$(dirname "$0")"

FRAGMENTOS="
part01_head.html
part02_css.html
part03_body.html
part04_views_main.html
part05_views_content.html
part06_footer.html
part07_js_config.html
part08a_products.html
part08b_products.html
part09_content.html
part10_utils.html
part11_state_render.html
part12_cart_checkout.html
part13_pdf_msg.html
part14_seo_tools.html
part15_events.html
"

: > index.html
for f in $FRAGMENTOS; do
  if [ ! -f ".build/$f" ]; then
    echo "Falta el fragmento .build/$f" >&2
    exit 1
  fi
  cat ".build/$f" >> index.html
done

echo "index.html reconstruido: $(wc -c < index.html) bytes"
