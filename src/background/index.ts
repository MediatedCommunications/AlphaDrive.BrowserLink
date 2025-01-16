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

// // Listen for storage changes to update the icon
// subscribeToSettingChange(
//   ['clio_enhance_docs', 'clio_open_docs'],
//   async (changes) => {
//     if (Object.keys(changes).length > 0) {
//       const newSettings: Partial<SettingsSchemaType> = {};
//       for (const key in changes) {
//         newSettings[key as keyof SettingsSchemaType] = (
//           changes as Record<string, { newValue: boolean; oldValue: boolean }>
//         )[key].newValue;
//       }

//       const tab = await getActiveTab();

//       // Call updateAppIcon with the newSettings
//       updateAppIcon(tab, newSettings as SettingsSchemaType);
//     }
//   }
// );

// async function updateAppIcon(
//   tab?: chrome.tabs.Tab,
//   newSettings?: SettingsSchemaType
// ) {
//   const settings = { ...(await getSettings()), ...newSettings };

//   if (tab && tab.url) {
//     const url = new URL(tab.url);
//     const isClioPage =
//       url.hostname.endsWith('.app.clio.com') || url.hostname === 'app.clio.com';
//     const isPacerPage =
//       url.hostname.endsWith('.uscourts.gov') || url.hostname === 'uscourts.gov';

//     if ((settings.clio_enhance_docs || settings.clio_open_docs) && isClioPage) {
//       chrome.action.setIcon({
//         tabId: tab.id,
//         path: getBrowserExtensionAPI().runtime.getURL(
//           'src/assets/images/icon-0128.png'
//         ),
//       });
//       chrome.action.setTitle({
//         tabId: tab.id,
//         title: 'Faster Suite is active!',
//       });
//     } else if (
//       (settings.pacer_auto_save_and_archive ||
//         settings.pacer_notify_when_archived) &&
//       isPacerPage
//     ) {
//       chrome.action.setIcon({
//         tabId: tab.id,
//         path: getBrowserExtensionAPI().runtime.getURL(
//           'src/assets/images/icon-0128.png'
//         ),
//       });
//       chrome.action.setTitle({
//         tabId: tab.id,
//         title: 'Faster Suite is active!',
//       });
//     } else {
//       chrome.action.setIcon({
//         tabId: tab.id,
//         path: getBrowserExtensionAPI().runtime.getURL(
//           'src/assets/images/icon-0128-disabled.png'
//         ),
//       });
//       chrome.action.setTitle({
//         tabId: tab.id,
//         title: 'Faster Suite is inactive',
//       });
//     }
//   }
// }
