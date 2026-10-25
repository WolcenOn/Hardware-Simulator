# Hardware Simulator 8.10.0-alpha — Minijuego de atornillado

## Alcance
Prototipo interactivo habilitado por defecto en **Tienda y encargos** para fijar
**placa base, fuente de alimentación, almacenamiento, GPU y disipador**.
Se mantiene el botón «Usar atornillado clásico» en las acciones de cada
pieza. La vista estable `main/index.html` y el modo técnico se conservan.

## Cómo se juega
1. Comprar e instalar la pieza y disponer de un destornillador y al menos
   un tornillo en el inventario; caja abierta y ordenador apagado.
2. Al pulsar «Atornillar», se muestra un **popup sobre el visor 3D**.
   La posición inicial del tornillo es variable y reproducible con semilla,
   dentro de un espacio 2D didáctico.
3. Arrastrar el tornillo con el ratón/dedo para centrarlo sobre el agujero.
4. Girar la **rueda hacia abajo** sobre el área para enroscar: la profundidad
   avanza de 10 en 10 (0–100). La rueda hacia arriba puede aflojar.
5. Si el tornillo está desalineado, puede girar visualmente pero su
   **profundidad NO avanza**. Cada giro en falso añade 0,2 minutos virtuales
   al reloj del taller. No se rompe ni consume material.
6. Solo al alcanzar el 100 % se invoca la acción técnica preexistente:
   gastar 1 tornillo, marcar la fijación correspondiente y registrar
   operación, tiempo e incidencias con el motor transaccional.

## Estado e integración
- `js/screwPrecision.js`: motor sin DOM, determinista por semilla y
  secuencia de sesiones. Tolerancia radial educativa de 7 unidades
  (no representa milímetros ni criterios industriales).
- `js/adventureMode.js`: abre y cierra el popup, valida seguridad y
  herramientas antes de empezar y **vuelve a comprobarlas** antes de
  cada giro. Cancela sesiones al cambiar de pieza, iniciar encargo,
  salir del taller o modificar la semilla.
- `index.html`: overlay HTML/CSS sobre el viewport, sin modificar mallas 3D.
  Arrastre con Pointer Events, wheel sin zoom mientras está activo,
  botones «Enroscar/Aflojar» y teclado (flechas y +/-) como alternativa.
- `getExport().screwPractice` y exportación JSON de montaje: estado y
  registro de cada giro. Conserva `pc-lab.build.v1`.

## Límites de esta primera fase
Una operación de fijación representa **un tornillo por pieza**, coherente
con el inventario y el handler técnico ya existentes. Futuros pasos pueden
reflejar conjuntos de tornillos, cabeza dañada, tipos de rosca y puntos
3D específicos sin introducir daños irreversibles de momento. No se simulan
pares de apriete o fuerzas físicas reales.

## Pruebas
Motor unitario: desalineación, avance correcto, retroceso, semilla y rechazo
de movimientos inválidos. Smoke integrado: inventario, tiempo virtual,
fijación real solo a profundidad completa, cancelación y modo clásico.
Playwright E2E: arrastre real del ratón y rueda dentro del visor.
Los resultados de Actions, Playwright real y despliegue público quedan
pendientes hasta comprobarlos con el navegador/CI.
