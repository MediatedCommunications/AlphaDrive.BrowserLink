import assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';
import { ToastManager } from './toast-manager.ts';

class FakeElement {
  public readonly attributes = new Map<string, string>();
  public readonly style = { pointerEvents: '' };
  public textContent = '';

  public setAttribute(name: string, value: string): void {
    this.attributes.set(name, value);
  }
}

class FakeDocument {
  public readonly children: FakeElement[] = [];
  public readonly body = {
    appendChild: (element: FakeElement) => {
      this.children.push(element);
      return element;
    },
  };

  public createElement(): FakeElement {
    return new FakeElement();
  }

  public findById(id: string): FakeElement | null {
    return (
      this.children.find((element) => element.attributes.get('id') === id) ??
      null
    );
  }
}

let fakeDocument: FakeDocument;

describe('ToastManager', () => {
  beforeEach(() => {
    fakeDocument = new FakeDocument();
    Object.defineProperty(globalThis, 'document', {
      configurable: true,
      value: fakeDocument,
    });
  });

  it('does not add an empty overlay when initialized', () => {
    new ToastManager();

    assert.equal(fakeDocument.findById('momane_toast'), null);
  });

  it('ignores blank toast messages', () => {
    const manager = new ToastManager();

    manager.showToast(' ');

    assert.equal(fakeDocument.findById('momane_toast'), null);
  });

  it('makes a real toast non-interactive', () => {
    const manager = new ToastManager();

    manager.showToast('Document opened');

    const toast = fakeDocument.findById('momane_toast');
    assert.equal(toast?.textContent, 'Document opened');
    assert.equal(toast?.style.pointerEvents, 'none');
  });
});
