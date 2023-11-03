// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import { expect, test } from '@jupyterlab/galata';
import type { ISettingRegistry } from '@jupyterlab/settingregistry';

const menuPaths = [
  'File',
  'File>New',
  'Edit',
  'View',
  'View>Appearance',
  'Run',
  'Kernel',
  'Tabs',
  'Settings',
  'Settings>Theme',
  'Settings>Console Run Keystroke',
  'Settings>Text Editor Theme',
  'Settings>Text Editor Indentation',
  'Settings>Terminal Theme',
  'Help'
];

test.describe('General Tests', () => {
  test.use({ autoGoto: false });

  menuPaths.forEach(menuPath => {
    test(`Open menu item ${menuPath}`, async ({ page }) => {
      await page.goto();
      await page.menu.open(menuPath);
      expect(await page.menu.isOpen(menuPath)).toBeTruthy();

      const imageName = `opened-menu-${menuPath.replace(/>/g, '-')}.png`;
      const menu = await page.menu.getOpenMenu();
      expect(await menu.screenshot()).toMatchSnapshot(imageName.toLowerCase());
    });
  });

  test('Open language menu', async ({ page }) => {
    await page.route(/.*\/api\/translation.*/, (route, request) => {
      if (request.method() === 'GET') {
        return route.fulfill({
          status: 200,
          body: '{"data": {"en": {"displayName": "English", "nativeName": "English"}}, "message": ""}'
        });
      } else {
        return route.continue();
      }
    });
    await page.goto();

    const menuPath = 'Settings>Language';
    await page.menu.open(menuPath);
    expect(await page.menu.isOpen(menuPath)).toBeTruthy();

    const imageName = `opened-menu-settings-language.png`;
    const menu = await page.menu.getOpenMenu();
    expect(await menu.screenshot()).toMatchSnapshot(imageName.toLowerCase());
  });

  test('Close all menus', async ({ page }) => {
    await page.goto();
    await page.menu.open('File>New');
    await page.menu.closeAll();
    expect(await page.menu.isAnyOpen()).toEqual(false);
  });
});

const EXPECTED_MISSING_COMMANDS_MAINMENU = ['hub:control-panel', 'hub:logout'];

test('Main menu definition must target an valid command', async ({ page }) => {
  const [menus, commands] = await page.evaluate(async () => {
    const settings = await window.galata.getPlugin(
      '@jupyterlab/apputils-extension:settings'
    );
    const menus = await settings.get(
      '@jupyterlab/mainmenu-extension:plugin',
      'menus'
    );
    const commandIds = window.jupyterapp.commands.listCommands();

    return Promise.resolve([
      menus.composite as ISettingRegistry.IMenu[],
      commandIds
    ]);
  });

  commands.push(...EXPECTED_MISSING_COMMANDS_MAINMENU);

  const missingCommands = menus.reduce((agg, current) => {
    const items =
      current.items?.reduce((agg, item) => {
        const testedItem = reduceItem(item, commands);
        if (testedItem !== null) {
          agg.push(testedItem);
        }
        return agg;
      }, []) ?? [];
    if (items.length > 0) {
      const r = {};
      r[current.label ?? 'unknown'] = items;
      agg.push(r);
    }

    return agg;
  }, []);

  expect(missingCommands).toEqual([]);
});

test('Context menu definition must target an valid command', async ({
  page
}) => {
  const [items, commands] = await page.evaluate(async () => {
    const settings = await window.galata.getPlugin(
      '@jupyterlab/apputils-extension:settings'
    );
    const items = await settings.get(
      '@jupyterlab/application-extension:context-menu',
      'contextMenu'
    );
    const commandIds = window.jupyterapp.commands.listCommands();

    return Promise.resolve([
      items.composite as ISettingRegistry.IMenuItem[],
      commandIds
    ]);
  });

  commands.push(...EXPECTED_MISSING_COMMANDS_MAINMENU);

  const missingCommands = items.reduce((agg, item) => {
    const testedItem = reduceItem(item, commands);
    if (testedItem !== null) {
      agg.push(testedItem);
    }
    return agg;
  }, []);

  expect(missingCommands).toEqual([]);
});

