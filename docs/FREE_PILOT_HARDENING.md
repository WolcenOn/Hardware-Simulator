# Free/Pilot — control de estabilización y seguridad (8.22.2-alpha)

> Estado: trabajo en curso. No es una certificación de seguridad ni un
> compromiso de ausencia de errores. Referencia técnica: rama
> `feature/v7-procedural-3d`.

## Alcance

- Aplicación web estática, sin backend, registro de alumnos ni pagos.
- Los estados del taller y las memorias USB educativas se guardan localmente
  en el navegador; no contienen imágenes ISO reales ni credenciales.
- Se conserva `main/index.html` como demostración histórica. Los cambios
  se prueban en la rama de desarrollo y luego se publican bajo
  `main/preview/v7/` si se autorizan para exposición experimental.
- La selección de versión Free/Pilot se realizará por SHA de commit y
  resultados CI, nunca únicamente por número de versión.

## Amenazas e incidencias verificadas

1. El JSON importado de casos docentes está limitado a 250 kB y se
   normalizan título, texto y requisitos. Mantener pruebas de objetos
   malformados y cadenas con etiquetas HTML; el texto del usuario no debe
   interpolarse nunca en `innerHTML` sin escapar.
2. Las memorias USB en `localStorage` pueden editarse por cualquier usuario
   del navegador. Validar formato, longitud, duplicados, capacidad e
   identificadores al leerlas. Nunca fiarse de este estado para una
   calificación institucional.
3. La biblioteca 3D Three.js se carga desde un CDN con versión fija,
   pero no existe actualmente cadena local íntegra con hash de verificación.
   Debe evaluarse su distribución local antes de congelar una edición piloto.
4. El HTML utiliza scripts/eventos inline: una CSP estricta requerirá
   refactorizar primero estos puntos; no afirmar que exista una CSP fuerte.
5. Los commits de la rama de desarrollo pueden publicarse sin una revisión
   por pull request; las ramas `main` y `feature/v7-procedural-3d`
   no están protegidas. Configurar reglas del repositorio únicamente con
   autorización del propietario.
6. No hay archivo de bloqueo de dependencias visible en el árbol actual.
   Generar, verificar e incorporar uno antes de un congelamiento reproducible.
7. Los fallos E2E de 8.22.1 afectan a la copia ISO y al clic del monitor,
   especialmente en móvil. Corregirlos antes del piloto.

## Criterios de aceptación para declarar una versión candidata

- [ ] Cero incidencias críticas/altas conocidas sin documentar o sin mitigar.
- [ ] Ejecución completa de GitHub Actions con todos los jobs verdes,
      incluidos seis grupos de Playwright.
- [ ] Pruebas de montaje, conexión SATA, RAM/CPU, BIOS, USB/Ventoy,
      selección de ISO con clic, foco de teclado y extracción.
- [ ] Importación de casos JSON: límites, esquema, tipos malformados y textos
      hostiles, comprobando que se muestran como texto.
- [ ] Inventario `localStorage`: recuperación de datos inválidos, límites,
      ausencia de duplicados, independencia de estado entre memorias.
- [ ] Pruebas manuales de ratón/táctil en navegador móvil real,
      más pruebas de rendimiento con WebGL limitado.
- [ ] Revisión de dependencias, cabeceras de seguridad y políticas de iframe.
- [ ] Copia Git restaurable; commit exacto etiquetado y plan de rollback.
- [ ] Verificación de que `main/index.html` sigue intacto.

## Proceso de publicación seguro

1. Desarrollar fixes en `feature/v7-procedural-3d`.
2. Ejecutar smoke, unitarias, E2E de escritorio y móvil.
3. Revisar hallazgos con el propietario; no interpretar fallos de test
   como falsos positivos sin evidencia.
4. Publicar exclusivamente en `preview/v7/` para pruebas experimentales.
5. Congelar `Free/Pilot` solo cuando pase la aceptación y estén revisadas
   las condiciones de licencia GPL-3.0 y las dependencias.
6. Mantener la URL actual operativa durante el despliegue y documentar
   retorno al commit anterior.

## Límites de la arquitectura

Este piloto no evalúa de forma confiable resultados institucionales;
un cliente JavaScript puede alterar su estado. Las funciones que requieran
identidad, autorización, certificados de evaluación o licencias comerciales
necesitarán un servidor con controles adecuados.
