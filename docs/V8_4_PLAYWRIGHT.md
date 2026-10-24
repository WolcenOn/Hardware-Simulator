# Hardware Simulator 8.4.1 — jugabilidad, modelos y pruebas

## Correcciones de interacción

- **Montaje recomendado:** si no hay compras, abre directamente una demostración
  cableada en modo técnico. Si hay progreso, muestra una confirmación dentro del
  panel (sin usar `window.confirm`) para evitar una pérdida de compras silenciosa.
- **Encender / BIOS:** los accesos del banco y del acordeón de acciones continúan
  usando las validaciones POST, USB y vídeo. En modo aventura, los errores se
  muestran en el propio panel y en `workshopFeedback`.
- **Mazos PSU:** botón visible en «Acciones» siempre que la fuente esté
  instalada y los mazos aún no estén asegurados; permite resolver el bloqueo de
  la placa cuando se ha instalado la fuente antes.
- **Teclado, ratón y monitor:** accesos directos independientes dentro de
  «Acciones y herramientas» con estado conectado/desconectado; el juego
  sigue exigiendo que se compren los periféricos correspondientes.

## Catálogo y geometría

- **Disipadores:** stock compacto, torre aire 120 mm, doble torre,
  AIO líquida 240 mm y AIO líquida 360 mm. La geometría en la caja y la
  miniatura de la mesa cambian con la compra.
- **Efecto térmico didáctico:** frente al aire de referencia, un AIO 240
  reduce 8 grados y uno de 360 reduce 11 grados en este modelo simplificado;
  el disipador stock empeora la refrigeración. Bomba/ventilador requieren
  conexión `CPU_FAN`; la pasta térmica sigue siendo obligatoria.
- **Caja ATX:** negro, blanco y grafito con precio ficticio y acabado
  visible tanto en la mesa como en la torre.
- **Iluminación:** tira LED ARGB comprable y aplicable dentro de la caja
  abierta, con PC apagado. Se ilumina en 3D cuando el equipo está encendido.
- **Placas:** X670E, X570 y B760M añadidas con ficha técnica, socket, RAM,
  slots y representación procedural correspondiente.
- Los modelos son aproximaciones educativas; no son CAD ni mediciones
  de laboratorio. Los precios son exclusivamente ficticios.

## Ejecutar las pruebas

Desde la raíz del repositorio:

```bash
npm install
npm run test:smoke
npx playwright install chromium
npm run test:e2e
```

Para investigar un fallo de interacción:

```bash
npm run test:e2e:headed
npx playwright show-report
```

### Cobertura

- `tests/smoke.mjs`: ejecuta la lógica real del HTML con un DOM simulado:
  demo, BIOS, alimentación, PSU antes de placa, cableado USB, instalación
  LED, caja blanca y AIO con diferencia térmica.
- `tests/e2e/workshop.spec.mjs`: Playwright Chromium en resolución
  de escritorio y móvil. Navega la interfaz real, compra y coloca la caja,
  monta chapa I/O, accede a la demo y BIOS, confirma/cancela reinicio con
  compras, reordena mazos y conecta/desconecta teclado y ratón.
  También comprueba productos nuevos y anchos del panel.
- `.github/workflows/playwright.yml`: ejecuta Node smoke y Playwright
  en GitHub Actions para la rama y pull requests. En caso de fallo guarda
  HTML report, capturas, vídeo y trazas como artefactos durante 14 días.

### Estado de validación

- [x] Comprobación de sintaxis de módulos.
- [x] Prueba lógica instrumentada de demo, BIOS, PSU, USB, RGB y AIO.
- [x] Código de pruebas Playwright y workflow añadidos al repositorio.
- [ ] Ejecución efectiva de Playwright en Chromium (requiere runner con
      dependencias npm instaladas y navegador).
- [ ] Revisión visual de geometría AIO, LED y cámaras en navegador real.

**Vista previa:** `preview/v7/?v=8-4-1-gameplay-e2e`
**Rama:** `feature/v7-procedural-3d`
**Estable:** `main/index.html` sin sustituir.


## Actualización 8.4.2 — color de caja y enfoque de cámaras

- **Corrección de estado:** al colocar una caja del inventario, su
  `caseVariant` se establece **antes** del primer `render`. Anteriormente
  se asignaba después de `api.install`, por lo que la torre quedaba negra
  hasta una actualización posterior. Lo mismo se aplica al modelo de cooler.
