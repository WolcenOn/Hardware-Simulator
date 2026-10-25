# 8.12.2-alpha — Reparación del inicio del minijuego del disipador

## Incidencia reproducida
Las versiones anteriores mostraban un paso de «Encajar disipador»
pero no iniciaban el minijuego de pasta y tornillos al terminarlo.
La práctica se abría en «Atornillar» y únicamente si ya había
destornillador y tornillos. Después de instalar el disipador su
unidad se consume del inventario; al comprar las herramientas
la selección cambia a un consumible, de modo que podía dejar de
ser posible seleccionar de nuevo el disipador desde el inventario.

## Corrección
- Después de la operación técnica **Encajar disipador** exitosa,
  se llama automáticamente a `continueCoolerMount()`.
- Si ya hay destornillador y tornillos suficientes para empezar,
  se abre sobre el visor 3D el popup de los cuatro anclajes
  con su **mapa de expansión progresiva de pasta térmica**.
- Sin esas herramientas, se deja el montaje pendiente, se elige
  `shopCategory='item'` y aparecen las secciones Tienda + Acciones,
  con un mensaje concreto de los materiales necesarios.
- Cuando la compra del material que faltaba completa el equipo
  de fijación, la práctica se abre automáticamente; el juego
  recuerda la identidad del disipador instalado a partir del estado
  técnico en lugar de exigir que quede en stock.
- El panel de Acciones incorpora siempre, mientras el disipador
  siga sin fijar, un botón «Iniciar minijuego del disipador y la
  pasta», independiente del artículo actualmente seleccionado.
- Si se cierra el minijuego, el botón vuelve a abrirlo y conserva
  el progreso de los tornillos.
- El atornillado clásico sigue disponible cuando se desactiva
  expresamente el minijuego. La pasta no se consume dos veces.

## Vista previa alternativa
Se publica tanto `preview/v7/index.html` como una página
**inmutable de entrada** `preview/v7/launch-8-12-2.html`
que carga los recursos con `?v=8-12-2-cooler-minigame`.
La URL nueva evita que una copia en caché del HTML
`preview/v7/index.html` o la ruta antigua del motor
esconda la corrección. El panel incluye una etiqueta visible
**«Motor 8.12.2»** para diferenciar la versión.
No se modifica `main/index.html`.

## Regresión
Pruebas de integración JavaScript:
1. Las herramientas ya estaban compradas: encajar
   muestra el mapa de expansión, cancelar y reabrir mantiene
   la profundidad parcial.
2. Herramientas aún no compradas: se muestran los productos
   faltantes, la compra del último material abre automáticamente
   la práctica y recupera el disipador instalado.

Las pruebas Playwright comprueban ambos recorridos en navegador,
aunque su ejecución completa y el contenido servido por GitHub
Pages deben confirmarse de manera independiente.
