import { DocumentLinkManager } from '@/lib/document-link-manager';
import { ToastManager } from '@/lib/toast-manager';
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
  observer.disconnect();

  documentLinkManager.enhanceDocumentLinks();

  // Continue observing for future changes
  observer.observe(document.body, observerConfig);
}

// Sub to settings changes
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'local') {
    if (changes.clio_enhance_docs) {
      const newValue = changes.clio_enhance_docs.newValue;

      if (newValue) {
        documentLinkManager.enableEnhancedLinks();
      } else {
        documentLinkManager.disableEnhancedLinks();
      }
    }
  }
});

// Messaging
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
