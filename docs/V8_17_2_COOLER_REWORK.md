# Hardware Simulator 8.17.2-alpha — reparación del ciclo térmico

## Problema
Al atornillar y retirar el disipador se recuperaba la pieza, pero la
pasta usada permanecía en la CPU sin una opción normal de limpieza,
bloqueando una segunda aplicación. La indicación «ya está atornillado»
no explicaba el procedimiento para repetir la instalación.

## Solución
En Taller → Acciones y herramientas, con una CPU instalada:

1. Disipador instalado: «Retirar disipador para repetir montaje».
2. Disipador retirado: «Limpiar pasta térmica de la CPU».
3. Comprar otra aplicación de pasta térmica en Tienda → Material.
4. Aplicar pasta nueva sobre la CPU (jeringuilla o modo clásico).
5. Seleccionar el disipador recuperado → Encajar → Atornillar.

La limpieza virtual lleva dos minutos técnicos, no recupera material
consumido ni requiere una compra extra de utensilios en esta práctica.
Se conserva el inventario de tornillos recuperados al retirar la pieza.
Las mediciones, la presión y el mapa de la aplicación anterior se
reinician antes de una nueva instalación.

El botón de limpieza solo se habilita con CPU instalada, sin disipador,
equipo apagado y caja abierta. El montaje rechaza una aplicación
reutilizada hasta limpiarla. Se conserva el resto de minijuegos.

## Verificación
- `tests/smoke.mjs` prueba el ciclo entero: compra, montaje, tornillos,
  retirada, pasta usada, bloqueo de reutilización, limpieza, dosis nueva
  y segundo atornillado.
- `tests/e2e/workshop.spec.mjs` reproduce los botones en el navegador.
- Publicar solo `main/preview/v7` y conservar sin cambios `main/index.html`.
