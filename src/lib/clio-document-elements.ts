import type { DocumentLink, LinkType } from '@/types/clio';

export const documentCandidateSelector = [
  'a[href*="/download"]', 'a[ng-click*="handleDocumentClick"]',
  'a[href*="/details"]', 'a[href*="/external_documents"]', 'a.clio-ui-link',
  '[role="row"][row-id] [col-id="actions"] button',
].join(',');

export function documentActionHost(node: HTMLElement): HTMLElement | null {
  return node.closest('[col-id="actions"]')?.querySelector<HTMLElement>('.inline-flex') ??
    node.closest('tr')?.querySelector('cc-document-actions')?.parentElement ?? null;
}

export function readDocumentLink(node: HTMLElement): DocumentLink | null {
  if (!node.isConnected || !node.matches(documentCandidateSelector) ||
      node.closest('[role="menu"], .fasterlaw-actions-container') || node.classList.contains('fasterlaw-icon')) return null;
  let docID = '';
  let linkType: LinkType = 'documents';
  const row = node.closest('[role="row"][row-id]');
  if (row) {
    // Both files and folders use openFileById. Require the independent file route.
    if (!/^\/document_management\/(?:recents|starred|private_documents|firm_documents|contact_documents|matter_documents|folders)(?:\/|$)/.test(location.pathname)) return null;
    const match = node.getAttribute('x-on:click.stop')?.match(/^openFileById\((\d+)\)$/);
    const rowId = row.getAttribute('row-id');
    const filePath = row.querySelector('form')?.getAttribute('action')?.split('?')[0];
    const isFile = filePath === `/document_management/files/${rowId}/star` ||
      filePath === `/document_management/files/${rowId}/unstar`;
    if (!match || match[1] !== rowId || !isFile) return null;
    docID = match[1];
    linkType = 'grid';
  } else {
    const detail = node.getAttribute('x-on:click')?.match(/\$documentsRedirect\.handleLauncherClick\(\s*'true',\s*'[^']*',\s*'(\d+)'/);
    if (detail) {
      docID = detail[1];
      linkType = 'details';
    } else {
      const href = node.getAttribute('href')?.trim();
      // In-page controls must not inherit a document ID from the current URL.
      if (href && !/^[?#]/.test(href)) {
        let url: URL;
        try { url = new URL(href, location.href); } catch { return null; }
        if (url.origin !== location.origin) return null;
        const match = url.pathname.match(/\/(documents|external_documents)\/(\d+)(?:\/|$)/);
        if (match) {
          docID = match[2];
          linkType = match[1] === 'external_documents' ? 'external'
            : url.pathname.endsWith('/details') && !node.hasAttribute('ng-click') ? 'search-results' : 'documents';
        }
      }
      if (!docID && node.getAttribute('ng-click')?.includes('handleDocumentClick')) {
        docID = node.getAttribute('ui-sref')?.match(/\{\s*id:\s*(\d+)\s*\}/)?.[1] ?? '';
        let parent = node.parentElement;
        for (let depth = 0; !docID && parent && depth < 3; depth++, parent = parent.parentElement) {
          if (parent.tagName === 'SPAN' && /^\d+$/.test(parent.id)) docID = parent.id;
        }
      }
    }
  }
  return /^\d+$/.test(docID) ? { node, docID, linkType } : null;
}
