# Hardware Simulator 8.14.0-alpha · Taller permanente y multímetro

## Economía de taller
- El taller dispone de **300 € iniciales independientes** del presupuesto del cliente.
- El destornillador ya forma parte del taller. Comprar de nuevo desde la tienda
  antigua no gasta dinero ni duplica existencias.
- Las herramientas adquiridas, incluyendo multímetro, gráfica de prueba, módulos
  RAM de prueba, brochas y aspiradora específica para electrónica ESD, son permanentes.
- Alcohol isopropílico, paños sin pelusa, aire técnico y limpiador de contactos
  se compran por lotes y se consumen por dosis. Nunca se recuperan al cambiar de cliente.
- La primera entrega satisfactoria de cada tipo de encargo añade 110 € al
  patrimonio del taller. Repetir la misma entrega no genera recompensas ilimitadas.
- El estado se conserva en localStorage cuando esté disponible, bajo la clave
  hardware-simulator.workshop.8.14; en modo privado sin almacenamiento permanece
  solo durante la sesión de la página.

## Entorno 3D
- Estantería procedural independiente del PC y de la mesa auxiliar.
- Cámara «Estantería de herramientas» y selección de modelos por clic.
- El multímetro puede abrirse desde su representación 3D o la sección del taller.

## Instrumentación educativa
- Escalas V⎓, V~, Ω y A⎓; bornes COM (negro), VΩ y A (rojo).
- Puntos didácticos ATX, SATA, cable de datos y ventilador en serie.
- Cortocircuito visual al poner el borne A sobre una tensión simulada energizada,
  con fusible virtual fundido y reposición por 5 € del fondo del taller.
- Resistencia bloqueada con el PC encendido; la corriente solo se mide en serie.
- La gráfica y los módulos de prueba no aparecen instalados en el PC del cliente.
  Generan una referencia diagnóstica, no una reparación ni una solución automática.

## Límites
No es un modelo eléctrico físicamente exacto: tensiones, corrientes y chispas son
ficticias. No se simula aún arrastrar libremente puntas sobre contactos 3D,
intercambiar físicamente las RAM de referencia ni un cortocircuito propagado a todos
los componentes. En la realidad hay peligros eléctricos; deben emplearse
instrumentos y procedimientos adecuados y no una aspiradora doméstica en electrónica.

## Validación
Hay pruebas del motor, regresiones del estado de aventura y un flujo Playwright.
La actualización de GitHub y la propagación de Pages deben comprobarse por separado.
