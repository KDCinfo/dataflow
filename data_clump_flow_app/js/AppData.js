import AppConfig from './AppConfig.js';
import AppHelpers from './AppHelper.js';
import AppStorage from './AppStorage.js';
import ClumpInfo from './ClumpInfo.js';
import DataDefaultMaps from './DataDefaultMaps.js';

export default class AppData {
  // DATA: [editingIndex] Updated when edited a clump, and reset when clump is saved.
  editingIndex; // = null;  // Track if we’re editing an existing clump

  // DATA: [lastAddedCol] The last column that a clump was added to.
  lastAddedCol; // = 1;

  // DATA: [lastAddedClumpId] Unlinked clumps are placed under the last clump that was added,
  //                          unless a specific Col is selected from the 'linkToId' dropdown.
  // Unsure that it matters, but for now, IDs are always incremented, and
  // are never reused within the 'clumpMatrix' array. Ergo, IDs should
  // always be in order, even when a hole is left from a deletion.
  lastAddedClumpId; // = 0;
  highestClumpId; // = 0;

  // DATA: [clumpList] A 1D list of data clumps are stored in the browser's local storage.
  // The clumpMatrix, below, is used to render the clumps in their correct 2D positions.
  clumpList; // = JSON.parse(localStorage.getItem(localStorageKeyForClumps()) || '[]');

  // In [AppSettings.js] where:
  //   storageName === this.appSettingsInfo.storageNames.forEach((storageName) => { ...
  clumpExportList; // []

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
  //   #1 #2 #3   // Columns
  //   [1, 0, 0], // Row 1 | When 1: A non-link is added, nothing happens.
  //   [2, 3, 0], // Row 2 | When 2: A non-link is added, nothing happens.
  //                       | When 3: A link is added, Rows < 2 will pad a 0 in Column 2.
  //   [0, 4, 5]  // Row 3 | When 4: A non-link is added, Row 3 will pad a 0 in Cols < 2.
  //               /       | When 5: A link is added, Rows < 3 will pad a 0 in Column 3.
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
  // # Notes on links:
  //
  // The only clump that is not linked is the first clump in the 'clumpList'.
  // All the other cells will have an ID for either 'linkedToLeft' or 'linkedToAbove' (column).
  // The first clump cannot be deleted and its ID is always 1. Its properties are:
  // - id: 1 // dataManager.getData('lastAddedClumpId') + 1 // lastAddedClumpId: 0,
  // - linkedToAbove: -1
  // - linkedToLeft: -1
  //
  clumpMatrix; // = [];

  // Find a clump's column directly given its ID.
  // This is created when adding clumps to the matrix.
  clumpColumnMap; // = Map: {id: 1, column: 1}

  clumpListConverted; // = false

  // A localized copy of the settings from storage, maintained in 'AppSettings'
  // and pushed down when updated via the 'appSettings' setter.
  #appSettingsInfo;

  constructor(settings = DataDefaultMaps.dataDefaultMap().defaultAppSettings) {
    // A '#' is used to denote private variables in JavaScript.
    this.#appSettingsInfo = settings;

    this.storageNameErrorText = '';

    this.editingIndex = DataDefaultMaps.dataDefaultMap().editingIndex; // null;
    this.lastAddedCol = DataDefaultMaps.dataDefaultMap().lastAddedCol; // 1;
    this.lastAddedClumpId = DataDefaultMaps.dataDefaultMap().lastAddedClumpId; // 0;
    this.highestClumpId = DataDefaultMaps.dataDefaultMap().highestClumpId; // 0;

    // The clumpList is parsed from local storage using the 'active storage key' from 'appSettingsInfo'.
    this.clumpList = [];
    this.setClumpList();

    // Initialize an empty list for the 'Export All' functionality.
    this.clumpExportList = [];

    this.clumpMatrix = [...DataDefaultMaps.dataDefaultMap().clumpMatrix]; // [];

    this.clumpColumnMap = new Map(); // {id: 1, column: 1};
    this.clumpListConverted = false;

    // Initialize the 'clumpMatrix' with the clumps from local storage.
    this.addClumpsToMatrix();
  }

  // Setter for appSettings called from parent ('AppSettings').
  updateAppSettingsInfo(newSettings) {
    this.#appSettingsInfo = newSettings;
  }

  getData(key) {
    if (key in this) {
      return this[key];
    }
    // throw new Error(`[AppData] Invalid key: ${key}`);
    return DataDefaultMaps.dataDefaultErrorMap()[key];
  }

  setData(keyToSet, newValue) {
    if (!(keyToSet in this)) {
      throw new Error(`[AppData] Invalid key: ${keyToSet}`);
    }
    const arrayOfIntKeys = AppHelpers.listOfKeysWithInts();
    if (keyToSet in arrayOfIntKeys && typeof newValue !== 'number') {
      throw new Error(`[AppData] This clump key [${keyToSet}] must be a number.`);
    }
    this[keyToSet] = newValue;
    return true;
  }

