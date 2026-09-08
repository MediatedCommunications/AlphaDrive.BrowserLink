export interface Action {
  name: string;
  title: string;
  iconClass: string;
  iconUrl: string;
  text: string;
  onClick: () => void;
}

export interface DocumentLink {
  linkType: LinkType;
  node: HTMLElement;
  docID: string;
}

export type LinkType = 'grid' | 'documents' | 'search-results' | 'external' | 'details';
