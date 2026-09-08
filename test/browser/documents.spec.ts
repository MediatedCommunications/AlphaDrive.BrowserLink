import { readFileSync } from 'node:fs';
import { test, expect, legacyRow } from './fixture';

test('loads the built extension with real settings and content-script injection', async ({ app }) => {
  await app.load('<h1>Documents</h1>');
  expect(await app.worker.evaluate(() => chrome.runtime.getManifest().name)).toBe('Faster Suite Browser Link');
  await app.settings({ clio_enhance_docs: false, clio_open_docs: true });
  expect(await app.worker.evaluate(() => chrome.storage.local.get(['clio_enhance_docs', 'clio_open_docs'])))
    .toEqual({ clio_enhance_docs: false, clio_open_docs: true });
});

test('adds document controls on initial load without requiring a later mutation', async ({ app }) => {
  await app.load(`<table><tbody>${legacyRow()}</tbody></table>`);
  await expect(app.page.locator('.fasterlaw-icon')).toBeVisible();
});

test('opens the document menu from the keyboard and returns focus on Escape', async ({ app }) => {
  await app.load(`<table><tbody>${legacyRow()}</tbody></table>`);
  const button = app.page.getByRole('button', { name: 'Faster Suite actions' });
  await button.focus();
  await button.press('Enter');
  const menu = app.page.getByRole('menu', { name: 'Faster Suite actions' });
  await expect(menu).toBeVisible();
  await expect(button).toHaveAttribute('aria-expanded', 'true');
  await expect(menu.getByRole('menuitem').first()).toBeFocused();
  await app.page.keyboard.press('ArrowDown');
  await expect(menu.getByRole('menuitem').nth(1)).toBeFocused();
  await app.page.keyboard.press('Escape');
  await expect(menu).toHaveCount(0);
  await expect(button).toBeFocused();
  await expect(button).toHaveAttribute('aria-expanded', 'false');
});

test('turning enhancements off closes menus and hides row and detail controls', async ({ app }) => {
  await app.load(`<table><tbody>${legacyRow()}</tbody></table><div>
    <a class="clio-ui-link" href="#native" x-on:click="$documentsRedirect.handleLauncherClick('true', 'us', '202')">Open details document</a>
    </div>`);
  await app.page.getByRole('button', { name: 'Faster Suite actions' }).click();
  await expect(app.page.getByRole('menu')).toBeVisible();
  await app.settings({ clio_enhance_docs: false, clio_open_docs: false });
  await expect(app.page.getByRole('menu')).toHaveCount(0);
  await expect(app.page.getByRole('button', { name: 'Faster Suite actions' })).toHaveCount(0);
  await expect(app.page.locator('.fasterlaw-details-open-link')).toBeHidden();
  await app.settings({ clio_enhance_docs: true, clio_open_docs: false });
  await expect(app.page.getByRole('button', { name: 'Faster Suite actions' })).toBeVisible();
  await expect(app.page.locator('.fasterlaw-details-open-link')).toBeVisible();
  await expect(app.page.getByRole('menu')).toHaveCount(0);
});

const capturedRow = readFileSync(new URL('./fixtures/clio-grid-row.html', import.meta.url), 'utf8');
test('starred files retain their shortcut and document action across star changes', async ({ app }) => {
  // Live Clio uses an unstar form action for starred files.
  await app.load(capturedRow.replace('/files/101/star', '/files/101/unstar'));
  const shortcut = app.page.getByRole('button', { name: 'Faster Suite actions' });
  await expect(shortcut).toBeVisible();
  await shortcut.click();
  await app.page.getByRole('menuitem', { name: 'Open with Faster Suite', exact: true }).click();
  await expect.poll(() => app.destinations).toEqual(['alphadrive://localhost/Remoting/custom_actions/documents/edit?subject_url=/api/v4/documents/101']);
  for (const action of ['star', 'unstar']) {
    await app.page.locator('[row-id="101"] form').evaluate((form, action) => {
      form.setAttribute('action', `/document_management/files/101/${action}?grid_id=recents-data-grid`);
    }, action);
    await expect(shortcut).toBeVisible();
    await expect(shortcut).toHaveCount(1);
  }
});

test('adds one control to a captured new Documents file row and leaves folders native', async ({ app }) => {
  const folder = readFileSync(new URL('./fixtures/clio-grid-folder.html', import.meta.url), 'utf8');
  await app.load(`<div role="grid">${capturedRow}${folder}</div>`);
  await expect(app.page.getByRole('button', { name: 'Faster Suite actions' })).toHaveCount(1);
  await expect(app.page.locator('[row-id="101"] [col-id="actions"] .fasterlaw-icon')).toBeVisible();
});

