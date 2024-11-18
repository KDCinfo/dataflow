// This is a temporary file to house the JavaScript while it's being refactored.

// Initialize the 'clumpMatrix' with the clumps from local storage.
addClumpsToMatrix();

// Add clumps to the matrix
function addClumpsToMatrix() {
  clumpList.forEach(clump => {
    lastAddedClumpId = clump.id;
    addClumpToMatrix(clump);
  });
}

function storeClumps() {
  const clumpListStorageKey = getStorageNameFromSettings();
  localStorage.setItem(clumpListStorageKey, JSON.stringify(clumpList));
}

function storeSettings() {
  localStorage.setItem(localStorageSettings, JSON.stringify(settings));
}

// HTML Slider with options that will update the grid repeat:
// > ['auto', '1fr', '150px', '200px', '250px', '300px']
//
function updateGridRepeat(event) {
  const newGridRepeat = event.target.value;
  const cellWidth = convertGridRepeatSettingValueToCellWidth(newGridRepeat);

  // Make changes to the UI.
  clumpContainer.style.gridTemplateColumns = `repeat(${getColumnCount()}, ${cellWidth})`;

  // Update the grid repeat slider label.
  gridRepeatHTMLSpan.textContent = `[${newGridRepeat}] ${cellWidth}`;

  // Store the new setting.
  settings.gridRepeatRangeValue = newGridRepeat;
  storeSettings();
}

function updateLinkToDropdownOptions() {
  linkTo.innerHTML = '<option value="">None</option>';

  // This loop extrapolates in-use linkTo IDs so they are not
  // shown in the dropdown (because they're already linked to).
  const linkedClumpIDs = clumpList.map(clump => clump.linkedClumpID);
  clumpList.forEach((clump, index) => {
    // If the clump is not the one being edited, or it is not already linked.
    if (editingIndex !== index || !linkedClumpIDs.includes(clump.id)) {
      const option = document.createElement('option');
      option.value = clump.id;
      option.textContent = clump.clumpName;
      linkTo.appendChild(option);
    }
  });
  linkTo.disabled = editingIndex !== null;
}

function updateColumnSelectDropdownOptions() {
  columnSelect.innerHTML = '<option value="last">Last Column</option>';

  // Using 'clumpMatrix', this will yield a list of available columns
  // (which the UI uses for the 'Column to Add To' dropdown).
  const columns = clumpMatrix.length > 0
    ? Array.from({ length: clumpMatrix[0].length }, (_, index) => index + 1)
    : [1];
  columns.forEach(column => {
    const option = document.createElement('option');
    option.value = column;
    option.textContent = `Column ${column}`;
    columnSelect.appendChild(option);
  });
  columnSelect.disabled = editingIndex !== null;
}

function updateStorageNameDropdownOptions() {
  storageNameTag.innerHTML = '';

  settings.storageNames.forEach((storageName, index) => {
    const option = document.createElement('option');
    option.value = index;
    option.textContent = storageName;
    if (index === settings.storageIndex) {
      option.selected = true;
    }
    storageNameTag.appendChild(option);
  });
}

// Function to bold 'New Storage' button text if the 'newStorageNameInput' value is valid.
function checkNewStorageButton() {
  const newStorageNameValue = newStorageNameInput.value.trim();
  const isValid = isValidKeyName(newStorageNameValue)
  // Make button text bold.
  newStorageNameButton.style.fontWeight = isValid ? 'bold' : 'normal';
  // Change button's cursor.
  newStorageNameButton.style.cursor = isValid ? 'pointer' : 'default';

  if (isValid) {
    hideStorageError();
  }
}

// - If the selected storage name is:
// - 'default':
//   - Disable 'Delete Selected'.
// - the currently active storage name:
//   - Disable both buttons.
function toggleStorageButtons() {
  const selectedIndex = storageNameTag.selectedIndex;
  const selectedStorageName = settings.storageNames[selectedIndex];

  const isDefault = selectedStorageName === 'default';
  const isActive = selectedIndex === settings.storageIndex;

  storageButtonDelete.disabled = isDefault || isActive;
  storageButtonUse.disabled = isActive;
}

function updateDataInHtml() {
  lastAddedClumpIdTag.textContent = lastAddedClumpId.toString();
  lastAddedColTag.textContent = lastAddedCol.toString();
  editingIndexTag.textContent = editingIndex === null
    ? '_'
    : editingIndex.toString();
  editingIdTag.textContent = editingIndex === null
    ? '_'
    : clumpList[editingIndex].id.toString();
}

