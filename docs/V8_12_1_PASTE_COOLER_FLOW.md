# Hardware Simulator 8.12.1-alpha — Continuidad pasta → disipador

## Incidencia
Tras confirmar la aplicación de pasta con jeringuilla, el inventario
se quedaba seleccionado en `item:paste`, ahora consumido. La opción
«Encajar disipador» solo se dibuja cuando se ha seleccionado una pieza
`cooler:...`, y al comprar una se abrían las secciones «Tienda» e
«Inventario», dejando «Acciones» plegada. Esto hacía parecer que había
fallado la última acción y que ya no existía la opción de colocar el
disipador.

## Corrección de continuidad
- Después del éxito de la jeringuilla se busca un disipador comprado
  y disponible. Si existe, queda seleccionado, el verbo pasa a
  `fit` y se abre automáticamente «Acciones» junto al inventario.
- Si todavía no hay disipador comprado, se elige la categoría
  «Disipador» en tienda, se abre la sección de compras y se explica
  el siguiente paso sin inventar una pieza ni gastar saldo.
- Al comprar un disipador con la CPU ya preparada con pasta, el
  juego abre `Inventario + Acciones` para mostrar «Encajar».
- Se incorpora el botón visible «Continuar: colocar disipador» al
  tener la pasta preparada, con acceso directo al siguiente paso.
- La guía del encargo cambia según haya pasta preparada o el
  disipador instalado y pendiente de atornillar.

## Seguridad y compatibilidad
Esta corrección es de estado de interfaz/navegación: la instalación
real sigue validando la pieza comprada y la compatibilidad. Se
mantienen el motor de jeringuilla, la simulación progresiva
de presión por los cuatro tornillos, el inventario y el
control de temperatura. No cambia `main/index.html`.

## Pruebas
- Integración JavaScript: pasta confirmada sin disipador comprado →
  tienda de disipadores; compra → Acciones y botón Encajar visibles;
  Encajar instala el disipador.
- Integración JavaScript: disipador previamente comprado →
  selección automática, Acciones visibles, Encajar funciona.
- Smoke y Playwright E2E amplían regresión de flujo de usuario.
  No se afirma la ejecución real de Playwright hasta comprobarla.
