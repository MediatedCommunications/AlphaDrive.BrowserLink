import '@/assets/images/adjust-solid.svg';
import '@/assets/images/download-solid.svg';
import '@/assets/images/external-link-square-solid.svg';
import '@/assets/images/folder-open-solid.svg';
import '@/assets/images/icon-0016.png';
import '@/assets/images/link-solid.svg';
import {
  CLIO_DETAILS_VIEW_DOC_ID_REGEX,
  CLIO_DOCUMENTS_DOC_ID_REGEX,
  CLIO_EXTERNAL_DOCUMENTS_DOC_ID_REGEX,
  CLIO_SEARCH_RESULTS_DOC_ID_REGEX,
} from '@/constants';
import { Action, DocumentLink, LinkType } from '@/types/clio';
import { EnhancedDocumentLink } from './enhanced-document-link';

export class DocumentLinkManager {
  private enhancedNodes: HTMLElement[] = [];

  public enhanceDocumentLinks(): void {
    const documentLinks = this.getDocumentLinks();

    documentLinks.forEach((documentLink) => {
      const enhancedLink = new EnhancedDocumentLink(documentLink);
      this.addActionsToEnhancedLink(enhancedLink, documentLink.node);
      this.enhancedNodes.push(documentLink.node);
    });

    this.clickOutsideEventBinding();
  }

  private getDocumentLinks(): DocumentLink[] {
    const enhancedNodesSet = new Set(this.enhancedNodes);

    const documentDocLinks = this.toDocumentLink(
      Array.from(
        document.querySelectorAll(
          'a[href*="/download"]'
        ) as NodeListOf<HTMLElement>
      ).filter((node) => !enhancedNodesSet.has(node)),
      'documents'
    );

    const searchDocLinks = this.toDocumentLink(
      Array.from(
        document.querySelectorAll(
          'a[href*="/details"]'
        ) as NodeListOf<HTMLElement>
      ).filter((node) => !enhancedNodesSet.has(node)),
      'search-results'
    );

    const externalDocLinks = this.toDocumentLink(
      Array.from(
        document.querySelectorAll(
          `a[href*="/external_documents"`
        ) as NodeListOf<HTMLElement>
      ).filter((node) => !enhancedNodesSet.has(node)),
      'external'
    );

    const detailsDocLinks = this.toDocumentLink(
      Array.from(document.querySelectorAll('a') as NodeListOf<HTMLElement>)
        .filter((link) => link.hasAttribute('x-on:click'))
        .filter((node) => !enhancedNodesSet.has(node)),
      'details'
    );

    return [
      ...documentDocLinks,
      ...searchDocLinks,
      ...externalDocLinks,
      ...detailsDocLinks,
    ];
  }

  private toDocumentLink(
    nodes: HTMLElement[],
    linkType: LinkType
  ): DocumentLink[] {
    return nodes.map((node) => ({
      node: node as HTMLElement,
      docID: this.extractDocumentId(node, linkType),
      linkType,
    }));
  }

  private extractDocumentId(node: HTMLElement, linkType: LinkType): string {
    switch (linkType) {
      case 'documents': {
        const href = node.getAttribute('href');
        const regex = CLIO_DOCUMENTS_DOC_ID_REGEX;
        const match = href?.match(regex);

        if (match) {
          return match[1];
        }

        return 'id not found';
      }

      case 'search-results': {
        const href = node.getAttribute('href');
        const regex = CLIO_SEARCH_RESULTS_DOC_ID_REGEX;
        const match = href?.match(regex);

        if (match) {
          return match[1];
        }

        return 'id not found';
      }

      case 'external': {
        const href = node.getAttribute('href');
        const regex = CLIO_EXTERNAL_DOCUMENTS_DOC_ID_REGEX;
        const match = href?.match(regex);

        if (match) {
          return match[1];
        }
        return 'id not found';
      }

      case 'details': {
        const clickHandler = node.getAttribute('x-on:click');
        const regex = CLIO_DETAILS_VIEW_DOC_ID_REGEX;
        const match = clickHandler?.match(regex);

        if (match) {
          return match[1];
        }

        return 'id not found';
      }

      default: {
        const docIdRegEx = /{\s?id:\s?(\d+)\s?}/gm;
        const docIdAttr = node.getAttribute('ui-sref') || '';
        const docIdMatch = docIdRegEx.exec(docIdAttr);

        if (docIdMatch) {
          return docIdMatch[1];
        } else {
          return node.closest('span')?.getAttribute('id') || '';
        }
      }
    }
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
