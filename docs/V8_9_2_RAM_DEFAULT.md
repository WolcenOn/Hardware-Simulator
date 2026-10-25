# Hardware Simulator 8.9.2-alpha — RAM con minijuego predeterminado

## Comportamiento del modo «Tienda y encargos»
El minijuego de RAM sobre el visor 3D es **la opción predeterminada de cada nuevo encargo**. Después de comprar e instalar un módulo compatible, la colocación técnica inicial deja `state.installed.ram=true` y `state.ramSeated=false`; inmediatamente se presenta el popup de orientación, acercamiento y doble presión oscilante. Solo un encaje validado asienta el módulo.

## Reinstalación y cancelación
- Al retirar una RAM correctamente se invalida cualquier sesión abierta y se detiene la animación.
- Al instalar RAM nuevamente se crea una **nueva sesión** de minijuego con su orientación/posición inicial reproducible; el registro de intentos previos sigue disponible.
- Cancelar el popup deja la memoria **sin asentar**; se puede volver a abrir con «Encajar».
- La presión insuficiente, excesiva o muy desigual no instala el módulo y sigue consumiendo el tiempo virtual educativo establecido en 8.9.1.
- El historial exportado a JSON conserva las operaciones e intentos del minijuego.

## Alternativa clásica
El botón `Usar montaje clásico` permanece en las acciones de RAM como alternativa voluntaria. Desactiva el minijuego solo **para el encargo actual**. Un encargo nuevo restaura automáticamente la opción predeterminada. No cambia el «Montaje técnico» independiente ni la versión estable `main/index.html`.

## Validación
Se añaden regresiones de valor predeterminado, apertura automática, doble captura, retirada/reinstalación, cancelación, cambio voluntario a montaje clásico y reinicio de encargo. La suite Playwright real y la publicación efectiva de Pages requieren confirmación de CI.
