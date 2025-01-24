import '@/assets/images/icon-0128.png';
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
      'src/assets/images/icon-0128.png'
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

    linkContainer.appendChild(link);
    linkContainer.appendChild(icon);

    this._node.parentNode?.appendChild(linkContainer);
  }

  private attachEventListeners(): void {
    this.fasterLawIcon.addEventListener('click', () => {
      this.toggleActionsContainer();
      this.positionActionsContainer();
    });

    this._node.addEventListener('mousedown', async (event) => {
      const isEnabled = await getSetting('clio_open_docs');

      if (isEnabled && this.linkType !== 'details') {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        window.location.href = `alphadrive://localhost/Remoting/custom_actions/documents/edit?subject_url=/api/v4/documents/${this.docID}`;
      }
    });
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
