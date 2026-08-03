export interface ManagedDocumentLink {
  readonly node: Node;
  destroy(): void;
}

export function hasValidDocumentId(link: { readonly docID: string }): boolean {
  return /^\d+$/.test(link.docID);
}

export function pruneDisconnectedDocumentLinks<T extends ManagedDocumentLink>(
  links: T[]
): T[] {
  return links.filter((link) => {
    if (link.node.isConnected) return true;

    link.destroy();
    return false;
  });
}
