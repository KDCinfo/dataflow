import AppConstants from "./AppConstants.js";
import DataDefaultMaps from './DataDefaultMaps.js';

export default class AppStorage {
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

  // Remove from local storage.
  static appStorageRemoveItem(key) {
    localStorage.removeItem(key);
    localStorage.removeItem(`${key}_backup`);
  }

  // Check if the key exists in local storage.
  static appStorageCheckItemExists(key) {
    //
    // Check if the key is valid.
    if (!key.match(AppConstants.keyNamePattern)) {
      throw new Error(`[AppStorage] Invalid key: ${key}`);
    }
    // Check if the key exists in local storage.
    return localStorage.getItem(key) !== null;
  }

  // Store the settings in local storage.
  // Backups are created for existing clumpLists.
  static appStorageSetItem(key, value, isBackup = false) {
    //
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
      const existingValue = localStorage.getItem(key);
      if (existingValue !== null) {
        localStorage.setItem(`${key}_backup`, existingValue);
      }
    }
    // Store the new value.
    localStorage.setItem(
      key,
      value
    );
  }

  // Retrieve the settings from local storage.
  static appStorageGetItem(key) {
    return localStorage.getItem(key);
  }


  static getJsonSettingsFromStorageOrDefaults() {
    const dataFromStorage = AppStorage.appStorageGetItem(AppConstants.localStorageSettingsKey);
    const dataFromDefaults = JSON.stringify(DataDefaultMaps.dataDefaultMap().defaultAppSettings);
    const parsedData = JSON.parse(dataFromStorage || dataFromDefaults);

    // The 'appSettingsInfo.showIds' property may not exist (added 2025-03).
    if (!parsedData.hasOwnProperty('showIds')) {
      parsedData.showIds = false;
    }

    return parsedData;
  }
}
