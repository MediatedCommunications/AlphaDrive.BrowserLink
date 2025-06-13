/**
 * Global helper utilities for the Faster Suite browser extension.
 * Provides functions for class name merging, browser API access,
 * selector checking, app icon updating, and active tab retrieval.
 */

import { SettingsSchemaType } from '@/schemas/settings.schema';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { getSettings } from './settings';

/**
 *  Merges class names conditionally and removes duplicates.
 *  Uses `clsx` for conditional class names and `twMerge` to handle Tailwind CSS conflicts.
 *  This is useful for dynamically generating class names based on conditions,
 *  ensuring that only the necessary classes are applied without conflicts.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 *  Returns the appropriate browser extension API object.
 *  Uses `chrome` if available, otherwise falls back to `browser`.
 *  This is useful for ensuring compatibility across different browsers
 *  that may implement the WebExtensions API differently.
 *  For example, Chrome uses `chrome` while Firefox uses `browser`.
 */
export function browserExtensionAPI(): typeof chrome {
  if (typeof chrome !== 'undefined') {
    return chrome;
  }
  return browser;
}

/**
 *   Checks if a given CSS selector matches any elements in the document.
 *   Returns true if at least one element matches, otherwise false.
 *   This is useful for determining if certain elements are present on the page,
 *   which can help in deciding whether to apply specific functionality or styles.
 */
export function checkSelector(selector: string): boolean {
  return document.querySelectorAll(selector).length > 0;
}

/**
 *  Checks if any of the provided CSS selectors match elements in the document.
 *  Returns true if at least one selector matches, otherwise false.
 *  This is useful for determining if certain elements are present on the page,
 *  which can help in deciding whether to apply specific functionality or styles.
 */

export function checkAnySelector(selectors: string[]): boolean {
  return selectors.some((selector) => checkSelector(selector));
}

/**
 *  Updates the browser action icon and title based on the current tab's URL
 *  and the current settings.
 *  If the tab is a Clio or PACER page and the relevant settings are enabled,
 *  it sets the icon to the active state and updates the title.
 *  Otherwise, it sets the icon to the inactive state and updates the title accordingly.
 */
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

/**
 * Retrieves the currently active tab in the current window.
 * If no active tab is found, it attempts to get the last focused tab.
 */
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
