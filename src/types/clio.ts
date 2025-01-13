export interface Action {
  title: string;
  iconClass: string;
  text: string;
  onClick: () => void;
}

export interface DocumentLink {
  node: HTMLElement;
  docID: string;
}

export enum UiVersion {
  Old,
  New,
  SearchResult,
}