  localStorageKeyForClumps() {
    return this.#appSettingsInfo.storageNames[this.#appSettingsInfo.storageIndex] || 'dataClumpFlowAppFallbackKey';
  }

  // This is run on initial load, when changing storage, or when importing data.
  setClumpList(newClumpList = this.parseClumpListFromStorage()) {
    this.clumpList.length = 0;
    this.clumpList = [...newClumpList];
  }
  parseClumpListFromStorage(localStorageKeyForClumps = this.localStorageKeyForClumps()) {
    return JSON.parse(localStorage.getItem(localStorageKeyForClumps) || '[]');

    // The below prematurely converts the clumps to have the new 'linkedTo' properties, but
    // sets them all to -1. When not converting here, the conversion in 'addClumpToMatrix' works.
    //
    // const jsonClumps = JSON.parse(localStorage.getItem(localStorageKeyForClumps) || '[]');
    // const clumpInfoClumps = jsonClumps.map((clump) => ClumpInfo.jsonToClumpInfo(clump));
    // return clumpInfoClumps;
  }

  // This will set both the 'lastAddedClumpId' and 'lastAddedCol'.
  // - The 'lastAddedClumpId' should only be changed when a clump is added,
  //   or more generally on initial load, when a new list is loaded such as when changing
  //   storage or importing data, or when a clump is deleted (if said clump was the last added).
  // - The 'lastAddedCol' is then set to the column of the last added clump ID.
  setLastAdded() {
    // If a 'lastAddedClumpId' is set, use it.
    // If not, use the last clump in the list
    //   (which would be the last cell added to the clumpMatrix).
    this.lastAddedClumpId =
        this.lastAddedClumpId > 0
            ? this.lastAddedClumpId
            : this.clumpList.length > 0
                ? this.clumpList[this.clumpList.length - 1].id
                : 0;
    AppConfig.debugConsoleLogs && console.log('*** [AppData] [Last Added Clump ID]', this.lastAddedClumpId);

    // Get the column from the last added clump ID.
    const lastAddedClumpColumn = this.clumpColumnMap.get(this.lastAddedClumpId) || this.lastAddedCol;
    AppConfig.debugConsoleLogs && console.log('*** [AppData] [Last Added Clump Column]', lastAddedClumpColumn);

    this.lastAddedCol = lastAddedClumpColumn;
  }

  getClumpAboveId(oldClumpId, oldClumpColumn, oldClumpLinkTo, index, columnTracker) {
    // When converting a legacy clumpInfo object, we need to convert the 'column' property.
    //
    // Both 'linkedTo' and 'linkedClumpID' represent an ID.
    // 'column' needs to be converted to its parent's ID.
    // If a parent ID is not found, throw an error.
    //
    // If 'linkedToLeft' > 0, then 'linkedToAbove' is 'AppConstants.defaultClumpValues.linkedToAbove'.
    // Else, we need to find the cell's 'above' linked ID from this.clumpMatrix based on the given 'column'.
    // How do we find that ID?
    // Here is how 'addClumpToMatrix' generates the 2D array:
    //
    // Always flowing either top-down or top-right,
    //   here are a couple xample clumpLists - they can diverge
    //   or continue at any intersection of 'linkedToLeft':
    // [C1R1, C1R2, C1R3, C2R1, C2R2, C3R1, C3R2, C2R3, C2R4, C3R3, C3R4, C3R5, C2R5, ...]
    // [C1R1, C1R2, C1R3, C1R4, C1R5, C2R1, C2R2, C2R3, C2R4, C2R5, C3R1, C3R2, C3R3, C3R4, C3R5, ...]
    //
    //  C1R1 |  0    |  0
    //  C1R2 |  0    |  0
    //  C1R3 |< C2R1 |  0
    //  0    |  C2R2 |< C3R1
    //  0    |  0    |  C3R2
    //  0    |  C2R3 |  0
    //  0    |  C2R4 |< C3R3
    //  0    |  0    |  C3R4
    //
    // index === 0 ? -1 // linkedToAbove is always -1 for first cell (it can't be linked).
    // The 2nd cell would be C1R2, which would need to be linked to C1R1 (which is an ID).
    // The 3rd cell would be C1R3, which would be linked to C1R2.
    // The 4th cell could be either C1R4 or C2R1.
    // If the 4th cell is C2R1, that cell's 'linkedToAbove' would be -1.
    // If the 4th cell is C1R4, that cell's 'linkedToAbove' would be the ID in C1R3.
    //
    let clumpColumnAboveId;

    if (index === 0) {
      clumpColumnAboveId = -1;
      // You can only be linked to the last cell in a specific column.
      columnTracker.set(oldClumpColumn, oldClumpId);
    } else if (oldClumpLinkTo > 0) {
      AppConfig.debugConsoleLogs && console.log('*** [AppData] [columnTracker] [else if A]:', columnTracker);
      clumpColumnAboveId = -1;
      const linkedIdColumnPlusOne = this.clumpColumnMap.get(oldClumpLinkTo) + 1;
      columnTracker.set(linkedIdColumnPlusOne, oldClumpId);
      AppConfig.debugConsoleLogs && console.log('*** [AppData] [columnTracker] [else if B]:', columnTracker);
    } else {
      // We need the ID of the last cell placed in this same column.
      AppConfig.debugConsoleLogs && console.log('*** [AppData] [columnTracker] [else A]:', columnTracker);
      clumpColumnAboveId = columnTracker.get(oldClumpColumn);
      if (clumpColumnAboveId === undefined) {
        throw new Error(`*** [AppData] Error: No matching column ID for ${oldClumpColumn}.`);
      }
      columnTracker.set(oldClumpColumn, oldClumpId);
      AppConfig.debugConsoleLogs && console.log('*** [AppData] [columnTracker] [else B]:', columnTracker);
    }
    return clumpColumnAboveId;
  }

