// CLIO Regular Expression for extracting document ID from documents list
export const CLIO_DOCUMENTS_DOC_ID_REGEX = /#\/documents\/(\d+)/;

// CLIO Regular Expression for extracting document ID from search results
export const CLIO_SEARCH_RESULTS_DOC_ID_REGEX = /#\/documents\/(\d+)\/details/;

// CLIO Regular Expression for extracting document ID from external documents
export const CLIO_EXTERNAL_DOCUMENTS_DOC_ID_REGEX =
  /\/external_documents\/(\d+)/;

// CLIO selector for results list
export const CLIO_DETAILS_VIEW_SELECTOR = 'a[x-on:click]';

// CLIO Regular Expression for extracting document ID from details view
export const CLIO_DETAILS_VIEW_DOC_ID_REGEX =
  /\$documentsRedirect\.handleLauncherClick\(\s*'true',\s*'[^']*',\s*'(\d+)'/;

// Regular expression to broadly identify PACER URLs
export const PACER_URL_REGEX = /https?:\/\/ecf\.([a-z]{2,3})\.uscourts\.gov\//;

// Regular expression to identify PACER docket query URLs
export const DOCKET_QUERY_URL_REGEX =
  /https?:\/\/ecf\.([a-z]{2,3})\.uscourts\.gov\/cgi-bin\/DktRpt\.pl/;

// Regular expression to identify PACER docket display URLs
export const DOCKET_DISPLAY_URL_REGEX =
  /https?:\/\/ecf\.([a-z]{2,3})\.uscourts\.gov\/doc1\/index\.pl\?/;

// Regular expression to identify PACER docket history display URLs
export const DOCKET_HISTORY_DISPLAY_URL_REGEX =
  /https?:\/\/ecf\.([a-z]{2,3})\.uscourts\.gov\/cgi-bin\/DktRpt\.pl\?.*docket_number=[^&]+/;

// Regular expression to identify PACER attachment menu pages
export const ATTACHMENT_MENU_PAGE_REGEX =
  /https?:\/\/ecf\.([a-z]{2,3})\.uscourts\.gov\/doc1\/index\.pl\?.*caseid=[^&]+&/;

// Regular expression to identify PACER single document pages
export const SINGLE_DOCUMENT_PAGE_REGEX =
  /https?:\/\/ecf\.([a-z]{2,3})\.uscourts\.gov\/doc1\/index\.pl\?.*caseid=[^&]+&de_seq_num=[^&]+/;

// Regular expression to identify PACER document URLs (more general)
export const DOCUMENT_URL_REGEX =
  /https?:\/\/ecf\.([a-z]{2,3})\.uscourts\.gov\/doc1\/index\.pl\?.*caseid=[^&]+/;
