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
