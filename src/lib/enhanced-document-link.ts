import { Action, DocumentLink, LinkType } from '@/types/clio';
import { getSetting } from './settings';
import { browserExtensionAPI } from './utils';

export class EnhancedDocumentLink {
  private _node: HTMLElement;
  private _docID: string;
  private linkType: LinkType;
  private fasterLawIcon: HTMLDivElement;
  private actionsContainer: HTMLDivElement;
  private enhanced = false;
  private downloadsEnabled = false;

  public get node(): HTMLElement {
    return this._node;
  }

  public get docID(): string {
    return this._docID;
  }

  public get isEnhanced(): boolean {
    return this.enhanced;
  }

  public get isDownloadsEnabled(): boolean {
    return this.downloadsEnabled;
  }

  constructor(documentLink: DocumentLink) {
    this._node = documentLink.node;
    this._docID = documentLink.docID;
    this.linkType = documentLink.linkType;
    this.fasterLawIcon = this.createFasterLawIcon();
    this.actionsContainer = this.createActionsContainer();
    this.attachIcon();
    this.addOpenWithFasterSuiteLink();
    this.attachEventListeners();
  }

  public setEnhance(val: boolean): void {
    if (val) {
      this.fasterLawIcon.style.display = 'flex';
      this.enhanced = true;
    } else {
      this.fasterLawIcon.style.display = 'none';
      this.enhanced = false;
    }
  }

  private createFasterLawIcon(): HTMLDivElement {
    const fasterLawIcon = document.createElement('div');
    fasterLawIcon.classList.add('fasterlaw-icon', 'new-ui');
    fasterLawIcon.style.backgroundImage = `url(${browserExtensionAPI().runtime.getURL(
      '/assets/images/icon-0128.png'
    )})`;
    return fasterLawIcon;
  }

  private createActionsContainer(): HTMLDivElement {
    const actionsContainer = document.createElement('div');
    actionsContainer.classList.add('fasterlaw-actions-container', 'new-ui');
    document.body.appendChild(actionsContainer);

    return actionsContainer;
  }

  private createAction(action: Action): HTMLDivElement {
    const actionContainer = document.createElement('div');
    actionContainer.classList.add('action');
    actionContainer.setAttribute('title', action.title);

    const icon = document.createElement('div');
    icon.classList.add('action-icon', action.iconClass);
    icon.style.backgroundImage = `url(${browserExtensionAPI().runtime.getURL(
      action.iconUrl
    )})`;

    const text = document.createElement('span');
    text.textContent = action.text;

    actionContainer.appendChild(icon);
    actionContainer.appendChild(text);

    actionContainer.addEventListener('click', () => {
      action.onClick();
      this.toggleActionsContainer();
    });

    return actionContainer;
  }

  private async attachIcon(): Promise<void> {
    const parentNode = this._node.parentNode as HTMLElement;
    const closestRow = parentNode.closest('tr');
    const targetViewElement = closestRow?.querySelector('cc-document-actions')
      ?.parentNode as HTMLElement;

    if (targetViewElement) {
      targetViewElement.classList.add('fasterlaw-icon-host');

      // Style existing elements
      const lastBtn = targetViewElement.querySelector(
        'button.th-button:last-of-type'
      ) as HTMLElement;

      if (lastBtn) {
        lastBtn.style.borderTopRightRadius = '0';
        lastBtn.style.borderBottomRightRadius = '0';
      }

      const enhance = await getSetting('clio_enhance_docs');
      this.setEnhance(enhance ?? false);

      targetViewElement.append(this.fasterLawIcon);
    }
  }