  // This method is called from 'addClumpsToMatrix', after the 'clumpList' is set and the
  //   'clumpMatrix' is generated. It cannot be run earlier because an ID for the older
  //   'column' property cannot be known until after the 'clumpMatrix' is generated.
  convertClumpList() {
    // old: column        | new: linkedToAbove
    // old: linkedTo      | new: linkedToLeft
    // old: linkedClumpID | new: linkedToLeft

    // console.log('*** [AppData] [Clump Before]', newClumpList);
    // const convertedList = this.checkAndConvertClumps(newClumpList);
    // console.log('*** [AppData] [Clump After]', convertedList);

    let checkClumpList = [];

    if (this.clumpList.length > 0) {
      if (this.clumpList[0].hasOwnProperty('column')) {
        AppConfig.debugConsoleLogs && console.log('*** [AppData] Converting clumps...');
        try {
          // const columnTracker = [];
          const columnTracker = new Map(); // {column, id}

          if (this.clumpList[0].hasOwnProperty('linkedTo')) {
            checkClumpList = this.clumpList.map((oldClump, index) => {

              let clumpColumnAboveId = this.getClumpAboveId(
                oldClump.id,
                oldClump.column,
                oldClump.linkedTo,
                index,
                columnTracker
              );

              return {
                id: oldClump.id,
                clumpName: oldClump.clumpName,
                clumpCode: oldClump.clumpCode,
                linkedToLeft: oldClump.linkedTo,
                linkedToAbove: clumpColumnAboveId
                // linkedToAbove: oldClump.column, // @NOTE: This is a column, not an ID.
              };
            });
            AppConfig.debugConsoleLogs && console.log('*** [AppData] [checkClumpList] [SUCCESS] [linkedTo]:', checkClumpList);

          } else if (this.clumpList[0].hasOwnProperty('linkedClumpID')) {

            checkClumpList = this.clumpList.map((oldClump, index) => {
              let clumpColumnAboveId = this.getClumpAboveId(
                oldClump.id,
                oldClump.column,
                oldClump.linkedClumpID,
                index,
                columnTracker
              );

              return {
                id: oldClump.id,
                clumpName: oldClump.clumpName,
                clumpCode: oldClump.clumpCode,
                linkedToLeft: oldClump.linkedClumpID,
                linkedToAbove: clumpColumnAboveId
                // linkedToAbove: oldClump.column,
              };
            });
            AppConfig.debugConsoleLogs && console.log('*** [AppData] [checkClumpList] [SUCCESS] [linkedClumpID]:', checkClumpList);

          } else {
            console.error('*** [AppData] Ooops.');
            throw new Error('*** [AppData] Error converting clumps: No matching properties.');
          }
        } catch (e) {
          console.error('*** [AppData] [Catch]:', e);
        }

        if (checkClumpList.length > 0) {
          // Replace this.clumpList with the converted list.
          this.clumpList = [...checkClumpList];
        }
      }
    }
  }

  //
  // # Export All
  //
  // This call updates: this.clumpExportList // = [];
  // Storage names are passed in from 'AppSettings.handleExportAllData'.
  // Keeping these separate from the two methods above to keep priorities cleaner.
  setClumpExportList(exportName = '') {
    const newClumpExportList = this.parseClumpExportListFromStorage(exportName);
    this.clumpExportList.length = 0;
    this.clumpExportList = [...newClumpExportList];
  }
  // This function is not refactored with 'parseClumpListFromStorage'
  //   because this function needs to know when the storage is empty,
  //   and cannot be a fallback to 'this.localStorageKeyForClumps()'.
  parseClumpExportListFromStorage(storageNameToGet = '') {
    return JSON.parse(localStorage.getItem(storageNameToGet) || '[]');
  }

