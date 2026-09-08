import { test as base, chromium, expect } from '@playwright/test';
import type { BrowserContext, Page, Worker } from '@playwright/test';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

type Settings = { clio_enhance_docs: boolean; clio_open_docs: boolean };
type App = {
  page: Page;
  destinations: string[];
  worker: Worker;
  settings: (settings: Settings) => Promise<void>;
  load: (body: string, origin?: string, pathname?: string) => Promise<void>;
};

export const test = base.extend<{ app: App }, { extension: BrowserContext }>({
  extension: [async ({ browserName }, provideExtension) => {
    expect(browserName).toBe('chromium');
    const profile = await mkdtemp(path.join(tmpdir(), 'browser-link-test-'));
    const extensionPath = path.resolve('dist');
    const context = await chromium.launchPersistentContext(profile, {
      channel: 'chromium',
      headless: true,
      args: [
        `--disable-extensions-except=${extensionPath}`,
        `--load-extension=${extensionPath}`,
      ],
    });
    try {
      // Fixtures never contact Clio or third-party services.
      await context.route(/^https?:/, (route) => route.fulfill({ status: 200, body: '' }));
      await provideExtension(context);
    } finally {
      await context.close();
      await rm(profile, { recursive: true, force: true });
    }
  }, { scope: 'worker' }],

  app: async ({ extension }, provideApp, testInfo) => {
    const worker = extension.serviceWorkers()[0] ?? await extension.waitForEvent('serviceworker');
    await expect.poll(() => worker.evaluate(async () =>
      (await chrome.storage.local.get('clio_enhance_docs')).clio_enhance_docs
    )).not.toBeUndefined();
    const settings = async (value: Settings) => {
      await worker.evaluate((value) => chrome.storage.local.set(value), value);
    };
    await settings({ clio_enhance_docs: true, clio_open_docs: false });
    const page = await extension.newPage();
    const errors: string[] = [];
    const destinations: string[] = [];
    const cdp = await extension.newCDPSession(page);
    await cdp.send('Page.enable');
    cdp.on('Page.frameRequestedNavigation', event => { if (event.url.startsWith('alphadrive:')) destinations.push(event.url); });
    page.on('pageerror', (error) => errors.push(error.message));
    const load = async (body: string, origin = 'https://app.clio.com', pathname = '/document_management/recents') => {
      await page.unrouteAll();
      await page.route(`${origin}/**`, (route) => route.fulfill({
        contentType: 'text/html',
        body: `<!doctype html><html><head><style>
          body { margin: 24px; font: 14px Arial, sans-serif; color: #001c37; }
          table { border-collapse: collapse; width: 100%; }
          td { padding: 8px; border-bottom: 1px solid #ccd9e0; }
          button { font: inherit; }
          .ag-row { display: flex; position: relative; transform: none !important; }
          .ag-cell { display: flex; align-items: center; position: relative; left: auto !important; }
          [col-id="actions"] { box-sizing: border-box; padding-inline: 16px; }
          .inline-flex, .flex { display: flex; }
          .clio-ui-button { padding: 4px 10px; background: white; border: 1px solid #b0bec5; }
          .th-button { padding: 6px 12px; border: 1px solid #b0bec5; border-radius: 4px; background: white; }
        </style></head><body>${body}</body></html>`,
      }));
      const loaded = page.waitForEvent('console', {
        predicate: (message) => message.text() === 'Clio content script loaded',
      });
      await page.goto(`${origin}${pathname}`);
      await loaded;
    };
    try {
      await provideApp({ page, worker, settings, load, destinations });
      expect(errors, 'uncaught errors on the fixture page').toEqual([]);
    } finally {
      if (testInfo.status !== testInfo.expectedStatus) {
        await testInfo.attach('page', { body: await page.screenshot(), contentType: 'image/png' });
        await testInfo.attach('markup', { body: await page.content(), contentType: 'text/html' });
      }
      for (const tab of extension.pages()) await tab.close();
    }
  },
});

export { expect } from '@playwright/test';

// Source-derived legacy contract fixture, not a capture of Clio's new UI.
export function legacyRow(id = '101', launcher = true): string {
  return `<tr><td><a href="/iris/documents/${id}/download" ng-click="handleDocumentClick()">Document ${id}</a>
    ${launcher ? '<a href="#launcher" ng-click="handleLauncherClick()" onclick="event.preventDefault(); document.body.dataset.launches = String(Number(document.body.dataset.launches || 0) + 1)">Clio Launcher</a>' : ''}
    </td><td><div><cc-document-actions><button class="th-button" type="button">Open</button></cc-document-actions></div></td></tr>`;
}