test('native mouse and keyboard document clicks dispatch exactly once', async ({ app }) => {
  await app.load(`<table>${legacyRow()}</table>`);
  const link = app.page.getByRole('link', { name: 'Document 101', exact: true });
  await link.evaluate(node => node.addEventListener('click', event => {
    event.preventDefault();
    document.body.dataset.clicks = String(Number(document.body.dataset.clicks || 0) + 1);
  }));
  await link.click();
  await expect(app.page.locator('body')).toHaveAttribute('data-clicks', '1');
  await link.press('Enter');
  await expect(app.page.locator('body')).toHaveAttribute('data-clicks', '2');
});

for (const enhance of [false, true]) {
  test(`keyboard opening preference works independently of enhancement=${enhance}`, async ({ app }) => {
    await app.settings({ clio_enhance_docs: enhance, clio_open_docs: true });
    await app.load(`<table>${legacyRow()}</table>`);
    const link = app.page.getByRole('link', { name: 'Document 101', exact: true });
    await link.press('Enter');
    await expect.poll(() => app.destinations).toEqual(['alphadrive://localhost/Remoting/custom_actions/documents/edit?subject_url=/api/v4/documents/101']);
  });
}

test('a reused grid row dispatches its current identity before observer delivery', async ({ app }) => {
  await app.settings({ clio_enhance_docs: true, clio_open_docs: true });
  await app.load(`<div role="grid">${capturedRow}</div>`);
  await expect(app.page.locator('.fasterlaw-icon')).toBeVisible();
  await app.page.locator('[row-id="101"]').evaluate(row => {
    row.setAttribute('row-id', '202');
    row.querySelector('form')!.setAttribute('action', '/document_management/files/202/star');
    const open = row.querySelector<HTMLButtonElement>('[data-testid$="-open"]')!;
    open.setAttribute('x-on:click.stop', 'openFileById(202)');
    open.click();
  });
  await expect.poll(() => app.destinations).toEqual(['alphadrive://localhost/Remoting/custom_actions/documents/edit?subject_url=/api/v4/documents/202']);
});

test('omits Clio Launcher when no native Launcher is available', async ({ app }) => {
  await app.load(`<table>${legacyRow('101', false)}</table>`);
  await app.page.getByRole('button', { name: 'Faster Suite actions' }).click();
  await expect(app.page.getByRole('menuitem', { name: 'Open with Clio Launcher', exact: true })).toHaveCount(0);
  await expect(app.page.getByRole('menuitem')).toHaveText(['Open with Faster Suite', 'Download', 'Locate', 'Copy Link', 'Compare / History']);
});

test('downloads retain the document region', async ({ app }) => {
  await app.load(`<table>${legacyRow()}</table>`, 'https://app.goclio.eu');
  await app.page.getByRole('button', { name: 'Faster Suite actions' }).click();
  const popup = app.page.waitForEvent('popup');
  await app.page.getByRole('menuitem', { name: 'Download', exact: true }).click();
  const downloaded = await popup;
  await expect(downloaded).toHaveURL('https://app.goclio.eu/iris/documents/101/download');
});

test('allocates menus only while open and closes outside interaction consistently', async ({ app }) => {
  await app.load(`<table>${legacyRow('101')}${legacyRow('202')}</table><button id="outside">Outside</button>`);
  await expect(app.page.locator('.fasterlaw-actions-container')).toHaveCount(0);
  const buttons = app.page.getByRole('button', { name: 'Faster Suite actions' });
  await buttons.first().click();
  await expect(app.page.getByRole('menu')).toHaveCount(1);
  await buttons.last().focus();
  await buttons.last().press('Enter');
  await expect(app.page.locator('.fasterlaw-actions-container')).toHaveCount(1);
  await expect(buttons.first()).toHaveAttribute('aria-expanded', 'false');
  await app.page.locator('#outside').click();
  await expect(app.page.locator('.fasterlaw-actions-container')).toHaveCount(0);
  await expect(buttons.last()).toHaveAttribute('aria-expanded', 'false');
});

test('places the menu inside a narrow scrolled viewport', async ({ app }) => {
  await app.page.setViewportSize({ width: 360, height: 400 });
  await app.load(`<div style="height:700px"></div><table>${legacyRow()}</table><div style="height:500px"></div>`);
  const button = app.page.getByRole('button', { name: 'Faster Suite actions' });
  await button.scrollIntoViewIfNeeded();
  await button.click();
  const box = await app.page.getByRole('menu').boundingBox();
  expect(box).toBeTruthy();
  expect(box!.x).toBeGreaterThanOrEqual(0);
  expect(box!.y).toBeGreaterThanOrEqual(0);
  expect(box!.x + box!.width).toBeLessThanOrEqual(360);
  expect(box!.y + box!.height).toBeLessThanOrEqual(400);
});

