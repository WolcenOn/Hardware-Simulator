# Hardware Simulator 8.13.0-alpha — Tienda independiente, fichas y vendedor virtual

## Propósito pedagógico
La compra de componentes deja de estar enterrada en la columna lateral del
taller. La navegación tiene dos pantallas **dentro de la misma sesión**:
- **Taller y encargos:** mesa 3D, montaje, inventario y herramientas.
- **Tienda:** catálogo completo con categorías visuales, búsqueda, fichas
  técnicas de producto y vendedor virtual.

La tienda es una vista independiente de ancho completo (SPA); volver al taller
no recarga el documento, no destruye el encargo y mantiene presupuesto,
existencias, piezas instaladas y progreso de los minijuegos. Puede abrirse
desde la cabecera o desde el botón «Ir a la tienda» del panel del taller.
La sección antigua «Tienda» del lateral es ahora un acceso al catálogo
completo, **sin repetir allí toda la lista de productos**.

## Catálogo
- Nueve departamentos con iconos: caja, placa base, CPU, RAM, disipador,
  almacenamiento, gráfica, fuente y herramientas/accesorios.
- Tarjetas con nombre, categoría, precio, dos datos técnicos destacados,
  cantidad ya disponible, «Ficha técnica» y «Comprar».
- Búsqueda de texto dentro del departamento seleccionado.
- Presupuesto restante y gasto acumulado siempre visibles; se respeta el
  mismo control de saldo que ya existía.
- Para los componentes principales, los datos proceden de
  `api.catalog` (catálogo educativo ampliado por el simulador).
  Para casos y consumibles no representados allí, se reutilizan datos
  técnicos de `js/partInspector.js`. Las fichas muestran dimensiones,
  zócalos, memoria, interfaces, potencia o descripciones cuando estén
  declaradas. **No se inventan datos ausentes.**
- Las fichas están disponibles **antes** de comprar. No muestran un
  veredicto de compatibilidad automática, ni cambian la selección técnica
  del montaje.

## Vendedor virtual
Álex (representado por un avatar en la tienda) ofrece:
- «¿Me falta material?»: recordatorios contextuales de destornillador,
  tornillos, pasta térmica tras seleccionar/adquirir CPU, chapa I/O y
  cable SATA cuando proceda.
- «¿Cómo compro?»: explicación de que el alumno debe comparar sus fichas,
  comprar y volver al taller.

No compara placas, procesadores, fuentes ni memorias, no señala
incompatibilidades y no bloquea compras equivocadas: esas decisiones
continúan siendo ejercicios para el alumnado.

## Integración
- `index.html`: elemento `#adventureStorePage` separado de `main.layout`,
  botón de cabecera `#storeBtn`, estilos de tarjetas y navegación
  responsiva, sin recursos externos.
- `js/adventureMode.js`: `openStore`, `closeStore`, `renderStore`,
  `setStoreCategory`, `storeFacts`, `sellerMessages`; delegación
  de eventos del catálogo, fichas, búsqueda y vendedor.
- Las compras llaman al método existente `purchase(cat,id)`, sin duplicar
  inventario ni precios. Si faltan materiales del disipador, el flujo
  existente abre «Herramientas y accesorios» y vuelve a la práctica
  cuando el alumno termina de comprarlos.
- La vista previa sigue publicándose únicamente bajo
  `main/preview/v7/` y no modifica `main/index.html`.

## Validación
Las pruebas de integración validan la navegación, la compra y su
persistencia al volver al taller, los datos de las fichas antes de la compra,
y el alcance exclusivamente logístico de los consejos del vendedor.
Playwright actualiza el flujo de compras a la nueva página y añade
comprobaciones del catálogo. La ejecución completa en navegador y
la propagación de Pages se distinguen de las pruebas locales.