- En instalaciones rechazadas no se consume el material ni se conserva
  temporalmente un acabado o disipador que no se llegó a montar.
- **Acabados:** el selector negro/blanco/grafito afecta al bastidor,
  marcos, bandeja, panel, canaletas y cubierta de la fuente. La pintura
  se mantiene al pasar de la mesa de componentes a la caja montada.
- **Nuevas cámaras independientes:** «Vista general» (ambas mesas),
  «Mesa de montaje» (banco principal), «Mesa de piezas» (banco auxiliar),
  «Periféricos» (monitor, teclado y ratón), «Monitor 3D»,
  «Vista torre», «Lateral» y «Trasera / cables».
- Cada botón cambia cámara **y punto orbital**: zoom, órbita y control
  de rueda giran alrededor de la zona elegida; no sólo acercan el
  mismo encuadre general. El botón activo se marca visualmente.
- **Doble clic** sobre mesa auxiliar, superficie del banco o periféricos
  en WebGL centra la zona. El clic simple mantiene la ficha técnica.
- Los cambios de montaje no fuerzan la cámara a una vista global.
  Al encajar una caja se centra específicamente la mesa principal.

### Pruebas
- [x] La primera actualización 3D tras encajar una caja blanca contiene
      el identificador `towerWhite`, no `tower`. Mismo test grafito.
- [x] Cinco cámaras verificadas con posiciones y objetivos distintos,
      sincronización del zoom y eventos de estado.
- [x] Playwright añadido para ambos acabados y cuatro botones de cámara
      (`tests/e2e/workshop.spec.mjs`).
- [ ] Ejecución E2E completa en Chromium con WebGL real.
- [ ] Ajuste visual de encuadres según resolución del usuario.

Vista previa: `/preview/v7/?v=8-4-2-focus-finishes`.

## 8.4.3 — separación entre placa y bandeja ATX

- Placa desplazada hasta apoyar su cara posterior sobre separadores de 6,5 mm.
- Los cuatro separadores comparten orificios con cada formato ATX/mATX.
- CPU, RAM, GPU, NVMe, chapa I/O, marcadores y extremos de cables acompañan a la PCB.
- Smoke comprueba las cotas; Playwright comprueba las mallas Three.js.
- Vista previa: `/preview/v7/?v=8-4-3-board-standoffs` sin modificar `main/index.html`.

## 8.4.4 — ventilador trasero y conexiones frontales

- Ventilador trasero desplazado al exterior de la huella de la chapa I/O; se
  actualizan rejilla trasera y origen de su cable SYS_FAN.
- Panel frontal superior procedural con pulsador momentáneo, LED de POWER,
  dos puertos USB-A y un USB-C.
- Pulsador 3D capturado por raycasting antes de la caja. Despacha
  `pc3d-case-power`, que pulsa el mismo control HTML de encendido, respetando
  las reglas de POWER SW / F_PANEL, PSU, POST y el modo aventura.
- Dos cabeceras internas diferenciadas USB3 (19 pines) y USB-C (Type-E),
  cableado visible sólo cuando se conecta cada circuito desde la interfaz o
  ficha contextual 3D. No se obliga al jugador a comprar cables internos
  que ya vienen con el chasis.
- El montaje recomendado conecta ambos cables USB para demostrar su recorrido.
- Tests smoke de geometría y conexiones; pruebas Playwright para pulsador, LED,
  USB-A, USB-C y cables independientes.
- Vista previa de prueba: `/preview/v7/?v=8-4-4-front-io`.
- La versión estable `main/index.html` permanece intacta.

## 8.4.5 — terminales realistas y puertos traseros USB

- `js/connectors3d.js` genera clavijas procedurales específicas con carcasas,
  contactos, pestañas, guías, muescas SATA y alivios de tensión. Incorpora
  ATX24, EPS8, PCIe, SATA datos/power, F_PANEL, PWM, USB 19-pin, Type-E,
  USB-A, USB-C y HDMI/DisplayPort.
- Los conectores de `cablesProcedural.js` se orientan con el vector del
  extremo de su propio mazo; se elimina el bloque genérico compartido.
- `getRearUsbAnchor(cfg,index)` centraliza posición de los cinco puertos
  del I/O shield en `partsRealScale.js`. Teclado y ratón utilizan
  los puertos 2 y 3; los cables y clavijas se reconstruyen al cambiar la
  placa (no quedan en coordenadas absolutas del banco).
