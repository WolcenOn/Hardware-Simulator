# Hardware Simulator 8.0-alpha — Modo aventura de montaje

**Fecha:** 22 de octubre de 2026
**Referencia:** «aventura gráfica» con tienda, inventario, encargos y verbos.
Este modo está publicado en la misma URL de vista previa que v7 y utiliza
el motor eléctrico y el entorno 3D existente.

## Propósito

Sustituir en el modo principal el uso repetitivo de «Montaje recomendado»
por decisiones con consecuencias: qué piezas comprar, qué herramientas
hacen falta, cómo montarlas, cómo conectarlas y qué síntomas produce
cada omisión. El modo técnico clásico sigue accesible mediante
«Salir al modo técnico».

## Encargos con presupuesto

| Cliente | Presupuesto | Objetivo principal |
|---|---:|---|
| Lucía — oficina | 800 € | 16 GB y SSD, con iGPU suficiente |
| Marcos — juegos 1080p | 1.500 € | GPU dedicada y SSD |
| Elena — edición | 2.000 € | 32 GB, NVMe y GPU |

**Todos los precios son FICTICIOS, sólo para el juego.**
No hay pagos reales, productos físicos, compra online ni catálogo
de comercios externos. Comprar piezas incompatibles o repetir compras
reduce el saldo y puede hacer fracasar el encargo.

## Sistema de inventario y verbos

1. El usuario elige encargo y compra desde tienda. Se pueden comprar
   placa, procesador, RAM, disco, GPU, PSU, caja y disipador.
2. Los consumibles y herramientas deben comprarse por separado:
   destornillador, tornillos, chapa I/O, pasta térmica, cable SATA,
   HDMI/DP, teclado/ratón USB, ventiladores 120 mm y USB instalador SO.
3. El inventario permite seleccionar objetos y realizar:
   - **Encajar** pieza (respetando caja, orden y compatibilidad física),
     ventiladores en ranuras y chapa I/O antes de fijar la placa.
     Una segunda acción Encajar sobre la RAM fija las pestañas DIMM.
   - **Atornillar** partes instaladas, usando destornillador y gastando
     tornillos. Faltan puntos en la evaluación de entrega si no se fijan
     placa base, fuente o disco.
   - **Conectar** 24p, EPS, POWER SW, PCIe/12VHPWR, SATA datos/power,
     CPU_FAN, vídeo, teclado, ratón y tres SYS_FAN.
   - **Aplicar** pasta térmica adquirida sobre CPU antes de disipador.
   - **Ordenar cables**, con la misma canaleta PSU del modo técnico.
   - **Retirar**, respetando el orden físico y volviendo la pieza a
     inventario para corregir fallos de montaje.
   - **Encender**, **BIOS**, **Instalar SO**, **Inspeccionar**.
4. Los componentes comprados se pueden arrastrar desde el inventario
   hasta los puntos de anclaje verdes del 3D. Es un snap asistido,
   no una simulación continua de colisiones.
5. El instalador de sistema operativo requiere USB adquirido,
   teclado/monitor conectados, POST operativo, disco detectable y
   **USB como Boot #1** en la UEFI. Tras instalarlo hay que restaurar
   SSD/NVMe como Boot #1.

## Errores que se muestran

- Sin conector ATX/POWER SW: fallo de encendido.
- EPS, RAM sin encajar, GPU sin alimentación o piezas incompatibles:
  POST fallido o sin vídeo.
- SATA datos/alimentación sueltos: unidad SATA no detectada.
- Sin sistema operativo: `NO OPERATING SYSTEM FOUND`.
- Prioridad USB con instalador: `BOOT USB` para instalar el SO.
- Disipador ausente o pasta no aplicada: protección térmica.
- Ventiladores adicionales controlan temperatura del modelo didáctico.
- Sin tornillos en piezas principales: entrega rechazada por seguridad.

## Evaluación del encargo