// Clear the 'clump-node-selected' class from all clump nodes.
function clearSelectedClumpNode() {
  const clumpNodes = document.querySelectorAll('.clump-node');
  clumpNodes.forEach(node => node.classList.remove('clump-node-selected'));
}

function selectClumpNode(eventTarget) {
  clearSelectedClumpNode();
  // Add class to selected clump node.
  eventTarget.parentElement.parentElement.classList.add('clump-node-selected');
}

function loadForEdit(index, event) {
  event.stopPropagation();

  debugConsoleLogs && console.log('Editing clump:', clumpList[index]);

  editingIndex = index;
  updateLinkToDropdownOptions(); // Updates list and toggles disabled.
  updateColumnSelectDropdownOptions(); // Toggles disabled.
  updateDataInHtml();
  selectClumpNode(event.target);

  const clump = clumpList[index];
  clumpNameInput.value = clump.clumpName;
  clumpCodeInput.value = clump.clumpCode;

  // Update value and disable.
  linkTo.value = isNaN(clump.linkedClumpID) ? '' : clump.linkedClumpID;
  columnSelect.value = clump.column === -1 ? 'last' : clump.column;
}

// Helper function to get the largest row number from the clumps array.
function getRowCount() {
  return clumpMatrix.length;
}

// Helper function to get length of first row in clumpMatrix if clumpMatrix has a row.
function getColumnCount() {
  return clumpMatrix.length > 0 ? clumpMatrix[0].length : 1;
}

// Helper to extend rows with empty columns as needed.
function addPaddedColumnToMatrix() {
  // clumpMatrix.forEach(row => row.push(0));
  const newMatrix = clumpMatrix.map(row => [...row, 0]);
  clumpMatrix = [...newMatrix];
}

// Helper to add new row filled with zeros.
function addPaddedRowToMatrix() {
  // clumpMatrix.push(Array(getColumnCount()).fill(0));
  const newMatrix = clumpMatrix.toSpliced(getRowCount(), 0, Array(getColumnCount()).fill(0));
  clumpMatrix = [...newMatrix];
}

// Helper to insert a new row filled with zeros at a specific index.
function insertPaddedRowToMatrix(index) {
  // The splice will insert a new row at the specified index.
  // The 2nd parameter (0) specifies that no rows will be removed.
  const newMatrix = clumpMatrix.toSpliced(index, 0, Array(getColumnCount()).fill(0));
  clumpMatrix = [...newMatrix];
}

// Deleting individual cells is not easily possible due to linked clumps. For instance,
//   what happens when you delete a clump that has a clump linked to it from its right?
// And the shifting involved for cells below, left and right, will require some complexity.
// For now, we'll just provide the ability to remove the last clump added (an undo).
function deleteLastClump(event) {
  event.stopPropagation();

  if (confirm("Are you sure you want to delete this clump?")) {
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
    //  C1R4 |< C2R6 |  0
    //  0    |  C2R7 |< C3R6
    //  0    |  0    |  C3R7
    //  C1R5 |  0    |  0

    if (editingIndex === clumpList.length - 1) {
      editingIndex = null;
    }

    // Remove the clump from the clumps array.
    // clumps.splice(index, 1);
    clumpList.pop();

    // Clear matrix and re-add all clumps.
    clumpMatrix.length = 0;
    addClumpsToMatrix();

    // Update global variables.
    lastAddedClumpId = clumpList.length > 0 ? clumpList[clumpList.length - 1].id : 0;

    // Cycle through 'clumpMatrix' in reverse by rows, then columns,
    // looking for the Column that the new last clump ID is in.
    // This will be the new 'lastAddedCol'.
    findLastAddedColLoop:
    for (let c = getColumnCount() - 1; c >= 0; c--) {
      for (let r = getRowCount() - 1; r >= 0; r--) {
        if (clumpMatrix[r][c] === lastAddedClumpId) {
          lastAddedCol = c + 1;
          break findLastAddedColLoop;
        }
      }
    }

    storeClumps();
    updateDataInHtml();
    renderMatrix();

    const howManyExpanded = clumpContainer.querySelectorAll('.clump-node.expanded').length;
    outputContainer.style.marginBottom = howManyExpanded > 0 ? '260px' : '0';
    outputContainer.style.height = howManyExpanded > 0
      ? 'calc(100vh - 42px - 260px)'
      : 'calc(100vh - 42px)';
  }
}