- La salida de vídeo externa también se actualiza con el puerto GPU o placa
  elegido, y muestra clavija metálica HDMI/DP.
- Añadido diagnóstico `PC3D.getRearUsbAlignment()` para comprobar la
  coincidencia de clavija-toma en mm, y `PC3D.getConnectorModels()`.
- Smoke geométrico por placa y E2E WebGL comprueban anclajes, modelo de
  clavijas y conexiones tras cambiar de motherboard.
- Versión de trabajo en `feature/v7-procedural-3d`; vista previa en
  `/preview/v7/?v=8-4-5-real-connectors`. Mantener intacto `main/index.html`.

## 8.4.6 — tomas I/O físicas, USB-A, HDMI y DisplayPort

- Módulo compartido `portProfiles.js`: cuatro lados USB-A, perfil trapezoidal HDMI y esquina recortada DisplayPort, en escala 1 unidad = 50 mm.
- `rearPorts3d.js` modela receptáculos huecos con marcos metálicos, lengüetas aislantes y contactos. Se elimina la falsa hilera de bloques de los cinco USB de PCB y chapa trasera.
- Todas las placas, incluidos los tamaños mATX, instancian cinco puertos USB-A y dos salidas HDMI/DisplayPort a partir de `getRearUsbAnchor()` y `getRearVideoAnchor()`.
- La tarjeta gráfica incorpora un bracket para **3 DP y 1 HDMI** mediante `getGpuVideoAnchor()`.
- USB-A con carcasa, doble seguro, cuatro contactos y alivio de tensión; DP con bisel/botón de retención; HDMI con perfil trapezoidal y contactos. `connectors3d.js` conserva los modelos internos ATX/EPS/PCIe/SATA/Type-E/PWM.
- `alignRearPlug()` aplica orientación en coordenadas del chasis girado: inserción perpendicular y sección del macho paralela a la boca. El cable sale axialmente antes de doblarse.
- El monitor exterior usa un único cable visible, DisplayPort si se elige GPU y HDMI si se elige iGPU; se suprimen duplicados de vídeo internos ficticios.
- `getRearUsbAlignment()` y `getRearVideoAlignment()` miden en milímetros la separación frente a la **malla del receptáculo renderizado**, además de error angular, no dos posiciones derivadas de la misma fórmula.
- Smoke de perfiles y cableado; pruebas Playwright de la coincidencia real USB (B650/A520/Z790/B650M), GPU DP e iGPU HDMI.
- Vista previa `/preview/v7/?v=8-4-6-port-geometry`; no se modifica `main/index.html`.

## 8.4.7 — punto de salida flexible y conectores internos

- Cada clavija define dos anclajes: `insertLocal` (boca de inserción en el receptáculo) y `cableExitLocal` (extremo exterior del guardacable tras el sobremolde).
- `connectors3d.js` expone `getCableExit(THREE,plug,targetParent)` y una familia de alojamientos `createInternalHeader3d()`; el grosor, filas, guías y pestañas son específicos de ATX24, EPS4+4, PCIe6+2, SATA datos/power en L, USB 19-pin, USB Type-E, F_PANEL POWER SW y PWM 4 pines.
- `partsRealScale.js` exporta `getInternalHeaderAnchor(cfg,kind)` y `getGpuPowerAnchor(cfg,choice)`; estos anclajes son los mismos de las bocas 3D. También se han creado tomas modulares en la PSU (con compensación de su escala no uniforme), con el cable unido al borde trasero del enchufe.
- `cablesProcedural.js`: se instancian PRIMERO las clavijas; se transforma cada salida flexible a coordenadas locales de la torre y se genera DESPUÉS el tubo entre sus guardacables, sin atravesar el plástico o los contactos. Los mazos múltiples convergen sin separación al entrar al protector.
- Teclado y ratón en `workbench3d.js` y vídeo externo de GPU/iGPU en `procedural3d.js` usan la salida de cable world-space tras aplicar el giro de la torre.
- Diagnósticos `PC3D.getCableExitAlignment()`, `PC3D.getInternalPlugAlignment()`, `PC3D.getPsuPlugAlignment()`, `getRearUsbAlignment().flexGapMm` y `getRearVideoAlignment().flexGapMm`.
- Pruebas smoke de alturas de salida rígida, cabeceras y conectores; E2E con distancia flexible y coincidencia física de inserción.
- Sin cambios a `main/index.html`; vista previa `/preview/v7/?v=8-4-7-cable-exits`.

