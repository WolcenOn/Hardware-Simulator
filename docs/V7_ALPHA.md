# Hardware Simulator 7.0-alpha · 3D procedural

Esta rama es una **prueba alpha** del nuevo motor visual. No modifica `main` ni la versión 6.5 publicada en GitHub Pages.

## Qué incluye

- Componentes 3D generados por Three.js, **sin GLB, Blender ni modelos de pago**: bandeja/caja simplificada, placa B650 representativa, CPU, RAM, GPU, disipador, fuente, SSD SATA y NVMe.
- Geometrías con bordes redondeados, detalles del PCB, materiales PBR, iluminación ambiental y sombras.
- Cámara orbital con zoom, vista superior y vista isométrica; selección mediante clic/toque.
- Piezas persistentes: los estados del simulador cambian visibilidad, posición y animaciones, sin regenerar la escena en cada `render()`.
- Indicadores ámbar para RAM mal encajada, EPS desconectado, GPU sin alimentación, SATA desconectado y CPU_FAN pendiente.
- Integración con la lógica existente de instalación, compatibilidad, BIOS/POST, inyección de averías y diagnóstico, que sigue en el `index.html` de esta rama.

## Archivos

- `index.html`: interfaz y motor original de v6.5; carga el módulo nuevo y conserva la API `window.PC3D`.
- `js/procedural3d.js`: escenario 3D semirrealista procedural, renderizador y sincronización.

## Cómo probar

Desde una copia de **esta rama**, abre un servidor local en la carpeta del proyecto:

```bash
python -m http.server 8000
```

Visita `http://localhost:8000`, pulsa **Montaje recomendado** y prueba luego:

1. Vista isométrica, superior, zoom y expandir.
2. Seleccionar una pieza 3D: su categoría debería aparecer en el inspector.
3. Reiniciar y montar la RAM sin encajar: debe aparecer el indicador ámbar.
4. Conectar EPS, SATA y GPU desde Correcciones: desaparecen los indicadores correspondientes.
5. Encender el ordenador, entrar en BIOS, provocar un fallo y verificar que la lógica de POST siga funcionando.
6. Abrirlo en navegador móvil para probar los gestos.

**Nota:** se requiere conexión a internet para descargar Three.js desde jsDelivr. No hay modelos 3D de pago ni assets GLB.

## Limitaciones conocidas de esta alpha

- La geometría base muestra una B650 representativa aunque se seleccione A520 o Z790; quedan pendientes variaciones dimensionales y de conectores.
- Las piezas están representadas de forma estilizada y sus proporciones son aproximadas.
- El montaje continúa realizándose con los botones; la selección 3D solo inspecciona. Arrastrar y encajar piezas será un hito posterior.
- Los anillos ámbar son pistas visuales simplificadas, no conectores modelados al detalle.
- La escena y los recorridos de diagnóstico necesitan prueba visual en navegadores reales antes de fusionar con `main`.

## Evolución prevista

1. Tests funcionales y revisión visual de la alpha.
2. Generadores paramétricos por placa y tipo de componente.
3. Animaciones de instalación y cables procedurales.
4. Nueva UI con viewport predominante, ajustes de calidad y accesibilidad.

Objetivo del proyecto: mantener una plataforma estática y gratuita en GitHub Pages.


## Mejoras de escala y localización de componentes (octubre de 2026)

El motor ahora utiliza la convención **1 unidad Three.js = 50 mm**, común a todos los componentes.
Se muestra un banco de montaje con la placa horizontal para facilitar las conexiones.
Las posiciones internas de conectores siguen siendo aproximadas y están inspiradas en
fotografías del hardware, **no** sustituyen planos CAD de los fabricantes.

### Dimensiones utilizadas

