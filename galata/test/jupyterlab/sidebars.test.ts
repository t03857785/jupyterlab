// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import { expect, galata, Handle, test } from '@jupyterlab/galata';

const leftSidebarIds: galata.SidebarTabId[] = [
  'filebrowser',
  'jp-running-sessions',
  'table-of-contents',
  'extensionmanager.main-view'
];

const rightSidebarIds: galata.SidebarTabId[] = [
  'jp-property-inspector',
  'jp-debugger-sidebar'
];

const sidebarIds: galata.SidebarTabId[] =
  leftSidebarIds.concat(rightSidebarIds);

/**
 * Add provided text as label on first tab in given tabbar.
 * By default we only have icons, but we should test for the
 * styling of labels which are used downstream (e.g. sidecar).
 */
async function mockLabelOnFirstTab(tabbar: Handle, text: string) {
  await tabbar.$eval(
    '.lm-TabBar-tabLabel',
    (node: HTMLElement, text: string) => {
      node.innerText = text;
    },
    text
  );
}

test.describe('Sidebars', () => {
  sidebarIds.forEach(sidebarId => {
    test(`Open Sidebar tab ${sidebarId}`, async ({ page }) => {
      await page.sidebar.openTab(sidebarId);
      expect(await page.sidebar.isTabOpen(sidebarId)).toEqual(true);

      const imageName = `opened-sidebar-${sidebarId.replace('.', '-')}.png`;
      const position = await page.sidebar.getTabPosition(sidebarId);
      const sidebar = await page.sidebar.getContentPanel(position);
      expect(await sidebar.screenshot()).toMatchSnapshot(
        imageName.toLowerCase()
      );
    });
  });

  test('File Browser has no unused rules', async ({ page }) => {
    await page.sidebar.openTab('filebrowser');
    const clickMenuItem = async (command): Promise<void> => {
      const contextmenu = await page.menu.openContextMenu(
        '.jp-DirListing-headerItem'
      );
      const item = await page.menu.getMenuItemInMenu(contextmenu, command);
      await item.click();
    };
    await clickMenuItem('Show File Checkboxes');
    await clickMenuItem('Show File Size Column');

    await page.notebook.createNew('notebook.ipynb');

    const unusedRules = await page.style.findUnusedStyleRules({
      page,
      fragments: ['jp-DirListing', 'jp-FileBrowser'],
      exclude: [
        // active during renaming
        'jp-DirListing-editor',
        // hidden files
        '[data-is-dot]',
        // filtering results
        '.jp-DirListing-content mark',
        // only added after resizing
        'jp-DirListing-narrow'
      ]
    });
    expect(unusedRules.length).toEqual(0);
  });

  test('Left light tabbar (with text)', async ({ page }) => {
    await page.theme.setLightTheme();
    const imageName = 'left-light-tabbar-with-text.png';
    const tabbar = await page.sidebar.getTabBar();
    await mockLabelOnFirstTab(tabbar, 'File Browser');
    expect(await tabbar.screenshot()).toMatchSnapshot(imageName.toLowerCase());
  });

  test('Right dark tabbar (with text)', async ({ page }) => {
    await page.theme.setDarkTheme();
    const imageName = 'right-dark-tabbar-with-text.png';
    const tabbar = await page.sidebar.getTabBar('right');
    await mockLabelOnFirstTab(tabbar, 'Property Inspector');
    expect(await tabbar.screenshot()).toMatchSnapshot(imageName.toLowerCase());
  });

  test('Move File Browser to right', async ({ page }) => {
    await page.sidebar.moveTabToRight('filebrowser');
    expect(await page.sidebar.getTabPosition('filebrowser')).toBe('right');
  });

  test('Open File Browser on right', async ({ page }) => {
    await page.sidebar.moveTabToRight('filebrowser');
    await page.sidebar.openTab('filebrowser');
    expect(await page.sidebar.isTabOpen('filebrowser')).toEqual(true);
  });

  test('Open Sidebar on right', async ({ page }) => {
    await page.sidebar.open('right');
    expect(await page.sidebar.isOpen('right')).toEqual(true);
  });

  test('Close Sidebar on right', async ({ page }) => {
    await page.sidebar.open('right');
    await page.menu.clickMenuItem('View>Appearance>Show Right Sidebar');
    expect(await page.sidebar.isOpen('right')).toEqual(false);
  });

  test('Capture File Browser on right', async ({ page }) => {
    await page.sidebar.moveTabToRight('filebrowser');
    await page.sidebar.openTab('filebrowser');

    let imageName = 'filebrowser-right.png';
    expect(await page.screenshot()).toMatchSnapshot(imageName);
  });

  test('Move Debugger to left', async ({ page }) => {
    await page.sidebar.moveTabToLeft('jp-debugger-sidebar');
    expect(await page.sidebar.getTabPosition('jp-debugger-sidebar')).toEqual(
      'left'
    );
  });

  test('Check Running Session button on sidebar has correct aria label and role', async ({
    page
  }) => {
    await page.sidebar.open('left');
    const runningSessionsWidget = page.locator('#jp-running-sessions');
    const runningSessionsElementAriaLabel =
      await runningSessionsWidget.getAttribute('aria-label');
    const runningSessionsElementRole =
      await runningSessionsWidget.getAttribute('role');
    expect(runningSessionsElementAriaLabel).toEqual('Running Sessions section');
    expect(runningSessionsElementRole).toEqual('region');
  });

  test('Check Extension Manager button on sidebar has correct aria label and role', async ({
    page
  }) => {
    await page.sidebar.open('left');
    const extensionManagerWidget = page.locator(
      '#extensionmanager\\.main-view'
    );
    const extensionManagerElementAriaLabel =
      await extensionManagerWidget.getAttribute('aria-label');
    const extensionManagerElementRole =
      await extensionManagerWidget.getAttribute('role');
    expect(extensionManagerElementAriaLabel).toEqual(
      'Extension Manager section'
    );
    expect(extensionManagerElementRole).toEqual('region');
  });

  test('Check File Browser button on sidebar has correct aria label and role', async ({
    page
  }) => {
    await page.sidebar.open('left');
    const fileBrowserWidget = page.locator('#filebrowser');
    const fileBrowserElementAriaLabel =
      await fileBrowserWidget.getAttribute('aria-label');
    const fileBrowserElementRole = await fileBrowserWidget.getAttribute('role');
    expect(fileBrowserElementAriaLabel).toEqual('File Browser Section');
    expect(fileBrowserElementRole).toEqual('region');
  });

  test('Check Debugger button on sidebar has correct aria label and role', async ({
    page
  }) => {
    await page.sidebar.open('right');
    const debuggerWidget = page.locator('#jp-debugger-sidebar');
    const debuggerElementAriaLabel =
      await debuggerWidget.getAttribute('aria-label');
    const debuggerElementRole = await debuggerWidget.getAttribute('role');
    expect(debuggerElementAriaLabel).toEqual('Debugger section');
    expect(debuggerElementRole).toEqual('region');
  });

  test('Check Table of Contents button on sidebar has correct aria label and role', async ({
    page
  }) => {
    await page.sidebar.open('left');
    const tableOfContentsWidget = page.locator('#table-of-contents');
    const tableOfContentsElementAriaLabel =
      await tableOfContentsWidget.getAttribute('aria-label');
    const tableOfContentsElementRole =
      await tableOfContentsWidget.getAttribute('role');
    expect(tableOfContentsElementAriaLabel).toEqual(
      'Table of Contents section'
    );
    expect(tableOfContentsElementRole).toEqual('region');
  });
});