test('removes invalid controls and recovers after identity and host replacement', async ({ app }) => {
  await app.load(`<div role="grid">${capturedRow}</div>`);
  const row = app.page.locator('[row-id="101"]');
  await expect(row.locator('.fasterlaw-icon')).toBeVisible();
  await row.locator('.fasterlaw-icon').click();
  await row.evaluate(node => node.setAttribute('row-id', 'unknown'));
  await expect(app.page.locator('.fasterlaw-icon')).toHaveCount(0);
  await expect(app.page.locator('.fasterlaw-actions-container')).toHaveCount(0);
  await app.page.locator('[row-id="unknown"]').evaluate(node => node.setAttribute('row-id', '101'));
  await expect(row.locator('.fasterlaw-icon')).toHaveCount(1);
  await row.locator('[col-id="actions"]').evaluate(node => {
    const replacement = node.cloneNode(true) as HTMLElement;
    replacement.querySelector('.fasterlaw-icon')?.remove();
    node.replaceWith(replacement);
  });
  await expect(row.locator('.fasterlaw-icon')).toHaveCount(1);
  await row.locator('.fasterlaw-icon').click();
  await expect(app.page.getByRole('menu')).toBeVisible();
  await row.evaluate(node => node.remove());
  await expect(app.page.locator('.fasterlaw-actions-container')).toHaveCount(0);
});

test('the detail shortcut is keyboard accessible while native detail opening stays native', async ({ app }) => {
  await app.settings({ clio_enhance_docs: true, clio_open_docs: true });
  await app.load(`<div><a class="clio-ui-link" href="#native" onclick="event.preventDefault();document.body.dataset.native='yes'" x-on:click="$documentsRedirect.handleLauncherClick('true', 'us', '202')">Native details</a></div>`);
  await app.page.getByRole('link', { name: 'Native details' }).press('Enter');
  await expect(app.page.locator('body')).toHaveAttribute('data-native', 'yes');
  expect(app.destinations).toEqual([]);
  await app.page.getByRole('link', { name: 'Open with Faster Suite' }).press('Enter');
  await expect.poll(() => app.destinations).toEqual(['alphadrive://localhost/Remoting/custom_actions/documents/edit?subject_url=/api/v4/documents/202']);
});

test('the existing Launcher link honors primary preference and the explicit menu bypasses it', async ({ app }) => {
  await app.settings({ clio_enhance_docs: true, clio_open_docs: true });
  await app.load(`<table>${legacyRow()}</table>`);
  await app.page.getByRole('link', { name: 'Clio Launcher', exact: true }).click();
  await expect.poll(() => app.destinations).toEqual(['alphadrive://localhost/Remoting/custom_actions/documents/edit?subject_url=/api/v4/documents/101']);
  await expect(app.page.locator('body')).not.toHaveAttribute('data-launches');
  await app.page.getByRole('button', { name: 'Faster Suite actions' }).click();
  await app.page.getByRole('menuitem', { name: 'Open with Clio Launcher', exact: true }).click();
  await expect(app.page.locator('body')).toHaveAttribute('data-launches', '1');
  expect(app.destinations).toHaveLength(1);
});

for (const [label, route] of [
  ['Open with Faster Suite', 'edit'], ['Locate', 'locate'],
  ['Copy Link', 'share/link'], ['Compare / History', 'compare'],
]) {
  test(`${label} uses the selected document and the current recycled row ID`, async ({ app }) => {
    await app.load(`<div role="grid">${capturedRow}${capturedRow.replaceAll('101', '202')}</div>`);
    await app.page.locator('[row-id="202"] .fasterlaw-icon').click();
    await app.page.getByRole('menuitem', { name: label, exact: true }).click();
    await expect.poll(() => app.destinations).toEqual([`alphadrive://localhost/Remoting/custom_actions/documents/${route}?subject_url=/api/v4/documents/202`]);
    await app.page.locator('[row-id="101"] .fasterlaw-icon').click();
    await app.page.locator('[row-id="101"]').evaluate(row => {
      row.setAttribute('row-id', '404');
      row.querySelector('form')!.setAttribute('action', '/document_management/files/404/star');
      row.querySelector('[data-testid$="-open"]')!.setAttribute('x-on:click.stop', 'openFileById(404)');
    });
    await expect(app.page.getByRole('menu')).toHaveCount(0);
    await app.page.locator('[row-id="404"] .fasterlaw-icon').click();
    await app.page.getByRole('menuitem', { name: label, exact: true }).click();
    await expect.poll(() => app.destinations).toEqual([
      `alphadrive://localhost/Remoting/custom_actions/documents/${route}?subject_url=/api/v4/documents/202`,
      `alphadrive://localhost/Remoting/custom_actions/documents/${route}?subject_url=/api/v4/documents/404`,
    ]);
  });
}