  private addOpenWithFasterSuiteLink(): void {
    if (this.linkType !== 'details') return;

    const config = {
      attributes: true, // Observe attribute changes
      attributeFilter: ['style'], // Only observe changes to the 'style' attribute
    };

    const callback = (mutationsList, observer, linkContainerNode) => {
      for (const mutation of mutationsList) {
        if (
          mutation.type === 'attributes' &&
          mutation.attributeName === 'style'
        ) {
          if (linkContainerNode) {
            linkContainerNode.style.display = window.getComputedStyle(
              this.node
            ).display;
          }
        }
      }
    };

    const linkContainer = document.createElement('div');
    const link = document.createElement('a');
    const icon = document.createElement('i');
    const parentNode = this._node.parentNode as HTMLElement;

    parentNode.classList.add('fasterlaw-details-open-link-host');

    icon.setAttribute('aria-hidden', 'true');
    icon.setAttribute('role', 'img');
    icon.classList.add(
      'fa-solid',
      'fa-external-link',
      'suffix-icon',
      'fasterlaw-details-open-link-icon'
    );

    link.classList.add('fasterlaw-details-open-link');
    link.textContent = 'Open with Faster Suite';

    link.addEventListener('click', async () => {
      window.location.href = `alphadrive://localhost/Remoting/custom_actions/documents/edit?subject_url=/api/v4/documents/${this.docID}`;
    });

    linkContainer.style.display = window.getComputedStyle(this.node).display;
    linkContainer.appendChild(link);
    linkContainer.appendChild(icon);

    this._node.parentNode?.appendChild(linkContainer);

    const wrappedCallback = (mutationsList, observer) => {
      callback(mutationsList, observer, linkContainer);
    };

    // Create an observer instance linked to the wrapped callback function
    const observer = new MutationObserver(wrappedCallback);

    // Start observing the target element with the configured parameters
    observer.observe(this.node, config);
  }

  public bypassClick(): void {
    const link = this.node
      .closest('td')
      ?.querySelector('a[ng-click*="Launcher" i]') as HTMLAnchorElement;

    if (link) {
      console.log('Attmepting to click', link);
      link.dataset.bypass = 'true';
      link?.click();
    }
  }

  private attachEventListeners(): void {
    // Actions panel
    this.fasterLawIcon.addEventListener('click', () => {
      this.toggleActionsContainer();
      this.positionActionsContainer();
    });

    // Link itself
    this.node.addEventListener('mousedown', () => {
      this.node.removeEventListener(
        'click',
        EnhancedDocumentLink.cancelClick,
        true
      );

      this.node.addEventListener(
        'click',
        EnhancedDocumentLink.cancelClick,
        true
      );

      EnhancedDocumentLink.handleDocumentHandler(
        this.linkType,
        this.docID,
        this.node
      );

      return false;
    });

    // Open launcher icon
    const launcherIcon = this.node
      .closest('td')
      ?.querySelector('a[ng-click*="handleLauncherClick"]') as HTMLElement;

    launcherIcon?.addEventListener('mousedown', () => {
      console.log('In launcher icon click handler. Clicked:', this.node);

      launcherIcon?.removeEventListener(
        'click',
        EnhancedDocumentLink.cancelClick,
        true
      );

      launcherIcon.addEventListener(
        'click',
        EnhancedDocumentLink.cancelClick,
        true
      );

      EnhancedDocumentLink.handleDocumentHandler(
        this.linkType,
        this.docID,
        launcherIcon
      );

      return false;
    });
  }

  public static cancelClick(e: MouseEvent) {
    console.log(
      'In the default cancel click',
      e.target,
      (e.target as HTMLElement)?.dataset.bypass
    );
    const bypass = (e.target as HTMLElement)?.dataset?.bypass;

    if (!bypass) {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
    }
  }

  public static async handleDocumentHandler(
    linkType: LinkType,
    docID: string,
    node: HTMLElement
  ) {
    console.log('In handle Document Handler');
    const isEnabled = await getSetting('clio_open_docs');

    if (isEnabled && linkType !== 'details') {
      console.log('In handle Document Handler | Valid reroute');
      window.location.href = `alphadrive://localhost/Remoting/custom_actions/documents/edit?subject_url=/api/v4/documents/${docID}`;
    } else {
      console.log('In handle Document Handler | Invalid reroute');
      node.removeEventListener('click', EnhancedDocumentLink.cancelClick, true);
      node.click();
    }
  }

  private toggleActionsContainer(): void {
    document
      .querySelectorAll('.fasterlaw-actions-container')
      .forEach((container) => {
        if (container !== this.actionsContainer) {
          container.classList.remove('open');
        }
      });
    this.actionsContainer.classList.toggle('open');
  }

  private positionActionsContainer(): void {
    const rect = this.fasterLawIcon.getBoundingClientRect();
    const win = this.fasterLawIcon.ownerDocument.defaultView!;
    const extendUp = win.innerHeight - rect.top < 300;

    this.actionsContainer.style.top = extendUp
      ? `${rect.top + win.scrollY - 200}px`
      : `${rect.top + win.scrollY + 20}px`;
    this.actionsContainer.style.left = `${rect.left + win.scrollX}px`;
  }

  public addActions(actions: Action[]): void {
    actions.forEach((action) => {
      const actionElement = this.createAction(action);
      this.actionsContainer.appendChild(actionElement);
    });
  }
}
