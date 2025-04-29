import AppConstants from "./AppConstants.js";
import DataDefaultMaps from './DataDefaultMaps.js';

export default class AppStorage {
  static prefixIgoreKeys = [
    AppConstants.localStorageSettingsKey,
    AppConstants.sessionStorageSettingsKey
  ];
  //
  // # Outline of what should happen with 'sessionStorage' and 'localStorage':
  //
  // 1. AppSettings are loaded in from 'localStorage' which contains both the 'storageNames' and 'storageIndex' settings.
  //     defaultAppSettings: {
  //       gridRepeatRangeValue: 0,
  //       storageNames: ['error'], // camelCase or snake_case.
  //       storageIndex: 0
  //     }
  // 2. If 'sessionStorage' is not present, set 'sessionStorage' from 'localStorage'.
  // 3. Use updated value to set the 'AppSettings.storageIndex' setting.
  // 4. When switching storage, update 'sessionStorage' and 'localStorage'.
  // 5. When creating or deleting storage, update 'sessionStorage' and 'localStorage' and notify other tabs.
  //
  static getSessionStorageIndex(
    localStorageIndex
  ) {
    const sessionStorageKey = AppConstants.sessionStorageSettingsKey;

    const currentSessionStorageIndex = sessionStorage.getItem(sessionStorageKey);
    let returnIndex = 0;

    if (currentSessionStorageIndex === null) {
      returnIndex = localStorageIndex; // int
      sessionStorage.setItem(sessionStorageKey, localStorageIndex);
    } else {
      returnIndex = parseInt(currentSessionStorageIndex, 10);
    }

    return returnIndex || 0;
  }

  static updateSessionStorageIndex(
    newStorageIndex
  ) {
    const sessionStorageKey = AppConstants.sessionStorageSettingsKey;
    sessionStorage.setItem(sessionStorageKey, newStorageIndex);
  }

  static deleteSessionStorageIndex() {
    const sessionStorageKey = AppConstants.sessionStorageSettingsKey;
    sessionStorage.removeItem(sessionStorageKey);
  }

  static prefixKeyName(key = '') {
    return AppStorage.prefixIgoreKeys.includes(key)
          ? key
          : `${AppConstants.clumpListPrefix}${key}`;
  }

  // Remove from local storage.
  static appStorageRemoveItem(key) {
    const keyToRemove = AppStorage.prefixKeyName(key);
    localStorage.removeItem(keyToRemove);
    localStorage.removeItem(`${keyToRemove}_backup`);
  }

  // Check if the key exists in local storage.
  static appStorageCheckItemExists(key) {
    //
    // Check if the key is valid.
    if (!key.match(AppConstants.keyNamePattern)) {
      throw new Error(`[AppStorage] Invalid key: ${key}`);
    }
    const keyToGet = AppStorage.prefixKeyName(key);
    // Check if the key exists in local storage.
    return localStorage.getItem(keyToGet) !== null;
  }

  // Store the settings in local storage.
  // Backups are created for existing clumpLists.
  static appStorageSetItem(key, value, isBackup = false) {
    //
    const prefixedKey = AppStorage.prefixKeyName(key);
    // Check if the key is valid.
    if (!key.match(AppConstants.keyNamePattern)) {
      throw new Error(`[AppStorage] Invalid key: ${key}`);
    }
    // Check if the value is valid.
    if (typeof value !== 'string') {
      throw new Error(`[AppStorage] Invalid value: ${value}`);
    }
    if (isBackup) {
      // If the key exists, create a backup.
      const existingValue = localStorage.getItem(prefixedKey);
      if (existingValue !== null) {
        localStorage.setItem(`${prefixedKey}_backup`, existingValue);
      }
    }
    // Store the new value.
    localStorage.setItem(
      prefixedKey,
      value
    );
  }

  // Retrieve the settings from local storage.
  static appStorageGetItem(key) {
    // Clump list prefix check:
    //   If 'key' is not in the ignore list (is a clumpList) and exists
    //   in localStorage, then it will need to be renamed with a prefix.
    //   This will not show in the UI, only in DevTools.
    if (!AppStorage.prefixIgoreKeys.includes(key) && localStorage.getItem(key) !== null) {
      const prefixedKey = AppStorage.prefixKeyName(key);
      AppStorage._renameKey(key, prefixedKey);
      // Also rename '_backup' key (if it exists).
      const backupKeyOld = `${key}_backup`;
      const backupKeyNew = `${prefixedKey}_backup`;
      if (localStorage.getItem(backupKeyOld) !== null) {
        AppStorage._renameKey(backupKeyOld, backupKeyNew);
      }
      return localStorage.getItem(prefixedKey);
    }
    return localStorage.getItem(AppStorage.prefixKeyName(key));
  }

  // Example usage:
  // AppStorage.renameLocalStorageKey('oldKeyName', 'newKeyName');
  static renameLocalStorageKey(oldKey, newKey) {
    if (oldKey === newKey) {
      return; // No need to rename if keys are the same
    }

    const oldKeyToUse = AppStorage.prefixKeyName(oldKey);
    const newKeyToUse = AppStorage.prefixKeyName(newKey);

    // Rename the key in local storage.
    AppStorage._renameKey(oldKeyToUse, newKeyToUse);

    // Also rename '_backup' key (if it exists).
    const backupKeyOld = `${oldKeyToUse}_backup`;
    const backupKeyNew = `${newKeyToUse}_backup`;
    AppStorage._renameKey(backupKeyOld, backupKeyNew);
  }

  static _renameKey(oldKeyName, newKeyName) {
    const data = localStorage.getItem(oldKeyName);
    if (data !== null) {
      localStorage.setItem(newKeyName, data);
      localStorage.removeItem(oldKeyName);
    }
  }

  static getJsonSettingsFromStorageOrDefaults() {
    const defaultSettings = DataDefaultMaps.dataDefaultMap().defaultAppSettings;

    const dataFromStorage = AppStorage.appStorageGetItem(AppConstants.localStorageSettingsKey);
    const dataFromDefaults = JSON.stringify(defaultSettings);
    const parsedData = JSON.parse(dataFromStorage || dataFromDefaults);

    // @TODO: Convert these into a 'newProps' factory.
    // The 'appSettingsInfo.showIds' property may not exist (added 2025-03).
    if (!parsedData.hasOwnProperty('showIds')) {
      parsedData.showIds = defaultSettings.showIds;
    }
    // The 'appSettingsInfo.exportReminderValue' property may not exist (added 2025-04).
    if (!parsedData.hasOwnProperty('exportReminderValue')) {
      parsedData.exportReminderValue = defaultSettings.exportReminderValue;
    }
    // The 'appSettingsInfo.exportReminderCounter' property may not exist (added 2025-04).
    if (!parsedData.hasOwnProperty('exportReminderCounter')) {
      // {} => { 'flowName1': 0, 'flow_name2': 0, ... }
      parsedData.exportReminderCounter = defaultSettings.exportReminderCounter;
    }

    return parsedData;
  }
}
