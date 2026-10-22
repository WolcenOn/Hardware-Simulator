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


## Iteración: cableado modular y proporciones del taller (21 octubre 2026)

A partir de la revisión visual del taller se ajustan:

- **PSU**: cuatro puertos tipificados en una sola cara modular (+X). Sus
  posiciones son un dato compartido `PSU_CABLE_PORTS` en
  `js/partsRealScale.js`; las bocas y el punto de nacimiento del cable
  utilizan exactamente la misma referencia.
- **Cableado**: mazos de varios conductores con abrazaderas para ATX24,
  EPS, GPU y SATA power. Rutas guiadas por el perímetro del banco, con
  conectores en los extremos. SATA datos sigue saliendo de la placa,
  CPU_FAN del cabezal de ventilador y vídeo de GPU al monitor.
- **Monitor 24"**: marco 11.02 unidades, pantalla 10.52 x 5.92,
  equivalentes aproximadamente a 53 x 30 cm. Queda elevado por encima
  del PC, hacia la parte posterior del banco (z=-5.78), con pedestal.
- **Teclado**: anchura 9 unidades (45 cm aprox.), frente al equipo.
- **Ratón**: 2.4 x 1.3 unidades (120 x 65 mm) y alfombrilla dimensionada.
- **Mesa**: ampliada a 15.4 x 15.1 unidades para acomodar los periféricos.
- **Cámara**: vista Taller encuadra la mesa completa, Vista iso enfoca
  el hardware y Monitor 3D encuadra la pantalla elevada.

Las dimensiones y conectores son **representaciones educativas**;
no son modelos CAD exactos. No se han añadido dependencias ni assets de pago.

### Comprobaciones de esta iteración
- [x] Sintaxis del motor, modelo de placa, cableado y periféricos.
- [x] Monitor 3D vuelve a pintar las líneas POST / BOOT desde la consola.
- [x] Maqueta del teclado y monitor generadas con nuevos tamaños.
- [x] Los cuatro orígenes de alimentación usan x=4.80 y la misma cara de PSU.
- [x] Nueve configuraciones B650/A520/Z790 con SSD/HDD/NVMe:
      cableado SATA sólo con unidades SATA.
- [x] Los cables se ocultan al desconectar su estado.
- [ ] Verificación visual WebGL en navegador físico y ajuste fino de curvas,
      perspectiva, tamaño real percibido y solapamientos.


## Iteración 7.1-alpha: montaje con orden, chasis e interacción con BIOS (21-10-2026)

### Chasis procedural
- Caja ATX horizontal de sobremesa con paredes, guías, bahía PSU, anclajes,
  ranuras y panel superior transparente abatible.
- La tapa puede abrirse/cerrarse y bloquea el montaje mientras esté cerrada.
- No es todavía una torre vertical ni un modelo CAD con colisiones exactas.

### Dependencias de montaje
- La caja debe instalarse primero.
- Fuente antes de placa: los mazos impiden acceso; es obligatorio apartarlos
  antes de atornillar la placa y se acumula esfuerzo extra.
- Para montar una unidad M.2 cuando ya existe GPU, hay que retirarla.
- Disipador exige CPU; el resto de piezas requiere motherboard instalada.
- No se permiten intervenciones internas encendido o con tapa cerrada;
  USB externos se conectan normalmente con panel cerrado.
- El contador de esfuerzo y el historial registran las acciones repetidas.
  No se confunde dificultad mecánica con una avería eléctrica inventada.

### Periféricos y señal
- Teclado y ratón tienen conectores USB y cables 3D independientes.
- La BIOS requiere teclado USB. El ratón no afecta al POST, pero sí a
  poder pulsar filas de prioridad de arranque dentro del monitor 3D.
- Cable HDMI/DP independiente desde GPU o vídeo integrado. La pantalla 3D
  permanece negra sin encendido, cable o POST con señal operativa.
- Las averías de periféricos pueden introducirse como fallos de diagnóstico.

### POST/UEFI y arranque
- Etapas temporizadas de inicialización CPU/VRM, RAM, VGA, dispositivos,
  POST y búsqueda de medio.
