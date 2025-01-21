import '@/assets/images/icon-0128.png';
import { Action, DocumentLink, UiVersion } from '@/types/clio';
import { getSetting } from './settings';
import { browserExtensionAPI } from './utils';

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

  private attachIcon(): void {
    const parentNode = this.node.parentNode as HTMLElement;

    // New UI specific logic
    if (this.uiVersion === UiVersion.New) {
      const pTd = parentNode.closest('td');
      const pTr = pTd?.closest('tr');
      const targetViewElement = pTr?.querySelector('cc-document-actions')
        ?.parentNode as HTMLElement;

      if (targetViewElement) {
        targetViewElement.classList.add('fasterlaw-icon-host');

        targetViewElement.append(this.fasterLawIcon);
      }
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
      const isEnabled = await getSetting('clio_open_docs');

      if (isEnabled) {
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
