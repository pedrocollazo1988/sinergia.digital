// Prompts de las fotos de PRODUCTO (el catalogo, no las categorias).
//
// Este archivo es la FUENTE UNICA del texto que se le pide al generador. Lo usa
// herramientas/generar-productos.mjs. La clave es el NOMBRE DE FICHERO que ya
// referencia el catalogo en index.html (campo img), asi que regenerar no exige
// tocar el HTML: se sobrescribe el mismo fichero.
//
// Reglas del prompt (iguales que en lib/imagen-prompts.js):
// - Se pide UNA sola foto de producto, centrada y sobre fondo liso.
// - Nunca se nombran marcas: los generadores inventan logotipos ilegibles.
// - Siempre se prohibe texto, marca de agua, logotipo y personas.

// Sufijo comun: fija el aspecto de todas las imagenes.
export const ESTILO = [
  "professional e-commerce product photograph",
  "single product centered in frame",
  "seamless light gray studio background",
  "soft diffused even lighting",
  "sharp focus, high detail, realistic",
  "no text, no watermark, no logo, no brand, no people, no hands"
].join(", ");

// Un prompt por fichero de public/img. La descripcion se saca del NOMBRE REAL
// del producto en el catalogo (no del nombre del fichero, que a veces no cuadra:
// p.ej. sarten.webp lo usa un organizador de cocina).
export const PROMPTS_PRODUCTO = {
  // --- Computo ---
  "laptop-lenovo.webp": "a modern silver laptop computer, open at a slight angle",
  "laptop-hp.webp": "a dark gray business laptop computer, closed, three-quarter view",
  "laptop-dell.webp": "a black slim business laptop computer, open, three-quarter view",
  "pc-torre.webp": "a black desktop computer tower with a monitor beside it",
  "monitor-2.webp": "a flat screen computer monitor on a stand, front view",
  "ups-2.webp": "a black uninterruptible power supply unit with power outlets",
  "ups-3.webp": "a compact gray voltage stabilizer box with a digital display",
  "teclado-raton.webp": "a black wireless keyboard and mouse set",
  "disco-externo.webp": "a black portable external hard drive",
  "ssd-2.webp": "a black 2.5 inch solid state drive",
  "usb-2.webp": "a black USB flash drive",
  "tablet-2.webp": "a black tablet computer standing upright, front view",
  "webcam-2.webp": "a black webcam with a glass lens, front view",
  "headphones.webp": "a black over-ear headset with a microphone boom",

  // --- Telecom ---
  "router-2.webp": "a white dual band wifi router with four antennas",
  "wifi-router.webp": "a small black wired router with several ethernet ports",
  "switch-2.webp": "a black network switch with eight ethernet ports",
  "repetidor.webp": "a white wall plug wifi range extender",
  "access-point-2.webp": "a white round ceiling wireless access point",
  "wireless-access-point.webp": "a white outdoor directional wifi antenna dish",
  "ethernet-cable-cat6.webp": "a coil of blue ethernet network cable with an RJ45 connector",
  "hdmi.webp": "a black HDMI cable coiled neatly",
  "bluetooth-speaker.webp": "a compact portable bluetooth speaker",

  // --- Impresion ---
  "impresora-2.webp": "a black multifunction inkjet printer with a paper tray",
  "ream-paper-a4.webp": "a stack of white A4 paper reams wrapped in plain paper",
  "toner-hp.webp": "a black laser printer toner cartridge",
  "toner-generico.webp": "a black printer toner cartridge beside its box",
  "cartucho-epson.webp": "a small ink cartridge for an inkjet printer",
  "inkjet-ink-cartridge.webp": "a small black ink cartridge",

  // --- Seguridad ---
  "camara-cctv-2.webp": "a white bullet CCTV surveillance camera",
  "camara-ip-2.webp": "a white dome IP security camera",
  "camara-domo.webp": "a white indoor wifi security camera on a small stand",
  "cctv-surveillance-camera.webp": "a white CCTV security camera mounted on a bracket",
  "dvr-2.webp": "a black digital video recorder box with a front panel",

  // --- Alarmas ---
  "burglar-alarm-control-panel.webp": "a white wall-mounted alarm system control panel with a keypad",
  "sensor-pir.webp": "a white passive infrared motion sensor",
  "sirena-2.webp": "a red and white outdoor alarm siren with a strobe light",
  "doorbell.webp": "a white wireless doorbell with a push button",
  "electronic-door-lock.webp": "a black smart door lock with a fingerprint reader",
  "smoke-detector.webp": "a white round smoke detector",

  // --- Electrodomesticos ---
  "refrigerador-2.webp": "a silver two-door refrigerator, front view",
  "washing-machine.webp": "a white front-loading washing machine",
  "arrocera-2.webp": "a white electric rice cooker with a glass lid",
  "microondas-2.webp": "a black microwave oven with a digital panel",
  "cocina-electrica.webp": "a portable electric two-burner hot plate",
  "pava-2.webp": "a stainless steel electric kettle",
  "batidora.webp": "a black and silver hand blender",
  "televisor-2.webp": "a flat screen LED television, front view",

  // --- Oficina ---
  "carpetas.webp": "a desktop stationery organizer with compartments and folders",
  "desk-calculator.webp": "a black desktop calculator with a large display",
  "pizarra.webp": "a white whiteboard with markers",
  "stapler-office.webp": "a black metal office stapler",

  // --- Escolar ---
  "libretas.webp": "a stack of spiral notebooks",
  "mochila.webp": "a blue school backpack",
  "lapices-color.webp": "a set of colored pencils arranged in a row",
  "school-notebook-exercise-book.webp": "a set of geometry tools, ruler, protractor and compass",

  // --- Solar ---
  "solar-panel-photovoltaic-module.webp": "a blue monocrystalline solar panel",
  "panel-solar-3.webp": "a large blue solar panel, three-quarter view",
  "panel-solar-2.webp": "a coil of black solar cable with MC4 connectors",
  "inversor.webp": "a white hybrid solar inverter with a display",
  "inversor-2.webp": "a gray hybrid solar inverter box with a screen",
  "bateria-litio.webp": "a black lithium battery module with screw terminals",
  "bateria-solar.webp": "a large rack-mounted lithium battery bank",
  "controlador-mppt.webp": "a black solar charge controller with a display",
  "estructura-solar.webp": "aluminum solar panel mounting brackets",
  "portable-power-station.webp": "a portable solar power station with a carrying handle",

  // --- Clima ---
  "aire-split.webp": "a white wall-mounted split air conditioner indoor unit",
  "split-air-conditioner.webp": "a white split air conditioner indoor unit, front view",
  "ventilador-pie.webp": "a black tower fan",
  "ventilador-techo-2.webp": "a ceiling fan with a light, seen from below",
  "ceiling-fan.webp": "an industrial pedestal fan",
  "dehumidifier.webp": "a white portable dehumidifier",
  "linterna-2.webp": "a black tactical LED flashlight",
  "led-lamp.webp": "a rechargeable LED emergency lamp",

  // --- Herramientas ---
  "taladro.webp": "a black and green cordless power drill",
  "amoladora.webp": "an orange angle grinder",
  "llaves-cubo.webp": "a socket wrench tool set in a case",
  "destornilladores.webp": "a precision screwdriver set with many bits",
  "multimetro.webp": "a yellow digital multimeter with test probes",
  "sierra-caladora.webp": "a black and green jigsaw power tool",
  "caja-herramientas.webp": "a metal tool box with a handle",
  "cinta-metrica.webp": "a yellow measuring tape",

  // --- Hogar ---
  "cookware-set-pots.webp": "a set of stainless steel cooking pots",
  "vajilla.webp": "a white porcelain dinnerware set with plates and bowls",
  "sarten.webp": "a multi-tier kitchen storage organizer rack",
  "sabanas.webp": "a neatly folded set of cotton bed sheets",
  "water-filter-tap.webp": "a white water filter purifier for a kitchen tap",
  "weighing-scale.webp": "a digital kitchen weighing scale",
  "power-strip-surge-protector.webp": "a white power strip with multiple sockets"
};

// Devuelve el prompt completo de un fichero, o null si no esta en la lista.
export function promptProductoDe(fichero) {
  const base = PROMPTS_PRODUCTO[fichero];
  return base ? `${base}, ${ESTILO}` : null;
}