- Orden de tres entradas: SSD/NVMe, USB y PXE. En esta alpha, USB y PXE no
  disponen de medios de arranque. Tener una de ellas en Boot #1 provoca
  fallo de boot (no de POST), susceptible de corregirse en UEFI.
- La textura 3D del monitor incluye tres filas clicables para ascender
  una posición el elemento seleccionado; teclas 1/2/3 también funcionan
  si el teclado USB del simulador está conectado. F2/Supr abre BIOS.
- El panel BIOS HTML conserva los ajustes de SATA, perfil RAM,
  CPU_FAN y modo PCIe.

### Verificaciones
- [x] Fuente antes de motherboard requiere reubicación de mazos.
- [x] Caja cerrada impide instalar y encendido impide abrir conexiones internas.
- [x] GPU bloquea M.2 hasta retirarla.
- [x] Conexiones USB independientes del cable de vídeo.
- [x] POST operativo pero monitor sin imagen al desconectar señal.
- [x] Cambiar prioridad a PXE produce Boot Failed.
- [x] Nueve combinaciones de placa y almacenamiento con cableado dinámico.
- [x] Tapa 3D abatible y menú UEFI clicable.
- [ ] Inspección visual WebGL, rendimiento móvil y colisiones 3D exactas.
- [ ] Torre vertical y encaje libre mediante drag-and-drop.
- [ ] USB booteable y servicio PXE simulado para probar prioridad completa.


## Iteración 7.2-alpha: GPU, mazos, refrigeración, I/O y encaje asistido (21-10-2026)

### Correcciones importantes
- El conector auxiliar de la GPU ya no se considera conectado salvo que
  la GPU y PSU estén instaladas y la fuente disponga de PCIE_8 o 12VHPWR
  según el catálogo. En caso contrario se registra el motivo exacto.
- Cambiar de fuente o GPU desconecta el estado antiguo y exige nueva
  instalación/conexión. Montaje recomendado selecciona PSU850 si hace falta.
- El botón «Apartar y asegurar mazos PSU» ahora está en Proceso de montaje.
  Está disponible siempre que haya PSU instalada y cables sin ordenar,
  incluso después de instalar la placa.
- Asegurar los cables cambia su geometría: los mazos van por el canal
  inferior interior, mientras que sin ordenar permanecen elevados.

### Geometría del chasis
- PSU recolocada en la zona trasera derecha, con el panel modular orientado
  al interior. Los cuatro conectores comparten coordenadas con los cables.
- SSD SATA 2,5 y HDD SATA 3,5 en posiciones diferenciadas dentro de las
  bahías frontales de la caja. M.2 NVMe permanece instalado en la placa.
- Chapa I/O trasera con huecos para USB y otros puertos.
  Debe montarse antes de atornillar la placa. Si se olvida, se puede
  desmontar la placa y el conjunto para corregirlo, con coste de pasos.

### Ventiladores de caja y física simplificada
- Ranuras para dos ventiladores frontales de entrada y uno trasero de
  extracción, cada uno de 120 mm. Se pueden instalar, retirar,
  conectar y desconectar del header SYS_FAN.
- El rotor 3D sólo gira al alimentar el PC con ventilador conectado.
- Modelo térmico educativo: base 43 C en reposo / 70 C en estrés,
  incremento si la caja está cerrada, descuento por cada ventilador
  instalado+conectado. Pasta térmica y CPU_FAN defectuosos tienen prioridad
  sobre la refrigeración normal. NO es simulación CFD ni predicción física.
- La zona Proceso de montaje indica el número de ventiladores efectivos
  y la temperatura calculada para cada estado.

### Arrastrar y encajar (primer paso)
- Las tarjetas del catálogo de montaje tienen drag HTML5.
- El motor 3D muestra un anillo verde sobre la ranura o posición válida.
- Soltar dentro de una tolerancia de píxeles activa la misma función
  install() que los botones, conservando dependencias y bloqueos.
- Es un snap-to-target **asistido**, no colisiones 3D de piezas libres.
  En móvil permanece el método tradicional de instalar con botón.

