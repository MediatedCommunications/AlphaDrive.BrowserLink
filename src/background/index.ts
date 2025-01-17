import { getSettings } from '@/lib/settings';
import { updateAppIcon } from '@/lib/utils';

// Initialize storage variables with default values if they don't exist
chrome.runtime.onInstalled.addListener(async () => {
  const settings = await getSettings();

  if (settings.clio_enhance_docs === undefined) {
    chrome.storage.local.set({ clio_enhance_docs: true });
  }

  if (settings.clio_open_docs === undefined) {
    chrome.storage.local.set({ clio_open_docs: true });
  }

  if (settings.pacer_auto_save_and_archive === undefined) {
    chrome.storage.local.set({ pacer_auto_save_and_archive: true });
  }

  if (settings.pacer_notify_when_archived === undefined) {
    chrome.storage.local.set({ pacer_notify_when_archived: true });
  }
});

// Call updateAppIcon initially for the current tab
chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  updateAppIcon(tabs[0]);
});

// Listen for tab changes to update the icon
chrome.tabs.onUpdated.addListener((_tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete') {
    updateAppIcon(tab);
  }
});
