// Nuevos componentes didácticos para 8.1. Sin precios reales ni venta externa.
// Los datos de socket, RAM, gráficos integrados y potencia son referencias
// orientativas; cada pieza conserva su categoría y compatibilidad.
window.PC_HARDWARE_EXPANSION={
 motherboards:{
  x670e:{name:'X670E ATX AM5 · WiFi / DP',sizeMm:'305 × 244 mm',socket:'AM5',ram:'DDR5',chipset:'X670E',
    slots:{dimm:4,pcieX16:2,m2:4,sata:6},videoOutputs:['HDMI','DisplayPort'],
    desc:'Modelo de práctica AM5 con varios M.2 y headers PWM/ARGB.'},
  b760m:{name:'B760M mATX LGA1700 · HDMI',sizeMm:'244 × 244 mm',socket:'LGA1700',ram:'DDR5',chipset:'B760',
    slots:{dimm:4,pcieX16:1,m2:2,sata:4},videoOutputs:['HDMI'],
    desc:'Placa Intel DDR5 en formato compacto mATX.'},
  x570:{name:'X570 ATX AM4 · HDMI',sizeMm:'305 × 244 mm',socket:'AM4',ram:'DDR4',chipset:'X570',
    slots:{dimm:4,pcieX16:2,m2:2,sata:6},videoOutputs:['HDMI'],
    desc:'Placa AM4 avanzada; el HDMI precisa un Ryzen con Radeon integrada.'},
  b650m:{name:'B650M AM5 mATX · HDMI/DP',sizeMm:'244 × 244 mm',socket:'AM5',ram:'DDR5',chipset:'B650',
    slots:{dimm:4,pcieX16:1,m2:2,sata:4},videoOutputs:['HDMI','DisplayPort'],
    desc:'Salida de vídeo de placa sólo con CPU que incluya iGPU.'},
  b550:{name:'B550 AM4 ATX · HDMI',sizeMm:'305 × 244 mm',socket:'AM4',ram:'DDR4',chipset:'B550',
    slots:{dimm:4,pcieX16:1,m2:2,sata:6},videoOutputs:['HDMI'],
    desc:'Con AMD 5600G muestra imagen desde el HDMI de placa; 5600 no tiene iGPU.'},
  h610:{name:'H610 LGA1700 mATX · HDMI',sizeMm:'244 × 220 mm',socket:'LGA1700',ram:'DDR4',chipset:'H610',
    slots:{dimm:2,pcieX16:1,m2:1,sata:4},videoOutputs:['HDMI'],
    desc:'Chipset básico con DDR4. Intel F requiere GPU dedicada.'},
  b760:{name:'B760 LGA1700 ATX · DP/HDMI',sizeMm:'305 × 244 mm',socket:'LGA1700',ram:'DDR5',chipset:'B760',
    slots:{dimm:4,pcieX16:1,m2:3,sata:4},videoOutputs:['HDMI','DisplayPort'],
    desc:'Placa Intel DDR5 con salida de vídeo habilitada por CPU con iGPU.'}
 },
 cpus:{
  r5600g:{name:'Ryzen 5 5600G · Radeon integrada',socket:'AM4',peak:88,igpu:true,
    igpuName:'Radeon Vega 7',desc:'APU AM4 DDR4 con gráficos integrados.'},
  r5700x:{name:'Ryzen 7 5700X · sin iGPU',socket:'AM4',peak:110,igpu:false,
    desc:'Requiere GPU PCIe dedicada para mostrar vídeo.'},
  r8600g:{name:'Ryzen 5 8600G · Radeon 760M',socket:'AM5',peak:88,igpu:true,
    igpuName:'Radeon 760M',desc:'APU AM5 DDR5 con gráficos integrados Radeon 760M.'},
  r8700g:{name:'Ryzen 7 8700G · Radeon 780M',socket:'AM5',peak:95,igpu:true,
    igpuName:'Radeon 780M',desc:'APU AM5 DDR5 con gráficos Radeon 780M.'},
  r7700:{name:'Ryzen 7 7700 · Radeon integrada',socket:'AM5',peak:88,igpu:true,
    igpuName:'AMD Radeon Graphics',desc:'CPU AM5 con gráficos integrados básicos.'},
  i512400:{name:'Core i5-12400 · UHD 730',socket:'LGA1700',peak:117,igpu:true,
    igpuName:'Intel UHD 730',desc:'CPU Intel con UHD Graphics 730.'},
  i512400f:{name:'Core i5-12400F · sin iGPU',socket:'LGA1700',peak:117,igpu:false,
    desc:'La versión F no tiene vídeo integrado: necesita GPU dedicada.'},
  i514400:{name:'Core i5-14400 · UHD 730',socket:'LGA1700',peak:148,igpu:true,
    igpuName:'Intel UHD 730',desc:'Intel LGA1700 con UHD 730.'}
 },
 ram:{
  ddr4_32:{name:'32 GB DDR4 (2 × 16)',type:'DDR4',watts:9,desc:'Kit de doble canal DDR4.'},
  ddr4_8:{name:'8 GB DDR4',type:'DDR4',watts:4,desc:'Capacidad reducida para oficina.'},
  ddr5_64:{name:'64 GB DDR5 (2 × 32)',type:'DDR5',watts:13,desc:'Trabajo de edición intensiva.'},
  ddr5_8:{name:'8 GB DDR5',type:'DDR5',watts:5,desc:'Capacidad ajustada.'}
 },
 storage:{
  sataSSD2:{name:'SSD SATA 2 TB',sizeMm:'100 × 69,9 × 7 mm',interface:'SATA',watts:6,
    desc:'Bahía de 2,5 pulgadas. Requiere cable SATA datos y alimentación.'},
  nvme2:{name:'SSD NVMe M.2 2 TB',sizeMm:'80 × 22 mm',interface:'M2_NVME',watts:9,
    desc:'Se coloca en la placa base, sin cables SATA.'},
  hdd4:{name:'HDD SATA 4 TB',sizeMm:'147 × 101,6 × 26 mm',interface:'SATA',watts:10,
    desc:'Disco mecánico 3,5 pulgadas en jaula inferior.'}
 },
 gpus:{
  rx6600:{name:'Radeon RX 6600',sizeMm:'240 × 120 × 44 mm',pcie:true,watts:132,
    power:['PCIE_8'],gen:4,desc:'Tarjeta dedicada de 8 pines.'},
  rtx3060:{name:'GeForce RTX 3060',sizeMm:'242 × 122 × 45 mm',pcie:true,watts:170,
    power:['PCIE_8'],gen:4,desc:'Tarjeta PCIe dedicada.'},
  rtx4060:{name:'GeForce RTX 4060',sizeMm:'245 × 125 × 44 mm',pcie:true,watts:115,
    power:['PCIE_8'],gen:4,desc:'Tarjeta compacta 1080p con 8 pines.'}
 },
 psus:{
  psu550:{name:'PSU 550W',sizeMm:'150 × 140 × 86 mm',max:550,
    connectors:{PCIE_8:1,'12VHPWR':0},desc:'Fuente ATX intermedia.'},
  psu750:{name:'PSU 750W',sizeMm:'150 × 140 × 86 mm',max:750,
    connectors:{PCIE_8:2,'12VHPWR':0},desc:'Para GPUs con 8 pines.'},
  psu1000:{name:'PSU 1000W ATX 3.0',sizeMm:'150 × 150 × 86 mm',max:1000,
    connectors:{PCIE_8:3,'12VHPWR':1},desc:'Fuente sobredimensionada y con conector moderno.'}
 }
};

