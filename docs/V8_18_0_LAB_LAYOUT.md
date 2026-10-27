# Hardware Simulator 8.18.0-alpha — laboratorio 3D ampliado y devoluciones

## Objetivo y cambios de diseño

En el modo aventura el laboratorio 3D pasa de una distribución de tres
columnas a **dos columnas**, dedicando el espacio principal al visor y
reduciendo el lateral izquierdo a un ancho compacto. El inspector de
diagnóstico antiguo se oculta visualmente en el taller, pero se conserva
en el modo técnico sin retirar los controles que lo alimentan.

Las cámaras y herramientas de visualización salen de encima del lienzo
3D y pasan a una barra inmediata debajo del visor. El botón «Vista
amplia» oculta temporalmente el panel izquierdo, ampliando el
laboratorio a toda la anchura; «Mostrar panel» restaura la disposición.
El renderizador actualiza su relación de aspecto con ResizeObserver.

## Navegación del lateral

Orden de acceso: encargo y presupuesto, piezas disponibles, montaje y
acciones, entrega, herramientas, USB e instalación, configuración de
simulación. Todas las opciones siguen disponibles, pero se
**pliegan** las no necesarias para un montaje ordinario.

Se elimina la sección duplicada «Tienda de informática» (la tienda ya
tiene pantalla propia) y «Estado de piezas montadas» (información
accesible desde la ficha 3D). No se elimina el motor de diagnóstico.

## Devolver desde la ficha de la pieza 3D

El menú contextual y la ficha detallada incorporan «Devolver · +XX €».
Usan directamente `adventureGame.canReturn(key)` y
`adventureGame.returnItem(key)`, igual que la mochila:
- Pieza sin montar y comprada: habilitada; devuelve una unidad y
  reintegra el coste real de la compra.
- Pieza montada, consumible gastado o cable conectado sin unidad libre:
  acción deshabilitada; la devolución no altera el saldo.
- Al agotarse el stock de la mesa auxiliar, su objeto 3D desaparece y
  su ficha se cierra. Se presenta confirmación dentro del propio visor.

El usuario no tiene que navegar a «Inventario» para devolver artículos
de la mesa. La ficha de objetos del chasis también indica
si están bloqueados por montaje.

## Pruebas

`tests/smoke.mjs`: estructura del panel, botones de foco y devolución.

`tests/e2e/workshop.spec.mjs`: área de trabajo ampliada, navegación a
ancho completo, devolución desde ficha real, saldo/stock/mesa y bloqueo
de piezas instaladas.

Publicación exclusivamente bajo `main/preview/v7/`. La raíz estable
`main/index.html` debe permanecer sin modificar.
