import { Action, DocumentLink, LinkType } from '@/types/clio';
import { documentActionHost } from './clio-document-elements';
import { browserExtensionAPI } from './utils';

export class EnhancedDocumentLink {
  private _node: HTMLElement;
  private resolveId: () => string;
  private linkType: LinkType;
  private fasterLawIcon: HTMLButtonElement;
  private actionsContainer?: HTMLDivElement;
  private anchorRect?: DOMRect;
  private actions: Action[] = [];
  private static active?: EnhancedDocumentLink;
  private enhanced = false;
  private detailsObserver?: MutationObserver;
  private detailsLinkContainer?: HTMLDivElement;
  private detailsLinkHost?: HTMLElement;
  private iconHost?: HTMLElement;
  private ownsFasterLawIcon = false;
  private destroyed = false;
  private bypassing = false;
  private launcherNode: HTMLElement | null = null;

  private readonly fasterLawIconClickHandler = (event: MouseEvent) => {
    event.stopPropagation();
    this.toggleActionsContainer();
  };

  private shouldOpen: () => boolean;
  private readonly nodeClickHandler = (event: MouseEvent) => {
    if (this.bypassing || !this.shouldOpen() || this.linkType === 'details' || event.button !== 0 ||
        event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.defaultPrevented) return;
    if (!/^\d+$/.test(this.docID) || !this.node.isConnected) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    window.location.href = `alphadrive://localhost/Remoting/custom_actions/documents/edit?subject_url=/api/v4/documents/${this.docID}`;
  };

  public get node(): HTMLElement {
    return this._node;
  }

  public get docID(): string {
    return this.resolveId();
  }

  constructor(documentLink: DocumentLink, shouldOpen: () => boolean, resolveId: () => string) {
    this.resolveId = resolveId;
    this.shouldOpen = shouldOpen;
    this._node = documentLink.node;
    this.linkType = documentLink.linkType;
    this.fasterLawIcon = this.createFasterLawIcon();
    this.attachIcon();
    this.addOpenWithFasterSuiteLink();
    this.attachEventListeners();
    this.refreshNativeLauncher();
  }

  public setEnhance(val: boolean): void {
    this.iconHost?.classList.toggle('fasterlaw-icon-host', val);
    if (this.detailsLinkContainer) this.detailsLinkContainer.hidden = !val;
    if (!val) this.closeActions();
    if (val) {
      this.fasterLawIcon.style.display = 'flex';
      this.enhanced = true;
    } else {
      this.fasterLawIcon.style.display = 'none';
      this.enhanced = false;
    }
  }

  private createFasterLawIcon(): HTMLButtonElement {
    const fasterLawIcon = document.createElement('button');
    fasterLawIcon.type = 'button';
    fasterLawIcon.setAttribute('aria-label', 'Faster Suite actions');
    fasterLawIcon.setAttribute('aria-haspopup', 'menu');
    fasterLawIcon.setAttribute('aria-expanded', 'false');

    fasterLawIcon.classList.add('fasterlaw-icon', 'new-ui');
    fasterLawIcon.addEventListener('pointerdown', event => event.stopPropagation());
    fasterLawIcon.addEventListener('keydown', event => event.stopPropagation());
    fasterLawIcon.style.backgroundImage = `url(${browserExtensionAPI().runtime.getURL(
      '/assets/images/icon-0128.png'
    )})`;

    return fasterLawIcon;
  }

  private createActionsContainer(): HTMLDivElement {
    const actionsContainer = document.createElement('div');

    actionsContainer.classList.add('fasterlaw-actions-container', 'new-ui');
    actionsContainer.setAttribute('role', 'menu');
    actionsContainer.setAttribute('aria-label', 'Faster Suite actions');
    actionsContainer.hidden = true;
    actionsContainer.addEventListener('keydown', (event) => {
      const items = Array.from(actionsContainer.querySelectorAll<HTMLElement>('[role="menuitem"]'));
      const index = items.indexOf(document.activeElement as HTMLElement);
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        this.closeActions(true);
      } else if (event.key === 'Tab') {
        this.closeActions(true);
      } else if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
        event.preventDefault();
        const next = event.key === 'Home' ? 0 : event.key === 'End' ? items.length - 1
          : (index + (event.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length;
        items[next]?.focus();
      }
    });
    document.body.appendChild(actionsContainer);

    return actionsContainer;
  }

  private createAction(action: Action): HTMLButtonElement {
    const actionContainer = document.createElement('button');
    actionContainer.type = 'button';
    actionContainer.setAttribute('role', 'menuitem');
    actionContainer.tabIndex = -1;
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

    actionContainer.addEventListener('click', (event) => {
      event.stopPropagation();
      this.closeActions(true);
      if (/^\d+$/.test(this.docID) && this.node.isConnected) action.onClick();
    });

    return actionContainer;
  }

  private attachIcon(): void {
    const host = documentActionHost(this.node);
    if (!host) return;
    // Turbo may restore markup containing a previous instance's button.
    host.querySelectorAll('.fasterlaw-icon').forEach(icon => icon.remove());
    this.iconHost = host;
    this.setEnhance(false);
    host.append(this.fasterLawIcon);
    this.ownsFasterLawIcon = true;
  }

