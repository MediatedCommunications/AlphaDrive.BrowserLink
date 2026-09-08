/**
 *  Clio Content Script
 *  This script enhances the Clio web application by adding functionality
 *  such as enhanced document links, toast notifications, and observing DOM changes.
 *  It listens for changes in the local storage settings and updates the UI accordingly.
 */
import { DocumentLinkManager } from '@/lib/document-link-manager';
import { ToastManager } from '@/lib/toast-manager';
import './clio.css';

const documentLinkManager = new DocumentLinkManager();
const toastManager = new ToastManager();
const observerConfig: MutationObserverInit = {
  childList: true, subtree: true, attributes: true,
  attributeFilter: ['href', 'ui-sref', 'x-on:click', 'x-on:click.stop', 'row-id', 'action', 'id'],
};
const observer = new MutationObserver((mutations) => {
  const roots = new Set<HTMLElement>();
  for (const mutation of mutations) {
    const target = mutation.target instanceof HTMLElement ? mutation.target : mutation.target.parentElement;
    if (!target || target.closest('.fasterlaw-actions-container, .fasterlaw-icon')) continue;
    const row = target.closest<HTMLElement>('tr, [role="row"][row-id]');
    if (row) roots.add(row);
    else if (mutation.type === 'attributes') roots.add(target);
    else for (const node of mutation.addedNodes) if (node instanceof HTMLElement) roots.add(node);
  }
  const scopes = Array.from(roots).filter(root => root.isConnected &&
    !Array.from(roots).some(other => other !== root && other.contains(root)));
  observer.disconnect();
  try { documentLinkManager.enhanceDocumentLinks(scopes); }
  finally { observer.observe(document.body, observerConfig); }
});
// Discover once before observing our own DOM additions.
documentLinkManager.enhanceDocumentLinks();
observer.observe(document.body, observerConfig);
window.addEventListener('hashchange', () => documentLinkManager.enhanceDocumentLinks());

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

console.log('Clio content script loaded');
const mark = () => document.body.classList.add('auto-print');

// Check the inline onload attribute text
const hasAutoPrintAttr = () => {
  const attr = document.body.getAttribute('onload') || '';
  console.log('onload attribute:', attr);
  // matches: window.print(), print(), with optional spaces
  return /(?:^|[^\w$])(window\.)?print\s*\(/.test(attr);
};

if (hasAutoPrintAttr()) mark();

// If something sets/changes the onload attribute later, catch that too
new MutationObserver((muts) => {
  for (const m of muts) {
    if (
      m.type === 'attributes' &&
      m.attributeName === 'onload' &&
      hasAutoPrintAttr()
    ) {
      mark();
      break;
    }
  }
}).observe(document.body, { attributes: true, attributeFilter: ['onload'] });
