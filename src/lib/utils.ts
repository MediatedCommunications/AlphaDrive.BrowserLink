import { SettingsSchemaType } from '@/schemas/settings.schema';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { getSettings } from './settings';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function browserExtensionAPI(): typeof chrome {
  if (typeof chrome !== 'undefined') {
    return chrome;
  }
  return browser;
}

export function checkSelector(selector: string): boolean {
  return document.querySelectorAll(selector).length > 0;
}

export function checkAnySelector(selectors: string[]): boolean {
  return selectors.some((selector) => checkSelector(selector));
}

export async function updateAppIcon(
  tab?: chrome.tabs.Tab,
  newSettings?: SettingsSchemaType
) {
  const settings = { ...(await getSettings()), ...newSettings };
  const activeTab = tab ?? (await getActiveTab());

  if (!activeTab || !activeTab.url) {
    return;
  }

  const url = new URL(activeTab.url);
  const isClioPage =
    url.hostname.endsWith('.app.clio.com') || url.hostname === 'app.clio.com';
  const isPacerPage =
    url.hostname.endsWith('.uscourts.gov') || url.hostname === 'uscourts.gov';

  if ((settings.clio_enhance_docs || settings.clio_open_docs) && isClioPage) {
    chrome.action.setIcon({
      tabId: activeTab.id,
      path: browserExtensionAPI().runtime.getURL('assets/images/icon-0128.png'),
    });
    chrome.action.setTitle({
      tabId: activeTab.id,
      title: 'Faster Suite is active!',
    });
  } else if (
    (settings.pacer_auto_save_and_archive ||
      settings.pacer_notify_when_archived) &&
    isPacerPage
  ) {
    chrome.action.setIcon({
      tabId: activeTab.id,
      path: browserExtensionAPI().runtime.getURL('assets/images/icon-0128.png'),
    });
    chrome.action.setTitle({
      tabId: activeTab.id,
      title: 'Faster Suite is active!',
    });
  } else {
    chrome.action.setIcon({
      tabId: activeTab.id,
      path: browserExtensionAPI().runtime.getURL(
        'assets/images/icon-0128-disabled.png'
      ),
    });
    chrome.action.setTitle({
      tabId: activeTab.id,
      title: 'Faster Suite is inactive',
    });
  }
}

export async function getActiveTab() {
  const [activeTab] = await chrome.tabs.query({
    active: true,
    currentWindow: true,
  });
  const [lastTab] = await chrome.tabs.query({
    lastFocusedWindow: true,
    active: true,
  });
  return activeTab ?? lastTab;
}
