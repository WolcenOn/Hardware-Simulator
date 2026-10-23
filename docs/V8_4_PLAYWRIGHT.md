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
