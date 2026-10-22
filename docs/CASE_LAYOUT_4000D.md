# Hardware Simulator 7.3-alpha — distribución de una torre ATX

## Referencia

La geometría de la **torre vertical**, la cámara inferior PSU y las zonas para SSD/HDD
se han inspirado en la estructura y manual público de la **Corsair 4000D Airflow**
(CC-9011200-WW). No se incluye un diseño CAD de Corsair y las piezas son
procedurales independientes, sin utilizar modelos protegidos ni fotos como texturas.

**Fuentes para verificar cotas y ubicación:**
- Manual de Corsair (español):
  https://www.manualslib.es/guide/952607/manual-de-corsair-4000d-4000d-airflow.html
- Medidas oficiales y capacidad de ventilación:
  https://help.corsair.com/hc/es/articles/360050885232-Caso-Cu%C3%A1l-es-la-capacidad-de-ventiladores-de-la-torre-media-de-la-serie-4000-4000D-4000D-Airflow-4000X
- Fotografías del espacio interno y bandejas:
  https://www.nexthardware.com/recensioni/corsair-4000d-airflow-1459/5/

## Dimensiones reales de la caja

| Característica | Valor usado |
|---|---:|
| Profundidad exterior | 453 mm |
| Anchura exterior | 230 mm |
| Altura exterior | 466 mm |
| Longitud máxima de GPU | 360 mm |
| Altura máxima de disipador | 170 mm |
| Montajes de ventilador frontal | 3 × 120 mm o 2 × 140 mm |
| Montajes de ventilador superior | 2 × 120/140 mm |
| Montaje trasero | 1 × 120 mm |
| Bandejas HDD 3,5" | 2 (compartimento inferior) |
| Soportes SSD SATA 2,5" | 2 (trasera de motherboard tray) |

El motor sigue usando **1 unidad 3D = 50 mm**.

## Distribución en la vista lateral (panel abierto)

```text
  PARTE SUPERIOR / techo   (2 posibles ventiladores)
  ┌─────────────────────────────────────────────┐
  │  REAR / I-O     Placa base ATX       FRONT  │
  │  ○ exhaust  ┌───────────────────┐    ○ IN  │
  │             │ CPU + disipador   │          │
  │             │ RAM a la derecha  │    ○ IN  │
  │  Salidas    │ PCIe x16 / GPU════╪════╗     │
  │             │ M.2 sobre placa   │    ║     │
  ├─────────────┴───────────────────┴────╨─────┤
  │ CÁMARA INFERIOR OCULTA POR CUBIERTA (SHROUD)│
  │  PSU ATX trasera       JAULA HDD 3,5"      │
  └─────────────────────────────────────────────┘

  Cara posterior (panel de mantenimiento):
  - bandejas SSD SATA 2,5" detrás del motherboard tray
  - canal de alimentación ATX 24p, EPS, GPU y SATA
```

En el código, **X local** avanza de trasera a frontal,
**Z local** avanza de arriba a abajo y **Y local** va de bandeja de placa
a panel acristalado. La conversión del conjunto a una torre vertical
es `root.rotation.x = Math.PI / 2` y la traslación de la torre se realiza
en `js/procedural3d.js`.

## Archivos

- `js/towerATX.js`: chasis de torre, bandeja de motherboard,
  cristal de vista previa, shroud inferior, soporte PSU, jaula HDD,
  bandejas de SSD posteriores, pasacables y rejillas.
- `js/partsRealScale.js`: reubicación dimensional de PSU, HDD, SSD,
  dos ventiladores de entrada y uno trasero de extracción; las posiciones
  de CPU, DIMM y PCIe siguen ligadas a la variante de placa.
- `js/cablesProcedural.js`: rutas internas de ATX24, EPS, PCIe, SATA
  y SYS_FAN por el canal trasero; vídeo termina en el I/O posterior.
- `js/workbench3d.js`: conectores USB físicos del teclado y ratón
  reubicados en la parte trasera de la torre.
- `js/procedural3d.js`: transforma el hardware al eje vertical, conserva
  el banco como mundo independiente, habilita encaje con puntos de anclaje
  convertidos a coordenadas globales y añade vista trasera.
- `index.html`: vista `Trasera / cables` y explicaciones actualizadas.

## Estado y límites

- La silueta aproxima una torre ATX de tamaño real, **no** es un calco
  exacto de la 4000D. El panel de cristal sigue representado con
  **bisagra didáctica**, mientras que la caja comercial tiene panel extraíble.
- Actualmente hay 2 ventiladores delanteros y 1 trasero instalables;
  la caja de referencia admite hasta 6 ventiladores de 120 mm.
- La geometría de los conectores y de las bandejas es una aproximación
  educativa. No hay todavía pruebas de colisiones físicas completas.
- El PSU shroud es semitransparente para poder localizar los dispositivos
  ocultos. Los SSD SATA traseros se aprecian mejor con la nueva vista
  `Trasera / cables`.
- El montaje, diagnóstico y UEFI de versiones previas deben mantenerse
  funcionales. El paso de montaje usa los mismos estados que antes.

## Validación

- [x] Cota exterior 453×230×466 mm en el modelo procedural.
- [x] Placa vertical / GPU horizontal por transformación espacial.
- [x] PSU trasera inferior, HDD jaula frontal inferior y SSD SATA posterior.
- [x] M.2 continúa en la placa base.
- [x] Ventiladores frontales y traseros con SYS_FAN.
- [x] 18 combinaciones de placa, almacenamiento y cableado (prueba mock).
- [x] Sintaxis JavaScript de los módulos.
- [ ] Validación WebGL con captura real y ajuste visual fino.
- [ ] Ensayar drag/drop visual tras cambio de orientación.
- [ ] Afinar la posición trasera real de USB, GPU I/O y cable de monitor.
