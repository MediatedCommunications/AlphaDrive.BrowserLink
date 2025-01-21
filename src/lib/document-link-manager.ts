import '@/assets/images/adjust-solid.svg';
import '@/assets/images/download-solid.svg';
import '@/assets/images/external-link-square-solid.svg';
import '@/assets/images/folder-open-solid.svg';
import '@/assets/images/icon-0016.png';
import '@/assets/images/link-solid.svg';
import {
  NEW_UI_SELECTOR_DETAILS,
  NEW_UI_SELECTOR_DOWNLOADS,
  OLD_UI_SELECTOR,
} from '@/constants';
import { Action, DocumentLink, UiVersion } from '@/types/clio';
import { EnhancedDocumentLink } from './enhanced-document-link';

export class DocumentLinkManager {
  private enhancedNodes: HTMLElement[] = [];

  public enhanceDocumentLinks(uiVersion: UiVersion): void {
    const documentLinks = this.getDocumentLinks(uiVersion);

    documentLinks.forEach((documentLink) => {
      if (!this.enhancedNodes.includes(documentLink.node)) {
        const enhancedLink = new EnhancedDocumentLink(documentLink, uiVersion);
        this.addActionsToEnhancedLink(enhancedLink, documentLink.node);
        this.enhancedNodes.push(documentLink.node);
      }
    });

    this.clickOutsideEventBinding();
  }

  private getDocumentLinks(uiVersion: UiVersion): DocumentLink[] {
    let nodes: NodeListOf<HTMLElement>;

    if (uiVersion === UiVersion.New) {
      nodes = document.querySelectorAll(
        `${NEW_UI_SELECTOR_DOWNLOADS}, ${NEW_UI_SELECTOR_DETAILS}`
      );

      return this.extractDocumentLinks(nodes, uiVersion);
    } else if (uiVersion === UiVersion.Old) {
      nodes = document.querySelectorAll(OLD_UI_SELECTOR);

      return this.extractDocumentLinks(nodes, uiVersion);
    }

    return [];
  }

  private extractDocumentLinks(
    nodes: NodeListOf<HTMLElement>,
    uiVersion: UiVersion
  ): DocumentLink[] {
    const documentLinks: DocumentLink[] = [];

    nodes.forEach((node) => {
      let docID: string = '';

      if (uiVersion === UiVersion.SearchResult) {
        const docIdRegEx = /{\s?id:\s?(\d+)\s?}/gm;
        const docIdAttr = node.getAttribute('ui-sref') || '';
        const docIdMatch = docIdRegEx.exec(docIdAttr);
        docID = docIdMatch ? docIdMatch[1] : '';
      } else {
        docID = node.closest('span')?.getAttribute('id') || '';
      }
      documentLinks.push({ node, docID });
    });

    return documentLinks;
  }

  private clickOutsideEventBinding(): void {
    document.addEventListener('click', (event) => {
      if (
        !(event.target as HTMLElement).closest(
          '.fasterlaw-actions-container, .fasterlaw-icon'
        )
      ) {
        document
          .querySelectorAll('.fasterlaw-actions-container')
          .forEach((container) => container?.classList.remove('open'));
      }
    });

    window.addEventListener('wheel', () => {
      document
        .querySelectorAll('.fasterlaw-actions-container')
        .forEach((container) => container?.classList.remove('open'));
    });
  }

  private addActionsToEnhancedLink(
    enhancedLink: EnhancedDocumentLink,
    node: HTMLElement
  ): void {
    const actions: Action[] = [
      {
        name: 'Open with faster Suite',
        title: 'Open this document with Faster Suite',
        iconClass: 'faster-suite',
        iconUrl: 'src/assets/images/icon-0016.png',
        text: 'Open with Faster Suite',
        onClick: () => {
          window.location.href = `alphadrive://localhost/Remoting/custom_actions/documents/edit?subject_url=/api/v4/documents/${enhancedLink.docID}`;
        },
      },
      {
        name: 'Open with Clio Launcher',
        title: 'Open this document with Clio Launcher',
        iconClass: 'clio',
        iconUrl: 'src/assets/images/external-link-square-solid.svg',
        text: 'Open with Clio Launcher',
        onClick: () => {
          const link = node
            .closest('td')
            ?.querySelector('a[ng-click*="Launcher" i]') as HTMLAnchorElement;

          link?.click();
        },
      },
      {
        name: 'Download',
        title: 'Download this document',
        iconClass: 'download',
        iconUrl: 'src/assets/images/download-solid.svg',
        text: 'Download',
        onClick: () => {
          window.open(
            `https://app.clio.com/iris/documents/${enhancedLink.docID}/download`
          );
        },
      },
      {
        name: 'Locate',
        title: `Open this document's folder using Faster Suite`,
        iconClass: 'locate',
        iconUrl: 'src/assets/images/folder-open-solid.svg',
        text: 'Locate',
        onClick: () => {
          window.location.href = `alphadrive://localhost/Remoting/custom_actions/documents/locate?subject_url=/api/v4/documents/${enhancedLink.docID}`;
        },
      },
      {
        name: 'Copy Link',
        title: 'Copy a link to this document using Faster Suite',
        iconClass: 'link',
        iconUrl: 'src/assets/images/link-solid.svg',
        text: 'Copy Link',
        onClick: () => {
          window.location.href = `alphadrive://localhost/Remoting/custom_actions/documents/share/link?subject_url=/api/v4/documents/${enhancedLink.docID}`;
        },
      },
      {
        name: 'Compare / History',
        title: 'Compare this document using Faster Suite',
        iconClass: 'compare',
        iconUrl: 'src/assets/images/adjust-solid.svg',
        text: 'Compare / History',
        onClick: () => {
          window.location.href = `alphadrive://localhost/Remoting/custom_actions/documents/compare?subject_url=/api/v4/documents/${enhancedLink.docID}`;
        },
      },
    ];
    enhancedLink.addActions(actions);
  }
}