window.PC_COOLER_OPTIONS={
  air:{name:'Torre de aire 120 mm',kind:'air',thermalGain:0,watts:4,requires:'CPU_FAN',sizeMm:'125 × 120 × 155 mm'},
  stock:{name:'Disipador de serie bajo',kind:'air',thermalGain:-6,watts:3,requires:'CPU_FAN',sizeMm:'90 × 90 × 55 mm'},
  twinTower:{name:'Torre doble 120 mm',kind:'air',thermalGain:5,watts:6,requires:'CPU_FAN',sizeMm:'140 × 125 × 160 mm'},
  aio240:{name:'AIO líquida 240 mm',kind:'liquid',thermalGain:8,watts:11,requires:'CPU_FAN / bomba',sizeMm:'Radiador 240 × 120 mm'},
  aio360:{name:'AIO líquida 360 mm',kind:'liquid',thermalGain:11,watts:16,requires:'CPU_FAN / bomba',sizeMm:'Radiador 360 × 120 mm'}
};
window.PC_CASE_FINISHES={
  tower:{name:'Negro',color:0x232d38,panel:0x354450},
  towerWhite:{name:'Blanco',color:0xc0cbd5,panel:0xe8eff5},
  towerGraphite:{name:'Grafito',color:0x566570,panel:0x74828c}
};
