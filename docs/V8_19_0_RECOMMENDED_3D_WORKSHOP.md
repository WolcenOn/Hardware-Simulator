# Hardware Simulator 8.19.0-alpha — Montaje recomendado dentro del taller 3D

## Corrección de la transición entre interfaces

Antes, el botón «Montaje recomendado» dentro del taller llamaba
a `runTechnicalDemo()`, que ejecutaba `exit()` y la función global
`autoBuild()`. Por ello desaparecía el panel de la aventura, reaparecía
el catálogo antiguo y el PC no tenía inventario ni historial de operaciones
coherente con el taller moderno.

Ahora `runTechnicalDemo()` abre un **caso de demostración aislado** en
el propio modo taller y hace pasar cada etapa por los mismos métodos usados
para la actividad normal: `purchase`, `perform('fit')`,
`perform('screw')`, `perform('apply')` y `connect`.
Los minijuegos de precisión quedan desactivados solo para la construcción
automática inicial; después pueden activarse en el panel del taller.

### Ensamblaje incluido

- Caja ATX y chapa I/O.
- Placa B650 / Ryzen 7600 / RAM DDR5 16 GB, pestañas cerradas.
- Pasta térmica y disipador de aire con tornillos.
- SSD SATA, gráfica RX 7600 y fuente de 650 W.
- ATX24, EPS, POWER SW, USB-A/C del frontal, CPU_FAN, SATA datos y
  alimentación, PCIe GPU, monitor, teclado y ratón.
- Fijaciones completadas por la misma rutina de tornillos que el taller.

La demostración conserva el visor, las fichas 3D, las cámaras y las
acciones de desmontaje, devolución de piezas elegibles, medición y
repetición del montaje. Deja el encuadre sobre la mesa de montaje incluso
cuando Three.js acaba de cargarse después de pulsar el botón.

### Encargos y presupuesto

- La demostración tiene `caseId='demo'` y `demoMode=true`.
- El presupuesto del ejemplo es **ficticio y separado** del encargo que
  pudiera estar realizando un usuario; el usuario debe confirmar antes de
  sustituir sus compras si ya había empezado uno.
- La demo no permite entrega al cliente ni concede recompensas.
- El menú de encargos muestra una opción seleccionada de demostración
  mientras esté activa, sin confundirla con un caso real.
- El modo técnico anterior sigue existiendo por separado, pero el botón
  del taller ya no salta a él.

### Validaciones

`tests/smoke.mjs`: compone el equipo completo, comprueba las piezas
instaladas, las cinco fijaciones, los once indicadores de cableado,
el encendido, el acceso a BIOS y el bloqueo de entrega. Prueba también
cancelar y confirmar desde un encargo con compras.

`tests/e2e/workshop.spec.mjs`: comprueba en Chromium el laboratorio,
el inventario y la ficha 3D, además de conservar los tests del modo
técnico de forma explícita.

Publicar solo bajo `main/preview/v7/`; nunca modificar
`main/index.html`.
