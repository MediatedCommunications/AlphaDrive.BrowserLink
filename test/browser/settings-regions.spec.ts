import type { Page } from '@playwright/test';
import { test, expect, legacyRow } from './fixture';

const extensionSettings = {
  clio_enhance_docs: true,
  clio_open_docs: true,
  pacer_auto_save_and_archive: false,
  pacer_notify_when_archived: true,
};

const documentEnhancements = 'Enhance my Clio Documents Experience';
const clioOpening = 'Open Documents with Faster Suite';
const autoArchive = 'Automatically Save and Archive PACER Documents';
const archiveNotifications = 'Notify me when files are archived';

async function openPopup(page: Page, extensionId: string): Promise<Page> {
  const popup = await page.context().newPage();
  await popup.goto(`chrome-extension://${extensionId}/index.html`);
  await expect(popup.getByRole('heading', { name: 'Clio Options' })).toBeVisible();
  return popup;
}

function settingSwitch(popup: Page, description: string) {
  return popup.getByText(description, { exact: true }).locator('..').getByRole('switch');
}

test('popup persists document enhancements while Clio opening remains independent', async ({ app }) => {
  await app.worker.evaluate((settings) => chrome.storage.local.set(settings), extensionSettings);
  await app.load(`<table>${legacyRow()}</table>`);
  const shortcut = app.page.getByRole('button', { name: 'Faster Suite actions' });
  await expect(shortcut).toBeVisible();

  const extensionId = new URL(app.worker.url()).hostname;
  const popup = await openPopup(app.page, extensionId);
  await expect(settingSwitch(popup, documentEnhancements)).toHaveAttribute('aria-checked', 'true');
  await expect(settingSwitch(popup, clioOpening)).toHaveAttribute('aria-checked', 'true');
  await expect(settingSwitch(popup, autoArchive)).toHaveAttribute('aria-checked', 'false');
  await expect(settingSwitch(popup, archiveNotifications)).toHaveAttribute('aria-checked', 'true');

  await settingSwitch(popup, documentEnhancements).click();
  await expect.poll(() => app.worker.evaluate(() => chrome.storage.local.get([
    'clio_enhance_docs', 'clio_open_docs', 'pacer_auto_save_and_archive', 'pacer_notify_when_archived',
  ]))).toEqual({
    clio_enhance_docs: false,
    clio_open_docs: true,
    pacer_auto_save_and_archive: false,
    pacer_notify_when_archived: true,
  });
  await expect(shortcut).toBeHidden();
  await popup.close();

  const reopened = await openPopup(app.page, extensionId);
  await expect(settingSwitch(reopened, documentEnhancements)).toHaveAttribute('aria-checked', 'false');
  await expect(settingSwitch(reopened, clioOpening)).toHaveAttribute('aria-checked', 'true');
  await reopened.close();

  await app.page.getByRole('link', { name: 'Document 101', exact: true }).click();
  await expect.poll(() => app.destinations).toEqual([
    'alphadrive://localhost/Remoting/custom_actions/documents/edit?subject_url=/api/v4/documents/101',
  ]);
});

test('popup persists both PACER settings without contacting a PACER page', async ({ app }) => {
  await app.worker.evaluate((settings) => chrome.storage.local.set(settings), {
    ...extensionSettings,
    pacer_auto_save_and_archive: true,
    pacer_notify_when_archived: false,
  });
  const extensionId = new URL(app.worker.url()).hostname;
  const popup = await openPopup(app.page, extensionId);
  await expect(settingSwitch(popup, autoArchive)).toHaveAttribute('aria-checked', 'true');
  await expect(settingSwitch(popup, archiveNotifications)).toHaveAttribute('aria-checked', 'false');

  await settingSwitch(popup, autoArchive).click();
  await settingSwitch(popup, archiveNotifications).click();
  await expect.poll(() => app.worker.evaluate(() => chrome.storage.local.get([
    'pacer_auto_save_and_archive', 'pacer_notify_when_archived',
  ]))).toEqual({
    pacer_auto_save_and_archive: false,
    pacer_notify_when_archived: true,
  });
  await popup.close();

  const reopened = await openPopup(app.page, extensionId);
  await expect(settingSwitch(reopened, autoArchive)).toHaveAttribute('aria-checked', 'false');
  await expect(settingSwitch(reopened, archiveNotifications)).toHaveAttribute('aria-checked', 'true');
  await reopened.close();
});

for (const origin of [
  'https://app.clio.com',
  'https://au.app.clio.com',
  'https://eu.app.clio.com',
  'https://app.goclio.eu',
]) {
  test(`Download keeps the document origin on ${origin}`, async ({ app }) => {
    await app.settings({ clio_enhance_docs: true, clio_open_docs: false });
    await app.load(`<table>${legacyRow()}</table>`, origin);
    await app.page.getByRole('button', { name: 'Faster Suite actions' }).click();
    const popup = app.page.waitForEvent('popup');
    await app.page.getByRole('menuitem', { name: 'Download', exact: true }).click();
    const downloaded = await popup;
    await expect(downloaded).toHaveURL(`${origin}/iris/documents/101/download`);
    await downloaded.close();
  });
}
