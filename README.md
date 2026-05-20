# Hardware Simulator

Prototipo web estático para enseñar montaje de ordenadores y diagnóstico de averías de hardware.

## Estado actual

Esta primera versión está empaquetada como una aplicación de un solo archivo (`index.html`) para que funcione fácilmente en GitHub Pages y sea editable desde móvil.

Incluye:

- Escenario isométrico 2.5D con rotación en ángulos de 90 grados.
- Modo montaje guiado.
- Modo diagnóstico/taller con avería aleatoria inyectada.
- Validación básica de compatibilidad CPU/RAM/placa base.
- Simulación de consumo pico y sobrecarga de fuente.
- Averías pedagógicas: RAM mal encajada, EPS CPU sin conectar, SATA desconectado, pasta térmica incorrecta, PSU insuficiente y sectores defectuosos.
- Herramientas virtuales: inspección visual, pitidos BIOS, multímetro, SMART y prueba de estrés.

## Publicación en GitHub Pages

1. Entra en `Settings` del repositorio.
2. Abre `Pages`.
3. En `Build and deployment`, elige `Deploy from a branch`.
4. Selecciona rama `main` y carpeta `/root`.
5. Guarda.

GitHub Pages publicará el archivo `index.html` de la raíz.

## Próximos pasos recomendados

- Separar el código en `/css`, `/js` y `/data` cuando se trabaje desde ordenador.
- Añadir sprites SVG dibujados a mano para cada componente.
- Implementar drag and drop real.
- Añadir niveles, rúbricas y puntuación por diagnóstico.
- Migrar el motor de reglas a TypeScript cuando el proyecto crezca.
