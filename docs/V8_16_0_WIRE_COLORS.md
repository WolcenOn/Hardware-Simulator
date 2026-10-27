# Hardware Simulator 8.16.0-alpha — orden y colores del cableado

## Alcance
Pinouts didácticos de ATX 24p, EPS CPU 8p, PCIe GPU 8p y SATA alimentación 15p.
Los contactos se presentan por su numeración lógica; **no se representa una cara
mecánica certificada** del conector. Comprueba la orientación de la pestaña, el
contacto y la vista antes de aplicar documentos técnicos a un equipo físico.

## Referencia
Intel ATX Version 3.0 Multi Rail Desktop Platform Power Supply Design Guide,
tabla Main Power Connector Pin-Out, fuente:
https://edc.intel.com/content/www/fr/fr/design/ipla/software-development-platforms/client/platforms/alder-lake-desktop/atx-version-3-0-multi-rail-desktop-platform-power-supply-design-guide/2.1/main-power-connector-required/

## Convención ATX 24 pines
| Pin | Señal | Color convencional |
|---:|---|---|
| 1–2 | +3,3 V | naranja |
| 3 | COM | negro |
| 4 | +5 V | rojo |
| 5 | COM | negro |
| 6 | +5 V | rojo |
| 7 | COM | negro |
| 8 | PWR_OK | gris |
| 9 | +5VSB | morado |
| 10–11 | +12 V | amarillo |
| 12 | +3,3 V | naranja |
| 13 | +3,3 V y retorno sense | naranja + marrón |
| 14 | −12 V | azul |
| 15 | COM | negro |
| 16 | PS_ON# | verde |
| 17–19 | COM | negro |
| 20 | reservado / sin conexión | sin color |
| 21–23 | +5 V | rojo |
| 24 | COM | negro |

Orden de filas: A = P1..P12, B = P13..P24. EPS y PCIe: P1..P4 y P5..P8.
SATA: P1..P15 en una sola fila; no significa 15 conductores separados.
P11 SATA tiene funciones de control opcionales y **ningún color universal**.

## Interacción
- Señales: muestra cada señal y una muestra de su color habitual.
- Tensiones: valor simulado de cada contacto según el estado eléctrico del PC.
- Colores: etiqueta en español del color asociado al contacto.
- Modo examen: muestra solo números; sin leyenda, nombres o tensiones.
- Color idéntico en el pinout HTML y el panel procedural de pines 3D.
- La lectura del multímetro sigue dependiendo de sus dos puntas y magnitud.

Los colores no son obligatorios: los cables de ciertas fuentes son totalmente
negros. **Nunca extrapolar el pinout del lado del equipo al lado modular de
una PSU**: esos conectores y cables pueden ser propietarios. Tampoco debe
abrirse una fuente ni construirse cableado a partir de este simulador.

## Verificación
Pruebas de datos: tests/pinoutLab.test.mjs.
Pruebas de interfaz: tests/smoke.mjs y tests/e2e/workshop.spec.mjs.
Verificar por separado las ejecuciones CI y la propagación de GitHub Pages.