## 8.4.8 — inserción normal a la toma y curvas después del guardacable

- Se elimina de `js/cablesProcedural.js` el cálculo de orientación por el waypoint adyacente (que inclinaba ATX24, EPS, PCIe y POWER SW).
- `createCableHarness(THREE,root,assembly)` recibe el ensamblaje real. `getEndPose` lee el origen y el vector normal +Y transformado en WORLD de `assembly.internalHeaderModels`, `assembly.gpuPowerHeader` y `assembly.psuCableSockets`; lo convierte a local del chasis, compensando la rotación y la escala no uniforme de la fuente.
- El enchufe mantiene un eje de inserción perpendicular fijo al receptáculo; la ruta del cable no altera el giro. Sólo los extremos sin toma (frontal físico, caja y discos) usan normales explícitas coherentes con el chasis.
- Salida flexible desde `getCableExit()`; tramo rígido/recto independiente de 0,27 u (13,5 mm) o 0,37 u (18,5 mm), seguido de una curva Catmull-Rom. Los mazos eléctricos se reúnen antes de entrar en el protector.
- Los waypoints de ATX, EPS, GPU, SATA, F_PANEL, USB 19 pin y Type-E evitan subir desde la canaleta a través de la PCB; pasan antes por el borde derecho/izquierdo y por encima del header.
- `PC3D.getCableExitAlignment()` ahora devuelve `angleDegrees` (ambos extremos) y `straightMm`, además de `gapsMm`. `getInternalPlugAlignment()` y `getPsuPlugAlignment()` miden ángulos contra **las tomas 3D reales**, no contra el siguiente punto del cable. SATA/PWM utilizan el extremo correcto de la manguera.
- Pruebas smoke comprueban que ya no exista `next.sub(plug.position)`; Playwright comprueba perpendicularidad, encaje y tramo recto, incluso cambiando B650/A520/Z790.
- Publicación de previsualización: `/preview/v7/?v=8-4-8-orthogonal-connections`. No modificar `main/index.html` estable.

## 8.4.9 — tomas de placa y canalización de cables

- Cabeceras montadas con la cara inferior al ras de la PCB, no flotando. Los DIMM se separan del ATX24 y el disipador VRM se despeja del EPS. CPU_FAN se sitúa en el borde superior, evitando el disipador; aparecen tres headers SYS_FAN independientes (uno por ventilador de chasis).
- Se añaden tomas SATA de datos/alimentación reales en SSD 2.5 y HDD 3.5, y el cable llega al receptáculo de la unidad seleccionada. El disipador también lleva un conector PWM propio. El panel frontal superior tiene tomas internas POWER SW, USB3 de 19 pines y Type-E; los ventiladores de caja incorporan sus salidas PWM.
- `createCableHarness` recibe el ensamblaje y la torre, y obtiene ambos extremos directamente de los objetos 3D (headers de placa, GPU, PSU, SSD/HDD, panel frontal y ventiladores); los puntos fijos heredados dejan de determinar el anclaje.
- Nuevo `cableRouting3d.js`: planificador de vías con bandas por cable en la cámara trasera, entrada perpendicular, salida recta, corredor por el borde derecho/izquierdo y selección de trayectoria por longitud, número de giros y colisiones con envolventes AABB de PCB, bandeja, disipador, RAM, GPU, PSU, shroud y unidades SATA.
- La curva completa Catmull-Rom se sustituye por líneas y redondeos cuadráticos locales; cada redondeo se comprueba contra los volúmenes ocupados antes de generarlo. Se acorta la salida recta de la GPU para mantenerla dentro del volumen lateral del chasis.
- `PC3D.getCableSocketAlignment()` informa de distancia y perpendicularidad entre los dos extremos y los sockets visibles. `PC3D.getCableRoutingReport()` informa de estrategia, longitud, puntos y choques detectados por el planificador. Se añaden comprobaciones smoke y E2E para varios tamaños de placa.
- Las rutas siguen siendo aproximaciones didácticas en una torre procedural, no una simulación CAD completa de cables flexibles; las envolventes AABB conservadoras y los pasillos evitan los volúmenes principales, pero piezas pequeñas pueden requerir refinamiento visual.
- Vista previa `/preview/v7/?v=8-4-9-routed-cables`, sin modificar `main/index.html`.

