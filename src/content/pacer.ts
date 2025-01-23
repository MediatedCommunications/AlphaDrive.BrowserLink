import {
    PACER_URL_REGEX,
    DOCKET_QUERY_URL_REGEX,
    DOCKET_DISPLAY_URL_REGEX,
    DOCKET_HISTORY_DISPLAY_URL_REGEX,
    ATTACHMENT_MENU_PAGE_REGEX,
    SINGLE_DOCUMENT_PAGE_REGEX,
    DOCUMENT_URL_REGEX,
} from '@/constants';
import { convertToCourtListenerCourt, isAppellateCourt } from '@/lib/courts';
import { getSetting } from '@/lib/settings';
import { RecapService } from '@/services/recap-service';
import { showNotification } from '@/lib/notification-manager';
import { arrayBufferToArray } from '@/lib/array-buffer-to-array';
import { getActiveTab, browserExtensionAPI } from '@/lib/utils';
import { saveAs } from 'file-saver';
import { Notifier } from "../lib/notification-manager";
import { Recap } from "../services/recap-service";

// Initialize services
const recapService = new RecapService();

// Create a class to manage PACER interactions
class PacerManager {
    private restricted = false;
    private pacerDocIDs: string[] = [];

    // Function to check for document restrictions
    private checkRestrictions(): boolean {
        // Implementation for checking document restrictions (similar to old codebase)
        // ...
    }

    // Function to find and store PACER document IDs
    private findAndStorePacerDocIds(): void {
        // Implementation for finding and storing document IDs (similar to old codebase)
        // ...
    }

    // Function to handle docket query URLs
    private async handleDocketQueryUrl(url: string, court: string, caseId: string): Promise<void> {
        // Implementation for handling docket query URLs (similar to old codebase)
        // ...
    }

    // Function to handle docket display pages
    private async handleDocketDisplayPage(url: string, court: string, caseId: string): Promise<void> {
        // Implementation for handling docket display pages (similar to old codebase)
        // ...
    }

    // Function to handle attachment menu pages
    private async handleAttachmentMenuPage(url: string, court: string, caseId: string): Promise<void> {
        // Implementation for handling attachment menu pages (similar to old codebase)
        // ...
    }

    // Function to handle single document pages
    private async handleSingleDocumentPageCheck(url: string, court: string, docId: string): Promise<void> {
        // Implementation for handling single document pages (similar to old codebase)
        // ...
    }

    // Function to handle single document page views
    private handleSingleDocumentPageView(url: string, court: string): void {
        // Implementation for handling single document page views (similar to old codebase)
        // ...
    }

    // Function to attach RECAP links to eligible documents
    private attachRecapLinkToEligibleDocs(court: string): void {
        // Implementation for attaching RECAP links (similar to old codebase)
        // ...
    }

    // Function to handle RECAP link clicks
    private handleRecapLinkClick(url: string): boolean {
        // Implementation for handling RECAP link clicks (similar to old codebase)
        // ...
    }

    // Function to show PDF page
    private async showPdfPage(
        html: string,
        previousPageHtml: string,
        documentNumber: string,
        attachmentNumber: string,
        docketNumber: string
    ): Promise<void> {
        // Implementation for showing PDF page (similar to old codebase)
        // ...
    }

    // Function to handle document view submit
    private async onDocumentViewSubmit(event: MessageEvent): Promise<void> {
        // Implementation for handling document view submit (similar to old codebase)
        // ...
    }
}

// Function to extract court, case ID, and document ID from URL
function extractCourtCaseDocIds(url: string): {
    court: string | null;
    caseId: string | null;
    docId: string | null;
} {
    // Implementation for extracting court, case ID, and document ID (adapt from old codebase)
    // ...
}

// Initialize PacerManager
const pacerManager = new PacerManager();

// Get the current active tab
getActiveTab().then((tab) => {
    if (tab && tab.url) {
        const url = tab.url;

        // Extract court, case ID, and document ID
        const { court, caseId, docId } = extractCourtCaseDocIds(url);

        if (court) {
            // Check for restrictions
            pacerManager.checkRestrictions();

            // Find and store PACER document IDs
            pacerManager.findAndStorePacerDocIds();

            if (caseId && docId) {
                // Handle single document page
                pacerManager.handleSingleDocumentPageCheck(url, court, docId);
            } else if (caseId) {
                // Handle docket display page
                pacerManager.handleDocketDisplayPage(url, court, caseId);

                // Handle attachment menu page
                pacerManager.handleAttachmentMenuPage(url, court, caseId);
            } else {
                // Handle docket query page
                pacerManager.handleDocketQueryUrl(url, court, caseId);
            }

            // Attach RECAP links to eligible documents
            pacerManager.attachRecapLinkToEligibleDocs(court);
        }
    }
});

// Listen for messages from other parts of the extension
window.addEventListener('message', async (event) => {
    if (window.self === window.top) {
        const data = event.data;
        if (data.cmd === 'showToast') {
            // Show toast notification
            // ...
        }
    } else {
        sendMessageToTop(event.data);
    }
});

// Helper function to send messages to the top window
function sendMessageToTop(detail: any): void {
    window.parent.postMessage(detail, '*');
}