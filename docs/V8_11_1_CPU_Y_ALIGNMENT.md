# Hardware Simulator 8.11.1-alpha — Corrección de alineación vertical CPU

## Problema observado
El usuario informó que la CPU se veía visualmente centrada con el
deslizador **Y = 12**, mientras el motor exige **Y = 0** para validar
la alineación. No era un error de la GPU.

## Causa
En `js/adventureMode.js`, tanto el render inicial del popup como la
actualización interactiva calculaban la posición vertical con
`st.y * 2 - st.lower * 0.24` píxeles. Al bajar la CPU al 100 %,
aparecía desplazada 24 píxeles hacia arriba. Eso equivalía a un
desplazamiento de 12 unidades de Y.

## Solución
- Nueva función compartida `cpuPiecePose(st)` para posicionar
  **tanto el HTML inicial como las actualizaciones interactivas**.
- La posición vertical ahora depende **únicamente de `st.y * 2`**:
  Y=0 equivale al centro del zócalo sin importar la bajada.
- `st.lower` afecta solo a la escala del procesador, sin introducir
  una traslación que contradiga el motor de alineación.
- Se conserva el comportamiento de girar 90°, mover por ratón,
  acercar al zócalo y pulsar la palanca con marcador oscilante.
- No cambian las tolerancias del motor, penalizaciones, inventario,
  compatibilidad ni los minijuegos de RAM y tornillos.

## Comprobaciones
Prueba de integración con CPU AM5: Y=0 centrado al 0 % y al 100 % de
bajada; Y=12 desplazado 24 píxeles; colocación lógica exitosa al volver
a Y=0. Nuevo smoke que comprueba la propiedad CSS y una aserción
Playwright de las coordenadas geométricas del procesador y del zócalo.
La ejecución real de Playwright y el despliegue efectivo de GitHub
Pages requieren verificación en CI/navegador.

## Publicación
Solo a `feature/v7-procedural-3d` y `main/preview/v7/`.
`main/index.html` permanece intacto.
