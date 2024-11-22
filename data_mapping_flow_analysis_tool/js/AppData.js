import AppConfig from './AppConfig.js';
import AppHelpers from './AppHelper.js';
import DataDefaultMaps from './DataDefaultMaps.js';

export default class AppData {
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
  localStorageKeyForClumps; // = storageNames[settings.storageIndex] || 'dataClumpFlowAppClumps';

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
  #appSettingsInfo;

  constructor(settings = DataDefaultMaps.dataDefaultMap().defaultAppSettings) {
    this.#appSettingsInfo = settings;

    this.storageNameErrorText = '';

    this.editingIndex = DataDefaultMaps.dataDefaultMap().editingIndex; // null;
    this.lastAddedCol = DataDefaultMaps.dataDefaultMap().lastAddedCol; // 1;
    this.lastAddedClumpId = DataDefaultMaps.dataDefaultMap().lastAddedClumpId; // 0;

    // The 'active storage key' is passed in from settings retrieved from local storage in 'AppSettings'.
    this.localStorageKeyForClumps = this.getStorageNameFromSettings();

    // The clumpList is parsed from local storage using the 'active storage key' that was just set.
    this.clumpList = [];
    this.setClumpList(this.parseClumpListFromStorage());

    this.clumpMatrix = [...DataDefaultMaps.dataDefaultMap().clumpMatrix]; // [];

    // Initialize the 'clumpMatrix' with the clumps from local storage.
    this.addClumpsToMatrix();
  }

