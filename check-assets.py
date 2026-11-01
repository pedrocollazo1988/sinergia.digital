#!/usr/bin/env python3
"""Comprueba que todo recurso local referenciado en el HTML existe de verdad.

Por que existe: el 2026-11-01 el CSS referenciaba
"/public/logo-mark-claro-128.png", que nunca se versiono. Como la reescritura
de Vercel excluye "public/", el archivo ausente devolvia un 404 en vez de caer
en index.html. Un 404 de un recurso propio rompe el logotipo en el footer y en
el modo oscuro, y no se ve en local si uno no mira la pestana de red.

Tambien comprueba que las variantes 1x y 2x de un mismo logo compartan
proporcion: si el WebP de 128 px es cuadrado y el PNG de 256 px no lo es, el
logotipo cambia de forma segun cual cargue el navegador.

Uso:  python3 check-assets.py        (codigo 1 si hay fallos)
"""
import os
import re
import subprocess
import sys

RAIZ = os.path.dirname(os.path.abspath(__file__))


def leer(nombre):
    ruta = os.path.join(RAIZ, nombre)
    if not os.path.exists(ruta):
        return None
    with open(ruta, encoding="utf-8") as f:
        return f.read()


def referencias(html):
    """Saca todas las rutas locales citadas en el HTML.

    No basta con mirar src/href/url(): el catalogo guarda las imagenes en
    propiedades JS (`img:"/public/img/x.webp"`, `gal:[...]`), asi que una
    revision limitada a los atributos HTML deja pasar la mayoria. Aqui se
    recogen TODAS las cadenas entrecomilladas que empiecen por "/", mas las
    de url() y srcset.
    """
    refs = set()
    for m in re.finditer(r'''["'`](/(?!/)[^"'`\s]*)["'`]''', html):
        refs.add(m.group(1))
    for m in re.finditer(r'url\(["\']?(/(?!/)[^"\')?#\s]+)', html):
        refs.add(m.group(1))
    for m in re.finditer(r'srcset="([^"]+)"', html):
        for parte in m.group(1).split(","):
            url = parte.strip().split()[0]
            if url.startswith("/"):
                refs.add(url.split("?")[0])
    # Fuera anclas, y sin la query ni el fragmento.
    return {r.split("#")[0].split("?")[0] for r in refs if r != "/"}


def versionados():
    """Devuelve el conjunto de archivos que git va a desplegar, o None.

    Es la comprobacion que importa: el 404 del 2026-11-01 lo causo un PNG que
    estaba en el disco pero NO en git, asi que nunca llego al despliegue. Mirar
    el sistema de archivos no lo habria detectado.
    """
    try:
        salida = subprocess.run(
            ["git", "ls-files"], cwd=RAIZ, capture_output=True, text=True, check=True
        ).stdout
    except (OSError, subprocess.CalledProcessError):
        return None
    return {linea.strip() for linea in salida.splitlines() if linea.strip()}


def main():
    fallos = 0

    # 1) Recursos de /public/ que no existen en el disco.
    referenciados = set()
    for pagina in ("index.html", "creditos.html"):
        html = leer(pagina)
        if html:
            referenciados |= referencias(html)

    publicos = sorted(r for r in referenciados if r.startswith("/public/"))

    # Preferimos comprobar contra git: es lo que se despliega de verdad.
    en_git = versionados()
    if en_git is None:
        print("aviso: no es un repositorio git; se comprueba contra el disco")
        existe = lambda r: os.path.exists(os.path.join(RAIZ, r.lstrip("/")))
        etiqueta = "no existe en el disco"
    else:
        existe = lambda r: r.lstrip("/") in en_git
        etiqueta = "no esta versionado (no llegara al despliegue)"

    ausentes = [r for r in publicos if not existe(r)]
    print(f"recursos en /public/: {len(publicos)} referenciados, {len(ausentes)} ausentes")
    for r in ausentes:
        print(f"  FALTA {r}  ({etiqueta}; el navegador recibira un 404)")
    fallos += len(ausentes)

    # 1b) Archivos bajo public/ presentes en el disco pero sin versionar: no
    #     rompen nada por si solos, pero suelen indicar un asset olvidado.
    if en_git is not None:
        en_disco = {
            os.path.relpath(os.path.join(d, f), RAIZ).replace(os.sep, "/")
            for d, _, fs in os.walk(os.path.join(RAIZ, "public"))
            for f in fs
        }
        sin_versionar = sorted(a for a in en_disco if a not in en_git)
        if sin_versionar:
            print(f"archivos en public/ sin versionar: {len(sin_versionar)}")
            for a in sin_versionar[:10]:
                print(f"  SIN VERSIONAR {a}")
            fallos += len(sin_versionar)

    # 2) Proporcion de las variantes 1x/2x de cada logo.
    try:
        from PIL import Image
    except ImportError:
        print("PIL no disponible: se omite la comprobacion de proporciones")
        return 1 if fallos else 0

    pares = [
        ("logo-mark-128.webp", "logo-mark-256.png"),
        ("logo-mark-claro-128.webp", "logo-mark-claro-256.png"),
    ]
    print("proporcion de las variantes 1x y 2x:")
    for uno, dos in pares:
        p1 = os.path.join(RAIZ, "public", uno)
        p2 = os.path.join(RAIZ, "public", dos)
        if not (os.path.exists(p1) and os.path.exists(p2)):
            continue
        w1, h1 = Image.open(p1).size
        w2, h2 = Image.open(p2).size
        r1, r2 = w1 / h1, w2 / h2
        if abs(r1 - r2) > 0.01:
            print(f"  DESAJUSTE {uno} {w1}x{h1} ({r1:.3f}) vs {dos} {w2}x{h2} ({r2:.3f})")
            fallos += 1
        else:
            print(f"  ok {uno} {w1}x{h1} y {dos} {w2}x{h2} ({r1:.3f})")

    if fallos:
        print(f"\ncheck-assets: {fallos} problema(s) de recursos.")
        return 1
    print("\ncheck-assets: todos los recursos existen y las proporciones cuadran.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
