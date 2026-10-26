import { test, expect } from '@playwright/test';

async function openGame(page) {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#adventurePanel')).toBeVisible();
  await expect(page.locator('#advClient')).toHaveValue('office');
}

async function openSection(page, name) {
  const details=page.locator(`#adventurePanel [data-section="${name}"]`);
  if (!(await details.evaluate(el=>el.open))) await details.locator('summary').click();
  await expect(details).toHaveAttribute('open', '');
}

async function buy(page, category, id) {
  await openSection(page, 'shop');
  const categoryControl=page.locator('#advShopCategory');
  await categoryControl.selectOption(category);
  await expect(categoryControl).toHaveValue(category);
  const button=page.locator(`[data-buy="${category}:${id}"]`);
  await expect(button).toBeVisible();
  await expect(button).toBeEnabled();
  // El renderizador WebGL puede mover la caja del botón entre actionability checks.
  // Validamos visible/habilitado y ejecutamos el mismo click DOM real del handler.
  await button.evaluate(el=>el.click());
  await expect(page.locator('#adventurePanel')).toContainText('Comprado:');
}

async function fit(page, item) {
  await openSection(page, 'inventory');
  await page.locator(`[data-select-item="${item}"]`).first().evaluate(el=>el.click());
  await openSection(page, 'actions');
  await page.locator('[data-suggest="fit"]:not([disabled])').first().evaluate(el=>el.click());
}

test('la tienda permite comprar una caja, colocarla y continuar con la chapa I/O', async ({ page }) => {
  await openGame(page);
  await expect(page.locator('#adventurePanel')).toContainText('Compra una CAJA');
  await buy(page, 'case', 'tower');
  await fit(page, 'case:tower');
  await expect(page.locator('#adventurePanel')).toContainText('La caja ya está colocada');
  await buy(page, 'item', 'ioShield');
  await fit(page, 'item:ioShield');
  await expect(page.locator('#adventurePanel')).toContainText('Chapa I/O colocada');
});

test('la demo recomendada se ejecuta sin diálogo bloqueante y permite entrar en BIOS', async ({ page }) => {
  await openGame(page);
  await page.locator('#autoBuild').click();
  await expect(page.locator('#legacyPanel')).toBeVisible();
  await expect(page.locator('#workshopFeedback')).toContainText('Demostración');
  await page.locator('#powerBtn').click();
  await expect(page.locator('#screen')).toContainText('POWER: ON');
  await page.locator('#biosBtn').click();
  await expect(page.locator('#screen')).toContainText('UEFI SETUP UTILITY');
});

test('la demo exige confirmación dentro de la página si ya hubo compras', async ({ page }) => {
  await openGame(page);
  await buy(page, 'case', 'tower');
  await page.locator('#autoBuild').click();
  await expect(page.locator('[data-confirm-demo]')).toBeVisible();
  await page.locator('[data-cancel-demo]').click();
  await expect(page.locator('#adventurePanel')).toBeVisible();
  await openSection(page, 'inventory');
  await expect(page.locator('[data-select-item="case:tower"]')).toBeVisible();
  await page.locator('#autoBuild').click();
  await page.locator('[data-confirm-demo]').click();
  await expect(page.locator('#legacyPanel')).toBeVisible();
});

test('fuente primero bloquea placa, pero apartar mazos permite montarla', async ({ page }) => {
  test.setTimeout(210_000); // compras y WebGL en CI
  await openGame(page);
  await buy(page,'case','tower'); await fit(page,'case:tower');
  await buy(page,'item','ioShield'); await fit(page,'item:ioShield');
  await buy(page,'psu','psu450'); await fit(page,'psu:psu450');
  await buy(page,'motherboard','b650'); await fit(page,'motherboard:b650');
  await expect(page.locator('#adventurePanel')).toContainText('Apartar y asegurar mazos PSU');
  await openSection(page,'actions');
  await page.locator('[data-quick="route"]').click();
  await expect(page.locator('#adventurePanel')).toContainText('Mazos PSU apartados y asegurados');
  await fit(page,'motherboard:b650');
  await expect(page.locator('#adventurePanel')).toContainText('Placa');
});

test('teclado y ratón se conectan y desconectan desde accesos directos', async ({ page }) => {
  test.setTimeout(210_000); // compras y WebGL en CI
  await openGame(page);
  await buy(page,'case','tower');await fit(page,'case:tower');
  await buy(page,'item','ioShield');await fit(page,'item:ioShield');
  await buy(page,'motherboard','b650');await fit(page,'motherboard:b650');
  await buy(page,'item','keyboard');await buy(page,'item','mouse');
  await openSection(page,'actions');
  const keyboard=page.locator('.adv-connection-row').filter({hasText:'Teclado USB'});
  const mouse=page.locator('.adv-connection-row').filter({hasText:'Ratón USB'});
  await keyboard.locator('button').click();
  await expect(keyboard).toContainText('Conectado');
  await mouse.locator('button').click();
  await expect(mouse).toContainText('Conectado');
  await keyboard.locator('button').click();
  await expect(keyboard).toContainText('Sin conectar');
});

test('el catálogo ofrece refrigeración líquida, RGB y varios colores de caja', async ({ page }) => {
  await openGame(page);
  await openSection(page,'shop');
  await page.locator('#advShopCategory').selectOption('cooler');
  await expect(page.locator('[data-buy="cooler:aio240"]')).toBeVisible();
  await expect(page.locator('[data-buy="cooler:aio360"]')).toBeVisible();
  await page.locator('#advShopCategory').selectOption('case');
  await expect(page.locator('[data-buy="case:towerWhite"]')).toBeVisible();
  await expect(page.locator('[data-buy="case:towerGraphite"]')).toBeVisible();
  await page.locator('#advShopCategory').selectOption('motherboard');
  await expect(page.locator('[data-buy="motherboard:x670e"]')).toBeVisible();
  await page.locator('#advShopCategory').selectOption('item');
  await expect(page.locator('[data-buy="item:rgbStrip"]')).toBeVisible();
});

test('el panel lateral conserva las cajas y selectores dentro de su ancho', async ({ page }) => {
  await openGame(page);
  await openSection(page,'shop');
  const outside=await page.locator('#adventurePanel').evaluate(panel => {
    const parent=panel.getBoundingClientRect();
    const children=[...panel.querySelectorAll('select,button,.adv-card')].filter(
      x=>x.getClientRects().length && x.getBoundingClientRect().width>0);
    return children.filter(x=>{
      const r=x.getBoundingClientRect();
      return r.right>parent.right+3||r.left<parent.left-3;
    }).map(x=>x.outerHTML.slice(0,120));
  });
  expect(outside).toEqual([]);
});

test('las cámaras enfocan por separado montaje, componentes, periféricos y vista general', async ({ page }) => {
  await openGame(page);
  await page.waitForFunction(() => window.PC3D?.ready === true);
  const check=async (button,id,targetX) => {
    await page.locator(button).click();
    await expect(page.locator('#viewportWrap')).toHaveAttribute('data-view-preset',id);
    const frame=await page.evaluate(() => window.PC3D.getViewState());
    expect(frame.view).toBe(id);
    expect(frame.target[0]).toBeCloseTo(targetX,1);
    await expect(page.locator(button)).toHaveAttribute('aria-pressed','true');
  };
  await check('#viewAssemblyDesk','assembly',-4.3);
  await check('#viewStaging3d','staging',18.5);
  await check('#viewPeripherals','peripherals',-9.05);
  await check('#viewDesk','general',4.15);
});

test('la PCB se asienta sobre separadores de 6,5 mm', async ({ page }) => {
  await openGame(page);
  await page.waitForFunction(() => window.PC3D?.ready === true);
  await page.locator('#autoBuild').click();
  const mount=await page.evaluate(() => window.PC3D.getMountAlignment());
  expect(mount.board).toBe('b650');
  expect(mount.gapMm).toBeLessThan(.6);
  expect(mount.holes).toEqual(mount.posts);
  expect(mount.standoffTopY).toBeCloseTo(mount.boardBottomY,3);
});

