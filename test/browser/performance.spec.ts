import { test, expect, legacyRow } from './fixture';

for (const count of [100, 1000]) {
  test(`measures document work for ${count} rows`, async ({ app }, testInfo) => {
    const startup: number[] = [];
    for (let run = 0; run < 3; run++) {
      const started = performance.now();
      await app.load(`<aside id="unrelated"></aside><table>${Array.from({ length: count }, (_, i) => legacyRow(String(i + 1), false)).join('')}</table>`);
      await expect(app.page.locator('.fasterlaw-icon')).toHaveCount(count);
      startup.push(performance.now() - started);
    }
    const cdp = await app.page.context().newCDPSession(app.page);
    const contexts: { id: number; name: string; origin: string }[] = [];
    cdp.on('Runtime.executionContextCreated', ({ context }) => contexts.push(context));
    await cdp.send('Runtime.enable');
    const isolated = contexts.find(context => context.origin.startsWith('chrome-extension:'));
    expect(isolated, JSON.stringify(contexts)).toBeTruthy();
    await cdp.send('Runtime.evaluate', { contextId: isolated!.id, expression: `
      globalThis.queryWork = { scans: 0, subtreeScans: 0, candidates: 0 };
      const originalQuery = Document.prototype.querySelectorAll;
      Document.prototype.querySelectorAll = function(selector) {
        const result = originalQuery.call(this, selector);
        queryWork.scans++; queryWork.candidates += result.length; return result;
      };
      const originalSubtreeQuery = Element.prototype.querySelectorAll;
      Element.prototype.querySelectorAll = function(selector) {
        const result = originalSubtreeQuery.call(this, selector);
        queryWork.subtreeScans++; queryWork.candidates += result.length; return result;
      };` });
    for (let i = 0; i < 5; i++) {
      await app.page.locator('#unrelated').evaluate((node, i) => node.textContent = String(i), i);
      await app.page.evaluate(() => new Promise(requestAnimationFrame));
    }
    const unrelated = (await cdp.send('Runtime.evaluate', { contextId: isolated!.id, expression: 'queryWork', returnByValue: true })).result.value;
    expect(unrelated).toEqual({ scans: 0, subtreeScans: 0, candidates: 0 });
    const menus = await app.page.locator('.fasterlaw-actions-container').count();
    expect(menus).toBe(0);
    for (let i = 0; i < 5; i++) {
      await app.page.locator('tr a').first().evaluate((node, i) => node.setAttribute('href', `/iris/documents/${9001 + i}/download`), i);
      await app.page.evaluate(() => new Promise(requestAnimationFrame));
    }
    const relevant = (await cdp.send('Runtime.evaluate', { contextId: isolated!.id, expression: 'queryWork', returnByValue: true })).result.value;
    expect(relevant.scans).toBe(0);
    expect(relevant.candidates).toBe(5);
    const handle = (await cdp.send('Runtime.evaluate', { contextId: isolated!.id, expression: "document.querySelector('tr a')" })).result.objectId!;
    const listeners = await cdp.send('DOMDebugger.getEventListeners', { objectId: handle });
    expect(listeners.listeners.filter(listener => listener.type === 'click')).toHaveLength(1);
    const evidence = { rows: count, startupMedianMs: startup.sort((a,b) => a-b)[1], menus, unrelated, relevant, primaryClickListeners: 1 };
    await testInfo.attach('work-measurements', { body: JSON.stringify(evidence), contentType: 'application/json' });
    console.log(JSON.stringify(evidence));
    await app.page.locator('table').evaluate(node => node.remove());
    await expect(app.page.locator('.fasterlaw-icon, .fasterlaw-actions-container')).toHaveCount(0);
    const detachedListeners = await cdp.send('DOMDebugger.getEventListeners', { objectId: handle });
    expect(detachedListeners.listeners.filter(listener => listener.type === 'click')).toHaveLength(0);
  });
}
