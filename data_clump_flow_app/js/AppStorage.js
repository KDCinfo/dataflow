import AppConstants from "./AppConstants.js";

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
  }

  // Store the settings in local storage.
  static appStorageSetItem(key, value) {
    localStorage.setItem(
      key,
      value
    );
  }

  // Retrieve the settings from local storage.
  static appStorageGetItem(key) {
    return localStorage.getItem(key);
  }
}