test('el ventilador trasero, los USB y el botón POWER están integrados en la torre', async ({page}) => {
  test.setTimeout(160_000); // pulsador físico y cámara WebGL
  await openGame(page);
  await page.waitForFunction(() => window.PC3D?.ready===true);
  await page.locator('#autoBuild').click();
  await page.locator('#viewIso').click();
  const before=await page.evaluate(() => window.PC3D.getFrontIOState());
  expect(before.mounted).toBe(true);
  expect(before.usbA).toBe(2);
  expect(before.usbC).toBe(1);
  expect(before.ledOn).toBe(false);
  expect(before.usb3CableVisible).toBe(true);
  expect(before.usbCCableVisible).toBe(true);
  const point=await page.evaluate(() => window.PC3D.getCasePowerScreenPoint());
  const canvas=await page.locator('#viewport').boundingBox();
  expect(point.inside).toBe(true);
  expect(point.x).toBeGreaterThan(0);
  expect(point.x).toBeLessThan(canvas.width);
  expect(point.y).toBeGreaterThan(0);
  expect(point.y).toBeLessThan(canvas.height);
  await page.locator('#viewport').click({position:{x:point.x,y:point.y}});
  await expect(page.locator('#powerStatus')).toHaveText('Encendido');
  expect((await page.evaluate(() => window.PC3D.getFrontIOState())).ledOn).toBe(true);
  // Debounce físico de 350 ms y proyección actualizada tras el primer clic.
  await page.waitForTimeout(420);
  const updated=await page.evaluate(()=>window.PC3D.getCasePowerScreenPoint());
  await page.locator('#viewport').click({position:{x:updated.x,y:updated.y}});
  await expect(page.locator('#powerStatus')).toHaveText('Apagado',{timeout:15000});
  expect((await page.evaluate(() => window.PC3D.getFrontIOState())).ledOn).toBe(false);
});

test('los conectores USB frontales se conectan por separado y muestran sus cables', async ({page}) => {
  test.setTimeout(180_000); // tres montajes y tres cambios 3D en Chromium software
  await openGame(page);
  await page.waitForFunction(() => window.PC3D?.ready===true);
  await buy(page,'case','tower');await fit(page,'case:tower');
  await buy(page,'item','ioShield');await fit(page,'item:ioShield');
  await buy(page,'motherboard','b650');await fit(page,'motherboard:b650');
  await openSection(page,'actions');
  const usbA=page.locator('.adv-connection-row').filter({hasText:'USB-A frontales'});
  const usbC=page.locator('.adv-connection-row').filter({hasText:'USB-C frontal'});
  await expect(usbA).toContainText('Sin conectar');
  await usbA.locator('button').click();
  await expect(usbA).toContainText('Conectado');
  let status=await page.evaluate(() => window.PC3D.getFrontIOState());
  expect(status.frontUsb3).toBe(true);
  expect(status.usb3CableVisible).toBe(true);
  expect(status.usbCCableVisible).toBe(false);
  await usbC.locator('button').click();
  await expect(usbC).toContainText('Conectado');
  status=await page.evaluate(() => window.PC3D.getFrontIOState());
  expect(status.frontUsbC).toBe(true);
  expect(status.usbCCableVisible).toBe(true);
  await usbA.locator('button').click();
  await expect(usbA).toContainText('Sin conectar');
  expect((await page.evaluate(() => window.PC3D.getFrontIOState())).usb3CableVisible).toBe(false);
});

test('las clavijas USB del teclado y ratón se alinean con las tomas traseras de la PCB', async ({page}) => {
  await openGame(page);
  await page.waitForFunction(() => window.PC3D?.ready === true);
  await page.locator('#autoBuild').click();
  // AutoBuild ya conecta teclado y ratón; esperar sincronización WebGL.
  await expect.poll(()=>page.evaluate(()=>window.PC3D.getRearUsbAlignment().every(p=>p.visible)),
    {timeout:15000}).toBe(true);
  const before=await page.evaluate(() => window.PC3D.getRearUsbAlignment());
  expect(before).toHaveLength(2);
  expect(before.map(p=>p.portIndex)).toEqual([2,3]);
  for(const row of before){
    expect(row.connectorType).toBe('usbA');
    expect(row.visible).toBe(true);
    expect(row.gapMm).toBeLessThan(.1);
  }
  await page.locator('select[data-cat="motherboard"]').selectOption('a520');
  const after=await page.evaluate(() => window.PC3D.getRearUsbAlignment());
  expect(after).toHaveLength(2);
  for(const row of after)expect(row.gapMm).toBeLessThan(.1);
});

test('ATX, EPS, PCIe, SATA y USB frontal tienen clavijas con geometría propia', async ({page}) => {
  await openGame(page);
  await page.waitForFunction(() => window.PC3D?.ready === true);
  await page.locator('#autoBuild').click();
  const models=await page.evaluate(() => window.PC3D.getConnectorModels());
  for(const id of ['atx24','eps','gpu','sataData','sataPower',
    'frontPanel','frontUsb3','frontUsbC','fan','video']){
    expect(models[id],id).toContain(id);
    expect(models[id].length).toBe(2);
  }
});

test('USB real: clavijas alineadas con objetos de la PCB en varios formatos', async ({page}) => {
  await openGame(page);
  await page.waitForFunction(() => window.PC3D?.ready === true);
  await page.locator('#autoBuild').click();
  await page.locator('#keyboardToggle').click();
  await page.locator('#mouseToggle').click();
  for(const id of ['b650','a520','z790','b650m']){
    await page.locator('select[data-cat="motherboard"]').selectOption(id);
    const rows=await page.evaluate(() => window.PC3D.getRearUsbAlignment());
    expect(rows).toHaveLength(2);
    for(const row of rows){
      expect(row.gapMm,id+' '+row.id).toBeLessThan(.1);
      expect(row.angleDegrees,id+' '+row.id).toBeLessThan(.1);
      expect(row.connectorType).toBe('usbA');
    }
    expect((await page.evaluate(() => window.PC3D.getRearPortCounts())).usb).toBe(5);
  }
});

test('HDMI de la placa y DisplayPort de GPU comparten posición con sus bocas físicas', async ({page}) => {
  await openGame(page);
  await page.waitForFunction(() => window.PC3D?.ready===true);
  await page.locator('#autoBuild').click();
  const outputs=await page.evaluate(() => ({
    counts:window.PC3D.getRearPortCounts(),
    video:window.PC3D.getRearVideoAlignment()
  }));
  expect(outputs.counts.gpu).toBe(4);
  expect(outputs.video.type).toBe('displayPort');
  expect(outputs.video.gapMm).toBeLessThan(.1);
  expect(outputs.video.angleDegrees).toBeLessThan(.1);
  await page.locator('select[data-cat="gpu"]').selectOption('none');
  const igpu=await page.evaluate(() => window.PC3D.getRearVideoAlignment());
  expect(igpu.type).toBe('hdmi');
  expect(igpu.gapMm).toBeLessThan(.1);
  expect(igpu.angleDegrees).toBeLessThan(.1);
});

test('la manguera termina al final del sobremolde, nunca en los contactos', async ({page}) => {
  await openGame(page);
  await page.waitForFunction(() => window.PC3D?.ready === true);
  await page.locator('#autoBuild').click();
  await page.waitForTimeout(1000);
  const routes=await page.evaluate(() => window.PC3D.getCableExitAlignment());
  expect(routes.length).toBeGreaterThan(10);
  for(const route of routes){
    expect(route.gapsMm,route.id).toHaveLength(2);
    expect(route.angleDegrees,route.id).toHaveLength(2);
    expect(route.straightMm,route.id).toHaveLength(2);
    for(const mm of route.gapsMm)expect(mm,route.id).toBeLessThan(.05);
    for(const angle of route.angleDegrees)
      expect(angle,route.id+' inclinación').toBeLessThan(.1);
    for(const mm of route.straightMm){
      // Salidas del cableado: GPU 8 mm, ATX/EPS 15 mm, otros 11.5 mm.
      const minimum=route.id==='gpu'?7.5:
        ['atx24','eps'].includes(route.id)?14.5:11;
      expect(mm,route.id+' tramo recto').toBeGreaterThan(minimum);
    }
  }
  const internal=await page.evaluate(() => window.PC3D.getInternalPlugAlignment());
  for(const target of internal.filter(x=>x.gapMm!==null)){
    expect(target.gapMm,target.kind).toBeLessThan(.25);
    expect(target.angleDegrees,target.kind+' header').toBeLessThan(.1);
  }
  const psu=await page.evaluate(() => window.PC3D.getPsuPlugAlignment());
  for(const target of psu){
    expect(target.gapMm,target.kind).toBeLessThan(.25);
    expect(target.angleDegrees,target.kind+' PSU').toBeLessThan(.1);
  }
});