## 8.4.10 — HDD en bahía real de 3,5 pulgadas

- Posición única de montaje `HDD_BAY_LAYOUT` compartida por geometría del HDD y jaula `towerATX.js`. El HDD de 3,5" ocupa la bandeja superior de la jaula frontal inferior (debajo del shroud de PSU); deja holguras reales respecto a paredes, suelo y techo de la bahía. Se añade `getHddBayPosition()` para que HDD y HDD4 usen idéntica posición.
- La jaula de dos bahías ahora muestra tres plataformas horizontales y sus carriles, más costillas y acceso desde el frontal. El disco ya no flota por debajo de la bandeja ni se representa fuera de las guías.
- Los soportes laterales de almacenamiento del chasis didáctico quedan ocultos para no confundirse con la jaula HDD real. SSD SATA 2,5" y NVMe mantienen sus ubicaciones independientes.
- Se actualizan las dimensiones de colisión HDD a la posición real del disco. La trayectoria SATA abandona la jaula por el lado de los conectores (-X) antes de bajar a la cámara de cables, sin atravesar estantes o discos.
- `PC3D.getHddBayAlignment()` informa sobre bahía seleccionada, centro, encaje, error de posición en mm y holgura respecto a estante/techo/laterales.
- Smoke valida encaje para el formato de 3,5" y correspondencia con la jaula; Playwright verifica colocación de HDD/HDD4, holguras, conexiones SATA y retorno a SSD.
- Previsualización `/preview/v7/?v=8-4-10-hdd-bay`. Se conserva intacto `main/index.html` estable.

## 8.4.11 — discos SATA dentro de la jaula e inspección visible

- Corrección del síntoma de la captura: el objeto del lateral trasero era el SSD SATA 2,5" predeterminado, no el HDD de 3,5". Antes se dibujaba siempre el soporte `rearSSD`; ahora desaparece esa posición en el lateral.
- `getSsdBayPosition()` / `SSD_BAY_LAYOUT` comparten eje y centro con `HDD_BAY_LAYOUT`: HDD en estante superior de 3,5", SSD SATA en bandeja inferior con adaptador de 2,5". NVMe permanece en la placa base.
- El adaptador inferior solo se muestra si hay SSD SATA instalado y la unidad se encuentra seleccionada. Se conservan los puertos físicos SATA de cada disco y se actualiza la caja de colisión del SSD para el planificador de cables.
- Botón **Bahías HDD / SSD**: encuadra la jaula e inspecciona su contenido. En esa vista se ocultan temporalmente el techo y frontal opaco del shroud; al salir de ella vuelven automáticamente.
- API de depuración `PC3D.getStorageBayAlignment()`: tipo seleccionado, estante, error del centro, holgura, visibilidad de adaptador/soporte trasero y corte visual. E2E comprueba SSD predeterminado, HDD, conectores SATA y restauración de la cubierta.
- Versión de desarrollo 8.4.11-alpha en `feature/v7-procedural-3d`, vista previa `/preview/v7/?v=8-4-11-drive-bays`; `main/index.html` no se modifica.

## 8.5.0 — emulación ficticia de medios de arranque y sistema operativo

- Tres sistemas originales (`NovaDesk 11`, `LibreForge`, `Terminalis`) sin fondos, logotipos ni interfaces comerciales reproducidas. No instala nada realmente ni modifica discos físicos.
- `js/osEmulation.js` contiene reglas compartidas: discos instalados, cables SATA/mode AHCI, USB con/sin imagen, orden de arranque, modo UEFI/CSM, Secure Boot, RAM y capacidad mínima. El motor detecta `NO_BOOTABLE_DEVICE`, `SECURE_BOOT_REQUIRED`, `UEFI_REQUIRED`, `DISK_TOO_SMALL` y otros casos.
- Añadidos selector de imagen USB, botón de conexión/desconexión, instalación y estado; BIOS incorpora firmware UEFI/Legacy. El modo aventura requiere comprar el USB instalador; la misma función realiza la instalación en ambos modos.
- La instalación representa cuatro fases de progreso que se cancelan al apagar. El SO se registra solamente al alcanzar el 100 % y queda asociado al ID del disco elegido; si se cambia de disco, el anterior no arranca en el nuevo.
- Al completar POST el monitor virtual y el monitor 3D distinguen búsqueda de medio, error sin sistema, instalador, instalación, splash y escritorio original de demostración; el sistema no se considera arrancado hasta tener una instalación válida en el disco que haya seleccionado el firmware.
- Se conservaron la lógica del botón POWER físico, POST escalonado, BIOS e interacción del taller. En el monitor 3D se dibuja una interfaz original mediante Canvas2D; no se reproducen pantallas de Windows/Linux.
- Pruebas smoke de arranque, medios y requisitos; E2E de instalación y cambio de disco. En modo aventura sigue habiendo una acción `Instalar SO`, ahora conectada a la misma emulación.
- Vista previa: `/preview/v7/?v=8-5-0-os-emulator`. La raíz estable de `main/index.html` permanece intacta.

