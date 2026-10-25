# Hardware Simulator 8.10.1-alpha — Puntos de anclaje por pieza

## Qué cambia
El minijuego de **Atornillar** deja de tratar una placa o una GPU como
una única fijación. En el popup sobre el visor 3D aparece un esquema
interactivo de todos los anclajes de la pieza seleccionada. Cada agujero
muestra su estado: libre (○), activo (◎) o fijado (✚).

| Pieza | Tornillos simulados |
|---|---:|
| Placa base ATX | 9 |
| Placa base micro-ATX (A520) | 6 |
| Fuente ATX | 4 |
| GPU / tarjeta de expansión | 1 |
| SSD/HDD SATA | 4 |
| Unidad M.2/NVMe | 1 |
| Disipador | 4 |

Son **posiciones esquemáticas representativas**, no proyecciones exactas
de todos los puntos de las mallas Three.js. El modelo procedimental actual
de la placa solo contiene cuatro separadores 3D, por lo que se evita
hacer pasar por físicos otros cinco inexistentes en esa versión.

## Operativa
1. Comprar la pieza, el destornillador y paquetes de diez tornillos.
2. Instalar primero el componente; Atornillar abre el popup con su
   distribución de anclajes.
3. Seleccionar un agujero libre (o seguir el orden automático).
   Alinear el tornillo por arrastre y girar la rueda para roscarlo.
4. Un giro sin alineación no modifica la profundidad y consume
   0,2 minutos virtuales.
5. Cada tornillo que llega al 100 % marca ese punto como completado,
   **consume una unidad del inventario** y añade 0,5 minutos virtuales
   por anclaje intermedio.
6. La pieza solo queda fijada técnicamente cuando **todos** los anclajes
   están completos; la última fijación pasa por el handler de siempre
   (`tracked('screw',…)`), con su tiempo y posibles incidencias.

## Persistencia
- Si se cancela el popup, los tornillos ya insertados **se conservan**;
  al reabrir se retoma el siguiente agujero pendiente sin gastar de nuevo.
- Si se agotan los tornillos, el progreso queda guardado. Se puede
  comprar otro paquete de diez y continuar.
- «Usar atornillado clásico» permite completar el resto de agujeros
  consumiendo todos los tornillos pendientes, nunca obteniéndolos gratis.
- Retirar la pieza con destornillador devuelve los tornillos ya fijados
  a inventario y borra ese progreso, para evitar anclajes fantasma al
  montar otra pieza.
- `getExport().screwPractice.progress` registra el componente y
  sus IDs de anclaje terminados; `attempts` conserva la secuencia,
  ID de agujero y resultado de cada giro. Se exportan al JSON de montaje.

## Seguridad y alcance
Se mantienen apagado, caja abierta, compatibilidad de selección e inventario
como condiciones previas. No hay daños físicos ni pares de apriete reales.
La RAM conserva su popup oscilante sin cambios. No se modifica la página
estable `main/index.html`.

## Pruebas
Pruebas unitarias de mapas, semilla, colisiones y roscado, regresión
integrada con nueve tornillos/consumo/retirada/reanudación, y prueba
Playwright de mapa, ratón y rueda. La ejecución real de CI y el despliegue
de GitHub Pages requieren verificación posterior.
