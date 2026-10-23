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