| Elemento | Medida | Referencia |
|---|---|---|
| B650 ATX | 305 × 244 mm | estándar ATX y ASUS Prime B650-Plus (disposición visual) |
| A520 mATX | 226 × 221 mm | ASUS Prime A520M-K |
| Z790 ATX | 305 × 244 mm | estándar ATX y MSI PRO Z790-A WiFi (disposición visual) |
| RX 7600 dual | 245 × 134 × 49 mm | ASUS Dual RX 7600 O8G |
| RTX 4070 dual | 267,01 × 133,94 × 51,13 mm | ASUS Dual RTX 4070 OC |
| Ventilador de 120 | 120 × 120 × 25 mm | Noctua NF-A12x25 |
| Disipador de torre | 158 mm de alto, 125 de ancho | Noctua NH-U12S redux |
| PSU representativa | 150 × 140 × 86 mm | Corsair RM850e |
| SSD 2,5" | 100 × 69,85 × 7 mm | formato físico habitual de SSD |
| HDD 3,5" | 147 × 101,6 × 26,1 mm | formato físico habitual de HDD |
| M.2 2280 | 80 × 22 mm | formato M.2 2280 |

Las medidas RX 7600 y RTX 4070 son **referencias geométricas de tamaño**, no
réplicas de modelos comerciales. La lógica de conectores del catálogo se conserva.
Por ejemplo, la RTX 4070 del simulador mantiene su requisito 12VHPWR aunque la
ASUS Dual citada como referencia física emplea 8 pines. Antes de hacer un simulador
de conexiones exactas por SKU, el catálogo necesita referencias individuales.

### Distribución corregida

- La placa mATX tiene realmente menos PCB y dos DIMM; las ATX ofrecen cuatro.
- El socket está en el tercio superior, DIMM hacia la derecha, PCIe en la mitad inferior.
- La GPU ahora va de canto, **perpendicular** a la placa, conectada en PCIe.
- El ventilador del disipador de torre mira hacia el lateral, y el de la PSU hacia arriba.
- La fuente y las unidades SATA ocupan una zona del banco distinta de la placa.
- Los módulos M.2 quedan sobre la placa; los HDD y SSD de formato SATA, fuera.
- Las piezas seleccionadas cambian con el catálogo sin reconstruir la escena 3D.
- Los indicadores de conexión pendiente se recolocan según la variante de placa.

### Fuentes y fotos consultadas

- ATX / microATX: https://studylib.net/doc/8869600/microatx-motherboard-interface-specification
- ASUS A520M-K: https://www.asus.com/es/motherboards-components/motherboards/prime/prime-a520m-k/techspec/
- ASUS Dual RX 7600: https://www.asus.com/uk/motherboards-components/graphics-cards/dual/dual-rx7600-o8g/techspec/
- ASUS Dual RTX 4070: https://www.asus.com/es/motherboards-components/graphics-cards/dual/dual-rtx4070-o12g/techspec/
- Noctua NF-A12x25: https://www.noctua.at/en/products/nf-a12x25-pwm/specifications
- Noctua NH-U12S redux: https://www.noctua.at/en/products/nh-u12s-redux/specifications
- Corsair RM850e: https://www.corsair.com/ww/cf/explorer/diy-builder/power-supply-units/corsair-rme-series/

No se incorporan fotografías ajenas a los archivos publicados: se utilizan
exclusivamente como referencia visual y dimensional para crear geometrías propias.

### Comprobación visual pendiente

- [ ] Placa B650 completa y componentes sin solaparse.
- [ ] Pasar a A520 y Z790; comprobar geometría, CPU, RAM y conectores.
- [ ] Cambiar RX 7600 por RTX 4070; verificar sus longitudes diferentes.
- [ ] Cambiar SSD SATA, HDD y NVMe y verificar ubicación y proporciones.
- [ ] Vista superior/isométrica y vista explosionada sin desplazamientos acumulados.
- [ ] Revisar rendimiento móvil y eventos de clic/selección.
- [ ] Montaje/BIOS/POST/diagnóstico sin regresiones.


## Iteración: ventiladores, soportes y cableado (v7.0-alpha, 20 octubre)

