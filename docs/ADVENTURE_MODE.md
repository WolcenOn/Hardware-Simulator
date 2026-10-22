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
