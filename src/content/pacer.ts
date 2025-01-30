// import { fetchRequest } from '@/lib/utils';
// import { FormData } from 'formdata-polyfill'; // Ensure you have this polyfill installed or import another equivalent library for FormData support

// export class ContentDelegate {
//   private court: string;
//   private url: string;
//   private pacer_doc_ids: number[];
//   private links: HTMLElement[];
//   private recap: any; // Assuming 'recap' is an instance of a class that handles document retrieval and upload, replace 'any' with the appropriate type

//   constructor(
//     court: string,
//     url: string,
//     pacer_doc_ids: number[],
//     links: HTMLElement[],
//     recap: any
//   ) {
//     this.court = court;
//     this.url = url;
//     this.pacer_doc_ids = pacer_doc_ids;
//     this.links = links;
//     this.recap = recap;
//   }

//   handleSingleDocumentPageView(): void {
//     if (!PACER.isSingleDocumentPage(this.url, document)) {
//       return;
//     }

//     if (PACER.isAppellateCourt(this.court)) {
//       console.debug('No interposition for appellate downloads yet');
//       return;
//     }

//     // Monkey-patch the <form> prototype so that its submit() method sends a message to this content script instead of submitting the form.
//     const script = document.createElement('script');
//     script.innerText = `document.createElement("form").submit = function () {
//             this.id = "form" + new Date().getTime();
//             window.postMessage({ id: this.id }, "*");
//         };`;
//     document.body.appendChild(script);

//     // When we receive the message from the above submit method, submit the form via XHR so we can get the document before the browser does.
//     window.addEventListener(
//       'message',
//       this.onDocumentViewSubmit.bind(this),
//       false
//     );
//   }

//   async onDocumentViewSubmit(event: MessageEvent): Promise<void> {
//     const formId = event.data.id;
//     const form = document.getElementById(formId) as HTMLFormElement | null;
//     if (!form) return;

//     // Grab the document number, attachment number, and docket number
//     let document_number: string | undefined,
//       attachment_number: string | undefined,
//       docket_number: string | undefined;

//     const imageString = this.querySelector('td:contains(Image)');
//     const regex = /(\d+)-(\d+)/;
//     const matches = regex.exec(imageString);
//     if (!matches) {
//       form.submit();
//       return;
//     }
//     document_number = matches[1];
//     attachment_number = matches[2];
//     docket_number = this.querySelector('tr:contains(Case Number) td:nth(1)');

//     // Now do the form request to get to th$("body").css("cursor", "wait");e view page.

//     const data = new FormData(form);
//     fetchRequest(
//       form.action,
//       data,
//       this.handleFormSubmissionResponse.bind(this)
//     );
//   }

//   private handleFormSubmissionResponse(
//     type: string,
//     ab: ArrayBuffer,
//     xhr: XMLHttpRequest
//   ): void {
//     console.info(
//       'Faster Law: Successfully submitted Faster Law "View" button form: ' +
//         xhr.statusText
//     );
//     const blob = new Blob([new Uint8Array(ab)], { type: type });
//     if (type === 'application/pdf') {
//       this.showPdfPage(
//         document.documentElement,
//         `<style>body { margin: 0; } iframe { border: none; }</style><iframe src="${URL.createObjectURL(
//           blob
//         )}" width="100%" height="100%"></iframe>`,
//         '',
//         document_number,
//         attachment_number,
//         docket_number
//       );
//     } else {
//       const reader = new FileReader();
//       reader.onload = (): void =>
//         this.showPdfPage(
//           document.documentElement,
//           reader.result as string,
//           '',
//           document_number,
//           attachment_number,
//           docket_number
//         );
//       reader.readAsText(blob); // convert blob to HTML text
//     }
//   }

//   private showPdfPage(
//     documentElement: Document | HTMLElement,
//     html: string,
//     previousPageHtml: string,
//     document_number: string,
//     attachment_number: string,
//     docket_number: string
//   ): void {
//     const match = html.match(/([^]*?)<iframe[^>]*src="(.*?)"([^]*)/);
//     if (!match) {
//       documentElement.innerHTML = html;
//       return;
//     }

//     // Show the page with a blank <iframe> while waiting for the download.
//     documentElement.innerHTML = `${match[1]}<p>Waiting for download...<p><iframe src="about:blank"${match[3]}`;

//     // Download the file from the <iframe> URL.
//     fetchRequest(match[2], null, this.handlePdfDownload.bind(this));
//   }

//   private handlePdfDownload(
//     type: string,
//     ab: ArrayBuffer,
//     xhr: XMLHttpRequest
//   ): void {
//     console.info(
//       'Faster Law: Successfully got PDF as arraybuffer via ajax request.'
//     );

//     // Make the Back button redisplay the previous page.
//     window.onpopstate = (event): void => {
//       if (event.state && event.state.content) {
//         documentElement.innerHTML = event.state.content;
//       }
//     };
//     history.replaceState({ content: previousPageHtml }, '');

//     // Get the PACER case ID and, on completion, define displayPDF() to either display the PDF in the provided <iframe>, or if external_pdf is set, save it using FileSaver.js's saveAs().
//     const blob = new Blob([new Uint8Array(ab)], { type: type });
//     this.recap.getPacerCaseIdFromPacerDocId(
//       this.pacer_doc_id,
//       (pacer_case_id): void => {
//         console.info(`Faster Law: Stored pacer_case_id is ${pacer_case_id}`);
//         let displayPDF = function (items: any): void {
//           let filename: string | undefined;
//           if (items.options.ia_style_filenames) {
//             filename = `gov.uscourts.${this.court}.${
//               pacer_case_id || 'unknown-case-id'
//             }.${document_number}.${attachment_number || '0'}.pdf`;
//           } else if (items.options.lawyer_style_filenames) {
//             filename = `${
//               PACER.COURT_ABBREVS[this.court]
//             }_${docket_number}_${document_number}_${
//               attachment_number || '0'
//             }.pdf`;
//           }