  // Backups occur:
  //   - AppSettings: When [adding], [updating], or [deleting] clumps.
  //   - AppSettings: When [deleting] a storage.
  //   - AppData: [After conversion] when adding to matrix.
  //   - AppData: [After importing] data.
  storeClumps(createBackup = true) {
    AppStorage.appStorageSetItem(
      this.localStorageKeyForClumps(),
      JSON.stringify(this.clumpList),
      createBackup
    );
  }

  setColumnInClumpColumnMap(id, column) {
    // Add or replace the column for the provided ID.
    // this.clumpColumnMap = new Map(); // {id: 1, column: 1};
    this.clumpColumnMap.set(id, column);
  }
  removeClumpInClumpColumnMap(id) {
    this.clumpColumnMap.delete(id);
  }
  clearClumpColumnMap() {
    this.clumpColumnMap.clear();
  }
  resetClumpListConverted() {
    this.clumpListConverted = false;
  }

  // Add clumps to the matrix.
  // This function is called on initial load, when importing, changing storage, or deleting a clump,
  // Except within this function itself,
  //   this function should always be preceeded with clearing the conversion flag:
  //   > this.dataManager.resetClumpListConverted();
  addClumpsToMatrix() {
    this.clearClumpColumnMap();
    this.clumpMatrix.length = 0;
    this.clumpList.forEach(clump => {
      this.highestClumpId = clump.id > this.highestClumpId ? clump.id : this.highestClumpId;
      this.addClumpToMatrix(clump);
    });

    // If 'lastAddedClumpId' is not already set, this will set
    // both 'lastAddedClumpId' and 'lastAddedCol' to the last clump in the list.
    this.setLastAdded();

    // Checking the first clump for legacy properties to determine if a conversion is needed.
    if (this.clumpList.length > 0 && this.clumpList[0].hasOwnProperty('column')) {
      if (this.clumpListConverted) {
        AppConfig.debugConsoleLogs && console.log('*** [AppData] Clumps already converted.');
        alert('\nClump conversion has already been run\n\nand appears to require a bit of debugging.\n');

      } else {
        this.clumpListConverted = true;
        alert(`This list of clumps requires a conversion to a new format. Press OK to proceed.`);

        AppConfig.debugConsoleLogs && console.log('*** [AppData] Clumps to be converted.');
        AppConfig.debugConsoleLogs && console.log('*** [AppData] Clump List - Pre:', this.clumpList);
        AppConfig.debugConsoleLogs && console.log('*** [AppData] Clump Matrix - Pre:', this.clumpMatrix);

        this.convertClumpList();
        this.storeClumps();
        AppConfig.debugConsoleLogs && console.log('*** [AppData] CLUMPS NOT STORED!!');
        this.addClumpsToMatrix();

        AppConfig.debugConsoleLogs && console.log('*** [AppData] Clumps converted to new format.');
        AppConfig.debugConsoleLogs && console.log('*** [AppData] Clump List - Post:', this.clumpList);
        AppConfig.debugConsoleLogs && console.log('*** [AppData] Clump Matrix - Post:', this.clumpMatrix);

        alert(`Congratulations! Your clumps have been converted to the new format.`);
      }
    }
  }

  // Helper to extend rows with empty columns as needed.
  addPaddedColumnToMatrix() {
    // clumpMatrix.forEach(row => row.push(0));
    const newMatrix = this.clumpMatrix.map(row => [...row, 0]);
    this.clumpMatrix = [...newMatrix];
  }

  // Helper to add new row filled with zeros.
  addPaddedRowToMatrix() {
    // clumpMatrix.push(Array(getColumnCount()).fill(0));
    const newMatrix = this.clumpMatrix.toSpliced(
      this.getRowCount(),
      0,
      Array(this.getColumnCount()).fill(0)
    );
    this.clumpMatrix = [...newMatrix];
  }

  // Function to immutably update clumpMatrix.
  updateClumpMatrix(linkedRowIndex, linkedCol, id) {
    return this.clumpMatrix.map((row, rowIndex) =>
      rowIndex === linkedRowIndex
        ? [...row.slice(0, linkedCol), id, ...row.slice(linkedCol + 1)]
        : row
    );
  }

  // Helper function to get the largest row number from the clumps array.
  getRowCount() {
    return this.clumpMatrix.length;
  }

  // Helper function to get length of first row in clumpMatrix if clumpMatrix has a row.
  getColumnCount() {
    return this.clumpMatrix.length > 0 ? this.clumpMatrix[0].length : 1;
  }

