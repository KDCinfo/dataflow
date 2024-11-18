import { dataDefaultApp, dataDefaultError } from './dataDefaultApp.js';

export default class AppData {
  // Default settings for the app.
  static debugPrintClumpMatrix = false;
  static debugConsoleLogs = true;

  // DATA: [editingIndex] Updated when edited a clump, and reset when clump is saved.
  editingIndex; // = null;  // Track if we’re editing an existing clump

  // DATA: [lastAddedCol] The last column that a clump was added to.
  lastAddedCol; // = 1;

  // DATA: [lastAddedClumpId] Unlinked clumps are placed under the last clump that was added,
  //                          unless a specific Col is selected from the 'linkTo' dropdown.
  // Unsure that it matters, but for now, IDs are always incremented, and
  // are never reused within the 'clumpMatrix' array. Ergo, IDs should
  // always be in order, even when a hole is left from a deletion.
  lastAddedClumpId; // = 0;

  // DATA: [localStorageKeyForClumps] Local storage key used to store and retrieve clumps.
  localStorageKeyForClumps; // = storageNames[settings.storageIndex] || 'dataMappingFlowClumps';

  // DATA: [clumpList] A 1D list of data clumps are stored in the browser's local storage.
  // The clumpMatrix, below, is used to render the clumps in their correct 2D positions.
  clumpList; // = JSON.parse(localStorage.getItem(localStorageKeyForClumps) || '[]');

  // DATA: [clumpMatrix] A 2D array to keep track of clump ID cell placement, empty
  //                     cells, and matrix width (rows) and height (cols) detection.
  //
  // This is primarily to keep track of where empty slots need to be.
  // But it is also used to determine the last column and row
  //   and to identify cells that need shifting up or down when a clump is deleted or added
  //   (rows and columns are padded with empty cells to keep the matrix even-sided).
  //
  // IDs are >= 1, so we can use 0 to represent empty slots.
  //
  // In this example, clump ID 3 is linked to clump ID 2,
  //   and clump ID 5 is linked to clump ID 4.
  //
  // const clumpMatrix = [
  //   [1, 2, 0], // Column 1
  //   [0, 3, 4], // Column 2
  //   [0, 0, 5] // Column 3
  // ];
  //
  // This hurts my head, let's flip it.
  //
  // const clumpMatrix = [
  //   #1 #2 #3   // Columns
  //   [1, 0, 0], // Row 1 | When 1-non-link is added, nothing happens.
  //   [2, 3, 0], // Row 2 | When 2-non-link is added, nothing happens.
  //                       | When 3-linked is added, Rows < 2 will pad a 0 in Column 2.
  //   [0, 4, 5]  // Row 3 | When 4-non-link is added, Row 3 will pad a 0 in Cols < 2.
  //              //       | When 5-linked is added, Rows < 3 will pad a 0 in Column 3.
  // ];
  //
  //  A more detailed example:
  //
  //  C1R1 |  0    |  0
  //  C1R2 |  0    |  0
  //  C1R3 |< C2R1 |  0
  //  0    |  C2R2 |< C3R1
  //  0    |  0    |  C3R2
  //  0    |  C2R3 |  0
  //  0    |  C2R4 |< C3R3
  //  0    |  0    |  C3R4
  //  0    |  0    |  C3R5
  //  0    |  C2R5 |  0
  //  C1R4 |< C2R6 |< C3R6
  //  0    |  C2R7 |< C3R7
  //  0    |  0    |  C3R8
  //  C1R5 |  0    |  0
  //
  clumpMatrix; // = [];

  // A localized copy of the settings from storage, maintained in 'AppSettings'
  // and pushed down when updated via the 'appSettings' setter.
  #appSettings;

  constructor(settings = dataDefaultApp.defaultAppSettings) {
    this.appSettings = settings;

    this.storageNameErrorText = '';

    this.editingIndex = dataDefaultApp.editingIndex; // null;
    this.lastAddedCol = dataDefaultApp.lastAddedCol; // 1;
    this.lastAddedClumpId = dataDefaultApp.lastAddedClumpId; // 0;

    // The 'active storage key' is passed in from settings retrieved from local storage in 'AppSettings'.
    this.localStorageKeyForClumps = this.getStorageNameFromSettings();

    // The clumpList is parsed from local storage using the 'active storage key' that was just set.
    // this.clumpList = this.parseClumpListFromStorage();
    this.setClumpListFromStorageUsingKeyFromSettings();
    this.clumpMatrix = [...dataDefaultApp.clumpMatrix]; // [];
  }

  getStorageNameFromSettings() {
    return this.#appSettings.storageNames[this.#appSettings.storageIndex] || 'dataFlowFallbackKey';
  }

  setClumpListFromStorageUsingKeyFromSettings() {
    this.clumpList = this.parseClumpListFromStorage();
  }

  parseClumpListFromStorage() {
    return JSON.parse(localStorage.getItem(this.localStorageKeyForClumps) || '[]');
  }

  // Setter for appSettings.
  set appSettings(newSettings) {
    this.#appSettings = newSettings;
  }

  // getData(key) {
  //   if (key in this) {
  //     return this[key];
  //   }
  //   return dataDefaultError[key];
  // }

  // setData(key, value) {
  //   if (key in this) {
  //     this[key] = value;
  //     return true;
  //   }
  //   return false;
  // }

  // async fetchData(url) {
  //   const response = await fetch(url);
  //   this.data = await response.json();
  // }
}