  private addOpenWithFasterSuiteLink(): void {
    if (this.linkType !== 'details') return;

    const linkContainer = document.createElement('div');
    const link = document.createElement('a');
    const icon = document.createElement('i');
    const parentNode = this._node.parentNode as HTMLElement;

    parentNode.classList.add('fasterlaw-details-open-link-host');
    this.detailsLinkHost = parentNode;

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
    link.href = `alphadrive://localhost/Remoting/custom_actions/documents/edit?subject_url=/api/v4/documents/${this.docID}`;

    link.addEventListener('click', (event) => {
      event.preventDefault();
      if (!this.enhanced || !this.node.isConnected || !/^\d+$/.test(this.docID)) return;
      window.location.href = `alphadrive://localhost/Remoting/custom_actions/documents/edit?subject_url=/api/v4/documents/${this.docID}`;
    });

    linkContainer.style.display = window.getComputedStyle(this.node).display;
    linkContainer.appendChild(link);
    linkContainer.appendChild(icon);

    this._node.parentNode?.appendChild(linkContainer);
    this.detailsLinkContainer = linkContainer;

    const observer = new MutationObserver(() => {
      linkContainer.style.display = window.getComputedStyle(this.node).display;
    });
    this.detailsObserver = observer;
    observer.observe(this.node, { attributes: true, attributeFilter: ['style', 'class', 'hidden'] });
  }

  public destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;

    this.detailsObserver?.disconnect();
    this.fasterLawIcon.removeEventListener(
      'click',
      this.fasterLawIconClickHandler
    );
    this.node.removeEventListener('click', this.nodeClickHandler, true);
    this.launcherNode?.removeEventListener('click', this.nodeClickHandler, true);
    this.detailsLinkContainer?.remove();
    this.closeActions();
    this.detailsLinkHost?.classList.remove(
      'fasterlaw-details-open-link-host'
    );

    if (this.ownsFasterLawIcon) {
      this.fasterLawIcon.remove();
      this.iconHost?.classList.remove('fasterlaw-icon-host');
    }
  }

  public get launcher(): HTMLElement | null {
    if (this.linkType === 'grid' && /^\d+$/.test(this.docID)) {
      return document.querySelector<HTMLElement>(`[data-testid="dms-row-actions-${this.docID}-open-in-clio-desktop"]`);
    }
    return this.node.closest('td')?.querySelector<HTMLElement>('a[ng-click*="Launcher" i]') ?? null;
  }

  public refreshNativeLauncher(): void {
    if (this.linkType === 'grid' || this.linkType === 'details') return;
    const launcher = this.launcher;
    if (launcher === this.launcherNode) return;
    this.launcherNode?.removeEventListener('click', this.nodeClickHandler, true);
    this.launcherNode = launcher;
    launcher?.addEventListener('click', this.nodeClickHandler, true);
  }

  public bypassClick(): void {
    this.bypassing = true;
    try { this.launcher?.click(); }
    finally { this.bypassing = false; }
  }

  private attachEventListeners(): void {
    // Actions panel
    this.fasterLawIcon.addEventListener(
      'click',
      this.fasterLawIconClickHandler
    );

    this.node.addEventListener('click', this.nodeClickHandler, true);
  }

  public static closeActive(event?: Event): void {
    const active = EnhancedDocumentLink.active;
    if (event?.type === 'scroll' && active?.anchorRect) {
      const current = active.fasterLawIcon.getBoundingClientRect();
      if (current.top === active.anchorRect.top && current.left === active.anchorRect.left) return;
    }
    active?.closeActions();
  }

  private toggleActionsContainer(): void {
    if (this.actionsContainer) {
      this.closeActions(true);
      return;
    }
    if (!this.enhanced || !this.node.isConnected || !/^\d+$/.test(this.docID)) return;
    EnhancedDocumentLink.closeActive();
    this.actionsContainer = this.createActionsContainer();
    this.actions.filter(action => action.name !== 'Open with Clio Launcher' || this.launcher)
      .forEach(action => this.actionsContainer!.appendChild(this.createAction(action)));
    this.actionsContainer.hidden = false;
    this.actionsContainer.classList.add('open');
    EnhancedDocumentLink.active = this;
    this.fasterLawIcon.setAttribute('aria-expanded', 'true');
    this.positionActionsContainer();
    this.actionsContainer.querySelector<HTMLElement>('[role="menuitem"]')?.focus({ preventScroll: true });
  }

  private closeActions(restoreFocus = false): void {
    this.actionsContainer?.remove();
    this.actionsContainer = undefined;
    if (EnhancedDocumentLink.active === this) EnhancedDocumentLink.active = undefined;
    this.fasterLawIcon.setAttribute('aria-expanded', 'false');
    if (restoreFocus && this.fasterLawIcon.isConnected) this.fasterLawIcon.focus();
  }

  private positionActionsContainer(): void {
    if (!this.actionsContainer) return;
    const rect = this.fasterLawIcon.getBoundingClientRect();
    this.anchorRect = rect;
    const menu = this.actionsContainer;
    const margin = 8;
    const width = document.documentElement.clientWidth;
    const height = document.documentElement.clientHeight;
    menu.style.maxWidth = `${Math.max(0, width - margin * 2)}px`;
    menu.style.maxHeight = `${Math.max(0, height - margin * 2)}px`;
    const bounds = menu.getBoundingClientRect();
    const top = rect.bottom + bounds.height + margin <= height ? rect.bottom + 4 : rect.top - bounds.height - 4;
    menu.style.top = `${Math.max(margin, Math.min(top, height - bounds.height - margin))}px`;
    menu.style.left = `${Math.max(margin, Math.min(rect.left, width - bounds.width - margin))}px`;
  }

  public addActions(actions: Action[]): void {
    this.actions = actions;
  }
}