test('USB teclado/ratón y HDMI/DP terminan detrás de la parte rígida',async ({page})=>{
  await openGame(page);
  await page.waitForFunction(() => window.PC3D?.ready === true);
  await page.locator('#autoBuild').click();
  await page.locator('#keyboardToggle').click();
  await page.locator('#mouseToggle').click();
  const rows=await page.evaluate(() => window.PC3D.getRearUsbAlignment());
  for(const row of rows){
    expect(row.gapMm).toBeLessThan(.1);
    expect(row.flexGapMm).toBeLessThan(.05);
  }
  const video=await page.evaluate(() => window.PC3D.getRearVideoAlignment());
  expect(video.flexGapMm).toBeLessThan(.05);
});

test('la orientación interna permanece perpendicular al cambiar de motherboard',async ({page})=>{
  await openGame(page);
  await page.waitForFunction(() => window.PC3D?.ready === true);
  await page.locator('#autoBuild').click();
  for(const id of ['b650','a520','z790']){
    await page.locator('select[data-cat="motherboard"]').selectOption(id);
    await page.waitForTimeout(500);
    const result=await page.evaluate(()=>({
      ports:window.PC3D.getInternalPlugAlignment(),
      psu:window.PC3D.getPsuPlugAlignment(),
      cables:window.PC3D.getCableExitAlignment()
    }));
    for(const row of [...result.ports,...result.psu]){
      if(row.gapMm===null)continue;
      expect(row.gapMm,id+' '+row.kind).toBeLessThan(.25);
      expect(row.angleDegrees,id+' '+row.kind).toBeLessThan(.1);
    }
    for(const cable of result.cables){
      for(const angle of cable.angleDegrees)
        expect(angle,id+' '+cable.id).toBeLessThan(.1);
    }
  }
});

test('las conexiones internas llegan a las tomas 3D y no a zonas vacías',async ({page})=>{
  await openGame(page);
  await page.waitForFunction(()=>window.PC3D?.ready===true);
  await page.locator('#autoBuild').click();
  const sockets=await page.evaluate(()=>window.PC3D.getCableSocketAlignment());
  expect(sockets.length).toBeGreaterThan(18);
  for(const socket of sockets){
    expect(socket.header,socket.id+' sin receptáculo').toBeTruthy();
    expect(socket.gapMm,socket.id+' '+socket.header).toBeLessThan(.25);
    expect(socket.angleDegrees,socket.id+' normal').toBeLessThan(.15);
  }
  const route=await page.evaluate(()=>window.PC3D.getCableRoutingReport());
  for(const id of ['atx24','eps','gpu','frontPanel','frontUsb3','frontUsbC']){
    const cable=route.find(x=>x.id===id);
    expect(cable,id).toBeTruthy();
    expect(cable.points.length,id).toBeGreaterThan(5);
    expect(cable.points.some(p=>p[1]<-.65),id+' no usa canaleta posterior').toBe(true);
    expect(cable.collisions,id+' entra en '+JSON.stringify(cable.collisions)).toHaveLength(0);
  }
});

test('las placas ATX y mATX mantienen rutas y conexiones de ventiladores',async ({page})=>{
  await openGame(page);
  await page.waitForFunction(()=>window.PC3D?.ready===true);
  await page.locator('#autoBuild').click();
  for(const id of ['b650','a520','z790']){
    await page.locator('select[data-cat="motherboard"]').selectOption(id);
    const result=await page.evaluate(()=>({
      ports:window.PC3D.getCableSocketAlignment(),
      routes:window.PC3D.getCableRoutingReport()
    }));
    for(const port of result.ports){
      expect(port.gapMm,id+' '+port.id).toBeLessThan(.25);
      expect(port.angleDegrees,id+' '+port.id).toBeLessThan(.15);
    }
    for(const kind of ['caseFan0','caseFan1','caseFan2','fan']){
      expect(result.ports.some(p=>p.id===kind&&p.header),id+' '+kind).toBe(true);
    }
  }
});

test('HDD de 3,5 pulgadas encajado en la jaula del chasis, no en el lateral',async ({page})=>{
  await openGame(page);
  await page.waitForFunction(()=>window.PC3D?.ready===true);
  await page.locator('#autoBuild').click();
  for(const disk of ['hdd','hdd4']){
    await page.locator('select[data-cat="storage"]').selectOption(disk);
    const bay=await page.evaluate(()=>window.PC3D.getHddBayAlignment());
    expect(bay.selected).toBe(disk);
    expect(bay.slot).toBe('upper');
    expect(bay.visible).toBe(true);
    expect(bay.fitted,'Disco fuera de la bandeja').toBe(true);
    expect(bay.positionErrorMm).toBeLessThan(.1);
    expect(bay.shelfGapMm).toBeGreaterThan(2);
    expect(bay.roofGapMm).toBeGreaterThan(2);
    expect(bay.sideGapMm).toBeGreaterThan(5);
    const sata=await page.evaluate(()=>window.PC3D.getCableSocketAlignment()
      .filter(x=>['sataData','sataPower'].includes(x.id)));
    expect(sata.filter(x=>x.side===1)).toHaveLength(2);
    for(const plug of sata.filter(x=>x.side===1)){
      expect(plug.gapMm,disk+' '+plug.id).toBeLessThan(.25);
      expect(plug.angleDegrees,disk+' '+plug.id).toBeLessThan(.15);
    }
  }
  await page.locator('select[data-cat="storage"]').selectOption('sataSSD');
  const after=await page.evaluate(()=>window.PC3D.getHddBayAlignment());
  expect(after.visible).toBe(false);
});

test('SSD y HDD se alojan en la jaula real y la cámara permite inspeccionarlos',async ({page})=>{
  test.setTimeout(120_000); // dos montajes 3D WebGL y cambio de cámara en CI
  await openGame(page);
  await page.waitForFunction(()=>window.PC3D?.ready===true);
  await page.locator('#autoBuild').click(); // SSD SATA por defecto
  await page.locator('#viewDriveBays').click();
  await expect(page.locator('#viewportWrap')).toHaveAttribute('data-view-preset','drives');
  let bay=await page.evaluate(()=>window.PC3D.getStorageBayAlignment());
  expect(bay.selected).toBe('sataSSD');
  expect(bay.slot).toBe('lower');
  expect(bay.fitted).toBe(true);
  expect(bay.visible).toBe(true);
  expect(bay.alignmentErrorMm).toBeLessThan(.1);
  expect(bay.bottomClearanceMm).toBeGreaterThan(2);
  expect(bay.ssdAdapterVisible).toBe(true);
  expect(bay.rearSSDVisible).toBe(false);
  expect(bay.inspectionVisible).toBe(true);
  await page.locator('select[data-cat="storage"]').selectOption('hdd');
  await page.locator('#autoBuild').click();
  bay=await page.evaluate(()=>window.PC3D.getStorageBayAlignment());
  expect(bay.selected).toBe('hdd');
  expect(bay.slot).toBe('upper');
  expect(bay.fitted).toBe(true);
  expect(bay.visible).toBe(true);
  expect(bay.ssdAdapterVisible).toBe(false);
  expect(bay.rearSSDVisible).toBe(false);
  const hdd=await page.evaluate(()=>window.PC3D.getHddBayAlignment());
  expect(hdd.fitted).toBe(true);
  const sata=await page.evaluate(()=>window.PC3D.getCableSocketAlignment()
    .filter(x=>['sataData','sataPower'].includes(x.id)&&x.side===1));
  expect(sata).toHaveLength(2);
  for(const cable of sata)expect(cable.gapMm,cable.id).toBeLessThan(.25);
  await page.locator('#viewRearCables').click();
  bay=await page.evaluate(()=>window.PC3D.getStorageBayAlignment());
  expect(bay.inspectionVisible).toBe(false);
});

test('sin SO ni USB válido el monitor muestra dispositivo no arrancable',async ({page})=>{
  await openGame(page);
  await page.locator('#autoBuild').click();
  await page.locator('#powerBtn').click();
  await expect(page.locator('#screen')).toContainText('NO_BOOTABLE_DEVICE',{timeout:15000});
  await expect(page.locator('#bootStatus')).toHaveText('No arranca');
  await expect.poll(()=>page.evaluate(()=>window.PC3D.getOSMonitorKind())).toBe('no-boot');
  await page.locator('#osUsbToggle').click(); // USB sin imagen
  await expect(page.locator('#screen')).toContainText('NO_BOOTABLE_DEVICE');
});