Diez criterios al entregar: presupuesto, encendido/POST, vídeo,
arranque con SO instalado, RAM, tipo de almacenamiento, GPU requerida,
temperatura/CPU_FAN, fijaciones y pasta/periféricos.

Un encargo de oficina puede superarse sin GPU dedicada aprovechando
una CPU con gráficos integrados. También se puede comprar una combinación
errónea sin que la tienda la corrija automáticamente.

## Pruebas ejecutadas

- [x] Arranque en tienda como modo principal; modo técnico preservado.
- [x] No se pueden instalar piezas sin inventario.
- [x] Compra de RAM, CPU, motherboard, caja, disipador, PSU, SSD y
      materiales dentro del presupuesto; compras fuera de saldo rechazadas.
- [x] Colocar chapa I/O, CPU, pasta, disipador, RAM y conexiones.
- [x] Atornillar placa, disco y PSU consumiendo tornillos.
- [x] Sin OS: POST correcto, BOOT false y mensaje de falta de OS.
- [x] Sin SATA datos: `NO SATA DEVICE DETECTED`.
- [x] Instalar SO desde USB y devolver prioridad a SSD.
- [x] Entrega exitosa de oficina **759 €/800 €, 10/10**.
- [x] Cambiar encargo reinicia compras y estados.
- [x] Se pueden comprar componentes incompatibles y agotar presupuesto.
- [x] Arrastrar a 3D usa inventario, nunca el montaje libre.
- [ ] Validación visual/interacciones completas en navegador WebGL.
- [ ] Guardado persistente de partidas.
- [ ] Venta de piezas, devoluciones e historial de clientes.
- [ ] Añadir herramientas con uso físico a través de hotspots 3D.
- [ ] Más escenas, diálogos y respuestas de clientes.

## Archivos

- `js/adventureMode.js`: controlador de aventura, catálogo ficticio,
  inventario, presupuesto, verbos, diálogos y evaluación.
- `index.html`: carga del controlador, modo por defecto, lógica de SO y
  protección térmica, paneles CSS y puente con el motor existente.
- Vista previa: `/preview/v7/` (sin cambiar `main/index.html`).


## Iteración 8.1-alpha: inventario editable y gráficos integrados (22-10-2026)

### Inventario y cambios de compra
- Inventario colocado en primer plano, antes de la tienda.
- Cada fila muestra unidades disponibles, objetos instalados o gastados,
  además de botones de selección y **Devolver**.
- Se puede **devolver** una unidad sin instalar al precio exacto al que
  se compró. No se duplica el reembolso: desaparece su compra registrada.
- **Cambiar producto** reemplaza una unidad sin montar por otro modelo
  de la misma categoría; se cobra o devuelve la diferencia real entre
  los dos precios ficticios. Se rechaza si se supera el presupuesto.
- Una bolsa de tornillos solo se devuelve completa (10 unidades);
  pasta u otros consumibles gastados no se pueden devolver.
- Cables HDMI, SATA, teclado y ratón conectados no pueden devolverse
  salvo que se disponga de unidades adicionales sueltas.
- Para devolver una placa, CPU, RAM o GPU montada se debe usar el verbo
  «Retirar» con el equipo apagado, respetando las dependencias existentes.
- La mochila sigue siendo arrastrable a los anclajes 3D.

### Ampliación del catálogo educativo
- Placas: B650M AM5 mATX, B550 AM4, H610 Intel DDR4 y B760 Intel DDR5.
- Procesadores: Ryzen 5600G, 5700X, 8600G (Radeon 760M), 8700G
  (Radeon 780M), 7700; Intel i5-12400, i5-12400F, i5-14400.
- RAM: DDR4 8/32GB; DDR5 8/64GB.
- Almacenamiento: SSD SATA 2 TB, NVMe M.2 2 TB, HDD 4 TB.
- GPU dedicada: RX 6600, RTX 3060 y RTX 4060.
- PSU: 550, 750 y 1000W.
- En total, **25 referencias adicionales**, con precios enteramente
  ficticios para el juego.