test('late rows follow current settings and repeated updates never duplicate controls', async ({ app }) => {
  await app.load('<table><tbody></tbody></table>');
  await app.settings({ clio_enhance_docs: false, clio_open_docs: false });
  await app.page.locator('tbody').evaluate((node, html) => node.innerHTML = html, legacyRow());
  await expect(app.page.locator('.fasterlaw-icon')).toHaveCount(1);
  await expect(app.page.locator('.fasterlaw-icon')).toBeHidden();
  await app.settings({ clio_enhance_docs: true, clio_open_docs: true });
  for (let i = 0; i < 3; i++) await app.page.locator('tr').evaluate(node => node.append(document.createElement('td')));
  await expect(app.page.locator('.fasterlaw-icon')).toHaveCount(1);
  await app.page.getByRole('link', { name: 'Document 101', exact: true }).click();
  await expect.poll(() => app.destinations).toHaveLength(1);
});

test('search and external links preserve keyboard opening while invalid links remain native', async ({ app }) => {
  await app.settings({ clio_enhance_docs: true, clio_open_docs: true });
  await app.load(`<a href="/iris/documents/303/details">Search result</a>
    <a href="/iris/external_documents/404">External document</a>
    <a href="/iris/documents/not-an-id/download" onclick="event.preventDefault();document.body.dataset.invalid='native'">Unknown document</a>
    <a href="https://example.com/documents/505/download" onclick="event.preventDefault();document.body.dataset.foreign='native'">Foreign link</a>`);
  await app.page.getByRole('link', { name: 'Search result' }).press('Enter');
  await app.page.getByRole('link', { name: 'External document' }).press('Enter');
  await app.page.getByRole('link', { name: 'Unknown document' }).click();
  await app.page.getByRole('link', { name: 'Foreign link' }).click();
  await expect(app.page.locator('body')).toHaveAttribute('data-invalid', 'native');
  await expect(app.page.locator('body')).toHaveAttribute('data-foreign', 'native');
  expect(app.destinations).toEqual([
    'alphadrive://localhost/Remoting/custom_actions/documents/edit?subject_url=/api/v4/documents/303',
    'alphadrive://localhost/Remoting/custom_actions/documents/edit?subject_url=/api/v4/documents/404',
  ]);
  await expect(app.page.locator('.fasterlaw-icon, .fasterlaw-actions-container')).toHaveCount(0);
});

test('document detail navigation stays native while actual document links honor the opening preference', async ({ app }) => {
  await app.settings({ clio_enhance_docs: true, clio_open_docs: true });
  await app.load(`<a class="clio-ui-link" href="#versions">Versions</a>
    <a class="clio-ui-link" href="?tab=activity" onclick="event.preventDefault();document.body.dataset.activity='native'">Activity</a>
    <a class="clio-ui-link" href="/iris/documents/303/details">Related document</a>`,
  'https://app.clio.com', '/iris/documents/202/details');
  await app.page.getByRole('link', { name: 'Versions', exact: true }).click();
  await expect(app.page).toHaveURL('https://app.clio.com/iris/documents/202/details#versions');
  await app.page.getByRole('link', { name: 'Activity', exact: true }).click();
  await expect(app.page.locator('body')).toHaveAttribute('data-activity', 'native');
  expect(app.destinations).toEqual([]);
  await app.page.getByRole('link', { name: 'Related document', exact: true }).press('Enter');
  await expect.poll(() => app.destinations).toEqual(['alphadrive://localhost/Remoting/custom_actions/documents/edit?subject_url=/api/v4/documents/303']);
});

test('modified and cancelled primary clicks preserve native behavior', async ({ app }) => {
  await app.settings({ clio_enhance_docs: true, clio_open_docs: true });
  await app.load(`<table>${legacyRow()}</table>`);
  await app.page.getByRole('link', { name: 'Document 101', exact: true }).evaluate(node => {
    node.addEventListener('click', event => event.preventDefault());
    node.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, ctrlKey: true }));
    node.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, metaKey: true }));
    node.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, shiftKey: true }));
    const cancelled = new MouseEvent('click', { bubbles: true, cancelable: true });
    cancelled.preventDefault(); node.dispatchEvent(cancelled);
  });
  expect(app.destinations).toEqual([]);
});

