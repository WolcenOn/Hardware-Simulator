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


## Mejoras de escala y localización de componentes (octubre de 2026)

El motor ahora utiliza la convención **1 unidad Three.js = 50 mm**, común a todos los componentes.
Se muestra un banco de montaje con la placa horizontal para facilitar las conexiones.
Las posiciones internas de conectores siguen siendo aproximadas y están inspiradas en
fotografías del hardware, **no** sustituyen planos CAD de los fabricantes.

### Dimensiones utilizadas

| Elemento | Medida | Referencia |
|---|---|---|
| B650 ATX | 305 × 244 mm | estándar ATX y ASUS Prime B650-Plus (disposición visual) |
| A520 mATX | 226 × 221 mm | ASUS Prime A520M-K |
| Z790 ATX | 305 × 244 mm | estándar ATX y MSI PRO Z790-A WiFi (disposición visual) |
| RX 7600 dual | 245 × 134 × 49 mm | ASUS Dual RX 7600 O8G |
| RTX 4070 dual | 267,01 × 133,94 × 51,13 mm | ASUS Dual RTX 4070 OC |
| Ventilador de 120 | 120 × 120 × 25 mm | Noctua NF-A12x25 |
| Disipador de torre | 158 mm de alto, 125 de ancho | Noctua NH-U12S redux |
| PSU representativa | 150 × 140 × 86 mm | Corsair RM850e |
| SSD 2,5" | 100 × 69,85 × 7 mm | formato físico habitual de SSD |
| HDD 3,5" | 147 × 101,6 × 26,1 mm | formato físico habitual de HDD |
| M.2 2280 | 80 × 22 mm | formato M.2 2280 |

Las medidas RX 7600 y RTX 4070 son **referencias geométricas de tamaño**, no
réplicas de modelos comerciales. La lógica de conectores del catálogo se conserva.
Por ejemplo, la RTX 4070 del simulador mantiene su requisito 12VHPWR aunque la
ASUS Dual citada como referencia física emplea 8 pines. Antes de hacer un simulador
de conexiones exactas por SKU, el catálogo necesita referencias individuales.

### Distribución corregida

- La placa mATX tiene realmente menos PCB y dos DIMM; las ATX ofrecen cuatro.
- El socket está en el tercio superior, DIMM hacia la derecha, PCIe en la mitad inferior.
- La GPU ahora va de canto, **perpendicular** a la placa, conectada en PCIe.
- El ventilador del disipador de torre mira hacia el lateral, y el de la PSU hacia arriba.
- La fuente y las unidades SATA ocupan una zona del banco distinta de la placa.
- Los módulos M.2 quedan sobre la placa; los HDD y SSD de formato SATA, fuera.
- Las piezas seleccionadas cambian con el catálogo sin reconstruir la escena 3D.
- Los indicadores de conexión pendiente se recolocan según la variante de placa.

### Fuentes y fotos consultadas

- ATX / microATX: https://studylib.net/doc/8869600/microatx-motherboard-interface-specification
- ASUS A520M-K: https://www.asus.com/es/motherboards-components/motherboards/prime/prime-a520m-k/techspec/
- ASUS Dual RX 7600: https://www.asus.com/uk/motherboards-components/graphics-cards/dual/dual-rx7600-o8g/techspec/
- ASUS Dual RTX 4070: https://www.asus.com/es/motherboards-components/graphics-cards/dual/dual-rtx4070-o12g/techspec/
- Noctua NF-A12x25: https://www.noctua.at/en/products/nf-a12x25-pwm/specifications
- Noctua NH-U12S redux: https://www.noctua.at/en/products/nh-u12s-redux/specifications
- Corsair RM850e: https://www.corsair.com/ww/cf/explorer/diy-builder/power-supply-units/corsair-rme-series/

No se incorporan fotografías ajenas a los archivos publicados: se utilizan
exclusivamente como referencia visual y dimensional para crear geometrías propias.

### Comprobación visual pendiente

- [ ] Placa B650 completa y componentes sin solaparse.
- [ ] Pasar a A520 y Z790; comprobar geometría, CPU, RAM y conectores.
- [ ] Cambiar RX 7600 por RTX 4070; verificar sus longitudes diferentes.
- [ ] Cambiar SSD SATA, HDD y NVMe y verificar ubicación y proporciones.
- [ ] Vista superior/isométrica y vista explosionada sin desplazamientos acumulados.
- [ ] Revisar rendimiento móvil y eventos de clic/selección.
- [ ] Montaje/BIOS/POST/diagnóstico sin regresiones.
