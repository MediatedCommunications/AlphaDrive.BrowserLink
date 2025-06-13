export class ToastManager {
  private toast: HTMLDivElement;

  constructor() {
    this.toast = document.createElement('div');
    this.toast.setAttribute('id', 'momane_toast');
    document.body.appendChild(this.toast);
  }

  public showToast(text: string): void {
    console.log('Showing toast:', text);
  }
}
