# Hardware Simulator 8.12.3-alpha — Expansión de pasta térmica en tiempo real

## Qué cambia
El motor de difusión de la versión 8.12.2 ya modificaba
la cobertura con cada giro, pero visualmente el mapa aparecía
abajo en un diálogo con desplazamiento vertical y se recreaban
los rectángulos SVG mediante `innerHTML`. La expansión podía
parecer invisible hasta terminar los tornillos.

Ahora se muestra una sección **«Pasta térmica · EN DIRECTO»**
justo debajo del título del minijuego, pegada a la parte superior
del diálogo mediante `position:sticky`: el jugador puede
seguir viendo la CPU incluso cuando desplaza el diálogo para
girar los tornillos.

En cada giro de 10% válido:
- Se aplica la presión del tornillo a `PC_THERMAL_PASTE`.
- `PC_PASTE_UI.updateSpread` actualiza inmediatamente el SVG
  antes de comprobar si terminó la fijación.
- Los rectángulos SVG tienen identidad persistente y transición
  suave de opacidad de 440 ms. Las nuevas celdas de pasta entran
  transparentes y se revelan gradualmente; las anteriores se
  conservan sin repintar todo el DOM en cada giro.
- Se actualizan el porcentaje de cobertura, la barra de
  progreso, el rebose, el desequilibrio y cuatro marcadores
  con la profundidad del tornillo y la esquina activa.
- Un giro fallido por desalineación no difunde la pasta.
- Al pasar de un tornillo a otro permanece el estado de
  distribución correcto; completar el cuarto tornillo sigue
  mostrando la evaluación y opciones de aceptar o limpiar.

## Diseño y accesibilidad
El monitor de pasta se mantiene arriba al desplazarse, tiene
una leyenda de presión, números tabulares e indicadores
gráficos, responde a pantallas pequeñas y respeta
`prefers-reduced-motion` eliminando las animaciones.
El modelo físico conserva las mismas dosis, tolerancias,
consumo de inventario, penalizaciones y calidad final.

## Validaciones
- Caso determinista de gota central: **7%** de cobertura inicial
  y **9%** al completar únicamente el primer giro del primer
  tornillo (10% de profundidad), antes de cerrar el disipador.
- Prueba específica de actualización de nodos SVG: nuevas
  celdas presentes tras el primer giro, rectángulos antiguos
  conservados y porcentajes visibles actualizados.
- Smoke de taller y E2E Playwright reforzados para comprobar
  progreso visual desde el primer giro y el mapa pegado
  mientras se desplaza la zona de atornillado.
- No se altera el `main/index.html` estable.

## Publicación
Vista previa experimental:
`/preview/v7/launch-8-12-3.html`
El nuevo HTML y ambos módulos modificados usan querystrings
de versión para limitar interferencias de caché.
La etiqueta «Motor 8.12.3» confirma qué lógica ha cargado el juego.

Nota: la difusión es una aproximación pedagógica; no predice
la resistencia térmica ni la hidrodinámica real de un compuesto.