- \`js/fanProcedural.js\`: ventiladores axiales con aspas curvas extruidas,
  rotor y hub separados, carcasa cuadrada opcional, tornillos y parrilla PSU.
- El ventilador del disipador ahora usa marco cuadrado de 120 mm;
  GPU incorpora dos ventiladores con aro; PSU usa carcasa abierta sobre el rotor
  y rejilla fija (el ventilador queda hundido).
- La visualización del ventilador usa aspas con el equipo en reposo y
  una superficie semitransparente de giro durante el test de estrés.
- Los SSD 2,5" y HDD 3,5" aparecen en un soporte lateral con raíles y
  conectores representativos; dicho soporte se oculta con M.2 NVMe,
  que continúa ubicado en la ranura de la placa.
- \`js/cablesProcedural.js\`: rutas para SATA datos, SATA alimentación,
  EPS, GPU y CPU_FAN. Los cables aparecen sólo cuando los estados de conexión
  correspondientes están activos, y se ocultan en vista explosionada.
- Las rutas se regeneran únicamente al cambiar el tipo de placa, GPU o unidad;
  al reemplazarlas, se liberan las geometrías anteriores.

### Comprobaciones efectuadas

- [x] Sintaxis válida de los cuatro módulos 3D.
- [x] Crear ventilador tipo GPU, torre y PSU.
- [x] Nueve combinaciones placa/almacenamiento: un solo disco visible.
- [x] SSD/HDD con soporte lateral; NVMe sin soporte/cables SATA.
- [x] Los cables desaparecen cuando su conexión está pendiente.
- [ ] Revisión visual de posiciones y ocultación desde navegador WebGL real.
- [ ] Prueba visual de las aspas y su modo de giro rápido en dispositivo real.
- [ ] Evaluar fotogramas por segundo en móviles modestos.

No se ha sustituido la simulación física por animaciones: el diagnóstico
y las conexiones siguen gobernados por el estado de Hardware Simulator.


## Iteración: taller 3D, periféricos, consola y nuevos cables (21 octubre 2026)

**Código añadido**
- \`js/workbench3d.js\`: mesa de taller, patas, monitor con peana, teclado
  con teclas instanciadas, ratón con rueda y botón POWER representado.
- El monitor usa \`CanvasTexture\` y sólo repinta si cambia el texto,
  estado de alimentación o modo BIOS. Su fuente de texto es exactamente
  \`monitorText(evalState())\` mediante \`PC3D.update(state, {consoleText})\`,
  de modo que consola HTML y monitor 3D no divergen.
- Botones \`Taller\` y \`Monitor 3D\` para cambiar el encuadre.
- \`js/cablesProcedural.js\`: ATX 24 pines, POWER SW/F_PANEL y cable de
  vídeo de GPU al monitor; conectores físicos en los extremos de los tubos.
- \`js/partsRealScale.js\`: F_PANEL de dos hileras con pines y
  puntos de conexión dinámicos por placa para F_PANEL y ATX 24 pines.
- Motor lógico: \`state.atx24\` y \`state.frontPanel\` son pasos de
  montaje reales. Si faltan, bloquean el encendido/POST y aparecen
  en la lista de correcciones. \`Montaje recomendado\` conecta ambos.
- Monitor 3D, teclado y ratón son decorativos/educativos: el teclado
  y el ratón no envían pulsaciones al sistema simulado. La BIOS
  continúa controlándose desde el panel HTML.

**Pruebas ejecutadas**
- [x] Sintaxis del script original y los cinco módulos 3D.
- [x] Generación de mesa, monitor, teclado y ratón en un entorno simulado.
- [x] El texto POST/BOOT/UEFI se envía al lienzo de la pantalla.
- [x] 9 combinaciones de placas y discos con conectores SATAs correctos.
- [x] Cables ATX24 y front panel visibles en montaje conectado,
      ocultos cuando se desconectan.
- [ ] Pruebas visuales WebGL y rendimiento móvil.
- [ ] Verificar ubicación real del monitor/teclado en distintas resoluciones.
- [ ] Tests funcionales completos de la UI desde navegador.

La vista previa se publica en \`/preview/v7/\` de GitHub Pages sin
sustituir el \`index.html\` de la versión 6.5 estable.
