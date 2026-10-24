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
  await page.locator('#advShopCategory').selectOption(category);
  const button=page.locator(`[data-buy="${category}:${id}"]`);
  await expect(button).toBeEnabled();
  await button.click();
  await expect(page.locator('#adventurePanel')).toContainText('Comprado:');
}

async function fit(page, item) {
  await openSection(page, 'inventory');
  await page.locator(`[data-select-item="${item}"]`).first().click();
  await openSection(page, 'actions');
  await page.locator('[data-suggest="fit"]:not([disabled])').first().click();
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
  await page.locator('#viewport').click({position:{x:point.x,y:point.y}});
  await expect(page.locator('#powerStatus')).toHaveText('Apagado');
  expect((await page.evaluate(() => window.PC3D.getFrontIOState())).ledOn).toBe(false);
});

test('los conectores USB frontales se conectan por separado y muestran sus cables', async ({page}) => {
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
  await page.locator('#keyboardToggle').click();
  await page.locator('#mouseToggle').click();
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
    for(const mm of route.straightMm)
      expect(mm,route.id+' tramo recto').toBeGreaterThan(12);
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
  test.setTimeout(90000);
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
  test.setTimeout(85000);
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
  test.setTimeout(150_000);
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
  test.setTimeout(155_000);
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
