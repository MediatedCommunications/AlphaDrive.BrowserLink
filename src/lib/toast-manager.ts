export class ToastManager {
  private toast: HTMLDivElement;

  constructor() {
    this.toast = document.createElement('div');
    this.toast.setAttribute('id', 'momane_toast');
    // this.toast.setAttribute(
    //   'style',
    //   'color: white;z-index:65536;display:none;position: fixed;top: 5px;right: 10px;width: 400px;padding: 10px;background-color: gray;border: 1px solid gray;box-shadow: black 1px 1px 10px 1px;font-size: 13px;'
    // );
    document.body.appendChild(this.toast);
  }

  public showToast(text: string): void {
    console.log('Showing toast:', text);
  }
}
