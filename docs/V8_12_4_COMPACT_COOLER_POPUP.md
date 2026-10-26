# Hardware Simulator 8.12.4-alpha — Panel sin desplazamiento

## Problema
La ventana emergente del atornillado del disipador tenía
más elementos apilados que altura disponible (~640 px).
El monitor de pasta estaba fijado arriba mediante
`position: sticky`, por lo que se superponía a la selección
de esquinas, la alineación, el indicador de profundidad o
los botones al desplazarse.

## Corrección visual
En el popup **únicamente del disipador que muestra la pasta**,
la zona activa se reorganiza en un tablero único, con:
- **Columna izquierda:** expansión de la pasta (SVG y porcentajes)
  y debajo el mapa para seleccionar los cuatro anclajes.
- **Columna derecha:** estado de tornillos, alineación con ratón
  y rueda, profundidad, mensajes y botones Enroscar/Aflojar.
- **Cabecera y pie permanentes en el flujo normal**; ninguna zona
  utiliza `position:sticky` ni `overflow:auto`.
- El diálogo ocupa como máximo el espacio del visor y
  distribuye su altura con CSS Grid/Flex (sin barras de scroll).
- En pantallas estrechas, dos columnas compactas,
  tipografía proporcional y medidas ajustadas sin
  sacrificar botones ni información de presión.
- El resumen final también se adapta a la altura disponible.

Las prácticas de otras piezas (placa, GPU, PSU, unidades)
conservan su interfaz. No cambia la física de distribución,
el inventario, la mecánica de la rueda ni la valoración final.

## Verificación
- Comprobación visual con un fixture representativo en Chromium,
  tamaños 280, 300, 320, 360, 390, 650, 850 y 1100 px:
  los dos paneles no se solapan, los controles quedan por encima
  del pie y no se requiere scroll vertical interno.
- Pruebas de regresión de marcado y estilos.
- E2E Playwright del proyecto ampliado con verificaciones
  geométricas de scroll y colisiones en varios anchos.
  La ejecución de ese E2E sobre la aplicación completa
  debe confirmarse independientemente.
- La vista previa se publica con una dirección única
  `preview/v7/launch-8-12-4.html`.
- No se modifica la página principal estable
  `main/index.html`.
