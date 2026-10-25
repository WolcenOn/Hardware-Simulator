# Hardware Simulator 8.9.1-alpha — Popup de presión DIMM

## Cambio de interfaz
Se retira la escena y el control de presión anteriores del panel lateral.
El usuario sigue activando la práctica de RAM desde «Acciones», pero el minijuego
aparece como un popup HTML accesible dentro del visor de montaje 3D
(`#viewportWrap > #ramPrecisionPopup`), por encima del lienzo Three.js.
No se modifica la geometría 3D ni la versión estable.

## Flujo
1. Instalar RAM compatible desde la tienda. El adaptador físico deja
   `installed.ram=true` y `ramSeated=false`.
2. El popup muestra posición y orientación iniciales reproducibles; se puede
   **girar 180°**, alinear la muesca y acercar el módulo.
3. Tras una presentación válida aparecen **dos barras oscilantes**:
   «Extremo izquierdo» y «Extremo derecho». Cada una tiene un marcador blanco
   que va y viene entre 0 y 100 (rojo → amarillo → verde → amarillo → rojo).
4. El alumno detiene cada indicador con su botón. Se registran las dos lecturas.
   La evaluación existente distingue encaje seguro, probabilístico o fallido.
5. Si falla, suma **0,8 minutos virtuales**, la RAM permanece sin asentar y
   vuelven a oscilar ambos marcadores. Si funciona, se invoca la operación
   técnica existente `seat_ram` y se cierra el popup.

## Escalas y seguridad
Son valores exclusivamente educativos; nunca expresan fuerza real en newtons.
Zona verde de presión: 58–74 y diferencia entre extremos como máximo 8.
Zona intermedia: 45–85 y diferencia máxima 22, con probabilidad reproducible.
Rojo, presión insuficiente o desequilibrio excesivo: no encaja.
Ningún fallo de práctica destruye ni consume una RAM.

## Motor y reproducibilidad
`PC_RAM_PRECISION.oscillatorValue(elapsedMs,side)` es una función temporal pura
con onda triangular y distintos periodos/fases (izq. 1800 ms, dcha. 2200 ms).
Los valores de captura se guardan en `getExport().ramPrecision.attempts` y
también en el JSON de montaje, manteniendo `pc-lab.build.v1`.
El movimiento usa `requestAnimationFrame`, únicamente para dibujar el popup.
La simulación del tiempo y los riesgos del encargo mantienen motores separados.
La captura de tiempos reales no garantiza la misma ejecución motriz entre
partidas, pero sí reproduce el resultado con las lecturas registradas.

## Compatibilidad y accesibilidad
Se preserva el modo clásico desactivado por defecto, la entrada con teclado y
los controles táctiles. Escape/cancelación no instala RAM, no consume material ni
deja una animación funcionando. La prueba puede desactivarse sin penalización.
El popup es un esquema superpuesto: aún no mueve las pestañas del modelo 3D.

## Pruebas
Se amplían tests del oscilador, smoke integrado de fracaso/éxito y pruebas
Playwright de ubicación, visibilidad y captura. Para dar por validada la
versión faltan resultados reales del navegador y de GitHub Actions.