test('NovaDesk comprueba Secure Boot y se instala antes de mostrar escritorio ficticio',async ({page})=>{
  test.setTimeout(185_000);
  await openGame(page);
  await page.locator('#autoBuild').click();
  await page.locator('#osUsbImage').selectOption('novadesk');
  await page.locator('#osUsbToggle').click();
  await page.locator('#powerBtn').click();
  await page.locator('#biosBtn').click();
  await page.locator('#biosBoot').selectOption('usb');
  await page.locator('#biosSecure').selectOption('off');
  await page.locator('#saveBios').click();
  await page.locator('#biosBtn').click();
  await expect(page.locator('#screen')).toContainText('SECURE_BOOT_REQUIRED');
  await page.locator('#osInstallBtn').click();
  await expect(page.locator('#workshopFeedback')).toContainText('Secure Boot');
  await page.locator('#biosBtn').click();
  await page.locator('#biosSecure').selectOption('on');
  await page.locator('#saveBios').click();
  await page.locator('#biosBtn').click();
  await expect(page.locator('#screen')).toContainText('USB INSTALADOR');
  await expect.poll(()=>page.evaluate(()=>window.PC3D.getOSMonitorKind())).toBe('installer');
  await page.locator('#osInstallBtn').click();
  await expect(page.locator('#osStatus')).toContainText('Instalación completada',{timeout:15000});
  await expect.poll(()=>page.evaluate(()=>window.PC3D.getOSMonitorKind())).toBe('installed');
  await page.locator('#biosBtn').click();
  await page.locator('#biosBoot').selectOption('ssd');
  await page.locator('#saveBios').click();
  await page.locator('#biosBtn').click();
  await expect(page.locator('#screen')).toContainText('BOOT: OK');
  await expect(page.locator('#bootStatus')).toHaveText('Arranca');
  await expect.poll(()=>page.evaluate(()=>window.PC3D.getOSMonitorKind())).toBe('desktop');
});

test('LibreForge permite Secure Boot apagado, pero solo arranca en el disco instalado',async ({page})=>{
  test.setTimeout(185_000);
  await openGame(page);
  await page.locator('#autoBuild').click();
  await page.locator('#osUsbImage').selectOption('libreforge');
  await page.locator('#osUsbToggle').click();
  await page.locator('#powerBtn').click();
  await page.locator('#biosBtn').click();
  await page.locator('#biosBoot').selectOption('usb');
  await page.locator('#biosSecure').selectOption('off');
  await page.locator('#saveBios').click();
  await page.locator('#biosBtn').click();
  await expect(page.locator('#screen')).toContainText('USB INSTALADOR');
  await page.locator('#osInstallBtn').click();
  await expect(page.locator('#osStatus')).toContainText('Instalación completada',{timeout:15000});
  await page.locator('#biosBtn').click();
  await page.locator('#biosBoot').selectOption('ssd');
  await page.locator('#saveBios').click();
  await page.locator('#biosBtn').click();
  await expect(page.locator('#bootStatus')).toHaveText('Arranca');
  // Sin retirar el USB válido, el firmware arrancaría su instalador,
  // incluso si el HDD nuevo está vacío: es el comportamiento correcto.
  await page.locator('#osUsbToggle').click();
  await page.locator('select[data-cat="storage"]').selectOption('hdd');
  await page.locator('#autoBuild').click();
  await page.locator('#powerBtn').click();
  await expect(page.locator('#screen')).toContainText('NO_BOOTABLE_DEVICE',{timeout:15000});
});

test('USB de tienda: preparar y conectar a USB-A real',async ({page})=>{
  test.setTimeout(210_000);
  await openGame(page);
  await openSection(page,'shop');
  await page.locator('#advShopCategory').selectOption('item');
  for(const id of ['osusb','usbNova','usbLibre','usbTerminal'])
    await expect(page.locator('[data-buy="item:'+id+'"]').first()).toBeVisible();
  await expect(page.locator('[data-buy="item:usbNova"]').first().locator('..')).toContainText('39');
  await expect(page.locator('[data-buy="item:usbLibre"]').first().locator('..')).toContainText('24');
  await expect(page.locator('[data-buy="item:usbTerminal"]').first().locator('..')).toContainText('19');
  await buy(page,'case','tower');await fit(page,'case:tower');
  await buy(page,'item','ioShield');await fit(page,'item:ioShield');
  await buy(page,'motherboard','b650');await fit(page,'motherboard:b650');
  await buy(page,'item','osusb');
  await page.locator('#advPrepareOS').selectOption('novadesk');
  await page.locator('[data-prepare-usb]').click();
  await expect(page.locator('#advUsbSelection')).toHaveValue('item:usbNova');
  await expect(page.locator('#advUsbTools')).toContainText('NovaDesk 11');
  await expect(page.locator('[data-connect-usb]')).toBeVisible();
  await page.locator('[data-connect-usb]').evaluate(button=>button.click());
  await expect(page.locator('#advUsbStatus')).toContainText('NovaDesk 11');
  await expect.poll(()=>page.evaluate(()=>window.PC3D.getInstallerUsbPose().visible)).toBe(true);
  const pose=await page.evaluate(()=>window.PC3D.getInstallerUsbPose());
  expect(pose.portIndex).toBe(0);
  expect(pose.gapMm).toBeLessThan(.25);
  expect(pose.receptacleGapMm).toBeLessThan(.25);
  await expect(page.locator('[data-eject-usb]')).toBeVisible();
  await page.locator('[data-eject-usb]').evaluate(button=>button.click());
  await expect.poll(()=>page.evaluate(()=>window.PC3D.getInstallerUsbPose().visible)).toBe(false);
  await expect(page.locator('#osUsbImage')).toBeDisabled();
});

test('USB de tienda: comprar y alternar dos instaladores preparados',async ({page})=>{
  test.setTimeout(210_000);
  await openGame(page);
  await buy(page,'case','tower');await fit(page,'case:tower');
  await buy(page,'item','ioShield');await fit(page,'item:ioShield');
  await buy(page,'motherboard','b650');await fit(page,'motherboard:b650');
  await buy(page,'item','usbNova');
  await page.locator('#advUsbSelection').selectOption('item:usbNova');
  await page.locator('[data-connect-usb]').evaluate(button=>button.click());
  await expect(page.locator('#advUsbStatus')).toContainText('NovaDesk 11');
  await page.locator('[data-eject-usb]').evaluate(button=>button.click());
  await expect.poll(()=>page.evaluate(()=>window.PC3D.getInstallerUsbPose().visible)).toBe(false);
  await buy(page,'item','usbLibre');
  await page.locator('#advUsbSelection').selectOption('item:usbLibre');
  await page.locator('[data-connect-usb]').evaluate(button=>button.click());
  await expect(page.locator('#advUsbStatus')).toContainText('LibreForge');
  await expect.poll(()=>page.evaluate(()=>window.PC3D.getInstallerUsbPose().image)).toBe('libreforge');
});

test('profesor importa caso JSON con presupuesto y exporta montaje',async ({page})=>{
  test.setTimeout(90000);
  await openGame(page);
  await page.locator('#toggleTeacher').click();
  await expect(page.locator('#teacherTools')).toHaveAttribute('open','');
  const json=JSON.stringify({schema:'pc-lab.teacher-case.v1',case:{
    title:'PC aula CAD',client:'Departamento TIC',
    story:'Equipo para renderizado, monitor y sistema operativo instalado.',
    budget:1200,requirements:{minRam:32,minStorage:'nvme',gpu:true,maxTemp:82}}});
  await page.locator('#importCaseJson').setInputFiles({
    name:'caso-cad.json',mimeType:'application/json',buffer:Buffer.from(json)});
  await expect(page.locator('#teacherStatus')).toContainText('PC aula CAD');
  await expect(page.locator('#advClient option:checked')).toContainText('PC aula CAD');
  await expect(page.locator('#adventurePanel')).toContainText(/(?:1\.?200)\s*€/);
  const downloaded=page.waitForEvent('download');
  await page.locator('#exportPcJson').click();
  const file=await downloaded;
  expect(file.suggestedFilename()).toMatch(/pc-lab-montaje-.*\.json/);
  await expect(page.locator('#workshopFeedback')).toContainText('JSON');
});

test('fallo térmico provoca apagado protector y diagnóstico al volver a encender',async ({page})=>{
  test.setTimeout(85000);
  await openGame(page);
  await page.locator('#autoBuild').click();
  await page.locator('#faultSelect').selectOption('paste');
  await page.locator('#injectFault').click();
  await page.locator('#powerBtn').click();
  await expect(page.locator('#screen')).toContainText('POWER: ON',{timeout:10000});
  await expect(page.locator('#powerStatus')).toHaveText('Apagado',{timeout:15000});
  await expect(page.locator('#screen')).toContainText('PROTECCIÓN');
  await expect(page.locator('#workshopFeedback')).toContainText('THERMAL_PASTE');
  await expect(page.locator('#powerBreakdown')).toContainText('CPU');
});

