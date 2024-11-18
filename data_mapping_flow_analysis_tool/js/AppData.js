import dataDefault from './dataDefault.js';
import dataError from './dataError.js';

export default class AppData {
  // Default settings for the app.
  static debugPrintClumpMatrix = false;
  static debugConsoleLogs = true;

  // DATA: [editingIndex] Updated when edited a clump, and reset when clump is saved.
  editingIndex; // = null;  // Track if we’re editing an existing clump

  // DATA: [localStorageKeyForClumps] Local storage key used to store and retrieve clumps.
  localStorageKeyForClumps; // = settingsStorageNames[settings.storageIndex] || 'dataMappingFlowClumps';

  // DATA: [clumps] A list of data clumps are stored in the browser's local storage.
  clumpList; // = JSON.parse(localStorage.getItem(localStorageKeyForClumps) || '[]');

  // DATA: [clumpMatrix] A 2D array to keep track of clump ID cell placement, empty
  clumpMatrix; // = [];

  // DATA: [lastAddedCol] The last column that a clump was added to.
  lastAddedCol; // = 1;

  // DATA: [lastAddedClumpId] Unlinked clumps are placed under the last clump that was added,
  lastAddedClumpId; // = 0;

  constructor(
    initialData = dataDefault,
    settings = appSettings
  ) {
    this.storageNameErrorText = ``;

    this.editingIndex = initialData.editingIndex; // null;
    this.lastAddedCol = initialData.lastAddedCol; // 1;
    this.lastAddedClumpId = initialData.lastAddedClumpId; // 0;

    this.localStorageKeyForClumps = settings.settingsStorageNames[settings.storageIndex] || 'dataMappingFlowClumps';

    this.clumpList = this.parseClumpListFromStorage();
    this.clumpMatrix = initialData.clumpMatrix; // [];
  }

  parseClumpListFromStorage() {
    return JSON.parse(localStorage.getItem(this.localStorageKeyForClumps) || '[]');
  }

  getData(key) {
    if (key in this) {
      return this[key];
    }
    return dataError[key];
  }

  setData(key, value) {
    if (key in this) {
      this[key] = value;
      return true;
    }
    return false;
  }

  // async fetchData(url) {
  //   const response = await fetch(url);
  //   this.data = await response.json();
  // }
}
