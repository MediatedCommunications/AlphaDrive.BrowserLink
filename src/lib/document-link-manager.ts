import { Action, DocumentLink, LinkType } from '@/types/clio';
import { EnhancedDocumentLink } from './enhanced-document-link';

/**
 *  DocumentLinkManager is responsible for managing document links on the page.
 *  It enhances document links by converting them into EnhancedDocumentLink instances,
 *  adding actions, and binding click events.
 *  It also ensures that links are not enhanced multiple times by checking against
 *  already enhanced nodes.
 */
export class DocumentLinkManager {
  private enhancedNodes: HTMLElement[] = [];
  private enhancedLinks: EnhancedDocumentLink[] = [];

  /**
   *  Enhances document links on the page by converting them into
   *  EnhancedDocumentLink instances, adding actions, and binding click events.
   *  It also ensures that links are not enhanced multiple times by checking
   *  against already enhanced nodes.
   *  This method collects all relevant document links from the page,
   *  enhances them, and sets up the necessary event listeners for interaction.
   *  It also binds a click event to close the actions container when clicking outside of it.
   *  This method should be called when the page is ready to ensure all links are processed.
   */
  public enhanceDocumentLinks(): void {
    const documentLinks = this.getDocumentLinks();

    documentLinks.forEach((documentLink) => {
      const enhancedLink = new EnhancedDocumentLink(documentLink);
      this.addActionsToEnhancedLink(enhancedLink);
      this.enhancedNodes.push(documentLink.node);
      this.enhancedLinks.push(enhancedLink);
    });

    // console.log(documentLinks);

    this.clickOutsideEventBinding();
  }

  public enableEnhancedLinks(): void {
    this.enhancedLinks.forEach((link) => {
      link.setEnhance(true);
    });
  }

  public disableEnhancedLinks(): void {
    this.enhancedLinks.forEach((link) => {
      link.setEnhance(false);
    });
  }

  /**
   *  Adds actions to the enhanced document link.
   *  This method creates a set of actions that can be performed on the document link,
   *  such as opening in a new tab, copying the link, or downloading the document.
   *  It also binds click events to these actions to perform the corresponding operations.
   */
  private getDocumentLinks(): DocumentLink[] {
    const enhancedNodesSet = new Set(this.enhancedNodes);

    // Collect all document links from the page, filtering out already enhanced nodes
    const documentDocLinks = Array.from(
      document.querySelectorAll(
        'a[href*="/download"],a[ng-click*="handleDocumentClick"]'
      ) as NodeListOf<HTMLElement>
    )
      .filter((node) => !enhancedNodesSet.has(node))
      .map((node) => this.toDocumentLink(node, 'documents'));

    // Collect links from search results
    const searchDocLinks = Array.from(
      document.querySelectorAll(
        'a[href*="/details"]'
      ) as NodeListOf<HTMLElement>
    )
      .filter((node) => !enhancedNodesSet.has(node))
      .map((node) => this.toDocumentLink(node, 'search-results'));

    // Collect links from external documents and details pages
    const externalDocLinks = Array.from(
      document.querySelectorAll(
        `a[href*="/external_documents"`
      ) as NodeListOf<HTMLElement>
    )
      .filter((node) => !enhancedNodesSet.has(node))
      .map((node) => this.toDocumentLink(node, 'external'));

    // Collect links from details pages with x-on:click attribute
    // This is for links that are enhanced by Clio's JavaScript
    // and are not already enhanced by our script
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

  /**
   *  Converts a given HTML element into a DocumentLink object.
   *  This method extracts the document ID from the element based on its link type
   *  and returns a DocumentLink object containing the node, document ID, and link type.
   */
  private toDocumentLink(node: HTMLElement, linkType: LinkType): DocumentLink {
    return {
      node,
      docID: this.extractDocumentId(node, linkType),
      linkType,
    };
  }

  /**
   *  Extracts the document ID from the given node based on the link type.
   *  It uses regular expressions to match the document ID in the href attribute
   *  or in the x-on:click attribute for details links.
   *  If no ID is found, it attempts to extract it from the ui-sref attribute
   *  or from a span element's id attribute.
   */
  private extractDocumentId(node: HTMLElement, linkType: LinkType): string {
    let docId = null;

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
        let current: HTMLElement | null = node.parentElement;
        let attempts = 0;

        // Traverse up the DOM tree to find a span element with an id attribute
        while (current && attempts < 3) {
          if (current.tagName.toLowerCase() === 'span') {
            const id = current.getAttribute('id');
            if (id) return id;
            attempts++;
          }
          current = current.parentElement;
        }

        return 'id not found';
      }
    }

    return docId;
  }

  /**
   *  Binds a click event to the document to close the actions container
   *  when clicking outside of it. This ensures that the actions container
   *  is closed when the user clicks anywhere outside of the actions container
   *  or the icon that opens it.
   */
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

  /**
   *  Adds predefined actions to the EnhancedDocumentLink instance.
   *  These actions include opening the document with Faster Suite,
   *  opening with Clio Launcher, downloading the document, locating
   *  the document's folder, copying the link, and comparing the document.
   *  Each action is defined with its name, title, icon, and click handler.
   */
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