### Ruta de vídeo a través de placa base
Los gráficos integrados **residen normalmente en la CPU** y las
salidas HDMI/DP de la placa solo los exponen.
- El jugador puede seleccionar «Placa HDMI/DP» o «GPU dedicada» cuando
  conecta el monitor.
- Ryzen 5 5600G y Ryzen 5 8600G/8700G permiten imagen sin gráfica
  dedicada en placas y memoria compatibles.
- Ryzen 5 5600, 5700X e Intel Core i5-12400F no llevan iGPU; comprar
  uno de ellos sin una tarjeta gráfica provoca una incompatibilidad
  detectable.
- Si hay GPU dedicada pero se selecciona HDMI de placa, también funciona
  cuando la CPU lleva iGPU.
- La geometría procedural incluye conectores de vídeo de placa y
  variantes visuales representativas por formato. No son CAD
  de cada modelo comercial.

**Fuentes de especificaciones:**
- AMD Ryzen 5 8600G (Radeon 760M):
  https://www.amd.com/es/products/processors/desktops/ryzen/8000-series/amd-ryzen-5-8600g.html
- AMD Ryzen 5 5600G:
  https://www.amd.com/en/support/downloads/drivers.html/processors/ryzen/ryzen-5000-series/amd-ryzen-5-5600g.html
- Intel, procesadores sin gráficos (variantes F):
  https://www.intel.com/content/www/us/en/support/articles/000006047/processors.html
- MSI B650M-A y sus HDMI/DP dependientes de iGPU:
  https://es.msi.com/Motherboard/PRO-B650M-A-WIFI/Specification

### Pruebas de código
- [x] Se devuelve 1 unidad sin montar y no se puede pedir segundo reembolso.
- [x] Se cambia placa A520 por B550 cobrando diferencia; se controla el presupuesto.
- [x] Un HDMI conectado no puede devolverse.
- [x] Ryzen 5600G + B550 + DDR4 muestra salida HDMI integrada.
- [x] Ryzen 5600 sin GPU y Core i5-12400F sin GPU fallan por ausencia de iGPU.
- [x] Core i5-12400 + H610 tiene vídeo Intel UHD.
- [x] Ryzen 8600G + B650M + DDR5 + NVMe muestra Radeon 760M.
- [x] HDMI de motherboard sigue siendo posible con GPU dedicada instalada
      si la CPU ofrece iGPU; HDMI de GPU requiere alimentación de ésta.
- [ ] Revisar UI interactiva en navegador WebGL real y animaciones de compra.

- [x] Ahora el verbo **Desconectar** permite soltar cables internos con PC apagado y periféricos externos (HDMI/USB) sin salir al modo técnico.
- [x] Cable HDMI conectado: devolución bloqueada; tras desconectar se devuelve y recupera el precio pagado.


## Iteración 8.2-alpha: mesas de preparación y menú plegable (23-10-2026)

### Dos mesas 3D independientes
- Se crea `js/stagingTable3d.js`: mesa auxiliar de 825 × 850 mm situada
  a la derecha del banco de montaje, con 12 huecos visibles por página.
- Las compras aparecen físicamente como representaciones procedurales
  reconocibles (caja, placa, CPU, RAM, GPU, PSU, SSD/HDD/NVMe,
  disipador y herramientas/consumibles). No se utilizan activos CAD externos.
- Sólo aparecen los objetos con existencias disponibles; al encajar
  una pieza desaparece de la mesa auxiliar. Si se retira, vuelve al
  inventario y a la mesa auxiliar.
- El clic sobre una pieza 3D la selecciona en inventario y abre
  automáticamente el acordeón de acciones.
- La navegación ◀/▶ cambia de página cuando hay más de 12 referencias.
- La cámara «Mesa de piezas» aproxima la preparación; «Taller completo»
  muestra ambas mesas. La torre sigue conservando sus vistas dedicadas.