test('Fase 1: velocidad y reloj virtual registran montaje e inspección sin tiempo real',async ({page})=>{
  test.setTimeout(95_000);
  await openGame(page);
  await expect(page.locator('#advVirtualClock')).toContainText('0 min');
  await page.locator('#advWorkSpeed').selectOption('fast');
  await expect(page.locator('#advWorkSpeed')).toHaveValue('fast');
  await buy(page,'case','tower');
  await fit(page,'case:tower');
  await expect(page.locator('#advVirtualClock')).toContainText('operaciones registradas');
  const first=await page.locator('#advVirtualClock').textContent();
  expect(Number(first.match(/Tiempo virtual:\s*(\d+(?:\.\d+)?)/)?.[1])).toBeGreaterThan(0);
  await openSection(page,'actions');
  await page.locator('[data-verb="inspect"]').evaluate(el=>el.click());
  await page.locator('[data-go]').evaluate(el=>el.click());
  await expect(page.locator('#advVirtualClock')).toContainText('operaciones registradas');
  await page.locator('#adventureBtn').click();
  await expect(page.locator('#advVirtualClock')).toContainText('0 min');
  await expect(page.locator('#advWorkSpeed')).toHaveValue('normal');
});

test('Fase 1.1: desmontaje válido, retrabajo y rechazos conservan el reloj',async ({page})=>{
  test.setTimeout(175_000);
  await openGame(page);
  await openSection(page,'actions');
  await page.locator('[data-verb="route"]').evaluate(el=>el.click());
  await page.locator('[data-go]').evaluate(el=>el.click());
  await expect(page.locator('#advWorkSummary')).toContainText('Rechazos: 1');
  await expect(page.locator('#advVirtualClock')).toContainText('0 min');
  await buy(page,'case','tower');await fit(page,'case:tower');
  await buy(page,'item','screwdriver');
  await openSection(page,'inventory');
  await page.locator('[data-select-item="case:tower"]').first().evaluate(el=>el.click());
  await openSection(page,'actions');
  await page.locator('[data-verb="remove"]').evaluate(el=>el.click());
  await page.locator('[data-go]').evaluate(el=>el.click());
  await expect(page.locator('#advWorkSummary')).toContainText('Retrabajos: 1');
  await fit(page,'case:tower');
  await expect(page.locator('#advWorkSummary')).toContainText('Retrabajos: 2');
  await expect(page.locator('#advVirtualClock')).not.toContainText('0 min');
});

test('Fase 2a: incidencias reproducibles desactivadas por defecto y pulsera ESD real',async ({page})=>{
  test.setTimeout(110_000);
  await openGame(page);
  await expect(page.locator('#advRiskMode')).toHaveValue('off');
  await expect(page.locator('#advRiskStatus')).toContainText('0');
  await page.locator('#advRiskMode').selectOption('on');
  await expect(page.locator('#advRiskMode')).toHaveValue('on');
  await page.locator('#advRiskSeed').fill('aula-reproducible-42');
  await page.locator('[data-risk-seed]').evaluate(el=>el.click());
  await expect(page.locator('#advRiskSeed')).toHaveValue('aula-reproducible-42');
  await buy(page,'item','esdStrap');
  await page.locator('[data-esd-toggle]').evaluate(el=>el.click());
  await expect(page.locator('#advRiskStatus')).toContainText('desconectada');
  await buy(page,'case','tower');await fit(page,'case:tower');
  await page.locator('[data-esd-toggle]').evaluate(el=>el.click());
  await expect(page.locator('#advRiskStatus')).toContainText('conectada');
  const state=await page.evaluate(()=>window.PC_MISHAPS.calculateRisks({
    kind:'fit',speed:'normal',esd:{worn:true,grounded:true}}));
  expect(state.esd).toBeGreaterThan(0);
  await expect(page.locator('#advWorkSpeed')).toHaveValue('normal');
});

test('los acabados blanco y grafito se conservan al colocar la caja en el taller', async ({ page }) => {
  await openGame(page);
  await page.waitForFunction(() => window.PC3D?.ready === true);
  await buy(page,'case','towerWhite');
  await fit(page,'case:towerWhite');
  const white=await page.evaluate(() => window.PC3D.getCaseFinish());
  expect(white.variant).toBe('towerWhite');
  expect(white.frame).toBe(0xc0cbd5);
  await expect(page.locator('#viewportWrap')).toHaveAttribute('data-view-preset','assembly');

  await page.locator('#adventureBtn').click();
  await buy(page,'case','towerGraphite');
  await fit(page,'case:towerGraphite');
  const graphite=await page.evaluate(() => window.PC3D.getCaseFinish());
  expect(graphite.variant).toBe('towerGraphite');
  expect(graphite.frame).toBe(0x566570);
  expect(graphite.frame).not.toBe(white.frame);
});

test('Fase 2b.1: incidencia SATA reparable sin bucles, con diagnóstico y retrabajo',async ({page})=>{
  test.setTimeout(210_000);
  await openGame(page);
  await buy(page,'case','tower');await fit(page,'case:tower');
  await buy(page,'item','ioShield');await fit(page,'item:ioShield');
  await buy(page,'motherboard','b650');await fit(page,'motherboard:b650');
  await buy(page,'storage','sataSSD');await fit(page,'storage:sataSSD');
  await buy(page,'item','sataCable');
  const seed=await page.evaluate(()=>{
    const m=window.PC_MISHAPS,risk=m.calculateRisks({kind:'connect',difficulty:2});
    for(let i=0;i<20000;i++){
      const seed='sata-e2e-'+i,rng=m.createSeededRandom(seed);
      if(rng()>=risk.electrical&&rng()<risk.procedure&&rng()>=.94)return seed;
    }
    throw new Error('No se encontró semilla para fallo SATA');
  });
  await openSection(page,'mission');
  await page.locator('#advRiskSeed').fill(seed);
  await page.locator('[data-risk-seed]').evaluate(el=>el.click());
  await page.locator('#advRiskMode').selectOption('on');
  await openSection(page,'actions');
  await page.locator('#advConnection').selectOption('sataData');
  await page.locator('[data-verb="connect"]').evaluate(el=>el.click());
  await page.locator('[data-go]').evaluate(el=>el.click());
  await expect(page.locator('#advRiskStatus')).toContainText('reparaciones pendientes: 1');
  const broken=await page.evaluate(()=>({
    connected:state.sataData,report:adventureGame.getExport().incidentSimulation
  }));
  expect(broken.connected).toBe(false);
  expect(broken.report.incidents.at(-1).outcome).toBe('loose_sata');
  await openSection(page,'delivery');
  await page.locator('[data-deliver]').evaluate(el=>el.click());
  await expect(page.locator('#adventurePanel')).toContainText('Repara el cable SATA');
  await openSection(page,'actions');
  await page.locator('#advConnection').selectOption('sataData');
  await page.locator('[data-verb="connect"]').evaluate(el=>el.click());
  await page.locator('[data-go]').evaluate(el=>el.click());
  await expect(page.locator('#advRiskStatus')).toContainText('reparaciones pendientes: 0');
  await expect(page.locator('#advWorkSummary')).toContainText('Retrabajos: 1');
  const fixed=await page.evaluate(()=>({
    connected:state.sataData,report:adventureGame.getExport().incidentSimulation
  }));
  expect(fixed.connected).toBe(true);
  expect(fixed.report.incidents.at(-1).resolved).toBe(true);
  expect(fixed.report.pendingRepairs).toEqual([]);
});

