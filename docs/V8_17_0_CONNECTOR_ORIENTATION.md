# Hardware Simulator 8.17.0-alpha — Orientación física de conectores

## Objetivo

Complementa los pinouts eléctricos de ATX24, EPS12V CPU 8p, PCIe GPU 8p y
SATA alimentación 15p con **carcasas polarizadas y dos puntos de vista**.

- **Frente · cavidades:** mirando el extremo del conector hembra del cable.
  La pestaña queda arriba (ATX/EPS/PCIe); la cara de contactos queda visible.
- **Detrás · cables:** mirando la entrada del mazo de esa MISMA clavija,
  sin voltearla verticalmente: izquierda y derecha aparecen invertidas.
  El número del pin, la señal y las medidas no cambian.
- **ATX:** frontal, fila superior P13–P24, inferior P1–P12.
  Indicador del clip y división 20+4.
- **EPS12V CPU:** frontal, fila superior P5–P8 (+12 V),
  inferior P1–P4 (COM), clip y división 4+4.
- **PCIe GPU:** frontal, fila superior P5–P8 (retorno/sense),
  inferior P1–P4 (+12 V / sense), clip y división 6+2.
  Las cavidades EPS y PCIe tienen un contorno de ejemplo diferente.
- **SATA POWER:** 15 contactos en línea de P1 a P15, pestaña/ranura
  polarizadora en **L**. El reverso muestra P15…P1 horizontalmente.

La cara física que se observa queda indicada en texto y controles, con
numeración y señales accesibles al lector de pantalla. Cambiar de vista
no cambia qué pin está seleccionado por la punta roja o negra.

## Alcance y limitaciones de seguridad

Este modelo enseña la **relación entre número, cara del conector y llave**;
las siluetas "cuadrado / bisel" de las cavidades Mini-Fit son estilizadas
y **no son dibujos mecánicos a escala** ni una matriz de tolerancias válida
para construir un cable. En ATX las cavidades se dejan genéricas para no
inventar un patrón de polarización exacto sin un plano mecánico específico.
El lado de la PSU modular es propio de cada fabricante y **no adopta
necesariamente el mismo pinout ni la misma geometría**.

Nunca probar cables, unir pines ni abrir una PSU real basándose en este
material. El multímetro y las tensiones son simulados y no diagnostican una
fuente real.

## Fuentes

- [Corsair: cable EPS12V divisible 4+4 y guía cuadrada / redondeada](https://help.corsair.com/hc/en-us/articles/360043469632-PSU-How-to-connect-a-PSU-to-a-4-pin-CPU-port)
- [Seasonic: tabla de pines lado PSU y lado CPU/GPU](https://seasonic.com/es/cable-compatibility/)
- [Intel: ATX 24p, tabla de señales](https://edc.intel.com/content/www/fr/fr/design/ipla/software-development-platforms/client/platforms/alder-lake-desktop/atx-version-3-0-multi-rail-desktop-platform-power-supply-design-guide/2.1/main-power-connector-required/)
- [ASRock: manuales de placa base y advertencia de EPS distinto de PCIe](https://www.asrock.com/)
- [SATA power, contactos P1–P15 y guía polarizadora](https://www.oreilly.com/library/view/pc-hardware-in/059600513X/ch13s02s02.html)

## Pruebas

`tests/pinoutLab.test.mjs`: espejo de coordenadas por cara y preservación
de tensiones, número, llave y división por conector.

`tests/smoke.mjs`: interfaz y estado de las puntas tras girar,
medición idéntica y reconocimiento de EPS/PCIe/SATA.

`tests/e2e/workshop.spec.mjs`: navegación real por las caras,
lectura y selección de los cuatro conectores en navegador.
