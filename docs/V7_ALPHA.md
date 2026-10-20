# Hardware Simulator 7.0-alpha · 3D procedural

Esta rama es una **prueba alpha** del nuevo motor visual. No modifica `main` ni la versión 6.5 publicada en GitHub Pages.

## Qué incluye

- Componentes 3D generados por Three.js, **sin GLB, Blender ni modelos de pago**: bandeja/caja simplificada, placa B650 representativa, CPU, RAM, GPU, disipador, fuente, SSD SATA y NVMe.
- Geometrías con bordes redondeados, detalles del PCB, materiales PBR, iluminación ambiental y sombras.
- Cámara orbital con zoom, vista superior y vista isométrica; selección mediante clic/toque.
- Piezas persistentes: los estados del simulador cambian visibilidad, posición y animaciones, sin regenerar la escena en cada `render()`.
- Indicadores ámbar para RAM mal encajada, EPS desconectado, GPU sin alimentación, SATA desconectado y CPU_FAN pendiente.
- Integración con la lógica existente de instalación, compatibilidad, BIOS/POST, inyección de averías y diagnóstico, que sigue en el `index.html` de esta rama.

## Archivos

- `index.html`: interfaz y motor original de v6.5; carga el módulo nuevo y conserva la API `window.PC3D`.
- `js/procedural3d.js`: escenario 3D semirrealista procedural, renderizador y sincronización.

## Cómo probar

Desde una copia de **esta rama**, abre un servidor local en la carpeta del proyecto:

```bash
python -m http.server 8000
```

Visita `http://localhost:8000`, pulsa **Montaje recomendado** y prueba luego:

1. Vista isométrica, superior, zoom y expandir.
2. Seleccionar una pieza 3D: su categoría debería aparecer en el inspector.
3. Reiniciar y montar la RAM sin encajar: debe aparecer el indicador ámbar.
4. Conectar EPS, SATA y GPU desde Correcciones: desaparecen los indicadores correspondientes.
5. Encender el ordenador, entrar en BIOS, provocar un fallo y verificar que la lógica de POST siga funcionando.
6. Abrirlo en navegador móvil para probar los gestos.

**Nota:** se requiere conexión a internet para descargar Three.js desde jsDelivr. No hay modelos 3D de pago ni assets GLB.

## Limitaciones conocidas de esta alpha

- La geometría base muestra una B650 representativa aunque se seleccione A520 o Z790; quedan pendientes variaciones dimensionales y de conectores.
- Las piezas están representadas de forma estilizada y sus proporciones son aproximadas.
- El montaje continúa realizándose con los botones; la selección 3D solo inspecciona. Arrastrar y encajar piezas será un hito posterior.
- Los anillos ámbar son pistas visuales simplificadas, no conectores modelados al detalle.
- La escena y los recorridos de diagnóstico necesitan prueba visual en navegadores reales antes de fusionar con `main`.

## Evolución prevista

1. Tests funcionales y revisión visual de la alpha.
2. Generadores paramétricos por placa y tipo de componente.
3. Animaciones de instalación y cables procedurales.
4. Nueva UI con viewport predominante, ajustes de calidad y accesibilidad.

Objetivo del proyecto: mantener una plataforma estática y gratuita en GitHub Pages.