  // We only need tails when editing a cell.
  cellIdToRight = (clumpId) => {
    // Because this is called prior to any legacy conversions,
    // we need to check for legacy properties.
    const clump = this.getData('clumpList').find(clump => clump.id === clumpId);

    if (clump === undefined) {
      console.error('*** [AppData] Error: No matching clump found.');
      return -1;
    } else if (clump.hasOwnProperty('linkedTo')) {
      return this.getData('clumpList').find(clump => clump.linkedTo === clumpId)?.id || -1;
    } else if (clump.hasOwnProperty('linkedClumpID')) {
      return this.getData('clumpList').find(clump => clump.linkedClumpID === clumpId)?.id || -1;
    } else {
      return this.getData('clumpList').find(clump => clump.linkedToLeft === clumpId)?.id || -1;
    }
  };

  // Helper function to recursively collect all descendant clump IDs.
  // For a 'below tail', if a clump is directly below the root, include it.
  // > const subtreeBelowTail = collectSubtreeIdsBelow(movedClumpId);
  collectSubtreeIdsBelow = (rootId) => {
    let idsBelow = [];

    if (this.getData('clumpList').find(clump => clump.id === rootId).hasOwnProperty('column')) {
      // Get all cells [below and to the right] of the 'rootId' in 'clumpMatrix'.
      const currentClumpMatrix = this.getData('clumpMatrix');
      const rootIdRowIndex = currentClumpMatrix.findIndex(row => row.includes(rootId));
      const rootIdColIndex = currentClumpMatrix[rootIdRowIndex].indexOf(rootId);
      currentClumpMatrix.forEach((row, rowIndex) => {
        if (rowIndex > rootIdRowIndex) {
          for (let i = rootIdColIndex; i < row.length; i++) {
            if (row[i] !== 0) {
              idsBelow.push(row[i]);
            }
          }
        }
      });
      AppConfig.debugConsoleLogs && console.log('[AppSettings] [idsBelow]', idsBelow);

    } else {
      this.getData('clumpList').forEach(clump => {
        if (clump.linkedToAbove === rootId || clump.linkedToLeft === rootId) {
          const childIds = this.collectSubtreeIdsBelow(clump.id);
          idsBelow.push(clump.id, ...childIds);
          AppConfig.debugConsoleLogs && console.log('[AppSettings] [idsBelow]', idsBelow);
        }
      });
    }
    return idsBelow;
  };

  // For a 'right tail': If a clump is being linked to from the right, use
  //   that cell to the right as the rootId. Any clumps directly below
  //   the root, or to the right of those below, will be included.
  // > const subtreeRightFullTail = collectSubtreeIdsFullTail(rightClumpId);
  collectSubtreeIdsFullTail = (linkedToId) => {
    let ids = [];
    this.getData('clumpList').forEach(clump => {
      if (clump.linkedToLeft === linkedToId || clump.linkedToAbove === linkedToId) {
        ids.push(clump.id);
        ids = ids.concat(this.collectSubtreeIdsFullTail(clump.id));
        AppConfig.debugConsoleLogs && console.log('[AppSettings] [ids]', ids);
      }
    });
    return ids;
  };

  // const clumpMatrix = [
  //   #1 #2 #3   // Columns
  //   [1, 0, 0], // Row 1 | When 1: A non-link is added, nothing happens.
  //   [2, 3, 0], // Row 2 | When 2: A non-link is added, nothing happens.
  //                       | When 3: A link is added, Rows < 2 will pad a 0 in Column 2.
  //   [0, 4, 5]  // Row 3 | When 4: A non-link is added, Row 3 will pad a 0 in Cols < 2.
  //               /       | When 5: A link is added, Rows < 3 will pad a 0 in Column 3.
  // ];
  // Returns the last ID for a column by iterating through the rows
  // from bottom to top looking for a non-zero ID for the provided column.
  lastIdFromColumn(columnValue) {
    let lastId = -1;
    for (let r = this.getRowCount(); r > 0; r--) {
      if (this.clumpMatrix[r - 1][columnValue - 1] !== 0) {
        lastId = this.clumpMatrix[r - 1][columnValue - 1];
        break;
      }
    }
    return lastId;
  }

  // Helper to insert a new row filled with zeros at a specific index.
  insertPaddedRowToMatrix(index) {
    // The splice will insert a new row at the specified index.
    // The 2nd parameter (0) specifies that no rows will be removed.
    const newMatrix = this.clumpMatrix.toSpliced(index, 0, Array(this.getColumnCount()).fill(0));
    this.clumpMatrix = [...newMatrix];
  }

