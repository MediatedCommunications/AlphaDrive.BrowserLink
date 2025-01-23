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
  documentLinkManager.enhanceDocumentLinks();

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
