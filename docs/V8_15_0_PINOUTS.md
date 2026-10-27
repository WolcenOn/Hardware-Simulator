# 8.15 — Pinouts de fuente y comprobación de dos puntas

Modelamos conectores de PSU ATX **no modulares** y señales eléctricas lógicas por
número de contacto: ATX24, EPS12V 8p, PCIe auxiliar 8p y alimentación SATA 15p.

**ATENCIÓN: los pinouts externos ATX/EPS/PCIe NO identifican los conectores
modulares del lado de la fuente.** Los fabricantes pueden utilizar cableados
proprietarios en esos puertos. Nunca se debe utilizar un esquema genérico
para construir un cable, mezclar cables modulares o abrir una PSU.

Fuentes:
- Intel, *ATX Version 3.0 Multi Rail Desktop Platform Power Supply Design Guide*,
  [Main Power Connector](https://edc.intel.com/content/www/fr/fr/design/ipla/software-development-platforms/client/platforms/alder-lake-desktop/atx-version-3-0-multi-rail-desktop-platform-power-supply-design-guide/2.1/main-power-connector-required/).
- Intel, *ATX12VO Desktop PSU Design Guide*, [DC Connectors: EPS/PCIe](https://edc.intel.com/content/www/xl/es/design/products-and-solutions/processors-and-chipsets/alder-lake-s/atx12vo-12v-only-desktop-power-supply-design-guide/2.0/dc-connectors/).
- Intel ATX design guide [SATA connectors](https://edc.intel.com/content/www/us/en/design/ipla/software-development-platforms/client/platforms/alder-lake-desktop/atx-version-3-0-multi-rail-desktop-platform-power-supply-design-guide/2.0/2.1/serial-ata-connectors-required/)
  y SATA-IO (detalle de P11 y P3).

Características:
- Las puntas COM negra y roja se asignan a contactos NUMERADOS de un mismo
  conector, a través de una cuadrícula en la ventana del multímetro y un panel
  procedural seleccionable en 3D.
- Se calcula **V(ROJO) − V(NEGRO)**. Intercambiarlas invierte el signo.
- 5VSB y PS_ON# pueden marcar 5V con PC apagado si la fuente conserva CA.
  PWR_OK se aproxima a 5V cuando las salidas están habilitadas; no es una
  certificación del POST.
- En SATA se **supone ausencia de +3.3V** opcional en P1–P3;
  P11 es una señal DAS/DSS variable, no GND fiable.
- El borne de A usado entre dos pines con distinta tensión produce un arco y
  fusible **virtuales**, incluyendo +5VSB en reposo.
- Ω se bloquea si hay alimentación CA simulada: apagar el equipo NO basta.
- Las cuadrículas son **esquemas numerados**, no la vista certificada de una
  cara mecánica (frente, placa o cables), que depende de orientación y llave.
- EPS 8p y PCIe 8p tienen distribución distinta y no son intercambiables.

Limitaciones: tensiones ideales nominales; no hay cargas dinámicas, rizado, tolerancias,
cortocircuitos físicos ni modelo completo de VRM. No autoriza realizar pruebas
con la fuente abierta ni en equipo físico bajo tensión.
