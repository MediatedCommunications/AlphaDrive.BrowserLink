import { getSettings } from '@/lib/settings';
import { browserExtensionAPI, updateAppIcon } from '@/lib/utils';

// Installation and update listener
browserExtensionAPI().runtime.onInstalled.addListener(async (details) => {
  await initializeSettings();

  await setupLifeCycleNotifications(details);

  setupUninstallRedirect();
});

async function initializeSettings() {
  const settings = await getSettings();

  if (settings.clio_enhance_docs === undefined) {
    browserExtensionAPI().storage.local.set({ clio_enhance_docs: true });
  }

  if (settings.clio_open_docs === undefined) {
    browserExtensionAPI().storage.local.set({ clio_open_docs: true });
  }

  if (settings.pacer_auto_save_and_archive === undefined) {
    browserExtensionAPI().storage.local.set({
      pacer_auto_save_and_archive: true,
    });
  }

  if (settings.pacer_notify_when_archived === undefined) {
    browserExtensionAPI().storage.local.set({
      pacer_notify_when_archived: true,
    });
  }
}

async function setupLifeCycleNotifications(
  details: chrome.runtime.InstalledDetails
) {
  if (details.reason === 'install') {
    await showNotification(
      'Extension Installed',
      'Faster Law extension installed successfully!'
    );
  } else if (details.reason === 'update') {
    await showNotification(
      'Extension Updated',
      'Faster Law extension updated successfully!'
    );
  }
}

function setupUninstallRedirect() {
  const feedbackCookie = 'courtlistener_feedback_given';
  browserExtensionAPI()
    .cookies.get({ url: 'https://courtlistener.com', name: feedbackCookie })
    .then((cookie) => {
      if (!cookie) {
        // Redirect to feedback page on uninstall
        browserExtensionAPI().runtime.setUninstallURL(
          'https://courtlistener.com/feedback/'
        );
        // Set a cookie to prevent redirecting again
        browserExtensionAPI().cookies.set({
          url: 'https://courtlistener.com',
          name: feedbackCookie,
          value: 'true',
        });
      }
    });
}

// Call updateAppIcon initially for the current tab
browserExtensionAPI().tabs.query(
  { active: true, currentWindow: true },
  (tabs) => {
    updateAppIcon(tabs[0]);
  }
);

// Listen for tab changes to update the icon
browserExtensionAPI().tabs.onUpdated.addListener((_tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete') {
    updateAppIcon(tab);
  }
});

// Notifications module
async function showNotification(title: string, message: string): Promise<void> {
  browserExtensionAPI().notifications.create({
    type: 'basic',
    iconUrl: 'icons/icon128.png',
    title,
    message,
  });
}