test('Fase 2b.2: SATA latente se manifiesta al encender y se repara',async ({page})=>{
  test.setTimeout(210_000);
  await openGame(page);
  await buy(page,'case','tower');await fit(page,'case:tower');
  await buy(page,'item','ioShield');await fit(page,'item:ioShield');
  await buy(page,'motherboard','b650');await fit(page,'motherboard:b650');
  await buy(page,'storage','sataSSD');await fit(page,'storage:sataSSD');
  await buy(page,'item','sataCable');
  await openSection(page,'mission');
  await page.locator('#advRiskSeed').fill('latent-test-1974');
  await page.locator('[data-risk-seed]').evaluate(el=>el.click());
  await page.locator('#advRiskMode').selectOption('on');
  await openSection(page,'actions');
  await page.locator('#advConnection').selectOption('sataData');
  await page.locator('[data-verb="connect"]').evaluate(el=>el.click());
  await page.locator('[data-go]').evaluate(el=>el.click());
  await expect(page.locator('#advRiskStatus')).toContainText('comprobaciones pendientes: 1');
  expect(await page.evaluate(()=>state.sataData)).toBe(true);
  await page.locator('#powerBtn').evaluate(el=>el.click());
  await expect(page.locator('#advRiskStatus')).toContainText('comprobaciones pendientes: 1');
  await openSection(page,'mission');
  await page.locator('#advRiskMode').selectOption('off');
  await buy(page,'psu','psu450');await fit(page,'psu:psu450');
  await openSection(page,'actions');
  for(const connector of ['frontpanel','atx24']){
    await page.locator('#advConnection').selectOption(connector);
    await page.locator('[data-verb="connect"]').evaluate(el=>el.click());
    await page.locator('[data-go]').evaluate(el=>el.click());
  }
  await page.locator('#powerBtn').evaluate(el=>el.click());
  await expect(page.locator('#advRiskStatus')).toContainText('reparaciones pendientes: 1');
  const incident=await page.evaluate(()=>adventureGame.getExport().incidentSimulation.incidents.at(-1));
  expect(incident.revealedBy).toBe('power-on');
  expect(await page.evaluate(()=>state.sataData)).toBe(false);
  await page.evaluate(()=>{if(state.power)power();});
  await openSection(page,'actions');
  await page.locator('#advConnection').selectOption('sataData');
  await page.locator('[data-verb="connect"]').evaluate(el=>el.click());
  await page.locator('[data-go]').evaluate(el=>el.click());
  await expect(page.locator('#advRiskStatus')).toContainText('reparaciones pendientes: 0');
  const data=await page.evaluate(()=>({
    cable:state.sataData,report:adventureGame.getExport().incidentSimulation,
    reworks:adventureGame.operationSummary().counts.rework
  }));
  expect(data.cable).toBe(true);
  expect(data.report.pendingRepairs).toEqual([]);
  expect(data.report.pendingLatent).toEqual([]);
  expect(data.report.incidents.at(-1).resolvedBy).toBe('sata_reconnect');
  expect(data.reworks).toBeGreaterThanOrEqual(1);
});


test('8.9.1 RAM: popup en el visor 3D y captura de marcadores oscilantes',async ({page})=>{
  test.setTimeout(210_000);
  await openGame(page);
  await buy(page,'case','tower');await fit(page,'case:tower');
  await buy(page,'item','ioShield');await fit(page,'item:ioShield');
  await buy(page,'motherboard','b650');await fit(page,'motherboard:b650');
  await buy(page,'ram','ddr5_16');
  await openSection(page,'inventory');
  await page.locator('[data-select-item="ram:ddr5_16"]').first().evaluate(el=>el.click());
  await openSection(page,'actions');
  expect(await page.evaluate(()=>adventureGame.getExport().ramPrecision.enabled)).toBe(true);
  await expect(page.locator('[data-ram-toggle]')).toContainText('Usar montaje clásico');
  await page.locator('[data-suggest="fit"]:not([disabled])').first().evaluate(el=>el.click());
  const popup=page.locator('#ramPrecisionPopup');
  await expect(popup).toBeVisible();
  await expect(popup.locator('[role="dialog"]')).toBeVisible();
  await expect(page.locator('#adventurePanel .adv-ram-scene')).toHaveCount(0);
  const ram=await page.evaluate(()=>adventureGame.ramPrecisionState());
  expect(ram.stage).toBe('align');
  const before=await page.evaluate(()=>adventureGame.getExport().simulatedTime.technical);
  await popup.locator('[data-ram-present]').evaluate(el=>el.click());
  const after=await page.evaluate(()=>adventureGame.getExport().simulatedTime.technical);
  expect(after-before).toBeCloseTo(.8,1);
  if((await page.evaluate(()=>adventureGame.ramPrecisionState())).reversed)
    await popup.locator('[data-ram-flip]').evaluate(el=>el.click());
  const range=async(id,value)=>popup.locator('#'+id).evaluate((el,v)=>{
    el.value=String(v);el.dispatchEvent(new Event('input',{bubbles:true}));
  },value);
  await range('advRamAlign',0);await range('advRamApproach',100);
  await popup.locator('[data-ram-present]').evaluate(el=>el.click());
  await expect(popup.locator('[data-ram-capture="left"]')).toBeVisible();
  await expect(popup.locator('[data-ram-capture="right"]')).toBeVisible();
  await expect(popup.locator('#advRamLeft')).toHaveCount(0);
  await popup.locator('[data-ram-capture="left"]').evaluate(el=>el.click());
  await expect(popup.locator('[data-ram-capture="left"]')).toBeDisabled();
  const captured=await page.evaluate(()=>adventureGame.ramPrecisionState().left);
  expect(captured).toBeGreaterThanOrEqual(0);
  expect(captured).toBeLessThanOrEqual(100);
  // Completar el primer ciclo con presión excesiva, con tiempo controlado;
  // la interacción real del marcador izquierdo ya se verificó mediante clic.
  await page.evaluate(()=>adventureGame.ramPrecisionCapture('right',650));
  await expect(popup).toBeVisible();
  expect(await page.evaluate(()=>state.ramSeated)).toBe(false);
  const result=await page.evaluate(()=>({
    left:adventureGame.ramPrecisionCapture('left',594),
    right:adventureGame.ramPrecisionCapture('right',276),
    report:adventureGame.getExport().ramPrecision
  }));
  expect(result.left.value).toBe(66);
  expect(result.right.code).toBe('perfect_seat');
  expect(await page.evaluate(()=>state.ramSeated)).toBe(true);
  await expect(popup).toBeHidden();
  expect(result.report.attempts.at(-1).code).toBe('perfect_seat');
  // Cada nuevo montaje, incluso tras retirar la RAM, vuelve a abrir el popup.
  await openSection(page,'actions');
  await page.locator('[data-verb="remove"]').evaluate(el=>el.click());
  await page.locator('[data-go]').evaluate(el=>el.click());
  expect(await page.evaluate(()=>state.installed.ram)).toBe(false);
  await page.locator('[data-verb="fit"]').evaluate(el=>el.click());
  await page.locator('[data-go]').evaluate(el=>el.click());
  await expect(popup).toBeVisible();
  expect(await page.evaluate(()=>adventureGame.getExport().ramPrecision.active.attempts.length)).toBe(0);
  await popup.locator('[data-ram-cancel]').first().evaluate(el=>el.click());
  expect(await page.evaluate(()=>state.ramSeated)).toBe(false);
});


test('8.10.1 tornillos: mapa de anclajes y profundidad por cada fijación',async ({page})=>{
  test.setTimeout(210_000);
  await openGame(page);
  await buy(page,'case','tower');await fit(page,'case:tower');
  await buy(page,'item','ioShield');await fit(page,'item:ioShield');
  await buy(page,'motherboard','b650');await fit(page,'motherboard:b650');
  await buy(page,'item','screwdriver');await buy(page,'item','screws');
  await openSection(page,'inventory');
  await page.locator('[data-select-item="motherboard:b650"]').first().evaluate(el=>el.click());
  await openSection(page,'actions');
  await page.locator('[data-suggest="screw"]').first().evaluate(el=>el.click());
  const popup=page.locator('#screwPrecisionPopup');
  await expect(popup).toBeVisible();
  await expect(popup.locator('[data-screw-hole]')).toHaveCount(9);
  await expect(popup).toContainText('0/9');
  const start=await page.evaluate(()=>adventureGame.game.stock['item:screws']);
  const board=popup.locator('.screw-alignment-board');
  const box=await board.boundingBox();
  expect(box).not.toBeNull();
  const head=await popup.locator('[data-screw-head]').boundingBox();
  await page.mouse.move(head.x+head.width/2,head.y+head.height/2);
  await page.mouse.down();
  await page.mouse.move(box.x+box.width*.89,box.y+box.height*.89,{steps:5});
  await page.mouse.up();
  await page.mouse.wheel(0,100);
  expect(await page.evaluate(()=>adventureGame.screwPracticeState().depth)).toBe(0);
  await expect(popup.locator('#screwFeedback')).toContainText('Giro en falso');
  const moved=await popup.locator('[data-screw-head]').boundingBox();
  await page.mouse.move(moved.x+moved.width/2,moved.y+moved.height/2);
  await page.mouse.down();
  await page.mouse.move(box.x+box.width*.5,box.y+box.height*.5,{steps:4});
  await page.mouse.up();
  await page.mouse.wheel(0,100);
  expect(await page.evaluate(()=>adventureGame.screwPracticeState().depth)).toBe(10);
  // Completar el primer punto mediante el motor de interacción en navegador.
  await page.evaluate(()=>{for(let i=0;i<9;i++)adventureGame.screwTurn(1);});
  expect(await page.evaluate(()=>state.fixings.motherboard)).toBe(false);
  await expect(popup.locator('.screw-anchor.completed')).toHaveCount(1);
  await expect(popup).toContainText('1/9');
  expect(await page.evaluate(()=>adventureGame.game.stock['item:screws'])).toBe(start-1);
  // Los restantes agujeros mantienen acciones, tiempo y gasto independientes.
  await page.evaluate(()=>{
    for(let hole=1;hole<9;hole++){
      adventureGame.screwMove(50,50);
      for(let turn=0;turn<10;turn++)adventureGame.screwTurn(1);
    }
  });
  await expect(popup).toBeHidden();
  expect(await page.evaluate(()=>state.fixings.motherboard)).toBe(true);
  expect(await page.evaluate(()=>adventureGame.game.stock['item:screws'])).toBe(start-9);
  const report=await page.evaluate(()=>adventureGame.getExport().screwPractice);
  expect(report.progress.motherboard.completed).toHaveLength(9);
  expect(report.attempts.filter(x=>x.code==='seated')).toHaveLength(9);
  expect(report.attempts[0].code).toBe('not_engaged');
  expect(report.attempts.at(-1).anchor).toBe('s9');
});