const runningSessionsElementAriaLabels: string[] = [
  'Open Tabs Section',
  'Kernels Section',
  'Language servers Section',
  'Terminals Section'
];
const debuggerElementAriaLabels: string[] = [
  'Variables Section',
  'Callstack Section',
  'Breakpoints Section',
  'Source Section',
  'Kernel Sources Section'
];
const propertyElementAriaLabels: string[] = [
  'Warning Section',
  'Installed Section',
  'Discover Section'
];

const sessionsAndDebuggerAriaLabels: string[] =
  runningSessionsElementAriaLabels.concat(debuggerElementAriaLabels);

test.describe('Sidebar keyboard navigation @a11y', () => {
  leftSidebarIds.forEach(leftSidebarId => {
    test(`Open Sidebar tab ${leftSidebarId} via keyboard navigation`, async ({
      page
    }) => {
      await page.goto();

      await page.sidebar.close('left');

      // eslint-disable-next-line no-constant-condition
      while (true) {
        await page.keyboard.press('Tab');
        let IsFocused = await page.evaluate(
          () => document.activeElement?.getAttribute('data-id')
        );
        if (IsFocused === leftSidebarIds[0]) {
          break;
        }
      }

      // eslint-disable-next-line no-constant-condition
      while (leftSidebarId !== leftSidebarIds[0]) {
        await page.keyboard.press('ArrowDown');
        let IsFocused = await page.evaluate(
          () => document.activeElement?.getAttribute('data-id')
        );
        if (IsFocused === leftSidebarId) {
          break;
        }
      }

      await page.keyboard.press('Enter');

      expect(await page.sidebar.isTabOpen(leftSidebarId)).toEqual(true);
    });
  });

  rightSidebarIds.forEach(rightSidebarId => {
    test(`Open Sidebar tab ${rightSidebarId} via keyboard navigation`, async ({
      page
    }) => {
      await page.goto();

      await page.sidebar.close('right');

      // eslint-disable-next-line no-constant-condition
      while (true) {
        await page.keyboard.press('Tab');
        let propertyInspectorIsFocused = await page.evaluate(
          () => document.activeElement?.getAttribute('data-id')
        );
        if (propertyInspectorIsFocused === rightSidebarIds[0]) {
          break;
        }
      }

      // eslint-disable-next-line no-constant-condition
      while (rightSidebarId !== rightSidebarIds[0]) {
        await page.keyboard.press('ArrowDown');
        let IsFocused = await page.evaluate(
          () => document.activeElement?.getAttribute('data-id')
        );
        if (IsFocused === rightSidebarId) {
          break;
        }
      }
      await page.keyboard.press('Enter');

      expect(await page.sidebar.isTabOpen(rightSidebarId)).toEqual(true);
    });
  });

  sessionsAndDebuggerAriaLabels.forEach(sessionsAndDebuggerAriaLabel => {
    test(`Open accordion panels ${sessionsAndDebuggerAriaLabel} via keyboard navigation`, async ({
      page
    }) => {
      await page.goto();

      await page.sidebar.openTab('jp-running-sessions');
      await page.sidebar.openTab('jp-debugger-sidebar');

      // eslint-disable-next-line no-constant-condition
      while (true) {
        await page.keyboard.press('Tab');
        let IsFocused = await page.evaluate(
          () => document.activeElement?.getAttribute('aria-label')
        );
        if (IsFocused === sessionsAndDebuggerAriaLabel) {
          break;
        }
      }

      await page.keyboard.press('Enter');

      const isExpanded = await page.evaluate(
        () => document.activeElement?.getAttribute('aria-expanded')
      );

      expect(isExpanded).toBeTruthy();
    });
  });

  propertyElementAriaLabels.forEach(propertyElementAriaLabel => {
    test(`Open accordion panels ${propertyElementAriaLabel} via keyboard navigation`, async ({
      page
    }) => {
      await page.goto();

      await page.sidebar.openTab('extensionmanager.main-view');

      // eslint-disable-next-line no-constant-condition
      while (true) {
        await page.keyboard.press('Tab');
        let IsFocused = await page.evaluate(
          () => document.activeElement?.getAttribute('aria-label')
        );
        if (IsFocused === propertyElementAriaLabel) {
          break;
        }
      }

      await page.keyboard.press('Enter');

      const isExpanded = await page.evaluate(
        () => document.activeElement?.getAttribute('aria-expanded')
      );

      expect(isExpanded).toBeTruthy();
    });
  });
});