  importAppData(
    importedClumps,
    updatedEditingIndex,
    updatedLastAddedCol,
    updatedLastAddedClumpId,
    updatedHighestClumpId
  ) {
    // Update and store clumps.
    this.setClumpList(importedClumps);
    this.storeClumps();

    // Update data.
    this.editingIndex = updatedEditingIndex;
    this.lastAddedCol = updatedLastAddedCol;
    this.lastAddedClumpId = updatedLastAddedClumpId;
    this.highestClumpId = updatedHighestClumpId;

    // Clear matrix and re-add all clumps.
    this.resetClumpListConverted();
    this.addClumpsToMatrix();
  }

  // async fetchData(url) {
  //   const response = await fetch(url);
  //   this.data = await response.json();
  // }

  // 'linkToId' = Existing clump ID to link to:
  //            Its Col and Row can be found via the clumpMatrix.
  // const linkToId = document.getElementById('linkToId');
  //
  // [clumps] A list of data clumps are stored in the browser's local storage. Clumps
  //          contain the data for each clump, and an ID for placement and linking. The
  //          clumpMatrix, below, is used to render the clumps in their correct positions.
  // const clumps = [];
  //
  // [clumpMatrix] A 2D array to keep track of clump ID cell placement, empty
  //               cells, and matrix width (rows) and height (cols) detection.
  // const clumpMatrix = [];
  //
  // const newClump = {
  //     id: newClumpID,
  //     clumpName: clumpNameInput.value,
  //     clumpCode: clumpCodeInput.value,
  //     column: -1, // >=1
  //     linkedClumpID: -1, // >=1
  //   };
  //
  //  C1R1 = Col 1, Row 1
  //  ---- - ----- - -----
  //  Col1 |  Col2 |  Col3
  //  ---- - ----- - -----
  //  C1R1 |    0  |    0  | Row 1
  //  C1R2 |    0  |    0  | Row 2
  //  C1R3 |< C2R1 |    0  | Row 3
  //    0  |  C2R2 |< C3R1 | Row 4
  //    0  |    0  |  C3R2 | Row 5
  //    0  |  C2R3 |    0  | Row 6
  //    0  |  C2R4 |< C3R3 | Row 7
  //    0  |    0  |  C3R4 | Row 8
  //    0  |    0  |  C3R5 | Row 9
  //    0  |  C2R5 |    0  | Row 10
  //  C1R4 |< C2R6 |    0  | Row 11
  //    0  |  C2R7 |< C3R6 | Row 12
  //    0  |    0  |  C3R7 | Row 13
  //  C1R5 |    0  |    0  | Row 14
  //
  addClumpToMatrix(newClump) {
    AppConfig.debugConsoleLogs && console.log('*** [AppData] [New Clump]', newClump);
    AppConfig.debugConsoleLogs && console.log('*** [AppData] [clumpMatrix] [pre]', this.clumpMatrix);
    AppConfig.debugConsoleLogs && console.log('*** [AppData] [clumpColumnMap]', this.clumpColumnMap);

    const rowCount = this.getRowCount();
    const colCount = this.getColumnCount();
    AppConfig.debugConsoleLogs && console.log('*** [AppData] [Row Count]', rowCount);
    AppConfig.debugConsoleLogs && console.log('*** [AppData] [Col Count]', colCount);

    // old: column        | new: linkedToAbove
    // old: linkedTo      | new: linkedToLeft
    // old: linkedClumpID | new: linkedToLeft
    // const { id, linkedTo, column } = newClump;
    // const { id, linkedClumpID, column } = newClump;
    // const { id, linkedToLeft, linkedToAbove } = newClump;
    const id = newClump.id;
    let linkedToLeft;
    let linkedToAbove;
    if (newClump.hasOwnProperty('column')) {
      // Get last cell in column.
      linkedToAbove = this.lastIdFromColumn(newClump.column);

      if (newClump.hasOwnProperty('linkedTo')) {
        linkedToLeft = newClump.linkedTo;
      } else if (newClump.hasOwnProperty('linkedClumpID')) {
        linkedToLeft = newClump.linkedClumpID;
      } else {
        // This is a hard crash because, why are we here?
        throw new Error('*** [AppData] Error: No matching legacy column-related properties.');
      }
    } else {
      // At this point we should be able to assume the
      // current 'clumpInfo' object should have the most recent properties.
      linkedToLeft = newClump.linkedToLeft;
      linkedToAbove = newClump.linkedToAbove;
    }

    // We can determine a cell's column using
    //     'linkedToLeft', 'linkedToAbove', and 'this.clumpColumnMap'.
    // - The first cell is the only cell with -1, -1, and it will establish the first column.
    // - The other cells can be figured out using 'this.clumpColumnMap' in which we can add +1
    //     to a parent cell for cells with a 'linkedToLeft' >= 1, and use the
    //     parent's same column otherwise, then updating 'this.clumpColumnMap'.
    // This all assumes that 'linkedTo' clumps are already in the matrix,
    //   but for which must be true else they couldn't have been able to be linked to otherwise.
    //
    const columnIsFirst = linkedToLeft === -1 && linkedToAbove === -1;
    const newClumpColumn = columnIsFirst
      ? 1
      : linkedToLeft > 0
          ? this.clumpColumnMap.get(linkedToLeft) + 1
          : this.clumpColumnMap.get(linkedToAbove);

    AppConfig.debugConsoleLogs && console.log('*** [AppData] [New Clump Column]', newClumpColumn);

    this.setColumnInClumpColumnMap(id, newClumpColumn);
    AppConfig.debugConsoleLogs && console.log('*** [AppData] [Clump Column Map]', this.clumpColumnMap);

    // Check if LINKED: 'linkedClumpID' >= 1
    //
    // - LINKED (>= 1):
    //
    //   Check if the 'linkToId' clump's column is the last column.
    //
    // -- Yes:
    //    ~ Push a new column (0) to the end of every row.
    //    ~ Place new clump ID at end of 'linkToId' clump's row (look up in clumpMatrix).
    //
    // -- No:
    //    Because all unlinked clumps (prior to becoming linked) should have empty cells
    //      to their immediate right, and it's not the last column:
    //    ~ Replace 0 in cell to right of the 'linkToId' clump's column (look up in clumpMatrix).
    //
    // - LINKED ABOVE | Legacy: UNLINKED
    //
    //   Check if clumpMatrix last row has a '0' in the new clump's column.
    //
    // -- No:
    //    New clump will be the last cell in the column:
    //      ~ Push a new row to the matrix padded with 0s.
    //      ~ Place the new clump's ID in the preselected column.
    //
    // -- Yes:
    // --- Is the new clump's column the first column (Col 1)?
    //     ~ Push a new 0-padded Row (same length as other rows) to the matrix.
    //     ~ Place the clump's ID in the first cell/column.
    // --- Is the new clump's column the last column?
    //     ~ Find the last non-0 cell/row in the new clump's column and record that row.
    //     ~ Insert a 0-padded row at the recorded row.
    //     ~ Place the clump's ID in the last column.
    // --- Is the new clump's column neither the first nor last (in the middle)?
    //     ~ Find the lowest column to the right of the new clump's column (all cells to the right should not be affected).
    //     ~ Record that 'to-the-right' bottommost row.
    //     ~ Record the new clump's preselected column's bottommost "occupied" (non-0) row.
    //     Is the new clump's bottommost recording greater than the bottommost 'to-the-right' recording?
    // ---- Yes:
    //      ~ Add +1 to the new clump's bottommost recording and record it as the 'rowToAddTo'.
    // ---- No:
    //      ~ Add +1 to the bottommost 'to-the-right' recording and record it as the 'rowToAddTo'.
    //     ~ Insert a 0-padded row at 'rowToAddTo'.
    //     ~ Insert the new clump's ID in the new clump's column.

    if (linkedToLeft >= 1) {
      //
      // [ LINKED ] clump processing
      //
      let linkedCol = -1;
      let linkedRowIndex = -1;

      // Find the linked clump's position.
      linkClumpLoop:
      for (let r = 0; r < rowCount; r++) {
        for (let c = 0; c < colCount; c++) {
          if (this.clumpMatrix[r][c] === linkedToLeft) {
            linkedRowIndex = r;
            linkedCol = c + 1;
            break linkClumpLoop;
          }
        }
      }

      if (linkedCol === -1 || linkedRowIndex === -1) {
        console.error("Linked clump not found in matrix");
        return;
      }

      // Check if the 'linkToId' clump's column is the last column.
      // If so, we need a new column for the new clump.
      // if (linkedCol === colCount - 1) {
      if (linkedCol === colCount) {
        // Case: linked clump is the last column
        this.addPaddedColumnToMatrix();
      } else {
        // Case: linked clump is not the last column
      }

      // clumpMatrix[linkedRowIndex][linkedCol] = id;
      this.clumpMatrix = this.updateClumpMatrix(linkedRowIndex, linkedCol, id);

    } else {
      //
      // [LINKED ABOVE] clump processing | Legacy: [ UNLINKED ]
      //
      // Reality check: Can colCount ever be 0 if rowCount isn't?
      // Answer: No, because the matrix is initialized with at least one row.
      if (rowCount === 0 || colCount === 0) {
        // Case: First clump, so add to first row in first column
        // Technical note: The first clump is set to -1 for both linkedToLeft and linkedToAbove,
        //   but we're in an 'else' block, which allows the nuance
        //   that this is not a 'linked above' cell to be ignored.
        // clumpMatrix.push([id]);
        const newMatrix = this.clumpMatrix.toSpliced(0, 0, [id]);
        this.clumpMatrix = [...newMatrix];
        //
      } else {
        //
        // In this block we can assume there is at least one cell in the matrix,
        //   and that we are linking to an existing clump (above).
        //
        /*
        if (newClumpColumn === 1) {
        } else if (newClumpColumn === colCount) {
        */
        if (newClumpColumn === colCount) {
          // X-- Is the new clump's column the last column?
          //     ~ Find the parent cell (linkedToAbove) in the new clump's column and record that row.
          //     ~ Insert a 0-padded row at the recorded row.
          //     ~ Place the clump's ID in the last column.
          let lastRow = -1;
          for (let r = rowCount; r > 0; r--) {
            // this.clumpMatrix[r - 1][colCount - 1] !== 0
            if (this.clumpMatrix[r - 1][colCount - 1] === linkedToAbove) {
              lastRow = r;
              break;
            }
          }
          if (lastRow === -1) {
            console.error("***** ***** ***** Parent clump not found in last column. ***** ***** *****");
            // alert("Parent clump not found in last column.");
            return;
          }
          this.insertPaddedRowToMatrix(lastRow);
          // clumpMatrix[lastRow][colCount - 1] = id;
          this.clumpMatrix = this.updateClumpMatrix(lastRow, colCount - 1, id);

        } else {
          // --- Is the new clump's column not the last?
          //     ~ Find the lowest cell in the 'right tail' from the new clump's linkedToAbove
          //         (all cells to the right that are in the tail should not be affected).
          //     ~ Record that 'to-the-right' bottommost row.
          //     ~ Record the row of the new clump's linkedToAbove cell.
          //     Is there a 'right tail', and if so, is it lower than the new clump's linkedToAbove row?
          // ---- Yes:
          //      ~ Add +1 to the bottommost 'to-the-right' recording and record it as the 'rowToAddTo'.
          // ---- No:
          //      ~ Add +1 to the new clump's linkedToAbove row and record it as the 'rowToAddTo'.
          // ---- Either:
          //      ~ Insert a 0-padded row at 'rowToAddTo'.
          //      ~ Insert the new clump's ID in the new clump's column.
          //
          let rightmostRow = -1;
          let newClumpAboveRow = -1;

          // Record the row of the newClump's linkedToAbove cell.
          for (let r = rowCount; r > 0; r--) {
            if (this.clumpMatrix[r - 1][newClumpColumn - 1] === linkedToAbove) {
              newClumpAboveRow = r;
              break;
            }
          }

          // Record the lowest clump in the 'right tail' of the new clump's 'linkedToAbove' cell.
          const aboveCellToRightId = this.cellIdToRight(linkedToAbove);
          const aboveCellToRightClump = aboveCellToRightId === -1
              ? undefined
              : this.getData('clumpList').find(clump => clump.id === aboveCellToRightId);
          const subtreeRightTail = aboveCellToRightId === -1
              ? []
              : this.collectSubtreeIdsBelow(aboveCellToRightId);
          const subtreeFullRightTail = aboveCellToRightClump === undefined
              ? []
              : [aboveCellToRightClump.id, ...subtreeRightTail];

          if (aboveCellToRightId === -1) {
            // No right tail, so we can use the new clump's linkedToAbove row.
            rightmostRow = newClumpAboveRow;
          } else {
            // We have a right tail, so we need to find the lowest row in the right tail.
            rowColumnLoop:
            for (let r = rowCount; r > 0; r--) {
              for (let c = newClumpColumn; c < colCount; c++) {
                // We're using [c] instead of [c - 1] because
                // we're looking to the right of the new clump's column.
                if (subtreeFullRightTail.includes(this.clumpMatrix[r - 1][c])) {
                  rightmostRow = r;
                  break rowColumnLoop;
                }
              }
            }
          }

          if (newClumpAboveRow === -1) {
            console.error("No clumps found in new clump's column");
            return;
          }

          if (rightmostRow === -1) {
            console.error("No clumps found in rightmost column");
            return;
          }

          // Record the row to add the new clump to (note: the row == index + 1).
          const rowToAddTo = newClumpAboveRow > rightmostRow ? newClumpAboveRow : rightmostRow;
          this.insertPaddedRowToMatrix(rowToAddTo);
          // clumpMatrix[rowToAddTo][column - 1] = id;
          this.clumpMatrix = this.updateClumpMatrix(rowToAddTo, newClumpColumn - 1, id);
        }
      }
    }

    if (AppConfig.debugPrintClumpMatrix) {
      // For debugging to see the matrix layout.
      AppConfig.debugConsoleLogs && console.log('Clump Matrix:');
      console.table(this.clumpMatrix);
    }
  }
}