  // Setter for appSettings called from parent ('AppSettings').
  set updateAppSettingsInfo(newSettings) {
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

  getStorageNameFromSettings() {
    return this.#appSettingsInfo.storageNames[this.#appSettingsInfo.storageIndex] || 'dataClumpFlowAppFallbackKey';
  }

  setClumpList(newClumpList = this.getStorageNameFromSettings()) {
    this.clumpList.length = 0;
    this.clumpList = [...newClumpList];
  }

  parseClumpListFromStorage() {
    return JSON.parse(localStorage.getItem(this.localStorageKeyForClumps) || '[]');
  }

  storeClumps() {
    const clumpListStorageKey = this.getStorageNameFromSettings();
    const clumpListForStorage = JSON.stringify(this.clumpList);
    localStorage.setItem(
      clumpListStorageKey,
      clumpListForStorage
    );
  }

  // Add clumps to the matrix.
  addClumpsToMatrix() {
    this.clumpMatrix.length = 0;
    this.clumpList.forEach(clump => {
      this.lastAddedClumpId = clump.id;
      this.addClumpToMatrix(clump);
    });
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
    updatedLastAddedClumpId
  ) {
    // Update and store clumps.
    this.setClumpList(importedClumps);
    this.storeClumps();

    // Update data.
    this.editingIndex = updatedEditingIndex;
    this.lastAddedCol = updatedLastAddedCol;
    this.lastAddedClumpId = updatedLastAddedClumpId;

    // Clear matrix and re-add all clumps.
    this.addClumpsToMatrix();
  }

  // async fetchData(url) {
  //   const response = await fetch(url);
  //   this.data = await response.json();
  // }

  // 'linkTo' = Existing clump ID to link to:
  //            Its Col and Row can be found via the clumpMatrix.
  // const linkTo = document.getElementById('linkTo');
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
    const { id, linkedClumpID, column } = newClump;
    const rowCount = getRowCount();
    const colCount = getColumnCount();

    // Check if LINKED: 'linkedClumpID' >= 1
    //
    // - LINKED (>= 1):
    //
    //   Check if the 'linkTo' clump's column is the last column.
    //
    // -- Yes:
    //    ~ Push a new column (0) to the end of every row.
    //    ~ Place new clump ID at end of 'linkTo' clump's row (look up in clumpMatrix).
    //
    // -- No:
    //    Because all unlinked clumps (prior to becoming linked) should have empty cells
    //      to their immediate right, and it's not the last column:
    //    ~ Replace 0 in cell to right of the 'linkTo' clump's column (look up in clumpMatrix).
    //
    // - UNLINKED (=== -1):
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

    if (linkedClumpID >= 1) {
      //
      // [ LINKED ] clump processing
      //
      let linkedCol = -1;
      let linkedRowIndex = -1;

      // Find the linked clump's position.
      linkClumpLoop:
      for (let r = 0; r < rowCount; r++) {
        for (let c = 0; c < colCount; c++) {
          if (this.clumpMatrix[r][c] === linkedClumpID) {
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

      // Check if the 'linkTo' clump's column is the last column.
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
      this.lastAddedCol = linkedCol + 1;

    } else {
      //
      // [ UNLINKED ] clump processing
      //
      // Reality check: Can colCount ever be 0 if rowCount isn't?
      // Answer: No, because the matrix is initialized with at least one row.
      if (rowCount === 0 || colCount === 0) {
        // Case: First clump, so add to first row in first column
        if (rowCount === 0) {
          // clumpMatrix.push([id]);
          const newMatrix = this.clumpMatrix.toSpliced(0, 0, [id]);
          this.clumpMatrix = [...newMatrix];
          // clumpMatrix = updateClumpMatrix(clumpMatrix, 0, 0, id);
        } else {
          // Reality check: is this else a valid condition?
          // Answer: Yes, because rowCount is not 0, so there is at least one row.
          // But even if colCount can never be 0 if rowCount isn't 0, and the 'if' already matched the rowCount logic?
          // Answer: Yes, because the 'if' is checking if the rowCount is 0, and the 'else' is checking if the colCount is 0.
          // But the outer 'if' is checking if rowCount is 0, so the 'else' will never be reached if rowCount is 0, correct?
          // Answer: Yes, but the 'else' is also checking if colCount is 0, which is a separate condition from rowCount.
          // But as confirmed, colCount can never be 0 if rowCount isn't 0, so the 'else' will never be reached if rowCount is 0, correct?
          // Answer: Yes, but the 'else' is also checking if colCount is 0, which is a separate condition from rowCount.
          // It is a separate condition, but it's a condition that can never be met because rowCount is not 0, ergo, colCount can never be 0, correct?
          // Answer: Yes, but the 'else' is also checking if colCount is 0, which is a separate condition from rowCount.
          // Please state the definition of insanity.
          // Answer: Doing the same thing over and over again and expecting different results.
          // So again, if colCount can never be 0 if rowCount isn't 0, and rowCount is not 0, then the 'else' will never be reached, correct?
          // Answer: Yes, but the 'else' is also checking if colCount is 0, which is a separate condition from rowCount.
          // Lol
          // Answer: Yes, but the 'else' is also checking if colCount is 0, which is a separate condition from rowCount.
          // Okay, you win
          // Answer: Yes, but the 'else' is also checking if colCount is 0, which is a separate condition from rowCount.

          // clumpMatrix[0][0] = id;
          this.clumpMatrix = this.updateClumpMatrix(0, 0, id);
          this.lastAddedCol = 1;
        }
      } else {
        //
        // In this block we can assume there is at least one cell in the matrix.
        //
        if (column === 1) {
          // X-- Is the new clump's column the first column (Col 1)?
          //     ~ Push a new 0-padded Row (same length as other rows) to the matrix.
          //     ~ Place the clump's ID in the first cell/column.
          this.addPaddedRowToMatrix();
          // clumpMatrix[rowCount][0] = id;
          this.clumpMatrix = this.updateClumpMatrix(rowCount, 0, id);
          this.lastAddedCol = 1;
        } else if (column === colCount) {
          // X-- Is the new clump's column the last column?
          //     ~ Find the last non-0 cell/row in the new clump's column and record that row.
          //     ~ Insert a 0-padded row at the recorded row.
          //     ~ Place the clump's ID in the last column.
          let lastRow = -1;
          for (let r = rowCount; r > 0; r--) {
            if (this.clumpMatrix[r - 1][colCount - 1] !== 0) {
              lastRow = r;
              break;
            }
          }
          if (lastRow === -1) {
            console.error("No clumps found in last column");
            return;
          }
          this.insertPaddedRowToMatrix(lastRow);
          // clumpMatrix[lastRow][colCount - 1] = id;
          this.clumpMatrix = this.updateClumpMatrix(lastRow, colCount - 1, id);
          this.lastAddedCol = colCount;
        } else {
          // --- Is the new clump's column neither the first nor last (in the middle)?
          //     ~ Find the lowest column to the right of the new clump's column (all cells to the right should not be affected).
          //     ~ Record that 'to-the-right' bottommost row.
          //     ~ Record the new clump's column's bottommost "occupied" (non-0) row.
          //     Is the new clump's bottommost recording greater than the bottommost 'to-the-right' recording?
          // ---- Yes:
          //      ~ Add +1 to the new clump's bottommost recording and record it as the 'rowToAddTo'.
          // ---- No:
          //      ~ Add +1 to the bottommost 'to-the-right' recording and record it as the 'rowToAddTo'.
          // ---- Either/both:
          //      ~ Insert a 0-padded row at 'rowToAddTo'.
          //      ~ Insert the new clump's ID in the new clump's column.
          //
          // let rightmostCol = -1;
          let rightmostRow = -1;
          let newClumpBottomRow = -1;

          for (let r = rowCount; r > 0; r--) {
            // Record the bottommost row of the new clump's column.
            if (this.clumpMatrix[r - 1][column - 1] !== 0) {
              newClumpBottomRow = r;
              break;
            }
          }

          rowColumnLoop:
          for (let r = rowCount; r > 0; r--) {
            // Record the lowest clump, that is lower than the new clump, in all the columns to the right.
            for (let c = column; c < colCount; c++) {
              // We're using [c] instead of [c - 1] because we're looking to the right of the new clump's column.
              if (this.clumpMatrix[r - 1][c] !== 0) {
                // rightmostCol = c;
                rightmostRow = r;
                break rowColumnLoop;
              }
            }
          }

          if (newClumpBottomRow === -1) {
            console.error("No clumps found in new clump's column");
            return;
          }

          if (rightmostRow === -1) {
            console.error("No clumps found in rightmost column");
            return;
          }

          // Record the row to add the new clump to (note: the row == index + 1).
          const rowToAddTo = newClumpBottomRow > rightmostRow ? newClumpBottomRow : rightmostRow;
          this.insertPaddedRowToMatrix(rowToAddTo);
          // clumpMatrix[rowToAddTo][column - 1] = id;
          this.clumpMatrix = this.updateClumpMatrix(rowToAddTo, column - 1, id);
          this.lastAddedCol = column;
        }
      }
    }

    if (AppConfig.debugPrintClumpMatrix) {
      // For debugging to see the matrix layout.
      console.log('Clump Matrix:');
      console.table(clumpMatrix);
    }
  }
}