## 8.5.1 — memorias USB de varios sistemas, preparación, compra y puerto físico

- Tienda de modo aventura ofrece USB vacío 32 GB por 12 €, USB NovaDesk 11 preparado por 39 €, USB LibreForge por 24 € y USB Terminalis por 19 €. Importes ficticios de simulación, no licencias ni precios comerciales.
- Un USB vacío puede convertirse en un USB preparado pagando sólo la diferencia (NovaDesk +27 €, LibreForge +12 €, Terminalis +7 €). La preparación convierte una unidad física existente en otro artículo del inventario sin duplicarla y contabiliza la tarifa adicional en el presupuesto.
- El panel **Preparar y conectar USB** aparece directamente bajo el progreso del encargo, sin estar escondido dentro de un submenú. Lista las memorias preparadas disponibles, tiene botones para conectarlas y expulsarlas, e informa de cuál está insertada. Un USB vacío no es arrancable.
- En modo aventura, el selector genérico de imagen del modo técnico queda bloqueado: únicamente un USB preparado poseído puede ocupar el puerto y determinar `state.usbImage`; la instalación exige una memoria preparada insertada. No se permite devolver el USB mientras está conectado ni conectar dos simultáneamente.
- Se añade un modelo 3D de pendrive con conector USB-A, cuerpo y banda de color por instalador. Usa el puerto trasero libre índice 0 del conjunto real de placa y se ancla a sus coordenadas recalculadas al cambiar el formato; teclado y ratón conservan los índices 2 y 3. Clic sobre pendrive conectado lo expulsa mediante la misma acción que la interfaz.
- `PC3D.getInstallerUsbPose()` permite comprobar índice, visibilidad, posición y error con la toma. Nuevas pruebas smoke de compra, preparación, cambio y expulsión, y E2E del panel, precios y posición de conexión.
- La demo técnica conserva el acceso directo a los USB ficticios para prácticas sin presupuesto; la tienda restringe únicamente el modo aventura.
- Vista previa: `/preview/v7/?v=8-5-1-usb-market`, sin tocar el `main/index.html` estable.

## 8.6.0 — casos docentes JSON, potencia por componente y fallos de montaje

- **Profesor**: panel «Crear / importar caso» en la cabecera. Campos título, cliente, enunciado, presupuesto, RAM mínima, almacenamiento requerido, GPU obligatoria y límite térmico. Descarga de JSON `pc-lab.teacher-case.v1`, importación local de hasta veinte casos validados (máximo 250 KB), rechazo de presupuestos/valores incorrectos, y selección inmediata del caso en la tienda. No se ejecuta código procedente del JSON, ni se envían archivos a servidor.
- **Alumno**: botón «Exportar montaje JSON» descarga `pc-lab.build.v1` con IDs y nombres de componentes, montados, conexiones, estado de tornillos, BIOS, SO ficticio, consumo pico/margen/fuente, presupuesto y evaluación del encargo.
- Consumo por CPU, GPU, RAM, placa, disco, disipador y ventiladores (estimaciones educativas). Se compara el pico de los componentes con potencia nominal de PSU; se aconseja 25 % de margen. Al superar la potencia nominal, un intento de encendido termina en desconexión protectora; en test de carga se simula también un transitorio del 15 %.
- POWER puede intentarse siempre. Ausencia de chasis, placa, fuente, ATX 24 o POWER SW deja aviso concreto. Errores de POST mantienen la secuencia diagnóstica cuando hay corriente y señal. Disipador/CPU_FAN o pasta insuficiente producen protección y apagado simulado tras unos segundos. El monitor virtual conserva el último diagnóstico tras el apagado.
- En montaje técnico hay botones **Fijar tornillos** por pieza; en aventura se sigue exigiendo destornillador y tornillos del inventario. Una pieza suelta provoca una animación reversible de caída/inclinación y puede activar apagado preventivo. No se manipula hardware real.
- `js/classroom.js`: validación/esquema de caso, exportación versionada y diagnóstico de potencia/mecánica. Smoke y E2E añadidos para JSON y apagado térmico.
- Vista previa `/preview/v7/?v=8-6-0-classroom` en branch de desarrollo y Pages; `main/index.html` estable permanece intacto.

