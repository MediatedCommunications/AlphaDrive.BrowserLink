import { Action, DocumentLink, LinkType } from '@/types/clio';
import { EnhancedDocumentLink } from './enhanced-document-link';

export class DocumentLinkManager {
  private enhancedNodes: HTMLElement[] = [];
  private enhancedLinks: EnhancedDocumentLink[] = [];

  public enhanceDocumentLinks(): void {
    const documentLinks = this.getDocumentLinks();

    documentLinks.forEach((documentLink) => {
      const enhancedLink = new EnhancedDocumentLink(documentLink);
      this.addActionsToEnhancedLink(enhancedLink, documentLink.node);
      this.enhancedNodes.push(documentLink.node);
      this.enhancedLinks.push(enhancedLink);
    });

    this.clickOutsideEventBinding();
  }

  public enableEnhancedLinks(): void {
    // console.log('Enhanced links toggled');

    this.enhancedLinks.forEach((link) => {
      link.setEnhance(true);
    });
  }

  public disableEnhancedLinks(): void {
    this.enhancedLinks.forEach((link) => {
      link.setEnhance(false);
    });
  }

  private getDocumentLinks(): DocumentLink[] {
    const enhancedNodesSet = new Set(this.enhancedNodes);

    const documentDocLinks = Array.from(
      document.querySelectorAll(
        'a[href*="/download"],a[ng-click*="handleDocumentClick"]'
      ) as NodeListOf<HTMLElement>
    )
      .filter((node) => !enhancedNodesSet.has(node))
      .map((node) => this.toDocumentLink(node, 'documents'));

    const searchDocLinks = Array.from(
      document.querySelectorAll(
        'a[href*="/details"]'
      ) as NodeListOf<HTMLElement>
    )
      .filter((node) => !enhancedNodesSet.has(node))
      .map((node) => this.toDocumentLink(node, 'search-results'));

    const externalDocLinks = Array.from(
      document.querySelectorAll(
        `a[href*="/external_documents"`
      ) as NodeListOf<HTMLElement>
    )
      .filter((node) => !enhancedNodesSet.has(node))
      .map((node) => this.toDocumentLink(node, 'external'));

    const detailsDocLinks = Array.from(
      document.querySelectorAll('a.clio-ui-link') as NodeListOf<HTMLElement>
    )
      .filter((link) => link.hasAttribute('x-on:click'))
      .filter((node) => !enhancedNodesSet.has(node))
      .map((node) => this.toDocumentLink(node, 'details'));

    return [
      ...documentDocLinks,
      ...searchDocLinks,
      ...externalDocLinks,
      ...detailsDocLinks,
    ];
  }

  private toDocumentLink(node: HTMLElement, linkType: LinkType): DocumentLink {
    return {
      node,
      docID: this.extractDocumentId(node, linkType),
      linkType,
    };
  }

  private extractDocumentId(node: HTMLElement, linkType: LinkType): string {
    let docId;

    switch (linkType) {
      case 'documents': {
        const href = node.getAttribute('href');
        const regex = /\/documents\/(\d+)/;
        const match = href?.match(regex);

        if (match) {
          docId = match[1];
        }
        break;
      }

      case 'search-results': {
        const href = node.getAttribute('href');
        const regex = /\/documents\/(\d+)\/details/;
        const match = href?.match(regex);

        if (match) {
          docId = match[1];
        }

        break;
      }

      case 'external': {
        const href = node.getAttribute('href');
        const regex = /\/external_documents\/(\d+)/;
        const match = href?.match(regex);

        if (match) {
          docId = match[1];
        }
        break;
      }

      case 'details': {
        const clickHandler = node.getAttribute('x-on:click');
        const regex =
          /\$documentsRedirect\.handleLauncherClick\(\s*'true',\s*'[^']*',\s*'(\d+)'/;
        const match = clickHandler?.match(regex);

        if (match) {
          docId = match[1];
        }

        break;
      }
    }

    if (!docId) {
      const docIdRegEx = /{\s?id:\s?(\d+)\s?}/gm;
      const docIdAttr = node.getAttribute('ui-sref') || '';
      const docIdMatch = docIdRegEx.exec(docIdAttr);

      if (docIdMatch) {
        docId = docIdMatch[1];
      } else {
        return node.closest('span')?.getAttribute('id') || 'id not found';
      }
    }

    return docId;
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
        iconUrl: 'assets/images/download-solid.svg',
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
