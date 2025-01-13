import '@/assets/images/icon-0128.png';
import { Action, DocumentLink, UiVersion } from '@/types/clio';
import { getSetting } from './settings';
import { getBrowserExtensionAPI } from './utils';

export class EnhancedDocumentLink {
  private node: HTMLElement;
  private _docID: string;
  private uiVersion: UiVersion;
  private fasterLawIcon: HTMLDivElement;
  private actionsContainer: HTMLDivElement;

  public get docID(): string {
    return this._docID;
  }

  constructor(documentLink: DocumentLink, uiVersion: UiVersion) {
    this.node = documentLink.node;
    this._docID = documentLink.docID;
    this.uiVersion = uiVersion;
    this.fasterLawIcon = this.createFasterLawIcon();
    this.actionsContainer = this.createActionsContainer();
    this.attachIcon();
    this.attachEventListeners();
  }

  private createFasterLawIcon(): HTMLDivElement {
    const fasterLawIcon = document.createElement('div');
    fasterLawIcon.classList.add('fasterlaw-icon');
    fasterLawIcon.style.backgroundImage = `url(${getBrowserExtensionAPI().runtime.getURL(
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
    const actionElement = document.createElement('div');
    actionElement.classList.add('action');
    actionElement.setAttribute('title', action.title);
    actionElement.innerHTML = `<div class="action-icon ${action.iconClass}"></div> ${action.text}`;
    actionElement.addEventListener('click', action.onClick);
    return actionElement;
  }

  private attachIcon(): void {
    const parentNode = this.node.parentNode as HTMLElement;
    const siblingNode = parentNode.querySelector('.launcher-icon');

    // New UI specific logic
    if (this.uiVersion === UiVersion.New) {
      const pTd = parentNode.closest('td');
      const pTr = pTd?.closest('tr');
      const targetViewElement = pTr?.querySelector('cc-document-actions')
        ?.parentNode as HTMLElement;

      targetViewElement.classList.add('fasterlaw-icon-host');

      targetViewElement.append(this.fasterLawIcon);
    } else {
      // Old UI logic
      parentNode.style.display = 'flex';
      parentNode.style.alignItems = 'center';
      this.fasterLawIcon.style.margin = '0 8px';
      parentNode.append(this.fasterLawIcon);
    }
  }

  private attachEventListeners(): void {
    this.fasterLawIcon.addEventListener('click', () => {
      this.toggleActionsContainer();
      this.positionActionsContainer();
    });

    this.node.addEventListener('mousedown', async (event) => {
      const isDisabled = await this.isExtensionDisabled();

      if (!isDisabled) {
        event.preventDefault();
        event.stopPropagation();
        window.location.href = `alphadrive://localhost/Remoting/custom_actions/documents/edit?subject_url=/api/v4/documents/${this._docID}`;
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
    this.actionsContainer.style.left = `${rect.left + win.scrollX}px`; // Also using scrollX for consistency
  }

  private async isExtensionDisabled(): Promise<boolean> {
    const setting = await getSetting('clio_open_docs');
    return setting ? true : false;
  }

  public addActions(actions: Action[]): void {
    actions.forEach((action) => {
      const actionElement = this.createAction(action);
      this.actionsContainer.appendChild(actionElement);
    });
  }
}
