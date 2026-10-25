# Hardware Simulator 8.9.0-alpha — Prueba de precisión RAM

## Objetivo
Prototipo opcional de manipulación física del DIMM para el modo aventura.
No modifica la geometría tridimensional de la torre ni sustituye las validaciones
técnicas existentes.

## Recorrido
1. Comprar RAM compatible, colocar caja, chapa I/O y placa base.
2. Seleccionar el módulo RAM y activar **Prueba de precisión RAM** en «Acciones».
3. Pulsar **Encajar**: el handler técnico existente coloca el DIMM, pero todavía
   no lo asienta ni lo considera listo para POST.
4. El módulo aparece esquemáticamente con posición horizontal y orientación
   aleatorias pero reproducibles. Girarlo 180° si la muesca no coincide.
5. Centrar la RAM y mover **Acercar a la ranura** hasta presentarla.
6. Ajustar **Presión izquierda** y **Presión derecha** antes de pulsar
   **Aplicar presión simultánea**.
7. Solo un resultado favorable llama al mecanismo técnico existente
   \`seat_ram\`, fijando realmente \`state.ramSeated=true\`.

## Reglas educativas (no representan fuerza real en newtons)
- Presentación: orientación correcta, desviación horizontal de como máximo 8
  unidades didácticas y acercamiento de al menos 90/100.
- Presión óptima: ambos extremos entre 58 y 74/100, diferencia máxima 8/100.
  Éxito garantizado.
- Zona intermedia: ambos extremos entre 45 y 85/100, diferencia máxima 22/100;
  éxito probabilístico reproducible que disminuye cuanto más se aleja del
  rango central y del equilibrio.
- Fuera de la zona intermedia: no encaja; no se dañan piezas.
- Cada intento fallido de presentación o presión consume 0,8 minutos
  virtuales. El éxito conserva el registro normal de la operación de montaje.
- Una semilla independiente \`|ram-precision\` evita que los intentos de
  destreza cambien el sorteo de incidencias ESD/SATA.
- \`getExport().ramPrecision\` contiene configuración, intentos y sesión activa.
  El documento general mantiene \`pc-lab.build.v1\`; los campos son opcionales.

## Alcance y compatibilidad
- **Desactivado por defecto**. Al desactivarlo, sigue disponible el procedimiento
  clásico de «colocar RAM» y «asentar DIMM».
- La vista de práctica es esquemática HTML/CSS, enfocada a teclado, ratón
  y pantalla táctil mediante botones y deslizadores; no mide reflejos ni pulso.
- No hay daño permanente, sustitución de módulos, fuerza física medida ni
  cambios de inventario cuando se falla la prueba de destreza.
- El resultado siempre depende de la verificación técnica existente: pasar
  el minijuego no permite saltarse restricciones de alimentación o chasis.
- Recomendación futura: feedback 3D de ambas pestañas, ajustes docentes y
  puntuación de ergonomía sin mecanismos discriminatorios de destreza motora.

## Verificación
- Pruebas unitarias del motor de orientación, proximidad y presiones.
- Smoke integrado con reloj virtual, inventario, RAM asentada y modo clásico.
- E2E Playwright desktop/mobile y workflow de CI existentes.
- CI y publicación de Pages se consideran *pendientes* hasta obtener ejecución
  verificable para el SHA final.
