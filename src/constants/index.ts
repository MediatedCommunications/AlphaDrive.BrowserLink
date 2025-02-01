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