test('8.11 CPU: orientar, alinear, apoyar y cerrar la palanca sobre visor 3D',async ({page})=>{
  test.setTimeout(210_000);
  await openGame(page);
  await buy(page,'case','tower');await fit(page,'case:tower');
  await buy(page,'item','ioShield');await fit(page,'item:ioShield');
  await buy(page,'motherboard','b650');await fit(page,'motherboard:b650');
  await buy(page,'cpu','r7600');
  await openSection(page,'inventory');
  await page.locator('[data-select-item="cpu:r7600"]').first().evaluate(el=>el.click());
  await openSection(page,'actions');
  await expect(page.locator('[data-cpu-toggle]')).toContainText('Usar colocación clásica');
  await page.locator('[data-suggest="fit"]').first().evaluate(el=>el.click());
  const popup=page.locator('#cpuPrecisionPopup');
  await expect(popup).toBeVisible();
  await expect(popup.locator('[role="dialog"]')).toBeVisible();
  expect(await page.evaluate(()=>state.installed.cpu)).toBe(false);
  const before=await page.evaluate(()=>adventureGame.getExport().simulatedTime.technical);
  await popup.locator('[data-cpu-present]').evaluate(el=>el.click());
  const after=await page.evaluate(()=>adventureGame.getExport().simulatedTime.technical);
  expect(after-before).toBeCloseTo(.6,1);
  for(let i=0;i<4;i++){
    const rotation=await page.evaluate(()=>adventureGame.cpuPrecisionState().rotation);
    if(rotation===0)break;
    await popup.locator('[data-cpu-rotate]').evaluate(el=>el.click());
  }
  const range=async(id,value)=>popup.locator('#'+id).evaluate((el,v)=>{
    el.value=String(v);el.dispatchEvent(new Event('input',{bubbles:true}));
  },value);
  await range('cpuX',0);await range('cpuY',0);
  // Regresión 8.11.1: Y=0 se ve centrado, tanto con CPU levantada
  // como cuando se baja al 100 %. Antes bajar movía la CPU -24 px y
  // obligaba a poner Y=12 para que el dibujo coincidiera.
  const verticalOffset=()=>page.evaluate(()=>{
    const cpu=document.querySelector('#cpuPrecisionPopup [data-cpu-piece]').getBoundingClientRect();
    const socket=document.querySelector('#cpuPrecisionPopup .cpu-socket').getBoundingClientRect();
    return (cpu.top+cpu.height/2)-(socket.top+socket.height/2);
  });
  await range('cpuLower',0);
  expect(Math.abs(await verticalOffset())).toBeLessThan(1);
  await range('cpuLower',100);
  expect(Math.abs(await verticalOffset())).toBeLessThan(1);
  await range('cpuY',12);
  expect(await verticalOffset()).toBeCloseTo(24,0);
  await range('cpuY',0);
  expect(Math.abs(await verticalOffset())).toBeLessThan(1);
  await popup.locator('[data-cpu-present]').evaluate(el=>el.click());
  await expect(popup.locator('[data-cpu-capture]')).toBeVisible();
  const force=await page.evaluate(()=>adventureGame.cpuPrecisionCapture(94));
  expect(force.code).toBe('excessive_force');
  expect(await page.evaluate(()=>state.installed.cpu)).toBe(false);
  await page.evaluate(()=>adventureGame.cpuPrecisionCapture(66));
  await expect(popup).toBeHidden();
  expect(await page.evaluate(()=>state.installed.cpu)).toBe(true);
  const history=await page.evaluate(()=>adventureGame.getExport().cpuPrecision.attempts);
  expect(history.at(-1).code).toBe('locked');
  expect(history.some(x=>x.code==='excessive_force')).toBe(true);
});


test('8.12 pasta: jeringuilla, inercia y expansión durante apriete en cruz',async ({page})=>{
  test.setTimeout(210_000);
  await openGame(page);
  await buy(page,'case','tower');await fit(page,'case:tower');
  await buy(page,'item','ioShield');await fit(page,'item:ioShield');
  await buy(page,'motherboard','b650');await fit(page,'motherboard:b650');
  await buy(page,'cpu','r7600');
  await openSection(page,'inventory');
  await page.locator('[data-select-item="cpu:r7600"]').first().evaluate(el=>el.click());
  await openSection(page,'actions');
  await page.locator('[data-cpu-toggle]').evaluate(el=>el.click());
  await page.locator('[data-suggest="fit"]').first().evaluate(el=>el.click());
  await buy(page,'item','paste');
  await openSection(page,'inventory');
  await page.locator('[data-select-item="item:paste"]').first().evaluate(el=>el.click());
  await openSection(page,'actions');
  await page.locator('[data-suggest="apply"]').first().evaluate(el=>el.click());
  const popup=page.locator('#pastePrecisionPopup');
  await expect(popup).toBeVisible();
  const chip=popup.locator('[data-paste-chip]');
  const box=await chip.boundingBox();
  expect(box).not.toBeNull();
  const center={x:box.x+box.width/2,y:box.y+box.height/2};
  await page.mouse.move(center.x,center.y);
  await page.mouse.down();
  // Playwright verifica que se dispensa durante una pulsación real.
  await page.waitForTimeout(400);
  await page.mouse.up();
  const beforeRelease=await page.evaluate(()=>adventureGame.pasteUi.getState().used);
  await page.waitForTimeout(220);
  const afterRelease=await page.evaluate(()=>adventureGame.pasteUi.getState().used);
  expect(afterRelease).toBeGreaterThan(beforeRelease);
  // Para garantizar una dosis útil sin depender del reloj real CI, completar
  // con la misma API que impulsa la animación.
  await page.evaluate(()=>{
    adventureGame.pasteUi.pointer(.5,.5);adventureGame.pasteUi.pump(true);
    for(let i=0;i<70;i++)adventureGame.pasteUi.tick(40);
    adventureGame.pasteUi.pump(false);
    for(let i=0;i<20;i++)adventureGame.pasteUi.tick(40);
  });
  await popup.locator('[data-paste-confirm]').evaluate(el=>el.click());
  await expect(popup).toBeHidden();
  expect(await page.evaluate(()=>state.paste)).toBe(1);
  // Regresión 8.12.1: la pasta acabada no debe dejar al usuario
  // atrapado con el consumible gastado ni esconder la colocación del disipador.
  await expect(page.locator('#advShopCategory')).toHaveValue('cooler');
  await expect(page.locator('#adventurePanel [data-section="shop"]')).toHaveAttribute('open','');
  await expect(page.locator('[data-thermal-next]')).toBeVisible();
  await buy(page,'cooler','air');
  await expect(page.locator('#adventurePanel [data-section="actions"]')).toHaveAttribute('open','');
  await expect(page.locator('[data-suggest="fit"]:not([disabled])')).toBeVisible();
  await fit(page,'cooler:air');
  expect(await page.evaluate(()=>state.installed.cooler)).toBe(true);
  await expect(page.locator('#screwPrecisionPopup')).toBeHidden();
  await expect(page.locator('#adventurePanel')).toContainText('Disipador encajado');
  await buy(page,'item','screwdriver');await buy(page,'item','screws');
  // El disipador ya está instalado y consumido: no se puede volver a
  // seleccionar desde las existencias del inventario. El minijuego
  // debe abrirse automáticamente al comprar la última herramienta.
  const screws=page.locator('#screwPrecisionPopup');
  await expect(screws).toBeVisible();
  await expect(screws.locator('#thermalSpreadMap')).toBeVisible();
  await expect(page.locator('#adventurePanel')).toContainText('Motor 8.12.3');
  const live=screws.locator('.thermal-live');
  await expect(live).toBeVisible();
  await expect(live).toContainText('EN DIRECTO');
  const initial=await page.evaluate(()=>adventureGame.getExport().thermalPaste.spread.coverage);
  const firstRectCount=await screws.locator('#thermalSpreadCells rect').count();
  // Un único giro válido, sin completar NINGÚN tornillo, ya expande la pasta
  // y modifica visualmente el porcentaje, la barra y la silueta SVG.
  await page.evaluate(()=>{adventureGame.screwMove(50,50);adventureGame.screwTurn(1)});
  const afterOne=await page.evaluate(()=>adventureGame.getExport().thermalPaste.spread.coverage);
  expect(afterOne).toBeGreaterThan(initial);
  await expect(screws.locator('#thermalCoverage')).toHaveText(afterOne+'%');
  await expect(screws.locator('#thermalCoverageBar')).toHaveAttribute('style',new RegExp(afterOne+'%'));
  expect(await screws.locator('#thermalSpreadCells rect').count()).toBeGreaterThan(firstRectCount);
  await expect(screws.locator('[data-thermal-depth="0"]')).toHaveText('10%');
  expect(await page.evaluate(()=>state.fixings.cooler)).toBe(false);
  expect(await page.evaluate(()=>adventureGame.getExport().thermalPaste.review)).toBe(null);
  // Desplazarse hacia la zona donde se gira el tornillo NO debe esconder
  // la visualización pegajosa que permanece arriba del mismo popup.
  const pinned=await page.evaluate(()=>{
    const dialog=document.querySelector('#screwPrecisionPopup .has-thermal-spread');
    dialog.scrollTop=dialog.scrollHeight;
    const bounds=dialog.getBoundingClientRect();
    const live=dialog.querySelector('.thermal-live').getBoundingClientRect();
    return {top:live.top,parentTop:bounds.top,bottom:live.bottom,parentBottom:bounds.bottom};
  });
  expect(pinned.top).toBeGreaterThanOrEqual(pinned.parentTop-2);
  expect(pinned.bottom).toBeLessThanOrEqual(pinned.parentBottom+2);
  await page.evaluate(()=>{
    for(let depth=10;depth<=100;depth+=10){
      for(const corner of [0,3,1,2]){
        // La primera esquina ya tiene un giro (10 %) de la prueba en directo.
        if(depth===10&&corner===0)continue;
        const item=document.querySelector('[data-screw-hole="'+corner+'"]');
        item?.click();
        adventureGame.screwMove(50,50);
        adventureGame.screwTurn(1);
      }
    }
  });
  await expect(screws.locator('[data-cooler-finish]')).toBeVisible();
  const report=await page.evaluate(()=>adventureGame.getExport().thermalPaste);
  expect(report.review.quality).toBe('good');
  expect(report.review.coverage).toBeGreaterThan(initial);
  expect(report.review.peakImbalance).toBe(10);
  await screws.locator('[data-cooler-finish]').evaluate(el=>el.click());
  await expect(screws).toBeHidden();
  expect(await page.evaluate(()=>state.fixings.cooler)).toBe(true);
  expect(await page.evaluate(()=>state.paste)).toBe(1);
});

