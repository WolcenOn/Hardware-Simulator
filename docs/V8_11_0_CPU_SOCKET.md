# Hardware Simulator 8.11.0-alpha — CPU: zócalo y palanca

## Comportamiento
La inserción de CPU tiene un minijuego **predeterminado** dentro de
«Tienda y encargos», mostrado en un popup HTML superpuesto al visor 3D.
Es una aproximación didáctica esquemática, no una manipulación de las mallas
físicas del procesador ni una escala de fuerza en newtons.

## Fases
1. Con la caja abierta, PC apagado, placa base instalada y CPU compatible
   comprada, «Encajar» abre el popup. La orientación y el desplazamiento X/Y
   iniciales se generan de forma determinista desde una semilla separada
   de incidencias SATA/ESD y del minijuego RAM.
2. **Girar CPU 90°** hasta hacer coincidir los triángulos de referencia del
   procesador y el zócalo. Mover sobre el zócalo mediante ratón, tacto o
   controles accesibles; aproximar con el control «Bajar suavemente».
3. Solo se pasa a la palanca si hay orientación 0°, distancia del centro
   ≤6 unidades didácticas y proximidad ≥90%.
4. La palanca presenta una barra oscilante roja-amarilla-verde. Pulsar
   «Cerrar palanca» detiene el indicador. **58–74/100** es el intervalo
   verde válido. Fuera de él la operación se rechaza sin daño.
5. Solo el éxito invoca el flujo técnico original `perform('fit')`,
   `tracked`, `api.install('cpu')`, con consumo normal de una única CPU.
   El estado `installed.cpu` permanece falso hasta cerrar correctamente
   la palanca. Cada error suma 0,6 minutos de tiempo virtual.

## Compatibilidad
El socket de CPU del catálogo debe coincidir exactamente con el de
la placa instalada (AM4, AM5, LGA1700, etc.). La validación se aplica
**también al montaje clásico**, para que no exista una vía de instalar
procesadores incompatibles.

## Seguridad y persistencia
- Cancelar abandona la prueba sin instalar ni consumir CPU.
- El mecanismo no aplica presión directa sobre los contactos, ni provoca
  daños irreversibles de forma ficticia.
- El popup se cancela al cambiar de objeto, semilla o encargo, y al salir.
- La opción «Usar colocación clásica» es voluntaria para el encargo actual.
- `getExport().cpuPrecision` añade `enabled`, `attempts` y `active`
  al JSON del montaje (`pc-lab.build.v1`), sin romper campos anteriores.
- La RAM y los tornillos conservan sus propios minijuegos independientes.

## Validación
Motor unitario de orientación, alineación, bajada, fuerza, RNG y seguridad;
prueba integrada de instalación/fallo/cancelación/compatibilidad,
smoke de regresión y escenario Playwright de interfaz. No se afirma
que la matriz Playwright, GitHub Pages o CI hayan finalizado hasta
confirmar su ejecución real.
