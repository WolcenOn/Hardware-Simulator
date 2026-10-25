# Hardware Simulator 8.8.2-alpha — SATA latente

Se añade una incidencia educativa ficticia y reproducible `PROCEDURE_LATENT_SATA`.
Después de una conexión `connect:sataData` técnicamente válida, el cable puede
parecer conectado aunque su contacto falle durante el primer POWER válido.

## Semántica
- Solo las conexiones SATA de datos pueden recibir `latent_sata`.
- El RNG se consume tras el éxito técnico. El encendido no consume RNG.
- `loose_sata` conserva el intervalo de resultado >=0.94; `latent_sata` se
  asigna en [0.90, 0.94) y los demás resultados mantienen su distribución.
- Fallar los prerrequisitos de alimentación no revela una incidencia latente.
- Tras la manifestación, se utiliza el estado real `state.sataData=false`,
  el diagnóstico habitual y el mismo procedimiento de reconexión que en 8.8.1.
- También es posible descubrirla al desconectar el cable o resolverla
  retirando el disco y montando otra unidad compatible.
- La entrega exige comprobar el fallo latente y resolver reparaciones.
- Incidencias optativas y desactivadas por defecto, sin daño permanente.
- Sin modificaciones al motor 3D ni dependencias nuevas.

## Compatibilidad
`pc-lab.build.v1` se conserva. En `incidentSimulation` se agrega el campo
opcional `pendingLatent` y metadatos `revealed`/`revealedBy` y
`resolved`/`resolvedBy`/`resolvedSequence` a las incidencias correspondientes.

## Pruebas
Unitarias del motor, smoke de POWER inválido/válido, reparación y retirada;
Playwright de interfaz. CI y Pages requieren verificación del commit publicado.