### Colocar la caja sin confusión
- En un encargo nuevo, tienda y encargo están abiertos inicialmente y
  el tutorial indica que hay que comprar la caja.
- Tras comprar «Caja ATX con bandejas», aparece sobre la mesa auxiliar
  y la cámara se acerca a ella.
- Al seleccionarla se sugiere la acción
  **«Colocar caja en mesa de montaje»**. Ejecutarla equivale a
  encajar la caja en el banco; `state.casePlaced` se marca verdadero,
  consume una unidad de inventario y la cámara vuelve a la torre.
- La caja sigue sujeta a las reglas físicas existentes: no permite
  instalar una placa sin chasis ni cablear con el PC encendido.

### Panel de acordeones
- El panel lateral de aventura es independiente del modo técnico,
  con scroll propio en escritorio y altura máxima del viewport.
- Secciones: Encargo y progreso, Inventario y cambios,
  Tienda de informática, Acciones y herramientas,
  Diagnóstico y entrega.
- Máximo dos acordeones simultáneamente abiertos; el estado persiste
  cuando cambia la selección o se actualiza el inventario.
- Se conserva `scrollTop` durante la reconstrucción del panel;
  evita que cada compra o acción obligue a desplazarse desde arriba.
- Se muestran acciones contextuales: encajar caja, chapa I/O, aplicar
  pasta, encajar DIMM, atornillar, retirar e inspeccionar.
- El modelo de verbos general sigue disponible para operaciones avanzadas.

### Comprobaciones
- [x] Sintaxis de HTML y de ambos módulos 3D/juego.
- [x] Comprar caja aparece en mesa y centra la cámara auxiliar.
- [x] Acción contextual de colocar caja y consumir la pieza comprada.
- [x] Inventario y mesa ya no muestran la caja como pendiente al montarla.
- [x] Selección de piezas abre Inventario y Acciones sin perder su estado.
- [x] Mesa 3D reconoce raycast sobre una pieza, oculta modelos instalados
      y mantiene visibles los restantes.
- [x] Encargo de oficina anterior: 759 € y diez criterios de entrega.
- [ ] Inspección visual en navegador WebGL y pulido de las nuevas cámaras.
- [ ] Animaciones físicas de traslado, colisiones reales y uso de herramientas
      mediante clic sobre componentes concretos.

**Vista previa**: `/preview/v7/?v=8-2-prep-bench`.


## Iteración 8.3-alpha: menús contextuales 3D y fichas técnicas (23-10-2026)

- Clic en cualquier componente físico visible de la mesa auxiliar abre
  un **menú contextual** junto al puntero: ficha, encajar, aplicar, etc.
- También se reconocen placa, CPU, RAM, cooler, PSU, GPU, discos,
  chasis, tres ventiladores de caja, monitor, teclado y ratón
  ya montados en el entorno 3D.
- Desde la tienda hay un botón **Ficha** antes de comprar, para poder
  comparar características sin gastar dinero ni instalar la referencia.
- `js/partInspector.js` consulta los catálogos de la 8.1 para mostrar
  socket, tipo de RAM, interfaces, potencia, conectores, dimensiones,
  descripción del producto y compatibilidad con piezas seleccionadas.
- El contexto ofrece conexiones independientes: ATX 24p, EPS, POWER SW,
  PCIe / 12VHPWR, SATA de datos y alimentación, CPU_FAN, USB/vídeo
  o SYS_FAN según la pieza. NVMe no solicita SATA.
- En la ficha, el **estado montado** indica cada condición:
  atornillado, RAM bien encajada, pasta térmica, temperatura,
  cableado ATX/EPS/F_PANEL, GPU, SATA, CPU_FAN y PWM,
  monitor con señal, teclado y ratón conectados, etc.
- Las fijaciones se conocen mediante las operaciones de atornillado
  realizadas en el modo aventura; el modo técnico indica
  «No registrado en modo técnico» en lugar de inventar tornillos.
