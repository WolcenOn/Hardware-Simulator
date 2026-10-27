# Hardware Simulator 8.19.1-alpha — restaurar diagnóstico y despejar controles duplicados

## Corrección de diseño

En 8.18 se ocultó erróneamente todo `#labDiagnostics` con
`body.adventure-on #labDiagnostics{display:none}`. El usuario necesitaba
conservar el **Inspector, el diagnóstico y la bitácora** de la barra derecha;
la petición era eliminar la redundancia de opciones del **lateral izquierdo**.

### Panel derecho: información que debe permanecer accesible

- Estado en directo: alimentación, POST, arranque, consumo, CPU y compatibilidad.
- Conectores/reglas y desglose de potencia de los componentes.
- Herramientas de análisis del sistema.
- **Bitácora `#eventLog`** con operaciones y avisos, incluso con Vista amplia.
- Banco de fallos e inyección solo en modo técnico, no durante encargos normales.

La columna derecha se ha restaurado, adaptado a un formato compacto y
permanece visible al ocultar el panel izquierdo con «Vista amplia».
En ventanas estrechas, el diagnóstico se reubica debajo del visor y del
panel del encargo sin desaparecer.

### Panel izquierdo: lo que se limpia

- Se retira la segunda entrada a la tienda (ya existe «Tienda» en cabecera).
- Se elimina el duplicado de encender/BIOS (ya existe encima del visor).
- Se retira el segundo botón de demostración (ya existe «Montaje recomendado»).
- Verbos, conectores, opciones de periféricos y selecciones manuales
  se guardan en `<details class="adv-manual-ops">`, cerrado por defecto.
  Las fichas de los objetos 3D siguen siendo el acceso principal.
- Intercambio de productos se agrupa en `adv-inventory-extras`, cerrado
  por defecto. Se mantiene la devolución directa desde las fichas 3D.
- Controles avanzados, herramientas y USB siguen accesibles en sus
  apartados de acordeón.
- Se preservan las herramientas de enseñanza, las acciones específicas de
  CPU/RAM/pasta/disipador y la entrega, sin duplicar los mecanismos del 3D.

El estado de apertura de los controles manuales e inventario se conserva
durante los repintados del panel, para poder terminar una operación sin
que se cierre el formulario intermedio.

### Distribución adaptable

- Escritorio amplio: lateral izquierdo compacto, visor 3D prioritario,
  diagnóstico/log a la derecha.
- Portátiles: visor con lateral compacto; diagnóstico debajo del visor.
- Móvil: visor primero, menú lateral y diagnóstico debajo.
- Vista amplia: se oculta el menú izquierdo, **nunca** el diagnóstico.

## Pruebas

`tests/smoke.mjs`: 73 pruebas y verificaciones 8.19.1 de panel derecho,
log, estado del panel izquierdo, ausencia de duplicados y modo amplio.

`tests/e2e/workshop.spec.mjs`: navegador de escritorio y móvil,
mensajes reales en bitácora, panel diagnóstico visible tras compras y
montaje, conservación de controles alternativos entre acciones.

**Publicar exclusivamente bajo `main/preview/v7/`. No cambiar
`main/index.html` estable.**