clumpFormId.onsubmit = (event) => {
  event.preventDefault();

  // Clump cell placement has 3 options:
  //
  // [Linked]: 'Column to Add To' dropdown is irrelevant.
  // 1. Add to the same row as the linked clump, in the next column.
  //
  // [Unlinked]: 'Link to Clump' dropdown should be set to 'None'.
  // 2. When 'Last' is selected, add new clump to the last column that had a clump added to it.
  // 3. Add to a specific column.
  //
  const newLinkTo = parseInt(linkTo.value, 10) || -1;
  const isLinked = !isNaN(newLinkTo) && newLinkTo > 0;
  let columnToAddTo;

  const columnRawValue = columnSelect.options[columnSelect.selectedIndex].value;

  if (editingIndex === null) {
    //
    // ADDING A NEW CLUMP
    //
    const newClumpID = lastAddedClumpId + 1;

    const addNewClump = new ClumpInfo();
    addNewClump.id = newClumpID;
    addNewClump.clumpName = clumpNameInput.value;
    addNewClump.clumpCode = clumpCodeInput.value;

    // Populate either the 'linkedClumpId' (if linked), or the given 'Column' (if not linked).
    //
    if (isLinked) {
      // [Linked]
      columnToAddTo = lastAddedCol + 1;
      addNewClump.linkedClumpID = newLinkTo;
    } else {
      // [Unlinked]
      columnToAddTo = columnRawValue === 'last' ? lastAddedCol : parseInt(columnRawValue, 10);
      addNewClump.column = columnToAddTo;
    }

    // Add the new clump to the end of the 'clumps' 1D array.
    clumpList.push(addNewClump);

    // Inject the new clump to the 'clumpMatrix' 2D array.
    addClumpToMatrix(addNewClump);

    // Update global variables.
    lastAddedClumpId = newClumpID;
    //
  } else {
    //
    // EDITING AN EXISTING CLUMP
    //
    const editedClump = clumpList[editingIndex];

    editedClump.clumpName = clumpNameInput.value;
    editedClump.clumpCode = clumpCodeInput.value;

    editingIndex = null;
    updateDataInHtml();
    clearSelectedClumpNode();
  }

  storeClumps();
  renderMatrix();
  clumpFormId.reset();

  const howManyExpanded = clumpContainer.querySelectorAll('.clump-node.expanded').length;
  outputContainer.style.marginBottom = howManyExpanded > 0 ? '260px' : '0';
  outputContainer.style.height = howManyExpanded > 0
    ? 'calc(100vh - 42px - 260px)'
    : 'calc(100vh - 42px)';
};