- Nuevo acordeón «Estado de piezas montadas» con desglose resumido
  y enlaces a cada ficha. Los cambios se reflejan al ejecutar operaciones.
- La interfaz visual del inspector pertenece al escenario 3D,
  no sustituye a los botones del modo técnico, y usa el motor
  de aventura para validar todas las acciones; no instala piezas gratis.
- Un botón ✕ y la tecla Escape cierran los menús. En pantallas estrechas
  la ficha ocupa el área visible del escenario.

### Validación
- [x] Sintaxis del módulo clásico, script inline y renderizador 3D.
- [x] Selección sobre mesa auxiliar y sobre hardware montado.
- [x] Ficha de CPU sin comprar y detección socket AM4 ↔ AM5.
- [x] Estado ATX, EPS, POWER SW pendientes individualmente.
- [x] Al cambiar ATX24 conectado, el menú cambia de «Conectar» a «Soltar».
- [x] Unidad NVMe no ofrece cables SATA en el menú.
- [x] Resumen de piezas instaladas visible en acordeón.
- [ ] Pruebas de clic/raycast y colocación exacta de menús en navegador WebGL.
- [ ] Añadir dibujos detallados de zócalos, tornillos y puertos seleccionables.

Vista previa: `/preview/v7/?v=8-3-part-inspection`.


## Corrección 8.3.1-alpha: operaciones desde ficha y lateral sin solapamientos (23-10-2026)

### Operaciones de herramientas / menús 3D
- La **ficha técnica**, además del menú flotante, muestra sus propios
  botones ejecutables «Atornillar», «Conectar»/«Soltar», etc.
- Las acciones explícitas se envían al motor de aventura, y su resultado
  aparece **dentro del propio menú y de la ficha técnica**, no escondido
  únicamente en el registro del acordeón de entrega.
- Si faltan tornillos o destornillador, el jugador recibe el mensaje
  «Falta destornillador y tornillos. Compra el material en la tienda».
- Para atornillar es obligatorio que la pieza esté montada,
  el PC esté apagado, el chasis abierto y haya destornillador
  y al menos un tornillo disponible. El tornillo se consume y el
  estado de fijación pasa a correcto.
- Una vez atornillado el componente, desaparece la opción de
  volver a atornillarlo; la ficha muestra el estado actualizado.
- La ficha permite usar acciones sin cerrar el documento ni depender
  del menú flotante situado detrás.

### CSS responsivo del lateral
- Todos los controles del panel de aventura usan `box-sizing:border-box`;
  los `select` de 100 % dejan de sobresalir por sus bordes/padding.
- Las tarjetas de tienda limitan explícitamente el ancho del bloque
  «Ficha/Comprar», evitando que la regla genérica `.adv-card div`
  lo expandiese al mismo tiempo que la descripción.
- Los botones, textos largos, indicadores de inventario, tarjetas de
  estado, títulos de acordeones y columnas tienen anchos mínimos cero
  y ajuste de palabra. Las cuadrículas usan `minmax(0,1fr)` para
  impedir que un texto largo empuje a otro componente.
- En pantallas estrechas se acotan anchos de «Devolver» y botones de
  acciones. El inspector usa un nivel visual por encima del menú
  flotante cuando se abre la ficha.

### Regresión automatizada
- [x] Ficha de placa montada incluye acción «Atornillar».
- [x] Sin herramientas: advertencia visible en la propia ficha.
- [x] No cambia el estado de tornillos ante la operación rechazada.
- [x] Tras comprar destornillador y bolsa, el botón de la ficha fija
      la placa, descuenta 1 de 10 tornillos y muestra confirmación.
- [x] Se actualiza el estado de la ficha y del menú contextual.
- [x] La opción Atornillar desaparece cuando ya se ha fijado la pieza.
- [x] Sintaxis JavaScript válida.
- [ ] Revisión visual del lateral a 320–1440 px con WebGL real.

Vista previa: `/preview/v7/?v=8-3-1-action-layout`.
