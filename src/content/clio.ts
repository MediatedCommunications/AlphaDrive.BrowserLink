import {
  NEW_UI_SELECTOR_DETAILS,
  NEW_UI_SELECTOR_DOWNLOADS,
  OLD_UI_SELECTOR,
} from '@/constants';
import { DocumentLinkManager } from '@/lib/document-link-manager';
import { getSetting } from '@/lib/settings';
import { ToastManager } from '@/lib/toast-manager';
import { checkAnySelector } from '@/lib/utils';
import { UiVersion } from '@/types/clio';
import './clio.css';

const documentLinkManager = new DocumentLinkManager();
const toastManager = new ToastManager();
const observerConfig = { attributes: false, childList: true, subtree: true };
const observer = new MutationObserver(observerCallback);

// Observing for changes in the DOM
observer.observe(document.body, observerConfig);

async function observerCallback(
  _mutationsList: MutationRecord[],
  observer: MutationObserver
) {
  const enhanceSetting = await getSetting('clio_enhance_docs');
  const targetUIDetected = checkAnySelector([
    OLD_UI_SELECTOR,
    NEW_UI_SELECTOR_DOWNLOADS,
    NEW_UI_SELECTOR_DETAILS,
  ]);

  const shouldEnhance = enhanceSetting && targetUIDetected;

  if (shouldEnhance) {
    const uiVersion = checkAnySelector([
      NEW_UI_SELECTOR_DOWNLOADS,
      NEW_UI_SELECTOR_DETAILS,
    ])
      ? UiVersion.New
      : UiVersion.Old;
    documentLinkManager.enhanceDocumentLinks(uiVersion);
  }

  // Continue observing for future changes
  observer.observe(document.body, observerConfig);
}

window.addEventListener('message', (message) => {
  if (window.self === window.top) {
    const detail = message.data;
    if (detail.cmd === 'showToast') {
      toastManager.showToast(' ');
    }
  } else {
    sendMessageToTop(message.data);
  }
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function sendMessageToTop(detail: any): void {
  window.parent.postMessage(detail, '*');
}