test('menu keyboard navigation, Tab, scrolling and resize close without leftover controls', async ({ app }) => {
  await app.load(`<table>${legacyRow()}</table><button>Next</button>`);
  const button = app.page.getByRole('button', { name: 'Faster Suite actions' });
  await button.press('Space');
  await app.page.keyboard.press('End');
  await expect(app.page.getByRole('menuitem').last()).toBeFocused();
  await app.page.keyboard.press('Home');
  await expect(app.page.getByRole('menuitem').first()).toBeFocused();
  await app.page.keyboard.press('Tab');
  await expect(app.page.getByRole('button', { name: 'Next', exact: true })).toBeFocused();
  await expect(app.page.getByRole('menu')).toHaveCount(0);
  await button.click();
  await app.page.mouse.wheel(0, 50);
  await expect(app.page.getByRole('menu')).toHaveCount(0);
  await button.click();
  await app.page.setViewportSize({ width: 800, height: 600 });
  await expect(app.page.getByRole('menu')).toHaveCount(0);
});

test('navigation out of active Documents removes controls from reused rows', async ({ app }) => {
  await app.load(`<div role="grid">${capturedRow}</div><aside></aside>`);
  await expect(app.page.locator('.fasterlaw-icon')).toBeVisible();
  await app.page.evaluate(() => {
    history.pushState({}, '', '/document_management/trash');
    document.querySelector('aside')!.textContent = 'Trash';
  });
  await expect(app.page.locator('.fasterlaw-icon')).toHaveCount(0);
});

test('the new shortcut fits Clio’s 120px padded Actions cell', async ({ app }) => {
  await app.load(`<div role="grid">${capturedRow}</div>`);
  const button = app.page.locator('.fasterlaw-icon');
  await expect(button).toBeVisible();
  const icon = await button.boundingBox();
  const cell = await app.page.locator('[col-id="actions"]').boundingBox();
  expect(icon!.x).toBeGreaterThanOrEqual(cell!.x);
  expect(icon!.x + icon!.width).toBeLessThanOrEqual(cell!.x + cell!.width);
});

test('opening the shortcut does not activate Clio’s row preview', async ({ app }) => {
  await app.load(`<div role="grid">${capturedRow}</div>`);
  await app.page.locator('[role="row"]').evaluate(row => row.addEventListener('click', () => {
    document.body.dataset.preview = 'opened';
  }));
  await app.page.locator('.fasterlaw-icon').click();
  await expect(app.page.locator('body')).not.toHaveAttribute('data-preview');
  await expect(app.page.getByRole('menu')).toBeVisible();
});

test('an overflowing menu can be scrolled to its last action', async ({ app }) => {
  await app.page.setViewportSize({ width: 360, height: 180 });
  await app.load(`<table>${legacyRow()}</table>`);
  await app.page.locator('.fasterlaw-icon').click();
  const menu = app.page.getByRole('menu');
  await menu.hover();
  await app.page.mouse.wheel(0, 120);
  await expect(menu).toBeVisible();
  await expect.poll(() => menu.evaluate(node => node.scrollTop)).toBeGreaterThan(0);
  await menu.getByRole('menuitem', { name: 'Compare / History', exact: true }).click();
  await expect.poll(() => app.destinations).toEqual(['alphadrive://localhost/Remoting/custom_actions/documents/compare?subject_url=/api/v4/documents/101']);
});

for (const view of ['recents', 'starred', 'private_documents', 'firm_documents', 'contact_documents', 'matter_documents']) {
  test(`the captured file layout is supported at ${view}`, async ({ app }) => {
    await app.load(`<div role="grid">${capturedRow}</div>`, 'https://app.clio.com', `/document_management/${view}`);
    await expect(app.page.locator('.fasterlaw-icon')).toBeVisible();
  });
}

test('a detail shortcut follows its native link when Clio moves it to another container', async ({ app }) => {
  await app.load(`<div id="old"><a class="clio-ui-link" href="#native" x-on:click="$documentsRedirect.handleLauncherClick('true', 'us', '202')">Native details</a></div><div id="new"></div>`);
  await expect(app.page.locator('#old .fasterlaw-details-open-link')).toBeVisible();
  await app.page.evaluate(() => document.querySelector('#new')!.append(document.querySelector('a.clio-ui-link')!));
  await expect(app.page.locator('#old .fasterlaw-details-open-link')).toHaveCount(0);
  await expect(app.page.locator('#new .fasterlaw-details-open-link')).toBeVisible();
});
