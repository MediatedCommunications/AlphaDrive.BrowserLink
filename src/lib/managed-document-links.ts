export interface ManagedDocumentLink {
  readonly node: Node;
  destroy(): void;
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