function reduceItem(
  item: ISettingRegistry.IMenuItem,
  commands: string[]
):
  | ISettingRegistry.IMenuItem
  | { [id: string]: ISettingRegistry.IMenuItem[] }
  | null {
  switch (item.type ?? 'command') {
    case 'command':
      if (!commands.includes(item.command)) {
        return item;
      }
      break;
    case 'submenu': {
      const items =
        item.submenu?.items?.reduce((agg, item) => {
          const testedItem = reduceItem(item, commands);
          if (testedItem !== null) {
            agg.push(testedItem);
          }
          return agg;
        }, []) ?? [];
      if (items.length === 0) {
        return null;
      } else {
        const r = {};
        r[item.submenu?.label ?? 'unknown'] = items;
        return r;
      }
    }
    default:
      break;
  }
  return null;
}

test.describe('Top menu keyboard navigation', () => {
  test.use({ autoGoto: false });
  test('navigate to open file with keyboard', async ({ page }) => {
    await page.goto();
    const fileMenu = page.getByRole('menuitem', { name: 'File' });
    while (true) {
      await page.keyboard.press('Shift+Tab');
      if (fileMenu.evaluate(el => el === document.activeElement)) {
        break;
      }
    }
    await page.keyboard.press('Enter');

    expect(await page.menu.isOpen('File')).toBeTruthy();
  });

  // test("navigate to open edit with keyboard", async ({ page }) => {
  //   await page.goto();
  //   for (let i = 0; i < 3; i++) {
  //     await page.keyboard.press("Shift+Tab");
  //   }
  //   await page.keyboard.press("ArrowRight");
  //   await page.keyboard.press("Enter");

  //   await expect(page.locator("#jp-mainmenu-edit")).toBeFocused();
  // });

  // test("navigate to open view with keyboard", async ({ page }) => {
  //   await page.goto();
  //   for (let i = 0; i < 3; i++) {
  //     await page.keyboard.press("Shift+Tab");
  //   }
  //   for (let i = 0; i < 2; i++) {
  //     await page.keyboard.press("ArrowRight");
  //   }
  //   await page.keyboard.press("Enter");

  //   await expect(page.locator("#jp-mainmenu-view")).toBeFocused();
  // });

  // test("navigate to open run with keyboard", async ({ page }) => {
  //   await page.goto();
  //   for (let i = 0; i < 3; i++) {
  //     await page.keyboard.press("Shift+Tab");
  //   }
  //   for (let i = 0; i < 3; i++) {
  //     await page.keyboard.press("ArrowRight");
  //   }
  //   await page.keyboard.press("Enter");

  //   await expect(page.locator("#jp-mainmenu-run")).toBeFocused();
  // });

  // test("navigate to open kernel with keyboard", async ({ page }) => {
  //   await page.goto();
  //   for (let i = 0; i < 3; i++) {
  //     await page.keyboard.press("Shift+Tab");
  //   }
  //   for (let i = 0; i < 4; i++) {
  //     await page.keyboard.press("ArrowRight");
  //   }
  //   await page.keyboard.press("Enter");

  //   await expect(page.locator("#jp-mainmenu-kernel")).toBeFocused();
  // });

  // test("navigate to open tabs with keyboard", async ({ page }) => {
  //   await page.goto();
  //   for (let i = 0; i < 3; i++) {
  //     await page.keyboard.press("Shift+Tab");
  //   }
  //   for (let i = 0; i < 5; i++) {
  //     await page.keyboard.press("ArrowRight");
  //   }
  //   await page.keyboard.press("Enter");

  //   await expect(page.locator("#jp-mainmenu-tabs")).toBeFocused();
  // });

  // test("navigate to open settings with keyboard", async ({ page }) => {
  //   await page.goto();
  //   for (let i = 0; i < 3; i++) {
  //     await page.keyboard.press("Shift+Tab");
  //   }
  //   for (let i = 0; i < 6; i++) {
  //     await page.keyboard.press("ArrowRight");
  //   }
  //   await page.keyboard.press("Enter");

  //   await expect(page.locator("#jp-mainmenu-settings")).toBeFocused();
  // });

  // test("navigate to open help with keyboard", async ({ page }) => {
  //   await page.goto();
  //   for (let i = 0; i < 3; i++) {
  //     await page.keyboard.press("Shift+Tab");
  //   }
  //   for (let i = 0; i < 7; i++) {
  //     await page.keyboard.press("ArrowRight");
  //   }
  //   await page.keyboard.press("Enter");

  //   await expect(page.locator("#jp-mainmenu-help")).toBeFocused();
  // });

  // test("navigate to open launcher with keyboard", async ({ page }) => {
  //   await page.goto();
  //   await page.keyboard.press("Shift+Tab");
  //   await page.keyboard.press("Shift+Tab");
  //   await page.keyboard.press("Shift+Tab");
  //   await page.keyboard.press("Enter");
  //   await page.keyboard.press("ArrowDown");
  //   await page.keyboard.press("Enter");
  //   await expect(page.locator("#tab-key-2-1")).toBeFocused();
  // });

  // test("navigate to close launcher with keyboard", async ({ page }) => {
  //   await page.goto();
  //   for (let i = 0; i < 3; i++) {
  //     await page.keyboard.press("Shift+Tab");
  //   }
  //   await page.keyboard.press("Enter");
  //   await page.keyboard.press("ArrowDown");
  //   await page.keyboard.press("Enter");
  //   for (let i = 0; i < 3; i++) {
  //     await page.keyboard.press("Shift+Tab");
  //   }
  //   await page.keyboard.press("Enter");
  //   for (let i = 0; i < 4; i++) {
  //     await page.keyboard.press("ArrowDown");
  //   }
  //   await page.keyboard.press("Enter");
  //   expect(await page.menu.isAnyOpen()).toEqual(false);
  // });

  // test("navigate to close all tabs with keyboard", async ({ page }) => {
  //   await page.goto();
  //   for (let i = 0; i < 3; i++) {
  //     await page.keyboard.press("Shift+Tab");
  //   }
  //   await page.keyboard.press("Enter");
  //   for (let i = 0; i < 4; i++) {
  //     await page.keyboard.press("ArrowDown");
  //   }
  //   await page.keyboard.press("Enter");
  //   await expect(page.locator("#tab-key-2-1")).toBeFocused();
  // });

  // test("navigate to change to Dark mode with keyboard", async ({ page }) => {
  //   await page.goto();
  //   for (let i = 0; i < 3; i++) {
  //     await page.keyboard.press("Shift+Tab");
  //   }
  //   for (let i = 0; i < 6; i++) {
  //     await page.keyboard.press("ArrowRight");
  //   }
  //   for (let i = 0; i < 3; i++) {
  //     await page.keyboard.press("Enter");
  //   }
  //   const locator = page.locator("body");
  //   await expect(locator).toHaveJSProperty("data-jp-theme-light", false);
  // });

  // test("navigate to open command pallette with keyboard", async ({ page }) => {
  //   await page.goto();
  //   for (let i = 0; i < 3; i++) {
  //     await page.keyboard.press("Shift+Tab");
  //   }
  //   for (let i = 0; i < 2; i++) {
  //     await page.keyboard.press("ArrowRight");
  //   }
  //   for (let i = 0; i < 2; i++) {
  //     await page.keyboard.press("Enter");
  //   }

  //   await expect(page.locator("#modal-command-palette")).toHaveClass(
  //     "lm-Widget lm-Panel jp-ModalCommandPalette lm-mod-hidden"
  //   );
  // });
});
