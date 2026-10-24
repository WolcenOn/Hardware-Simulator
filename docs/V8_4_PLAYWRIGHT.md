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
