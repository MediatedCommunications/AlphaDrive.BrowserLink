const boundDocuments = new WeakSet<Document>();

export function bindDocumentActionsDismissal(
  targetDocument: Document,
  targetWindow: Window,
  close: (event?: Event) => void
): void {
  if (boundDocuments.has(targetDocument)) return;
  boundDocuments.add(targetDocument);

  const outside = (event: Event) => {
    const target = event.target;
    if (!(target instanceof Element) || !target.closest('.fasterlaw-actions-container, .fasterlaw-icon')) close();
  };
  targetDocument.addEventListener('click', outside, true);
  targetDocument.addEventListener('focusin', outside);
  targetDocument.addEventListener('scroll', (event) => {
    if (!(event.target instanceof Element) || !event.target.closest('.fasterlaw-actions-container')) close(event);
  }, true);
  targetWindow.addEventListener('wheel', (event) => {
    if (!(event.target instanceof Element) || !event.target.closest('.fasterlaw-actions-container')) close(event);
  }, { passive: true });
  targetWindow.addEventListener('resize', close);
}
