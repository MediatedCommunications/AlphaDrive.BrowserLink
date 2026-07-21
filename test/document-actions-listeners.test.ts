import assert from 'node:assert/strict';
import test from 'node:test';
import { bindDocumentActionsDismissal } from '../src/lib/document-actions-listeners.ts';

test('binds document-action dismissal listeners only once per document', () => {
  const registrations = { click: 0, wheel: 0 };
  const targetDocument = {
    addEventListener(type: string) {
      if (type === 'click') registrations.click += 1;
    },
    querySelectorAll() {
      return [];
    },
  } as unknown as Document;
  const targetWindow = {
    addEventListener(type: string) {
      if (type === 'wheel') registrations.wheel += 1;
    },
  } as unknown as Window;

  bindDocumentActionsDismissal(targetDocument, targetWindow);
  bindDocumentActionsDismissal(targetDocument, targetWindow);
  bindDocumentActionsDismissal(targetDocument, targetWindow);

  assert.deepEqual(registrations, { click: 1, wheel: 1 });
});

test('binds listeners for a newly loaded document', () => {
  let clickRegistrations = 0;
  const firstDocument = {
    addEventListener(type: string) {
      if (type === 'click') clickRegistrations += 1;
    },
    querySelectorAll() {
      return [];
    },
  } as unknown as Document;
  const secondDocument = {
    addEventListener(type: string) {
      if (type === 'click') clickRegistrations += 1;
    },
    querySelectorAll() {
      return [];
    },
  } as unknown as Document;
  const targetWindow = {
    addEventListener() {},
  } as unknown as Window;

  bindDocumentActionsDismissal(firstDocument, targetWindow);
  bindDocumentActionsDismissal(secondDocument, targetWindow);

  assert.equal(clickRegistrations, 2);
});
