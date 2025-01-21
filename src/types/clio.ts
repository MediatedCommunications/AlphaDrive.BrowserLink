export interface Action {
  name: string;
  title: string;
  iconClass: string;
  iconUrl: string;
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
