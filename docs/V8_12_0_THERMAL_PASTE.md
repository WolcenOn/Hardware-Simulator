# Hardware Simulator 8.12.0-alpha — Jeringuilla y pasta bajo disipador

## Secuencia de juego

1. En «Tienda y encargos», comprar e instalar CPU y una dosis de
   `item:paste`, seleccionar la pasta y pulsar **Aplicar**.
2. Un popup sobre el visor 3D representa la superficie IHS de la CPU y
   una jeringuilla graduada **3–2–1–0**. La punta sigue el ratón.
   Mantener pulsado dispensa pasta en la posición seleccionada; moverla
   crea líneas o varios puntos. El caudal se acelera al presionar y
   **decae gradualmente al soltar** por una inercia/viscosidad didáctica.
3. Pulsar **OK** registra la dosis en el inventario; **todavía no se
   muestra un resultado de cobertura**. Los depósitos quedan preparados
   y la dosis se consume una sola vez, sin gastar nada al cancelar.
4. Instalar el disipador mediante «Encajar», seleccionar **Atornillar**
   y usar sus cuatro puntos de anclaje. Durante **cada giro válido**
   el mapa 2D de pasta se difunde de forma localizada bajo el anclaje.
   Los giros desalineados no cambian la profundidad ni la cobertura.
5. Es posible cambiar de tornillo **con roscado parcial**, conservar
   la profundidad individual y seguir en cruz: p. ej. 1→4→2→3,
   10 % por vuelta. El comportamiento de la pasta depende del orden
   y de la progresión; el modelo almacena el desequilibrio máximo.
6. Al llegar los cuatro al 100 % se abre la revisión con cobertura,
   rebose, desequilibrio máximo y resultado final.
   **Finalizar instalación** consume el último tornillo y marca la
   fijación técnica real del disipador.
   **Limpiar y repetir** retira el disipador, recupera los tornillos
   y el propio disipador, marca la CPU sin pasta, añade 2 minutos de
   retrabajo y **no devuelve la dosis de pasta gastada**. Para repetir
   es necesario adquirir y aplicar otra dosis.

## Reglas y evaluación

`js/thermalPaste.js` es un motor de difusión en una rejilla de
35×35 celdas extendida fuera de los bordes de la CPU. La masa de
cada depósito se conserva al distribuirse. El resultado mide celdas
cubiertas, masa fuera del IHS, volumen y desnivel máximo de apriete.
La valoración distingue:
- `good` — cobertura suficiente, poco rebose y apriete progresivo.
- `insufficient` — cantidad o superficie cubierta insuficientes.
- `excessive` — volumen demasiado alto o pasta desbordada.
- `uneven` — distribución no uniforme.
- `unbalanced` — distribución aceptable pero exceso de desnivel
  durante el apriete (consecuencia educativa).

Los intervalos son didácticos y **no constituyen un modelo validado
de reología, presión real, resistencia térmica o conductividad**.
No se obliga a una figura específica: un punto, varios puntos y
líneas pueden servir si la cobertura y dosis resultan adecuadas.

### Temperatura
Una mala aplicación aceptada deja `state.paste = 0.5`, por debajo
del umbral de falla térmica 0.7 ya existente en el simulador.
Una buena aplicación deja `state.paste = 1` y el modelo
térmico funciona normalmente. Los problemas pueden repararse
desmontando, limpiando y repitiendo el procedimiento.

## Integración y compatibilidad
- `js/thermalPaste.js` — motor matemático puro, sin DOM.
- `js/pasteGameplay.js` — popup, ratón/táctil, indicadores y dibujo
  de depósitos y difusión.
- `js/adventureMode.js` — inventario, acciones, progreso por tornillo,
  consumos, calendario de trabajo, cancelación y modo clásico.
- `index.html` — estilo y scripts. Solo preview: no se altera
  `main/index.html`.
- `getExport().thermalPaste` y JSON final guardan dosis, depósitos,
  estado de expansión, historial, evaluación y orden de los tornillos.
- RAM, CPU y fijaciones de otras piezas conservan sus mecánicas.
- Se permite montar un disipador sin pasta para conservar los
  escenarios educativos de error térmico; no será una instalación
  térmicamente correcta.

## Validación
Pruebas unitarias (jeringuilla, dosis, inercia, difusión,
insuficiencia/exceso, patrón cruzado contra desequilibrado) y
regresión integrada (consumos, limpieza, devolución de material
y fijación real tras revisión). E2E Playwright para la jeringuilla
y presión progresiva. La ejecución real en navegador/CI y
la propagación de GitHub Pages deben confirmarse por separado.