test('8.12.2 el disipador abre el minijuego al encajarlo con herramientas disponibles',async ({page})=>{
  test.setTimeout(210_000);
  await openGame(page);
  await buy(page,'case','tower');await fit(page,'case:tower');
  await buy(page,'item','ioShield');await fit(page,'item:ioShield');
  await buy(page,'motherboard','b650');await fit(page,'motherboard:b650');
  await buy(page,'cpu','r7600');
  await openSection(page,'inventory');
  await page.locator('[data-select-item="cpu:r7600"]').first().evaluate(el=>el.click());
  await openSection(page,'actions');
  await page.locator('[data-cpu-toggle]').evaluate(el=>el.click());
  await page.locator('[data-suggest="fit"]').first().evaluate(el=>el.click());
  await buy(page,'item','screwdriver');await buy(page,'item','screws');
  await buy(page,'cooler','air');await buy(page,'item','paste');
  await openSection(page,'inventory');
  await page.locator('[data-select-item="item:paste"]').first().evaluate(el=>el.click());
  await openSection(page,'actions');
  await page.locator('[data-suggest="apply"]').first().evaluate(el=>el.click());
  await expect(page.locator('#pastePrecisionPopup')).toBeVisible();
  await page.evaluate(()=>{
    adventureGame.pasteUi.pointer(.5,.5);adventureGame.pasteUi.pump(true);
    for(let i=0;i<75;i++)adventureGame.pasteUi.tick(40);
    adventureGame.pasteUi.pump(false);
    for(let i=0;i<20;i++)adventureGame.pasteUi.tick(40);
  });
  await page.locator('#pastePrecisionPopup [data-paste-confirm]').evaluate(el=>el.click());
  await expect(page.locator('#pastePrecisionPopup')).toBeHidden();
  await expect(page.locator('#adventurePanel [data-section="actions"]')).toHaveAttribute('open','');
  await page.locator('[data-suggest="fit"]').first().evaluate(el=>el.click());
  await expect(page.locator('#screwPrecisionPopup')).toBeVisible();
  await expect(page.locator('#thermalSpreadMap')).toBeVisible();
  // 8.12.4: comprobar superposición/scroll y contenido completo
  // en móviles estrechos, tablet y escritorio; conservar las pruebas
  // funcionales después de restaurar el viewport original.
  const originalViewport=page.viewportSize();
  for(const width of [320,360,650,850]){
    await page.setViewportSize({width,height:780});
    const sizes=await page.evaluate(()=>{
      const popup=document.querySelector('#screwPrecisionPopup');
      const dialog=popup.querySelector('.has-thermal-spread');
      const main=dialog.querySelector('.cooler-screw-layout');
      const left=main.querySelector('.cooler-pressure-column');
      const right=main.querySelector('.cooler-tool-column');
      const live=left.querySelector('.thermal-live');
      const anchors=left.querySelector('.screw-anchor-map');
      const board=right.querySelector('.screw-alignment-board');
      const controls=right.querySelector('.screw-fallback-controls');
      const footer=dialog.querySelector('footer');
      const rect=node=>node.getBoundingClientRect();
      return {
        popupScroll:popup.scrollHeight-popup.clientHeight,
        dialogScroll:dialog.scrollHeight-dialog.clientHeight,
        leftScroll:left.scrollHeight-left.clientHeight,
        rightScroll:right.scrollHeight-right.clientHeight,
        columnsSeparated:rect(left).right<=rect(right).left+1,
        pasteAboveAnchors:rect(live).bottom<=rect(anchors).top+1,
        boardAboveButtons:rect(board).bottom<=rect(controls).top+1,
        buttonsAboveFooter:rect(controls).bottom<=rect(footer).top+1,
        footerInside:rect(footer).bottom<=rect(dialog).bottom+2,
        noSticky:getComputedStyle(live).position==='static'
      };
    });
    expect(sizes.dialogScroll,'Ficha no debe desplazarse a '+width+'px').toBeLessThanOrEqual(2);
    expect(sizes.popupScroll,'Popup sin desplazamiento a '+width+'px').toBeLessThanOrEqual(2);
    expect(sizes.leftScroll,'Columna izquierda completa a '+width+'px').toBeLessThanOrEqual(2);
    expect(sizes.rightScroll,'Columna derecha completa a '+width+'px').toBeLessThanOrEqual(2);
    expect(sizes.columnsSeparated).toBe(true);
    expect(sizes.pasteAboveAnchors).toBe(true);
    expect(sizes.boardAboveButtons).toBe(true);
    expect(sizes.buttonsAboveFooter).toBe(true);
    expect(sizes.footerInside).toBe(true);
    expect(sizes.noSticky).toBe(true);
  }
  if(originalViewport)await page.setViewportSize(originalViewport);
  expect(await page.evaluate(()=>state.installed.cooler)).toBe(true);
  expect(await page.evaluate(()=>state.fixings.cooler)).toBe(false);
  await page.locator('#screwPrecisionPopup [data-screw-cancel]').first().evaluate(el=>el.click());
  await expect(page.locator('#screwPrecisionPopup')).toBeHidden();
  await expect(page.locator('[data-cooler-start]')).toBeVisible();
  await page.locator('[data-cooler-start]').first().evaluate(el=>el.click());
  await expect(page.locator('#screwPrecisionPopup')).toBeVisible();
});
