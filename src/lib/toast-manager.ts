export class ToastManager {
  private toast: HTMLDivElement | null = null;

  public showToast(text: string): void {
    const message = text.trim();

    if (!message) return;

    if (!this.toast) {
      this.toast = document.createElement('div');
      this.toast.setAttribute('id', 'momane_toast');
      this.toast.setAttribute('role', 'status');
      this.toast.style.pointerEvents = 'none';
      document.body.appendChild(this.toast);
    }

    this.toast.textContent = message;
  }
}
