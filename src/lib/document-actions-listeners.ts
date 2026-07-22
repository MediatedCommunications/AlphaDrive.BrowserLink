const boundDocuments = new WeakSet<Document>();

export function bindDocumentActionsDismissal(
  targetDocument: Document,
  targetWindow: Window
): void {
  if (boundDocuments.has(targetDocument)) return;
  boundDocuments.add(targetDocument);

  targetDocument.addEventListener('click', (event) => {
    if (
      !(event.target as HTMLElement).closest(
        '.fasterlaw-actions-container, .fasterlaw-icon'
      )
    ) {
      targetDocument
        .querySelectorAll('.fasterlaw-actions-container')
        .forEach((container) => container.classList.remove('open'));
    }
  });

  targetWindow.addEventListener('wheel', () => {
    targetDocument
      .querySelectorAll('.fasterlaw-actions-container')
      .forEach((container) => container.classList.remove('open'));
  });
}
