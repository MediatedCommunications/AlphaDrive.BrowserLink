import { SettingsSchemaType } from '@/schemas/settings.schema';

export async function getSetting<T extends keyof SettingsSchemaType>(
  key: T
): Promise<SettingsSchemaType[T]> {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(key, (result) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve(result[key]);
      }
    });
  });
}

export async function getSettings(): Promise<SettingsSchemaType> {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(null, (result) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve(result as SettingsSchemaType);
      }
    });
  });
}

export async function saveSettings(
  settings: SettingsSchemaType
): Promise<void> {
  return new Promise((resolve, reject) => {
    chrome.storage.local.set(settings, () => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve();
      }
    });
  });
}

export function subscribeToSettingChange(
  keys: (keyof SettingsSchemaType)[],
  callback: (changes: {
    [key in keyof SettingsSchemaType]: chrome.storage.StorageChange;
  }) => void
) {
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === 'local') {
      const relevantChanges = Object.keys(changes)
        .filter((key) => keys.includes(key as keyof SettingsSchemaType))
        .reduce((obj, key) => {
          obj[key as keyof SettingsSchemaType] =
            changes[key as keyof SettingsSchemaType];
          return obj;
        }, {} as { [key in keyof SettingsSchemaType]: chrome.storage.StorageChange });

      if (Object.keys(relevantChanges).length > 0) {
        callback(relevantChanges);
      }
    }
  });
}