//           let external_pdf = items.options.external_pdf;
//           if (
//             navigator.userAgent.indexOf('Chrome') >= 0 &&
//             !navigator.plugins.namedItem('Chrome PDF Viewer')
//           ) {
//             // We are in Google Chrome, and the built-in PDF Viewer has been disabled. So we autodetect and force external_pdf true for proper filenames.
//             external_pdf = true;
//           }
//           if (!external_pdf) {
//             const blobUrl = URL.createObjectURL(blob);
//             const downloadLink = `<div id="recap-download" class="initial"><a href="${blobUrl}" download="${filename}">Save as ${filename}</a></div>`;
//             html = `${match[1]}${downloadLink}<iframe onload="setTimeout(function() { document.getElementById('recap-download').className = ''; }, 7500)" src="${blobUrl}"></iframe>`;
//             documentElement.innerHTML = html;
//             history.pushState({ content: html }, '');
//           } else {
//             // Saving to an external PDF.
//             saveAs(blob, filename);
//             documentElement.innerHTML = `${match[1]}<p><iframe src="about:blank"></iframe>`; // Clear "Waiting..." message
//           }
//         }.bind(this);

//         chrome.storage.local.get('options', displayPDF);

//         let uploadDocument = function (items: any): void {
//           if (!items['options']['recap_disabled'] && !this.restricted) {
//             // If we have the pacer_case_id, upload the file to Faster Law.
//             const onUploadOk = (ok: boolean): void => {
//               if (ok) {
//                 this.notifier.showUpload('PDF uploaded', () => {});
//               }
//             };

//             // Convert blob to bytes and pass to recap.uploadDocument
//             const bytes = arrayBufferToArray(ab);
//             this.recap.uploadDocument(
//               this.court,
//               pacer_case_id,
//               this.pacer_doc_id,
//               document_number,
//               attachment_number,
//               bytes,
//               onUploadOk
//             );
//           } else {
//             console.info(
//               'Faster Law: Not uploading PDF. Faster Law is disabled.'
//             );
//           }
//         }.bind(this);
//         chrome.storage.local.get('options', uploadDocument);
//       }
//     );
//   }

//   attachRecapLinkToEligibleDocs(): void {
//     const linkCount = this.pacer_doc_ids.length;
//     console.info(
//       `Faster Law: Attaching links to all eligible documents (${linkCount} found)`
//     );
//     if (linkCount === 0) {
//       return;
//     }

//     // Ask the server whether any of these documents are available from Faster Law.
//     this.recap.getAvailabilityForDocuments(
//       this.pacer_doc_ids,
//       this.court,
//       $.proxy(function (api_results): void {
//         console.info(
//           `Faster Law: Got results from API. Running callback on API results to attach links and icons where appropriate.`
//         );
//         for (let i = 0; i < this.links.length; i++) {
//           const pacer_doc_id = this.querySelector('body').dataset['pacerDocId'];
//           if (!pacer_doc_id) continue;
//           const result = api_results.results.filter(
//             (obj): boolean => obj.pacer_doc_id === pacer_doc_id
//           )[0];
//           if (!result) continue;
//           const href = `https://www.courtlistener.com/${result.filepath_local}`;
//           const recapLink = document.createElement('a');
//           recapLink.classList.add('recap-inline');
//           recapLink.title = 'View this document for free';
//           recapLink.href = href;
//           recapLink.addEventListener(
//             'click',
//             this.handleRecapLinkClick.bind(this)
//           );
//           const img = document.createElement('img');
//           img.src = chrome.extension.getURL('assets/images/icon-0128.png');
//           recapLink.appendChild(img);
//           this.links[i].parentNode?.insertBefore(
//             recapLink,
//             this.links[i].nextSibling
//           );
//         }
//       }, this)
//     );
//   }

//   private handleRecapLinkClick(): boolean {
//     chrome.storage.local.get('options', (items) => {
//       if (!items.options.recap_link_popups) {
//         window.location = recapLink.href;
//         return;
//       }
//       const recapShade = document.createElement('div');
//       recapShade.id = 'recap-shade';
//       document.body.appendChild(recapShade);
//       const recapPopup = document.createElement('div');
//       recapPopup.classList.add('recap-popup');
//       const closeLink = document.createElement('a');
//       closeLink.classList.add('recap-close-link');
//       closeLink.href = '#';
//       closeLink.textContent = '×';
//       closeLink.addEventListener('click', () => {
//         document.body.removeChild(recapPopup);
//         document.body.removeChild(recapShade);
//       });
//       recapPopup.appendChild(closeLink);
//       const popupLink = document.createElement('a');
//       popupLink.href = recapLink.href;
//       popupLink.textContent = ' Get this document for free.';
//       popupLink.addEventListener('click', () => {
//         document.body.removeChild(recapPopup);
//         document.body.removeChild(recapShade);
//       });
//       const smallText = document.createElement('small');
//       smallText.textContent =
//         'Note that archived documents may be out of date. Faster Law is not affiliated with the U.S. Courts. The documents it makes available are voluntarily uploaded by PACER users. Faster Law cannot guarantee the authenticity of documents because the courts provide no effective document authentication system.';
//       recapPopup.appendChild(popupLink);
//       recapPopup.appendChild(smallText);
//       document.body.appendChild(recapPopup);
//     });
//     return false;
//   }

//   private querySelector(selector: string): string {
//     return document.querySelector(selector)?.textContent || '';
//   }
// }