## 8.6.1 — estabilización Playwright previa a la Fase 1 (sin motor nuevo)

Diagnóstico sobre la ejecución `40115023215` (8.6.0): smoke, HDD, OS, USB, aula pasaron; de 30 E2E generales de escritorio, 24 pasaron y 6 fallaron. Los seis fallos no comparten una única causa:

- **Compras repetidas** (PSU, placa) y pruebas de USB frontal: el listener `advShopCategory change` sustituía todo `#adventurePanel` mientras Playwright todavía interactuaba con su `select`. Ahora cambia **solo** las tarjetas `.adv-list`, conserva el control activo y no provoca desaparición de botones. El cambio es funcional, no un aumento de espera.
- **USB frontales**: los botones rápidos resolvían incorrectamente el nombre de estado (`frontusb3Connected` y `frontusbcConnected`, inexistentes), por lo que podían conectar pero no desconectar. Ahora mapean a `frontUsb3` y `frontUsbC`.
- **Botón POWER físico 3D**: el test de doble pulsación no respetaba el antirrebote de 350 ms y reusaba coordenadas desactualizadas. Espera 420 ms y vuelve a proyectar la posición en pantalla para el segundo clic, manteniendo el control real del chasis.
- **Clavijas USB traseras**: la demo recomendada ya deja teclado y ratón conectados. El test los apagaba con sus toggles y luego esperaba que siguieran visibles. Corregido el planteamiento del test sin cambiar el comportamiento funcional.
- **Tramo recto GPU**: el cable GPU emplea intencionadamente 8 mm de tramo recto en vez de los 12 mm de otros cables, por el lateral del chasis. El test distingue GPU (mínimo 7,5 mm) y el resto (>12 mm); evita cambiar una geometría que podría atravesar la caja.
- **Tiempo total CI y cancelación móvil**: dividir cada proyecto de escritorio/móvil en tres shards independientes (10 escenarios por runner) evita el bloqueo global por una prueba lenta. El timeout de test en CI pasa de 45 a 75 s, manteniéndose 45 s en local; las pruebas con varias compras tienen 105 s específicos. Se conservan los proyectos, las capturas y las trazas, y los nombres de artefactos incluyen el shard para evitar colisiones.

No se modifican los motores de tiempo, operaciones, misiones, puntuación ni el `main/index.html` estable. La vista previa recibe únicamente el ajuste funcional del controlador de aventura cuando se valide. Verificar tras cada push el estado **final**, no solo la ejecución inicial, de smoke y ambas matrices E2E.

### Segunda pasada CI de estabilización (40123204489)

- Los seis escenarios generales originalmente fallidos han cambiado de estado: el grupo 1 de escritorio y móvil pasa por completo, incluyendo compras repetidas y el pulsador físico de la caja. Los grupos de USB y cableado han confirmado alineamientos; dos expectativas han requerido ajuste final.
- El mínimo recto de `sataPower` es **11,5 mm**, ya que `cablesProcedural.js` define `.23` unidades en la toma (50 mm/unidad). Umbrales geométricos por familia: GPU >7,5 mm (8 mm nominal), EPS/ATX >14,5 mm (15 nominal), demás >11 mm (11,5 nominal). El chasis no se cambia por un límite de test incorrecto.
- El recorrido de USB frontales con tres compras, tres operaciones y render WebGL requiere un límite **específico de 180 s** en runners de software; en móvil acabó correctamente en 46,7 s, en escritorio la ejecución previa agotó los 105 s. No se oculta el resultado, se sigue exigiendo conexión, visualización y desconexión reales.
- El test general conserva tres shards por escritorio y tres por móvil, con diagnósticos individuales en caso de fallo. La prueba de funcionamiento de los motores existentes permanece sin cambios.
