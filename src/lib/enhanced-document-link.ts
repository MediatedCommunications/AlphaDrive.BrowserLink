import '@/assets/images/icon-0128.png';
import { Action, DocumentLink, LinkType } from '@/types/clio';
import { getSetting } from './settings';
import { browserExtensionAPI } from './utils';

export class EnhancedDocumentLink {
  private node: HTMLElement;
  private _docID: string;
  private linkType: LinkType;
  private fasterLawIcon: HTMLDivElement;
  private actionsContainer: HTMLDivElement;

  public get docID(): string {
    return this._docID;
  }

  constructor(documentLink: DocumentLink) {
    this.node = documentLink.node;
    this._docID = documentLink.docID;
    this.linkType = documentLink.linkType;
    this.fasterLawIcon = this.createFasterLawIcon();
    this.actionsContainer = this.createActionsContainer();
    this.attachIcon();
    this.addOpenWithFasterSuiteLink();
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
    const closestRow = parentNode.closest('tr');
    const targetViewElement = closestRow?.querySelector('cc-document-actions')
      ?.parentNode as HTMLElement;

    if (targetViewElement) {
      targetViewElement.classList.add('fasterlaw-icon-host');

      // Style existing elements
      const lastBtn = targetViewElement.querySelector(
        'button.th-button:last-of-type'
      ) as HTMLElement;
      lastBtn.style.borderTopRightRadius = '0';
      lastBtn.style.borderBottomRightRadius = '0';

      targetViewElement.append(this.fasterLawIcon);
    }
  }

  private addOpenWithFasterSuiteLink(): void {
    if (this.linkType !== 'details') return;

    const link = document.createElement('a');
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