### Pruebas
- [x] PSU antes de placa, reordenación y posterior instalación.
- [x] Reorganizar mazos con placa instalada.
- [x] GPU RTX4070 + PSU650 se rechaza; PSU850 permite 12VHPWR.
- [x] Montaje recomendado adapta la fuente al requisito de GPU.
- [x] Chapa I/O antes de motherboard y recuperación por desmontaje.
- [x] Tres ventiladores instalables individualmente; PWM independiente.
- [x] Temperatura en estrés: caja cerrada/0 fans 82 C,
      caja cerrada/3 fans 68 C (modelo base actual).
- [x] 18 combinaciones placa x almacenamiento x mazos asegurados,
      con anclajes y conectores de GPU/SYS_FAN correctos.
- [x] Sintaxis JavaScript de motor y módulos.
- [ ] Comprobar el drag/drop, solapamientos y rendimiento en WebGL real.
- [ ] Perfeccionar animación de bandejas y colisiones exactas.


## Revisión 7.4.1 — acciones y carga de recursos (22 octubre de 2026)

Se corrigen bloqueos intermitentes de controles reportados tras la 7.4:

- El botón **Montaje recomendado** se enlaza por su ID de DOM real.
  Antes se usaba `autoBuild.onclick=autoBuild`: `autoBuild` era el nombre
  de la función, no el elemento del botón.
- Todos los controles estáticos se enlazan explícitamente mediante
  `document.getElementById` y `addEventListener`, evitando conflictos
  entre nombres de funciones y referencias implícitas de elementos HTML.
- Los temporizadores de progreso POST (420, 1080, 1770, 2580 ms) actualizan
  únicamente consola e indicadores. No regeneran la lista de piezas ni los
  botones, evitando clics perdidos cuando el DOM cambia entre mousedown y click.
- Errores de carga o ejecución se muestran en una advertencia visible.
  Los errores HTTP no reconstruyen todo el DOM de montaje.
- Se añade un `favicon.svg` local para evitar la petición implícita
  a favicon.ico, una de las posibles fuentes de HTTP 404.
- Un aviso sobre el estado del chasis explica cuándo hay que apagar el PC
  o abrir el panel para trabajar en el interior.

Pruebas:
- [x] `Montaje recomendado` enlazado y ejecuta montaje completo.
- [x] Botón de encendido enciende el equipo después del montaje.
- [x] Cuatro etapas de POST sin reconstrucción de `installList`/
  `fixButtons`.
- [x] Error de recurso simulado: panel visible y botones conservados.
- [x] Sintaxis de script clásico válida.
- [ ] Identificar URL concreta del 404 original en consola del usuario;
  sin captura de esa URL no es posible atribuirlo con certeza al favicon.
- [ ] Verificación manual de esta corrección en navegador real.

Versión de caché de Pages: `7-4-1-button-hotfix`.


## Revisión 7.4.2 — control de zoom suave (22 octubre 2026)

- Se añade `js/smoothZoom.js`, que intercepta la rueda del ratón **sólo
  sobre el canvas 3D**, dejando intacto el scroll del resto de la web.
- La rueda normaliza desplazamientos de píxeles, líneas y páginas;
  además limita picos de desplazamiento por evento.
- Un paso de 100 px cambia la distancia de la cámara ~5,35 %, frente
  a los saltos bruscos del zoom discreto anterior. La cámara alcanza la
  distancia objetivo con interpolación exponencial entre fotogramas.
- Los botones «Zoom +» y «Zoom −» utilizan la misma transición, con
  incrementos cercanos al 6–7 % por pulsación.
- Al cambiar de vista (Taller, Vista iso, Trasera/cables, Monitor, Lateral)
  se sincroniza la distancia objetivo para evitar movimientos residuales.
- Durante un gesto multitáctil de dos dedos se respeta el zoom nativo
  de OrbitControls, sincronizando la posición al finalizar.
- Se conservan los límites de navegación de 4.5 a 56 unidades 3D.

### Pruebas de código
- [x] Rueda de -100 px: 30.0 a 28.39 unidades como objetivo.
- [x] Primer fotograma de aproximación: 29.73, sin salto brusco.
- [x] Convergencia suave a distancia objetivo.
- [x] Zoom por botón en ambos sentidos.
- [x] Límite mínimo/máximo en secuencias repetidas.
- [x] Sincronización al cambiar de cámara.
- [x] Gestos multitáctiles sin luchar por la distancia.
- [ ] Pruebas con ratones de distintas resoluciones, trackpad y navegador WebGL real.
