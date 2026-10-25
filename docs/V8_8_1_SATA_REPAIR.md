# Hardware Simulator 8.8.1-alpha — Fase 2b.1

## Alcance
Primera consecuencia física educativa de una incidencia aleatoria: el cable SATA de datos puede quedar suelto tras una operación `connect:sataData` técnicamente válida. Es un fallo procedimental con probabilidad **ficticia**, dependiente de la semilla, velocidad y factores del motor ya existente. Las incidencias siguen desactivadas por defecto.

## Funcionamiento
- Solo se aplica cuando el motor devuelve `PROCEDURE_LOOSE_SATA` para una conexión SATA de datos que el handler técnico haya completado correctamente.
- La operación original queda registrada como exitosa; una consecuencia posterior deja `state.sataData=false` y marca la operación como deshecha en el motor de operaciones.
- El diagnóstico y la evaluación de arranque existentes detectan el cable suelto. Inspeccionar proporciona una pista específica.
- La entrega se bloquea mientras la reparación esté pendiente.
- Apagar, abrir el chasis y reconectar mediante la operación habitual `connect:sataData` resuelve la avería, registra un retrabajo y restaura la conexión. El intento de reparación no sortea otra incidencia, evitando ciclos irresolubles.
- No se daña ni reemplaza ningún componente; no se consume un cable nuevo y no se alteran geometrías ni rutas 3D.
- `incidentSimulation` sigue siendo un campo opcional del esquema `pc-lab.build.v1`. Añade `pendingRepairs` y para esta incidencia los campos `resolved` y `resolvedSequence`. JSON v1 previo sigue siendo compatible.

## Pruebas
Se añaden pruebas de riesgo dirigido a SATA, registro de retrabajos, smoke integrado de fallo/reparación y E2E de interfaz en Chromium. Comprobar los trabajos completos de GitHub Actions contra el SHA de este commit antes de declarar la versión aprobada.

## Limitaciones deliberadas
No se introducen daños permanentes, fallos ESD irreversibles, nuevos costes, cambios de misiones ni un motor alternativo de diagnóstico. Los cambios de semilla a mitad de un encargo todavía necesitan un registro completo de transiciones para garantizar reproducción histórica de la sesión.