// When canceling an edit, reset the 'editingIndex' to null, and remove the
// last 'Link to Clump' dropdown option if it is the same as the original 'linkedClumpID'.
clumpFormId.onreset = (event) => {
  event.preventDefault();

  // This will reset the form fields, regardless of any nesting.
  // clumpFormId.reset();
  // Manually clear each input, textarea, and select within the form
  document.querySelectorAll("#clumpFormId input, #clumpFormId textarea, #clumpFormId select").forEach((field) => {
    if (field.type === "checkbox" || field.type === "radio") {
      field.checked = field.defaultChecked;
    } else {
      field.value = field.defaultValue;
    }
  });

  editingIndex = null;

  saveClumpButton.disabled = clumpNameInput.value.trim() === '';

  updateLinkToDropdownOptions(); // Updates list and toggles disabled.
  updateColumnSelectDropdownOptions(); // Toggles disabled.
  updateDataInHtml();
  // This will clear the 'edit border' from the selected clump node.
  clearSelectedClumpNode();
};

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
function addClumpToMatrix(newClump) {
  const { id, linkedClumpID, column } = newClump;
  const rowCount = getRowCount();
  const colCount = getColumnCount();
  //
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
  //
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
        if (clumpMatrix[r][c] === linkedClumpID) {
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
      addPaddedColumnToMatrix();
    } else {
      // Case: linked clump is not the last column
    }

    // clumpMatrix[linkedRowIndex][linkedCol] = id;
    clumpMatrix = updateClumpMatrix(clumpMatrix, linkedRowIndex, linkedCol, id);
    lastAddedCol = linkedCol + 1;

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
        const newMatrix = clumpMatrix.toSpliced(0, 0, [id]);
        clumpMatrix = [...newMatrix];
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
        clumpMatrix = updateClumpMatrix(clumpMatrix, 0, 0, id);
        lastAddedCol = 1;
      }
    } else {
      //
      // In this block we can assume there is at least one cell in the matrix.
      //
      if (column === 1) {
        // X-- Is the new clump's column the first column (Col 1)?
        //     ~ Push a new 0-padded Row (same length as other rows) to the matrix.
        //     ~ Place the clump's ID in the first cell/column.
        addPaddedRowToMatrix();
        // clumpMatrix[rowCount][0] = id;
        clumpMatrix = updateClumpMatrix(clumpMatrix, rowCount, 0, id);
        lastAddedCol = 1;
      } else if (column === colCount) {
        // X-- Is the new clump's column the last column?
        //     ~ Find the last non-0 cell/row in the new clump's column and record that row.
        //     ~ Insert a 0-padded row at the recorded row.
        //     ~ Place the clump's ID in the last column.
        let lastRow = -1;
        for (let r = rowCount; r > 0; r--) {
          if (clumpMatrix[r - 1][colCount - 1] !== 0) {
            lastRow = r;
            break;
          }
        }
        if (lastRow === -1) {
          console.error("No clumps found in last column");
          return;
        }
        insertPaddedRowToMatrix(lastRow);
        // clumpMatrix[lastRow][colCount - 1] = id;
        clumpMatrix = updateClumpMatrix(clumpMatrix, lastRow, colCount - 1, id);
        lastAddedCol = colCount;
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
        let rightmostCol = -1;
        let rightmostRow = -1;
        let newClumpBottomRow = -1;

        for (let r = rowCount; r > 0; r--) {
          // Record the bottommost row of the new clump's column.
          if (clumpMatrix[r - 1][column - 1] !== 0) {
            newClumpBottomRow = r;
            break;
          }
        }

        rowColumnLoop:
        for (let r = rowCount; r > 0; r--) {
          // Record the lowest clump, that is lower than the new clump, in all the columns to the right.
          for (let c = column; c < colCount; c++) {
            // We're using [c] instead of [c - 1] because we're looking to the right of the new clump's column.
            if (clumpMatrix[r - 1][c] !== 0) {
              rightmostCol = c;
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
        insertPaddedRowToMatrix(rowToAddTo);
        // clumpMatrix[rowToAddTo][column - 1] = id;
        clumpMatrix = updateClumpMatrix(clumpMatrix, rowToAddTo, column - 1, id);
        lastAddedCol = column;
      }
    }
  }

  if (debugPrintClumpMatrix) {
    // For debugging to see the matrix layout.
    console.log('Clump Matrix:');
    console.table(clumpMatrix);
  }
}

// Function to immutably update clumpMatrix.
function updateClumpMatrix(clumpMatrix, linkedRowIndex, linkedCol, id) {
  return clumpMatrix.map((row, rowIndex) =>
    rowIndex === linkedRowIndex
      ? [...row.slice(0, linkedCol), id, ...row.slice(linkedCol + 1)]
      : row
  );
}

function convertGridRepeatSettingValueToCellWidth(curGridRepeat = settings.gridRepeatRangeValue) {
  debugConsoleLogs && console.log('curGridRepeat:', curGridRepeat);

  // const gridRepeatOptions = ['auto', '1fr', '150px', '200px', '250px', '300px'];
  const curGridRepeatRangeValue = gridRepeatOptions[parseInt(curGridRepeat, 10) - 1];
  // const curGridRepeatRangeValue = curGridRepeat === "1"
  //   ? gridRepeatOptions[0] : curGridRepeat === "2"
  //     ? gridRepeatOptions[1] : `${50 * curGridRepeat}px`; // This was cool.
  debugConsoleLogs && console.log('curGridRepeatRangeValue:', curGridRepeatRangeValue);

  return curGridRepeatRangeValue;
}

// Regular expression (regex) to validate storage names.
// Also checks if the name is already in the list.
function isValidKeyName(keyName) {
  // Validate the new storage name, and check new name isn't already in the list.
  if (keyName === '') {
    storageNameErrorText = storageNameErrTextNameEmpty;
  } else if (!keyNamePattern.test(keyName)) {
    storageNameErrorText = storageNameErrTextInvalid;
  } else if (checkIfStorageNameExists(keyName)) {
    storageNameErrorText = storageNameErrTextNameExists;
  } else {
    storageNameErrorText = '';
  }
  // return keyName !== '' && keyNamePattern.test(keyName) && !checkIfStorageNameExists(keyName);
  return storageNameErrorText === '';
}

function checkIfStorageNameExists(keyName) {
  // return storageNames.includes(keyName);
  // 'includes' is case-sensitive, so we need to lowercase all the names.
  return settings.storageNames.map(name => name.toLowerCase()).includes(keyName.toLowerCase());
}

function hideStorageError() {
  if (storageNamingError.classList.contains('error-visible')) {
    classListChain(storageNamingError)
      .remove('error-visible')
      .add('error-hidden');
  }
  setTimeout(() => {
    storageNamingError.innerHTML = '';
  }, 250);
}

function showStorageError(errText) {
  if (
    storageNamingError.classList.contains('hidden') ||
    storageNamingError.classList.contains('error-hidden')
  ) {
    classListChain(storageNamingError)
      .remove('hidden')
      .remove('error-hidden')
      .add('error-visible');
  }
  storageNamingError.innerHTML = errText;
}

// const newStorageNameInput = document.getElementById("newStorageNameInput");
function createNewStorage() {
  // Temporarily disable the new storage button to prevent double-clicks.
  newStorageNameButton.disabled = true;

  debugConsoleLogs && console.log('Create new storage:', newStorageNameInput.value);

  if (isValidKeyName(newStorageNameInput.value)) {
    hideStorageError();
    setTimeout(() => {
      // Reset input field.
      newStorageNameInput.value = '';
      // Reset error message.
      storageNamingError.innerHTML = '';
      // Remove temporary disablement of the new storage button.
      newStorageNameButton.disabled = false;
      // Reset CSS styling on the 'New Storage' button.
      checkNewStorageButton();
    }, 250);
    // From initialization above:
    //   const storageNames = settings.storageNames;
    // JavaScript is a pass-by-reference language for
    // non-primitives, so we can modify the original array.
    settings.storageNames.push(newStorageNameInput.value);
    storeSettings();
    renderMatrix();
  } else {
    showStorageError(storageNameErrorText);
    // Remove temporary disablement of the new storage button.
    newStorageNameButton.disabled = false;
    // Reset CSS styling on the 'New Storage' button.
    checkNewStorageButton();
  }

}

function deleteSelectedStorage() {
  debugConsoleLogs && console.log('Delete selected storage:', storageNameTag.value);

  if (storageNamingError.classList.contains('error-visible')) {
    hideStorageError();
  }

  if (
    settings.storageNames.length > 1 &&
    storageNameTag.value !== '0' &&
    storageNameTag.value !== settings.storageIndex
  ) {
    if (confirm(`\nAre you sure you want to delete this storage?
          \nAny data within this storage will be lost.
          \nClick 'Cancel' and switch to this storage to export your data.\n`)) {

      hideStorageError();

      const selectedStorageIndex = parseInt(storageNameTag.value, 10);
      const selectedStorageName = settings.storageNames[selectedStorageIndex];

      const newList = settings.storageNames.toSpliced(selectedStorageIndex, 1);
      settings.storageNames = [...newList];
      storeSettings();

      // Remove from local storage.
      localStorage.removeItem(selectedStorageName);

      renderMatrix();
    }
  } else {
    // This should never be hit because the button should be disabled when not allowed.
    showStorageError(storageNameErrDelText);
  }
}

// const storageName = document.getElementById("storageName");
function useSelectedStorage() {
  debugConsoleLogs && console.log('Use selected storage:', storageNameTag.value);

  if (storageNamingError.classList.contains('error-visible')) {
    hideStorageError();
  }

  if (storageNameTag.value !== settings.storageIndex) {
    // Update Settings.
    settings.storageIndex = parseInt(storageNameTag.value, 10);
    storeSettings();

    // Update data.
    editingIndex = null;
    lastAddedCol = lastAddedColDefault;
    lastAddedClumpId = lastAddedClumpIdDefault;
    setClumpListFromStorageUsingSettings();

    // Clear matrix and re-add all clumps.
    clumpMatrix.length = 0;
    addClumpsToMatrix();

    // Update UI.
    clumpFormId.reset();
    outputContainer.style.marginBottom = '0';
    outputContainer.style.height = 'calc(100vh - 42px)';
    storageNameLabelCurrent.textContent = settings.storageNames[settings.storageIndex];
    updateDataInHtml();
    renderMatrix();
  }
}

function renderMatrix() {
  // Set CSS property dynamically to control number of columns.
  const columnCount = getColumnCount();

  // Clear container before rendering
  if (clumpList.length === 0) {
    let clumpContainerContent = '<div class="empty-notes">';
    clumpContainerContent += '<h2>Data Clump Flow App</h2>';
    clumpContainerContent += '<p>Tips:</p>';
    clumpContainerContent += '<ul>';
    clumpContainerContent += '  <li>Cell clumps flow from top down by default, and left to right when linked.</li>';
    clumpContainerContent += `  <li>To export, switch to the desired storage name (using the 'Use Selected' button), then click the 'Export Data' button.</li>`;
    clumpContainerContent += '</ul>';

    clumpContainerContent += '<ul>';
    clumpContainerContent += '  <li>Clicking cells will show clump contents in a window at the bottom of the screen.</li>';
    clumpContainerContent += '  <li>Multiple cell contents can be expanded, each will be layered on top of the previous.</li>';
    clumpContainerContent += '  <li>Closing the last, or topmost content window will reveal the content window below it.</li>';
    clumpContainerContent += '  <li>Any expanded cell content window can be collapsed, even those beneath the last opened.</li>';
    clumpContainerContent += '</ul>';

    clumpContainerContent += '<ul>';
    clumpContainerContent += `  <li>When a clump is shown, although a single click on either the cell or content window will close the content window, highlighting text within the content window will not close it (so long as text is highlighted).
        </li>`;
    clumpContainerContent += '</ul>';

    clumpContainerContent += `<p>
          <code>@TODO:</code> <small>(referenced in
          <a href='https://github.com/KDCinfo/dataflow/tree/main/data_mapping_flow_analysis_tool' target='_blank'>Readme</a>
          )</small>:</p>`;
    clumpContainerContent += '<ol>';
    clumpContainerContent += '  <li>Only the last clump can be deleted, then the next, and the next.</li>';
    clumpContainerContent += "  <li>When editing clumps, only 'clump names' and 'data clumps' can be updated.";
    clumpContainerContent += "    <ol>";
    clumpContainerContent += '      <li>Clump links cannot be changed.</li>';
    clumpContainerContent += '      <li>Clumps cannot be moved.</li>';
    clumpContainerContent += '    </ol>';
    clumpContainerContent += '  </li>';
    clumpContainerContent += `  <li>Bug: Sometimes 'Import Data' will fail silently*.`;
    clumpContainerContent += "    <ol>";
    clumpContainerContent += '      <li>*An error is shown in the dev tools console.</li>';
    clumpContainerContent += '      <li>Workaround: Try it again. Subequent attempts usually work.</li>';
    clumpContainerContent += '    </ol>';
    clumpContainerContent += '  </li>';
    clumpContainerContent += '</ol>';
    clumpContainerContent += '</div>';
    clumpContainer.innerHTML = clumpContainerContent;
    clumpContainer.style.color = '#ffffff';
  } else {
    clumpContainer.innerHTML = '';
    // Set color to same as '.output-container'.
    clumpContainer.style.color = '#000000';
  }

  // [ GRID REPEAT SLIDER ]

  // [1] Add ticks to the slider.
  // const gridRepeatSliderMarkers = document.getElementById('gridRepeatSliderMarkers');
  gridRepeatSliderMarkers.innerHTML = '';
  gridRepeatOptions.forEach((option, index) => {
    const marker = document.createElement('option');
    marker.value = index + 1;
    marker.label = option;
    gridRepeatSliderMarkers.appendChild(marker);
  });

  // [2] Use value from: settings.gridRepeatRangeValue
  const cellWidth = convertGridRepeatSettingValueToCellWidth();
  clumpContainer.style.gridTemplateColumns = `repeat(${columnCount}, ${cellWidth})`;

  // [3] Update the grid repeat slider.
  gridRepeatRangeInput.value = settings.gridRepeatRangeValue;

  // [4] Update the grid repeat slider label.
  gridRepeatHTMLSpan.textContent = `[${settings.gridRepeatRangeValue}] ${cellWidth}`;

  // [5] Update the 'storageName' dropdown from settings.storage
  updateStorageNameDropdownOptions();
  storageNameLabelCurrent.textContent = settings.storageNames[settings.storageIndex];

  // [6] Enable/disable storage buttons.
  toggleStorageButtons();

  // [ CLUMP NODE PLACEMENT ]
  //
  // Note: only the last-added clump should have a 'delete' icon.
  //
  // const cell = document.createElement('div');
  // cell.className = 'clump-node';
  // cell.style.gridColumnStart = col + 1;
  // cell.style.gridRowStart = row + 1;
  // cell.innerHTML = `<strong>${clump.name}</strong><br>${clump.code}
  //               <span class="edit-icon" onclick="loadForEdit(${clumps.indexOf(clump)}, event)">✏️</span>
  //               <span class="delete-icon" onclick="deleteClump(${clumps.indexOf(clump)}, event)">❌</span>`;
  // clumpContainer.appendChild(cell);
  //
  // lastAddedClumpId = clump.id;
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
  // Cycle through 'clumpMatrix' placing a clump cell or empty cell in HTML.
  // - All the cells are on the right side of the screen.
  // - The right side should be scrollable either vertically or horizontally when needed.
  // - All cell heights and widths should be fixed.
  // - All rows have the same number of cells, and all columns the same number of cells.
  // - When a cell title is tapped, its contents expand into a small scrollable window.

  // const newClump = {
  //     id: newClumpID,
  //     clumpName: clumpNameInput.value,
  //     clumpCode: clumpCodeInput.value,
  //     column: -1,
  //     linkedClumpID: -1,
  //   };

  let clumpListIndex = -1;

  // Cycle through the clumpMatrix to render the clumps.
  //
  for (let r = 0; r < clumpMatrix.length; r++) {
    for (let c = 0; c < clumpMatrix[r].length; c++) {
      const curClumpId = clumpMatrix[r][c];

      if (curClumpId === 0) {
        const emptyCell = document.createElement('div');
        emptyCell.className = 'clump-node empty';
        clumpContainer.appendChild(emptyCell);
        continue;
      }

      const clumpFound = clumpList.find(clump => clump.id === curClumpId);
      const clumpCell = document.createElement('div');
      clumpListIndex = clumpList.indexOf(clumpFound);

      clumpCell.className = `clump-node collapsed clump-list-index-${clumpListIndex}`;

      // Create content span for clump name and code
      const contentSpan = document.createElement('div');
      contentSpan.className = 'content-span';
      contentSpan.innerHTML = `<strong>${clumpFound.clumpName}</strong>
            <br>${clumpFound.clumpCode.split('\n')[0]}`;
      clumpCell.appendChild(contentSpan);

      // Apply linked/unlinked class based on the condition
      clumpCell.classList.add(clumpFound.linkedClumpID !== -1 ? 'linked' : 'unlinked');

      const iconSpan = document.createElement('div');
      iconSpan.className = 'icon-span';

      // Create and append the edit icon
      const editIcon = document.createElement('div');
      editIcon.className = 'edit-icon';
      editIcon.textContent = '✏️';
      editIcon.onclick = (event) => {
        event.stopPropagation(); // Prevent toggle when clicking edit
        loadForEdit(clumpList.indexOf(clumpFound), event);
      };
      iconSpan.appendChild(editIcon);

      // Conditionally create and append the delete icon
      if (clumpList[clumpList.length - 1].id === clumpFound.id) {
        const deleteIcon = document.createElement('div');
        deleteIcon.className = 'delete-icon';
        deleteIcon.textContent = '❌';
        deleteIcon.onclick = (event) => {
          event.stopPropagation(); // Prevent toggle when clicking delete
          deleteLastClump(event);
        };
        iconSpan.appendChild(deleteIcon);
      }
      clumpCell.appendChild(iconSpan);

      // Toggle function to handle cell expansion/collapse
      const toggleCell = () => {
        clumpCell.classList.toggle('expanded');
        clumpCell.classList.toggle('collapsed');

        const isCellCollapsed = clumpCell.classList.contains('collapsed');
        const howManyExpanded = clumpContainer.querySelectorAll('.clump-node.expanded').length;

        outputContainer.style.marginBottom = howManyExpanded > 0 ? '260px' : '0';
        outputContainer.style.height = howManyExpanded > 0
          ? 'calc(100vh - 42px - 260px)'
          : 'calc(100vh - 42px)';

        contentSpan.innerHTML = `<strong>${clumpFound.clumpName}</strong>
              <br>${isCellCollapsed
            ? clumpFound.clumpCode.split('\n')[0]
            : '<pre>' + unescapeHTML(clumpFound.clumpCode) + '</pre>'
          }`;

        if (!isCellCollapsed) {
          contentSpan.querySelector('pre').style.zIndex = howManyExpanded + 10;
        }
      };

      // Add toggle click listener to contentSpan but without any inner <pre> tags.
      contentSpan.addEventListener('click', (event) => {
        // event.stopPropagation(); // Prevent bubbling to avoid unintended behavior.
        if (window.getSelection().toString()) {
          // Prevent toggle if there's a selection.
          event.stopPropagation();
          return;
        }
        toggleCell();
      });

      // Append cell to the container
      clumpContainer.appendChild(clumpCell);
    }
  }

  updateLinkToDropdownOptions(); // Updates list and toggles disabled.
  updateColumnSelectDropdownOptions(); // Toggles disabled.
  updateDataInHtml();

  // Re-highlight edited cell, if any.
  if (editingIndex !== null) {
    const indexCell = document.querySelector(`.clump-list-index-${editingIndex}`);
    indexCell && indexCell.classList.add('clump-node-selected');
  }
}

function unescapeHTML(code) {
  return code.replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function handleExportData() {
  const dataStr = JSON.stringify(clumpList, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'dataclumps.json';
  link.click();
  URL.revokeObjectURL(url);
}

function handleImportData() {
  if (confirm(`\nWarning:\n
        Importing data will overwrite the current data.\n
        Are you sure you want to continue?\n`)) {
    //
    // document.getElementById('importFile').click();

    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.onchange = e => {
      const file = e.target.files[0];
      if (!file) return;
      handleImportFile(file);
    }
    fileInput.click();
  }

  function handleImportFile(file) {

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedClumps = JSON.parse(e.target.result);
        if (Array.isArray(importedClumps)) {
          clumpList.length = 0;
          // clumpList.push(...importedClumps);
          clumpList = [...importedClumps];
          storeClumps();

          // Update data.
          editingIndex = null;
          lastAddedCol = lastAddedColDefault;
          lastAddedClumpId = lastAddedClumpIdDefault;

          // Clear matrix and re-add all clumps.
          clumpMatrix.length = 0;
          addClumpsToMatrix();

          // Update UI.
          clumpFormId.reset();
          outputContainer.style.marginBottom = '0';
          outputContainer.style.height = 'calc(100vh - 42px)';
          updateDataInHtml();
          renderMatrix();

          //
        } else {
          alert('Invalid data format');
        }
      } catch {
        alert('Failed to import data');
      }
    };
    reader.readAsText(file);
  }
}

function togglePanel(event) {
  event.stopPropagation();

  debugConsoleLogs && console.log('togglePanel');
  debugConsoleLogs && console.log(event.target.parentElement.parentElement);

  const panelToExpand = document.querySelector('.info-panel.export-import');
  const panelHotspot = document.querySelector('.panel-from-hotspot');

  if (panelToExpand.classList.contains('panel-from-expanded-to-collapsed')) {
    classListChain(panelToExpand)
      .remove('panel-from-expanded-to-collapsed')
      .add('panel-from-collapsed-to-expanded');
  } else {
    classListChain(panelToExpand)
      .remove('panel-from-collapsed-to-expanded')
      .add('panel-from-expanded-to-collapsed');
  }

  // ? panelHotspot.children[0].textContent = '▶' // right arrow
  panelToExpand.classList.contains('panel-from-expanded-to-collapsed')
    ? panelHotspot.children[0].textContent = '◀'
    : panelHotspot.children[0].textContent = '▼';
}

// Many thanks to: https://stackoverflow.com/a/29143197/638153 | user663031
function classListChain(htmlElement) {
  var elementClassList = htmlElement.classList;
  return {
    toggle: function (c) { elementClassList.toggle(c); return this; },
    add: function (c) { elementClassList.add(c); return this; },
    remove: function (c) { elementClassList.remove(c); return this; }
  };
}

//
// EVENT LISTENERS
//

// Add listeners to enable 'Save Clump' button when 'clump name' and 'code clump' are not empty.
clumpNameInput.addEventListener('input', () => {
  if (clumpNameInput.value.trim() !== '') {
    saveClumpButton.disabled = false;
  } else {
    saveClumpButton.disabled = true;
  }
});

clumpCodeInput.addEventListener('input', () => {
  if (clumpNameInput.value.trim() !== '') {
    saveClumpButton.disabled = false;
  } else {
    saveClumpButton.disabled = true;
  }
});

linkTo.addEventListener('change', () => {
  if (clumpNameInput.value.trim() !== '') {
    columnSelect.disabled = false;
  } else {
    columnSelect.disabled = true;
  }
});

columnSelect.addEventListener('change', () => {
  if (clumpNameInput.value.trim() !== '') {
    saveClumpButton.disabled = false;
  } else {
    saveClumpButton.disabled = true;
  }
});

// Listener on 'newStorageNameInput' field to check if the 'New Storage' button should be bold.
newStorageNameInput.addEventListener('input', checkNewStorageButton);
storageNameTag.addEventListener('change', toggleStorageButtons);

exportDataButton.addEventListener('click', handleExportData);
importDataButton.addEventListener('click', handleImportData);

// Initial render call
renderMatrix();
