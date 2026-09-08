import type { Action } from '@/types/clio';
import { bindDocumentActionsDismissal } from './document-actions-listeners';
import { EnhancedDocumentLink } from './enhanced-document-link';
import { documentCandidateSelector, documentActionHost, readDocumentLink } from './clio-document-elements';

type ManagedLink = { link: EnhancedDocumentLink; id: string; parent: HTMLElement | null; host: HTMLElement | null; type: string };

export class DocumentLinkManager {
  private path = location.pathname + location.hash;
  private enhancedLinks = new Map<HTMLElement, ManagedLink>();
  private settings = { clio_enhance_docs: false, clio_open_docs: false };

  constructor() {
    const changed = new Set<string>();
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area !== 'local') return;
      for (const key of ['clio_enhance_docs', 'clio_open_docs'] as const) {
        if (changes[key]) {
          changed.add(key);
          this.settings[key] = changes[key].newValue === true;
        }
      }
      this.enhancedLinks.forEach(({ link }) => link.setEnhance(this.settings.clio_enhance_docs));
    });
    chrome.storage.local.get(['clio_enhance_docs', 'clio_open_docs'], values => {
      if (chrome.runtime.lastError) return;
      for (const key of ['clio_enhance_docs', 'clio_open_docs'] as const) {
        if (!changed.has(key)) this.settings[key] = values[key] === true;
      }
      this.enhancedLinks.forEach(({ link }) => link.setEnhance(this.settings.clio_enhance_docs));
    });
  }


  public enhanceDocumentLinks(roots: ParentNode[] = [document]): void {
    const path = location.pathname + location.hash;
    if (this.path !== path) {
      roots = [document];
      this.path = path;
    }
    const candidates = new Set<HTMLElement>();
    for (const root of roots) {
      if (root instanceof HTMLElement && root.matches(documentCandidateSelector)) candidates.add(root);
      root.querySelectorAll<HTMLElement>(documentCandidateSelector).forEach(node => candidates.add(node));
    }
    const desired = new Map(Array.from(candidates).flatMap(node => {
      const descriptor = readDocumentLink(node);
      return descriptor ? [[node, descriptor] as const] : [];
    }));
    for (const [node, entry] of this.enhancedLinks) {
      const affected = roots.some(root => root === node || (root as Node).contains(node));
      const current = desired.get(node);
      if (!node.isConnected || (entry.host && !entry.host.isConnected) ||
          (affected && (!current || node.parentElement !== entry.parent || current.docID !== entry.id || current.linkType !== entry.type ||
            documentActionHost(node) !== entry.host))) {
        entry.link.destroy();
        this.enhancedLinks.delete(node);
      }
    }
    const hosts = new Set(Array.from(this.enhancedLinks.values(), entry => entry.host));
    for (const [node, descriptor] of desired) {
      const existing = this.enhancedLinks.get(node);
      if (existing) { existing.link.refreshNativeLauncher(); continue; }
      const host = documentActionHost(node);
      if (host && hosts.has(host)) continue;
      const link = new EnhancedDocumentLink(descriptor, () => this.settings.clio_open_docs,
        () => readDocumentLink(node)?.docID ?? '');
      this.addActionsToEnhancedLink(link);
      link.setEnhance(this.settings.clio_enhance_docs);
      this.enhancedLinks.set(node, { link, id: descriptor.docID, parent: node.parentElement, host, type: descriptor.linkType });
      if (host) hosts.add(host);
    }
    bindDocumentActionsDismissal(document, window, EnhancedDocumentLink.closeActive);
  }

  private addActionsToEnhancedLink(enhancedLink: EnhancedDocumentLink): void {
    const actions: Action[] = [
      {
        name: 'Open with faster Suite',
        title: 'Open this document with Faster Suite',
        iconClass: 'faster-suite',
        iconUrl: 'assets/images/icon-0016.png',
        text: 'Open with Faster Suite',
        onClick: () => {
          window.location.href = `alphadrive://localhost/Remoting/custom_actions/documents/edit?subject_url=/api/v4/documents/${enhancedLink.docID}`;
        },
      },
      {
        name: 'Open with Clio Launcher',
        title: 'Open this document with Clio Launcher',
        iconClass: 'clio',
        iconUrl: 'assets/images/external-link-square-solid.svg',
        text: 'Open with Clio Launcher',
        onClick: () => {
          enhancedLink.bypassClick();
        },
      },
      {
        name: 'Download',
        title: 'Download this document',
        iconClass: 'download',
        iconUrl: 'assets/images/download-solid.svg',
        text: 'Download',
        onClick: () => {
          window.open(
            `${window.location.origin}/iris/documents/${enhancedLink.docID}/download`
          );
        },
      },
      {
        name: 'Locate',
        title: `Open this document's folder using Faster Suite`,
        iconClass: 'locate',
        iconUrl: 'assets/images/folder-open-solid.svg',
        text: 'Locate',
        onClick: () => {
          window.location.href = `alphadrive://localhost/Remoting/custom_actions/documents/locate?subject_url=/api/v4/documents/${enhancedLink.docID}`;
        },
      },
      {
        name: 'Copy Link',
        title: 'Copy a link to this document using Faster Suite',
        iconClass: 'link',
        iconUrl: 'assets/images/link-solid.svg',
        text: 'Copy Link',
        onClick: () => {
          window.location.href = `alphadrive://localhost/Remoting/custom_actions/documents/share/link?subject_url=/api/v4/documents/${enhancedLink.docID}`;
        },
      },
      {
        name: 'Compare / History',
        title: 'Compare this document using Faster Suite',
        iconClass: 'compare',
        iconUrl: 'assets/images/adjust-solid.svg',
        text: 'Compare / History',
        onClick: () => {
          window.location.href = `alphadrive://localhost/Remoting/custom_actions/documents/compare?subject_url=/api/v4/documents/${enhancedLink.docID}`;
        },
      },
    ];
    enhancedLink.addActions(actions);
  }

}
